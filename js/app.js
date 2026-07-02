// ========================================
// 📚 BOOKMARK MANAGER - MAIN APP
// ========================================

import { StorageManager } from './core/storageManager.js';
import { BookmarkManager } from './core/bookmarkManager.js';
import { CategoryManager } from './core/categoryManager.js';
import { ImportManager } from './features/importManager.js';
import { ExportManager } from './features/exportManager.js';
import { ClassificationManager } from './features/classificationManager.js';
import { ThumbnailManager } from './features/thumbnailManager.js';
import { UIManager } from './ui/uiManager.js';
import { UIRenderer } from './ui/uiRenderer.js';
import { StackRenderer } from './ui/stackRenderer.js';
import { AlphabetNav } from './ui/alphabetNav.js';
import { PopupManager } from './ui/popupManager.js';
import { ExpandView } from './ui/expandView.js';
import { SearchHelpers } from './utils/searchHelpers.js';
import { AIClassifier } from './aiClassifier.js';

class BookmarkApp {
    constructor() {
        console.log('🚀 Initializing Bookmark App...');

        // ----- Core Managers -----
        this.storage = new StorageManager();
        this.bookmarkManager = new BookmarkManager();
        this.categoryManager = new CategoryManager();
        this.thumbnailManager = new ThumbnailManager();

        // ----- UI Components -----
        this.uiRenderer = new UIRenderer();
        this.stackRenderer = new StackRenderer(this.uiRenderer);
        this.alphabetNav = new AlphabetNav();
        this.popupManager = new PopupManager();
        this.expandView = new ExpandView(this.uiRenderer, this.bookmarkManager);

        // ----- Feature Managers -----
        this.aiClassifier = null;
        this.classificationManager = null;
        this.importManager = null;
        this.exportManager = null;

        // ----- State -----
        this.currentCategory = 'All';
        this.searchQuery = '';
        this.sortOption = 'date-desc';
        this.showArchived = false;
        this.isClassificationComplete = false;

        // ----- Initialize -----
        this.init();
    }

    // ========================================
    // INITIALIZATION
    // ========================================

    async init() {
        console.log('📦 Loading data...');

        // Load data
        this.loadData();

        // Initialize managers
        this.importManager = new ImportManager(this.bookmarkManager);
        this.exportManager = new ExportManager(this.bookmarkManager, this.categoryManager);

        // Get API key
        const apiKey = prompt('Please enter your DeepSeek API key (or cancel to skip):');
        if (apiKey && apiKey.trim()) {
            console.log('🔑 API key provided, initializing AI classifier...');
            this.aiClassifier = new AIClassifier(apiKey.trim());
            this.classificationManager = new ClassificationManager(
                this.aiClassifier,
                this.bookmarkManager,
                this.categoryManager
            );
            this.setupClassificationCallbacks();
            console.log(`🤖 Using DeepSeek model: ${this.aiClassifier.model}`);
        } else {
            console.log('⚠️ No API key provided, classification disabled');
            this.classificationManager = new ClassificationManager(
                null,
                this.bookmarkManager,
                this.categoryManager
            );
        }

        // Initialize UI
        console.log('🎨 Initializing UI...');
        this.uiManager = new UIManager();

        // Setup Alphabet Nav callbacks
        this.alphabetNav.setCallbacks(
            (letter) => {
                this.letterFilter = letter;
                this.searchQuery = '';
                const searchInput = this.uiManager.elements.searchInput;
                if (searchInput) searchInput.value = '';
                this.renderBookmarks();
            },
            () => {
                this.letterFilter = null;
                this.renderBookmarks();
            }
        );

        // Setup Expand View callbacks
        this.expandView.setOnClose(() => {
            // Re-render when expand view is closed
            this.renderAll();
        });

        this.expandView.setActions({
            onArchive: (id) => this.archiveBookmark(id),
            onDelete: (id) => this.deleteBookmark(id),
            onBulkArchive: (ids) => this.bulkArchive(ids),
            onBulkDelete: (ids) => this.bulkDelete(ids)
        });

		// Setup Stack Renderer expand callback
		this.stackRenderer.setOnExpand((bookmarks, domainName, isDomainStack) => {
			console.log('🔍 Expand called from stack:', { bookmarks: bookmarks.length, domainName, isDomainStack });
			// Make sure expandView is available
			if (this.expandView) {
				this.expandView.show(bookmarks, domainName, isDomainStack);
			} else {
				console.error('❌ expandView is not initialized');
			}
		});

        // Setup event listeners
        console.log('🔗 Setting up event listeners...');
        this.setupEventListeners();

        // Render everything
        console.log('🔄 Rendering...');
        this.renderAll();
        this.setupProgressSection();

        console.log('✅ Bookmark App initialized successfully!');

        // Log thumbnail cache stats
        const stats = this.thumbnailManager.getCacheStats();
        console.log(`📸 Thumbnail cache: ${stats.entries} entries, ${stats.size} KB`);
    }

    // ========================================
    // DATA LOADING
    // ========================================

    loadData() {
        // Check for URL param export
        const urlParams = new URLSearchParams(window.location.search);
        const exportFile = urlParams.get('load');
        if (exportFile) {
            const data = this.storage.loadExport(exportFile);
            if (data && data.bookmarks) {
                this.bookmarkManager.setBookmarks(data.bookmarks);
                this.categoryManager.setCategories(data.categories || ['All']);
                this.currentCategory = data.currentCategory || 'All';
                this.sortOption = data.sortOption || 'date-desc';
                this.showArchived = data.showArchived || false;
                this.isClassificationComplete = data.isClassificationComplete || false;
                window.history.replaceState({}, document.title, window.location.pathname);
                console.log(`📥 Loaded export: ${data.bookmarks.length} bookmarks`);
                return;
            }
        }

        // Load from local storage
        const saved = this.storage.load();
        if (saved) {
            this.bookmarkManager.setBookmarks(saved.bookmarks || []);
            this.categoryManager.setCategories(saved.categories || ['All']);
            this.currentCategory = saved.currentCategory || 'All';
            this.sortOption = saved.sortOption || 'date-desc';
            this.showArchived = saved.showArchived || false;
            this.isClassificationComplete = saved.isClassificationComplete || false;
            console.log(`💾 Loaded from storage: ${saved.bookmarks?.length || 0} bookmarks`);
        } else {
            console.log('📭 No saved data found');
        }
    }

    saveData() {
        const data = {
            bookmarks: this.bookmarkManager.getBookmarks(),
            categories: this.categoryManager.getCategories(),
            currentCategory: this.currentCategory,
            importHistory: this.importManager ? this.importManager.getImportHistory() : [],
            sortOption: this.sortOption,
            showArchived: this.showArchived,
            isClassificationComplete: this.isClassificationComplete
        };
        this.storage.save(data);
    }

    // ========================================
    // CLASSIFICATION CALLBACKS
    // ========================================

    setupClassificationCallbacks() {
        if (!this.classificationManager) return;

        this.classificationManager.onProgress((progress) => {
            if (this.uiManager) {
                this.uiManager.updateProgress(progress);
            }
        });

        this.classificationManager.onLog((entry) => {
            if (this.uiManager) {
                this.uiManager.addLogEntry(entry);
            }
        });

        this.classificationManager.onPartialResults((bookmarks) => {
            const categories = this.categoryManager.extractCategories(bookmarks);
            this.categoryManager.setCategories(categories);

            this.renderCategories();
            this.renderBookmarks();
            this.renderStats();

            const progress = {
                classified: this.classificationManager.classifiedCount,
                total: this.classificationManager.totalToClassify,
                isRunning: this.classificationManager.isRunning,
                isPaused: this.classificationManager.isPaused,
                isCancelled: this.classificationManager.isCancelled,
                apiCalls: this.classificationManager.apiCalls,
                startTime: this.classificationManager.startTime
            };
            this.uiManager.updateProgress(progress);
        });
    }

    // ========================================
    // EVENT LISTENERS
    // ========================================

    setupEventListeners() {
        const el = this.uiManager.elements;

        // Import button
        if (el.importBtn) {
            el.importBtn.addEventListener('click', () => this.showImportModal());
        }

        // File input
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileImport(e));
        }

        // Export button
        if (el.exportBtn) {
            el.exportBtn.addEventListener('click', () => this.showExportModal());
        }

        // Classify button
        if (el.classifyBtn) {
            el.classifyBtn.addEventListener('click', () => this.startClassification());
        }

        // Search
        if (el.searchBtn) {
            el.searchBtn.addEventListener('click', () => this.handleSearch());
        }
        if (el.searchInput) {
            el.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleSearch();
            });
        }

        // Sort
        if (el.sortSelect) {
            el.sortSelect.addEventListener('change', (e) => {
                this.sortOption = e.target.value;
                this.saveData();
                this.renderAll();
            });
        }

        // Add category
        if (el.addCategoryBtn) {
            el.addCategoryBtn.addEventListener('click', () => this.addNewCategory());
        }

        // Show archived
        if (el.showArchivedBtn) {
            el.showArchivedBtn.addEventListener('click', () => {
                this.showArchived = !this.showArchived;
                el.showArchivedBtn.textContent = this.showArchived ? '📁 Show Active' : '🗄️ Show Archived';
                this.saveData();
                this.renderAll();
            });
        }

        // Clear all
        if (el.clearAllBtn) {
            el.clearAllBtn.addEventListener('click', () => this.clearAllBookmarks());
        }

        // Progress toggle
        if (el.progressToggle) {
            el.progressToggle.addEventListener('click', () => this.uiManager.toggleProgress());
        }

        // Progress controls
        if (el.progressStartBtn) {
            el.progressStartBtn.addEventListener('click', () => this.startClassification());
        }
        if (el.progressPauseBtn) {
            el.progressPauseBtn.addEventListener('click', () => this.togglePauseClassification());
        }
        if (el.progressStopBtn) {
            el.progressStopBtn.addEventListener('click', () => this.stopClassification());
        }
        if (el.progressClearLogBtn) {
            el.progressClearLogBtn.addEventListener('click', () => this.clearProgressLog());
        }

        // Download error log
        const errorLogBtn = document.getElementById('downloadErrorLogBtn');
        if (errorLogBtn) {
            errorLogBtn.addEventListener('click', () => this.downloadErrorLog());
        }

        // Clear thumbnail cache
        const clearThumbnailBtn = document.getElementById('clearThumbnailCacheBtn');
        if (clearThumbnailBtn) {
            clearThumbnailBtn.addEventListener('click', () => {
                const stats = this.thumbnailManager.getCacheStats();
                if (stats.entries === 0) {
                    alert('No thumbnails cached.');
                    return;
                }
                if (confirm(`Clear cached thumbnails?\n\n${stats.entries} entries using ${stats.size} KB of storage.\n\nThumbnails will be re-fetched as needed.`)) {
                    this.thumbnailManager.clearCache();
                    this.uiManager.showToast('✅ Thumbnail cache cleared', '🗑️');
                    this.renderAll();
                }
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                if (el.searchInput) el.searchInput.focus();
            }
            if (e.key === 'Escape') {
                if (this.expandView.isActive) {
                    this.expandView.hide();
                } else {
                    if (el.searchInput) {
                        el.searchInput.value = '';
                        this.searchQuery = '';
                        this.letterFilter = null;
                        this.alphabetNav.clearFilter();
                        this.renderAll();
                    }
                    this.uiManager.hideModal();
                    this.popupManager.closeAllPopups();
                }
            }
        });

        // Modal close
        const modal = document.getElementById('modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.uiManager.hideModal();
            });
        }
        const modalClose = document.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => this.uiManager.hideModal());
        }
    }

    setupProgressSection() {
        this.uiManager.collapseProgress();
        this.uiManager.updateProgress({
            total: 0,
            classified: 0,
            isRunning: false,
            isPaused: false,
            isCancelled: false,
            apiCalls: 0,
            startTime: null
        });
    }

    // ========================================
    // SEARCH
    // ========================================

    handleSearch() {
        const input = this.uiManager.elements.searchInput;
        if (!input) return;
        const query = input.value.trim();
        this.searchQuery = query;
        this.letterFilter = null;
        this.alphabetNav.clearFilter();

        if (!query) { this.renderAll(); return; }

        const bookmarks = this.bookmarkManager.getBookmarks();
        const filtered = SearchHelpers.filterBookmarks(bookmarks, query, this.showArchived);
        this.renderBookmarks(filtered, `Search: "${query}"`);
    }

    // ========================================
    // IMPORT / EXPORT
    // ========================================

    showImportModal() {
        const bookmarks = this.bookmarkManager.getBookmarks();
        const activeCount = bookmarks.filter(b => !b.isArchived).length;
        const archivedCount = bookmarks.filter(b => b.isArchived).length;
        const categories = this.categoryManager.getCategories();
        const history = this.importManager ? this.importManager.getImportHistory() : [];

        const content = `
            <div class="form-group">
                <label>Import from Chrome Bookmarks</label>
                <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1rem;">
                    Export your bookmarks from Chrome (Bookmarks → Export Bookmarks) and upload the HTML file here.
                </p>
                <button id="importFromFileBtn" class="btn btn-primary" style="width: 100%;">
                    📄 Choose Chrome Bookmarks HTML File
                </button>
                <div style="margin-top: 0.5rem;">
                    <label style="font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                        <input type="checkbox" id="importNewOnly" checked>
                        <span>Import new bookmarks only (skip duplicates)</span>
                    </label>
                </div>
            </div>
            <hr style="border: none; border-top: 1px solid var(--border); margin: 1.5rem 0;">
            <div class="form-group">
                <label>Import from JSON Export</label>
                <button id="importFromJsonBtn" class="btn btn-secondary" style="width: 100%;">
                    📂 Choose JSON Export File
                </button>
            </div>
            <div class="form-group" style="margin-top: 1rem;">
                <label>Current Collection</label>
                <div style="background: var(--background); padding: 1rem; border-radius: 8px;">
                    <div><strong>${activeCount}</strong> active bookmarks</div>
                    <div><strong>${archivedCount}</strong> archived</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">
                        ${categories.length} categories • ${history.length} imports
                    </div>
                </div>
            </div>
        `;

        this.uiManager.showModal('📥 Import Bookmarks', content);

        document.getElementById('importFromFileBtn')?.addEventListener('click', () => {
            this.uiManager.hideModal();
            const input = document.getElementById('fileInput');
            if (input) { input.accept = '.html,.htm'; input.click(); }
        });

        document.getElementById('importFromJsonBtn')?.addEventListener('click', () => {
            this.uiManager.hideModal();
            const input = document.getElementById('fileInput');
            if (input) { input.accept = '.json'; input.click(); }
        });
    }

    showExportModal() {
        const bookmarks = this.bookmarkManager.getBookmarks();
        if (bookmarks.length === 0) {
            alert('No bookmarks to export.');
            return;
        }

        const activeCount = bookmarks.filter(b => !b.isArchived).length;
        const archivedCount = bookmarks.filter(b => b.isArchived).length;
        const categories = this.categoryManager.getCategories();
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            bookmarks: bookmarks,
            categories: categories,
            totalBookmarks: bookmarks.length,
            isClassificationComplete: this.isClassificationComplete
        };
        const json = JSON.stringify(exportData, null, 2);

        const content = `
            <div class="form-group">
                <label>Export Format</label>
                <select id="exportFormat" style="width:100%; padding:0.6rem 1rem; border:1px solid var(--border); border-radius:8px; font-size:0.95rem;">
                    <option value="json">JSON (App Format - Full Data)</option>
                    <option value="chrome">Chrome HTML (Import to Chrome with Categories)</option>
                </select>
            </div>
            <div class="form-group">
                <label>Export Summary</label>
                <div style="background: var(--background); padding: 1rem; border-radius: 8px;">
                    <div><strong>${activeCount}</strong> active bookmarks</div>
                    <div><strong>${archivedCount}</strong> archived</div>
                    <div><strong>${categories.length - 1}</strong> categories</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">
                        ${this.isClassificationComplete ? '✅ Classification complete' : '⏳ Classification partial'}
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label>Export File Name</label>
                <input type="text" id="exportFileName" value="bookmarks_export_${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-actions">
                <button id="downloadExportBtn" class="btn btn-success">💾 Download</button>
                <button class="btn btn-secondary" onclick="document.getElementById('modal').style.display='none'">Cancel</button>
            </div>
        `;

        this.uiManager.showModal('💾 Export Bookmarks', content);

        document.getElementById('downloadExportBtn')?.addEventListener('click', () => {
            const fileName = document.getElementById('exportFileName')?.value || 'bookmarks_export';
            const format = document.getElementById('exportFormat')?.value || 'json';

            if (format === 'chrome') {
                const html = this.exportManager.generateChromeHtml();
                this.exportManager.downloadFile(html, `${fileName}.html`, 'text/html');
            } else {
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${fileName}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        });
    }

    async handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const content = await file.text();
            const isJson = file.name.endsWith('.json');

            if (isJson) {
                const result = await this.importManager.importFromJson(content);
                if (result.success) {
                    this.categoryManager.setCategories(result.categories || ['All']);
                    this.currentCategory = 'All';
                    this.isClassificationComplete = result.isClassificationComplete || false;
                    this.saveData();
                    this.renderAll();
                    alert(`✅ Loaded ${result.count} bookmarks from "${file.name}"!`);
                } else {
                    alert('❌ ' + result.message);
                }
            } else {
                const importNewOnly = document.getElementById('importNewOnly')?.checked !== false;
                const result = await this.importManager.importFromChromeHtml(content, importNewOnly);

                if (!result.success) {
                    alert(result.message);
                    event.target.value = '';
                    return;
                }

                const categories = this.categoryManager.extractCategories(
                    this.bookmarkManager.getBookmarks()
                );
                this.categoryManager.setCategories(categories);
                if (!this.categoryManager.getCategories().includes('Uncategorized')) {
                    this.categoryManager.addCategory('Uncategorized');
                }

                this.isClassificationComplete = false;
                this.saveData();
                this.renderAll();

                const msg = `✅ Imported ${result.count} new bookmarks from "${file.name}"!${result.skipped > 0 ? `\n${result.skipped} existing bookmark(s) were skipped.` : ''}`;
                alert(msg);

                if (this.aiClassifier && result.count > 0 && confirm('Auto-classify these new bookmarks?')) {
                    await this.startClassification();
                }
            }
        } catch (error) {
            console.error('Import error:', error);
            alert('Error importing: ' + error.message);
        }
        event.target.value = '';
    }

    // ========================================
    // CLASSIFICATION
    // ========================================

    async startClassification() {
        if (!this.aiClassifier) {
            alert('Please set up your DeepSeek API key first.');
            return;
        }

        if (this.bookmarkManager.getBookmarks().length === 0) {
            alert('No bookmarks to classify.');
            return;
        }

        if (this.classificationManager?.isRunning) {
            alert('Classification is already running.');
            return;
        }

        if (this.bookmarkManager.getActiveBookmarks().length === 0) {
            alert('No active bookmarks to classify.');
            return;
        }

        this.uiManager.expandProgress();

        const el = this.uiManager.elements;
        if (el.classifyBtn) { el.classifyBtn.disabled = true; el.classifyBtn.textContent = '⏳ Classifying...'; }
        if (el.importBtn) el.importBtn.disabled = true;
        if (el.exportBtn) el.exportBtn.disabled = true;
        if (el.clearAllBtn) el.clearAllBtn.disabled = true;
        if (el.addCategoryBtn) el.addCategoryBtn.disabled = true;
        if (el.progressStartBtn) el.progressStartBtn.disabled = true;
        if (el.progressPauseBtn) el.progressPauseBtn.disabled = false;
        if (el.progressStopBtn) el.progressStopBtn.disabled = false;

        this.isClassificationComplete = false;

        try {
            const result = await this.classificationManager.classifyAll();

            if (result.success) {
                const categories = this.categoryManager.extractCategories(this.bookmarkManager.getBookmarks());
                this.categoryManager.setCategories(categories);
                this.isClassificationComplete = true;
                this.saveData();
                this.renderAll();
                this.uiManager.showToast(`✅ Classification complete! ${result.total} bookmarks categorized.`, '✅');
                if (result.errors > 0) {
                    alert(`✅ Classification complete with ${result.errors} error(s).\nCheck the error log for details.`);
                } else {
                    alert('✅ Classification complete!');
                }
            } else {
                if (result.partial) {
                    const categories = this.categoryManager.extractCategories(this.bookmarkManager.getBookmarks());
                    this.categoryManager.setCategories(categories);
                    this.saveData();
                    this.renderAll();
                    this.uiManager.showToast(`⏸️ Classification stopped. ${this.classificationManager?.classifiedCount || 0} bookmarks categorized.`, '⏸️');
                    alert(`⏸️ Classification stopped.\n\n${this.classificationManager?.classifiedCount || 0} bookmarks have been categorized.\nUncategorized bookmarks remain in "Uncategorized" folder.`);
                } else {
                    this.uiManager.showToast('❌ Classification failed: ' + result.message, '❌');
                    alert('❌ Classification failed: ' + result.message);
                }
            }
        } catch (error) {
            console.error('Classification error:', error);
            this.uiManager.showToast('❌ Error: ' + error.message, '❌');
            alert('❌ Error: ' + error.message);
        } finally {
            this.resetUI();
        }
    }

    togglePauseClassification() {
        if (!this.classificationManager?.isRunning) return;
        if (this.classificationManager.isPaused) {
            this.classificationManager.resume();
            const btn = this.uiManager.elements.progressPauseBtn;
            if (btn) btn.textContent = '⏸ Pause';
        } else {
            this.classificationManager.pause();
            const btn = this.uiManager.elements.progressPauseBtn;
            if (btn) btn.textContent = '▶ Resume';
        }
    }

    stopClassification() {
        if (!this.classificationManager?.isRunning) return;
        if (confirm('⚠️ Stop classification?\n\nBookmarks already categorized will keep their categories.\nUnprocessed bookmarks will remain "Uncategorized".')) {
            this.classificationManager.cancel();
            this.resetUI();
            this.uiManager.showToast('⏹ Classification stopped - partial results saved', '⏹');

            const categories = this.categoryManager.extractCategories(this.bookmarkManager.getBookmarks());
            this.categoryManager.setCategories(categories);
            this.saveData();
            this.renderAll();
        }
    }

    clearProgressLog() {
        if (this.classificationManager) {
            this.classificationManager.logs = [];
            this.classificationManager.errors = [];
        }
        this.uiManager.clearLog();
        this.uiManager.addLogEntry({
            time: new Date().toLocaleTimeString(),
            message: '🗑️ Log cleared',
            level: 'info'
        });
    }

    downloadErrorLog() {
        if (!this.classificationManager) {
            alert('No errors to download.');
            return;
        }
        const logContent = this.classificationManager.downloadErrorLog();
        if (!logContent) {
            alert('No errors to log.');
            return;
        }
        const blob = new Blob([logContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `classification_errors_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.uiManager.addLogEntry({
            time: new Date().toLocaleTimeString(),
            message: `📥 Downloaded error log (${this.classificationManager.errors.length} errors)`,
            level: 'info'
        });
    }

    resetUI() {
        const el = this.uiManager.elements;
        if (el.classifyBtn) { el.classifyBtn.disabled = false; el.classifyBtn.textContent = '🤖 Auto-Classify'; }
        if (el.importBtn) el.importBtn.disabled = false;
        if (el.exportBtn) el.exportBtn.disabled = false;
        if (el.clearAllBtn) el.clearAllBtn.disabled = false;
        if (el.addCategoryBtn) el.addCategoryBtn.disabled = false;
        if (el.progressStartBtn) el.progressStartBtn.disabled = false;
        if (el.progressPauseBtn) { el.progressPauseBtn.disabled = true; el.progressPauseBtn.textContent = '⏸ Pause'; }
        if (el.progressStopBtn) el.progressStopBtn.disabled = true;

        this.uiManager.updateProgress({
            total: this.classificationManager?.totalToClassify || 0,
            classified: this.classificationManager?.classifiedCount || 0,
            isRunning: false,
            isPaused: false,
            isCancelled: false,
            apiCalls: this.classificationManager?.apiCalls || 0,
            startTime: this.classificationManager?.startTime || null
        });
    }

    // ========================================
    // CATEGORIES
    // ========================================

    addNewCategory() {
        const name = prompt('Enter new category name:');
        if (name && name.trim()) {
            const trimmed = name.trim();
            if (!this.categoryManager.getCategories().includes(trimmed)) {
                this.categoryManager.addCategory(trimmed);
                this.saveData();
                this.renderCategories();
            } else {
                alert('Category already exists!');
            }
        }
    }

    // ========================================
    // BOOKMARK OPERATIONS
    // ========================================

    deleteBookmark(id) {
        if (confirm('🗑️ Permanently delete this bookmark?')) {
            this.bookmarkManager.deleteBookmark(id);
            this.saveData();
            this.renderAll();
            this.uiManager.showToast('Deleted 1 bookmark', '🗑️');
        }
    }

    archiveBookmark(id) {
        const bookmark = this.bookmarkManager.archiveBookmark(id);
        if (bookmark) {
            this.saveData();
            this.renderAll();
            this.uiManager.showToast(
                bookmark.isArchived ? 'Archived 1 bookmark' : 'Unarchived 1 bookmark',
                bookmark.isArchived ? '📥' : '📤'
            );
        }
    }

    bulkArchive(ids) {
        this.bookmarkManager.bulkArchive(ids);
        this.saveData();
        this.renderAll();
    }

    bulkDelete(ids) {
        if (confirm(`🗑️ Delete ${ids.length} duplicate(s)?\n\nThe newest duplicate will be kept.`)) {
            this.bookmarkManager.bulkDelete(ids);
            this.saveData();
            this.renderAll();
        }
    }

    clearAllBookmarks() {
        const stats = this.bookmarkManager.getStats();
        if (stats.total === 0) { alert('No bookmarks to clear.'); return; }

        if (confirm(`⚠️ Clear ALL bookmarks?\n\n${stats.total} total (${stats.active} active, ${stats.archived} archived)\n\nThis cannot be undone!`)) {
            this.bookmarkManager.clearAll();
            this.categoryManager.setCategories(['All']);
            if (this.importManager) this.importManager.clearImportHistory();
            this.currentCategory = 'All';
            this.searchQuery = '';
            this.letterFilter = null;
            this.isClassificationComplete = false;
            this.alphabetNav.clearFilter();
            if (this.classificationManager) {
                this.classificationManager.classifiedCount = 0;
                this.classificationManager.totalToClassify = 0;
                this.classificationManager.apiCalls = 0;
                this.classificationManager.errors = [];
                this.classificationManager.logs = [];
            }
            this.saveData();
            this.renderAll();
            this.resetUI();
            this.uiManager.showToast('✅ All bookmarks cleared.', '✅');
        }
    }

    // ========================================
    // RENDER
    // ========================================

    renderAll() {
        this.renderCategories();
        this.renderBookmarks();
        this.renderStats();
        this.renderImportHistory();

        if (this.classificationManager) {
            this.uiManager.updateProgress({
                total: this.classificationManager.totalToClassify || 0,
                classified: this.classificationManager.classifiedCount || 0,
                isRunning: this.classificationManager.isRunning || false,
                isPaused: this.classificationManager.isPaused || false,
                isCancelled: this.classificationManager.isCancelled || false,
                apiCalls: this.classificationManager.apiCalls || 0,
                startTime: this.classificationManager.startTime || null
            });
        }
    }

    renderCategories() {
        const bookmarks = this.bookmarkManager.getBookmarks();
        const categories = this.categoryManager.getCategories();
        const counts = this.categoryManager.getCategoryCounts(bookmarks);
        this.uiManager.renderCategories(categories, this.currentCategory, counts);

        const list = this.uiManager.elements.categoriesList;
        if (list) {
            list.querySelectorAll('li').forEach((li, index) => {
                li.addEventListener('click', () => {
                    this.switchCategory(categories[index]);
                });
            });
        }
    }

    renderBookmarks(filteredData = null, title = null) {
        const grid = this.uiManager.elements.bookmarksGrid;
        const titleEl = this.uiManager.elements.currentCategoryTitle;
        const countEl = this.uiManager.elements.bookmarkCount;
        if (!grid) return;

        let bookmarksToShow = filteredData || this.bookmarkManager.getBookmarks();

        // Apply letter filter if active
        const letterFilter = this.alphabetNav.getFilter();
        if (letterFilter) {
            bookmarksToShow = bookmarksToShow.filter(b => {
                if (b.isArchived) return false;
                const firstChar = SearchHelpers.getDomainFirstLetter(b);
                return firstChar === letterFilter;
            });
        }

        if (!this.showArchived) bookmarksToShow = bookmarksToShow.filter(b => !b.isArchived);
        if (!filteredData && this.currentCategory !== 'All') {
            bookmarksToShow = bookmarksToShow.filter(b => b.category === this.currentCategory);
        }
        if (this.searchQuery && !filteredData) {
            bookmarksToShow = SearchHelpers.filterBookmarks(bookmarksToShow, this.searchQuery, this.showArchived);
        }

        bookmarksToShow = this.bookmarkManager.sortBookmarks(bookmarksToShow, this.sortOption);

        const { stacks, singles } = this.bookmarkManager.groupBookmarks(bookmarksToShow);
        const archivedBookmarks = this.showArchived ? bookmarksToShow.filter(b => b.isArchived) : [];

        // Update alphabetical navigation
        this.alphabetNav.render(this.bookmarkManager.getBookmarks());

        let titleText = title || (this.searchQuery ? `Search: "${this.searchQuery}"` : this.currentCategory);
        if (letterFilter) {
            titleText += ` • Letter: ${letterFilter.toUpperCase()}`;
        }
        if (titleEl) titleEl.textContent = titleText;

        const totalCount = singles.length + stacks.length + archivedBookmarks.length;
        if (countEl) countEl.textContent = `${totalCount} bookmarks`;

        if (totalCount === 0) {
            let emptyMessage = 'No bookmarks found';
            if (letterFilter) {
                emptyMessage = `No bookmarks starting with "${letterFilter.toUpperCase()}"`;
            }
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📭</div>
                    <h3>${emptyMessage}</h3>
                    <p>${filteredData || this.searchQuery || letterFilter ? 'Try a different filter or search term.' : 'Import bookmarks or switch to another category.'}</p>
                    ${!filteredData && !this.searchQuery && !letterFilter ? '<button class="btn btn-primary" onclick="document.getElementById(\'importBtn\').click()">Import Bookmarks</button>' : ''}
                    ${letterFilter ? '<button class="btn btn-secondary" onclick="app.alphabetNav.clearFilter();app.renderBookmarks();">Clear Filter</button>' : ''}
                </div>
            `;
            return;
        }

        grid.innerHTML = '';

        // Render single bookmarks
        singles.forEach(bookmark => {
            const card = this.uiRenderer.createBookmarkCard(bookmark, {
                onDelete: (id) => this.deleteBookmark(id),
                onArchive: (id) => this.archiveBookmark(id)
            });
            grid.appendChild(card);
        });

        // Render stacks
        stacks.forEach(stack => {
            const firstBookmark = stack[0];
            const isDomainStack = stack.length > 1 && stack.every(b =>
                b.domain === firstBookmark.domain &&
                b.url !== firstBookmark.url
            );

            const container = this.stackRenderer.createStackedCard(stack, {
                onDelete: (id) => this.deleteBookmark(id),
                onArchive: (id) => this.archiveBookmark(id),
                onBulkArchive: (ids) => this.bulkArchive(ids),
                onBulkDelete: (ids) => this.bulkDelete(ids),
                isDomainStack: isDomainStack
            });
            grid.appendChild(container);
        });

        // Render archived bookmarks
        if (this.showArchived) {
            archivedBookmarks.forEach(bookmark => {
                const card = this.uiRenderer.createBookmarkCard(bookmark, {
                    onDelete: (id) => this.deleteBookmark(id),
                    onArchive: (id) => this.archiveBookmark(id)
                });
                grid.appendChild(card);
            });
        }
    }

    renderStats() {
        const stats = this.bookmarkManager.getStats();
        const categoryCount = this.categoryManager.getCategories().length - 1;
        this.uiManager.renderStats({
            active: stats.active,
            archived: stats.archived,
            categories: categoryCount,
            classificationComplete: this.isClassificationComplete
        });
    }

    renderImportHistory() {
        const history = this.importManager ? this.importManager.getImportHistory() : [];
        this.uiManager.renderImportHistory(history);
    }

    switchCategory(category) {
        this.currentCategory = category;
        this.letterFilter = null;
        this.alphabetNav.clearFilter();
        const input = this.uiManager.elements.searchInput;
        if (input) input.value = '';
        this.searchQuery = '';
        this.saveData();
        this.renderAll();
    }
}

// ========================================
// INITIALIZE APP
// ========================================

console.log('🚀 Starting app...');
const app = new BookmarkApp();

// Make app globally available
window.app = app;
window.importBookmarks = () => {
    const btn = document.getElementById('importBtn');
    if (btn) btn.click();
};
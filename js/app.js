// ========================================
// 📚 BOOKMARK MANAGER - MAIN APP (THIN)
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
import { BulkActions } from './ui/bulkActions.js';
import { LinkChecker } from './features/linkChecker.js';
import { LinkCheckUI } from './ui/linkCheckUI.js';
import { LinkCheckHandlers } from './handlers/linkCheckHandlers.js';
import { SearchHelpers } from './utils/searchHelpers.js';
import { AIClassifier } from './aiClassifier.js';
import { setupEventListeners } from './handlers/eventHandlers.js';
import { ImportExportHandlers } from './handlers/importExportHandlers.js';
import { ClassificationHandlers } from './handlers/classificationHandlers.js';
import { RenderHandlers } from './handlers/renderHandlers.js';

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
        this.linkChecker = null;
        this.linkCheckUI = null;

        // ----- Handlers (will be initialized) -----
        this.importExportHandlers = null;
        this.classificationHandlers = null;
        this.renderHandlers = null;
        this.linkCheckHandlers = null;

        // ----- State -----
        this.currentCategory = 'All';
        this.searchQuery = '';
        this.sortOption = 'date-desc';
        this.showArchived = false;
        this.isClassificationComplete = false;
        this.letterFilter = null;
        this.bulkActions = null;
        this.statusFilter = null;

        this.init();
    }

    // ========================================
    // INITIALIZATION
    // ========================================

    async init() {
        console.log('📦 Loading data...');
        this.loadData();

        this.importManager = new ImportManager(this.bookmarkManager);
        this.exportManager = new ExportManager(this.bookmarkManager, this.categoryManager);

        const apiKey = prompt('Please enter your DeepSeek API key (or cancel to skip):');
        if (apiKey && apiKey.trim()) {
            console.log('🔑 API key provided...');
            this.aiClassifier = new AIClassifier(apiKey.trim());
            this.classificationManager = new ClassificationManager(
                this.aiClassifier,
                this.bookmarkManager,
                this.categoryManager
            );
            this.setupClassificationCallbacks();
        } else {
            console.log('⚠️ No API key provided');
            this.classificationManager = new ClassificationManager(
                null,
                this.bookmarkManager,
                this.categoryManager
            );
            this.aiClassifier = null;
        }

        console.log('🎨 Initializing UI...');
        this.uiManager = new UIManager();

        // Initialize Link Checker
        this.linkChecker = new LinkChecker(this.bookmarkManager);
        this.linkCheckUI = new LinkCheckUI(this.uiManager);
        this.setupLinkCheckCallbacks();

        // Initialize Bulk Actions
        this.bulkActions = new BulkActions(
            this.bookmarkManager,
            this.categoryManager,
            this.uiManager,
            this.uiRenderer,
            this.aiClassifier
        );

        // Initialize Handlers
        this.importExportHandlers = new ImportExportHandlers(this);
        this.classificationHandlers = new ClassificationHandlers(this);
        this.renderHandlers = new RenderHandlers(this);
        this.linkCheckHandlers = new LinkCheckHandlers(this);

        console.log('🤖 AI Classifier available:', !!this.aiClassifier);

        this.setupCallbacks();
        
        // Call setupEventListeners properly
        if (typeof setupEventListeners === 'function') {
            console.log('🎯 Setting up event listeners via imported function...');
            setupEventListeners(this);
        } else {
            console.warn('⚠️ setupEventListeners is not a function, falling back to internal setup...');
            this.setupEventListeners();
        }

        console.log('🔄 Rendering...');
        this.renderAll();
        this.setupProgressSection();

        const progressSectionEl = document.querySelector('.progress-section');
        if (progressSectionEl) {
            progressSectionEl.style.display = 'none';
            progressSectionEl.classList.remove('active');
        }

        // Setup Link Check config modal events
        this.setupLinkCheckConfigEvents();

        console.log('✅ Bookmark App initialized successfully!');
    }

    // ========================================
    // INTERNAL SETUP EVENT LISTENERS (FALLBACK)
    // ========================================

    setupEventListeners() {
        console.log('🎯 Setting up internal event listeners...');
        
        // --- Import/Export ---
        const importBtn = document.getElementById('importBtn');
        const exportBtn = document.getElementById('exportBtn');
        
        if (importBtn) {
            importBtn.addEventListener('click', () => this.showImportModal());
        }
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.showExportModal());
        }
        
        // --- Classification ---
        const classifyBtn = document.getElementById('classifyBtn');
        if (classifyBtn) {
            classifyBtn.addEventListener('click', () => this.startClassification());
        }
        
        // --- Progress controls ---
        const progressStartBtn = document.getElementById('progressStartBtn');
        const progressPauseBtn = document.getElementById('progressPauseBtn');
        const progressStopBtn = document.getElementById('progressStopBtn');
        const progressClearLogBtn = document.getElementById('progressClearLogBtn');
        const progressToggle = document.getElementById('progressToggle');
        
        if (progressStartBtn) {
            progressStartBtn.addEventListener('click', () => this.startClassification());
        }
        if (progressPauseBtn) {
            progressPauseBtn.addEventListener('click', () => this.togglePauseClassification());
        }
        if (progressStopBtn) {
            progressStopBtn.addEventListener('click', () => this.stopClassification());
        }
        if (progressClearLogBtn) {
            progressClearLogBtn.addEventListener('click', () => this.clearProgressLog());
        }
        if (progressToggle) {
            progressToggle.addEventListener('click', () => this.uiManager.toggleProgress());
        }
        
        // --- Search ---
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.handleSearch());
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    searchInput.value = '';
                    this.handleSearch();
                }
            });
        }
        
        // --- Sort ---
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortOption = e.target.value;
                this.renderAll();
            });
        }
        
        // --- Clear All ---
        const clearAllBtn = document.getElementById('clearAllBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAllBookmarks());
        }
        
        // --- Add Category ---
        const addCategoryBtn = document.getElementById('addCategoryBtn');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => this.addNewCategory());
        }
        
        // --- Show Archived Toggle ---
        const showArchivedBtn = document.getElementById('showArchivedBtn');
        if (showArchivedBtn) {
            showArchivedBtn.addEventListener('click', () => {
                this.showArchived = !this.showArchived;
                this.renderAll();
                this.uiManager.showToast(
                    this.showArchived ? 'Showing archived bookmarks' : 'Hiding archived bookmarks',
                    '🗄️'
                );
            });
        }
        
        // --- Category list click (delegated) ---
        const categoriesList = document.getElementById('categoriesList');
        if (categoriesList) {
            categoriesList.addEventListener('click', (e) => {
                const li = e.target.closest('li');
                if (!li) return;
                const category = li.textContent.replace(/\d+$/, '').trim();
                if (category) {
                    this.switchCategory(category);
                }
            });
        }
        
        // --- Keyboard shortcuts ---
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            }
            
            if (e.key === 'Escape') {
                if (this.bulkActions) this.bulkActions.clearSelection();
                if (this.uiManager) this.uiManager.hideModal();
                if (this.popupManager) this.popupManager.closeAll();
                const searchInput = document.getElementById('searchInput');
                if (searchInput && document.activeElement === searchInput) {
                    searchInput.blur();
                }
            }
        });
        
        console.log('✅ Internal event listeners set up');
    }

    // ========================================
    // SETUP LINK CHECK CONFIG EVENTS
    // ========================================

    setupLinkCheckConfigEvents() {
        // Radio button change listener
        document.querySelectorAll('input[name="scanSpeed"]').forEach(radio => {
            radio.addEventListener('change', () => {
                if (this.linkCheckHandlers) {
                    this.linkCheckHandlers.updateSummary(radio.value);
                }
            });
        });

        // Advanced settings toggle
        document.getElementById('showAdvanced')?.addEventListener('change', function() {
            document.getElementById('advancedSettings').style.display = this.checked ? 'block' : 'none';
        });

        // Start scan button
        document.getElementById('startScanBtn')?.addEventListener('click', () => {
            if (this.linkCheckHandlers) {
                this.linkCheckHandlers.startLinkCheckWithOptions();
            }
        });

        // Close button
        document.getElementById('linkCheckConfigModal')?.addEventListener('click', (e) => {
            if (e.target === document.getElementById('linkCheckConfigModal')) {
                if (this.linkCheckHandlers) {
                    this.linkCheckHandlers.closeLinkCheckConfig();
                }
            }
        });
    }

    // ========================================
    // SETUP CALLBACKS
    // ========================================

    setupCallbacks() {
        this.uiRenderer.setOnSelectionChange((selectedIds) => {
            if (this.bulkActions) {
                this.bulkActions.updateUI(selectedIds);
            }
        });

        this.alphabetNav.setCallbacks(
            (letter) => {
                this.letterFilter = letter;
                this.searchQuery = '';
                if (this.bulkActions) this.bulkActions.clearSelection();
                const searchInput = this.uiManager.elements.searchInput;
                if (searchInput) searchInput.value = '';
                this.renderAll();
            },
            () => {
                this.letterFilter = null;
                this.renderAll();
            }
        );

        this.expandView.setOnClose(() => {
            this.renderAll();
        });
        this.expandView.setActions({
            onArchive: (id) => this.archiveBookmark(id),
            onDelete: (id) => this.deleteBookmark(id),
            onBulkArchive: (ids) => {
                if (this.bulkActions) this.bulkActions.bulkArchive(ids);
            },
            onBulkDelete: (ids) => {
                if (this.bulkActions) this.bulkActions.bulkDelete(ids);
            }
        });

        this.stackRenderer.setOnExpand((bookmarks, domainName, isDomainStack) => {
            this.expandView.show(bookmarks, domainName, isDomainStack);
        });

        if (this.bulkActions) {
            this.bulkActions.updateUI(this.bulkActions.getSelectedIds());
        }
    }

    // ========================================
    // CLASSIFICATION CALLBACKS
    // ========================================

    setupClassificationCallbacks() {
        if (!this.classificationManager) return;

        this.classificationManager.onProgress((progress) => {
            if (this.uiManager) {
                this.uiManager.updateProgress(progress);
                const progressSectionEl = document.querySelector('.progress-section');
                if (progressSectionEl) {
                    const isComplete = progress.classified === progress.total && progress.total > 0 && !progress.isRunning;
                    if (isComplete) {
                        progressSectionEl.style.display = 'none';
                        progressSectionEl.classList.remove('active');
                        // Update button states when complete
                        if (this.classificationHandlers) {
                            this.classificationHandlers.updateButtonStates();
                        }
                    } else if (progress.isRunning) {
                        progressSectionEl.style.display = 'block';
                        progressSectionEl.classList.add('active');
                    } else {
                        progressSectionEl.style.display = 'none';
                        progressSectionEl.classList.remove('active');
                    }
                }
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
            this.renderAll();
        });
    }

    // ========================================
    // LINK CHECK CALLBACKS
    // ========================================

    setupLinkCheckCallbacks() {
        this.linkChecker.onProgress((progress) => {
            this.linkCheckUI.showProgress(progress);
        });

        this.linkChecker.onResults((summary) => {
            this.linkCheckUI.showResults(summary);
        });
    }

    // ========================================
    // DATA LOADING
    // ========================================

    loadData() {
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
                return;
            }
        }

        const saved = this.storage.load();
        if (saved) {
            this.bookmarkManager.setBookmarks(saved.bookmarks || []);
            this.categoryManager.setCategories(saved.categories || ['All']);
            this.currentCategory = saved.currentCategory || 'All';
            this.sortOption = saved.sortOption || 'date-desc';
            this.showArchived = saved.showArchived || false;
            this.isClassificationComplete = saved.isClassificationComplete || false;
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
        this.statusFilter = null;
        if (this.bulkActions) this.bulkActions.clearSelection();
        this.alphabetNav.clearFilter();

        if (!query) { this.renderAll(); return; }

        const bookmarks = this.bookmarkManager.getBookmarks();
        const filtered = SearchHelpers.filterBookmarks(bookmarks, query, this.showArchived);
        this.renderBookmarks(filtered, `Search: "${query}"`);
    }

    // ========================================
    // WRAPPER METHODS (delegate to handlers)
    // ========================================

    // Import/Export
    showImportModal() { this.importExportHandlers.showImportModal(); }
    showExportModal() { this.importExportHandlers.showExportModal(); }
    handleFileImport(event) { this.importExportHandlers.handleFileImport(event); }

    // Classification
    startClassification() { this.classificationHandlers.startClassification(); }
    togglePauseClassification() { this.classificationHandlers.togglePauseClassification(); }
    stopClassification() { this.classificationHandlers.stopClassification(); }
    clearProgressLog() { this.classificationHandlers.clearProgressLog(); }
    downloadErrorLog() { this.classificationHandlers.downloadErrorLog(); }
    resetUI() { this.classificationHandlers.resetUI(); }

    // Link Check
    openLinkCheckConfig() { this.linkCheckHandlers.openLinkCheckConfig(); }
    clearThumbnailCache() { this.linkCheckHandlers.clearThumbnailCache(); }

    // Render
    renderAll() { this.renderHandlers.renderAll(); }
    renderCategories() { this.renderHandlers.renderCategories(); }
    renderBookmarks(filteredData, title) { this.renderHandlers.renderBookmarks(filteredData, title); }
    renderStats() { this.renderHandlers.renderStats(); }
    renderImportHistory() { this.renderHandlers.renderImportHistory(); }

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
                this.renderAll();
            } else {
                alert('Category already exists!');
            }
        }
    }

    switchCategory(category) {
        this.currentCategory = category;
        this.letterFilter = null;
        this.statusFilter = null;
        if (this.bulkActions) this.bulkActions.clearSelection();
        this.alphabetNav.clearFilter();
        const input = this.uiManager.elements.searchInput;
        if (input) input.value = '';
        this.searchQuery = '';
        this.saveData();
        this.renderAll();
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
            this.statusFilter = null;
            this.isClassificationComplete = false;
            if (this.bulkActions) this.bulkActions.clearSelection();
            this.alphabetNav.clearFilter();
            if (this.classificationManager) {
                this.classificationManager.classifiedCount = 0;
                this.classificationManager.totalToClassify = 0;
                this.classificationManager.apiCalls = 0;
                this.classificationManager.errors = [];
                this.classificationManager.logs = [];
                this.classificationManager.isRunning = false;
                this.classificationManager.isPaused = false;
                this.classificationManager.isCancelled = false;
            }
            this.saveData();
            this.renderAll();
            this.resetUI();
            this.uiManager.showToast('✅ All bookmarks cleared.', '✅');
        }
    }

    // ========================================
    // HELPERS
    // ========================================

    getVisibleBookmarkIds() {
        const grid = document.getElementById('bookmarksGrid');
        if (!grid) return [];
        const ids = [];
        grid.querySelectorAll('.bookmark-card').forEach(card => {
            if (card.dataset.id) ids.push(card.dataset.id);
        });
        grid.querySelectorAll('.stack-container .bookmark-card').forEach(card => {
            if (card.dataset.id) ids.push(card.dataset.id);
        });
        return ids;
    }
}

// ========================================
// INITIALIZE APP
// ========================================

console.log('🚀 Starting app...');
const app = new BookmarkApp();

window.app = app;
window.importBookmarks = () => {
    document.getElementById('importBtn')?.click();
};

// Make link check config functions globally available for onclick handlers
window.openLinkCheckConfig = () => {
    if (app.linkCheckHandlers) {
        app.linkCheckHandlers.openLinkCheckConfig();
    }
};

window.closeLinkCheckConfig = () => {
    if (app.linkCheckHandlers) {
        app.linkCheckHandlers.closeLinkCheckConfig();
    }
};
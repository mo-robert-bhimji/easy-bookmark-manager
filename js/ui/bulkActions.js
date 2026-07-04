// ========================================
// 📦 BULK ACTIONS - Business Logic
// ========================================

import { BulkUI } from './bulkUI.js';

export class BulkActions {
    constructor(bookmarkManager, categoryManager, uiManager, uiRenderer, aiClassifier) {
        this.bookmarkManager = bookmarkManager;
        this.categoryManager = categoryManager;
        this.uiManager = uiManager;
        this.uiRenderer = uiRenderer;
        this.aiClassifier = aiClassifier;
        this.selectedIds = new Set();
        this.pendingMoveIds = [];
        this.bulkUI = new BulkUI();
        console.log('📦 BulkActions initialized');
    }

    getSelectedIds() {
        return this.selectedIds;
    }

    syncSelection() {
        if (this.uiRenderer) {
            const rendererIds = this.uiRenderer.getSelectedIds();
            if (rendererIds.size > 0 && this.selectedIds.size === 0) {
                console.log('🔄 Syncing selection from uiRenderer:', rendererIds.size);
                this.selectedIds = rendererIds;
            }
        }
        return this.selectedIds;
    }

    clearSelection() {
        console.log('🔍 clearSelection called');
        this.selectedIds.clear();
        this.pendingMoveIds = [];
        if (this.uiRenderer) {
            this.uiRenderer.clearSelection();
        }
        const visibleIds = this.getVisibleBookmarkIds();
        this.bulkUI.updateUI(this.selectedIds, visibleIds);
    }

    toggleSelectAll(checked, visibleIds) {
        console.log('🔍 toggleSelectAll called, checked:', checked);
        if (checked) {
            this.selectedIds.clear();
            visibleIds.forEach(id => this.selectedIds.add(id));
            if (this.uiRenderer) {
                this.uiRenderer.selectAll(visibleIds);
            }
        } else {
            this.selectedIds.clear();
            if (this.uiRenderer) {
                this.uiRenderer.clearSelection();
            }
        }
        this.bulkUI.updateUI(this.selectedIds, visibleIds);
    }

    updateUI(selectedIds) {
        if ((!selectedIds || selectedIds.size === 0) && this.uiRenderer) {
            const rendererIds = this.uiRenderer.getSelectedIds();
            if (rendererIds.size > 0) {
                this.selectedIds = rendererIds;
                selectedIds = this.selectedIds;
            }
        }
        const visibleIds = this.getVisibleBookmarkIds();
        this.bulkUI.updateUI(selectedIds, visibleIds);
    }

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

    // ----- Bulk Archive -----
    bulkArchive(ids) {
        if (!ids || ids.length === 0) return;
        this.bookmarkManager.bulkArchive(ids);
        this.clearSelection();
        if (window.app) {
            window.app.saveData();
            window.app.renderAll();
        }
    }

    // ----- Bulk Delete -----
    bulkDelete(ids) {
        if (!ids || ids.length === 0) return;
        this.bookmarkManager.bulkDelete(ids);
        this.clearSelection();
        if (window.app) {
            window.app.saveData();
            window.app.renderAll();
        }
    }

    // ----- Bulk Archive Selected -----
    bulkArchiveSelected() {
        console.log('📥 bulkArchiveSelected called');
        let ids = this.getSelectedIdsFromUI();
        if (ids.length === 0) {
            alert('No bookmarks selected.');
            return;
        }

        const activeCount = ids.filter(id => {
            const bookmark = this.bookmarkManager.getBookmarkById(id);
            return bookmark && !bookmark.isArchived;
        }).length;

        if (activeCount === 0) {
            alert('Selected bookmarks are already archived.');
            return;
        }

        if (confirm(`📥 Archive ${activeCount} selected bookmark(s)?`)) {
            ids.forEach(id => {
                const bookmark = this.bookmarkManager.getBookmarkById(id);
                if (bookmark && !bookmark.isArchived) {
                    bookmark.isArchived = true;
                    bookmark.archivedDate = new Date().toISOString();
                }
            });
            this.clearSelection();
            if (this.uiManager) this.uiManager.showToast(`✅ Archived ${activeCount} bookmark(s)`, '📥');
            if (window.app) {
                window.app.saveData();
                window.app.renderAll();
            }
        }
    }

    // ----- Bulk Unarchive Selected -----
    bulkUnarchiveSelected() {
        console.log('📤 bulkUnarchiveSelected called');
        let ids = this.getSelectedIdsFromUI();
        if (ids.length === 0) {
            alert('No bookmarks selected.');
            return;
        }

        const archivedCount = ids.filter(id => {
            const bookmark = this.bookmarkManager.getBookmarkById(id);
            return bookmark && bookmark.isArchived;
        }).length;

        if (archivedCount === 0) {
            alert('Selected bookmarks are not archived.');
            return;
        }

        if (confirm(`📤 Unarchive ${archivedCount} selected bookmark(s)?`)) {
            ids.forEach(id => {
                const bookmark = this.bookmarkManager.getBookmarkById(id);
                if (bookmark && bookmark.isArchived) {
                    bookmark.isArchived = false;
                    bookmark.archivedDate = null;
                }
            });
            this.clearSelection();
            if (this.uiManager) this.uiManager.showToast(`✅ Unarchived ${archivedCount} bookmark(s)`, '📤');
            if (window.app) {
                window.app.saveData();
                window.app.renderAll();
            }
        }
    }

    // ----- Bulk Delete Selected -----
    bulkDeleteSelected() {
        console.log('🗑️ bulkDeleteSelected called');
        let ids = this.getSelectedIdsFromUI();
        if (ids.length === 0) {
            alert('No bookmarks selected.');
            return;
        }

        if (confirm(`🗑️ Permanently delete ${ids.length} selected bookmark(s)?`)) {
            ids.forEach(id => {
                this.bookmarkManager.deleteBookmark(id);
            });
            this.clearSelection();
            if (this.uiManager) this.uiManager.showToast(`🗑️ Deleted ${ids.length} bookmark(s)`, '🗑️');
            if (window.app) {
                window.app.saveData();
                window.app.renderAll();
            }
        }
    }

    // ----- Show Move To Modal -----
    showMoveModal() {
        console.log('📂 showMoveModal called');
        let ids = this.getSelectedIdsFromUI();
        if (ids.length === 0) {
            alert('No bookmarks selected.');
            return;
        }

        this.pendingMoveIds = ids;
        const categories = this.categoryManager.getCategories().filter(c => c !== 'All');

        const content = `
            <div style="margin-bottom: 1rem; font-size: 0.9rem; color: var(--text-secondary);">
                Moving <strong>${ids.length}</strong> selected bookmark(s) to:
            </div>
            <div style="
                display: grid; 
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); 
                gap: 0.5rem; 
                max-height: 350px; 
                overflow-y: auto; 
                padding-right: 0.3rem;
            ">
                ${categories.map(cat => `
                    <button class="move-category-btn" data-category="${cat}" style="
                        padding: 0.6rem 0.8rem;
                        border: 1px solid var(--border);
                        border-radius: 8px;
                        background: white;
                        cursor: pointer;
                        text-align: center;
                        font-size: 0.8rem;
                        font-weight: 500;
                        transition: all 0.2s;
                        font-family: inherit;
                        color: var(--text-primary);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 44px;
                    ">
                        📁 ${cat}
                    </button>
                `).join('')}
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 0.5rem; justify-content: flex-end;">
                <button class="btn btn-secondary" onclick="document.getElementById('modal').style.display='none'">Cancel</button>
            </div>
        `;

        console.log('📂 Showing modal');
        this.uiManager.showModal('📂 Move Selected Bookmarks', content);

        setTimeout(() => {
            const btns = document.querySelectorAll('.move-category-btn');
            btns.forEach(btn => {
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                newBtn.addEventListener('click', () => {
                    const category = newBtn.dataset.category;
                    this.moveSelectedToCategory(category);
                });
                newBtn.addEventListener('mouseenter', () => {
                    newBtn.style.borderColor = 'var(--primary)';
                    newBtn.style.background = 'var(--primary-light)';
                });
                newBtn.addEventListener('mouseleave', () => {
                    newBtn.style.borderColor = 'var(--border)';
                    newBtn.style.background = 'white';
                });
            });
        }, 200);
    }

    // ----- Move Selected to Category -----
    moveSelectedToCategory(category) {
        console.log('📂 moveSelectedToCategory called with:', category);
        const ids = this.pendingMoveIds.length > 0 ? this.pendingMoveIds : [...this.selectedIds];
        if (ids.length === 0 || !category) {
            alert('No bookmarks to move.');
            return;
        }

        ids.forEach(id => {
            const bookmark = this.bookmarkManager.getBookmarkById(id);
            if (bookmark) {
                bookmark.category = category;
                if (bookmark.tags && bookmark.tags.length > 0) {
                    const oldCategoryTag = bookmark.tags.find(t =>
                        this.categoryManager.getCategories().includes(t)
                    );
                    if (oldCategoryTag) {
                        bookmark.tags = bookmark.tags.filter(t => t !== oldCategoryTag);
                    }
                }
            }
        });

        this.clearSelection();
        this.pendingMoveIds = [];
        this.uiManager.hideModal();
        if (this.uiManager) this.uiManager.showToast(`✅ Moved ${ids.length} bookmark(s) to "${category}"`, '📂');
        if (window.app) {
            window.app.saveData();
            window.app.renderAll();
        }
    }

    // ----- Helper: Get selected IDs from UI -----
    getSelectedIdsFromUI() {
        let ids = [...this.selectedIds];
        if (ids.length === 0 && this.uiRenderer) {
            const rendererIds = this.uiRenderer.getSelectedIds();
            if (rendererIds.size > 0) {
                console.log('🔄 Syncing IDs from uiRenderer');
                this.selectedIds = rendererIds;
                ids = [...this.selectedIds];
            }
        }
        return ids;
    }
}
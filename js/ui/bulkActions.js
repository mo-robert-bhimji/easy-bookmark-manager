// ========================================
// 📦 BULK ACTIONS
// ========================================

export class BulkActions {
    constructor(bookmarkManager, categoryManager, uiManager, uiRenderer, aiClassifier) {
        this.bookmarkManager = bookmarkManager;
        this.categoryManager = categoryManager;
        this.uiManager = uiManager;
        this.uiRenderer = uiRenderer;
        this.aiClassifier = aiClassifier;
        this.selectedIds = new Set();

        this.actionBar = document.getElementById('actionBar');
        this.selectToggleBtn = document.getElementById('selectToggleBtn');
        this.selectionCount = document.getElementById('selectionCount');
        this.bulkArchiveBtn = document.getElementById('bulkArchiveBtn');
        this.bulkUnarchiveBtn = document.getElementById('bulkUnarchiveBtn');
        this.bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
        this.bulkMoveBtn = document.getElementById('bulkMoveBtn');
    }

    getSelectedIds() {
        return Array.from(this.selectedIds);
    }

    getSelectedCount() {
        return this.selectedIds.size;
    }

    clearSelection() {
        this.selectedIds.clear();
        if (this.uiRenderer) {
            this.uiRenderer.clearSelection();
        }
        this.updateUI();
    }

    toggleSelectAll(visibleIds) {
        if (!visibleIds || visibleIds.length === 0) return;

        const allSelected = visibleIds.every(id => this.selectedIds.has(id));

        if (allSelected) {
            visibleIds.forEach(id => this.selectedIds.delete(id));
            if (this.uiRenderer) {
                this.uiRenderer.clearSelection();
            }
        } else {
            visibleIds.forEach(id => this.selectedIds.add(id));
            if (this.uiRenderer) {
                this.uiRenderer.toggleSelectAll(true, visibleIds);
            }
        }
        this.updateUI();
    }

    updateUI(selectedIds = null) {
        if (selectedIds) {
            this.selectedIds = new Set(selectedIds);
        }

        const count = this.selectedIds.size;

        if (this.selectToggleBtn) {
            const visibleIds = this.getVisibleIds();
            const allSelected = visibleIds.length > 0 && visibleIds.every(id => this.selectedIds.has(id));

            if (allSelected && visibleIds.length > 0) {
                this.selectToggleBtn.textContent = '✕ Clear Selection';
            } else {
                this.selectToggleBtn.textContent = '☑ Select All';
            }
        }

        if (this.selectionCount) {
            this.selectionCount.textContent = `${count} selected`;
        }

        if (this.actionBar) {
            this.actionBar.style.display = 'flex';
            this.actionBar.classList.add('visible');
        }

        const hasSelection = count > 0;
        if (this.bulkArchiveBtn) {
            this.bulkArchiveBtn.disabled = !hasSelection;
            this.bulkArchiveBtn.textContent = '📥 Archive';
        }
        if (this.bulkUnarchiveBtn) {
            this.bulkUnarchiveBtn.disabled = !hasSelection;
            this.bulkUnarchiveBtn.textContent = '📤 Unarchive';
        }
        if (this.bulkDeleteBtn) {
            this.bulkDeleteBtn.disabled = !hasSelection;
            this.bulkDeleteBtn.textContent = '🗑️ Delete';
        }
        if (this.bulkMoveBtn) {
            this.bulkMoveBtn.disabled = !hasSelection;
            this.bulkMoveBtn.textContent = '📂 Move To';
        }
    }

    getVisibleIds() {
        const ids = [];
        const grid = document.getElementById('bookmarksGrid');
        if (!grid) return ids;

        grid.querySelectorAll('.bookmark-card').forEach(card => {
            if (card.dataset.id) ids.push(card.dataset.id);
        });

        grid.querySelectorAll('.stack-container .bookmark-card').forEach(card => {
            if (card.dataset.id && !ids.includes(card.dataset.id)) {
                ids.push(card.dataset.id);
            }
        });

        return ids;
    }

    bulkArchive() {
        const ids = this.getSelectedIds();
        if (ids.length === 0) return;
        if (confirm(`📥 Archive ${ids.length} selected bookmark(s)?`)) {
            this.bulkArchiveIds(ids);
        }
    }

    bulkArchiveIds(ids) {
        let archived = 0;
        ids.forEach(id => {
            const bookmark = this.bookmarkManager.archiveBookmark(id);
            if (bookmark && bookmark.isArchived) archived++;
        });
        this.clearSelection();
        this.uiManager.showToast(`✅ Archived ${archived} bookmark(s)`, '📥');
        if (window.app && window.app.renderAll) window.app.renderAll();
    }

    bulkUnarchive() {
        const ids = this.getSelectedIds();
        if (ids.length === 0) return;
        if (confirm(`📤 Unarchive ${ids.length} selected bookmark(s)?`)) {
            this.bulkUnarchiveIds(ids);
        }
    }

    bulkUnarchiveIds(ids) {
        let unarchived = 0;
        ids.forEach(id => {
            const bookmark = this.bookmarkManager.archiveBookmark(id);
            if (bookmark && !bookmark.isArchived) unarchived++;
        });
        this.clearSelection();
        this.uiManager.showToast(`✅ Unarchived ${unarchived} bookmark(s)`, '📤');
        if (window.app && window.app.renderAll) window.app.renderAll();
    }

    bulkDelete() {
        const ids = this.getSelectedIds();
        if (ids.length === 0) return;
        if (confirm(`⚠️ PERMANENTLY DELETE ${ids.length} selected bookmark(s)?\n\nThis cannot be undone!`)) {
            this.bulkDeleteIds(ids);
        }
    }

    bulkDeleteIds(ids) {
        let deleted = 0;
        ids.forEach(id => {
            const result = this.bookmarkManager.deleteBookmark(id);
            if (result) deleted++;
        });
        this.clearSelection();
        this.uiManager.showToast(`🗑️ Deleted ${deleted} bookmark(s)`, '🗑️');
        if (window.app && window.app.renderAll) window.app.renderAll();
    }

    showMoveModal() {
        const ids = this.getSelectedIds();
        if (ids.length === 0) return;

        const categories = this.categoryManager.getCategories().filter(c => c !== 'All');
        let options = categories.map(c => `<option value="${c}">${c}</option>`).join('');

        const content = `
            <div class="form-group">
                <label>Move ${ids.length} selected bookmark(s) to category:</label>
                <select id="moveCategorySelect" style="width:100%; padding:0.6rem 1rem; border:1px solid var(--border); border-radius:8px; font-size:0.95rem; background:var(--bg-secondary); color:var(--text-primary);">
                    ${options}
                </select>
            </div>
            <div class="form-actions">
                <button id="moveConfirmBtn" class="btn btn-primary">📂 Move</button>
                <button class="btn btn-secondary" onclick="document.getElementById('modal').style.display='none'">Cancel</button>
            </div>
        `;

        this.uiManager.showModal('📂 Move To Category', content);

        document.getElementById('moveConfirmBtn')?.addEventListener('click', () => {
            const category = document.getElementById('moveCategorySelect')?.value;
            if (category) {
                this.bulkMoveToCategory(ids, category);
                this.uiManager.hideModal();
            }
        });
    }

    bulkMoveToCategory(ids, category) {
        let moved = 0;
        ids.forEach(id => {
            const bookmark = this.bookmarkManager.getBookmark(id);
            if (bookmark && !bookmark.isArchived) {
                bookmark.category = category;
                moved++;
            }
        });
        this.clearSelection();
        this.uiManager.showToast(`📂 Moved ${moved} bookmark(s) to "${category}"`, '📂');
        if (window.app && window.app.renderAll) window.app.renderAll();
    }

    bulkArchiveSelected() { this.bulkArchive(); }
    bulkUnarchiveSelected() { this.bulkUnarchive(); }
    bulkDeleteSelected() { this.bulkDelete(); }
}
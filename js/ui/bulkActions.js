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
        this.selectionCount = document.getElementById('selectionCount');
        this.selectAllCheckbox = document.getElementById('selectAll');
        this.clearSelectionBtn = document.getElementById('clearSelectionBtn');
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

    toggleSelectAll(checked, visibleIds) {
        if (checked) {
            visibleIds.forEach(id => this.selectedIds.add(id));
            if (this.uiRenderer) {
                this.uiRenderer.toggleSelectAll(true, visibleIds);
            }
        } else {
            this.clearSelection();
        }
        this.updateUI();
    }

    updateUI(selectedIds = null) {
        if (selectedIds) {
            this.selectedIds = new Set(selectedIds);
        }

        const count = this.selectedIds.size;

        // Update selection count
        if (this.selectionCount) {
            this.selectionCount.textContent = `${count} selected`;
        }

        // Show/hide action bar
        if (this.actionBar) {
            if (count > 0) {
                this.actionBar.classList.add('visible');
                this.actionBar.style.display = 'flex';
            } else {
                this.actionBar.classList.remove('visible');
                this.actionBar.style.display = 'none';
            }
        }

        // Enable/disable bulk buttons
        const hasSelection = count > 0;
        if (this.bulkArchiveBtn) this.bulkArchiveBtn.disabled = !hasSelection;
        if (this.bulkUnarchiveBtn) this.bulkUnarchiveBtn.disabled = !hasSelection;
        if (this.bulkDeleteBtn) this.bulkDeleteBtn.disabled = !hasSelection;
        if (this.bulkMoveBtn) this.bulkMoveBtn.disabled = !hasSelection;

        // Update select all checkbox
        if (this.selectAllCheckbox) {
            const visibleIds = this.getVisibleIds();
            const allSelected = visibleIds.every(id => this.selectedIds.has(id));
            this.selectAllCheckbox.checked = allSelected && visibleIds.length > 0;
            this.selectAllCheckbox.indeterminate = !allSelected && visibleIds.some(id => this.selectedIds.has(id));
        }

        // Show/hide clear button
        if (this.clearSelectionBtn) {
            this.clearSelectionBtn.style.display = count > 0 ? 'inline-block' : 'none';
        }
    }

    getVisibleIds() {
        const ids = [];
        document.querySelectorAll('.bookmark-card').forEach(card => {
            if (card.dataset.id) ids.push(card.dataset.id);
        });
        document.querySelectorAll('.stack-container .bookmark-card').forEach(card => {
            if (card.dataset.id) ids.push(card.dataset.id);
        });
        return ids;
    }

    bulkArchive() {
        const ids = this.getSelectedIds();
        if (ids.length === 0) return;
        if (confirm(`Archive ${ids.length} selected bookmark(s)?`)) {
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
        if (this.bookmarkManager.saveData) this.bookmarkManager.saveData();
        if (window.app && window.app.renderAll) window.app.renderAll();
    }

    bulkUnarchive() {
        const ids = this.getSelectedIds();
        if (ids.length === 0) return;
        if (confirm(`Unarchive ${ids.length} selected bookmark(s)?`)) {
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
        if (this.bookmarkManager.saveData) this.bookmarkManager.saveData();
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
        if (this.bookmarkManager.saveData) this.bookmarkManager.saveData();
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
        if (this.bookmarkManager.saveData) this.bookmarkManager.saveData();
        if (window.app && window.app.renderAll) window.app.renderAll();
    }

    // Legacy method names for compatibility
    bulkArchiveSelected() { this.bulkArchive(); }
    bulkUnarchiveSelected() { this.bulkUnarchive(); }
    bulkDeleteSelected() { this.bulkDelete(); }
}
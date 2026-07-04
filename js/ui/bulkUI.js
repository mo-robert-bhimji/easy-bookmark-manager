// ========================================
// 📦 BULK UI - Action Bar Management
// ========================================

export class BulkUI {
    constructor() {
        this.elements = this.getElements();
    }

    getElements() {
        return {
            selectAll: document.getElementById('selectAll'),
            selectionCount: document.getElementById('selectionCount'),
            clearBtn: document.getElementById('clearSelectionBtn'),
            bulkArchiveBtn: document.getElementById('bulkArchiveBtn'),
            bulkUnarchiveBtn: document.getElementById('bulkUnarchiveBtn'),
            bulkDeleteBtn: document.getElementById('bulkDeleteBtn'),
            bulkMoveBtn: document.getElementById('bulkMoveBtn'),
            actionBar: document.getElementById('actionBar')
        };
    }

    updateUI(selectedIds, visibleIds) {
        const count = selectedIds.size;
        const el = this.elements;

        // Show/hide action bar
        if (el.actionBar) {
            if (count > 0) {
                el.actionBar.style.display = 'flex';
                el.actionBar.classList.add('visible');
            } else {
                el.actionBar.style.display = 'none';
                el.actionBar.classList.remove('visible');
            }
        }

        // Update selection count
        if (el.selectionCount) {
            el.selectionCount.textContent = count === 0 ? '0 selected' : `${count} selected`;
        }

        // Update select all checkbox
        if (el.selectAll) {
            if (visibleIds && visibleIds.length > 0 && count === visibleIds.length && count > 0) {
                el.selectAll.checked = true;
                el.selectAll.indeterminate = false;
            } else if (count > 0) {
                el.selectAll.checked = false;
                el.selectAll.indeterminate = true;
            } else {
                el.selectAll.checked = false;
                el.selectAll.indeterminate = false;
            }
        }

        // Clear button
        if (el.clearBtn) {
            el.clearBtn.style.display = count > 0 ? 'inline-block' : 'none';
        }

        // Action buttons
        const hasSelection = count > 0;
        if (el.bulkArchiveBtn) el.bulkArchiveBtn.disabled = !hasSelection;
        if (el.bulkUnarchiveBtn) el.bulkUnarchiveBtn.disabled = !hasSelection;
        if (el.bulkDeleteBtn) el.bulkDeleteBtn.disabled = !hasSelection;
        if (el.bulkMoveBtn) el.bulkMoveBtn.disabled = !hasSelection;
    }
}
// ========================================
// 🔗 EVENT HANDLERS
// ========================================

export function setupEventListeners(app) {
    const el = app.uiManager.elements;

    // ----- Main Buttons -----
    if (el.importBtn) el.importBtn.addEventListener('click', () => app.showImportModal());
    document.getElementById('fileInput')?.addEventListener('change', (e) => app.handleFileImport(e));
    if (el.exportBtn) el.exportBtn.addEventListener('click', () => app.showExportModal());
    if (el.classifyBtn) el.classifyBtn.addEventListener('click', () => app.startClassification());

    // ----- Link Check Button (opens config modal) -----
    document.getElementById('checkLinksBtn')?.addEventListener('click', () => {
        app.openLinkCheckConfig();
    });

    // ----- Clear Thumbnail Cache Button -----
    document.getElementById('clearThumbnailCacheBtn')?.addEventListener('click', () => {
        app.clearThumbnailCache();
    });

    // ----- Search -----
    if (el.searchBtn) el.searchBtn.addEventListener('click', () => app.handleSearch());
    if (el.searchInput) el.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') app.handleSearch();
    });

    // ----- Sort -----
    if (el.sortSelect) el.sortSelect.addEventListener('change', (e) => {
        app.sortOption = e.target.value;
        if (app.bulkActions) app.bulkActions.clearSelection();
        app.saveData();
        app.renderAll();
    });

    // ----- Categories -----
    if (el.addCategoryBtn) el.addCategoryBtn.addEventListener('click', () => app.addNewCategory());

    // ----- Archive Toggle -----
    if (el.showArchivedBtn) el.showArchivedBtn.addEventListener('click', () => {
        app.showArchived = !app.showArchived;
        if (app.bulkActions) app.bulkActions.clearSelection();
        el.showArchivedBtn.textContent = app.showArchived ? '📁 Show Active' : '🗄️ Show Archived';
        app.saveData();
        app.renderAll();
    });

    // ----- Clear All -----
    if (el.clearAllBtn) el.clearAllBtn.addEventListener('click', () => app.clearAllBookmarks());

    // ----- Progress Controls -----
    if (el.progressToggle) el.progressToggle.addEventListener('click', () => app.uiManager.toggleProgress());
    if (el.progressStartBtn) el.progressStartBtn.addEventListener('click', () => app.startClassification());
    if (el.progressPauseBtn) el.progressPauseBtn.addEventListener('click', () => app.togglePauseClassification());
    if (el.progressStopBtn) el.progressStopBtn.addEventListener('click', () => app.stopClassification());
    if (el.progressClearLogBtn) el.progressClearLogBtn.addEventListener('click', () => app.clearProgressLog());

    // ----- Error Log & Thumbnails -----
    document.getElementById('downloadErrorLogBtn')?.addEventListener('click', () => app.downloadErrorLog());

    // ----- STATUS FILTERS -----
    document.querySelectorAll('.status-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            const status = btn.dataset.status;
            if (app.statusFilter === status && status !== 'all') {
                app.setStatusFilter('all');
            } else if (status === 'all' && app.statusFilter === 'all') {
                return;
            } else {
                app.setStatusFilter(status);
            }
            document.querySelectorAll('.status-filter').forEach(b => {
                b.classList.toggle('active', b.dataset.status === app.statusFilter);
            });
        });
    });

    // ----- BULK ACTION LISTENERS -----
    // Select All / Clear Selection Toggle Button
    document.getElementById('selectToggleBtn')?.addEventListener('click', () => {
        if (app.bulkActions) {
            const visibleIds = app.getVisibleBookmarkIds();
            app.bulkActions.toggleSelectAll(visibleIds);
        }
    });

    document.getElementById('bulkArchiveBtn')?.addEventListener('click', () => {
        if (app.bulkActions) app.bulkActions.bulkArchiveSelected();
    });

    document.getElementById('bulkUnarchiveBtn')?.addEventListener('click', () => {
        if (app.bulkActions) app.bulkActions.bulkUnarchiveSelected();
    });

    document.getElementById('bulkDeleteBtn')?.addEventListener('click', () => {
        if (app.bulkActions) app.bulkActions.bulkDeleteSelected();
    });

    document.getElementById('bulkMoveBtn')?.addEventListener('click', () => {
        if (app.bulkActions) app.bulkActions.showMoveModal();
    });

    // ----- Keyboard Shortcuts -----
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            if (el.searchInput) el.searchInput.focus();
        }
        if (e.key === 'Escape') {
            if (app.bulkActions) app.bulkActions.clearSelection();
            if (app.expandView.isActive) {
                app.expandView.hide();
            } else if (app.linkCheckUI?.isOpen) {
                app.linkCheckUI.close();
            } else if (app.linkCheckHandlers?.isConfigOpen) {
                app.linkCheckHandlers.closeLinkCheckConfig();
            } else {
                if (el.searchInput) {
                    el.searchInput.value = '';
                    app.searchQuery = '';
                    app.letterFilter = null;
                    app.statusFilter = 'all';
                    app.alphabetNav.clearFilter();
                    app.renderAll();
                }
                app.uiManager.hideModal();
                app.popupManager.closeAllPopups();
            }
        }
    });

    // ----- Modal Close -----
    document.getElementById('modal')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('modal')) app.uiManager.hideModal();
    });
    document.querySelector('.modal-close')?.addEventListener('click', () => app.uiManager.hideModal());
}
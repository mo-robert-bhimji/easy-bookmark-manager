// ========================================
// 🎨 RENDER HANDLERS - COMPLETE
// ========================================

import { SearchHelpers } from '../utils/searchHelpers.js';

export class RenderHandlers {
    constructor(app) {
        this.app = app;
    }

    renderAll() {
        this.renderCategories();
        this.renderBookmarks();
        this.renderStats();
        this.renderImportHistory();

        // Update status filter button states
        document.querySelectorAll('.status-filter').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.status === this.app.statusFilter);
        });

        if (this.app.classificationManager) {
            this.app.uiManager.updateProgress({
                total: this.app.classificationManager.totalToClassify || 0,
                classified: this.app.classificationManager.classifiedCount || 0,
                isRunning: this.app.classificationManager.isRunning || false,
                isPaused: this.app.classificationManager.isPaused || false,
                isCancelled: this.app.classificationManager.isCancelled || false,
                apiCalls: this.app.classificationManager.apiCalls || 0,
                startTime: this.app.classificationManager.startTime || null
            });
        }

        if (this.app.bulkActions) {
            this.app.bulkActions.updateUI(this.app.bulkActions.getSelectedIds());
        }

        const isComplete = this.app.classificationManager?.classifiedCount === this.app.classificationManager?.totalToClassify && this.app.classificationManager?.totalToClassify > 0;
        const progressSectionEl = document.querySelector('.progress-section');
        if (progressSectionEl && isComplete) {
            progressSectionEl.style.display = 'none';
            progressSectionEl.classList.remove('active');
        }
    }

    renderCategories() {
        const bookmarks = this.app.bookmarkManager.getBookmarks();
        const categories = this.app.categoryManager.getCategories();
        const counts = this.app.categoryManager.getCategoryCounts(bookmarks);
        this.app.uiManager.renderCategories(categories, this.app.currentCategory, counts);

        const list = this.app.uiManager.elements.categoriesList;
        if (list) {
            list.querySelectorAll('li').forEach((li, index) => {
                li.addEventListener('click', () => {
                    if (this.app.bulkActions) this.app.bulkActions.clearSelection();
                    this.app.switchCategory(categories[index]);
                });
            });
        }
    }

    renderBookmarks(filteredData = null, title = null) {
        const grid = this.app.uiManager.elements.bookmarksGrid;
        const titleEl = this.app.uiManager.elements.currentCategoryTitle;
        const countEl = this.app.uiManager.elements.bookmarkCount;
        if (!grid) return;

        let bookmarksToShow = filteredData || this.app.bookmarkManager.getBookmarks();

        // Handle "Archived" category
        if (this.app.currentCategory === 'Archived') {
            bookmarksToShow = bookmarksToShow.filter(b => b.isArchived);
            const originalShowArchived = this.app.showArchived;
            this.app.showArchived = true;
        }

        // Handle link status filter
        if (this.app.statusFilter && this.app.statusFilter !== 'all') {
            bookmarksToShow = bookmarksToShow.filter(b =>
                b.linkStatus && b.linkStatus.status === this.app.statusFilter
            );
        }

        const letterFilter = this.app.alphabetNav.getFilter();
        if (letterFilter) {
            bookmarksToShow = bookmarksToShow.filter(b => {
                if (!this.app.showArchived && b.isArchived) return false;
                const firstChar = SearchHelpers.getDomainFirstLetter(b);
                return firstChar === letterFilter;
            });
        }

        if (!this.app.showArchived && this.app.currentCategory !== 'Archived') {
            bookmarksToShow = bookmarksToShow.filter(b => !b.isArchived);
        }

        if (!filteredData && this.app.currentCategory !== 'All' && this.app.currentCategory !== 'Archived') {
            bookmarksToShow = bookmarksToShow.filter(b => b.category === this.app.currentCategory);
        }

        if (this.app.searchQuery && !filteredData) {
            bookmarksToShow = SearchHelpers.filterBookmarks(bookmarksToShow, this.app.searchQuery, this.app.showArchived);
        }

        bookmarksToShow = this.app.bookmarkManager.sortBookmarks(bookmarksToShow, this.app.sortOption);

        const { stacks, singles } = this.app.bookmarkManager.groupBookmarks(bookmarksToShow);
        const archivedBookmarks = this.app.showArchived ? bookmarksToShow.filter(b => b.isArchived) : [];

        this.app.alphabetNav.render(this.app.bookmarkManager.getBookmarks());

        // Title - only show category name, not filter text
        let titleText = title || (this.app.searchQuery ? `Search: "${this.app.searchQuery}"` : this.app.currentCategory);
        if (letterFilter) {
            titleText += ` • Letter: ${letterFilter.toUpperCase()}`;
        }
        // Status filter is shown via the active button, not in the title
        if (titleEl) titleEl.textContent = titleText;

        const totalBookmarksInStacks = stacks.reduce((sum, stack) => sum + stack.length, 0);
        const totalCount = singles.length + totalBookmarksInStacks + archivedBookmarks.length;
        if (countEl) countEl.textContent = `${totalCount} bookmarks`;

        if (totalCount === 0) {
            let emptyMessage = 'No bookmarks found';
            if (letterFilter) {
                emptyMessage = `No bookmarks starting with "${letterFilter.toUpperCase()}"`;
            } else if (this.app.statusFilter && this.app.statusFilter !== 'all') {
                const statusLabels = {
                    'verified': '✅ Verified',
                    'broken': '❌ Broken',
                    'redirect': '⚠️ Redirect',
                    'timeout': '⏱️ Timeout',
                    'error': '❓ Error'
                };
                emptyMessage = `No bookmarks with status "${statusLabels[this.app.statusFilter] || this.app.statusFilter}"`;
            }
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📭</div>
                    <h3>${emptyMessage}</h3>
                    <p>${filteredData || this.app.searchQuery || letterFilter || (this.app.statusFilter && this.app.statusFilter !== 'all') ? 'Try a different filter or search term.' : 'Import bookmarks or switch to another category.'}</p>
                    ${(letterFilter || (this.app.statusFilter && this.app.statusFilter !== 'all')) ? '<button class="btn btn-secondary" onclick="app.alphabetNav.clearFilter();app.setStatusFilter(\'all\');app.renderAll();">Clear Filters</button>' : ''}
                </div>
            `;
            return;
        }

        grid.innerHTML = '';

        // Render singles
        singles.forEach(bookmark => {
            const card = this.app.uiRenderer.createBookmarkCard(bookmark, {
                onDelete: (id) => this.app.deleteBookmark(id),
                onArchive: (id) => this.app.archiveBookmark(id)
            });
            grid.appendChild(card);
        });

        // Render stacks - ensure proper stacking
        stacks.forEach(stack => {
            if (stack.length > 1) {
                const firstBookmark = stack[0];
                const isDomainStack = stack.some(b => b.url !== firstBookmark.url);

                const container = this.app.stackRenderer.createStackedCard(stack, {
                    onDelete: (id) => this.app.deleteBookmark(id),
                    onArchive: (id) => this.app.archiveBookmark(id),
                    onBulkArchive: (ids) => {
                        if (this.app.bulkActions) this.app.bulkActions.bulkArchive(ids);
                    },
                    onBulkDelete: (ids) => {
                        if (this.app.bulkActions) this.app.bulkActions.bulkDelete(ids);
                    },
                    isDomainStack: isDomainStack
                });
                grid.appendChild(container);
            } else {
                // If only 1, render as single
                const card = this.app.uiRenderer.createBookmarkCard(stack[0], {
                    onDelete: (id) => this.app.deleteBookmark(id),
                    onArchive: (id) => this.app.archiveBookmark(id)
                });
                grid.appendChild(card);
            }
        });

        if (this.app.showArchived) {
            archivedBookmarks.forEach(bookmark => {
                const card = this.app.uiRenderer.createBookmarkCard(bookmark, {
                    onDelete: (id) => this.app.deleteBookmark(id),
                    onArchive: (id) => this.app.archiveBookmark(id)
                });
                grid.appendChild(card);
            });
        }

        if (this.app.bulkActions) {
            this.app.bulkActions.updateUI(this.app.bulkActions.getSelectedIds());
        }

        // Restore showArchived if we changed it for "Archived" category
        if (this.app.currentCategory === 'Archived') {
            this.app.showArchived = false;
        }
    }

    renderStats() {
        const stats = this.app.bookmarkManager.getStats();
        const el = this.app.uiManager.elements.stats;
        if (!el) return;

        const total = stats.total || 0;
        const active = stats.active || 0;
        const archived = stats.archived || 0;
        const categories = this.app.categoryManager.getCategories().length || 0;

        el.innerHTML = `
            <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
                <div><strong>${active}</strong> active bookmarks</div>
                <div><strong>${archived}</strong> archived</div>
                <div><strong>${categories}</strong> categories</div>
                <div style="font-size: 0.75rem; margin-top: 0.25rem; color: var(--text-secondary);">
                    ${this.app.isClassificationComplete ? '✅ Classification complete' : '⏳ Classification partial'}
                </div>
            </div>
        `;
    }

    renderImportHistory() {
        const history = this.app.importManager ? this.app.importManager.getImportHistory() : [];
        this.app.uiManager.renderImportHistory(history);
    }
}
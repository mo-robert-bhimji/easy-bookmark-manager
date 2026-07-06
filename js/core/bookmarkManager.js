// ========================================
// 📚 BOOKMARK MANAGER - COMPLETE
// ========================================

export class BookmarkManager {
    constructor() {
        this.bookmarks = [];
        this.currentCategory = 'All';
        this.currentLetter = null;
        this.showArchived = false;
        this.importHistory = [];
    }

    // ----- CRUD Operations -----

    getBookmarks() {
        return this.bookmarks;
    }

    setBookmarks(bookmarks) {
        this.bookmarks = bookmarks || [];
        this.updateNewestFlag();
        return this.bookmarks;
    }

    getBookmark(id) {
        return this.bookmarks.find(b => b.id === id);
    }

    addBookmark(bookmark) {
        if (!bookmark.id) {
            bookmark.id = this.generateId();
        }
        this.bookmarks.push(bookmark);
        this.updateNewestFlag();
        return bookmark;
    }

    addBookmarks(newBookmarks) {
        if (!newBookmarks || newBookmarks.length === 0) return [];
        const added = [];
        newBookmarks.forEach(b => {
            if (!b.id) b.id = this.generateId();
            this.bookmarks.push(b);
            added.push(b);
        });
        this.updateNewestFlag();
        return added;
    }

    deleteBookmark(id) {
        const index = this.bookmarks.findIndex(b => b.id === id);
        if (index === -1) return false;
        this.bookmarks.splice(index, 1);
        this.updateNewestFlag();
        return true;
    }

    archiveBookmark(id) {
        const bookmark = this.getBookmark(id);
        if (!bookmark) return null;
        bookmark.isArchived = !bookmark.isArchived;
        bookmark.archivedDate = bookmark.isArchived ? new Date().toISOString() : null;
        this.updateNewestFlag();
        return bookmark;
    }

    updateBookmark(id, updates) {
        const bookmark = this.getBookmark(id);
        if (!bookmark) return null;
        Object.assign(bookmark, updates);
        this.updateNewestFlag();
        return bookmark;
    }

    clearAll() {
        this.bookmarks = [];
        this.importHistory = [];
        this.currentCategory = 'All';
        this.currentLetter = null;
        this.showArchived = false;
        this.updateNewestFlag();
    }

    getActiveBookmarks() {
        return this.bookmarks.filter(b => !b.isArchived);
    }

    getArchivedBookmarks() {
        return this.bookmarks.filter(b => b.isArchived);
    }

    // ----- Stats -----

    getStats() {
        const total = this.bookmarks.length;
        const active = this.bookmarks.filter(b => !b.isArchived).length;
        const archived = this.bookmarks.filter(b => b.isArchived).length;
        const categories = new Set(this.bookmarks.map(b => b.category).filter(c => c));
        return {
            total,
            active,
            archived,
            categories: categories.size
        };
    }

    // ----- Grouping -----

    /**
     * Group bookmarks by domain for stacking
     * Returns { stacks, singles }
     * - stacks: array of arrays, each containing bookmarks with the same domain (different URLs)
     * - singles: array of bookmarks that don't belong to any stack
     */
    groupBookmarks(bookmarks) {
        const stacks = [];
        const singles = [];
        const processed = new Set();

        // First, group by domain
        const domainMap = {};
        bookmarks.forEach(b => {
            const domain = b.domain || 'unknown';
            if (!domainMap[domain]) domainMap[domain] = [];
            domainMap[domain].push(b);
        });

        // For each domain with more than 1 bookmark, create a stack
        for (const domain in domainMap) {
            const group = domainMap[domain];
            if (group.length > 1) {
                // Check if they have different URLs (true stack) or same URL (duplicates)
                const uniqueUrls = new Set(group.map(b => b.url));
                if (uniqueUrls.size > 1) {
                    // Different URLs = domain stack
                    stacks.push(group);
                    group.forEach(b => processed.add(b.id));
                } else {
                    // Same URL = duplicates, treat as singles
                    group.forEach(b => {
                        if (!processed.has(b.id)) {
                            singles.push(b);
                            processed.add(b.id);
                        }
                    });
                }
            }
        }

        // Remaining bookmarks are singles
        bookmarks.forEach(b => {
            if (!processed.has(b.id)) {
                singles.push(b);
                processed.add(b.id);
            }
        });

        // Sort stacks by size (largest first)
        stacks.sort((a, b) => b.length - a.length);

        return { stacks, singles };
    }

    // ----- Sorting -----

    sortBookmarks(bookmarks, sortOption) {
        const sorted = [...bookmarks];
        switch (sortOption) {
            case 'date-desc':
                sorted.sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate));
                break;
            case 'date-asc':
                sorted.sort((a, b) => new Date(a.addedDate) - new Date(b.addedDate));
                break;
            case 'title':
                sorted.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'url':
                sorted.sort((a, b) => (a.url || '').localeCompare(b.url || ''));
                break;
            case 'category':
                sorted.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
                break;
            default:
                sorted.sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate));
        }
        return sorted;
    }

    // ----- Category -----

    getCurrentCategory() {
        return this.currentCategory;
    }

    setCurrentCategory(category) {
        this.currentCategory = category || 'All';
    }

    // ----- Letter Filter -----

    getCurrentLetter() {
        return this.currentLetter;
    }

    setCurrentLetter(letter) {
        this.currentLetter = letter;
    }

    // ----- Archived -----

    getShowArchived() {
        return this.showArchived;
    }

    setShowArchived(show) {
        this.showArchived = show;
    }

    toggleShowArchived() {
        this.showArchived = !this.showArchived;
        return this.showArchived;
    }

    // ----- Import History -----

    getImportHistory() {
        return this.importHistory;
    }

    addImportHistory(entry) {
        this.importHistory.push(entry);
        if (this.importHistory.length > 50) {
            this.importHistory.shift();
        }
        return this.importHistory;
    }

    clearImportHistory() {
        this.importHistory = [];
    }

    // ----- Newest Flag -----

    updateNewestFlag() {
        // Reset all newest flags
        this.bookmarks.forEach(b => b.isNewest = false);
        if (this.bookmarks.length === 0) return;

        // Find the 5 most recently added bookmarks
        const sorted = [...this.bookmarks].sort((a, b) =>
            new Date(b.addedDate) - new Date(a.addedDate)
        );
        sorted.slice(0, 5).forEach(b => b.isNewest = true);
    }

    // ----- ID Generation -----

    generateId() {
        return 'bm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
    }

    // ----- Data Export -----

    toJSON() {
        return {
            bookmarks: this.bookmarks,
            currentCategory: this.currentCategory,
            currentLetter: this.currentLetter,
            showArchived: this.showArchived,
            importHistory: this.importHistory
        };
    }

    fromJSON(data) {
        if (!data) return;
        this.bookmarks = data.bookmarks || [];
        this.currentCategory = data.currentCategory || 'All';
        this.currentLetter = data.currentLetter || null;
        this.showArchived = data.showArchived || false;
        this.importHistory = data.importHistory || [];
        this.updateNewestFlag();
    }
}
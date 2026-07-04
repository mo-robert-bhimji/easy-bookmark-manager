// ========================================
// 📚 BOOKMARK MANAGER - COMPLETE
// ========================================

export class BookmarkManager {
    constructor() {
        this.bookmarks = [];
    }

    setBookmarks(bookmarks) {
        this.bookmarks = bookmarks || [];
    }

    getBookmarks() {
        return this.bookmarks;
    }

    // ----- Get a single bookmark by ID (ADD THIS) -----
    getBookmarkById(id) {
        return this.bookmarks.find(b => b.id === id);
    }

    getActiveBookmarks() {
        return this.bookmarks.filter(b => !b.isArchived);
    }

    getArchivedBookmarks() {
        return this.bookmarks.filter(b => b.isArchived);
    }

    addBookmarks(newBookmarks) {
        this.bookmarks = [...this.bookmarks, ...newBookmarks];
        return this.bookmarks;
    }

    deleteBookmark(id) {
        this.bookmarks = this.bookmarks.filter(b => b.id !== id);
        return this.bookmarks;
    }

    archiveBookmark(id) {
        const bookmark = this.getBookmarkById(id);
        if (bookmark) {
            bookmark.isArchived = !bookmark.isArchived;
            bookmark.archivedDate = bookmark.isArchived ? new Date().toISOString() : null;
        }
        return bookmark;
    }

    bulkArchive(ids) {
        ids.forEach(id => {
            const bookmark = this.getBookmarkById(id);
            if (bookmark) {
                bookmark.isArchived = true;
                bookmark.archivedDate = new Date().toISOString();
            }
        });
        return this.bookmarks;
    }

    bulkDelete(ids) {
        this.bookmarks = this.bookmarks.filter(b => !ids.includes(b.id));
        return this.bookmarks;
    }

    clearAll() {
        this.bookmarks = [];
        return this.bookmarks;
    }

    findNewBookmarks(importedBookmarks) {
        const existingUrls = new Set(this.bookmarks.map(b => b.url));
        return importedBookmarks.filter(b => !existingUrls.has(b.url));
    }

    getStats() {
        return {
            total: this.bookmarks.length,
            active: this.getActiveBookmarks().length,
            archived: this.getArchivedBookmarks().length
        };
    }

    // ----- Helper: Clean title for sorting -----
    cleanTitleForSorting(title) {
        if (!title) return '';
        let cleaned = title.replace(/^[\s:.\-_\[\]\(\)\{\}\<\>\"\'\,\;\|\!\?\*\&\^\%\$\#\@\~\`\\\/]+/, '');
        cleaned = cleaned.replace(/^[\d]+[\s\.\-\)\:]+/, '');
        return cleaned.trim().toLowerCase();
    }

    sortBookmarks(bookmarks, sortOption) {
        const sorted = [...bookmarks];
        switch(sortOption) {
            case 'date-desc':
                sorted.sort((a, b) => {
                    const dateA = a.addedDate ? new Date(a.addedDate).getTime() : 0;
                    const dateB = b.addedDate ? new Date(b.addedDate).getTime() : 0;
                    return dateB - dateA;
                });
                break;
            case 'date-asc':
                sorted.sort((a, b) => {
                    const dateA = a.addedDate ? new Date(a.addedDate).getTime() : 0;
                    const dateB = b.addedDate ? new Date(b.addedDate).getTime() : 0;
                    if (dateA > 0 && dateB > 0) return dateA - dateB;
                    if (dateA > 0 && dateB === 0) return -1;
                    if (dateA === 0 && dateB > 0) return 1;
                    return 0;
                });
                break;
            case 'title':
                sorted.sort((a, b) => {
                    const titleA = this.cleanTitleForSorting(a.title || '');
                    const titleB = this.cleanTitleForSorting(b.title || '');
                    return titleA.localeCompare(titleB);
                });
                break;
            case 'url':
                sorted.sort((a, b) => {
                    const urlA = (a.url || '').toLowerCase();
                    const urlB = (b.url || '').toLowerCase();
                    return urlA.localeCompare(urlB);
                });
                break;
            case 'category':
                sorted.sort((a, b) => {
                    const catA = (a.category || 'Uncategorized').toLowerCase();
                    const catB = (b.category || 'Uncategorized').toLowerCase();
                    return catA.localeCompare(catB);
                });
                break;
            default:
                sorted.sort((a, b) => {
                    const dateA = a.addedDate ? new Date(a.addedDate).getTime() : 0;
                    const dateB = b.addedDate ? new Date(b.addedDate).getTime() : 0;
                    return dateB - dateA;
                });
        }
        return sorted;
    }

    extractDomain(url) {
        if (!url) return null;
        try {
            const urlObj = new URL(url);
            let hostname = urlObj.hostname;
            if (hostname.startsWith('www.')) {
                hostname = hostname.substring(4);
            }
            return hostname;
        } catch (e) {
            return null;
        }
    }

    groupByUrl(bookmarks) {
        const groups = new Map();
        const singles = [];
        
        bookmarks.forEach(bookmark => {
            if (bookmark.isArchived) return;
            const url = bookmark.url;
            if (groups.has(url)) {
                groups.get(url).push(bookmark);
            } else {
                groups.set(url, [bookmark]);
            }
        });
        
        const stacks = [];
        groups.forEach((group) => {
            if (group.length > 1) {
                stacks.push(group);
            } else {
                singles.push(group[0]);
            }
        });
        
        return { stacks, singles };
    }

    groupByDomain(bookmarks) {
        const groups = new Map();
        const singles = [];
        
        bookmarks.forEach(bookmark => {
            if (bookmark.isArchived) return;
            
            let domain = bookmark.domain;
            if (!domain) {
                domain = this.extractDomain(bookmark.url);
                if (domain) {
                    bookmark.domain = domain;
                }
            }
            
            if (!domain) {
                singles.push(bookmark);
                return;
            }
            
            if (groups.has(domain)) {
                groups.get(domain).push(bookmark);
            } else {
                groups.set(domain, [bookmark]);
            }
        });
        
        const stacks = [];
        const remainingSingles = [];
        groups.forEach((group) => {
            if (group.length > 1) {
                stacks.push(group);
            } else {
                remainingSingles.push(group[0]);
            }
        });
        
        const allSingles = [...singles, ...remainingSingles];
        return { stacks, singles: allSingles };
    }

    groupBookmarks(bookmarks) {
        const { stacks: urlStacks, singles: urlSingles } = this.groupByUrl(bookmarks);
        const { stacks: domainStacks, singles: finalSingles } = this.groupByDomain(urlSingles);
        const allStacks = [...urlStacks, ...domainStacks];
        
        return {
            stacks: allStacks,
            singles: finalSingles
        };
    }
}
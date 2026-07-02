// ========================================
// 📚 BOOKMARK MANAGER - FIXED SORTING
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
        const bookmark = this.bookmarks.find(b => b.id === id);
        if (bookmark) {
            bookmark.isArchived = !bookmark.isArchived;
            bookmark.archivedDate = bookmark.isArchived ? new Date().toISOString() : null;
        }
        return bookmark;
    }

    bulkArchive(ids) {
        ids.forEach(id => {
            const bookmark = this.bookmarks.find(b => b.id === id);
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

    // ----- Helper: Clean title for sorting (removes ALL special characters at start) -----
    cleanTitleForSorting(title) {
        if (!title) return '';
        // Remove leading special characters: :, ., -, _, [, ], (, ), spaces, commas, etc.
        let cleaned = title.replace(/^[\s:.\-_\[\]\(\)\{\}\<\>\"\'\,\;\|\!\?\*\&\^\%\$\#\@\~\`\\\/]+/, '');
        // Also remove leading numbers with dots or dashes (like "1. ", "2- ")
        cleaned = cleaned.replace(/^[\d]+[\s\.\-\)\:]+/, '');
        return cleaned.trim().toLowerCase();
    }

    // ----- Sort bookmarks by various criteria -----
    sortBookmarks(bookmarks, sortOption) {
        const sorted = [...bookmarks];
        switch(sortOption) {
            case 'date-desc':
                // Newest first
                sorted.sort((a, b) => {
                    const dateA = a.addedDate ? new Date(a.addedDate).getTime() : 0;
                    const dateB = b.addedDate ? new Date(b.addedDate).getTime() : 0;
                    return dateB - dateA;
                });
                break;
            case 'date-asc':
                // Oldest first - missing dates go to the end
                sorted.sort((a, b) => {
                    const dateA = a.addedDate ? new Date(a.addedDate).getTime() : 0;
                    const dateB = b.addedDate ? new Date(b.addedDate).getTime() : 0;
                    if (dateA > 0 && dateB > 0) {
                        return dateA - dateB;
                    }
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

    // ----- Extract domain from URL -----
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

    // ----- Group by exact URL (blue badge) -----
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

    // ----- Group by domain (purple badge) -----
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

    // ----- Combined grouping (URL + Domain) -----
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
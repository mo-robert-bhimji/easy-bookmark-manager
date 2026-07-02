// ========================================
// 🔍 SEARCH HELPERS
// Search and filter utility functions
// ========================================

export class SearchHelpers {
    
    // ----- Match search query with wildcard support (* and ?) -----
    static matchesSearch(text, query) {
        if (!query) return true;
        
        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        
        // Convert wildcards to regex pattern
        const pattern = lowerQuery
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
        
        try {
            const regex = new RegExp(pattern);
            return regex.test(lowerText);
        } catch (e) {
            // If regex fails, fallback to simple contains
            return lowerText.includes(lowerQuery);
        }
    }

    // ----- Filter bookmarks by search query -----
    static filterBookmarks(bookmarks, query, showArchived = false) {
        if (!query) return bookmarks;
        
        return bookmarks.filter(b => {
            if (b.isArchived && !showArchived) return false;
            
            const searchable = [
                b.title || '',
                b.url || '',
                b.description || '',
                b.folderPath || '',
                b.folderArray ? b.folderArray.join(' ') : '',
                b.category || '',
                ...(b.tags || []).map(t => t || '')
            ].join(' ');
            
            return this.matchesSearch(searchable, query);
        });
    }

    // ----- Get first letter of domain for alphabetical indexing -----
    static getDomainFirstLetter(bookmark) {
        let domain = bookmark.domain || '';
        if (!domain && bookmark.url) {
            try {
                const urlObj = new URL(bookmark.url);
                domain = urlObj.hostname.replace('www.', '');
            } catch (e) {
                domain = '';
            }
        }
        const firstChar = domain.length > 0 ? domain[0].toLowerCase() : '#';
        return firstChar;
    }

    // ----- Group bookmarks by alphabetical index -----
    static getAlphabeticalIndex(bookmarks) {
        const index = {};
        const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
        
        letters.forEach(letter => {
            index[letter] = [];
        });
        index['#'] = [];
        
        bookmarks.forEach(bookmark => {
            if (bookmark.isArchived) return;
            const firstChar = this.getDomainFirstLetter(bookmark);
            if (letters.includes(firstChar)) {
                index[firstChar].push(bookmark);
            } else {
                index['#'].push(bookmark);
            }
        });
        
        return index;
    }

    // ----- Check if a letter has bookmarks -----
    static hasBookmarksForLetter(bookmarks, letter) {
        const index = this.getAlphabeticalIndex(bookmarks);
        return index[letter] && index[letter].length > 0;
    }
}
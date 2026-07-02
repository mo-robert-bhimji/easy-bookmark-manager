// ========================================
// 📥 IMPORT MANAGER - WITH ANOMALIES CATEGORY
// ========================================

import { BookmarkParser } from '../bookmarkParser.js';

export class ImportManager {
    constructor(bookmarkManager) {
        this.bookmarkManager = bookmarkManager;
        this.parser = new BookmarkParser();
        this.importHistory = [];
    }

    // ----- Import from Chrome HTML -----
    async importFromChromeHtml(content, importNewOnly = true) {
        const newBookmarks = this.parser.parseChromeBookmarks(content);
        
        if (newBookmarks.length === 0) {
            return { success: false, message: 'No bookmarks found in the file.' };
        }
        
        let bookmarksToAdd = newBookmarks;
        let skippedCount = 0;
        
        if (importNewOnly) {
            bookmarksToAdd = this.bookmarkManager.findNewBookmarks(newBookmarks);
            skippedCount = newBookmarks.length - bookmarksToAdd.length;
        }
        
        if (bookmarksToAdd.length === 0) {
            return { 
                success: false, 
                message: `No new bookmarks to import. ${skippedCount} existing bookmark(s) were skipped.`,
                skipped: skippedCount
            };
        }
        
        const batchId = Date.now();
        bookmarksToAdd.forEach(b => {
            b.importBatch = batchId;
            b.isArchived = false;
            if (!b.addedDate) {
                b.addedDate = new Date().toISOString();
            }
        });
        
        this.bookmarkManager.addBookmarks(bookmarksToAdd);
        
        // Count anomalies
        const anomaliesCount = bookmarksToAdd.filter(b => b.category === 'Anomalies').length;
        const anomaliesMsg = anomaliesCount > 0 ? ` (${anomaliesCount} anomalies)` : '';
        
        this.importHistory.push({
            fileName: 'chrome-import',
            batchId: batchId,
            count: bookmarksToAdd.length,
            skipped: skippedCount,
            anomalies: anomaliesCount,
            date: new Date().toISOString(),
            mode: importNewOnly ? 'new-only' : 'full'
        });
        
        return {
            success: true,
            count: bookmarksToAdd.length,
            skipped: skippedCount,
            anomalies: anomaliesCount,
            total: newBookmarks.length
        };
    }

    // ----- Import from JSON export -----
    async importFromJson(content) {
        try {
            const data = JSON.parse(content);
            if (!data.bookmarks || !data.categories) {
                return { success: false, message: 'Invalid JSON file format. Please use a valid export file.' };
            }
            
            this.bookmarkManager.setBookmarks(data.bookmarks);
            this.importHistory = data.importHistory || [];
            
            return {
                success: true,
                count: data.bookmarks.length,
                categories: data.categories,
                isClassificationComplete: data.isClassificationComplete || false
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // ----- Get import history -----
    getImportHistory() {
        return this.importHistory;
    }

    // ----- Clear import history -----
    clearImportHistory() {
        this.importHistory = [];
    }
}
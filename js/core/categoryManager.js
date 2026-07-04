// ========================================
// 📁 CATEGORY MANAGER - COMPLETE (FIXED)
// ========================================

export class CategoryManager {
    constructor() {
        // Initialize with all standard categories including To Review and Anomalies
        this.categories = ['All', 'To Review', 'Anomalies'];
    }

    setCategories(categories) {
        if (!categories || categories.length === 0) {
            this.categories = ['All', 'To Review', 'Anomalies'];
            return this.categories;
        }
        // Always include To Review and Anomalies
        const allCategories = ['All', 'To Review', 'Anomalies', ...categories.filter(c => c !== 'All' && c !== 'To Review' && c !== 'Anomalies')];
        this.categories = [...new Set(allCategories)];
        return this.categories;
    }

    getCategories() {
        return this.categories;
    }

    addCategory(name) {
        if (!name || this.categories.includes(name)) return false;
        this.categories.push(name);
        this.categories.sort();
        // Ensure To Review and Anomalies stay at the top
        const toReviewIndex = this.categories.indexOf('To Review');
        const anomaliesIndex = this.categories.indexOf('Anomalies');
        if (toReviewIndex > 0) {
            this.categories.splice(toReviewIndex, 1);
            this.categories.unshift('To Review');
        }
        if (anomaliesIndex > 0) {
            this.categories.splice(anomaliesIndex, 1);
            this.categories.splice(1, 0, 'Anomalies');
        }
        return true;
    }

    removeCategory(name) {
        if (name === 'All' || name === 'To Review' || name === 'Anomalies') return false;
        this.categories = this.categories.filter(c => c !== name);
        return true;
    }

    // ----- Count ONLY active bookmarks (not archived) -----
    getCategoryCounts(bookmarks) {
        const counts = {};
        const activeBookmarks = bookmarks.filter(b => !b.isArchived);
        
        this.categories.forEach(cat => {
            if (cat === 'All') {
                counts[cat] = activeBookmarks.length;
            } else {
                counts[cat] = activeBookmarks.filter(b => b.category === cat).length;
            }
        });
        return counts;
    }

    // ----- Extract categories from bookmarks (for analysis, NOT for display) -----
    extractCategories(bookmarks) {
        const cats = new Set();
        bookmarks.forEach(b => {
            if (b.category && b.category !== 'To Review' && b.category !== 'Anomalies') {
                cats.add(b.category);
            }
        });
        return [...cats].sort();
    }
    
    // ----- Get all categories that have at least one bookmark (includes To Review and Anomalies) -----
    getActiveCategories(bookmarks) {
        const cats = new Set();
        const activeBookmarks = bookmarks.filter(b => !b.isArchived);
        activeBookmarks.forEach(b => {
            if (b.category) {
                cats.add(b.category);
            }
        });
        return [...cats].sort();
    }
}
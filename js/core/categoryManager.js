// ========================================
// 📁 CATEGORY MANAGER
// Handles category operations
// ========================================

export class CategoryManager {
    constructor() {
        this.categories = ['All'];
    }

    // ----- Set categories (ensures 'All' is first) -----
    setCategories(categories) {
        if (!categories || categories.length === 0) {
            this.categories = ['All'];
            return this.categories;
        }
        this.categories = ['All', ...categories.filter(c => c !== 'All')];
        this.categories = [...new Set(this.categories)];
        return this.categories;
    }

    // ----- Get all categories -----
    getCategories() {
        return this.categories;
    }

    // ----- Add a single category -----
    addCategory(name) {
        if (!name || this.categories.includes(name)) return false;
        this.categories.push(name);
        this.categories.sort();
        return true;
    }

    // ----- Remove a category (can't remove 'All') -----
    removeCategory(name) {
        if (name === 'All') return false;
        this.categories = this.categories.filter(c => c !== name);
        return true;
    }

    // ----- Get category counts from bookmarks -----
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

    // ----- Extract unique categories from bookmarks -----
    extractCategories(bookmarks) {
        const cats = new Set();
        bookmarks.forEach(b => {
            if (b.category && b.category !== 'Uncategorized') {
                cats.add(b.category);
            }
        });
        return [...cats].sort();
    }
}
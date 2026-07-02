// ========================================
// 💾 STORAGE MANAGER
// Handles all localStorage operations
// ========================================

export class StorageManager {
    constructor() {
        this.storageKey = 'bookmarks_data';
    }

    // ----- Save data to localStorage -----
    save(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('❌ Error saving to storage:', error);
            return false;
        }
    }

    // ----- Load data from localStorage -----
    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                return JSON.parse(saved);
            }
            return null;
        } catch (error) {
            console.error('❌ Error loading from storage:', error);
            return null;
        }
    }

    // ----- Clear all data from localStorage -----
    clear() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.error('❌ Error clearing storage:', error);
            return false;
        }
    }

    // ----- Save an export file to localStorage -----
    saveExport(fileName, data) {
        try {
            localStorage.setItem(`bookmark_export_${fileName}`, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('❌ Error saving export:', error);
            return false;
        }
    }

    // ----- Load an export file from localStorage -----
    loadExport(fileName) {
        try {
            const saved = localStorage.getItem(`bookmark_export_${fileName}`);
            if (saved) {
                return JSON.parse(saved);
            }
            return null;
        } catch (error) {
            console.error('❌ Error loading export:', error);
            return null;
        }
    }
}
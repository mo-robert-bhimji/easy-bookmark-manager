// ========================================
// 🖼️ THUMBNAIL MANAGER
// Handles thumbnail generation and caching
// ========================================

export class ThumbnailManager {
    constructor() {
        this.cacheKey = 'thumbnail_cache';
        this.cache = this.loadCache();
    }

    // ----- Load cache from localStorage -----
    loadCache() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (error) {
            console.error('Error loading thumbnail cache:', error);
        }
        return {};
    }

    // ----- Save cache to localStorage with size limit -----
    saveCache() {
        try {
            const entries = Object.entries(this.cache);
            if (entries.length > 500) {
                const sorted = entries.sort((a, b) => b[1].lastUsed - a[1].lastUsed);
                const trimmed = Object.fromEntries(sorted.slice(0, 500));
                this.cache = trimmed;
            }
            localStorage.setItem(this.cacheKey, JSON.stringify(this.cache));
        } catch (error) {
            console.error('Error saving thumbnail cache:', error);
        }
    }

    // ----- Get thumbnail URL (cached or fresh) -----
    getThumbnail(domain, bookmark) {
        if (this.cache[domain]) {
            this.cache[domain].lastUsed = Date.now();
            this.saveCache();
            return this.cache[domain].data;
        }

        const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        
        this.cache[domain] = {
            data: faviconUrl,
            lastUsed: Date.now()
        };
        this.saveCache();

        return faviconUrl;
    }

    // ----- Get colored placeholder as fallback -----
    getPlaceholder(domain, title) {
        const colors = [
            '#4F46E5', '#7C3AED', '#EC4899', '#EF4444', '#F59E0B',
            '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6', '#F472B6',
            '#14B8A6', '#F97316', '#6366F1', '#A855F7', '#22D3EE'
        ];
        
        let hash = 0;
        const str = domain || 'unknown';
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colorIndex = Math.abs(hash) % colors.length;
        const firstLetter = (title || domain || '?')[0].toUpperCase();
        
        return {
            color: colors[colorIndex],
            letter: firstLetter,
            gradient: `linear-gradient(135deg, ${colors[colorIndex]}, ${colors[(colorIndex + 3) % colors.length]})`
        };
    }

    // ----- Get cache statistics -----
    getCacheStats() {
        const entries = Object.keys(this.cache).length;
        let size = 0;
        try {
            const data = localStorage.getItem(this.cacheKey);
            if (data) {
                size = new Blob([data]).size;
            }
        } catch (e) {}
        return { entries, size: Math.round(size / 1024) };
    }

    // ----- Clear the entire cache -----
    clearCache() {
        this.cache = {};
        localStorage.removeItem(this.cacheKey);
        this.saveCache();
    }
}
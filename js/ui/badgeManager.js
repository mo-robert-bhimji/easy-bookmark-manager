// ========================================
// 🏷️ BADGE MANAGER
// ========================================

export class BadgeManager {
    // ----- Get link status badge -----
    getLinkStatusBadge(linkStatus) {
        if (!linkStatus) return null;
        const statusMap = {
            'verified': { label: '✅ Verified', class: 'verified' },
            'redirect': { label: '⚠️ Redirect', class: 'redirect' },
            'broken': { label: '❌ Broken', class: 'broken' },
            'timeout': { label: '⏱️ Timeout', class: 'timeout' },
            'error': { label: '❓ Error', class: 'error' }
        };
        return statusMap[linkStatus] || null;
    }

    // ----- Create archived badge -----
    createArchivedBadge() {
        const badge = document.createElement('div');
        badge.className = 'archived-badge';
        badge.textContent = '📁 Archived';
        return badge;
    }

    // ----- Create link status badge -----
    createLinkStatusBadge(statusInfo) {
        const badge = document.createElement('div');
        badge.className = `link-status-badge ${statusInfo.class}`;
        badge.textContent = statusInfo.label;
        return badge;
    }

    // ----- Create newest badge -----
    createNewestBadge() {
        const badge = document.createElement('span');
        badge.className = 'newest-badge-on-card';
        badge.textContent = '⭐ Newest';
        return badge;
    }

    // ----- Create a tag element -----
    createTag(tag) {
        const tagEl = document.createElement('span');
        tagEl.className = 'tag primary';
        tagEl.textContent = tag;
        return tagEl;
    }
}
// ========================================
// 🃏 CARD BUILDER
// ========================================

import { BadgeManager } from './badgeManager.js';
import { ThumbnailManager } from '../features/thumbnailManager.js';

export class CardBuilder {
    constructor() {
        this.thumbnailManager = new ThumbnailManager();
        this.badgeManager = new BadgeManager();
        this.fallbackIcons = ['🌐', '📰', '📝', '🎯', '🏠', '💡', '🔧', '📚', '🎨', '🚀'];
    }

    // ----- Create thumbnail -----
    createThumbnail(bookmark) {
        const thumbnailDiv = document.createElement('div');
        thumbnailDiv.className = 'bookmark-thumbnail';
        const domain = bookmark.domain || this.extractDomain(bookmark.url);

        if (domain) {
            const thumbnailUrl = this.thumbnailManager.getThumbnail(domain, bookmark);
            if (thumbnailUrl && thumbnailUrl.startsWith('http')) {
                const img = document.createElement('img');
                img.src = thumbnailUrl;
                img.alt = bookmark.title || 'Bookmark';
                img.loading = 'lazy';
                img.onerror = () => {
                    img.style.display = 'none';
                    const fallback = this.createFallback(domain, bookmark.title);
                    thumbnailDiv.appendChild(fallback);
                };
                thumbnailDiv.appendChild(img);
            } else {
                const fallback = this.createFallback(domain, bookmark.title);
                thumbnailDiv.appendChild(fallback);
            }
        } else {
            const fallback = this.createFallback('', bookmark.title);
            thumbnailDiv.appendChild(fallback);
        }

        return thumbnailDiv;
    }

    // ----- Create fallback thumbnail -----
    createFallback(domain, title) {
        const placeholder = this.thumbnailManager.getPlaceholder(domain || 'unknown', title || '?');
        const fallback = document.createElement('div');
        fallback.className = 'fallback-icon';
        fallback.style.background = placeholder.gradient;
        fallback.style.color = 'white';
        fallback.style.fontSize = '3.5rem';
        fallback.style.fontWeight = 'bold';
        fallback.style.display = 'flex';
        fallback.style.alignItems = 'center';
        fallback.style.justifyContent = 'center';
        fallback.style.width = '100%';
        fallback.style.height = '100%';
        fallback.textContent = placeholder.letter;
        return fallback;
    }

    // ----- Create card content -----
    createContent(bookmark) {
        const contentDiv = document.createElement('div');
        contentDiv.className = 'bookmark-content';

        const title = document.createElement('div');
        title.className = 'bookmark-title';
        title.textContent = bookmark.title || 'Untitled';

        const url = document.createElement('div');
        url.className = 'bookmark-url';
        try {
            const urlObj = new URL(bookmark.url);
            url.textContent = urlObj.hostname;
        } catch (e) {
            url.textContent = bookmark.domain || bookmark.url || 'No URL';
        }

        const desc = document.createElement('div');
        desc.className = 'bookmark-description';
        desc.textContent = bookmark.description || 'No description available';

        contentDiv.appendChild(title);
        contentDiv.appendChild(url);
        contentDiv.appendChild(desc);

        if (bookmark.folderArray && bookmark.folderArray.length > 0) {
            const folderPath = document.createElement('div');
            folderPath.className = 'bookmark-folder-path';
            const folderIcon = document.createElement('span');
            folderIcon.className = 'folder-icon';
            folderIcon.textContent = '📂';
            const folderName = document.createElement('span');
            folderName.className = 'folder-name';
            const lastFolder = bookmark.folderArray[bookmark.folderArray.length - 1];
            folderName.textContent = lastFolder;
            folderPath.appendChild(folderIcon);
            folderPath.appendChild(folderName);
            contentDiv.appendChild(folderPath);
        } else if (bookmark.folderPath && bookmark.folderPath !== 'Root') {
            const folderPath = document.createElement('div');
            folderPath.className = 'bookmark-folder-path';
            const folderIcon = document.createElement('span');
            folderIcon.className = 'folder-icon';
            folderIcon.textContent = '📂';
            const folderName = document.createElement('span');
            folderName.className = 'folder-name';
            folderName.textContent = bookmark.folderPath;
            folderPath.appendChild(folderIcon);
            folderPath.appendChild(folderName);
            contentDiv.appendChild(folderPath);
        }

        if (bookmark.addedDate) {
            const dateDiv = document.createElement('div');
            dateDiv.className = 'bookmark-date';
            const d = new Date(bookmark.addedDate);
            dateDiv.textContent = `📅 Added: ${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
            if (bookmark.isNewest) {
                dateDiv.appendChild(this.badgeManager.createNewestBadge());
            }
            contentDiv.appendChild(dateDiv);
        }

        if (bookmark.tags && bookmark.tags.length > 0) {
            const tagsDiv = document.createElement('div');
            tagsDiv.className = 'bookmark-tags';
            bookmark.tags.slice(0, 3).forEach(tag => {
                if (tag) {
                    tagsDiv.appendChild(this.badgeManager.createTag(tag));
                }
            });
            if (tagsDiv.children.length > 0) {
                contentDiv.appendChild(tagsDiv);
            }
        }

        return contentDiv;
    }

    // ----- Create card footer -----
    createFooter(bookmark, actions) {
        const footer = document.createElement('div');
        footer.className = 'bookmark-footer';

        const source = document.createElement('span');
        source.className = 'source';
        if (bookmark.isArchived) {
            const category = bookmark.category || 'Uncategorized';
            source.textContent = `📁 Archived (was: ${category})`;
            source.style.color = 'var(--text-secondary)';
            source.style.fontStyle = 'italic';
        } else {
            source.textContent = `📎 ${bookmark.category || 'Uncategorized'}`;
        }

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'card-actions';

        const archiveBtn = document.createElement('button');
        archiveBtn.className = 'btn-icon';
        archiveBtn.textContent = bookmark.isArchived ? '📤' : '📥';
        archiveBtn.title = bookmark.isArchived ? 'Unarchive (restore to active)' : 'Archive (hide from main view)';
        archiveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (actions.onArchive) {
                actions.onArchive(bookmark.id);
            }
        });
        actionsDiv.appendChild(archiveBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-icon delete';
        deleteBtn.textContent = '🗑️';
        deleteBtn.title = 'Delete permanently';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (actions.onDelete) {
                actions.onDelete(bookmark.id);
            }
        });
        actionsDiv.appendChild(deleteBtn);

        footer.appendChild(source);
        footer.appendChild(actionsDiv);

        return footer;
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

    // ----- Get fallback icon -----
    getFallbackIcon(title) {
        const index = title ? title.length % this.fallbackIcons.length : 0;
        return this.fallbackIcons[index];
    }
}
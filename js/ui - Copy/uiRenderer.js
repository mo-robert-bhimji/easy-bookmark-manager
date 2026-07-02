// ========================================
// 🃏 UI RENDERER
// Renders individual bookmark cards
// ========================================

import { ThumbnailManager } from '../features/thumbnailManager.js';

export class UIRenderer {
    constructor() {
        this.fallbackIcons = ['🌐', '📰', '📝', '🎯', '🏠', '💡', '🔧', '📚', '🎨', '🚀'];
        this.thumbnailManager = new ThumbnailManager();
    }

    // ----- Create a single bookmark card -----
createBookmarkCard(bookmark, actions = {}) {
    const card = document.createElement('div');
    card.className = 'bookmark-card';
    if (bookmark.isArchived) {
        card.classList.add('archived');
    }

    // Make sure card has no extra spacing
    card.style.overflow = 'hidden';
    card.style.margin = '0';
    card.style.padding = '0';

    card.addEventListener('click', (e) => {
        if (e.target.closest('.card-actions') ||
            e.target.closest('.domain-badge') ||
            e.target.closest('.duplicate-badge') ||
            e.target.closest('.duplicate-popup')) return;
        if (bookmark.url) {
            window.open(bookmark.url, '_blank');
        }
    });

    // ----- Thumbnail (with no extra spacing) -----
    const thumbnailDiv = document.createElement('div');
    thumbnailDiv.className = 'bookmark-thumbnail';
    thumbnailDiv.style.margin = '0';
    thumbnailDiv.style.padding = '0';
    thumbnailDiv.style.flexShrink = '0';

    const domain = bookmark.domain || this.extractDomain(bookmark.url);

    if (domain) {
        const thumbnailUrl = this.thumbnailManager.getThumbnail(domain, bookmark);
        if (thumbnailUrl && thumbnailUrl.startsWith('http')) {
            const img = document.createElement('img');
            img.src = thumbnailUrl;
            img.alt = bookmark.title || 'Bookmark';
            img.loading = 'lazy';
            img.style.display = 'block';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
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

    // ----- Content (with no extra spacing) -----
    const contentDiv = document.createElement('div');
    contentDiv.className = 'bookmark-content';
    contentDiv.style.margin = '0';
    contentDiv.style.padding = '0.75rem 1rem';
    contentDiv.style.flex = '1';
    contentDiv.style.display = 'flex';
    contentDiv.style.flexDirection = 'column';
    contentDiv.style.gap = '0.3rem';

    // Title
    const title = document.createElement('div');
    title.className = 'bookmark-title';
    title.textContent = bookmark.title || 'Untitled';
    title.style.margin = '0';
    title.style.padding = '0';
    contentDiv.appendChild(title);

    // URL
    const url = document.createElement('div');
    url.className = 'bookmark-url';
    try {
        const urlObj = new URL(bookmark.url);
        url.textContent = urlObj.hostname;
    } catch (e) {
        url.textContent = bookmark.domain || bookmark.url || 'No URL';
    }
    url.style.margin = '0';
    url.style.padding = '0';
    contentDiv.appendChild(url);

    // Description
    const desc = document.createElement('div');
    desc.className = 'bookmark-description';
    desc.textContent = bookmark.description || 'No description available';
    desc.style.margin = '0';
    desc.style.padding = '0';
    contentDiv.appendChild(desc);

    // Folder path
    if (bookmark.folderArray && bookmark.folderArray.length > 0) {
        const folderPath = document.createElement('div');
        folderPath.className = 'bookmark-folder-path';
        folderPath.style.margin = '0.2rem 0 0 0';
        folderPath.style.padding = '0.15rem 0.5rem';
        folderPath.style.display = 'inline-block';
        folderPath.style.width = 'fit-content';

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
        folderPath.style.margin = '0.2rem 0 0 0';
        folderPath.style.padding = '0.15rem 0.5rem';
        folderPath.style.display = 'inline-block';
        folderPath.style.width = 'fit-content';

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

    // Date
    if (bookmark.addedDate) {
        const dateDiv = document.createElement('div');
        dateDiv.className = 'bookmark-date';
        dateDiv.style.margin = '0.2rem 0 0 0';
        dateDiv.style.padding = '0';
        const d = new Date(bookmark.addedDate);
        dateDiv.textContent = `📅 Added: ${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
        if (bookmark.isNewest) {
            const newestBadge = document.createElement('span');
            newestBadge.className = 'newest-badge-on-card';
            newestBadge.textContent = '⭐ Newest';
            newestBadge.style.marginLeft = '0.3rem';
            dateDiv.appendChild(newestBadge);
        }
        contentDiv.appendChild(dateDiv);
    }

    // Tags
    if (bookmark.tags && bookmark.tags.length > 0) {
        const tagsDiv = document.createElement('div');
        tagsDiv.className = 'bookmark-tags';
        tagsDiv.style.margin = '0.3rem 0 0 0';
        tagsDiv.style.padding = '0';
        tagsDiv.style.display = 'flex';
        tagsDiv.style.flexWrap = 'wrap';
        tagsDiv.style.gap = '0.3rem';
        bookmark.tags.slice(0, 3).forEach(tag => {
            if (tag) {
                const tagEl = document.createElement('span');
                tagEl.className = 'tag primary';
                tagEl.textContent = tag;
                tagEl.style.padding = '0.15rem 0.6rem';
                tagEl.style.borderRadius = '12px';
                tagEl.style.fontSize = '0.7rem';
                tagsDiv.appendChild(tagEl);
            }
        });
        if (tagsDiv.children.length > 0) {
            contentDiv.appendChild(tagsDiv);
        }
    }

    // ----- Footer (with no extra spacing) -----
    const footer = document.createElement('div');
    footer.className = 'bookmark-footer';
    footer.style.margin = '0';
    footer.style.padding = '0.5rem 1rem';
    footer.style.borderTop = '1px solid #E5E7EB';
    footer.style.display = 'flex';
    footer.style.justifyContent = 'space-between';
    footer.style.alignItems = 'center';
    footer.style.flexShrink = '0';

    const source = document.createElement('span');
    source.className = 'source';
    source.textContent = `📎 ${bookmark.category || 'Uncategorized'}`;
    footer.appendChild(source);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'card-actions';
    actionsDiv.style.display = 'flex';
    actionsDiv.style.gap = '0.3rem';
    actionsDiv.style.opacity = '0.4';

    const archiveBtn = document.createElement('button');
    archiveBtn.className = 'btn-icon';
    archiveBtn.textContent = bookmark.isArchived ? '📤' : '📥';
    archiveBtn.style.background = 'transparent';
    archiveBtn.style.border = 'none';
    archiveBtn.style.cursor = 'pointer';
    archiveBtn.style.fontSize = '0.9rem';
    archiveBtn.style.padding = '0.1rem 0.3rem';
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
    deleteBtn.style.background = 'transparent';
    deleteBtn.style.border = 'none';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.style.fontSize = '0.9rem';
    deleteBtn.style.padding = '0.1rem 0.3rem';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (actions.onDelete) {
            actions.onDelete(bookmark.id);
        }
    });
    actionsDiv.appendChild(deleteBtn);

    footer.appendChild(actionsDiv);

    card.appendChild(thumbnailDiv);
    card.appendChild(contentDiv);
    card.appendChild(footer);

    return card;
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

        // Title
        const title = document.createElement('div');
        title.className = 'bookmark-title';
        title.textContent = bookmark.title || 'Untitled';

        // URL
        const url = document.createElement('div');
        url.className = 'bookmark-url';
        try {
            const urlObj = new URL(bookmark.url);
            url.textContent = urlObj.hostname;
        } catch (e) {
            url.textContent = bookmark.domain || bookmark.url || 'No URL';
        }

        // Description
        const desc = document.createElement('div');
        desc.className = 'bookmark-description';
        desc.textContent = bookmark.description || 'No description available';

        contentDiv.appendChild(title);
        contentDiv.appendChild(url);
        contentDiv.appendChild(desc);

        // Folder path
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

        // Date
        if (bookmark.addedDate) {
            const dateDiv = document.createElement('div');
            dateDiv.className = 'bookmark-date';
            const d = new Date(bookmark.addedDate);
            dateDiv.textContent = `📅 Added: ${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
            if (bookmark.isNewest) {
                const newestBadge = document.createElement('span');
                newestBadge.className = 'newest-badge-on-card';
                newestBadge.textContent = '⭐ Newest';
                dateDiv.appendChild(newestBadge);
            }
            contentDiv.appendChild(dateDiv);
        }

        // Tags
        if (bookmark.tags && bookmark.tags.length > 0) {
            const tagsDiv = document.createElement('div');
            tagsDiv.className = 'bookmark-tags';
            bookmark.tags.slice(0, 3).forEach(tag => {
                if (tag) {
                    const tagEl = document.createElement('span');
                    tagEl.className = 'tag primary';
                    tagEl.textContent = tag;
                    tagsDiv.appendChild(tagEl);
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
        source.textContent = `📎 ${bookmark.category || 'Uncategorized'}`;

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'card-actions';

        const archiveBtn = document.createElement('button');
        archiveBtn.className = 'btn-icon';
        archiveBtn.textContent = bookmark.isArchived ? '📤' : '📥';
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
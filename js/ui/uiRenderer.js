// ========================================
// 🎨 UI RENDERER - CARD CREATION
// ========================================

import { CardBuilder } from './cardBuilder.js';

export class UIRenderer {
    constructor() {
        this.cardBuilder = new CardBuilder();
        this.onSelectionChange = null;
        this.selectedIds = new Set();
    }

    setOnSelectionChange(callback) {
        this.onSelectionChange = callback;
    }

    getSelectedIDs() {
        return Array.from(this.selectedIds);
    }

    clearSelection() {
        this.selectedIds.clear();
        // Update checkbox states
        document.querySelectorAll('.bookmark-checkbox').forEach(cb => {
            cb.checked = false;
        });
        document.querySelectorAll('.bookmark-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        if (this.onSelectionChange) {
            this.onSelectionChange([]);
        }
    }

    toggleSelectAll(selectAll, ids) {
        if (selectAll) {
            ids.forEach(id => {
                this.selectedIds.add(id);
                const card = document.querySelector(`.bookmark-card[data-id="${id}"]`);
                if (card) {
                    card.classList.add('selected');
                    const cb = card.querySelector('.bookmark-checkbox');
                    if (cb) cb.checked = true;
                }
            });
        } else {
            this.clearSelection();
        }
        if (this.onSelectionChange) {
            this.onSelectionChange(Array.from(this.selectedIds));
        }
    }

    createBookmarkCard(bookmark, actions = {}) {
        const card = document.createElement('div');
        card.className = 'bookmark-card';
        card.dataset.id = bookmark.id;

        // ---- Checkbox ----
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'bookmark-checkbox';
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            if (checkbox.checked) {
                this.selectedIds.add(bookmark.id);
                card.classList.add('selected');
            } else {
                this.selectedIds.delete(bookmark.id);
                card.classList.remove('selected');
            }
            if (this.onSelectionChange) {
                this.onSelectionChange(Array.from(this.selectedIds));
            }
        });
        card.appendChild(checkbox);

        // ---- Thumbnail ----
        const thumbnail = document.createElement('div');
        thumbnail.className = 'bookmark-thumbnail';

        const img = document.createElement('img');
        img.src = bookmark.thumbnail || `https://www.google.com/s2/favicons?domain=${bookmark.domain}&sz=128`;
        img.alt = bookmark.title || 'Bookmark';
        img.loading = 'lazy';
        img.onerror = function() {
            this.style.display = 'none';
            const fallback = document.createElement('div');
            fallback.className = 'fallback-icon';
            fallback.textContent = '📄';
            this.parentNode.appendChild(fallback);
        };
        thumbnail.appendChild(img);
        card.appendChild(thumbnail);

        // ---- Content ----
        const content = document.createElement('div');
        content.className = 'bookmark-content';

        // Title
        const title = document.createElement('div');
        title.className = 'bookmark-title';
        title.textContent = bookmark.title || 'Untitled';
        content.appendChild(title);

        // URL
        const url = document.createElement('div');
        url.className = 'bookmark-url';
        url.textContent = bookmark.url || '';
        content.appendChild(url);

        // Description
        const desc = document.createElement('div');
        desc.className = 'bookmark-description';
        desc.textContent = bookmark.description || 'No description available';
        content.appendChild(desc);

        // Date
        const date = document.createElement('div');
        date.className = 'bookmark-date';
        const addedDate = bookmark.addedDate ? new Date(bookmark.addedDate) : new Date();
        date.textContent = `📅 Added: ${addedDate.toLocaleString()}`;
        if (bookmark.isNewest) {
            const badge = document.createElement('span');
            badge.className = 'newest-badge-on-card';
            badge.textContent = '⭐ Newest';
            date.appendChild(badge);
        }
        content.appendChild(date);

        // ---- Link Status Badge (if exists) ----
        if (bookmark.linkStatus && bookmark.linkStatus.status) {
            const statusColors = {
                'verified': '#10B981',
                'broken': '#EF4444',
                'redirect': '#F59E0B',
                'timeout': '#F97316',
                'error': '#6B7280'
            };
            const statusIcons = {
                'verified': '✅',
                'broken': '❌',
                'redirect': '⚠️',
                'timeout': '⏱️',
                'error': '❓'
            };
            const statusLabels = {
                'verified': 'Verified',
                'broken': 'Broken',
                'redirect': 'Redirect',
                'timeout': 'Timeout',
                'error': 'Error'
            };

            const statusBadge = document.createElement('div');
            statusBadge.className = 'link-status-badge';
            const color = statusColors[bookmark.linkStatus.status] || '#6B7280';
            const icon = statusIcons[bookmark.linkStatus.status] || '';
            const label = statusLabels[bookmark.linkStatus.status] || bookmark.linkStatus.status;

            let lastCheckedText = '';
            if (bookmark.linkStatus.lastChecked) {
                const checkedDate = new Date(bookmark.linkStatus.lastChecked);
                lastCheckedText = ` • ${checkedDate.toLocaleDateString()}`;
            }

            statusBadge.style.cssText = `
                position: absolute;
                top: 8px;
                right: 8px;
                background: ${color};
                color: white;
                padding: 0.1rem 0.5rem;
                border-radius: 12px;
                font-size: 0.6rem;
                font-weight: 500;
                z-index: 10;
                pointer-events: none;
                white-space: nowrap;
            `;
            statusBadge.textContent = `${icon} ${label}${lastCheckedText}`;
            card.appendChild(statusBadge);
        }

        // ---- Tags ----
        if (bookmark.tags && bookmark.tags.length > 0) {
            const tagsContainer = document.createElement('div');
            tagsContainer.className = 'bookmark-tags';
            bookmark.tags.slice(0, 3).forEach(tag => {
                const tagEl = document.createElement('span');
                tagEl.className = 'tag primary';
                tagEl.textContent = tag;
                tagsContainer.appendChild(tagEl);
            });
            if (bookmark.tags.length > 3) {
                const more = document.createElement('span');
                more.className = 'tag';
                more.textContent = `+${bookmark.tags.length - 3}`;
                tagsContainer.appendChild(more);
            }
            content.appendChild(tagsContainer);
        }

        card.appendChild(content);

        // ---- Footer ----
        const footer = document.createElement('div');
        footer.className = 'bookmark-footer';

        // Source (category)
        const source = document.createElement('span');
        source.className = 'source';
        source.textContent = `📎 ${bookmark.category || 'Uncategorized'}`;
        if (bookmark.isArchived) {
            source.textContent += ' 📁 Archived';
        }
        footer.appendChild(source);

        // Actions
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'card-actions';

        // Archive button
        const archiveBtn = document.createElement('button');
        archiveBtn.className = 'btn-icon';
        archiveBtn.title = bookmark.isArchived ? 'Unarchive' : 'Archive';
        archiveBtn.textContent = bookmark.isArchived ? '📤' : '📥';
        archiveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (actions.onArchive) actions.onArchive(bookmark.id);
        });
        actionsContainer.appendChild(archiveBtn);

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-icon delete';
        deleteBtn.title = 'Delete permanently';
        deleteBtn.textContent = '🗑️';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (actions.onDelete) actions.onDelete(bookmark.id);
        });
        actionsContainer.appendChild(deleteBtn);

        footer.appendChild(actionsContainer);
        card.appendChild(footer);

        // ---- Card click (open URL) ----
        card.addEventListener('click', (e) => {
            if (e.target.closest('.bookmark-checkbox') || e.target.closest('.card-actions')) {
                return;
            }
            if (bookmark.url) {
                window.open(bookmark.url, '_blank');
            }
        });

        return card;
    }
}
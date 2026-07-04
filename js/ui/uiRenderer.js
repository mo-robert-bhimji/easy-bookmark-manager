// ========================================
// 🃏 UI RENDERER - Orchestrator
// ========================================

import { CardBuilder } from './cardBuilder.js';
import { BadgeManager } from './badgeManager.js';

export class UIRenderer {
    constructor() {
        this.cardBuilder = new CardBuilder();
        this.badgeManager = new BadgeManager();
        this.selectedIds = new Set();
        this.onSelectionChange = null;
    }

    setOnSelectionChange(callback) {
        this.onSelectionChange = callback;
    }

    getSelectedIds() {
        return this.selectedIds;
    }

    clearSelection() {
        this.selectedIds.clear();
        document.querySelectorAll('.bookmark-card').forEach(card => {
            card.classList.remove('selected');
            const cb = card.querySelector('.bookmark-checkbox');
            if (cb) {
                cb.checked = false;
                cb.style.opacity = '';
            }
        });
        document.querySelectorAll('.stack-container .bookmark-card').forEach(card => {
            card.classList.remove('selected');
            const cb = card.querySelector('.bookmark-checkbox');
            if (cb) {
                cb.checked = false;
                cb.style.opacity = '';
            }
        });
        if (this.onSelectionChange) {
            this.onSelectionChange(this.selectedIds);
        }
    }

    toggleSelection(id) {
        if (this.selectedIds.has(id)) {
            this.selectedIds.delete(id);
        } else {
            this.selectedIds.add(id);
        }
        this.updateCardSelection(id);
        if (this.onSelectionChange) {
            this.onSelectionChange(this.selectedIds);
        }
    }

    isSelected(id) {
        return this.selectedIds.has(id);
    }

    selectAll(ids) {
        this.selectedIds.clear();
        ids.forEach(id => this.selectedIds.add(id));
        document.querySelectorAll('.bookmark-card').forEach(card => {
            const id = card.dataset.id;
            if (id && this.selectedIds.has(id)) {
                card.classList.add('selected');
                const cb = card.querySelector('.bookmark-checkbox');
                if (cb) {
                    cb.checked = true;
                    cb.style.opacity = '1';
                }
            } else {
                card.classList.remove('selected');
                const cb = card.querySelector('.bookmark-checkbox');
                if (cb) {
                    cb.checked = false;
                    cb.style.opacity = '';
                }
            }
        });
        if (this.onSelectionChange) {
            this.onSelectionChange(this.selectedIds);
        }
    }

    updateCardSelection(id) {
        const isSelected = this.selectedIds.has(id);
        document.querySelectorAll(`.bookmark-card[data-id="${id}"]`).forEach(card => {
            if (isSelected) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
            const cb = card.querySelector('.bookmark-checkbox');
            if (cb) {
                cb.checked = isSelected;
                cb.style.opacity = isSelected ? '1' : '';
            }
        });
    }

    // ----- Create a single bookmark card -----
    createBookmarkCard(bookmark, actions = {}) {
        const card = document.createElement('div');
        card.className = 'bookmark-card';
        card.dataset.id = bookmark.id;

        // Archiving
        if (bookmark.isArchived) {
            card.classList.add('archived');
            card.appendChild(this.badgeManager.createArchivedBadge());
        }

        // Link Status Badge (only if not archived, or show it anyway)
        if (bookmark.linkStatus && bookmark.linkStatus.status) {
            const statusInfo = this.badgeManager.getLinkStatusBadge(bookmark.linkStatus.status);
            if (statusInfo) {
                card.appendChild(this.badgeManager.createLinkStatusBadge(statusInfo));
            }
        }

        // Selection state
        const isSelected = this.isSelected(bookmark.id);
        if (isSelected) {
            card.classList.add('selected');
        }

        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'bookmark-checkbox';
        checkbox.checked = isSelected;
        if (isSelected) {
            checkbox.style.opacity = '1';
        }
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            this.toggleSelection(bookmark.id);
            if (e.target.checked) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
            if (this.onSelectionChange) {
                this.onSelectionChange(this.selectedIds);
            }
        });

        // Card click (opens URL)
        card.addEventListener('click', (e) => {
            if (e.target.closest('.card-actions') ||
                e.target.closest('.domain-badge') ||
                e.target.closest('.duplicate-badge') ||
                e.target.closest('.duplicate-popup') ||
                e.target.closest('.bookmark-checkbox')) return;
            if (bookmark.url) {
                window.open(bookmark.url, '_blank');
            }
        });

        // Build card parts
        const thumbnailDiv = this.cardBuilder.createThumbnail(bookmark);
        const contentDiv = this.cardBuilder.createContent(bookmark);
        const footer = this.cardBuilder.createFooter(bookmark, actions);

        card.appendChild(checkbox);
        card.appendChild(thumbnailDiv);
        card.appendChild(contentDiv);
        card.appendChild(footer);

        return card;
    }

    extractDomain(url) {
        return this.cardBuilder.extractDomain(url);
    }

    getFallbackIcon(title) {
        return this.cardBuilder.getFallbackIcon(title);
    }
}
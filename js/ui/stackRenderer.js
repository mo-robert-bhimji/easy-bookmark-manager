// ========================================
// 📚 STACK RENDERER - COMPLETE
// ========================================

import { PopupManager } from './popupManager.js';

export class StackRenderer {
    constructor(uiRenderer) {
        this.uiRenderer = uiRenderer;
        this.popupManager = new PopupManager();
        this.onExpand = null;
    }

    setOnExpand(callback) {
        this.onExpand = callback;
        this.popupManager.setOnExpand(callback);
    }

    createStackedCard(bookmarks, actions = {}) {
        const container = document.createElement('div');
        container.className = 'stack-container';
        
        const sorted = [...bookmarks].sort((a, b) => 
            new Date(b.addedDate || 0) - new Date(a.addedDate || 0)
        );
        
        if (sorted.length > 0) {
            sorted[0].isNewest = true;
        }
        
        const isDomainStack = actions.isDomainStack || false;
        const topBookmark = sorted[0];
        
        // Create the card normally
        const card = this.uiRenderer.createBookmarkCard(topBookmark, actions);
        
        // Add badge to the card
        const thumbnail = card.querySelector('.bookmark-thumbnail');
        if (thumbnail) {
            const badge = document.createElement('button');
            
            if (isDomainStack) {
                badge.className = 'domain-badge';
                const domain = topBookmark.domain || this.uiRenderer.extractDomain(topBookmark.url) || 'unknown';
                badge.innerHTML = `🏢 <span class="domain">${domain}</span> <span class="count">${sorted.length}</span>`;
            } else {
                badge.className = 'duplicate-badge';
                badge.innerHTML = `📦 <span class="count">${sorted.length}</span>`;
            }
            
            badge.addEventListener('click', (e) => {
                e.stopPropagation();
                const popupActions = {
                    ...actions,
                    onExpand: this.onExpand
                };
                this.popupManager.togglePopup(container, sorted, popupActions);
            });
            thumbnail.appendChild(badge);
        }
        
        // Wrap in stack div for positioning
        const stack = document.createElement('div');
        stack.className = 'stack';
        stack.appendChild(card);
        container.appendChild(stack);
        
        return container;
    }
}
// ========================================
// 💬 POPUP MANAGER - COMPLETE
// ========================================

export class PopupManager {
    constructor() {
        this.activePopup = null;
        this.popupGap = 10;
        this.expandViewActive = false;
        this.onExpand = null;
    }

    setOnExpand(callback) {
        this.onExpand = callback;
    }

    togglePopup(container, bookmarks, actions) {
        this.closeAllPopups();
        
        const card = container.querySelector('.bookmark-card');
        if (!card) {
            console.warn('⚠️ Could not find card for popup positioning');
            return;
        }
        
        const cardRect = card.getBoundingClientRect();
        const popup = this.createPopup(bookmarks, actions);
        document.body.appendChild(popup);
        this.positionPopup(popup, cardRect);
        
        requestAnimationFrame(() => {
            popup.classList.add('active');
        });
        
        this.setupPopupEvents(popup, actions);
    }

    createPopup(bookmarks, actions) {
        const sorted = [...bookmarks].sort((a, b) => 
            new Date(b.addedDate || 0) - new Date(a.addedDate || 0)
        );
        
        const isDomainStack = actions.isDomainStack || false;
        const popup = document.createElement('div');
        popup.className = 'duplicate-popup';
        
        const domainName = sorted[0]?.domain || 'unknown';
        
        let popupHTML = `
            <div class="popup-header">
                <div class="popup-title">📦 <span class="domain-name">${domainName}</span> • ${sorted.length} bookmarks</div>
                <button class="popup-close" data-close>&times;</button>
            </div>
            <div class="popup-body">
        `;
        
        sorted.forEach((bookmark, index) => {
            const isNewest = index === 0;
            const folder = bookmark.folderArray && bookmark.folderArray.length > 0 
                ? bookmark.folderArray[bookmark.folderArray.length - 1] 
                : bookmark.folderPath || 'Root';
            const date = bookmark.addedDate ? new Date(bookmark.addedDate).toLocaleDateString() : 'Unknown';
            const title = bookmark.title || 'Untitled';
            
            popupHTML += `
                <div class="popup-item">
                    <div class="info">
                        <div class="item-title">${isNewest ? '⭐ ' : ''}${title}</div>
                        <div class="item-meta">
                            <span class="item-folder">📂 ${folder}</span>
                            <span class="item-date">${date}</span>
                            ${isNewest ? '<span class="newest-badge">Newest</span>' : ''}
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="btn-sm btn-archive" data-action="archive" data-id="${bookmark.id}">📥</button>
                        <button class="btn-sm btn-delete" data-action="delete" data-id="${bookmark.id}">🗑️</button>
                    </div>
                </div>
            `;
        });
        
        popupHTML += `
            </div>
            <div class="popup-footer">
                <button class="btn btn-archive-all" data-action="archive-all">📥 Archive All</button>
                <button class="btn btn-delete-all" data-action="delete-all">🗑️ Delete All</button>
                <button class="btn btn-expand" data-action="expand">🔍 Expand</button>
            </div>
        `;
        
        popup.innerHTML = popupHTML;
        popup._bookmarks = sorted;
        popup._domainName = domainName;
        popup._isDomainStack = isDomainStack;
        popup._actions = actions;
        
        return popup;
    }

    positionPopup(popup, cardRect) {
        requestAnimationFrame(() => {
            const popupWidth = 420;
            const popupHeight = 420;
            const offsetDown = 25;
            
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            const cardCenterX = (cardRect.left + cardRect.right) / 2;
            const cardCenterY = (cardRect.top + cardRect.bottom) / 2;
            
            let left = cardCenterX - (popupWidth * 0.3);
            let top = cardCenterY - (popupHeight * 0.3) + offsetDown;
            
            if (left < 10) left = 10;
            if (top < 10) top = 10;
            if (left + popupWidth > viewportWidth - 10) {
                left = viewportWidth - popupWidth - 10;
            }
            if (top + popupHeight > viewportHeight - 10) {
                top = viewportHeight - popupHeight - 10;
            }
            
            popup.style.left = left + 'px';
            popup.style.top = top + 'px';
        });
    }

    setupPopupEvents(popup, actions) {
        popup.querySelector('[data-close]').addEventListener('click', () => {
            this.closeAllPopups();
        });
        
        const overlay = document.getElementById('popupOverlay');
        if (overlay) {
            overlay.classList.add('active');
            overlay.addEventListener('click', () => {
                this.closeAllPopups();
            });
        }
        
        popup.querySelectorAll('[data-action="archive"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                if (actions.onArchive) {
                    actions.onArchive(id);
                    this.showToast('Archived 1 bookmark', '📥');
                    this.closeAllPopups();
                }
            });
        });
        
        popup.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                if (actions.onDelete) {
                    actions.onDelete(id);
                    this.showToast('Deleted 1 bookmark', '🗑️');
                    this.closeAllPopups();
                }
            });
        });
        
        popup.querySelector('[data-action="archive-all"]').addEventListener('click', (e) => {
            e.stopPropagation();
            const bookmarks = popup._bookmarks || [];
            const older = bookmarks.slice(1);
            if (actions.onBulkArchive) {
                actions.onBulkArchive(older.map(b => b.id));
                this.showToast(`Archived ${older.length} older bookmarks, kept newest`, '📥');
                this.closeAllPopups();
            }
        });
        
        popup.querySelector('[data-action="delete-all"]').addEventListener('click', (e) => {
            e.stopPropagation();
            const bookmarks = popup._bookmarks || [];
            const older = bookmarks.slice(1);
            if (actions.onBulkDelete) {
                actions.onBulkDelete(older.map(b => b.id));
                this.showToast(`Deleted ${older.length} older bookmarks, kept newest`, '🗑️');
                this.closeAllPopups();
            }
        });
        
        // Expand button - FIXED
        popup.querySelector('[data-action="expand"]').addEventListener('click', (e) => {
            e.stopPropagation();
            const bookmarks = popup._bookmarks || [];
            const domainName = popup._domainName || 'unknown';
            const isDomainStack = popup._isDomainStack || false;
            
            console.log('🔍 Expand clicked from popup');
            
            this.closeAllPopups();
            
            const expandCallback = this.onExpand;
            if (expandCallback) {
                console.log('📤 Calling expand callback');
                expandCallback(bookmarks, domainName, isDomainStack);
            } else {
                console.warn('⚠️ No expand callback found');
                this.showToast('Expand functionality not available', '⚠️');
            }
        });
    }

    closeAllPopups() {
        document.querySelectorAll('.duplicate-popup').forEach(p => {
            p.classList.remove('active');
            setTimeout(() => p.remove(), 300);
        });
        const overlay = document.getElementById('popupOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    showToast(message, icon = '✅') {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = 'toast show';
        toast.innerHTML = `
            <span class="icon">${icon}</span>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}
// ========================================
// 🔍 EXPAND VIEW - BIGGER BACK BUTTON
// ========================================

export class ExpandView {
    constructor(uiRenderer, bookmarkManager) {
        this.uiRenderer = uiRenderer;
        this.bookmarkManager = bookmarkManager;
        this.isActive = false;
        this.onClose = null;
        this.actions = null;
    }

    setOnClose(callback) {
        this.onClose = callback;
    }

    setActions(actions) {
        this.actions = actions;
    }

    show(bookmarks, domainName, isDomainStack) {
        console.log('📚 ExpandView.show() called');

        if (!bookmarks || bookmarks.length === 0) {
            console.warn('⚠️ No bookmarks to expand');
            return;
        }

        this.isActive = true;

        let container = document.getElementById('expandViewContainer');
        if (!container) {
            console.log('📦 Creating expand view container');
            container = document.createElement('div');
            container.id = 'expandViewContainer';
            document.body.appendChild(container);
        }

        const typeLabel = isDomainStack ? 'Domain' : 'URL';

        let html = `
            <div class="expand-header">
                <div class="expand-title">📚 <span class="domain-name">${domainName}</span> • ${bookmarks.length} bookmarks (${typeLabel} group)</div>
                <button class="back-btn" id="expandBackBtn">🔙 Back</button>
            </div>
            <div class="expand-grid">
        `;

        bookmarks.forEach((bookmark) => {
            const domain = bookmark.domain || this.uiRenderer.extractDomain(bookmark.url) || '?';
            const fallbackIcon = this.getFallbackIcon(domain);
            const date = bookmark.addedDate ? new Date(bookmark.addedDate).toLocaleDateString() : 'Unknown';
            const title = bookmark.title || 'Untitled';
            const url = bookmark.url || '';
            const category = bookmark.category || 'Uncategorized';

            html += `
                <div class="expand-card" data-id="${bookmark.id}" data-url="${url}">
                    <div class="card-thumbnail">${fallbackIcon}</div>
                    <div class="card-title">${title}</div>
                    <div class="card-url">${url}</div>
                    <div class="card-footer">
                        <span>📎 ${category}</span>
                        <span>📅 ${date}</span>
                        <div class="card-actions">
                            <button class="btn-sm btn-archive" data-action="archive" data-id="${bookmark.id}">📥</button>
                            <button class="btn-sm btn-delete" data-action="delete" data-id="${bookmark.id}">🗑️</button>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `
            </div>
        `;

        container.innerHTML = html;

        container.className = 'active';
        container.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        console.log('✅ Expand view rendered');

        // Make cards clickable
        container.querySelectorAll('.expand-card').forEach(card => {
            const url = card.dataset.url;
            if (url) {
                card.style.cursor = 'pointer';
                card.addEventListener('click', (e) => {
                    if (e.target.closest('.card-actions') || e.target.closest('.btn-sm')) {
                        return;
                    }
                    window.open(url, '_blank');
                });
            }
        });

        // Back button - BIGGER
        const backBtn = document.getElementById('expandBackBtn');
        if (backBtn) {
            backBtn.style.fontSize = '1.1rem';
            backBtn.style.padding = '0.6rem 1.5rem';
            backBtn.style.borderRadius = '8px';
            backBtn.addEventListener('click', () => {
                this.hide();
            });
        }

        // Actions
        if (this.actions) {
            container.querySelectorAll('[data-action="archive"]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.dataset.id;
                    if (this.actions.onArchive) {
                        this.actions.onArchive(id);
                        this.showToast('Archived 1 bookmark', '📥');
                        const updatedBookmarks = bookmarks.filter(b => b.id !== id);
                        if (updatedBookmarks.length > 0) {
                            this.show(updatedBookmarks, domainName, isDomainStack);
                        } else {
                            this.hide();
                        }
                    }
                });
            });

            container.querySelectorAll('[data-action="delete"]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.dataset.id;
                    if (confirm('🗑️ Permanently delete this bookmark?')) {
                        if (this.actions.onDelete) {
                            this.actions.onDelete(id);
                            this.showToast('Deleted 1 bookmark', '🗑️');
                            const updatedBookmarks = bookmarks.filter(b => b.id !== id);
                            if (updatedBookmarks.length > 0) {
                                this.show(updatedBookmarks, domainName, isDomainStack);
                            } else {
                                this.hide();
                            }
                        }
                    }
                });
            });
        }
    }

    hide() {
        console.log('🔙 Hiding expand view');
        console.trace('🔍 Stack trace for hide() call:');
        
        const container = document.getElementById('expandViewContainer');
        if (container) {
            container.className = '';
            container.style.display = 'none';
            container.innerHTML = '';
        }
        document.body.style.overflow = '';
        this.isActive = false;

        if (this.onClose) {
            console.log('📢 Calling onClose callback');
            this.onClose();
        }
    }

    getFallbackIcon(domain) {
        const icons = ['🌐', '📰', '📝', '🎯', '🏠', '💡', '🔧', '📚', '🎨', '🚀'];
        const index = domain ? domain.length % icons.length : 0;
        return icons[index];
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
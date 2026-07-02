// ========================================
// 🎨 UI MANAGER
// Handles UI updates, progress, stats, modals, toasts
// ========================================

export class UIManager {
    constructor() {
        this.elements = {};
        this.initializeElements();
    }

    // ----- Initialize all DOM element references -----
    initializeElements() {
        this.elements = {
            bookmarksGrid: document.getElementById('bookmarksGrid'),
            categoriesList: document.getElementById('categoriesList'),
            currentCategoryTitle: document.getElementById('currentCategoryTitle'),
            bookmarkCount: document.getElementById('bookmarkCount'),
            stats: document.getElementById('stats'),
            importHistory: document.getElementById('importHistory'),
            searchInput: document.getElementById('searchInput'),
            searchBtn: document.getElementById('searchBtn'),
            sortSelect: document.getElementById('sortSelect'),
            
            progressBar: document.getElementById('progressBar'),
            progressPercentage: document.getElementById('progressPercentage'),
            progressTotal: document.getElementById('progressTotal'),
            progressClassified: document.getElementById('progressClassified'),
            progressRemaining: document.getElementById('progressRemaining'),
            progressStatusBadge: document.getElementById('progressStatusBadge'),
            progressEta: document.getElementById('progressEta'),
            progressApiCalls: document.getElementById('progressApiCalls'),
            progressSpeed: document.getElementById('progressSpeed'),
            progressElapsed: document.getElementById('progressElapsed'),
            progressLog: document.getElementById('progressLog'),
            
            importBtn: document.getElementById('importBtn'),
            exportBtn: document.getElementById('exportBtn'),
            classifyBtn: document.getElementById('classifyBtn'),
            clearAllBtn: document.getElementById('clearAllBtn'),
            addCategoryBtn: document.getElementById('addCategoryBtn'),
            showArchivedBtn: document.getElementById('showArchivedBtn'),
            
            progressStartBtn: document.getElementById('progressStartBtn'),
            progressPauseBtn: document.getElementById('progressPauseBtn'),
            progressStopBtn: document.getElementById('progressStopBtn'),
            progressClearLogBtn: document.getElementById('progressClearLogBtn'),
            progressToggle: document.getElementById('progressToggle'),
            progressToggleIcon: document.getElementById('progressToggleIcon'),
            progressBody: document.getElementById('progressBody')
        };
    }

    // ----- Render categories list -----
    renderCategories(categories, currentCategory, categoryCounts) {
        const list = this.elements.categoriesList;
        if (!list) return;
        
        list.innerHTML = '';
        
        categories.forEach(category => {
            const li = document.createElement('li');
            li.className = category === currentCategory ? 'active' : '';
            const count = categoryCounts[category] || 0;
            li.innerHTML = `
                <span>📁 ${category}</span>
                <span class="count">${count}</span>
            `;
            list.appendChild(li);
        });
    }

    // ----- Render stats -----
    renderStats(stats) {
        const el = this.elements.stats;
        if (el) {
            let status = '';
            if (stats.classificationComplete === true) {
                status = '✅ Complete';
            } else if (stats.classificationComplete === false && stats.active > 0) {
                status = '⏳ Partial';
            }
            el.textContent = `${stats.active} active • ${stats.archived} archived • ${stats.categories} categories ${status}`;
        }
    }

    // ----- Render import history -----
    renderImportHistory(history) {
        const container = this.elements.importHistory;
        if (!container) return;
        
        if (history.length === 0) {
            container.innerHTML = '<div style="font-size:0.8rem;color:var(--text-secondary);padding:0.5rem;">No imports yet</div>';
            return;
        }
        
        const historyHtml = history.slice().reverse().map((item) => `
            <div class="import-item">
                <div class="filename">📄 ${item.fileName}</div>
                <div class="metadata">${item.count} bookmarks • ${item.skipped ? item.skipped + ' skipped • ' : ''}${new Date(item.date).toLocaleDateString()}</div>
            </div>
        `).join('');
        
        container.innerHTML = `
            <div style="margin-top:0.5rem;">
                <div style="font-weight:600;font-size:0.8rem;margin-bottom:0.3rem;">Import History</div>
                ${historyHtml}
            </div>
        `;
    }

    // ----- Update progress UI -----
    updateProgress(progress) {
        if (!progress) return;
        
        const percentage = progress.total > 0 ? (progress.classified / progress.total) * 100 : 0;
        const isComplete = progress.classified === progress.total && progress.total > 0;
        const remaining = Math.max(0, progress.total - progress.classified);
        
        const bar = this.elements.progressBar;
        if (bar) bar.style.width = Math.min(percentage, 100) + '%';
        
        const pct = this.elements.progressPercentage;
        if (pct) pct.textContent = Math.round(Math.min(percentage, 100)) + '%';
        
        const total = this.elements.progressTotal;
        if (total) total.textContent = progress.total.toLocaleString();
        
        const classified = this.elements.progressClassified;
        if (classified) classified.textContent = progress.classified.toLocaleString();
        
        const remain = this.elements.progressRemaining;
        if (remain) remain.textContent = remaining.toLocaleString();
        
        const badge = this.elements.progressStatusBadge;
        if (badge) {
            if (isComplete) {
                badge.className = 'status-badge complete';
                badge.textContent = '✅ Complete';
            } else if (progress.isRunning && !progress.isPaused) {
                badge.className = 'status-badge running';
                badge.textContent = '⏳ Running';
            } else if (progress.isPaused) {
                badge.className = 'status-badge idle';
                badge.textContent = '⏸ Paused';
            } else if (progress.isCancelled) {
                badge.className = 'status-badge error';
                badge.textContent = '⛔ Cancelled';
            } else if (progress.classified > 0 && progress.total > 0) {
                badge.className = 'status-badge idle';
                badge.textContent = '⏸ Partial';
            } else {
                badge.className = 'status-badge idle';
                badge.textContent = '⏸ Idle';
            }
        }
        
        const etaEl = this.elements.progressEta;
        if (etaEl) {
            if (isComplete) {
                etaEl.innerHTML = '✅ Complete!';
            } else if (progress.isRunning && progress.classified > 0 && progress.startTime) {
                const elapsed = (Date.now() - progress.startTime) / 1000;
                const speed = progress.classified / elapsed;
                if (speed > 0 && remaining > 0) {
                    const etaSeconds = remaining / speed;
                    if (etaSeconds > 0) {
                        const hours = Math.floor(etaSeconds / 3600);
                        const minutes = Math.floor((etaSeconds % 3600) / 60);
                        const seconds = Math.floor(etaSeconds % 60);
                        let etaText = '';
                        if (hours > 0) etaText += hours + 'h ';
                        if (minutes > 0 || hours > 0) etaText += minutes + 'm ';
                        etaText += seconds + 's';
                        etaEl.innerHTML = `⏱️ ~${etaText} remaining`;
                    }
                } else if (remaining === 0) {
                    etaEl.innerHTML = '✅ Complete!';
                } else {
                    etaEl.innerHTML = '⏳ Processing...';
                }
            } else if (progress.classified > 0 && progress.total > 0) {
                etaEl.innerHTML = '⏸ Partial results available';
            } else {
                etaEl.innerHTML = '⏸ Waiting...';
            }
        }
        
        const apiCalls = this.elements.progressApiCalls;
        if (apiCalls) apiCalls.textContent = progress.apiCalls || 0;
        
        if (progress.isRunning && progress.classified > 0 && progress.startTime) {
            const elapsed = (Date.now() - progress.startTime) / 1000;
            const speed = Math.round(progress.classified / elapsed);
            const speedEl = this.elements.progressSpeed;
            if (speedEl) speedEl.textContent = speed;
        }
        
        if (progress.startTime) {
            const elapsed = Math.floor((Date.now() - progress.startTime) / 1000);
            const hours = Math.floor(elapsed / 3600);
            const minutes = Math.floor((elapsed % 3600) / 60);
            const seconds = elapsed % 60;
            const elapsedEl = this.elements.progressElapsed;
            if (elapsedEl) {
                elapsedEl.textContent = 
                    String(hours).padStart(2, '0') + ':' +
                    String(minutes).padStart(2, '0') + ':' +
                    String(seconds).padStart(2, '0');
            }
        }
    }

    // ----- Add log entry -----
    addLogEntry(entry) {
        const container = this.elements.progressLog;
        if (!container) return;
        
        const levelIcons = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌'
        };
        
        const levelClass = 'level-' + entry.level;
        const icon = levelIcons[entry.level] || 'ℹ️';
        
        const div = document.createElement('div');
        div.className = 'log-entry';
        div.innerHTML = `
            <span class="time">[${entry.time}]</span>
            <span class="${levelClass}">${icon}</span>
            <span>${entry.message}</span>
        `;
        
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        
        while (container.children.length > 50) {
            container.removeChild(container.firstChild);
        }
    }

    // ----- Clear log -----
    clearLog() {
        const container = this.elements.progressLog;
        if (container) container.innerHTML = '';
    }

    // ----- Show toast notification -----
    showToast(message, icon = '✅', duration = 3000) {
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
        }, duration);
    }

    // ----- Show modal -----
    showModal(title, content) {
        const modal = document.getElementById('modal');
        if (!modal) return;
        
        const titleEl = document.getElementById('modalTitle');
        if (titleEl) titleEl.textContent = title;
        
        const bodyEl = document.getElementById('modalBody');
        if (bodyEl) bodyEl.innerHTML = content;
        
        modal.style.display = 'block';
    }

    // ----- Hide modal -----
    hideModal() {
        const modal = document.getElementById('modal');
        if (modal) modal.style.display = 'none';
    }

    // ----- Expand progress section -----
    expandProgress() {
        const body = this.elements.progressBody;
        const icon = this.elements.progressToggleIcon;
        if (body) body.classList.add('expanded');
        if (icon) icon.textContent = '▼';
    }

    // ----- Collapse progress section -----
    collapseProgress() {
        const body = this.elements.progressBody;
        const icon = this.elements.progressToggleIcon;
        if (body) body.classList.remove('expanded');
        if (icon) icon.textContent = '▶';
    }

    // ----- Toggle progress section -----
    toggleProgress() {
        const isExpanded = this.elements.progressBody?.classList.contains('expanded');
        if (isExpanded) {
            this.collapseProgress();
        } else {
            this.expandProgress();
        }
    }
}
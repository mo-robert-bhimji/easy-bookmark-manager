// ========================================
// 🔗 LINK CHECK UI
// ========================================

export class LinkCheckUI {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.results = null;
        this.isOpen = false;
    }

    showProgress(progress) {
        const { total, checked, working, broken, redirects, errors, timeouts, progress: percentage } = progress;

        const content = `
            <div style="margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.3rem;">
                    <span style="font-weight: 600; color: var(--text-primary);">🔗 Checking Links...</span>
                    <span style="font-weight: 600; color: var(--primary);">${percentage}%</span>
                </div>
                <div style="width: 100%; height: 8px; background: var(--background); border-radius: 4px; overflow: hidden;">
                    <div style="width: ${percentage}%; height: 100%; background: linear-gradient(90deg, var(--primary), #7C3AED); border-radius: 4px; transition: width 0.3s;"></div>
                </div>
                <div style="display: flex; gap: 1rem; margin-top: 0.5rem; font-size: 0.8rem; color: var(--text-secondary); flex-wrap: wrap;">
                    <span>📚 Total: <strong style="color: var(--text-primary);">${total}</strong></span>
                    <span>✅ Working: <strong style="color: #10B981;">${working}</strong></span>
                    <span>❌ Broken: <strong style="color: #EF4444;">${broken}</strong></span>
                    <span>⚠️ Redirects: <strong style="color: #F59E0B;">${redirects}</strong></span>
                    <span>⏱️ Timeouts: <strong style="color: #F97316;">${timeouts}</strong></span>
                    <span>❓ Errors: <strong style="color: #6B7280;">${errors}</strong></span>
                </div>
            </div>
        `;

        this.uiManager.showModal('🔗 Link Check in Progress...', content);
        this.isOpen = true;
    }

    showResults(summary) {
        this.results = summary;
        const { total, working, broken, redirects, errors, timeouts } = summary;

        let brokenListHtml = '';
        if (broken > 0) {
            const brokenResults = summary.results
                .filter(r => r.status === 'broken')
                .slice(0, 50);

            brokenListHtml = `
                <div style="margin-top: 1rem;">
                    <div style="font-weight: 600; margin-bottom: 0.5rem; color: #EF4444;">
                        ❌ Broken Links (${broken})
                    </div>
                    <div style="max-height: 200px; overflow-y: auto; border: 1px solid var(--border); border-radius: 6px; padding: 0.3rem;">
                        ${brokenResults.map(r => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.3rem 0.5rem; border-bottom: 1px solid var(--border); font-size: 0.8rem;">
                                <span style="color: var(--text-secondary); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: 0.5rem;">
                                    ${r.bookmark?.title || r.url}
                                </span>
                                <span style="color: #EF4444; font-size: 0.7rem; flex-shrink: 0;">
                                    ${r.statusText}
                                </span>
                            </div>
                        `).join('')}
                        ${broken > 50 ? `<div style="padding: 0.3rem 0.5rem; color: var(--text-secondary); font-size: 0.7rem;">... and ${broken - 50} more</div>` : ''}
                    </div>
                </div>
            `;
        }

        const content = `
            <div style="margin-bottom: 1rem;">
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 0.5rem; margin-bottom: 1rem;">
                    <div style="padding: 0.5rem; background: #ECFDF5; border-radius: 6px; text-align: center;">
                        <div style="font-size: 0.7rem; color: #059669;">✅ Verified</div>
                        <div style="font-weight: 700; font-size: 1.2rem; color: #059669;">${working}</div>
                    </div>
                    <div style="padding: 0.5rem; background: #FEF3C7; border-radius: 6px; text-align: center;">
                        <div style="font-size: 0.7rem; color: #D97706;">⚠️ Redirects</div>
                        <div style="font-weight: 700; font-size: 1.2rem; color: #D97706;">${redirects}</div>
                    </div>
                    <div style="padding: 0.5rem; background: #FEE2E2; border-radius: 6px; text-align: center;">
                        <div style="font-size: 0.7rem; color: #DC2626;">❌ Broken</div>
                        <div style="font-weight: 700; font-size: 1.2rem; color: #DC2626;">${broken}</div>
                    </div>
                    <div style="padding: 0.5rem; background: #FEF3C7; border-radius: 6px; text-align: center;">
                        <div style="font-size: 0.7rem; color: #D97706;">⏱️ Timeouts</div>
                        <div style="font-weight: 700; font-size: 1.2rem; color: #D97706;">${timeouts}</div>
                    </div>
                    <div style="padding: 0.5rem; background: #F3F4F6; border-radius: 6px; text-align: center;">
                        <div style="font-size: 0.7rem; color: #6B7280;">❓ Errors</div>
                        <div style="font-weight: 700; font-size: 1.2rem; color: #6B7280;">${errors}</div>
                    </div>
                    <div style="padding: 0.5rem; background: #EEF2FF; border-radius: 6px; text-align: center;">
                        <div style="font-size: 0.7rem; color: #4F46E5;">📚 Total</div>
                        <div style="font-weight: 700; font-size: 1.2rem; color: #4F46E5;">${total}</div>
                    </div>
                </div>

                ${brokenListHtml}

                ${broken > 0 ? `
                    <div style="display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap;">
                        <button id="moveBrokenToReview" class="btn btn-secondary" style="font-size: 0.8rem;">
                            📥 Move Broken to "To Review"
                        </button>
                        <button id="archiveBroken" class="btn btn-secondary" style="font-size: 0.8rem;">
                            📥 Archive Broken
                        </button>
                        <button id="deleteBroken" class="btn btn-danger" style="font-size: 0.8rem;">
                            🗑️ Delete Broken
                        </button>
                        <button id="recheckBroken" class="btn btn-secondary" style="font-size: 0.8rem;">
                            🔄 Re-check Broken
                        </button>
                    </div>
                ` : `
                    <div style="text-align: center; padding: 1rem; color: #10B981; font-weight: 500;">
                        🎉 All links are working! No broken links found.
                    </div>
                `}
            </div>
        `;

        this.uiManager.showModal('🔗 Link Check Results', content);

        setTimeout(() => {
            document.getElementById('moveBrokenToReview')?.addEventListener('click', () => {
                this.moveBrokenToCategory('To Review');
            });
            document.getElementById('archiveBroken')?.addEventListener('click', () => {
                this.archiveBroken();
            });
            document.getElementById('deleteBroken')?.addEventListener('click', () => {
                this.deleteBroken();
            });
            document.getElementById('recheckBroken')?.addEventListener('click', () => {
                this.recheckBroken();
            });
        }, 100);

        this.isOpen = true;
    }

    moveBrokenToCategory(category) {
        if (!this.results) return;
        const brokenBookmarks = this.results.results
            .filter(r => r.status === 'broken')
            .map(r => r.bookmark)
            .filter(b => b);

        if (brokenBookmarks.length === 0) {
            alert('No broken bookmarks to move.');
            return;
        }

        if (confirm(`Move ${brokenBookmarks.length} broken bookmark(s) to "${category}"?`)) {
            brokenBookmarks.forEach(b => {
                b.category = category;
            });
            this.uiManager.hideModal();
            if (window.app) {
                window.app.saveData();
                window.app.renderAll();
            }
            this.uiManager.showToast(`✅ Moved ${brokenBookmarks.length} broken bookmark(s) to "${category}"`, '📥');
        }
    }

    archiveBroken() {
        if (!this.results) return;
        const brokenBookmarks = this.results.results
            .filter(r => r.status === 'broken')
            .map(r => r.bookmark)
            .filter(b => b);

        if (brokenBookmarks.length === 0) {
            alert('No broken bookmarks to archive.');
            return;
        }

        if (confirm(`📥 Archive ${brokenBookmarks.length} broken bookmark(s)?`)) {
            brokenBookmarks.forEach(b => {
                b.isArchived = true;
                b.archivedDate = new Date().toISOString();
            });
            this.uiManager.hideModal();
            if (window.app) {
                window.app.saveData();
                window.app.renderAll();
            }
            this.uiManager.showToast(`✅ Archived ${brokenBookmarks.length} broken bookmark(s)`, '📥');
        }
    }

    deleteBroken() {
        if (!this.results) return;
        const brokenBookmarks = this.results.results
            .filter(r => r.status === 'broken')
            .map(r => r.bookmark)
            .filter(b => b);

        if (brokenBookmarks.length === 0) {
            alert('No broken bookmarks to delete.');
            return;
        }

        if (confirm(`🗑️ Permanently delete ${brokenBookmarks.length} broken bookmark(s)?\n\nThis action cannot be undone!`)) {
            const ids = brokenBookmarks.map(b => b.id);
            ids.forEach(id => {
                window.app.bookmarkManager.deleteBookmark(id);
            });
            this.uiManager.hideModal();
            if (window.app) {
                window.app.saveData();
                window.app.renderAll();
            }
            this.uiManager.showToast(`🗑️ Deleted ${brokenBookmarks.length} broken bookmark(s)`, '🗑️');
        }
    }

    recheckBroken() {
        if (!this.results) return;
        const brokenBookmarks = this.results.results
            .filter(r => r.status === 'broken')
            .map(r => r.bookmark)
            .filter(b => b);

        if (brokenBookmarks.length === 0) {
            alert('No broken bookmarks to re-check.');
            return;
        }

        this.uiManager.hideModal();
        alert(`🔄 Re-checking ${brokenBookmarks.length} broken bookmark(s)...\n\nThis will re-check only the broken links.`);

        if (window.app && window.app.linkChecker) {
            window.app.linkChecker.checkAllBookmarks({
                filter: (b) => brokenBookmarks.some(bb => bb.id === b.id),
                batchSize: 10,
                delayBetweenBatches: 200,
                timeout: 8000
            });
        }
    }

    close() {
        this.isOpen = false;
        this.uiManager.hideModal();
    }
}
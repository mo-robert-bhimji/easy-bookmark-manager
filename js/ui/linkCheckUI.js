// ========================================
// 🔗 LINK CHECK UI
// ========================================

export class LinkCheckUI {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.isOpen = false;
        this.app = window.app;
    }

    showProgress(progress) {
        if (!this.isOpen) {
            this.isOpen = true;
            this.uiManager.showModal('🔗 Checking Links...', this.buildProgressContent(progress));
        } else {
            this.updateProgressContent(progress);
        }
    }

    buildProgressContent(progress) {
        const total = progress.total || 0;
        const checked = progress.checked || 0;
        const broken = progress.broken || 0;
        const working = progress.working || 0;
        const redirects = progress.redirects || 0;
        const timeouts = progress.timeouts || 0;
        const errors = progress.errors || 0;
        const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;

        return `
            <div id="linkCheckProgress">
                <div style="margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.25rem;">
                        <span>Progress</span>
                        <span><strong>${percentage}%</strong></span>
                    </div>
                    <div style="background: #E5E7EB; border-radius: 8px; height: 8px; overflow: hidden;">
                        <div id="linkCheckProgressBar" style="width: ${percentage}%; height: 100%; background: #4F46E5; transition: width 0.3s ease;"></div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem;">
                    <div style="background: #F3F4F6; padding: 0.5rem; border-radius: 6px; text-align: center;">
                        <div style="font-size: 0.65rem; color: #6B7280;">Checked</div>
                        <div style="font-size: 1.2rem; font-weight: 600;" id="linkCheckChecked">${checked}</div>
                    </div>
                    <div style="background: #D1FAE5; padding: 0.5rem; border-radius: 6px; text-align: center;">
                        <div style="font-size: 0.65rem; color: #059669;">✅ Working</div>
                        <div style="font-size: 1.2rem; font-weight: 600; color: #059669;" id="linkCheckWorking">${working}</div>
                    </div>
                    <div style="background: #FEE2E2; padding: 0.5rem; border-radius: 6px; text-align: center;">
                        <div style="font-size: 0.65rem; color: #DC2626;">❌ Broken</div>
                        <div style="font-size: 1.2rem; font-weight: 600; color: #DC2626;" id="linkCheckBroken">${broken}</div>
                    </div>
                    <div style="background: #FEF3C7; padding: 0.5rem; border-radius: 6px; text-align: center;">
                        <div style="font-size: 0.65rem; color: #D97706;">⚠️ Redirect</div>
                        <div style="font-size: 1.2rem; font-weight: 600; color: #D97706;" id="linkCheckRedirects">${redirects}</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <div style="background: #FEF3C7; padding: 0.4rem; border-radius: 6px; text-align: center;">
                        <div style="font-size: 0.65rem; color: #D97706;">⏱️ Timeout</div>
                        <div style="font-size: 1rem; font-weight: 600; color: #D97706;" id="linkCheckTimeouts">${timeouts}</div>
                    </div>
                    <div style="background: #F3F4F6; padding: 0.4rem; border-radius: 6px; text-align: center;">
                        <div style="font-size: 0.65rem; color: #6B7280;">❓ Error</div>
                        <div style="font-size: 1rem; font-weight: 600; color: #6B7280;" id="linkCheckErrors">${errors}</div>
                    </div>
                </div>

                <div style="font-size: 0.8rem; color: #6B7280; text-align: center; margin-top: 0.5rem;">
                    ${checked} of ${total} bookmarks checked
                </div>
            </div>
        `;
    }

    updateProgressContent(progress) {
        const total = progress.total || 0;
        const checked = progress.checked || 0;
        const broken = progress.broken || 0;
        const working = progress.working || 0;
        const redirects = progress.redirects || 0;
        const timeouts = progress.timeouts || 0;
        const errors = progress.errors || 0;
        const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;

        const bar = document.getElementById('linkCheckProgressBar');
        if (bar) bar.style.width = percentage + '%';

        const checkedEl = document.getElementById('linkCheckChecked');
        if (checkedEl) checkedEl.textContent = checked;

        const workingEl = document.getElementById('linkCheckWorking');
        if (workingEl) workingEl.textContent = working;

        const brokenEl = document.getElementById('linkCheckBroken');
        if (brokenEl) brokenEl.textContent = broken;

        const redirectsEl = document.getElementById('linkCheckRedirects');
        if (redirectsEl) redirectsEl.textContent = redirects;

        const timeoutsEl = document.getElementById('linkCheckTimeouts');
        if (timeoutsEl) timeoutsEl.textContent = timeouts;

        const errorsEl = document.getElementById('linkCheckErrors');
        if (errorsEl) errorsEl.textContent = errors;
    }

    showResults(summary) {
        this.isOpen = false;
        const total = summary.total || 0;
        const broken = summary.broken || 0;
        const working = summary.working || 0;
        const redirects = summary.redirects || 0;
        const timeouts = summary.timeouts || 0;
        const errors = summary.errors || 0;
        const brokenList = summary.brokenList || [];

        let brokenHtml = '';
        if (brokenList.length > 0) {
            brokenHtml = `
                <div style="margin-top: 1rem;">
                    <h4 style="color: #DC2626; margin-bottom: 0.5rem;">❌ Broken Links (${brokenList.length})</h4>
                    <div style="max-height: 200px; overflow-y: auto; background: #F9FAFB; border-radius: 6px; padding: 0.5rem; border: 1px solid #E5E7EB;">
                        ${brokenList.map(b => `
                            <div style="padding: 0.25rem 0.5rem; font-size: 0.8rem; border-bottom: 1px solid #E5E7EB; display: flex; justify-content: space-between;">
                                <span style="color: #1F2937; word-break: break-all;">${b.url || b.title || 'Unknown'}</span>
                                <span style="color: #6B7280; font-size: 0.7rem;">${b.statusText || 'Error'}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        const content = `
            <div id="linkCheckResults">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem;">
                    <div style="background: #D1FAE5; padding: 0.75rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 0.7rem; color: #059669;">✅ Working</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #059669;">${working}</div>
                    </div>
                    <div style="background: #FEE2E2; padding: 0.75rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 0.7rem; color: #DC2626;">❌ Broken</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #DC2626;">${broken}</div>
                    </div>
                    <div style="background: #FEF3C7; padding: 0.75rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 0.7rem; color: #D97706;">⚠️ Redirect</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #D97706;">${redirects}</div>
                    </div>
                    <div style="background: #F3F4F6; padding: 0.75rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 0.7rem; color: #6B7280;">⏱️ Timeout</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #6B7280;">${timeouts}</div>
                    </div>
                </div>

                <div style="background: #F3F4F6; padding: 0.5rem; border-radius: 8px; text-align: center; margin-bottom: 1rem;">
                    <span style="font-size: 0.85rem; color: #6B7280;">❓ Errors: <strong>${errors}</strong></span>
                    <span style="font-size: 0.85rem; color: #6B7280; margin-left: 1rem;">📊 Total: <strong>${total}</strong></span>
                </div>

                ${brokenHtml}

                <div style="text-align: center; margin-top: 1.5rem;">
                    <button class="btn btn-secondary" id="linkCheckCloseBtn" style="min-width: 120px; justify-content: center;">
                        ✅ Close
                    </button>
                </div>
            </div>
        `;

        this.uiManager.showModal('🔗 Link Check Results', content);

        document.getElementById('linkCheckCloseBtn')?.addEventListener('click', () => {
            this.uiManager.hideModal();
            // Refresh the bookmark grid
            if (this.app && this.app.renderAll) {
                this.app.renderAll();
            }
        });
    }

    close() {
        this.isOpen = false;
        this.uiManager.hideModal();
    }
}
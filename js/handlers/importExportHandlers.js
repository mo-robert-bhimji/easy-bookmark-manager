// ========================================
// 📥 IMPORT / EXPORT HANDLERS
// ========================================

export class ImportExportHandlers {
    constructor(app) {
        this.app = app;
    }

    showImportModal() {
        const bookmarks = this.app.bookmarkManager.getBookmarks();
        const activeCount = bookmarks.filter(b => !b.isArchived).length;
        const archivedCount = bookmarks.filter(b => b.isArchived).length;
        const categories = this.app.categoryManager.getCategories();
        const history = this.app.importManager ? this.app.importManager.getImportHistory() : [];

        const content = `
            <div class="form-group">
                <label>Import from Chrome Bookmarks</label>
                <div class="description">
                    Export your bookmarks from Chrome (Bookmarks → Export Bookmarks) and upload the HTML file here.
                </div>
                <button id="importFromFileBtn" class="btn btn-primary btn-full" style="width: 100%; justify-content: center;">
                    📄 Choose Chrome Bookmarks HTML File
                </button>
                <div class="checkbox-group">
                    <input type="checkbox" id="importNewOnly" checked>
                    <label for="importNewOnly">Import new bookmarks only (skip duplicates)</label>
                </div>
            </div>
            <hr class="divider">
            <div class="form-group">
                <label>Import from JSON Export</label>
                <button id="importFromJsonBtn" class="btn btn-secondary btn-full" style="width: 100%; justify-content: center;">
                    📂 Choose JSON Export File
                </button>
            </div>
            <div class="form-group" style="margin-top: 1rem;">
                <label>Current Collection</label>
                <div class="info-box">
                    <div class="stat-row"><strong>${activeCount}</strong> active bookmarks</div>
                    <div class="stat-row"><strong>${archivedCount}</strong> archived</div>
                    <div class="stat-meta">${categories.length} categories • ${history.length} imports</div>
                </div>
            </div>
        `;

        this.app.uiManager.showModal('📥 Import Bookmarks', content);

        document.getElementById('importFromFileBtn')?.addEventListener('click', () => {
            this.app.uiManager.hideModal();
            const input = document.getElementById('fileInput');
            if (input) { input.accept = '.html,.htm'; input.click(); }
        });

        document.getElementById('importFromJsonBtn')?.addEventListener('click', () => {
            this.app.uiManager.hideModal();
            const input = document.getElementById('fileInput');
            if (input) { input.accept = '.json'; input.click(); }
        });
    }

    showExportModal() {
        const bookmarks = this.app.bookmarkManager.getBookmarks();
        if (bookmarks.length === 0) {
            alert('No bookmarks to export.');
            return;
        }

        const activeCount = bookmarks.filter(b => !b.isArchived).length;
        const archivedCount = bookmarks.filter(b => b.isArchived).length;
        const categories = this.app.categoryManager.getCategories();
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            bookmarks: bookmarks,
            categories: categories,
            totalBookmarks: bookmarks.length,
            isClassificationComplete: this.app.isClassificationComplete
        };
        const json = JSON.stringify(exportData, null, 2);

        const content = `
            <div class="form-group">
                <label>Export Format</label>
                <select id="exportFormat" style="width:100%; padding:0.6rem 1rem; border:1px solid #D1D5DB; border-radius:8px; font-size:0.95rem; color:#1F2937; background:#FFFFFF;">
                    <option value="json">JSON (App Format - Full Data)</option>
                    <option value="chrome">Chrome HTML (Import to Chrome with Categories)</option>
                </select>
            </div>
            <div class="form-group">
                <label>Export Summary</label>
                <div class="info-box">
                    <div class="stat-row"><strong>${activeCount}</strong> active bookmarks</div>
                    <div class="stat-row"><strong>${archivedCount}</strong> archived</div>
                    <div class="stat-row"><strong>${categories.length - 1}</strong> categories</div>
                    <div class="stat-meta">
                        ${this.app.isClassificationComplete ? '✅ Classification complete' : '⏳ Classification partial'}
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label>Export File Name</label>
                <input type="text" id="exportFileName" value="bookmarks_export_${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-actions">
                <button id="downloadExportBtn" class="btn btn-success" style="flex:1; justify-content:center;">💾 Download</button>
                <button class="btn btn-secondary" onclick="document.getElementById('modal').style.display='none'" style="flex:1; justify-content:center;">Cancel</button>
            </div>
        `;

        this.app.uiManager.showModal('💾 Export Bookmarks', content);

        document.getElementById('downloadExportBtn')?.addEventListener('click', () => {
            const fileName = document.getElementById('exportFileName')?.value || 'bookmarks_export';
            const format = document.getElementById('exportFormat')?.value || 'json';
            if (format === 'chrome') {
                const html = this.app.exportManager.generateChromeHtml();
                this.app.exportManager.downloadFile(html, `${fileName}.html`, 'text/html');
            } else {
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${fileName}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        });
    }

    async handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const content = await file.text();
            const isJson = file.name.endsWith('.json');

            if (isJson) {
                const result = await this.app.importManager.importFromJson(content);
                if (result.success) {
                    this.app.categoryManager.setCategories(result.categories || ['All']);
                    this.app.currentCategory = 'All';
                    this.app.isClassificationComplete = result.isClassificationComplete || false;
                    if (this.app.bulkActions) this.app.bulkActions.clearSelection();
                    this.app.saveData();
                    this.app.renderAll();
                    alert(`✅ Loaded ${result.count} bookmarks from "${file.name}"!`);
                } else {
                    alert('❌ ' + result.message);
                }
            } else {
                const importNewOnly = document.getElementById('importNewOnly')?.checked !== false;
                const result = await this.app.importManager.importFromChromeHtml(content, importNewOnly);

                if (!result.success) {
                    alert(result.message);
                    event.target.value = '';
                    return;
                }

                const categories = this.app.categoryManager.extractCategories(
                    this.app.bookmarkManager.getBookmarks()
                );
                this.app.categoryManager.setCategories(categories);
                if (!this.app.categoryManager.getCategories().includes('To Review')) {
                    this.app.categoryManager.addCategory('To Review');
                }

                this.app.isClassificationComplete = false;
                if (this.app.bulkActions) this.app.bulkActions.clearSelection();
                this.app.saveData();
                this.app.renderAll();

                const msg = `✅ Imported ${result.count} new bookmarks from "${file.name}"!${result.skipped > 0 ? `\n${result.skipped} existing bookmark(s) were skipped.` : ''}`;
                alert(msg);

                if (this.app.aiClassifier && result.count > 0 && confirm('Auto-classify these new bookmarks?')) {
                    await this.app.startClassification();
                }
            }
        } catch (error) {
            console.error('Import error:', error);
            alert('Error importing: ' + error.message);
        }
        event.target.value = '';
    }
}
// ========================================
// 💾 EXPORT MANAGER
// Handles JSON and Chrome HTML exports
// ========================================

export class ExportManager {
    constructor(bookmarkManager, categoryManager) {
        this.bookmarkManager = bookmarkManager;
        this.categoryManager = categoryManager;
    }

    // ----- Generate JSON export data -----
    generateJsonExport() {
        const bookmarks = this.bookmarkManager.getBookmarks();
        return {
            version: '1.0',
            exportDate: new Date().toISOString(),
            bookmarks: bookmarks,
            categories: this.categoryManager.getCategories(),
            totalBookmarks: bookmarks.length,
            stats: this.bookmarkManager.getStats()
        };
    }

    // ----- Generate Chrome HTML export -----
    generateChromeHtml() {
        const activeBookmarks = this.bookmarkManager.getActiveBookmarks();
        const categories = this.categoryManager.getCategories().filter(c => c !== 'All');
        
        const categorized = {};
        const uncategorized = [];
        
        activeBookmarks.forEach(b => {
            const cat = b.category || 'Uncategorized';
            if (cat === 'Uncategorized') {
                uncategorized.push(b);
            } else {
                if (!categorized[cat]) {
                    categorized[cat] = [];
                }
                categorized[cat].push(b);
            }
        });
        
        let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`;
        
        const sortedCategories = Object.keys(categorized).sort();
        sortedCategories.forEach(category => {
            const bookmarks = categorized[category];
            const folderDate = Math.floor(Date.now() / 1000);
            
            html += `    <DT><H3 ADD_DATE="${folderDate}" LAST_MODIFIED="${folderDate}">${this.escapeHtml(category)}</H3>
    <DL><p>
`;
            
            const sortedBookmarks = bookmarks.sort((a, b) => a.title.localeCompare(b.title));
            sortedBookmarks.forEach(b => {
                const addedDate = b.addedDate ? Math.floor(new Date(b.addedDate).getTime() / 1000) : folderDate;
                const escapedTitle = this.escapeHtml(b.title || 'Untitled');
                html += `        <DT><A HREF="${b.url}" ADD_DATE="${addedDate}">${escapedTitle}</A>
`;
            });
            
            html += `    </DL><p>
`;
        });
        
        if (uncategorized.length > 0) {
            const folderDate = Math.floor(Date.now() / 1000);
            html += `    <DT><H3 ADD_DATE="${folderDate}" LAST_MODIFIED="${folderDate}">Uncategorized</H3>
    <DL><p>
`;
            const sortedUncategorized = uncategorized.sort((a, b) => a.title.localeCompare(b.title));
            sortedUncategorized.forEach(b => {
                const addedDate = b.addedDate ? Math.floor(new Date(b.addedDate).getTime() / 1000) : folderDate;
                const escapedTitle = this.escapeHtml(b.title || 'Untitled');
                html += `        <DT><A HREF="${b.url}" ADD_DATE="${addedDate}">${escapedTitle}</A>
`;
            });
            html += `    </DL><p>
`;
        }
        
        html += `</DL><p>`;
        return html;
    }

    // ----- Escape HTML for export -----
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ----- Download file helper -----
    downloadFile(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
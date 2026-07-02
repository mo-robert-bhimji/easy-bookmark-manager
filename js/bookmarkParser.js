// ========================================
// 📄 BOOKMARK PARSER - ANOMALIES FIXED
// ========================================

export class BookmarkParser {
    parseChromeBookmarks(html) {
        console.log('🔍 Starting bookmark parse...');
        
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const bookmarks = [];
            const folderPath = [];
            let anchorCount = 0;
            
            // ----- Helper: Check if URL is an anomaly -----
            const isAnomalyUrl = (url) => {
                if (!url) return true;
                const urlLower = url.toLowerCase();
                
                // Chrome internal pages
                if (urlLower.startsWith('chrome://')) return true;
                if (urlLower.startsWith('chrome-extension://')) return true;
                
                // Browser internal pages
                if (urlLower.startsWith('about:')) return true;
                if (urlLower.startsWith('edge://')) return true;
                if (urlLower.startsWith('brave://')) return true;
                if (urlLower.startsWith('opera://')) return true;
                if (urlLower.startsWith('vivaldi://')) return true;
                
                // Special URL schemes
                if (urlLower.startsWith('blob:')) return true;
                if (urlLower.startsWith('data:')) return true;
                if (urlLower.startsWith('file:')) return true;
                if (urlLower.startsWith('javascript:')) return true;
                
                // URLs that are just the domain with no path
                // Check if it's a valid http/https URL with a proper hostname
                try {
                    const urlObj = new URL(url);
                    // If it's http/https but has no hostname or hostname is empty
                    if ((urlLower.startsWith('http://') || urlLower.startsWith('https://')) && !urlObj.hostname) {
                        return true;
                    }
                } catch (e) {
                    // If URL can't be parsed at all, it's an anomaly
                    return true;
                }
                
                return false;
            };
            
            // ----- Helper: Check if title is an anomaly -----
            const isAnomalyTitle = (title) => {
                if (!title) return false;
                const titleLower = title.toLowerCase();
                const anomalyTitles = [
                    'recent tabs',
                    'bookmarks',
                    'new tab',
                    'chrome',
                    'settings',
                    'extensions',
                    'history',
                    'downloads',
                    'about'
                ];
                return anomalyTitles.some(t => titleLower === t);
            };
            
            const traverseNode = (node, currentPath) => {
                // Check for folders (H3 tags)
                if (node.tagName === 'H3') {
                    const folderName = node.textContent.trim();
                    const newPath = [...currentPath, folderName];
                    
                    let nextSibling = node.nextElementSibling;
                    while (nextSibling && nextSibling.tagName !== 'DL') {
                        nextSibling = nextSibling.nextElementSibling;
                    }
                    
                    if (nextSibling) {
                        traverseNode(nextSibling, newPath);
                    }
                    return;
                }
                
                if (node.tagName === 'DL') {
                    for (let child of node.children) {
                        traverseNode(child, currentPath);
                    }
                    return;
                }
                
                if (node.tagName === 'DT') {
                    const links = node.querySelectorAll('a');
                    for (let link of links) {
                        anchorCount++;
                        const url = link.getAttribute('href');
                        const title = link.textContent.trim();
                        
                        if (!url || !title || url.startsWith('javascript:') || url.startsWith('#')) {
                            console.log(`⚠️ Skipping invalid bookmark: ${title || 'untitled'}`);
                            continue;
                        }
                        
                        let description = '';
                        let nextSibling = link.parentElement.nextElementSibling;
                        while (nextSibling && nextSibling.tagName !== 'DD' && nextSibling.tagName !== 'DT') {
                            nextSibling = nextSibling.nextElementSibling;
                        }
                        if (nextSibling && nextSibling.tagName === 'DD') {
                            description = nextSibling.textContent.trim();
                        }
                        
                        let domain = '';
                        try {
                            const urlObj = new URL(url);
                            domain = urlObj.hostname.replace('www.', '');
                        } catch (e) {
                            domain = '';
                        }
                        
                        const thumbnail = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : '';
                        const folderString = currentPath.length > 0 ? currentPath.join(' > ') : 'Root';
                        
                        // ----- Parse ADD_DATE -----
                        const addDateAttr = link.getAttribute('ADD_DATE');
                        let addedDate;
                        if (addDateAttr) {
                            const timestamp = parseInt(addDateAttr);
                            if (!isNaN(timestamp) && timestamp > 0) {
                                addedDate = new Date(timestamp * 1000).toISOString();
                            } else {
                                addedDate = new Date().toISOString();
                            }
                        } else {
                            addedDate = new Date().toISOString();
                        }
                        
                        // ----- FIX: Auto-categorize Anomalies -----
                        let category = 'Uncategorized';
                        
                        // Check if URL is an anomaly
                        if (isAnomalyUrl(url)) {
                            category = 'Anomalies';
                        }
                        // Check if title matches anomaly patterns
                        else if (isAnomalyTitle(title)) {
                            category = 'Anomalies';
                        }
                        // Check if domain is empty (failed URL parse)
                        else if (!domain) {
                            category = 'Anomalies';
                        }
                        
                        bookmarks.push({
                            id: this.generateId(),
                            title: this.sanitize(title),
                            url: this.sanitize(url),
                            description: this.sanitize(description),
                            thumbnail: thumbnail,
                            domain: domain,
                            category: category,
                            folderPath: folderString,
                            folderArray: currentPath.length > 0 ? [...currentPath] : [],
                            tags: [],
                            addedDate: addedDate,
                            source: 'chrome',
                            importBatch: Date.now(),
                            isArchived: false
                        });
                    }
                    return;
                }
                
                if (node.children) {
                    for (let child of node.children) {
                        traverseNode(child, currentPath);
                    }
                }
            };
            
            traverseNode(doc.body, []);
            
            console.log(`📊 Found ${anchorCount} <A> tags in the file`);
            console.log(`📊 Created ${bookmarks.length} valid bookmarks`);
            
            // Log anomalies count
            const anomaliesCount = bookmarks.filter(b => b.category === 'Anomalies').length;
            console.log(`📊 ${anomaliesCount} anomalies bookmarks (chrome://, blob:, etc.)`);
            
            const domains = new Set();
            bookmarks.forEach(b => {
                if (b.domain) domains.add(b.domain);
            });
            console.log(`📊 ${domains.size} unique domains found`);
            
            if (bookmarks.length === 0) {
                console.warn('⚠️ No bookmarks were parsed. Checking file structure...');
                console.log('📄 File contains', doc.querySelectorAll('a').length, 'anchor tags total');
            }
            
            return bookmarks;
            
        } catch (error) {
            console.error('❌ Error parsing bookmarks:', error);
            console.error('Stack trace:', error.stack);
            throw new Error(`Failed to parse bookmarks: ${error.message}`);
        }
    }
    
    generateId() {
        return 'bm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    sanitize(text) {
        if (!text) return '';
        return text
            .replace(/<[^>]*>/g, '')
            .replace(/&[^;]+;/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 500);
    }
}
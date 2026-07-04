// ========================================
// 🔗 LINK CHECKER - WITH RATE LIMITING
// ========================================

export class LinkChecker {
    constructor(bookmarkManager) {
        this.bookmarkManager = bookmarkManager;
        this.results = [];
        this.isRunning = false;
        this.cancelled = false;
        this.progressCallbacks = [];
        this.resultCallbacks = [];
        this.startTime = null;
    }

    onProgress(callback) {
        this.progressCallbacks.push(callback);
    }

    onResults(callback) {
        this.resultCallbacks.push(callback);
    }

    // ----- Check a single URL -----
    async checkUrl(url, timeout = 5000) {
        const startTime = Date.now();
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(url, {
                method: 'HEAD',
                signal: controller.signal,
                mode: 'no-cors',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            clearTimeout(timeoutId);
            const elapsed = Date.now() - startTime;

            return {
                url: url,
                status: response.type === 'opaque' ? 'verified' : 'error',
                statusText: response.type === 'opaque' ? 'OK (opaque)' : 'Unknown',
                elapsed: elapsed,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            let status = 'error';
            let statusText = error.message;

            if (error.name === 'AbortError') {
                status = 'timeout';
                statusText = 'Connection timeout';
            } else if (error.message.includes('Failed to fetch')) {
                status = 'broken';
                statusText = 'Unable to reach site';
            } else if (error.message.includes('SSL')) {
                status = 'error';
                statusText = 'SSL certificate error';
            } else {
                status = 'error';
                statusText = error.message || 'Unknown error';
            }

            return {
                url: url,
                status: status,
                statusText: statusText,
                elapsed: Date.now() - startTime,
                timestamp: new Date().toISOString()
            };
        }
    }

    // ----- Check all bookmarks with rate limiting -----
    async checkAllBookmarks(options = {}) {
        if (this.isRunning) {
            console.warn('⚠️ Link check already running');
            return;
        }

        const {
            batchSize = 10,
            delayBetweenBatches = 500,
            timeout = 8000,
            maxRetries = 2,
            adaptiveBackoff = true,
            filter = null
        } = options;

        this.isRunning = true;
        this.cancelled = false;
        this.results = [];
        this.startTime = Date.now();

        let bookmarks = this.bookmarkManager.getBookmarks();
        if (filter) {
            bookmarks = bookmarks.filter(filter);
        }

        const total = bookmarks.length;
        let checked = 0;
        let working = 0;
        let broken = 0;
        let redirects = 0;
        let errors = 0;
        let timeouts = 0;
        let consecutiveErrors = 0;
        let currentDelay = delayBetweenBatches;

        console.log(`🔗 Starting link check for ${total} bookmarks...`);
        console.log(`📊 Batch size: ${batchSize}, Delay: ${delayBetweenBatches}ms, Timeout: ${timeout/1000}s`);

        this.progressCallbacks.forEach(cb => cb({
            total: total,
            checked: 0,
            working: 0,
            broken: 0,
            redirects: 0,
            errors: 0,
            timeouts: 0,
            progress: 0
        }));

        for (let i = 0; i < bookmarks.length; i += batchSize) {
            // Check for cancellation
            if (this.cancelled) {
                console.log('⏹ Link check cancelled');
                break;
            }

            // Adaptive backoff for errors
            if (adaptiveBackoff) {
                if (consecutiveErrors > 3) {
                    currentDelay = Math.min(currentDelay * 1.5, 3000);
                    console.log(`⚠️ Increasing delay to ${currentDelay}ms due to errors`);
                } else if (currentDelay > delayBetweenBatches && consecutiveErrors === 0) {
                    currentDelay = Math.max(currentDelay / 1.2, delayBetweenBatches);
                }
            }

            const batch = bookmarks.slice(i, i + batchSize);
            const batchPromises = batch.map(bookmark => this.checkUrl(bookmark.url, timeout));
            const batchResults = await Promise.allSettled(batchPromises);

            let batchErrors = 0;
            batchResults.forEach((result, index) => {
                const bookmark = batch[index];
                let checkResult;

                if (result.status === 'fulfilled') {
                    checkResult = result.value;
                } else {
                    checkResult = {
                        url: bookmark.url,
                        status: 'error',
                        statusText: result.reason?.message || 'Unknown error',
                        elapsed: 0,
                        timestamp: new Date().toISOString()
                    };
                    batchErrors++;
                }

                checkResult.bookmark = bookmark;
                this.results.push(checkResult);

                // Update the bookmark with link status
                bookmark.linkStatus = {
                    status: checkResult.status,
                    statusText: checkResult.statusText,
                    lastChecked: checkResult.timestamp,
                    elapsed: checkResult.elapsed
                };

                checked++;
                const status = checkResult.status;
                if (status === 'verified' || status === 'opaque') {
                    working++;
                } else if (status === 'redirect') {
                    redirects++;
                } else if (status === 'timeout') {
                    timeouts++;
                } else if (status === 'broken') {
                    broken++;
                } else {
                    errors++;
                }
            });

            // Update consecutive errors
            if (adaptiveBackoff) {
                if (batchErrors > 0) {
                    consecutiveErrors += batchErrors;
                } else {
                    consecutiveErrors = 0;
                }
            }

            const progress = Math.round((checked / total) * 100);
            this.progressCallbacks.forEach(cb => cb({
                total: total,
                checked: checked,
                working: working,
                broken: broken,
                redirects: redirects,
                errors: errors,
                timeouts: timeouts,
                progress: progress
            }));

            // Wait between batches (with adaptive delay)
            if (i + batchSize < bookmarks.length) {
                await new Promise(resolve => setTimeout(resolve, currentDelay));
            }
        }

        this.isRunning = false;

        const summary = {
            total: total,
            checked: checked,
            working: working,
            broken: broken,
            redirects: redirects,
            errors: errors,
            timeouts: timeouts,
            results: this.results
        };

        const elapsedSeconds = Math.round((Date.now() - this.startTime) / 1000);
        console.log(`✅ Link check complete: ${working} working, ${broken} broken, ${redirects} redirects, ${errors} errors, ${timeouts} timeouts`);
        console.log(`📊 Total time: ${elapsedSeconds} seconds`);

        this.resultCallbacks.forEach(cb => cb(summary));

        if (window.app) {
            window.app.saveData();
            window.app.renderAll();
        }

        return summary;
    }

    cancel() {
        this.cancelled = true;
        this.isRunning = false;
        console.log('⏹ Link check cancelled by user');
    }

    getBrokenBookmarks() {
        return this.results
            .filter(r => r.status === 'broken')
            .map(r => r.bookmark);
    }

    getIssueBookmarks() {
        return this.results
            .filter(r => r.status !== 'verified' && r.status !== 'opaque')
            .map(r => r.bookmark);
    }

    getSummary() {
        const working = this.results.filter(r => r.status === 'verified' || r.status === 'opaque').length;
        const broken = this.results.filter(r => r.status === 'broken').length;
        const redirects = this.results.filter(r => r.status === 'redirect').length;
        const errors = this.results.filter(r => r.status === 'error').length;
        const timeouts = this.results.filter(r => r.status === 'timeout').length;
        const total = this.results.length;

        return {
            total,
            working,
            broken,
            redirects,
            errors,
            timeouts
        };
    }
}
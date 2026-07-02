// ========================================
// 🤖 CLASSIFICATION MANAGER
// Handles AI classification with progress tracking
// ========================================

export class ClassificationManager {
    constructor(aiClassifier, bookmarkManager, categoryManager) {
        this.aiClassifier = aiClassifier;
        this.bookmarkManager = bookmarkManager;
        this.categoryManager = categoryManager;
        
        this.isRunning = false;
        this.isPaused = false;
        this.isCancelled = false;
        this.classifiedCount = 0;
        this.totalToClassify = 0;
        this.startTime = null;
        this.apiCalls = 0;
        this.errors = [];
        this.logs = [];
        this.progressCallbacks = [];
        this.logCallbacks = [];
        this.partialResultsCallbacks = [];
        
        this.batchSize = 25;
        this.batchDelay = 10;
    }

    // ----- Register callbacks -----
    onProgress(callback) {
        this.progressCallbacks.push(callback);
    }

    onLog(callback) {
        this.logCallbacks.push(callback);
    }

    onPartialResults(callback) {
        this.partialResultsCallbacks.push(callback);
    }

    // ----- Add log entry -----
    addLog(message, level = 'info') {
        const entry = {
            time: new Date().toLocaleTimeString(),
            message,
            level
        };
        this.logs.push(entry);
        if (this.logs.length > 200) this.logs.shift();
        this.logCallbacks.forEach(cb => cb(entry));
    }

    // ----- Update progress -----
    updateProgress() {
        const progress = {
            classified: this.classifiedCount,
            total: this.totalToClassify,
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            isCancelled: this.isCancelled,
            apiCalls: this.apiCalls,
            errors: this.errors.length,
            startTime: this.startTime
        };
        this.progressCallbacks.forEach(cb => cb(progress));
    }

    // ----- Notify partial results -----
    notifyPartialResults() {
        const bookmarks = this.bookmarkManager.getBookmarks();
        this.partialResultsCallbacks.forEach(cb => cb(bookmarks));
    }

    // ----- Run classification -----
    async classifyAll(categoryNames = null) {
        const activeBookmarks = this.bookmarkManager.getActiveBookmarks();
        
        if (activeBookmarks.length === 0) {
            this.addLog('No active bookmarks to classify.', 'warning');
            return { success: false, message: 'No active bookmarks to classify.' };
        }

        if (!this.aiClassifier) {
            this.addLog('No AI classifier available. Please set up API key.', 'error');
            return { success: false, message: 'AI classifier not available.' };
        }

        this.isRunning = true;
        this.isPaused = false;
        this.isCancelled = false;
        this.classifiedCount = 0;
        this.totalToClassify = activeBookmarks.length;
        this.startTime = Date.now();
        this.apiCalls = 0;
        this.errors = [];
        this.logs = [];
        
        this.addLog(`🚀 Starting classification of ${this.totalToClassify.toLocaleString()} bookmarks...`, 'info');
        this.addLog(`📦 Batch size: ${this.batchSize} bookmarks per call`, 'info');
        this.addLog(`🤖 Using DeepSeek ${this.aiClassifier.model || 'V4'}`, 'info');
        this.updateProgress();

        try {
            if (!categoryNames) {
                this.addLog('🔍 Analyzing bookmarks to determine categories...', 'info');
                categoryNames = await this.aiClassifier.getCategories(activeBookmarks);
                this.addLog(`📂 Found ${categoryNames.length} categories`, 'info');
            }

            let newCategoriesAdded = 0;
            categoryNames.forEach(cat => {
                if (cat !== 'Uncategorized') {
                    const added = this.categoryManager.addCategory(cat);
                    if (added) newCategoriesAdded++;
                }
            });
            if (newCategoriesAdded > 0) {
                this.addLog(`➕ Added ${newCategoriesAdded} new categories`, 'info');
            }

            this.addLog('🔄 Starting classification...', 'info');

            const totalBatches = Math.ceil(activeBookmarks.length / this.batchSize);
            let batchCount = 0;

            for (let i = 0; i < activeBookmarks.length; i += this.batchSize) {
                if (this.isCancelled) {
                    this.addLog('⚠️ Classification cancelled by user', 'warning');
                    this.isRunning = false;
                    this.updateProgress();
                    this.notifyPartialResults();
                    return { success: false, message: 'Cancelled by user', partial: true };
                }

                while (this.isPaused) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    if (this.isCancelled) {
                        this.addLog('⚠️ Classification cancelled while paused', 'warning');
                        this.isRunning = false;
                        this.updateProgress();
                        this.notifyPartialResults();
                        return { success: false, message: 'Cancelled while paused', partial: true };
                    }
                }

                const batch = activeBookmarks.slice(i, i + this.batchSize);
                batchCount++;
                this.apiCalls++;

                try {
                    const classifications = await this.aiClassifier.classifyBookmarks(batch, categoryNames);
                    
                    batch.forEach((bookmark, idx) => {
                        bookmark.category = classifications[idx]?.category || 'Uncategorized';
                        if (!bookmark.tags || bookmark.tags.length === 0) {
                            bookmark.tags = classifications[idx]?.tags || [];
                        }
                    });
                } catch (batchError) {
                    const errorMsg = `⚠️ Batch ${batchCount} failed: ${batchError.message}`;
                    this.addLog(errorMsg, 'warning');
                    this.errors.push({
                        batch: batchCount,
                        error: batchError.message,
                        bookmarks: batch.map(b => b.title).join(', ')
                    });
                    
                    batch.forEach(bookmark => {
                        bookmark.category = 'Uncategorized';
                    });
                }

                this.classifiedCount += batch.length;
                this.updateProgress();
                this.notifyPartialResults();

                if (batchCount % 5 === 0 || batchCount === totalBatches) {
                    const percent = Math.round((this.classifiedCount / this.totalToClassify) * 100);
                    this.addLog(
                        `📦 Batch ${batchCount}/${totalBatches} (${percent}%) - ${this.classifiedCount.toLocaleString()} bookmarks processed`,
                        'info'
                    );
                }
            }

            if (!this.categoryManager.getCategories().includes('Uncategorized')) {
                this.categoryManager.addCategory('Uncategorized');
            }

            this.isRunning = false;
            
            const errorCount = this.errors.length;
            const successMsg = `✅ Classification complete! ${this.totalToClassify.toLocaleString()} bookmarks categorized.`;
            const errorMsg = errorCount > 0 ? `\n⚠️ ${errorCount} batch(es) had errors. Check the log for details.` : '';
            this.addLog(successMsg + errorMsg, 'success');
            this.updateProgress();
            this.notifyPartialResults();

            return {
                success: true,
                total: this.totalToClassify,
                errors: this.errors.length,
                categories: categoryNames
            };

        } catch (error) {
            console.error('Error in classification:', error);
            this.addLog('❌ Fatal Error: ' + error.message, 'error');
            this.isRunning = false;
            this.updateProgress();
            this.notifyPartialResults();
            return { success: false, message: error.message, partial: true };
        }
    }

    // ----- Pause classification -----
    pause() {
        if (!this.isRunning) return;
        this.isPaused = true;
        this.addLog('⏸ Classification paused', 'warning');
        this.updateProgress();
    }

    // ----- Resume classification -----
    resume() {
        if (!this.isPaused) return;
        this.isPaused = false;
        this.addLog('▶️ Classification resumed', 'info');
        this.updateProgress();
    }

    // ----- Cancel classification -----
    cancel() {
        if (!this.isRunning) return;
        this.isCancelled = true;
        this.isRunning = false;
        this.addLog('⏹ Classification stopped by user', 'error');
        this.updateProgress();
        this.notifyPartialResults();
    }

    // ----- Download error log -----
    downloadErrorLog() {
        if (this.errors.length === 0) {
            return null;
        }

        let logContent = '=== Classification Error Log ===\n';
        logContent += `Date: ${new Date().toLocaleString()}\n`;
        logContent += `Total Errors: ${this.errors.length}\n\n`;

        this.errors.forEach((err, index) => {
            logContent += `--- Error ${index + 1} ---\n`;
            logContent += `Batch: ${err.batch}\n`;
            logContent += `Error: ${err.error}\n`;
            logContent += `Bookmarks affected: ${err.bookmarks}\n\n`;
        });

        return logContent;
    }

    // ----- Get statistics -----
    getStats() {
        const elapsed = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0;
        const speed = this.classifiedCount > 0 && elapsed > 0 ? Math.round(this.classifiedCount / elapsed) : 0;
        
        return {
            classified: this.classifiedCount,
            total: this.totalToClassify,
            elapsed: elapsed,
            speed: speed,
            apiCalls: this.apiCalls,
            errors: this.errors.length
        };
    }
}
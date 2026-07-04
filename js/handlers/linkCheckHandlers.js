// ========================================
// 🔗 LINK CHECK HANDLERS
// ========================================

const speedPresets = {
    fast: {
        label: 'Fast',
        batchSize: 15,
        delay: 200,
        timeout: 5,
        estimated: '1-2 min',
        warning: '⚠️ Aggressive - may trigger rate limits on shared hosting'
    },
    balanced: {
        label: 'Balanced',
        batchSize: 10,
        delay: 500,
        timeout: 8,
        estimated: '3-5 min',
        warning: '✅ Safe for most users'
    },
    safe: {
        label: 'Safe',
        batchSize: 8,
        delay: 1000,
        timeout: 10,
        estimated: '8-10 min',
        warning: '✅ Safe for shared hosting'
    },
    'very-safe': {
        label: 'Very Safe',
        batchSize: 5,
        delay: 2000,
        timeout: 15,
        estimated: '15-20 min',
        warning: '✅ Safest - minimal server load'
    }
};

export class LinkCheckHandlers {
    constructor(app) {
        this.app = app;
        this.isConfigOpen = false;
        this.totalBookmarks = 0;
    }

    // ----- Open the configuration modal -----
    openLinkCheckConfig() {
        const modal = document.getElementById('linkCheckConfigModal');
        if (!modal) return;

        this.totalBookmarks = this.app.bookmarkManager.getBookmarks().length;
        document.getElementById('configTotalBookmarks').textContent = this.totalBookmarks;

        modal.style.display = 'block';
        this.isConfigOpen = true;
        this.updateSummary('fast');
    }

    // ----- Close the configuration modal -----
    closeLinkCheckConfig() {
        document.getElementById('linkCheckConfigModal').style.display = 'none';
        this.isConfigOpen = false;
    }

    // ----- Update summary based on selected speed -----
    updateSummary(speed) {
        const preset = speedPresets[speed];
        if (!preset) return;

        document.getElementById('summaryMode').textContent = preset.label;
        document.getElementById('summaryBatch').textContent = preset.batchSize;
        document.getElementById('summaryDelay').textContent = preset.delay + 'ms';
        document.getElementById('summaryTimeout').textContent = preset.timeout + 's';
        document.getElementById('estTimeDisplay').textContent = preset.estimated;

        // Update advanced fields if they exist
        const advBatchSize = document.getElementById('advBatchSize');
        const advDelay = document.getElementById('advDelay');
        const advTimeout = document.getElementById('advTimeout');
        if (advBatchSize) advBatchSize.value = preset.batchSize;
        if (advDelay) advDelay.value = preset.delay;
        if (advTimeout) advTimeout.value = preset.timeout;
    }

    // ----- Start the link check with selected options -----
    async startLinkCheckWithOptions() {
        const speed = document.querySelector('input[name="scanSpeed"]:checked')?.value || 'balanced';
        const preset = speedPresets[speed];

        // Get advanced settings if enabled
        const useAdvanced = document.getElementById('showAdvanced')?.checked || false;
        const adaptiveBackoff = document.getElementById('adaptiveBackoff')?.checked !== false;
        const skipChecked = document.getElementById('skipChecked')?.checked || false;

        const options = {
            batchSize: useAdvanced ? parseInt(document.getElementById('advBatchSize')?.value || preset.batchSize) : preset.batchSize,
            delayBetweenBatches: useAdvanced ? parseInt(document.getElementById('advDelay')?.value || preset.delay) : preset.delay,
            timeout: useAdvanced ? parseInt(document.getElementById('advTimeout')?.value || preset.timeout) * 1000 : preset.timeout * 1000,
            maxRetries: useAdvanced ? parseInt(document.getElementById('advRetries')?.value || 2) : 2,
            adaptiveBackoff: adaptiveBackoff,
            skipChecked: skipChecked,
            speedLabel: preset.label
        };

        // Validate values
        if (options.batchSize < 1 || options.batchSize > 50) {
            alert('Batch size must be between 1 and 50.');
            return;
        }
        if (options.delayBetweenBatches < 50 || options.delayBetweenBatches > 5000) {
            alert('Delay must be between 50ms and 5000ms.');
            return;
        }
        if (options.timeout < 2000 || options.timeout > 30000) {
            alert('Timeout must be between 2s and 30s.');
            return;
        }

        this.closeLinkCheckConfig();
        await this.startLinkCheck(options);
    }

    // ----- Internal: Start the actual link check -----
    async startLinkCheck(options = {}) {
        if (this.app.linkChecker.isRunning) {
            alert('Link check is already running.');
            return;
        }

        const {
            batchSize = 10,
            delayBetweenBatches = 500,
            timeout = 8000,
            maxRetries = 2,
            adaptiveBackoff = true,
            skipChecked = false,
            speedLabel = 'Custom'
        } = options;

        const total = this.app.bookmarkManager.getBookmarks().length;
        const estimatedMinutes = this.estimateTime(total, batchSize, delayBetweenBatches);

        const confirmMsg = `🔗 Check all ${total} bookmarks for broken links?
    
📊 Settings:
   Speed: ${speedLabel}
   Batch Size: ${batchSize}
   Delay: ${delayBetweenBatches}ms
   Timeout: ${timeout/1000}s
   Adaptive Backoff: ${adaptiveBackoff ? '✅ On' : '❌ Off'}
   Skip Checked: ${skipChecked ? '✅ Yes' : '❌ No'}

Estimated time: ~${estimatedMinutes} minute${estimatedMinutes > 1 ? 's' : ''}

Proceed?`;

        if (!confirm(confirmMsg)) return;

        try {
            await this.app.linkChecker.checkAllBookmarks({
                batchSize,
                delayBetweenBatches,
                timeout,
                maxRetries,
                adaptiveBackoff,
                filter: skipChecked ? (b) => !b.linkStatus || !b.linkStatus.lastChecked : null
            });
        } catch (error) {
            console.error('Link check error:', error);
            this.app.uiManager.showToast('❌ Link check failed: ' + error.message, '❌');
        }
    }

    // ----- Estimate time for the link check -----
    estimateTime(total, batchSize, delay) {
        const batches = Math.ceil(total / batchSize);
        const seconds = (batches * delay) / 1000;
        const minutes = Math.ceil(seconds / 60);
        return minutes;
    }

    // ----- Clear thumbnail cache -----
    clearThumbnailCache() {
        const stats = this.app.thumbnailManager.getCacheStats();
        if (stats.entries === 0) {
            alert('No thumbnails cached.');
            return;
        }
        if (confirm(`Clear cached thumbnails?\n\n${stats.entries} entries using ${stats.size} KB of storage.`)) {
            this.app.thumbnailManager.clearCache();
            this.app.uiManager.showToast('✅ Thumbnail cache cleared', '🗑️');
            this.app.renderAll();
        }
    }
}
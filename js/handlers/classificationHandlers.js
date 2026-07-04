// ========================================
// 🤖 CLASSIFICATION HANDLERS
// ========================================

export class ClassificationHandlers {
    constructor(app) {
        this.app = app;
    }

    async startClassification() {
        if (!this.app.aiClassifier) {
            alert('Please set up your DeepSeek API key first.');
            return;
        }

        if (this.app.bookmarkManager.getBookmarks().length === 0) {
            alert('No bookmarks to classify.');
            return;
        }

        if (this.app.classificationManager?.isRunning) {
            alert('Classification is already running.');
            return;
        }

        if (this.app.bookmarkManager.getActiveBookmarks().length === 0) {
            alert('No active bookmarks to classify.');
            return;
        }

        this.app.isClassificationComplete = false;

        this.app.uiManager.expandProgress();
        if (this.app.bulkActions) this.app.bulkActions.clearSelection();

        const progressSectionEl = document.querySelector('.progress-section');
        if (progressSectionEl) {
            progressSectionEl.style.display = 'block';
            progressSectionEl.classList.add('active');
        }

        this.setButtonsEnabled(false);

        try {
            const result = await this.app.classificationManager.classifyAll();

            if (result && result.success) {
                const categories = this.app.categoryManager.extractCategories(this.app.bookmarkManager.getBookmarks());
                this.app.categoryManager.setCategories(categories);
                this.app.isClassificationComplete = true;
                this.app.saveData();
                this.app.renderAll();
                this.app.uiManager.showToast(`✅ Classification complete! ${result.total} bookmarks categorized.`, '✅');
                
                if (result.errors > 0) {
                    alert(`✅ Classification complete with ${result.errors} error(s).\nCheck the error log for details.`);
                } else {
                    alert('✅ Classification complete!');
                }
            } else {
                if (result && result.partial) {
                    const categories = this.app.categoryManager.extractCategories(this.app.bookmarkManager.getBookmarks());
                    this.app.categoryManager.setCategories(categories);
                    this.app.saveData();
                    this.app.renderAll();
                    this.app.uiManager.showToast(`⏸️ Classification stopped. ${this.app.classificationManager?.classifiedCount || 0} bookmarks categorized.`, '⏸️');
                    alert(`⏸️ Classification stopped.\n\n${this.app.classificationManager?.classifiedCount || 0} bookmarks have been categorized.\nUncategorized bookmarks remain in "To Review" folder.`);
                } else {
                    this.app.uiManager.showToast('❌ Classification failed: ' + (result?.message || 'Unknown error'), '❌');
                    alert('❌ Classification failed: ' + (result?.message || 'Unknown error'));
                }
            }
        } catch (error) {
            console.error('Classification error:', error);
            this.app.uiManager.showToast('❌ Error: ' + error.message, '❌');
            alert('❌ Error: ' + error.message);
        } finally {
            this.resetUIAfterClassification();
        }
    }

    resetUIAfterClassification() {
        if (this.app.classificationManager) {
            this.app.classificationManager.isRunning = false;
            this.app.classificationManager.isPaused = false;
            this.app.classificationManager.isCancelled = false;
        }

        this.setButtonsEnabled(true);
        this.updateButtonStates();

        const progressSectionEl = document.querySelector('.progress-section');
        if (progressSectionEl && this.app.isClassificationComplete) {
            progressSectionEl.style.display = 'none';
            progressSectionEl.classList.remove('active');
        }

        if (this.app.uiManager) {
            this.app.uiManager.updateProgress({
                total: this.app.classificationManager?.totalToClassify || 0,
                classified: this.app.classificationManager?.classifiedCount || 0,
                isRunning: false,
                isPaused: false,
                isCancelled: false,
                apiCalls: this.app.classificationManager?.apiCalls || 0,
                startTime: this.app.classificationManager?.startTime || null
            });
        }

        this.app.renderAll();
        this.app.saveData();
    }

    setButtonsEnabled(enabled) {
        const el = this.app.uiManager.elements;
        
        // Classify button - dynamic text
        if (el.classifyBtn) {
            el.classifyBtn.disabled = !enabled;
            if (enabled) {
                el.classifyBtn.textContent = this.app.isClassificationComplete ? '✅ Classified' : '🤖 Auto-Classify';
            } else {
                el.classifyBtn.textContent = '⏳ Classifying...';
            }
        }
        
        // All other buttons - only toggle disabled, preserve text
        if (el.importBtn) el.importBtn.disabled = !enabled;
        if (el.exportBtn) el.exportBtn.disabled = !enabled;
        if (el.clearAllBtn) el.clearAllBtn.disabled = !enabled;
        if (el.addCategoryBtn) el.addCategoryBtn.disabled = !enabled;
        
        if (el.progressStartBtn) {
            const isRunning = this.app.classificationManager?.isRunning || false;
            const isPaused = this.app.classificationManager?.isPaused || false;
            
            if (isRunning && !isPaused) {
                el.progressStartBtn.disabled = true;
            } else if (isRunning && isPaused) {
                el.progressStartBtn.disabled = false;
                el.progressStartBtn.textContent = '▶ Resume';
            } else {
                el.progressStartBtn.disabled = false;
                el.progressStartBtn.textContent = '▶ Start';
            }
        }
        
        if (el.progressPauseBtn) {
            const isRunning = this.app.classificationManager?.isRunning || false;
            const isPaused = this.app.classificationManager?.isPaused || false;
            el.progressPauseBtn.disabled = !(isRunning && !isPaused);
            if (isRunning && !isPaused) {
                el.progressPauseBtn.textContent = '⏸ Pause';
            } else if (isRunning && isPaused) {
                el.progressPauseBtn.textContent = '▶ Resume';
            } else {
                el.progressPauseBtn.textContent = '⏸ Pause';
            }
        }
        
        if (el.progressStopBtn) {
            const isRunning = this.app.classificationManager?.isRunning || false;
            el.progressStopBtn.disabled = !isRunning;
        }
        
        if (el.progressClearLogBtn) el.progressClearLogBtn.disabled = !enabled;
        
        const checkLinksBtn = document.getElementById('checkLinksBtn');
        if (checkLinksBtn) checkLinksBtn.disabled = !enabled;
        
        const clearThumbnailsBtn = document.getElementById('clearThumbnailCacheBtn');
        if (clearThumbnailsBtn) clearThumbnailsBtn.disabled = !enabled;
        
        const showArchivedBtn = document.getElementById('showArchivedBtn');
        if (showArchivedBtn) showArchivedBtn.disabled = !enabled;
        
        const downloadErrorLogBtn = document.getElementById('downloadErrorLogBtn');
        if (downloadErrorLogBtn) downloadErrorLogBtn.disabled = !enabled;
    }

    updateButtonStates() {
        const el = this.app.uiManager.elements;
        const isRunning = this.app.classificationManager?.isRunning || false;
        const isPaused = this.app.classificationManager?.isPaused || false;
        
        if (el.classifyBtn) {
            if (isRunning) {
                el.classifyBtn.disabled = true;
                el.classifyBtn.textContent = '⏳ Classifying...';
            } else if (this.app.isClassificationComplete) {
                el.classifyBtn.disabled = false;
                el.classifyBtn.textContent = '✅ Classified';
            } else {
                el.classifyBtn.disabled = false;
                el.classifyBtn.textContent = '🤖 Auto-Classify';
            }
        }
        
        if (el.progressStartBtn) {
            if (isRunning && !isPaused) {
                el.progressStartBtn.disabled = true;
                el.progressStartBtn.textContent = '▶ Start';
            } else if (isRunning && isPaused) {
                el.progressStartBtn.disabled = false;
                el.progressStartBtn.textContent = '▶ Resume';
            } else {
                el.progressStartBtn.disabled = false;
                el.progressStartBtn.textContent = '▶ Start';
            }
        }
        
        if (el.progressPauseBtn) {
            el.progressPauseBtn.disabled = !(isRunning && !isPaused);
            if (isRunning && !isPaused) {
                el.progressPauseBtn.textContent = '⏸ Pause';
            } else if (isRunning && isPaused) {
                el.progressPauseBtn.textContent = '▶ Resume';
            } else {
                el.progressPauseBtn.textContent = '⏸ Pause';
            }
        }
        
        if (el.progressStopBtn) {
            el.progressStopBtn.disabled = !isRunning;
        }
    }

    togglePauseClassification() {
        if (!this.app.classificationManager?.isRunning) return;
        if (this.app.classificationManager.isPaused) {
            this.app.classificationManager.resume();
            const btn = this.app.uiManager.elements.progressPauseBtn;
            if (btn) btn.textContent = '⏸ Pause';
            this.updateButtonStates();
        } else {
            this.app.classificationManager.pause();
            const btn = this.app.uiManager.elements.progressPauseBtn;
            if (btn) btn.textContent = '▶ Resume';
            this.updateButtonStates();
        }
    }

    stopClassification() {
        if (!this.app.classificationManager?.isRunning) return;
        if (confirm('⚠️ Stop classification?\n\nBookmarks already categorized will keep their categories.\nUnprocessed bookmarks will remain "To Review".')) {
            this.app.classificationManager.cancel();
            this.resetUIAfterClassification();
            this.app.uiManager.showToast('⏹ Classification stopped - partial results saved', '⏹');
            const categories = this.app.categoryManager.extractCategories(this.app.bookmarkManager.getBookmarks());
            this.app.categoryManager.setCategories(categories);
            this.app.saveData();
            this.app.renderAll();
        }
    }

    clearProgressLog() {
        if (this.app.classificationManager) {
            this.app.classificationManager.logs = [];
            this.app.classificationManager.errors = [];
        }
        this.app.uiManager.clearLog();
        this.app.uiManager.addLogEntry({
            time: new Date().toLocaleTimeString(),
            message: '🗑️ Log cleared',
            level: 'info'
        });
    }

    downloadErrorLog() {
        if (!this.app.classificationManager) {
            alert('No errors to download.');
            return;
        }
        const logContent = this.app.classificationManager.downloadErrorLog();
        if (!logContent) {
            alert('No errors to log.');
            return;
        }
        const blob = new Blob([logContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `classification_errors_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.app.uiManager.addLogEntry({
            time: new Date().toLocaleTimeString(),
            message: `📥 Downloaded error log (${this.app.classificationManager.errors.length} errors)`,
            level: 'info'
        });
    }

    resetUI() {
        this.resetUIAfterClassification();
    }
}
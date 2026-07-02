// ========================================
// 🔤 ALPHABET NAVIGATION
// Renders and manages the alphabet filter
// ========================================

import { SearchHelpers } from '../utils/searchHelpers.js';

export class AlphabetNav {
    constructor() {
        this.letterFilter = null;
        this.onLetterSelect = null;
        this.onClearFilter = null;
    }

    // ----- Set callbacks -----
    setCallbacks(onLetterSelect, onClearFilter) {
        this.onLetterSelect = onLetterSelect;
        this.onClearFilter = onClearFilter;
    }

    // ----- Render alphabet navigation -----
    render(bookmarks) {
        const navContainer = document.getElementById('alphabetNav');
        if (!navContainer) return;
        
        const index = SearchHelpers.getAlphabeticalIndex(bookmarks);
        const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
        
        navContainer.innerHTML = '';
        
        letters.forEach(letter => {
            const span = document.createElement('span');
            span.className = 'letter';
            span.textContent = letter;
            
            if (index[letter].length > 0) {
                span.classList.add('has-bookmarks');
            } else {
                span.classList.add('no-bookmarks');
            }
            
            if (this.letterFilter === letter) {
                span.classList.add('active');
            }
            
            span.addEventListener('click', () => {
                if (index[letter].length === 0) return;
                
                if (this.letterFilter === letter) {
                    this.clearFilter();
                } else {
                    this.setFilter(letter);
                }
            });
            
            navContainer.appendChild(span);
        });
        
        // Add # for non-letter domains
        const hashSpan = document.createElement('span');
        hashSpan.className = 'letter';
        hashSpan.textContent = '#';
        if (index['#'].length > 0) {
            hashSpan.classList.add('has-bookmarks');
        } else {
            hashSpan.classList.add('no-bookmarks');
        }
        if (this.letterFilter === '#') {
            hashSpan.classList.add('active');
        }
        hashSpan.addEventListener('click', () => {
            if (index['#'].length === 0) return;
            
            if (this.letterFilter === '#') {
                this.clearFilter();
            } else {
                this.setFilter('#');
            }
        });
        navContainer.appendChild(hashSpan);
    }

    // ----- Set filter by letter -----
    setFilter(letter) {
        this.letterFilter = letter;
        
        document.querySelectorAll('.alphabet-nav .letter').forEach(el => {
            el.classList.remove('active');
            if (el.textContent.toLowerCase() === letter.toLowerCase()) {
                el.classList.add('active');
            }
        });
        
        if (this.onLetterSelect) {
            this.onLetterSelect(letter);
        }
    }

    // ----- Clear filter -----
    clearFilter() {
        this.letterFilter = null;
        document.querySelectorAll('.alphabet-nav .letter').forEach(el => {
            el.classList.remove('active');
        });
        
        if (this.onClearFilter) {
            this.onClearFilter();
        }
    }

    // ----- Get current filter -----
    getFilter() {
        return this.letterFilter;
    }
}
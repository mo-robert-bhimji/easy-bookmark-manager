// ========================================
// 🔧 DOM HELPERS
// Utility functions for DOM manipulation
// ========================================

export class DOMHelpers {
    
    // ----- Create an element with attributes and children -----
    static createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'textContent') {
                element.textContent = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else if (key.startsWith('data-')) {
                element.dataset[key.substring(5)] = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.entries(value).forEach(([prop, val]) => {
                    element.style[prop] = val;
                });
            } else {
                element.setAttribute(key, value);
            }
        });
        
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else {
                element.appendChild(child);
            }
        });
        
        return element;
    }

    // ----- Get element or throw error -----
    static getElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`⚠️ Element with ID "${id}" not found`);
        }
        return element;
    }

    // ----- Query selector or throw error -----
    static query(selector, parent = document) {
        const element = parent.querySelector(selector);
        if (!element) {
            console.warn(`⚠️ Element with selector "${selector}" not found`);
        }
        return element;
    }

    // ----- Query all selector -----
    static queryAll(selector, parent = document) {
        return parent.querySelectorAll(selector);
    }

    // ----- Show/hide element -----
    static toggleVisibility(element, show) {
        if (!element) return;
        element.style.display = show ? '' : 'none';
    }

    // ----- Add/remove class -----
    static toggleClass(element, className, add) {
        if (!element) return;
        if (add) {
            element.classList.add(className);
        } else {
            element.classList.remove(className);
        }
    }

    // ----- Set multiple styles -----
    static setStyles(element, styles) {
        if (!element) return;
        Object.entries(styles).forEach(([prop, value]) => {
            element.style[prop] = value;
        });
    }

    // ----- Clear all children -----
    static clearChildren(element) {
        if (!element) return;
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    // ----- Scroll to element -----
    static scrollTo(element, behavior = 'smooth', block = 'center') {
        if (!element) return;
        element.scrollIntoView({ behavior, block });
    }

    // ----- Highlight element temporarily -----
    static highlightElement(element, duration = 2000, color = '#4F46E5') {
        if (!element) return;
        const originalTransition = element.style.transition;
        element.style.transition = 'all 0.3s';
        element.style.boxShadow = `0 0 0 3px ${color}`;
        setTimeout(() => {
            element.style.boxShadow = '';
            setTimeout(() => {
                element.style.transition = originalTransition;
            }, 300);
        }, duration);
    }
}
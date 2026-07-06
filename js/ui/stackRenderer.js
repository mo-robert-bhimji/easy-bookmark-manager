// ========================================
// 📚 STACK RENDERER - Stacked Cards (No Fan Effect)
// ========================================

export class StackRenderer {
    constructor(uiRenderer) {
        this.uiRenderer = uiRenderer;
        this.onExpand = null;
    }

    /**
     * Set the callback for expanding a stack
     */
    setOnExpand(callback) {
        this.onExpand = callback;
    }

    /**
     * Create a stacked card container for domain or URL groups
     * Shows a single card with a stack badge - NO fan effect, NO overlay cards
     */
    createStackedCard(stack, actions = {}, isDomainStack = true) {
        const container = document.createElement('div');
        container.className = 'stack-container';

        // Get the first bookmark for the visible card
        const firstBookmark = stack[0];
        const count = stack.length;

        // Create the base visible card using uiRenderer
        const card = this.uiRenderer.createBookmarkCard(firstBookmark, actions);

        // Store the stack data on the card for reference
        card.dataset.stackCount = count;
        card.dataset.isDomainStack = isDomainStack;

        // ---- Add Stack Badge ----
        let badgeStack = card.querySelector('.badge-stack');
        if (!badgeStack) {
            badgeStack = document.createElement('div');
            badgeStack.className = 'badge-stack';
            card.appendChild(badgeStack);
        }

        // Remove any existing stack badge
        const existingStackBadge = badgeStack.querySelector('.badge-stack-domain, .badge-stack-duplicate');
        if (existingStackBadge) {
            existingStackBadge.remove();
        }

        // Create the stack badge
        const stackBadge = document.createElement('span');
        if (isDomainStack) {
            stackBadge.className = 'badge badge-stack-domain';
            stackBadge.textContent = `🏢 ${count}`;
        } else {
            stackBadge.className = 'badge badge-stack-duplicate';
            stackBadge.textContent = `📦 ${count}`;
        }

        // Make it clickable to expand
        const self = this;
        const stackCopy = stack;
        const domainCopy = firstBookmark.domain || 'unknown';
        const isDomainCopy = isDomainStack;

        stackBadge.style.cursor = 'pointer';
        stackBadge.setAttribute('role', 'button');
        stackBadge.setAttribute('tabindex', '0');

        // Use BOTH onclick and addEventListener to ensure it works
        stackBadge.onclick = function(e) {
            e = e || window.event;
            e.stopPropagation();
            e.preventDefault();

            console.log('🔥 Badge clicked via onclick!');
            console.log('📚 stack length:', stackCopy ? stackCopy.length : 'undefined');

            if (self.onExpand) {
                self.onExpand(stackCopy, domainCopy, isDomainCopy);
            } else {
                console.warn('⚠️ self.onExpand is null!');
            }
            return false;
        };

        stackBadge.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();

            console.log('🔥 Badge clicked via addEventListener!');
            console.log('📚 stack length:', stackCopy ? stackCopy.length : 'undefined');

            if (self.onExpand) {
                self.onExpand(stackCopy, domainCopy, isDomainCopy);
            } else {
                console.warn('⚠️ self.onExpand is null!');
            }
        });

        badgeStack.appendChild(stackBadge);

        // ---- Double-click on card to expand ----
        card.addEventListener('dblclick', function(e) {
            if (e.target.closest('.badge-stack') || e.target.closest('.card-actions')) {
                return;
            }
            if (self.onExpand) {
                self.onExpand(stack, firstBookmark.domain || 'unknown', isDomainStack);
            }
        });

        container.appendChild(card);
        return container;
    }

    /**
     * Set the stack style (kept for compatibility)
     */
    setStackStyle(style) {
        // No-op - fan effect is removed
    }
}
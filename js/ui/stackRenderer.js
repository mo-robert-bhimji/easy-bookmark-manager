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
        stackBadge.style.cursor = 'pointer';
        stackBadge.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.onExpand) {
                this.onExpand(stack, firstBookmark.domain || 'unknown', isDomainStack);
            }
        });
        badgeStack.appendChild(stackBadge);

        // ---- Double-click on card to expand ----
        card.addEventListener('dblclick', (e) => {
            if (this.onExpand) {
                this.onExpand(stack, firstBookmark.domain || 'unknown', isDomainStack);
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
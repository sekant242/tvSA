/**
 * Input Handler - Manages sensor/remote/keyboard input
 */

class InputHandler {
    constructor() {
        this.gameInstance = null;
        this.keyMap = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'Enter': 'select',
            'Space': 'action',
            'Escape': 'back',
            'w': 'up',
            'a': 'left',
            's': 'down',
            'd': 'right'
        };
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchThreshold = 50;
    }

    init() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e), false);
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e), false);
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e), false);
    }

    setGameInstance(game) {
        this.gameInstance = game;
    }

    handleKeyDown(e) {
        if (!this.gameInstance) return;

        const action = this.keyMap[e.key];
        if (action && this.gameInstance.onInput) {
            this.gameInstance.onInput({ type: 'keydown', action });
            e.preventDefault();
        }
    }

    handleKeyUp(e) {
        if (!this.gameInstance) return;

        const action = this.keyMap[e.key];
        if (action && this.gameInstance.onInput) {
            this.gameInstance.onInput({ type: 'keyup', action });
            e.preventDefault();
        }
    }

    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
    }

    handleTouchMove(e) {
        if (!this.gameInstance) return;

        const deltaX = e.touches[0].clientX - this.touchStartX;
        const deltaY = e.touches[0].clientY - this.touchStartY;

        if (Math.abs(deltaX) > this.touchThreshold || Math.abs(deltaY) > this.touchThreshold) {
            let action = null;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                action = deltaX > 0 ? 'right' : 'left';
            } else {
                action = deltaY > 0 ? 'down' : 'up';
            }

            if (this.gameInstance.onInput) {
                this.gameInstance.onInput({ type: 'touch', action });
            }

            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        }
    }

    handleTouchEnd(e) {
        // Handle tap
        if (this.gameInstance && this.gameInstance.onInput) {
            this.gameInstance.onInput({ type: 'touch', action: 'select' });
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputHandler;
}

/**
 * Checkers Game
 */

class Checkers {
    constructor(options) {
        this.scoreManager = options.scoreManager;
        this.soundEngine = options.soundEngine;
        this.inputHandler = options.inputHandler;
        
        this.canvas = null;
        this.ctx = null;
        this.board = Array(8).fill(null).map(() => Array(8).fill(0));
        this.selected = null;
        this.moves = 0;
        this.gameOver = false;
        this.cellSize = 50;
    }

    init() {
        this.createCanvas();
        this.initBoard();
    }

    start() {
        this.render();
    }

    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 400;
        this.canvas.height = 400;
        this.canvas.style.cssText = 'border: 2px solid white; display: block; margin: 20px auto;';
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
    }

    initBoard() {
        // Place checkers
        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 8; x++) {
                if ((x + y) % 2 === 1) {
                    this.board[y][x] = 1; // Player
                }
            }
        }
        
        for (let y = 5; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                if ((x + y) % 2 === 1) {
                    this.board[y][x] = 2; // AI
                }
            }
        }
    }

    onInput(input) {
        if (input.action === 'back') {
            this.stop();
        }
    }

    render() {
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw board
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                if ((x + y) % 2 === 0) {
                    this.ctx.fillStyle = '#ccc';
                    this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                }
                
                const piece = this.board[y][x];
                if (piece === 1) {
                    this.ctx.fillStyle = '#f00';
                    this.ctx.beginPath();
                    this.ctx.arc(x * this.cellSize + this.cellSize / 2, y * this.cellSize + this.cellSize / 2, this.cellSize / 2 - 5, 0, Math.PI * 2);
                    this.ctx.fill();
                } else if (piece === 2) {
                    this.ctx.fillStyle = '#000';
                    this.ctx.beginPath();
                    this.ctx.arc(x * this.cellSize + this.cellSize / 2, y * this.cellSize + this.cellSize / 2, this.cellSize / 2 - 5, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }

        if (!this.gameOver) {
            requestAnimationFrame(() => this.render());
        }
    }

    stop() {
        this.canvas.remove();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Checkers;
}

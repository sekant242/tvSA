/**
 * Sudoku Game
 */

class Sudoku {
    constructor(options) {
        this.scoreManager = options.scoreManager;
        this.soundEngine = options.soundEngine;
        this.inputHandler = options.inputHandler;
        
        this.canvas = null;
        this.ctx = null;
        this.grid = Array(9).fill(null).map(() => Array(9).fill(0));
        this.original = [];
        this.selected = {x: 0, y: 0};
        this.score = 0;
        this.gameOver = false;
        this.cellSize = 40;
    }

    init() {
        this.createCanvas();
        this.generatePuzzle();
    }

    start() {
        this.render();
    }

    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 400;
        this.canvas.height = 500;
        this.canvas.style.cssText = 'border: 2px solid white; display: block; margin: 20px auto;';
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
    }

    generatePuzzle() {
        // Simple puzzle - fill some cells
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const value = Math.floor(Math.random() * 10);
                if (value > 5) {
                    this.grid[i][j] = (i * 3 + j) % 9 + 1;
                }
            }
        }
        this.original = this.grid.map(row => [...row]);
    }

    onInput(input) {
        if (input.action === 'up' && this.selected.y > 0) {
            this.selected.y--;
        } else if (input.action === 'down' && this.selected.y < 8) {
            this.selected.y++;
        } else if (input.action === 'left' && this.selected.x > 0) {
            this.selected.x--;
        } else if (input.action === 'right' && this.selected.x < 8) {
            this.selected.x++;
        } else if (input.action === 'action') {
            this.enterNumber();
        } else if (input.action === 'back') {
            this.stop();
        }
    }

    enterNumber() {
        if (this.original[this.selected.y][this.selected.x] === 0) {
            this.grid[this.selected.y][this.selected.x] = (this.grid[this.selected.y][this.selected.x] % 9) + 1;
            this.score += 1;
            this.soundEngine.playClick();
        }
    }

    render() {
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                const isSelected = x === this.selected.x && y === this.selected.y;
                
                this.ctx.fillStyle = isSelected ? '#555' : '#333';
                this.ctx.fillRect(x * this.cellSize + 10, y * this.cellSize + 50, this.cellSize - 2, this.cellSize - 2);
                
                this.ctx.strokeStyle = (x % 3 === 2 || y % 3 === 2) ? '#fff' : '#666';
                this.ctx.lineWidth = (x % 3 === 2 || y % 3 === 2) ? 2 : 1;
                this.ctx.strokeRect(x * this.cellSize + 10, y * this.cellSize + 50, this.cellSize - 2, this.cellSize - 2);
                
                if (this.grid[y][x] > 0) {
                    this.ctx.fillStyle = this.original[y][x] > 0 ? '#0f0' : '#ff0';
                    this.ctx.font = 'bold 20px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(this.grid[y][x], x * this.cellSize + 10 + (this.cellSize - 2) / 2, y * this.cellSize + 50 + (this.cellSize - 2) / 2);
                }
            }
        }

        // Draw score
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Score: ' + this.score, 10, 30);

        if (!this.gameOver) {
            requestAnimationFrame(() => this.render());
        }
    }

    endGame() {
        this.gameOver = true;
        this.soundEngine.playSuccess();
        this.scoreManager.addScore('sudoku', this.score);
    }

    stop() {
        this.canvas.remove();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Sudoku;
}

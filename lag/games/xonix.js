/**
 * Xonix Game - Territory claiming game
 */

class Xonix {
    constructor(options) {
        this.scoreManager = options.scoreManager;
        this.soundEngine = options.soundEngine;
        this.inputHandler = options.inputHandler;
        
        this.canvas = null;
        this.ctx = null;
        this.gridSize = 15;
        this.grid = [];
        this.playerPos = {x: 7, y: 7};
        this.enemies = [{x: 2, y: 2}, {x: 12, y: 12}];
        this.score = 0;
        this.gameOver = false;
        this.cellSize = 30;
    }

    init() {
        this.createCanvas();
        this.initGrid();
    }

    start() {
        this.gameLoop = setInterval(() => this.update(), 100);
        this.render();
    }

    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.gridSize * this.cellSize;
        this.canvas.height = this.gridSize * this.cellSize;
        this.canvas.style.cssText = 'border: 2px solid white; display: block; margin: 20px auto;';
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
    }

    initGrid() {
        this.grid = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(0));
        // Mark borders as claimed
        for (let i = 0; i < this.gridSize; i++) {
            this.grid[0][i] = 1;
            this.grid[this.gridSize - 1][i] = 1;
            this.grid[i][0] = 1;
            this.grid[i][this.gridSize - 1] = 1;
        }
    }

    update() {
        if (this.gameOver) return;

        // Move enemies randomly
        for (let enemy of this.enemies) {
            const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            const dir = dirs[Math.floor(Math.random() * dirs.length)];
            enemy.x = Math.max(0, Math.min(this.gridSize - 1, enemy.x + dir[0]));
            enemy.y = Math.max(0, Math.min(this.gridSize - 1, enemy.y + dir[1]));

            // Check collision
            if (enemy.x === this.playerPos.x && enemy.y === this.playerPos.y) {
                this.endGame();
            }
        }
    }

    onInput(input) {
        if (input.action === 'up' && this.playerPos.y > 0) {
            this.playerPos.y--;
            this.claimTerritory();
        } else if (input.action === 'down' && this.playerPos.y < this.gridSize - 1) {
            this.playerPos.y++;
            this.claimTerritory();
        } else if (input.action === 'left' && this.playerPos.x > 0) {
            this.playerPos.x--;
            this.claimTerritory();
        } else if (input.action === 'right' && this.playerPos.x < this.gridSize - 1) {
            this.playerPos.x++;
            this.claimTerritory();
        } else if (input.action === 'back') {
            this.stop();
        }
    }

    claimTerritory() {
        if (this.grid[this.playerPos.y][this.playerPos.x] === 0) {
            this.grid[this.playerPos.y][this.playerPos.x] = 2;
            this.score += 1;
            this.soundEngine.playClick();
        }
    }

    render() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = this.grid[y][x];
                
                if (cell === 1) {
                    this.ctx.fillStyle = '#0f0';
                } else if (cell === 2) {
                    this.ctx.fillStyle = '#00f';
                } else {
                    this.ctx.fillStyle = '#111';
                }
                
                this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize - 1, this.cellSize - 1);
            }
        }

        // Draw player
        this.ctx.fillStyle = '#ff0';
        this.ctx.fillRect(this.playerPos.x * this.cellSize + 5, this.playerPos.y * this.cellSize + 5, this.cellSize - 10, this.cellSize - 10);

        // Draw enemies
        this.ctx.fillStyle = '#f00';
        for (let enemy of this.enemies) {
            this.ctx.fillRect(enemy.x * this.cellSize + 5, enemy.y * this.cellSize + 5, this.cellSize - 10, this.cellSize - 10);
        }

        // Draw score
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Score: ' + this.score, 10, this.canvas.height + 20);

        if (!this.gameOver) {
            requestAnimationFrame(() => this.render());
        }
    }

    endGame() {
        this.gameOver = true;
        this.soundEngine.playGameOver();
        this.scoreManager.addScore('xonix', this.score);
    }

    stop() {
        clearInterval(this.gameLoop);
        this.canvas.remove();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Xonix;
}

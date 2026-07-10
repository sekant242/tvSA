/**
 * Sokoban Game - Puzzle with boxes
 */

class Sokoban {
    constructor(options) {
        this.scoreManager = options.scoreManager;
        this.soundEngine = options.soundEngine;
        this.inputHandler = options.inputHandler;
        
        this.canvas = null;
        this.ctx = null;
        this.playerPos = {x: 1, y: 1};
        this.boxes = [{x: 3, y: 3}, {x: 5, y: 5}];
        this.targets = [{x: 7, y: 3}, {x: 7, y: 5}];
        this.walls = [];
        this.moves = 0;
        this.gameOver = false;
        this.cellSize = 40;
        this.mapWidth = 10;
        this.mapHeight = 10;
    }

    init() {
        this.createCanvas();
        this.initLevel();
    }

    start() {
        this.render();
    }

    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.mapWidth * this.cellSize;
        this.canvas.height = this.mapHeight * this.cellSize + 40;
        this.canvas.style.cssText = 'border: 2px solid white; display: block; margin: 20px auto;';
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
    }

    initLevel() {
        // Create simple maze walls
        for (let x = 0; x < this.mapWidth; x++) {
            this.walls.push({x: x, y: 0});
            this.walls.push({x: x, y: this.mapHeight - 1});
        }
        for (let y = 0; y < this.mapHeight; y++) {
            this.walls.push({x: 0, y: y});
            this.walls.push({x: this.mapWidth - 1, y: y});
        }
    }

    onInput(input) {
        if (input.action === 'back') {
            this.stop();
        } else {
            const newPos = {...this.playerPos};
            
            if (input.action === 'up') newPos.y--;
            if (input.action === 'down') newPos.y++;
            if (input.action === 'left') newPos.x--;
            if (input.action === 'right') newPos.x++;
            
            this.tryMove(newPos);
        }
    }

    tryMove(newPos) {
        // Check walls
        if (this.walls.some(w => w.x === newPos.x && w.y === newPos.y)) {
            return;
        }

        // Check boxes
        const boxIndex = this.boxes.findIndex(b => b.x === newPos.x && b.y === newPos.y);
        if (boxIndex !== -1) {
            const newBoxPos = {x: newPos.x + (newPos.x - this.playerPos.x), y: newPos.y + (newPos.y - this.playerPos.y)};
            
            if (this.walls.some(w => w.x === newBoxPos.x && w.y === newBoxPos.y)) {
                return;
            }
            
            this.boxes[boxIndex] = newBoxPos;
        }

        this.playerPos = newPos;
        this.moves++;
        this.soundEngine.playClick();

        if (this.checkWin()) {
            this.endGame();
        }
    }

    checkWin() {
        for (let i = 0; i < this.boxes.length; i++) {
            const box = this.boxes[i];
            const target = this.targets[i];
            if (box.x !== target.x || box.y !== target.y) {
                return false;
            }
        }
        return true;
    }

    render() {
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw walls
        this.ctx.fillStyle = '#666';
        for (let wall of this.walls) {
            this.ctx.fillRect(wall.x * this.cellSize + 2, wall.y * this.cellSize + 2, this.cellSize - 4, this.cellSize - 4);
        }

        // Draw targets
        this.ctx.fillStyle = '#0f0';
        for (let target of this.targets) {
            this.ctx.fillRect(target.x * this.cellSize + 5, target.y * this.cellSize + 5, this.cellSize - 10, this.cellSize - 10);
        }

        // Draw boxes
        this.ctx.fillStyle = '#f00';
        for (let box of this.boxes) {
            this.ctx.fillRect(box.x * this.cellSize + 8, box.y * this.cellSize + 8, this.cellSize - 16, this.cellSize - 16);
        }

        // Draw player
        this.ctx.fillStyle = '#ff0';
        this.ctx.fillRect(this.playerPos.x * this.cellSize + 10, this.playerPos.y * this.cellSize + 10, this.cellSize - 20, this.cellSize - 20);

        // Draw moves
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Moves: ' + this.moves, 10, this.canvas.height - 10);

        if (!this.gameOver) {
            requestAnimationFrame(() => this.render());
        }
    }

    endGame() {
        this.gameOver = true;
        this.soundEngine.playSuccess();
        this.scoreManager.addScore('sokoban', 1000 - this.moves);
    }

    stop() {
        this.canvas.remove();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Sokoban;
}

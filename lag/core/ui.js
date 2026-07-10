/**
 * UI Manager - Handle UI rendering and menus
 */

class UI {
    constructor() {
        this.container = null;
        this.canvas = null;
        this.ctx = null;
    }

    init(container) {
        this.container = container || document.body;
        this.createCanvas();
    }

    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.cssText = 'display: block; width: 100%; height: 100%;';
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
    }

    clear() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    showGameMenu(gameList, onSelect) {
        const menuHtml = `
            <div class="lag-menu" style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
                padding: 40px 20px;
                font-family: Arial, sans-serif;
            ">
                <h1 style="text-align: center; margin-bottom: 40px; font-size: 48px;">LAG GAMES</h1>
                <div class="games-grid" style="
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    max-width: 1200px;
                    margin: 0 auto;
                ">
        `;

        gameList.forEach(game => {
            menuHtml += `
                <div class="game-card" data-game-id="${game.id}" style="
                    background: rgba(255, 255, 255, 0.1);
                    border: 2px solid white;
                    border-radius: 10px;
                    padding: 20px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-align: center;
                ">
                    <h3 style="margin: 0 0 10px 0;">${game.name}</h3>
                    <p style="margin: 5px 0; font-size: 12px; opacity: 0.8;">${game.category}</p>
                </div>
            `;
        });

        menuHtml += `
                </div>
            </div>
        `;

        const menuContainer = document.createElement('div');
        menuContainer.innerHTML = menuHtml;
        this.container = menuContainer;
        document.body.appendChild(menuContainer);

        // Add click handlers
        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', () => {
                const gameId = card.getAttribute('data-game-id');
                menuContainer.remove();
                onSelect(gameId);
            });
        });
    }

    showError(message) {
        alert(`LAG Error: ${message}`);
    }

    showScore(score, gameOver = false) {
        const scoreText = `Score: ${score}`;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(0, 0, 200, 50);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(scoreText, 10, 35);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = UI;
}

/**
 * LAG - Lampa Amazing Games Plugin
 * Main entry point: lag/g.js
 * 20 games with sensor/remote/keyboard control, high scores, and generative sound
 */

(function() {
    'use strict';

    // Plugin metadata
    const PLUGIN_NAME = 'lag';
    const PLUGIN_VERSION = '1.0.0';

    // Import all game modules
    const games = {
        tetris: require('./games/tetris.js'),
        snake: require('./games/snake.js'),
        game2048: require('./games/2048.js'),
        solitaire: require('./games/solitaire.js'),
        arkanoid: require('./games/arkanoid.js'),
        pong: require('./games/pong.js'),
        poker: require('./games/poker.js'),
        blackjack: require('./games/blackjack.js'),
        puzzle15: require('./games/puzzle15.js'),
        pipeline: require('./games/pipeline.js'),
        xonix: require('./games/xonix.js'),
        sokoban: require('./games/sokoban.js'),
        sudoku: require('./games/sudoku.js'),
        checkers: require('./games/checkers.js'),
        chess: require('./games/chess.js'),
        mahjong: require('./games/mahjong.js'),
        battleship: require('./games/battleship.js'),
        match3: require('./games/match3.js'),
        marioParty: require('./games/mario-party.js'),
        puzzle: require('./games/puzzle.js')
    };

    const GameManager = require('./core/game-manager.js');
    const ScoreManager = require('./core/score-manager.js');
    const SoundEngine = require('./core/sound-engine.js');
    const InputHandler = require('./core/input-handler.js');
    const UI = require('./core/ui.js');

    class LAGPlugin {
        constructor() {
            this.gameManager = new GameManager(games);
            this.scoreManager = new ScoreManager();
            this.soundEngine = new SoundEngine();
            this.inputHandler = new InputHandler();
            this.ui = new UI();
            this.currentGame = null;
            this.isRunning = false;
        }

        /**
         * Initialize plugin
         */
        init() {
            console.log(`[LAG] Initializing ${PLUGIN_NAME} v${PLUGIN_VERSION}`);
            
            this.scoreManager.init();
            this.soundEngine.init();
            this.inputHandler.init();
            
            // Register plugin with Lampa
            if (window.Lampa && window.Lampa.Plugin) {
                window.Lampa.Plugin.register(PLUGIN_NAME, this);
            }

            return this;
        }

        /**
         * Start the plugin
         */
        start() {
            console.log('[LAG] Starting plugin');
            this.isRunning = true;
            this.showGameMenu();
        }

        /**
         * Show main game menu
         */
        showGameMenu() {
            const gameList = this.gameManager.getGamesList();
            this.ui.showGameMenu(gameList, (gameId) => {
                this.startGame(gameId);
            });
        }

        /**
         * Start a specific game
         */
        startGame(gameId) {
            try {
                console.log(`[LAG] Starting game: ${gameId}`);
                
                const GameClass = this.gameManager.getGame(gameId);
                this.currentGame = new GameClass({
                    scoreManager: this.scoreManager,
                    soundEngine: this.soundEngine,
                    inputHandler: this.inputHandler
                });

                this.inputHandler.setGameInstance(this.currentGame);
                this.currentGame.init();
                this.currentGame.start();

            } catch (error) {
                console.error(`[LAG] Error starting game ${gameId}:`, error);
                this.ui.showError(`Failed to start game: ${error.message}`);
            }
        }

        /**
         * Stop current game
         */
        stopGame() {
            if (this.currentGame) {
                this.currentGame.stop();
                this.currentGame = null;
                this.showGameMenu();
            }
        }

        /**
         * Get high scores
         */
        getHighScores(gameId) {
            return this.scoreManager.getHighScores(gameId);
        }

        /**
         * Plugin metadata
         */
        static metadata() {
            return {
                name: PLUGIN_NAME,
                version: PLUGIN_VERSION,
                description: 'LAG - 20 Games Plugin for Lampa with Sensor/Remote/Keyboard Control',
                author: 'LAG Team'
            };
        }
    }

    // Export and initialize
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = LAGPlugin;
    } else {
        window.LAGPlugin = LAGPlugin;
    }

    // Auto-initialize if in Lampa environment
    if (window.Lampa) {
        window.Lampa.on('ready', () => {
            const lagPlugin = new LAGPlugin();
            lagPlugin.init();
        });
    }

})();

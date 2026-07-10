/**
 * Game Manager - Manages all game instances and metadata
 */

class GameManager {
    constructor(games) {
        this.games = games;
        this.gameMetadata = this.initMetadata();
    }

    initMetadata() {
        return {
            tetris: { name: 'Тетрис', category: 'puzzle', difficulty: 'easy' },
            snake: { name: 'Змейка', category: 'classic', difficulty: 'easy' },
            game2048: { name: '2048', category: 'puzzle', difficulty: 'medium' },
            solitaire: { name: 'Пасьянс косынка', category: 'card', difficulty: 'medium' },
            arkanoid: { name: 'Арканоид', category: 'action', difficulty: 'medium' },
            pong: { name: 'Понг', category: 'action', difficulty: 'easy' },
            poker: { name: 'Покер', category: 'card', difficulty: 'hard' },
            blackjack: { name: '21', category: 'card', difficulty: 'medium' },
            puzzle15: { name: 'Пятнашки', category: 'puzzle', difficulty: 'medium' },
            pipeline: { name: 'Трубопровод', category: 'puzzle', difficulty: 'medium' },
            xonix: { name: 'Xonix', category: 'action', difficulty: 'hard' },
            sokoban: { name: 'Sokoban', category: 'puzzle', difficulty: 'hard' },
            sudoku: { name: 'Судоку', category: 'puzzle', difficulty: 'hard' },
            checkers: { name: 'Шашки', category: 'strategy', difficulty: 'hard' },
            chess: { name: 'Шахматы', category: 'strategy', difficulty: 'hard' },
            mahjong: { name: 'Маджонг', category: 'puzzle', difficulty: 'medium' },
            battleship: { name: 'Морской бой', category: 'strategy', difficulty: 'medium' },
            match3: { name: 'Три в ряд', category: 'puzzle', difficulty: 'easy' },
            marioParty: { name: 'Lampa party', category: 'party', difficulty: 'medium' },
            puzzle: { name: 'Пазл', category: 'puzzle', difficulty: 'easy' }
        };
    }

    getGamesList() {
        return Object.entries(this.gameMetadata).map(([id, meta]) => ({
            id,
            ...meta
        }));
    }

    getGame(gameId) {
        if (!this.games[gameId]) {
            throw new Error(`Game not found: ${gameId}`);
        }
        return this.games[gameId];
    }

    getGameMetadata(gameId) {
        return this.gameMetadata[gameId];
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameManager;
}

/**
 * Score Manager - Manages game scores and high scores
 */

class ScoreManager {
    constructor() {
        this.storageKey = 'lag_scores';
        this.scores = {};
    }

    init() {
        this.scores = this.loadScores();
    }

    loadScores() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.warn('[LAG] Failed to load scores:', e);
            return {};
        }
    }

    saveScores() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.scores));
        } catch (e) {
            console.warn('[LAG] Failed to save scores:', e);
        }
    }

    addScore(gameId, score, playerName = 'Player') {
        if (!this.scores[gameId]) {
            this.scores[gameId] = [];
        }

        const entry = {
            score,
            playerName,
            date: new Date().toISOString(),
            time: Date.now()
        };

        this.scores[gameId].push(entry);
        this.scores[gameId].sort((a, b) => b.score - a.score);
        this.scores[gameId] = this.scores[gameId].slice(0, 10); // Keep top 10

        this.saveScores();
        return entry;
    }

    getHighScores(gameId, limit = 10) {
        return (this.scores[gameId] || []).slice(0, limit);
    }

    getTopScore(gameId) {
        const scores = this.scores[gameId];
        return scores && scores.length > 0 ? scores[0].score : 0;
    }

    clearScores(gameId) {
        if (this.scores[gameId]) {
            delete this.scores[gameId];
            this.saveScores();
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScoreManager;
}

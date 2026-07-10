/**
 * Sound Engine - Generative sound system
 */

class SoundEngine {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.enabled = true;
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.audioContext.destination);
        } catch (e) {
            console.warn('[LAG] Audio context not available:', e);
            this.enabled = false;
        }
    }

    playTone(frequency, duration = 0.1, type = 'sine') {
        if (!this.enabled || !this.audioContext) return;

        try {
            const now = this.audioContext.currentTime;
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = type;
            osc.frequency.value = frequency;
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + duration);
        } catch (e) {
            console.warn('[LAG] Error playing tone:', e);
        }
    }

    playSuccess() {
        this.playTone(800, 0.1);
        setTimeout(() => this.playTone(1000, 0.1), 100);
    }

    playError() {
        this.playTone(300, 0.15);
        setTimeout(() => this.playTone(200, 0.15), 100);
    }

    playClick() {
        this.playTone(600, 0.05);
    }

    playGameOver() {
        this.playTone(400, 0.2);
        setTimeout(() => this.playTone(300, 0.2), 150);
        setTimeout(() => this.playTone(200, 0.3), 300);
    }

    playpowerUp() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.playTone(200 + i * 100, 0.1);
            }, i * 100);
        }
    }

    toggleSound(enabled) {
        this.enabled = enabled;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SoundEngine;
}

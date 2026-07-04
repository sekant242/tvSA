// Programmatic sound effects using Web Audio API
let audioCtx: AudioContext | null = null;
let soundEnabled = true;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export function setSoundEnabled(v: boolean) {
  soundEnabled = v;
  localStorage.setItem('lampa_games_sound', v ? '1' : '0');
}

export function isSoundEnabled(): boolean {
  const s = localStorage.getItem('lampa_games_sound');
  if (s !== null) soundEnabled = s === '1';
  return soundEnabled;
}

function beep(freq: number, duration: number, vol = 0.15, type: OscillatorType = 'square') {
  if (!soundEnabled) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = vol;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
    osc.stop(ctx.currentTime + duration / 1000);
  } catch (e) {}
}

export function playMove() { beep(220, 50); }
export function playScore() { beep(600, 100, 0.2); }
export function playWin() {
  beep(523, 100, 0.2);
  setTimeout(() => beep(659, 100, 0.2), 120);
  setTimeout(() => beep(784, 150, 0.2), 240);
}
export function playLose() {
  beep(200, 200, 0.2, 'sawtooth');
  setTimeout(() => beep(150, 300, 0.2, 'sawtooth'), 220);
}
export function playClick() { beep(440, 30, 0.1); }
export function playDrop() { beep(100, 80, 0.15); }
export function playRotate() { beep(300, 40, 0.1); }
export function playClear() { beep(800, 150, 0.2, 'sine'); }
export function playShoot() { beep(900, 60, 0.15, 'sawtooth'); }
export function playExplosion() {
  beep(80, 200, 0.3, 'sawtooth');
  setTimeout(() => beep(60, 150, 0.2, 'sawtooth'), 100);
}
export function playBounce() { beep(500, 40, 0.1); }
export function playSelect() { beep(350, 50, 0.1); }

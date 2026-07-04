import { useEffect, useRef, useState, useCallback } from 'react';
import GameWrapper from '../components/GameWrapper';
import { GameInfo } from '../data/games';
import * as SFX from '../utils/sound';

// ==================== GAME 3: 2048 ====================
export function Game2048({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  return (
    <GameWrapper game={game} onBack={onBack}>
      {({ isPaused, setGameOver, setScore, gameOver }) => (
        <Game2048Inner isPaused={isPaused} gameOver={gameOver} setGameOver={setGameOver} setScore={setScore} />
      )}
    </GameWrapper>
  );
}

function Game2048Inner({ isPaused, gameOver, setGameOver, setScore }: any) {
  const [grid, setGrid] = useState<number[][]>([]);
  const [sc, setSc] = useState(0);
  const init = useCallback(() => {
    const g = Array.from({length:4}, () => Array(4).fill(0));
    addRandom(g); addRandom(g);
    setGrid(g); setSc(0); setScore(0);
  }, []);

  useEffect(() => { init(); }, [init]);
  useEffect(() => { if (gameOver) init(); }, [gameOver, init]);

  function addRandom(g: number[][]) {
    const empty: [number,number][] = [];
    g.forEach((r,ri) => r.forEach((c,ci) => { if (!c) empty.push([ri,ci]); }));
    if (empty.length) { const [r,c] = empty[Math.floor(Math.random()*empty.length)]; g[r][c] = Math.random() < 0.9 ? 2 : 4; }
  }

  function move(dir: string) {
    if (isPaused) return;
    const g = grid.map(r => [...r]);
    let moved = false, pts = 0;
    const slide = (arr: number[]) => {
      let a = arr.filter(x => x);
      for (let i = 0; i < a.length - 1; i++) {
        if (a[i] === a[i+1]) { a[i] *= 2; pts += a[i]; a.splice(i+1,1); }
      }
      while (a.length < 4) a.push(0);
      return a;
    };
    if (dir === 'left') {
      for (let r = 0; r < 4; r++) { const n = slide(g[r]); if (n.some((v,i) => v !== g[r][i])) moved = true; g[r] = n; }
    } else if (dir === 'right') {
      for (let r = 0; r < 4; r++) { const n = slide([...g[r]].reverse()).reverse(); if (n.some((v,i) => v !== g[r][i])) moved = true; g[r] = n; }
    } else if (dir === 'up') {
      for (let c = 0; c < 4; c++) { const col = [g[0][c],g[1][c],g[2][c],g[3][c]]; const n = slide(col); if (n.some((v,i) => v !== col[i])) moved = true; for (let r = 0; r < 4; r++) g[r][c] = n[r]; }
    } else if (dir === 'down') {
      for (let c = 0; c < 4; c++) { const col = [g[3][c],g[2][c],g[1][c],g[0][c]]; const n = slide(col); if (n.some((v,i) => v !== col[i])) moved = true; for (let r = 0; r < 4; r++) g[3-r][c] = n[r]; }
    }
    if (moved) {
      addRandom(g);
      const ns = sc + pts;
      setSc(ns); setScore(ns);
      setGrid(g);
      if (pts > 0) SFX.playScore();
      else SFX.playMove();
      // Check game over
      let hasMove = false;
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
        if (!g[r][c]) hasMove = true;
        if (c < 3 && g[r][c] === g[r][c+1]) hasMove = true;
        if (r < 3 && g[r][c] === g[r+1][c]) hasMove = true;
      }
      if (!hasMove) { SFX.playLose(); setGameOver(true); }
    }
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const m: Record<string,string> = { ArrowLeft:'left', ArrowRight:'right', ArrowUp:'up', ArrowDown:'down' };
      if (m[e.key]) { e.preventDefault(); move(m[e.key]); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [grid, isPaused, sc]);

  const colors: Record<number,string> = {
    0:'#1a1a2e',2:'#eee4da',4:'#ede0c8',8:'#f2b179',16:'#f59563',32:'#f67c5f',
    64:'#f65e3b',128:'#edcf72',256:'#edcc61',512:'#edc850',1024:'#edc53f',2048:'#edc22e'
  };

  return (
    <div className="flex items-center justify-center h-full">
      <div className="bg-[#1a1a2e] p-4 rounded-xl">
        <div className="grid grid-cols-4 gap-2" style={{width:320}}>
          {grid.flat().map((v, i) => (
            <div key={i} className="w-[72px] h-[72px] rounded-lg flex items-center justify-center font-bold text-xl transition-all"
              style={{ background: colors[v] || '#3c3a32', color: v > 4 ? '#fff' : '#776e65' }}>
              {v || ''}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== GAME 4: Pong ====================
export function PongGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  return (
    <GameWrapper game={game} onBack={onBack}>
      {({ isPaused, setGameOver, setScore, gameOver }) => (
        <PongCanvas isPaused={isPaused} gameOver={gameOver} setGameOver={setGameOver} setScore={setScore} />
      )}
    </GameWrapper>
  );
}

function PongCanvas({ isPaused, gameOver, setGameOver, setScore }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sRef = useRef<any>(null);
  const W = 500, H = 350;

  const init = () => ({
    p1y: H/2-30, p2y: H/2-30, bx: W/2, by: H/2, bdx: 3, bdy: 2,
    s1: 0, s2: 0, pw: 10, ph: 60, bs: 8, over: false, keys: {} as Record<string,boolean>
  });

  useEffect(() => { sRef.current = init(); }, []);
  useEffect(() => { if (gameOver) sRef.current = init(); }, [gameOver]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const tick = () => {
      const s = sRef.current; if (!s) return;
      if (!isPaused && !s.over) {
        if (s.keys['ArrowUp']) s.p1y = Math.max(0, s.p1y - 5);
        if (s.keys['ArrowDown']) s.p1y = Math.min(H - s.ph, s.p1y + 5);
        // AI
        if (s.by < s.p2y + s.ph/2) s.p2y = Math.max(0, s.p2y - 3);
        if (s.by > s.p2y + s.ph/2) s.p2y = Math.min(H - s.ph, s.p2y + 3);
        s.bx += s.bdx; s.by += s.bdy;
        if (s.by <= 0 || s.by >= H) { s.bdy *= -1; SFX.playBounce(); }
        if (s.bx <= 20 && s.by >= s.p1y && s.by <= s.p1y + s.ph) { s.bdx = Math.abs(s.bdx) * 1.05; SFX.playBounce(); }
        if (s.bx >= W-20 && s.by >= s.p2y && s.by <= s.p2y + s.ph) { s.bdx = -Math.abs(s.bdx) * 1.05; SFX.playBounce(); }
        if (s.bx < 0) { s.s2++; s.bx = W/2; s.by = H/2; s.bdx = 3; SFX.playLose(); }
        if (s.bx > W) { s.s1++; s.bx = W/2; s.by = H/2; s.bdx = -3; SFX.playScore(); }
        setScore(s.s1);
        if (s.s1 >= 11 || s.s2 >= 11) { s.over = true; setGameOver(true); }
      }
      ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0,0,W,H);
      ctx.setLineDash([5,5]); ctx.strokeStyle='#333'; ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#fff';
      ctx.fillRect(5, s.p1y, s.pw, s.ph);
      ctx.fillRect(W-15, s.p2y, s.pw, s.ph);
      ctx.beginPath(); ctx.arc(s.bx, s.by, s.bs, 0, Math.PI*2); ctx.fill();
      ctx.font = '32px monospace'; ctx.textAlign = 'center';
      ctx.fillText(`${s.s1}`, W/4, 40);
      ctx.fillText(`${s.s2}`, 3*W/4, 40);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPaused, gameOver]);

  useEffect(() => {
    const kd = (e: KeyboardEvent) => { if (sRef.current) sRef.current.keys[e.key] = true; };
    const ku = (e: KeyboardEvent) => { if (sRef.current) sRef.current.keys[e.key] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);

  return <div className="flex items-center justify-center h-full"><canvas ref={canvasRef} width={W} height={H} className="border border-white/10 rounded" /></div>;
}

// ==================== GAME 5: Tanks ====================
export function TanksGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  return <CanvasGame game={game} onBack={onBack} init={initTanks} tick={tickTanks} onKey={keyTanks} w={400} h={400} />;
}

function initTanks() {
  return {
    px: 200, py: 360, pdir: 0, bullets: [] as any[], enemies: [] as any[],
    score: 0, over: false, lastSpawn: 0, spawnRate: 2000, level: 1
  };
}

function tickTanks(s: any, ctx: CanvasRenderingContext2D, w: number, h: number, _dt: number, keys: Record<string,boolean>, setScore: any, setGameOver: any) {
  if (s.over) return;
  const sp = 3;
  if (keys['ArrowUp']) { s.py = Math.max(10, s.py - sp); s.pdir = 0; }
  if (keys['ArrowDown']) { s.py = Math.min(h-10, s.py + sp); s.pdir = 2; }
  if (keys['ArrowLeft']) { s.px = Math.max(10, s.px - sp); s.pdir = 3; }
  if (keys['ArrowRight']) { s.px = Math.min(w-10, s.px + sp); s.pdir = 1; }

  s.bullets.forEach((b: any) => { b.x += b.dx * 6; b.y += b.dy * 6; });
  s.bullets = s.bullets.filter((b: any) => b.x > 0 && b.x < w && b.y > 0 && b.y < h);

  if (Date.now() - s.lastSpawn > s.spawnRate) {
    s.lastSpawn = Date.now();
    const type = Math.floor(Math.random()*4);
    s.enemies.push({ x: Math.random()*(w-40)+20, y: 10, type, hp: type+1, dir: 2, speed: 0.5+type*0.3, shootTimer: 0 });
  }

  s.enemies.forEach((e: any) => {
    e.y += e.speed;
    if (e.y > h) { s.over = true; SFX.playLose(); setGameOver(true); }
  });

  // Collision
  s.bullets = s.bullets.filter((b: any) => {
    if (b.player) {
      const hit = s.enemies.findIndex((e: any) => Math.abs(e.x-b.x)<15 && Math.abs(e.y-b.y)<15);
      if (hit >= 0) {
        s.enemies[hit].hp--;
        if (s.enemies[hit].hp <= 0) {
          const pts = (s.enemies[hit].type+1)*100;
          s.score += pts; setScore(s.score); SFX.playExplosion();
          s.enemies.splice(hit,1);
        }
        return false;
      }
    }
    return true;
  });

  // Draw
  ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0,0,w,h);
  // Base
  ctx.fillStyle = '#ff0'; ctx.font = '16px serif'; ctx.textAlign = 'center';
  ctx.fillText('🦅', w/2, h-5);
  // Player tank
  ctx.fillStyle = '#0f0';
  ctx.fillRect(s.px-8, s.py-8, 16, 16);
  ctx.fillStyle = '#0a0';
  const dirs = [[0,-8],[8,0],[0,8],[-8,0]];
  ctx.fillRect(s.px+dirs[s.pdir][0]-2, s.py+dirs[s.pdir][1]-2, 4, 4);
  // Enemies
  s.enemies.forEach((e: any) => {
    const colors = ['#f55','#fa0','#f0f','#fff'];
    ctx.fillStyle = colors[e.type];
    ctx.fillRect(e.x-8, e.y-8, 16, 16);
  });
  // Bullets
  s.bullets.forEach((b: any) => {
    ctx.fillStyle = b.player ? '#ff0' : '#f00';
    ctx.fillRect(b.x-2, b.y-2, 4, 4);
  });
  ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.textAlign = 'left';
  ctx.fillText(`Очки: ${s.score}`, 5, 15);
}

function keyTanks(s: any, key: string) {
  if ((key === ' ' || key === 'Enter') && !s.over) {
    const dirs = [[0,-1],[1,0],[0,1],[-1,0]];
    s.bullets.push({ x: s.px, y: s.py, dx: dirs[s.pdir][0], dy: dirs[s.pdir][1], player: true });
    SFX.playShoot();
  }
}

// ==================== GAME 6: Arkanoid ====================
export function ArkanoidGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  return <CanvasGame game={game} onBack={onBack} init={initArkanoid} tick={tickArkanoid} onKey={keyArkanoid} w={400} h={500} />;
}

function initArkanoid() {
  const bricks: any[] = [];
  const colors = ['#f00','#f80','#ff0','#0f0','#0ff','#00f'];
  for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++) {
    bricks.push({ x: c*48+12, y: r*20+30, w: 44, h: 16, color: colors[r], pts: (6-r)*10, alive: true });
  }
  return { px: 180, bx: 200, by: 400, bdx: 3, bdy: -3, bricks, score: 0, over: false, pw: 60, lives: 3, keys: {} as any };
}

function tickArkanoid(s: any, ctx: CanvasRenderingContext2D, w: number, h: number, __dt: number, keys: Record<string,boolean>, setScore: any, setGameOver: any) {
  if (s.over) return;
  if (keys['ArrowLeft']) s.px = Math.max(0, s.px - 5);
  if (keys['ArrowRight']) s.px = Math.min(w - s.pw, s.px + 5);

  s.bx += s.bdx; s.by += s.bdy;
  if (s.bx <= 0 || s.bx >= w) { s.bdx *= -1; SFX.playBounce(); }
  if (s.by <= 0) { s.bdy *= -1; SFX.playBounce(); }
  if (s.by >= h - 15 && s.bx >= s.px && s.bx <= s.px + s.pw) {
    s.bdy = -Math.abs(s.bdy);
    s.bdx = (s.bx - (s.px + s.pw/2)) / 10;
    SFX.playBounce();
  }
  if (s.by > h) {
    s.lives--;
    if (s.lives <= 0) { s.over = true; SFX.playLose(); setGameOver(true); }
    else { s.bx = s.px + s.pw/2; s.by = h - 20; s.bdy = -3; s.bdx = 3; }
  }

  s.bricks.forEach((b: any) => {
    if (b.alive && s.bx >= b.x && s.bx <= b.x+b.w && s.by >= b.y && s.by <= b.y+b.h) {
      b.alive = false; s.bdy *= -1; s.score += b.pts; setScore(s.score); SFX.playScore();
    }
  });

  if (s.bricks.every((b: any) => !b.alive)) { s.over = true; SFX.playWin(); setGameOver(true); }

  ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0,0,w,h);
  s.bricks.forEach((b: any) => {
    if (b.alive) { ctx.fillStyle = b.color; ctx.fillRect(b.x, b.y, b.w, b.h); }
  });
  ctx.fillStyle = '#fff';
  ctx.fillRect(s.px, h-12, s.pw, 8);
  ctx.beginPath(); ctx.arc(s.bx, s.by, 5, 0, Math.PI*2); ctx.fill();
  ctx.font = '12px monospace'; ctx.fillText(`Очки: ${s.score}  ❤ ${s.lives}`, 5, 18);
}

function keyArkanoid(_s: any, _key: string) {}

// ==================== GAME 7: Space Invaders ====================
export function InvadersGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  return <CanvasGame game={game} onBack={onBack} init={initInvaders} tick={tickInvaders} onKey={keyInvaders} w={400} h={450} />;
}

function initInvaders() {
  const enemies: any[] = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) {
    enemies.push({ x: c*45+30, y: r*30+30, type: r, alive: true });
  }
  return { px: 200, bullets: [] as any[], enemies, dir: 1, moveTimer: 0, score: 0, over: false, speed: 500 };
}

function tickInvaders(s: any, ctx: CanvasRenderingContext2D, w: number, h: number, _dt: number, keys: Record<string,boolean>, setScore: any, setGameOver: any) {
  if (s.over) return;
  if (keys['ArrowLeft']) s.px = Math.max(10, s.px - 4);
  if (keys['ArrowRight']) s.px = Math.min(w-10, s.px + 4);

  s.bullets.forEach((b: any) => b.y += b.dy);
  s.bullets = s.bullets.filter((b: any) => b.y > 0 && b.y < h);

  s.moveTimer++;
  const alive = s.enemies.filter((e: any) => e.alive);
  const sp = Math.max(5, 30 - alive.length);
  if (s.moveTimer % sp === 0) {
    let hitEdge = false;
    alive.forEach((e: any) => { e.x += s.dir * 10; if (e.x < 10 || e.x > w - 10) hitEdge = true; });
    if (hitEdge) { s.dir *= -1; alive.forEach((e: any) => { e.y += 15; e.x += s.dir * 10; }); }
  }

  s.bullets = s.bullets.filter((b: any) => {
    if (b.dy < 0) {
      const hit = s.enemies.findIndex((e: any) => e.alive && Math.abs(e.x-b.x)<15 && Math.abs(e.y-b.y)<12);
      if (hit >= 0) {
        s.enemies[hit].alive = false;
        const pts = [40,30,20,10,10][s.enemies[hit].type];
        s.score += pts; setScore(s.score); SFX.playExplosion();
        return false;
      }
    }
    return true;
  });

  if (alive.some((e: any) => e.y > h - 40)) { s.over = true; SFX.playLose(); setGameOver(true); }
  if (alive.length === 0) { s.over = true; SFX.playWin(); setGameOver(true); }

  ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0,0,w,h);
  const shapes = ['👾','👽','🛸','👻','💀'];
  ctx.font = '18px serif';
  s.enemies.forEach((e: any) => { if (e.alive) ctx.fillText(shapes[e.type], e.x-9, e.y+6); });
  ctx.fillStyle = '#0f0'; ctx.fillRect(s.px-12, h-20, 24, 8);
  ctx.fillRect(s.px-2, h-28, 4, 8);
  s.bullets.forEach((b: any) => { ctx.fillStyle = b.dy < 0 ? '#0f0' : '#f00'; ctx.fillRect(b.x-1, b.y-3, 2, 6); });
  ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.fillText(`Очки: ${s.score}`, 5, 18);
}

function keyInvaders(s: any, key: string) {
  if ((key === ' ' || key === 'Enter') && !s.over) {
    s.bullets.push({ x: s.px, y: 420, dy: -6 });
    SFX.playShoot();
  }
}

// ==================== GAME 8: Galaga ====================
export function GalagaGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  return <CanvasGame game={game} onBack={onBack} init={initGalaga} tick={tickInvaders} onKey={keyInvaders} w={400} h={450} />;
}
function initGalaga() {
  const s = initInvaders();
  s.enemies.forEach((e: any) => { e.type = Math.floor(Math.random()*5); });
  return s;
}

// ==================== GAME 9: Frogger ====================
export function FroggerGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  return <CanvasGame game={game} onBack={onBack} init={initFrogger} tick={tickFrogger} onKey={keyFrogger} w={400} h={450} />;
}

function initFrogger() {
  const lanes: any[] = [];
  for (let i = 0; i < 5; i++) {
    const cars: any[] = [];
    for (let j = 0; j < 3; j++) cars.push({ x: j * 140 + Math.random()*60 });
    lanes.push({ y: 350 - i*50, speed: (i%2===0?1:-1)*(1+i*0.3), cars, type: 'road' });
  }
  for (let i = 0; i < 4; i++) {
    const logs: any[] = [];
    for (let j = 0; j < 2; j++) logs.push({ x: j * 200 + Math.random()*80, w: 60+Math.random()*40 });
    lanes.push({ y: 100 - i*(-50), speed: (i%2===0?0.8:-0.8), cars: logs, type: 'water' });
  }
  return { px: 200, py: 400, score: 0, over: false, lanes, homes: [false,false,false,false,false] };
}

function tickFrogger(s: any, ctx: CanvasRenderingContext2D, w: number, h: number, _dt: number, _keys: Record<string,boolean>, setScore: any, setGameOver: any) {
  if (s.over) return;
  s.lanes.forEach((l: any) => {
    l.cars.forEach((c: any) => {
      c.x += l.speed;
      if (c.x > w + 50) c.x = -50;
      if (c.x < -50) c.x = w + 50;
    });
  });

  // Check road collisions
  s.lanes.filter((l: any) => l.type === 'road').forEach((l: any) => {
    l.cars.forEach((c: any) => {
      if (Math.abs(s.py - l.y) < 20 && Math.abs(s.px - c.x) < 25) {
        s.over = true; SFX.playLose(); setGameOver(true);
      }
    });
  });

  if (s.py <= 30) { s.score += 10; setScore(s.score); SFX.playScore(); s.py = 400; }

  ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0,0,w,h);
  // Draw lanes
  s.lanes.forEach((l: any) => {
    ctx.fillStyle = l.type === 'road' ? '#333' : '#004';
    ctx.fillRect(0, l.y - 20, w, 40);
    l.cars.forEach((c: any) => {
      ctx.fillStyle = l.type === 'road' ? '#f00' : '#8B4513';
      ctx.fillRect(c.x - 20, l.y - 10, c.w || 40, 20);
    });
  });
  // Safe zones
  ctx.fillStyle = '#0a0'; ctx.fillRect(0, h-25, w, 25); ctx.fillRect(0, 0, w, 30);
  // Frog
  ctx.font = '20px serif'; ctx.fillText('🐸', s.px - 10, s.py + 7);
  ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.fillText(`Очки: ${s.score}`, 5, h-5);
}

function keyFrogger(s: any, key: string) {
  if (s.over) return;
  const step = 40;
  if (key === 'ArrowUp') { s.py -= step; SFX.playMove(); }
  if (key === 'ArrowDown') { s.py = Math.min(400, s.py + step); SFX.playMove(); }
  if (key === 'ArrowLeft') { s.px = Math.max(10, s.px - step); SFX.playMove(); }
  if (key === 'ArrowRight') { s.px = Math.min(390, s.px + step); SFX.playMove(); }
}

// ==================== GAME 10: Pac-Man ====================
export function PacManGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  return <CanvasGame game={game} onBack={onBack} init={initPacman} tick={tickPacman} onKey={keyPacman} w={380} h={420} />;
}

function initPacman() {
  const maze: number[][] = [];
  for (let r = 0; r < 19; r++) {
    maze.push([]);
    for (let c = 0; c < 19; c++) {
      if (r === 0 || r === 18 || c === 0 || c === 18) maze[r].push(1);
      else if (r % 2 === 0 && c % 2 === 0) maze[r].push(1);
      else maze[r].push(0);
    }
  }
  const dots: boolean[][] = maze.map(r => r.map(c => c === 0));
  dots[9][9] = false; dots[8][9] = false; dots[9][8] = false;
  const ghosts = [
    { x: 9, y: 8, dx: 1, dy: 0, color: '#f00' },
    { x: 9, y: 9, dx: -1, dy: 0, color: '#f0f' },
    { x: 8, y: 9, dx: 0, dy: 1, color: '#0ff' },
  ];
  return { px: 1, py: 1, dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 }, maze, dots, ghosts, score: 0, over: false, moveTimer: 0, powerUp: 0 };
}

function tickPacman(s: any, ctx: CanvasRenderingContext2D, w: number, h: number, _dt: number, _keys: Record<string,boolean>, setScore: any, setGameOver: any) {
  if (s.over) return;
  const CS = 20;
  s.moveTimer++;
  if (s.moveTimer % 8 === 0) {
    const nd = s.nextDir;
    const nx = s.px + nd.x, ny = s.py + nd.y;
    if (nx >= 0 && nx < 19 && ny >= 0 && ny < 19 && s.maze[ny][nx] === 0) { s.dir = { ...nd }; }
    const mx = s.px + s.dir.x, my = s.py + s.dir.y;
    if (mx >= 0 && mx < 19 && my >= 0 && my < 19 && s.maze[my][mx] === 0) { s.px = mx; s.py = my; }

    if (s.dots[s.py][s.px]) { s.dots[s.py][s.px] = false; s.score += 10; setScore(s.score); SFX.playClick(); }

    // Move ghosts
    s.ghosts.forEach((g: any) => {
      if (Math.random() < 0.3) {
        const dirs = [[1,0],[-1,0],[0,1],[0,-1]].filter(d => {
          const gx = g.x+d[0], gy = g.y+d[1];
          return gx >= 0 && gx < 19 && gy >= 0 && gy < 19 && s.maze[gy][gx] === 0;
        });
        if (dirs.length) { const d = dirs[Math.floor(Math.random()*dirs.length)]; g.dx = d[0]; g.dy = d[1]; }
      }
      const gx = g.x + g.dx, gy = g.y + g.dy;
      if (gx >= 0 && gx < 19 && gy >= 0 && gy < 19 && s.maze[gy][gx] === 0) { g.x = gx; g.y = gy; }
    });

    // Ghost collision
    if (s.ghosts.some((g: any) => g.x === s.px && g.y === s.py)) {
      s.over = true; SFX.playLose(); setGameOver(true);
    }
  }

  ctx.fillStyle = '#000'; ctx.fillRect(0,0,w,h);
  for (let r = 0; r < 19; r++) for (let c = 0; c < 19; c++) {
    if (s.maze[r][c]) { ctx.fillStyle = '#00f'; ctx.fillRect(c*CS, r*CS, CS, CS); }
    else if (s.dots[r][c]) { ctx.fillStyle = '#ff0'; ctx.beginPath(); ctx.arc(c*CS+CS/2, r*CS+CS/2, 3, 0, Math.PI*2); ctx.fill(); }
  }
  // Pac-man
  ctx.fillStyle = '#ff0';
  ctx.beginPath(); ctx.arc(s.px*CS+CS/2, s.py*CS+CS/2, 8, 0.2, Math.PI*2-0.2); ctx.lineTo(s.px*CS+CS/2, s.py*CS+CS/2); ctx.fill();
  // Ghosts
  s.ghosts.forEach((g: any) => { ctx.fillStyle = g.color; ctx.fillRect(g.x*CS+2, g.y*CS+2, CS-4, CS-4); });
  ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.fillText(`Очки: ${s.score}`, 5, h-5);
}

function keyPacman(s: any, key: string) {
  const dirs: Record<string,{x:number;y:number}> = {
    ArrowUp:{x:0,y:-1}, ArrowDown:{x:0,y:1}, ArrowLeft:{x:-1,y:0}, ArrowRight:{x:1,y:0}
  };
  if (dirs[key]) s.nextDir = dirs[key];
}

// ==================== GAME 11: Minesweeper ====================
export function MinesweeperGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  const [grid, setGrid] = useState<any[][]>([]);
  const [cursor, setCursor] = useState({x:0,y:0});
  const [over, setOver] = useState(false);
  const [won, setWon] = useState(false);
  const [time, setTime] = useState(0);
  const rows = 9, cols = 9, mines = 10;

  const init = useCallback(() => {
    const g: any[][] = Array.from({length:rows}, () => Array.from({length:cols}, () => ({mine:false,revealed:false,flag:false,count:0})));
    let placed = 0;
    while (placed < mines) {
      const r = Math.floor(Math.random()*rows), c = Math.floor(Math.random()*cols);
      if (!g[r][c].mine) { g[r][c].mine = true; placed++; }
    }
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      let cnt = 0;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const nr = r+dr, nc = c+dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && g[nr][nc].mine) cnt++;
      }
      g[r][c].count = cnt;
    }
    setGrid(g); setCursor({x:0,y:0}); setOver(false); setWon(false); setTime(0);
  }, []);

  useEffect(() => { init(); }, [init]);
  useEffect(() => {
    if (over || won) return;
    const iv = setInterval(() => setTime(t => t+1), 1000);
    return () => clearInterval(iv);
  }, [over, won]);

  const reveal = (r: number, c: number) => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    const g = grid.map(row => row.map(cell => ({...cell})));
    const flood = (rr: number, cc: number) => {
      if (rr < 0 || rr >= rows || cc < 0 || cc >= cols || g[rr][cc].revealed || g[rr][cc].flag) return;
      g[rr][cc].revealed = true;
      if (g[rr][cc].mine) { setOver(true); SFX.playLose(); return; }
      if (g[rr][cc].count === 0) {
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) flood(rr+dr, cc+dc);
      }
    };
    flood(r, c);
    setGrid(g);
    // Check win
    let allRevealed = true;
    for (let rr = 0; rr < rows; rr++) for (let cc = 0; cc < cols; cc++) {
      if (!g[rr][cc].mine && !g[rr][cc].revealed) allRevealed = false;
    }
    if (allRevealed) { setWon(true); SFX.playWin(); }
  };

  const toggleFlag = (r: number, c: number) => {
    const g = grid.map(row => row.map(cell => ({...cell})));
    if (!g[r][c].revealed) { g[r][c].flag = !g[r][c].flag; SFX.playClick(); }
    setGrid(g);
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (over || won) return;
      if (e.key === 'ArrowUp') setCursor(c => ({...c, y: Math.max(0, c.y-1)}));
      if (e.key === 'ArrowDown') setCursor(c => ({...c, y: Math.min(rows-1, c.y+1)}));
      if (e.key === 'ArrowLeft') setCursor(c => ({...c, x: Math.max(0, c.x-1)}));
      if (e.key === 'ArrowRight') setCursor(c => ({...c, x: Math.min(cols-1, c.x+1)}));
      if (e.key === 'Enter' || e.key === ' ') reveal(cursor.y, cursor.x);
      if (e.key === 'f' || e.key === 'F') toggleFlag(cursor.y, cursor.x);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [cursor, grid, over, won]);

  return (
    <GameWrapper game={game} onBack={onBack}>
      {() => (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-white mb-2 font-mono">⏱ {time}с  💣 {mines}  {won && '🎉 Победа!'} {over && '💥 Взрыв!'}</div>
          <div className="bg-[#1a1a2e] p-2 rounded">
            {grid.map((row, r) => (
              <div key={r} className="flex">
                {row.map((cell: any, c: number) => (
                  <div key={c} onClick={() => reveal(r,c)} onContextMenu={(e) => {e.preventDefault(); toggleFlag(r,c);}}
                    className={`w-8 h-8 flex items-center justify-center text-sm font-bold border border-white/10 cursor-pointer
                      ${cursor.x===c&&cursor.y===r?'ring-2 ring-yellow-400':''}
                      ${cell.revealed?'bg-[#2a2a3e]':'bg-[#3a3a4e] hover:bg-[#4a4a5e]'}
                      ${over&&cell.mine?'bg-red-900':''}`}>
                    {cell.revealed ? (cell.mine ? '💣' : (cell.count > 0 ? cell.count : '')) :
                     (cell.flag ? '🚩' : (over && cell.mine ? '💣' : ''))}
                  </div>
                ))}
              </div>
            ))}
          </div>
          {(over || won) && <button onClick={init} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Заново</button>}
        </div>
      )}
    </GameWrapper>
  );
}

// ==================== GAME 12: 15 Puzzle ====================
export function Puzzle15Game({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  const [tiles, setTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const init = useCallback(() => {
    let arr: number[];
    do {
      arr = Array.from({length:15}, (_,i) => i+1);
      arr.push(0);
      for (let i = arr.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [arr[i],arr[j]] = [arr[j],arr[i]]; }
    } while (!isSolvable(arr));
    setTiles(arr); setMoves(0); setWon(false);
  }, []);

  function isSolvable(arr: number[]) {
    let inv = 0;
    for (let i = 0; i < 16; i++) for (let j = i+1; j < 16; j++) {
      if (arr[i] && arr[j] && arr[i] > arr[j]) inv++;
    }
    const blankRow = Math.floor(arr.indexOf(0) / 4);
    return (inv + blankRow) % 2 === 1;
  }

  useEffect(() => { init(); }, [init]);

  const moveTile = (dir: string) => {
    if (won) return;
    const idx = tiles.indexOf(0);
    const r = Math.floor(idx/4), c = idx%4;
    let tr = r, tc = c;
    if (dir === 'up') tr = r+1;
    if (dir === 'down') tr = r-1;
    if (dir === 'left') tc = c+1;
    if (dir === 'right') tc = c-1;
    if (tr < 0 || tr > 3 || tc < 0 || tc > 3) return;
    const ti = tr*4+tc;
    const newTiles = [...tiles];
    [newTiles[idx], newTiles[ti]] = [newTiles[ti], newTiles[idx]];
    setTiles(newTiles);
    setMoves(m => m+1);
    SFX.playMove();
    // Check win
    if (newTiles.slice(0,15).every((v,i) => v === i+1)) { setWon(true); SFX.playWin(); }
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const m: Record<string,string> = { ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right' };
      if (m[e.key]) { e.preventDefault(); moveTile(m[e.key]); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [tiles, won]);

  return (
    <GameWrapper game={game} onBack={onBack}>
      {() => (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-white mb-3 font-mono">Ходы: {moves} {won && '🎉 Победа!'}</div>
          <div className="grid grid-cols-4 gap-1 bg-[#1a1a2e] p-2 rounded">
            {tiles.map((v, i) => (
              <div key={i} className={`w-16 h-16 flex items-center justify-center text-xl font-bold rounded
                ${v === 0 ? 'bg-transparent' : 'bg-[#3a3a5e] hover:bg-[#4a4a6e] cursor-pointer text-white'}`}>
                {v || ''}
              </div>
            ))}
          </div>
          <button onClick={init} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded text-sm">Новая игра</button>
        </div>
      )}
    </GameWrapper>
  );
}

// ==================== GAME 13: Sudoku ====================
export function SudokuGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  const [grid, setGrid] = useState<number[][]>([]);
  const [fixed, setFixed] = useState<boolean[][]>([]);
  const [cursor, setCursor] = useState({x:0,y:0});
  const [won, setWon] = useState(false);

  const init = useCallback(() => {
    // Simple 4x4 sudoku
    const solution = [[1,2,3,4],[3,4,1,2],[2,1,4,3],[4,3,2,1]];
    const g = solution.map(r => [...r]);
    const f = g.map(r => r.map(() => true));
    // Remove some cells
    for (let i = 0; i < 8; i++) {
      const r = Math.floor(Math.random()*4), c = Math.floor(Math.random()*4);
      g[r][c] = 0; f[r][c] = false;
    }
    setGrid(g); setFixed(f); setCursor({x:0,y:0}); setWon(false);
  }, []);

  useEffect(() => { init(); }, [init]);

  const checkWin = (g: number[][]) => {
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (!g[r][c]) return false;
    // Check rows, cols, blocks
    for (let r = 0; r < 4; r++) { if (new Set(g[r]).size !== 4) return false; }
    for (let c = 0; c < 4; c++) { if (new Set(g.map(r => r[c])).size !== 4) return false; }
    return true;
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (won) return;
      if (e.key === 'ArrowUp') setCursor(c => ({...c, y: Math.max(0, c.y-1)}));
      if (e.key === 'ArrowDown') setCursor(c => ({...c, y: Math.min(3, c.y+1)}));
      if (e.key === 'ArrowLeft') setCursor(c => ({...c, x: Math.max(0, c.x-1)}));
      if (e.key === 'ArrowRight') setCursor(c => ({...c, x: Math.min(3, c.x+1)}));
      const num = parseInt(e.key);
      if (num >= 1 && num <= 4 && !fixed[cursor.y]?.[cursor.x]) {
        const g = grid.map(r => [...r]);
        g[cursor.y][cursor.x] = num;
        setGrid(g);
        SFX.playClick();
        if (checkWin(g)) { setWon(true); SFX.playWin(); }
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [cursor, grid, fixed, won]);

  return (
    <GameWrapper game={game} onBack={onBack}>
      {() => (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-white mb-3">{won ? '🎉 Решено!' : 'Введите числа 1-4'}</div>
          <div className="bg-[#1a1a2e] p-2 rounded">
            {grid.map((row, r) => (
              <div key={r} className="flex">
                {row.map((v, c) => (
                  <div key={c} className={`w-14 h-14 flex items-center justify-center text-xl font-bold border
                    ${cursor.x===c&&cursor.y===r?'ring-2 ring-yellow-400':''}
                    ${fixed[r]?.[c]?'text-white bg-[#2a2a3e]':'text-green-400 bg-[#1a1a2e] cursor-pointer'}
                    ${r%2===0?'border-t-2':'border-t'} ${c%2===0?'border-l-2':'border-l'} border-white/20`}>
                    {v || ''}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            {[1,2,3,4].map(n => (
              <button key={n} onClick={() => {
                if (!fixed[cursor.y]?.[cursor.x]) {
                  const g = grid.map(r => [...r]); g[cursor.y][cursor.x] = n; setGrid(g); SFX.playClick();
                  if (checkWin(g)) { setWon(true); SFX.playWin(); }
                }
              }} className="w-10 h-10 bg-[#3a3a5e] text-white rounded hover:bg-[#5a5a7e]">{n}</button>
            ))}
          </div>
          <button onClick={init} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded text-sm">Новая игра</button>
        </div>
      )}
    </GameWrapper>
  );
}

// ==================== GAME 14-50: Simplified implementations ====================

// Generic Canvas Game component
function CanvasGame({ game, onBack, init, tick, onKey, w, h }: {
  game: GameInfo; onBack: () => void;
  init: () => any; tick: (s:any, ctx:CanvasRenderingContext2D, w:number, h:number, dt:number, keys:Record<string,boolean>, setScore:any, setGameOver:any) => void;
  onKey: (s:any, key:string) => void; w: number; h: number;
}) {
  return (
    <GameWrapper game={game} onBack={onBack}>
      {({ isPaused, setGameOver, setScore, gameOver }) => (
        <CanvasGameInner init={init} tick={tick} onKey={onKey} w={w} h={h}
          isPaused={isPaused} gameOver={gameOver} setGameOver={setGameOver} setScore={setScore} />
      )}
    </GameWrapper>
  );
}

function CanvasGameInner({ init, tick, onKey, w, h, isPaused, gameOver, setGameOver, setScore }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<any>(null);
  const keysRef = useRef<Record<string,boolean>>({});

  useEffect(() => { stateRef.current = init(); }, []);
  useEffect(() => { if (gameOver) stateRef.current = init(); }, [gameOver]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const loop = () => {
      const s = stateRef.current;
      if (s && !isPaused && !s.over) {
        tick(s, ctx, w, h, 16, keysRef.current, setScore, setGameOver);
      } else if (s) {
        tick(s, ctx, w, h, 0, {}, setScore, setGameOver);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isPaused, gameOver]);

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      if (stateRef.current && !isPaused) onKey(stateRef.current, e.key);
    };
    const ku = (e: KeyboardEvent) => { keysRef.current[e.key] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, [isPaused]);

  return <div className="flex items-center justify-center h-full"><canvas ref={canvasRef} width={w} height={h} className="border border-white/10 rounded" /></div>;
}

// ==================== GAME 14: Lines ====================
export function LinesGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  return <CanvasGame game={game} onBack={onBack} init={initLines} tick={tickLines} onKey={keyLines} w={360} h={400} />;
}
function initLines() {
  const grid: number[][] = Array.from({length:9}, () => Array(9).fill(0));
  const colors = 7;
  for (let i = 0; i < 3; i++) { const r = Math.floor(Math.random()*9), c = Math.floor(Math.random()*9); grid[r][c] = Math.floor(Math.random()*colors)+1; }
  return { grid, selected: null as null|{r:number,c:number}, score: 0, over: false, colors };
}
function tickLines(s: any, ctx: CanvasRenderingContext2D, w: number, h: number) {
  const CS = 38, ox = 10, oy = 30;
  ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0,0,w,h);
  const ballColors = ['','#f00','#0f0','#00f','#ff0','#f0f','#0ff','#fa0'];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    ctx.strokeStyle = '#222'; ctx.strokeRect(ox+c*CS, oy+r*CS, CS, CS);
    if (s.grid[r][c]) {
      ctx.fillStyle = ballColors[s.grid[r][c]];
      ctx.beginPath(); ctx.arc(ox+c*CS+CS/2, oy+r*CS+CS/2, 14, 0, Math.PI*2); ctx.fill();
    }
  }
  if (s.selected) {
    ctx.strokeStyle = '#ff0'; ctx.lineWidth = 2;
    ctx.strokeRect(ox+s.selected.c*CS, oy+s.selected.r*CS, CS, CS);
    ctx.lineWidth = 1;
  }
  ctx.fillStyle = '#fff'; ctx.font = '14px monospace'; ctx.fillText(`Очки: ${s.score}`, 10, 20);
}
function keyLines(s: any, key: string) {
  // Simplified - use cursor
  if (!s.cursor) s.cursor = {r:0,c:0};
  if (key === 'ArrowUp') s.cursor.r = Math.max(0, s.cursor.r-1);
  if (key === 'ArrowDown') s.cursor.r = Math.min(8, s.cursor.r+1);
  if (key === 'ArrowLeft') s.cursor.c = Math.max(0, s.cursor.c-1);
  if (key === 'ArrowRight') s.cursor.c = Math.min(8, s.cursor.c+1);
  if (key === 'Enter' || key === ' ') {
    if (!s.selected && s.grid[s.cursor.r][s.cursor.c]) {
      s.selected = {r:s.cursor.r, c:s.cursor.c}; SFX.playSelect();
    } else if (s.selected) {
      if (s.grid[s.cursor.r][s.cursor.c] === 0) {
        s.grid[s.cursor.r][s.cursor.c] = s.grid[s.selected.r][s.selected.c];
        s.grid[s.selected.r][s.selected.c] = 0;
        s.selected = null;
        // Check lines
        const checkLines = () => {
          let cleared = false;
          for (let r = 0; r < 9; r++) {
            for (let c = 0; c <= 4; c++) {
              const v = s.grid[r][c]; if (!v) continue;
              let len = 1;
              while (c+len < 9 && s.grid[r][c+len] === v) len++;
              if (len >= 5) { for (let i = 0; i < len; i++) s.grid[r][c+i] = 0; s.score += len*10; cleared = true; }
            }
          }
          for (let c = 0; c < 9; c++) {
            for (let r = 0; r <= 4; r++) {
              const v = s.grid[r][c]; if (!v) continue;
              let len = 1;
              while (r+len < 9 && s.grid[r+len][c] === v) len++;
              if (len >= 5) { for (let i = 0; i < len; i++) s.grid[r+i][c] = 0; s.score += len*10; cleared = true; }
            }
          }
          return cleared;
        };
        if (!checkLines()) {
          // Add new balls
          for (let i = 0; i < 3; i++) {
            const empty: [number,number][] = [];
            s.grid.forEach((r: number[], ri: number) => r.forEach((c, ci) => { if (!c) empty.push([ri,ci]); }));
            if (empty.length) { const [er,ec] = empty[Math.floor(Math.random()*empty.length)]; s.grid[er][ec] = Math.floor(Math.random()*s.colors)+1; }
          }
          checkLines();
        } else { SFX.playScore(); }
        SFX.playMove();
      } else {
        s.selected = {r:s.cursor.r, c:s.cursor.c}; SFX.playSelect();
      }
    }
  }
}

// ==================== GAME 15: Ball Sort ====================
export function BallSortGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  const [tubes, setTubes] = useState<number[][]>([]);
  const [selected, setSelected] = useState<number|null>(null);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [cursor, setCursorState] = useState(0);

  const init = useCallback(() => {
    const colors = 4; const tubeCount = colors + 2;
    const balls: number[] = [];
    for (let c = 1; c <= colors; c++) for (let i = 0; i < 4; i++) balls.push(c);
    for (let i = balls.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [balls[i],balls[j]]=[balls[j],balls[i]]; }
    const t: number[][] = [];
    for (let i = 0; i < colors; i++) t.push(balls.slice(i*4, (i+1)*4));
    for (let i = 0; i < tubeCount - colors; i++) t.push([]);
    setTubes(t); setSelected(null); setMoves(0); setWon(false); setCursorState(0);
  }, []);

  useEffect(() => { init(); }, [init]);

  const doMove = (from: number, to: number) => {
    const t = tubes.map(tb => [...tb]);
    if (t[from].length === 0) return;
    if (t[to].length >= 4) return;
    if (t[to].length > 0 && t[to][t[to].length-1] !== t[from][t[from].length-1]) return;
    t[to].push(t[from].pop()!);
    setTubes(t); setMoves(m => m+1); SFX.playMove();
    // Check win
    if (t.every(tb => tb.length === 0 || (tb.length === 4 && tb.every(b => b === tb[0])))) {
      setWon(true); SFX.playWin();
    }
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (won) return;
      if (e.key === 'ArrowLeft') setCursorState(c => Math.max(0, c-1));
      if (e.key === 'ArrowRight') setCursorState(c => Math.min(tubes.length-1, c+1));
      if (e.key === 'Enter' || e.key === ' ') {
        if (selected === null) { if (tubes[cursor].length > 0) setSelected(cursor); }
        else { doMove(selected, cursor); setSelected(null); }
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [cursor, selected, tubes, won]);

  const ballColors: Record<number,string> = { 1:'#f44', 2:'#4f4', 3:'#44f', 4:'#ff4', 5:'#f4f', 6:'#4ff' };

  return (
    <GameWrapper game={game} onBack={onBack}>
      {() => (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-white mb-3 font-mono">Ходы: {moves} {won && '🎉 Готово!'}</div>
          <div className="flex gap-3">
            {tubes.map((tube, ti) => (
              <div key={ti} onClick={() => {
                if (won) return;
                if (selected === null) { if (tube.length > 0) setSelected(ti); }
                else { doMove(selected, ti); setSelected(null); }
              }}
                className={`w-12 border-2 border-b-4 rounded-b-lg p-1 flex flex-col-reverse gap-1 h-[160px]
                  ${cursor===ti?'border-yellow-400':'border-white/30'}
                  ${selected===ti?'bg-white/10':''}`}>
                {tube.map((b, bi) => (
                  <div key={bi} className="w-8 h-8 rounded-full mx-auto" style={{background: ballColors[b]}} />
                ))}
              </div>
            ))}
          </div>
          <button onClick={init} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded text-sm">Новая игра</button>
        </div>
      )}
    </GameWrapper>
  );
}

// ==================== GAME 21: Flappy Bird ====================
export function FlappyGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  return <CanvasGame game={game} onBack={onBack} init={initFlappy} tick={tickFlappy} onKey={keyFlappy} w={300} h={500} />;
}
function initFlappy() {
  return { by: 250, bv: 0, pipes: [{x:300,gap:200,h:150}], score: 0, over: false, frame: 0 };
}
function tickFlappy(s: any, ctx: CanvasRenderingContext2D, w: number, h: number) {
  if (s.over) return;
  s.bv += 0.4; s.by += s.bv; s.frame++;
  if (s.by > h || s.by < 0) { s.over = true; SFX.playLose(); return; }
  if (s.frame % 90 === 0) {
    s.pipes.push({ x: w, gap: 120 + Math.random()*80, h: 50 + Math.random()*(h-200) });
  }
  s.pipes.forEach((p: any) => { p.x -= 2; });
  s.pipes = s.pipes.filter((p: any) => p.x > -60);
  // Collision
  s.pipes.forEach((p: any) => {
    if (Math.abs(p.x - 50) < 25) {
      if (s.by < p.h || s.by > p.h + p.gap) { s.over = true; SFX.playLose(); }
    }
    if (p.x === 48 && !p.scored) { p.scored = true; s.score++; SFX.playScore(); }
  });

  ctx.fillStyle = '#87CEEB'; ctx.fillRect(0,0,w,h);
  ctx.fillStyle = '#228B22'; ctx.fillRect(0,h-30,w,30);
  // Pipes
  s.pipes.forEach((p: any) => {
    ctx.fillStyle = '#2d8b2d';
    ctx.fillRect(p.x, 0, 40, p.h);
    ctx.fillRect(p.x, p.h + p.gap, 40, h);
  });
  // Bird
  ctx.fillStyle = '#ff0'; ctx.beginPath(); ctx.arc(50, s.by, 12, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#f80'; ctx.beginPath(); ctx.arc(62, s.by, 5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#000'; ctx.font = '24px monospace'; ctx.fillText(`${s.score}`, w/2-10, 40);
}
function keyFlappy(s: any, key: string) {
  if (key === ' ' || key === 'Enter' || key === 'ArrowUp') { s.bv = -6; SFX.playMove(); }
}

// ==================== GAME 22: Chrome Dino ====================
export function DinoGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  return <CanvasGame game={game} onBack={onBack} init={initDino} tick={tickDino} onKey={keyDino} w={600} h={200} />;
}
function initDino() {
  return { dy: 0, dv: 0, jumping: false, ducking: false, obstacles: [] as any[], score: 0, over: false, frame: 0, speed: 4, ground: 160 };
}
function tickDino(s: any, ctx: CanvasRenderingContext2D, w: number, h: number) {
  if (s.over) return;
  s.frame++;
  if (s.jumping) { s.dv += 0.5; s.dy += s.dv; if (s.dy >= 0) { s.dy = 0; s.dv = 0; s.jumping = false; } }
  if (s.frame % Math.max(30, 80 - s.score*2) === 0) {
    s.obstacles.push({ x: w, type: Math.random() < 0.7 ? 'cactus' : 'bird', w: 20, h: Math.random() < 0.5 ? 30 : 40 });
  }
  s.obstacles.forEach((o: any) => { o.x -= s.speed; });
  s.obstacles = s.obstacles.filter((o: any) => o.x > -30);
  // Collision
  const dh = s.ducking ? 15 : 30;
  const dY = s.ground + s.dy - dh;
  s.obstacles.forEach((o: any) => {
    const oY = o.type === 'bird' ? s.ground - 40 : s.ground - o.h;
    if (o.x > 30 && o.x < 60 && dY < oY + o.h && dY + dh > oY) {
      if (!o.scored) { s.over = true; SFX.playLose(); }
    }
    if (o.x < 40 && !o.scored) { o.scored = true; s.score++; SFX.playScore(); }
  });
  s.speed = Math.min(8, 4 + s.score * 0.1);

  ctx.fillStyle = '#f7f7f7'; ctx.fillRect(0,0,w,h);
  ctx.fillStyle = '#555'; ctx.fillRect(0, s.ground, w, 2);
  // Dino
  ctx.fillStyle = '#333';
  ctx.fillRect(40, s.ground + s.dy - dh, 20, dh);
  ctx.fillRect(45, s.ground + s.dy - dh - 8, 15, 10);
  // Obstacles
  s.obstacles.forEach((o: any) => {
    ctx.fillStyle = o.type === 'cactus' ? '#228B22' : '#555';
    const oY = o.type === 'bird' ? s.ground - 40 : s.ground - o.h;
    ctx.fillRect(o.x, oY, o.w, o.h);
  });
  ctx.fillStyle = '#333'; ctx.font = '16px monospace'; ctx.fillText(`${s.score}`, w-60, 25);
}
function keyDino(s: any, key: string) {
  if ((key === 'ArrowUp' || key === ' ' || key === 'Enter') && !s.jumping && s.dy === 0) { s.jumping = true; s.dv = -8; SFX.playMove(); }
  if (key === 'ArrowDown') s.ducking = true;
}

// ==================== GAME 23: Racing ====================
export function RacingGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  return <CanvasGame game={game} onBack={onBack} init={initRacing} tick={tickRacing} onKey={keyRacing} w={300} h={500} />;
}
function initRacing() {
  return { px: 150, cars: [] as any[], score: 0, over: false, frame: 0, speed: 3 };
}
function tickRacing(s: any, ctx: CanvasRenderingContext2D, w: number, h: number, _dt: number, keys: Record<string,boolean>) {
  if (s.over) return;
  s.frame++;
  if (keys['ArrowLeft']) s.px = Math.max(30, s.px - 4);
  if (keys['ArrowRight']) s.px = Math.min(w-30, s.px + 4);

  if (s.frame % Math.max(15, 40 - Math.floor(s.score/5)) === 0) {
    s.cars.push({ x: 30 + Math.random()*(w-60), y: -30 });
  }
  s.cars.forEach((c: any) => { c.y += s.speed; });
  s.cars = s.cars.filter((c: any) => { if (c.y > h) { s.score++; SFX.playScore(); return false; } return true; });
  s.cars.forEach((c: any) => {
    if (Math.abs(c.x - s.px) < 25 && Math.abs(c.y - (h-40)) < 30) { s.over = true; SFX.playLose(); }
  });
  s.speed = Math.min(8, 3 + s.score * 0.05);

  ctx.fillStyle = '#333'; ctx.fillRect(0,0,w,h);
  ctx.fillStyle = '#555'; ctx.fillRect(20,0,2,h); ctx.fillRect(w-22,0,2,h);
  // Road marks
  for (let y = (s.frame*3)%40; y < h; y += 40) { ctx.fillStyle='#ff0'; ctx.fillRect(w/2-1, y, 2, 20); }
  // Player car
  ctx.fillStyle = '#00f'; ctx.fillRect(s.px-12, h-50, 24, 40);
  ctx.fillStyle = '#0af'; ctx.fillRect(s.px-8, h-45, 16, 30);
  // Enemy cars
  s.cars.forEach((c: any) => { ctx.fillStyle = '#f00'; ctx.fillRect(c.x-12, c.y-15, 24, 30); });
  ctx.fillStyle = '#fff'; ctx.font = '14px monospace'; ctx.fillText(`Очки: ${s.score}`, 30, 20);
}
function keyRacing(_s: any, _key: string) {}

// ==================== GAME 24: Catcher ====================
export function CatcherGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  return <CanvasGame game={game} onBack={onBack} init={initCatcher} tick={tickCatcher} onKey={keyCatcher} w={400} h={500} />;
}
function initCatcher() {
  return { px: 200, items: [] as any[], score: 0, over: false, frame: 0, lives: 3 };
}
function tickCatcher(s: any, ctx: CanvasRenderingContext2D, w: number, h: number, _dt: number, keys: Record<string,boolean>, setScore: any, setGameOver: any) {
  if (s.over) return;
  s.frame++;
  if (keys['ArrowLeft']) s.px = Math.max(30, s.px - 5);
  if (keys['ArrowRight']) s.px = Math.min(w-30, s.px + 5);
  if (s.frame % 30 === 0) {
    s.items.push({ x: 20+Math.random()*(w-40), y: -10, type: Math.random() < 0.7 ? 'coin' : 'bomb' });
  }
  s.items.forEach((i: any) => { i.y += 3; });
  s.items = s.items.filter((i: any) => {
    if (i.y > h - 30 && Math.abs(i.x - s.px) < 35) {
      if (i.type === 'coin') { s.score++; setScore(s.score); SFX.playScore(); }
      else { s.lives--; SFX.playLose(); if (s.lives <= 0) { s.over = true; setGameOver(true); } }
      return false;
    }
    return i.y < h;
  });

  ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0,0,w,h);
  // Basket
  ctx.fillStyle = '#8B4513'; ctx.fillRect(s.px-25, h-30, 50, 20);
  ctx.fillRect(s.px-30, h-25, 60, 5);
  // Items
  s.items.forEach((i: any) => {
    ctx.font = '20px serif';
    ctx.fillText(i.type === 'coin' ? '🪙' : '💣', i.x-10, i.y+7);
  });
  ctx.fillStyle = '#fff'; ctx.font = '14px monospace';
  ctx.fillText(`Очки: ${s.score}  ❤ ${s.lives}`, 10, 20);
}
function keyCatcher(_s: any, _key: string) {}

// ==================== GAME 25: Stroop Test ====================
export function StroopGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  const colors = [{name:'Красный',hex:'#f00'},{name:'Синий',hex:'#00f'},{name:'Зелёный',hex:'#0f0'},{name:'Жёлтый',hex:'#ff0'}];
  const [wordIdx, setWordIdx] = useState(0);
  const [colorIdx, setColorIdx] = useState(1);
  const [sc, setSc] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [cursor, setCursorState] = useState(0);

  const newRound = () => {
    setWordIdx(Math.floor(Math.random()*colors.length));
    setColorIdx(Math.floor(Math.random()*colors.length));
    setCursorState(0);
  };
  useEffect(() => { newRound(); }, []);

  const answer = (idx: number) => {
    if (idx === colorIdx) { setSc(s => s+1); SFX.playScore(); }
    else { setWrong(w => w+1); SFX.playLose(); }
    newRound();
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setCursorState(c => Math.max(0,c-1));
      if (e.key === 'ArrowRight') setCursorState(c => Math.min(3,c+1));
      if (e.key === 'Enter' || e.key === ' ') answer(cursor);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [cursor, colorIdx]);

  return (
    <GameWrapper game={game} onBack={onBack}>
      {({ setScore }) => {
        useEffect(() => { setScore(sc); }, [sc]);
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-white mb-2">Какого ЦВЕТА этот текст?</div>
            <div className="text-6xl font-bold mb-8" style={{color: colors[colorIdx].hex}}>
              {colors[wordIdx].name}
            </div>
            <div className="flex gap-3">
              {colors.map((c, i) => (
                <button key={i} onClick={() => answer(i)}
                  className={`px-6 py-3 rounded-lg text-white font-bold ${cursor===i?'ring-2 ring-white':''}`}
                  style={{background: c.hex+'44', borderColor: c.hex, borderWidth: 2}}>
                  {c.name}
                </button>
              ))}
            </div>
            <div className="text-white mt-4">✅ {sc}  ❌ {wrong}</div>
          </div>
        );
      }}
    </GameWrapper>
  );
}

// ==================== GAME 26: Simon Says ====================
export function SimonGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  const colors = ['#f00','#0f0','#00f','#ff0'];
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerIdx, setPlayerIdx] = useState(0);
  const [showing, setShowing] = useState(-1);
  const [sc, setSc] = useState(0);
  const [phase, setPhase] = useState<'show'|'play'|'over'>('show');
  const [cursor, setCursorState] = useState(0);

  const startRound = useCallback((seq: number[]) => {
    const newSeq = [...seq, Math.floor(Math.random()*4)];
    setSequence(newSeq);
    setPlayerIdx(0);
    setPhase('show');
    // Show sequence
    let i = 0;
    const iv = setInterval(() => {
      if (i < newSeq.length) { setShowing(newSeq[i]); i++; }
      else { setShowing(-1); setPhase('play'); clearInterval(iv); }
    }, 600);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => { startRound([]); }, []);

  const press = (idx: number) => {
    if (phase !== 'play') return;
    SFX.playClick();
    if (idx === sequence[playerIdx]) {
      if (playerIdx + 1 === sequence.length) {
        setSc(s => s + sequence.length);
        SFX.playScore();
        startRound(sequence);
      } else {
        setPlayerIdx(playerIdx + 1);
      }
    } else {
      SFX.playLose();
      setPhase('over');
    }
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setCursorState(c => Math.max(0,c-1));
      if (e.key === 'ArrowRight') setCursorState(c => Math.min(3,c+1));
      if (e.key === 'ArrowUp') setCursorState(c => c < 2 ? c : c-2);
      if (e.key === 'ArrowDown') setCursorState(c => c >= 2 ? c : c+2);
      if (e.key === 'Enter' || e.key === ' ') press(cursor);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [cursor, phase, playerIdx, sequence]);

  return (
    <GameWrapper game={game} onBack={onBack}>
      {({ setScore }) => {
        useEffect(() => { setScore(sc); }, [sc]);
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-white mb-4">{phase === 'show' ? 'Запоминайте...' : phase === 'play' ? 'Повторите!' : 'Ошибка!'}</div>
            <div className="grid grid-cols-2 gap-3">
              {colors.map((c, i) => (
                <button key={i} onClick={() => press(i)}
                  className={`w-24 h-24 rounded-xl transition-all ${cursor===i?'ring-4 ring-white':''}`}
                  style={{background: c, opacity: showing === i ? 1 : 0.4}} />
              ))}
            </div>
            <div className="text-white mt-4">Очки: {sc} | Раунд: {sequence.length}</div>
            {phase === 'over' && <button onClick={() => { setSc(0); setSequence([]); startRound([]); }} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded">Заново</button>}
          </div>
        );
      }}
    </GameWrapper>
  );
}

// ==================== GAME 27: Math Quiz ====================
export function MathQuizGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  const [problem, setProblem] = useState('');
  const [answers, setAnswers] = useState<number[]>([]);
  const [correct, setCorrect] = useState(0);
  const [sc, setSc] = useState(0);
  const [cursor, setCursorState] = useState(0);

  const newProblem = useCallback(() => {
    const a = Math.floor(Math.random()*20)+1, b = Math.floor(Math.random()*20)+1;
    const ops = ['+','-','×'];
    const op = ops[Math.floor(Math.random()*3)];
    let ans = 0;
    if (op === '+') ans = a+b;
    else if (op === '-') ans = a-b;
    else ans = a*b;
    setProblem(`${a} ${op} ${b} = ?`);
    const wrongs = [ans+Math.floor(Math.random()*5)+1, ans-Math.floor(Math.random()*5)-1, ans+Math.floor(Math.random()*10)-5];
    const all = [ans, ...wrongs.filter(w => w !== ans).slice(0,3)];
    while (all.length < 4) all.push(ans + all.length * 2);
    for (let i = all.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [all[i],all[j]]=[all[j],all[i]]; }
    setAnswers(all);
    setCorrect(all.indexOf(ans));
    setCursorState(0);
  }, []);

  useEffect(() => { newProblem(); }, [newProblem]);

  const answer = (idx: number) => {
    if (idx === correct) { setSc(s => s+1); SFX.playScore(); }
    else SFX.playLose();
    newProblem();
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setCursorState(c => Math.max(0,c-1));
      if (e.key === 'ArrowRight') setCursorState(c => Math.min(3,c+1));
      if (e.key === 'Enter' || e.key === ' ') answer(cursor);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [cursor, correct]);

  return (
    <GameWrapper game={game} onBack={onBack}>
      {({ setScore }) => {
        useEffect(() => { setScore(sc); }, [sc]);
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-4xl font-bold text-white mb-8">{problem}</div>
            <div className="grid grid-cols-2 gap-3">
              {answers.map((a, i) => (
                <button key={i} onClick={() => answer(i)}
                  className={`px-8 py-4 text-xl font-bold rounded-lg text-white bg-[#2a2a4e] hover:bg-[#3a3a5e] ${cursor===i?'ring-2 ring-yellow-400':''}`}>
                  {a}
                </button>
              ))}
            </div>
            <div className="text-white mt-4">✅ Правильных: {sc}</div>
          </div>
        );
      }}
    </GameWrapper>
  );
}

// ==================== GAME 28: Clicker ====================
export function ClickerGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  const [clicks, setClicks] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!started || finished) return;
    const iv = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { setFinished(true); clearInterval(iv); SFX.playWin(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [started, finished]);

  const click = () => {
    if (finished) return;
    if (!started) setStarted(true);
    setClicks(c => c+1);
    SFX.playClick();
  };

  const reset = () => { setClicks(0); setTimeLeft(10); setStarted(false); setFinished(false); };

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') click(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [started, finished]);

  return (
    <GameWrapper game={game} onBack={onBack}>
      {({ setScore }) => {
        useEffect(() => { setScore(clicks); }, [clicks]);
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-6xl font-bold text-yellow-400 mb-4">{clicks}</div>
            <div className="text-2xl text-white mb-6">⏱ {timeLeft}с</div>
            <button onClick={click} disabled={finished}
              className="w-32 h-32 rounded-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-2xl font-bold disabled:opacity-50 transition-transform active:scale-95">
              {!started ? 'СТАРТ' : finished ? 'СТОП' : 'ЖМИ!'}
            </button>
            {finished && <button onClick={reset} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Заново</button>}
          </div>
        );
      }}
    </GameWrapper>
  );
}

// ==================== GAME 29: Guess Number ====================
export function GuessNumGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  const [target, setTarget] = useState(0);
  const [guess, setGuess] = useState(50);
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState('');
  const [won, setWon] = useState(false);

  useEffect(() => { setTarget(Math.floor(Math.random()*100)+1); }, []);

  const doGuess = () => {
    if (won) return;
    setAttempts(a => a+1);
    if (guess === target) { setHint('🎉 Угадали!'); setWon(true); SFX.playWin(); }
    else if (guess < target) { setHint('⬆ Больше!'); SFX.playClick(); }
    else { setHint('⬇ Меньше!'); SFX.playClick(); }
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') setGuess(g => Math.min(100, g+1));
      if (e.key === 'ArrowDown') setGuess(g => Math.max(1, g-1));
      if (e.key === 'ArrowRight') setGuess(g => Math.min(100, g+10));
      if (e.key === 'ArrowLeft') setGuess(g => Math.max(1, g-10));
      if (e.key === 'Enter' || e.key === ' ') doGuess();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [guess, target, won]);

  const reset = () => { setTarget(Math.floor(Math.random()*100)+1); setGuess(50); setAttempts(0); setHint(''); setWon(false); };

  return (
    <GameWrapper game={game} onBack={onBack}>
      {({ setScore }) => {
        useEffect(() => { if (won) setScore(Math.max(0, 100 - attempts * 10)); }, [won, attempts]);
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-white text-lg mb-4">Угадайте число от 1 до 100</div>
            <div className="text-6xl font-bold text-yellow-400 mb-4">{guess}</div>
            <div className="flex gap-4 mb-4">
              <button onClick={() => setGuess(g => Math.max(1, g-10))} className="px-3 py-2 bg-[#2a2a4e] text-white rounded">-10</button>
              <button onClick={() => setGuess(g => Math.max(1, g-1))} className="px-3 py-2 bg-[#2a2a4e] text-white rounded">-1</button>
              <button onClick={doGuess} className="px-6 py-2 bg-green-600 text-white rounded font-bold">ОК</button>
              <button onClick={() => setGuess(g => Math.min(100, g+1))} className="px-3 py-2 bg-[#2a2a4e] text-white rounded">+1</button>
              <button onClick={() => setGuess(g => Math.min(100, g+10))} className="px-3 py-2 bg-[#2a2a4e] text-white rounded">+10</button>
            </div>
            <div className="text-2xl text-white mb-2">{hint}</div>
            <div className="text-white/60">Попытки: {attempts}</div>
            {won && <button onClick={reset} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Ещё раз</button>}
          </div>
        );
      }}
    </GameWrapper>
  );
}

// ==================== GAME 30: Battleship ====================
export function BattleshipGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  const SIZE = 10;
  const [board, setBoard] = useState<number[][]>([]);
  const [hits, setHits] = useState<boolean[][]>([]);
  const [cursor, setCursor] = useState({x:0,y:0});
  const [sc, setSc] = useState(0);
  const [shots, setShots] = useState(0);

  const init = useCallback(() => {
    const b: number[][] = Array.from({length:SIZE}, () => Array(SIZE).fill(0));
    // Place ships: 4,3,3,2,2,2,1,1,1,1
    const ships = [4,3,3,2,2,2,1,1,1,1];
    ships.forEach(len => {
      let placed = false;
      while (!placed) {
        const hor = Math.random() < 0.5;
        const r = Math.floor(Math.random()*SIZE), c = Math.floor(Math.random()*SIZE);
        let ok = true;
        for (let i = 0; i < len; i++) {
          const nr = hor ? r : r+i, nc = hor ? c+i : c;
          if (nr >= SIZE || nc >= SIZE || b[nr][nc]) { ok = false; break; }
        }
        if (ok) { for (let i = 0; i < len; i++) { b[hor?r:r+i][hor?c+i:c] = 1; } placed = true; }
      }
    });
    setBoard(b);
    setHits(Array.from({length:SIZE}, () => Array(SIZE).fill(false)));
    setCursor({x:0,y:0}); setSc(0); setShots(0);
  }, []);

  useEffect(() => { init(); }, [init]);

  const shoot = (r: number, c: number) => {
    if (hits[r][c]) return;
    const h = hits.map(row => [...row]);
    h[r][c] = true;
    setHits(h);
    setShots(s => s+1);
    if (board[r][c]) { setSc(s => s+1); SFX.playExplosion(); }
    else SFX.playClick();
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') setCursor(c => ({...c, y: Math.max(0, c.y-1)}));
      if (e.key === 'ArrowDown') setCursor(c => ({...c, y: Math.min(SIZE-1, c.y+1)}));
      if (e.key === 'ArrowLeft') setCursor(c => ({...c, x: Math.max(0, c.x-1)}));
      if (e.key === 'ArrowRight') setCursor(c => ({...c, x: Math.min(SIZE-1, c.x+1)}));
      if (e.key === 'Enter' || e.key === ' ') shoot(cursor.y, cursor.x);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [cursor, hits, board]);

  return (
    <GameWrapper game={game} onBack={onBack}>
      {({ setScore }) => {
        useEffect(() => { setScore(sc); }, [sc]);
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-white mb-2 font-mono">Попадания: {sc} | Выстрелы: {shots}</div>
            <div className="bg-[#001133] p-1 rounded">
              {Array.from({length:SIZE}).map((_, r) => (
                <div key={r} className="flex">
                  {Array.from({length:SIZE}).map((_, c) => (
                    <div key={c} onClick={() => shoot(r,c)}
                      className={`w-8 h-8 border border-blue-900 flex items-center justify-center text-sm cursor-pointer
                        ${cursor.x===c&&cursor.y===r?'ring-2 ring-yellow-400':''}
                        ${hits[r]?.[c] ? (board[r]?.[c] ? 'bg-red-700' : 'bg-blue-900') : 'bg-blue-800 hover:bg-blue-700'}`}>
                      {hits[r]?.[c] ? (board[r]?.[c] ? '💥' : '•') : ''}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <button onClick={init} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded text-sm">Новая игра</button>
          </div>
        );
      }}
    </GameWrapper>
  );
}

// ==================== GAME 31-50: More games (simplified) ====================

// Game 31: Rampart
export function RampartGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  return <CanvasGame game={game} onBack={onBack} init={initRampart} tick={tickRampart} onKey={keyRampart} w={400} h={400} />;
}
function initRampart() {
  const walls = Array.from({length:20}, () => Array(20).fill(false));
  const cannons = [{x:10,y:15}];
  const ships: any[] = [{x:3,y:1,hp:3},{x:17,y:2,hp:3}];
  return { walls, cannons, ships, cursor:{x:10,y:10}, phase:'build' as string, score:0, over:false, buildTimer:0, bullets:[] as any[] };
}
function tickRampart(s: any, ctx: CanvasRenderingContext2D, w: number, h: number) {
  const CS = 20;
  ctx.fillStyle = '#0a3a0a'; ctx.fillRect(0,0,w,h);
  for (let r = 0; r < 20; r++) for (let c = 0; c < 20; c++) {
    if (s.walls[r][c]) { ctx.fillStyle = '#888'; ctx.fillRect(c*CS, r*CS, CS-1, CS-1); }
  }
  s.cannons.forEach((c: any) => { ctx.fillStyle = '#ff0'; ctx.fillRect(c.x*CS+2, c.y*CS+2, CS-4, CS-4); });
  s.ships.forEach((sh: any) => { ctx.fillStyle = '#f00'; ctx.fillRect(sh.x*CS, sh.y*CS, CS*2, CS); ctx.fillStyle = '#fff'; ctx.font = '10px mono'; ctx.fillText(`${sh.hp}`, sh.x*CS+5, sh.y*CS+12); });
  s.bullets.forEach((b: any) => { b.y -= 3; ctx.fillStyle = '#ff0'; ctx.fillRect(b.x-2, b.y-2, 4, 4); });
  s.bullets = s.bullets.filter((b: any) => {
    const hit = s.ships.find((sh: any) => Math.abs(b.x - sh.x*CS - CS) < CS && Math.abs(b.y - sh.y*CS - CS/2) < CS);
    if (hit) { hit.hp--; if (hit.hp <= 0) { s.score += 100; SFX.playExplosion(); } return false; }
    return b.y > 0;
  });
  s.ships = s.ships.filter((sh: any) => sh.hp > 0);
  ctx.strokeStyle = '#ff0'; ctx.strokeRect(s.cursor.x*CS, s.cursor.y*CS, CS, CS);
  ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.fillText(`Очки: ${s.score} | ${s.phase === 'build' ? 'Стройте стены (OK)' : 'Стреляйте (OK)'}`, 5, h-5);
}
function keyRampart(s: any, key: string) {
  if (key === 'ArrowUp') s.cursor.y = Math.max(0, s.cursor.y-1);
  if (key === 'ArrowDown') s.cursor.y = Math.min(19, s.cursor.y+1);
  if (key === 'ArrowLeft') s.cursor.x = Math.max(0, s.cursor.x-1);
  if (key === 'ArrowRight') s.cursor.x = Math.min(19, s.cursor.x+1);
  if (key === 'Enter' || key === ' ') {
    if (s.phase === 'build') { s.walls[s.cursor.y][s.cursor.x] = true; SFX.playClick(); }
    else {
      const cannon = s.cannons[0];
      s.bullets.push({ x: cannon.x*20+10, y: cannon.y*20 });
      SFX.playShoot();
    }
  }
  if (key === 'Tab' || key === 't') { s.phase = s.phase === 'build' ? 'shoot' : 'build'; }
}

// Game 32: Tower Defense
export function TowerDefenseGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  return <CanvasGame game={game} onBack={onBack} init={initTD} tick={tickTD} onKey={keyTD} w={400} h={400} />;
}
function initTD() {
  return { towers: [] as any[], enemies: [] as any[], cursor:{x:5,y:5}, score:0, over:false, frame:0, lives:10, gold:100 };
}
function tickTD(s: any, ctx: CanvasRenderingContext2D, w: number, h: number) {
  const CS = 20;
  s.frame++;
  if (s.frame % 60 === 0 && !s.over) {
    s.enemies.push({ x: 0, y: Math.floor(Math.random()*20)*CS + CS/2, hp: 3+Math.floor(s.frame/300), speed: 1 });
  }
  s.enemies.forEach((e: any) => { e.x += e.speed; });
  s.enemies = s.enemies.filter((e: any) => {
    if (e.x > w) { s.lives--; if (s.lives <= 0) { s.over = true; SFX.playLose(); } return false; }
    return e.hp > 0;
  });
  // Tower shooting
  s.towers.forEach((t: any) => {
    if (s.frame % 20 === 0) {
      const target = s.enemies.find((e: any) => Math.abs(e.x - t.x*CS) < 80 && Math.abs(e.y - t.y*CS) < 80);
      if (target) { target.hp--; if (target.hp <= 0) { s.score += 10; s.gold += 5; SFX.playExplosion(); } }
    }
  });

  ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0,0,w,h);
  for (let i = 0; i < 20; i++) { ctx.strokeStyle = '#111'; ctx.beginPath(); ctx.moveTo(i*CS,0); ctx.lineTo(i*CS,h); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0,i*CS); ctx.lineTo(w,i*CS); ctx.stroke(); }
  s.towers.forEach((t: any) => { ctx.fillStyle = '#0af'; ctx.fillRect(t.x*CS+2, t.y*CS+2, CS-4, CS-4); });
  s.enemies.forEach((e: any) => {
    ctx.fillStyle = '#f00'; ctx.fillRect(e.x-8, e.y-8, 16, 16);
    ctx.fillStyle = '#0f0'; ctx.fillRect(e.x-8, e.y-12, 16*(e.hp/5), 3);
  });
  ctx.strokeStyle = '#ff0'; ctx.strokeRect(s.cursor.x*CS, s.cursor.y*CS, CS, CS);
  ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.fillText(`💰${s.gold} ❤${s.lives} 🏆${s.score}`, 5, h-5);
}
function keyTD(s: any, key: string) {
  if (key === 'ArrowUp') s.cursor.y = Math.max(0, s.cursor.y-1);
  if (key === 'ArrowDown') s.cursor.y = Math.min(19, s.cursor.y+1);
  if (key === 'ArrowLeft') s.cursor.x = Math.max(0, s.cursor.x-1);
  if (key === 'ArrowRight') s.cursor.x = Math.min(19, s.cursor.x+1);
  if ((key === 'Enter' || key === ' ') && s.gold >= 20) {
    if (!s.towers.find((t: any) => t.x === s.cursor.x && t.y === s.cursor.y)) {
      s.towers.push({ x: s.cursor.x, y: s.cursor.y });
      s.gold -= 20;
      SFX.playClick();
    }
  }
}

// Game 33: Worms/Artillery
export function WormsGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  return <CanvasGame game={game} onBack={onBack} init={initWorms} tick={tickWorms} onKey={keyWorms} w={500} h={350} />;
}
function initWorms() {
  return { p1:{x:50,y:250}, p2:{x:450,y:250}, angle:45, power:50, turn:1, projectile:null as any, score:0, over:false, terrain: Array.from({length:500}, (_,i) => 250 + Math.sin(i/30)*30) };
}
function tickWorms(s: any, ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#87CEEB'; ctx.fillRect(0,0,w,h);
  // Terrain
  ctx.fillStyle = '#654321'; ctx.beginPath(); ctx.moveTo(0, h);
  s.terrain.forEach((ty: number, i: number) => ctx.lineTo(i, ty));
  ctx.lineTo(w, h); ctx.fill();
  // Players
  ctx.fillStyle = '#0f0'; ctx.beginPath(); ctx.arc(s.p1.x, s.p1.y-10, 8, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#f00'; ctx.beginPath(); ctx.arc(s.p2.x, s.p2.y-10, 8, 0, Math.PI*2); ctx.fill();
  // Angle indicator
  const shooter = s.turn === 1 ? s.p1 : s.p2;
  const rad = s.angle * Math.PI / 180;
  const dir = s.turn === 1 ? 1 : -1;
  ctx.strokeStyle = '#ff0'; ctx.beginPath();
  ctx.moveTo(shooter.x, shooter.y - 10);
  ctx.lineTo(shooter.x + Math.cos(rad)*dir*30, shooter.y - 10 - Math.sin(rad)*30);
  ctx.stroke();
  // Projectile
  if (s.projectile) {
    s.projectile.x += s.projectile.vx;
    s.projectile.y += s.projectile.vy;
    s.projectile.vy += 0.3;
    ctx.fillStyle = '#ff0'; ctx.beginPath(); ctx.arc(s.projectile.x, s.projectile.y, 3, 0, Math.PI*2); ctx.fill();
    const target = s.turn === 1 ? s.p2 : s.p1;
    if (Math.abs(s.projectile.x - target.x) < 15 && Math.abs(s.projectile.y - target.y) < 15) {
      s.score += 100; SFX.playExplosion(); s.projectile = null; s.turn = s.turn === 1 ? 2 : 1;
    }
    if (s.projectile && (s.projectile.y > h || s.projectile.x < 0 || s.projectile.x > w)) {
      s.projectile = null; s.turn = s.turn === 1 ? 2 : 1;
    }
  }
  ctx.fillStyle = '#fff'; ctx.font = '12px monospace';
  ctx.fillText(`Ход: P${s.turn} | Угол: ${s.angle}° | Сила: ${s.power} | Очки: ${s.score}`, 10, 20);
}
function keyWorms(s: any, key: string) {
  if (s.projectile) return;
  if (key === 'ArrowLeft') s.angle = Math.min(90, s.angle + 2);
  if (key === 'ArrowRight') s.angle = Math.max(0, s.angle - 2);
  if (key === 'ArrowUp') s.power = Math.min(100, s.power + 2);
  if (key === 'ArrowDown') s.power = Math.max(10, s.power - 2);
  if (key === 'Enter' || key === ' ') {
    const shooter = s.turn === 1 ? s.p1 : s.p2;
    const rad = s.angle * Math.PI / 180;
    const dir = s.turn === 1 ? 1 : -1;
    s.projectile = {
      x: shooter.x, y: shooter.y - 10,
      vx: Math.cos(rad) * dir * s.power / 15,
      vy: -Math.sin(rad) * s.power / 15
    };
    SFX.playShoot();
  }
}

// Game 34: Chess
export function ChessGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  const pieces: Record<string,string> = { K:'♚',Q:'♛',R:'♜',B:'♝',N:'♞',P:'♟',k:'♔',q:'♕',r:'♖',b:'♗',n:'♘',p:'♙' };
  const initBoard = () => {
    const b: string[][] = [
      ['r','n','b','q','k','b','n','r'],
      ['p','p','p','p','p','p','p','p'],
      ['','','','','','','',''],['','','','','','','',''],
      ['','','','','','','',''],['','','','','','','',''],
      ['P','P','P','P','P','P','P','P'],
      ['R','N','B','Q','K','B','N','R']
    ];
    return b;
  };
  const [board, setBoard] = useState(initBoard);
  const [cursor, setCursor] = useState({x:0,y:6});
  const [selected, setSelected] = useState<{x:number,y:number}|null>(null);
  const [turn, setTurn] = useState<'white'|'black'>('white');

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') setCursor(c => ({...c, y: Math.max(0, c.y-1)}));
      if (e.key === 'ArrowDown') setCursor(c => ({...c, y: Math.min(7, c.y+1)}));
      if (e.key === 'ArrowLeft') setCursor(c => ({...c, x: Math.max(0, c.x-1)}));
      if (e.key === 'ArrowRight') setCursor(c => ({...c, x: Math.min(7, c.x+1)}));
      if (e.key === 'Enter' || e.key === ' ') {
        if (!selected) {
          const p = board[cursor.y][cursor.x];
          if (p && ((turn === 'white' && p === p.toUpperCase()) || (turn === 'black' && p === p.toLowerCase()))) {
            setSelected({...cursor}); SFX.playSelect();
          }
        } else {
          const b = board.map(r => [...r]);
          b[cursor.y][cursor.x] = b[selected.y][selected.x];
          b[selected.y][selected.x] = '';
          setBoard(b);
          setSelected(null);
          setTurn(t => t === 'white' ? 'black' : 'white');
          SFX.playMove();
        }
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [cursor, selected, board, turn]);

  return (
    <GameWrapper game={game} onBack={onBack}>
      {() => (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-white mb-2">Ход: {turn === 'white' ? '⬜ Белые' : '⬛ Чёрные'}</div>
          <div className="bg-[#1a1a2e] p-1 rounded">
            {board.map((row, r) => (
              <div key={r} className="flex">
                {row.map((cell, c) => (
                  <div key={c} className={`w-11 h-11 flex items-center justify-center text-2xl cursor-pointer
                    ${(r+c)%2===0?'bg-[#b58863]':'bg-[#f0d9b5]'}
                    ${cursor.x===c&&cursor.y===r?'ring-2 ring-yellow-400':''}
                    ${selected?.x===c&&selected?.y===r?'ring-2 ring-green-400':''}`}
                    onClick={() => {
                      if (!selected && cell) { setSelected({x:c,y:r}); }
                      else if (selected) {
                        const b = board.map(rr => [...rr]);
                        b[r][c] = b[selected.y][selected.x]; b[selected.y][selected.x] = '';
                        setBoard(b); setSelected(null); setTurn(t => t==='white'?'black':'white'); SFX.playMove();
                      }
                    }}>
                    {cell ? pieces[cell] : ''}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </GameWrapper>
  );
}

// Game 35: Checkers
export function CheckersGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  const initBoard = () => {
    const b: string[][] = Array.from({length:8}, () => Array(8).fill(''));
    for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) { if ((r+c)%2===1) b[r][c] = 'b'; }
    for (let r = 5; r < 8; r++) for (let c = 0; c < 8; c++) { if ((r+c)%2===1) b[r][c] = 'w'; }
    return b;
  };
  const [board, setBoard] = useState(initBoard);
  const [cursor, setCursor] = useState({x:0,y:5});
  const [selected, setSelected] = useState<{x:number,y:number}|null>(null);
  const [turn, setTurn] = useState<'w'|'b'>('w');

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') setCursor(c => ({...c, y: Math.max(0, c.y-1)}));
      if (e.key === 'ArrowDown') setCursor(c => ({...c, y: Math.min(7, c.y+1)}));
      if (e.key === 'ArrowLeft') setCursor(c => ({...c, x: Math.max(0, c.x-1)}));
      if (e.key === 'ArrowRight') setCursor(c => ({...c, x: Math.min(7, c.x+1)}));
      if (e.key === 'Enter' || e.key === ' ') {
        if (!selected) {
          if (board[cursor.y][cursor.x] === turn) { setSelected({...cursor}); SFX.playSelect(); }
        } else {
          const b = board.map(r => [...r]);
          b[cursor.y][cursor.x] = b[selected.y][selected.x];
          b[selected.y][selected.x] = '';
          // Check capture
          if (Math.abs(cursor.x-selected.x) === 2) {
            b[(cursor.y+selected.y)/2][(cursor.x+selected.x)/2] = '';
            SFX.playExplosion();
          }
          setBoard(b); setSelected(null); setTurn(t => t==='w'?'b':'w'); SFX.playMove();
        }
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [cursor, selected, board, turn]);

  return (
    <GameWrapper game={game} onBack={onBack}>
      {() => (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-white mb-2">Ход: {turn === 'w' ? '⬜ Белые' : '⬛ Чёрные'}</div>
          <div className="bg-[#1a1a2e] p-1 rounded">
            {board.map((row, r) => (
              <div key={r} className="flex">
                {row.map((cell, c) => (
                  <div key={c} className={`w-11 h-11 flex items-center justify-center cursor-pointer
                    ${(r+c)%2===0?'bg-[#dcc8a0]':'bg-[#6b8e23]'}
                    ${cursor.x===c&&cursor.y===r?'ring-2 ring-yellow-400':''}
                    ${selected?.x===c&&selected?.y===r?'ring-2 ring-green-400':''}`}>
                    {cell === 'w' && <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-400" />}
                    {cell === 'b' && <div className="w-8 h-8 rounded-full bg-gray-800 border-2 border-gray-600" />}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </GameWrapper>
  );
}

// Game 36: Reversi
export function ReversiGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  const initBoard = () => {
    const b: number[][] = Array.from({length:8}, () => Array(8).fill(0));
    b[3][3]=1; b[3][4]=2; b[4][3]=2; b[4][4]=1;
    return b;
  };
  const [board, setBoard] = useState(initBoard);
  const [cursor, setCursor] = useState({x:3,y:3});
  const [turn, setTurn] = useState(1);

  const tryPlace = (r: number, c: number) => {
    if (board[r][c]) return;
    const b = board.map(row => [...row]);
    const opp = turn === 1 ? 2 : 1;
    let flipped = false;
    for (const [dr,dc] of [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]) {
      let nr = r+dr, nc = c+dc;
      const toFlip: [number,number][] = [];
      while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && b[nr][nc] === opp) {
        toFlip.push([nr,nc]); nr += dr; nc += dc;
      }
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && b[nr][nc] === turn && toFlip.length > 0) {
        toFlip.forEach(([fr,fc]) => { b[fr][fc] = turn; });
        flipped = true;
      }
    }
    if (flipped) { b[r][c] = turn; setBoard(b); setTurn(opp); SFX.playMove(); }
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') setCursor(c => ({...c, y: Math.max(0, c.y-1)}));
      if (e.key === 'ArrowDown') setCursor(c => ({...c, y: Math.min(7, c.y+1)}));
      if (e.key === 'ArrowLeft') setCursor(c => ({...c, x: Math.max(0, c.x-1)}));
      if (e.key === 'ArrowRight') setCursor(c => ({...c, x: Math.min(7, c.x+1)}));
      if (e.key === 'Enter' || e.key === ' ') tryPlace(cursor.y, cursor.x);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [cursor, board, turn]);

  const count1 = board.flat().filter(v => v===1).length;
  const count2 = board.flat().filter(v => v===2).length;

  return (
    <GameWrapper game={game} onBack={onBack}>
      {({ setScore }) => {
        useEffect(() => { setScore(turn === 1 ? count1 : count2); }, [count1, count2, turn]);
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-white mb-2">Ход: {turn===1?'⚫':'⚪'} | ⚫{count1} ⚪{count2}</div>
            <div className="bg-[#006400] p-1 rounded">
              {board.map((row, r) => (
                <div key={r} className="flex">
                  {row.map((cell, c) => (
                    <div key={c} onClick={() => tryPlace(r,c)}
                      className={`w-10 h-10 border border-green-800 flex items-center justify-center cursor-pointer
                        ${cursor.x===c&&cursor.y===r?'ring-2 ring-yellow-400':''}`}>
                      {cell === 1 && <div className="w-8 h-8 rounded-full bg-black" />}
                      {cell === 2 && <div className="w-8 h-8 rounded-full bg-white" />}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        );
      }}
    </GameWrapper>
  );
}

// Game 37: Gomoku
export function GomokuGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  const SIZE = 15;
  const [board, setBoard] = useState<number[][]>(Array.from({length:SIZE}, () => Array(SIZE).fill(0)));
  const [cursor, setCursor] = useState({x:7,y:7});
  const [turn, setTurn] = useState(1);
  const [winner, setWinner] = useState(0);

  const checkWin = (b: number[][], r: number, c: number, p: number) => {
    const dirs = [[0,1],[1,0],[1,1],[1,-1]];
    for (const [dr,dc] of dirs) {
      let cnt = 1;
      for (let i = 1; i < 5; i++) { const nr=r+dr*i, nc=c+dc*i; if (nr>=0&&nr<SIZE&&nc>=0&&nc<SIZE&&b[nr][nc]===p) cnt++; else break; }
      for (let i = 1; i < 5; i++) { const nr=r-dr*i, nc=c-dc*i; if (nr>=0&&nr<SIZE&&nc>=0&&nc<SIZE&&b[nr][nc]===p) cnt++; else break; }
      if (cnt >= 5) return true;
    }
    return false;
  };

  const place = (r: number, c: number) => {
    if (board[r][c] || winner) return;
    const b = board.map(row => [...row]);
    b[r][c] = turn;
    setBoard(b);
    if (checkWin(b, r, c, turn)) { setWinner(turn); SFX.playWin(); }
    else { setTurn(t => t===1?2:1); SFX.playClick(); }
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') setCursor(c => ({...c, y: Math.max(0, c.y-1)}));
      if (e.key === 'ArrowDown') setCursor(c => ({...c, y: Math.min(SIZE-1, c.y+1)}));
      if (e.key === 'ArrowLeft') setCursor(c => ({...c, x: Math.max(0, c.x-1)}));
      if (e.key === 'ArrowRight') setCursor(c => ({...c, x: Math.min(SIZE-1, c.x+1)}));
      if (e.key === 'Enter' || e.key === ' ') place(cursor.y, cursor.x);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [cursor, board, turn, winner]);

  return (
    <GameWrapper game={game} onBack={onBack}>
      {() => (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-white mb-2">{winner ? `Победил: ${winner===1?'✕':'○'}` : `Ход: ${turn===1?'✕':'○'}`}</div>
          <div className="bg-[#DEB887] p-0.5 rounded" style={{maxHeight:'80vh',overflow:'auto'}}>
            {board.map((row, r) => (
              <div key={r} className="flex">
                {row.map((cell, c) => (
                  <div key={c} onClick={() => place(r,c)}
                    className={`w-6 h-6 border border-[#8B7355] flex items-center justify-center text-xs font-bold cursor-pointer
                      ${cursor.x===c&&cursor.y===r?'ring-1 ring-red-500':''}`}>
                    {cell === 1 ? '✕' : cell === 2 ? '○' : ''}
                  </div>
                ))}
              </div>
            ))}
          </div>
          {winner > 0 && <button onClick={() => { setBoard(Array.from({length:SIZE},()=>Array(SIZE).fill(0))); setTurn(1); setWinner(0); }} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded">Новая игра</button>}
        </div>
      )}
    </GameWrapper>
  );
}

// Game 38: Backgammon (simplified)
export function BackgammonGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  return <SimpleTextGame game={game} onBack={onBack} content="Нарды — бросьте кости и ходите!" />;
}

// Game 39: Chinese Checkers
export function ChineseCheckersGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  return <SimpleTextGame game={game} onBack={onBack} content="Китайские шашки — в разработке!" />;
}

// Game 40: Mancala
export function MancalaGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  const [pits, setPits] = useState([4,4,4,4,4,4,0,4,4,4,4,4,4,0]);
  const [turn, setTurn] = useState(0);

  const sow = (idx: number) => {
    if (turn === 0 && (idx < 0 || idx > 5)) return;
    if (turn === 1 && (idx < 7 || idx > 12)) return;
    const p = [...pits];
    let seeds = p[idx]; p[idx] = 0;
    let pos = idx;
    while (seeds > 0) {
      pos = (pos + 1) % 14;
      if (turn === 0 && pos === 13) continue;
      if (turn === 1 && pos === 6) continue;
      p[pos]++; seeds--;
    }
    setPits(p);
    const store = turn === 0 ? 6 : 13;
    if (pos !== store) setTurn(t => 1 - t);
    SFX.playMove();
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '6') {
        const idx = turn === 0 ? parseInt(e.key)-1 : parseInt(e.key)+6;
        sow(idx);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [pits, turn]);

  return (
    <GameWrapper game={game} onBack={onBack}>
      {({ setScore }) => {
        useEffect(() => { setScore(pits[6]); }, [pits]);
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-white mb-3">Ход: Игрок {turn+1} (нажмите 1-6)</div>
            <div className="flex items-center gap-2 bg-[#8B4513] p-4 rounded-xl">
              <div className="w-14 h-28 bg-[#654321] rounded-full flex items-center justify-center text-2xl text-white font-bold">{pits[13]}</div>
              <div className="flex flex-col gap-1">
                <div className="flex gap-1">{pits.slice(7,13).reverse().map((v,i) => (
                  <button key={i} onClick={() => sow(12-i)} className="w-10 h-10 bg-[#654321] rounded-full text-white text-sm flex items-center justify-center hover:bg-[#765432]">{v}</button>
                ))}</div>
                <div className="flex gap-1">{pits.slice(0,6).map((v,i) => (
                  <button key={i} onClick={() => sow(i)} className="w-10 h-10 bg-[#654321] rounded-full text-white text-sm flex items-center justify-center hover:bg-[#765432]">{v}</button>
                ))}</div>
              </div>
              <div className="w-14 h-28 bg-[#654321] rounded-full flex items-center justify-center text-2xl text-white font-bold">{pits[6]}</div>
            </div>
          </div>
        );
      }}
    </GameWrapper>
  );
}

// Game 41: Pinball
export function PinballGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  return <CanvasGame game={game} onBack={onBack} init={initPinball} tick={tickPinball} onKey={keyPinball} w={300} h={500} />;
}
function initPinball() {
  const targets = Array.from({length:8}, () => ({x: 30+Math.random()*240, y: 50+Math.random()*200, alive: true, pts: 50+Math.floor(Math.random()*50)}));
  return { bx: 150, by: 450, bvx: 2, bvy: -4, flipL: 0, flipR: 0, targets, score: 0, over: false };
}
function tickPinball(s: any, ctx: CanvasRenderingContext2D, w: number, h: number, _dt: number, keys: Record<string,boolean>, setScore: any, setGameOver: any) {
  if (s.over) return;
  s.bx += s.bvx; s.by += s.bvy; s.bvy += 0.15;
  if (s.bx < 10 || s.bx > w-10) s.bvx *= -1;
  if (s.by < 10) s.bvy *= -1;
  // Flippers
  s.flipL = keys['ArrowLeft'] ? 1 : 0;
  s.flipR = keys['ArrowRight'] ? 1 : 0;
  if (s.by > h - 40 && s.by < h - 30) {
    if (s.bx > 50 && s.bx < 130 && s.flipL) { s.bvy = -8 - Math.random()*2; s.bvx = (s.bx - 90)/10; SFX.playBounce(); }
    if (s.bx > 170 && s.bx < 250 && s.flipR) { s.bvy = -8 - Math.random()*2; s.bvx = (s.bx - 210)/10; SFX.playBounce(); }
  }
  if (s.by > h) { s.over = true; SFX.playLose(); setGameOver(true); }
  // Targets
  s.targets.forEach((t: any) => {
    if (t.alive && Math.abs(s.bx-t.x)<12 && Math.abs(s.by-t.y)<12) {
      t.alive = false; s.score += t.pts; setScore(s.score); s.bvy *= -1; SFX.playScore();
    }
  });

  ctx.fillStyle = '#1a0a2e'; ctx.fillRect(0,0,w,h);
  ctx.fillStyle = '#333'; ctx.fillRect(0,0,10,h); ctx.fillRect(w-10,0,10,h); ctx.fillRect(0,0,w,10);
  // Targets
  s.targets.forEach((t: any) => {
    if (t.alive) { ctx.fillStyle = '#f0f'; ctx.beginPath(); ctx.arc(t.x, t.y, 10, 0, Math.PI*2); ctx.fill(); }
  });
  // Flippers
  ctx.fillStyle = s.flipL ? '#fff' : '#888';
  ctx.fillRect(50, h-35, 80, 8);
  ctx.fillStyle = s.flipR ? '#fff' : '#888';
  ctx.fillRect(170, h-35, 80, 8);
  // Ball
  ctx.fillStyle = '#ccc'; ctx.beginPath(); ctx.arc(s.bx, s.by, 6, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = '14px monospace'; ctx.fillText(`${s.score}`, w/2-20, 25);
}
function keyPinball(_s: any, _key: string) {}

// Game 42: Mini Golf
export function MiniGolfGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  return <CanvasGame game={game} onBack={onBack} init={initGolf} tick={tickGolf} onKey={keyGolf} w={400} h={400} />;
}
function initGolf() {
  return { bx:50, by:350, bvx:0, bvy:0, hx:350, hy:50, hr:15, angle:45, power:30, strokes:0, sunk:false, aiming:true };
}
function tickGolf(s: any, ctx: CanvasRenderingContext2D, w: number, h: number) {
  if (!s.aiming) {
    s.bx += s.bvx; s.by += s.bvy;
    s.bvx *= 0.98; s.bvy *= 0.98;
    if (s.bx < 10 || s.bx > w-10) s.bvx *= -1;
    if (s.by < 10 || s.by > h-10) s.bvy *= -1;
    if (Math.abs(s.bvx) < 0.1 && Math.abs(s.bvy) < 0.1) { s.bvx = 0; s.bvy = 0; s.aiming = true; }
    if (Math.abs(s.bx-s.hx)<s.hr && Math.abs(s.by-s.hy)<s.hr) { s.sunk = true; SFX.playWin(); }
  }

  ctx.fillStyle = '#228B22'; ctx.fillRect(0,0,w,h);
  // Hole
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(s.hx, s.hy, s.hr, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#f00'; ctx.fillRect(s.hx-1, s.hy-25, 2, 25);
  ctx.fillStyle = '#f00'; ctx.fillRect(s.hx, s.hy-25, 10, 6);
  // Ball
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.bx, s.by, 6, 0, Math.PI*2); ctx.fill();
  // Aiming line
  if (s.aiming && !s.sunk) {
    const rad = s.angle * Math.PI / 180;
    ctx.strokeStyle = '#ff0'; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(s.bx, s.by);
    ctx.lineTo(s.bx + Math.cos(rad)*s.power*2, s.by - Math.sin(rad)*s.power*2);
    ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.fillStyle = '#fff'; ctx.font = '14px monospace';
  ctx.fillText(`Удары: ${s.strokes} | Угол: ${s.angle}° | Сила: ${s.power}`, 10, h-10);
  if (s.sunk) { ctx.font = '32px serif'; ctx.fillText('🎉 Лунка!', w/2-50, h/2); }
}
function keyGolf(s: any, key: string) {
  if (s.sunk) return;
  if (!s.aiming) return;
  if (key === 'ArrowLeft') s.angle = (s.angle + 3) % 360;
  if (key === 'ArrowRight') s.angle = (s.angle - 3 + 360) % 360;
  if (key === 'ArrowUp') s.power = Math.min(50, s.power + 2);
  if (key === 'ArrowDown') s.power = Math.max(5, s.power - 2);
  if (key === 'Enter' || key === ' ') {
    const rad = s.angle * Math.PI / 180;
    s.bvx = Math.cos(rad) * s.power / 5;
    s.bvy = -Math.sin(rad) * s.power / 5;
    s.aiming = false; s.strokes++;
    SFX.playShoot();
  }
}

// Game 43-50: More simple games using shared patterns

export function BasketballGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  return <CanvasGame game={game} onBack={onBack} init={initBball} tick={tickBball} onKey={keyBball} w={400} h={400} />;
}
function initBball() { return { angle: 45, power: 50, bx: 80, by: 350, bvx: 0, bvy: 0, shooting: false, score: 0, hx: 320, hy: 100, over: false }; }
function tickBball(s: any, ctx: CanvasRenderingContext2D, w: number, h: number) {
  if (s.shooting) {
    s.bx += s.bvx; s.by += s.bvy; s.bvy += 0.3;
    if (Math.abs(s.bx-s.hx)<20 && Math.abs(s.by-s.hy)<20) {
      s.score++; SFX.playScore(); s.shooting = false; s.bx = 80; s.by = 350;
      s.hx = 200 + Math.random()*180; s.hy = 50 + Math.random()*150;
    }
    if (s.by > h || s.bx > w || s.bx < 0) { s.shooting = false; s.bx = 80; s.by = 350; SFX.playLose(); }
  }
  ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0,0,w,h);
  // Hoop
  ctx.strokeStyle = '#f80'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(s.hx, s.hy, 15, 0, Math.PI*2); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.fillRect(s.hx+10, s.hy-30, 3, 30);
  ctx.lineWidth = 1;
  // Ball
  ctx.fillStyle = '#f80'; ctx.beginPath(); ctx.arc(s.bx, s.by, 10, 0, Math.PI*2); ctx.fill();
  if (!s.shooting) {
    const rad = s.angle*Math.PI/180;
    ctx.strokeStyle = '#ff0'; ctx.beginPath(); ctx.moveTo(s.bx, s.by);
    ctx.lineTo(s.bx+Math.cos(rad)*s.power, s.by-Math.sin(rad)*s.power); ctx.stroke();
  }
  ctx.fillStyle = '#fff'; ctx.font = '14px mono'; ctx.fillText(`🏀 ${s.score} | Угол:${s.angle}° Сила:${s.power}`, 10, 20);
}
function keyBball(s: any, key: string) {
  if (s.shooting) return;
  if (key === 'ArrowUp') s.angle = Math.min(85, s.angle+2);
  if (key === 'ArrowDown') s.angle = Math.max(5, s.angle-2);
  if (key === 'ArrowRight') s.power = Math.min(80, s.power+2);
  if (key === 'ArrowLeft') s.power = Math.max(10, s.power-2);
  if (key === 'Enter' || key === ' ') {
    const rad = s.angle*Math.PI/180;
    s.bvx = Math.cos(rad)*s.power/8; s.bvy = -Math.sin(rad)*s.power/8;
    s.shooting = true; SFX.playShoot();
  }
}

export function BilliardsGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  return <CanvasGame game={game} onBack={onBack} init={initBilliards} tick={tickBilliards} onKey={keyBilliards} w={500} h={300} />;
}
function initBilliards() {
  const balls = [{x:350,y:150,c:'#f00'},{x:370,y:140,c:'#00f'},{x:370,y:160,c:'#ff0'},{x:390,y:130,c:'#0f0'},{x:390,y:150,c:'#f0f'},{x:390,y:170,c:'#0ff'}];
  return { cx:120, cy:150, angle:0, power:30, balls, cueBall:{x:120,y:150,vx:0,vy:0}, shooting:false, score:0, over:false };
}
function tickBilliards(s: any, ctx: CanvasRenderingContext2D, w: number, h: number) {
  if (s.shooting) {
    s.cueBall.x += s.cueBall.vx; s.cueBall.y += s.cueBall.vy;
    s.cueBall.vx *= 0.99; s.cueBall.vy *= 0.99;
    if (s.cueBall.x < 15 || s.cueBall.x > w-15) s.cueBall.vx *= -1;
    if (s.cueBall.y < 15 || s.cueBall.y > h-15) s.cueBall.vy *= -1;
    // Ball collisions
    s.balls.forEach((b: any) => {
      const dx = b.x-s.cueBall.x, dy = b.y-s.cueBall.y;
      if (Math.sqrt(dx*dx+dy*dy) < 18) {
        b.vx = (b.vx||0) + s.cueBall.vx * 0.8;
        b.vy = (b.vy||0) + s.cueBall.vy * 0.8;
        s.cueBall.vx *= 0.2; s.cueBall.vy *= 0.2;
        SFX.playBounce();
      }
    });
    s.balls.forEach((b: any) => {
      b.x += (b.vx||0); b.y += (b.vy||0);
      b.vx = (b.vx||0) * 0.98; b.vy = (b.vy||0) * 0.98;
      if (b.x < 15 || b.x > w-15) b.vx = -(b.vx||0);
      if (b.y < 15 || b.y > h-15) b.vy = -(b.vy||0);
    });
    // Check pockets
    const pockets = [[15,15],[w-15,15],[15,h-15],[w-15,h-15],[w/2,10],[w/2,h-10]];
    s.balls = s.balls.filter((b: any) => {
      const inPocket = pockets.some(([px,py]) => Math.abs(b.x-px)<18 && Math.abs(b.y-py)<18);
      if (inPocket) { s.score += 10; SFX.playScore(); }
      return !inPocket;
    });
    if (Math.abs(s.cueBall.vx) < 0.05 && Math.abs(s.cueBall.vy) < 0.05) { s.shooting = false; s.cueBall.vx = 0; s.cueBall.vy = 0; }
  }
  ctx.fillStyle = '#006400'; ctx.fillRect(0,0,w,h);
  ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 10; ctx.strokeRect(5,5,w-10,h-10); ctx.lineWidth = 1;
  // Pockets
  [[15,15],[w-15,15],[15,h-15],[w-15,h-15],[w/2,10],[w/2,h-10]].forEach(([px,py]) => {
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(px,py,10,0,Math.PI*2); ctx.fill();
  });
  s.balls.forEach((b: any) => { ctx.fillStyle = b.c; ctx.beginPath(); ctx.arc(b.x,b.y,8,0,Math.PI*2); ctx.fill(); });
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.cueBall.x,s.cueBall.y,8,0,Math.PI*2); ctx.fill();
  if (!s.shooting) {
    const rad = s.angle*Math.PI/180;
    ctx.strokeStyle = '#ff0'; ctx.beginPath();
    ctx.moveTo(s.cueBall.x, s.cueBall.y);
    ctx.lineTo(s.cueBall.x+Math.cos(rad)*s.power*2, s.cueBall.y+Math.sin(rad)*s.power*2);
    ctx.stroke();
  }
  ctx.fillStyle = '#fff'; ctx.font = '12px mono'; ctx.fillText(`🎱 ${s.score} | Угол:${Math.round(s.angle)}° Сила:${s.power}`, 15, h-15);
}
function keyBilliards(s: any, key: string) {
  if (s.shooting) return;
  if (key === 'ArrowLeft') s.angle -= 3;
  if (key === 'ArrowRight') s.angle += 3;
  if (key === 'ArrowUp') s.power = Math.min(60, s.power+2);
  if (key === 'ArrowDown') s.power = Math.max(5, s.power-2);
  if (key === 'Enter' || key === ' ') {
    const rad = s.angle*Math.PI/180;
    s.cueBall.vx = Math.cos(rad)*s.power/5;
    s.cueBall.vy = Math.sin(rad)*s.power/5;
    s.shooting = true; SFX.playShoot();
  }
}

export function CurlingGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  return <CanvasGame game={game} onBack={onBack} init={initCurling} tick={tickCurling} onKey={keyCurling} w={300} h={500} />;
}
function initCurling() { return { sx:150, sy:450, svx:0, svy:0, angle:0, power:30, thrown:false, score:0, round:0, stones:[] as any[] }; }
function tickCurling(s: any, ctx: CanvasRenderingContext2D, w: number, h: number) {
  if (s.thrown) {
    s.sx += s.svx; s.sy += s.svy;
    s.svx *= 0.99; s.svy *= 0.99;
    if (Math.abs(s.svx) < 0.05 && Math.abs(s.svy) < 0.05) {
      const dist = Math.sqrt((s.sx-w/2)**2+(s.sy-80)**2);
      const pts = Math.max(0, Math.round(100 - dist));
      s.score += pts; s.stones.push({x:s.sx,y:s.sy});
      s.thrown = false; s.sx = 150; s.sy = 450; s.round++;
      if (pts > 50) SFX.playScore(); else SFX.playClick();
    }
  }
  ctx.fillStyle = '#d4e4f7'; ctx.fillRect(0,0,w,h);
  // Target
  [60,45,30,15].forEach((r,i) => {
    ctx.fillStyle = ['#00f','#fff','#f00','#ff0'][i];
    ctx.beginPath(); ctx.arc(w/2, 80, r, 0, Math.PI*2); ctx.fill();
  });
  // Previous stones
  s.stones.forEach((st: any) => { ctx.fillStyle = '#888'; ctx.beginPath(); ctx.arc(st.x, st.y, 10, 0, Math.PI*2); ctx.fill(); });
  // Current stone
  ctx.fillStyle = '#f00'; ctx.beginPath(); ctx.arc(s.sx, s.sy, 12, 0, Math.PI*2); ctx.fill();
  if (!s.thrown) {
    const rad = (-90+s.angle)*Math.PI/180;
    ctx.strokeStyle = '#000'; ctx.beginPath(); ctx.moveTo(s.sx,s.sy);
    ctx.lineTo(s.sx+Math.cos(rad)*s.power, s.sy+Math.sin(rad)*s.power); ctx.stroke();
  }
  ctx.fillStyle = '#000'; ctx.font = '12px mono'; ctx.fillText(`🥌 ${s.score} | Раунд:${s.round+1}/5 Угол:${s.angle}° Сила:${s.power}`, 10, h-10);
}
function keyCurling(s: any, key: string) {
  if (s.thrown) return;
  if (key === 'ArrowLeft') s.angle -= 3;
  if (key === 'ArrowRight') s.angle += 3;
  if (key === 'ArrowUp') s.power = Math.min(80, s.power+2);
  if (key === 'ArrowDown') s.power = Math.max(10, s.power-2);
  if (key === 'Enter' || key === ' ') {
    const rad = (-90+s.angle)*Math.PI/180;
    s.svx = Math.cos(rad)*s.power/8; s.svy = Math.sin(rad)*s.power/8;
    s.thrown = true; SFX.playShoot();
  }
}

export function PenaltyGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  const [score, setSc] = useState(0);
  const [round, setRound] = useState(0);
  const [result, setResult] = useState('');
  const [cursor, setCursorSt] = useState(1);
  const kick = (pos: number) => {
    const goalie = Math.floor(Math.random()*3);
    if (pos !== goalie) { setSc(s => s+1); setResult('⚽ ГОЛ!'); SFX.playWin(); }
    else { setResult('🧤 Вратарь отбил!'); SFX.playLose(); }
    setRound(r => r+1);
  };
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setCursorSt(0);
      if (e.key === 'ArrowDown') setCursorSt(1);
      if (e.key === 'ArrowRight') setCursorSt(2);
      if (e.key === 'Enter' || e.key === ' ') kick(cursor);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [cursor]);
  return (
    <GameWrapper game={game} onBack={onBack}>
      {({ setScore }) => {
        useEffect(() => { setScore(score); }, [score]);
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-4xl mb-4">{result || '⚽'}</div>
            <div className="bg-green-800 p-8 rounded-xl mb-4">
              <div className="bg-white/20 border-2 border-white w-64 h-32 flex items-end justify-between px-4 pb-2">
                {['Лево','Центр','Право'].map((d,i) => (
                  <button key={i} onClick={() => kick(i)}
                    className={`px-3 py-6 rounded text-white text-sm ${cursor===i?'bg-yellow-500':'bg-white/20'}`}>{d}</button>
                ))}
              </div>
            </div>
            <div className="text-white">Голы: {score}/{round}</div>
          </div>
        );
      }}
    </GameWrapper>
  );
}

export function TennisGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  return <PongCanvas2 game={game} onBack={onBack} />;
}
function PongCanvas2({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  return <CanvasGame game={game} onBack={onBack} init={() => ({
    p1y:150, p2y:150, bx:250, by:175, bdx:3, bdy:2, s1:0, s2:0, pw:10, ph:60, over:false, keys:{} as any
  })} tick={(s,ctx,w,h,_dt,keys,setScore,setGameOver) => {
    if (s.over) return;
    if (keys['ArrowUp']) s.p1y = Math.max(0, s.p1y-5);
    if (keys['ArrowDown']) s.p1y = Math.min(h-s.ph, s.p1y+5);
    if (s.by < s.p2y+s.ph/2) s.p2y = Math.max(0, s.p2y-3.5);
    if (s.by > s.p2y+s.ph/2) s.p2y = Math.min(h-s.ph, s.p2y+3.5);
    s.bx += s.bdx; s.by += s.bdy;
    if (s.by<=0||s.by>=h) { s.bdy*=-1; SFX.playBounce(); }
    if (s.bx<=20&&s.by>=s.p1y&&s.by<=s.p1y+s.ph) { s.bdx=Math.abs(s.bdx)*1.05; SFX.playBounce(); }
    if (s.bx>=w-20&&s.by>=s.p2y&&s.by<=s.p2y+s.ph) { s.bdx=-Math.abs(s.bdx)*1.05; SFX.playBounce(); }
    if (s.bx<0) { s.s2++; s.bx=w/2; s.by=h/2; s.bdx=3; }
    if (s.bx>w) { s.s1++; s.bx=w/2; s.by=h/2; s.bdx=-3; }
    setScore(s.s1);
    if (s.s1>=11||s.s2>=11) { s.over=true; setGameOver(true); }
    ctx.fillStyle='#0a3a0a'; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='#fff'; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(w/2,0); ctx.lineTo(w/2,h); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle='#fff'; ctx.fillRect(5,s.p1y,s.pw,s.ph); ctx.fillRect(w-15,s.p2y,s.pw,s.ph);
    ctx.fillStyle='#ff0'; ctx.beginPath(); ctx.arc(s.bx,s.by,6,0,Math.PI*2); ctx.fill();
    ctx.font='24px mono'; ctx.textAlign='center'; ctx.fillStyle='#fff';
    ctx.fillText(`${s.s1}`,w/4,30); ctx.fillText(`${s.s2}`,3*w/4,30); ctx.textAlign='left';
  }} onKey={() => {}} w={500} h={350} />;
}

export function HockeyGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  return <TennisGame game={game} onBack={onBack} />;
}

export function HorseRacingGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  const [positions, setPositions] = useState([0,0,0,0]);
  const [bet, setBet] = useState(0);
  const [racing, setRacing] = useState(false);
  const [result, setResult] = useState('');
  const [chips, setChips] = useState(100);

  useEffect(() => {
    if (!racing) return;
    const iv = setInterval(() => {
      setPositions(p => {
        const np = p.map((pos,i) => pos + Math.random() * (i === bet ? 3 : 2));
        const winner = np.findIndex(pos => pos >= 100);
        if (winner >= 0) {
          setRacing(false);
          if (winner === bet) { setResult('🎉 Ваша лошадь победила!'); setChips(c => c + 20); SFX.playWin(); }
          else { setResult(`Победила лошадь #${winner+1}`); setChips(c => c - 10); SFX.playLose(); }
          clearInterval(iv);
        }
        return np;
      });
    }, 50);
    return () => clearInterval(iv);
  }, [racing, bet]);

  const startRace = () => { setPositions([0,0,0,0]); setRacing(true); setResult(''); };

  return (
    <GameWrapper game={game} onBack={onBack}>
      {({ setScore }) => {
        useEffect(() => { setScore(chips); }, [chips]);
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-white mb-4">💰 Фишки: {chips}</div>
            <div className="w-full max-w-lg px-4">
              {['🐴','🏇','🎠','🐎'].map((h,i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <span className="text-white w-6">#{i+1}</span>
                  <div className="flex-1 bg-[#2a2a3e] h-8 rounded relative">
                    <div className="absolute h-full bg-green-600/30 rounded" style={{width:`${positions[i]}%`}} />
                    <span className="absolute text-lg" style={{left:`${positions[i]}%`}}>{h}</span>
                  </div>
                </div>
              ))}
            </div>
            {!racing && (
              <div className="flex gap-2 mt-4">
                {[0,1,2,3].map(i => (
                  <button key={i} onClick={() => setBet(i)}
                    className={`px-3 py-2 rounded text-white ${bet===i?'bg-yellow-600':'bg-[#2a2a3e]'}`}>
                    Лошадь #{i+1}
                  </button>
                ))}
              </div>
            )}
            <button onClick={startRace} disabled={racing} className="mt-3 px-6 py-2 bg-green-600 text-white rounded disabled:opacity-50">
              {racing ? 'Гонка идёт...' : '🏁 Старт!'}
            </button>
            {result && <div className="text-white text-xl mt-3">{result}</div>}
          </div>
        );
      }}
    </GameWrapper>
  );
}

export function RouletteGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  const [chips, setChips] = useState(100);
  const [betType, setBetType] = useState<'red'|'black'|'number'>('red');
  const [betNum] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number|null>(null);
  const [msg, setMsg] = useState('');

  const reds = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

  const spin = () => {
    if (spinning || chips < 10) return;
    setSpinning(true); setMsg('');
    setChips(c => c - 10);
    setTimeout(() => {
      const num = Math.floor(Math.random() * 37);
      setResult(num);
      setSpinning(false);
      const isRed = reds.includes(num);
      if (betType === 'red' && isRed) { setChips(c => c + 20); setMsg('🎉 Выиграли! +20'); SFX.playWin(); }
      else if (betType === 'black' && !isRed && num > 0) { setChips(c => c + 20); setMsg('🎉 Выиграли! +20'); SFX.playWin(); }
      else if (betType === 'number' && num === betNum) { setChips(c => c + 360); setMsg('🎉 Джекпот! +360'); SFX.playWin(); }
      else { setMsg('Не повезло...'); SFX.playLose(); }
    }, 2000);
  };

  return (
    <GameWrapper game={game} onBack={onBack}>
      {({ setScore }) => {
        useEffect(() => { setScore(chips); }, [chips]);
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-white text-xl mb-4">💰 Фишки: {chips}</div>
            <div className={`w-32 h-32 rounded-full border-4 border-yellow-500 flex items-center justify-center text-4xl font-bold mb-4 ${spinning?'animate-spin':''}`}
              style={{background: result !== null ? (reds.includes(result) ? '#c00' : (result === 0 ? '#0a0' : '#222')) : '#333', color:'#fff'}}>
              {spinning ? '?' : result ?? '?'}
            </div>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setBetType('red')} className={`px-4 py-2 rounded ${betType==='red'?'bg-red-600':'bg-red-900'} text-white`}>🔴 Красное</button>
              <button onClick={() => setBetType('black')} className={`px-4 py-2 rounded ${betType==='black'?'bg-gray-800':'bg-gray-700'} text-white`}>⚫ Чёрное</button>
            </div>
            <button onClick={spin} disabled={spinning || chips < 10} className="px-8 py-3 bg-yellow-600 text-white rounded-lg font-bold disabled:opacity-50">
              {spinning ? 'Крутится...' : '🎰 Ставка 10'}
            </button>
            {msg && <div className="text-white text-lg mt-3">{msg}</div>}
          </div>
        );
      }}
    </GameWrapper>
  );
}

// Remaining simple games (16,17,18,19,20) as text-based

export function SpiderGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  return <CardGamePlaceholder game={game} onBack={onBack} gameName="Паук" />;
}
export function KlondikeGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  return <CardGamePlaceholder game={game} onBack={onBack} gameName="Косынка" />;
}
export function MahjongGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  return <TilePairGame game={game} onBack={onBack} />;
}
export function SameGameGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  return <SameGameInner game={game} onBack={onBack} />;
}
export function FlowFreeGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  return <SimpleTextGame game={game} onBack={onBack} content="Flow Free — соединяйте точки!" />;
}

// Card game placeholder with simple card matching
function CardGamePlaceholder({ game, onBack, gameName }: { game: GameInfo; onBack: () => void; gameName: string }) {
  const suits = ['♠','♥','♦','♣'];
  const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const [deck, setDeck] = useState<{suit:string;rank:string;faceUp:boolean}[]>([]);
  const [sc, setSc] = useState(0);

  useEffect(() => {
    const d = [];
    for (const s of suits) for (const r of ranks) d.push({suit:s,rank:r,faceUp:Math.random()<0.5});
    setDeck(d.slice(0,20));
  }, []);

  return (
    <GameWrapper game={game} onBack={onBack}>
      {({ setScore }) => {
        useEffect(() => { setScore(sc); }, [sc]);
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-white text-xl mb-4">{gameName}</div>
            <div className="flex flex-wrap gap-1 max-w-lg justify-center">
              {deck.map((card, i) => (
                <div key={i} onClick={() => {
                  const d = [...deck]; d[i].faceUp = !d[i].faceUp; setDeck(d);
                  setSc(s => s+5); SFX.playClick();
                }}
                  className={`w-12 h-16 rounded border flex items-center justify-center text-sm cursor-pointer
                    ${card.faceUp ? 'bg-white text-black' : 'bg-blue-800 text-transparent'}`}>
                  {card.faceUp ? `${card.rank}${card.suit}` : '🂠'}
                </div>
              ))}
            </div>
          </div>
        );
      }}
    </GameWrapper>
  );
}

// Mahjong tile pair game
function TilePairGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  const tiles = ['🀇','🀈','🀉','🀊','🀋','🀌','🀍','🀎','🀏','🀙','🀚','🀛','🀜','🀝','🀞','🀟','🀠','🀡'];
  const [board, setBoard] = useState<{tile:string;matched:boolean}[]>([]);
  const [selected, setSelected] = useState<number|null>(null);
  const [sc, setSc] = useState(0);

  useEffect(() => {
    const pairs = tiles.slice(0,12);
    const all = [...pairs,...pairs].map(t => ({tile:t,matched:false}));
    for (let i = all.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [all[i],all[j]]=[all[j],all[i]]; }
    setBoard(all);
  }, []);

  const pick = (idx: number) => {
    if (board[idx].matched) return;
    if (selected === null) { setSelected(idx); SFX.playSelect(); return; }
    if (selected === idx) { setSelected(null); return; }
    if (board[selected].tile === board[idx].tile) {
      const b = [...board];
      b[selected].matched = true; b[idx].matched = true;
      setBoard(b); setSc(s => s+10); SFX.playScore();
    } else { SFX.playLose(); }
    setSelected(null);
  };

  return (
    <GameWrapper game={game} onBack={onBack}>
      {({ setScore }) => {
        useEffect(() => { setScore(sc); }, [sc]);
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-white mb-3">Найдите пары!</div>
            <div className="grid grid-cols-6 gap-2">
              {board.map((t, i) => (
                <div key={i} onClick={() => pick(i)}
                  className={`w-14 h-14 flex items-center justify-center text-2xl rounded cursor-pointer transition-all
                    ${t.matched ? 'opacity-20' : selected===i ? 'bg-yellow-500/30 ring-2 ring-yellow-400' : 'bg-[#2a2a3e] hover:bg-[#3a3a4e]'}`}>
                  {(selected === i || t.matched) ? t.tile : '?'}
                </div>
              ))}
            </div>
          </div>
        );
      }}
    </GameWrapper>
  );
}

// SameGame
function SameGameInner({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  const ROWS = 10, COLS = 10, COLORS_N = 4;
  const colorsArr = ['#f44','#4f4','#44f','#ff4'];
  const [grid, setGrid] = useState<number[][]>([]);
  const [cursor, setCursor] = useState({x:0,y:0});
  const [sc, setSc] = useState(0);

  useEffect(() => {
    setGrid(Array.from({length:ROWS}, () => Array.from({length:COLS}, () => Math.floor(Math.random()*COLORS_N))));
  }, []);

  const findGroup = (g: number[][], r: number, c: number): [number,number][] => {
    const color = g[r][c];
    if (color < 0) return [];
    const visited = new Set<string>();
    const stack: [number,number][] = [[r,c]];
    const group: [number,number][] = [];
    while (stack.length) {
      const [cr,cc] = stack.pop()!;
      const k = `${cr},${cc}`;
      if (visited.has(k)) continue;
      if (cr<0||cr>=ROWS||cc<0||cc>=COLS) continue;
      if (g[cr][cc] !== color) continue;
      visited.add(k);
      group.push([cr,cc]);
      stack.push([cr-1,cc],[cr+1,cc],[cr,cc-1],[cr,cc+1]);
    }
    return group;
  };

  const remove = (r: number, c: number) => {
    const group = findGroup(grid, r, c);
    if (group.length < 2) return;
    const g = grid.map(row => [...row]);
    group.forEach(([gr,gc]) => { g[gr][gc] = -1; });
    // Gravity
    for (let col = 0; col < COLS; col++) {
      const vals = [];
      for (let row = ROWS-1; row >= 0; row--) { if (g[row][col] >= 0) vals.push(g[row][col]); }
      for (let row = ROWS-1; row >= 0; row--) { g[row][col] = vals.length ? vals.shift()! : -1; }
    }
    setGrid(g);
    const pts = (group.length - 2) ** 2;
    setSc(s => s + pts);
    SFX.playScore();
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') setCursor(c => ({...c, y: Math.max(0, c.y-1)}));
      if (e.key === 'ArrowDown') setCursor(c => ({...c, y: Math.min(ROWS-1, c.y+1)}));
      if (e.key === 'ArrowLeft') setCursor(c => ({...c, x: Math.max(0, c.x-1)}));
      if (e.key === 'ArrowRight') setCursor(c => ({...c, x: Math.min(COLS-1, c.x+1)}));
      if (e.key === 'Enter' || e.key === ' ') remove(cursor.y, cursor.x);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [cursor, grid]);

  return (
    <GameWrapper game={game} onBack={onBack}>
      {({ setScore }) => {
        useEffect(() => { setScore(sc); }, [sc]);
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-white mb-2">Очки: {sc}</div>
            <div className="bg-[#1a1a2e] p-1 rounded">
              {grid.map((row, r) => (
                <div key={r} className="flex">
                  {row.map((cell, c) => (
                    <div key={c} onClick={() => remove(r,c)}
                      className={`w-8 h-8 rounded-sm cursor-pointer ${cursor.x===c&&cursor.y===r?'ring-1 ring-white':''}`}
                      style={{background: cell >= 0 ? colorsArr[cell] : 'transparent'}} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        );
      }}
    </GameWrapper>
  );
}

// Simple text placeholder for complex games
function SimpleTextGame({ game, onBack, content }: { game: GameInfo; onBack: () => void; content: string }) {
  return (
    <GameWrapper game={game} onBack={onBack}>
      {() => (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-6xl mb-4">{game.icon}</div>
          <div className="text-2xl text-white mb-4">{game.name}</div>
          <div className="text-white/60 text-center max-w-md">{content}</div>
          <div className="text-white/40 text-sm mt-4">{game.description}</div>
        </div>
      )}
    </GameWrapper>
  );
}

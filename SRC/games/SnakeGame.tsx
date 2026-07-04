import { useEffect, useRef } from 'react';
import GameWrapper from '../components/GameWrapper';
import { GameInfo } from '../data/games';
import { playScore, playLose, playMove } from '../utils/sound';

const GRID = 20, CELL = 20;

export default function SnakeGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  return (
    <GameWrapper game={game} onBack={onBack}>
      {({ isPaused, setGameOver, setScore, gameOver }) => (
        <SnakeCanvas isPaused={isPaused} gameOver={gameOver} setGameOver={setGameOver} setScore={setScore} />
      )}
    </GameWrapper>
  );
}

function SnakeCanvas({ isPaused, gameOver, setGameOver, setScore }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<any>(null);

  const init = () => {
    const snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    const food = spawnFood(snake);
    return { snake, food, dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 }, score: 0, eaten: 0, speed: 150, lastMove: Date.now(), over: false };
  };

  function spawnFood(snake: { x: number; y: number }[]) {
    let f: {x:number;y:number} = { x: 0, y: 0 };
    do { f = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) }; }
    while (snake.some(s => s.x === f.x && s.y === f.y));
    return f;
  }

  useEffect(() => { stateRef.current = init(); }, []);
  useEffect(() => { if (gameOver) stateRef.current = init(); }, [gameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;

    const tick = () => {
      const s = stateRef.current;
      if (!s || isPaused || s.over) {
        draw(ctx, s);
        raf = requestAnimationFrame(tick);
        return;
      }
      const now = Date.now();
      if (now - s.lastMove > s.speed) {
        s.lastMove = now;
        s.dir = { ...s.nextDir };
        const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y };
        if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID || s.snake.some((seg: any) => seg.x === head.x && seg.y === head.y)) {
          s.over = true;
          playLose();
          setScore(s.score);
          setGameOver(true);
        } else {
          s.snake.unshift(head);
          if (head.x === s.food.x && head.y === s.food.y) {
            s.score += 10;
            s.eaten++;
            setScore(s.score);
            playScore();
            s.food = spawnFood(s.snake);
            if (s.eaten % 5 === 0) s.speed = Math.max(50, s.speed - 10);
          } else {
            s.snake.pop();
          }
        }
      }
      draw(ctx, s);
      raf = requestAnimationFrame(tick);
    };

    const draw = (ctx: CanvasRenderingContext2D, s: any) => {
      if (!s) return;
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#1a1a2e';
      for (let i = 0; i <= GRID; i++) {
        ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, GRID * CELL); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(GRID * CELL, i * CELL); ctx.stroke();
      }
      // Food
      ctx.fillStyle = '#ff4444';
      ctx.beginPath();
      ctx.arc(s.food.x * CELL + CELL / 2, s.food.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
      // Snake
      s.snake.forEach((seg: any, i: number) => {
        ctx.fillStyle = i === 0 ? '#00ff00' : '#00cc00';
        ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
      });
      // Info
      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.fillText(`Очки: ${s.score}  Длина: ${s.snake.length}`, 10, GRID * CELL + 20);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPaused, gameOver]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isPaused || !stateRef.current || stateRef.current.over) return;
      const s = stateRef.current;
      const dirs: Record<string, { x: number; y: number }> = {
        ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }
      };
      const d = dirs[e.key];
      if (d && (d.x + s.dir.x !== 0 || d.y + s.dir.y !== 0)) {
        s.nextDir = d;
        playMove();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPaused]);

  return (
    <div className="flex items-center justify-center h-full">
      <canvas ref={canvasRef} width={GRID * CELL} height={GRID * CELL + 30} className="border border-white/10 rounded" />
    </div>
  );
}

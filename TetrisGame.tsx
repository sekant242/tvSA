import { useEffect, useRef, useCallback } from 'react';
import GameWrapper from '../components/GameWrapper';
import { GameInfo } from '../data/games';
import { playMove, playRotate, playDrop, playClear, playLose } from '../utils/sound';

const COLS = 10, ROWS = 20, SZ = 28;
const SHAPES = [
  [[1,1,1,1]],
  [[1,1],[1,1]],
  [[0,1,0],[1,1,1]],
  [[1,1,0],[0,1,1]],
  [[0,1,1],[1,1,0]],
  [[1,0,0],[1,1,1]],
  [[0,0,1],[1,1,1]]
];
const COLORS = ['#00f0f0','#f0f000','#a000f0','#00f000','#f00000','#0000f0','#f0a000'];

export default function TetrisGame({ game, onBack }: { game: GameInfo; onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<any>(null);

  const initState = useCallback(() => {
    const board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    const idx = Math.floor(Math.random() * SHAPES.length);
    const nextIdx = Math.floor(Math.random() * SHAPES.length);
    return {
      board, score: 0, level: 0, lines: 0,
      current: { shape: SHAPES[idx], color: idx + 1, x: 3, y: 0 },
      next: { shape: SHAPES[nextIdx], color: nextIdx + 1 },
      gameOver: false, lastDrop: Date.now()
    };
  }, []);

  useEffect(() => {
    stateRef.current = initState();
  }, [initState]);

  return (
    <GameWrapper game={game} onBack={onBack}>
      {({ isPaused, setGameOver, setScore, gameOver }) => {
        return <TetrisCanvas
          canvasRef={canvasRef}
          stateRef={stateRef}
          isPaused={isPaused}
          gameOver={gameOver}
          setGameOver={setGameOver}
          setScore={setScore}
          initState={initState}
        />;
      }}
    </GameWrapper>
  );
}

function TetrisCanvas({ canvasRef, stateRef, isPaused, gameOver, setGameOver, setScore, initState }: any) {
  const rafRef = useRef<number>(0);

  const collides = (board: number[][], shape: number[][], x: number, y: number) => {
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++)
        if (shape[r][c]) {
          const ny = y + r, nx = x + c;
          if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
          if (ny >= 0 && board[ny][nx]) return true;
        }
    return false;
  };

  const rotate = (shape: number[][]) => {
    const rows = shape.length, cols = shape[0].length;
    const r: number[][] = [];
    for (let c = 0; c < cols; c++) {
      r.push([]);
      for (let rr = rows - 1; rr >= 0; rr--) r[c].push(shape[rr][c]);
    }
    return r;
  };

  const merge = (board: number[][], cur: any) => {
    const b = board.map(r => [...r]);
    for (let r = 0; r < cur.shape.length; r++)
      for (let c = 0; c < cur.shape[r].length; c++)
        if (cur.shape[r][c] && cur.y + r >= 0) b[cur.y + r][cur.x + c] = cur.color;
    return b;
  };

  const clearLines = (board: number[][]) => {
    let cleared = 0;
    const newBoard = board.filter(row => {
      if (row.every(c => c > 0)) { cleared++; return false; }
      return true;
    });
    while (newBoard.length < ROWS) newBoard.unshift(Array(COLS).fill(0));
    return { board: newBoard, cleared };
  };

  useEffect(() => {
    if (gameOver) {
      stateRef.current = initState();
      return;
    }
  }, [gameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const draw = () => {
      const s = stateRef.current;
      if (!s) return;
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw board
      const ox = 20, oy = 10;
      ctx.strokeStyle = '#222';
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++) {
          if (s.board[r][c]) {
            ctx.fillStyle = COLORS[s.board[r][c] - 1];
            ctx.fillRect(ox + c * SZ, oy + r * SZ, SZ - 1, SZ - 1);
          } else {
            ctx.strokeRect(ox + c * SZ, oy + r * SZ, SZ, SZ);
          }
        }

      // Draw current piece
      if (s.current) {
        ctx.fillStyle = COLORS[s.current.color - 1];
        for (let r = 0; r < s.current.shape.length; r++)
          for (let c = 0; c < s.current.shape[r].length; c++)
            if (s.current.shape[r][c] && s.current.y + r >= 0)
              ctx.fillRect(ox + (s.current.x + c) * SZ, oy + (s.current.y + r) * SZ, SZ - 1, SZ - 1);
      }

      // Draw next piece preview
      const nx = ox + COLS * SZ + 30;
      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.fillText('Следующая:', nx, 30);
      if (s.next) {
        ctx.fillStyle = COLORS[s.next.color - 1];
        for (let r = 0; r < s.next.shape.length; r++)
          for (let c = 0; c < s.next.shape[r].length; c++)
            if (s.next.shape[r][c])
              ctx.fillRect(nx + c * 20, 40 + r * 20, 19, 19);
      }

      // Info
      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.fillText(`Уровень: ${s.level}`, nx, 130);
      ctx.fillText(`Линии: ${s.lines}`, nx, 155);
      ctx.fillText(`Очки: ${s.score}`, nx, 180);
    };

    const tick = () => {
      const s = stateRef.current;
      if (!s || isPaused || s.gameOver) { draw(); rafRef.current = requestAnimationFrame(tick); return; }

      const speed = Math.max(100, 800 - s.level * 70);
      const now = Date.now();
      if (now - s.lastDrop > speed) {
        s.lastDrop = now;
        if (!collides(s.board, s.current.shape, s.current.x, s.current.y + 1)) {
          s.current.y++;
        } else {
          s.board = merge(s.board, s.current);
          const { board, cleared } = clearLines(s.board);
          s.board = board;
          if (cleared > 0) {
            playClear();
            const pts = [0, 100, 300, 500, 800][cleared] * (s.level + 1);
            s.score += pts;
            s.lines += cleared;
            s.level = Math.min(10, Math.floor(s.lines / 10));
            setScore(s.score);
          }
          s.current = { shape: s.next.shape, color: s.next.color, x: 3, y: 0 };
          const ni = Math.floor(Math.random() * SHAPES.length);
          s.next = { shape: SHAPES[ni], color: ni + 1 };
          if (collides(s.board, s.current.shape, s.current.x, s.current.y)) {
            s.gameOver = true;
            playLose();
            setScore(s.score);
            setGameOver(true);
          }
        }
      }
      draw();
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPaused, gameOver]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isPaused || !stateRef.current || stateRef.current.gameOver) return;
      const s = stateRef.current;
      if (e.key === 'ArrowLeft') { if (!collides(s.board, s.current.shape, s.current.x - 1, s.current.y)) { s.current.x--; playMove(); } }
      else if (e.key === 'ArrowRight') { if (!collides(s.board, s.current.shape, s.current.x + 1, s.current.y)) { s.current.x++; playMove(); } }
      else if (e.key === 'ArrowUp') {
        const rot = rotate(s.current.shape);
        if (!collides(s.board, rot, s.current.x, s.current.y)) { s.current.shape = rot; playRotate(); }
      }
      else if (e.key === 'ArrowDown') { if (!collides(s.board, s.current.shape, s.current.x, s.current.y + 1)) { s.current.y++; } }
      else if (e.key === ' ' || e.key === 'Enter') {
        while (!collides(s.board, s.current.shape, s.current.x, s.current.y + 1)) s.current.y++;
        s.lastDrop = 0;
        playDrop();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPaused]);

  return (
    <div className="flex items-center justify-center h-full">
      <canvas ref={canvasRef} width={420} height={580} className="border border-white/10 rounded" />
    </div>
  );
}

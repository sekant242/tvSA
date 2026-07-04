import { useState, useEffect, useCallback } from 'react';
import { GameInfo } from '../data/games';
import { getScores, addScore, ScoreEntry } from '../utils/leaderboard';

interface GameWrapperProps {
  game: GameInfo;
  onBack: () => void;
  children: (props: {
    isPaused: boolean;
    setPaused: (v: boolean) => void;
    gameOver: boolean;
    setGameOver: (v: boolean) => void;
    score: number;
    setScore: (v: number | ((p: number) => number)) => void;
    showHelp: boolean;
  }) => React.ReactNode;
}

export default function GameWrapper({ game, onBack, children }: GameWrapperProps) {
  const [isPaused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [scores, setScores] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    setScores(getScores(game.id));
  }, [game.id]);

  useEffect(() => {
    if (gameOver && score > 0) {
      const updated = addScore(game.id, score);
      setScores(updated);
    }
  }, [gameOver, score, game.id]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'Backspace') {
      e.preventDefault();
      if (showHelp) { setShowHelp(false); return; }
      if (showLeaderboard) { setShowLeaderboard(false); return; }
      if (gameOver) { onBack(); return; }
      setPaused(p => !p);
    }
  }, [showHelp, showLeaderboard, gameOver, onBack]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0f] relative">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#111118] border-b border-white/10 shrink-0" style={{minHeight:48}}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-white/60 hover:text-white text-sm px-2 py-1 rounded hover:bg-white/10 transition">
            ← Назад
          </button>
          <span className="text-lg font-bold text-white">{game.icon} {game.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-yellow-400 font-mono text-lg">Очки: {score}</span>
          <span className="text-white/40 text-sm">🏆 {getScores(game.id)[0]?.score || 0}</span>
          <button onClick={() => setShowHelp(true)} className="text-white/60 hover:text-white text-sm px-2 py-1 rounded hover:bg-white/10">
            ❓ Справка
          </button>
          <button onClick={() => setShowLeaderboard(true)} className="text-white/60 hover:text-white text-sm px-2 py-1 rounded hover:bg-white/10">
            🏆 Рекорды
          </button>
          <button onClick={() => setPaused(p => !p)} className="text-white/60 hover:text-white text-sm px-2 py-1 rounded hover:bg-white/10">
            {isPaused ? '▶ Играть' : '⏸ Пауза'}
          </button>
        </div>
      </div>

      {/* Game area */}
      <div className="flex-1 relative overflow-hidden">
        {children({ isPaused, setPaused, gameOver, setGameOver, score, setScore, showHelp })}

        {/* Pause overlay */}
        {isPaused && !gameOver && !showHelp && !showLeaderboard && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setPaused(false)}>
            <div className="text-center">
              <div className="text-6xl font-bold text-white mb-4">⏸</div>
              <div className="text-3xl font-bold text-white mb-2">ПАУЗА</div>
              <div className="text-white/60 text-sm">Нажмите OK или кликните для продолжения</div>
              <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm">
                Выйти в меню
              </button>
            </div>
          </div>
        )}

        {/* Game Over overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/85 flex items-center justify-center z-50">
            <div className="text-center p-8 bg-[#1a1a2e] rounded-2xl border border-white/10 max-w-sm">
              <div className="text-5xl mb-4">🎮</div>
              <div className="text-2xl font-bold text-white mb-2">ИГРА ОКОНЧЕНА</div>
              <div className="text-3xl font-bold text-yellow-400 mb-4">{score} очков</div>
              {scores.length > 0 && scores[0].score === score && (
                <div className="text-green-400 text-sm mb-4">🎉 Новый рекорд!</div>
              )}
              <div className="flex gap-3 justify-center">
                <button onClick={() => { setGameOver(false); setScore(0); }} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg">
                  🔄 Заново
                </button>
                <button onClick={onBack} className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg">
                  ← Меню
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Help modal */}
        {showHelp && (
          <div className="absolute inset-0 bg-black/85 flex items-center justify-center z-50" onClick={() => setShowHelp(false)}>
            <div className="bg-[#1a1a2e] rounded-2xl border border-white/10 p-6 max-w-md mx-4" onClick={e => e.stopPropagation()}>
              <div className="text-xl font-bold text-white mb-4">{game.icon} {game.name}</div>
              <div className="text-white/80 mb-3"><b>Описание:</b> {game.description}</div>
              <div className="text-white/80 mb-3"><b>Управление:</b> {game.controls}</div>
              <div className="text-white/80 mb-3"><b>Очки:</b> {game.scoring}</div>
              <button onClick={() => setShowHelp(false)} className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg">
                Закрыть
              </button>
            </div>
          </div>
        )}

        {/* Leaderboard modal */}
        {showLeaderboard && (
          <div className="absolute inset-0 bg-black/85 flex items-center justify-center z-50" onClick={() => setShowLeaderboard(false)}>
            <div className="bg-[#1a1a2e] rounded-2xl border border-white/10 p-6 max-w-md mx-4 w-full" onClick={e => e.stopPropagation()}>
              <div className="text-xl font-bold text-white mb-4">🏆 Таблица рекордов — {game.name}</div>
              {scores.length === 0 ? (
                <div className="text-white/40 text-center py-8">Пока нет рекордов</div>
              ) : (
                <div className="space-y-2">
                  {scores.map((s, i) => (
                    <div key={i} className={`flex justify-between items-center px-3 py-2 rounded ${i === 0 ? 'bg-yellow-500/20' : 'bg-white/5'}`}>
                      <span className="text-white/60">#{i + 1}</span>
                      <span className="text-white font-bold">{s.score}</span>
                      <span className="text-white/40 text-sm">{s.date}</span>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => setShowLeaderboard(false)} className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg">
                Закрыть
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

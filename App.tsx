import { useState, useEffect, useCallback } from 'react';
import { GAMES, CATEGORIES, GameInfo } from './data/games';
import { getHighScore } from './utils/leaderboard';
import { isSoundEnabled, setSoundEnabled } from './utils/sound';

// Game imports
import TetrisGame from './games/TetrisGame';
import SnakeGame from './games/SnakeGame';
import {
  Game2048, PongGame, TanksGame, ArkanoidGame, InvadersGame, GalagaGame,
  FroggerGame, PacManGame, MinesweeperGame, Puzzle15Game, SudokuGame,
  LinesGame, BallSortGame, SpiderGame, KlondikeGame, MahjongGame,
  SameGameGame, FlowFreeGame, FlappyGame, DinoGame, RacingGame,
  CatcherGame, StroopGame, SimonGame, MathQuizGame, ClickerGame,
  GuessNumGame, BattleshipGame, RampartGame, TowerDefenseGame,
  WormsGame, ChessGame, CheckersGame, ReversiGame, GomokuGame,
  BackgammonGame, ChineseCheckersGame, MancalaGame, PinballGame,
  MiniGolfGame, BasketballGame, BilliardsGame, CurlingGame,
  PenaltyGame, TennisGame, HockeyGame, HorseRacingGame, RouletteGame
} from './games/AllGames';

const GAME_COMPONENTS: Record<string, React.ComponentType<{game: GameInfo; onBack: () => void}>> = {
  tetris: TetrisGame, snake: SnakeGame, game2048: Game2048, pong: PongGame,
  tanks: TanksGame, arkanoid: ArkanoidGame, invaders: InvadersGame, galaga: GalagaGame,
  frogger: FroggerGame, pacman: PacManGame, minesweeper: MinesweeperGame,
  puzzle15: Puzzle15Game, sudoku: SudokuGame, lines: LinesGame, ballsort: BallSortGame,
  spider: SpiderGame, klondike: KlondikeGame, mahjong: MahjongGame,
  samegame: SameGameGame, flowfree: FlowFreeGame, flappy: FlappyGame, dino: DinoGame,
  racing: RacingGame, catcher: CatcherGame, stroop: StroopGame, simon: SimonGame,
  mathquiz: MathQuizGame, clicker: ClickerGame, guessnum: GuessNumGame,
  battleship: BattleshipGame, rampart: RampartGame, towerdefense: TowerDefenseGame,
  worms: WormsGame, chess: ChessGame, checkers: CheckersGame, reversi: ReversiGame,
  gomoku: GomokuGame, backgammon: BackgammonGame, chinesecheckers: ChineseCheckersGame,
  mancala: MancalaGame, pinball: PinballGame, minigolf: MiniGolfGame,
  basketball: BasketballGame, billiards: BilliardsGame, curling: CurlingGame,
  penalty: PenaltyGame, tennis: TennisGame, hockey: HockeyGame,
  horseracing: HorseRacingGame, roulette: RouletteGame,
};

// Joystick SVG Icon (Atari style)
const JoystickIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
    <rect x="16" y="36" width="32" height="20" rx="4" fill="currentColor"/>
    <rect x="12" y="48" width="40" height="12" rx="3" fill="currentColor"/>
    <rect x="29" y="8" width="6" height="32" rx="3" fill="currentColor"/>
    <circle cx="32" cy="8" r="6" fill="currentColor"/>
    <circle cx="22" cy="54" r="2" fill="#0a0a0f"/>
    <circle cx="42" cy="54" r="2" fill="#0a0a0f"/>
  </svg>
);

export default function App() {
  const [activeGame, setActiveGame] = useState<GameInfo | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [focusedIdx, setFocusedIdx] = useState(0);

  const filteredGames = GAMES.filter(g => {
    const matchCat = selectedCategory === 'Все' || g.category === selectedCategory;
    const matchSearch = !searchQuery || g.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const toggleSound = useCallback(() => {
    const newVal = !soundOn;
    setSoundOn(newVal);
    setSoundEnabled(newVal);
  }, [soundOn]);

  useEffect(() => {
    if (activeGame) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') setFocusedIdx(i => Math.min(filteredGames.length - 1, i + 1));
      if (e.key === 'ArrowUp') setFocusedIdx(i => Math.max(0, i - 1));
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (filteredGames[focusedIdx]) setActiveGame(filteredGames[focusedIdx]);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [activeGame, focusedIdx, filteredGames]);

  // If a game is active, render it
  if (activeGame) {
    const GameComponent = GAME_COMPONENTS[activeGame.id];
    if (GameComponent) {
      return <GameComponent game={activeGame} onBack={() => setActiveGame(null)} />;
    }
  }

  return (
    <div className="flex h-full bg-[#0a0a0f] text-white overflow-hidden">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-[#0d0d15] border-r border-white/5 flex flex-col shrink-0 transition-all duration-300`}>
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-white/5">
          <div className="text-yellow-400">
            <JoystickIcon />
          </div>
          {sidebarOpen && <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Игры</span>}
        </div>

        {/* Menu items */}
        <div className="flex-1 overflow-y-auto py-2">
          <button onClick={() => setSidebarOpen(s => !s)}
            className="w-full px-4 py-2 text-left text-white/40 hover:text-white hover:bg-white/5 text-sm flex items-center gap-2">
            {sidebarOpen ? '◀' : '▶'} {sidebarOpen && 'Свернуть'}
          </button>

          {sidebarOpen && (
            <>
              <div className="px-3 py-2">
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="🔍 Поиск игры..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-yellow-500/50" />
              </div>

              <div className="px-2 py-1">
                <div className="text-xs text-white/30 uppercase px-2 mb-1 mt-2">Категории</div>
                {['Все', ...CATEGORIES].map(cat => (
                  <button key={cat} onClick={() => { setSelectedCategory(cat); setFocusedIdx(0); }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors
                      ${selectedCategory === cat ? 'bg-yellow-500/20 text-yellow-400' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                    {cat}
                  </button>
                ))}
              </div>

              <div className="px-2 py-1 mt-2 border-t border-white/5">
                <div className="text-xs text-white/30 uppercase px-2 mb-1 mt-2">Настройки</div>
                <button onClick={toggleSound}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5">
                  {soundOn ? '🔊 Звук: Вкл' : '🔇 Звук: Выкл'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {sidebarOpen && (
          <div className="p-3 border-t border-white/5 text-xs text-white/20 text-center">
            <a href="/lampa-games-plugin.js" target="_blank" className="text-yellow-400/60 hover:text-yellow-400 underline">
              📥 Скачать плагин для Lampa
            </a>
            <div className="mt-1">v1.0 • 50 игр</div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0d0d15] border-b border-white/5 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-yellow-400"><JoystickIcon /></span>
              <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                Lampa Games
              </span>
            </h1>
            <p className="text-white/40 text-sm mt-0.5">
              {selectedCategory === 'Все' ? `${filteredGames.length} игр` : `${selectedCategory} • ${filteredGames.length} игр`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white/30 text-sm">D-pad для навигации • OK для запуска</span>
          </div>
        </div>

        {/* Game grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {filteredGames.map((game, idx) => {
              const highScore = getHighScore(game.id);
              return (
                <div
                  key={game.id}
                  tabIndex={0}
                  onClick={() => setActiveGame(game)}
                  onFocus={() => setFocusedIdx(idx)}
                  className={`game-card bg-[#12121f] rounded-xl border border-white/5 p-4 cursor-pointer
                    hover:border-yellow-500/30 hover:bg-[#1a1a2e] transition-all group
                    ${focusedIdx === idx ? 'focused border-yellow-500/50 bg-[#1a1a2e]' : ''}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-3xl">{game.icon}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40">
                      {game.category}
                    </span>
                  </div>
                  <h3 className="text-white font-bold text-sm mb-1 group-hover:text-yellow-400 transition-colors">
                    {game.name}
                  </h3>
                  <p className="text-white/40 text-xs leading-relaxed mb-2 line-clamp-2">
                    {game.description}
                  </p>
                  <div className="flex items-center justify-between">
                    {highScore > 0 ? (
                      <span className="text-yellow-400/80 text-xs font-mono">🏆 {highScore}</span>
                    ) : (
                      <span className="text-white/20 text-xs">Нет рекорда</span>
                    )}
                    <span className="text-white/20 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      ▶ Играть
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredGames.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-6xl mb-4">🎮</div>
              <div className="text-white/40 text-lg">Игры не найдены</div>
              <button onClick={() => { setSearchQuery(''); setSelectedCategory('Все'); }}
                className="mt-4 px-4 py-2 bg-white/10 rounded-lg text-white/60 hover:text-white text-sm">
                Показать все игры
              </button>
            </div>
          )}

          {/* Installation instructions */}
          <div className="mt-8 border-t border-white/5 pt-6">
            <h2 className="text-lg font-bold text-white/80 mb-4">📥 Установка плагина в Lampa</h2>
            <div className="bg-[#12121f] rounded-xl border border-white/5 p-5 mb-6">
              <ol className="list-decimal list-inside space-y-3 text-white/70 text-sm">
                <li>Разместите файл <code className="bg-white/10 px-2 py-0.5 rounded">lampa-games-plugin.js</code> на вашем хостинге или GitHub Pages</li>
                <li>Откройте <b>Lampa</b> → <b>Настройки</b> → <b>Расширения</b> → <b>Добавить плагин</b></li>
                <li>Вставьте URL плагина, например: <code className="bg-white/10 px-2 py-0.5 rounded break-all">https://yoursite.com/lampa-games-plugin.js</code></li>
                <li>Нажмите <b>Готово</b> и перезапустите Lampa</li>
                <li>В боковом меню появится пункт <b>🎮 Игры</b> с иконкой джойстика</li>
              </ol>
              <div className="mt-4 flex gap-3">
                <a href="/lampa-games-plugin.js" download className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm hover:bg-yellow-500/30 inline-flex items-center gap-2">
                  📥 Скачать lampa-games-plugin.js
                </a>
                <button onClick={() => navigator.clipboard?.writeText(window.location.origin + '/lampa-games-plugin.js')} 
                  className="px-4 py-2 bg-white/10 text-white/60 rounded-lg text-sm hover:bg-white/20">
                  📋 Копировать URL
                </button>
              </div>
            </div>
          </div>

          {/* Game list below */}
          <div className="border-t border-white/5 pt-6">
            <h2 className="text-lg font-bold text-white/80 mb-4">📋 Полный список игр</h2>
            <div className="bg-[#12121f] rounded-xl border border-white/5 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-white/40">
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Игра</th>
                    <th className="px-4 py-2 text-left">Категория</th>
                    <th className="px-4 py-2 text-left">Описание</th>
                    <th className="px-4 py-2 text-right">🏆 Рекорд</th>
                    <th className="px-4 py-2 text-center">Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {GAMES.map((game, idx) => (
                    <tr key={game.id} className="border-b border-white/5 hover:bg-white/5 cursor-pointer" onClick={() => setActiveGame(game)}>
                      <td className="px-4 py-2 text-white/30">{idx + 1}</td>
                      <td className="px-4 py-2 text-white font-medium">{game.icon} {game.name}</td>
                      <td className="px-4 py-2 text-white/40">{game.category}</td>
                      <td className="px-4 py-2 text-white/30 max-w-xs truncate">{game.description}</td>
                      <td className="px-4 py-2 text-right text-yellow-400/80 font-mono">{getHighScore(game.id) || '—'}</td>
                      <td className="px-4 py-2 text-center">
                        <button className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs hover:bg-yellow-500/30">
                          ▶ Играть
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

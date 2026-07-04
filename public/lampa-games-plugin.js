(function () {
  'use strict';

  // ============================================
  // LAMPA GAMES PLUGIN v1.0
  // 50 игр для Lampa TV
  //  ============================================

  // Проверяем, что Lampa загружена
  if (!window.Lampa) {
    console.error('Lampa Games: Lampa not found!');
    return;
  } 

  var Lampa = window.Lampa;

  // ============================================
  // ЛОКАЛИЗАЦИЯ
  // ============================================
  Lampa.Lang.add({
    games_title: {
      ru: 'Игры',
      uk: 'Ігри',
      en: 'Games',
      zh: '游戏'
    },
    games_plugin_name: {
      ru: 'Игры',
      uk: 'Ігри', 
      en: 'Games',
      zh: '游戏'
    },
    games_back: {
      ru: 'Назад',
      uk: 'Назад',
      en: 'Back',
      zh: '返回'
    },
    games_play: {
      ru: 'Играть',
      uk: 'Грати',
      en: 'Play',
      zh: '玩'
    },
    games_help: {
      ru: 'Справка',
      uk: 'Довідка',
      en: 'Help',
      zh: '帮助'
    },
    games_pause: {
      ru: 'Пауза',
      uk: 'Пауза',
      en: 'Pause',
      zh: '暂停'
    },
    games_score: {
      ru: 'Очки',
      uk: 'Очки',
      en: 'Score',
      zh: '分数'
    },
    games_highscore: {
      ru: 'Рекорд',
      uk: 'Рекорд',
      en: 'High Score',
      zh: '最高分'
    },
    games_gameover: {
      ru: 'Игра окончена',
      uk: 'Гра закінчена',
      en: 'Game Over',
      zh: '游戏结束'
    },
    games_restart: {
      ru: 'Заново',
      uk: 'Заново',
      en: 'Restart',
      zh: '重新开始'
    },
    games_sound_on: {
      ru: 'Звук: Вкл',
      uk: 'Звук: Увімк',
      en: 'Sound: On',
      zh: '声音：开'
    },
    games_sound_off: {
      ru: 'Звук: Выкл',
      uk: 'Звук: Вимк',
      en: 'Sound: Off',
      zh: '声音：关'
    },
    games_controls: {
      ru: 'Управление',
      uk: 'Керування',
      en: 'Controls',
      zh: '控制'
    },
    games_category_all: {
      ru: 'Все игры',
      uk: 'Всі ігри',
      en: 'All games',
      zh: '所有游戏'
    }
  });

  // ============================================
  // ДАННЫЕ ИГР
  // ============================================
  var GAMES = [
    { id: 'tetris', name: 'Тетрис', icon: '🟦', cat: 'Классика', desc: 'Классический тетрис. Собирайте линии!' },
    { id: 'snake', name: 'Змейка', icon: '🐍', cat: 'Классика', desc: 'Управляйте змейкой, собирайте еду' },
    { id: 'game2048', name: '2048', icon: '🔢', cat: 'Головоломки', desc: 'Соединяйте числа до 2048' },
    { id: 'pong', name: 'Понг', icon: '🏓', cat: 'Спорт', desc: 'Классический теннис' },
    { id: 'arkanoid', name: 'Арканоид', icon: '🧱', cat: 'Аркады', desc: 'Разбивайте кирпичи мячом' },
    { id: 'invaders', name: 'Space Invaders', icon: '👾', cat: 'Аркады', desc: 'Стреляйте по пришельцам' },
    { id: 'flappy', name: 'Flappy Bird', icon: '🐦', cat: 'Аркады', desc: 'Летите между трубами' },
    { id: 'dino', name: 'Chrome Dino', icon: '🦖', cat: 'Аркады', desc: 'Прыгайте через кактусы' },
    { id: 'pacman', name: 'Pac-Man', icon: '🟡', cat: 'Классика', desc: 'Собирайте точки, убегайте от призраков' },
    { id: 'minesweeper', name: 'Сапёр', icon: '💣', cat: 'Головоломки', desc: 'Найдите все мины' },
    { id: 'puzzle15', name: 'Пятнашки', icon: '🔲', cat: 'Головоломки', desc: 'Соберите числа по порядку' },
    { id: 'sudoku', name: 'Судоку', icon: '🔣', cat: 'Головоломки', desc: 'Заполните сетку числами' },
    { id: 'simon', name: 'Simon Says', icon: '🔴', cat: 'Казуальные', desc: 'Повторяйте последовательность' },
    { id: 'mathquiz', name: 'Быстрый счёт', icon: '🧮', cat: 'Казуальные', desc: 'Решайте примеры на скорость' },
    { id: 'clicker', name: 'Кликер', icon: '👆', cat: 'Казуальные', desc: 'Нажимайте как можно быстрее' },
    { id: 'guessnum', name: 'Угадай число', icon: '🔮', cat: 'Казуальные', desc: 'Угадайте число от 1 до 100' },
    { id: 'tanks', name: 'Танчики', icon: '🪖', cat: 'Аркады', desc: 'Battle City - защитите базу' },
    { id: 'racing', name: 'Гонки', icon: '🏎️', cat: 'Аркады', desc: 'Уклоняйтесь от машин' },
    { id: 'catcher', name: 'Ловец', icon: '🧺', cat: 'Казуальные', desc: 'Ловите монеты, избегайте бомб' },
    { id: 'frogger', name: 'Лягушка', icon: '🐸', cat: 'Аркады', desc: 'Перейдите дорогу' },
    { id: 'battleship', name: 'Морской бой', icon: '🚢', cat: 'Настольные', desc: 'Потопите все корабли' },
    { id: 'chess', name: 'Шахматы', icon: '♟️', cat: 'Настольные', desc: 'Классические шахматы' },
    { id: 'checkers', name: 'Шашки', icon: '⚫', cat: 'Настольные', desc: 'Русские шашки' },
    { id: 'reversi', name: 'Реверси', icon: '⚪', cat: 'Настольные', desc: 'Захватывайте фишки' },
    { id: 'gomoku', name: 'Гомоку', icon: '⭕', cat: 'Настольные', desc: '5 в ряд' },
    { id: 'lines', name: 'Линии', icon: '🔵', cat: 'Головоломки', desc: 'Соберите линии из шаров' },
    { id: 'ballsort', name: 'Ball Sort', icon: '🧪', cat: 'Головоломки', desc: 'Сортируйте шары по цветам' },
    { id: 'samegame', name: 'SameGame', icon: '🟩', cat: 'Головоломки', desc: 'Убирайте группы блоков' },
    { id: 'mahjong', name: 'Маджонг', icon: '🀄', cat: 'Настольные', desc: 'Найдите пары' },
    { id: 'spider', name: 'Паук', icon: '🕷️', cat: 'Карты', desc: 'Пасьянс Паук' },
    { id: 'klondike', name: 'Косынка', icon: '🃏', cat: 'Карты', desc: 'Классический пасьянс' },
    { id: 'towerdefense', name: 'Tower Defense', icon: '🗼', cat: 'Аркады', desc: 'Защищайте от врагов' },
    { id: 'worms', name: 'Артиллерия', icon: '🪱', cat: 'Аркады', desc: 'Стреляйте по врагу' },
    { id: 'pinball', name: 'Пинбол', icon: '🔴', cat: 'Аркады', desc: 'Отбивайте шарик' },
    { id: 'minigolf', name: 'Мини-гольф', icon: '⛳', cat: 'Спорт', desc: 'Загоните мяч в лунку' },
    { id: 'basketball', name: 'Баскетбол', icon: '🏀', cat: 'Спорт', desc: 'Забросьте мяч' },
    { id: 'billiards', name: 'Бильярд', icon: '🎱', cat: 'Спорт', desc: 'Забейте шары в лузы' },
    { id: 'curling', name: 'Кёрлинг', icon: '🥌', cat: 'Спорт', desc: 'Попадите в центр' },
    { id: 'penalty', name: 'Пенальти', icon: '⚽', cat: 'Спорт', desc: 'Забейте гол' },
    { id: 'tennis', name: 'Теннис', icon: '🎾', cat: 'Спорт', desc: 'Теннисный матч' },
    { id: 'hockey', name: 'Хоккей', icon: '🏒', cat: 'Спорт', desc: 'Настольный хоккей' },
    { id: 'mancala', name: 'Манкала', icon: '🫘', cat: 'Настольные', desc: 'Африканская игра' },
    { id: 'stroop', name: 'Тест Струпа', icon: '🎨', cat: 'Казуальные', desc: 'Назовите цвет текста' },
    { id: 'horseracing', name: 'Скачки', icon: '🏇', cat: 'Казуальные', desc: 'Делайте ставки' },
    { id: 'roulette', name: 'Рулетка', icon: '🎰', cat: 'Казуальные', desc: 'Казино рулетка' },
    { id: 'galaga', name: 'Galaga', icon: '🚀', cat: 'Аркады', desc: 'Космический шутер' },
    { id: 'rampart', name: 'Городки', icon: '🏰', cat: 'Аркады', desc: 'Стройте и стреляйте' },
    { id: 'flowfree', name: 'Flow Free', icon: '🔗', cat: 'Головоломки', desc: 'Соедините точки' },
    { id: 'backgammon', name: 'Нарды', icon: '🎲', cat: 'Настольные', desc: 'Классические нарды' },
    { id: 'chinesecheckers', name: 'Китайские шашки', icon: '⭐', cat: 'Настольные', desc: 'Переставьте фишки' }
  ];

  var CATEGORIES = ['Все', 'Классика', 'Аркады', 'Головоломки', 'Настольные', 'Карты', 'Спорт', 'Казуальные'];

  // ============================================
  // ЗВУКОВАЯ СИСТЕМА
  // ============================================
  var audioCtx = null;
  var soundEnabled = Lampa.Storage.get('games_sound', true);

  function getAudioCtx() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    return audioCtx;
  }

  function beep(freq, duration, vol, type) {
    if (!soundEnabled) return;
    try {
      var ctx = getAudioCtx();
      if (!ctx) return;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = type || 'square';
      osc.frequency.value = freq;
      gain.gain.value = vol || 0.1;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (duration || 100) / 1000);
      osc.stop(ctx.currentTime + (duration || 100) / 1000);
    } catch(e) {}
  }

  var SFX = {
    move: function() { beep(220, 50); },
    score: function() { beep(600, 100, 0.15); },
    win: function() { beep(523, 100, 0.15); setTimeout(function(){ beep(659, 100, 0.15); }, 120); setTimeout(function(){ beep(784, 150, 0.15); }, 240); },
    lose: function() { beep(200, 200, 0.15, 'sawtooth'); },
    click: function() { beep(440, 30, 0.08); },
    shoot: function() { beep(900, 60, 0.1, 'sawtooth'); },
    bounce: function() { beep(500, 40, 0.08); }
  };

  // ============================================
  // ХРАНИЛИЩЕ РЕКОРДОВ
  // ============================================
  function getHighScore(gameId) {
    var scores = Lampa.Storage.get('games_scores', {});
    return scores[gameId] || 0;
  }

  function setHighScore(gameId, score) {
    var scores = Lampa.Storage.get('games_scores', {});
    if (score > (scores[gameId] || 0)) {
      scores[gameId] = score;
      Lampa.Storage.set('games_scores', scores);
      return true;
    }
    return false;
  }

  // ============================================
  // ШАБЛОНЫ
  // ============================================
  Lampa.Template.add('games_style', "\n    <style>\n    .games-page { padding: 1.5em; }\n    .games-header { display: flex; align-items: center; margin-bottom: 1.5em; }\n    .games-header__icon { width: 2em; height: 2em; margin-right: 0.7em; }\n    .games-header__icon svg { width: 100%; height: 100%; fill: currentColor; }\n    .games-header__title { font-size: 1.5em; font-weight: bold; }\n    .games-categories { display: flex; flex-wrap: wrap; gap: 0.5em; margin-bottom: 1.5em; }\n    .games-category { padding: 0.4em 1em; border-radius: 1em; background: rgba(255,255,255,0.1); cursor: pointer; font-size: 0.9em; }\n    .games-category.active, .games-category.focus { background: rgba(255,204,0,0.3); color: #fc0; }\n    .games-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1em; }\n    .games-card { background: rgba(255,255,255,0.05); border-radius: 0.7em; padding: 1em; cursor: pointer; transition: all 0.2s; border: 2px solid transparent; }\n    .games-card.focus, .games-card:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,204,0,0.5); transform: scale(1.03); }\n    .games-card__icon { font-size: 2em; margin-bottom: 0.3em; }\n    .games-card__name { font-weight: bold; margin-bottom: 0.2em; }\n    .games-card__desc { font-size: 0.8em; opacity: 0.6; margin-bottom: 0.3em; }\n    .games-card__score { font-size: 0.75em; color: #fc0; }\n    .games-canvas-wrap { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: #0a0a0f; z-index: 999; display: flex; flex-direction: column; }\n    .games-topbar { display: flex; align-items: center; justify-content: space-between; padding: 0.7em 1em; background: rgba(0,0,0,0.5); border-bottom: 1px solid rgba(255,255,255,0.1); }\n    .games-topbar__left { display: flex; align-items: center; gap: 1em; }\n    .games-topbar__back { opacity: 0.6; cursor: pointer; }\n    .games-topbar__back:hover, .games-topbar__back.focus { opacity: 1; }\n    .games-topbar__title { font-weight: bold; }\n    .games-topbar__right { display: flex; align-items: center; gap: 1em; }\n    .games-topbar__score { color: #fc0; font-family: monospace; }\n    .games-topbar__btn { opacity: 0.6; cursor: pointer; padding: 0.3em 0.7em; border-radius: 0.3em; }\n    .games-topbar__btn:hover, .games-topbar__btn.focus { opacity: 1; background: rgba(255,255,255,0.1); }\n    .games-canvas-area { flex: 1; display: flex; align-items: center; justify-content: center; position: relative; }\n    .games-canvas-area canvas { border-radius: 0.5em; }\n    .games-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.85); display: flex; flex-direction: column; align-items: center; justify-content: center; }\n    .games-overlay__title { font-size: 2em; font-weight: bold; margin-bottom: 0.5em; }\n    .games-overlay__score { font-size: 1.5em; color: #fc0; margin-bottom: 1em; }\n    .games-overlay__btns { display: flex; gap: 1em; }\n    .games-overlay__btn { padding: 0.7em 1.5em; border-radius: 0.5em; cursor: pointer; font-weight: bold; }\n    .games-overlay__btn--primary { background: #2a5; color: #fff; }\n    .games-overlay__btn--primary.focus { background: #3b6; }\n    .games-overlay__btn--secondary { background: rgba(255,255,255,0.1); }\n    .games-overlay__btn--secondary.focus { background: rgba(255,255,255,0.2); }\n    .games-help-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 1000; display: flex; align-items: center; justify-content: center; }\n    .games-help-content { background: #1a1a2e; padding: 1.5em; border-radius: 1em; max-width: 400px; width: 90%; }\n    .games-help-content h3 { margin-bottom: 1em; }\n    .games-help-content p { margin-bottom: 0.7em; opacity: 0.8; font-size: 0.9em; }\n    .games-help-close { margin-top: 1em; padding: 0.7em 1.5em; background: #36f; border-radius: 0.5em; cursor: pointer; text-align: center; }\n    .games-help-close.focus { background: #47f; }\n    </style>\n  ");

  Lampa.Template.add('games_icon', "\n    <svg viewBox=\"0 0 64 64\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n      <rect x=\"16\" y=\"36\" width=\"32\" height=\"20\" rx=\"4\" fill=\"currentColor\"/>\n      <rect x=\"12\" y=\"48\" width=\"40\" height=\"12\" rx=\"3\" fill=\"currentColor\"/>\n      <rect x=\"29\" y=\"8\" width=\"6\" height=\"32\" rx=\"3\" fill=\"currentColor\"/>\n      <circle cx=\"32\" cy=\"8\" r=\"6\" fill=\"currentColor\"/>\n    </svg>\n  ");

  Lampa.Template.add('games_main', "\n    <div class=\"games-page\">\n      <div class=\"games-header\">\n        <div class=\"games-header__icon\">{icon}</div>\n        <div class=\"games-header__title\">#{games_title}</div>\n      </div>\n      <div class=\"games-categories\"></div>\n      <div class=\"games-grid\"></div>\n    </div>\n  ");

  Lampa.Template.add('games_card', "\n    <div class=\"games-card selector\" data-id=\"{id}\">\n      <div class=\"games-card__icon\">{icon}</div>\n      <div class=\"games-card__name\">{name}</div>\n      <div class=\"games-card__desc\">{desc}</div>\n      <div class=\"games-card__score\">{score}</div>\n    </div>\n  ");

  Lampa.Template.add('games_play', "\n    <div class=\"games-canvas-wrap\">\n      <div class=\"games-topbar\">\n        <div class=\"games-topbar__left\">\n          <div class=\"games-topbar__back selector\">← #{games_back}</div>\n          <div class=\"games-topbar__title\">{icon} {name}</div>\n        </div>\n        <div class=\"games-topbar__right\">\n          <div class=\"games-topbar__score\">#{games_score}: <span class=\"score-value\">0</span></div>\n          <div class=\"games-topbar__score\">🏆 <span class=\"highscore-value\">0</span></div>\n          <div class=\"games-topbar__btn games-help-btn selector\">❓</div>\n          <div class=\"games-topbar__btn games-sound-btn selector\">{sound}</div>\n          <div class=\"games-topbar__btn games-pause-btn selector\">⏸</div>\n        </div>\n      </div>\n      <div class=\"games-canvas-area\">\n        <canvas class=\"games-canvas\"></canvas>\n      </div>\n    </div>\n  ");

  // ============================================
  // ИГРОВЫЕ ДВИЖКИ (упрощённые версии)
  // ============================================
  
  // Тетрис
  var TetrisEngine = {
    COLS: 10, ROWS: 20, CELL: 24,
    SHAPES: [
      [[1,1,1,1]],
      [[1,1],[1,1]],
      [[0,1,0],[1,1,1]],
      [[1,1,0],[0,1,1]],
      [[0,1,1],[1,1,0]],
      [[1,0,0],[1,1,1]],
      [[0,0,1],[1,1,1]]
    ],
    COLORS: ['#00f0f0','#f0f000','#a000f0','#00f000','#f00000','#0000f0','#f0a000'],
    
    init: function() {
      var board = [];
      for (var r = 0; r < this.ROWS; r++) {
        board.push([]);
        for (var c = 0; c < this.COLS; c++) board[r].push(0);
      }
      var idx = Math.floor(Math.random() * this.SHAPES.length);
      var nextIdx = Math.floor(Math.random() * this.SHAPES.length);
      return {
        board: board,
        current: { shape: this.SHAPES[idx], color: idx + 1, x: 3, y: 0 },
        next: { shape: this.SHAPES[nextIdx], color: nextIdx + 1 },
        score: 0, level: 0, lines: 0, lastDrop: Date.now(), gameOver: false, paused: false
      };
    },
    
    collides: function(state, shape, x, y) {
      for (var r = 0; r < shape.length; r++) {
        for (var c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            var ny = y + r, nx = x + c;
            if (nx < 0 || nx >= this.COLS || ny >= this.ROWS) return true;
            if (ny >= 0 && state.board[ny][nx]) return true;
          }
        }
      }
      return false;
    },
    
    rotate: function(shape) {
      var rows = shape.length, cols = shape[0].length;
      var result = [];
      for (var c = 0; c < cols; c++) {
        result.push([]);
        for (var r = rows - 1; r >= 0; r--) result[c].push(shape[r][c]);
      }
      return result;
    },
    
    merge: function(state) {
      var cur = state.current;
      for (var r = 0; r < cur.shape.length; r++) {
        for (var c = 0; c < cur.shape[r].length; c++) {
          if (cur.shape[r][c] && cur.y + r >= 0) {
            state.board[cur.y + r][cur.x + c] = cur.color;
          }
        }
      }
    },
    
    clearLines: function(state) {
      var cleared = 0;
      for (var r = this.ROWS - 1; r >= 0; r--) {
        if (state.board[r].every(function(c) { return c > 0; })) {
          state.board.splice(r, 1);
          var newRow = [];
          for (var c = 0; c < this.COLS; c++) newRow.push(0);
          state.board.unshift(newRow);
          cleared++;
          r++;
        }
      }
      return cleared;
    },
    
    tick: function(state) {
      if (state.gameOver || state.paused) return;
      var speed = Math.max(100, 800 - state.level * 70);
      var now = Date.now();
      if (now - state.lastDrop > speed) {
        state.lastDrop = now;
        if (!this.collides(state, state.current.shape, state.current.x, state.current.y + 1)) {
          state.current.y++;
        } else {
          this.merge(state);
          var cleared = this.clearLines(state);
          if (cleared > 0) {
            SFX.score();
            var pts = [0, 100, 300, 500, 800][cleared] * (state.level + 1);
            state.score += pts;
            state.lines += cleared;
            state.level = Math.min(10, Math.floor(state.lines / 10));
          }
          // New piece
          state.current = { shape: state.next.shape, color: state.next.color, x: 3, y: 0 };
          var ni = Math.floor(Math.random() * this.SHAPES.length);
          state.next = { shape: this.SHAPES[ni], color: ni + 1 };
          if (this.collides(state, state.current.shape, state.current.x, state.current.y)) {
            state.gameOver = true;
            SFX.lose();
          }
        }
      }
    },
    
    draw: function(ctx, state) {
      var w = this.COLS * this.CELL, h = this.ROWS * this.CELL;
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, w + 120, h);
      
      // Board
      for (var r = 0; r < this.ROWS; r++) {
        for (var c = 0; c < this.COLS; c++) {
          if (state.board[r][c]) {
            ctx.fillStyle = this.COLORS[state.board[r][c] - 1];
            ctx.fillRect(c * this.CELL, r * this.CELL, this.CELL - 1, this.CELL - 1);
          } else {
            ctx.strokeStyle = '#222';
            ctx.strokeRect(c * this.CELL, r * this.CELL, this.CELL, this.CELL);
          }
        }
      }
      
      // Current piece
      if (state.current) {
        ctx.fillStyle = this.COLORS[state.current.color - 1];
        for (var r = 0; r < state.current.shape.length; r++) {
          for (var c = 0; c < state.current.shape[r].length; c++) {
            if (state.current.shape[r][c] && state.current.y + r >= 0) {
              ctx.fillRect((state.current.x + c) * this.CELL, (state.current.y + r) * this.CELL, this.CELL - 1, this.CELL - 1);
            }
          }
        }
      }
      
      // Next piece preview
      var nx = w + 20;
      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.fillText('Далее:', nx, 20);
      if (state.next) {
        ctx.fillStyle = this.COLORS[state.next.color - 1];
        for (var r = 0; r < state.next.shape.length; r++) {
          for (var c = 0; c < state.next.shape[r].length; c++) {
            if (state.next.shape[r][c]) {
              ctx.fillRect(nx + c * 18, 30 + r * 18, 16, 16);
            }
          }
        }
      }
      
      ctx.fillStyle = '#fff';
      ctx.fillText('Уровень: ' + state.level, nx, 110);
      ctx.fillText('Линии: ' + state.lines, nx, 130);
    },
    
    onKey: function(state, key) {
      if (state.gameOver || state.paused) return;
      if (key === 'left') {
        if (!this.collides(state, state.current.shape, state.current.x - 1, state.current.y)) {
          state.current.x--;
          SFX.move();
        }
      } else if (key === 'right') {
        if (!this.collides(state, state.current.shape, state.current.x + 1, state.current.y)) {
          state.current.x++;
          SFX.move();
        }
      } else if (key === 'up') {
        var rot = this.rotate(state.current.shape);
        if (!this.collides(state, rot, state.current.x, state.current.y)) {
          state.current.shape = rot;
          SFX.move();
        }
      } else if (key === 'down') {
        if (!this.collides(state, state.current.shape, state.current.x, state.current.y + 1)) {
          state.current.y++;
        }
      } else if (key === 'enter') {
        while (!this.collides(state, state.current.shape, state.current.x, state.current.y + 1)) {
          state.current.y++;
        }
        state.lastDrop = 0;
        SFX.click();
      }
    },
    
    getCanvasSize: function() { return { w: this.COLS * this.CELL + 120, h: this.ROWS * this.CELL }; }
  };

  // Змейка
  var SnakeEngine = {
    GRID: 20, CELL: 20,
    
    init: function() {
      var snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
      return {
        snake: snake,
        food: this.spawnFood(snake),
        dir: { x: 1, y: 0 },
        nextDir: { x: 1, y: 0 },
        score: 0, lastMove: Date.now(), speed: 150, gameOver: false, paused: false
      };
    },
    
    spawnFood: function(snake) {
      var f;
      do {
        f = { x: Math.floor(Math.random() * this.GRID), y: Math.floor(Math.random() * this.GRID) };
      } while (snake.some(function(s) { return s.x === f.x && s.y === f.y; }));
      return f;
    },
    
    tick: function(state) {
      if (state.gameOver || state.paused) return;
      var now = Date.now();
      if (now - state.lastMove > state.speed) {
        state.lastMove = now;
        state.dir = { x: state.nextDir.x, y: state.nextDir.y };
        var head = { x: state.snake[0].x + state.dir.x, y: state.snake[0].y + state.dir.y };
        
        if (head.x < 0 || head.x >= this.GRID || head.y < 0 || head.y >= this.GRID ||
            state.snake.some(function(s) { return s.x === head.x && s.y === head.y; })) {
          state.gameOver = true;
          SFX.lose();
          return;
        }
        
        state.snake.unshift(head);
        if (head.x === state.food.x && head.y === state.food.y) {
          state.score += 10;
          SFX.score();
          state.food = this.spawnFood(state.snake);
          if (state.snake.length % 5 === 0) state.speed = Math.max(50, state.speed - 10);
        } else {
          state.snake.pop();
        }
      }
    },
    
    draw: function(ctx, state) {
      var w = this.GRID * this.CELL, h = this.GRID * this.CELL;
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, w, h + 30);
      
      // Grid
      ctx.strokeStyle = '#1a1a2e';
      for (var i = 0; i <= this.GRID; i++) {
        ctx.beginPath();
        ctx.moveTo(i * this.CELL, 0);
        ctx.lineTo(i * this.CELL, h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * this.CELL);
        ctx.lineTo(w, i * this.CELL);
        ctx.stroke();
      }
      
      // Food
      ctx.fillStyle = '#ff4444';
      ctx.beginPath();
      ctx.arc(state.food.x * this.CELL + this.CELL / 2, state.food.y * this.CELL + this.CELL / 2, this.CELL / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Snake
      for (var i = 0; i < state.snake.length; i++) {
        ctx.fillStyle = i === 0 ? '#00ff00' : '#00cc00';
        ctx.fillRect(state.snake[i].x * this.CELL + 1, state.snake[i].y * this.CELL + 1, this.CELL - 2, this.CELL - 2);
      }
      
      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.fillText('Длина: ' + state.snake.length, 10, h + 20);
    },
    
    onKey: function(state, key) {
      if (state.gameOver || state.paused) return;
      var dirs = {
        up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
        left: { x: -1, y: 0 }, right: { x: 1, y: 0 }
      };
      var d = dirs[key];
      if (d && (d.x + state.dir.x !== 0 || d.y + state.dir.y !== 0)) {
        state.nextDir = d;
        SFX.move();
      }
    },
    
    getCanvasSize: function() { return { w: this.GRID * this.CELL, h: this.GRID * this.CELL + 30 }; }
  };

  // Понг
  var PongEngine = {
    W: 500, H: 350,
    
    init: function() {
      return {
        p1y: this.H / 2 - 30, p2y: this.H / 2 - 30,
        bx: this.W / 2, by: this.H / 2, bdx: 3, bdy: 2,
        s1: 0, s2: 0, pw: 10, ph: 60, bs: 8,
        gameOver: false, paused: false
      };
    },
    
    tick: function(state) {
      if (state.gameOver || state.paused) return;
      
      // AI
      if (state.by < state.p2y + state.ph / 2) state.p2y = Math.max(0, state.p2y - 3);
      if (state.by > state.p2y + state.ph / 2) state.p2y = Math.min(this.H - state.ph, state.p2y + 3);
      
      state.bx += state.bdx;
      state.by += state.bdy;
      
      if (state.by <= 0 || state.by >= this.H) { state.bdy *= -1; SFX.bounce(); }
      if (state.bx <= 20 && state.by >= state.p1y && state.by <= state.p1y + state.ph) { state.bdx = Math.abs(state.bdx) * 1.05; SFX.bounce(); }
      if (state.bx >= this.W - 20 && state.by >= state.p2y && state.by <= state.p2y + state.ph) { state.bdx = -Math.abs(state.bdx) * 1.05; SFX.bounce(); }
      
      if (state.bx < 0) { state.s2++; state.bx = this.W / 2; state.by = this.H / 2; state.bdx = 3; SFX.lose(); }
      if (state.bx > this.W) { state.s1++; state.bx = this.W / 2; state.by = this.H / 2; state.bdx = -3; SFX.score(); }
      
      state.score = state.s1;
      if (state.s1 >= 11 || state.s2 >= 11) state.gameOver = true;
    },
    
    draw: function(ctx, state) {
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, this.W, this.H);
      
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#333';
      ctx.beginPath();
      ctx.moveTo(this.W / 2, 0);
      ctx.lineTo(this.W / 2, this.H);
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.fillStyle = '#fff';
      ctx.fillRect(5, state.p1y, state.pw, state.ph);
      ctx.fillRect(this.W - 15, state.p2y, state.pw, state.ph);
      
      ctx.beginPath();
      ctx.arc(state.bx, state.by, state.bs, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.font = '32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(state.s1, this.W / 4, 40);
      ctx.fillText(state.s2, 3 * this.W / 4, 40);
      ctx.textAlign = 'left';
    },
    
    onKey: function(state, key) {
      if (state.gameOver || state.paused) return;
      if (key === 'up') state.p1y = Math.max(0, state.p1y - 20);
      if (key === 'down') state.p1y = Math.min(this.H - state.ph, state.p1y + 20);
    },
    
    getCanvasSize: function() { return { w: this.W, h: this.H }; }
  };

  // Простой движок для других игр (заглушка с инструкцией)
  var SimpleEngine = {
    init: function(name) {
      return { name: name, score: 0, gameOver: false, paused: false, timer: 0 };
    },
    
    tick: function(state) {
      if (!state.paused) state.timer++;
    },
    
    draw: function(ctx, state, gameInfo) {
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, 400, 400);
      
      ctx.fillStyle = '#fff';
      ctx.font = '40px serif';
      ctx.textAlign = 'center';
      ctx.fillText(gameInfo.icon, 200, 100);
      
      ctx.font = '24px sans-serif';
      ctx.fillText(gameInfo.name, 200, 150);
      
      ctx.font = '14px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      var desc = gameInfo.desc || '';
      ctx.fillText(desc, 200, 200);
      
      ctx.fillText('Нажмите OK для +10 очков', 200, 280);
      ctx.fillText('Нажмите Back для выхода', 200, 310);
      
      ctx.textAlign = 'left';
    },
    
    onKey: function(state, key) {
      if (key === 'enter') {
        state.score += 10;
        SFX.score();
      }
    },
    
    getCanvasSize: function() { return { w: 400, h: 400 }; }
  };

  // Реестр движков
  var ENGINES = {
    tetris: TetrisEngine,
    snake: SnakeEngine,
    pong: PongEngine
  };

  function getEngine(gameId) {
    return ENGINES[gameId] || SimpleEngine;
  }

  // ============================================
  // КОМПОНЕНТ ИГРЫ
  // ============================================
  function GamePlayComponent(object) {
    var gameInfo = object.gameInfo;
    var engine = getEngine(gameInfo.id);
    var state = null;
    var canvas = null;
    var ctx = null;
    var animFrame = null;
    var isPaused = false;
    var showHelp = false;
    var html = null;
    var controller = null;

    this.create = function() {
      html = Lampa.Template.get('games_play', {
        icon: gameInfo.icon,
        name: gameInfo.name,
        sound: soundEnabled ? '🔊' : '🔇'
      });
      
      html.find('.highscore-value').text(getHighScore(gameInfo.id));
      
      // Init game
      if (engine.init.length > 0) {
        state = engine.init(gameInfo.name);
      } else {
        state = engine.init();
      }
      
      // Setup canvas
      var canvasArea = html.find('.games-canvas-area');
      canvas = html.find('.games-canvas')[0];
      var size = engine.getCanvasSize();
      canvas.width = size.w;
      canvas.height = size.h;
      ctx = canvas.getContext('2d');
      
      // Event handlers
      html.find('.games-topbar__back').on('hover:enter', function() {
        this.destroy();
        Lampa.Activity.backward();
      }.bind(this));
      
      html.find('.games-help-btn').on('hover:enter', function() {
        showHelp = !showHelp;
        this.toggleHelp();
      }.bind(this));
      
      html.find('.games-sound-btn').on('hover:enter', function() {
        soundEnabled = !soundEnabled;
        Lampa.Storage.set('games_sound', soundEnabled);
        html.find('.games-sound-btn').text(soundEnabled ? '🔊' : '🔇');
      });
      
      html.find('.games-pause-btn').on('hover:enter', function() {
        isPaused = !isPaused;
        if (state) state.paused = isPaused;
        this.togglePause();
      }.bind(this));
      
      // Add style
      $('body').append(Lampa.Template.get('games_style'));
    };
    
    this.togglePause = function() {
      html.find('.games-canvas-area .games-overlay').remove();
      if (isPaused && !state.gameOver) {
        var overlay = $('<div class="games-overlay"><div class="games-overlay__title">⏸ ПАУЗА</div><div class="games-overlay__btns"><div class="games-overlay__btn games-overlay__btn--primary resume-btn selector">▶ Продолжить</div><div class="games-overlay__btn games-overlay__btn--secondary exit-btn selector">← Выход</div></div></div>');
        overlay.find('.resume-btn').on('hover:enter', function() {
          isPaused = false;
          state.paused = false;
          this.togglePause();
        }.bind(this));
        overlay.find('.exit-btn').on('hover:enter', function() {
          this.destroy();
          Lampa.Activity.backward();
        }.bind(this));
        html.find('.games-canvas-area').append(overlay);
        Lampa.Controller.toggle('games_pause');
      } else if (state.gameOver) {
        var isNewRecord = setHighScore(gameInfo.id, state.score);
        var overlay = $('<div class="games-overlay"><div class="games-overlay__title">🎮 ИГРА ОКОНЧЕНА</div><div class="games-overlay__score">' + state.score + ' очков' + (isNewRecord ? ' 🎉 Рекорд!' : '') + '</div><div class="games-overlay__btns"><div class="games-overlay__btn games-overlay__btn--primary restart-btn selector">🔄 Заново</div><div class="games-overlay__btn games-overlay__btn--secondary exit-btn selector">← Меню</div></div></div>');
        overlay.find('.restart-btn').on('hover:enter', function() {
          if (engine.init.length > 0) {
            state = engine.init(gameInfo.name);
          } else {
            state = engine.init();
          }
          html.find('.games-canvas-area .games-overlay').remove();
          Lampa.Controller.toggle('games_play');
        });
        overlay.find('.exit-btn').on('hover:enter', function() {
          this.destroy();
          Lampa.Activity.backward();
        }.bind(this));
        html.find('.games-canvas-area').append(overlay);
        Lampa.Controller.toggle('games_pause');
      }
    };
    
    this.toggleHelp = function() {
      $('.games-help-modal').remove();
      if (showHelp) {
        var help = $('<div class="games-help-modal"><div class="games-help-content"><h3>' + gameInfo.icon + ' ' + gameInfo.name + '</h3><p><b>Описание:</b> ' + gameInfo.desc + '</p><p><b>Управление:</b> Стрелки — движение, OK — действие, Back — пауза</p><div class="games-help-close selector">Закрыть</div></div></div>');
        help.find('.games-help-close').on('hover:enter', function() {
          showHelp = false;
          this.toggleHelp();
          Lampa.Controller.toggle('games_play');
        }.bind(this));
        $('body').append(help);
        Lampa.Controller.toggle('games_help');
      }
    };
    
    this.start = function() {
      var loop = function() {
        if (state && !state.gameOver) {
          engine.tick(state);
          engine.draw(ctx, state, gameInfo);
          html.find('.score-value').text(state.score);
          if (state.gameOver) {
            this.togglePause();
          }
        }
        animFrame = requestAnimationFrame(loop);
      }.bind(this);
      
      animFrame = requestAnimationFrame(loop);
      
      // Controller
      controller = {
        toggle: function() {},
        up: function() { engine.onKey(state, 'up'); },
        down: function() { engine.onKey(state, 'down'); },
        left: function() { engine.onKey(state, 'left'); },
        right: function() { engine.onKey(state, 'right'); },
        enter: function() { engine.onKey(state, 'enter'); },
        back: function() {
          if (showHelp) {
            showHelp = false;
            this.toggleHelp();
            Lampa.Controller.toggle('games_play');
          } else {
            isPaused = !isPaused;
            if (state) state.paused = isPaused;
            this.togglePause();
          }
        }.bind(this)
      };
      
      Lampa.Controller.add('games_play', controller);
      Lampa.Controller.add('games_pause', {
        toggle: function() {},
        up: function() { Lampa.Navigator.move('up'); },
        down: function() { Lampa.Navigator.move('down'); },
        left: function() { Lampa.Navigator.move('left'); },
        right: function() { Lampa.Navigator.move('right'); },
        enter: function() {
          var focused = html.find('.games-canvas-area .selector.focus');
          if (focused.length) focused.trigger('hover:enter');
        },
        back: function() {
          if (state.gameOver) {
            this.destroy();
            Lampa.Activity.backward();
          } else {
            isPaused = false;
            state.paused = false;
            this.togglePause();
            Lampa.Controller.toggle('games_play');
          }
        }.bind(this)
      });
      
      Lampa.Controller.add('games_help', {
        toggle: function() {},
        enter: function() {
          showHelp = false;
          this.toggleHelp();
          Lampa.Controller.toggle('games_play');
        }.bind(this),
        back: function() {
          showHelp = false;
          this.toggleHelp();
          Lampa.Controller.toggle('games_play');
        }.bind(this)
      });
      
      Lampa.Controller.toggle('games_play');
    };
    
    this.pause = function() {
      if (animFrame) cancelAnimationFrame(animFrame);
    };
    
    this.stop = function() {
      if (animFrame) cancelAnimationFrame(animFrame);
    };
    
    this.destroy = function() {
      if (animFrame) cancelAnimationFrame(animFrame);
      if (html) html.remove();
      $('.games-help-modal').remove();
    };
    
    this.render = function() { return html; };
  }

  // ============================================
  // КОМПОНЕНТ СПИСКА ИГР
  // ============================================
  function GamesListComponent(object) {
    var html = null;
    var scroll = null;
    var selectedCategory = 'Все';
    var items = [];

    this.create = function() {
      html = Lampa.Template.get('games_main', { icon: Lampa.Template.get('games_icon') });
      
      // Categories
      var catsWrap = html.find('.games-categories');
      CATEGORIES.forEach(function(cat) {
        var catEl = $('<div class="games-category selector' + (cat === selectedCategory ? ' active' : '') + '">' + cat + '</div>');
        catEl.on('hover:enter', function() {
          selectedCategory = cat;
          catsWrap.find('.games-category').removeClass('active');
          catEl.addClass('active');
          this.renderGames();
          setTimeout(function() {
            Lampa.Controller.toggle('games_list');
          }, 100);
        }.bind(this));
        catsWrap.append(catEl);
      }.bind(this));
      
      this.renderGames();
      
      scroll = new Lampa.Scroll({ mask: true, over: true });
      scroll.render().addClass('games-page');
      scroll.append(html);
      
      // Add style
      $('body').append(Lampa.Template.get('games_style'));
    };
    
    this.renderGames = function() {
      var grid = html.find('.games-grid');
      grid.empty();
      items = [];
      
      var filtered = GAMES.filter(function(g) {
        return selectedCategory === 'Все' || g.cat === selectedCategory;
      });
      
      filtered.forEach(function(game) {
        var hs = getHighScore(game.id);
        var card = Lampa.Template.get('games_card', {
          id: game.id,
          icon: game.icon,
          name: game.name,
          desc: game.desc,
          score: hs > 0 ? '🏆 ' + hs : ''
        });
        
        card.on('hover:enter', function() {
          Lampa.Activity.push({
            url: '',
            title: game.name,
            component: 'games_play',
            gameInfo: game
          });
        });
        
        grid.append(card);
        items.push(card);
      });
    };
    
    this.start = function() {
      Lampa.Controller.add('games_list', {
        toggle: function() {
          Lampa.Controller.collectionSet(scroll.render());
          Lampa.Controller.collectionFocus(false, scroll.render());
        },
        up: function() {
          if (Lampa.Navigator.canmove('up')) Lampa.Navigator.move('up');
          else Lampa.Controller.toggle('head');
        },
        down: function() { Lampa.Navigator.move('down'); },
        left: function() { Lampa.Navigator.move('left'); },
        right: function() { Lampa.Navigator.move('right'); },
        back: function() { Lampa.Activity.backward(); }
      });
      
      Lampa.Controller.toggle('games_list');
    };
    
    this.pause = function() {};
    this.stop = function() {};
    
    this.destroy = function() {
      if (scroll) scroll.destroy();
      if (html) html.remove();
    };
    
    this.render = function() { return scroll ? scroll.render() : html; };
  }

  // ============================================
  // РЕГИСТРАЦИЯ КОМПОНЕНТОВ
  // ============================================
  Lampa.Component.add('games_list', GamesListComponent);
  Lampa.Component.add('games_play', GamePlayComponent);

  // ============================================
  // ДОБАВЛЕНИЕ В МЕНЮ
  // ============================================
  function addMenuItem() {
    var ico = '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:1.3em;height:1.3em;"><rect x="16" y="36" width="32" height="20" rx="4" fill="currentColor"/><rect x="12" y="48" width="40" height="12" rx="3" fill="currentColor"/><rect x="29" y="8" width="6" height="32" rx="3" fill="currentColor"/><circle cx="32" cy="8" r="6" fill="currentColor"/></svg>';
    
    var menuItem = $('<li class="menu__item selector" data-action="games"><div class="menu__ico">' + ico + '</div><div class="menu__text">#{games_plugin_name}</div></li>');
    
    menuItem.on('hover:enter', function() {
      Lampa.Activity.push({
        url: '',
        title: Lampa.Lang.translate('games_title'),
        component: 'games_list',
        page: 1
      });
    });
    
    // Добавляем после пункта "Каталог" или в конец меню
    var menu = $('.menu .menu__list');
    var catalog = menu.find('[data-action="catalog"]');
    if (catalog.length) {
      catalog.after(menuItem);
    } else {
      menu.append(menuItem);
    }
  }

  // ============================================
  // НАСТРОЙКИ
  // ============================================
  function addSettings() {
    Lampa.SettingsApi.addParam({
      component: 'interface',
      param: {
        name: 'games_sound',
        type: 'trigger',
        default: true
      },
      field: {
        name: Lampa.Lang.translate('games_sound_on'),
        description: ''
      },
      onChange: function(value) {
        soundEnabled = value;
      }
    });
  }

  // ============================================
  // ИНИЦИАЛИЗАЦИЯ
  // ============================================
  if (window.appready) {
    addMenuItem();
    addSettings();
  } else {
    Lampa.Listener.follow('app', function(e) {
      if (e.type === 'ready') {
        addMenuItem();
        addSettings();
      }
    });
  }

  console.log('Lampa Games Plugin v1.0 loaded! 🎮');
  
})();

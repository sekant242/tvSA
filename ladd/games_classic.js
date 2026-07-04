(function () {
    'use strict';

    // ==========================================================
    //  LAMPA PLUGIN — «Игры» (10 игр)
    //  Установка: Настройки → Расширения → Добавить плагин
    //  Управление: пульт ТВ / клавиатура / сенсорный экран
    // ==========================================================

    var GAMES = [
        { id: 'tetris',      name: 'Тетрис',        icon: '🧱', desc: 'Классический тетрис' },
        { id: 'snake',       name: 'Змейка',         icon: '🐍', desc: 'Собирай еду, расти' },
        { id: 'breakout',    name: 'Арканоид',       icon: '🧱', desc: 'Разбивай блоки' },
        { id: 'pong',        name: 'Понг',           icon: '🏓', desc: 'Пинг-понг с ИИ' },
        { id: 'flappy',      name: 'Flappy Bird',    icon: '🐦', desc: 'Лети между труб' },
        { id: 'minesweeper', name: 'Сапёр',          icon: '💣', desc: 'Найди все мины' },
        { id: 'memory',      name: 'Мемори',         icon: '🃏', desc: 'Найди пары карт' },
        { id: 'runner',      name: 'Раннер',         icon: '🏃', desc: 'Беги и прыгай' },
        { id: 'shooter',     name: 'Космострелок',   icon: '🚀', desc: 'Стреляй по врагам' },
        { id: 'puzzle2048',  name: '2048',           icon: '🔢', desc: 'Собери 2048' }
    ];

    // ---------- SVG иконка Atari джойстик ----------
    var ICON_JOYSTICK = '<svg viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><rect x="13" y="2" width="6" height="14" rx="3"/><ellipse cx="16" cy="24" rx="14" ry="8"/><ellipse cx="16" cy="24" rx="12" ry="6.5" fill="currentColor" opacity="0.25"/><circle cx="16" cy="5" r="2.2" fill="#e94560"/></svg>';

    // ---------- CSS стили ----------
    var PLUGIN_CSS = '\
    .games-plugin-page{width:100%;height:100%;position:relative;overflow-y:auto;padding:20px}\
    .games-plugin-header{text-align:center;margin-bottom:24px}\
    .games-plugin-header h1{font-size:28px;font-weight:800;color:#fff;margin-bottom:4px}\
    .games-plugin-header p{color:#888;font-size:13px}\
    .games-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;max-width:1100px;margin:0 auto}\
    .games-grid .game-card{background:linear-gradient(145deg,#1a2a4a,#0f2040);border-radius:16px;padding:24px 16px;text-align:center;cursor:pointer;border:2px solid transparent;transition:all .25s;outline:none;position:relative;overflow:hidden}\
    .games-grid .game-card:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 0%,rgba(233,69,96,.12),transparent 70%);opacity:0;transition:opacity .3s}\
    .games-grid .game-card:hover:before,.games-grid .game-card.focus:before{opacity:1}\
    .games-grid .game-card:hover,.games-grid .game-card.focus{border-color:#e94560;transform:translateY(-4px) scale(1.02);box-shadow:0 8px 30px rgba(233,69,96,.2)}\
    .games-grid .game-card .g-icon{font-size:42px;display:block;margin-bottom:10px;position:relative;z-index:1}\
    .games-grid .game-card h3{font-size:15px;font-weight:700;color:#fff;margin-bottom:4px;position:relative;z-index:1}\
    .games-grid .game-card p{font-size:11px;color:#888;position:relative;z-index:1}\
    .game-screen-wrap{position:fixed;inset:0;z-index:999;background:#0a0a16;display:flex;flex-direction:column}\
    .game-toolbar{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:rgba(0,0,0,.5);border-bottom:1px solid rgba(255,255,255,.06)}\
    .game-toolbar h2{font-size:16px;font-weight:700;color:#fff}\
    .game-toolbar .g-score{font-size:15px;color:#f0c040;font-weight:700}\
    .game-toolbar .g-back{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.08);border:none;color:#fff;padding:7px 14px;border-radius:10px;cursor:pointer;font-size:13px;font-weight:600}\
    .game-toolbar .g-back:hover,.game-toolbar .g-back.focus{background:#e94560}\
    .game-canvas-wrap{flex:1;display:flex;align-items:center;justify-content:center}\
    .game-canvas-wrap canvas{background:#0a0a18;border-radius:10px;border:2px solid rgba(255,255,255,.08);max-width:95vw;max-height:calc(100vh - 160px);touch-action:none}\
    .g-touch{display:none;justify-content:space-between;align-items:center;padding:8px 16px 16px}\
    @media(pointer:coarse),(max-width:900px){.g-touch{display:flex}}\
    .g-dpad{display:grid;grid-template-columns:54px 54px 54px;grid-template-rows:54px 54px 54px;gap:3px}\
    .g-dpad .db{width:54px;height:54px;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.12);border-radius:12px;color:#fff;font-size:20px;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none}\
    .g-dpad .db:active{background:#e94560;transform:scale(.9)}\
    .g-dpad .db.empty{background:none;border:none}\
    .g-dpad .db.center{background:rgba(233,69,96,.25);border-color:#e94560}\
    .g-actions{display:flex;flex-direction:column;gap:8px;align-items:center}\
    .g-actions .ab{width:64px;height:64px;border-radius:50%;background:rgba(233,69,96,.25);border:2px solid #e94560;color:#fff;font-size:13px;font-weight:700;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none}\
    .g-actions .ab:active{background:#e94560;transform:scale(.88)}\
    .g-actions .ab.pause{background:rgba(78,204,163,.25);border-color:#4ecca3;width:46px;height:46px;font-size:11px}\
    .g-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:1000;display:flex;align-items:center;justify-content:center}\
    .g-modal{background:linear-gradient(145deg,#16213e,#0d1b2a);border-radius:22px;padding:36px 44px;text-align:center;border:2px solid #e94560;box-shadow:0 0 50px rgba(233,69,96,.25);max-width:380px}\
    .g-modal h2{font-size:24px;color:#e94560;margin-bottom:8px}\
    .g-modal .g-final{font-size:44px;font-weight:800;color:#f0c040;margin:12px 0}\
    .g-modal .g-best{font-size:13px;color:#888;margin-bottom:20px}\
    .g-modal .g-btns{display:flex;gap:10px;justify-content:center}\
    .g-modal .g-btn{padding:10px 24px;border-radius:10px;border:none;font-size:14px;font-weight:700;cursor:pointer}\
    .g-modal .g-btn.primary{background:#e94560;color:#fff}\
    .g-modal .g-btn.secondary{background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.15)}\
    .g-modal .g-btn:hover,.g-modal .g-btn.focus{transform:scale(1.05);box-shadow:0 4px 18px rgba(233,69,96,.25)}\
    ';

    // ---------- Внедрение CSS ----------
    function injectCSS() {
        if (document.getElementById('games-plugin-css')) return;
        var s = document.createElement('style');
        s.id = 'games-plugin-css';
        s.textContent = PLUGIN_CSS;
        document.head.appendChild(s);
    }

    // ==========================================================
    //  ИГРОВОЙ ДВИЖОК (общая логика)
    // ==========================================================
    var GE = {
        canvas: null,
        ctx: null,
        current: null,
        loopId: null,
        score: 0,
        paused: false,
        inGame: false,
        modalOpen: false,
        modalIdx: 0,
        wrap: null,      // DOM обёртка game-screen
        scoreEl: null,
        titleEl: null,

        setScore: function (s) {
            this.score = s;
            if (this.scoreEl) this.scoreEl.textContent = s;
        },

        gameOver: function () {
            GE.paused = true;
            GE.modalOpen = true;
            GE.modalIdx = 0;
            var gid = GE.current ? GE.current.id : '';
            var best = GE.getBest(gid);
            if (GE.score > best) GE.setBest(gid, GE.score);
            GE.showModal(GE.score, Math.max(GE.score, best));
        },

        getBest: function (id) {
            try { return parseInt(Lampa.Storage.get('games_best_' + id, '0')) || 0; } catch (e) {
                try { return parseInt(localStorage.getItem('games_best_' + id)) || 0; } catch (e2) { return 0; }
            }
        },
        setBest: function (id, s) {
            try { Lampa.Storage.set('games_best_' + id, '' + s); } catch (e) {
                try { localStorage.setItem('games_best_' + id, s); } catch (e2) {}
            }
        },

        showModal: function (score, best) {
            if (document.getElementById('g-modal-over')) document.getElementById('g-modal-over').remove();
            var d = document.createElement('div');
            d.id = 'g-modal-over';
            d.className = 'g-modal-overlay';
            d.innerHTML = '<div class="g-modal"><h2>Игра окончена!</h2><div class="g-final">' + score +
                '</div><div class="g-best">Лучший: ' + best +
                '</div><div class="g-btns"><button class="g-btn primary" id="gm-restart">Заново</button>' +
                '<button class="g-btn secondary" id="gm-exit">Выход</button></div></div>';
            document.body.appendChild(d);
            d.querySelector('#gm-restart').onclick = function () { GE.restart(); };
            d.querySelector('#gm-exit').onclick = function () { GE.exit(); };
            GE.updateModalFocus();
        },

        updateModalFocus: function () {
            var r = document.getElementById('gm-restart');
            var e = document.getElementById('gm-exit');
            if (r) r.classList.toggle('focus', GE.modalIdx === 0);
            if (e) e.classList.toggle('focus', GE.modalIdx === 1);
        },

        restart: function () {
            var m = document.getElementById('g-modal-over');
            if (m) m.remove();
            GE.modalOpen = false;
            GE.paused = false;
            GE.score = 0;
            GE.setScore(0);
            if (GE.current) GE.current.init();
        },

        exit: function () {
            GE.inGame = false;
            GE.paused = false;
            GE.modalOpen = false;
            if (GE.loopId) cancelAnimationFrame(GE.loopId);
            GE.current = null;
            var m = document.getElementById('g-modal-over');
            if (m) m.remove();
            if (GE.wrap) GE.wrap.remove();
            GE.wrap = null;
            // Вернуть управление Lampa
            try { Lampa.Controller.toggle('games_grid'); } catch (e) {}
        },

        loop: function () {
            if (!GE.inGame) return;
            if (!GE.paused && GE.current) {
                GE.current.update();
                GE.current.draw(GE.ctx, GE.canvas.width, GE.canvas.height);
            }
            if (GE.paused && !GE.modalOpen) {
                GE.ctx.fillStyle = 'rgba(0,0,0,0.7)';
                GE.ctx.fillRect(0, 0, GE.canvas.width, GE.canvas.height);
                GE.ctx.fillStyle = '#fff';
                GE.ctx.font = 'bold 26px sans-serif';
                GE.ctx.textAlign = 'center';
                GE.ctx.fillText('⏸ ПАУЗА', GE.canvas.width / 2, GE.canvas.height / 2);
                GE.ctx.font = '13px sans-serif';
                GE.ctx.fillStyle = '#888';
                GE.ctx.fillText('Enter / OK — продолжить', GE.canvas.width / 2, GE.canvas.height / 2 + 30);
            }
            GE.loopId = requestAnimationFrame(GE.loop);
        },

        launch: function (id) {
            var g = null;
            GAMES.forEach(function (gm) { if (gm.id === id) g = gm; });
            if (!g) return;

            GE.inGame = true;
            GE.paused = false;
            GE.score = 0;

            // Создаём экран игры
            var wrap = document.createElement('div');
            wrap.className = 'game-screen-wrap';
            wrap.innerHTML =
                '<div class="game-toolbar">' +
                    '<button class="g-back" id="g-back-btn">← Назад</button>' +
                    '<h2 id="g-title"></h2>' +
                    '<div class="g-score">Счёт: <span id="g-score-val">0</span></div>' +
                '</div>' +
                '<div class="game-canvas-wrap"><canvas id="g-canvas"></canvas></div>' +
                '<div class="g-touch">' +
                    '<div class="g-dpad">' +
                        '<div class="db empty"></div><div class="db" data-d="up">▲</div><div class="db empty"></div>' +
                        '<div class="db" data-d="left">◀</div><div class="db center" data-d="action">OK</div><div class="db" data-d="right">▶</div>' +
                        '<div class="db empty"></div><div class="db" data-d="down">▼</div><div class="db empty"></div>' +
                    '</div>' +
                    '<div class="g-actions">' +
                        '<div class="ab" data-d="action">ACT</div>' +
                        '<div class="ab pause" data-d="pause">⏸</div>' +
                    '</div>' +
                '</div>';
            document.body.appendChild(wrap);
            GE.wrap = wrap;

            GE.titleEl = wrap.querySelector('#g-title');
            GE.scoreEl = wrap.querySelector('#g-score-val');
            GE.titleEl.textContent = g.name;
            GE.scoreEl.textContent = '0';

            GE.canvas = wrap.querySelector('#g-canvas');
            GE.ctx = GE.canvas.getContext('2d');

            var cw = wrap.querySelector('.game-canvas-wrap');
            var w = Math.min(cw.offsetWidth - 16, 400);
            var h = Math.min(cw.offsetHeight - 16, 600);
            GE.canvas.width = w;
            GE.canvas.height = h;

            // Кнопка назад
            wrap.querySelector('#g-back-btn').onclick = function () { GE.exit(); };

            // Тач-кнопки
            wrap.querySelectorAll('[data-d]').forEach(function (el) {
                var handler = function (e) {
                    e.preventDefault();
                    var d = el.getAttribute('data-d');
                    if (d === 'pause') { GE.paused = !GE.paused; return; }
                    if (GE.current) GE.current.onInput(d);
                };
                el.addEventListener('touchstart', handler, { passive: false });
                el.addEventListener('mousedown', handler);
            });

            // Свайпы на канвасе
            var sx = 0, sy = 0;
            GE.canvas.addEventListener('touchstart', function (e) {
                sx = e.touches[0].clientX;
                sy = e.touches[0].clientY;
            }, { passive: true });
            GE.canvas.addEventListener('touchend', function (e) {
                var dx = e.changedTouches[0].clientX - sx;
                var dy = e.changedTouches[0].clientY - sy;
                if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
                    if (GE.current) GE.current.onInput('action');
                    return;
                }
                if (Math.abs(dx) > Math.abs(dy))
                    GE.current && GE.current.onInput(dx > 0 ? 'right' : 'left');
                else
                    GE.current && GE.current.onInput(dy > 0 ? 'down' : 'up');
            }, { passive: true });

            // Инициализация игры
            if (GE.loopId) cancelAnimationFrame(GE.loopId);
            GE.current = createGame(id);
            if (GE.current) GE.current.init();
            GE.loop();

            // Контроллер для пульта ТВ
            Lampa.Controller.add('games_play', {
                toggle: function () {},
                left:  function () { if (GE.current) GE.current.onInput('left'); },
                right: function () { if (GE.current) GE.current.onInput('right'); },
                up:    function () { if (GE.current) GE.current.onInput('up'); },
                down:  function () { if (GE.current) GE.current.onInput('down'); },
                enter: function () {
                    if (GE.modalOpen) {
                        if (GE.modalIdx === 0) GE.restart(); else GE.exit();
                    } else if (GE.paused) {
                        GE.paused = false;
                    } else if (GE.current) {
                        GE.current.onInput('action');
                    }
                },
                back: function () {
                    if (GE.modalOpen) { GE.exit(); }
                    else if (GE.paused) { GE.exit(); }
                    else { GE.paused = true; }
                },
                gone: function () {}
            });
            Lampa.Controller.toggle('games_play');
        }
    };

    // ==========================================================
    //  ФАБРИКА ИГР
    // ==========================================================
    function createGame(id) {
        var map = {
            tetris:      TetrisGame,
            snake:       SnakeGame,
            breakout:    BreakoutGame,
            pong:        PongGame,
            flappy:      FlappyGame,
            minesweeper: MinesweeperGame,
            memory:      MemoryGame,
            runner:      RunnerGame,
            shooter:     ShooterGame,
            puzzle2048:  Puzzle2048Game
        };
        return map[id] ? new map[id](id) : null;
    }

    // ==========================================================
    //  1. ТЕТРИС
    // ==========================================================
    function TetrisGame(id) {
        this.id = id;
        var COLS = 10, ROWS = 20;
        var board, piece, nextP, px, py, ticks, speed, lines;
        var SHAPES = [
            [[1,1,1,1]],
            [[1,1],[1,1]],
            [[0,1,0],[1,1,1]],
            [[1,0,0],[1,1,1]],
            [[0,0,1],[1,1,1]],
            [[1,1,0],[0,1,1]],
            [[0,1,1],[1,1,0]]
        ];
        var COLORS = ['#00f0f0','#f0f000','#a000f0','#0000f0','#f0a000','#00f000','#f00000'];

        function np() {
            var i = Math.floor(Math.random() * SHAPES.length);
            return { shape: SHAPES[i].map(function(r){return r.slice();}), color: COLORS[i] };
        }
        function hit(b, sh, cx, cy) {
            for (var r = 0; r < sh.length; r++)
                for (var c = 0; c < sh[r].length; c++)
                    if (sh[r][c] && (cy+r >= ROWS || cx+c < 0 || cx+c >= COLS || (cy+r >= 0 && b[cy+r][cx+c])))
                        return true;
            return false;
        }
        function rot(sh) {
            return sh[0].map(function(_, i) {
                return sh.map(function(r){ return r[i]; }).reverse();
            });
        }
        function lock() {
            for (var r = 0; r < piece.shape.length; r++)
                for (var c = 0; c < piece.shape[r].length; c++)
                    if (piece.shape[r][c] && py+r >= 0) board[py+r][px+c] = piece.color;
            var cleared = 0;
            for (var r2 = ROWS-1; r2 >= 0; r2--) {
                if (board[r2].every(function(v){return v;})) {
                    board.splice(r2, 1);
                    board.unshift(new Array(COLS).fill(0));
                    cleared++; r2++;
                }
            }
            if (cleared) { lines += cleared; GE.setScore(lines * 100); speed = Math.max(5, 30 - lines); }
            piece = nextP; nextP = np();
            px = Math.floor((COLS - piece.shape[0].length) / 2);
            py = -piece.shape.length;
            if (hit(board, piece.shape, px, py + 1)) GE.gameOver();
        }

        this.init = function () {
            board = [];
            for (var i = 0; i < ROWS; i++) board.push(new Array(COLS).fill(0));
            piece = np(); nextP = np();
            px = Math.floor((COLS - piece.shape[0].length) / 2); py = 0;
            ticks = 0; speed = 30; lines = 0;
            GE.setScore(0);
        };
        this.update = function () {
            ticks++;
            if (ticks >= speed) { ticks = 0; if (!hit(board, piece.shape, px, py+1)) py++; else lock(); }
        };
        this.draw = function (ctx, w, h) {
            var bs = Math.min(Math.floor(w/COLS), Math.floor(h/ROWS));
            var ox = (w - bs*COLS)/2, oy = (h - bs*ROWS)/2;
            ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0,0,w,h);
            for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
                ctx.fillStyle = board[r][c] || '#161630';
                ctx.fillRect(ox+c*bs+1, oy+r*bs+1, bs-2, bs-2);
            }
            if (piece) for (var r2 = 0; r2 < piece.shape.length; r2++)
                for (var c2 = 0; c2 < piece.shape[r2].length; c2++)
                    if (piece.shape[r2][c2] && py+r2 >= 0) {
                        ctx.fillStyle = piece.color;
                        ctx.fillRect(ox+(px+c2)*bs+1, oy+(py+r2)*bs+1, bs-2, bs-2);
                    }
        };
        this.onInput = function (d) {
            if (d === 'left' && !hit(board, piece.shape, px-1, py)) px--;
            else if (d === 'right' && !hit(board, piece.shape, px+1, py)) px++;
            else if (d === 'down') { if (!hit(board, piece.shape, px, py+1)) py++; else lock(); }
            else if (d === 'up' || d === 'action') {
                var r = rot(piece.shape);
                if (!hit(board, r, px, py)) piece.shape = r;
                else if (!hit(board, r, px-1, py)) { piece.shape = r; px--; }
                else if (!hit(board, r, px+1, py)) { piece.shape = r; px++; }
            }
        };
    }

    // ==========================================================
    //  2. ЗМЕЙКА
    // ==========================================================
    function SnakeGame(id) {
        this.id = id;
        var GRID = 20;
        var snake, food, dir, nextDir, ticks, speed, pts;

        function placeFood() {
            var cols = Math.floor(GE.canvas.width / GRID);
            var rows = Math.floor(GE.canvas.height / GRID);
            var fx, fy, ok;
            do {
                fx = Math.floor(Math.random()*cols);
                fy = Math.floor(Math.random()*rows);
                ok = true;
                for (var i = 0; i < snake.length; i++)
                    if (snake[i].x === fx && snake[i].y === fy) { ok = false; break; }
            } while (!ok);
            food = { x: fx, y: fy };
        }

        this.init = function () {
            snake = [{x:5,y:5},{x:4,y:5},{x:3,y:5}];
            dir = 'right'; nextDir = 'right';
            ticks = 0; speed = 8; pts = 0;
            food = null;
            GE.setScore(0);
        };
        this.update = function () {
            ticks++;
            if (ticks < speed) return;
            ticks = 0; dir = nextDir;
            var head = { x: snake[0].x, y: snake[0].y };
            if (dir === 'up') head.y--;
            else if (dir === 'down') head.y++;
            else if (dir === 'left') head.x--;
            else if (dir === 'right') head.x++;

            var cols = Math.floor(GE.canvas.width / GRID);
            var rows = Math.floor(GE.canvas.height / GRID);
            if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) { GE.gameOver(); return; }
            for (var i = 0; i < snake.length; i++)
                if (snake[i].x === head.x && snake[i].y === head.y) { GE.gameOver(); return; }

            snake.unshift(head);
            if (!food) placeFood();
            if (food && head.x === food.x && head.y === food.y) {
                pts += 10; GE.setScore(pts);
                speed = Math.max(3, speed - 0.3);
                placeFood();
            } else snake.pop();
        };
        this.draw = function (ctx, w, h) {
            ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0,0,w,h);
            if (food) { ctx.fillStyle = '#e94560'; ctx.fillRect(food.x*GRID+2, food.y*GRID+2, GRID-4, GRID-4); }
            for (var i = 0; i < snake.length; i++) {
                ctx.fillStyle = i === 0 ? '#4ecca3' : '#2ea87a';
                ctx.fillRect(snake[i].x*GRID+1, snake[i].y*GRID+1, GRID-2, GRID-2);
            }
        };
        this.onInput = function (d) {
            var opp = {up:'down',down:'up',left:'right',right:'left'};
            if ((d==='up'||d==='down'||d==='left'||d==='right') && d !== opp[dir]) nextDir = d;
        };
    }

    // ==========================================================
    //  3. АРКАНОИД
    // ==========================================================
    function BreakoutGame(id) {
        this.id = id;
        var paddle, ball, bricks, pts, lives;
        var BROWS = 5, BCOLS = 8;
        var CLR = ['#e94560','#f0c040','#4ecca3','#00b4d8','#a855f7'];
        var self = this;

        function resetBall() {
            ball.x = GE.canvas.width/2; ball.y = GE.canvas.height-50;
            ball.dx = 2.5*(Math.random()>.5?1:-1); ball.dy = -3;
            paddle.x = GE.canvas.width/2-paddle.w/2; paddle.y = GE.canvas.height-25;
        }

        this.init = function () {
            pts = 0; lives = 3; GE.setScore(0);
            paddle = { w:70, h:12, x:0, y:0 };
            ball = { r:6, x:0, y:0, dx:0, dy:0 };
            resetBall();
            bricks = [];
            for (var r = 0; r < BROWS; r++)
                for (var c = 0; c < BCOLS; c++)
                    bricks.push({ r:r, c:c, alive:true, color:CLR[r] });
        };
        this.update = function () {
            var w = GE.canvas.width, h = GE.canvas.height;
            ball.x += ball.dx; ball.y += ball.dy;
            if (ball.x <= ball.r || ball.x >= w-ball.r) ball.dx *= -1;
            if (ball.y <= ball.r) ball.dy *= -1;
            if (ball.y >= h) { lives--; if (lives <= 0) GE.gameOver(); else resetBall(); return; }
            if (ball.dy > 0 && ball.y+ball.r >= paddle.y && ball.x >= paddle.x && ball.x <= paddle.x+paddle.w) {
                ball.dy *= -1; ball.y = paddle.y-ball.r;
                ball.dx += (ball.x-(paddle.x+paddle.w/2))*0.1;
            }
            var bw = w/BCOLS, bh = 20;
            var allDead = true;
            for (var i = 0; i < bricks.length; i++) {
                var b = bricks[i];
                if (!b.alive) continue;
                allDead = false;
                var bx = b.c*bw, by = b.r*bh+30;
                if (ball.x+ball.r > bx && ball.x-ball.r < bx+bw && ball.y+ball.r > by && ball.y-ball.r < by+bh) {
                    b.alive = false; ball.dy *= -1; pts += 10; GE.setScore(pts);
                }
            }
            if (allDead) { pts += 100; GE.setScore(pts); self.init(); }
        };
        this.draw = function (ctx, w, h) {
            ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0,0,w,h);
            var bw = w/BCOLS, bh = 20;
            for (var i = 0; i < bricks.length; i++) {
                if (!bricks[i].alive) continue;
                ctx.fillStyle = bricks[i].color;
                ctx.fillRect(bricks[i].c*bw+1, bricks[i].r*bh+31, bw-2, bh-2);
            }
            ctx.fillStyle = '#4ecca3'; ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
            ctx.fillStyle = '#fff'; ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#aaa'; ctx.font = '12px sans-serif'; ctx.textAlign = 'left';
            var hearts = ''; for (var j = 0; j < lives; j++) hearts += '♥';
            ctx.fillText(hearts, 10, 20);
        };
        this.onInput = function (d) {
            if (d === 'left') paddle.x = Math.max(0, paddle.x-25);
            if (d === 'right') paddle.x = Math.min(GE.canvas.width-paddle.w, paddle.x+25);
        };
    }

    // ==========================================================
    //  4. ПОНГ
    // ==========================================================
    function PongGame(id) {
        this.id = id;
        var pY, aiY, bx, by, bdx, bdy, pS, aS;
        var PW = 10, PH = 60, BR = 6, SPD = 4;
        var self = this;

        function resetB() {
            bx = GE.canvas.width/2; by = GE.canvas.height/2;
            bdx = SPD*(Math.random()>.5?1:-1); bdy = (Math.random()-.5)*4;
        }

        this.init = function () {
            pY = GE.canvas.height/2-PH/2; aiY = pY;
            pS = 0; aS = 0; resetB(); GE.setScore(0);
        };
        this.update = function () {
            var w = GE.canvas.width, h = GE.canvas.height;
            bx += bdx; by += bdy;
            if (by <= BR || by >= h-BR) bdy *= -1;
            if (bx-BR <= 20+PW && by >= pY && by <= pY+PH && bdx < 0) {
                bdx = Math.abs(bdx)*1.05; bdy += (by-(pY+PH/2))*.15;
            }
            var ac = aiY+PH/2;
            if (by > ac+10) aiY += 3; else if (by < ac-10) aiY -= 3;
            aiY = Math.max(0, Math.min(h-PH, aiY));
            if (bx+BR >= w-20-PW && by >= aiY && by <= aiY+PH && bdx > 0) {
                bdx = -Math.abs(bdx)*1.05; bdy += (by-(aiY+PH/2))*.15;
            }
            if (bx < 0) { aS++; resetB(); }
            if (bx > w) { pS++; GE.setScore(pS*100); resetB(); }
            if (aS >= 5) GE.gameOver();
        };
        this.draw = function (ctx, w, h) {
            ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0,0,w,h);
            ctx.setLineDash([6,6]); ctx.strokeStyle = '#333';
            ctx.beginPath(); ctx.moveTo(w/2,0); ctx.lineTo(w/2,h); ctx.stroke(); ctx.setLineDash([]);
            ctx.fillStyle = '#4ecca3'; ctx.fillRect(20, pY, PW, PH);
            ctx.fillStyle = '#e94560'; ctx.fillRect(w-20-PW, aiY, PW, PH);
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(bx,by,BR,0,Math.PI*2); ctx.fill();
            ctx.font = '24px sans-serif'; ctx.textAlign = 'center';
            ctx.fillStyle = '#4ecca3'; ctx.fillText(pS, w/4, 40);
            ctx.fillStyle = '#e94560'; ctx.fillText(aS, 3*w/4, 40);
        };
        this.onInput = function (d) {
            if (d === 'up') pY = Math.max(0, pY-25);
            if (d === 'down') pY = Math.min(GE.canvas.height-PH, pY+25);
        };
    }

    // ==========================================================
    //  5. FLAPPY BIRD
    // ==========================================================
    function FlappyGame(id) {
        this.id = id;
        var bird, pipes, ticks, pts;

        this.init = function () {
            bird = { x:60, y:GE.canvas.height/2, vy:0, r:12 };
            pipes = []; ticks = 0; pts = 0; GE.setScore(0);
        };
        this.update = function () {
            var h = GE.canvas.height, w = GE.canvas.width;
            ticks++;
            bird.vy += 0.35; bird.y += bird.vy;
            if (bird.y < 0 || bird.y > h) { GE.gameOver(); return; }
            if (ticks % 90 === 0) {
                var gap = 120, gy = 50 + Math.random()*(h-150);
                pipes.push({ x: w, gy: gy, gap: gap, scored: false });
            }
            for (var i = pipes.length-1; i >= 0; i--) {
                pipes[i].x -= 2.5;
                if (pipes[i].x < -60) { pipes.splice(i, 1); continue; }
                var p = pipes[i];
                if (bird.x+bird.r > p.x && bird.x-bird.r < p.x+40) {
                    if (bird.y-bird.r < p.gy || bird.y+bird.r > p.gy+p.gap) { GE.gameOver(); return; }
                }
                if (!p.scored && p.x+40 < bird.x) { p.scored = true; pts++; GE.setScore(pts); }
            }
        };
        this.draw = function (ctx, w, h) {
            ctx.fillStyle = '#0c1e3a'; ctx.fillRect(0,0,w,h);
            for (var i = 0; i < pipes.length; i++) {
                ctx.fillStyle = '#4ecca3';
                ctx.fillRect(pipes[i].x, 0, 40, pipes[i].gy);
                ctx.fillRect(pipes[i].x, pipes[i].gy+pipes[i].gap, 40, h-pipes[i].gy-pipes[i].gap);
            }
            ctx.fillStyle = '#f0c040'; ctx.beginPath();
            ctx.arc(bird.x, bird.y, bird.r, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.beginPath();
            ctx.arc(bird.x+4, bird.y-3, 3, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#000'; ctx.beginPath();
            ctx.arc(bird.x+5, bird.y-3, 1.5, 0, Math.PI*2); ctx.fill();
        };
        this.onInput = function (d) {
            if (d === 'up' || d === 'action') bird.vy = -6;
        };
    }

    // ==========================================================
    //  6. САПЁР
    // ==========================================================
    function MinesweeperGame(id) {
        this.id = id;
        var COLS = 8, ROWS = 10, MINES = 10;
        var grid, revealed, flagged, cx, cy, ended, first;

        function countM(r, c) {
            var n = 0;
            for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
                var nr = r+dr, nc = c+dc;
                if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc] === -1) n++;
            }
            return n;
        }
        function rev(r, c) {
            if (r < 0 || r >= ROWS || c < 0 || c >= COLS || revealed[r][c] || flagged[r][c]) return;
            revealed[r][c] = true;
            if (grid[r][c] === 0) for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) rev(r+dr, c+dc);
        }
        function place(sr, sc) {
            var p = 0;
            while (p < MINES) {
                var r = Math.floor(Math.random()*ROWS), c = Math.floor(Math.random()*COLS);
                if (grid[r][c] !== -1 && !(r===sr && c===sc)) { grid[r][c] = -1; p++; }
            }
            for (var r2 = 0; r2 < ROWS; r2++) for (var c2 = 0; c2 < COLS; c2++)
                if (grid[r2][c2] !== -1) grid[r2][c2] = countM(r2, c2);
        }

        this.init = function () {
            grid = []; revealed = []; flagged = [];
            for (var i = 0; i < ROWS; i++) {
                grid.push(new Array(COLS).fill(0));
                revealed.push(new Array(COLS).fill(false));
                flagged.push(new Array(COLS).fill(false));
            }
            cx = 0; cy = 0; ended = false; first = true;
            GE.setScore(0);
        };
        this.update = function () {};
        this.draw = function (ctx, w, h) {
            ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0,0,w,h);
            var cs = Math.min(Math.floor(w/COLS), Math.floor(h/ROWS));
            var ox = (w-cs*COLS)/2, oy = (h-cs*ROWS)/2;
            var nc = ['','#4ecca3','#00b4d8','#e94560','#a855f7','#f0c040','#ff6b6b','#fff','#aaa'];
            for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
                var x = ox+c*cs, y = oy+r*cs;
                if (revealed[r][c]) {
                    ctx.fillStyle = grid[r][c] === -1 ? '#8b0000' : '#1a1a3a';
                    ctx.fillRect(x+1,y+1,cs-2,cs-2);
                    if (grid[r][c] === -1) {
                        ctx.font = (cs*.6)+'px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
                        ctx.fillText('💣',x+cs/2,y+cs*.72);
                    } else if (grid[r][c] > 0) {
                        ctx.font = 'bold '+(cs*.5)+'px sans-serif'; ctx.textAlign = 'center';
                        ctx.fillStyle = nc[grid[r][c]] || '#fff';
                        ctx.fillText(grid[r][c],x+cs/2,y+cs*.68);
                    }
                } else {
                    ctx.fillStyle = (r===cy && c===cx && !ended) ? '#2a4a6a' : '#0f3460';
                    ctx.fillRect(x+1,y+1,cs-2,cs-2);
                    if (flagged[r][c]) {
                        ctx.font = (cs*.5)+'px sans-serif'; ctx.textAlign = 'center';
                        ctx.fillText('🚩',x+cs/2,y+cs*.7);
                    }
                }
            }
        };
        this.onInput = function (d) {
            if (ended) return;
            if (d === 'left') cx = Math.max(0, cx-1);
            else if (d === 'right') cx = Math.min(COLS-1, cx+1);
            else if (d === 'up') cy = Math.max(0, cy-1);
            else if (d === 'down') cy = Math.min(ROWS-1, cy+1);
            else if (d === 'action') {
                if (flagged[cy][cx]) return;
                if (first) { place(cy, cx); first = false; }
                if (grid[cy][cx] === -1) {
                    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++)
                        if (grid[r][c] === -1) revealed[r][c] = true;
                    ended = true; GE.gameOver();
                } else {
                    rev(cy, cx);
                    var cnt = 0;
                    for (var r2 = 0; r2 < ROWS; r2++) for (var c2 = 0; c2 < COLS; c2++) if (revealed[r2][c2]) cnt++;
                    GE.setScore(cnt * 5);
                    if (cnt === ROWS*COLS-MINES) { GE.setScore(cnt*5+200); ended = true; GE.gameOver(); }
                }
            }
        };
    }

    // ==========================================================
    //  7. МЕМОРИ
    // ==========================================================
    function MemoryGame(id) {
        this.id = id;
        var EMOJIS = ['🎮','🎲','🎯','🏆','⭐','🔥','💎','🎵'];
        var COLS = 4, ROWS = 4;
        var cards, cx, cy, firstC, secondC, lockB, pts, moves;

        this.init = function () {
            var pairs = EMOJIS.slice(0, (COLS*ROWS)/2);
            var deck = pairs.concat(pairs);
            for (var i = deck.length-1; i > 0; i--) {
                var j = Math.floor(Math.random()*(i+1));
                var t = deck[i]; deck[i] = deck[j]; deck[j] = t;
            }
            cards = []; var idx = 0;
            for (var r = 0; r < ROWS; r++)
                for (var c = 0; c < COLS; c++)
                    cards.push({ r:r, c:c, emoji: deck[idx++], flipped:false, matched:false });
            cx = 0; cy = 0; firstC = null; secondC = null; lockB = false; pts = 0; moves = 0;
            GE.setScore(0);
        };
        this.update = function () {};
        this.draw = function (ctx, w, h) {
            ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0,0,w,h);
            var cs = Math.min(Math.floor(w/COLS)-8, Math.floor(h/ROWS)-8);
            var ox = (w-cs*COLS-(COLS-1)*4)/2, oy = (h-cs*ROWS-(ROWS-1)*4)/2;
            for (var i = 0; i < cards.length; i++) {
                var cd = cards[i];
                var x = ox+cd.c*(cs+4), y = oy+cd.r*(cs+4);
                var sel = cd.c === cx && cd.r === cy;
                if (cd.flipped || cd.matched) {
                    ctx.fillStyle = cd.matched ? '#1a4a3a' : '#1a3a5a';
                    ctx.fillRect(x,y,cs,cs);
                    ctx.font = (cs*.5)+'px sans-serif'; ctx.textAlign = 'center';
                    ctx.fillText(cd.emoji, x+cs/2, y+cs*.65);
                } else {
                    ctx.fillStyle = sel ? '#2a5a8a' : '#0f3460';
                    ctx.fillRect(x,y,cs,cs);
                    ctx.fillStyle = '#1a2a4a';
                    ctx.font = 'bold '+(cs*.4)+'px sans-serif'; ctx.textAlign = 'center';
                    ctx.fillText('?', x+cs/2, y+cs*.65);
                }
                if (sel) { ctx.strokeStyle = '#e94560'; ctx.lineWidth = 2; ctx.strokeRect(x,y,cs,cs); }
            }
            ctx.fillStyle = '#888'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('Ходов: '+moves, w/2, h-10);
        };
        this.onInput = function (d) {
            if (lockB) return;
            if (d === 'left') cx = Math.max(0, cx-1);
            else if (d === 'right') cx = Math.min(COLS-1, cx+1);
            else if (d === 'up') cy = Math.max(0, cy-1);
            else if (d === 'down') cy = Math.min(ROWS-1, cy+1);
            else if (d === 'action') {
                var card = null;
                for (var i = 0; i < cards.length; i++)
                    if (cards[i].c === cx && cards[i].r === cy) { card = cards[i]; break; }
                if (!card || card.flipped || card.matched) return;
                card.flipped = true;
                if (!firstC) { firstC = card; }
                else {
                    secondC = card; moves++; lockB = true;
                    if (firstC.emoji === secondC.emoji) {
                        firstC.matched = true; secondC.matched = true;
                        pts += 50; GE.setScore(pts);
                        firstC = null; secondC = null; lockB = false;
                        var allDone = true;
                        for (var j = 0; j < cards.length; j++) if (!cards[j].matched) { allDone = false; break; }
                        if (allDone) { pts += 200; GE.setScore(pts); GE.gameOver(); }
                    } else {
                        var f = firstC, s = secondC;
                        setTimeout(function(){
                            f.flipped = false; s.flipped = false;
                            firstC = null; secondC = null; lockB = false;
                        }, 800);
                    }
                }
            }
        };
    }

    // ==========================================================
    //  8. РАННЕР
    // ==========================================================
    function RunnerGame(id) {
        this.id = id;
        var player, obstacles, ticks, pts, speed, groundY;

        this.init = function () {
            groundY = GE.canvas.height - 60;
            player = { x:60, y:groundY, w:30, h:40, vy:0, jumping:false };
            obstacles = []; ticks = 0; pts = 0; speed = 4;
            GE.setScore(0);
        };
        this.update = function () {
            ticks++; pts++;
            if (ticks % 5 === 0) GE.setScore(Math.floor(pts/5));
            speed = 4 + pts/500;
            if (player.jumping) {
                player.vy += 0.6; player.y += player.vy;
                if (player.y >= groundY) { player.y = groundY; player.jumping = false; player.vy = 0; }
            }
            if (ticks % Math.max(30, 80-Math.floor(speed*3)) === 0) {
                var h = 20+Math.random()*30;
                obstacles.push({ x:GE.canvas.width, y:groundY+40-h, w:20+Math.random()*15, h:h });
            }
            for (var i = obstacles.length-1; i >= 0; i--) {
                obstacles[i].x -= speed;
                if (obstacles[i].x < -50) { obstacles.splice(i, 1); continue; }
                var o = obstacles[i];
                if (player.x+player.w > o.x && player.x < o.x+o.w && player.y+player.h > o.y) { GE.gameOver(); return; }
            }
        };
        this.draw = function (ctx, w, h) {
            ctx.fillStyle = '#0c1e3a'; ctx.fillRect(0,0,w,h);
            ctx.fillStyle = '#1a3050'; ctx.fillRect(0, groundY+40, w, h-groundY-40);
            ctx.fillStyle = '#4ecca3'; ctx.fillRect(player.x, player.y, player.w, player.h);
            ctx.fillStyle = '#fff'; ctx.fillRect(player.x+18, player.y+8, 6, 6);
            ctx.fillStyle = '#e94560';
            for (var i = 0; i < obstacles.length; i++) {
                ctx.fillRect(obstacles[i].x, obstacles[i].y, obstacles[i].w, obstacles[i].h);
            }
            ctx.strokeStyle = '#4ecca350'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0,groundY+40); ctx.lineTo(w,groundY+40); ctx.stroke();
        };
        this.onInput = function (d) {
            if ((d === 'up' || d === 'action') && !player.jumping) { player.jumping = true; player.vy = -10; }
            if (d === 'down' && player.jumping) player.vy += 5;
        };
    }

    // ==========================================================
    //  9. КОСМОСТРЕЛОК
    // ==========================================================
    function ShooterGame(id) {
        this.id = id;
        var ship, bullets, enemies, ticks, pts, cool;

        this.init = function () {
            ship = { x:GE.canvas.width/2, y:GE.canvas.height-50, w:30, h:20 };
            bullets = []; enemies = []; ticks = 0; pts = 0; cool = 0;
            GE.setScore(0);
        };
        this.update = function () {
            ticks++; cool = Math.max(0, cool-1);
            if (ticks % 40 === 0) {
                enemies.push({ x:10+Math.random()*(GE.canvas.width-30), y:-20, w:24, h:24, speed:1+Math.random()*2 });
            }
            for (var i = 0; i < bullets.length; i++) bullets[i].y -= 6;
            for (var i2 = 0; i2 < enemies.length; i2++) enemies[i2].y += enemies[i2].speed;
            bullets = bullets.filter(function(b){ return b.y > -10; });
            for (var i3 = enemies.length-1; i3 >= 0; i3--) {
                var e = enemies[i3];
                for (var j = bullets.length-1; j >= 0; j--) {
                    var b = bullets[j];
                    if (b.x > e.x && b.x < e.x+e.w && b.y > e.y && b.y < e.y+e.h) {
                        enemies.splice(i3, 1); bullets.splice(j, 1); pts += 25; GE.setScore(pts); break;
                    }
                }
            }
            for (var i4 = enemies.length-1; i4 >= 0; i4--) {
                var en = enemies[i4];
                if (en.y > GE.canvas.height) { enemies.splice(i4, 1); continue; }
                if (en.x+en.w > ship.x && en.x < ship.x+ship.w && en.y+en.h > ship.y && en.y < ship.y+ship.h) {
                    GE.gameOver(); return;
                }
            }
        };
        this.draw = function (ctx, w, h) {
            ctx.fillStyle = '#050515'; ctx.fillRect(0,0,w,h);
            for (var i = 0; i < 30; i++) {
                ctx.fillStyle = 'rgba(255,255,255,'+(0.2+Math.random()*0.3)+')';
                ctx.fillRect((i*73+ticks*.5)%w, (i*137+ticks*.3)%h, 2, 2);
            }
            ctx.fillStyle = '#4ecca3'; ctx.beginPath();
            ctx.moveTo(ship.x+ship.w/2, ship.y); ctx.lineTo(ship.x, ship.y+ship.h);
            ctx.lineTo(ship.x+ship.w, ship.y+ship.h); ctx.fill();
            ctx.fillStyle = '#f0c040';
            for (var j = 0; j < bullets.length; j++) ctx.fillRect(bullets[j].x-2, bullets[j].y, 4, 10);
            for (var k = 0; k < enemies.length; k++) {
                ctx.fillStyle = '#e94560'; ctx.fillRect(enemies[k].x, enemies[k].y, enemies[k].w, enemies[k].h);
                ctx.fillStyle = '#ff8a80'; ctx.fillRect(enemies[k].x+4, enemies[k].y+4, enemies[k].w-8, enemies[k].h-8);
            }
        };
        this.onInput = function (d) {
            if (d === 'left') ship.x = Math.max(0, ship.x-20);
            else if (d === 'right') ship.x = Math.min(GE.canvas.width-ship.w, ship.x+20);
            else if (d === 'up') ship.y = Math.max(0, ship.y-15);
            else if (d === 'down') ship.y = Math.min(GE.canvas.height-ship.h, ship.y+15);
            else if (d === 'action' && cool <= 0) { bullets.push({ x:ship.x+ship.w/2, y:ship.y }); cool = 8; }
        };
    }

    // ==========================================================
    // 10. 2048
    // ==========================================================
    function Puzzle2048Game(id) {
        this.id = id;
        var SIZE = 4;
        var grid, pts;
        var TC = {0:'#1a1a3a',2:'#2a4a6a',4:'#2a5a7a',8:'#e94560',16:'#d63a55',
            32:'#c0304a',64:'#a82040',128:'#f0c040',256:'#e0b030',512:'#d0a020',1024:'#c09010',2048:'#4ecca3'};

        function addR() {
            var em = [];
            for (var r = 0; r < SIZE; r++) for (var c = 0; c < SIZE; c++) if (grid[r][c] === 0) em.push([r,c]);
            if (!em.length) return;
            var p = em[Math.floor(Math.random()*em.length)];
            grid[p[0]][p[1]] = Math.random() < .9 ? 2 : 4;
        }
        function slide(row) {
            var a = row.filter(function(v){return v;});
            for (var i = 0; i < a.length-1; i++) if (a[i] === a[i+1]) { a[i] *= 2; pts += a[i]; a[i+1] = 0; }
            a = a.filter(function(v){return v;});
            while (a.length < SIZE) a.push(0);
            return a;
        }
        function move(d) {
            var before = JSON.stringify(grid);
            var r, c, col;
            if (d === 'left') { for (r = 0; r < SIZE; r++) grid[r] = slide(grid[r]); }
            else if (d === 'right') { for (r = 0; r < SIZE; r++) { grid[r].reverse(); grid[r] = slide(grid[r]); grid[r].reverse(); } }
            else if (d === 'up') { for (c = 0; c < SIZE; c++) { col = []; for (r = 0; r < SIZE; r++) col.push(grid[r][c]); col = slide(col); for (r = 0; r < SIZE; r++) grid[r][c] = col[r]; } }
            else if (d === 'down') { for (c = 0; c < SIZE; c++) { col = []; for (r = 0; r < SIZE; r++) col.push(grid[r][c]); col.reverse(); col = slide(col); col.reverse(); for (r = 0; r < SIZE; r++) grid[r][c] = col[r]; } }
            if (JSON.stringify(grid) !== before) { addR(); GE.setScore(pts); }
            var hasM = false;
            for (r = 0; r < SIZE; r++) for (c = 0; c < SIZE; c++) {
                if (grid[r][c] === 0) hasM = true;
                if (c < SIZE-1 && grid[r][c] === grid[r][c+1]) hasM = true;
                if (r < SIZE-1 && grid[r][c] === grid[r+1][c]) hasM = true;
            }
            if (!hasM) GE.gameOver();
        }

        this.init = function () {
            grid = [];
            for (var i = 0; i < SIZE; i++) grid.push(new Array(SIZE).fill(0));
            pts = 0; GE.setScore(0); addR(); addR();
        };
        this.update = function () {};
        this.draw = function (ctx, w, h) {
            ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0,0,w,h);
            var cs = Math.min(Math.floor((w-20)/SIZE), Math.floor((h-20)/SIZE));
            var gap = 6;
            var ox = (w-(cs*SIZE+gap*(SIZE-1)))/2, oy = (h-(cs*SIZE+gap*(SIZE-1)))/2;
            for (var r = 0; r < SIZE; r++) for (var c = 0; c < SIZE; c++) {
                var x = ox+c*(cs+gap), y = oy+r*(cs+gap), v = grid[r][c];
                ctx.fillStyle = TC[v] || '#4ecca3';
                // rounded rect
                var rd = 8;
                ctx.beginPath();
                ctx.moveTo(x+rd,y); ctx.lineTo(x+cs-rd,y); ctx.quadraticCurveTo(x+cs,y,x+cs,y+rd);
                ctx.lineTo(x+cs,y+cs-rd); ctx.quadraticCurveTo(x+cs,y+cs,x+cs-rd,y+cs);
                ctx.lineTo(x+rd,y+cs); ctx.quadraticCurveTo(x,y+cs,x,y+cs-rd);
                ctx.lineTo(x,y+rd); ctx.quadraticCurveTo(x,y,x+rd,y); ctx.fill();
                if (v) {
                    ctx.fillStyle = v >= 8 ? '#fff' : '#ddd';
                    var fs = v >= 1024 ? cs*.28 : v >= 128 ? cs*.32 : cs*.4;
                    ctx.font = 'bold '+fs+'px sans-serif'; ctx.textAlign = 'center';
                    ctx.fillText(v, x+cs/2, y+cs/2+fs*.35);
                }
            }
        };
        this.onInput = function (d) {
            if (d === 'left' || d === 'right' || d === 'up' || d === 'down') move(d);
        };
    }

    // ==========================================================
    //  КОМПОНЕНТ ДЛЯ LAMPA
    // ==========================================================
    function GamesComponent(object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var html   = document.createElement('div');
        var focusIdx = 0;
        var cardEls = [];

        function buildHTML() {
            html.className = 'games-plugin-page';
            var inner = '<div class="games-plugin-header"><h1>🎮 Аркада</h1>' +
                '<p>Выберите игру • Управление: пульт ТВ / тач</p></div><div class="games-grid">';
            for (var i = 0; i < GAMES.length; i++) {
                var g = GAMES[i];
                inner += '<div class="game-card selector" data-game-id="'+g.id+'" tabindex="0">' +
                    '<span class="g-icon">'+g.icon+'</span><h3>'+g.name+'</h3><p>'+g.desc+'</p></div>';
            }
            inner += '</div>';
            html.innerHTML = inner;
        }

        function updateFocus() {
            for (var i = 0; i < cardEls.length; i++) {
                cardEls[i].classList.toggle('focus', i === focusIdx);
            }
        }

        this.create = function () {
            buildHTML();
            scroll.render().append($(html));
            cardEls = html.querySelectorAll('.game-card');
            // клик
            cardEls.forEach(function (el) {
                el.addEventListener('click', function () {
                    GE.launch(el.getAttribute('data-game-id'));
                });
            });
            // hover:enter (Lampa-стиль)
            $(html).find('.game-card').on('hover:enter', function () {
                GE.launch($(this).data('game-id'));
            });
        };
        this.start = function () {
            var cols;
            function getCols() {
                var gw = html.querySelector('.games-grid');
                if (!gw) return 2;
                return Math.max(1, Math.floor(gw.offsetWidth / 210));
            }

            Lampa.Controller.add('games_grid', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(false, scroll.render());
                    cols = getCols();
                    updateFocus();
                },
                left: function () {
                    if (focusIdx % cols === 0) Lampa.Controller.toggle('menu');
                    else { focusIdx--; updateFocus(); }
                },
                right: function () {
                    if (focusIdx < cardEls.length-1) { focusIdx++; updateFocus(); }
                },
                up: function () {
                    cols = getCols();
                    if (focusIdx >= cols) { focusIdx -= cols; updateFocus(); }
                },
                down: function () {
                    cols = getCols();
                    if (focusIdx + cols < cardEls.length) { focusIdx += cols; updateFocus(); }
                },
                enter: function () {
                    if (cardEls[focusIdx]) GE.launch(cardEls[focusIdx].getAttribute('data-game-id'));
                },
                back: function () {
                    Lampa.Activity.backward();
                },
                gone: function () {}
            });

            Lampa.Controller.toggle('games_grid');
        };
        this.pause  = function () {};
        this.stop   = function () {};
        this.destroy = function () { scroll.destroy(); html.innerHTML = ''; };
        this.render  = function () { return scroll.render(); };
    }

    // ==========================================================
    //  ИНИЦИАЛИЗАЦИЯ ПЛАГИНА
    // ==========================================================
    function startPlugin() {
        injectCSS();

        // Регистрируем компонент
        Lampa.Component.add('games_plugin', GamesComponent);

        // Добавляем пункт «Игры» в боковое меню
        var menuItem = $('<li class="menu__item selector" data-action="games_plugin">' +
            '<div class="menu__ico">' + ICON_JOYSTICK + '</div>' +
            '<div class="menu__text">Игры</div>' +
            '</li>');

        menuItem.on('hover:enter', function () {
            Lampa.Activity.push({
                url: '',
                title: 'Игры',
                component: 'games_plugin',
                page: 1
            });
        });

        // Вставляем перед «Настройки»
        var $set = Lampa.Menu.render().find('[data-action="settings"]');
        if ($set.length) $set.before(menuItem);
        else Lampa.Menu.render().find('.menu__list').append(menuItem);
    }

    // Запуск: ждём готовности приложения
    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startPlugin();
        });
    }

})();

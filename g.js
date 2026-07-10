// lag/g.js - Плагин для Lampa с 20 играми (исправленная версия)
(function() {
    'use strict';

    // Проверка наличия Lampa
    if (typeof Lampa === 'undefined') {
        console.error('Lampa не найден');
        return;
    }

    const PLUGIN_NAME = 'lag';
    const PLUGIN_TITLE = 'Lampa Games';
    const RECORDS_KEY = 'lag_records';

    // ======== Хранилище рекордов ========
    function getRecord(gameId) {
        try {
            const data = JSON.parse(localStorage.getItem(RECORDS_KEY) || '{}');
            return data[gameId] || 0;
        } catch { return 0; }
    }

    function setRecord(gameId, score) {
        try {
            const data = JSON.parse(localStorage.getItem(RECORDS_KEY) || '{}');
            if (score > (data[gameId] || 0)) {
                data[gameId] = score;
                localStorage.setItem(RECORDS_KEY, JSON.stringify(data));
                return true;
            }
            return false;
        } catch { return false; }
    }

    // ======== Генеративный звук ========
    class SoundGenerator {
        constructor() {
            this.ctx = null;
        }

        init() {
            if (!this.ctx) {
                try {
                    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
                } catch (e) {
                    console.warn('Web Audio не поддерживается');
                }
            }
        }

        beep(freq = 440, duration = 100, type = 'square', volume = 0.3) {
            this.init();
            if (!this.ctx) return;
            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = type;
                osc.frequency.value = freq;
                gain.gain.value = volume;
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration / 1000);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + duration / 1000);
            } catch (e) {}
        }

        click() { this.beep(800, 80, 'sine', 0.2); }
        move() { this.beep(600, 50, 'sine', 0.15); }
        win() { this.beep(1000, 200, 'sine', 0.3); setTimeout(() => this.beep(1200, 200, 'sine', 0.3), 150); }
        lose() { this.beep(300, 300, 'sawtooth', 0.2); }
        flip() { this.beep(500, 60, 'square', 0.1); }
    }

    const sound = new SoundGenerator();

    // ======== Получение случайного изображения ========
    function getRandomImage(callback) {
        let sources = [];
        try {
            if (Lampa.History && typeof Lampa.History.list === 'function') {
                const hist = Lampa.History.list();
                if (Array.isArray(hist)) sources = sources.concat(hist.slice(0, 5));
            }
        } catch (e) {}
        if (sources.length === 0) {
            try {
                if (Lampa.Favorites && typeof Lampa.Favorites.list === 'function') {
                    const fav = Lampa.Favorites.list();
                    if (Array.isArray(fav)) sources = sources.concat(fav.slice(0, 5));
                }
            } catch (e) {}
        }
        if (sources.length === 0) {
            // Заглушка
            sources = [
                'https://via.placeholder.com/400x600/FF0000/FFFFFF?text=Image1',
                'https://via.placeholder.com/400x600/00FF00/FFFFFF?text=Image2',
                'https://via.placeholder.com/400x600/0000FF/FFFFFF?text=Image3',
            ];
        }
        let item = sources[Math.floor(Math.random() * sources.length)];
        let url = item;
        if (typeof item === 'object' && item.poster) url = item.poster;
        else if (typeof item === 'object' && item.image) url = item.image;
        callback(url);
    }

    // ======== Класс управления вводом ========
    class GameInput {
        constructor(container, handlers) {
            this.handlers = handlers;
            this.container = container;
            this.boundKeyDown = this.onKeyDown.bind(this);
            this.boundClick = this.onClick.bind(this);
            this.boundTouch = this.onTouch.bind(this);
            this.bindEvents();
        }

        bindEvents() {
            document.addEventListener('keydown', this.boundKeyDown);
            this.container.addEventListener('click', this.boundClick);
            this.container.addEventListener('touchstart', this.boundTouch);
            if (Lampa.Listener) {
                Lampa.Listener.add(this.container, 'key', this.boundKeyDown);
            }
        }

        onKeyDown(e) {
            const key = e.key;
            let action = null;
            switch(key) {
                case 'ArrowUp': action = 'up'; break;
                case 'ArrowDown': action = 'down'; break;
                case 'ArrowLeft': action = 'left'; break;
                case 'ArrowRight': action = 'right'; break;
                case 'Enter': action = 'enter'; break;
                case 'Backspace': case 'Escape': action = 'back'; break;
                default: return;
            }
            e.preventDefault();
            if (this.handlers[action]) this.handlers[action]();
            sound.move();
        }

        onClick(e) {
            const rect = this.container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            if (this.handlers.tap) this.handlers.tap(x, y);
        }

        onTouch(e) {
            e.preventDefault();
            const touch = e.touches[0];
            if (!touch) return;
            const rect = this.container.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            if (this.handlers.tap) this.handlers.tap(x, y);
        }

        destroy() {
            document.removeEventListener('keydown', this.boundKeyDown);
            this.container.removeEventListener('click', this.boundClick);
            this.container.removeEventListener('touchstart', this.boundTouch);
            if (Lampa.Listener) {
                Lampa.Listener.remove(this.container, 'key', this.boundKeyDown);
            }
        }
    }

    // ======== Главное меню игр ========
    const games = [
        { id: 'tetris', title: 'Тетрис' },
        { id: 'snake', title: 'Змейка' },
        { id: '2048', title: '2048' },
        { id: 'solitaire', title: 'Пасьянс косынка' },
        { id: 'arkanoid', title: 'Арканоид' },
        { id: 'pong', title: 'Понг' },
        { id: 'poker', title: 'Покер' },
        { id: 'twentyone', title: '21' },
        { id: 'fifteen', title: 'Пятнашки' },
        { id: 'pipes', title: 'Трубопровод' },
        { id: 'xonix', title: 'Xonix' },
        { id: 'sokoban', title: 'Sokoban' },
        { id: 'sudoku', title: 'Судоку' },
        { id: 'checkers', title: 'Шашки' },
        { id: 'chess', title: 'Шахматы' },
        { id: 'mahjong', title: 'Маджонг' },
        { id: 'battleship', title: 'Морской бой' },
        { id: 'match3', title: 'Три в ряд' },
        { id: 'party', title: 'Lampa party' },
        { id: 'puzzle', title: 'Пазл' }
    ];

    // Фабрики игр (заполняются ниже)
    const gameFactories = {};

    // ======== Запуск игры с управлением жизненным циклом ========
    function launchGame(gameId) {
        sound.click();
        try {
            const activity = Lampa.Activity.active();
            if (!activity) {
                console.error('Нет активной активности');
                return;
            }
            const content = activity.content;
            if (!content) {
                console.error('Нет контента');
                return;
            }

            // Останавливаем предыдущую игру, если есть
            if (content._gameStop) {
                content._gameStop();
                delete content._gameStop;
            }

            // Очищаем контент
            content.innerHTML = '';
            const container = document.createElement('div');
            container.id = 'game-container';
            container.style.cssText = 'width:100%;height:100%;position:relative;overflow:hidden;background:#111;color:#fff;';
            content.appendChild(container);

            // Запускаем игру
            const gameFn = gameFactories[gameId];
            if (gameFn) {
                gameFn(container);
            } else {
                container.innerHTML = '<div style="text-align:center;padding:50px;font-size:24px;">Игра не реализована</div>';
                // Пустая остановка
                container._gameStop = function() {};
            }
        } catch (e) {
            console.error('Ошибка запуска игры:', e);
            // Показываем сообщение об ошибке
            const activity = Lampa.Activity.active();
            if (activity && activity.content) {
                activity.content.innerHTML = `<div style="color:red;padding:50px;text-align:center;font-size:20px;">Ошибка загрузки игры: ${e.message}</div>`;
            }
        }
    }

    // ======== Фабрики игр ========

    // 1. Тетрис
    gameFactories.tetris = function(container) {
        container.innerHTML = '<div style="padding:20px;font-size:20px;">Тетрис (упрощённый)</div>';
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 600;
        canvas.style.margin = '0 auto';
        container.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        const COLS = 10, ROWS = 20, BLOCK = 30;
        let board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
        let piece = null;
        let score = 0;
        let interval = null;
        let gameOver = false;
        const shapes = [
            [[1,1,1,1]],
            [[1,1],[1,1]],
            [[0,1,0],[1,1,1]],
            [[1,0,0],[1,1,1]],
            [[0,0,1],[1,1,1]],
            [[1,1,0],[0,1,1]],
            [[0,1,1],[1,1,0]]
        ];
        const colors = ['#00f', '#ff0', '#f0f', '#0ff', '#f00', '#0f0', '#fa0'];

        function newPiece() {
            const idx = Math.floor(Math.random() * shapes.length);
            const shape = shapes[idx];
            return { shape, x: Math.floor((COLS - shape[0].length)/2), y: 0, color: colors[idx] };
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let r=0; r<ROWS; r++) {
                for (let c=0; c<COLS; c++) {
                    if (board[r][c]) {
                        ctx.fillStyle = board[r][c];
                        ctx.fillRect(c*BLOCK, r*BLOCK, BLOCK-1, BLOCK-1);
                    }
                }
            }
            if (piece) {
                const { shape, x, y, color } = piece;
                for (let r=0; r<shape.length; r++) {
                    for (let c=0; c<shape[r].length; c++) {
                        if (shape[r][c]) {
                            ctx.fillStyle = color;
                            ctx.fillRect((x+c)*BLOCK, (y+r)*BLOCK, BLOCK-1, BLOCK-1);
                        }
                    }
                }
            }
            ctx.fillStyle = '#fff';
            ctx.font = '20px sans-serif';
            ctx.fillText('Score: '+score, 10, 30);
        }

        function collide(shape, px, py) {
            for (let r=0; r<shape.length; r++) {
                for (let c=0; c<shape[r].length; c++) {
                    if (shape[r][c]) {
                        let nx = px+c, ny = py+r;
                        if (nx<0 || nx>=COLS || ny>=ROWS || ny<0) return true;
                        if (ny>=0 && board[ny][nx]) return true;
                    }
                }
            }
            return false;
        }

        function lock() {
            if (!piece) return;
            const { shape, x, y, color } = piece;
            for (let r=0; r<shape.length; r++) {
                for (let c=0; c<shape[r].length; c++) {
                    if (shape[r][c]) {
                        let ny = y+r;
                        if (ny<0) { gameOver = true; clearInterval(interval); return; }
                        board[ny][x+c] = color;
                    }
                }
            }
            let cleared = 0;
            for (let r=ROWS-1; r>=0; ) {
                let full = board[r].every(cell => cell!==0);
                if (full) {
                    board.splice(r,1);
                    board.unshift(Array(COLS).fill(0));
                    cleared++;
                } else r--;
            }
            if (cleared) {
                score += [0,40,100,300,1200][cleared]||0;
                setRecord('tetris', score);
            }
            piece = newPiece();
            if (collide(piece.shape, piece.x, piece.y)) {
                gameOver = true;
                clearInterval(interval);
                sound.lose();
            }
            draw();
        }

        function move(dx, dy) {
            if (!piece || gameOver) return;
            const { shape, x, y, color } = piece;
            if (!collide(shape, x+dx, y+dy)) {
                piece.x += dx;
                piece.y += dy;
                draw();
            } else if (dy === 1) {
                lock();
                draw();
            }
        }

        function rotate() {
            if (!piece || gameOver) return;
            const { shape, x, y, color } = piece;
            const rotated = shape[0].map((_, idx) => shape.map(row => row[idx]).reverse());
            if (!collide(rotated, x, y)) {
                piece.shape = rotated;
                draw();
            }
        }

        function start() {
            piece = newPiece();
            interval = setInterval(() => move(0,1), 500);
            draw();
        }

        const input = new GameInput(container, {
            left: () => move(-1,0),
            right: () => move(1,0),
            down: () => move(0,1),
            up: () => rotate(),
            enter: () => { if (gameOver) { board = Array(ROWS).fill().map(()=>Array(COLS).fill(0)); score=0; gameOver=false; start(); } },
            tap: () => rotate()
        });

        start();

        container._gameStop = function() {
            if (interval) clearInterval(interval);
            input.destroy();
        };
    };

    // 2. Змейка
    gameFactories.snake = function(container) {
        container.innerHTML = '<div style="padding:20px;font-size:20px;">Змейка</div>';
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        canvas.style.margin = '0 auto';
        container.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        const SIZE = 20;
        const COLS = 20, ROWS = 20;
        let snake = [{x:10,y:10}];
        let dir = {x:0,y:-1};
        let food = {x:15,y:10};
        let score = 0;
        let gameOver = false;
        let interval = null;

        function draw() {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle = '#0f0';
            snake.forEach(seg => ctx.fillRect(seg.x*SIZE, seg.y*SIZE, SIZE-1, SIZE-1));
            ctx.fillStyle = '#f00';
            ctx.fillRect(food.x*SIZE, food.y*SIZE, SIZE-1, SIZE-1);
            ctx.fillStyle = '#fff';
            ctx.font = '20px sans-serif';
            ctx.fillText('Score: '+score, 10, 30);
            if (gameOver) {
                ctx.fillStyle = '#fff';
                ctx.font = '40px sans-serif';
                ctx.fillText('GAME OVER', 50, 200);
            }
        }

        function step() {
            if (gameOver) return;
            const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
            if (head.x<0 || head.x>=COLS || head.y<0 || head.y>=ROWS) {
                gameOver = true;
                clearInterval(interval);
                sound.lose();
                draw();
                return;
            }
            if (snake.some(seg => seg.x===head.x && seg.y===head.y)) {
                gameOver = true;
                clearInterval(interval);
                sound.lose();
                draw();
                return;
            }
            snake.unshift(head);
            if (head.x===food.x && head.y===food.y) {
                score++;
                setRecord('snake', score);
                sound.flip();
                do {
                    food = {x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS)};
                } while (snake.some(seg => seg.x===food.x && seg.y===food.y));
            } else {
                snake.pop();
            }
            draw();
        }

        function changeDir(dx, dy) {
            if (gameOver) return;
            if (dir.x === -dx && dir.y === -dy) return;
            dir = {x:dx, y:dy};
        }

        const input = new GameInput(container, {
            up: () => changeDir(0,-1),
            down: () => changeDir(0,1),
            left: () => changeDir(-1,0),
            right: () => changeDir(1,0),
            enter: () => { if (gameOver) { snake = [{x:10,y:10}]; dir={x:0,y:-1}; score=0; gameOver=false; clearInterval(interval); interval = setInterval(step, 200); draw(); } },
            tap: () => {}
        });

        interval = setInterval(step, 200);
        draw();

        container._gameStop = function() {
            if (interval) clearInterval(interval);
            input.destroy();
        };
    };

    // 3. 2048
    gameFactories['2048'] = function(container) {
        container.innerHTML = '<div style="padding:20px;font-size:20px;">2048</div>';
        const board = [
            [0,0,0,0],
            [0,0,0,0],
            [0,0,0,0],
            [0,0,0,0]
        ];
        let score = 0;
        let gameOver = false;
        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid;grid-template-columns:repeat(4,80px);gap:10px;justify-content:center;margin:20px auto;';
        container.appendChild(grid);
        const cells = [];
        for (let i=0;i<16;i++) {
            const cell = document.createElement('div');
            cell.style.cssText = 'width:80px;height:80px;background:#ccc;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold;color:#000;border-radius:5px;';
            grid.appendChild(cell);
            cells.push(cell);
        }

        function updateUI() {
            for (let r=0;r<4;r++) {
                for (let c=0;c<4;c++) {
                    const val = board[r][c];
                    const idx = r*4+c;
                    cells[idx].textContent = val || '';
                    cells[idx].style.background = val ? '#e5e5e5' : '#ccc';
                    cells[idx].style.color = val ? '#000' : '#ccc';
                }
            }
            let scoreEl = container.querySelector('.score');
            if (!scoreEl) {
                scoreEl = document.createElement('div');
                scoreEl.className = 'score';
                scoreEl.style.cssText = 'text-align:center;font-size:24px;color:#fff;padding:10px;';
                container.insertBefore(scoreEl, grid);
            }
            scoreEl.textContent = 'Score: '+score;
            // Удаляем старый оверлей, если есть
            const oldGo = container.querySelector('.gameover-msg');
            if (oldGo) oldGo.remove();
            if (gameOver) {
                const go = document.createElement('div');
                go.className = 'gameover-msg';
                go.textContent = 'GAME OVER (нажмите Enter для перезапуска)';
                go.style.cssText = 'text-align:center;font-size:24px;color:red;padding:20px;';
                container.appendChild(go);
            }
        }

        function addRandom() {
            const empty = [];
            for (let r=0;r<4;r++) for (let c=0;c<4;c++) if (board[r][c]===0) empty.push({r,c});
            if (empty.length===0) { gameOver = true; sound.lose(); updateUI(); return; }
            const pos = empty[Math.floor(Math.random()*empty.length)];
            board[pos.r][pos.c] = Math.random() < 0.9 ? 2 : 4;
        }

        function slideRow(row) {
            let newRow = row.filter(v=>v!==0);
            for (let i=0;i<newRow.length-1;i++) {
                if (newRow[i]===newRow[i+1]) {
                    newRow[i]*=2;
                    score += newRow[i];
                    newRow.splice(i+1,1);
                }
            }
            while (newRow.length<4) newRow.push(0);
            return newRow;
        }

        function move(dx, dy) {
            if (gameOver) return;
            let moved = false;
            const old = board.map(row=>[...row]);
            if (dy === -1) {
                for (let c=0;c<4;c++) {
                    const col = [board[0][c], board[1][c], board[2][c], board[3][c]];
                    const newCol = slideRow(col);
                    for (let r=0;r<4;r++) board[r][c] = newCol[r];
                }
            } else if (dy === 1) {
                for (let c=0;c<4;c++) {
                    const col = [board[3][c], board[2][c], board[1][c], board[0][c]];
                    const newCol = slideRow(col);
                    for (let r=0;r<4;r++) board[3-r][c] = newCol[r];
                }
            } else if (dx === -1) {
                for (let r=0;r<4;r++) {
                    board[r] = slideRow(board[r]);
                }
            } else if (dx === 1) {
                for (let r=0;r<4;r++) {
                    board[r] = slideRow(board[r].reverse()).reverse();
                }
            }
            for (let r=0;r<4;r++) for (let c=0;c<4;c++) if (board[r][c]!==old[r][c]) moved = true;
            if (moved) {
                addRandom();
                setRecord('2048', score);
                sound.move();
                updateUI();
            }
            let canMove = false;
            for (let r=0;r<4;r++) for (let c=0;c<4;c++) {
                if (board[r][c]===0) canMove = true;
                if (r<3 && board[r][c]===board[r+1][c]) canMove = true;
                if (c<3 && board[r][c]===board[r][c+1]) canMove = true;
            }
            if (!canMove) { gameOver = true; sound.lose(); updateUI(); }
        }

        function restart() {
            for (let r=0;r<4;r++) for (let c=0;c<4;c++) board[r][c]=0;
            score = 0;
            gameOver = false;
            addRandom();
            addRandom();
            updateUI();
        }

        const input = new GameInput(container, {
            up: () => move(0,-1),
            down: () => move(0,1),
            left: () => move(-1,0),
            right: () => move(1,0),
            enter: () => { if (gameOver) restart(); },
            tap: () => {}
        });

        addRandom();
        addRandom();
        updateUI();

        container._gameStop = function() {
            input.destroy();
        };
    };

    // 4. Пасьянс косынка (заглушка)
    gameFactories.solitaire = function(container) {
        container.innerHTML = '<div style="padding:20px;font-size:20px;">Пасьянс косынка (упрощённый)</div>';
        const div = document.createElement('div');
        div.textContent = 'Игра в разработке. Используйте стрелки и Enter для имитации.';
        div.style.cssText = 'color:#fff;padding:20px;text-align:center;';
        container.appendChild(div);
        const input = new GameInput(container, {
            enter: () => { sound.click(); div.textContent = 'Клик! (имитация)'; },
            tap: () => { sound.click(); div.textContent = 'Клик! (имитация)'; }
        });
        container._gameStop = function() { input.destroy(); };
    };

    // 5. Арканоид
    gameFactories.arkanoid = function(container) {
        container.innerHTML = '<div style="padding:20px;font-size:20px;">Арканоид</div>';
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 500;
        canvas.style.margin = '0 auto';
        container.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        const W = 400, H = 500;
        let paddle = {x: 150, w: 80, h: 15, y: 470};
        let ball = {x: 200, y: 450, r: 8, dx: 3, dy: -4};
        let bricks = [];
        const rows = 5, cols = 8;
        const brickW = 40, brickH = 20, gap = 5;
        let score = 0;
        let gameOver = false;
        let win = false;
        let animId = null;

        function initBricks() {
            bricks = [];
            for (let r=0;r<rows;r++) {
                for (let c=0;c<cols;c++) {
                    bricks.push({
                        x: c*(brickW+gap) + 15,
                        y: r*(brickH+gap) + 30,
                        w: brickW, h: brickH,
                        alive: true,
                        color: `hsl(${r*40+120},80%,60%)`
                    });
                }
            }
        }
        initBricks();

        function draw() {
            ctx.clearRect(0,0,W,H);
            bricks.forEach(b => {
                if (b.alive) {
                    ctx.fillStyle = b.color;
                    ctx.fillRect(b.x, b.y, b.w, b.h);
                }
            });
            ctx.fillStyle = '#0af';
            ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = '16px sans-serif';
            ctx.fillText('Score: '+score, 10, 20);
            if (gameOver) {
                ctx.fillStyle = 'red';
                ctx.font = '40px sans-serif';
                ctx.fillText('GAME OVER', 60, 250);
            }
            if (win) {
                ctx.fillStyle = 'green';
                ctx.font = '40px sans-serif';
                ctx.fillText('YOU WIN!', 80, 250);
            }
        }

        function step() {
            if (gameOver || win) return;
            ball.x += ball.dx;
            ball.y += ball.dy;
            if (ball.x - ball.r < 0 || ball.x + ball.r > W) { ball.dx = -ball.dx; sound.flip(); }
            if (ball.y - ball.r < 0) { ball.dy = -ball.dy; sound.flip(); }
            if (ball.y + ball.r > H) {
                gameOver = true;
                sound.lose();
                if (animId) cancelAnimationFrame(animId);
                draw();
                return;
            }
            if (ball.dy > 0 && ball.y + ball.r >= paddle.y && ball.x >= paddle.x && ball.x <= paddle.x + paddle.w) {
                ball.dy = -ball.dy;
                let hit = (ball.x - (paddle.x + paddle.w/2)) / (paddle.w/2);
                ball.dx = hit * 3;
                sound.move();
            }
            bricks.forEach(b => {
                if (!b.alive) return;
                if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w &&
                    ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
                    b.alive = false;
                    score += 10;
                    setRecord('arkanoid', score);
                    sound.flip();
                    let overlapX = Math.min(ball.x + ball.r - b.x, b.x + b.w - (ball.x - ball.r));
                    let overlapY = Math.min(ball.y + ball.r - b.y, b.y + b.h - (ball.y - ball.y));
                    if (overlapX < overlapY) ball.dx = -ball.dx;
                    else ball.dy = -ball.dy;
                }
            });
            if (bricks.every(b => !b.alive)) {
                win = true;
                sound.win();
                if (animId) cancelAnimationFrame(animId);
                draw();
                return;
            }
            draw();
            animId = requestAnimationFrame(step);
        }

        function reset() {
            ball.x = 200; ball.y = 450; ball.dx = 3; ball.dy = -4;
            paddle.x = 150;
            score = 0;
            gameOver = false;
            win = false;
            initBricks();
            if (animId) cancelAnimationFrame(animId);
            step();
        }

        const input = new GameInput(container, {
            left: () => { if (paddle.x > 0) paddle.x -= 15; draw(); },
            right: () => { if (paddle.x < W - paddle.w) paddle.x += 15; draw(); },
            enter: () => { if (gameOver || win) reset(); },
            tap: (x,y) => {
                let rect = canvas.getBoundingClientRect();
                let scaleX = canvas.width / rect.width;
                let px = (x - paddle.w/2) * scaleX;
                if (px < 0) px = 0;
                if (px > W - paddle.w) px = W - paddle.w;
                paddle.x = px;
                draw();
            }
        });

        step();

        container._gameStop = function() {
            if (animId) cancelAnimationFrame(animId);
            input.destroy();
        };
    };

    // 6. Понг
    gameFactories.pong = function(container) {
        container.innerHTML = '<div style="padding:20px;font-size:20px;">Понг</div>';
        const canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = 400;
        canvas.style.margin = '0 auto';
        container.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        const W = 500, H = 400;
        let leftPaddle = {x:10, y:H/2-40, w:10, h:80};
        let rightPaddle = {x:W-20, y:H/2-40, w:10, h:80};
        let ball = {x:W/2, y:H/2, r:6, dx:4, dy:3};
        let scoreLeft = 0, scoreRight = 0;
        let gameOver = false;
        let animId = null;

        function draw() {
            ctx.clearRect(0,0,W,H);
            ctx.fillStyle = '#fff';
            ctx.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.w, leftPaddle.h);
            ctx.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.w, rightPaddle.h);
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
            ctx.fill();
            ctx.font = '30px sans-serif';
            ctx.fillText(scoreLeft, 100, 50);
            ctx.fillText(scoreRight, W-130, 50);
            if (gameOver) {
                ctx.fillStyle = 'red';
                ctx.font = '40px sans-serif';
                ctx.fillText('GAME OVER', 120, 200);
            }
        }

        function step() {
            if (gameOver) return;
            ball.x += ball.dx;
            ball.y += ball.dy;
            if (ball.y - ball.r < 0 || ball.y + ball.r > H) { ball.dy = -ball.dy; sound.flip(); }
            if (ball.dx < 0 && ball.x - ball.r <= leftPaddle.x + leftPaddle.w && ball.y >= leftPaddle.y && ball.y <= leftPaddle.y + leftPaddle.h) {
                ball.dx = -ball.dx;
                ball.x = leftPaddle.x + leftPaddle.w + ball.r;
                sound.move();
            }
            if (ball.dx > 0 && ball.x + ball.r >= rightPaddle.x && ball.y >= rightPaddle.y && ball.y <= rightPaddle.y + rightPaddle.h) {
                ball.dx = -ball.dx;
                ball.x = rightPaddle.x - ball.r;
                sound.move();
            }
            if (ball.x < 0) {
                scoreRight++;
                setRecord('pong', Math.max(scoreLeft, scoreRight));
                resetBall();
            }
            if (ball.x > W) {
                scoreLeft++;
                setRecord('pong', Math.max(scoreLeft, scoreRight));
                resetBall();
            }
            if (ball.dx < 0) {
                let target = ball.y - leftPaddle.h/2;
                leftPaddle.y += (target - leftPaddle.y) * 0.1;
                if (leftPaddle.y < 0) leftPaddle.y = 0;
                if (leftPaddle.y > H - leftPaddle.h) leftPaddle.y = H - leftPaddle.h;
            }
            draw();
            animId = requestAnimationFrame(step);
        }

        function resetBall() {
            ball.x = W/2;
            ball.y = H/2;
            ball.dx = (Math.random()>0.5?1:-1)*4;
            ball.dy = (Math.random()>0.5?1:-1)*3;
        }

        function resetGame() {
            scoreLeft = 0; scoreRight = 0;
            gameOver = false;
            resetBall();
            leftPaddle.y = H/2-40;
            rightPaddle.y = H/2-40;
        }

        const input = new GameInput(container, {
            up: () => { rightPaddle.y -= 20; if (rightPaddle.y<0) rightPaddle.y=0; draw(); },
            down: () => { rightPaddle.y += 20; if (rightPaddle.y>H-rightPaddle.h) rightPaddle.y=H-rightPaddle.h; draw(); },
            enter: () => { if (gameOver) resetGame(); },
            tap: (x,y) => {
                let rect = canvas.getBoundingClientRect();
                let scaleY = canvas.height / rect.height;
                let posY = y * scaleY - rightPaddle.h/2;
                if (posY<0) posY=0;
                if (posY>H-rightPaddle.h) posY=H-rightPaddle.h;
                rightPaddle.y = posY;
                draw();
            }
        });

        resetBall();
        step();

        container._gameStop = function() {
            if (animId) cancelAnimationFrame(animId);
            input.destroy();
        };
    };

    // 7. Покер
    gameFactories.poker = function(container) {
        container.innerHTML = '<div style="padding:20px;font-size:20px;">Покер (упрощённый)</div>';
        const div = document.createElement('div');
        div.style.cssText = 'color:#fff;padding:20px;text-align:center;';
        div.innerHTML = 'Нажмите Enter для раздачи.';
        container.appendChild(div);
        const cards = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
        const suits = ['♠','♥','♦','♣'];
        function deal() {
            let hand = [];
            for (let i=0;i<5;i++) {
                let card = cards[Math.floor(Math.random()*cards.length)] + suits[Math.floor(Math.random()*suits.length)];
                hand.push(card);
            }
            div.innerHTML = 'Ваша рука: ' + hand.join(' ') + '<br>Нажмите Enter снова';
            sound.flip();
        }
        const input = new GameInput(container, {
            enter: () => deal(),
            tap: () => deal()
        });
        deal();
        container._gameStop = function() { input.destroy(); };
    };

    // 8. 21 (очко)
    gameFactories.twentyone = function(container) {
        container.innerHTML = '<div style="padding:20px;font-size:20px;">21 (Очко)</div>';
        const div = document.createElement('div');
        div.style.cssText = 'color:#fff;padding:20px;text-align:center;font-size:24px;';
        container.appendChild(div);
        let deck = [];
        let player = [];
        let dealer = [];
        let gameOver = false;
        const values = {'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':10,'Q':10,'K':10,'A':11};

        function newDeck() {
            deck = [];
            const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
            for (let r of ranks) for (let s of ['♠','♥','♦','♣']) deck.push(r+s);
            shuffle(deck);
        }
        function shuffle(arr) { for (let i=arr.length-1;i>0;i--) { let j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } }
        function cardValue(card) { let rank = card.slice(0,-1); return values[rank]; }
        function handValue(hand) {
            let total = hand.reduce((s,c)=>s+cardValue(c),0);
            let aces = hand.filter(c=>c.startsWith('A')).length;
            while (total>21 && aces>0) { total-=10; aces--; }
            return total;
        }

        function show() {
            let p = player.map(c=>c).join(' ');
            let d = dealer.map(c=>c).join(' ');
            let pv = handValue(player);
            let dv = handValue(dealer);
            div.innerHTML = `Ваши карты: ${p} (${pv})<br>Карты дилера: ${d} (${dv})<br>`;
            if (gameOver) {
                if (pv>21) div.innerHTML += 'Перебор! Вы проиграли.';
                else if (dv>21) div.innerHTML += 'Дилер перебрал! Вы выиграли!';
                else if (pv===21 && player.length===2) div.innerHTML += 'Блэкджек! Вы выиграли!';
                else if (pv>dv) div.innerHTML += 'Вы выиграли!';
                else if (pv<dv) div.innerHTML += 'Вы проиграли.';
                else div.innerHTML += 'Ничья.';
                div.innerHTML += '<br>Нажмите Enter для новой игры.';
            } else {
                div.innerHTML += 'Нажмите вверх (взять карту) или вниз (остановиться).';
            }
        }

        function startGame() {
            newDeck();
            player = [deck.pop(), deck.pop()];
            dealer = [deck.pop(), deck.pop()];
            gameOver = false;
            show();
        }

        function hit() {
            if (gameOver) return;
            player.push(deck.pop());
            if (handValue(player)>21) {
                gameOver = true;
                sound.lose();
                setRecord('twentyone', 0);
                show();
            } else {
                sound.flip();
                show();
            }
        }

        function stand() {
            if (gameOver) return;
            while (handValue(dealer)<17) dealer.push(deck.pop());
            gameOver = true;
            let pv = handValue(player), dv = handValue(dealer);
            if (dv>21 || pv>dv) sound.win();
            else sound.lose();
            show();
        }

        const input = new GameInput(container, {
            up: () => hit(),
            down: () => stand(),
            enter: () => { if (gameOver) startGame(); },
            tap: () => hit()
        });
        startGame();

        container._gameStop = function() { input.destroy(); };
    };

    // 9. Пятнашки
    gameFactories.fifteen = function(container) {
        container.innerHTML = '<div style="padding:20px;font-size:20px;">Пятнашки</div>';
        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid;grid-template-columns:repeat(4,80px);gap:5px;justify-content:center;margin:20px auto;';
        container.appendChild(grid);
        let tiles = [];
        let empty = {r:3,c:3};
        let gameWon = false;

        function init() {
            tiles = [];
            for (let i=1;i<16;i++) tiles.push(i);
            tiles.push(0);
            for (let i=tiles.length-1;i>0;i--) {
                let j=Math.floor(Math.random()*(i+1));
                [tiles[i],tiles[j]]=[tiles[j],tiles[i]];
            }
            for (let r=0;r<4;r++) for (let c=0;c<4;c++) if (tiles[r*4+c]===0) empty={r,c};
            gameWon = false;
            render();
        }

        function render() {
            grid.innerHTML = '';
            for (let r=0;r<4;r++) {
                for (let c=0;c<4;c++) {
                    const val = tiles[r*4+c];
                    const cell = document.createElement('div');
                    cell.style.cssText = `width:80px;height:80px;background:${val?'#aaa':'#333'};display:flex;align-items:center;justify-content:center;font-size:24px;border-radius:5px;cursor:pointer;`;
                    cell.textContent = val || '';
                    cell.dataset.r = r;
                    cell.dataset.c = c;
                    cell.addEventListener('click', () => handleClick(r,c));
                    grid.appendChild(cell);
                }
            }
        }

        function handleClick(r,c) {
            if (gameWon) return;
            if (Math.abs(r-empty.r)+Math.abs(c-empty.c)===1) {
                let idx1 = r*4+c, idx2 = empty.r*4+empty.c;
                [tiles[idx1], tiles[idx2]] = [tiles[idx2], tiles[idx1]];
                empty = {r,c};
                sound.flip();
                render();
                checkWin();
            }
        }

        function checkWin() {
            for (let i=0;i<15;i++) if (tiles[i]!==i+1) return;
            sound.win();
            setRecord('fifteen', 1);
            gameWon = true;
            alert('Поздравляем! Вы собрали пятнашки!');
        }

        const input = new GameInput(container, {
            up: () => { if (empty.r<3 && !gameWon) handleClick(empty.r+1, empty.c); },
            down: () => { if (empty.r>0 && !gameWon) handleClick(empty.r-1, empty.c); },
            left: () => { if (empty.c<3 && !gameWon) handleClick(empty.r, empty.c+1); },
            right: () => { if (empty.c>0 && !gameWon) handleClick(empty.r, empty.c-1); },
            enter: () => init(),
            tap: () => {}
        });

        init();

        container._gameStop = function() { input.destroy(); };
    };

    // 10. Трубопровод (заглушка)
    gameFactories.pipes = function(container) {
        container.innerHTML = '<div style="padding:20px;font-size:20px;">Трубопровод (упрощённо)</div>';
        const div = document.createElement('div');
        div.style.cssText = 'color:#fff;padding:20px;text-align:center;';
        div.textContent = 'Игра в разработке. Нажмите Enter для вращения.';
        container.appendChild(div);
        let rotation = 0;
        const input = new GameInput(container, {
            enter: () => { rotation = (rotation+1)%4; div.textContent = 'Труба повёрнута на '+rotation*90+'°'; sound.flip(); },
            tap: () => { rotation = (rotation+1)%4; div.textContent = 'Труба повёрнута на '+rotation*90+'°'; sound.flip(); }
        });
        container._gameStop = function() { input.destroy(); };
    };

    // 11. Xonix (заглушка)
    gameFactories.xonix = function(container) {
        container.innerHTML = '<div style="padding:20px;font-size:20px;">Xonix (упрощённо)</div>';
        const div = document.createElement('div');
        div.style.cssText = 'color:#fff;padding:20px;text-align:center;';
        div.textContent = 'Игра в разработке.';
        container.appendChild(div);
        const input = new GameInput(container, {});
        container._gameStop = function() { input.destroy(); };
    };

    // 12. Sokoban (заглушка)
    gameFactories.sokoban = function(container) {
        container.innerHTML = '<div style="padding:20px;font-size:20px;">Sokoban (упрощённо)</div>';
        const div = document.createElement('div');
        div.style.cssText = 'color:#fff;padding:20px;text-align:center;';
        div.textContent = 'Игра в разработке.';
        container.appendChild(div);
        const input = new GameInput(container, {});
        container._gameStop = function() { input.destroy(); };
    };

    // 13. Судоку (заглушка)
    gameFactories.sudoku = function(container) {
        container.innerHTML = '<div style="padding:20px;font-size:20px;">Судоку (упрощённо)</div>';
        const div = document.createElement('div');
        div.style.cssText = 'color:#fff;padding:20px;text-align:center;';
        div.textContent = 'Игра в разработке.';
        container.appendChild(div);
        const input = new GameInput(container, {});
        container._gameStop = function() { input.destroy(); };
    };

    // 14. Шашки (заглушка)
    gameFactories.checkers = function(container) {
        container.innerHTML = '<div style="padding:20px;font-size:20px;">Шашки (упрощённо)</div>';
        const div = document.createElement('div');
        div.style.cssText = 'color:#fff;padding:20px;text-align:center;';
        div.textContent = 'Игра в разработке.';
        container.appendChild(div);
        const input = new GameInput(container, {});
        container._gameStop = function() { input.destroy(); };
    };

    // 15. Шахматы (заглушка)
    gameFactories.chess = function(container) {
        container.innerHTML = '<div style="padding:20px;font-size:20px;">Шахматы (упрощённо)</div>';
        const div = document.createElement('div');
        div.style.cssText = 'color:#fff;padding:20px;text-align:center;';
        div.textContent = 'Игра в разработке.';
        container.appendChild(div);
        const input = new GameInput(container, {});
        container._gameStop = function() { input.destroy(); };
    };

    // 16. Маджонг
    gameFactories.mahjong = function(container) {
        container.innerHTML = '<div style="padding:20px;font-size:20px;">Маджонг (упрощённо)</div>';
        const div = document.createElement('div');
        div.style.cssText = 'color:#fff;padding:20px;text-align:center;';
        div.textContent = 'Загрузка изображения...';
        container.appendChild(div);
        getRandomImage((url) => {
            if (!container.parentNode) return; // контейнер удалён
            const img = document.createElement('img');
            img.src = url;
            img.style.maxWidth = '200px';
            img.style.maxHeight = '200px';
            div.textContent = 'Изображение для Маджонга:';
            container.appendChild(img);
        });
        const input = new GameInput(container, {});
        container._gameStop = function() { input.destroy(); };
    };

    // 17. Морской бой (заглушка)
    gameFactories.battleship = function(container) {
        container.innerHTML = '<div style="padding:20px;font-size:20px;">Морской бой (упрощённо)</div>';
        const div = document.createElement('div');
        div.style.cssText = 'color:#fff;padding:20px;text-align:center;';
        div.textContent = 'Игра в разработке.';
        container.appendChild(div);
        const input = new GameInput(container, {});
        container._gameStop = function() { input.destroy(); };
    };

    // 18. Три в ряд
    gameFactories.match3 = function(container) {
        container.innerHTML = '<div style="padding:20px;font-size:20px;">Три в ряд (упрощённо)</div>';
        const div = document.createElement('div');
        div.style.cssText = 'color:#fff;padding:20px;text-align:center;';
        div.textContent = 'Загрузка изображения...';
        container.appendChild(div);
        getRandomImage((url) => {
            if (!container.parentNode) return;
            const img = document.createElement('img');
            img.src = url;
            img.style.maxWidth = '200px';
            img.style.maxHeight = '200px';
            div.textContent = 'Изображение для игры "Три в ряд":';
            container.appendChild(img);
        });
        const input = new GameInput(container, {});
        container._gameStop = function() { input.destroy(); };
    };

    // 19. Lampa party
    gameFactories.party = function(container) {
        container.innerHTML = '<div style="padding:20px;font-size:20px;">Lampa party</div>';
        const div = document.createElement('div');
        div.style.cssText = 'color:#fff;padding:20px;text-align:center;';
        div.textContent = 'Мини-игра: бросок кубика. Нажмите Enter.';
        container.appendChild(div);
        let steps = 0;
        let gameWon = false;
        const input = new GameInput(container, {
            enter: () => {
                if (gameWon) {
                    steps = 0;
                    gameWon = false;
                    div.textContent = 'Новая игра! Нажмите Enter.';
                    return;
                }
                let roll = Math.floor(Math.random()*6)+1;
                steps += roll;
                div.textContent = `Выпало ${roll}, всего шагов ${steps}. Нажмите Enter снова.`;
                sound.flip();
                if (steps >= 20) {
                    sound.win();
                    setRecord('party', steps);
                    div.textContent += ' Победа! Нажмите Enter для новой игры.';
                    gameWon = true;
                }
            },
            tap: () => {}
        });
        container._gameStop = function() { input.destroy(); };
    };

    // 20. Пазл
    gameFactories.puzzle = function(container) {
        container.innerHTML = '<div style="padding:20px;font-size:20px;">Пазл</div>';
        const div = document.createElement('div');
        div.style.cssText = 'color:#fff;padding:20px;text-align:center;';
        div.textContent = 'Загрузка изображения...';
        container.appendChild(div);
        getRandomImage((url) => {
            if (!container.parentNode) return;
            const img = document.createElement('img');
            img.src = url;
            img.style.maxWidth = '300px';
            img.style.maxHeight = '300px';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 300;
                canvas.height = 300;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, 300, 300);
                div.innerHTML = 'Пазл (4 части), нажмите Enter для перемешивания.';
                const grid = document.createElement('div');
                grid.style.cssText = 'display:grid;grid-template-columns:repeat(2,150px);gap:5px;justify-content:center;margin:10px auto;';
                let pieces = [];
                for (let r=0;r<2;r++) {
                    for (let c=0;c<2;c++) {
                        const pieceCanvas = document.createElement('canvas');
                        pieceCanvas.width = 150;
                        pieceCanvas.height = 150;
                        const pctx = pieceCanvas.getContext('2d');
                        pctx.drawImage(canvas, c*150, r*150, 150, 150, 0, 0, 150, 150);
                        const pieceImg = document.createElement('img');
                        pieceImg.src = pieceCanvas.toDataURL();
                        pieceImg.style.width = '100%';
                        pieceImg.style.height = '100%';
                        grid.appendChild(pieceImg);
                        pieces.push(pieceImg);
                    }
                }
                container.appendChild(grid);
                let shuffled = false;
                const shuffleBtn = document.createElement('button');
                shuffleBtn.textContent = 'Перемешать';
                shuffleBtn.onclick = () => {
                    if (!shuffled) {
                        let childs = Array.from(grid.children);
                        for (let i=childs.length-1;i>0;i--) {
                            let j=Math.floor(Math.random()*(i+1));
                            grid.appendChild(childs[j]);
                        }
                        shuffled = true;
                        sound.flip();
                    }
                };
                container.appendChild(shuffleBtn);
            };
            img.onerror = () => {
                div.textContent = 'Не удалось загрузить изображение.';
            };
        });
        const input = new GameInput(container, {
            enter: () => { sound.click(); },
            tap: () => { sound.click(); }
        });
        container._gameStop = function() { input.destroy(); };
    };

    // ======== Создание меню ========
    function createMenu() {
        const activity = Lampa.Activity.active();
        if (!activity) {
            console.error('Нет активной активности');
            return;
        }
        const content = activity.content;
        if (!content) {
            console.error('Нет контента');
            return;
        }

        // Останавливаем предыдущую игру, если есть
        if (content._gameStop) {
            content._gameStop();
            delete content._gameStop;
        }
        content.innerHTML = '';

        const title = document.createElement('div');
        title.textContent = PLUGIN_TITLE;
        title.style.cssText = 'font-size:32px;font-weight:bold;color:#fff;text-align:center;padding:20px;';
        content.appendChild(title);

        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:15px;padding:20px;';
        content.appendChild(grid);

        games.forEach(game => {
            const card = document.createElement('div');
            card.style.cssText = 'background:#2a2a2a;border-radius:10px;padding:20px;text-align:center;cursor:pointer;transition:0.2s;color:#fff;';
            card.textContent = game.title;
            const record = getRecord(game.id);
            const recSpan = document.createElement('div');
            recSpan.textContent = `Рекорд: ${record}`;
            recSpan.style.cssText = 'font-size:14px;color:#aaa;margin-top:10px;';
            card.appendChild(recSpan);
            card.addEventListener('click', () => launchGame(game.id));
            card.setAttribute('tabindex', '0');
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') launchGame(game.id);
            });
            grid.appendChild(card);
        });
    }

    // ======== Регистрация плагина ========
    // Проверяем, не зарегистрирован ли уже плагин, чтобы избежать дублирования
    let pluginRegistered = false;
    try {
        // Простая проверка: если пункт меню уже существует, не добавляем повторно
        const menuItems = Lampa.Menu.list ? Lampa.Menu.list() : [];
        if (menuItems.some(item => item.id === PLUGIN_NAME)) {
            pluginRegistered = true;
        }
    } catch (e) {}

    if (!pluginRegistered) {
        Lampa.plugin({
            name: PLUGIN_NAME,
            title: PLUGIN_TITLE,
            icon: 'gamepad',
            onReady: function() {
                Lampa.Menu.add({
                    id: PLUGIN_NAME,
                    title: PLUGIN_TITLE,
                    icon: 'gamepad',
                    action: function() {
                        Lampa.Activity.push({
                            url: '',
                            title: PLUGIN_TITLE,
                            onLoad: function() {
                                createMenu();
                            }
                        });
                    }
                });
                console.log('Плагин Lampa Games загружен');
            }
        });
    } else {
        console.log('Плагин Lampa Games уже зарегистрирован');
    }

})();
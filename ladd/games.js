/**
 * Games20 — плагин Lampa с 20 мини-играми.
 * Управление: пульт (стрелки + OK), клавиатура (стрелки/WASD/Enter/Space),
 * мышь (клики по экранным кнопкам) и сенсор (свайпы + экранные кнопки).
 */
(function () {
    'use strict';

    // =========================================================================
    // СПРАВОЧНИК КОДОВ КНОПОК
    // =========================================================================
    var KEY = {
        LEFT:  [37, 4],
        UP:    [38, 29460],
        RIGHT: [39, 5],
        DOWN:  [40, 29461],
        ENTER: [13, 29443, 117, 65385],
        BACK:  [8, 27, 461, 10009, 88],
        SPACE: [32, 179, 10252],
        W: [87], A: [65], S: [83], D: [68]
    };

    function match(code, list) { return list.indexOf(code) >= 0; }

    // =========================================================================
    // БАЗОВЫЙ КЛАСС ИГРЫ
    // =========================================================================
    function BaseGame(w, h) {
        this.w = w || 640;
        this.h = h || 460;
        this.score = 0;
        this.best  = 0;
        this.over  = false;
        this.paused = false;
        this._tick = 0;
        this._last = 0;
        this._raf  = null;
        this._alive = false;

        this.canvas = document.createElement('canvas');
        this.canvas.width  = this.w;
        this.canvas.height = this.h;
        this.canvas.className = 'game20-canvas';
        this.ctx = this.canvas.getContext('2d');
    }

    BaseGame.prototype.mount    = function (container) { container.appendChild(this.canvas); };
    BaseGame.prototype.init     = function () {};
    BaseGame.prototype.update   = function (dt) {};
    BaseGame.prototype.render   = function () {};
    BaseGame.prototype.onKey    = function (code) {};
    BaseGame.prototype.onTap    = function (x, y) {};
    BaseGame.prototype.onSwipe  = function (dir) {
        var map = { left: KEY.LEFT[0], right: KEY.RIGHT[0], up: KEY.UP[0], down: KEY.DOWN[0] };
        if (map[dir]) this.onKey(map[dir]);
    };

    BaseGame.prototype.restart = function () {
        this.score = 0;
        this.over = false;
        this.paused = false;
        this.init();
    };

    BaseGame.prototype.startLoop = function () {
        var self = this;
        this._alive = true;
        this._last = performance.now();
        function frame(now) {
            if (!self._alive) return;
            var dt = Math.min(50, now - self._last);
            self._last = now;
            if (!self.paused && !self.over) self.update(dt);
            try { self.render(); } catch (e) {}
            self._raf = requestAnimationFrame(frame);
        }
        this._raf = requestAnimationFrame(frame);
    };

    BaseGame.prototype.stopLoop = function () {
        this._alive = false;
        if (this._raf) cancelAnimationFrame(this._raf);
    };

    BaseGame.prototype.clear = function () {
        this.ctx.fillStyle = '#0b0f14';
        this.ctx.fillRect(0, 0, this.w, this.h);
    };

    BaseGame.prototype.text = function (str, x, y, size, color, align) {
        var ctx = this.ctx;
        ctx.fillStyle = color || '#fff';
        ctx.font = 'bold ' + (size || 16) + 'px sans-serif';
        ctx.textAlign = align || 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(str, x, y);
    };

    BaseGame.prototype.overlay = function (title, hint) {
        var ctx = this.ctx;
        ctx.fillStyle = 'rgba(0,0,0,0.72)';
        ctx.fillRect(0, 0, this.w, this.h);
        this.text(title, this.w / 2, this.h / 2 - 10, 34, '#fff', 'center');
        this.text(hint || 'OK — заново', this.w / 2, this.h / 2 + 30, 18, '#b9c2cc', 'center');
    };

    // =========================================================================
    // ИГРА 1. ТЕТРИС
    // =========================================================================
    function Tetris() {
        BaseGame.call(this, 480, 560);
        this.cols = 10; this.rows = 20;
        this.cell = 24;
        this.board = [];
        this.piece = null;
        this.fallAcc = 0;
        this.fallInterval = 500;
        this.shapes = [
            [[1,1,1,1]],
            [[1,1],[1,1]],
            [[0,1,0],[1,1,1]],
            [[1,0,0],[1,1,1]],
            [[0,0,1],[1,1,1]],
            [[0,1,1],[1,1,0]],
            [[1,1,0],[0,1,1]]
        ];
        this.colors = ['#46c1ff','#f5d142','#b073ff','#4d9dff','#ff9d47','#5edd6b','#ff5a5a'];
    }
    Tetris.prototype = Object.create(BaseGame.prototype);
    Tetris.prototype.constructor = Tetris;
    Tetris.prototype.init = function () {
        this.board = [];
        for (var y = 0; y < this.rows; y++) {
            var row = [];
            for (var x = 0; x < this.cols; x++) row.push(0);
            this.board.push(row);
        }
        this.spawn();
        this.fallAcc = 0;
    };
    Tetris.prototype.spawn = function () {
        var i = Math.floor(Math.random() * this.shapes.length);
        this.piece = {
            shape: this.shapes[i].map(function (r) { return r.slice(); }),
            color: this.colors[i],
            x: Math.floor((this.cols - this.shapes[i][0].length) / 2),
            y: 0
        };
        if (this.collide(this.piece, 0, 0)) this.over = true;
    };
    Tetris.prototype.collide = function (p, dx, dy) {
        var s = p.shape;
        for (var y = 0; y < s.length; y++)
            for (var x = 0; x < s[y].length; x++) {
                if (!s[y][x]) continue;
                var nx = p.x + x + dx, ny = p.y + y + dy;
                if (nx < 0 || nx >= this.cols || ny >= this.rows) return true;
                if (ny >= 0 && this.board[ny][nx]) return true;
            }
        return false;
    };
    Tetris.prototype.rotate = function () {
        var s = this.piece.shape;
        var n = s[0].map(function (_, i) { return s.map(function (r) { return r[i]; }).reverse(); });
        var old = this.piece.shape;
        this.piece.shape = n;
        if (this.collide(this.piece, 0, 0)) this.piece.shape = old;
    };
    Tetris.prototype.lock = function () {
        var s = this.piece.shape;
        for (var y = 0; y < s.length; y++)
            for (var x = 0; x < s[y].length; x++) {
                if (!s[y][x]) continue;
                var ny = this.piece.y + y;
                if (ny < 0) continue;
                this.board[ny][this.piece.x + x] = this.piece.color;
            }
        // очистка линий
        var cleared = 0;
        for (var yy = this.rows - 1; yy >= 0; yy--) {
            if (this.board[yy].every(function (v) { return v; })) {
                this.board.splice(yy, 1);
                var r = [];
                for (var i = 0; i < this.cols; i++) r.push(0);
                this.board.unshift(r);
                cleared++; yy++;
            }
        }
        this.score += [0, 100, 300, 700, 1500][cleared] || 0;
        if (this.score > this.best) this.best = this.score;
        this.spawn();
    };
    Tetris.prototype.onKey = function (code) {
        if (this.over) {
            if (match(code, KEY.ENTER) || match(code, KEY.SPACE)) this.restart();
            return;
        }
        var p = this.piece;
        if (match(code, KEY.LEFT)  || match(code, KEY.A)) { if (!this.collide(p, -1, 0)) p.x--; }
        if (match(code, KEY.RIGHT) || match(code, KEY.D)) { if (!this.collide(p, 1, 0)) p.x++; }
        if (match(code, KEY.DOWN)  || match(code, KEY.S)) {
            if (!this.collide(p, 0, 1)) { p.y++; this.score += 1; }
        }
        if (match(code, KEY.UP)    || match(code, KEY.W)) this.rotate();
        if (match(code, KEY.SPACE)) {
            while (!this.collide(p, 0, 1)) { p.y++; this.score += 2; }
            this.lock();
        }
    };
    Tetris.prototype.update = function (dt) {
        if (this.over) return;
        this.fallAcc += dt;
        this.fallInterval = Math.max(90, 500 - Math.floor(this.score / 2000) * 50);
        if (this.fallAcc >= this.fallInterval) {
            this.fallAcc = 0;
            if (!this.collide(this.piece, 0, 1)) this.piece.y++;
            else this.lock();
        }
    };
    Tetris.prototype.render = function () {
        this.clear();
        var ox = (this.w - this.cols * this.cell) / 2;
        var oy = 30;
        // сетка
        this.ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        for (var y = 0; y <= this.rows; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(ox, oy + y * this.cell);
            this.ctx.lineTo(ox + this.cols * this.cell, oy + y * this.cell);
            this.ctx.stroke();
        }
        for (var x = 0; x <= this.cols; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(ox + x * this.cell, oy);
            this.ctx.lineTo(ox + x * this.cell, oy + this.rows * this.cell);
            this.ctx.stroke();
        }
        // поле
        for (var yy = 0; yy < this.rows; yy++)
            for (var xx = 0; xx < this.cols; xx++) {
                var c = this.board[yy][xx];
                if (c) {
                    this.ctx.fillStyle = c;
                    this.ctx.fillRect(ox + xx * this.cell + 1, oy + yy * this.cell + 1, this.cell - 2, this.cell - 2);
                }
            }
        // фигура
        if (this.piece && !this.over) {
            var s = this.piece.shape;
            this.ctx.fillStyle = this.piece.color;
            for (var py = 0; py < s.length; py++)
                for (var px = 0; px < s[py].length; px++)
                    if (s[py][px]) {
                        var nx = this.piece.x + px;
                        var ny = this.piece.y + py;
                        if (ny >= 0) this.ctx.fillRect(ox + nx * this.cell + 1, oy + ny * this.cell + 1, this.cell - 2, this.cell - 2);
                    }
        }
        this.text('Очки: ' + this.score + '   Рекорд: ' + this.best, 16, 22, 16, '#9ad1ff');
        if (this.over) this.overlay('Игра окончена');
    };

    // =========================================================================
    // ИГРА 2. 2048
    // =========================================================================
    function Game2048() {
        BaseGame.call(this, 480, 560);
        this.size = 4;
        this.cell = 110;
        this.pad  = 12;
        this.grid = [];
        this.animTick = 0;
    }
    Game2048.prototype = Object.create(BaseGame.prototype);
    Game2048.prototype.constructor = Game2048;
    Game2048.prototype.init = function () {
        this.grid = [];
        for (var y = 0; y < this.size; y++) {
            var row = [];
            for (var x = 0; x < this.size; x++) row.push(0);
            this.grid.push(row);
        }
        this.addTile(); this.addTile();
    };
    Game2048.prototype.addTile = function () {
        var empty = [];
        for (var y = 0; y < this.size; y++)
            for (var x = 0; x < this.size; x++)
                if (!this.grid[y][x]) empty.push([x, y]);
        if (!empty.length) return;
        var p = empty[Math.floor(Math.random() * empty.length)];
        this.grid[p[1]][p[0]] = Math.random() < 0.9 ? 2 : 4;
    };
    Game2048.prototype.move = function (dir) {
        var self = this;
        var rotated = this.rotateGrid(dir);
        var moved = false;
        for (var y = 0; y < this.size; y++) {
            var row = rotated[y].filter(function (v) { return v; });
            var out = [];
            for (var i = 0; i < row.length; i++) {
                if (row[i] === row[i+1]) { out.push(row[i] * 2); self.score += row[i] * 2; i++; }
                else out.push(row[i]);
            }
            while (out.length < this.size) out.push(0);
            if (out.join() !== rotated[y].join()) moved = true;
            rotated[y] = out;
        }
        this.grid = this.unrotateGrid(rotated, dir);
        if (moved) {
            this.addTile();
            if (this.score > this.best) this.best = this.score;
            if (!this.canMove()) this.over = true;
        }
    };
    Game2048.prototype.rotateGrid = function (dir) {
        var g = this.grid.map(function (r) { return r.slice(); });
        var times = dir === 'left' ? 0 : dir === 'up' ? 1 : dir === 'right' ? 2 : 3;
        for (var t = 0; t < times; t++) {
            var n = [];
            for (var x = 0; x < this.size; x++) {
                var row = [];
                for (var y = this.size - 1; y >= 0; y--) row.push(g[y][x]);
                n.push(row);
            }
            g = n;
        }
        return g;
    };
    Game2048.prototype.unrotateGrid = function (g, dir) {
        var times = dir === 'left' ? 0 : dir === 'up' ? 3 : dir === 'right' ? 2 : 1;
        for (var t = 0; t < times; t++) {
            var n = [];
            for (var x = 0; x < this.size; x++) {
                var row = [];
                for (var y = this.size - 1; y >= 0; y--) row.push(g[y][x]);
                n.push(row);
            }
            g = n;
        }
        return g;
    };
    Game2048.prototype.canMove = function () {
        for (var y = 0; y < this.size; y++)
            for (var x = 0; x < this.size; x++) {
                if (!this.grid[y][x]) return true;
                if (x < this.size - 1 && this.grid[y][x] === this.grid[y][x+1]) return true;
                if (y < this.size - 1 && this.grid[y][x] === this.grid[y+1][x]) return true;
            }
        return false;
    };
    Game2048.prototype.onKey = function (code) {
        if (this.over) {
            if (match(code, KEY.ENTER) || match(code, KEY.SPACE)) this.restart();
            return;
        }
        if (match(code, KEY.LEFT)  || match(code, KEY.A)) this.move('left');
        if (match(code, KEY.RIGHT) || match(code, KEY.D)) this.move('right');
        if (match(code, KEY.UP)    || match(code, KEY.W)) this.move('up');
        if (match(code, KEY.DOWN)  || match(code, KEY.S)) this.move('down');
    };
    Game2048.prototype.render = function () {
        this.clear();
        var total = this.size * this.cell + (this.size + 1) * this.pad;
        var ox = (this.w - total) / 2;
        var oy = 50;
        this.text('Очки: ' + this.score + '   Рекорд: ' + this.best, 16, 22, 16, '#9ad1ff');
        // фон сетки
        this.ctx.fillStyle = 'rgba(255,255,255,0.06)';
        this.ctx.fillRect(ox, oy, total, total);
        // плитки
        var colors = {
            0:'rgba(255,255,255,0.04)',2:'#eee4da',4:'#ede0c8',8:'#f2b179',
            16:'#f59563',32:'#f67c5f',64:'#f65e3b',128:'#edcf72',256:'#edcc61',
            512:'#edc850',1024:'#edc53f',2048:'#edc22e'
        };
        for (var y = 0; y < this.size; y++)
            for (var x = 0; x < this.size; x++) {
                var v = this.grid[y][x];
                var px = ox + this.pad + x * (this.cell + this.pad);
                var py = oy + this.pad + y * (this.cell + this.pad);
                this.ctx.fillStyle = colors[v] || '#3c3a32';
                this.ctx.fillRect(px, py, this.cell, this.cell);
                if (v) {
                    this.text(String(v), px + this.cell/2, py + this.cell/2 + 12, v > 100 ? 32 : 40, v <= 4 ? '#776e65' : '#fff', 'center');
                }
            }
        if (this.over) this.overlay('Игра окончена');
    };

    // =========================================================================
    // ИГРА 3. ЗМЕЙКА
    // =========================================================================
    function Snake() {
        BaseGame.call(this, 560, 560);
        this.cols = 20; this.rows = 20;
        this.cell = 26;
        this.snake = [];
        this.dir = { x: 1, y: 0 };
        this.pending = { x: 1, y: 0 };
        this.food = { x: 5, y: 5 };
        this.acc = 0;
        this.speed = 130;
    }
    Snake.prototype = Object.create(BaseGame.prototype);
    Snake.prototype.constructor = Snake;
    Snake.prototype.init = function () {
        this.snake = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }];
        this.dir = { x: 1, y: 0 };
        this.pending = { x: 1, y: 0 };
        this.speed = 130;
        this.acc = 0;
        this.placeFood();
    };
    Snake.prototype.placeFood = function () {
        while (true) {
            var x = Math.floor(Math.random() * this.cols);
            var y = Math.floor(Math.random() * this.rows);
            if (!this.snake.find(function (s) { return s.x === x && s.y === y; })) {
                this.food = { x: x, y: y };
                return;
            }
        }
    };
    Snake.prototype.onKey = function (code) {
        if (this.over) {
            if (match(code, KEY.ENTER) || match(code, KEY.SPACE)) this.restart();
            return;
        }
        if ((match(code, KEY.LEFT) || match(code, KEY.A))  && this.dir.x !== 1)  this.pending = { x: -1, y: 0 };
        if ((match(code, KEY.RIGHT) || match(code, KEY.D)) && this.dir.x !== -1) this.pending = { x: 1, y: 0 };
        if ((match(code, KEY.UP) || match(code, KEY.W))    && this.dir.y !== 1)  this.pending = { x: 0, y: -1 };
        if ((match(code, KEY.DOWN) || match(code, KEY.S))  && this.dir.y !== -1) this.pending = { x: 0, y: 1 };
    };
    Snake.prototype.update = function (dt) {
        if (this.over) return;
        this.acc += dt;
        if (this.acc < this.speed) return;
        this.acc = 0;
        this.dir = this.pending;
        var head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };
        if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows) { this.over = true; return; }
        if (this.snake.find(function (s) { return s.x === head.x && s.y === head.y; })) { this.over = true; return; }
        this.snake.unshift(head);
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            if (this.score > this.best) this.best = this.score;
            if (this.speed > 60) this.speed -= 2;
            this.placeFood();
        } else this.snake.pop();
    };
    Snake.prototype.render = function () {
        this.clear();
        var ox = (this.w - this.cols * this.cell) / 2;
        var oy = (this.h - this.rows * this.cell) / 2 + 10;
        this.ctx.fillStyle = 'rgba(255,255,255,0.04)';
        this.ctx.fillRect(ox, oy, this.cols * this.cell, this.rows * this.cell);
        // сетка
        this.ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        for (var y = 0; y <= this.rows; y++) { this.ctx.beginPath(); this.ctx.moveTo(ox, oy + y * this.cell); this.ctx.lineTo(ox + this.cols * this.cell, oy + y * this.cell); this.ctx.stroke(); }
        for (var x = 0; x <= this.cols; x++) { this.ctx.beginPath(); this.ctx.moveTo(ox + x * this.cell, oy); this.ctx.lineTo(ox + x * this.cell, oy + this.rows * this.cell); this.ctx.stroke(); }
        // еда
        this.ctx.fillStyle = '#ff5a5a';
        this.ctx.beginPath();
        this.ctx.arc(ox + this.food.x * this.cell + this.cell/2, oy + this.food.y * this.cell + this.cell/2, this.cell/2 - 3, 0, Math.PI * 2);
        this.ctx.fill();
        // змейка
        this.snake.forEach(function (s, i) {
            this.ctx.fillStyle = i === 0 ? '#7ee787' : '#46c1ff';
            this.ctx.fillRect(ox + s.x * this.cell + 2, oy + s.y * this.cell + 2, this.cell - 4, this.cell - 4);
        }, this);
        this.text('Очки: ' + this.score + '   Рекорд: ' + this.best, 16, 22, 16, '#9ad1ff');
        if (this.over) this.overlay('Игра окончена');
    };

    // =========================================================================
    // ИГРА 4. АРКАНОИД
    // =========================================================================
    function Arkanoid() {
        BaseGame.call(this, 640, 480);
        this.paddle = { x: 280, w: 90, h: 14 };
        this.ball = { x: 320, y: 380, r: 8, vx: 0.35, vy: -0.35 };
        this.bricks = [];
        this.brickRows = 5;
        this.brickCols = 8;
        this.brickW = 70;
        this.brickH = 22;
        this.brickPad = 6;
        this.lives = 3;
    }
    Arkanoid.prototype = Object.create(BaseGame.prototype);
    Arkanoid.prototype.constructor = Arkanoid;
    Arkanoid.prototype.init = function () {
        this.paddle.x = (this.w - this.paddle.w) / 2;
        this.ball = { x: this.w/2, y: this.h - 60, r: 8, vx: 0.32 * (Math.random() < 0.5 ? 1 : -1), vy: -0.32 };
        this.lives = 3;
        this.bricks = [];
        var colors = ['#f74a4a','#ff9d47','#f5d142','#5edd6b','#46c1ff'];
        var totalW = this.brickCols * this.brickW + (this.brickCols - 1) * this.brickPad;
        var ox = (this.w - totalW) / 2;
        for (var y = 0; y < this.brickRows; y++)
            for (var x = 0; x < this.brickCols; x++) {
                this.bricks.push({
                    x: ox + x * (this.brickW + this.brickPad),
                    y: 60 + y * (this.brickH + this.brickPad),
                    w: this.brickW, h: this.brickH,
                    color: colors[y % colors.length],
                    alive: true
                });
            }
    };
    Arkanoid.prototype.onKey = function (code) {
        if (this.over) { if (match(code, KEY.ENTER) || match(code, KEY.SPACE)) this.restart(); return; }
        if (match(code, KEY.LEFT)  || match(code, KEY.A)) this.paddle.x -= 40;
        if (match(code, KEY.RIGHT) || match(code, KEY.D)) this.paddle.x += 40;
        if (this.paddle.x < 0) this.paddle.x = 0;
        if (this.paddle.x > this.w - this.paddle.w) this.paddle.x = this.w - this.paddle.w;
    };
    Arkanoid.prototype.onTap = function (x) {
        this.paddle.x = Math.max(0, Math.min(this.w - this.paddle.w, x - this.paddle.w / 2));
    };
    Arkanoid.prototype.update = function (dt) {
        if (this.over) return;
        var speed = 0.45 * dt;
        var b = this.ball;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); }
        if (b.x > this.w - b.r) { b.x = this.w - b.r; b.vx = -Math.abs(b.vx); }
        if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy); }
        // paddle collision
        if (b.y + b.r > this.h - 30 - this.paddle.h &&
            b.y + b.r < this.h - 30 + 5 &&
            b.x > this.paddle.x && b.x < this.paddle.x + this.paddle.w) {
            b.y = this.h - 30 - this.paddle.h - b.r;
            b.vy = -Math.abs(b.vy);
            var rel = (b.x - (this.paddle.x + this.paddle.w/2)) / (this.paddle.w/2);
            b.vx = 0.5 * rel;
        }
        // bricks
        for (var i = 0; i < this.bricks.length; i++) {
            var br = this.bricks[i];
            if (!br.alive) continue;
            if (b.x + b.r > br.x && b.x - b.r < br.x + br.w &&
                b.y + b.r > br.y && b.y - b.r < br.y + br.h) {
                br.alive = false;
                this.score += 20;
                if (this.score > this.best) this.best = this.score;
                // определить сторону удара
                var ox = Math.min(Math.abs(b.x - br.x), Math.abs(b.x - (br.x + br.w)));
                var oy = Math.min(Math.abs(b.y - br.y), Math.abs(b.y - (br.y + br.h)));
                if (ox < oy) b.vx = -b.vx; else b.vy = -b.vy;
            }
        }
        if (!this.bricks.find(function (x) { return x.alive; })) {
            this.score += 500; if (this.score > this.best) this.best = this.score;
            this.over = true;
        }
        // потеря жизни
        if (b.y - b.r > this.h) {
            this.lives--;
            if (this.lives <= 0) this.over = true;
            else {
                this.ball = { x: this.w/2, y: this.h - 60, r: 8, vx: 0.32 * (Math.random() < 0.5 ? 1 : -1), vy: -0.32 };
            }
        }
    };
    Arkanoid.prototype.render = function () {
        this.clear();
        for (var i = 0; i < this.bricks.length; i++) {
            var br = this.bricks[i];
            if (!br.alive) continue;
            this.ctx.fillStyle = br.color;
            this.ctx.fillRect(br.x, br.y, br.w, br.h);
        }
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(this.paddle.x, this.h - 30 - this.paddle.h, this.paddle.w, this.paddle.h);
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
        this.ctx.fillStyle = '#f5d142';
        this.ctx.fill();
        this.text('Очки: ' + this.score + '   Жизни: ' + this.lives + '   Рекорд: ' + this.best, 16, 22, 16, '#9ad1ff');
        if (this.over) this.overlay('Игра окончена');
    };

    // =========================================================================
    // ДОПОЛНИТЕЛЬНЫЕ ИГРЫ (16 штук)
    // =========================================================================

    // 5. ПОНГ
    function Pong() {
        BaseGame.call(this, 640, 420);
    }
    Pong.prototype = Object.create(BaseGame.prototype);
    Pong.prototype.constructor = Pong;
    Pong.prototype.init = function () {
        this.p1 = { y: 180, h: 70, w: 12 };
        this.p2 = { y: 180, h: 70, w: 12 };
        this.ball = { x: 320, y: 210, r: 8, vx: 0.25, vy: 0.18 };
    };
    Pong.prototype.onKey = function (code) {
        if (this.over) { if (match(code, KEY.ENTER)) this.restart(); return; }
        if (match(code, KEY.UP))   this.p1.y -= 30;
        if (match(code, KEY.DOWN)) this.p1.y += 30;
        if (this.p1.y < 0) this.p1.y = 0;
        if (this.p1.y > this.h - this.p1.h) this.p1.y = this.h - this.p1.h;
    };
    Pong.prototype.update = function (dt) {
        if (this.over) return;
        var b = this.ball;
        b.x += b.vx * dt; b.y += b.vy * dt;
        if (b.y < b.r || b.y > this.h - b.r) b.vy = -b.vy;
        // AI
        var target = b.y - this.p2.h / 2;
        this.p2.y += (target - this.p2.y) * 0.08;
        // paddle collisions
        if (b.x - b.r < 20 + this.p1.w && b.y > this.p1.y && b.y < this.p1.y + this.p1.h && b.vx < 0) {
            b.vx = Math.abs(b.vx); b.x = 20 + this.p1.w + b.r;
            b.vy += (b.y - (this.p1.y + this.p1.h/2)) * 0.005;
        }
        if (b.x + b.r > this.w - 20 - this.p2.w && b.y > this.p2.y && b.y < this.p2.y + this.p2.h && b.vx > 0) {
            b.vx = -Math.abs(b.vx); b.x = this.w - 20 - this.p2.w - b.r;
        }
        if (b.x < -20) { this.over = true; }
        if (b.x > this.w + 20) { this.score += 1; if (this.score > this.best) this.best = this.score; this.ball = { x: 320, y: 210, r: 8, vx: -0.25, vy: 0.18 }; }
    };
    Pong.prototype.render = function () {
        this.clear();
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(20, this.p1.y, this.p1.w, this.p1.h);
        this.ctx.fillRect(this.w - 20 - this.p2.w, this.p2.y, this.p2.w, this.p2.h);
        this.ctx.beginPath(); this.ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2); this.ctx.fill();
        for (var y = 0; y < this.h; y += 20) this.ctx.fillRect(this.w/2 - 2, y, 4, 10);
        this.text('Очки: ' + this.score + '   Рекорд: ' + this.best, 16, 22, 16, '#9ad1ff');
        if (this.over) this.overlay('Вы проиграли');
    };

    // 6. FLAPPY BIRD
    function Flappy() {
        BaseGame.call(this, 480, 560);
    }
    Flappy.prototype = Object.create(BaseGame.prototype);
    Flappy.prototype.constructor = Flappy;
    Flappy.prototype.init = function () {
        this.bird = { y: 280, v: 0 };
        this.pipes = [];
        this.acc = 0;
    };
    Flappy.prototype.flap = function () {
        if (this.over) { this.restart(); return; }
        this.bird.v = -0.42;
    };
    Flappy.prototype.onKey = function (code) {
        if (match(code, KEY.ENTER) || match(code, KEY.SPACE) || match(code, KEY.UP)) this.flap();
        if (match(code, KEY.DOWN)) this.bird.v = 0.35;
    };
    Flappy.prototype.onTap = function () { this.flap(); };
    Flappy.prototype.update = function (dt) {
        if (this.over) return;
        this.bird.v += 0.001 * dt;
        this.bird.y += this.bird.v * dt;
        this.acc += dt;
        if (this.acc > 1500) {
            this.acc = 0;
            var gap = 130;
            var top = 60 + Math.random() * 220;
            this.pipes.push({ x: this.w, top: top, gap: gap, passed: false });
        }
        this.pipes.forEach(function (p) { p.x -= 0.2 * dt; });
        this.pipes = this.pipes.filter(function (p) { return p.x > -80; });
        // collisions
        if (this.bird.y < 0 || this.bird.y > this.h - 20) { this.over = true; return; }
        var bx = 100, by = this.bird.y;
        for (var i = 0; i < this.pipes.length; i++) {
            var p = this.pipes[i];
            if (bx + 14 > p.x && bx - 14 < p.x + 60) {
                if (by - 14 < p.top || by + 14 > p.top + p.gap) { this.over = true; return; }
            }
            if (!p.passed && p.x + 60 < bx) { p.passed = true; this.score++; if (this.score > this.best) this.best = this.score; }
        }
    };
    Flappy.prototype.render = function () {
        this.clear();
        this.ctx.fillStyle = '#46c1ff';
        this.ctx.fillRect(0, this.h - 40, this.w, 40);
        this.pipes.forEach(function (p) {
            this.ctx.fillStyle = '#5edd6b';
            this.ctx.fillRect(p.x, 0, 60, p.top);
            this.ctx.fillRect(p.x, p.top + p.gap, 60, this.h - p.top - p.gap);
        }, this);
        this.ctx.fillStyle = '#f5d142';
        this.ctx.beginPath();
        this.ctx.arc(100, this.bird.y, 14, 0, Math.PI * 2);
        this.ctx.fill();
        this.text('Очки: ' + this.score + '   Рекорд: ' + this.best, 16, 22, 16, '#9ad1ff');
        if (this.over) this.overlay('Игра окончена');
    };

    // 7. MEMORY MATCH
    function Memory() {
        BaseGame.call(this, 480, 480);
    }
    Memory.prototype = Object.create(BaseGame.prototype);
    Memory.prototype.constructor = Memory;
    Memory.prototype.init = function () {
        this.cols = 4; this.rows = 4;
        this.cell = 100;
        this.cards = [];
        var icons = ['★','♥','♣','♦','●','▲','■','◆'];
        var all = icons.concat(icons).map(function (i, idx) { return { icon: i, id: Math.floor(idx / 2), flipped: false, matched: false }; });
        for (var i = all.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = all[i]; all[i] = all[j]; all[j] = t; }
        this.cards = all;
        this.selected = [];
        this.cursor = 0;
        this.locked = false;
    };
    Memory.prototype.onKey = function (code) {
        if (this.over) { if (match(code, KEY.ENTER)) this.restart(); return; }
        if (this.locked) return;
        var c = this.cursor % this.cols;
        var r = Math.floor(this.cursor / this.cols);
        if (match(code, KEY.LEFT))  c = (c - 1 + this.cols) % this.cols;
        if (match(code, KEY.RIGHT)) c = (c + 1) % this.cols;
        if (match(code, KEY.UP))    r = (r - 1 + this.rows) % this.rows;
        if (match(code, KEY.DOWN))  r = (r + 1) % this.rows;
        this.cursor = r * this.cols + c;
        if (match(code, KEY.ENTER) || match(code, KEY.SPACE)) this.flip();
    };
    Memory.prototype.onTap = function (x, y) {
        var totalW = this.cols * this.cell + (this.cols + 1) * 10;
        var totalH = this.rows * this.cell + (this.rows + 1) * 10;
        var ox = (this.w - totalW) / 2;
        var oy = (this.h - totalH) / 2 + 20;
        var col = Math.floor((x - ox - 10) / (this.cell + 10));
        var row = Math.floor((y - oy - 10) / (this.cell + 10));
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;
        this.cursor = row * this.cols + col;
        this.flip();
    };
    Memory.prototype.flip = function () {
        if (this.over || this.locked) return;
        var c = this.cards[this.cursor];
        if (!c || c.flipped || c.matched) return;
        c.flipped = true;
        this.selected.push(this.cursor);
        if (this.selected.length === 2) {
            this.locked = true;
            var a = this.cards[this.selected[0]];
            var b = this.cards[this.selected[1]];
            var self = this;
            if (a.id === b.id) {
                a.matched = b.matched = true;
                this.score += 10; if (this.score > this.best) this.best = this.score;
                this.selected = []; this.locked = false;
                if (this.cards.every(function (c) { return c.matched; })) { this.score += 100; this.over = true; }
            } else {
                setTimeout(function () {
                    a.flipped = b.flipped = false;
                    self.selected = []; self.locked = false;
                }, 700);
            }
        }
    };
    Memory.prototype.render = function () {
        this.clear();
        var totalW = this.cols * this.cell + (this.cols + 1) * 10;
        var totalH = this.rows * this.cell + (this.rows + 1) * 10;
        var ox = (this.w - totalW) / 2;
        var oy = (this.h - totalH) / 2 + 20;
        for (var i = 0; i < this.cards.length; i++) {
            var c = this.cards[i];
            var col = i % this.cols;
            var row = Math.floor(i / this.cols);
            var px = ox + 10 + col * (this.cell + 10);
            var py = oy + 10 + row * (this.cell + 10);
            this.ctx.fillStyle = c.matched ? '#2b6b3a' : (c.flipped ? '#f5d142' : '#3a4a5a');
            this.ctx.fillRect(px, py, this.cell, this.cell);
            if (i === this.cursor) {
                this.ctx.strokeStyle = '#7ee787'; this.ctx.lineWidth = 3;
                this.ctx.strokeRect(px + 1.5, py + 1.5, this.cell - 3, this.cell - 3);
            }
            if (c.flipped || c.matched) this.text(c.icon, px + this.cell/2, py + this.cell/2 + 12, 40, c.matched ? '#fff' : '#222', 'center');
        }
        this.text('Очки: ' + this.score + '   Рекорд: ' + this.best, 16, 22, 16, '#9ad1ff');
        if (this.over) this.overlay('Уровень пройден!');
    };

    // 8. TIC-TAC-TOE (КРЕСТИКИ-НОЛИКИ)
    function TicTacToe() {
        BaseGame.call(this, 480, 520);
    }
    TicTacToe.prototype = Object.create(BaseGame.prototype);
    TicTacToe.prototype.constructor = TicTacToe;
    TicTacToe.prototype.init = function () {
        this.board = ['','','','','','','','',''];
        this.cursor = 0;
        this.turn = 'X';
    };
    TicTacToe.prototype.winner = function () {
        var b = this.board;
        var lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        for (var i = 0; i < lines.length; i++) {
            var l = lines[i];
            if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[0]] === b[l[2]]) return b[l[0]];
        }
        return b.every(function (v) { return v; }) ? 'draw' : null;
    };
    TicTacToe.prototype.aiMove = function () {
        var self = this;
        // простой ИИ: победить / заблокировать / центр / угол / любая
        function tryLine(player) {
            var lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
            for (var i = 0; i < lines.length; i++) {
                var l = lines[i];
                var vals = l.map(function (idx) { return self.board[idx]; });
                if (vals.filter(function (v) { return v === player; }).length === 2 && vals.indexOf('') >= 0) {
                    return l[vals.indexOf('')];
                }
            }
            return -1;
        }
        var m = tryLine('O'); if (m >= 0) return m;
        m = tryLine('X'); if (m >= 0) return m;
        if (!this.board[4]) return 4;
        var corners = [0, 2, 6, 8].filter(function (i) { return !self.board[i]; });
        if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
        var empty = []; for (var i = 0; i < 9; i++) if (!this.board[i]) empty.push(i);
        return empty.length ? empty[Math.floor(Math.random() * empty.length)] : -1;
    };
    TicTacToe.prototype.onKey = function (code) {
        if (this.over) { if (match(code, KEY.ENTER)) this.restart(); return; }
        if (this.turn !== 'X') return;
        var c = this.cursor % 3, r = Math.floor(this.cursor / 3);
        if (match(code, KEY.LEFT))  c = (c + 2) % 3;
        if (match(code, KEY.RIGHT)) c = (c + 1) % 3;
        if (match(code, KEY.UP))    r = (r + 2) % 3;
        if (match(code, KEY.DOWN))  r = (r + 1) % 3;
        this.cursor = r * 3 + c;
        if (match(code, KEY.ENTER) || match(code, KEY.SPACE)) this.place();
    };
    TicTacToe.prototype.onTap = function (x, y) {
        var cell = 130;
        var ox = (this.w - 3 * cell) / 2;
        var oy = (this.h - 3 * cell) / 2 + 20;
        var c = Math.floor((x - ox) / cell);
        var r = Math.floor((y - oy) / cell);
        if (c < 0 || c >= 3 || r < 0 || r >= 3) return;
        this.cursor = r * 3 + c;
        this.place();
    };
    TicTacToe.prototype.place = function () {
        if (this.turn !== 'X' || this.board[this.cursor]) return;
        this.board[this.cursor] = 'X';
        var w = this.winner();
        if (w) { this.finish(w); return; }
        this.turn = 'O';
        var self = this;
        setTimeout(function () {
            var m = self.aiMove();
            if (m >= 0) self.board[m] = 'O';
            var w2 = self.winner();
            if (w2) { self.finish(w2); return; }
            self.turn = 'X';
        }, 300);
    };
    TicTacToe.prototype.finish = function (w) {
        if (w === 'X') this.score = 100;
        this.over = true;
        this.result = w === 'X' ? 'Вы победили!' : w === 'O' ? 'Вы проиграли' : 'Ничья';
    };
    TicTacToe.prototype.render = function () {
        this.clear();
        var cell = 130;
        var ox = (this.w - 3 * cell) / 2;
        var oy = (this.h - 3 * cell) / 2 + 20;
        this.ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        this.ctx.lineWidth = 3;
        for (var i = 1; i < 3; i++) {
            this.ctx.beginPath(); this.ctx.moveTo(ox + i * cell, oy); this.ctx.lineTo(ox + i * cell, oy + 3 * cell); this.ctx.stroke();
            this.ctx.beginPath(); this.ctx.moveTo(ox, oy + i * cell); this.ctx.lineTo(ox + 3 * cell, oy + i * cell); this.ctx.stroke();
        }
        for (var i = 0; i < 9; i++) {
            var v = this.board[i];
            var c = i % 3, r = Math.floor(i / 3);
            var px = ox + c * cell + cell / 2;
            var py = oy + r * cell + cell / 2;
            if (v) this.text(v, px, py + 20, 70, v === 'X' ? '#46c1ff' : '#f5d142', 'center');
            if (i === this.cursor && !this.over) {
                this.ctx.strokeStyle = '#7ee787'; this.ctx.lineWidth = 3;
                this.ctx.strokeRect(ox + c * cell + 3, oy + r * cell + 3, cell - 6, cell - 6);
            }
        }
        this.text('Ход: ' + (this.turn === 'X' ? 'ваш' : 'ИИ'), 16, 22, 16, '#9ad1ff');
        if (this.over) this.overlay(this.result || 'Игра окончена');
    };

    // 9. SIMON SAYS
    function Simon() {
        BaseGame.call(this, 480, 480);
    }
    Simon.prototype = Object.create(BaseGame.prototype);
    Simon.prototype.constructor = Simon;
    Simon.prototype.init = function () {
        this.seq = [];
        this.userIdx = 0;
        this.showing = false;
        this.showIdx = 0;
        this.timer = 0;
        this.colors = ['#f74a4a','#4af74a','#4a8cf7','#f7e74a'];
        this.addStep();
    };
    Simon.prototype.addStep = function () { this.seq.push(Math.floor(Math.random() * 4)); };
    Simon.prototype.playSeq = function () {
        var self = this;
        this.showing = true;
        this.showIdx = 0;
        this.timer = 0;
        var i = 0;
        function next() {
            if (i >= self.seq.length) { self.showing = false; self.userIdx = 0; return; }
            self.active = self.seq[i];
            setTimeout(function () {
                self.active = -1;
                i++;
                setTimeout(next, 150);
            }, 400);
        }
        next();
    };
    Simon.prototype.onKey = function (code) {
        if (this.over) { if (match(code, KEY.ENTER)) this.restart(); return; }
        if (this.showing) return;
        var idx = -1;
        if (match(code, KEY.LEFT))  idx = 0;
        if (match(code, KEY.UP))    idx = 1;
        if (match(code, KEY.RIGHT)) idx = 2;
        if (match(code, KEY.DOWN))  idx = 3;
        if (idx < 0) return;
        this.hit(idx);
    };
    Simon.prototype.onTap = function (x, y) {
        if (this.over || this.showing) return;
        var cx = this.w / 2, cy = this.h / 2 + 20;
        var q = x < cx ? (y < cy ? 0 : 3) : (y < cy ? 1 : 2);
        // mapping: left-top = 0, right-top = 1, right-bottom = 2, left-bottom = 3
        // но у нас стрелки: left 0, up 1, right 2, down 3, поэтому переопределим
        var map = [0, 1, 2, 3];
        this.hit(map[q]);
    };
    Simon.prototype.hit = function (idx) {
        var self = this;
        this.active = idx;
        setTimeout(function () { self.active = -1; }, 200);
        if (this.seq[this.userIdx] === idx) {
            this.userIdx++;
            if (this.userIdx >= this.seq.length) {
                this.score += 10; if (this.score > this.best) this.best = this.score;
                this.addStep();
                setTimeout(function () { self.playSeq(); }, 700);
            }
        } else {
            this.over = true;
        }
    };
    Simon.prototype.render = function () {
        this.clear();
        var cx = this.w / 2, cy = this.h / 2 + 20;
        var r = 100;
        var quads = [
            [cx - r, cy - r, r, r, 0],
            [cx,     cy - r, r, r, 1],
            [cx,     cy,     r, r, 2],
            [cx - r, cy,     r, r, 3]
        ];
        quads.forEach(function (q) {
            this.ctx.fillStyle = (this.active === q[4]) ? '#fff' : this.colors[q[4]];
            this.ctx.fillRect(q[0], q[1], q[2], q[3]);
            this.ctx.strokeStyle = '#000'; this.ctx.lineWidth = 4;
            this.ctx.strokeRect(q[0], q[1], q[2], q[3]);
        }, this);
        this.text('Очки: ' + this.score + '   Рекорд: ' + this.best, 16, 22, 16, '#9ad1ff');
        this.text(this.showing ? 'Смотрите...' : 'Повторите (стрелки)', this.w/2, this.h - 20, 16, '#fff', 'center');
        if (this.over) this.overlay('Игра окончена');
    };
    Simon.prototype.update = function (dt) {};

    // 10. РЕАКЦИЯ
    function Reaction() {
        BaseGame.call(this, 480, 400);
    }
    Reaction.prototype = Object.create(BaseGame.prototype);
    Reaction.prototype.constructor = Reaction;
    Reaction.prototype.init = function () { this.state = 'wait'; this.timer = 1000 + Math.random() * 3000; this.time = 0; this.bestReaction = 99999; };
    Reaction.prototype.update = function (dt) {
        if (this.state === 'wait') { this.timer -= dt; if (this.timer <= 0) { this.state = 'go'; this.time = 0; } }
        else if (this.state === 'go') { this.time += dt; if (this.time > 3000) this.state = 'wait', this.timer = 1000 + Math.random() * 3000; }
    };
    Reaction.prototype.onKey = function (code) {
        if (!match(code, KEY.ENTER) && !match(code, KEY.SPACE)) return;
        if (this.state === 'wait') { this.state = 'wait'; this.timer = 1000 + Math.random() * 3000; this.score = 0; return; }
        if (this.state === 'go') {
            var ms = Math.round(this.time);
            if (ms < this.bestReaction) this.bestReaction = ms;
            this.lastReaction = ms;
            this.score = Math.max(0, 500 - ms);
            if (this.score > this.best) this.best = this.score;
            this.state = 'wait'; this.timer = 1500 + Math.random() * 2000;
        }
    };
    Reaction.prototype.onTap = function () { this.onKey(13); };
    Reaction.prototype.render = function () {
        this.clear();
        this.ctx.fillStyle = this.state === 'go' ? '#2b8a3e' : (this.state === 'wait' ? '#7a1e1e' : '#1e3a5a');
        this.ctx.fillRect(0, 0, this.w, this.h);
        this.text(this.state === 'go' ? 'ЖМИ!' : this.state === 'wait' ? 'Жди...' : 'Готов?',
                   this.w / 2, this.h / 2, 48, '#fff', 'center');
        if (this.lastReaction) this.text('Реакция: ' + this.lastReaction + ' мс', this.w / 2, this.h - 40, 20, '#fff', 'center');
    };

    // 11. WHACK-A-MOLE
    function Whack() {
        BaseGame.call(this, 480, 480);
    }
    Whack.prototype = Object.create(BaseGame.prototype);
    Whack.prototype.constructor = Whack;
    Whack.prototype.init = function () {
        this.grid = [];
        this.cursor = 4;
        this.timer = 0;
        this.spawnTimer = 0;
        this.timeLeft = 30000;
        for (var i = 0; i < 9; i++) this.grid.push({ active: 0 });
    };
    Whack.prototype.onKey = function (code) {
        if (this.over) { if (match(code, KEY.ENTER)) this.restart(); return; }
        var c = this.cursor % 3, r = Math.floor(this.cursor / 3);
        if (match(code, KEY.LEFT))  c = (c + 2) % 3;
        if (match(code, KEY.RIGHT)) c = (c + 1) % 3;
        if (match(code, KEY.UP))    r = (r + 2) % 3;
        if (match(code, KEY.DOWN))  r = (r + 1) % 3;
        this.cursor = r * 3 + c;
        if (match(code, KEY.ENTER) || match(code, KEY.SPACE)) this.hit();
    };
    Whack.prototype.onTap = function (x, y) {
        var cell = 130;
        var ox = (this.w - 3 * cell) / 2;
        var oy = (this.h - 3 * cell) / 2 + 20;
        var c = Math.floor((x - ox) / cell);
        var r = Math.floor((y - oy) / cell);
        if (c < 0 || c >= 3 || r < 0 || r >= 3) return;
        this.cursor = r * 3 + c; this.hit();
    };
    Whack.prototype.hit = function () {
        var cell = this.grid[this.cursor];
        if (cell.active > 0) { this.score += 10; if (this.score > this.best) this.best = this.score; cell.active = 0; }
    };
    Whack.prototype.update = function (dt) {
        if (this.over) return;
        this.timeLeft -= dt;
        if (this.timeLeft <= 0) { this.over = true; return; }
        this.spawnTimer += dt;
        if (this.spawnTimer > 700) {
            this.spawnTimer = 0;
            var empty = [];
            for (var i = 0; i < 9; i++) if (!this.grid[i].active) empty.push(i);
            if (empty.length) {
                var idx = empty[Math.floor(Math.random() * empty.length)];
                this.grid[idx].active = 1500;
            }
        }
        for (var i = 0; i < 9; i++) if (this.grid[i].active > 0) this.grid[i].active -= dt;
    };
    Whack.prototype.render = function () {
        this.clear();
        var cell = 130;
        var ox = (this.w - 3 * cell) / 2;
        var oy = (this.h - 3 * cell) / 2 + 20;
        for (var i = 0; i < 9; i++) {
            var c = i % 3, r = Math.floor(i / 3);
            var px = ox + c * cell, py = oy + r * cell;
            this.ctx.fillStyle = this.grid[i].active > 0 ? '#5edd6b' : '#3a4a5a';
            this.ctx.beginPath();
            this.ctx.arc(px + cell/2, py + cell/2, cell/2 - 10, 0, Math.PI * 2);
            this.ctx.fill();
            if (i === this.cursor) {
                this.ctx.strokeStyle = '#7ee787'; this.ctx.lineWidth = 3;
                this.ctx.strokeRect(px + 4, py + 4, cell - 8, cell - 8);
            }
        }
        this.text('Очки: ' + this.score + '   Время: ' + Math.ceil(this.timeLeft/1000) + 'с   Рекорд: ' + this.best, 16, 22, 16, '#9ad1ff');
        if (this.over) this.overlay('Время вышло!');
    };

    // 12. МИНЁР (упрощённый)
    function Minesweeper() {
        BaseGame.call(this, 480, 520);
    }
    Minesweeper.prototype = Object.create(BaseGame.prototype);
    Minesweeper.prototype.constructor = Minesweeper;
    Minesweeper.prototype.init = function () {
        this.cols = 8; this.rows = 8;
        this.cell = 50;
        this.field = [];
        this.revealed = [];
        this.flags = [];
        this.cursor = 0;
        this.firstClick = true;
        for (var i = 0; i < this.cols * this.rows; i++) { this.field.push(0); this.revealed.push(false); this.flags.push(false); }
    };
    Minesweeper.prototype.placeMines = function (safe) {
        var total = 10;
        var placed = 0;
        while (placed < total) {
            var i = Math.floor(Math.random() * this.cols * this.rows);
            if (i === safe) continue;
            if (this.field[i] === -1) continue;
            this.field[i] = -1; placed++;
        }
        for (var y = 0; y < this.rows; y++)
            for (var x = 0; x < this.cols; x++) {
                var idx = y * this.cols + x;
                if (this.field[idx] === -1) continue;
                var count = 0;
                for (var dy = -1; dy <= 1; dy++)
                    for (var dx = -1; dx <= 1; dx++) {
                        if (!dx && !dy) continue;
                        var nx = x + dx, ny = y + dy;
                        if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows && this.field[ny * this.cols + nx] === -1) count++;
                    }
                this.field[idx] = count;
            }
        this.firstClick = false;
    };
    Minesweeper.prototype.reveal = function (idx) {
        var self = this;
        if (this.revealed[idx] || this.flags[idx]) return;
        this.revealed[idx] = true;
        if (this.field[idx] === -1) { this.over = true; return; }
        if (this.field[idx] === 0) {
            var x = idx % this.cols, y = Math.floor(idx / this.cols);
            for (var dy = -1; dy <= 1; dy++)
                for (var dx = -1; dx <= 1; dx++) {
                    if (!dx && !dy) continue;
                    var nx = x + dx, ny = y + dy;
                    if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows) self.reveal(ny * this.cols + nx);
                }
        }
        if (this.revealed.every(function (v, i) { return v || self.field[i] === -1; })) {
            this.over = true; this.won = true;
            this.score = 100; if (this.score > this.best) this.best = this.score;
        }
    };
    Minesweeper.prototype.onKey = function (code) {
        if (this.over) { if (match(code, KEY.ENTER)) this.restart(); return; }
        var c = this.cursor % this.cols, r = Math.floor(this.cursor / this.cols);
        if (match(code, KEY.LEFT))  c = (c + this.cols - 1) % this.cols;
        if (match(code, KEY.RIGHT)) c = (c + 1) % this.cols;
        if (match(code, KEY.UP))    r = (r + this.rows - 1) % this.rows;
        if (match(code, KEY.DOWN))  r = (r + 1) % this.rows;
        this.cursor = r * this.cols + c;
        if (match(code, KEY.ENTER) || match(code, KEY.SPACE)) {
            if (this.firstClick) this.placeMines(this.cursor);
            this.reveal(this.cursor);
        }
        if (match(code, KEY.BACK)) { this.flags[this.cursor] = !this.flags[this.cursor]; return true; }
    };
    Minesweeper.prototype.onTap = function (x, y) {
        var cell = this.cell;
        var total = cell * this.cols;
        var ox = (this.w - total) / 2;
        var oy = 40;
        var c = Math.floor((x - ox) / cell);
        var r = Math.floor((y - oy) / cell);
        if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return;
        this.cursor = r * this.cols + c;
        if (this.firstClick) this.placeMines(this.cursor);
        this.reveal(this.cursor);
    };
    Minesweeper.prototype.render = function () {
        this.clear();
        var cell = this.cell;
        var total = cell * this.cols;
        var ox = (this.w - total) / 2;
        var oy = 40;
        for (var y = 0; y < this.rows; y++)
            for (var x = 0; x < this.cols; x++) {
                var idx = y * this.cols + x;
                var px = ox + x * cell, py = oy + y * cell;
                this.ctx.fillStyle = this.revealed[idx] ? (this.field[idx] === -1 ? '#b00' : '#2c3e50') : '#4a5a6a';
                this.ctx.fillRect(px, py, cell - 2, cell - 2);
                if (this.revealed[idx] && this.field[idx] > 0) this.text(String(this.field[idx]), px + cell/2, py + cell/2 + 7, 22, '#fff', 'center');
                if (this.flags[idx]) this.text('⚑', px + cell/2, py + cell/2 + 8, 22, '#f5d142', 'center');
                if (idx === this.cursor) { this.ctx.strokeStyle = '#7ee787'; this.ctx.lineWidth = 3; this.ctx.strokeRect(px + 1.5, py + 1.5, cell - 5, cell - 5); }
            }
        this.text('Очки: ' + this.score + '   Рекорд: ' + this.best, 16, 22, 16, '#9ad1ff');
        if (this.over) this.overlay(this.won ? 'Победа!' : 'Взорвался');
    };

    // 13. SPACE INVADERS
    function SpaceInvaders() {
        BaseGame.call(this, 640, 480);
    }
    SpaceInvaders.prototype = Object.create(BaseGame.prototype);
    SpaceInvaders.prototype.constructor = SpaceInvaders;
    SpaceInvaders.prototype.init = function () {
        this.ship = { x: 300, y: this.h - 40 };
        this.bullets = [];
        this.enemies = [];
        this.dir = 1;
        this.drop = 0;
        for (var y = 0; y < 4; y++)
            for (var x = 0; x < 8; x++) this.enemies.push({ x: 60 + x * 70, y: 40 + y * 40, alive: true });
        this.cooldown = 0;
    };
    SpaceInvaders.prototype.onKey = function (code) {
        if (this.over) { if (match(code, KEY.ENTER)) this.restart(); return; }
        if (match(code, KEY.LEFT)  || match(code, KEY.A)) this.ship.x -= 30;
        if (match(code, KEY.RIGHT) || match(code, KEY.D)) this.ship.x += 30;
        if (this.ship.x < 0) this.ship.x = 0;
        if (this.ship.x > this.w - 40) this.ship.x = this.w - 40;
        if (match(code, KEY.SPACE) || match(code, KEY.ENTER)) {
            if (this.cooldown <= 0) { this.bullets.push({ x: this.ship.x + 18, y: this.ship.y }); this.cooldown = 300; }
        }
    };
    SpaceInvaders.prototype.update = function (dt) {
        if (this.over) return;
        this.cooldown -= dt;
        var self = this;
        this.bullets.forEach(function (b) { b.y -= 0.5 * dt; });
        this.bullets = this.bullets.filter(function (b) { return b.y > 0; });
        // двигаем пришельцев
        var move = this.dir * 0.05 * dt;
        var hitEdge = false;
        this.enemies.forEach(function (e) { if (e.alive) { e.x += move; if (e.x < 0 || e.x > self.w - 30) hitEdge = true; } });
        if (hitEdge) { this.dir *= -1; this.enemies.forEach(function (e) { if (e.alive) e.y += 15; }); }
        // столкновение
        for (var i = this.bullets.length - 1; i >= 0; i--) {
            var b = this.bullets[i];
            for (var j = 0; j < this.enemies.length; j++) {
                var e = this.enemies[j];
                if (!e.alive) continue;
                if (b.x > e.x && b.x < e.x + 30 && b.y > e.y && b.y < e.y + 30) {
                    e.alive = false; this.bullets.splice(i, 1);
                    this.score += 20; if (this.score > this.best) this.best = this.score;
                    break;
                }
            }
        }
        if (!this.enemies.find(function (e) { return e.alive; })) { this.score += 300; this.over = true; }
        if (this.enemies.find(function (e) { return e.alive && e.y > self.h - 60; })) this.over = true;
    };
    SpaceInvaders.prototype.render = function () {
        this.clear();
        this.ctx.fillStyle = '#7ee787';
        this.ctx.fillRect(this.ship.x, this.ship.y, 40, 16);
        this.ctx.fillStyle = '#f5d142';
        this.bullets.forEach(function (b) { this.ctx.fillRect(b.x, b.y, 4, 12); }, this);
        this.enemies.forEach(function (e) {
            if (!e.alive) return;
            this.ctx.fillStyle = '#46c1ff';
            this.ctx.fillRect(e.x, e.y, 30, 30);
        }, this);
        this.text('Очки: ' + this.score + '   Рекорд: ' + this.best, 16, 22, 16, '#9ad1ff');
        if (this.over) this.overlay('Игра окончена');
    };

    // 14. АСТЕРОИДЫ
    function Asteroids() {
        BaseGame.call(this, 640, 480);
    }
    Asteroids.prototype = Object.create(BaseGame.prototype);
    Asteroids.prototype.constructor = Asteroids;
    Asteroids.prototype.init = function () {
        this.ship = { x: 320, y: 240, a: -Math.PI / 2 };
        this.vx = 0; this.vy = 0;
        this.bullets = [];
        this.asteroids = [];
        for (var i = 0; i < 6; i++) this.spawnRock();
        this.cool = 0;
    };
    Asteroids.prototype.spawnRock = function () {
        this.asteroids.push({
            x: Math.random() * this.w,
            y: Math.random() * this.h,
            r: 15 + Math.random() * 20,
            vx: (Math.random() - 0.5) * 0.1,
            vy: (Math.random() - 0.5) * 0.1
        });
    };
    Asteroids.prototype.onKey = function (code) {
        if (this.over) { if (match(code, KEY.ENTER)) this.restart(); return; }
        if (match(code, KEY.LEFT)  || match(code, KEY.A)) this.ship.a -= 0.15;
        if (match(code, KEY.RIGHT) || match(code, KEY.D)) this.ship.a += 0.15;
        if (match(code, KEY.UP)    || match(code, KEY.W)) {
            this.vx += Math.cos(this.ship.a) * 0.02;
            this.vy += Math.sin(this.ship.a) * 0.02;
        }
        if (match(code, KEY.SPACE) || match(code, KEY.ENTER)) {
            if (this.cool <= 0) {
                this.bullets.push({ x: this.ship.x, y: this.ship.y, vx: Math.cos(this.ship.a) * 0.6, vy: Math.sin(this.ship.a) * 0.6, life: 1500 });
                this.cool = 250;
            }
        }
    };
    Asteroids.prototype.update = function (dt) {
        if (this.over) return;
        this.cool -= dt;
        this.ship.x += this.vx * dt; this.ship.y += this.vy * dt;
        if (this.ship.x < 0) this.ship.x = this.w; if (this.ship.x > this.w) this.ship.x = 0;
        if (this.ship.y < 0) this.ship.y = this.h; if (this.ship.y > this.h) this.ship.y = 0;
        var self = this;
        this.bullets.forEach(function (b) { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; });
        this.bullets = this.bullets.filter(function (b) { return b.life > 0; });
        this.asteroids.forEach(function (a) { a.x += a.vx * dt; a.y += a.vy * dt;
            if (a.x < 0) a.x = self.w; if (a.x > self.w) a.x = 0;
            if (a.y < 0) a.y = self.h; if (a.y > self.h) a.y = 0;
        });
        // столкновения
        for (var i = this.bullets.length - 1; i >= 0; i--) {
            var b = this.bullets[i];
            for (var j = this.asteroids.length - 1; j >= 0; j--) {
                var a = this.asteroids[j];
                if (Math.hypot(a.x - b.x, a.y - b.y) < a.r) {
                    this.asteroids.splice(j, 1); this.bullets.splice(i, 1);
                    this.score += 25; if (this.score > this.best) this.best = this.score;
                    if (this.asteroids.length < 6) this.spawnRock();
                    break;
                }
            }
        }
        // столкновение корабля с астероидом
        for (var k = 0; k < this.asteroids.length; k++) {
            if (Math.hypot(this.asteroids[k].x - this.ship.x, this.asteroids[k].y - this.ship.y) < this.asteroids[k].r + 8) { this.over = true; return; }
        }
    };
    Asteroids.prototype.render = function () {
        this.clear();
        this.ctx.save();
        this.ctx.translate(this.ship.x, this.ship.y);
        this.ctx.rotate(this.ship.a);
        this.ctx.strokeStyle = '#7ee787'; this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(14, 0); this.ctx.lineTo(-10, 8); this.ctx.lineTo(-10, -8); this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.restore();
        this.ctx.fillStyle = '#f5d142';
        this.bullets.forEach(function (b) { this.ctx.beginPath(); this.ctx.arc(b.x, b.y, 3, 0, Math.PI*2); this.ctx.fill(); }, this);
        this.ctx.strokeStyle = '#9ad1ff'; this.ctx.lineWidth = 2;
        this.asteroids.forEach(function (a) {
            this.ctx.beginPath(); this.ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); this.ctx.stroke();
        }, this);
        this.text('Очки: ' + this.score + '   Рекорд: ' + this.best, 16, 22, 16, '#9ad1ff');
        if (this.over) this.overlay('Игра окончена');
    };

    // 15. SOKOBAN (упрощённый, 3 уровня)
    function Sokoban() {
        BaseGame.call(this, 480, 480);
    }
    Sokoban.prototype = Object.create(BaseGame.prototype);
    Sokoban.prototype.constructor = Sokoban;
    Sokoban.prototype.levels = [
        ["#######",
         "#  .  #",
         "#  $  #",
         "#  @  #",
         "#     #",
         "#######"],
        ["########",
         "#      #",
         "# .$@  #",
         "#      #",
         "########"],
        ["########",
         "#  .   #",
         "#  $   #",
         "#  @ . #",
         "#  $   #",
         "########"]
    ];
    Sokoban.prototype.init = function () {
        this.level = 0;
        this.loadLevel(0);
    };
    Sokoban.prototype.loadLevel = function (i) {
        this.level = i;
        var raw = this.levels[i];
        this.rows = raw.length;
        this.cols = raw[0].length;
        this.map = raw.map(function (r) { return r.split(''); });
        this.walls = []; this.goals = []; this.boxes = []; this.player = { x: 0, y: 0 };
        for (var y = 0; y < this.rows; y++)
            for (var x = 0; x < this.cols; x++) {
                var c = this.map[y][x];
                if (c === '#') this.walls.push({ x: x, y: y });
                if (c === '.' || c === '*') this.goals.push({ x: x, y: y });
                if (c === '$' || c === '*') this.boxes.push({ x: x, y: y });
                if (c === '@' || c === '+') this.player = { x: x, y: y };
            }
    };
    Sokoban.prototype.canMove = function (x, y) {
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return false;
        if (this.walls.find(function (w) { return w.x === x && w.y === y; })) return false;
        return true;
    };
    Sokoban.prototype.onKey = function (code) {
        if (this.over) { if (match(code, KEY.ENTER)) this.restart(); return; }
        var dx = 0, dy = 0;
        if (match(code, KEY.LEFT)  || match(code, KEY.A)) dx = -1;
        if (match(code, KEY.RIGHT) || match(code, KEY.D)) dx = 1;
        if (match(code, KEY.UP)    || match(code, KEY.W)) dy = -1;
        if (match(code, KEY.DOWN)  || match(code, KEY.S)) dy = 1;
        if (!dx && !dy) return;
        var nx = this.player.x + dx, ny = this.player.y + dy;
        if (!this.canMove(nx, ny)) return;
        var box = this.boxes.find(function (b) { return b.x === nx && b.y === ny; });
        if (box) {
            var bx = box.x + dx, by = box.y + dy;
            if (!this.canMove(bx, by)) return;
            if (this.boxes.find(function (b) { return b.x === bx && b.y === by; })) return;
            box.x = bx; box.y = by;
        }
        this.player.x = nx; this.player.y = ny;
        if (this.boxes.every(function (b) {
            return this.goals.find(function (g) { return g.x === b.x && g.y === b.y; });
        }, this)) {
            this.score += 100; if (this.score > this.best) this.best = this.score;
            if (this.level + 1 < this.levels.length) setTimeout(this.loadLevel.bind(this, this.level + 1), 300);
            else this.over = true;
        }
    };
    Sokoban.prototype.onSwipe = function (dir) {
        var map = { left: KEY.LEFT[0], right: KEY.RIGHT[0], up: KEY.UP[0], down: KEY.DOWN[0] };
        if (map[dir]) this.onKey(map[dir]);
    };
    Sokoban.prototype.render = function () {
        this.clear();
        var size = Math.min((this.w - 40) / this.cols, (this.h - 60) / this.rows);
        var ox = (this.w - this.cols * size) / 2;
        var oy = (this.h - this.rows * size) / 2 + 20;
        this.walls.forEach(function (w) {
            this.ctx.fillStyle = '#555'; this.ctx.fillRect(ox + w.x*size, oy + w.y*size, size - 2, size - 2);
        }, this);
        this.goals.forEach(function (g) {
            this.ctx.fillStyle = '#f5d142';
            this.ctx.beginPath(); this.ctx.arc(ox + g.x*size + size/2, oy + g.y*size + size/2, size/4, 0, Math.PI*2); this.ctx.fill();
        }, this);
        this.boxes.forEach(function (b) {
            this.ctx.fillStyle = '#8a6d3b';
            this.ctx.fillRect(ox + b.x*size + 2, oy + b.y*size + 2, size - 4, size - 4);
        }, this);
        this.ctx.fillStyle = '#7ee787';
        this.ctx.fillRect(ox + this.player.x*size + 4, oy + this.player.y*size + 4, size - 8, size - 8);
        this.text('Уровень: ' + (this.level + 1) + '/' + this.levels.length + '   Очки: ' + this.score, 16, 22, 16, '#9ad1ff');
        if (this.over) this.overlay('Все уровни пройдены!');
    };

    // 16. PAC-MAN (упрощённый)
    function Pacman() {
        BaseGame.call(this, 480, 480);
    }
    Pacman.prototype = Object.create(BaseGame.prototype);
    Pacman.prototype.constructor = Pacman;
    Pacman.prototype.init = function () {
        this.cols = 15; this.rows = 15;
        this.cell = 30;
        this.player = { x: 7, y: 7, dir: { x: 0, y: 0 }, next: null };
        this.pellets = [];
        this.maze = [];
        for (var y = 0; y < this.rows; y++) {
            var row = [];
            for (var x = 0; x < this.cols; x++) {
                var wall = (x === 0 || y === 0 || x === this.cols - 1 || y === this.rows - 1 ||
                            (x % 2 === 0 && y % 2 === 0 && Math.random() < 0.3));
                row.push(wall ? 1 : 0);
                if (!wall && !(x === 7 && y === 7)) this.pellets.push({ x: x, y: y });
            }
            this.maze.push(row);
        }
        this.maze[7][7] = 0;
        this.ghosts = [
            { x: 1, y: 1, vx: 0.05, vy: 0 },
            { x: this.cols - 2, y: 1, vx: -0.05, vy: 0 },
            { x: 1, y: this.rows - 2, vx: 0, vy: -0.05 }
        ];
        this.acc = 0;
        this.ghostAcc = 0;
    };
    Pacman.prototype.isWall = function (x, y) {
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return true;
        return this.maze[y][x] === 1;
    };
    Pacman.prototype.onKey = function (code) {
        if (this.over) { if (match(code, KEY.ENTER)) this.restart(); return; }
        if (match(code, KEY.LEFT))  this.player.next = { x: -1, y: 0 };
        if (match(code, KEY.RIGHT)) this.player.next = { x: 1, y: 0 };
        if (match(code, KEY.UP))    this.player.next = { x: 0, y: -1 };
        if (match(code, KEY.DOWN))  this.player.next = { x: 0, y: 1 };
    };
    Pacman.prototype.update = function (dt) {
        if (this.over) return;
        this.acc += dt;
        if (this.acc > 180) {
            this.acc = 0;
            var p = this.player;
            if (p.next && !this.isWall(p.x + p.next.x, p.y + p.next.y)) { p.dir = p.next; p.next = null; }
            if (!this.isWall(p.x + p.dir.x, p.y + p.dir.y)) { p.x += p.dir.x; p.y += p.dir.y; }
            var self = this;
            this.pellets = this.pellets.filter(function (pel) {
                if (pel.x === p.x && pel.y === p.y) { self.score += 10; if (self.score > self.best) self.best = self.score; return false; }
                return true;
            });
            if (!this.pellets.length) { this.score += 500; this.over = true; this.won = true; }
        }
        // призраки
        this.ghostAcc += dt;
        if (this.ghostAcc > 200) {
            this.ghostAcc = 0;
            this.ghosts.forEach(function (g) {
                var opts = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}].filter(function (d) {
                    return !this.isWall(g.x + d.x, g.y + d.y);
                }, this);
                if (opts.length) {
                    var d = opts[Math.floor(Math.random() * opts.length)];
                    g.x += d.x; g.y += d.y;
                }
            }, this);
        }
        for (var i = 0; i < this.ghosts.length; i++) {
            if (this.ghosts[i].x === this.player.x && this.ghosts[i].y === this.player.y) { this.over = true; this.won = false; return; }
        }
    };
    Pacman.prototype.render = function () {
        this.clear();
        var size = this.cell;
        var ox = (this.w - this.cols * size) / 2;
        var oy = (this.h - this.rows * size) / 2 + 20;
        for (var y = 0; y < this.rows; y++)
            for (var x = 0; x < this.cols; x++) {
                if (this.maze[y][x]) { this.ctx.fillStyle = '#2a4a7a'; this.ctx.fillRect(ox + x*size, oy + y*size, size - 1, size - 1); }
            }
        this.ctx.fillStyle = '#f5d142';
        this.pellets.forEach(function (p) {
            this.ctx.beginPath();
            this.ctx.arc(ox + p.x*size + size/2, oy + p.y*size + size/2, 3, 0, Math.PI*2);
            this.ctx.fill();
        }, this);
        this.ctx.fillStyle = '#ffe11a';
        this.ctx.beginPath();
        this.ctx.arc(ox + this.player.x*size + size/2, oy + this.player.y*size + size/2, size/2 - 3, 0, Math.PI*2);
        this.ctx.fill();
        this.ghosts.forEach(function (g) {
            this.ctx.fillStyle = '#ff5a5a';
            this.ctx.beginPath();
            this.ctx.arc(ox + g.x*size + size/2, oy + g.y*size + size/2, size/2 - 3, 0, Math.PI*2);
            this.ctx.fill();
        }, this);
        this.text('Очки: ' + this.score + '   Рекорд: ' + this.best, 16, 22, 16, '#9ad1ff');
        if (this.over) this.overlay(this.won ? 'Победа!' : 'Вас съели');
    };

    // 17. FLAPPY (дубликат для 20 игр — заменим на Bricks Breaker)
    function BricksBreaker() { Arkanoid.call(this); }
    BricksBreaker.prototype = Object.create(Arkanoid.prototype);
    BricksBreaker.prototype.constructor = BricksBreaker;

    // 18. РЕАКЦИЯ 2 — Clicker (клик по цели)
    function Clicker() {
        BaseGame.call(this, 480, 480);
    }
    Clicker.prototype = Object.create(BaseGame.prototype);
    Clicker.prototype.constructor = Clicker;
    Clicker.prototype.init = function () {
        this.timer = 15000;
        this.target = null;
        this.spawnTimer = 0;
    };
    Clicker.prototype.onKey = function (code) {
        if (this.over) { if (match(code, KEY.ENTER)) this.restart(); return; }
        if ((match(code, KEY.ENTER) || match(code, KEY.SPACE)) && this.target) {
            this.score += 10; if (this.score > this.best) this.best = this.score;
            this.target = null;
        }
    };
    Clicker.prototype.onTap = function (x, y) {
        if (this.target && Math.hypot(this.target.x - x, this.target.y - y) < this.target.r) {
            this.score += 10; if (this.score > this.best) this.best = this.score;
            this.target = null;
        }
    };
    Clicker.prototype.update = function (dt) {
        if (this.over) return;
        this.timer -= dt;
        if (this.timer <= 0) { this.over = true; return; }
        this.spawnTimer += dt;
        if (!this.target && this.spawnTimer > 500) {
            this.spawnTimer = 0;
            this.target = { x: 60 + Math.random() * (this.w - 120), y: 80 + Math.random() * (this.h - 160), r: 30 };
        }
    };
    Clicker.prototype.render = function () {
        this.clear();
        if (this.target) {
            this.ctx.fillStyle = '#f5d142';
            this.ctx.beginPath(); this.ctx.arc(this.target.x, this.target.y, this.target.r, 0, Math.PI*2); this.ctx.fill();
        }
        this.text('Очки: ' + this.score + '   Время: ' + Math.ceil(this.timer/1000) + 'с', 16, 22, 16, '#9ad1ff');
        this.text('Жми OK на цель', this.w/2, this.h - 20, 14, '#aaa', 'center');
        if (this.over) this.overlay('Время вышло!');
    };

    // 19. STACK (башенка)
    function Stack() {
        BaseGame.call(this, 480, 560);
    }
    Stack.prototype = Object.create(BaseGame.prototype);
    Stack.prototype.constructor = Stack;
    Stack.prototype.init = function () {
        this.blocks = [{ x: 100, w: 280 }];
        this.current = { x: 100, w: 280, vx: 1.4 };
        this.perfect = 0;
    };
    Stack.prototype.onKey = function (code) {
        if (this.over) { if (match(code, KEY.ENTER) || match(code, KEY.SPACE)) this.restart(); return; }
        if (!match(code, KEY.ENTER) && !match(code, KEY.SPACE)) return;
        var top = this.blocks[this.blocks.length - 1];
        var left = Math.max(top.x, this.current.x);
        var right = Math.min(top.x + top.w, this.current.x + this.current.w);
        var w = right - left;
        if (w <= 0) { this.over = true; return; }
        this.blocks.push({ x: left, w: w });
        this.score += 10 + (w === top.w ? 20 : 0);
        if (this.score > this.best) this.best = this.score;
        if (this.blocks.length > 20) { this.score += 200; this.over = true; return; }
        this.current = { x: 100, w: w, vx: (Math.random() < 0.5 ? 1 : -1) * 1.4 };
    };
    Stack.prototype.update = function (dt) {
        if (this.over) return;
        this.current.x += this.current.vx * dt * 0.25;
        if (this.current.x < 20) { this.current.x = 20; this.current.vx = Math.abs(this.current.vx); }
        if (this.current.x + this.current.w > this.w - 20) { this.current.x = this.w - 20 - this.current.w; this.current.vx = -Math.abs(this.current.vx); }
    };
    Stack.prototype.render = function () {
        this.clear();
        var baseY = this.h - 40;
        var bh = 22;
        for (var i = 0; i < this.blocks.length; i++) {
            var b = this.blocks[i];
            this.ctx.fillStyle = 'hsl(' + ((i * 30) % 360) + ', 60%, 55%)';
            this.ctx.fillRect(b.x, baseY - i * bh, b.w, bh - 2);
        }
        if (!this.over) {
            this.ctx.fillStyle = 'hsl(' + ((this.blocks.length * 30) % 360) + ', 60%, 55%)';
            this.ctx.fillRect(this.current.x, baseY - this.blocks.length * bh, this.current.w, bh - 2);
        }
        this.text('Очки: ' + this.score + '   Рекорд: ' + this.best, 16, 22, 16, '#9ad1ff');
        if (this.over) this.overlay('Игра окончена');
    };

    // 20. УГАДАЙ ЧИСЛО
    function GuessNumber() {
        BaseGame.call(this, 480, 480);
    }
    GuessNumber.prototype = Object.create(BaseGame.prototype);
    GuessNumber.prototype.constructor = GuessNumber;
    GuessNumber.prototype.init = function () {
        this.target = 1 + Math.floor(Math.random() * 100);
        this.current = 50;
        this.attempts = 0;
        this.hint = 'Загадано число от 1 до 100';
    };
    GuessNumber.prototype.onKey = function (code) {
        if (this.over) { if (match(code, KEY.ENTER)) this.restart(); return; }
        if (match(code, KEY.LEFT))  this.current = Math.max(1, this.current - 1);
        if (match(code, KEY.RIGHT)) this.current = Math.min(100, this.current + 1);
        if (match(code, KEY.UP))    this.current = Math.min(100, this.current + 10);
        if (match(code, KEY.DOWN))  this.current = Math.max(1, this.current - 10);
        if (match(code, KEY.ENTER) || match(code, KEY.SPACE)) {
            this.attempts++;
            if (this.current === this.target) {
                this.score = Math.max(10, 200 - this.attempts * 15);
                if (this.score > this.best) this.best = this.score;
                this.hint = 'Угадал! Число: ' + this.target;
                this.over = true;
            } else if (this.current < this.target) this.hint = 'Больше';
            else this.hint = 'Меньше';
        }
    };
    GuessNumber.prototype.render = function () {
        this.clear();
        this.text('Ваше число:', this.w/2, 140, 22, '#fff', 'center');
        this.text(String(this.current), this.w/2, 280, 100, '#f5d142', 'center');
        this.text('Попыток: ' + this.attempts, this.w/2, 340, 18, '#aaa', 'center');
        this.text(this.hint, this.w/2, 400, 18, '#9ad1ff', 'center');
        if (this.over) this.overlay('Победа!');
    };

    // =========================================================================
    // РЕЕСТР ИГР
    // =========================================================================
    var GAMES = [
        { id: 'tetris',    title: 'Тетрис',           C: Tetris },
        { id: 'g2048',     title: '2048',             C: Game2048 },
        { id: 'snake',     title: 'Змейка',           C: Snake },
        { id: 'arkanoid',  title: 'Арканоид',         C: Arkanoid },
        { id: 'pong',      title: 'Пинг-понг',        C: Pong },
        { id: 'flappy',    title: 'Flappy',           C: Flappy },
        { id: 'memory',    title: 'Найди пару',       C: Memory },
        { id: 'ttt',       title: 'Крестики-нолики',  C: TicTacToe },
        { id: 'simon',     title: 'Саймон',           C: Simon },
        { id: 'reaction',  title: 'Реакция',          C: Reaction },
        { id: 'whack',     title: 'Ударь крота',      C: Whack },
        { id: 'mines',     title: 'Сапёр',            C: Minesweeper },
        { id: 'invaders',  title: 'Космо-защита',     C: SpaceInvaders },
        { id: 'asteroids', title: 'Астероиды',        C: Asteroids },
        { id: 'sokoban',   title: 'Сокобан',          C: Sokoban },
        { id: 'pacman',    title: 'Пакман',           C: Pacman },
        { id: 'bricks2',   title: 'Разрушитель',      C: BricksBreaker },
        { id: 'clicker',   title: 'Тир',              C: Clicker },
        { id: 'stack',     title: 'Башня',            C: Stack },
        { id: 'guess',     title: 'Угадай число',     C: GuessNumber }
    ];

    // =========================================================================
    // ЭКРАН СПИСКА ИГР
    // =========================================================================
    function GamesListComponent(object) {
        var _this = this;
        var scroll = new Lampa.Scroll({ mask: true, over: true, scroll_by_item: true });
        var html = document.createElement('div');
        var items = [];
        var last = null;

        this.create = function () {
            var title = document.createElement('div');
            title.className = 'items-line__title';
            title.textContent = 'Игры (20)';
            title.style.padding = '1em';
            html.appendChild(title);
            html.appendChild(scroll.render(true));
            GAMES.forEach(function (g) {
                var el = document.createElement('div');
                el.className = 'selector';
                el.style.cssText = 'display:flex;align-items:center;padding:1em 1.2em;margin:0.4em 1em;border-radius:0.8em;background:rgba(255,255,255,0.06);';
                el.innerHTML = '<div style="font-size:1.1em">' + g.title + '</div>' +
                               '<div style="margin-left:auto;opacity:0.5">▶</div>';
                el.addEventListener('hover:focus', function () {
                    last = el;
                    scroll.update(el, true);
                });
                el.addEventListener('hover:enter', function () {
                    Lampa.Activity.push({
                        url: '',
                        title: g.title,
                        component: 'games20_play',
                        game_id: g.id
                    });
                });
                items.push(el);
                scroll.append(el);
            });
            _this.activity.loader(false);
            _this.activity.toggle();
        };

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(last || items[0], scroll.render());
                },
                up: function () { if (Navigator.canmove('up')) Navigator.move('up'); else Lampa.Controller.toggle('head'); },
                down: function () { Navigator.move('down'); },
                left: function () { Lampa.Controller.toggle('menu'); },
                right: function () { Navigator.move('right'); },
                back: function () { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('content');
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function (js) { return js ? html : $(html); };
        this.destroy = function () { scroll.destroy(); html.remove(); };
    }

    // =========================================================================
    // ЭКРАН ИГРЫ + HUD + УПРАВЛЕНИЕ
    // =========================================================================
    function GamePlayComponent(object) {
        var _this = this;
        var game = null;
        var root = document.createElement('div');
        root.style.cssText = 'display:flex;flex-direction:column;align-items:center;height:100%;width:100%;background:#0b0f14;overflow:hidden;position:relative;';
        var stage = document.createElement('div');
        stage.style.cssText = 'flex:1;display:flex;align-items:center;justify-content:center;width:100%;padding:1em;overflow:hidden;';
        root.appendChild(stage);

        var pad = null;
        var detachKey = null;
        var detachSwipe = null;

        function findGame() {
            var def = GAMES.find(function (g) { return g.id == object.game_id; });
            return def ? def : GAMES[0];
        }

        function buildTouchpad() {
            pad = document.createElement('div');
            pad.className = 'game20-pad';
            pad.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);gap:0.4em;width:min(70vw,300px);margin:0 auto 1em;user-select:none;touch-action:none;';
            var defs = [
                ['', '▲', ''],
                ['◀', 'OK', '▶'],
                ['', '▼', '']
            ];
            defs.forEach(function (row) {
                row.forEach(function (label) {
                    var b = document.createElement('div');
                    b.className = 'selector';
                    b.style.cssText = 'display:flex;align-items:center;justify-content:center;font-size:1.4em;padding:0.7em;border-radius:0.6em;background:rgba(255,255,255,0.08);';
                    b.textContent = label;
                    if (label) {
                        b.addEventListener('click', function () {
                            if (label === '▲') game && game.onKey(KEY.UP[0]);
                            else if (label === '▼') game && game.onKey(KEY.DOWN[0]);
                            else if (label === '◀') game && game.onKey(KEY.LEFT[0]);
                            else if (label === '▶') game && game.onKey(KEY.RIGHT[0]);
                            else if (label === 'OK') game && game.onKey(KEY.ENTER[0]);
                        });
                        b.addEventListener('touchstart', function (e) {
                            e.preventDefault();
                            if (label === '▲') game && game.onKey(KEY.UP[0]);
                            else if (label === '▼') game && game.onKey(KEY.DOWN[0]);
                            else if (label === '◀') game && game.onKey(KEY.LEFT[0]);
                            else if (label === '▶') game && game.onKey(KEY.RIGHT[0]);
                            else if (label === 'OK') game && game.onKey(KEY.ENTER[0]);
                        }, { passive: false });
                    }
                    pad.appendChild(b);
                });
            });
            root.appendChild(pad);
        }

        function setupGestures() {
            var start = null;
            function begin(x, y) { start = { x: x, y: y, t: Date.now() }; }
            function end(x, y) {
                if (!start) return;
                var dx = x - start.x, dy = y - start.y;
                var dist = Math.hypot(dx, dy);
                if (dist < 30) { game && game.onTap(x, y); return; }
                var dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
                game && game.onSwipe(dir);
                start = null;
            }
            var canvas = game.canvas;
            canvas.addEventListener('touchstart', function (e) {
                var t = e.touches[0]; begin(t.clientX, t.clientY);
            }, { passive: true });
            canvas.addEventListener('touchend', function (e) {
                var t = e.changedTouches[0]; end(t.clientX, t.clientY);
            }, { passive: true });
            // мышь (только для кликов-тапов)
            canvas.addEventListener('click', function (e) {
                var rect = canvas.getBoundingClientRect();
                game.onTap((e.clientX - rect.left) * canvas.width / rect.width,
                           (e.clientY - rect.top)  * canvas.height / rect.height);
            });
        }

        function resizeCanvas() {
            if (!game) return;
            var maxW = stage.clientWidth - 20;
            var maxH = stage.clientHeight - 20;
            var scale = Math.min(maxW / game.w, maxH / game.h, 1.5);
            game.canvas.style.width = Math.floor(game.w * scale) + 'px';
            game.canvas.style.height = Math.floor(game.h * scale) + 'px';
        }

        this.create = function () {
            var def = findGame();
            var GameClass = def.C;
            game = new GameClass();
            object.title = def.title;
            game.mount(stage);
            game.init();
            game.startLoop();
            buildTouchpad();
            setupGestures();
            resizeCanvas();
            this.activity.loader(false);
            this.activity.toggle();
            if (Lampa.Platform && Lampa.Platform.screen && Lampa.Platform.screen('mobile')) {
                // на мобилках показываем пад
            } else {
                // на ТВ скрываем экранные кнопки, управление — пульт
                pad.style.display = 'none';
            }
        };

        this.start = function () {
            var self = this;
            Lampa.Controller.add('content', {
                invisible: true,
                toggle: function () { Lampa.Controller.clear(); },
                enter: function () { game && game.onKey(KEY.ENTER[0]); },
                up:    function () { game && game.onKey(KEY.UP[0]); },
                down:  function () { game && game.onKey(KEY.DOWN[0]); },
                left:  function () { game && game.onKey(KEY.LEFT[0]); },
                right: function () { game && game.onKey(KEY.RIGHT[0]); },
                back:  function () { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('content');
            detachKey = function (e) {
                if (!game) return;
                // стрелки/WASD
                game.onKey(e.code);
                // блокируем системные действия вроде скролла
                if (e.code === 32 || (e.code >= 37 && e.code <= 40)) {
                    if (e.event && e.event.preventDefault) e.event.preventDefault();
                }
            };
            Lampa.Keypad.listener.follow('keydown', detachKey);
            setTimeout(resizeCanvas, 50);
        };

        this.pause = function () {};
        this.stop = function () {};
        this.resize = function () { resizeCanvas(); };
        this.render = function (js) { return js ? root : $(root); };
        this.destroy = function () {
            if (detachKey) Lampa.Keypad.listener.remove('keydown', detachKey);
            if (game) game.stopLoop();
            game = null;
            root.remove();
        };
    }

    // =========================================================================
    // РЕГИСТРАЦИЯ В LAMPA
    // =========================================================================
    function startPlugin() {
        // Регистрируем компоненты
        Lampa.Component.add('games20_list', GamesListComponent);
        Lampa.Component.add('games20_play', GamePlayComponent);

        // Добавляем в левое меню пункт "Игры"
        var menu = document.querySelector('.menu .menu__list');
        if (menu) {
            var item = document.createElement('li');
            item.className = 'menu__item selector';
            item.setAttribute('data-action', 'games20');
            item.innerHTML = '<div class="menu__ico"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M7 6h10a5 5 0 0 1 0 10h-1.5l-1.5-2h-4l-1.5 2H7a5 5 0 0 1 0-10zm1.5 3a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm7 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/></svg></div><div class="menu__text">Игры</div>';
            item.addEventListener('hover:enter', function () {
                Lampa.Activity.push({
                    url: '',
                    title: 'Игры',
                    component: 'games20_list'
                });
            });
            // добавляем перед "Настройки"
            var settings = menu.querySelector('[data-action="settings"]');
            if (settings) settings.parentNode.insertBefore(item, settings);
            else menu.appendChild(item);
        }

        console.log('Games20 plugin started');
    }

    // Точка входа плагина
    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startPlugin();
        });
    }
})();
/**
 * Плагин "Игры" для Lampa (ES5-совместимый)
 * Боковое меню -> 5 игр: Змейка, Крестики-нолики, 2048, Тетрис, Пятнашки
 */
(function () {
    'use strict';

    // Полифил для NodeList.forEach, если его нет
    if (typeof NodeList !== 'undefined' && !NodeList.prototype.forEach) {
        NodeList.prototype.forEach = Array.prototype.forEach;
    }

    // Вспомогательная функция: получить контекст canvas
    function getCanvasContext(id, width, height) {
        var canvas = document.getElementById(id);
        if (!canvas) return null;
        canvas.width = width;
        canvas.height = height;
        return canvas.getContext('2d');
    }

    // Универсальное управление направлениями (пульт/мышь/тач)
    function addDirectionControl(el, callback) {
        function keyHandler(e) {
            var dir = null;
            if (e.keyCode === 37) dir = 'left';
            else if (e.keyCode === 38) dir = 'up';
            else if (e.keyCode === 39) dir = 'right';
            else if (e.keyCode === 40) dir = 'down';
            if (dir) {
                e.preventDefault();
                callback(dir);
            }
        }
        window.addEventListener('keydown', keyHandler);

        function pointerHandler(e) {
            var rect = el.getBoundingClientRect();
            var clientX = e.touches ? e.touches[0].clientX : e.clientX;
            var clientY = e.touches ? e.touches[0].clientY : e.clientY;
            var x = clientX - rect.left;
            var y = clientY - rect.top;
            var cx = rect.width / 2;
            var cy = rect.height / 2;
            var dx = x - cx;
            var dy = y - cy;
            if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
            if (Math.abs(dx) > Math.abs(dy)) {
                callback(dx > 0 ? 'right' : 'left');
            } else {
                callback(dy > 0 ? 'down' : 'up');
            }
            e.preventDefault();
        }
        el.addEventListener('click', pointerHandler);
        el.addEventListener('touchstart', pointerHandler, { passive: false });

        el._cleanup = function () {
            window.removeEventListener('keydown', keyHandler);
            el.removeEventListener('click', pointerHandler);
            el.removeEventListener('touchstart', pointerHandler);
        };
    }

    // ======================== ЗМЕЙКА ========================
    function SnakeGame(canvas, onExit) {
        var ctx = canvas.getContext('2d');
        var gridSize = 20;
        var tileCount = canvas.width / gridSize;
        var snake = [{ x: 10, y: 10 }];
        var food = {};
        var direction = { x: 0, y: 0 };
        var nextDirection = { x: 0, y: 0 };
        var score = 0;
        var gameLoop = null;
        var dirMap = {
            'left':  { x: -1, y: 0 },
            'up':    { x: 0, y: -1 },
            'right': { x: 1, y: 0 },
            'down':  { x: 0, y: 1 }
        };

        function randomFood() {
            food.x = Math.floor(Math.random() * tileCount);
            food.y = Math.floor(Math.random() * tileCount);
            for (var i = 0; i < snake.length; i++) {
                if (snake[i].x === food.x && snake[i].y === food.y) {
                    randomFood();
                    break;
                }
            }
        }

        function draw() {
            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            for (var i = 0; i < snake.length; i++) {
                ctx.fillStyle = i === 0 ? '#4CAF50' : '#8BC34A';
                ctx.fillRect(snake[i].x * gridSize, snake[i].y * gridSize, gridSize - 2, gridSize - 2);
            }
            ctx.fillStyle = '#F44336';
            ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
            ctx.fillStyle = '#fff';
            ctx.font = '16px Arial';
            ctx.fillText('Счёт: ' + score, 10, 20);
        }

        function step() {
            direction.x = nextDirection.x;
            direction.y = nextDirection.y;
            if (direction.x === 0 && direction.y === 0) return;

            var head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
            if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
                gameOver();
                return;
            }
            for (var i = 0; i < snake.length; i++) {
                if (snake[i].x === head.x && snake[i].y === head.y) {
                    gameOver();
                    return;
                }
            }

            snake.unshift(head);
            if (head.x === food.x && head.y === food.y) {
                score++;
                randomFood();
            } else {
                snake.pop();
            }
            draw();
        }

        function gameOver() {
            clearInterval(gameLoop);
            ctx.fillStyle = '#fff';
            ctx.font = '30px Arial';
            ctx.fillText('Игра окончена', canvas.width / 2 - 100, canvas.height / 2);
            setTimeout(onExit, 2000);
        }

        randomFood();
        gameLoop = setInterval(step, 100);
        draw();

        addDirectionControl(canvas, function (dir) {
            var newDir = dirMap[dir];
            if (direction.x !== -newDir.x || direction.y !== -newDir.y) {
                nextDirection = newDir;
            }
        });

        return { stop: function () { clearInterval(gameLoop); } };
    }

    // ======================== КРЕСТИКИ-НОЛИКИ ========================
    function TicTacToe(container, onExit) {
        var board = [['', '', ''], ['', '', ''], ['', '', '']];
        var currentPlayer = 'X';
        var gameActive = true;

        function render() {
            var html = '<div class="tictactoe-board">';
            for (var y = 0; y < 3; y++) {
                html += '<div class="tictactoe-row">';
                for (var x = 0; x < 3; x++) {
                    html += '<div class="tictactoe-cell" data-x="' + x + '" data-y="' + y + '" tabindex="0">' + board[y][x] + '</div>';
                }
                html += '</div>';
            }
            html += '</div><div class="tictactoe-status">Ход: ' + currentPlayer + '</div>';
            html += '<button class="tictactoe-back">← Назад</button>';
            container.innerHTML = html;

            var cells = container.querySelectorAll('.tictactoe-cell');
            for (var i = 0; i < cells.length; i++) {
                cells[i].addEventListener('click', cellClick);
            }
            container.querySelector('.tictactoe-back').addEventListener('click', onExit);

            // Выделим первую клетку для пульта
            if (cells.length > 0) cells[0].focus();
        }

        function cellClick() {
            if (!gameActive) return;
            var x = parseInt(this.getAttribute('data-x'));
            var y = parseInt(this.getAttribute('data-y'));
            if (board[y][x] !== '') return;
            board[y][x] = currentPlayer;

            if (checkWin(currentPlayer)) {
                gameActive = false;
                render();
                container.querySelector('.tictactoe-status').textContent = 'Победил: ' + currentPlayer;
                setTimeout(onExit, 2000);
                return;
            }
            if (isBoardFull()) {
                gameActive = false;
                render();
                container.querySelector('.tictactoe-status').textContent = 'Ничья!';
                setTimeout(onExit, 2000);
                return;
            }
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            if (currentPlayer === 'O' && gameActive) {
                setTimeout(computerMove, 300);
            } else {
                render();
            }
        }

        function computerMove() {
            if (!gameActive) return;
            var empty = [];
            for (var y = 0; y < 3; y++) {
                for (var x = 0; x < 3; x++) {
                    if (board[y][x] === '') empty.push({ x: x, y: y });
                }
            }
            if (empty.length === 0) return;
            var move = empty[Math.floor(Math.random() * empty.length)];
            board[move.y][move.x] = 'O';
            if (checkWin('O')) {
                gameActive = false;
                render();
                container.querySelector('.tictactoe-status').textContent = 'Победил: O';
                setTimeout(onExit, 2000);
                return;
            }
            currentPlayer = 'X';
            render();
        }

        function checkWin(player) {
            for (var i = 0; i < 3; i++) {
                if (board[i][0] === player && board[i][1] === player && board[i][2] === player) return true;
                if (board[0][i] === player && board[1][i] === player && board[2][i] === player) return true;
            }
            if (board[0][0] === player && board[1][1] === player && board[2][2] === player) return true;
            if (board[0][2] === player && board[1][1] === player && board[2][0] === player) return true;
            return false;
        }

        function isBoardFull() {
            for (var y = 0; y < 3; y++) {
                for (var x = 0; x < 3; x++) {
                    if (board[y][x] === '') return false;
                }
            }
            return true;
        }

        render();

        // Enter / пробел на сфокусированной клетке
        container.addEventListener('keydown', function (e) {
            if (e.keyCode === 13 || e.keyCode === 32) {
                var focused = document.activeElement;
                if (focused && focused.classList.contains('tictactoe-cell')) {
                    focused.click();
                }
            }
        });
    }

    // ======================== 2048 ========================
    function Game2048(container, onExit) {
        var size = 4;
        var grid = [];
        var score = 0;
        var gameOverFlag = false;

        function initGrid() {
            grid = [];
            for (var r = 0; r < size; r++) {
                var row = [];
                for (var c = 0; c < size; c++) {
                    row.push(0);
                }
                grid.push(row);
            }
        }

        function addRandom() {
            var empty = [];
            for (var r = 0; r < size; r++) {
                for (var c = 0; c < size; c++) {
                    if (grid[r][c] === 0) empty.push({ r: r, c: c });
                }
            }
            if (empty.length > 0) {
                var pos = empty[Math.floor(Math.random() * empty.length)];
                grid[pos.r][pos.c] = Math.random() < 0.9 ? 2 : 4;
            }
        }

        function move(direction) {
            if (gameOverFlag) return;
            var moved = false;
            var newGrid = [];
            for (var r = 0; r < size; r++) {
                newGrid.push(grid[r].slice()); // копия строки
            }

            function slide(row) {
                var arr = [];
                for (var i = 0; i < row.length; i++) {
                    if (row[i] !== 0) arr.push(row[i]);
                }
                for (var i = 0; i < arr.length - 1; i++) {
                    if (arr[i] === arr[i + 1]) {
                        arr[i] *= 2;
                        score += arr[i];
                        arr.splice(i + 1, 1);
                    }
                }
                while (arr.length < size) arr.push(0);
                return arr;
            }

            if (direction === 'left') {
                for (var r = 0; r < size; r++) {
                    var oldRow = newGrid[r].slice();
                    newGrid[r] = slide(newGrid[r]);
                    if (oldRow.toString() !== newGrid[r].toString()) moved = true;
                }
            } else if (direction === 'right') {
                for (var r = 0; r < size; r++) {
                    var reversed = newGrid[r].slice().reverse();
                    var slided = slide(reversed);
                    newGrid[r] = slided.reverse();
                    if (newGrid[r].toString() !== grid[r].toString()) moved = true;
                }
            } else if (direction === 'up') {
                for (var c = 0; c < size; c++) {
                    var col = [];
                    for (var r = 0; r < size; r++) col.push(newGrid[r][c]);
                    var slided = slide(col);
                    for (var r = 0; r < size; r++) newGrid[r][c] = slided[r];
                }
                moved = true;
            } else if (direction === 'down') {
                for (var c = 0; c < size; c++) {
                    var col = [];
                    for (var r = 0; r < size; r++) col.push(newGrid[r][c]);
                    col.reverse();
                    var slided = slide(col);
                    var slidedReversed = slided.reverse();
                    for (var r = 0; r < size; r++) newGrid[r][c] = slidedReversed[r];
                }
                moved = true;
            }

            if (moved) {
                grid = newGrid;
                addRandom();
                if (isGameOver()) gameOverFlag = true;
            }
            render();
        }

        function isGameOver() {
            for (var r = 0; r < size; r++) {
                for (var c = 0; c < size; c++) {
                    if (grid[r][c] === 0) return false;
                }
            }
            for (var r = 0; r < size; r++) {
                for (var c = 0; c < size - 1; c++) {
                    if (grid[r][c] === grid[r][c + 1]) return false;
                }
            }
            for (var c = 0; c < size; c++) {
                for (var r = 0; r < size - 1; r++) {
                    if (grid[r][c] === grid[r + 1][c]) return false;
                }
            }
            return true;
        }

        function render() {
            var html = '<div class="game2048-score">Счёт: ' + score + '</div>';
            html += '<div class="game2048-grid">';
            for (var r = 0; r < size; r++) {
                html += '<div class="game2048-row">';
                for (var c = 0; c < size; c++) {
                    var val = grid[r][c];
                    html += '<div class="game2048-cell' + (val ? ' cell-' + val : '') + '">' + (val || '') + '</div>';
                }
                html += '</div>';
            }
            html += '</div>';
            html += '<button class="game2048-back">← Назад</button>';
            if (gameOverFlag) html += '<div class="game2048-overlay">Игра окончена</div>';
            container.innerHTML = html;

            container.querySelector('.game2048-back').addEventListener('click', onExit);
        }

        function init() {
            initGrid();
            score = 0;
            gameOverFlag = false;
            addRandom();
            addRandom();
            render();
        }

        init();

        var canvasLike = container.querySelector('.game2048-grid');
        if (canvasLike) {
            addDirectionControl(canvasLike, function (dir) { move(dir); });
        }

        window.addEventListener('keydown', function key2048(e) {
            if (e.keyCode >= 37 && e.keyCode <= 40) {
                e.preventDefault();
                var dir = { 37: 'left', 38: 'up', 39: 'right', 40: 'down' }[e.keyCode];
                move(dir);
            }
        });
    }

    // ======================== ТЕТРИС ========================
    function TetrisGame(canvas, onExit) {
        var ctx = canvas.getContext('2d');
        var blockSize = 30;
        var cols = 10, rows = 20;
        var board = [];
        var piece, pieceX, pieceY;
        var score = 0;
        var gameInterval;

        var pieces = [
            [[1,1,1,1]], // I
            [[1,1],[1,1]], // O
            [[0,1,0],[1,1,1]], // T
            [[1,0,0],[1,1,1]], // L
            [[0,0,1],[1,1,1]], // J
            [[0,1,1],[1,1,0]], // S
            [[1,1,0],[0,1,1]]  // Z
        ];

        function initBoard() {
            board = [];
            for (var r = 0; r < rows; r++) {
                var row = [];
                for (var c = 0; c < cols; c++) row.push(0);
                board.push(row);
            }
        }

        function randomPiece() {
            var idx = Math.floor(Math.random() * pieces.length);
            // глубокая копия
            var p = pieces[idx];
            var copy = [];
            for (var y = 0; y < p.length; y++) {
                copy.push(p[y].slice());
            }
            return copy;
        }

        function draw() {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            for (var r = 0; r < rows; r++) {
                for (var c = 0; c < cols; c++) {
                    if (board[r][c]) {
                        ctx.fillStyle = '#00BCD4';
                        ctx.fillRect(c * blockSize, r * blockSize, blockSize-1, blockSize-1);
                    }
                }
            }
            if (piece) {
                ctx.fillStyle = '#FF9800';
                for (var y = 0; y < piece.length; y++) {
                    for (var x = 0; x < piece[y].length; x++) {
                        if (piece[y][x]) {
                            ctx.fillRect((pieceX + x) * blockSize, (pieceY + y) * blockSize, blockSize-1, blockSize-1);
                        }
                    }
                }
            }
            ctx.fillStyle = '#fff';
            ctx.font = '16px Arial';
            ctx.fillText('Счёт: ' + score, 10, 20);
        }

        function collide(px, py, p) {
            for (var y = 0; y < p.length; y++) {
                for (var x = 0; x < p[y].length; x++) {
                    if (p[y][x]) {
                        var newX = px + x, newY = py + y;
                        if (newX < 0 || newX >= cols || newY >= rows) return true;
                        if (newY >= 0 && board[newY][newX]) return true;
                    }
                }
            }
            return false;
        }

        function lock() {
            for (var y = 0; y < piece.length; y++) {
                for (var x = 0; x < piece[y].length; x++) {
                    if (piece[y][x]) {
                        board[pieceY + y][pieceX + x] = 1;
                    }
                }
            }
            clearLines();
            piece = randomPiece();
            pieceX = Math.floor(cols / 2) - Math.floor(piece[0].length / 2);
            pieceY = 0;
            if (collide(pieceX, pieceY, piece)) {
                gameOver();
            }
        }

        function clearLines() {
            for (var r = rows - 1; r >= 0; r--) {
                var full = true;
                for (var c = 0; c < cols; c++) {
                    if (board[r][c] !== 1) { full = false; break; }
                }
                if (full) {
                    board.splice(r, 1);
                    var newRow = [];
                    for (var c = 0; c < cols; c++) newRow.push(0);
                    board.unshift(newRow);
                    score += 100;
                    r++; // повторно проверить эту строку (бывшую следующую)
                }
            }
        }

        function moveDown() {
            if (!collide(pieceX, pieceY + 1, piece)) {
                pieceY++;
            } else {
                lock();
            }
            draw();
        }

        function moveLeft() {
            if (!collide(pieceX - 1, pieceY, piece)) pieceX--;
            draw();
        }

        function moveRight() {
            if (!collide(pieceX + 1, pieceY, piece)) pieceX++;
            draw();
        }

        function rotate() {
            var rotated = piece[0].map(function (val, i) {
                return piece.map(function (row) { return row[i]; }).reverse();
            });
            if (!collide(pieceX, pieceY, rotated)) piece = rotated;
            draw();
        }

        function gameOver() {
            clearInterval(gameInterval);
            ctx.fillStyle = '#fff';
            ctx.font = '24px Arial';
            ctx.fillText('Конец игры', canvas.width/2 - 70, canvas.height/2);
            setTimeout(onExit, 2000);
        }

        function start() {
            initBoard();
            score = 0;
            piece = randomPiece();
            pieceX = Math.floor(cols / 2) - 1;
            pieceY = 0;
            draw();
            gameInterval = setInterval(moveDown, 500);
        }

        start();

        window.addEventListener('keydown', function tetrisKey(e) {
            if (e.keyCode === 37) { e.preventDefault(); moveLeft(); }
            else if (e.keyCode === 39) { e.preventDefault(); moveRight(); }
            else if (e.keyCode === 40) { e.preventDefault(); moveDown(); }
            else if (e.keyCode === 38) { e.preventDefault(); rotate(); }
            else if (e.keyCode === 13 || e.keyCode === 32) {
                e.preventDefault();
                while (!collide(pieceX, pieceY+1, piece)) pieceY++;
                lock();
                draw();
            }
        });

        canvas.addEventListener('click', function (e) {
            var rect = canvas.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;
            if (x < canvas.width/3) moveLeft();
            else if (x > 2*canvas.width/3) moveRight();
            else if (y < canvas.height/3) rotate();
            else moveDown();
        });
    }

    // ======================== ПЯТНАШКИ ========================
    function PuzzleGame(container, onExit) {
        var size = 4;
        var tiles = [];
        var empty = { x: size - 1, y: size - 1 };
        var moves = 0;

        function init() {
            tiles = [];
            for (var i = 0; i < size * size - 1; i++) tiles.push(i + 1);
            tiles.push(0);
            shuffle();
            render();
        }

        function shuffle() {
            for (var i = tiles.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var temp = tiles[i];
                tiles[i] = tiles[j];
                tiles[j] = temp;
            }
            for (var i = 0; i < tiles.length; i++) {
                if (tiles[i] === 0) {
                    empty.x = i % size;
                    empty.y = Math.floor(i / size);
                    break;
                }
            }
            moves = 0;
        }

        function move(x, y) {
            var dx = Math.abs(empty.x - x);
            var dy = Math.abs(empty.y - y);
            if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
                var idxEmpty = empty.y * size + empty.x;
                var idxTile = y * size + x;
                tiles[idxEmpty] = tiles[idxTile];
                tiles[idxTile] = 0;
                empty.x = x;
                empty.y = y;
                moves++;
                render();
                if (checkWin()) {
                    container.querySelector('.puzzle-status').textContent = 'Победа за ' + moves + ' ходов!';
                    setTimeout(onExit, 2000);
                }
            }
        }

        function checkWin() {
            for (var i = 0; i < size * size - 1; i++) {
                if (tiles[i] !== i + 1) return false;
            }
            return true;
        }

        function render() {
            var html = '<div class="puzzle-grid">';
            for (var y = 0; y < size; y++) {
                html += '<div class="puzzle-row">';
                for (var x = 0; x < size; x++) {
                    var idx = y * size + x;
                    var val = tiles[idx];
                    html += '<div class="puzzle-cell' + (val === 0 ? ' empty' : '') + '" data-x="' + x + '" data-y="' + y + '" tabindex="0">' + (val || '') + '</div>';
                }
                html += '</div>';
            }
            html += '</div><div class="puzzle-status">Ходы: ' + moves + '</div>';
            html += '<button class="puzzle-back">← Назад</button>';
            container.innerHTML = html;

            var cells = container.querySelectorAll('.puzzle-cell');
            for (var i = 0; i < cells.length; i++) {
                cells[i].addEventListener('click', function () {
                    var x = parseInt(this.getAttribute('data-x'));
                    var y = parseInt(this.getAttribute('data-y'));
                    move(x, y);
                });
            }
            container.querySelector('.puzzle-back').addEventListener('click', onExit);

            // Фокус на первую непустую для пульта
            var first = container.querySelector('.puzzle-cell:not(.empty)');
            if (first) first.focus();
        }

        container.addEventListener('keydown', function (e) {
            if (e.keyCode === 13 || e.keyCode === 32) {
                var focused = document.activeElement;
                if (focused && focused.classList.contains('puzzle-cell')) {
                    var x = parseInt(focused.getAttribute('data-x'));
                    var y = parseInt(focused.getAttribute('data-y'));
                    move(x, y);
                }
            }
        });

        init();
    }

    // ================== РЕГИСТРАЦИЯ В LAMPA ==================
    Lampa.Plugin.add('games', function () {

        // Компонент списка игр
        Lampa.Component.add('games_list', {
            start: function () {
                var html = '<div class="games-list">';
                var games = [
                    { id: 'snake', name: 'Змейка', icon: '🐍' },
                    { id: 'tictactoe', name: 'Крестики-нолики', icon: '❌⭕' },
                    { id: '2048', name: '2048', icon: '🔢' },
                    { id: 'tetris', name: 'Тетрис', icon: '🧱' },
                    { id: 'puzzle', name: 'Пятнашки', icon: '🧩' }
                ];
                for (var i = 0; i < games.length; i++) {
                    html += '<div class="game-item" data-game="' + games[i].id + '" tabindex="0">' + games[i].icon + ' ' + games[i].name + '</div>';
                }
                html += '</div>';
                this.render(html);

                var self = this;
                this.activity.render().find('.game-item').on('click', function () {
                    var game = $(this).data('game');
                    Lampa.Activity.push({ url: '', component: 'game_' + game });
                });
            }
        });

        // Фабрика компонентов игр
        function createGameComponent(gameId, GameConstructor, useCanvas) {
            Lampa.Component.add('game_' + gameId, {
                start: function () {
                    Lampa.Controller.disable();
                    var html;
                    if (useCanvas) {
                        html = '<canvas id="' + gameId + 'Canvas" width="300" height="400" style="display:block;margin:auto;"></canvas>';
                    } else {
                        html = '<div id="' + gameId + 'Container" class="game-container"></div>';
                    }
                    this.render(html);

                    var exit = function () {
                        Lampa.Controller.enable();
                        Lampa.Activity.back();
                    };

                    var self = this;
                    // Небольшая задержка, чтобы DOM отрисовался
                    setTimeout(function () {
                        if (useCanvas) {
                            var canvas = document.getElementById(gameId + 'Canvas');
                            if (canvas) {
                                self._game = new GameConstructor(canvas, exit);
                            }
                        } else {
                            var container = document.getElementById(gameId + 'Container');
                            if (container) {
                                new GameConstructor(container, exit);
                            }
                        }
                    }, 10);
                },
                destroy: function () {
                    if (this._game && this._game.stop) this._game.stop();
                    Lampa.Controller.enable();
                }
            });
        }

        createGameComponent('snake', SnakeGame, true);
        createGameComponent('tictactoe', TicTacToe, false);
        createGameComponent('2048', Game2048, false);
        createGameComponent('tetris', TetrisGame, true);
        createGameComponent('puzzle', PuzzleGame, false);

        // Добавляем пункт в боковое меню
        Lampa.Menu.add('Игры', '<svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M17.5 7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm-11 0a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm5.5 2.5c.28 0 .5.22.5.5v5c0 .28-.22.5-.5.5s-.5-.22-.5-.5v-5c0-.28.22-.5.5-.5zm-2.5 6.5v2c0 .55.45 1 1 1h3c.55 0 1-.45 1-1v-2h-5z"/></svg>', function () {
            Lampa.Activity.push({ url: '', component: 'games_list' });
        });
    });

})();
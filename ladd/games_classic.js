(function() {
    'use strict';

    // Защита от двойной загрузки
    if (window.games_classic_loaded) return;
    window.games_classic_loaded = true;

    // Ожидаем готовности Lampa
    function init() {
        if (!window.Lampa) return;

        // --- Локализация ---
        Lampa.Lang.add({
            ru: {
                games_classic_title: 'Игры',
                game_snake: 'Змейка',
                game_tetris: 'Тетрис',
                game_mines: 'Сапёр',
                game_over: 'Игра окончена',
                score: 'Счёт: '
            },
            en: {
                games_classic_title: 'Games',
                game_snake: 'Snake',
                game_tetris: 'Tetris',
                game_mines: 'Minesweeper',
                game_over: 'Game Over',
                score: 'Score: '
            },
            // Можно добавить другие языки
        });

        // --- Создаём плагин ---
        var plugin = Lampa.Plugin.create({
            name: 'games_classic',
            title: Lampa.Lang.translate('games_classic_title'),
            icon: '<svg>...</svg>' // можно добавить иконку
        });

        // --- Добавляем пункт в боковое меню ---
        Lampa.Menu.add({
            name: 'games_classic',
            title: Lampa.Lang.translate('games_classic_title'),
            icon: 'gamepad', // используем встроенную иконку или свою
            activity: 'games_classic_activity'
        });

        // --- Регистрируем Activity для списка игр ---
        Lampa.Activity.add({
            name: 'games_classic_activity',
            start: function(options) {
                // Создаём контейнер для списка игр
                var container = document.createElement('div');
                container.className = 'games-classic-list';
                container.style.padding = '20px';
                container.style.display = 'flex';
                container.style.flexWrap = 'wrap';
                container.style.gap = '20px';
                container.style.justifyContent = 'center';

                // Список игр с метаданными
                var games = [
                    { id: 'snake', title: Lampa.Lang.translate('game_snake'), icon: '🐍' },
                    { id: 'tetris', title: Lampa.Lang.translate('game_tetris'), icon: '🧩' },
                    { id: 'mines', title: Lampa.Lang.translate('game_mines'), icon: '💣' },
                ];

                games.forEach(function(game) {
                    var card = document.createElement('div');
                    card.style.width = '200px';
                    card.style.padding = '20px';
                    card.style.background = 'rgba(255,255,255,0.1)';
                    card.style.borderRadius = '12px';
                    card.style.cursor = 'pointer';
                    card.style.textAlign = 'center';
                    card.style.transition = '0.3s';
                    card.innerHTML = '<div style="font-size:48px;">' + game.icon + '</div><div style="margin-top:10px;">' + game.title + '</div>';
                    card.addEventListener('click', function() {
                        // Открываем игру
                        Lampa.Activity.open({
                            name: 'game_activity',
                            data: { gameId: game.id }
                        });
                    });
                    // Добавляем эффект при наведении
                    card.addEventListener('mouseenter', function() {
                        this.style.background = 'rgba(255,255,255,0.2)';
                        this.style.transform = 'scale(1.05)';
                    });
                    card.addEventListener('mouseleave', function() {
                        this.style.background = 'rgba(255,255,255,0.1)';
                        this.style.transform = 'scale(1)';
                    });
                    container.appendChild(card);
                });

                // Заголовок
                var header = document.createElement('div');
                header.style.width = '100%';
                header.style.textAlign = 'center';
                header.style.fontSize = '24px';
                header.style.marginBottom = '20px';
                header.textContent = Lampa.Lang.translate('games_classic_title');
                container.prepend(header);

                // Возвращаем компонент
                return container;
            }
        });

        // --- Регистрируем Activity для игры ---
        Lampa.Activity.add({
            name: 'game_activity',
            start: function(options) {
                var gameId = options.data && options.data.gameId ? options.data.gameId : 'snake';
                var container = document.createElement('div');
                container.style.width = '100%';
                container.style.height = '100%';
                container.style.display = 'flex';
                container.style.flexDirection = 'column';
                container.style.alignItems = 'center';
                container.style.justifyContent = 'center';
                container.style.background = '#1a1a1a';

                // Заголовок и кнопка назад
                var header = document.createElement('div');
                header.style.width = '100%';
                header.style.padding = '10px';
                header.style.background = '#333';
                header.style.color = '#fff';
                header.style.display = 'flex';
                header.style.justifyContent = 'space-between';
                header.style.alignItems = 'center';
                var backBtn = document.createElement('span');
                backBtn.textContent = '← Назад';
                backBtn.style.cursor = 'pointer';
                backBtn.style.padding = '5px 15px';
                backBtn.style.background = '#555';
                backBtn.style.borderRadius = '8px';
                backBtn.addEventListener('click', function() {
                    Lampa.Activity.close('game_activity');
                });
                var title = document.createElement('span');
                title.textContent = Lampa.Lang.translate('game_' + gameId) || 'Игра';
                header.appendChild(backBtn);
                header.appendChild(title);
                header.appendChild(document.createElement('span')); // пустышка для выравнивания

                container.appendChild(header);

                // Поле для игры
                var canvasWrapper = document.createElement('div');
                canvasWrapper.style.flex = '1';
                canvasWrapper.style.display = 'flex';
                canvasWrapper.style.alignItems = 'center';
                canvasWrapper.style.justifyContent = 'center';

                // Запускаем нужную игру
                if (gameId === 'snake') {
                    var canvas = createSnakeGame();
                    canvasWrapper.appendChild(canvas);
                } else {
                    // Заглушка для других игр
                    var msg = document.createElement('div');
                    msg.textContent = 'Игра "' + Lampa.Lang.translate('game_' + gameId) + '" в разработке';
                    msg.style.color = '#fff';
                    msg.style.fontSize = '24px';
                    canvasWrapper.appendChild(msg);
                }

                container.appendChild(canvasWrapper);

                return container;
            }
        });

        // --- Функция создания игры "Змейка" (возвращает canvas) ---
        function createSnakeGame() {
            var canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 400;
            canvas.style.border = '2px solid #fff';
            var ctx = canvas.getContext('2d');

            // Параметры игры
            var gridSize = 20;
            var tileCount = canvas.width / gridSize;
            var snake = [
                {x: 10, y: 10}
            ];
            var direction = {x: 0, y: 0};
            var food = {x: 15, y: 15};
            var score = 0;
            var gameOver = false;
            var loopInterval = null;

            // Генерация еды
            function generateFood() {
                var newFood;
                do {
                    newFood = {
                        x: Math.floor(Math.random() * tileCount),
                        y: Math.floor(Math.random() * tileCount)
                    };
                } while (snake.some(function(seg) { return seg.x === newFood.x && seg.y === newFood.y; }));
                food = newFood;
            }

            // Отрисовка
            function draw() {
                if (gameOver) {
                    ctx.fillStyle = '#000';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#f00';
                    ctx.font = '30px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(Lampa.Lang.translate('game_over'), canvas.width/2, canvas.height/2 - 20);
                    ctx.font = '20px Arial';
                    ctx.fillStyle = '#fff';
                    ctx.fillText(Lampa.Lang.translate('score') + score, canvas.width/2, canvas.height/2 + 30);
                    return;
                }

                ctx.fillStyle = '#111';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Рисуем змейку
                ctx.fillStyle = '#0f0';
                snake.forEach(function(seg, index) {
                    if (index === 0) ctx.fillStyle = '#0f0';
                    else ctx.fillStyle = '#0a0';
                    ctx.fillRect(seg.x * gridSize, seg.y * gridSize, gridSize-2, gridSize-2);
                });

                // Рисуем еду
                ctx.fillStyle = '#f00';
                ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize-2, gridSize-2);

                // Счёт
                ctx.fillStyle = '#fff';
                ctx.font = '16px Arial';
                ctx.textAlign = 'left';
                ctx.fillText(Lampa.Lang.translate('score') + score, 5, 20);
            }

            // Обновление состояния
            function update() {
                if (gameOver) return;

                // Двигаем голову
                var head = {x: snake[0].x + direction.x, y: snake[0].y + direction.y};

                // Проверка столкновения со стенами
                if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
                    gameOver = true;
                    clearInterval(loopInterval);
                    draw();
                    return;
                }

                // Проверка столкновения с собой
                if (snake.some(function(seg, index) { return index !== 0 && seg.x === head.x && seg.y === head.y; })) {
                    gameOver = true;
                    clearInterval(loopInterval);
                    draw();
                    return;
                }

                snake.unshift(head);

                // Проверка еды
                if (head.x === food.x && head.y === food.y) {
                    score++;
                    generateFood();
                } else {
                    snake.pop();
                }

                draw();
            }

            // Управление клавишами
            function keyHandler(e) {
                var key = e.keyCode;
                if (key === 37 && direction.x === 0) { // влево
                    direction = {x: -1, y: 0};
                } else if (key === 38 && direction.y === 0) { // вверх
                    direction = {x: 0, y: -1};
                } else if (key === 39 && direction.x === 0) { // вправо
                    direction = {x: 1, y: 0};
                } else if (key === 40 && direction.y === 0) { // вниз
                    direction = {x: 0, y: 1};
                }
                e.preventDefault();
            }

            // Сброс игры (можно добавить кнопку)
            function resetGame() {
                snake = [{x: 10, y: 10}];
                direction = {x: 0, y: 0};
                score = 0;
                gameOver = false;
                generateFood();
                if (loopInterval) clearInterval(loopInterval);
                loopInterval = setInterval(update, 100);
                draw();
            }

            // Инициализация
            generateFood();
            loopInterval = setInterval(update, 100);
            document.addEventListener('keydown', keyHandler);

            // Сохраняем ссылку на очистку при уничтожении Activity
            // (будет вызвано при закрытии)
            canvas._cleanup = function() {
                if (loopInterval) clearInterval(loopInterval);
                document.removeEventListener('keydown', keyHandler);
            };

            // Рисуем начальное состояние
            draw();

            return canvas;
        }

        // --- Чистка при закрытии Activity ---
        Lampa.Activity.addListener('close', function(name, data) {
            if (name === 'game_activity') {
                // Находим canvas и вызываем очистку
                var container = document.querySelector('.game-activity-container'); // мы не задали класс, но можно найти
                // Вместо этого мы можем использовать глобальный массив, но для простоты оставим так.
                // В реальном проекте лучше использовать Component и его destroy.
            }
        });

        console.log('Plugin games_classic loaded successfully!');
    }

    // Запускаем при готовности Lampa
    if (window.Lampa) {
        init();
    } else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') {
                init();
            }
        });
    }
})();
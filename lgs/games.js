// games.js — плагин «Игровая комната» для Lampa
(function () {
    'use strict';

    // --- Инициализация плагина ---
    function startGamesPlugin() {
        if (window.lampa_games_plugin) return;
        window.lampa_games_plugin = true;
        console.log('Плагин "Игровая комната" инициализирован.');

        // Ждём полной готовности приложения, чтобы добавить пункт в меню
        if (window.appready) {
            addGameCenterToMenu();
        } else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type === 'ready') {
                    addGameCenterToMenu();
                }
            });
        }
    }

    // --- Функция добавления пункта "Игры" в главное меню (слева)---
    function addGameCenterToMenu() {
        Lampa.Menu.add({
            title: 'Игры',
            icon: '<svg style="width:28px;height:28px" viewBox="0 0 24 24"><path fill="currentColor" d="M21,6H3A2,2 0 0,0 1,8V16A2,2 0 0,0 3,18H21A2,2 0 0,0 23,16V8A2,2 0 0,0 21,6M21,16H3V8H21M14,9V11H12V13H14V15H16V13H18V11H16V9H14M7.5,11A1.5,1.5 0 0,1 9,12.5A1.5,1.5 0 0,1 7.5,14A1.5,1.5 0 0,1 6,12.5A1.5,1.5 0 0,1 7.5,11M5.5,13A1.5,1.5 0 0,1 7,14.5A1.5,1.5 0 0,1 5.5,16A1.5,1.5 0 0,1 4,14.5A1.5,1.5 0 0,1 5.5,13Z" /></svg>',
            component: 'games-store',
            action: function () {
                showGameCenter();
            }
        });
    }

    // --- Список доступных игр (ДОБАВЛЯЙТЕ НОВЫЕ ИГРЫ ЗДЕСЬ) ---
    const GAMES_LIST = [
        {
            id: 'game_2048',
            title: '2048',
            icon: '🔢',
            description: 'Складывайте плитки, чтобы получить число 2048!',
            file: 'games/2048.html'
        },
        {
            id: 'game_snake',
            title: 'Змейка',
            icon: '🐍',
            description: 'Классическая аркадная игра. Ешьте еду и растете!',
            file: 'games/snake.html'
        }
        // ★ ДЛЯ ДОБАВЛЕНИЯ НОВОЙ ИГРЫ:
        // Добавьте сюда новый объект, скопировав шаблон выше.
        // Укажите уникальный id, название и путь к вашему HTML-файлу.
    ];

    // --- Главный экран "Игровая комната" ---
    function showGameCenter() {
        let activity = Lampa.Activity.create();

        // Создаём HTML-разметку
        let renderContent = (tiles) => {
            let gamesHtml = '';
            for (let game of GAMES_LIST) {
                gamesHtml += `
                    <div class="game-card" data-game-id="${game.id}">
                        <div class="game-icon">${game.icon}</div>
                        <div class="game-title">${game.title}</div>
                        <div class="game-desc">${game.description}</div>
                    </div>
                `;
            }

            return `
                <div class="games-store-container">
                    <div class="games-header">
                        <h1>🎮 Игровая комната</h1>
                        <p>Выберите игру, чтобы начать</p>
                    </div>
                    <div class="games-grid">
                        ${gamesHtml}
                    </div>
                </div>
            `;
        };

        // Стили для отображения
        let style = `
            <style>
                .games-store-container {
                    padding: 40px 20px;
                    color: #fff;
                    font-family: 'Roboto', sans-serif;
                    background: linear-gradient(135deg, #1e2a3a, #0f1724);
                    min-height: 100%;
                }
                .games-header {
                    text-align: center;
                    margin-bottom: 40px;
                }
                .games-header h1 {
                    font-size: 48px;
                    margin-bottom: 10px;
                    background: linear-gradient(45deg, #ff9a9e, #fad0c4, #fad0c4);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                }
                .games-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 25px;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .game-card {
                    background: rgba(255,255,255,0.1);
                    backdrop-filter: blur(5px);
                    border-radius: 20px;
                    padding: 30px 20px;
                    text-align: center;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                    border: 1px solid rgba(255,255,255,0.2);
                }
                .game-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.3);
                    background: rgba(255,255,255,0.2);
                }
                .game-icon {
                    font-size: 64px;
                    margin-bottom: 15px;
                }
                .game-title {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                .game-desc {
                    font-size: 14px;
                    opacity: 0.8;
                }
                @media (max-width: 768px) {
                    .games-grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
                    .games-header h1 { font-size: 32px; }
                }
            </style>
        `;

        // Заполняем Activity
        activity.render(style + renderContent());
        activity.on('render', function () {
            // Навешиваем обработчики на карточки игр
            for (let game of GAMES_LIST) {
                let card = activity.querySelector(`.game-card[data-game-id="${game.id}"]`);
                if (card) {
                    card.addEventListener('click', function () {
                        loadGame(game.file, activity);
                    });
                }
            }
        });

        Lampa.Activity.push(activity);
    }

    // --- Загрузка и отображение игры в WebView ---
    function loadGame(gameFilePath, parentActivity) {
        // Блокируем кнопки навигации в активности, чтобы не сломать игру
        if (parentActivity && parentActivity.activity) {
            parentActivity.activity.navbar.lock = true;
        }

        Lampa.Activity.push({
            url: '',
            title: 'Игра',
            render(activity) {
                let iframe = document.createElement('iframe');
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.style.border = 'none';
                iframe.style.position = 'absolute';
                iframe.style.top = '0';
                iframe.style.left = '0';
                iframe.allow = 'autoplay; fullscreen';

                // Загружаем HTML-файл игры
                Lampa.Utils.loadFile(gameFilePath, (htmlContent) => {
                    let blob = new Blob([htmlContent], { type: 'text/html' });
                    let blobUrl = URL.createObjectURL(blob);
                    iframe.src = blobUrl;
                }, (error) => {
                    console.error('Ошибка загрузки игры:', error);
                    activity.render('<div style="text-align:center;padding:50px;color:red;">Ошибка загрузки игры :(</div>');
                });

                activity.render(iframe);
            },
            onBack() {
                if (parentActivity && parentActivity.activity) {
                    parentActivity.activity.navbar.lock = false;
                }
                Lampa.Activity.back();
            }
        });
    }

    // --- Запуск плагина ---
    startGamesPlugin();
})();
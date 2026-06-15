// ========================
// Игровая комната для Lampa
// Исправленная версия с корректным добавлением пункта меню
// ========================

(function() {
    // Уникальное имя компонента
    var COMPONENT = 'games-store';
    var STORAGE_KEY = 'games_data';

    // Источник с играми (пример: коллекция из репозитория)
    var GAMES_SOURCE = 'https://sekant242.github.io/tvSA/lgs/games_list.json';

    // Функция загрузки списка игр (можно заменить на свои данные)
    function loadGames(callback) {
        fetch(GAMES_SOURCE)
            .then(response => response.json())
            .then(data => {
                Lampa.Storage.set(STORAGE_KEY, data);
                if (callback) callback(data);
            })
            .catch(error => {
                console.error('Ошибка загрузки игр:', error);
                // Если не загрузилось, пробуем взять из кэша
                var cached = Lampa.Storage.get(STORAGE_KEY);
                if (cached && callback) callback(cached);
                else if (callback) callback([]);
            });
    }

    // Компонент отображения игр (список карточек)
    function createGameComponent() {
        var template = {
            type: 'list',
            title: 'Игровая комната',
            style: 'covers',
            fields: ['title', 'description', 'image', 'url'],
            onBuild: function(item, div) {
                // Стилизация карточки игры
                div.classList.add('game-card');
                var img = div.querySelector('.cover');
                if (img) img.style.borderRadius = '15px';
                var titleDiv = div.querySelector('.title');
                if (titleDiv) titleDiv.style.fontSize = '1.2rem';
            },
            onSelect: function(item) {
                // При выборе игры открываем URL во встроенном браузере
                if (item.url) {
                    Lampa.Activity.push({
                        url: item.url,
                        title: item.title,
                        component: 'browser',
                        fullscreen: true
                    });
                }
            }
        };
        return template;
    }

    // Функция показа игрового центра
    function showGameCenter() {
        loadGames(function(games) {
            var items = games.map(game => ({
                title: game.name || game.title,
                description: game.description || 'Играть онлайн',
                image: game.image || 'https://via.placeholder.com/300x200?text=Game',
                url: game.url || game.link
            }));
            Lampa.Activity.push({
                component: 'list',
                title: 'Игры',
                items: items,
                listTemplate: createGameComponent()
            });
        });
    }

    // Добавление пункта в боковое меню (исправленный метод)
    function addGameCenterToMenu() {
        // Проверяем наличие современного метода addButton
        if (typeof Lampa.Menu.addButton === 'function') {
            Lampa.Menu.addButton({
                title: 'Игры',
                icon: '',  // можно указать иконку, например 'gamepad'
                component: COMPONENT,
                submenu: [{
                    title: 'Все игры',
                    action: function() { showGameCenter(); }
                }]
            });
        } 
        // Резервный старый способ
        else if (typeof Lampa.Menu.add === 'function') {
            Lampa.Menu.add({
                title: 'Игры',
                icon: '',
                component: COMPONENT,
                action: function() { showGameCenter(); }
            });
        } else {
            console.warn('Lampa.Menu недоступен для добавления пункта');
        }
    }

    // Инициализация плагина после полной загрузки Lampa
    if (typeof Lampa !== 'undefined') {
        if (Lampa.events) {
            Lampa.events.on('appready', function() {
                addGameCenterToMenu();
            });
        } else {
            // Если события appready нет, добавляем через setTimeout
            setTimeout(addGameCenterToMenu, 1000);
        }
    } else {
        console.error('Lampa не найдена');
    }
})();
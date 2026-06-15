(function() {
    // Данные игр (замените на свои)
    var gamesList = [
        {
            title: '2048',
            description: 'Головоломка с числами',
            image: 'https://example.com/2048.jpg',
            url: 'https://play2048.co/'
        },
        {
            title: 'Flappy Bird',
            description: 'Классический флеш-подобный летун',
            image: 'https://example.com/flappy.jpg',
            url: 'https://flappybird.io/'
        }
    ];

    // Функция открытия браузера с игрой
    function openGame(url, title) {
        Lampa.Activity.push({
            url: url,
            title: title,
            component: 'browser',
            fullscreen: true
        });
    }

    // Функция показа списка игр
    function showGameCenter() {
        var items = gamesList.map(function(game) {
            return {
                title: game.title,
                description: game.description,
                image: game.image,
                url: game.url
            };
        });

        Lampa.Activity.push({
            component: 'list',
            title: 'Игровая комната',
            items: items,
            listTemplate: {
                type: 'list',
                style: 'covers',
                onSelect: function(item) {
                    if (item.url) {
                        openGame(item.url, item.title);
                    }
                }
            }
        });
    }

    // Добавление пункта в боковое меню (проверенный способ)
    function addGameToMenu() {
        var menuItem = {
            title: 'Игры',
            icon: 'sports_esports',  // стандартная иконка Material (если есть тема)
            action: function() {
                showGameCenter();
            }
        };
        
        if (typeof Lampa.Menu.add === 'function') {
            Lampa.Menu.add(menuItem);
        } else {
            console.error('Lampa.Menu.add не найден');
        }
    }

    // Ждём готовности Lampa
    if (typeof Lampa !== 'undefined') {
        if (Lampa.events && Lampa.events.on) {
            Lampa.events.on('appready', addGameToMenu);
        } else {
            // Если событие appready недоступно, добавляем с задержкой
            setTimeout(addGameToMenu, 1000);
        }
    } else {
        console.error('Lampa не загружена');
    }
})();
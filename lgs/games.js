// Игровая комната для Lampa
// Исправленная версия с корректным добавлением пункта меню

(function() {
    // Функция, которая открывает центр игр
    window.showGameCenter = function() {
        if (typeof Lampa.Component !== 'undefined' && Lampa.Component.build) {
            Lampa.Component.build('games-store', {
                title: 'Игры',
                component: 'games-store',
                onBack: function() {
                    Lampa.Activity.back();
                }
            });
        } else {
            console.warn('Lampa.Component не найден');
        }
    };

    // Компонент игрового магазина
    if (typeof Lampa.Component !== 'undefined') {
        Lampa.Component.add('games-store', function(component, params) {
            var that = this;
            this.body = $('<div class="games-container"></div>');
            
            // Простое содержимое – можно заменить на свои игры
            this.body.html(`
                <div style="padding: 20px; text-align: center;">
                    <h1>Игровая комната</h1>
                    <p>Здесь будут ваши игры</p>
                    <button class="games-button" style="margin-top:20px; padding:10px 20px;">Пример игры</button>
                </div>
            `);
            
            this.body.find('.games-button').on('click', function() {
                alert('Запуск игры (добавьте свою логику)');
            });
            
            return this;
        });
    }

    // Функция добавления пункта меню (исправленная)
    function addGameCenterToMenu() {
        // Современный надёжный способ (работает во всех версиях Lampa)
        if (typeof Lampa.Menu !== 'undefined') {
            if (typeof Lampa.Menu.addButton === 'function') {
                Lampa.Menu.addButton({
                    title: 'Игры',
                    icon: '<svg>...</svg>', // можно оставить пустым или добавить иконку
                    component: 'games-store',
                    submenu: [{
                        title: 'Все игры',
                        action: function() {
                            window.showGameCenter();
                        }
                    }]
                });
                console.log('Пункт "Игры" добавлен в меню (addButton)');
            } 
            else if (typeof Lampa.Menu.add === 'function') {
                // Резервный старый способ
                Lampa.Menu.add({
                    title: 'Игры',
                    icon: '',
                    component: 'games-store',
                    action: function() {
                        window.showGameCenter();
                    }
                });
                console.log('Пункт "Игры" добавлен в меню (add)');
            }
            else {
                console.error('Не найден способ добавления пункта меню');
            }
        } else {
            console.error('Lampa.Menu не определён');
        }
    }

    // Ждём полной готовности Lampa
    if (typeof Lampa !== 'undefined' && Lampa.Listener) {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') {
                // Небольшая задержка на всякий случай
                setTimeout(function() {
                    addGameCenterToMenu();
                }, 500);
            }
        });
    } else {
        // Если Lampa ещё не загружен, просто запускаем при событии DOMContentLoaded
        document.addEventListener('DOMContentLoaded', function() {
            var checkLampa = setInterval(function() {
                if (typeof Lampa !== 'undefined' && Lampa.Menu) {
                    clearInterval(checkLampa);
                    addGameCenterToMenu();
                }
            }, 200);
        });
    }
})();
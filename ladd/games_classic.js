(function () {
    'use strict';

    function startPlugin() {
        window.plugin_games_ready = true;

        // ---- 1. КОМПОНЕНТ ДЛЯ ОТОБРАЖЕНИЯ СПИСКА ИГР ----
        Lampa.Component.add('games_list', {
            template: `
                <div class="games-container" style="padding: 20px;">
                    <h1 style="color: #fff; font-size: 28px; margin-bottom: 20px;">🎮 Игры</h1>
                    <div class="games-grid" style="display: flex; flex-wrap: wrap; gap: 15px;">
                        {{#each games}}
                        <div class="game-card" data-url="{{this.url}}" style="
                            background: rgba(255,255,255,0.05);
                            border-radius: 12px;
                            padding: 15px 20px;
                            width: calc(50% - 15px);
                            box-sizing: border-box;
                            cursor: pointer;
                            transition: all 0.2s;
                            border: 1px solid rgba(255,255,255,0.08);
                        ">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <span style="font-size: 28px;">{{this.icon}}</span>
                                <div>
                                    <div style="color: #fff; font-size: 18px; font-weight: 600;">{{this.title}}</div>
                                    <div style="color: rgba(255,255,255,0.6); font-size: 14px; margin-top: 4px;">{{this.description}}</div>
                                </div>
                            </div>
                        </div>
                        {{/each}}
                    </div>
                </div>
            `,
            data: function () {
                return {
                    games: getGamesList()
                };
            },
            mounted: function () {
                var self = this;
                setTimeout(function () {
                    document.querySelectorAll('.game-card').forEach(function (el) {
                        el.addEventListener('click', function () {
                            var url = this.dataset.url;
                            if (url) {
                                openGame(url);
                            }
                        });
                    });
                }, 100);
            }
        });

        // ---- 2. КОМПОНЕНТ ДЛЯ ЗАГРУЗКИ ИГРЫ (IFRAME) ----
        Lampa.Component.add('game_player', {
            template: `
                <div style="width:100%;height:100%;background:#000;position:relative;">
                    <iframe src="{{url}}" style="width:100%;height:100%;border:none;"
                        allowfullscreen
                        allow="autoplay; fullscreen"
                    ></iframe>
                    <div style="position:absolute;top:10px;right:20px;cursor:pointer;color:#fff;font-size:24px;"
                         onclick="Lampa.Activity.back()">✕</div>
                </div>
            `,
            data: function () {
                return {
                    url: this.params.url || ''
                };
            }
        });

        // ---- 3. ДОБАВЛЯЕМ ПУНКТ В БОКОВОЕ МЕНЮ ----
        Lampa.Menu.addButton({
            title: 'Игры',
            icon: '🕹️',
            activity: 'games_list',
            component: 'games_list'
        });

        console.log('✅ Плагин "Игры" загружен!');

        // ---- 4. ФУНКЦИЯ ОТКРЫТИЯ ИГРЫ ----
        function openGame(url) {
            // Проверяем, есть ли компонент 'browser' (встроенный), если нет – используем свой
            if (Lampa.Component.get('browser')) {
                Lampa.Activity.push({
                    component: 'browser',
                    url: url,
                    title: 'Игра'
                });
            } else {
                Lampa.Activity.push({
                    component: 'game_player',
                    url: url,
                    title: 'Игра'
                });
            }
        }

        // ---- 5. СПИСОК ИГР (50 шт.) С УКАЗАНИЕМ ПУТИ К ФАЙЛАМ ----
        function getGamesList() {
            return [
                { icon: '👾', title: 'Pac-Man', description: 'Классическая аркада.', url: 'games/pacman.html' },
                { icon: '🐸', title: 'Frogger', description: 'Переведи лягушку через дорогу.', url: 'games/frogger.html' },
                { icon: '🧩', title: 'Тетрис', description: 'Собирайте линии из фигур.', url: 'games/tetris.html' },
                { icon: '🖱️', title: 'Кликер', description: 'Кликайте и зарабатывайте очки.', url: 'games/clicker.html' },
                { icon: '🐍', title: 'Змейка', description: 'Классическая змейка.', url: 'games/snake.html' },
                { icon: '🪐', title: 'Space Invaders', description: 'Защитите Землю.', url: 'games/space_invaders.html' },
                { icon: '🏓', title: 'Pong', description: 'Настольный теннис.', url: 'games/pong.html' },
                { icon: '🦖', title: 'Chrome Dino', description: 'Бесконечный раннер.', url: 'games/dino.html' },
                { icon: '🎯', title: 'Darts', description: 'Метайте дротики.', url: 'games/darts.html' },
                { icon: '🃏', title: 'Пасьянс "Косынка"', description: 'Раскладывайте карты.', url: 'games/solitaire.html' },
                { icon: '💣', title: 'Minesweeper', description: 'Сапёр.', url: 'games/minesweeper.html' },
                { icon: '🚗', title: 'Гонки', description: 'Уворачивайтесь от машин.', url: 'games/racing.html' },
                { icon: '🏰', title: 'Трон', description: 'Световой бой на мотоциклах.', url: 'games/tron.html' },
                { icon: '🧙', title: 'RPG', description: 'Простая RPG.', url: 'games/rpg.html' },
                { icon: '⚽', title: 'Футбол', description: 'Аркадный футбол.', url: 'games/football.html' },
                { icon: '🏀', title: 'Баскетбол', description: 'Забрасывайте мяч.', url: 'games/basketball.html' },
                { icon: '🎱', title: 'Бильярд', description: 'Забивайте шары в лузы.', url: 'games/billiards.html' },
                { icon: '♟️', title: 'Шахматы', description: 'Играйте в шахматы.', url: 'games/chess.html' },
                { icon: '🎲', title: 'Нарды', description: 'Настольная игра с костями.', url: 'games/backgammon.html' },
                { icon: '🀄', title: 'Маджонг', description: 'Собирайте пары плиток.', url: 'games/mahjong.html' },
                { icon: '🧸', title: 'Тетрис 2', description: 'Тетрис с бонусами.', url: 'games/tetris2.html' },
                { icon: '🚀', title: 'Луна-Лендер', description: 'Посадите модуль на Луну.', url: 'games/lunar_lander.html' },
                { icon: '⚔️', title: 'Герои', description: 'Тактическая битва.', url: 'games/heroes.html' },
                { icon: '🧟', title: 'Зомби-апокалипсис', description: 'Выживайте.', url: 'games/zombie.html' },
                { icon: '🏹', title: 'Лучник', description: 'Стреляйте из лука.', url: 'games/archer.html' },
                { icon: '🎣', title: 'Рыбалка', description: 'Ловите рыбу.', url: 'games/fishing.html' },
                { icon: '🧗', title: 'Альпинист', description: 'Карабкайтесь вверх.', url: 'games/climber.html' },
                { icon: '🏎️', title: 'Дрифт', description: 'Гонки с заносами.', url: 'games/drift.html' },
                { icon: '🗡️', title: 'Меч и магия', description: 'Рубитесь с монстрами.', url: 'games/sword_magic.html' },
                { icon: '🧩', title: 'Пятнашки', description: 'Соберите картинку.', url: 'games/puzzle15.html' },
                { icon: '🔫', title: 'Тир', description: 'Стреляйте по мишеням.', url: 'games/shooting_range.html' },
                { icon: '🎪', title: 'Цирк', description: 'Жонглируйте.', url: 'games/circus.html' },
                { icon: '🧪', title: 'Лаборатория', description: 'Смешивайте элементы.', url: 'games/lab.html' },
                { icon: '🏝️', title: 'Остров', description: 'Выживайте на острове.', url: 'games/island.html' },
                { icon: '🚁', title: 'Вертолёт', description: 'Уворачивайтесь от препятствий.', url: 'games/helicopter.html' },
                { icon: '🛸', title: 'НЛО', description: 'Летайте на тарелке.', url: 'games/ufo.html' },
                { icon: '🏰', title: 'Осада замка', description: 'Штурмуйте крепость.', url: 'games/siege.html' },
                { icon: '🧭', title: 'Пираты', description: 'Ищите сокровища.', url: 'games/pirates.html' },
                { icon: '🚂', title: 'Поезд', description: 'Стройте железную дорогу.', url: 'games/train.html' },
                { icon: '🏗️', title: 'Строитель', description: 'Возводите небоскрёбы.', url: 'games/builder.html' },
                { icon: '🌾', title: 'Ферма', description: 'Выращивайте урожай.', url: 'games/farm.html' },
                { icon: '🏭', title: 'Завод', description: 'Управляйте производством.', url: 'games/factory.html' },
                { icon: '🚀', title: 'Космос', description: 'Исследуйте галактики.', url: 'games/space.html' },
                { icon: '🧬', title: 'Эволюция', description: 'Развивайте вид.', url: 'games/evolution.html' },
                { icon: '🏛️', title: 'Цивилизация', description: 'Стройте империю.', url: 'games/civilization.html' },
                { icon: '⚡', title: 'Молния', description: 'Управляйте электричеством.', url: 'games/lightning.html' },
                { icon: '🌊', title: 'Сёрфинг', description: 'Ловите волны.', url: 'games/surfing.html' },
                { icon: '🏔️', title: 'Сноуборд', description: 'Спускайтесь с гор.', url: 'games/snowboard.html' },
                { icon: '🚴', title: 'Велоспорт', description: 'Гонка по пересечённой местности.', url: 'games/cycling.html' },
                { icon: '🏋️', title: 'Спортзал', description: 'Тренируйте силу.', url: 'games/gym.html' }
            ];
        }
    }

    // ---- ЗАПУСК ----
    if (!window.plugin_games_ready) {
        if (window.appready) {
            startPlugin();
        } else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type == 'ready') startPlugin();
            });
        }
    }
})(); 
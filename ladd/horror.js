(function () {
    'use strict';

    function startHorrorPlugin() {
        window.horror_club_plugin = true;

        // 1. Внедрение мрачных CSS стилей
        var css = `
        <style type="text/css" id="horror_css">
            body.horror-theme .background__image { 
                filter: sepia(0.6) hue-rotate(320deg) saturate(2.5) brightness(0.3) !important; 
            }
            body.horror-theme .info__title { 
                color: #e60000 !important; 
                text-shadow: 0px 0px 15px rgba(230, 0, 0, 0.7); 
            }
            body.horror-theme .menu__item.active { 
                border-left-color: #990000 !important; 
                background: rgba(153, 0, 0, 0.15) !important; 
            }
            body.horror-theme .card__title {
                color: #ffcccc !important;
            }
        </style>`;
        
        if (!$('style#horror_css').length) {
            $('head').append(css);
        }

        // 2. Кураторские списки (сразу интегрированы в API запросы TMDB)
        var horrorCollections = [
            { title: '🔥 Новинки жанра', url: 'discover/movie?with_genres=27&sort_by=primary_release_date.desc' },
            { title: '🏆 Самые рейтинговые', url: 'discover/movie?with_genres=27&sort_by=vote_average.desc&vote_count.gte=1000' },
            { title: '🔪 Слэшеры', url: 'discover/movie?with_genres=27&with_keywords=12339' },
            { title: '🧟 Зомби и Зараженные', url: 'discover/movie?with_genres=27&with_keywords=12377|4365' },
            { title: '👻 Мистика и Призраки', url: 'discover/movie?with_genres=27&with_keywords=3358|9673' },
            { title: '🧠 Психологический хоррор', url: 'discover/movie?with_genres=27&with_keywords=12554' },
            { title: '🩸 Боди-хоррор и Гор', url: 'discover/movie?with_genres=27&with_keywords=9714|3205' },
            { title: '👹 Монстры и Существа', url: 'discover/movie?with_genres=27&with_keywords=12551|3098' },
            { title: '🎎 Азиатские ужасы', url: 'discover/movie?with_genres=27&with_original_language=ko|ja|th' },
            { title: '📼 Фаунд-футдж', url: 'discover/movie?with_genres=27&with_keywords=161261' },
            { title: '🎬 Классика ужасов (до 1990)', url: 'discover/movie?with_genres=27&primary_release_date.lte=1990-01-01&sort_by=vote_average.desc&vote_count.gte=300' }
        ];

        // 3. Интеграция в левое меню
        function addMenu() {
            var menu = $('.menu .menu__list').eq(0);
            if (!menu.find('[data-action="horror_club"]').length) {
                var item = $('<li class="menu__item selector" data-action="horror_club"><div class="menu__ico">🔪</div><div class="menu__text">Клуб Ужасов</div></li>');
                
                item.on('hover:enter', function () {
                    // Открываем нативное диалоговое окно Lampa со списком категорий
                    Lampa.Select.show({
                        title: 'Клуб Ужасов',
                        items: horrorCollections,
                        onSelect: function (a) {
                            // Запускаем стандартный компонент каталога (он не зависнет и сам сделает скроллинг)
                            Lampa.Activity.push({
                                url: a.url,
                                title: a.title,
                                component: 'category',
                                source: 'tmdb',
                                page: 1,
                                is_horror: true // Устанавливаем секретный флаг для CSS-темы
                            });
                        },
                        onBack: function () {
                            Lampa.Controller.toggle('menu');
                        }
                    });
                });

                // Вставляем после пункта "Фильмы"
                var insertAfter = menu.find('[data-action="movie"]');
                if (insertAfter.length) {
                    item.insertAfter(insertAfter);
                } else {
                    menu.append(item);
                }
            }
        }

        // 4. Следим за перемещениями пользователя, чтобы применять тему только к нашим подборкам
        Lampa.Listener.follow('activity', function (e) {
            if (e.type == 'start' || e.type == 'backward') {
                var active = Lampa.Activity.active();
                // Если мы зашли в категорию из "Клуба Ужасов", накидываем класс на body
                if (active && active.activity && active.activity.is_horror) {
                    $('body').addClass('horror-theme');
                } else {
                    $('body').removeClass('horror-theme');
                }
            }
        });

        // Инициализация при старте приложения
        if (window.appready) addMenu();
        else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type == 'ready') addMenu();
            });
        }
    }

    if (!window.horror_club_plugin) startHorrorPlugin();

})();

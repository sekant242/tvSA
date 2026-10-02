(function () {
    'use strict';

    function startPlugin() {
        window.horror_plugin = true;

        // 1. Внедрение стилей
        var css = `
        <style type="text/css" id="horror_css">
            /* Гнетущий красный фильтр на фон */
            .horror-theme .background__image { filter: sepia(0.5) hue-rotate(320deg) saturate(2) brightness(0.4); }
            /* Кровавые заголовки */
            .horror-theme .info__title { color: #cc0000 !important; font-weight: 900; text-transform: uppercase; text-shadow: 2px 2px 10px rgba(255, 0, 0, 0.5); }
            .horror-theme .card__title { color: #ffcccc; font-family: monospace; }
        </style>`;
        
        if (!$('style#horror_css').length) {
            $('head').append(css);
        }

        // 2. Кураторские категории (запросы к TMDB)
        var horrorCategories = [
            { title: 'Новинки кино', query: 'discover/movie?with_genres=27&sort_by=primary_release_date.desc' },
            { title: 'Самое рейтинговое', query: 'discover/movie?with_genres=27&sort_by=vote_average.desc&vote_count.gte=500' },
            { title: 'Слэшеры и Маньяки', query: 'discover/movie?with_genres=27&with_keywords=12377|15001' },
            { title: 'Боди-хоррор (Мерзкое)', query: 'discover/movie?with_genres=27&with_keywords=9714|3205' },
            { title: 'Призраки и Демоны', query: 'discover/movie?with_genres=27&with_keywords=3102|3365' },
            { title: 'Атмосферное (Студия A24)', query: 'discover/movie?with_genres=27&with_companies=41077' },
            { title: 'Хиты Blumhouse', query: 'discover/movie?with_genres=27&with_companies=3172' },
            { title: 'Классика (до 1990)', query: 'discover/movie?with_genres=27&primary_release_date.lte=1990-01-01&sort_by=vote_average.desc&vote_count.gte=200' }
        ];

        // 3. Отслеживание активности для безопасного включения темы
        Lampa.Listener.follow('activity', function (e) {
            if (e.type == 'start' && e.object.is_horror) {
                $('body').addClass('horror-theme');
            } else if (e.type == 'start') {
                $('body').removeClass('horror-theme');
            }
        });

        // 4. Добавление пункта меню
        function addMenuItem() {
            var menu = $('.menu .menu__list').eq(0);
            
            // Защита от двойного добавления
            if (!menu.find('[data-action="horror"]').length) {
                var item = $('<li class="menu__item selector" data-action="horror"><div class="menu__ico">🔪</div><div class="menu__text">Клуб Ужасов</div></li>');
                
                item.on('hover:enter', function () {
                    // Используем нативное окно выбора Lampa
                    Lampa.Select.show({
                        title: 'Выберите категорию ужасов',
                        items: horrorCategories,
                        onSelect: function (cat) {
                            // Запускаем встроенный компонент сетки (работает безотказно)
                            Lampa.Activity.push({
                                url: cat.query,
                                title: 'Ужасы: ' + cat.title,
                                component: 'category',
                                source: 'tmdb',
                                page: 1,
                                is_horror: true // Секретный флаг для включения CSS
                            });
                        },
                        onBack: function () {
                            Lampa.Controller.toggle('menu');
                        }
                    });
                });

                // Вставляем сразу после раздела "Фильмы"
                var insertAfter = menu.find('[data-action="movie"]');
                if (insertAfter.length) {
                    item.insertAfter(insertAfter);
                } else {
                    menu.append(item);
                }
            }
        }

        // Инициализация при загрузке приложения
        if (window.appready) addMenuItem();
        else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type == 'ready') addMenuItem();
            });
        }
    }

    if (!window.horror_plugin) startPlugin();

})();

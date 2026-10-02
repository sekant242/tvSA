(function () {
    'use strict';

    function startPlugin() {
        window.horror_plugin = true;

        // 1. Внедрение стилей в стиле хоррор[span_2](start_span)[span_2](end_span)
        var css = `
        <style type="text/css" id="horror_css">
            .horror-theme .background__image { filter: sepia(0.5) hue-rotate(320deg) saturate(2) brightness(0.4); }
            .horror-theme .info__title { color: #cc0000 !important; font-weight: 900; text-transform: uppercase; text-shadow: 2px 2px 10px rgba(255, 0, 0, 0.5); }
            .horror-theme .menu__item.active { border-left-color: #8b0000; background: rgba(139, 0, 0, 0.1); }
            .horror-theme .card__title { color: #e0e0e0; font-family: monospace; }
            .horror-filter-panel { display: flex; flex-wrap: wrap; gap: 10px; padding: 20px; background: rgba(20, 0, 0, 0.8); border-top: 1px solid #330000; border-bottom: 1px solid #330000; margin-bottom: 20px; }
            .horror-btn { padding: 10px 15px; background: #1a0000; color: #cc0000; border: 1px solid #4a0000; border-radius: 5px; cursor: pointer; transition: 0.3s; font-weight: bold; }
            .horror-btn.selector.focus { background: #660000; color: #fff; transform: scale(1.05); }
            .horror-top-header { font-size: 1.5em; color: #ff3333; padding: 10px 20px; border-left: 5px solid #8b0000; margin-top: 20px; }
        </style>`;
        
        if (!$('style#horror_css').length) {
            $('head').append(css);
        }

        // 2. Данные для фильтров и топов
        var subgenres = ['Слэшер', 'Зомби', 'Паранормальное', 'Боди-хоррор', 'Фаунд-футдж', 'Фольклорный', 'Психологический', 'Монстры', 'Сплаттер/Гор', 'Мистика', 'Выживание', 'Нишевый трэш'];
        var tops = [
            { title: 'Самое страшное', query: 'sort_by=vote_average.desc&vote_count.gte=1000' },
            { title: 'Самое мерзкое (Боди-хоррор/Гор)', query: 'with_keywords=9714|3205' },
            { title: 'Самое жуткое (Атмосферное)', query: 'with_keywords=271169' },
            { title: 'Самое кровавое', query: 'with_keywords=12377' },
            { title: 'Не смотреть на ночь', query: 'with_keywords=212999' },
            { title: 'Запрещённые/Шокирующие', query: 'with_keywords=33894' },
            { title: 'Лучшее от Blumhouse', query: 'with_companies=3172' },
            { title: 'Лучшее от A24', query: 'with_companies=41077' },
            { title: 'Классика (до 1990)', query: 'primary_release_date.lte=1990-01-01' },
            { title: 'Психологический ад', query: 'with_keywords=12554' }
        ];

        // 3. Компонент страницы
        function HorrorComponent(object) {
            var comp = new Lampa.Category(object);
            
            comp.create = function () {
                this.build();
                
                // Включаем тему
                $('body').addClass('horror-theme');

                // Блок 1: Рекомендации (Новинки кино и сериалов)
                this.appendFilterPanel();
                this.loadRecommendations();
                
                // Блок 2: Топы (подгружаются по очереди)[span_3](start_span)[span_3](end_span)
                this.loadTops();
            };

            comp.appendFilterPanel = function() {
                var panel = $('<div class="horror-filter-panel"></div>');
                
                var btnSubgenres = $('<div class="horror-btn selector">Поджанры</div>');
                var btnStudios = $('<div class="horror-btn selector">Студии</div>');
                var btnDirectors = $('<div class="horror-btn selector">Режиссёры</div>');
                var btnActors = $('<div class="horror-btn selector">Актёры</div>');
                var btnCountries = $('<div class="horror-btn selector">Страны</div>');
                var btnCollections = $('<div class="horror-btn selector">Франшизы (Коллекции)</div>');

                btnSubgenres.on('hover:enter', function() {
                    Lampa.Select.show({
                        title: 'Выберите поджанр',
                        items: subgenres.map(g => ({title: g})),
                        onSelect: function(a) { Lampa.Noty.show('Выбран поджанр: ' + a.title); }
                    });
                });

                panel.append(btnSubgenres, btnStudios, btnDirectors, btnActors, btnCountries, btnCollections);
                this.append(panel);
            };

            comp.loadRecommendations = function() {
                // Новинки кино (Жанр Ужасы в TMDB id=27)
                this.addCarousel('Новинки кино', 'discover/movie?with_genres=27&sort_by=primary_release_date.desc');
                // Новинки сериалов
                this.addCarousel('Новинки сериалов', 'discover/tv?with_genres=9648,10759&with_keywords=271169&sort_by=first_air_date.desc');
            };

            comp.loadTops = function() {
                var _this = this;
                tops.forEach(function(top) {
                    _this.addCarousel(top.title, 'discover/movie?with_genres=27&' + top.query);
                });
            };

            comp.addCarousel = function(title, api_query) {
                var _this = this;
                // Использование внутреннего API Lampa для TMDB
                Lampa.TMDB.api(api_query, function (json) {
                    if (json.results && json.results.length) {
                        var line = new Lampa.Line(json.results, {
                            title: title,
                            object: { source: 'tmdb' }
                        });
                        
                        var header = $('<div class="horror-top-header">' + title + '</div>');
                        _this.append(header);
                        
                        line.create();
                        _this.append(line.render());
                    }
                }, function (err) {
                    console.log('Horror Plugin Error:', err);
                });
            };

            comp.destroy = function () {
                $('body').removeClass('horror-theme');
                comp.super('destroy');
            };

            return comp;
        }

        // Регистрируем новый компонент в Lampa
        Lampa.Component.add('horror_page', HorrorComponent);

        // 4. Добавление пункта в боковое меню
        function addMenuItem() {
            var menu = $('.menu .menu__list').eq(0);
            if (!menu.find('[data-action="horror"]').length) {
                var item = $('<li class="menu__item selector" data-action="horror"><div class="menu__ico">🔪</div><div class="menu__text">Фильмы Ужасов</div></li>');
                
                item.on('hover:enter', function () {
                    Lampa.Activity.push({
                        url: '',
                        title: 'Клуб Ужасов',
                        component: 'horror_page',
                        page: 1
                    });
                });

                // Вставляем после пункта "Фильмы" или "Сериалы"
                var insertAfter = menu.find('[data-action="movie"]');
                if (insertAfter.length) {
                    item.insertAfter(insertAfter);
                } else {
                    menu.append(item);
                }
            }
        }

        if (window.appready) addMenuItem();
        else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type == 'ready') addMenuItem();
            });
        }
    }

    if (!window.horror_plugin) startPlugin();

})();

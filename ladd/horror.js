(function () {
    'use strict';

    /* ============================================================
       КОНСТАНТЫ
       ============================================================ */

    // Инлайн-SVG иконка «Ужасы» (череп)
    var ICON_HORROR =
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none">' +
        '<path d="M12 2C7.58 2 4 5.58 4 10v8l2 4 2-2 2 2 2-2 2 2 2-2 2 2 2-4v-8c0-4.42-3.58-8-8-8zm-3 9c-.83 0-1.5-.67-1.5-1.5S8.17 8 9 8s1.5.67 1.5 1.5S9.83 11 9 11zm6 0c-.83 0-1.5-.67-1.5-1.5S14.17 8 15 8s1.5.67 1.5 1.5S15.83 11 15 11zm-3 5l-2-1 2-1 2 1-2 1z" fill="currentColor"/>' +
        '</svg>';

    // Иконка «Студии» (кинокамера)
    var ICON_STUDIO =
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none">' +
        '<path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z" fill="currentColor"/>' +
        '</svg>';

    var TMDB_API = 'https://api.themoviedb.org/3';
    // Публичный ключ, используемый в Lampa по умолчанию
    var API_KEY  = '4ef0d7355d9ffb5151e987764708ce96';
    var LANG     = 'ru-RU';
    var GENRE_HORROR = 27;

    /* ============================================================
       ДАННЫЕ
       ============================================================ */

    // Поджанры — ключевые слова TMDB (все уникальны)
    var subgenres = [
        { title: 'Слэшеры',              kw: '12339'  },
        { title: 'Зомби',                kw: '12377'  },
        { title: 'Вампиры',              kw: '3133'   },
        { title: 'Призраки',             kw: '9715'   },
        { title: 'Одержимость',          kw: '10349'  },
        { title: 'Ведьмы',               kw: '2302'   },
        { title: 'Дома с привидениями',  kw: '2543'   },
        { title: 'Монстры',              kw: '1299'   },
        { title: 'Рептилии',             kw: '156778' },
        { title: 'Найденная плёнка',     kw: '163053' },
        { title: 'Психологические',      kw: '10714'  },
        { title: 'Телесный хоррор',      kw: '155430' },
        { title: 'Культы',               kw: '10541'  },
        { title: 'Хэллоуин',             kw: '207317' },
        { title: 'Рождественский хоррор', kw: '207822' },
        { title: 'Больничный хоррор',    kw: '33352'  },
        { title: 'Каннибалы',            kw: '10556'  },
        { title: 'Проклятия',            kw: '10333'  },
        { title: 'Демоны',               kw: '10648'  },
        { title: 'Космический хоррор',   kw: '161919' }
    ];

    // Студии, специализирующиеся на хоррорах (ID TMDB)
    var studios = [
        { id: 3172,    name: 'Blumhouse Productions' },
        { id: 41077,   name: 'A24' },
        { id: 7738,    name: 'Ghost House Pictures' },
        { id: 7991,    name: 'Dark Castle Entertainment' },
        { id: 3060,    name: 'Twisted Pictures' },
        { id: 101159,  name: 'Atomic Monster' },
        { id: 12,      name: 'New Line Cinema' },
        { id: 2149,    name: 'Hammer Film Productions' },
        { id: 13006,   name: 'Amicus Productions' },
        { id: 1423,    name: 'Full Moon Features' },
        { id: 6775,    name: 'Troma Entertainment' },
        { id: 4353,    name: 'Vertigo Entertainment' },
        { id: 7505,    name: 'Platinum Dunes' },
        { id: 118151,  name: 'NEON' },
        { id: 90763,   name: 'Annapurna Pictures' },
        { id: 20979,   name: 'Rogue Pictures' },
        { id: 18726,   name: 'Screen Gems' },
        { id: 9195,    name: 'Lionsgate Horror' },
        { id: 1686,    name: 'Skydance' },
        { id: 7295,    name: 'Constantin Film' }
    ];

    /* ============================================================
       СОСТОЯНИЕ
       ============================================================ */

    var scareLoading = false;
    var studioLoading = false;
    var studioPage = 1;

    /* ============================================================
       УТИЛИТЫ
       ============================================================ */

    function enabledControllerName() {
        try {
            var ctrl = Lampa.Controller.enabled();
            return (ctrl && ctrl.name) ? ctrl.name : 'content';
        } catch (e) {
            return 'content';
        }
    }

    function safeStopLoading() {
        try { Lampa.Loading.stop(); } catch (e) {}
    }

    function tmdbDiscover(params, onSuccess, onError) {
        var query = [];
        for (var k in params) {
            if (Object.prototype.hasOwnProperty.call(params, k)) {
                query.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
            }
        }
        var url = TMDB_API + '/discover/movie?' +
            query.join('&') +
            '&api_key=' + API_KEY +
            '&language=' + LANG +
            '&include_adult=false';

        var network = new Lampa.Reguest();
        network.silent(url, onSuccess, function (err) {
            if (onError) onError(err);
        });
    }

    function tmdbCompanyMovies(companyId, page, onSuccess, onError) {
        var url = TMDB_API + '/discover/movie?' +
            'with_companies=' + companyId +
            '&with_genres=' + GENRE_HORROR +
            '&sort_by=popularity.desc' +
            '&page=' + page +
            '&api_key=' + API_KEY +
            '&language=' + LANG +
            '&include_adult=false';

        var network = new Lampa.Reguest();
        network.silent(url, onSuccess, function (err) {
            if (onError) onError(err);
        });
    }

    function mapMovie(item) {
        item.source = 'tmdb';
        return item;
    }

    /* ============================================================
       КАРТОЧКА ФИЛЬМА
       ============================================================ */

    function showScareCard(movie) {
        if (!movie) return;
        var prev = enabledControllerName();

        Lampa.Activity.push({
            url: '',
            title: movie.title || movie.name || 'Фильм',
            component: 'movie',
            movie: movie,
            source: 'tmdb',
            card: movie,
            id: movie.id
        });

        // Восстанавливаем фокус при возврате
        Lampa.Controller.onBack = function () {
            try { Lampa.Controller.toggle(prev); } catch (e) {}
        };
    }

    /* ============================================================
       ГЛАВНАЯ СТРАНИЦА «УЖАСЫ» (СЕТКА СТРОК)
       ============================================================ */

    function buildScareComponent() {
        var html =
            '<div class="scare-root">' +
                '<div class="scare-header">' +
                    '<div class="scare-title">Ужасы</div>' +
                    '<div class="scare-sub">Подборки по поджанрам</div>' +
                '</div>' +
                '<div class="scare-rows"></div>' +
            '</div>';

        return html;
    }

    function renderRow(row, movies) {
        var $row = $('<div class="scare-row"></div>');
        $row.append('<div class="scare-row-title">' + row.title + '</div>');

        var $scroll = $('<div class="scare-row-scroll"></div>');
        var $items  = $('<div class="scare-row-items"></div>');

        movies.forEach(function (movie) {
            var poster = movie.poster_path
                ? 'https://image.tmdb.org/t/p/w300' + movie.poster_path
                : './img/img_broken.svg';

            var $card = $(
                '<div class="scare-card">' +
                    '<div class="scare-card-poster">' +
                        '<img src="' + poster + '" alt="" />' +
                    '</div>' +
                    '<div class="scare-card-title">' +
                        (movie.title || movie.name || '') +
                    '</div>' +
                '</div>'
            );

            $card.on('hover:enter click', function () {
                showScareCard(mapMovie(movie));
            });

            $items.append($card);
        });

        $scroll.append($items);
        $row.append($scroll);
        return $row;
    }

    function loadAllRows(container) {
        var $rows = container.find('.scare-rows');
        var index = 0;

        function next() {
            if (index >= subgenres.length) {
                safeStopLoading();
                scareLoading = false;
                return;
            }

            var row = subgenres[index++];
            var attempts = 0;

            function tryLoad() {
                tmdbDiscover({
                    with_genres: GENRE_HORROR,
                    with_keywords: row.kw,
                    sort_by: 'popularity.desc',
                    page: 1
                }, function (data) {
                    if (data && data.results && data.results.length) {
                        $rows.append(renderRow(row, data.results));
                    }
                    next();
                }, function () {
                    attempts++;
                    if (attempts < 2) {
                        setTimeout(tryLoad, 500);
                    } else {
                        next(); // пропускаем строку после 2 неудач
                    }
                });
            }

            tryLoad();
        }

        next();
    }

    function scareMe() {
        if (scareLoading) return;
        scareLoading = true;

        try {
            Lampa.Loading.start();
        } catch (e) {}

        var container = $(buildScareComponent());

        Lampa.Activity.push({
            url: '',
            title: 'Ужасы',
            component: 'scare',
            html: container,
            onStart: function () {
                loadAllRows(container);
            },
            onBack: function () {
                if (Lampa.Activity.active().component === 'scare') {
                    Lampa.Activity.backward();
                }
            }
        });
    }

    /* ============================================================
       СТРАНИЦА «СТУДИИ» — СПИСОК
       ============================================================ */

    function buildStudioListHtml() {
        return (
            '<div class="studio-root">' +
                '<div class="studio-header">' +
                    '<div class="studio-title">Студии хорроров</div>' +
                    '<div class="studio-sub">Выберите студию, чтобы увидеть её фильмографию</div>' +
                '</div>' +
                '<div class="studio-list"></div>' +
            '</div>'
        );
    }

    function renderStudioList(container) {
        var $list = container.find('.studio-list');

        studios.forEach(function (studio) {
            var $item = $(
                '<div class="studio-item">' +
                    '<div class="studio-item-name">' + studio.name + '</div>' +
                    '<div class="studio-item-arrow">›</div>' +
                '</div>'
            );

            $item.on('hover:enter click', function () {
                openStudio(studio);
            });

            $list.append($item);
        });
    }

    function openStudioList() {
        if (studioLoading) return;
        studioLoading = true;

        var container = $(buildStudioListHtml());

        Lampa.Activity.push({
            url: '',
            title: 'Студии хорроров',
            component: 'studio-list',
            html: container,
            onStart: function () {
                renderStudioList(container);
            },
            onBack: function () {
                if (Lampa.Activity.active().component === 'studio-list') {
                    Lampa.Activity.backward();
                }
            }
        });

        studioLoading = false;
    }

    /* ============================================================
       СТРАНИЦА СТУДИИ — ФИЛЬМОГРАФИЯ
       ============================================================ */

    function buildStudioPageHtml(studio) {
        return (
            '<div class="studio-page-root">' +
                '<div class="studio-page-header">' +
                    '<div class="studio-page-title">' + studio.name + '</div>' +
                    '<div class="studio-page-sub">Фильмы ужасов</div>' +
                '</div>' +
                '<div class="studio-page-grid"></div>' +
                '<div class="studio-page-more" style="display:none;text-align:center;padding:20px;">' +
                    '<div class="studio-load-more">Показать ещё</div>' +
                '</div>' +
            '</div>'
        );
    }

    function renderStudioMovies(container, movies, append) {
        var $grid = container.find('.studio-page-grid');
        if (!append) $grid.empty();

        movies.forEach(function (movie) {
            if (!movie || !movie.id) return;

            var poster = movie.poster_path
                ? 'https://image.tmdb.org/t/p/w300' + movie.poster_path
                : './img/img_broken.svg';

            var $card = $(
                '<div class="scare-card">' +
                    '<div class="scare-card-poster">' +
                        '<img src="' + poster + '" alt="" />' +
                    '</div>' +
                    '<div class="scare-card-title">' +
                        (movie.title || movie.name || '') +
                    '</div>' +
                '</div>'
            );

            $card.on('hover:enter click', function () {
                showScareCard(mapMovie(movie));
            });

            $grid.append($card);
        });
    }

    function openStudio(studio) {
        studioPage = 1;
        var container = $(buildStudioPageHtml(studio));
        var loadingMore = false;

        function loadPage(page, append) {
            if (loadingMore) return;
            loadingMore = true;

            try { Lampa.Loading.start(); } catch (e) {}

            tmdbCompanyMovies(studio.id, page, function (data) {
                safeStopLoading();
                loadingMore = false;

                var results = (data && data.results) ? data.results : [];
                renderStudioMovies(container, results, append);

                var totalPages = (data && data.total_pages) ? data.total_pages : 1;
                if (page < totalPages) {
                    container.find('.studio-page-more').show();
                } else {
                    container.find('.studio-page-more').hide();
                }
            }, function () {
                safeStopLoading();
                loadingMore = false;
                Lampa.Noty.show('Не удалось загрузить фильмы студии');
            });
        }

        Lampa.Activity.push({
            url: '',
            title: studio.name,
            component: 'studio-page',
            html: container,
            onStart: function () {
                loadPage(1, false);

                container.find('.studio-load-more').on('hover:enter click', function () {
                    if (loadingMore) return;
                    studioPage++;
                    loadPage(studioPage, true);
                });
            },
            onBack: function () {
                if (Lampa.Activity.active().component === 'studio-page') {
                    Lampa.Activity.backward();
                }
            }
        });
    }

    /* ============================================================
       РЕГИСТРАЦИЯ В МЕНЮ
       ============================================================ */

    function addMenuButton() {
        Lampa.Menu.addButton({
            title: 'Ужасы',
            icon: ICON_HORROR,
            onSelect: function () {
                scareMe();
            }
        });

        Lampa.Menu.addButton({
            title: 'Студии',
            icon: ICON_STUDIO,
            onSelect: function () {
                openStudioList();
            }
        });
    }

    /* ============================================================
       СТИЛИ
       ============================================================ */

    function addStyles() {
        if ($('#horror-plugin-styles').length) return;

        var css = ''
        + '.scare-root, .studio-root, .studio-page-root { padding: 20px 40px 40px 40px; }'
        + '.scare-header, .studio-header, .studio-page-header { margin-bottom: 30px; }'
        + '.scare-title, .studio-title, .studio-page-title { font-size: 32px; font-weight: 700; color: #fff; }'
        + '.scare-sub, .studio-sub, .studio-page-sub { font-size: 14px; color: rgba(255,255,255,.55); margin-top: 6px; }'
        + '.scare-row { margin-bottom: 34px; }'
        + '.scare-row-title { font-size: 20px; font-weight: 600; color: #fff; margin-bottom: 14px; }'
        + '.scare-row-scroll { overflow-x: auto; overflow-y: hidden; }'
        + '.scare-row-items { display: flex; gap: 14px; }'
        + '.scare-card { width: 150px; flex: 0 0 auto; cursor: pointer; transition: transform .2s ease; }'
        + '.scare-card:hover, .scare-card.focus { transform: scale(1.06); }'
        + '.scare-card-poster { width: 150px; height: 225px; border-radius: 8px; overflow: hidden; background: rgba(255,255,255,.06); }'
        + '.scare-card-poster img { width: 100%; height: 100%; object-fit: cover; display: block; }'
        + '.scare-card-title { font-size: 12px; color: #eee; margin-top: 8px; line-height: 1.3; max-height: 32px; overflow: hidden; }'
        + '.studio-list { display: flex; flex-direction: column; gap: 10px; max-width: 720px; }'
        + '.studio-item { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: rgba(255,255,255,.05); border-radius: 8px; cursor: pointer; transition: background .2s; }'
        + '.studio-item:hover, .studio-item.focus { background: rgba(255,255,255,.12); }'
        + '.studio-item-name { color: #fff; font-size: 16px; }'
        + '.studio-item-arrow { color: rgba(255,255,255,.4); font-size: 22px; }'
        + '.studio-page-grid { display: flex; flex-wrap: wrap; gap: 14px; }'
        + '.studio-load-more { display: inline-block; padding: 12px 28px; background: rgba(255,255,255,.08); border-radius: 8px; color: #fff; cursor: pointer; }'
        + '.studio-load-more:hover, .studio-load-more.focus { background: rgba(255,255,255,.16); }';

        $('<style id="horror-plugin-styles"></style>').text(css).appendTo('head');
    }

    /* ============================================================
       ИНИЦИАЛИЗАЦИЯ
       ============================================================ */

    function start() {
        addStyles();
        addMenuButton();
    }

    // Единая точка входа — избегаем двойной инициализации
    if (window.appready) {
        start();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }
})();
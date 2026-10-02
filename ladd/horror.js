/**
 * Horror plugin for Lampa (v4)
 * - Отдельная вкладка "Ужасы" в меню
 * - 4 строки: Рекомендации / Фильмы / Сериалы / Аниме
 * - Двухколоночный интерфейс: слева список (55%), справа обзор (45%)
 * - Фон страницы — backdrop выбранной карточки
 * - Отбор через keywords (жанры TMDB слишком широкие / у TV нет хоррора)
 */
(function () {
    'use strict';

    /* ============ CONFIG ============ */
    var COMPONENT  = 'horror_page';
    var MENU_TITLE = 'Ужасы';

    var HORROR_GENRE    = 27;
    var THRILLER_GENRE  = 53;
    var ANIMATION_GENRE = 16;

    // Keywords, которые нужно получить с TMDB и использовать в фильтре
    var KEYWORD_NAMES = [
        // Horror
        'horror', 'supernatural', 'slasher', 'zombie', 'vampire',
        'ghost', 'demonic', 'exorcism', 'haunted house',
        'found footage', 'monster', 'psychological horror',
        // Thriller (специфичные, чтобы не ловить «детективов» и т.п.)
        'serial killer', 'suspense', 'psychological thriller', 'whodunit'
    ];

    /* ============ STATE ============ */
    var keywordIds = null; // строка вида "123|456|789" — кэшируется после первого запуска

    /* ============ UTILS ============ */

    function isAnime(card) {
        var ids = card.genre_ids ||
                  (card.genres ? card.genres.map(function (g) { return g.id; }) : []);
        return card.original_language === 'ja' && ids.indexOf(ANIMATION_GENRE) >= 0;
    }

    function notAnime(card) { return !isAnime(card); }

    function getKeywordId(name, cb) {
        var cacheKey = 'horror_kw_' + name.toLowerCase().replace(/\s+/g, '_');
        var cached = Lampa.Storage.get(cacheKey, '');
        if (cached) return cb(cached);

        Lampa.Api.sources.tmdb.get(
            'search/keyword',
            { query: name },
            function (json) {
                if (json.results && json.results.length) {
                    var id = String(json.results[0].id);
                    Lampa.Storage.set(cacheKey, id);
                    cb(id);
                } else cb(null);
            },
            function () { cb(null); },
            { life: 60 * 24 * 30 } // кэш на 30 дней
        );
    }

    function buildKeywordsString(cb) {
        if (keywordIds) return cb(keywordIds);

        var ids = [];
        var pending = KEYWORD_NAMES.length;

        KEYWORD_NAMES.forEach(function (name) {
            getKeywordId(name, function (id) {
                if (id) ids.push(id);
                pending--;
                if (pending === 0) {
                    keywordIds = ids.join('|'); // OR
                    cb(keywordIds);
                }
            });
        });
    }

    /* ============ DATA LOADING ============ */

    /**
     * opts:
     *   sort_by     — сортировка TMDB
     *   genres      — строка жанров (через | = OR, через , = AND)
     *   orig_lang   — код языка оригинала
     *   vote_count  — минимальное количество голосов
     *   cache_days  — срок жизни кэша
     *   is_anime    — true = только аниме, false = исключить аниме, undefined = без фильтра
     *   use_keywords— false = не использовать keywords (по умолчанию true)
     *   filter      — дополнительные параметры запроса
     */
    function load(type, opts, cb) {
        buildKeywordsString(function (kwString) {
            var params = {
                sort_by: opts.sort_by || 'popularity.desc',
                page: 1
            };

            if (opts.genres)    params.genres    = opts.genres;
            if (opts.orig_lang) params.orig_lang = opts.orig_lang;

            var filter = {};
            if (opts.use_keywords !== false) filter.with_keywords = kwString;
            if (opts.vote_count) filter['vote_count.gte'] = opts.vote_count;

            if (opts.filter) {
                for (var k in opts.filter) filter[k] = opts.filter[k];
            }
            params.filter = filter;

            Lampa.Api.sources.tmdb.get(
                'discover/' + type,
                params,
                function (json) {
                    var results = (json && json.results) || [];

                    if (opts.is_anime === true)       results = results.filter(isAnime);
                    else if (opts.is_anime === false) results = results.filter(notAnime);

                    cb({ results: results, total_pages: (json && json.total_pages) || 1 });
                },
                function () { cb({ results: [] }); },
                { life: 60 * 24 * (opts.cache_days || 3) }
            );
        });
    }

    /* ============ COMPONENT ============ */

    function HorrorComponent(object) {
        var comp      = Lampa.Maker.make('Main', object);
        var previewEl = null;

        /* --- Панель обзора справа --- */
        function buildPreviewEl() {
            var el = document.createElement('div');
            el.className = 'horror-preview';
            el.innerHTML =
                '<div class="horror-preview__poster-wrap">' +
                    '<img class="horror-preview__poster hp-poster" alt="" />' +
                '</div>' +
                '<div class="horror-preview__body">' +
                    '<div class="horror-preview__title hp-title"></div>' +
                    '<div class="horror-preview__meta hp-meta"></div>' +
                    '<div class="horror-preview__overview hp-overview"></div>' +
                '</div>';
            return el;
        }

        function updatePreview(card) {
            if (!previewEl || !card) return;

            previewEl.querySelector('.hp-title').textContent =
                card.title || card.name || 'Без названия';

            previewEl.querySelector('.hp-overview').textContent =
                card.overview || 'Описание отсутствует.';

            var year    = ((card.release_date || card.first_air_date || '') + '').slice(0, 4);
            var rating  = card.vote_average ? parseFloat(card.vote_average).toFixed(1) : '';
            var is_tv   = !!(card.first_air_date || card.name);
            var type    = is_tv ? 'Сериал' : 'Фильм';
            var parts   = [type, year, rating ? '★ ' + rating : ''].filter(Boolean);

            previewEl.querySelector('.hp-meta').textContent = parts.join(' • ');

            var poster = previewEl.querySelector('.hp-poster');
            if (card.poster_path) {
                poster.src = Lampa.Api.img(card.poster_path, 'w300');
                poster.style.display = 'block';
            } else {
                poster.style.display = 'none';
            }
        }

        /* --- Хуки жизненного цикла --- */
        comp.use({
            /* Карточки внутри строк — вешаем onFocus/onEnter */
            onInstance: function (line) {
                line.use({
                    onInstance: function (card, card_data) {
                        card.use({
                            onEnter: function () {
                                Lampa.Router.call('full', card_data);
                            },
                            onFocus: function () {
                                updatePreview(card_data);
                                Lampa.Background.change(
                                    Lampa.Utils.cardImgBackground(card_data)
                                );
                            }
                        });
                    }
                });
            },

            /* После того, как все строки и карточки построены — добавляем панель обзора */
            onBuild: function (data) {
                var html = this.render(true);
                html.classList.add('horror-page');

                if (!previewEl) {
                    previewEl = buildPreviewEl();
                    html.appendChild(previewEl);
                }

                // Дефолтный обзор — первая карточка первой строки
                var first = data[0] && data[0].results && data[0].results[0];
                if (first) {
                    updatePreview(first);
                    try {
                        Lampa.Background.immediately(
                            Lampa.Utils.cardImgBackground(first)
                        );
                    } catch (e) {}
                }
            }
        });

        /* --- Загрузка данных --- */
        comp.use({
            onCreate: function () {
                var lines  = [];
                var total  = 4;
                var loaded = 0;

                function done() {
                    loaded++;
                    if (loaded < total) return;
                    if (lines.length) comp.build(lines);
                    else comp.empty();
                }

                /* Row 1 — Рекомендации: топ по рейтингу, фильмы (не аниме) */
                load('movie', {
                    sort_by:    'vote_average.desc',
                    genres:     HORROR_GENRE + '|' + THRILLER_GENRE, // OR
                    vote_count: 1000,
                    cache_days: 7,
                    is_anime:   false
                }, function (d) {
                    if (d.results.length) {
                        d.title = 'Рекомендации';
                        lines.push(d);
                    }
                    done();
                });

                /* Row 2 — Фильмы: популярные (не аниме) */
                load('movie', {
                    sort_by:    'popularity.desc',
                    genres:     HORROR_GENRE + '|' + THRILLER_GENRE,
                    vote_count: 50,
                    cache_days: 3,
                    is_anime:   false
                }, function (d) {
                    if (d.results.length) {
                        d.title = 'Фильмы';
                        lines.push(d);
                    }
                    done();
                });

                /* Row 3 — Сериалы: популярные (не аниме) */
                load('tv', {
                    sort_by:    'popularity.desc',
                    vote_count: 50,
                    cache_days: 3,
                    is_anime:   false
                }, function (d) {
                    if (d.results.length) {
                        d.title = 'Сериалы';
                        lines.push(d);
                    }
                    done();
                });

                /* Row 4 — Аниме: японская анимация с horror-keywords */
                load('tv', {
                    sort_by:    'popularity.desc',
                    genres:     ANIMATION_GENRE,
                    orig_lang:  'ja',
                    vote_count: 30,
                    cache_days: 7,
                    is_anime:   true
                }, function (d) {
                    if (d.results.length) {
                        d.title = 'Аниме';
                        lines.push(d);
                    }
                    done();
                });
            }
        });

        return comp;
    }

    /* ============ МЕНЮ ============ */

    function addMenuButton() {
        Lampa.Menu.addButton(
            '<svg><use xlink:href="#sprite-meta-fear"></use></svg>',
            MENU_TITLE,
            function () {
                Lampa.Activity.push({
                    url:       'horror',
                    title:     MENU_TITLE,
                    component: COMPONENT,
                    page:      1
                });
            }
        );
    }

    /* ============ СТИЛИ ============ */

    function injectStyles() {
        if (document.getElementById('horror-plugin-styles')) return;

        var style = document.createElement('style');
        style.id = 'horror-plugin-styles';
        style.textContent = [
            '.horror-page { position: relative; }',

            /* Левая колонка — список (55% ширины) */
            '.horror-page > .scroll { width: 55% !important; overflow: hidden; }',

            /* Правая колонка — панель обзора */
            '.horror-preview {',
            '    position: fixed;',
            '    right: 0;',
            '    top: 0;',
            '    width: 45%;',
            '    height: 100vh;',
            '    padding: 7em 3em 3em 2em;',
            '    box-sizing: border-box;',
            '    display: flex;',
            '    flex-direction: column;',
            '    justify-content: center;',
            '    pointer-events: none;',           // клики должны проходить через панель
            '    z-index: 5;',
            '    color: #fff;',
            '}',

            '.horror-preview__poster-wrap {',
            '    width: 14em;',
            '    height: 21em;',
            '    border-radius: 0.9em;',
            '    overflow: hidden;',
            '    margin-bottom: 1.5em;',
            '    box-shadow: 0 20px 60px rgba(0,0,0,0.65);',
            '    background: rgba(255,255,255,0.06);',
            '}',

            '.horror-preview__poster {',
            '    width: 100%;',
            '    height: 100%;',
            '    object-fit: cover;',
            '    display: block;',
            '}',

            '.horror-preview__title {',
            '    font-size: 2.1em;',
            '    font-weight: 700;',
            '    line-height: 1.15;',
            '    margin-bottom: 0.4em;',
            '    text-shadow: 0 2px 20px rgba(0,0,0,0.75);',
            '}',

            '.horror-preview__meta {',
            '    font-size: 1em;',
            '    opacity: 0.78;',
            '    margin-bottom: 1.2em;',
            '    text-shadow: 0 2px 10px rgba(0,0,0,0.75);',
            '}',

            '.horror-preview__overview {',
            '    font-size: 1.05em;',
            '    line-height: 1.5;',
            '    opacity: 0.92;',
            '    max-height: 30vh;',
            '    overflow: hidden;',
            '    text-shadow: 0 2px 10px rgba(0,0,0,0.75);',
            '}',

            /* Мобильный — панель обзора отключаем, список на всю ширину */
            '@media (max-width: 768px) {',
            '    .horror-page > .scroll { width: 100% !important; }',
            '    .horror-preview { display: none; }',
            '}'
        ].join('\n');

        document.head.appendChild(style);
    }

    /* ============ ЗАПУСК ============ */

    function start() {
        if (window.horror_plugin_started) return;
        window.horror_plugin_started = true;

        injectStyles();
        Lampa.Component.add(COMPONENT, HorrorComponent);
        addMenuButton();

        console.log('Horror plugin', 'started');
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') start();
    });
})();
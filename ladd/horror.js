/**
 * Horror plugin for Lampa (v3)
 * Исправлено: вместо жанров используются keywords.
 * Для фильмов — только жанр Horror (27), без триллеров.
 * Для сериалов — keywords (horror, supernatural, slasher, zombie, vampire,
 * ghost, demonic, exorcism, haunted house, found footage, monster, psychological horror).
 */
(function () {
    'use strict';

    var COMPONENT   = 'horror_page';
    var MENU_TITLE  = 'Ужасы';

    /* Keywords, которые будем использовать */
    var KEYWORD_NAMES = [
        'horror',
        'supernatural',
        'slasher',
        'zombie',
        'vampire',
        'ghost',
        'demonic',
        'exorcism',
        'haunted house',
        'found footage',
        'monster',
        'psychological horror'
    ];

    var keywordIds = null; // заполнится при инициализации

    /* ─────────────────────────────────────────────────────────
     * Получить ID ключевого слова по имени (с кэшем)
     * ───────────────────────────────────────────────────────── */
    function getKeywordId(name, callback) {
        var cacheKey = 'horror_kw_' + name.toLowerCase().replace(/\s+/g, '_');
        var cached = Lampa.Storage.get(cacheKey, '');

        if (cached) {
            return callback(cached);
        }

        Lampa.Api.sources.tmdb.get('search/keyword', { query: name }, function (json) {
            if (json.results && json.results.length) {
                var id = String(json.results[0].id);
                Lampa.Storage.set(cacheKey, id);
                callback(id);
            } else {
                callback(null);
            }
        }, function () {
            callback(null);
        }, { life: 60 * 24 * 30 }); // кэш на 30 дней
    }

    /* ─────────────────────────────────────────────────────────
     * Собрать строку with_keywords (ID через |)
     * ───────────────────────────────────────────────────────── */
    function buildKeywordsString(callback) {
        if (keywordIds) return callback(keywordIds);

        var ids = [];
        var pending = KEYWORD_NAMES.length;

        KEYWORD_NAMES.forEach(function (name) {
            getKeywordId(name, function (id) {
                if (id) ids.push(id);
                pending--;
                if (pending === 0) {
                    keywordIds = ids.join('|'); // OR: любое из ключевых слов
                    callback(keywordIds);
                }
            });
        });
    }

    /* ─────────────────────────────────────────────────────────
     * Загрузка через discover с фильтрами
     * ───────────────────────────────────────────────────────── */
    function load(type, sort_by, extra, cache_days, callback) {
        buildKeywordsString(function (kwString) {
            var params = {
                sort_by: sort_by,
                page: 1
            };

            if (type === 'tv') {
                // Для сериалов — только keywords (жанры Mystery/Sci-Fi не нужны)
                params.filter = {
                    with_keywords: kwString
                };
            } else {
                // Для фильмов — жанр Horror (27) + keywords для точности
                params.genres = '27'; // только ужасы
                params.filter = {
                    with_keywords: kwString
                };
            }

            if (extra) {
                params.filter = params.filter || {};
                for (var k in extra) params.filter[k] = extra[k];
            }

            Lampa.Api.sources.tmdb.get(
                'discover/' + type,
                params,
                function (json) {
                    callback(json || { results: [] });
                },
                function () {
                    callback({ results: [] });
                },
                { life: 60 * 24 * (cache_days || 3) }
            );
        });
    }

    /* ─────────────────────────────────────────────────────────
     * Компонент страницы "Ужасы"
     * ───────────────────────────────────────────────────────── */
    function HorrorComponent(object) {
        var comp   = Lampa.Maker.make('Main', object);
        var lines  = [];
        var total  = 3;
        var loaded = 0;

        function done() {
            loaded++;
            if (loaded < total) return;
            if (lines.length) comp.build(lines);
            else comp.empty();
        }

        comp.use({
            onCreate: function () {

                /* ── Строка 1 — Рекомендации ──
                   Топ по рейтингу среди ужасов */
                load('movie', 'vote_average.desc',
                     { 'vote_count.gte': 1000 }, 7,
                     function (data) {
                         if (data.results.length) {
                             data.title = 'Рекомендации';
                             lines.push(data);
                         }
                         done();
                     });

                /* ── Строка 2 — Фильмы ──
                   Популярные фильмы ужасов (только жанр Horror + keywords) */
                load('movie', 'popularity.desc',
                     { 'vote_count.gte': 50 }, 3,
                     function (data) {
                         if (data.results.length) {
                             data.title = 'Фильмы';
                             lines.push(data);
                         }
                         done();
                     });

                /* ── Строка 3 — Сериалы ──
                   Популярные сериалы с хоррор-keywords */
                load('tv', 'popularity.desc',
                     { 'vote_count.gte': 50 }, 3,
                     function (data) {
                         if (data.results.length) {
                             data.title = 'Сериалы';
                             lines.push(data);
                         }
                         done();
                     });
            },

            onInstance: function (line) {
                line.use({
                    onInstance: function (card, card_data) {
                        card.use({
                            onEnter: Lampa.Router.call.bind(Lampa.Router, 'full', card_data),
                            onFocus: function () {
                                Lampa.Background.change(Lampa.Utils.cardImgBackground(card_data));
                            }
                        });
                    }
                });
            }
        });

        return comp;
    }

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

    function start() {
        if (window.horror_plugin_started) return;
        window.horror_plugin_started = true;

        Lampa.Component.add(COMPONENT, HorrorComponent);
        addMenuButton();

        console.log('Horror plugin', 'started');
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') start();
    });
})();
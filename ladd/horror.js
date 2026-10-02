/**
 * Horror plugin for Lampa
 * Новая вкладка "Ужасы" в меню.
 * Внутри 3 строки: Рекомендации / Фильмы / Сериалы
 * Жанры: Ужасы (27) + Триллер (53)
 */
(function () {
    'use strict';

    var HORROR   = 27;
    var THRILLER = 53;
    var GENRES_STR = HORROR + ',' + THRILLER;

    var COMPONENT  = 'horror_page';
    var MENU_TITLE = 'Ужасы';

    /* ─────────────────────────────────────────────────────────
     * Проверка, что карточка относится к ужасам или триллерам
     * ───────────────────────────────────────────────────────── */
    function hasHorrorGenre(card) {
        if (!card) return false;
        var ids = card.genre_ids ||
            (card.genres ? card.genres.map(function (g) { return g.id; }) : []);
        return ids.indexOf(HORROR) >= 0 || ids.indexOf(THRILLER) >= 0;
    }

    function filterHorror(items) {
        if (!items || !items.length) return [];
        return items.filter(hasHorrorGenre);
    }

    /* ─────────────────────────────────────────────────────────
     * Загрузка данных с TMDB через встроенный источник Lampa
     * type        — 'movie' | 'tv'
     * sort_by     — 'popularity.desc', 'vote_average.desc', ...
     * extra       — дополнительные фильтры (напр. { 'vote_count.gte': 50 })
     * cache_days  — срок жизни кэша в днях
     * ───────────────────────────────────────────────────────── */
    function load(type, sort_by, extra, cache_days, callback) {
        var params = {
            genres:   GENRES_STR,
            sort_by:  sort_by,
            page:     1
        };

        if (extra) {
            params.filter = {};
            for (var k in extra) params.filter[k] = extra[k];
        }

        Lampa.Api.sources.tmdb.get(
            'discover/' + type,
            params,
            function (json) {
                if (json && json.results) json.results = filterHorror(json.results);
                callback(json || { results: [] });
            },
            function () {
                callback({ results: [] });
            },
            { life: 60 * 24 * (cache_days || 3) } // кэш в днях
        );
    }

    /* ─────────────────────────────────────────────────────────
     * Сам компонент страницы "Ужасы"
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
                   Топ по рейтингу среди ужасов/триллеров */
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
                   Популярные фильмы ужасов/триллеров */
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
                   Популярные сериалы ужасов/триллеров */
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

            /* Клик/фокус на карточке внутри строк */
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

    /* ─────────────────────────────────────────────────────────
     * Кнопка в главном меню
     * ───────────────────────────────────────────────────────── */
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

    /* ─────────────────────────────────────────────────────────
     * Запуск плагина
     * ───────────────────────────────────────────────────────── */
    function start() {
        if (window.horror_plugin_started) return;
        window.horror_plugin_started = true;

        Lampa.Component.add(COMPONENT, HorrorComponent);
        addMenuButton();

        console.log('Horror plugin', 'started');
    }

    if (window.appready) {
        start();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }
})();
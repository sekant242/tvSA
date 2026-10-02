/**
 * Horror plugin for Lampa (v2)
 * Исправлено: для сериалов используются жанры Mystery + Sci-Fi & Fantasy,
 *            т.к. на TMDB у TV нет жанров Horror/Thriller.
 */
(function () {
    'use strict';

    /* ─── Жанры TMDB ───
     * Для фильмов: 27 = Ужасы, 53 = Триллер
     * Для сериалов: Horror/Thriller в TV-жанрах отсутствуют,
     *   поэтому берём 9648 (Мистика) и 10765 (Фантастика и фэнтези) —
     *   на TMDB хоррор-сериалы обычно помечены именно ими.
     */
    var MOVIE_GENRES = [27, 53];
    var TV_GENRES    = [9648, 10765];

    var MOVIE_GENRES_STR = MOVIE_GENRES.join('|'); // OR: Horror|Thriller
    var TV_GENRES_STR    = TV_GENRES.join('|');    // OR: Mystery|Sci-Fi & Fantasy

    var COMPONENT  = 'horror_page';
    var MENU_TITLE = 'Ужасы';

    function genresFor(type) {
        return type === 'tv' ? TV_GENRES : MOVIE_GENRES;
    }

    function filterHorror(items, type) {
        if (!items || !items.length) return [];
        var ids = genresFor(type);
        return items.filter(function (card) {
            var card_ids = card.genre_ids ||
                (card.genres ? card.genres.map(function (g) { return g.id; }) : []);
            for (var i = 0; i < ids.length; i++) {
                if (card_ids.indexOf(ids[i]) >= 0) return true;
            }
            return false;
        });
    }

    function load(type, sort_by, extra, cache_days, callback) {
        var params = {
            genres:  type === 'tv' ? TV_GENRES_STR : MOVIE_GENRES_STR,
            sort_by: sort_by,
            page:    1
        };

        if (extra) {
            params.filter = {};
            for (var k in extra) params.filter[k] = extra[k];
        }

        Lampa.Api.sources.tmdb.get(
            'discover/' + type,
            params,
            function (json) {
                if (json && json.results) {
                    json.results = filterHorror(json.results, type);
                }
                callback(json || { results: [] });
            },
            function () {
                callback({ results: [] });
            },
            { life: 60 * 24 * (cache_days || 3) }
        );
    }

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

                /* ── Строка 1 — Рекомендации ── */
                load('movie', 'vote_average.desc',
                     { 'vote_count.gte': 1000 }, 7,
                     function (data) {
                         if (data.results.length) {
                             data.title = 'Рекомендации';
                             lines.push(data);
                         }
                         done();
                     });

                /* ── Строка 2 — Фильмы ── */
                load('movie', 'popularity.desc',
                     { 'vote_count.gte': 50 }, 3,
                     function (data) {
                         if (data.results.length) {
                             data.title = 'Фильмы';
                             lines.push(data);
                         }
                         done();
                     });

                /* ── Строка 3 — Сериалы ── */
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
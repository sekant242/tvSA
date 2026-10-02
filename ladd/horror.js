(function () {
    'use strict';

    function LOG() {
        console.log.apply(console, ['[Horror]'].concat([].slice.call(arguments)));
    }

    LOG('plugin load');

    // ============================================================
    // ИКОНКА — ЧЕРЕП
    // ============================================================
    var SKULL_SVG =
        '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">' +
            '<path d="M12 2a7 7 0 0 0-7 7c0 1.6.55 3.1 1.47 4.28V17a1 1 0 0 0 1 1h1v2h7v-2h1a1 1 0 0 0 1-1v-3.72A6.97 6.97 0 0 0 19 9a7 7 0 0 0-7-7Zm-2.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm-2.5 1.5 1 2h-2l1-2Z"/>' +
        '</svg>';

    // ============================================================
    // СТИЛИ
    // ============================================================
    var CSS = [
        '.menu__item--horror { margin-top: 14px; position: relative; }',
        '.menu__item--horror::before { content: ""; position: absolute; top: -7px; left: 15px; right: 15px; height: 1px; background: linear-gradient(to right, transparent, #8B0000, transparent); }',
        '.menu__item--horror .menu__item-icon { color: #ff2a2a; filter: drop-shadow(0 0 6px rgba(255,0,0,0.7)); }',
        '.menu__item--horror .menu__item-text { color: #ff4444 !important; font-weight: 600; letter-spacing: 1px; }',

        '.horror-page { background: radial-gradient(ellipse at top, #1a0000 0%, #0a0a0a 60%); min-height: 100vh; padding: 20px 0 60px; color: #e0e0e0; }',
        '.horror-page__title { font-size: 30px; font-weight: 700; color: #ff2a2a; text-shadow: 0 0 14px rgba(255,0,0,0.9); padding: 0 20px 24px; letter-spacing: 3px; text-transform: uppercase; }',
        '.horror-row { margin-bottom: 34px; }',
        '.horror-row__title { font-size: 19px; font-weight: 600; color: #ff4444; padding: 0 20px 12px; text-shadow: 0 0 8px rgba(255,0,0,0.6); }',
        '.horror-row__scroll { display: flex; overflow-x: auto; padding: 8px 20px 18px; scroll-behavior: smooth; -webkit-overflow-scrolling: touch; }',
        '.horror-row__scroll::-webkit-scrollbar { height: 4px; }',
        '.horror-row__scroll::-webkit-scrollbar-thumb { background: #8B0000; border-radius: 4px; }',

        '.horror-card { position: relative; width: 260px; min-width: 260px; height: 400px; margin-right: 16px; border-radius: 12px; overflow: hidden; background: #1a0000; box-shadow: 0 8px 25px rgba(255,0,0,0.25); transition: transform .35s, box-shadow .35s; cursor: pointer; }',
        '.horror-card.focus, .horror-card:hover { transform: scale(1.06); box-shadow: 0 14px 40px rgba(255,0,0,0.7), 0 0 0 2px #ff2a2a inset; }',
        '.horror-card__poster { width: 100%; height: 100%; object-fit: cover; display: block; }',
        '.horror-card::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to top, rgba(60,0,0,.95) 0%, rgba(100,0,0,.55) 35%, transparent 70%); pointer-events: none; }',
        '.horror-card__blood { position: absolute; left: 0; right: 0; bottom: 0; height: 60px; background: url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 240 60\' preserveAspectRatio=\'none\'><path d=\'M0 0 Q8 35 16 5 Q24 50 32 8 Q40 55 48 6 Q56 40 64 12 Q72 58 80 4 Q88 45 96 10 Q104 52 112 6 Q120 38 128 14 Q136 60 144 5 Q152 42 160 10 Q168 55 176 7 Q184 40 192 12 Q200 58 208 5 Q216 45 224 9 Q232 52 240 4 L240 60 L0 60 Z\' fill=\'%238B0000\' opacity=\'0.9\'/></svg>") repeat-x; background-size: 240px 60px; pointer-events: none; z-index: 2; }',
        '.horror-card__info { position: absolute; bottom: 0; left: 0; right: 0; padding: 26px 14px 18px; z-index: 3; }',
        '.horror-card__name { font-size: 16px; font-weight: 600; color: #fff; text-shadow: 0 2px 8px #000, 0 0 12px rgba(255,0,0,.6); margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
        '.horror-card__year { font-size: 13px; color: #ff6b6b; text-shadow: 0 1px 4px #000; }'
    ].join('\n');

    $('head').append('<style id="horror-plugin-style">' + CSS + '</style>');

    // ============================================================
    // TMDB
    // ============================================================
    function tmdbKey() {
        try {
            if (Lampa.TMDB && typeof Lampa.TMDB.key === 'function') {
                var k = Lampa.TMDB.key();
                if (k) return k;
            }
        } catch (e) { LOG('tmdbKey err', e); }
        return Lampa.Storage.field('tmdb_key') || '';
    }

    function tmdbDiscover(type, genres, callback) {
        var path = type === 'tv' ? 'discover/tv' : 'discover/movie';
        var key = tmdbKey();

        if (!key) { LOG('no tmdb key'); callback([]); return; }

        $.ajax({
            url: 'https://api.themoviedb.org/3/' + path,
            data: {
                api_key: key,
                language: Lampa.Storage.field('tmdb_lang') || 'ru',
                with_genres: genres,
                sort_by: 'popularity.desc',
                page: 1
            },
            dataType: 'json',
            timeout: 15000,
            success: function (json) {
                LOG('tmdb ok', type, genres, json && json.results ? json.results.length : 0);
                callback(json && json.results ? json.results : []);
            },
            error: function (xhr, status) {
                LOG('tmdb error', type, status);
                callback([]);
            }
        });
    }

    // ============================================================
    // КОМПОНЕНТ СТРАНИЦЫ
    // ============================================================
    Lampa.Component.add('horror_page', {
        create: function () {
            LOG('component create');
            this.activity = Lampa.Activity.active();
            // ВАЖНО: держим "живой" контейнер, который Lampa вставит в DOM
            this.container = $('<div class="horror-page"></div>');
            return this.container;
        },

        render: function () {
            LOG('component render');
            return this.container;
        },

        start: function () {
            LOG('component start');
            var self = this;
            var activity = this.activity;

            activity.loader(true);

            // Дополнительная защита: если по какой-то причине контейнер отвалился
            if (!self.container || !self.container.length) {
                LOG('container lost, recreating');
                self.container = $('<div class="horror-page"></div>');
                activity.render && activity.render.append(self.container);
            }

            // Наполняем пустой контейнер сразу
            self.container.empty();
            self.container.append('<div class="horror-page__title">Ужасы</div>');
            var rowsContainer = $('<div class="horror-rows"></div>');
            self.container.append(rowsContainer);

            var state = { rec: null, movies: null, tv: null, done: 0 };

            function tryFinish() {
                if (state.done < 3) return;
                LOG('all loaded, building DOM');

                if (state.rec)    rowsContainer.append(buildRow('Рекомендации — ужасы и триллер', state.rec));
                if (state.movies) rowsContainer.append(buildRow('Фильмы ужасов', state.movies));
                if (state.tv)     rowsContainer.append(buildRow('Сериалы ужасов', state.tv));

                activity.loader(false);
                activity.toggle();

                // Контроллер
                Lampa.Controller.add('content', {
                    toggle: function () {
                        Lampa.Controller.collectionSet(self.container);
                        Lampa.Controller.collectionFocus(false, self.container);
                    },
                    left: function () {
                        if (Navigator.canmove('left')) Navigator.move('left');
                        else Lampa.Controller.toggle('menu');
                    },
                    right: function () { if (Navigator.canmove('right')) Navigator.move('right'); },
                    up:    function () { if (Navigator.canmove('up'))    Navigator.move('up'); },
                    down:  function () { if (Navigator.canmove('down'))  Navigator.move('down'); },
                    back:  function () { Lampa.Activity.backward(); }
                });
                Lampa.Controller.toggle('content');
            }

            function buildRow(title, items) {
                var row = $('<div class="horror-row"></div>');
                row.append('<div class="horror-row__title">' + title + '</div>');
                var scroll = $('<div class="horror-row__scroll"></div>');

                if (!items.length) {
                    scroll.append('<div style="color:#666;padding:20px;">Нет данных</div>');
                }

                items.forEach(function (item) {
                    var name   = item.title || item.name || '';
                    var date   = item.release_date || item.first_air_date || '';
                    var year   = date ? date.substring(0, 4) : '';
                    var poster = item.poster_path ? 'https://image.tmdb.org/t/p/w500' + item.poster_path : '';
                    var type   = item.first_air_date ? 'tv' : 'movie';

                    var card = $('<div class="horror-card selector"></div>');
                    if (poster) card.append('<img class="horror-card__poster" src="' + poster + '" loading="lazy">');
                    card.append('<div class="horror-card__blood"></div>');
                    card.append(
                        '<div class="horror-card__info">' +
                            '<div class="horror-card__name">' + name + '</div>' +
                            '<div class="horror-card__year">' + year + '</div>' +
                        '</div>'
                    );

                    card.on('hover:enter', function () {
                        Lampa.Activity.push({
                            title: name,
                            component: 'full',
                            id: item.id,
                            method: type,
                            source: 'tmdb'
                        });
                    });

                    scroll.append(card);
                });

                row.append(scroll);
                return row;
            }

            // Ряд 1 — рекомендации (ужасы 27 + триллер 53)
            tmdbDiscover('movie', '27,53', function (movies) {
                tmdbDiscover('tv', '27,53', function (tv) {
                    var all = movies.concat(tv).sort(function () { return Math.random() - 0.5; });
                    state.rec = all.slice(0, 20);
                    state.done++;
                    tryFinish();
                });
            });

            // Ряд 2 — фильмы ужасов
            tmdbDiscover('movie', '27', function (movies) {
                state.movies = movies;
                state.done++;
                tryFinish();
            });

            // Ряд 3 — сериалы ужасов
            tmdbDiscover('tv', '27', function (tv) {
                state.tv = tv;
                state.done++;
                tryFinish();
            });

            // Подстраховка — если что-то не пришло за 15с
            setTimeout(function () {
                if (state.done < 3) {
                    LOG('timeout, forcing finish', state.done);
                    state.done = 3;
                    tryFinish();
                }
            }, 15000);
        },

        stop: function () { LOG('component stop'); },
        pause: function () {},
        resume: function () {},
        destroy: function () { LOG('component destroy'); }
    });

    // ============================================================
    // ПУНКТ МЕНЮ
    // ============================================================
    function addMenuItem() {
        var list = $('.menu__list');
        if (!list.length) { LOG('menu list not found'); return; }
        if (list.find('[data-action="horror"]').length) return;

        LOG('adding menu item');

        var item = $(
            '<div class="menu__item selector menu__item--horror" data-action="horror">' +
                '<div class="menu__item-icon">' + SKULL_SVG + '</div>' +
                '<div class="menu__item-text">Ужасы</div>' +
            '</div>'
        );

        item.on('hover:enter', function () {
            LOG('menu enter, pushing activity');
            Lampa.Activity.push({
                url: '',
                title: 'Ужасы',
                component: 'horror_page',
                page: 1
            });
        });

        list.append(item);
    }

    // ============================================================
    // СТАРТ
    // ============================================================
    function tryAddMenu() {
        if (window.appready) addMenuItem();
    }

    if (window.appready) {
        LOG('appready already set');
        setTimeout(tryAddMenu, 200);
    } else {
        Lampa.Listener.follow('app', function (e) {
            LOG('app event', e.type);
            if (e.type === 'ready') setTimeout(tryAddMenu, 200);
        });
    }

    Lampa.Listener.follow('menu', function (e) {
        if (e.type === 'start') setTimeout(addMenuItem, 60);
    });

    $(document).on('click', '.head__menu', function () {
        setTimeout(addMenuItem, 200);
    });

})();
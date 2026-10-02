(function () {
    'use strict';

    // ============================================================
    // ИКОНКА-ЧЕРЕП
    // ============================================================
    var SKULL_ICON =
        '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">' +
        '<path d="M12 2C8.13 2 5 5.13 5 9c0 1.74.79 3.29 2 4.36V17c0 .55.45 1 1 1h1v2h6v-2h1c.55 0 1-.45 1-1v-3.64c1.21-1.07 2-2.62 2-4.36 0-3.87-3.13-7-7-7zM9.5 13c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm5 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM11 15h2l-1 2-1-2z"/>' +
        '</svg>';

    // ============================================================
    // СТИЛИ
    // ============================================================
    var CSS = `
        /* Отдельный блок в боковом меню */
        .menu__item--horror {
            margin-top: 14px;
            position: relative;
        }
        .menu__item--horror::before {
            content: '';
            position: absolute;
            top: -7px;
            left: 15px;
            right: 15px;
            height: 1px;
            background: linear-gradient(to right, transparent, #8B0000, transparent);
        }
        .menu__item--horror .menu__item-icon {
            color: #ff2a2a;
            filter: drop-shadow(0 0 6px rgba(255, 0, 0, 0.7));
        }
        .menu__item--horror .menu__item-text {
            color: #ff4444;
            font-weight: 600;
            letter-spacing: 1px;
        }

        /* Страница */
        .horror-page {
            background: radial-gradient(ellipse at top, #1a0000 0%, #0a0a0a 60%);
            min-height: 100vh;
            padding: 20px 0 60px;
            color: #e0e0e0;
        }
        .horror-page__title {
            font-size: 30px;
            font-weight: 700;
            color: #ff2a2a;
            text-shadow: 0 0 14px rgba(255, 0, 0, 0.9), 0 0 30px rgba(255, 0, 0, 0.4);
            padding: 0 20px 24px;
            letter-spacing: 3px;
            text-transform: uppercase;
        }

        /* Ряды */
        .horror-row { margin-bottom: 34px; }
        .horror-row__title {
            font-size: 19px;
            font-weight: 600;
            color: #ff4444;
            padding: 0 20px 12px;
            text-shadow: 0 0 8px rgba(255, 0, 0, 0.6);
        }
        .horror-row__scroll {
            display: flex;
            overflow-x: auto;
            padding: 8px 20px 18px;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
        }
        .horror-row__scroll::-webkit-scrollbar { height: 4px; }
        .horror-row__scroll::-webkit-scrollbar-thumb {
            background: #8B0000; border-radius: 4px;
        }

        /* Карточки */
        .horror-card {
            position: relative;
            width: 260px;
            min-width: 260px;
            height: 400px;
            margin-right: 16px;
            border-radius: 12px;
            overflow: hidden;
            background: #1a0000;
            box-shadow: 0 8px 25px rgba(255, 0, 0, 0.25);
            transition: transform 0.35s ease, box-shadow 0.35s ease;
            cursor: pointer;
        }
        .horror-card.focus,
        .horror-card:hover {
            transform: scale(1.06);
            box-shadow: 0 14px 40px rgba(255, 0, 0, 0.7),
                        0 0 0 2px #ff2a2a inset;
        }
        .horror-card__poster {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }
        .horror-card::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(
                to top,
                rgba(60, 0, 0, 0.95) 0%,
                rgba(100, 0, 0, 0.55) 35%,
                transparent 70%
            );
            pointer-events: none;
        }
        /* Кровавые подтёки */
        .horror-card__blood {
            position: absolute;
            left: 0; right: 0; bottom: 0;
            height: 60px;
            background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 60' preserveAspectRatio='none'%3E%3Cpath d='M0 0 Q8 35 16 5 Q24 50 32 8 Q40 55 48 6 Q56 40 64 12 Q72 58 80 4 Q88 45 96 10 Q104 52 112 6 Q120 38 128 14 Q136 60 144 5 Q152 42 160 10 Q168 55 176 7 Q184 40 192 12 Q200 58 208 5 Q216 45 224 9 Q232 52 240 4 L240 60 L0 60 Z' fill='%238B0000' opacity='0.9'/%3E%3C/svg%3E") repeat-x;
            background-size: 240px 60px;
            pointer-events: none;
            z-index: 2;
        }
        .horror-card__info {
            position: absolute;
            bottom: 0; left: 0; right: 0;
            padding: 26px 14px 18px;
            z-index: 3;
        }
        .horror-card__name {
            font-size: 16px;
            font-weight: 600;
            color: #fff;
            text-shadow: 0 2px 8px #000, 0 0 12px rgba(255,0,0,0.6);
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .horror-card__year {
            font-size: 13px;
            color: #ff6b6b;
            text-shadow: 0 1px 4px #000;
        }
    `;
    $('head').append('<style>' + CSS + '</style>');

    // ============================================================
    // TMDB
    // ============================================================
    function tmdb(path, params, success, error) {
        var key = (Lampa.TMDB && Lampa.TMDB.key) ? Lampa.TMDB.key() : Lampa.Storage.field('tmdb_key');
        var lang = Lampa.Storage.field('tmdb_lang') || 'ru';
        var data = $.extend({ api_key: key, language: lang }, params || {});

        $.ajax({
            url: 'https://api.themoviedb.org/3/' + path,
            data: data,
            dataType: 'json',
            success: success,
            error: error || function () {}
        });
    }

    function discover(genres, type, cb) {
        var path = type === 'tv' ? 'discover/tv' : 'discover/movie';
        tmdb(path, {
            with_genres: genres,
            sort_by: 'popularity.desc',
            page: 1
        }, function (data) {
            cb(data && data.results ? data.results : []);
        }, function () { cb([]); });
    }

    // ============================================================
    // КОМПОНЕНТ СТРАНИЦЫ
    // ============================================================
    Lampa.Component.add('horror_page', {
        create: function () {
            this.activity = Lampa.Activity.active();
            this.html = $('<div class="horror-page"></div>');
            return this.html;
        },

        render: function () {
            return this.html;
        },

        start: function () {
            var self = this;
            this.activity.loader(true);

            this.html.empty();
            this.html.append('<div class="horror-page__title">🔥 Ужасы</div>');

            var total = 3, done = 0;
            function done_one() {
                done++;
                if (done >= total) {
                    self.activity.loader(false);
                    self.controller();
                }
            }

            // Ряд 1 — рекомендации (ужасы + триллер)
            discover('27,53', 'movie', function (movies) {
                discover('27,53', 'tv', function (tv) {
                    var all = movies.concat(tv);
                    all.sort(function () { return Math.random() - 0.5; });
                    self.addRow('👹 Рекомендации — Ужасы и Триллер', all.slice(0, 20));
                    done_one();
                });
            });

            // Ряд 2 — фильмы ужасов
            discover('27', 'movie', function (movies) {
                self.addRow('🎬 Фильмы ужасов', movies);
                done_one();
            });

            // Ряд 3 — сериалы ужасов
            discover('27', 'tv', function (tv) {
                self.addRow('📺 Сериалы ужасов', tv);
                done_one();
            });
        },

        addRow: function (title, items) {
            if (!items || !items.length) return;

            var row = $('<div class="horror-row"></div>');
            row.append('<div class="horror-row__title">' + title + '</div>');

            var scroll = $('<div class="horror-row__scroll"></div>');

            items.forEach(function (item) {
                var name = item.title || item.name || '';
                var date = item.release_date || item.first_air_date || '';
                var year = date ? date.substring(0, 4) : '';
                var poster = item.poster_path
                    ? 'https://image.tmdb.org/t/p/w500' + item.poster_path
                    : '';
                var type = item.first_air_date ? 'tv' : 'movie';

                var card = $('<div class="horror-card selector"></div>');
                if (poster) {
                    card.append('<img class="horror-card__poster" src="' + poster + '" loading="lazy">');
                }
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
            this.html.append(row);
        },

        controller: function () {
            var self = this;
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(self.html);
                    Lampa.Controller.collectionFocus(false, self.html);
                },
                left: function () {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                right: function () { Navigator.move('right'); },
                up: function () { if (Navigator.canmove('up')) Navigator.move('up'); },
                down: function () { if (Navigator.canmove('down')) Navigator.move('down'); },
                back: function () { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('content');
        }
    });

    // ============================================================
    // ПУНКТ МЕНЮ
    // ============================================================
    function addMenuItem() {
        var list = $('.menu__list');
        if (!list.length) return;
        if (list.find('[data-action="horror"]').length) return;

        var item = $(
            '<div class="menu__item selector menu__item--horror" data-action="horror">' +
                '<div class="menu__item-icon">' + SKULL_ICON + '</div>' +
                '<div class="menu__item-text">Ужасы</div>' +
            '</div>'
        );

        item.on('hover:enter', function () {
            Lampa.Activity.push({
                title: 'Ужасы',
                component: 'horror_page',
                page: 1
            });
        });

        list.append(item);
    }

    function tryAdd() {
        if (!window.appready) return;
        addMenuItem();
    }

    // На app:ready
    Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') setTimeout(tryAdd, 100);
    });

    // На каждое открытие меню (Lampa перерисовывает список)
    Lampa.Listener.follow('menu', function (e) {
        if (e.type === 'start' || e.type === 'render') {
            setTimeout(tryAdd, 50);
        }
    });

    // На всякий случай — клик по кнопке меню
    $(document).on('click', '.head__menu', function () {
        setTimeout(tryAdd, 150);
    });
})();
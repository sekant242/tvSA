(function () {
    'use strict';

    // ============================================================
    // 1. СТИЛИ (внедряются один раз при загрузке плагина)
    // ============================================================
    var style = document.createElement('style');
    style.textContent = `
        /* Отдельный блок в боковом меню */
        .menu__item--horror {
            margin-top: 12px;
            border-top: 1px solid rgba(255, 0, 0, 0.4);
            padding-top: 12px;
        }

        /* Страница ужасов */
        .horror-page {
            background: #0a0a0a;
            min-height: 100vh;
            padding: 20px 0;
            color: #e0e0e0;
        }

        .horror-page__title {
            font-size: 28px;
            font-weight: 700;
            color: #ff2a2a;
            text-shadow: 0 0 10px rgba(255, 0, 0, 0.8);
            padding: 0 20px 10px;
            letter-spacing: 2px;
            text-transform: uppercase;
        }

        /* Крупные карточки с кровавыми подтёками */
        .horror-card {
            position: relative;
            width: 260px;
            min-width: 260px;
            margin-right: 16px;
            border-radius: 12px;
            overflow: hidden;
            background: #1a0000;
            box-shadow: 0 8px 25px rgba(255, 0, 0, 0.3);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .horror-card:hover {
            transform: scale(1.05);
            box-shadow: 0 12px 35px rgba(255, 0, 0, 0.6);
        }

        .horror-card::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 60%;
            background: linear-gradient(
                to top,
                rgba(139, 0, 0, 0.9) 0%,
                rgba(139, 0, 0, 0.4) 40%,
                transparent 100%
            );
            pointer-events: none;
        }

        /* Кровавые подтёки */
        .horror-card__blood {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 40px;
            background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 40'%3E%3Cpath d='M0 0 Q10 30 20 0 Q30 40 40 0 Q50 35 60 0 Q70 45 80 0 Q90 30 100 0 Q110 50 120 0 Q130 35 140 0 Q150 40 160 0 Q170 30 180 0 Q190 45 200 0 L200 40 L0 40 Z' fill='%238B0000' opacity='0.8'/%3E%3C/svg%3E") repeat-x;
            background-size: 200px 40px;
            pointer-events: none;
            z-index: 2;
        }

        .horror-card__poster {
            width: 100%;
            height: 380px;
            object-fit: cover;
            display: block;
        }

        .horror-card__info {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 20px 14px 18px;
            z-index: 3;
        }

        .horror-card__name {
            font-size: 16px;
            font-weight: 600;
            color: #fff;
            text-shadow: 0 2px 8px #000;
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

        /* Ряды */
        .horror-row {
            margin-bottom: 28px;
        }

        .horror-row__title {
            font-size: 18px;
            font-weight: 600;
            color: #ff4444;
            padding: 0 20px 10px;
            text-shadow: 0 0 6px rgba(255, 0, 0, 0.5);
        }

        .horror-row__scroll {
            display: flex;
            overflow-x: auto;
            padding: 8px 20px 16px;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
        }

        .horror-row__scroll::-webkit-scrollbar {
            height: 4px;
        }

        .horror-row__scroll::-webkit-scrollbar-thumb {
            background: #8B0000;
            border-radius: 4px;
        }
    `;
    document.head.appendChild(style);

    // ============================================================
    // 2. ЗАГРУЗКА ДАННЫХ (TMDB через API Lampa)
    // ============================================================
    var TMDB = {
        key: function () {
            return Lampa.TMDB && Lampa.TMDB.key ? Lampa.TMDB.key() : '';
        },
        url: function (path, params) {
            var base = 'https://api.themoviedb.org/3/' + path;
            var query = [];
            params = params || {};
            params.api_key = this.key();
            params.language = Lampa.Storage.field('tmdb_lang') || 'ru-RU';
            for (var k in params) {
                if (params.hasOwnProperty(k)) {
                    query.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
                }
            }
            return base + '?' + query.join('&');
        }
    };

    function loadMovies(genreIds, type, callback) {
        var path = type === 'tv' ? 'discover/tv' : 'discover/movie';
        var url = TMDB.url(path, {
            with_genres: genreIds,
            sort_by: 'popularity.desc',
            page: 1
        });

        Lampa.Request.get(url, function (data) {
            if (data && data.results) {
                callback(data.results);
            } else {
                callback([]);
            }
        }, function () {
            callback([]);
        });
    }

    // ============================================================
    // 3. РЕГИСТРАЦИЯ КОМПОНЕНТА СТРАНИЦЫ
    // ============================================================
    Lampa.Component.add('horror_page', {
        template: `
            <div class="horror-page">
                <div class="horror-page__title">🔥 УЖАСЫ</div>

                <div class="horror-row">
                    <div class="horror-row__title">👹 Рекомендации (Ужасы и Триллер)</div>
                    <div class="horror-row__scroll" id="horror-rec"></div>
                </div>

                <div class="horror-row">
                    <div class="horror-row__title">🎬 Фильмы ужасов</div>
                    <div class="horror-row__scroll" id="horror-movies"></div>
                </div>

                <div class="horror-row">
                    <div class="horror-row__title">📺 Сериалы ужасов</div>
                    <div class="horror-row__scroll" id="horror-tv"></div>
                </div>
            </div>
        `,
        data: function () {
            return {};
        },
        mounted: function () {
            var self = this;

            // Жанры: 27 = Ужасы, 53 = Триллер
            var horrorThriller = '27,53';

            // Рекомендации: фильмы + сериалы по жанрам ужасы/триллер
            loadMovies(horrorThriller, 'movie', function (movies) {
                loadMovies(horrorThriller, 'tv', function (tv) {
                    var all = movies.concat(tv);
                    all.sort(function () { return Math.random() - 0.5; });
                    self.renderCards('#horror-rec', all.slice(0, 20));
                });
            });

            // Фильмы
            loadMovies('27', 'movie', function (movies) {
                self.renderCards('#horror-movies', movies);
            });

            // Сериалы
            loadMovies('27', 'tv', function (tv) {
                self.renderCards('#horror-tv', tv);
            });
        },
        renderCards: function (selector, items) {
            var container = this.render().find(selector);
            if (!container.length) return;

            container.empty();

            items.forEach(function (item) {
                var title = item.title || item.name || 'Без названия';
                var date = item.release_date || item.first_air_date || '';
                var year = date ? date.substring(0, 4) : '';
                var poster = item.poster_path
                    ? 'https://image.tmdb.org/t/p/w500' + item.poster_path
                    : '';

                var card = $(`
                    <div class="horror-card" data-id="${item.id}">
                        ${poster ? `<img class="horror-card__poster" src="${poster}" alt="${title}">` : ''}
                        <div class="horror-card__blood"></div>
                        <div class="horror-card__info">
                            <div class="horror-card__name">${title}</div>
                            <div class="horror-card__year">${year}</div>
                        </div>
                    </div>
                `);

                card.on('hover:enter', function () {
                    var type = item.first_air_date ? 'tv' : 'movie';
                    Lampa.Activity.push({
                        url: type + '/' + item.id,
                        title: title,
                        component: 'full',
                        id: item.id,
                        source: 'tmdb'
                    });
                });

                container.append(card);
            });
        }
    });

    // ============================================================
    // 4. ДОБАВЛЕНИЕ ПУНКТА В БОКОВОЕ МЕНЮ
    // ============================================================
    function addHorrorMenuItem() {
        if ($('[data-action="horror_menu"]').length) return;

        var icon = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8 2 5 5 5 9c0 2.5 1.5 4.5 3 6 1 1 2 2.5 2 4h4c0-1.5 1-3 2-4 1.5-1.5 3-3.5 3-6 0-4-3-7-7-7z" fill="#ff2a2a"/>
                <path d="M12 6c-1.5 0-3 1-3 3s1.5 3 3 3 3-1 3-3-1.5-3-3-3z" fill="#0a0a0a"/>
            </svg>
        `;

        var button = $(`
            <div class="menu__item menu__item--horror" data-action="horror_menu">
                <div class="menu__item-icon">${icon}</div>
                <div class="menu__item-text">Ужасы</div>
            </div>
        `);

        button.on('hover:enter', function () {
            Lampa.Activity.push({
                title: 'Ужасы',
                component: 'horror_page',
                page: 1
            });
        });

        var menu = Lampa.Menu.render();
        var lastItem = menu.find('.menu__item').last();
        if (lastItem.length) {
            lastItem.after(button);
        } else {
            menu.append(button);
        }

        // Переинициализация навигации по меню
        if (Lampa.Menu.init) {
            Lampa.Menu.init();
        }
    }

    // ============================================================
    // 5. ЗАПУСК
    // ============================================================
    function startPlugin() {
        window.plugin_horror_ready = true;

        if (window.appready) {
            addHorrorMenuItem();
        } else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type === 'ready') {
                    addHorrorMenuItem();
                }
            });
        }
    }

    if (!window.plugin_horror_ready) {
        startPlugin();
    }
})();
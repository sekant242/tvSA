(function () {
    'use strict';

    if (!window.Lampa || !window.Lampa.Listener) return;

    var HORROR_ID = 27;

    // ============ ИКОНКИ ============
    var icon_horror = '<svg width="39" height="39" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.5 2 6.5 4.5 6.5 7.5C6.5 9 7 10 7.5 10.7C6.7 11 6 11.7 6 12.5V19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V12.5C18 11.7 17.3 11 16.5 10.7C17 10 17.5 9 17.5 7.5C17.5 4.5 15.5 2 12 2ZM9 8C8.4 8 8 7.6 8 7C8 6.4 8.4 6 9 6C9.6 6 10 6.4 10 7C10 7.6 9.6 8 9 8ZM15 8C14.4 8 14 7.6 14 7C14 6.4 14.4 6 15 6C15.6 6 16 6.4 16 7C16 7.6 15.6 8 15 8ZM12 17L8.5 13.5H15.5L12 17Z" fill="currentColor"/></svg>';

    // ============ ПОДЖАНРЫ (30+) ============
    // kw — ключевые слова TMDB (через | = OR), genres — жанры TMDB
    var subgenres = [
        { title: '🔪 Слэшер',              kw: '10541' },
        { title: '🧟 Зомби-апокалипсис',   kw: '12377' },
        { title: '🧛 Вампиры',              kw: '3133' },
        { title: '🐺 Оборотни',             kw: '12564' },
        { title: '👻 Призраки',             kw: '6152' },
        { title: '😈 Одержимость дьяволом', kw: '11124' },
        { title: '✝️ Экзорцизм',            kw: '165417' },
        { title: '🧙 Ведьмы и колдовство',  kw: '12565' },
        { title: '🔮 Оккультизм',           kw: '10909' },
        { title: '🏚️ Дом с привидениями',   kw: '3165' },
        { title: '👹 Монстры',              kw: '1299' },
        { title: '🦴 Каннибалы',            kw: '10994' },
        { title: '🩸 Маньяки и психопаты',  kw: '10714' },
        { title: '🕯️ Культы и секты',       kw: '10947' },
        { title: '📹 Найденная плёнка',     kw: '163053' },
        { title: '🧬 Телесный ужас',        kw: '172407' },
        { title: '🌌 Космический ужас',     kw: '230502' },
        { title: '🌿 Фолк-хоррор',          kw: '229932' },
        { title: '🎨 Джалло',               kw: '159361' },
        { title: '🌊 Морской ужас',         kw: '10541|12377|1299' },
        { title: '🐍 Рептилии и змеи',      kw: '1299' },
        { title: '🎃 Хэллоуин',             kw: '207317' },
        { title: '🎄 Рождественский хоррор', kw: '207317' },
        { title: '🚸 Студенческий хоррор',  kw: '10873' },
        { title: '🏥 Больничный хоррор',    kw: '163053' },
        { title: '🛸 Хоррор + фантастика',  genres: '27,878' },
        { title: '🕵️ Хоррор + триллер',     genres: '27,53' },
        { title: '🔍 Хоррор + детектив',    genres: '27,9648' },
        { title: '🧚 Хоррор + фэнтези',     genres: '27,14' },
        { title: '🚔 Хоррор + криминал',    genres: '27,80' },
        { title: '😅 Хоррор-комедия',       genres: '27,35' },
        { title: '⚔️ Хоррор + боевик',      genres: '27,28' },
        { title: '🎭 Мистический триллер',  genres: '27,53,9648' },
        { title: '🧟 Зомби-комедия',        genres: '27,35,12377' }
    ];

    // ============ СТРАНЫ ============
    var countries = [
        { title: '🇺🇸 США',                 code: 'US' },
        { title: '🇬🇧 Великобритания',      code: 'GB' },
        { title: '🇯🇵 Япония',              code: 'JP' },
        { title: '🇰🇷 Южная Корея',         code: 'KR' },
        { title: '🇫🇷 Франция',             code: 'FR' },
        { title: '🇮🇹 Италия',              code: 'IT' },
        { title: '🇪🇸 Испания',             code: 'ES' },
        { title: '🇩🇪 Германия',            code: 'DE' },
        { title: '🇷🇺 Россия',              code: 'RU' },
        { title: '🇸🇪 Швеция',              code: 'SE' },
        { title: '🇩🇰 Дания',               code: 'DK' },
        { title: '🇳🇴 Норвегия',            code: 'NO' },
        { title: '🇫🇮 Финляндия',           code: 'FI' },
        { title: '🇦🇺 Австралия',           code: 'AU' },
        { title: '🇨🇦 Канада',              code: 'CA' },
        { title: '🇲🇽 Мексика',             code: 'MX' },
        { title: '🇧🇷 Бразилия',            code: 'BR' },
        { title: '🇦🇷 Аргентина',           code: 'AR' },
        { title: '🇹🇷 Турция',              code: 'TR' },
        { title: '🇮🇳 Индия',               code: 'IN' },
        { title: '🇹🇭 Таиланд',             code: 'TH' },
        { title: '🇨🇳 Китай',               code: 'CN' },
        { title: '🇭🇰 Гонконг',             code: 'HK' },
        { title: '🇵🇱 Польша',              code: 'PL' },
        { title: '🇨🇿 Чехия',               code: 'CZ' },
        { title: '🇳🇱 Нидерланды',          code: 'NL' },
        { title: '🇧🇪 Бельгия',             code: 'BE' },
        { title: '🇦🇹 Австрия',             code: 'AT' },
        { title: '🇨🇭 Швейцария',           code: 'CH' },
        { title: '🇮🇪 Ирландия',            code: 'IE' }
    ];

    // ============ CSS: КРОВАВЫЕ ПОДТЁКИ ============
    var CSS = ''
        + '/* Кровавые подтёки на карточках в разделах ужасов */'
        + '.items-line--type-horror .card .card__view { position: relative; }'
        + '.items-line--type-horror .card .card__view::after {'
        +   'content: "";'
        +   'position: absolute; top: 0; left: 0; right: 0; height: 100%;'
        +   'background-image: url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 40\' preserveAspectRatio=\'none\'%3E%3Cpath d=\'M0,0 L100,0 L100,5 L94,5 Q93,20 89,25 Q85,20 84,5 L74,5 Q73,25 69,35 Q65,25 64,5 L54,5 Q53,18 49,22 Q45,18 44,5 L34,5 Q33,22 29,30 Q25,22 24,5 L14,5 Q13,15 9,18 Q5,15 4,5 L0,5 Z\' fill=\'%238b0000\'/%3E%3C/svg%3E");'
        +   'background-size: 100% 35%;'
        +   'background-position: top center;'
        +   'background-repeat: no-repeat;'
        +   'pointer-events: none; z-index: 6;'
        +   'filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));'
        + '}'
        + '/* Лёгкое красное свечение на карточках ужасов */'
        + '.items-line--type-horror .card .card__view::before {'
        +   'content: "";'
        +   'position: absolute; top: 0; left: 0; right: 0; bottom: 0;'
        +   'box-shadow: inset 0 0 12px rgba(139,0,0,0.55), inset 0 0 30px rgba(139,0,0,0.2);'
        +   'pointer-events: none; z-index: 5;'
        + '}'
        + '/* Модалка "Испугай меня" */'
        + '.scare-modal { display: flex; gap: 1em; align-items: flex-start; }'
        + '.scare-modal__poster { flex-shrink: 0; width: 10em; }'
        + '.scare-modal__poster img { width: 100%; border-radius: 0.5em; display: block; }'
        + '.scare-modal__body { flex: 1; min-width: 0; }'
        + '.scare-modal__title { font-size: 1.4em; font-weight: 600; margin-bottom: 0.4em; }'
        + '.scare-modal__meta { font-size: 0.95em; opacity: 0.65; margin-bottom: 0.8em; }'
        + '.scare-modal__descr { font-size: 0.95em; line-height: 1.4; opacity: 0.85; max-height: 12em; overflow: hidden; }'
        + '@media (max-width: 480px) {'
        +   '.scare-modal { flex-direction: column; }'
        +   '.scare-modal__poster { width: 100%; max-width: 12em; margin: 0 auto; }'
        + '}';

    function injectCSS() {
        if (document.getElementById('horror-plugin-css')) return;
        var style = document.createElement('style');
        style.id = 'horror-plugin-css';
        style.type = 'text/css';
        style.appendChild(document.createTextNode(CSS));
        document.head.appendChild(style);
    }

    // ============ ЗАПУСК КАТЕГОРИИ ============
    function pushCategory(opts) {
        var params = {
            url: opts.url || 'discover/movie',
            title: opts.title,
            component: 'category_full',
            source: 'tmdb',
            page: 1
        };
        if (opts.genres)   params.genres = opts.genres;
        if (opts.keywords) params.keywords = opts.keywords;
        if (opts.filter)   params.filter = opts.filter;
        Lampa.Activity.push(params);
    }

    function pushSubgenre(sub) {
        var opts = { title: sub.title };
        if (sub.kw)     opts.keywords = sub.kw;
        if (sub.genres) {
            // Жанры через запятую = AND
            opts.genres = sub.genres;
            // Если в строке жанров уже есть 27 — не дублируем
        } else {
            opts.genres = String(HORROR_ID);
        }
        pushCategory(opts);
    }

    function pushCountry(country) {
        pushCategory({
            title: 'Ужасы — ' + country.title,
            genres: String(HORROR_ID),
            filter: { with_origin_country: country.code, 'vote_count.gte': 20 }
        });
    }

    // ============ ИСПУГАЙ МЕНЯ ============
    var scarePool = [];
    var scareLoading = false;
    // "Реально страшные" ключевые слова (OR): одержимость, экзорцизм, оккультизм,
    // дом с привидениями, призраки, демоны, зомби, оборотни, каннибалы, секты,
    // телесный/космический/фолк-ужас
    var SCARY_KEYWORDS = '11124|165417|10909|3165|6152|209918|12377|12564|10994|10947|172407|230502|229932|10714|10541';
    // Отсекаем комедии, семейное, анимацию, романтику, детское, новости, реалити
    var WITHOUT_GENRES = '35,10751,16,10749,10762,10763,10764,10767,10768,99';

    function scareMe() {
        if (scareLoading) return;

        if (scarePool.length > 1) {
            showScareCard();
            return;
        }

        scareLoading = true;
        Lampa.Loading.start(function () {
            Lampa.Loading.stop();
            scareLoading = false;
        });

        // Случайная страница из топ-5, чтобы не одно и то же
        var page = 1 + Math.floor(Math.random() * 3);

        Lampa.Api.sources.tmdb.get('discover/movie', {
            genres: String(HORROR_ID),
            sort_by: 'vote_average.desc',
            page: page,
            filter: {
                without_genres: WITHOUT_GENRES,
                with_keywords: SCARY_KEYWORDS,
                'vote_average.gte': 6.5,
                'vote_count.gte': 500
            }
        }, function (data) {
            Lampa.Loading.stop();
            scareLoading = false;

            scarePool = (data.results || []).filter(function (m) {
                return m.vote_average >= 6.5 && m.poster_path;
            });

            if (!scarePool.length) {
                Lampa.Noty.show('Не нашёл ничего страшного, попробуй ещё раз');
                return;
            }
            showScareCard();
        }, function () {
            Lampa.Loading.stop();
            scareLoading = false;
            Lampa.Noty.show('Ошибка загрузки');
        });
    }

    function showScareCard() {
        if (!scarePool.length) return;
        var idx = Math.floor(Math.random() * scarePool.length);
        var movie = scarePool[idx];
        // Убираем уже показанный, чтобы не зациклиться
        scarePool.splice(idx, 1);

        var poster = movie.poster_path
            ? Lampa.Api.img(movie.poster_path, 'w300')
            : './img/img_broken.svg';
        var year = ((movie.release_date || '') + '').slice(0, 4);
        var rating = parseFloat((movie.vote_average || 0) + '').toFixed(1);

        var html = $('<div class="scare-modal"></div>');
        html.append('<div class="scare-modal__poster"><img src="' + poster + '" alt=""/></div>');
        html.append(
            '<div class="scare-modal__body">' +
                '<div class="scare-modal__title">' + (movie.title || movie.original_title || '---') + '</div>' +
                '<div class="scare-modal__meta">' + (year || '----') + ' &nbsp;•&nbsp; ★ ' + rating + '</div>' +
                '<div class="scare-modal__descr">' + (movie.overview || 'Без описания') + '</div>' +
            '</div>'
        );

        if (!movie.source) movie.source = 'tmdb';

        Lampa.Modal.open({
            title: '🎃 Тебе будет страшно...',
            html: html,
            size: 'medium',
            scroll: { nopadding: false },
            buttons: [
                {
                    name: '▶ Смотреть',
                    onSelect: function () {
                        Lampa.Modal.close();
                        Lampa.Activity.push({
                            url: '',
                            component: 'full',
                            id: movie.id,
                            method: 'movie',
                            card: movie,
                            source: 'tmdb'
                        });
                    }
                },
                {
                    name: '🎲 Ещё один',
                    onSelect: function () {
                        Lampa.Modal.close();
                        setTimeout(function () {
                            if (!scarePool.length) scareMe();
                            else showScareCard();
                        }, 150);
                    }
                },
                {
                    name: 'Закрыть',
                    onSelect: function () {
                        Lampa.Modal.close();
                        Lampa.Controller.toggle('content');
                    }
                }
            ],
            onBack: function () {
                Lampa.Modal.close();
                Lampa.Controller.toggle('content');
            }
        });
    }

    // ============ ГЛАВНОЕ МЕНЮ ============
    function openMainMenu() {
        var items = [
            { title: '👻 Испугай меня', subtitle: 'Случайный по-настоящему страшный фильм', action: 'scare', selected: true },
            { title: '🔥 Популярные ужасы', action: 'popular' },
            { title: '🏆 Лучшие ужасы', action: 'top' },
            { title: '🆕 Новинки', action: 'new' },
            { title: '📺 Сериалы ужасов', action: 'tv' },
            { separator: true, title: 'Навигация' },
            { title: '🎭 Поджанры', subtitle: subgenres.length + ' поджанров', action: 'subgenres' },
            { title: '🌍 По странам', subtitle: countries.length + ' стран', action: 'countries' }
        ];

        Lampa.Select.show({
            title: 'Ужасы',
            items: items,
            onSelect: function (item) {
                handleMenuAction(item.action);
            },
            onBack: function () {
                Lampa.Controller.toggle('content');
            }
        });
    }

    function handleMenuAction(action) {
        if (action === 'scare') {
            scareMe();
            return;
        }
        if (action === 'subgenres') {
            openSubgenres();
            return;
        }
        if (action === 'countries') {
            openCountries();
            return;
        }
        if (action === 'popular') {
            pushCategory({
                title: 'Популярные ужасы',
                genres: String(HORROR_ID),
                filter: { sort_by: 'popularity.desc', 'vote_count.gte': 50 }
            });
            return;
        }
        if (action === 'top') {
            pushCategory({
                title: 'Лучшие ужасы',
                genres: String(HORROR_ID),
                filter: { sort_by: 'vote_average.desc', 'vote_count.gte': 500, 'vote_average.gte': 7 }
            });
            return;
        }
        if (action === 'new') {
            var d = new Date();
            d.setFullYear(d.getFullYear() - 1);
            pushCategory({
                title: 'Новые ужасы',
                genres: String(HORROR_ID),
                filter: {
                    sort_by: 'primary_release_date.desc',
                    'primary_release_date.gte': d.toISOString().slice(0, 10),
                    'vote_count.gte': 10
                }
            });
            return;
        }
        if (action === 'tv') {
            pushCategory({
                title: 'Сериалы ужасов',
                url: 'discover/tv',
                genres: String(HORROR_ID),
                filter: { sort_by: 'popularity.desc', 'vote_count.gte': 50 }
            });
            return;
        }
    }

    function openSubgenres() {
        var items = subgenres.map(function (s) {
            return { title: s.title, sub: s };
        });
        Lampa.Select.show({
            title: 'Поджанры ужасов',
            items: items,
            onSelect: function (item) {
                Controller_toggleContent();
                setTimeout(function () {
                    pushSubgenre(item.sub);
                }, 100);
            },
            onBack: function () {
                setTimeout(openMainMenu, 100);
            }
        });
    }

    function openCountries() {
        var items = countries.map(function (c) {
            return { title: c.title, country: c };
        });
        Lampa.Select.show({
            title: 'Ужасы по странам',
            items: items,
            onSelect: function (item) {
                Controller_toggleContent();
                setTimeout(function () {
                    pushCountry(item.country);
                }, 100);
            },
            onBack: function () {
                setTimeout(openMainMenu, 100);
            }
        });
    }

    function Controller_toggleContent() {
        try {
            var enabled = Lampa.Controller.enabled();
            if (enabled && enabled.name === 'select') {
                Lampa.Controller.toggle('content');
            }
        } catch (e) {}
    }

    // ============ КНОПКА В МЕНЮ ============
    function addMenuButton() {
        if ($('.menu__item[data-action="horror_plugin"]').length) return;
        Lampa.Menu.addButton(icon_horror, 'Ужасы', openMainMenu)
            .attr('data-action', 'horror_plugin');
    }

    // ============ СТРОКИ НА ГЛАВНОЙ (с типом 'horror' для кровавых подтёков) ============
    function makeRow(name, title, url, filters, extra) {
        Lampa.ContentRows.add({
            name: name,
            title: title,
            index: 2,
            screen: ['main'],
            call: function (params, screen) {
                if (screen !== 'main') return;

                return function (callback) {
                    var req = {
                        genres: String(HORROR_ID),
                        sort_by: filters.sort_by,
                        filter: filters
                    };
                    Lampa.Api.sources.tmdb.get(url, req, function (data) {
                        data.title = title;
                        data.results = (data.results || []).filter(function (m) {
                            if (!m.source) m.source = 'tmdb';
                            return true;
                        });
                        // МАГИЯ: помечаем линию типом 'horror' — CSS навесит кровавые подтёки
                        data.params = { type: 'horror' };
                        callback(data);
                    }, function () {
                        callback({ results: [], title: title, params: { type: 'horror' } });
                    }, { life: 60 * 6 });
                };
            }
        });
    }

    function addContentRows() {
        // Популярные ужасы
        makeRow(
            'horror_plugin_popular',
            '🔥 Популярные ужасы',
            'discover/movie',
            { sort_by: 'popularity.desc', 'vote_count.gte': 100 }
        );
        // Лучшие ужасы
        makeRow(
            'horror_plugin_top',
            '🏆 Лучшие ужасы',
            'discover/movie',
            { sort_by: 'vote_average.desc', 'vote_count.gte': 500, 'vote_average.gte': 7 }
        );
        // Новые ужасы
        var d = new Date();
        d.setFullYear(d.getFullYear() - 1);
        makeRow(
            'horror_plugin_new',
            '🆕 Новые ужасы',
            'discover/movie',
            {
                sort_by: 'primary_release_date.desc',
                'primary_release_date.gte': d.toISOString().slice(0, 10),
                'vote_count.gte': 20
            }
        );
        // Реально страшные (те же фильтры, что и у "Испугай меня")
        makeRow(
            'horror_plugin_scary',
            '👻 Реально страшные',
            'discover/movie',
            {
                sort_by: 'vote_average.desc',
                without_genres: WITHOUT_GENRES,
                with_keywords: SCARY_KEYWORDS,
                'vote_average.gte': 6.5,
                'vote_count.gte': 500
            }
        );
        // Азиатский хоррор
        makeRow(
            'horror_plugin_asia',
            '🇯🇵 Азиатский хоррор',
            'discover/movie',
            {
                sort_by: 'vote_average.desc',
                with_origin_country: 'JP|KR|HK|TH|CN',
                'vote_count.gte': 100,
                'vote_average.gte': 6
            }
        );
    }

    // ============ СТАРТ ============
    function start() {
        injectCSS();
        addMenuButton();
        addContentRows();
        console.log('Horror plugin', 'started');
    }

    // Обновляем кнопку меню при перезапуске
    Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') {
            setTimeout(addMenuButton, 500);
        }
    });

    // Первый запуск
    if (window.appready) {
        start();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }

})();
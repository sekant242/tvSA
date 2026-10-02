(function () {
    'use strict';

    if (!window.Lampa || !window.Lampa.Listener) return;

    var HORROR_ID = 27;

    // ============ ИКОНКИ ============
    var icon_horror = '<svg width="39" height="39" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.5 2 6.5 4.5 6.5 7.5C6.5 9 7 10 7.5 10.7C6.7 11 6 11.7 6 12.5V19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V12.5C18 11.7 17.3 11 16.5 10.7C17 10 17.5 9 17.5 7.5C17.5 4.5 15.5 2 12 2ZM9 8C8.4 8 8 7.6 8 7C8 6.4 8.4 6 9 6C9.6 6 10 6.4 10 7C10 7.6 9.6 8 9 8ZM15 8C14.4 8 14 7.6 14 7C14 6.4 14.4 6 15 6C15.6 6 16 6.4 16 7C16 7.6 15.6 8 15 8ZM12 17L8.5 13.5H15.5L12 17Z" fill="currentColor"/></svg>';

    // ============ ПОДЖАНРЫ ============
    var subgenres = [
        { title: '🔪 Слэшер',                kw: '10541' },
        { title: '🧟 Зомби-апокалипсис',     kw: '12377' },
        { title: '🧛 Вампиры',                kw: '3133' },
        { title: '🐺 Оборотни',               kw: '12564' },
        { title: '👻 Призраки',               kw: '6152' },
        { title: '😈 Одержимость дьяволом',   kw: '11124' },
        { title: '✝️ Экзорцизм',              kw: '165417' },
        { title: '🧙 Ведьмы и колдовство',    kw: '12565' },
        { title: '🔮 Оккультизм',             kw: '10909' },
        { title: '🏚️ Дом с привидениями',     kw: '3165' },
        { title: '👹 Монстры',                kw: '1299' },
        { title: '🦴 Каннибалы',              kw: '10994' },
        { title: '🩸 Маньяки и психопаты',    kw: '10714' },
        { title: '🕯️ Культы и секты',         kw: '10947' },
        { title: '📹 Найденная плёнка',       kw: '163053' },
        { title: '🧬 Телесный ужас',          kw: '172407' },
        { title: '🌌 Космический ужас',       kw: '230502' },
        { title: '🌿 Фолк-хоррор',            kw: '229932' },
        { title: '🎨 Джалло',                 kw: '159361' },
        { title: '🐍 Рептилии и змеи',        kw: '1299' },
        { title: '🎃 Хэллоуин',               kw: '207317' },
        { title: '🎄 Рождественский хоррор',  kw: '207317' },
        { title: '🚸 Студенческий хоррор',    kw: '10873' },
        { title: '🏥 Больничный хоррор',      kw: '163053' },
        { title: '🛸 Хоррор + фантастика',    genres: '27,878' },
        { title: '🕵️ Хоррор + триллер',       genres: '27,53' },
        { title: '🔍 Хоррор + детектив',      genres: '27,9648' },
        { title: '🧚 Хоррор + фэнтези',       genres: '27,14' },
        { title: '🚔 Хоррор + криминал',      genres: '27,80' },
        { title: '😅 Хоррор-комедия',         genres: '27,35' },
        { title: '⚔️ Хоррор + боевик',        genres: '27,28' },
        { title: '🎭 Мистический триллер',    genres: '27,53,9648' },
        { title: '🧟 Зомби-комедия',          genres: '27,35,12377' }
    ];

    // ============ СТРАНЫ ============
    var countries = [
        { title: '🇺🇸 США',            code: 'US' },
        { title: '🇬🇧 Великобритания', code: 'GB' },
        { title: '🇯🇵 Япония',         code: 'JP' },
        { title: '🇰🇷 Южная Корея',    code: 'KR' },
        { title: '🇫🇷 Франция',        code: 'FR' },
        { title: '🇮🇹 Италия',         code: 'IT' },
        { title: '🇪🇸 Испания',        code: 'ES' },
        { title: '🇩🇪 Германия',       code: 'DE' },
        { title: '🇷🇺 Россия',         code: 'RU' },
        { title: '🇸🇪 Швеция',         code: 'SE' },
        { title: '🇩🇰 Дания',          code: 'DK' },
        { title: '🇳🇴 Норвегия',       code: 'NO' },
        { title: '🇫🇮 Финляндия',      code: 'FI' },
        { title: '🇦🇺 Австралия',      code: 'AU' },
        { title: '🇨🇦 Канада',         code: 'CA' },
        { title: '🇲🇽 Мексика',        code: 'MX' },
        { title: '🇧🇷 Бразилия',       code: 'BR' },
        { title: '🇦🇷 Аргентина',      code: 'AR' },
        { title: '🇹🇷 Турция',         code: 'TR' },
        { title: '🇮🇳 Индия',          code: 'IN' },
        { title: '🇹🇭 Таиланд',        code: 'TH' },
        { title: '🇨🇳 Китай',          code: 'CN' },
        { title: '🇭🇰 Гонконг',        code: 'HK' },
        { title: '🇵🇱 Польша',         code: 'PL' },
        { title: '🇨🇿 Чехия',          code: 'CZ' },
        { title: '🇳🇱 Нидерланды',     code: 'NL' },
        { title: '🇧🇪 Бельгия',        code: 'BE' },
        { title: '🇦🇹 Австрия',        code: 'AT' },
        { title: '🇨🇭 Швейцария',      code: 'CH' },
        { title: '🇮🇪 Ирландия',       code: 'IE' }
    ];

    // ============ ФИЛЬТР "ИСПУГАЙ МЕНЯ" ============
    var SCARY_KEYWORDS = '11124|165417|10909|3165|6152|209918|12377|12564|10994|10947|172407|230502|229932|10714|10541';
    var WITHOUT_GENRES = '35,10751,16,10749,10762,10763,10764,10767,10768,99';

    // ============ CSS ============
    var CSS = ''
        // Кровавые подтёки на карточках
        + '.items-line--type-horror .card .card__view { position: relative; }'
        + '.items-line--type-horror .card .card__view::after {'
        +   'content: ""; position: absolute; top: 0; left: 0; right: 0; height: 100%;'
        +   'background-image: url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 40\' preserveAspectRatio=\'none\'%3E%3Cpath d=\'M0,0 L100,0 L100,5 L94,5 Q93,20 89,25 Q85,20 84,5 L74,5 Q73,25 69,35 Q65,25 64,5 L54,5 Q53,18 49,22 Q45,18 44,5 L34,5 Q33,22 29,30 Q25,22 24,5 L14,5 Q13,15 9,18 Q5,15 4,5 L0,5 Z\' fill=\'%238b0000\'/%3E%3C/svg%3E");'
        +   'background-size: 100% 35%; background-position: top center; background-repeat: no-repeat;'
        +   'pointer-events: none; z-index: 6; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));'
        + '}'
        + '.items-line--type-horror .card .card__view::before {'
        +   'content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0;'
        +   'box-shadow: inset 0 0 12px rgba(139,0,0,0.55), inset 0 0 30px rgba(139,0,0,0.2);'
        +   'pointer-events: none; z-index: 5;'
        + '}'
        // Шапка страницы "Ужасы"
        + '.horror-page { padding: 0 0 2em 0; }'
        + '.horror-header {'
        +   'padding: 1.2em 1.5em 0.6em; display: flex; gap: 0.7em; flex-wrap: wrap; align-items: center;'
        + '}'
        + '.horror-header__title {'
        +   'width: 100%; font-size: 2em; font-weight: 700; letter-spacing: 0.02em;'
        +   'color: #d63a3a; text-shadow: 0 0 0.6em rgba(214,58,58,0.35); margin-bottom: 0.2em;'
        +   'font-family: "Times New Roman", serif; font-style: italic;'
        + '}'
        + '.horror-header__subtitle {'
        +   'width: 100%; font-size: 0.95em; opacity: 0.6; margin-bottom: 0.8em;'
        + '}'
        + '.horror-header__btn {'
        +   'padding: 0.7em 1.2em; background: linear-gradient(180deg, rgba(139,0,0,0.75) 0%, rgba(80,0,0,0.85) 100%);'
        +   'border-radius: 0.6em; font-weight: 600; font-size: 1em; cursor: pointer;'
        +   'border: 1px solid rgba(200,40,40,0.4); transition: all 0.2s ease;'
        +   'color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.6);'
        + '}'
        + '.horror-header__btn.focus {'
        +   'background: linear-gradient(180deg, rgba(200,30,30,0.95) 0%, rgba(120,0,0,1) 100%);'
        +   'transform: scale(1.06); box-shadow: 0 0 1.2em rgba(220,30,30,0.6);'
        +   'border-color: rgba(255,80,80,0.8);'
        + '}'
        + '.horror-header__btn--scare {'
        +   'background: linear-gradient(180deg, rgba(180,20,60,0.85) 0%, rgba(90,0,30,0.95) 100%);'
        +   'border-color: rgba(255,60,100,0.5);'
        + '}'
        + '.horror-header__btn--scare.focus {'
        +   'background: linear-gradient(180deg, rgba(230,40,80,1) 0%, rgba(130,0,40,1) 100%);'
        +   'box-shadow: 0 0 1.4em rgba(255,50,90,0.7);'
        + '}'
        // Модалка "Испугай меня"
        + '.scare-modal { display: flex; gap: 1em; align-items: flex-start; }'
        + '.scare-modal__poster { flex-shrink: 0; width: 10em; }'
        + '.scare-modal__poster img { width: 100%; border-radius: 0.5em; display: block; box-shadow: 0 0 1.5em rgba(180,0,0,0.5); }'
        + '.scare-modal__body { flex: 1; min-width: 0; }'
        + '.scare-modal__title { font-size: 1.4em; font-weight: 600; margin-bottom: 0.4em; }'
        + '.scare-modal__meta { font-size: 0.95em; opacity: 0.65; margin-bottom: 0.8em; }'
        + '.scare-modal__descr { font-size: 0.95em; line-height: 1.4; opacity: 0.85; max-height: 14em; overflow: hidden; }'
        + '@media (max-width: 480px) {'
        +   '.scare-modal { flex-direction: column; }'
        +   '.scare-modal__poster { width: 100%; max-width: 12em; margin: 0 auto; }'
        +   '.horror-header__title { font-size: 1.5em; }'
        + '}';

    function injectCSS() {
        if (document.getElementById('horror-plugin-css')) return;
        var s = document.createElement('style');
        s.id = 'horror-plugin-css';
        s.type = 'text/css';
        s.appendChild(document.createTextNode(CSS));
        document.head.appendChild(s);
    }

    // ============ ОБЩИЕ ХЕЛПЕРЫ ============
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
        if (sub.genres) opts.genres = sub.genres;
        else            opts.genres = String(HORROR_ID);
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

    function scareMe() {
        if (scareLoading) return;
        if (scarePool.length > 1) return showScareCard();

        scareLoading = true;
        Lampa.Loading.start(function () { Lampa.Loading.stop(); scareLoading = false; });
        Lampa.Loading.setText('Ищу что-то по-настоящему страшное...');

        var page = 1 + Math.floor(Math.random() * 3);

        Lampa.Api.sources.tmdb.get('discover/movie', {
            genres: String(HORROR_ID),
            page: page,
            filter: {
                sort_by: 'vote_average.desc',
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
        scarePool.splice(idx, 1);

        var poster = movie.poster_path ? Lampa.Api.img(movie.poster_path, 'w300') : './img/img_broken.svg';
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

        var enabled = Lampa.Controller.enabled().name;

        Lampa.Modal.open({
            title: '🎃 Тебе будет страшно...',
            html: html,
            size: 'medium',
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
                        Lampa.Controller.toggle(enabled);
                    }
                }
            ],
            onBack: function () {
                Lampa.Modal.close();
                Lampa.Controller.toggle(enabled);
            }
        });
    }

    // ============ ВЫПАДАЮЩИЕ МЕНЮ ============
    function openSubgenres(back) {
        var items = subgenres.map(function (s) { return { title: s.title, sub: s }; });
        var enabled = Lampa.Controller.enabled().name;
        Lampa.Select.show({
            title: '🎭 Поджанры ужасов',
            items: items,
            onSelect: function (item) {
                Lampa.Controller.toggle(enabled);
                setTimeout(function () { pushSubgenre(item.sub); }, 100);
            },
            onBack: function () {
                Lampa.Controller.toggle(enabled);
                if (back) setTimeout(back, 100);
            }
        });
    }

    function openCountries(back) {
        var items = countries.map(function (c) { return { title: c.title, country: c }; });
        var enabled = Lampa.Controller.enabled().name;
        Lampa.Select.show({
            title: '🌍 Ужасы по странам',
            items: items,
            onSelect: function (item) {
                Lampa.Controller.toggle(enabled);
                setTimeout(function () { pushCountry(item.country); }, 100);
            },
            onBack: function () {
                Lampa.Controller.toggle(enabled);
                if (back) setTimeout(back, 100);
            }
        });
    }

    // ============ КОМПОНЕНТ СТРАНИЦЫ "УЖАСЫ" ============
    function HorrorPage(object) {
        var self = this;
        var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var html = document.createElement('div');
        html.className = 'horror-page';
        var body = document.createElement('div');
        var header = null;
        var rows = [];          // массив Line-экземпляров
        var active = 0;         // 0 = header, 1..N = строки фильмов
        var last = null;
        var loading_now = false;

        // ---------- HEADER ----------
        function buildHeader() {
            var h = document.createElement('div');
            h.className = 'horror-header layer--visible layer--render';

            var title = document.createElement('div');
            title.className = 'horror-header__title';
            title.textContent = 'Ужасы';
            h.appendChild(title);

            var subtitle = document.createElement('div');
            subtitle.className = 'horror-header__subtitle';
            subtitle.textContent = 'Найди свой самый страшный фильм';
            h.appendChild(subtitle);

            function mkBtn(label, cls, handler) {
                var b = document.createElement('div');
                b.className = 'horror-header__btn selector ' + (cls || '');
                b.textContent = label;
                b.addEventListener('hover:enter', handler);
                h.appendChild(b);
                return b;
            }

            mkBtn('👻 Испугай меня', 'horror-header__btn--scare', function () {
                scareMe();
            });

            mkBtn('🎭 Поджанры', '', function () {
                openSubgenres(function () {
                    Lampa.Controller.toggle('content');
                    self.toggleActive();
                });
            });

            mkBtn('🌍 По странам', '', function () {
                openCountries(function () {
                    Lampa.Controller.toggle('content');
                    self.toggleActive();
                });
            });

            return h;
        }

        // ---------- СОЗДАНИЕ СТРОКИ ----------
        function makeLine(data, opts) {
            opts = opts || {};
            data.params = data.params || {};
            data.params.type = 'horror'; // ← кровавые подтёки!

            var line = Lampa.Maker.make('Line', data);

            // навигация вверх/вниз пробрасывается наружу
            line.use({
                onDown: function () { self.down(); },
                onUp: function () { self.up(); },
                onBack: function () { Lampa.Activity.backward(); }
            });

            // подписка на создание карточек
            line.use({
                onInstance: function (item, element) {
                    item.use({
                        onEnter: function () {
                            if (!element.source) element.source = 'tmdb';
                            Lampa.Activity.push({
                                url: '',
                                component: 'full',
                                id: element.id,
                                method: element.name || element.original_name ? 'tv' : 'movie',
                                card: element,
                                source: element.source
                            });
                        },
                        onFocus: function () {
                            Lampa.Background.change(Lampa.Utils.cardImgBackground(element));
                        }
                    });
                }
            });

            // маркер для фокуса
            line.render && line.render(true);
            body.appendChild(line.render(true));
            line.create();
            rows.push(line);
            return line;
        }

        // ---------- ЗАГРУЗКА СТРОК ----------
        function loadAllRows(callback) {
            var requests = [
                {
                    title: '🔥 Популярные ужасы',
                    params: { genres: String(HORROR_ID), filter: { sort_by: 'popularity.desc', 'vote_count.gte': 100 } }
                },
                {
                    title: '🏆 Лучшие ужасы',
                    params: { genres: String(HORROR_ID), filter: { sort_by: 'vote_average.desc', 'vote_count.gte': 500, 'vote_average.gte': 7 } }
                },
                {
                    title: '👻 Реально страшные',
                    params: {
                        genres: String(HORROR_ID),
                        filter: {
                            sort_by: 'vote_average.desc',
                            without_genres: WITHOUT_GENRES,
                            with_keywords: SCARY_KEYWORDS,
                            'vote_average.gte': 6.5,
                            'vote_count.gte': 500
                        }
                    }
                },
                {
                    title: '🇯🇵 Азиатский хоррор',
                    params: { genres: String(HORROR_ID), filter: { sort_by: 'vote_average.desc', with_origin_country: 'JP|KR|HK|TH|CN', 'vote_count.gte': 100, 'vote_average.gte': 6 } }
                },
                {
                    title: '🧟 Зомби-апокалипсис',
                    params: { genres: String(HORROR_ID), filter: { sort_by: 'popularity.desc', with_keywords: '12377', 'vote_count.gte': 50 } }
                },
                {
                    title: '🧛 Вампиры',
                    params: { genres: String(HORROR_ID), filter: { sort_by: 'popularity.desc', with_keywords: '3133', 'vote_count.gte': 50 } }
                },
                {
                    title: '😈 Одержимость и экзорцизм',
                    params: { genres: String(HORROR_ID), filter: { sort_by: 'popularity.desc', with_keywords: '11124|165417', 'vote_count.gte': 50 } }
                },
                {
                    title: '📺 Сериалы ужасов',
                    url: 'discover/tv',
                    params: { genres: String(HORROR_ID), filter: { sort_by: 'popularity.desc', 'vote_count.gte': 50 } }
                }
            ];

            var idx = 0;
            function next() {
                if (idx >= requests.length) return callback && callback();
                var req = requests[idx++];

                Lampa.Api.sources.tmdb.get(req.url || 'discover/movie', req.params, function (data) {
                    if (data.results && data.results.length) {
                        data.results = data.results.map(function (m) {
                            if (!m.source) m.source = 'tmdb';
                            return m;
                        });
                        makeLine({
                            title: req.title,
                            results: data.results,
                            total_pages: data.total_pages,
                            page: 1,
                            url: req.url || 'discover/movie',
                            source: 'tmdb'
                        });
                    }
                    next();
                }, function () {
                    next();
                }, { life: 60 * 6 });
            }
            next();
        }

        // ---------- ЖИЗНЕННЫЙ ЦИКЛ ----------
        this.create = function () {
            self.activity.loader(true);
            scroll.minus();

            header = buildHeader();
            body.appendChild(header);
            scroll.append(body);
            html.appendChild(scroll.render(true));

            loadAllRows(function () {
                self.activity.loader(false);
                self.activity.toggle();
            });
        };

        this.start = function () {
            var controller = {
                link: self,
                invisible: true,
                toggle: function () { self.toggleActive(); },
                up: function () { self.up(); },
                down: function () { self.down(); },
                left: function () {
                    if (Lampa.Navigator.canmove('left')) Lampa.Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                right: function () {
                    Lampa.Navigator.move('right');
                },
                back: function () { Lampa.Activity.backward(); }
            };
            Lampa.Controller.add('content', controller);
            Lampa.Controller.toggle('content');
        };

        this.pause = function () {};
        this.stop = function () {};
        this.resize = function () {};
        this.render = function (js) { return js ? html : $(html); };
        this.destroy = function () {
            rows.forEach(function (r) {
                try { r.destroy && r.destroy(); } catch (e) {}
            });
            scroll.destroy();
            html.remove();
        };

        // ---------- НАВИГАЦИЯ ----------
        self.toggleActive = function () {
            if (active === 0) {
                Lampa.Controller.collectionSet(header);
                var first = header.querySelector('.selector');
                Lampa.Controller.collectionFocus(first, header);
            } else {
                rows[active - 1].toggle();
            }
        };

        self.down = function () {
            if (active < rows.length) {
                active++;
                self.toggleActive();
                if (active > 0) scroll.update(rows[active - 1].render(true));
            }
        };

        self.up = function () {
            if (active === 0) {
                Lampa.Controller.toggle('head');
            } else {
                active--;
                self.toggleActive();
                if (active === 0) scroll.update(header, false);
                else scroll.update(rows[active - 1].render(true));
            }
        };
    }

    // ============ РЕГИСТРАЦИЯ СТРАНИЦЫ ============
    function registerPage() {
        if (typeof Lampa.Component.add === 'function') {
            Lampa.Component.add('horror', HorrorPage);
        }
    }

    // ============ КНОПКА В МЕНЮ ============
    function openHorrorPage() {
        Lampa.Activity.push({
            url: '',
            title: 'Ужасы',
            component: 'horror',
            page: 1
        });
    }

    function addMenuButton() {
        if ($('.menu__item[data-action="horror_plugin"]').length) return;
        Lampa.Menu.addButton(icon_horror, 'Ужасы', openHorrorPage)
            .attr('data-action', 'horror_plugin');
    }

    // ============ СТАРТ ============
    function start() {
        injectCSS();
        registerPage();
        addMenuButton();
        console.log('Horror plugin', 'started');
    }

    Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') setTimeout(addMenuButton, 500);
    });

    if (window.appready) {
        start();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }

})();
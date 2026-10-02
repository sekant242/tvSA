(function () {
    'use strict';

    /* ======================= Константы ======================= */
    var HORROR_GENRE = 27;
    var SOURCE_NAME  = 'tmdb';
    var network      = new Lampa.Reguest();

    /* ======================= Поджанры (TMDB keywords) ======================= */
    var SUBGENRES = [
        { title: 'Слэшер',                kw: 12339  },
        { title: 'Сверхъестественное',    kw: 9715   },
        { title: 'Зомби',                 kw: 12377  },
        { title: 'Вампиры',               kw: 3133   },
        { title: 'Оборотни',              kw: 18046  },
        { title: 'Призраки',              kw: 6152   },
        { title: 'Демоны',                kw: 188955 },
        { title: 'Одержимость',           kw: 314943 },
        { title: 'Экзорцизм',             kw: 30775  },
        { title: 'Психологический хоррор',kw: 234690 },
        { title: 'Телесный хоррор',       kw: 163053 },
        { title: 'Фолк-хоррор',           kw: 272045 },
        { title: 'Космический хоррор',    kw: 156802 },
        { title: 'Найденная плёнка',      kw: 162461 },
        { title: 'Дом с привидениями',    kw: 12564  },
        { title: 'Монстры',               kw: 155529 },
        { title: 'Каннибалы',             kw: 162481 },
        { title: 'Маньяк-убийца',         kw: 233    },
        { title: 'Ведьмы',                kw: 2343   },
        { title: 'Пытки',                 kw: 10292  },
        { title: 'Оккультизм',            kw: 188957 },
        { title: 'Культы',                kw: 188952 },
        { title: 'Зловещие дети',         kw: 163094 },
        { title: 'Проклятие',             kw: 315058 },
        { title: 'Хижина в лесу',         kw: 324560 },
        { title: 'Заброшенные места',     kw: 10292  },
        { title: 'Психушка',              kw: 10292  },
        { title: 'Клоуны',                kw: 10982  },
        { title: 'Животные-убийцы',       kw: 10292  },
        { title: 'Вторжение в дом',       kw: 276577 }
    ];

    /* ======================= Студии ======================= */
    var STUDIOS = [
        { title: 'Blumhouse',            id: 3172  },
        { title: 'A24',                  id: 41077 },
        { title: 'Atomic Monster',       id: 62642 },
        { title: 'Ghost House Pictures', id: 12516 },
        { title: 'Twisted Pictures',     id: 3156  },
        { title: 'Platinum Dunes',       id: 7714  },
        { title: 'Dark Castle',          id: 219   },
        { title: 'Hammer Film',          id: 591   },
        { title: 'Vertigo Ent.',         id: 829   },
        { title: 'New Line Cinema',      id: 12    },
        { title: 'Lionsgate',            id: 1632  },
        { title: 'Screen Gems',          id: 3287  },
        { title: 'Bad Robot',            id: 11461 },
        { title: 'Vertigo Films',        id: 829   }
    ];

    /* ======================= Режиссёры ======================= */
    var DIRECTORS = [
        { title: 'Джордан Пил',           id: 1323337 },
        { title: 'Ари Астер',             id: 1167712 },
        { title: 'Роберт Эггерс',         id: 1137500 },
        { title: 'Джеймс Ван',            id: 21215   },
        { title: 'Майк Флэнаган',         id: 99075   },
        { title: 'Илай Рот',              id: 92740   },
        { title: 'Уэс Крэйвен',           id: 5302    },
        { title: 'Джон Карпентер',        id: 11770   },
        { title: 'Гильермо дель Торо',    id: 10828   },
        { title: 'Сэм Рэйми',             id: 11619   },
        { title: 'Тай Уэст',              id: 91552   },
        { title: 'Александр Ажа',         id: 62269   },
        { title: 'Клайв Баркер',          id: 10208   },
        { title: 'Дарио Ардженто',        id: 3057    },
        { title: 'Дэвид Кроненберг',      id: 2099    },
        { title: 'Люка Гуаданьино',       id: 44564   }
    ];

    /* ======================= Актёры ======================= */
    var ACTORS = [
        { title: 'Джейми Ли Кёртис',   id: 8944    },
        { title: 'Нив Кэмпбелл',        id: 11703   },
        { title: 'Тони Коллетт',        id: 2201    },
        { title: 'Вера Фармига',        id: 9904    },
        { title: 'Патрик Уилсон',       id: 15376   },
        { title: 'Итан Хоук',           id: 569     },
        { title: 'Флоренс Пью',         id: 1373737 },
        { title: 'Миа Гот',             id: 180777  },
        { title: 'Билл Скарсгард',      id: 8891    },
        { title: 'Аня Тейлор-Джой',     id: 1397778 },
        { title: 'Сигурни Уивер',       id: 10205   },
        { title: 'Брюс Кэмпбелл',       id: 4989    },
        { title: 'Даниэль Харрис',      id: 2598    },
        { title: 'Кэтрин Ньютон',       id: 1373736 }
    ];

    /* ======================= Страны ======================= */
    var COUNTRIES = [
        { title: 'США',           code: 'US' },
        { title: 'Великобритания',code: 'GB' },
        { title: 'Япония',        code: 'JP' },
        { title: 'Южная Корея',   code: 'KR' },
        { title: 'Франция',       code: 'FR' },
        { title: 'Италия',        code: 'IT' },
        { title: 'Испания',       code: 'ES' },
        { title: 'Германия',      code: 'DE' },
        { title: 'Россия',        code: 'RU' },
        { title: 'Швеция',        code: 'SE' },
        { title: 'Мексика',       code: 'MX' },
        { title: 'Австралия',     code: 'AU' },
        { title: 'Канада',        code: 'CA' },
        { title: 'Индия',         code: 'IN' }
    ];

    /* ======================= Коллекции (TMDB collection id) ======================= */
    var COLLECTIONS = [
        { title: 'Хэллоуин',              id: 91361  },
        { title: 'Пятница, 13-е',         id: 103437 },
        { title: 'Кошмар на улице Вязов', id: 11751  },
        { title: 'Заклятие',              id: 313086 },
        { title: 'Астрал',                id: 212613 },
        { title: 'Пила',                  id: 2150   },
        { title: 'Крик',                  id: 4023   },
        { title: 'Чужой',                 id: 8091   },
        { title: 'Изгоняющий дьявола',    id: 12087  },
        { title: 'Зловещие мертвецы',     id: 10216  },
        { title: 'Детские игры',          id: 11366  },
        { title: 'Техасская резня',       id: 12875  },
        { title: 'Пункт назначения',      id: 44180  }
    ];

    /* ======================= 10 ТОПов ======================= */
    var TOPS = [
        { title: 'Самое страшное',          q: { sort_by: 'vote_average.desc', 'vote_count.gte': 500, with_keywords: 9715 } },
        { title: 'Самое мерзкое',           q: { sort_by: 'popularity.desc',    with_keywords: 10292 } },
        { title: 'Самое жуткое',            q: { sort_by: 'vote_average.desc', 'vote_count.gte': 300, with_keywords: 234690 } },
        { title: 'Самое кровавое',          q: { sort_by: 'popularity.desc',    with_keywords: 10292 } },
        { title: 'Запрещённые',             q: { sort_by: 'popularity.desc',    with_keywords: 162461 } },
        { title: 'Не смотреть на ночь',     q: { sort_by: 'vote_average.desc', 'vote_count.gte': 400, with_keywords: 9715 } },
        { title: 'Классика ужасов',         q: { sort_by: 'vote_count.desc',    'primary_release_date.lte': '1999-12-31' } },
        { title: 'Психологические ужасы',   q: { sort_by: 'vote_average.desc', 'vote_count.gte': 300, with_keywords: 234690 } },
        { title: 'Мистические ужасы',       q: { sort_by: 'popularity.desc',    with_keywords: 9715 } },
        { title: 'Слэшеры',                 q: { sort_by: 'popularity.desc',    with_keywords: 12339 } }
    ];

    /* ======================= Утилиты ======================= */
    function tmdbUrl(path, params) {
        var url = path;
        if (params) {
            for (var k in params) {
                if (params[k] === undefined || params[k] === null || params[k] === '') continue;
                url = Lampa.Utils.addUrlComponent(url, k + '=' + encodeURIComponent(params[k]));
            }
        }
        return Lampa.TMDB.api(url);
    }

    function fetch(url, onOk, onErr) {
        network.clear();
        network.timeout(15000);
        network.silent(url, onOk, onErr);
    }

    function convertMovie(m) {
        var isTv = !!(m.first_air_date && !m.release_date);
        return {
            source: SOURCE_NAME,
            type: isTv ? 'tv' : 'movie',
            adult: !!m.adult,
            id: m.id,
            title: m.title || m.name || '',
            original_title: m.original_title || m.original_name || '',
            overview: m.overview || '',
            img: m.poster_path ? Lampa.TMDB.image('t/p/w300' + m.poster_path) : '',
            background_image: m.backdrop_path ? Lampa.TMDB.image('t/p/w780' + m.backdrop_path) : '',
            vote_average: m.vote_average || 0,
            vote_count: m.vote_count || 0,
            release_date: m.release_date || m.first_air_date || '',
            first_air_date: m.first_air_date || m.release_date || ''
        };
    }

    function discover(params, onOk, onErr) {
        var type = params.type || 'movie';
        delete params.type;
        var base = { with_genres: HORROR_GENRE, language: 'ru-RU', page: 1 };
        for (var k in params) base[k] = params[k];
        var url = tmdbUrl('discover/' + type, base);
        fetch(url, function (json) {
            var results = (json && json.results ? json.results : []).map(convertMovie);
            onOk(results, json);
        }, onErr);
    }

    function loadCollection(id, onOk, onErr) {
        fetch(tmdbUrl('collection/' + id, { language: 'ru-RU' }), function (json) {
            var parts = (json && json.parts ? json.parts : []).map(convertMovie);
            parts.sort(function (a, b) {
                return (a.release_date || '').localeCompare(b.release_date || '');
            });
            onOk(parts);
        }, onErr);
    }

    /* ======================= Открыть карточку ======================= */
    function openCard(card) {
        Lampa.Activity.push({
            url: '',
            title: card.title,
            component: 'full',
            card: card,
            source: SOURCE_NAME,
            movie: card
        });
    }

    /* ======================= Открыть полный список по фильтру ======================= */
    function openFilterList(title, params) {
        Lampa.Activity.push({
            url: '',
            title: title,
            component: 'horror_full',
            page: 1,
            filter_params: params
        });
    }

    /* ======================= Рендер карточки ======================= */
    function renderCard(card) {
        var $card = $(
            '<div class="card selector horror-card">' +
                '<div class="card__img"><img loading="lazy" /></div>' +
                '<div class="card__title"></div>' +
                '<div class="card__rate"></div>' +
            '</div>'
        );
        $card.find('img').attr('src', card.img || './img/img_load.svg');
        $card.find('.card__title').text(card.title);
        if (card.vote_average) {
            $card.find('.card__rate').text(card.vote_average.toFixed(1));
        } else {
            $card.find('.card__rate').remove();
        }
        $card.on('hover:enter', function () {
            openCard(card);
        });
        return $card;
    }

    /* ======================= Рендер секции ======================= */
    function renderSection(title, items, opts) {
        opts = opts || {};
        var $sec = $(
            '<div class="horror-section">' +
                '<div class="horror-section__head">' +
                    '<div class="horror-section__title selector">' + title + '</div>' +
                    (opts.more ? '<div class="horror-section__more selector">Ещё →</div>' : '') +
                '</div>' +
                '<div class="horror-grid"></div>' +
            '</div>'
        );
        var $grid = $sec.find('.horror-grid');
        items.slice(0, opts.limit || 18).forEach(function (c) {
            $grid.append(renderCard(c));
        });
        if (opts.more) {
            $sec.find('.horror-section__more').on('hover:enter', opts.more);
        }
        return $sec;
    }

    /* ======================= Кнопка-фильтр ======================= */
    function renderFilterBar(filters) {
        var $bar = $('<div class="horror-filters"></div>');
        filters.forEach(function (f) {
            var $b = $('<div class="horror-filter selector">' + f.title + '</div>');
            $b.on('hover:enter', f.onSelect);
            $bar.append($b);
        });
        return $bar;
    }

    /* ======================= Выбор фильтра ======================= */
    function pickFromList(title, list, onPick) {
        var items = list.map(function (it, i) {
            return { title: it.title, index: i };
        });
        Lampa.Select.show({
            title: title,
            items: items,
            onSelect: function (sel) {
                Lampa.Controller.toggle('content');
                onPick(list[sel.index]);
            },
            onBack: function () {
                Lampa.Controller.toggle('content');
            }
        });
    }

    /* ======================= Компонент главной страницы ======================= */
    function HorrorMain(object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var files  = new Lampa.Explorer(object);
        var last;

        scroll.body().addClass('horror-main');

        this.create = function () {
            this.activity.loader(true);
            files.appendFiles(scroll.render());
            loadAll();
            return this.render();
        };

        this.render = function () { return files.render(); };

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render(), files.render());
                    Lampa.Controller.collectionFocus(last || false, scroll.render());
                },
                left: function () { Lampa.Controller.toggle('menu'); },
                up: function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function () { Navigator.move('down'); },
                right: function () { if (Navigator.canmove('right')) Navigator.move('right'); },
                back: this.back
            });
            Lampa.Controller.toggle('content');
        };

        this.back = function () { Lampa.Activity.backward(); };
        this.pause = function () {};
        this.stop  = function () {};
        this.destroy = function () {
            network.clear();
            scroll.destroy();
            files.destroy();
        };

        function appendNode($el) {
            $el.on('hover:focus', function (e) {
                last = e.target;
                scroll.update($(e.target), true);
            });
            scroll.append($el);
        }

        function loadAll() {
            // Панель фильтров
            appendNode(renderFilterBar([
                { title: 'Коллекции', onSelect: pickCollection },
                { title: 'Студии',    onSelect: pickStudio },
                { title: 'Режиссёры', onSelect: pickDirector },
                { title: 'Актёры',    onSelect: pickActor },
                { title: 'Страны',    onSelect: pickCountry },
                { title: 'Поджанры',  onSelect: pickSubgenre }
            ]));

            // Основные секции
            loadRecommendations();
            loadNewReleases();
            loadHorrorSeries();

            // Топы
            TOPS.forEach(function (top) {
                loadTop(top);
            });
        }

        function pickCollection() {
            pickFromList('Коллекции', COLLECTIONS, function (item) {
                Lampa.Activity.push({
                    url: '',
                    title: item.title,
                    component: 'horror_collection',
                    collection_id: item.id,
                    page: 1
                });
            });
        }
        function pickStudio() {
            pickFromList('Студии', STUDIOS, function (item) {
                openFilterList(item.title, { type: 'movie', with_companies: item.id });
            });
        }
        function pickDirector() {
            pickFromList('Режиссёры', DIRECTORS, function (item) {
                openFilterList(item.title, { type: 'movie', with_crew: item.id });
            });
        }
        function pickActor() {
            pickFromList('Актёры', ACTORS, function (item) {
                openFilterList(item.title, { type: 'movie', with_cast: item.id });
            });
        }
        function pickCountry() {
            pickFromList('Страны', COUNTRIES, function (item) {
                openFilterList(item.title, { type: 'movie', with_origin_country: item.code });
            });
        }
        function pickSubgenre() {
            pickFromList('Поджанры', SUBGENRES, function (item) {
                openFilterList(item.title, { type: 'movie', with_keywords: item.kw });
            });
        }

        function loadRecommendations() {
            discover({
                type: 'movie',
                sort_by: 'vote_average.desc',
                'vote_count.gte': 500,
                'primary_release_date.gte': '2000-01-01'
            }, function (items) {
                appendNode(renderSection('Рекомендации', items, {
                    more: function () {
                        openFilterList('Рекомендации ужасов', {
                            type: 'movie',
                            sort_by: 'vote_average.desc',
                            'vote_count.gte': 500,
                            'primary_release_date.gte': '2000-01-01'
                        });
                    }
                }));
                maybeStopLoader();
            }, function () { maybeStopLoader(); });
        }

        function loadNewReleases() {
            discover({
                type: 'movie',
                sort_by: 'primary_release_date.desc',
                'vote_count.gte': 5
            }, function (items) {
                appendNode(renderSection('Новинки кино ужасов', items, {
                    more: function () {
                        openFilterList('Новинки кино ужасов', {
                            type: 'movie',
                            sort_by: 'primary_release_date.desc',
                            'vote_count.gte': 5
                        });
                    }
                }));
                maybeStopLoader();
            }, function () { maybeStopLoader(); });
        }

        function loadHorrorSeries() {
            discover({
                type: 'tv',
                sort_by: 'popularity.desc'
            }, function (items) {
                appendNode(renderSection('Сериалы ужасов', items, {
                    more: function () {
                        openFilterList('Сериалы ужасов', {
                            type: 'tv',
                            sort_by: 'popularity.desc'
                        });
                    }
                }));
                maybeStopLoader();
            }, function () { maybeStopLoader(); });
        }

        var pending = 1 + 3 + TOPS.length;
        function maybeStopLoader() {
            pending--;
            if (pending <= 0) {
                this_activity_loader_off();
            }
        }
        function this_activity_loader_off() {
            Lampa.Activity.active();
            try { Lampa.Activity.active().loader(false); } catch (e) {}
        }

        function loadTop(top) {
            var params = { type: 'movie' };
            for (var k in top.q) params[k] = top.q[k];
            discover(params, function (items) {
                appendNode(renderSection(top.title, items, {
                    more: function () {
                        var p = { type: 'movie' };
                        for (var k in top.q) p[k] = top.q[k];
                        openFilterList(top.title, p);
                    }
                }));
                maybeStopLoader();
            }, function () { maybeStopLoader(); });
        }
    }

    /* ======================= Компонент полного списка с пагинацией ======================= */
    function HorrorFull(object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var files  = new Lampa.Explorer(object);
        var activity = this.activity;
        var params = object.filter_params || {};
        var page = 1;
        var total_pages = 1;
        var loading = false;
        var last;

        scroll.body().addClass('horror-full');
        files.appendFiles(scroll.render());

        this.create = function () {
            this.activity.loader(true);
            loadPage();
            return this.render();
        };

        this.render = function () { return files.render(); };

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render(), files.render());
                    Lampa.Controller.collectionFocus(last || false, scroll.render());
                },
                left: function () { Lampa.Controller.toggle('menu'); },
                right: function () {},
                up: function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function () {
                    if (Navigator.canmove('down')) Navigator.move('down');
                    else if (page < total_pages && !loading) loadPage();
                },
                back: this.back
            });
            Lampa.Controller.toggle('content');
        };

        this.back = function () { Lampa.Activity.backward(); };
        this.pause = function () {};
        this.stop  = function () {};
        this.destroy = function () {
            network.clear();
            scroll.destroy();
            files.destroy();
        };

        function loadPage() {
            if (loading || page > total_pages) return;
            loading = true;
            activity.loader(true);

            var p = {};
            for (var k in params) p[k] = params[k];
            var type = p.type || 'movie';
            delete p.type;
            p.page = page;

            discover({ type: type, page: p.page, sort_by: p.sort_by || 'popularity.desc', with_genres: HORROR_GENRE, with_keywords: p.with_keywords, with_companies: p.with_companies, with_crew: p.with_crew, with_cast: p.with_cast, with_origin_country: p.with_origin_country, 'vote_count.gte': p['vote_count.gte'], 'vote_average.gte': p['vote_average.gte'], 'primary_release_date.gte': p['primary_release_date.gte'], 'primary_release_date.lte': p['primary_release_date.lte'], language: 'ru-RU' }, function (items, json) {
                total_pages = json.total_pages || 1;
                var $grid = $('<div class="horror-grid"></div>');
                items.forEach(function (c) { $grid.append(renderCard(c)); });
                $grid.on('hover:focus', function (e) {
                    last = e.target;
                    scroll.update($(e.target), true);
                });
                scroll.append($grid);
                page++;
                loading = false;
                activity.loader(false);
                if (page <= total_pages) {
                    setTimeout(function () {
                        // автоподгрузка при скролле вниз произойдёт через down()
                    }, 50);
                }
            }, function () {
                loading = false;
                activity.loader(false);
                Lampa.Noty.show('Ошибка загрузки');
            });
        }
    }

    /* ======================= Компонент коллекции ======================= */
    function HorrorCollection(object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var files  = new Lampa.Explorer(object);
        var last;

        scroll.body().addClass('horror-full');
        files.appendFiles(scroll.render());

        this.create = function () {
            this.activity.loader(true);
            loadCollection(object.collection_id, function (items) {
                this.activity.loader(false);
                var $grid = $('<div class="horror-grid"></div>');
                items.forEach(function (c) { $grid.append(renderCard(c)); });
                $grid.on('hover:focus', function (e) {
                    last = e.target;
                    scroll.update($(e.target), true);
                });
                scroll.append($grid);
            }, function () {
                this.activity.loader(false);
                Lampa.Noty.show('Не удалось загрузить коллекцию');
            });
            return this.render();
        };

        this.render = function () { return files.render(); };

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render(), files.render());
                    Lampa.Controller.collectionFocus(last || false, scroll.render());
                },
                left: function () { Lampa.Controller.toggle('menu'); },
                back: this.back
            });
            Lampa.Controller.toggle('content');
        };

        this.back = function () { Lampa.Activity.backward(); };
        this.pause = function () {};
        this.stop  = function () {};
        this.destroy = function () {
            network.clear();
            scroll.destroy();
            files.destroy();
        };
    }

    /* ======================= CSS ======================= */
    function injectCss() {
        if ($('#horror_css').length) return;
        var css =
            '.horror-main, .horror-full { padding: 1.5em; }' +
            '.horror-filters { display: flex; flex-wrap: wrap; gap: .5em; margin-bottom: 1.2em; }' +
            '.horror-filter { padding: .5em 1em; border-radius: 2em; background: rgba(255,255,255,.07); font-size: .95em; }' +
            '.horror-filter.focus { background: #fff; color: #000; }' +
            '.horror-section { margin-bottom: 1.6em; }' +
            '.horror-section__head { display: flex; align-items: center; margin-bottom: .6em; }' +
            '.horror-section__title { font-size: 1.35em; font-weight: 600; }' +
            '.horror-section__more { margin-left: auto; opacity: .7; font-size: .95em; }' +
            '.horror-section__more.focus { opacity: 1; }' +
            '.horror-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(10em, 1fr)); gap: 1em; }' +
            '.horror-card { width: 100% !important; }' +
            '.horror-card .card__img { position: relative; padding-bottom: 150%; border-radius: .4em; overflow: hidden; background: #1a1a1a; }' +
            '.horror-card .card__img img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }' +
            '.horror-card .card__title { margin-top: .35em; font-size: .9em; line-height: 1.2; max-height: 2.4em; overflow: hidden; }' +
            '.horror-card .card__rate { color: #f5c518; font-size: .85em; margin-top: .2em; }' +
            '.horror-card.focus { transform: scale(1.04); transition: transform .12s ease; }';
        $('<style id="horror_css"></style>').text(css).appendTo('head');
    }

    /* ======================= Меню ======================= */
    function addMenuItem() {
        if (window.horror_menu_patched) return;
        window.horror_menu_patched = true;

        var origRender = Lampa.Menu.render;
        Lampa.Menu.render = function () {
            var html = origRender.apply(this, arguments);
            var $list = html.find('.menu__list');
            if ($list.length && !$list.find('[data-action="horror"]').length) {
                var icon =
                    '<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">' +
                        '<path d="M12 2C8.1 2 5 5.1 5 9v11l2-2 2 2 2-2 2 2 2-2 2 2V9c0-3.9-3.1-7-7-7zm-2.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM12 15l-2 3h4l-2-3z"/>' +
                    '</svg>';
                var $item = $(
                    '<li class="menu__item selector" data-action="horror">' +
                        '<div class="menu__ico">' + icon + '</div>' +
                        '<div class="menu__text">Фильмы ужасов</div>' +
                    '</li>'
                );
                $item.on('hover:enter', function () {
                    Lampa.Activity.push({
                        url: '',
                        title: 'Фильмы ужасов',
                        component: 'horror_main',
                        page: 1
                    });
                });
                $list.append($item);
            }
            return html;
        };

        // Триггерим перерисовку (если меню уже отрисовано)
        try { Lampa.Menu.render().find('.menu__list').length && Lampa.Layer.update(); } catch (e) {}
    }

    /* ======================= Регистрация ======================= */
    function startPlugin() {
        window.horror_plugin = true;

        function addPlugin() {
            injectCss();
            Lampa.Component.add('horror_main',       HorrorMain);
            Lampa.Component.add('horror_full',       HorrorFull);
            Lampa.Component.add('horror_collection', HorrorCollection);
            addMenuItem();
        }

        if (window.appready) {
            addPlugin();
        } else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type === 'ready') addPlugin();
            });
        }
    }

    if (!window.horror_plugin) startPlugin();

})();
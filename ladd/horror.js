(function () {
    'use strict';

    // ============================================================
    //  HORROR PLUGIN — раздел «Ужасы» в боковом меню
    //  Источник: TMDB (жанр 27 — Horror)
    // ============================================================

    var SOURCE_NAME  = 'HRR';
    var SOURCE_TITLE = 'Ужасы';
    var HORROR_GENRE = 27;

    var network    = new Lampa.Reguest();
    var cache      = {};
    var CACHE_TIME = 1000 * 60 * 30;

    // ------------------------------------------------------------
    // TMDB helper
    // ------------------------------------------------------------
    function tmdbApi(path, params, success, error) {
        var url = Lampa.TMDB.api(path);

        if (params) {
            var q = [];
            for (var k in params) {
                if (params[k] !== undefined && params[k] !== null) {
                    q.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
                }
            }
            if (q.length) {
                url += (url.indexOf('?') === -1 ? '?' : '&') + q.join('&');
            }
        }

        var cached = cache[url];
        if (cached && (Date.now() - cached.time) < CACHE_TIME) {
            setTimeout(function () { success(cached.data); }, 10);
            return;
        }

        network.clear();
        network.timeout(15000);
        network.silent(url, function (data) {
            cache[url] = { data: data, time: Date.now() };
            success(data);
        }, function (a, c) {
            if (error) error(a, c);
        });
    }

    // ------------------------------------------------------------
    // Конвертация TMDB -> карточка Лампы
    // ------------------------------------------------------------
    function convert(data, forceType) {
        var type     = forceType || data.media_type || (data.first_air_date ? 'tv' : 'movie');
        var title    = data.title || data.name || '';
        var original = data.original_title || data.original_name || title;

        var card = {
            source:           SOURCE_NAME,
            id:               data.id,
            type:             type,
            title:            title,
            original_title:   original,
            overview:         data.overview || '',
            img:              data.poster_path   ? Lampa.TMDB.image('t/p/w500'  + data.poster_path)   : '',
            background_image: data.backdrop_path ? Lampa.TMDB.image('t/p/w1280' + data.backdrop_path) : '',
            vote_average:     data.vote_average || 0,
            vote_count:       data.vote_count   || 0,
            adult:            false
        };

        if (type === 'movie') {
            card.release_date = data.release_date || '';
        } else {
            card.first_air_date = data.first_air_date || '';
            card.name           = title;
            card.original_name  = original;
        }

        return card;
    }

    function makePart(title, results, url) {
        return { title: title, results: results, url: url || '' };
    }

    // ============================================================
    // СПРАВОЧНЫЕ ДАННЫЕ
    // ============================================================

    // ---- Поджанры (TMDB keyword id) ----------------------------
    var SUBGENRES = [
        { title: 'Слэшер',                    id: 12339  },
        { title: 'Зомби-апокалипсис',         id: 12377  },
        { title: 'Вампиры',                   id: 3133   },
        { title: 'Оборотни',                  id: 12564  },
        { title: 'Призраки',                  id: 9715   },
        { title: 'Сверхъестественное',        id: 2343   },
        { title: 'Найденная плёнка',          id: 163053 },
        { title: 'Маньяки и серийные убийцы', id: 9748   },
        { title: 'Каннибалы',                 id: 10479  },
        { title: 'Демоны и одержимость',      id: 11800  },
        { title: 'Ведьмы и колдовство',       id: 12565  },
        { title: 'Экзорцизм',                 id: 9717   },
        { title: 'Дом с привидениями',        id: 1992   },
        { title: 'Монстры и чудовища',        id: 1299   },
        { title: 'Телесный ужас',             id: 15295  },
        { title: 'Психологический хоррор',    id: 10714  },
        { title: 'Мистика и оккультизм',      id: 2564   },
        { title: 'Проклятие',                 id: 189231 },
        { title: 'Куклы и игрушки',           id: 189153 },
        { title: 'Хижина в лесу',             id: 141092 },
        { title: 'Существа из глубины',       id: 10541  },
        { title: 'Клоуны',                    id: 194941 },
        { title: 'Снежный хоррор',            id: 215753 },
        { title: 'Пустыня и изоляция',        id: 214552 },
        { title: 'Лесные ужасы',              id: 214950 },
        { title: 'Психиатрия',                id: 14844  },
        { title: 'Школа и подростки',         id: 156854 },
        { title: 'Праздники',                 id: 189231 },
        { title: 'Космический хоррор',        id: 9882   },
        { title: 'Путешествия во времени',    id: 4379   },
        { title: 'Зеркала',                   id: 188066 },
        { title: 'Кибер-хоррор',              id: 145799 },
        { title: 'Азиатский хоррор',          id: 11046  },
        { title: 'Ритуальные убийства',       id: 10542  }
    ];

    // ---- Студии ------------------------------------------------
    var STUDIOS = [
        { title: 'Blumhouse Productions',  id: 3172   },
        { title: 'A24',                    id: 41077  },
        { title: 'Atomic Monster',         id: 103492 },
        { title: 'Ghost House Pictures',   id: 12825  },
        { title: 'Dark Castle Entertainment', id: 4051  },
        { title: 'Platinum Dunes',         id: 4353   },
        { title: 'Twisted Pictures',       id: 3324   },
        { title: 'Vertigo Entertainment',  id: 11237  },
        { title: 'New Line Cinema',        id: 12     },
        { title: 'Screen Gems',            id: 4569   },
        { title: 'Rogue Pictures',         id: 2269   },
        { title: 'Lionsgate',              id: 1632   },
        { title: 'Universal Pictures',     id: 33     },
        { title: 'Warner Bros. Pictures',  id: 174    },
        { title: 'Miramax',                id: 14     }
    ];

    // ---- Режиссёры ---------------------------------------------
    var DIRECTORS = [
        { title: 'Джон Карпентер',        id: 11197   },
        { title: 'Уэс Крэйвен',           id: 11519   },
        { title: 'Ари Астер',             id: 1660734 },
        { title: 'Джордан Пил',           id: 1388167 },
        { title: 'Роберт Эггерс',         id: 1123713 },
        { title: 'Майк Флэнаган',         id: 1165290 },
        { title: 'Джеймс Ван',            id: 52234   },
        { title: 'Сэм Рэйми',             id: 7623    },
        { title: 'Гильермо дель Торо',    id: 44060   },
        { title: 'М. Найт Шьямалан',      id: 2710    },
        { title: 'Элай Рот',              id: 41654   },
        { title: 'Александр Ажа',         id: 39305   },
        { title: 'Роб Зомби',             id: 49894   },
        { title: 'Клайв Баркер',          id: 5375    },
        { title: 'Тоуб Хупер',            id: 11619   },
        { title: 'Даррен Аронофски',      id: 6433    },
        { title: 'Дэвид Ф. Сандберг',     id: 1137289 },
        { title: 'Скотт Дерриксон',       id: 21212   },
        { title: 'Корин Харди',           id: 939617  },
        { title: 'Стивен Кинг',           id: 1581    }
    ];

    // ---- Актёры ------------------------------------------------
    var ACTORS = [
        { title: 'Джейми Ли Кёртис',    id: 15211   },
        { title: 'Нив Кэмпбелл',        id: 11148   },
        { title: 'Брюс Кэмпбелл',       id: 3397    },
        { title: 'Роберт Инглунд',      id: 2649    },
        { title: 'Тони Тодд',           id: 30591   },
        { title: 'Сигурни Уивер',       id: 10205   },
        { title: 'Вера Фармига',        id: 20045   },
        { title: 'Патрик Уилсон',       id: 20746   },
        { title: 'Тони Коллетт',        id: 15233   },
        { title: 'Аня Тейлор-Джой',     id: 117642  },
        { title: 'Мия Гот',             id: 1118777 },
        { title: 'Флоренс Пью',         id: 1373737 },
        { title: 'Лин Шэй',             id: 27894   },
        { title: 'Даниэль Харрис',      id: 45744   },
        { title: 'Кэйн Ходдер',         id: 24464   },
        { title: 'Даниэль Панабейкер',  id: 23446   }
    ];

    // ---- Страны ------------------------------------------------
    var COUNTRIES = [
        { title: 'США',             code: 'US' },
        { title: 'Великобритания',  code: 'GB' },
        { title: 'Япония',          code: 'JP' },
        { title: 'Южная Корея',     code: 'KR' },
        { title: 'Испания',         code: 'ES' },
        { title: 'Италия',          code: 'IT' },
        { title: 'Франция',         code: 'FR' },
        { title: 'Мексика',         code: 'MX' },
        { title: 'Таиланд',         code: 'TH' },
        { title: 'Австралия',       code: 'AU' },
        { title: 'Канада',          code: 'CA' },
        { title: 'Россия',          code: 'RU' },
        { title: 'Германия',        code: 'DE' },
        { title: 'Швеция',          code: 'SE' },
        { title: 'Индия',           code: 'IN' },
        { title: 'Индонезия',       code: 'ID' },
        { title: 'Турция',          code: 'TR' },
        { title: 'Гонконг',         code: 'HK' }
    ];

    // ---- Серии фильмов (TMDB collection id) --------------------
    var COLLECTIONS = [
        { title: 'Заклятие',                          id: 313086 },
        { title: 'Пила',                              id: 2150   },
        { title: 'Крик',                              id: 10983  },
        { title: 'Хэллоуин',                          id: 9138   },
        { title: 'Пятница, 13-е',                     id: 9084   },
        { title: 'Кошмар на улице Вязов',             id: 9485   },
        { title: 'Техасская резня бензопилой',        id: 8856   },
        { title: 'Чужой',                             id: 8091   },
        { title: 'Хищник',                            id: 399    },
        { title: 'Зловещие мертвецы',                 id: 10590  },
        { title: 'Пункт назначения',                  id: 9662   },
        { title: 'Паранормальное явление',            id: 127642 },
        { title: 'Астрал',                            id: 128383 },
        { title: 'Судная ночь',                       id: 240293 },
        { title: 'Оно',                               id: 394005 },
        { title: 'Звонок',                            id: 10900  },
        { title: 'Проклятие',                         id: 128699 }
    ];

    // ---- 10 ТОПов ----------------------------------------------
    var TOPS = [
        {
            title:  '🏆 Самое страшное',
            params: { with_genres: 27, sort_by: 'vote_average.desc', 'vote_count.gte': 1000 },
            type:   'movie'
        },
        {
            title:  '💀 Самое жуткое',
            params: { with_genres: 27, with_keywords: 9715, sort_by: 'vote_average.desc', 'vote_count.gte': 200 },
            type:   'movie'
        },
        {
            title:  '🩸 Самое кровавое',
            params: { with_genres: 27, with_keywords: 10292, sort_by: 'vote_average.desc', 'vote_count.gte': 100 },
            type:   'movie'
        },
        {
            title:  '😱 Популярные ужасы',
            params: { with_genres: 27, sort_by: 'popularity.desc', 'vote_count.gte': 100 },
            type:   'movie'
        },
        {
            title:  '🚫 Запрещённые',
            params: { with_genres: 27, sort_by: 'vote_average.desc', 'vote_count.gte': 100, with_keywords: 1991 },
            type:   'movie'
        },
        {
            title:  '🌙 Не смотреть на ночь',
            params: { with_genres: 27, with_keywords: 2564, sort_by: 'vote_average.desc', 'vote_count.gte': 200 },
            type:   'movie'
        },
        {
            title:  '🤢 Самое мерзкое',
            params: { with_genres: 27, with_keywords: 15295, sort_by: 'vote_average.desc', 'vote_count.gte': 100 },
            type:   'movie'
        },
        {
            title:  '👻 Призраки и мистика',
            params: { with_genres: 27, with_keywords: 9715, sort_by: 'popularity.desc', 'vote_count.gte': 50 },
            type:   'movie'
        },
        {
            title:  '🧟 Зомби-апокалипсис',
            params: { with_genres: 27, with_keywords: 12377, sort_by: 'popularity.desc', 'vote_count.gte': 50 },
            type:   'movie'
        },
        {
            title:  '🔪 Слэшеры',
            params: { with_genres: 27, with_keywords: 12339, sort_by: 'popularity.desc', 'vote_count.gte': 50 },
            type:   'movie'
        }
    ];

    // ============================================================
    //  API хелперы
    // ============================================================
    function fetchMovies(params, success, error) {
        tmdbApi('discover/movie', params, function (data) {
            success((data.results || []).map(function (d) { return convert(d, 'movie'); }), data);
        }, error);
    }

    function fetchTV(params, success, error) {
        tmdbApi('discover/tv', params, function (data) {
            success((data.results || []).map(function (d) { return convert(d, 'tv'); }), data);
        }, error);
    }

    function fetchCollection(id, success, error) {
        tmdbApi('collection/' + id, { language: 'ru-RU' }, function (data) {
            success((data.parts || []).map(function (d) { return convert(d, 'movie'); }), data);
        }, error);
    }

    // ============================================================
    //  MAIN — дашборд раздела «Ужасы»
    // ============================================================
    function main(params, oncomplite, onerror) {
        var parts_data = [];

        // 1. Рекомендации
        parts_data.push(function (call) {
            fetchMovies({
                with_genres: HORROR_GENRE,
                sort_by: 'popularity.desc',
                'vote_count.gte': 200,
                page: 1
            }, function (results) {
                call(makePart('🔥 Рекомендации', results));
            }, call);
        });

        // 2. Новинки кино ужасов
        parts_data.push(function (call) {
            var year = new Date().getFullYear();
            fetchMovies({
                with_genres: HORROR_GENRE,
                sort_by: 'primary_release_date.desc',
                'primary_release_date.gte': (year - 1) + '-01-01',
                'vote_count.gte': 10,
                page: 1
            }, function (results) {
                call(makePart('🎬 Новинки кино', results));
            }, call);
        });

        // 3. Сериалы ужасов
        parts_data.push(function (call) {
            fetchTV({
                with_genres: HORROR_GENRE,
                sort_by: 'popularity.desc',
                'vote_count.gte': 50,
                page: 1
            }, function (results) {
                call(makePart('📺 Сериалы ужасов', results));
            }, call);
        });

        // 4. Серии фильмов
        parts_data.push(function (call) {
            var cards = COLLECTIONS.map(function (c) {
                return {
                    source: SOURCE_NAME,
                    id: 'col_' + c.id,
                    type: 'menu',
                    title: c.title,
                    original_title: '',
                    img: '',
                    vote_average: 0,
                    vote_count: 0,
                    url: 'col_' + c.id + '_' + encodeURIComponent(c.title)
                };
            });
            call(makePart('🎞 Серии фильмов', cards));
        });

        // 5. Студии
        parts_data.push(function (call) {
            var cards = STUDIOS.map(function (c) {
                return {
                    source: SOURCE_NAME,
                    id: 'std_' + c.id,
                    type: 'menu',
                    title: c.title,
                    original_title: '',
                    img: '',
                    vote_average: 0,
                    vote_count: 0,
                    url: 'std_' + c.id + '_' + encodeURIComponent(c.title)
                };
            });
            call(makePart
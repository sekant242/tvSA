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
            call(makePart('🏢 Студии', cards));
        });

        // 6. Режиссёры
        parts_data.push(function (call) {
            var cards = DIRECTORS.map(function (c) {
                return {
                    source: SOURCE_NAME,
                    id: 'dir_' + c.id,
                    type: 'menu',
                    title: c.title,
                    original_title: '',
                    img: '',
                    vote_average: 0,
                    vote_count: 0,
                    url: 'dir_' + c.id + '_' + encodeURIComponent(c.title)
                };
            });
            call(makePart('🎥 Режиссёры', cards));
        });

        // 7. Актёры
        parts_data.push(function (call) {
            var cards = ACTORS.map(function (c) {
                return {
                    source: SOURCE_NAME,
                    id: 'act_' + c.id,
                    type: 'menu',
                    title: c.title,
                    original_title: '',
                    img: '',
                    vote_average: 0,
                    vote_count: 0,
                    url: 'act_' + c.id + '_' + encodeURIComponent(c.title)
                };
            });
            call(makePart('⭐ Актёры', cards));
        });

        // 8. Страны
        parts_data.push(function (call) {
            var cards = COUNTRIES.map(function (c) {
                return {
                    source: SOURCE_NAME,
                    id: 'cnt_' + c.code,
                    type: 'menu',
                    title: c.title,
                    original_title: '',
                    img: '',
                    vote_average: 0,
                    vote_count: 0,
                    url: 'cnt_' + c.code + '_' + encodeURIComponent(c.title)
                };
            });
            call(makePart('🌍 Страны', cards));
        });

        // 9. Поджанры
        parts_data.push(function (call) {
            var cards = SUBGENRES.map(function (c) {
                return {
                    source: SOURCE_NAME,
                    id: 'sub_' + c.id,
                    type: 'menu',
                    title: c.title,
                    original_title: '',
                    img: '',
                    vote_average: 0,
                    vote_count: 0,
                    url: 'sub_' + c.id + '_' + encodeURIComponent(c.title)
                };
            });
            call(makePart('🎭 Поджанры', cards));
        });

        // 10. 10 тОПов
        TOPS.forEach(function (top, idx) {
            parts_data.push(function (call) {
                var fetcher = top.type === 'tv' ? fetchTV : fetchMovies;
                fetcher(top.params, function (results) {
                    call(makePart(top.title, results, 'top_' + idx));
                }, call);
            });
        });

        var parts_limit = 5;
        function loadPart(partLoaded, partEmpty) {
            Lampa.Api.partNext(parts_data, parts_limit, partLoaded, partEmpty);
        }

        loadPart(oncomplite, onerror);
        return loadPart;
    }

    // ============================================================
    //  CATEGORY — переход по селектору / топу
    // ============================================================
    function category(params, oncomplite, onerror) {
        var url = params.url || '';
        var parts_data = [];

        var colMatch = url.match(/^col_(\d+)_(.+)$/);
        var stdMatch = url.match(/^std_(\d+)_(.+)$/);
        var dirMatch = url.match(/^dir_(\d+)_(.+)$/);
        var actMatch = url.match(/^act_(\d+)_(.+)$/);
        var cntMatch = url.match(/^cnt_([A-Z]+)_(.+)$/);
        var subMatch = url.match(/^sub_(\d+)_(.+)$/);
        var topMatch = url.match(/^top_(\d+)$/);

        if (colMatch) {
            var col_id    = parseInt(colMatch[1]);
            var col_title = decodeURIComponent(colMatch[2]);
            parts_data.push(function (call) {
                fetchCollection(col_id, function (results) {
                    call(makePart(col_title, results));
                }, call);
            });
        }
        else if (stdMatch) {
            var std_id    = parseInt(stdMatch[1]);
            var std_title = decodeURIComponent(stdMatch[2]);
            parts_data.push(function (call) {
                fetchMovies({
                    with_companies: std_id,
                    with_genres:    HORROR_GENRE,
                    sort_by:        'popularity.desc',
                    page:           1
                }, function (results) {
                    call(makePart(std_title, results));
                }, call);
            });
        }
        else if (dirMatch) {
            var dir_id    = parseInt(dirMatch[1]);
            var dir_title = decodeURIComponent(dirMatch[2]);
            parts_data.push(function (call) {
                fetchMovies({
                    with_crew:   dir_id,
                    with_genres: HORROR_GENRE,
                    sort_by:     'popularity.desc',
                    page:        1
                }, function (results) {
                    call(makePart(dir_title, results));
                }, call);
            });
        }
        else if (actMatch) {
            var act_id    = parseInt(actMatch[1]);
            var act_title = decodeURIComponent(actMatch[2]);
            parts_data.push(function (call) {
                fetchMovies({
                    with_cast:   act_id,
                    with_genres: HORROR_GENRE,
                    sort_by:     'popularity.desc',
                    page:        1
                }, function (results) {
                    call(makePart(act_title, results));
                }, call);
            });
        }
        else if (cntMatch) {
            var cnt_code  = cntMatch[1];
            var cnt_title = decodeURIComponent(cntMatch[2]);
            parts_data.push(function (call) {
                fetchMovies({
                    with_origin_country: cnt_code,
                    with_genres:         HORROR_GENRE,
                    sort_by:             'popularity.desc',
                    page:                1
                }, function (results) {
                    call(makePart(cnt_title, results));
                }, call);
            });
        }
        else if (subMatch) {
            var sub_id    = parseInt(subMatch[1]);
            var sub_title = decodeURIComponent(subMatch[2]);
            parts_data.push(function (call) {
                fetchMovies({
                    with_keywords: sub_id,
                    with_genres:   HORROR_GENRE,
                    sort_by:       'popularity.desc',
                    page:          1
                }, function (results) {
                    call(makePart(sub_title, results));
                }, call);
            });
        }
        else if (topMatch) {
            var top_idx = parseInt(topMatch[1]);
            var top     = TOPS[top_idx];
            if (top) {
                var fetcher = top.type === 'tv' ? fetchTV : fetchMovies;
                parts_data.push(function (call) {
                    fetcher(top.params, function (results) {
                        call(makePart(top.title, results));
                    }, call);
                });
            }
        }
        else {
            return main(params, oncomplite, onerror);
        }

        var loadPart = function (partLoaded, partEmpty) {
            Lampa.Api.partNext(parts_data, 5, partLoaded, partEmpty);
        };
        loadPart(oncomplite, onerror);
        return loadPart;
    }

    // ============================================================
    //  FULL — подробная карточка фильма
    // ============================================================
    function full(params, oncomplite, onerror) {
        var card = params.card;
        if (!card) return onerror();

        // Если это «папочная» карточка — не грузим TMDB, а сразу переходим
        if (card.type === 'menu' && card.url) {
            Lampa.Router.call('category', {
                url:      card.url,
                title:    card.title,
                source:   SOURCE_NAME,
                page:     1
            });
            // отдаём пустой результат, чтобы Lampa закрыла окно full
            oncomplite({});
            return;
        }

        var type = card.name || card.original_name ? 'tv' : 'movie';
        var id   = card.id;

        tmdbApi(type + '/' + id, {
            language:            'ru-RU',
            append_to_response:  'credits,similar,videos'
        }, function (data) {
            var result = convert(data, type);

            var persons = { cast: [], crew: [] };
            if (data.credits) {
                persons.cast = (data.credits.cast || []).slice(0, 20).map(function (p) {
                    return {
                        id:        p.id,
                        name:      p.name,
                        character: p.character || '',
                        img:       p.profile_path ? Lampa.TMDB.image('t/p/w185' + p.profile_path) : '',
                        url:       'person'
                    };
                });
                persons.crew = (data.credits.crew || []).slice(0, 20).map(function (p) {
                    return {
                        id:   p.id,
                        name: p.name,
                        job:  p.job || '',
                        img:  p.profile_path ? Lampa.TMDB.image('t/p/w185' + p.profile_path) : '',
                        url:  'person'
                    };
                });
            }

            var simular = null;
            if (data.similar && data.similar.results) {
                simular = {
                    results: data.similar.results.slice(0, 20).map(function (d) {
                        return convert(d, type);
                    })
                };
            }

            var status = new Lampa.Status(4);
            status.onComplite = oncomplite;
            status.append('movie',      result);
            status.append('persons',    persons);
            status.append('collection', null);
            status.append('simular',    simular);
        }, onerror);
    }

    // ============================================================
    //  LIST — постраничный список (для category_full)
    // ============================================================
    function list(params, oncomplite, onerror) {
        var url  = params.url;
        var page = params.page || 1;

        var qPos  = url.indexOf('?');
        var path  = qPos >= 0 ? url.substring(0, qPos) : url;
        var query = qPos >= 0 ? url.substring(qPos + 1) : '';

        var tmdbParams = { page: page };
        query.split('&').forEach(function (kv) {
            if (!kv) return;
            var idx = kv.indexOf('=');
            if (idx > 0) {
                tmdbParams[decodeURIComponent(kv.substring(0, idx))] = decodeURIComponent(kv.substring(idx + 1));
            }
        });

        tmdbApi(path, tmdbParams, function (data) {
            var results = (data.results || []).map(function (d) { return convert(d); });

            oncomplite({
                results:       results,
                url:           url,
                page:          data.page          || 1,
                total_pages:   data.total_pages   || 1,
                total_results: data.total_results || results.length,
                more:          (data.page || 1) < (data.total_pages || 1)
            });
        }, onerror);
    }

    // ============================================================
    //  DISCOVERY / SEARCH
    // ============================================================
    function search(params, oncomplite, onerror) {
        var query = decodeURIComponent(params.query || '');
        if (!query) return oncomplite([]);

        tmdbApi('search/multi', {
            query:        query,
            include_adult: false,
            language:     'ru-RU',
            page:         1
        }, function (data) {
            var items  = [];
            var movies = [];
            var tv     = [];

            (data.results || []).forEach(function (d) {
                if (d.media_type === 'movie') movies.push(convert(d, 'movie'));
                else if (d.media_type === 'tv') tv.push(convert(d, 'tv'));
            });

            if (movies.length) items.push({ title: 'Фильмы',  results: movies, type: 'movie' });
            if (tv.length)     items.push({ title: 'Сериалы', results: tv,     type: 'tv'    });

            oncomplite(items);
        }, onerror);
    }

    function discovery() {
        return {
            title:  SOURCE_TITLE,
            search: search,
            params: {
                align_left: true,
                object:     { source: SOURCE_NAME }
            },
            onMore: function (params) {
                Lampa.Activity.push({
                    url:       'search_' + encodeURIComponent(params.query),
                    title:     'Поиск: ' + params.query,
                    component: 'category_full',
                    source:    SOURCE_NAME,
                    page:      1,
                    query:     params.query
                });
            },
            onCancel: function () { network.clear(); }
        };
    }

    // ============================================================
    //  Заглушки
    // ============================================================
    function menu(params, oncomplite) { oncomplite([]); }
    function person(params, oncomplite) { oncomplite({}); }
    function seasons(tv, from, oncomplite) { oncomplite({}); }
    function menuCategory(params, oncomplite) { oncomplite([]); }
    function clear() { network.clear(); }

    // ============================================================
    //  Регистрация источника
    // ============================================================
    var HORROR = {
        SOURCE_NAME:  SOURCE_NAME,
        SOURCE_TITLE: SOURCE_TITLE,
        main:         main,
        menu:         menu,
        full:         full,
        list:         list,
        category:     category,
        clear:        clear,
        person:       person,
        seasons:      seasons,
        menuCategory: menuCategory,
        discovery:    discovery
    };

    // ============================================================
    //  Плагин
    // ============================================================
    function startPlugin() {
        window.horror_plugin = true;

        function addPlugin() {
            // Регистрируем источник
            if (!Lampa.Api.sources[SOURCE_NAME]) {
                Lampa.Api.sources[SOURCE_NAME] = HORROR;
                Object.defineProperty(Lampa.Api.sources, SOURCE_NAME, {
                    get: function () { return HORROR; }
                });
            }

            // Обработка действия 'horror' в меню
            Lampa.Listener.follow('menu', function (e) {
                if (e.type === 'action' && e.action === 'horror') {
                    Lampa.Storage.set('source', SOURCE_NAME);
                    Lampa.Activity.push({
                        url:       '',
                        title:     SOURCE_TITLE,
                        component: 'category',
                        source:    SOURCE_NAME,
                        page:      1
                    });
                    if (e.abort) e.abort();
                }
            });

            // Пытаемся добавить пункт в сайдбар
            addMenuItem();

            Lampa.Listener.follow('menu', function (e) {
                if (e.type === 'open' || e.type === 'render') {
                    setTimeout(addMenuItem, 100);
                }
            });

            // Периодическая проверка (на случай перерисовки)
            setInterval(addMenuItem, 2000);
        }

        function addMenuItem() {
            var lists = $('.menu .menu__list, .menu__list');
            if (!lists.length) return;

            lists.each(function () {
                var list = $(this);
                if (list.find('[data-action="horror"]').length) return;

                var item = $(
                    '<div class="menu__item selector" data-action="horror">' +
                        '<div class="menu__ico">' +
                            '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">' +
                                '<path d="M12 2C8.13 2 5 5.13 5 9c0 1.66.5 3.2 1.36 4.48C5.5 14.68 5 16.28 5 18c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4 0-1.72-.5-3.32-1.36-4.52C18.5 12.2 19 10.66 19 9c0-3.87-3.13-7-7-7zm-3 8c-.83 0-1.5-.67-1.5-1.5S8.17 7 9 7s1.5.67 1.5 1.5S9.83 10 9 10zm6 0c-.83 0-1.5-.67-1.5-1.5S14.17 7 15 7s1.5.67 1.5 1.5S15.83 10 15 10zm-3 8c-2.21 0-4-1.79-4-4 0-.5.1-1 .29-1.44.62.88 1.65 1.44 2.71 1.44h2c1.06 0 2.09-.56 2.71-1.44.19.44.29.94.29 1.44 0 2.21-1.79 4-4 4z"/>' +
                            '</svg>' +
                        '</div>' +
                        '<div class="menu__text">' + SOURCE_TITLE + '</div>' +
                    '</div>'
                );

                item.on('hover:enter', function () {
                    Lampa.Storage.set('source', SOURCE_NAME);
                    Lampa.Activity.push({
                        url:       '',
                        title:     SOURCE_TITLE,
                        component: 'category',
                        source:    SOURCE_NAME,
                        page:      1
                    });
                });

                list.append(item);
            });
        }

        if (window.appready) addPlugin();
        else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type === 'ready') addPlugin();
            });
        }
    }

    if (!window.horror_plugin) startPlugin();

})();
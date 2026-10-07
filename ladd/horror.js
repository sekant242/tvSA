(function () {
    'use strict';

    if (window.__horror_plugin__) return;
    window.__horror_plugin__ = true;

    // ═══════════════════════════════════════════════════════════════
    // CONFIG
    // ═══════════════════════════════════════════════════════════════

    var COMPONENT = 'horror';
    var TITLE = 'Ужасы';
    var DEFAULT_GENRE = '27|53';
    var MENU_RETRY_INTERVAL = 500;
    var MENU_MAX_RETRIES = 40;

    var ICON = '<svg width="26" height="28" viewBox="0 0 24 24" fill="none" ' +
        'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
        'xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M12 2C7.6 2 4 5.6 4 10v9l2.5-2L9 19l3-2 3 2 2.5-2L20 19v-9c0-4.4-3.6-8-8-8z"/>' +
        '<circle cx="9" cy="10" r="1" fill="currentColor"/>' +
        '<circle cx="15" cy="10" r="1" fill="currentColor"/>' +
        '</svg>';

    var GENRES = [
        { id: '27|53', title: 'Все' },
        { id: '27',    title: 'Ужасы' },
        { id: '53',    title: 'Триллеры' }
    ];

    var LANGUAGES = [
        { code: 'ru', title: 'Русский' },
        { code: 'en', title: 'Английский' },
        { code: 'ja', title: 'Японский' },
        { code: 'ko', title: 'Корейский' },
        { code: 'es', title: 'Испанский' },
        { code: 'fr', title: 'Французский' },
        { code: 'de', title: 'Немецкий' },
        { code: 'it', title: 'Итальянский' },
        { code: 'pt', title: 'Португальский' },
        { code: 'zh', title: 'Китайский' },
        { code: 'hi', title: 'Хинди' },
        { code: 'th', title: 'Тайский' },
        { code: 'sv', title: 'Шведский' },
        { code: 'no', title: 'Норвежский' },
        { code: 'da', title: 'Датский' },
        { code: 'tr', title: 'Турецкий' }
    ];

    var SUBGENRES = [
        { id: 12377,  title: 'Зомби' },
        { id: 3133,   title: 'Вампиры' },
        { id: 288394, title: 'Призраки' },
        { id: 9951,   title: 'Инопланетяне' },
        { id: 10427,  title: 'Демоны' },
        { id: 9755,   title: 'Ведьмы' },
        { id: 234452, title: 'Слэшер' },
        { id: 10714,  title: 'Серийный убийца' },
        { id: 9715,   title: 'Сверхъестественное' },
        { id: 10541,  title: 'Проклятие' },
        { id: 14819,  title: 'Монстры' },
        { id: 162403, title: 'Экзорцизм' },
        { id: 158718, title: 'Найденная плёнка' },
        { id: 6152,   title: 'Оккультизм' },
        { id: 2182,   title: 'Каннибалы' },
        { id: 11477,  title: 'Психопаты' },
        { id: 2343,   title: 'Мутанты' },
        { id: 10292,  title: 'Готика' },
        { id: 722,    title: 'Апокалипсис' },
        { id: 1800,   title: 'Паранойя' }
    ];

    // Логотипы студий (SVG с Wikimedia Commons — стабильные прямые ссылки)
    var STUDIOS = [
        { id: 3172,  title: 'Blumhouse',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Blumhouse_Productions_logo.svg/320px-Blumhouse_Productions_logo.svg.png' },
        { id: 41077, title: 'A24',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/A24_logo.svg/320px-A24_logo.svg.png' },
        { id: 10330, title: 'Ghost House',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Ghost_House_Pictures_logo.svg/320px-Ghost_House_Pictures_logo.svg.png' },
        { id: 8850,  title: 'Hammer Film',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Hammer_Film_Productions_logo.svg/320px-Hammer_Film_Productions_logo.svg.png' },
        { id: 22846, title: 'Dark Castle',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/DarkCastlelogo.svg/320px-DarkCastlelogo.svg.png' },
        { id: 90764, title: 'Neon',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Neon_logo.svg/320px-Neon_logo.svg.png' },
        { id: 12,    title: 'New Line Cinema',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/New_Line_Cinema.svg/320px-New_Line_Cinema.svg.png' },
        { id: 174,   title: 'Warner Bros.',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Warner_Bros._logo_2023.svg/320px-Warner_Bros._logo_2023.svg.png' },
        { id: 33,    title: 'Universal',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Universal_Pictures_logo.svg/320px-Universal_Pictures_logo.svg.png' },
        { id: 4,     title: 'Paramount',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Paramount_Pictures_Corporation_logo.svg/320px-Paramount_Pictures_Corporation_logo.svg.png' },
        { id: 25,    title: '20th Century',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/20th_Century_Studios.svg/320px-20th_Century_Studios.svg.png' },
        { id: 10570, title: 'Orion Pictures',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Orion_Pictures_logo.svg/320px-Orion_Pictures_logo.svg.png' }
    ];

    // MULTI_FILTERS: только языки и поджанры — чекбоксы.
    // Студии вынесены отдельно — одиночный выбор с логотипами.
    var MULTI_FILTERS = [
        { key: 'languages', title: 'Язык',    items: LANGUAGES, prop: 'code' },
        { key: 'subgenres', title: 'Поджанр', items: SUBGENRES, prop: 'id' }
    ];

    // ═══════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════

    var state = {
        genre: DEFAULT_GENRE,
        languages: [],
        subgenres: [],
        studio: null,       // одиночный выбор вместо массива
        searchQuery: ''
    };

    // ═══════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════

    function hasActiveFilters() {
        return state.languages.length > 0 ||
            state.subgenres.length > 0 ||
            state.studio !== null ||
            state.genre !== DEFAULT_GENRE ||
            state.searchQuery !== '';
    }

    function resetFilters() {
        state.genre = DEFAULT_GENRE;
        state.languages = [];
        state.subgenres = [];
        state.studio = null;
        state.searchQuery = '';
    }

    function buildFilterParams() {
        var filter = {};
        if (state.languages.length) filter.with_original_language = state.languages.join('|');
        if (state.subgenres.length) filter.with_keywords = state.subgenres.join('|');
        if (state.studio !== null)  filter.with_companies = String(state.studio);
        return filter;
    }

    // Полный объект активности — все поля задаются явно,
    // чтобы при Activity.replace ничего старого не «прилипало».
    function buildActivityObject() {
        var obj = {
            component: COMPONENT,
            title: TITLE,
            source: 'tmdb',
            page: 1,
            url: 'discover/movie',
            genres: state.genre,
            query: '',
            filter: {}
        };

        if (state.searchQuery) {
            obj.url = 'search/movie';
            obj.query = encodeURIComponent(state.searchQuery);
            obj.genres = '';
        } else {
            obj.filter = buildFilterParams();
        }

        return obj;
    }

    // ═══════════════════════════════════════════════════════════════
    // STYLES
    // ═══════════════════════════════════════════════════════════════

    function injectStyles() {
        if (document.getElementById('horror-plugin-styles')) return;

        var style = document.createElement('style');
        style.id = 'horror-plugin-styles';
        style.textContent = [
            '.horror-filters{display:flex;align-items:center;gap:.5em;padding:.7em 1.2em;flex-wrap:wrap;',
            'background:rgba(0,0,0,.35);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);',
            'border-bottom:1px solid rgba(255,255,255,.06)}',
            '.horror-filter-btn{padding:.5em 1.05em;background:rgba(255,255,255,.08);border-radius:2em;',
            'font-size:.92em;color:#fff;transition:background .15s;white-space:nowrap;',
            'border:1px solid rgba(255,255,255,.1);cursor:pointer;display:flex;align-items:center;gap:.4em}',
            '.horror-filter-btn:hover{background:rgba(255,255,255,.16)}',
            '.horror-filter-btn.focus{background:#fff;color:#000}',
            '.horror-filter-reset{background:rgba(220,60,60,.25);border-color:rgba(220,60,60,.4)}',
            '.horror-filter-count{opacity:.65;margin-left:.4em;font-size:.85em}',
            '.horror-filter-logo{height:1.2em;width:auto;max-width:3.2em;object-fit:contain;',
            'vertical-align:middle;filter:brightness(0) invert(1)}',
            '.horror-filter-btn.focus .horror-filter-logo{filter:none}',
            '.horror-studio-item .selectbox-item__icon img{height:1.6em;width:auto;max-width:5em;object-fit:contain}',
            '.horror-studio-item .selectbox-item__icon{background:transparent!important}'
        ].join('');
        document.head.appendChild(style);
    }

    // ═══════════════════════════════════════════════════════════════
    // FILTERS UI
    // ═══════════════════════════════════════════════════════════════

    function openGenreFilter(onChange) {
        var items = GENRES.map(function (g) {
            return { title: g.title, id: g.id, selected: state.genre === g.id };
        });

        Lampa.Select.show({
            title: 'Жанр',
            items: items,
            onSelect: function (item) {
                state.genre = item.id;
                Lampa.Controller.toggle('content');
                onChange();
            },
            onBack: function () {
                Lampa.Controller.toggle('content');
            }
        });
    }

    // Универсальный чекбокс-фильтр (языки / поджанры)
    function openMultiFilter(def, onChange) {
        var selected = state[def.key];
        var changed = false;

        var items = def.items.map(function (item) {
            var id = item[def.prop];
            return {
                title: item.title,
                id: id,
                checkbox: true,
                checked: selected.indexOf(id) !== -1
            };
        });

        Lampa.Select.show({
            title: def.title,
            items: items,
            onCheck: function (item) {
                var idx = selected.indexOf(item.id);
                if (item.checked && idx === -1) selected.push(item.id);
                else if (!item.checked && idx !== -1) selected.splice(idx, 1);
                changed = true;
            },
            onBack: function () {
                Lampa.Controller.toggle('content');
                if (changed) onChange();
            }
        });
    }

    // Одиночный выбор студии с логотипами
    function openStudioFilter(onChange) {
        var items = STUDIOS.map(function (s) {
            return {
                title: s.title,
                id: s.id,
                selected: state.studio === s.id,
                template: 'selectbox_icon',
                icon: '<img src="' + s.logo + '" onerror="this.style.display=\'none\'">',
                // Добавляем класс для стилизации через onDraw
                _studio: true
            };
        });

        // «Любая студия» — сброс
        items.unshift({
            title: 'Любая',
            id: null,
            selected: state.studio === null,
            template: 'selectbox_item'
        });

        Lampa.Select.show({
            title: 'Студия',
            items: items,
            onSelect: function (item) {
                state.studio = item.id;
                Lampa.Controller.toggle('content');
                onChange();
            },
            onDraw: function (item, elem) {
                if (elem._studio) {
                    item.addClass('horror-studio-item');
                }
            },
            onBack: function () {
                Lampa.Controller.toggle('content');
            }
        });
    }

    function openSearchInput(onChange) {
        var controller = Lampa.Controller.enabled().name;

        Lampa.Input.edit({
            title: 'Поиск по названию',
            value: state.searchQuery,
            free: true,
            nosave: true,
            nomic: true
        }, function (value) {
            var newQuery = (value || '').trim();
            var wasChanged = newQuery !== state.searchQuery;
            state.searchQuery = newQuery;
            Lampa.Controller.toggle(controller);
            if (wasChanged) onChange();
        });
    }

    function buildFiltersBar(onChange) {
        var bar = document.createElement('div');
        bar.className = 'horror-filters';

        // Жанр
        var genreLabel = 'Жанр';
        if (state.genre !== DEFAULT_GENRE) {
            var found = GENRES.find(function (g) { return g.id === state.genre; });
            if (found) genreLabel = 'Жанр: ' + found.title;
        }
        var genreBtn = document.createElement('div');
        genreBtn.className = 'horror-filter-btn selector';
        genreBtn.textContent = genreLabel;
        genreBtn.addEventListener('click', function () { openGenreFilter(onChange); });
        bar.appendChild(genreBtn);

        // Язык / Поджанр (чекбоксы)
        MULTI_FILTERS.forEach(function (def) {
            var count = state[def.key].length;
            var btn = document.createElement('div');
            btn.className = 'horror-filter-btn selector';
            btn.textContent = def.title;

            if (count > 0) {
                var span = document.createElement('span');
                span.className = 'horror-filter-count';
                span.textContent = count;
                btn.appendChild(span);
            }

            btn.addEventListener('click', function () { openMultiFilter(def, onChange); });
            bar.appendChild(btn);
        });

        // Студия (одиночный выбор с логотипом)
        var studioBtn = document.createElement('div');
        studioBtn.className = 'horror-filter-btn selector';
        if (state.studio !== null) {
            var s = STUDIOS.find(function (x) { return x.id === state.studio; });
            if (s) {
                var img = document.createElement('img');
                img.className = 'horror-filter-logo';
                img.src = s.logo;
                img.onerror = function () { this.style.display = 'none'; };
                studioBtn.appendChild(img);
                var txt = document.createElement('span');
                txt.textContent = s.title;
                studioBtn.appendChild(txt);
            } else {
                studioBtn.textContent = 'Студия';
            }
        } else {
            studioBtn.textContent = 'Студия';
        }
        studioBtn.addEventListener('click', function () { openStudioFilter(onChange); });
        bar.appendChild(studioBtn);

        // Поиск
        var searchLabel = state.searchQuery
            ? 'Поиск: ' + state.searchQuery.slice(0, 20)
            : 'Поиск';
        var searchBtn = document.createElement('div');
        searchBtn.className = 'horror-filter-btn selector';
        searchBtn.textContent = searchLabel;
        searchBtn.addEventListener('click', function () { openSearchInput(onChange); });
        bar.appendChild(searchBtn);

        // Сброс
        if (hasActiveFilters()) {
            var resetBtn = document.createElement('div');
            resetBtn.className = 'horror-filter-btn horror-filter-reset selector';
            resetBtn.textContent = 'Сбросить';
            resetBtn.addEventListener('click', function () {
                resetFilters();
                onChange();
            });
            bar.appendChild(resetBtn);
        }

        return bar;
    }

    // ═══════════════════════════════════════════════════════════════
    // COMPONENT
    // ═══════════════════════════════════════════════════════════════

    function HorrorComponent(object) {
        injectStyles();

        // Сливаем актуальные фильтры в объект активности
        var activityObj = buildActivityObject();
        Object.keys(activityObj).forEach(function (k) {
            if (k !== 'component') object[k] = activityObj[k];
        });

        // Класс Category — грид карточек, использует Lampa.Api.list
        var comp = Lampa.Maker.make('Category', object);
        var filtersBar = null;

        comp.use({
            onCreate: function () {
                var _this = this;

                // 1) Грузим данные. onEmpty сработает при пустом ответе TMDB
                Lampa.Api.list(
                    object,
                    this.build.bind(this),
                    this.empty.bind(this)
                );

                // 2) Вставляем фильтр-бар над скроллом
                filtersBar = buildFiltersBar(function () {
                    Lampa.Activity.replace(buildActivityObject());
                });
                this.html.insertBefore(filtersBar, this.html.firstChild);

                // 3) Скорректировать высоту скролла с учётом фильтр-бара
                requestAnimationFrame(function () {
                    if (_this.scroll && filtersBar && filtersBar.parentNode) {
                        _this.scroll.minus(filtersBar);
                        Lampa.Layer.update(_this.html);
                    }
                });
            },

            // Подгрузка следующей страницы (бесконечный скролл)
            onNext: function (resolve, reject) {
                Lampa.Api.list(object, resolve.bind(this), reject.bind(this));
            },

            // Клик по карточке -> полная карточка фильма
            onInstance: function (item, data) {
                item.use({
                    onEnter: Lampa.Router.call.bind(Lampa.Router, 'full', data),
                    onFocus: function () {
                        Lampa.Background.change(Lampa.Utils.cardImgBackground(data));
                    }
                });
            },

            // Пустой результат — показываем заглушку вместо вечного лоадера
            onEmpty: function () {
                var _this2 = this;
                var empty = new Lampa.Empty({
                    title: 'Ничего не найдено',
                    descr: 'По выбранным фильтрам нет фильмов. Попробуйте изменить условия или сбросить фильтры.'
                });
                this.empty_class = empty;
                this.scroll.append(empty.render(true));
                this.start = empty.start.bind(empty);

                // Кнопка сброса фильтров на пустом экране
                var resetBtn = document.createElement('div');
                resetBtn.className = 'simple-button selector';
                resetBtn.style.margin = '1em auto';
                resetBtn.textContent = 'Сбросить фильтры';
                resetBtn.addEventListener('click', function () {
                    resetFilters();
                    Lampa.Activity.replace(buildActivityObject());
                });
                empty.html.append(resetBtn);

                this.activity.loader(false);
                this.activity.toggle();
            },

            onDestroy: function () {
                if (filtersBar && filtersBar.parentNode) {
                    filtersBar.parentNode.removeChild(filtersBar);
                }
                filtersBar = null;
            }
        });

        return comp;
    }

    // ═══════════════════════════════════════════════════════════════
    // MENU INTEGRATION
    // ═══════════════════════════════════════════════════════════════

    function pushHorror() {
        Lampa.Activity.push(buildActivityObject());
    }

    function tryAddToMenu() {
        if (!Lampa.Menu || typeof Lampa.Menu.addButton !== 'function') return false;
        if (window.__horror_menu_added__) return true;

        Lampa.Menu.addButton(ICON, TITLE, pushHorror);
        window.__horror_menu_added__ = true;
        return true;
    }

    function initMenu() {
        if (tryAddToMenu()) return;

        var attempts = 0;
        var interval = setInterval(function () {
            if (tryAddToMenu() || ++attempts >= MENU_MAX_RETRIES) {
                clearInterval(interval);
            }
        }, MENU_RETRY_INTERVAL);
    }

    // ═══════════════════════════════════════════════════════════════
    // BOOT
    // ═══════════════════════════════════════════════════════════════

    if (Lampa && Lampa.Component && Lampa.Component.add) {
        Lampa.Component.add(COMPONENT, HorrorComponent);
    } else {
        console.error('[Horror Plugin] Lampa.Component.add недоступен');
        return;
    }

    if (window.appready) {
        initMenu();
    } else if (Lampa.Listener) {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') initMenu();
        });
    }

    console.log('[Horror Plugin] Loaded');
})();
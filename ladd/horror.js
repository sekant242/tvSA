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
        { id: '27', title: 'Ужасы' },
        { id: '53', title: 'Триллеры' }
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
        { id: 12377, title: 'Зомби' },
        { id: 3133, title: 'Вампиры' },
        { id: 288394, title: 'Призраки' },
        { id: 9951, title: 'Инопланетяне' },
        { id: 10427, title: 'Демоны' },
        { id: 9755, title: 'Ведьмы' },
        { id: 234452, title: 'Слэшер' },
        { id: 10714, title: 'Серийный убийца' },
        { id: 9715, title: 'Сверхъестественное' },
        { id: 10541, title: 'Проклятие' },
        { id: 14819, title: 'Монстры' },
        { id: 162403, title: 'Экзорцизм' },
        { id: 158718, title: 'Найденная плёнка' },
        { id: 6152, title: 'Оккультизм' },
        { id: 2182, title: 'Каннибалы' },
        { id: 11477, title: 'Психопаты' },
        { id: 2343, title: 'Мутанты' },
        { id: 10292, title: 'Готика' },
        { id: 722, title: 'Апокалипсис' },
        { id: 1800, title: 'Паранойя' }
    ];

    var STUDIOS = [
        { id: 3172, title: 'Blumhouse' },
        { id: 41077, title: 'A24' },
        { id: 10330, title: 'Ghost House' },
        { id: 8850, title: 'Hammer Film' },
        { id: 22846, title: 'Dark Castle' },
        { id: 90764, title: 'Neon' },
        { id: 12, title: 'New Line Cinema' },
        { id: 174, title: 'Warner Bros.' },
        { id: 33, title: 'Universal' },
        { id: 4, title: 'Paramount' },
        { id: 25, title: '20th Century' },
        { id: 10570, title: 'Orion Pictures' }
    ];

    // Единый источник правды для всех чекбокс-фильтров
    var MULTI_FILTERS = [
        { key: 'languages', title: 'Язык', items: LANGUAGES, prop: 'code' },
        { key: 'subgenres', title: 'Поджанр', items: SUBGENRES, prop: 'id' },
        { key: 'studios', title: 'Студия', items: STUDIOS, prop: 'id' }
    ];

    // ═══════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════

    var state = {
        genre: DEFAULT_GENRE,
        languages: [],
        subgenres: [],
        studios: [],
        searchQuery: ''
    };

    // ═══════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════

    function hasActiveFilters() {
        return state.languages.length > 0 ||
            state.subgenres.length > 0 ||
            state.studios.length > 0 ||
            state.genre !== DEFAULT_GENRE ||
            state.searchQuery !== '';
    }

    function resetFilters() {
        state.genre = DEFAULT_GENRE;
        state.languages = [];
        state.subgenres = [];
        state.studios = [];
        state.searchQuery = '';
    }

    function buildFilterParams() {
        var filter = {};
        if (state.languages.length) filter.with_original_language = state.languages.join('|');
        if (state.subgenres.length) filter.with_keywords = state.subgenres.join('|');
        if (state.studios.length) filter.with_companies = state.studios.join('|');
        return filter;
    }

    // Явно указываем все ключи (в т.ч. пустые) — чтобы при replace старые значения не «прилипали»
    function buildActivityObject() {
        var obj = {
            component: COMPONENT,
            title: TITLE,
            source: 'tmdb',
            page: 1,
            url: 'discover/movie',
            genres: state.genre,
            query: '',
            filter: buildFilterParams()
        };

        if (state.searchQuery) {
            obj.url = 'search/movie';
            obj.query = encodeURIComponent(state.searchQuery);
            obj.genres = '';           // для поиска жанры не нужны
            obj.filter = {};
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
            '.horror-filters{display:flex;align-items:center;gap:.6em;padding:0 1.2em 1.2em;flex-wrap:wrap}',
            '.horror-filter-btn{padding:.55em 1.2em;background:rgba(255,255,255,.08);border-radius:2em;font-size:.95em;color:#fff;transition:background .15s;white-space:nowrap;border:1px solid rgba(255,255,255,.1);cursor:pointer}',
            '.horror-filter-btn:hover{background:rgba(255,255,255,.15)}',
            '.horror-filter-btn.focus{background:#fff;color:#000}',
            '.horror-filter-reset{background:rgba(220,60,60,.25);border-color:rgba(220,60,60,.4)}',
            '.horror-filter-count{opacity:.6;margin-left:.4em;font-size:.85em}'
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

    // Универсальный чекбокс-фильтр (языки / поджанры / студии)
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
        genreBtn.on('hover:enter', function () { openGenreFilter(onChange); });
        bar.appendChild(genreBtn);

        // Остальные фильтры (одной итерацией)
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

            btn.on('hover:enter', function () { openMultiFilter(def, onChange); });
            bar.appendChild(btn);
        });

        // Поиск
        var searchLabel = state.searchQuery
            ? 'Поиск: ' + state.searchQuery.slice(0, 20)
            : 'Поиск';
        var searchBtn = document.createElement('div');
        searchBtn.className = 'horror-filter-btn selector';
        searchBtn.textContent = searchLabel;
        searchBtn.on('hover:enter', function () { openSearchInput(onChange); });
        bar.appendChild(searchBtn);

        // Сброс
        if (hasActiveFilters()) {
            var resetBtn = document.createElement('div');
            resetBtn.className = 'horror-filter-btn horror-filter-reset selector';
            resetBtn.textContent = 'Сбросить';
            resetBtn.on('hover:enter', function () {
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

        var comp = Lampa.Maker.make('Category', object);
        var filtersBar = null;

        comp.use({
            onCreate: function () {
                filtersBar = buildFiltersBar(function () {
                    Lampa.Activity.replace(buildActivityObject());
                });

                if (this.html) {
                    if (typeof this.html.prepend === 'function') {
                        this.html.prepend(filtersBar);
                    } else if (this.html.insertBefore) {
                        this.html.insertBefore(filtersBar, this.html.firstChild);
                    }
                }
            },
            onDestroy: function () {
                if (filtersBar && typeof filtersBar.remove === 'function') {
                    filtersBar.remove();
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
    }

    if (window.appready) {
        initMenu();
    } else if (Lampa && Lampa.Listener) {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') initMenu();
        });
    }

    console.log('[Horror Plugin] Loaded');
})();
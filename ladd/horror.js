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

    // ═══ ID ИСПРАВЛЕНЫ ═══
    var STUDIOS = [
        { id: 3172,  title: 'Blumhouse' },
        { id: 41077, title: 'A24' },
        { id: 1314,  title: 'Hammer Film' },        // было 8850 — неверно
        { id: 90733, title: 'Neon' },               // было 90764 — неверно
        { id: 10330, title: 'Ghost House' },
        { id: 22846, title: 'Dark Castle' },
        { id: 12,    title: 'New Line Cinema' },
        { id: 174,   title: 'Warner Bros.' },
        { id: 33,    title: 'Universal' },
        { id: 4,     title: 'Paramount' },
        { id: 25,    title: '20th Century' },
        { id: 10570, title: 'Orion Pictures' }
    ];

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
        studio: null,
        searchQuery: ''
    };

    var studioLogosCache = {}; // { id: 'full_url' | null }

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
        // Для студий НЕ применяем жанровый фильтр — иначе Hammer и Neon пустые
        if (state.studio !== null)  filter.with_companies = String(state.studio);
        return filter;
    }

    function buildActivityObject() {
        var obj = {
            component: COMPONENT,
            title: TITLE,
            source: 'tmdb',
            page: 1,
            url: 'discover/movie',
            genres: state.genre,
            query: '',
            filter: {},
            sort_by: ''
        };

        if (state.searchQuery) {
            obj.url = 'search/movie';
            obj.query = encodeURIComponent(state.searchQuery);
            obj.genres = '';
            return obj;
        }

        // При выборе студии: убираем жанр, сортируем по дате (старые первыми)
        if (state.studio !== null) {
            obj.genres = '';
            obj.filter = { with_companies: String(state.studio) };
            obj.sort_by = 'primary_release_date.asc';
            return obj;
        }

        obj.filter = buildFilterParams();
        return obj;
    }

    // ═══════════════════════════════════════════════════════════════
    // LOGO LOADING (через TMDB API)
    // ═══════════════════════════════════════════════════════════════

    function loadStudioLogos(callback) {
        var key = Lampa.TMDB.key();
        var ids = STUDIOS.map(function (s) { return s.id; });
        var promises = ids.map(function (id) {
            if (studioLogosCache.hasOwnProperty(id)) {
                return Promise.resolve({ id: id, url: studioLogosCache[id] });
            }
            return fetch('https://api.themoviedb.org/3/company/' + id +
                    '?api_key=' + key + '&language=ru')
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    var url = data.logo_path
                        ? 'https://image.tmdb.org/t/p/w200' + data.logo_path
                        : null;
                    studioLogosCache[id] = url;
                    return { id: id, url: url };
                })
                .catch(function () { return { id: id, url: null }; });
        });

        Promise.all(promises).then(function () { callback(); });
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
            '.horror-filter-logo{height:1.4em;width:auto;max-width:4em;object-fit:contain;',
            'vertical-align:middle;filter:brightness(0) invert(1)}',
            '.horror-filter-btn.focus .horror-filter-logo{filter:none}',
            '.horror-studio-item .selectbox-item__icon img{height:1.8em;width:auto;max-width:6em;object-fit:contain}',
            '.horror-studio-item .selectbox-item__icon{background:transparent!important;padding:.3em}',
            '.horror-studio-loading{opacity:.5;pointer-events:none}'
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
            onBack: function () { Lampa.Controller.toggle('content'); }
        });
    }

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

    // ═══ Студии: одиночный выбор + логотипы из TMDB ═══
    function openStudioFilter(onChange) {
        var buildItems = function () {
            var items = STUDIOS.map(function (s) {
                var logoUrl = studioLogosCache[s.id];
                var icon = logoUrl
                    ? '<img src="' + logoUrl + '" onerror="this.style.display=\'none\'">'
                    : '';
                return {
                    title: s.title,
                    id: s.id,
                    selected: state.studio === s.id,
                    template: 'selectbox_icon',
                    icon: icon || '<svg width="24" height="24"><use xlink:href="#sprite-movie"></use></svg>',
                    _studio: true
                };
            });

            items.unshift({
                title: 'Любая',
                id: null,
                selected: state.studio === null,
                template: 'selectbox_item'
            });

            return items;
        };

        // Если логотипы ещё не загружены — грузим и открываем после
        if (Object.keys(studioLogosCache).length === 0) {
            var loadingItems = [{ title: 'Загрузка...', id: null, template: 'selectbox_item' }];
            Lampa.Select.show({
                title: 'Студия',
                items: loadingItems,
                onBack: function () { Lampa.Controller.toggle('content'); }
            });

            loadStudioLogos(function () {
                Lampa.Select.hide();
                showStudioSelect(buildItems(), onChange);
            });
        } else {
            showStudioSelect(buildItems(), onChange);
        }
    }

    function showStudioSelect(items, onChange) {
        Lampa.Select.show({
            title: 'Студия',
            items: items,
            onSelect: function (item) {
                state.studio = item.id;
                Lampa.Controller.toggle('content');
                onChange();
            },
            onDraw: function (item, elem) {
                if (elem._studio) item.addClass('horror-studio-item');
            },
            onBack: function () { Lampa.Controller.toggle('content'); }
        });
    }

    function openSearchInput(onChange) {
        var controller = Lampa.Controller.enabled().name;
        Lampa.Input.edit({
            title: 'Поиск по названию',
            value: state.searchQuery,
            free: true, nosave: true, nomic: true
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

        // Язык / Поджанр
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

        // Студия с логотипом на кнопке
        var studioBtn = document.createElement('div');
        studioBtn.className = 'horror-filter-btn selector';
        if (state.studio !== null) {
            var s = STUDIOS.find(function (x) { return x.id === state.studio; });
            if (s) {
                var logoUrl = studioLogosCache[s.id];
                if (logoUrl) {
                    var img = document.createElement('img');
                    img.className = 'horror-filter-logo';
                    img.src = logoUrl;
                    img.onerror = function () { this.style.display = 'none'; };
                    studioBtn.appendChild(img);
                }
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
        var searchBtn = document.createElement('div');
        searchBtn.className = 'horror-filter-btn selector';
        searchBtn.textContent = state.searchQuery
            ? 'Поиск: ' + state.searchQuery.slice(0, 20)
            : 'Поиск';
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

        var activityObj = buildActivityObject();
        Object.keys(activityObj).forEach(function (k) {
            if (k !== 'component') object[k] = activityObj[k];
        });

        var comp = Lampa.Maker.make('Category', object);
        var filtersBar = null;

        comp.use({
            onCreate: function () {
                var _this = this;
                Lampa.Api.list(object, this.build.bind(this), this.empty.bind(this));

                filtersBar = buildFiltersBar(function () {
                    Lampa.Activity.replace(buildActivityObject());
                });
                this.html.insertBefore(filtersBar, this.html.firstChild);

                requestAnimationFrame(function () {
                    if (_this.scroll && filtersBar && filtersBar.parentNode) {
                        _this.scroll.minus(filtersBar);
                        Lampa.Layer.update(_this.html);
                    }
                });
            },

            onNext: function (resolve, reject) {
                Lampa.Api.list(object, resolve.bind(this), reject.bind(this));
            },

            onInstance: function (item, data) {
                item.use({
                    onEnter: Lampa.Router.call.bind(Lampa.Router, 'full', data),
                    onFocus: function () {
                        Lampa.Background.change(Lampa.Utils.cardImgBackground(data));
                    }
                });
            },

            onEmpty: function () {
                var empty = new Lampa.Empty({
                    title: 'Ничего не найдено',
                    descr: 'По выбранным фильтрам нет фильмов. Попробуйте изменить условия или сбросить фильтры.'
                });
                this.empty_class = empty;
                this.scroll.append(empty.render(true));
                this.start = empty.start.bind(empty);

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
/* ============================================================
 *  ОБЪЕДИНЁННЫЙ ПЛАГИН ДЛЯ LAMPA
 *  1. Horror Plugin (раздел «Ужасы» с фильтрами)
 *  2. Horror Themes & Visual Glitches (темы карточек + глюки)
 * ============================================================ */

/* ------------------------------------------------------------
 *  ЧАСТЬ 1. HORROR PLUGIN (внешний скрипт)
 *  Источник: https://sekant242.github.io/tvSA/ladd/horror.js
 * ------------------------------------------------------------ */
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
    var ICON = '' + '' + '' + '' + '';
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
    // ═══ ID ИСПРАВЛЕНЫ ═══
    var STUDIOS = [
        { id: 3172, title: 'Blumhouse' },
        { id: 41077, title: 'A24' },
        { id: 1314, title: 'Hammer Film' },
        { id: 90733, title: 'Neon' },
        { id: 10330, title: 'Ghost House' },
        { id: 22846, title: 'Dark Castle' },
        { id: 12, title: 'New Line Cinema' },
        { id: 174, title: 'Warner Bros.' },
        { id: 33, title: 'Universal' },
        { id: 4, title: 'Paramount' },
        { id: 25, title: '20th Century' },
        { id: 10570, title: 'Orion Pictures' }
    ];
    var MULTI_FILTERS = [
        { key: 'languages', title: 'Язык', items: LANGUAGES, prop: 'code' },
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
    var studioLogosCache = {};

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
        if (state.studio !== null) filter.with_companies = String(state.studio);
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
            return fetch('https://api.themoviedb.org/3/company/' + id + '?api_key=' + key + '&language=ru')
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    var url = data.logo_path ? 'https://image.tmdb.org/t/p/w200' + data.logo_path : null;
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
                var icon = logoUrl ? '[Image 0]' : '';
                return {
                    title: s.title,
                    id: s.id,
                    selected: state.studio === s.id,
                    template: 'selectbox_icon',
                    icon: icon || '',
                    _studio: true
                };
            });
            items.unshift({ title: 'Любая', id: null, selected: state.studio === null, template: 'selectbox_item' });
            return items;
        };

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
        searchBtn.textContent = state.searchQuery ? 'Поиск: ' + state.searchQuery.slice(0, 20) : 'Поиск';
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

/* ------------------------------------------------------------
 *  ЧАСТЬ 2. HORROR THEMES & VISUAL GLITCHES PLUGIN
 *  Автор: TV-SA / Lampa
 * ------------------------------------------------------------ */
(function () {
    'use strict';

    // ============================================================
    //  HORROR THEMES & VISUAL GLITCHES PLUGIN
    //  Автор: TV-SA / Lampa
    // ============================================================

    var HORROR_THEMES = [
        {
            id: 'blood_moon',
            name: 'Кровавая Луна',
            css: `
                .card--theme-blood_moon .card__view {
                    filter: sepia(0.3) contrast(1.6) brightness(0.7) hue-rotate(-20deg);
                    box-shadow: 0 0 18px rgba(180, 0, 0, 0.7), inset 0 0 40px rgba(120, 0, 0, 0.5);
                }
                .card--theme-blood_moon .card__title {
                    color: #ff3b3b;
                    text-shadow: 0 0 6px rgba(255, 0, 0, 0.9);
                }
                .card--theme-blood_moon .card__age {
                    color: #ff6b6b;
                }
                .card--theme-blood_moon .card__view::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at 30% 40%, transparent 60%, rgba(80, 0, 0, 0.55));
                    pointer-events: none;
                    border-radius: inherit;
                }
            `
        },
        {
            id: 'bone_chill',
            name: 'Мороз по Коже',
            css: `
                .card--theme-bone_chill .card__view {
                    filter: contrast(1.4) saturate(0.2) brightness(0.85);
                    box-shadow: 0 0 16px rgba(200, 230, 255, 0.5), inset 0 0 30px rgba(100, 140, 180, 0.4);
                }
                .card--theme-bone_chill .card__title {
                    color: #b8d4f0;
                    text-shadow: 0 0 8px rgba(160, 200, 255, 0.8);
                    letter-spacing: 0.05em;
                }
                .card--theme-bone_chill .card__view::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(180deg, rgba(180, 220, 255, 0.15) 0%, transparent 40%, rgba(100, 140, 200, 0.2) 100%);
                    pointer-events: none;
                    border-radius: inherit;
                }
            `
        },
        {
            id: 'cursed_sigil',
            name: 'Проклятый Знак',
            css: `
                .card--theme-cursed_sigil .card__view {
                    filter: contrast(1.3) hue-rotate(270deg) brightness(0.6);
                    box-shadow: 0 0 22px rgba(140, 0, 200, 0.8), inset 0 0 50px rgba(60, 0, 100, 0.6);
                }
                .card--theme-cursed_sigil .card__view::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(160, 0, 220, 0.12) 12px, rgba(160, 0, 220, 0.12) 14px);
                    pointer-events: none;
                    border-radius: inherit;
                }
                .card--theme-cursed_sigil .card__title {
                    color: #d48aff;
                    text-shadow: 0 0 10px rgba(180, 0, 255, 0.9);
                }
            `
        },
        {
            id: 'asylum',
            name: 'Приют',
            css: `
                .card--theme-asylum .card__view {
                    filter: grayscale(0.8) contrast(1.5) brightness(0.55) sepia(0.25);
                    box-shadow: 0 0 14px rgba(140, 120, 60, 0.6), inset 0 0 35px rgba(80, 60, 20, 0.5);
                }
                .card--theme-asylum .card__title {
                    color: #c4a35a;
                    text-shadow: 0 0 6px rgba(180, 140, 40, 0.7);
                    font-family: serif;
                }
                .card--theme-asylum .card__view::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(100, 80, 30, 0.08) 4px, rgba(100, 80, 30, 0.08) 5px);
                    pointer-events: none;
                    border-radius: inherit;
                }
            `
        },
        {
            id: 'veil',
            name: 'Пелена',
            css: `
                .card--theme-veil .card__view {
                    filter: brightness(0.5) contrast(1.7) saturate(0.4);
                    box-shadow: 0 0 30px rgba(0, 0, 0, 0.9), inset 0 0 80px rgba(0, 0, 0, 0.8);
                }
                .card--theme-veil .card__view::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(ellipse at center, transparent 30%, rgba(0, 0, 0, 0.85) 100%);
                    pointer-events: none;
                    border-radius: inherit;
                }
                .card--theme-veil .card__title {
                    color: #999;
                    text-shadow: 0 0 12px rgba(0, 0, 0, 1);
                }
            `
        },
        {
            id: 'ritual',
            name: 'Ритуал',
            css: `
                .card--theme-ritual .card__view {
                    filter: contrast(1.5) saturate(1.4) hue-rotate(-40deg) brightness(0.65);
                    box-shadow: 0 0 24px rgba(255, 60, 0, 0.7), inset 0 0 45px rgba(150, 20, 0, 0.5);
                }
                .card--theme-ritual .card__title {
                    color: #ff7b00;
                    text-shadow: 0 0 10px rgba(255, 80, 0, 0.95);
                }
                .card--theme-ritual .card__view::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at 50% 80%, rgba(255, 60, 0, 0.2) 0%, transparent 60%);
                    pointer-events: none;
                    border-radius: inherit;
                }
            `
        },
        {
            id: 'flesh',
            name: 'Плоть',
            css: `
                .card--theme-flesh .card__view {
                    filter: sepia(0.6) saturate(1.8) hue-rotate(-10deg) contrast(1.3) brightness(0.6);
                    box-shadow: 0 0 20px rgba(200, 80, 60, 0.7), inset 0 0 40px rgba(120, 40, 20, 0.5);
                }
                .card--theme-flesh .card__title {
                    color: #e88a7a;
                    text-shadow: 0 0 8px rgba(200, 80, 50, 0.8);
                }
            `
        },
        {
            id: 'whisper',
            name: 'Шёпот',
            css: `
                .card--theme-whisper .card__view {
                    filter: brightness(0.45) contrast(1.8) blur(0.4px);
                    box-shadow: 0 0 25px rgba(60, 80, 120, 0.6), inset 0 0 60px rgba(20, 30, 60, 0.7);
                }
                .card--theme-whisper .card__title {
                    color: #7a9ec4;
                    text-shadow: 0 0 14px rgba(60, 100, 180, 0.7);
                    font-style: italic;
                }
                .card--theme-whisper .card__view::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(180deg, transparent 50%, rgba(10, 20, 50, 0.6) 100%);
                    pointer-events: none;
                    border-radius: inherit;
                }
            `
        },
        {
            id: 'grave_dirt',
            name: 'Могильная Земля',
            css: `
                .card--theme-grave_dirt .card__view {
                    filter: grayscale(0.9) contrast(1.6) brightness(0.5) sepia(0.4);
                    box-shadow: 0 0 16px rgba(60, 50, 30, 0.8), inset 0 0 50px rgba(30, 25, 10, 0.7);
                }
                .card--theme-grave_dirt .card__title {
                    color: #8a7a5a;
                    text-shadow: 0 0 8px rgba(60, 50, 20, 1);
                    font-family: serif;
                    letter-spacing: 0.08em;
                }
                .card--theme-grave_dirt .card__view::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(40, 35, 15, 0.1) 3px, rgba(40, 35, 15, 0.1) 4px);
                    pointer-events: none;
                    border-radius: inherit;
                }
            `
        },
        {
            id: 'abyss',
            name: 'Бездна',
            css: `
                .card--theme-abyss .card__view {
                    filter: brightness(0.35) contrast(2) saturate(0.3);
                    box-shadow: 0 0 35px rgba(0, 0, 0, 1), inset 0 0 70px rgba(0, 0, 0, 0.9);
                }
                .card--theme-abyss .card__view::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(ellipse at 50% 50%, transparent 10%, rgba(0, 0, 0, 0.95) 90%);
                    pointer-events: none;
                    border-radius: inherit;
                }
                .card--theme-abyss .card__title {
                    color: #4a6a8a;
                    text-shadow: 0 0 20px rgba(20, 40, 80, 0.8);
                    opacity: 0.85;
                }
            `
        }
    ];

    var GLITCH_EFFECTS = [
        {
            id: 'rgb_split',
            name: 'RGB-расслоение',
            run: function () {
                var interval = setInterval(function () {
                    var cards = document.querySelectorAll('.card__view');
                    cards.forEach(function (el) {
                        el.style.textShadow = (Math.random() * 4 - 2) + 'px 0 #f00, ' + (Math.random() * 4 - 2) + 'px 0 #0ff';
                    });
                    setTimeout(function () {
                        cards.forEach(function (el) {
                            el.style.textShadow = '';
                        });
                    }, 120);
                }, 3000);
                return interval;
            }
        },
        {
            id: 'scanline',
            name: 'CRT-развёртка',
            run: function () {
                var overlay = document.createElement('div');
                overlay.className = 'glitch-scanline-overlay';
                overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;background:repeating-linear-gradient(0deg,rgba(0,0,0,0.15) 0px,rgba(0,0,0,0.15) 2px,transparent 2px,transparent 4px);opacity:0.6;';
                document.body.appendChild(overlay);
                return function () { overlay.remove(); };
            }
        },
        {
            id: 'jitter',
            name: 'Дрожание интерфейса',
            run: function () {
                var interval = setInterval(function () {
                    if (Math.random() < 0.3) {
                        var el = document.querySelector('.wrap__content');
                        if (el) {
                            el.style.transform = 'translate(' + (Math.random() * 4 - 2) + 'px,' + (Math.random() * 4 - 2) + 'px)';
                            setTimeout(function () { el.style.transform = ''; }, 80);
                        }
                    }
                }, 4000);
                return interval;
            }
        },
        {
            id: 'color_invert',
            name: 'Инверсия цветов',
            run: function () {
                var interval = setInterval(function () {
                    if (Math.random() < 0.2) {
                        var el = document.querySelector('.wrap__content');
                        if (el) {
                            el.style.filter = 'invert(1) hue-rotate(90deg)';
                            setTimeout(function () { el.style.filter = ''; }, 150);
                        }
                    }
                }, 8000);
                return interval;
            }
        },
        {
            id: 'shadow_creep',
            name: 'Ползучая тень',
            run: function () {
                var interval = setInterval(function () {
                    var el = document.querySelector('.wrap__content');
                    if (el) {
                        el.style.boxShadow = 'inset 0 0 ' + Math.round(Math.random() * 80 + 40) + 'px rgba(0,0,0,0.8)';
                        setTimeout(function () { el.style.boxShadow = ''; }, 600);
                    }
                }, 5000);
                return interval;
            }
        }
    ];

    // ============================================================
    //  ИНИЦИАЛИЗАЦИЯ ПЛАГИНА
    // ============================================================

    function startPlugin() {
        window.horror_themes_ready = true;

        // --- 1. Внедряем CSS для всех тем ---
        var styleTag = document.createElement('style');
        styleTag.id = 'horror-themes-styles';
        var cssText = HORROR_THEMES.map(function (t) { return t.css; }).join('\n');
        styleTag.textContent = cssText;
        document.head.appendChild(styleTag);

        // --- 2. Создаём выпадающий выбор темы в настройках ---
        Lampa.SettingsApi.addParam({
            component: 'interface',
            param: {
                name: 'horror_card_theme',
                type: 'select',
                values: (function () {
                    var v = { 'none': 'Без темы' };
                    HORROR_THEMES.forEach(function (t) {
                        v[t.id] = t.name;
                    });
                    return v;
                })(),
                "default": 'none'
            },
            field: {
                name: 'Хоррор-тема карточек'
            },
            onChange: function (value) {
                applyTheme(value);
            }
        });

        // --- 3. Создаём выпадающий выбор глюка ---
        Lampa.SettingsApi.addParam({
            component: 'interface',
            param: {
                name: 'horror_glitch',
                type: 'select',
                values: (function () {
                    var v = { 'none': 'Без глюков' };
                    GLITCH_EFFECTS.forEach(function (g) {
                        v[g.id] = g.name;
                    });
                    return v;
                })(),
                "default": 'none'
            },
            field: {
                name: 'Визуальный глюк'
            },
            onChange: function (value) {
                applyGlitch(value);
            }
        });

        // --- 4. Применяем сохранённые значения ---
        applyTheme(Lampa.Storage.get('horror_card_theme', 'none'));
        applyGlitch(Lampa.Storage.get('horror_glitch', 'none'));

        // --- 5. Следим за появлением новых карточек и применяем тему ---
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var currentTheme = Lampa.Storage.get('horror_card_theme', 'none');
                if (currentTheme !== 'none') {
                    applyThemeToCards(currentTheme);
                }
            }
        });

        // --- 6. Если пользователь меняет тему, обновляем все видимые карточки ---
        Lampa.Storage.listener.follow('change', function (e) {
            if (e.name == 'horror_card_theme') {
                applyTheme(e.value);
            }
            if (e.name == 'horror_glitch') {
                applyGlitch(e.value);
            }
        });

        console.log('HorrorThemes', 'Plugin ready. Themes:', HORROR_THEMES.length, 'Glitches:', GLITCH_EFFECTS.length);
    }

    // ============================================================
    //  ПРИМЕНЕНИЕ ТЕМЫ
    // ============================================================

    var currentGlitchCleanup = null;

    function applyTheme(themeId) {
        // Снимаем все темы со всех карточек
        HORROR_THEMES.forEach(function (t) {
            document.querySelectorAll('.card--theme-' + t.id).forEach(function (el) {
                el.classList.remove('card--theme-' + t.id);
            });
        });

        if (themeId && themeId !== 'none') {
            applyThemeToCards(themeId);
        }
    }

    function applyThemeToCards(themeId) {
        var theme = HORROR_THEMES.find(function (t) { return t.id === themeId; });
        if (!theme) return;

        var cards = document.querySelectorAll('.card');
        cards.forEach(function (card) {
            card.classList.add('card--theme-' + themeId);
        });

        // Также применяем к полноэкранным карточкам
        var fullCards = document.querySelectorAll('.full-start__poster');
        fullCards.forEach(function (el) {
            el.classList.add('card--theme-' + themeId);
        });
    }

    // ============================================================
    //  ПРИМЕНЕНИЕ ГЛЮКА
    // ============================================================

    function applyGlitch(glitchId) {
        // Останавливаем предыдущий глюк
        if (currentGlitchCleanup) {
            if (typeof currentGlitchCleanup === 'function') {
                currentGlitchCleanup();
            } else {
                clearInterval(currentGlitchCleanup);
            }
            currentGlitchCleanup = null;
        }

        // Убираем предыдущий оверлей
        var oldOverlay = document.querySelector('.glitch-scanline-overlay');
        if (oldOverlay) oldOverlay.remove();

        if (!glitchId || glitchId === 'none') return;

        var glitch = GLITCH_EFFECTS.find(function (g) { return g.id === glitchId; });
        if (!glitch) return;

        currentGlitchCleanup = glitch.run();
        console.log('HorrorThemes', 'Glitch applied:', glitch.name);
    }

    // ============================================================
    //  ЗАПУСК
    // ============================================================

    if (!window.horror_themes_ready) {
        if (window.appready) {
            startPlugin();
        } else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type == 'ready') {
                    startPlugin();
                }
            });
        }
    }

})();
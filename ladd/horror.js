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
    var TMDB_KEY = '4ef0d7355d9ffb5151e987764708ce96';
    var TMDB_IMG = 'https://image.tmdb.org/t/p/';

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

    // Студии: логотипы грузятся из TMDB API, а не из Wikimedia.
    // "minYear" — минимальный год выхода, чтобы отсечь старые фильмы
    var STUDIOS = [
        { id: 3172,  title: 'Blumhouse',      minYear: 0 },
        { id: 41077, title: 'A24',            minYear: 0 },
        { id: 10330, title: 'Ghost House',    minYear: 0 },
        { id: 8850,  title: 'Hammer Film',    minYear: 2000 },
        { id: 22846, title: 'Dark Castle',    minYear: 0 },
        { id: 90764, title: 'Neon',           minYear: 0 },
        { id: 12,    title: 'New Line Cinema', minYear: 0 },
        { id: 174,   title: 'Warner Bros.',   minYear: 0 },
        { id: 33,    title: 'Universal',      minYear: 0 },
        { id: 4,     title: 'Paramount',      minYear: 0 },
        { id: 25,    title: '20th Century',   minYear: 0 },
        { id: 10570, title: 'Orion Pictures', minYear: 0 }
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

    // Кэш логотипов: { studioId: logoUrl }
    var logoCache = {};

    // ═══════════════════════════════════════════════════════════════
    // TMDB LOGO FETCHING
    // ═══════════════════════════════════════════════════════════════

    function fetchStudioLogo(studioId, callback) {
        if (logoCache[studioId] !== undefined) {
            callback(logoCache[studioId]);
            return;
        }

        var url = 'https://api.themoviedb.org/3/company/' + studioId +
                  '/images?api_key=' + TMDB_KEY;

        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.timeout = 8000;
        xhr.responseType = 'json';

        xhr.onload = function () {
            var logo = null;
            try {
                var data = xhr.response;
                if (data && data.logos && data.logos.length) {
                    // Берём логотип с наибольшим разрешением
                    var best = data.logos.sort(function (a, b) {
                        return (b.width || 0) - (a.width || 0);
                    })[0];
                    if (best && best.file_path) {
                        logo = TMDB_IMG + 'w300' + best.file_path;
                    }
                }
            } catch (e) {}
            logoCache[studioId] = logo;
            callback(logo);
        };

        xhr.onerror = xhr.ontimeout = function () {
            logoCache[studioId] = null;
            callback(null);
        };

        xhr.send();
    }

    // Предзагрузка логотипов всех студий (фоном)
    function preloadStudioLogos() {
        STUDIOS.forEach(function (s) {
            if (logoCache[s.id] === undefined) {
                fetchStudioLogo(s.id, function () {});
            }
        });
    }

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

        if (state.studio !== null) {
            filter.with_companies = String(state.studio);
            // Для Hammer Film — только фильмы после 2000 года
            var s = STUDIOS.find(function (x) { return x.id === state.studio; });
            if (s && s.minYear) {
                filter['primary_release_date.gte'] = s.minYear + '-01-01';
            }
        }

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
            '.horror-filter-logo{height:1.3em;width:auto;max-width:4em;object-fit:contain;',
            'vertical-align:middle;filter:brightness(0) invert(1)}',
            '.horror-filter-btn.focus .horror-filter-logo{filter:none}',
            '.horror-studio-item .selectbox-item__icon{background:transparent!important;',
            'display:flex;align-items:center;justify-content:center;min-width:2.5em}',
            '.horror-studio-item .selectbox-item__icon img{height:1.8em;width:auto;max-width:6em;',
            'object-fit:contain;filter:brightness(0) invert(1)}',
            '.horror-studio-item .selectbox-item__icon .horror-logo-fallback{',
            'font-size:.75em;opacity:.5;text-transform:uppercase;letter-spacing:.05em}'
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

    // Одиночный выбор студии с логотипами из TMDB API
    function openStudioFilter(onChange) {
        var items = STUDIOS.map(function (s) {
            var logo = logoCache[s.id];
            var icon;
            if (logo) {
                icon = '<img src="' + logo + '" onerror="this.style.display=\'none\'">';
            } else {
                icon = '<span class="horror-logo-fallback">' + s.title.slice(0, 3) + '</span>';
            }
            return {
                title: s.title,
                id: s.id,
                selected: state.studio === s.id,
                template: 'selectbox_icon',
                icon: icon,
                _studio: true
            };
        });

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

        // Студия с логотипом из кэша
        var studioBtn = document.createElement('div');
        studioBtn.className = 'horror-filter-btn selector';
        if (state.studio !== null) {
            var s = STUDIOS.find(function (x) { return x.id === state.studio; });
            if (s) {
                var logo = logoCache[s.id];
                if (logo) {
                    var img = document.createElement('img');
                    img.className = 'horror-filter-logo';
                    img.src = logo;
                    img.onerror = function () { this.style.display = 'none'; };
                    studioBtn.appendChild(img);
                }
                var txt = document.createElement('span');
                txt.textContent = s.title;
                studioBtn.appendChild(txt);
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
        preloadStudioLogos();

        var activityObj = buildActivityObject();
        Object.keys(activityObj).forEach(function (k) {
            if (k !== 'component') object[k] = activityObj[k];
        });

        var comp = Lampa.Maker.make('Category', object);
        var filtersBar = null;

        comp.use({
            onCreate: function () {
                var _this = this;

                Lampa.Api.list(
                    object,
                    this.build.bind(this),
                    this.empty.bind(this)
                );

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
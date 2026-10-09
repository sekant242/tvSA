/* ============================================================
 *  HORROR UNIFIED v2.1.0 для Lampa 3.3.x
 *  - Раздел «Ужасы» в меню
 *  - Хоррор-темы карточек (в настройках)
 *  - Визуальные глитчи (в настройках)
 *
 *  Настройки: «Настройки → Хоррор» (в самом низу списка)
 * ============================================================ */
(function () {
    'use strict';

    if (window.__horror_unified__) return;
    window.__horror_unified__ = true;

    if (!window.Lampa) {
        console.error('[HorrorUnified] Lampa не найдена');
        return;
    }

    var L = window.Lampa;
    var VERSION = '2.1.0';

    /* ============================================================
     *  ИКОНКИ
     * ============================================================ */
    var ICON_MENU =
        '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12c0 3.18 1.46 5.95 3.7 7.72V21c0 .55.45 1 1 1h1v-1c0-.55.45-1 1-1h6c.55 0 1 .45 1 1v1h1c.55 0 1-.45 1-1v-1.28C20.54 17.95 22 15.18 22 12c0-5.52-4.48-10-10-10zm-3.5 12c-.83 0-1.5-.67-1.5-1.5S7.67 11 8.5 11s1.5.67 1.5 1.5S9.33 14 8.5 14zm7 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>' +
        '</svg>';

    var ICON_SETTINGS =
        '<svg viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<circle cx="19.5" cy="19.5" r="17" stroke="white" stroke-width="3"/>' +
        '<circle cx="14" cy="17" r="2" fill="white"/>' +
        '<circle cx="25" cy="17" r="2" fill="white"/>' +
        '<path d="M13 26c2-2 4-3 6.5-3s4.5 1 6.5 3" stroke="white" stroke-width="2.4" stroke-linecap="round"/>' +
        '</svg>';

    /* ============================================================
     *  ЧАСТЬ 1. РАЗДЕЛ «УЖАСЫ»
     * ============================================================ */
    var COMPONENT     = 'horror';
    var TITLE         = 'Ужасы';
    var DEFAULT_GENRE = '27|53';

    var GENRES = [
        { id: '27|53', title: 'Все' },
        { id: '27',    title: 'Ужасы' },
        { id: '53',    title: 'Триллеры' }
    ];

    var LANGUAGES = [
        { code: 'ru', title: 'Русский' },      { code: 'en', title: 'Английский' },
        { code: 'ja', title: 'Японский' },     { code: 'ko', title: 'Корейский' },
        { code: 'es', title: 'Испанский' },    { code: 'fr', title: 'Французский' },
        { code: 'de', title: 'Немецкий' },     { code: 'it', title: 'Итальянский' },
        { code: 'pt', title: 'Португальский' },{ code: 'zh', title: 'Китайский' },
        { code: 'hi', title: 'Хинди' },        { code: 'th', title: 'Тайский' },
        { code: 'sv', title: 'Шведский' },     { code: 'no', title: 'Норвежский' },
        { code: 'da', title: 'Датский' },      { code: 'tr', title: 'Турецкий' }
    ];

    var SUBGENRES = [
        { id: 12377,  title: 'Зомби' },        { id: 3133,   title: 'Вампиры' },
        { id: 288394, title: 'Призраки' },     { id: 9951,   title: 'Инопланетяне' },
        { id: 10427,  title: 'Демоны' },       { id: 9755,   title: 'Ведьмы' },
        { id: 234452, title: 'Слэшер' },       { id: 10714,  title: 'Серийный убийца' },
        { id: 9715,   title: 'Сверхъестественное' }, { id: 10541, title: 'Проклятие' },
        { id: 14819,  title: 'Монстры' },      { id: 162403, title: 'Экзорцизм' },
        { id: 158718, title: 'Найденная плёнка' },   { id: 6152,  title: 'Оккультизм' },
        { id: 2182,   title: 'Каннибалы' },    { id: 11477,  title: 'Психопаты' },
        { id: 2343,   title: 'Мутанты' },      { id: 10292,  title: 'Готика' },
        { id: 722,    title: 'Апокалипсис' },  { id: 1800,   title: 'Паранойя' }
    ];

    var STUDIOS = [
        { id: 3172,  title: 'Blumhouse' },     { id: 41077, title: 'A24' },
        { id: 1314,  title: 'Hammer Film' },   { id: 90733, title: 'Neon' },
        { id: 10330, title: 'Ghost House' },   { id: 22846, title: 'Dark Castle' },
        { id: 12,    title: 'New Line Cinema' }, { id: 174, title: 'Warner Bros.' },
        { id: 33,    title: 'Universal' },     { id: 4,     title: 'Paramount' },
        { id: 25,    title: '20th Century' },  { id: 10570, title: 'Orion Pictures' }
    ];

    var MULTI_FILTERS = [
        { key: 'languages', title: 'Язык',    items: LANGUAGES, prop: 'code' },
        { key: 'subgenres', title: 'Поджанр', items: SUBGENRES, prop: 'id' }
    ];

    var horror_state = {
        genre:       DEFAULT_GENRE,
        languages:   [],
        subgenres:   [],
        studio:      null,
        searchQuery: ''
    };

    var studioLogosCache = {};

    function hasActiveFilters() {
        return horror_state.languages.length > 0 ||
               horror_state.subgenres.length > 0 ||
               horror_state.studio !== null ||
               horror_state.genre !== DEFAULT_GENRE ||
               horror_state.searchQuery !== '';
    }

    function resetFilters() {
        horror_state.genre = DEFAULT_GENRE;
        horror_state.languages = [];
        horror_state.subgenres = [];
        horror_state.studio = null;
        horror_state.searchQuery = '';
    }

    function buildFilterParams() {
        var filter = {};
        if (horror_state.languages.length) filter.with_original_language = horror_state.languages.join('|');
        if (horror_state.subgenres.length) filter.with_keywords = horror_state.subgenres.join('|');
        return filter;
    }

    function buildActivityObject() {
        var obj = {
            component: COMPONENT,
            title:     TITLE,
            source:    'tmdb',
            page:      1,
            url:       'discover/movie',
            genres:    horror_state.genre,
            query:     '',
            filter:    {},
            sort_by:   ''
        };

        if (horror_state.searchQuery) {
            obj.url    = 'search/movie';
            obj.query  = encodeURIComponent(horror_state.searchQuery);
            obj.genres = '';
            return obj;
        }

        obj.filter = buildFilterParams();

        if (horror_state.studio !== null) {
            obj.filter.with_companies = String(horror_state.studio);
            obj.sort_by = 'primary_release_date.asc';
        }

        return obj;
    }

    function loadStudioLogos(callback) {
        var ids = STUDIOS.map(function (s) { return s.id; });
        var pending = ids.length;
        if (!pending) return callback && callback();

        ids.forEach(function (id) {
            if (studioLogosCache.hasOwnProperty(id)) {
                if (--pending === 0) callback && callback();
                return;
            }
            var url = L.TMDB.api('company/' + id + '?language=' + (L.Storage.field('tmdb_lang') || 'ru'));
            L.Network.silent(url, function (data) {
                studioLogosCache[id] = data && data.logo_path ? L.TMDB.image('t/p/w200' + data.logo_path) : null;
                if (--pending === 0) callback && callback();
            }, function () {
                studioLogosCache[id] = null;
                if (--pending === 0) callback && callback();
            }, false, { timeout: 8000 });
        });
    }

    function injectHorrorStyles() {
        if (document.getElementById('horror-unified-styles')) return;
        var style = document.createElement('style');
        style.id = 'horror-unified-styles';
        style.textContent = [
            '.horror-filters{display:flex;align-items:center;gap:.5em;flex-wrap:wrap;',
            'padding:.6em .8em;margin:0 0 1em 0;background:rgba(0,0,0,.35);border-radius:1.2em;',
            'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);',
            'border:1px solid rgba(255,255,255,.06)}',
            '.horror-filter-btn{padding:.5em 1.05em;background:rgba(255,255,255,.08);border-radius:2em;',
            'font-size:.92em;color:#fff;transition:background .15s;white-space:nowrap;',
            'border:1px solid rgba(255,255,255,.1);cursor:pointer;display:flex;align-items:center;gap:.4em}',
            '.horror-filter-btn:hover{background:rgba(255,255,255,.16)}',
            '.horror-filter-btn.focus{background:#fff;color:#000}',
            '.horror-filter-btn.focus .horror-filter-logo{filter:none}',
            '.horror-filter-reset{background:rgba(220,60,60,.25);border-color:rgba(220,60,60,.4)}',
            '.horror-filter-reset.focus{background:#dc3c3c;color:#fff}',
            '.horror-filter-count{opacity:.65;margin-left:.4em;font-size:.85em}',
            '.horror-filter-logo{height:1.4em;width:auto;max-width:5em;object-fit:contain;vertical-align:middle;filter:brightness(0) invert(1)}',
            '.horror-studio-item .selectbox-item__icon img{height:1.6em;width:auto;max-width:6em;object-fit:contain}',
            '.horror-studio-item .selectbox-item__icon{background:transparent!important;padding:.2em}'
        ].join('');
        document.head.appendChild(style);
    }

    function openGenreFilter(onChange) {
        var items = GENRES.map(function (g) {
            return { title: g.title, id: g.id, selected: horror_state.genre === g.id };
        });
        L.Select.show({
            title: 'Жанр',
            items: items,
            onSelect: function (item) {
                horror_state.genre = item.id;
                L.Controller.toggle('content');
                onChange();
            },
            onBack: function () { L.Controller.toggle('content'); }
        });
    }

    function openMultiFilter(def, onChange) {
        var selected = horror_state[def.key];
        var changed = false;
        var items = def.items.map(function (item) {
            var id = item[def.prop];
            return { title: item.title, id: id, checkbox: true, checked: selected.indexOf(id) !== -1 };
        });
        L.Select.show({
            title: def.title,
            items: items,
            onCheck: function (item) {
                var idx = selected.indexOf(item.id);
                if (item.checked && idx === -1) selected.push(item.id);
                else if (!item.checked && idx !== -1) selected.splice(idx, 1);
                changed = true;
            },
            onBack: function () {
                L.Controller.toggle('content');
                if (changed) onChange();
            }
        });
    }

    function openStudioFilter(onChange) {
        var items = STUDIOS.map(function (s) {
            var logo = studioLogosCache[s.id];
            return {
                title: s.title,
                id: s.id,
                selected: horror_state.studio === s.id,
                thumbnail: logo || null,
                template: logo ? 'selectbox_icon' : 'selectbox_item'
            };
        });
        items.unshift({ title: 'Любая', id: null, selected: horror_state.studio === null, template: 'selectbox_item' });

        L.Select.show({
            title: 'Студия',
            items: items,
            onSelect: function (item) {
                horror_state.studio = item.id;
                L.Controller.toggle('content');
                onChange();
            },
            onDraw: function (item, elem) { if (elem && elem.id) item.addClass('horror-studio-item'); },
            onBack: function () { L.Controller.toggle('content'); }
        });
    }

    function openSearchInput(onChange) {
        var prev = L.Controller.enabled().name;
        L.Input.edit({
            title: 'Поиск по названию',
            value: horror_state.searchQuery,
            free: true, nosave: true, nomic: true
        }, function (value) {
            var newQuery = (value || '').trim();
            var changed = newQuery !== horror_state.searchQuery;
            horror_state.searchQuery = newQuery;
            L.Controller.toggle(prev);
            if (changed) onChange();
        });
    }

    function buildFiltersBar(onChange) {
        var bar = document.createElement('div');
        bar.className = 'horror-filters';

        var genreLabel = 'Жанр';
        if (horror_state.genre !== DEFAULT_GENRE) {
            var found = GENRES.find(function (g) { return g.id === horror_state.genre; });
            if (found) genreLabel = 'Жанр: ' + found.title;
        }
        var genreBtn = document.createElement('div');
        genreBtn.className = 'horror-filter-btn selector';
        genreBtn.textContent = genreLabel;
        genreBtn.addEventListener('click', function () { openGenreFilter(onChange); });
        bar.appendChild(genreBtn);

        MULTI_FILTERS.forEach(function (def) {
            var count = horror_state[def.key].length;
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

        var studioBtn = document.createElement('div');
        studioBtn.className = 'horror-filter-btn selector';
        if (horror_state.studio !== null) {
            var s = STUDIOS.find(function (x) { return x.id === horror_state.studio; });
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
            } else studioBtn.textContent = 'Студия';
        } else studioBtn.textContent = 'Студия';
        studioBtn.addEventListener('click', function () { openStudioFilter(onChange); });
        bar.appendChild(studioBtn);

        var searchBtn = document.createElement('div');
        searchBtn.className = 'horror-filter-btn selector';
        searchBtn.textContent = horror_state.searchQuery ? 'Поиск: ' + horror_state.searchQuery.slice(0, 20) : 'Поиск';
        searchBtn.addEventListener('click', function () { openSearchInput(onChange); });
        bar.appendChild(searchBtn);

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

    function HorrorComponent(object) {
        injectHorrorStyles();
        var activityObj = buildActivityObject();
        Object.keys(activityObj).forEach(function (k) {
            if (k !== 'component') object[k] = activityObj[k];
        });

        var comp = L.Maker.make('Category', object);
        var filtersBar = null;

        comp.use({
            onCreate: function () {
                var self = this;
                L.Api.list(object, this.build.bind(this), this.empty.bind(this));

                filtersBar = buildFiltersBar(function () {
                    L.Activity.replace(buildActivityObject());
                });

                var body = this.scroll.body(true);
                if (body.firstChild) body.insertBefore(filtersBar, body.firstChild);
                else body.appendChild(filtersBar);

                requestAnimationFrame(function () { L.Layer.update(self.html); });
            },
            onNext: function (resolve, reject) {
                L.Api.list(object, resolve.bind(this), reject.bind(this));
            },
            onInstance: function (item, data) {
                item.use({
                    onEnter: L.Router.call.bind(L.Router, 'full', data),
                    onFocus: function () { L.Background.change(L.Utils.cardImgBackground(data)); }
                });
            },
            onEmpty: function () {
                var empty = new L.Empty({
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
                    L.Activity.replace(buildActivityObject());
                });
                empty.html.append(resetBtn);

                this.activity.loader(false);
                this.activity.toggle();
            },
            onDestroy: function () {
                if (filtersBar && filtersBar.parentNode) filtersBar.parentNode.removeChild(filtersBar);
                filtersBar = null;
            }
        });

        return comp;
    }

    /* ---------- Кнопка в главном меню ---------- */
    var menu_button_added = false;

    function pushHorror() {
        L.Activity.push(buildActivityObject());
    }

    function tryAddToMenu() {
        if (menu_button_added) return true;
        if (!L.Menu || typeof L.Menu.addButton !== 'function') return false;
        if (!$('.menu').length) return false;

        L.Menu.addButton(ICON_MENU, TITLE, pushHorror);
        menu_button_added = true;
        console.log('[HorrorUnified] Кнопка «' + TITLE + '» добавлена в меню');
        return true;
    }

    function initMenuButton() {
        if (L.Storage.field('horror_show_in_menu') === false) return;
        var attempts = 0;
        var timer = setInterval(function () {
            if (tryAddToMenu() || ++attempts >= 40) clearInterval(timer);
        }, 500);
    }

    /* ============================================================
     *  ЧАСТЬ 2. ТЕМЫ КАРТОЧЕК
     * ============================================================ */
    var HORROR_THEMES = [
        {
            id: 'blood_moon', name: 'Кровавая Луна',
            css: '.card--theme-blood_moon .card__view{filter:sepia(.3) contrast(1.6) brightness(.7) hue-rotate(-20deg)!important;box-shadow:0 0 18px rgba(180,0,0,.7), inset 0 0 40px rgba(120,0,0,.5)!important;}'
               + '.card--theme-blood_moon .card__title{color:#ff3b3b!important;text-shadow:0 0 6px rgba(255,0,0,.9);}'
               + '.card--theme-blood_moon .card__view::after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 30% 40%, transparent 60%, rgba(80,0,0,.55));pointer-events:none;border-radius:inherit;z-index:2;}'
        },
        {
            id: 'bone_chill', name: 'Мороз по Коже',
            css: '.card--theme-bone_chill .card__view{filter:contrast(1.4) saturate(.2) brightness(.85)!important;box-shadow:0 0 16px rgba(200,230,255,.5), inset 0 0 30px rgba(100,140,180,.4)!important;}'
               + '.card--theme-bone_chill .card__title{color:#b8d4f0!important;text-shadow:0 0 8px rgba(160,200,255,.8);letter-spacing:.05em;}'
               + '.card--theme-bone_chill .card__view::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(180,220,255,.15) 0%,transparent 40%,rgba(100,140,200,.2) 100%);pointer-events:none;border-radius:inherit;z-index:2;}'
        },
        {
            id: 'cursed_sigil', name: 'Проклятый Знак',
            css: '.card--theme-cursed_sigil .card__view{filter:contrast(1.3) hue-rotate(270deg) brightness(.6)!important;box-shadow:0 0 22px rgba(140,0,200,.8), inset 0 0 50px rgba(60,0,100,.6)!important;}'
               + '.card--theme-cursed_sigil .card__view::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(45deg,transparent,transparent 12px,rgba(160,0,220,.12) 12px,rgba(160,0,220,.12) 14px);pointer-events:none;border-radius:inherit;z-index:2;}'
               + '.card--theme-cursed_sigil .card__title{color:#d48aff!important;text-shadow:0 0 10px rgba(180,0,255,.9);}'
        },
        {
            id: 'asylum', name: 'Приют',
            css: '.card--theme-asylum .card__view{filter:grayscale(.8) contrast(1.5) brightness(.55) sepia(.25)!important;box-shadow:0 0 14px rgba(140,120,60,.6), inset 0 0 35px rgba(80,60,20,.5)!important;}'
               + '.card--theme-asylum .card__title{color:#c4a35a!important;text-shadow:0 0 6px rgba(180,140,40,.7);font-family:serif;}'
               + '.card--theme-asylum .card__view::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent,transparent 4px,rgba(100,80,30,.08) 4px,rgba(100,80,30,.08) 5px);pointer-events:none;border-radius:inherit;z-index:2;}'
        },
        {
            id: 'veil', name: 'Пелена',
            css: '.card--theme-veil .card__view{filter:brightness(.5) contrast(1.7) saturate(.4)!important;box-shadow:0 0 30px rgba(0,0,0,.9), inset 0 0 80px rgba(0,0,0,.8)!important;}'
               + '.card--theme-veil .card__view::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 30%,rgba(0,0,0,.85) 100%);pointer-events:none;border-radius:inherit;z-index:2;}'
               + '.card--theme-veil .card__title{color:#999!important;text-shadow:0 0 12px rgba(0,0,0,1);}'
        },
        {
            id: 'ritual', name: 'Ритуал',
            css: '.card--theme-ritual .card__view{filter:contrast(1.5) saturate(1.4) hue-rotate(-40deg) brightness(.65)!important;box-shadow:0 0 24px rgba(255,60,0,.7), inset 0 0 45px rgba(150,20,0,.5)!important;}'
               + '.card--theme-ritual .card__title{color:#ff7b00!important;text-shadow:0 0 10px rgba(255,80,0,.95);}'
               + '.card--theme-ritual .card__view::after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 80%,rgba(255,60,0,.2) 0%,transparent 60%);pointer-events:none;border-radius:inherit;z-index:2;}'
        },
        {
            id: 'flesh', name: 'Плоть',
            css: '.card--theme-flesh .card__view{filter:sepia(.6) saturate(1.8) hue-rotate(-10deg) contrast(1.3) brightness(.6)!important;box-shadow:0 0 20px rgba(200,80,60,.7), inset 0 0 40px rgba(120,40,20,.5)!important;}'
               + '.card--theme-flesh .card__title{color:#e88a7a!important;text-shadow:0 0 8px rgba(200,80,50,.8);}'
        },
        {
            id: 'whisper', name: 'Шёпот',
            css: '.card--theme-whisper .card__view{filter:brightness(.45) contrast(1.8) blur(.4px)!important;box-shadow:0 0 25px rgba(60,80,120,.6), inset 0 0 60px rgba(20,30,60,.7)!important;}'
               + '.card--theme-whisper .card__title{color:#7a9ec4!important;text-shadow:0 0 14px rgba(60,100,180,.7);font-style:italic;}'
               + '.card--theme-whisper .card__view::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 50%,rgba(10,20,50,.6) 100%);pointer-events:none;border-radius:inherit;z-index:2;}'
        },
        {
            id: 'grave_dirt', name: 'Могильная Земля',
            css: '.card--theme-grave_dirt .card__view{filter:grayscale(.9) contrast(1.6) brightness(.5) sepia(.4)!important;box-shadow:0 0 16px rgba(60,50,30,.8), inset 0 0 50px rgba(30,25,10,.7)!important;}'
               + '.card--theme-grave_dirt .card__title{color:#8a7a5a!important;text-shadow:0 0 8px rgba(60,50,20,1);font-family:serif;letter-spacing:.08em;}'
               + '.card--theme-grave_dirt .card__view::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(40,35,15,.1) 3px,rgba(40,35,15,.1) 4px);pointer-events:none;border-radius:inherit;z-index:2;}'
        },
        {
            id: 'abyss', name: 'Бездна',
            css: '.card--theme-abyss .card__view{filter:brightness(.35) contrast(2) saturate(.3)!important;box-shadow:0 0 35px rgba(0,0,0,1), inset 0 0 70px rgba(0,0,0,.9)!important;}'
               + '.card--theme-abyss .card__view::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,transparent 10%,rgba(0,0,0,.95) 90%);pointer-events:none;border-radius:inherit;z-index:2;}'
               + '.card--theme-abyss .card__title{color:#4a6a8a!important;text-shadow:0 0 20px rgba(20,40,80,.8);opacity:.85;}'
        }
    ];

    function injectThemeStyles() {
        if (document.getElementById('horror-themes-styles')) return;
        var style = document.createElement('style');
        style.id = 'horror-themes-styles';
        style.textContent = HORROR_THEMES.map(function (t) { return t.css; }).join('\n');
        document.head.appendChild(style);
        console.log('[HorrorUnified] Стили тем внедрены (' + HORROR_THEMES.length + ')');
    }

    function clearThemeFromAll() {
        HORROR_THEMES.forEach(function (t) {
            var els = document.querySelectorAll('.card--theme-' + t.id);
            for (var i = 0; i < els.length; i++) els[i].classList.remove('card--theme-' + t.id);
        });
    }

    function applyThemeToElement(el, themeId) {
        if (!el || el.nodeType !== 1) return;
        if (el.classList && el.classList.contains('card')) {
            el.classList.add('card--theme-' + themeId);
        }
        if (el.querySelectorAll) {
            var cards = el.querySelectorAll('.card');
            for (var i = 0; i < cards.length; i++) cards[i].classList.add('card--theme-' + themeId);
        }
    }

    function applyTheme(themeId) {
        clearThemeFromAll();
        if (!themeId || themeId === 'none') return;
        var valid = HORROR_THEMES.some(function (t) { return t.id === themeId; });
        if (!valid) return;

        var cards = document.querySelectorAll('.card');
        for (var i = 0; i < cards.length; i++) cards[i].classList.add('card--theme-' + themeId);
        console.log('[HorrorUnified] Тема применена:', themeId, '| карточек:', cards.length);
    }

    /* ============================================================
     *  ЧАСТЬ 3. ГЛИТЧИ
     * ============================================================ */
    var GLITCH_EFFECTS = [
        { id: 'rgb_split', name: 'RGB-расслоение', run: function () {
            return setInterval(function () {
                var cards = document.querySelectorAll('.card__view');
                for (var i = 0; i < cards.length; i++) {
                    cards[i].style.textShadow = (Math.random() * 4 - 2) + 'px 0 #f00, ' + (Math.random() * 4 - 2) + 'px 0 #0ff';
                }
                setTimeout(function () {
                    var c = document.querySelectorAll('.card__view');
                    for (var j = 0; j < c.length; j++) c[j].style.textShadow = '';
                }, 120);
            }, 3000);
        }},
        { id: 'scanline', name: 'CRT-развёртка', run: function () {
            var overlay = document.createElement('div');
            overlay.className = 'glitch-scanline-overlay';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;background:repeating-linear-gradient(0deg,rgba(0,0,0,.15) 0px,rgba(0,0,0,.15) 2px,transparent 2px,transparent 4px);opacity:.6;';
            document.body.appendChild(overlay);
            return function () { overlay.remove(); };
        }},
        { id: 'jitter', name: 'Дрожание интерфейса', run: function () {
            return setInterval(function () {
                if (Math.random() < 0.3) {
                    var el = document.querySelector('.wrap__content');
                    if (el) {
                        el.style.transform = 'translate(' + (Math.random() * 4 - 2) + 'px,' + (Math.random() * 4 - 2) + 'px)';
                        setTimeout(function () { el.style.transform = ''; }, 80);
                    }
                }
            }, 4000);
        }},
        { id: 'color_invert', name: 'Инверсия цветов', run: function () {
            return setInterval(function () {
                if (Math.random() < 0.2) {
                    var el = document.querySelector('.wrap__content');
                    if (el) {
                        el.style.filter = 'invert(1) hue-rotate(90deg)';
                        setTimeout(function () { el.style.filter = ''; }, 150);
                    }
                }
            }, 8000);
        }},
        { id: 'shadow_creep', name: 'Ползучая тень', run: function () {
            return setInterval(function () {
                var el = document.querySelector('.wrap__content');
                if (el) {
                    el.style.boxShadow = 'inset 0 0 ' + Math.round(Math.random() * 80 + 40) + 'px rgba(0,0,0,.8)';
                    setTimeout(function () { el.style.boxShadow = ''; }, 600);
                }
            }, 5000);
        }}
    ];

    var currentGlitchCleanup = null;

    function applyGlitch(glitchId) {
        if (currentGlitchCleanup) {
            if (typeof currentGlitchCleanup === 'function') currentGlitchCleanup();
            else clearInterval(currentGlitchCleanup);
            currentGlitchCleanup = null;
        }
        var oldOverlay = document.querySelector('.glitch-scanline-overlay');
        if (oldOverlay) oldOverlay.remove();

        if (!glitchId || glitchId === 'none') return;
        var glitch = GLITCH_EFFECTS.find(function (g) { return g.id === glitchId; });
        if (!glitch) return;

        currentGlitchCleanup = glitch.run();
        console.log('[HorrorUnified] Глитч применён:', glitchId);
    }

    /* ============================================================
     *  НАСТРОЙКИ ПЛАГИНА
     * ============================================================ */
    function registerSettings() {
        try {
            L.SettingsApi.addComponent({
                component: 'horror_unified',
                name: 'Хоррор',
                icon: ICON_SETTINGS,
                after: 'more'   // встаёт в самый низ списка настроек
            });

            var themeValues = { none: 'Без темы' };
            HORROR_THEMES.forEach(function (t) { themeValues[t.id] = t.name; });

            var glitchValues = { none: 'Без глюков' };
            GLITCH_EFFECTS.forEach(function (g) { glitchValues[g.id] = g.name; });

            L.SettingsApi.addParam({
                component: 'horror_unified',
                param: { name: 'horror_card_theme', type: 'select', values: themeValues, default: 'none' },
                field: { name: 'Тема карточек' },
                onChange: applyTheme
            });

            L.SettingsApi.addParam({
                component: 'horror_unified',
                param: { name: 'horror_glitch', type: 'select', values: glitchValues, default: 'none' },
                field: { name: 'Визуальный глюк' },
                onChange: applyGlitch
            });

            L.SettingsApi.addParam({
                component: 'horror_unified',
                param: { name: 'horror_show_in_menu', type: 'trigger', default: true },
                field: { name: 'Раздел «Ужасы» в главном меню' },
                onChange: function (value) {
                    if (value) {
                        if (!menu_button_added) initMenuButton();
                    } else if (menu_button_added) {
                        $('.menu .menu__item').each(function () {
                            if ($(this).find('.menu__text').text().trim() === TITLE) $(this).remove();
                        });
                        menu_button_added = false;
                    }
                }
            });

            // Принудительно обновляем список компонентов в главном окне настроек
            if (L.Settings && typeof L.Settings.main === 'function') {
                var main = L.Settings.main();
                if (main && typeof main.update === 'function') {
                    main.update();
                    console.log('[HorrorUnified] Settings.main().update() вызван');
                }
            }

            console.log('[HorrorUnified] Секция настроек «Хоррор» зарегистрирована');
        } catch (e) {
            console.error('[HorrorUnified] Ошибка регистрации настроек:', e);
        }
    }

    /* ============================================================
     *  НАБЛЮДАТЕЛЬ ЗА НОВЫМИ КАРТОЧКАМИ
     * ============================================================ */
    function initObserver() {
        if (typeof MutationObserver === 'undefined') return;
        var observer = new MutationObserver(function (mutations) {
            var theme = L.Storage.get('horror_card_theme', 'none');
            if (!theme || theme === 'none') return;
            for (var i = 0; i < mutations.length; i++) {
                var m = mutations[i];
                if (m.type !== 'childList') continue;
                for (var j = 0; j < m.addedNodes.length; j++) {
                    applyThemeToElement(m.addedNodes[j], theme);
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    /* ============================================================
     *  BOOT
     * ============================================================ */
    function boot() {
        console.log('[HorrorUnified] Boot v' + VERSION);

        try {
            /* 1. Компонент раздела */
            if (L.Component && L.Component.add) {
                L.Component.add(COMPONENT, HorrorComponent);
                console.log('[HorrorUnified] Компонент «' + COMPONENT + '» зарегистрирован');
            } else {
                console.error('[HorrorUnified] Lampa.Component.add недоступен');
            }

            /* 2. Стили */
            injectHorrorStyles();
            injectThemeStyles();

            /* 3. Настройки */
            registerSettings();

            /* 4. Применяем сохранённые значения */
            setTimeout(function () {
                applyTheme(L.Storage.get('horror_card_theme', 'none'));
                applyGlitch(L.Storage.get('horror_glitch', 'none'));
            }, 200);

            /* 5. Следим за изменениями настроек в других окнах */
            L.Storage.listener.follow('change', function (e) {
                if (e.name === 'horror_card_theme') applyTheme(e.value);
                if (e.name === 'horror_glitch') applyGlitch(e.value);
            });

            /* 6. Меню-кнопка */
            initMenuButton();

            /* 7. Наблюдатель за карточками */
            initObserver();

            /* 8. Переприменяем тему при открытии full-карточки */
            L.Listener.follow('full', function (e) {
                if (e.type === 'complite') {
                    var theme = L.Storage.get('horror_card_theme', 'none');
                    if (theme && theme !== 'none') applyThemeToElement(e.body[0], theme);
                }
            });

            /* 9. Догружаем логотипы студий в фоне */
            loadStudioLogos(function () {
                console.log('[HorrorUnified] Логотипы студий загружены');
            });

            /* 10. Уведомление о загрузке */
            if (L.Noty && L.Noty.show) {
                L.Noty.show('Хоррор-плагин v' + VERSION + ' загружен. Настройки: «Настройки → Хоррор»', { time: 5000 });
            }

            console.log('[HorrorUnified] Готов. Тем:', HORROR_THEMES.length,
                        '| Глитчей:', GLITCH_EFFECTS.length);
        } catch (e) {
            console.error('[HorrorUnified] Boot error:', e);
        }
    }

    if (window.appready) boot();
    else L.Listener.follow('app', function (e) { if (e.type === 'ready') boot(); });
})();
/* ============================================================
 *  HORROR UNIFIED v4.1 for Lampa 3.3.x
 *  - Раздел «Ужасы» с фильтрами
 *  - Кнопка «Испугай меня» → модалка с превью случайного фильма
 *  - Ряд «Рекомендуем посмотреть»
 *  - Ряд «Новые ужасы»
 *  - Ряд «Подборки»
 *  - Темы карточек и оверлей-эффекты — только на странице «Ужасы»
 *  - Настройки: «Настройки → Хоррор»
 *
 *  Все запросы к TMDB идут через L.TMDB.get() (с api_key и прокси).
 * ============================================================ */
(function () {
    'use strict';

    if (window.__horror_unified__) return;
    window.__horror_unified__ = true;

    if (!window.Lampa) { console.error('[HorrorUnified] Lampa не найдена'); return; }

    var L = window.Lampa;
    var VERSION = '4.1.0';
    var COMPONENT = 'horror';
    var TITLE = 'Ужасы';
    var DEFAULT_GENRE = '27|53';

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

    var ICON_FRIGHTEN =
        '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12c0 3.18 1.46 5.95 3.7 7.72V21c0 .55.45 1 1 1h1v-1c0-.55.45-1 1-1h6c.55 0 1 .45 1 1v1h1c.55 0 1-.45 1-1v-1.28C20.54 17.95 22 15.18 22 12c0-5.52-4.48-10-10-10zm-3.5 12c-.83 0-1.5-.67-1.5-1.5S7.67 11 8.5 11s1.5.67 1.5 1.5S9.33 14 8.5 14zm7 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>' +
        '<path fill="currentColor" d="M9 17c.4-.9 1.5-1.5 3-1.5s2.6.6 3 1.5H9z" opacity=".8"/>' +
        '</svg>';

    /* ============================================================
     *  ДАННЫЕ
     * ============================================================ */
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
    var COLLECTIONS = [
        { title: 'Найденная плёнка',    keywords: '158718' },
        { title: 'Демоны и экзорцизм',  keywords: '10427|162403' },
        { title: 'Зомби-апокалипсис',   keywords: '12377' },
        { title: 'Дом с привидениями',  keywords: '288394|10541' },
        { title: 'Психопаты и маньяки', keywords: '11477|10714' },
        { title: 'Космический ужас',    keywords: '9951' },
        { title: 'Ведьмы и оккультизм', keywords: '9755|6152' },
        { title: 'Слэшеры',             keywords: '234452' }
    ];

    var horror_state = {
        genre: DEFAULT_GENRE, languages: [], subgenres: [], studio: null, searchQuery: ''
    };
    var studioLogosCache = {};

    /* ============================================================
     *  ХЕЛПЕРЫ
     * ============================================================ */
    function hasActiveFilters() {
        return horror_state.languages.length || horror_state.subgenres.length ||
               horror_state.studio !== null || horror_state.genre !== DEFAULT_GENRE ||
               horror_state.searchQuery;
    }
    function resetFilters() {
        horror_state.genre = DEFAULT_GENRE;
        horror_state.languages = [];
        horror_state.subgenres = [];
        horror_state.studio = null;
        horror_state.searchQuery = '';
    }
    function buildFilterParams() {
        var f = {};
        if (horror_state.languages.length) f.with_original_language = horror_state.languages.join('|');
        if (horror_state.subgenres.length) f.with_keywords = horror_state.subgenres.join('|');
        return f;
    }
    function buildActivityObject() {
        var obj = {
            component: COMPONENT, title: TITLE, source: 'tmdb', page: 1,
            url: 'discover/movie', genres: horror_state.genre,
            query: '', filter: {}, sort_by: ''
        };
        if (horror_state.searchQuery) {
            obj.url = 'search/movie';
            obj.query = encodeURIComponent(horror_state.searchQuery);
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

    /* Единая обёртка над L.TMDB.get — гарантирует ключ + прокси + язык */
    function tmdbGet(method, filter, cb, err, cache) {
        var params = {};
        if (filter) params.filter = filter;
        try {
            L.TMDB.get(method, params, cb, err || function () {}, cache);
        } catch (e) {
            console.error('[HorrorUnified] TMDB request error:', e);
            if (err) err(e);
        }
    }

    function loadStudioLogos(cb) {
        var ids = STUDIOS.map(function (s) { return s.id; });
        var pending = ids.length;
        if (!pending) return cb && cb();
        ids.forEach(function (id) {
            if (studioLogosCache.hasOwnProperty(id)) { if (--pending === 0) cb && cb(); return; }
            tmdbGet('company/' + id, null, function (data) {
                studioLogosCache[id] = data && data.logo_path
                    ? L.TMDB.image('t/p/w200' + data.logo_path)
                    : null;
                if (--pending === 0) cb && cb();
            }, function () {
                studioLogosCache[id] = null;
                if (--pending === 0) cb && cb();
            });
        });
    }

    /* ============================================================
     *  СТИЛИ
     * ============================================================ */
    function injectStyles() {
        if (document.getElementById('horror-unified-styles')) return;
        var style = document.createElement('style');
        style.id = 'horror-unified-styles';
        style.textContent = [
            /* ============ Top section ============ */
            '.horror-top-section{grid-column:1 / -1;width:100%;box-sizing:border-box;',
            'padding:0 0 1em 0;position:relative;z-index:1}',
            '.horror-rows{width:100%;display:block}',
            '.horror-row-slot{width:100%;display:block;min-height:22em}',
            '.horror-row-slot:empty{min-height:0}',

            /* ============ Filters ============ */
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
            '.horror-studio-item .selectbox-item__icon{background:transparent!important;padding:.2em}',

            /* ============ Frighten button ============ */
            '.horror-frighten-btn{display:flex;align-items:center;justify-content:center;gap:1em;',
            'padding:1.15em 2em;margin:0 0 1.5em 0;',
            'background:linear-gradient(135deg,#4a0000 0%,#8b0000 25%,#dc143c 50%,#8b0000 75%,#4a0000 100%);',
            'background-size:300% 300%;border-radius:1em;color:#fff;',
            'font-size:1.15em;font-weight:600;cursor:pointer;',
            'border:2px solid rgba(255,60,60,.4);',
            'text-shadow:0 0 12px rgba(255,100,100,.9), 0 0 4px rgba(0,0,0,.8);',
            'animation:hfx-frighten-pulse 3s ease-in-out infinite, hfx-frighten-gradient 10s ease infinite;',
            'transition:transform .15s, box-shadow .15s;user-select:none}',
            '.horror-frighten-btn:hover,.horror-frighten-btn.focus{transform:scale(1.02);',
            'box-shadow:0 0 60px rgba(255,30,60,.9), inset 0 0 30px rgba(255,100,100,.3)!important}',
            '.horror-frighten-btn svg{width:1.6em;height:1.6em;flex-shrink:0;',
            'filter:drop-shadow(0 0 6px rgba(255,100,100,.8))}',
            '.horror-frighten-btn span{letter-spacing:.02em}',
            '@keyframes hfx-frighten-pulse{',
            '0%,100%{box-shadow:0 0 30px rgba(220,20,60,.35), inset 0 0 20px rgba(0,0,0,.3)}',
            '50%{box-shadow:0 0 55px rgba(255,30,60,.75), inset 0 0 30px rgba(255,50,50,.25)}}',
            '@keyframes hfx-frighten-gradient{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}',

            /* ============ Modal preview ============ */
            '.horror-preview{display:flex;gap:1.2em;padding:1em 0}',
            '.horror-preview__poster{flex-shrink:0;width:10em;border-radius:.6em;overflow:hidden;',
            'box-shadow:0 8px 32px rgba(0,0,0,.6)}',
            '.horror-preview__poster img{width:100%;display:block;aspect-ratio:2/3;object-fit:cover}',
            '.horror-preview__body{flex:1;min-width:0;display:flex;flex-direction:column;gap:.5em}',
            '.horror-preview__title{font-size:1.35em;font-weight:600;line-height:1.2}',
            '.horror-preview__meta{display:flex;gap:.8em;flex-wrap:wrap;font-size:.9em;opacity:.75}',
            '.horror-preview__overview{font-size:.95em;line-height:1.5;opacity:.85;max-height:12em;overflow:auto}',
            '.horror-preview__badge{display:inline-block;padding:.15em .55em;background:rgba(220,20,60,.35);',
            'border-radius:.5em;font-size:.85em}',

            /* ============ Overlay effects layer ============ */
            '.horror-fx-layer{position:fixed;inset:0;pointer-events:none;display:none;z-index:120;overflow:hidden}',
            'body.horror-page .horror-fx-layer{display:block}',
            '.horror-fx-layer > *{position:absolute;inset:0;pointer-events:none}',
            '.horror-fx-canvas{width:100%;height:100%;display:none;image-rendering:pixelated;mix-blend-mode:screen;opacity:.5}',
            'body.horror-page[data-horror-fx~="noise"] .horror-fx-canvas{display:block}',
            '.horror-fx-scanlines{display:none;opacity:.5;',
            'background:repeating-linear-gradient(0deg,rgba(0,0,0,.35) 0px,rgba(0,0,0,.35) 1px,transparent 1px,transparent 3px)}',
            'body.horror-page[data-horror-fx~="scanline"] .horror-fx-scanlines{display:block;animation:hfx-scanmove 8s linear infinite}',
            '@keyframes hfx-scanmove{0%{background-position:0 0}100%{background-position:0 12px}}',
            '.horror-fx-vhs{display:none;opacity:.5;',
            'background:linear-gradient(180deg,transparent 0,transparent 40%,rgba(255,255,255,.06) 50%,transparent 60%,transparent 100%);',
            'mix-blend-mode:overlay}',
            'body.horror-page[data-horror-fx~="vhs"] .horror-fx-vhs{display:block;animation:hfx-vhs 3.5s linear infinite}',
            '@keyframes hfx-vhs{0%{transform:translateY(-100%)}100%{transform:translateY(100%)}}',
            '.horror-fx-vhs::before{content:"";position:absolute;left:0;right:0;height:8px;top:20%;',
            'background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);',
            'animation:hfx-vhsband 5s linear infinite}',
            '@keyframes hfx-vhsband{0%{top:0}100%{top:100%}}',
            '.horror-fx-chroma{display:none;mix-blend-mode:screen;opacity:.35}',
            'body.horror-page[data-horror-fx~="chroma"] .horror-fx-chroma{display:block;',
            'background:linear-gradient(90deg,rgba(255,0,0,.15) 0,transparent 3%,transparent 97%,rgba(0,255,255,.15) 100%);',
            'animation:hfx-chroma 4s ease-in-out infinite}',
            '@keyframes hfx-chroma{0%,100%{transform:translateX(0)}50%{transform:translateX(2px)}}',
            '.horror-fx-vignette{display:none;',
            'background:radial-gradient(ellipse at center,transparent 35%,rgba(0,0,0,.55) 85%,rgba(0,0,0,.85) 100%)}',
            'body.horror-page[data-horror-fx~="vignette"] .horror-fx-vignette{display:block}',
            '.horror-fx-flicker{display:none;background:#fff;mix-blend-mode:overlay}',
            'body.horror-page[data-horror-fx~="flicker"] .horror-fx-flicker{display:block;animation:hfx-flick 6s steps(1) infinite}',
            '@keyframes hfx-flick{0%,98%,100%{opacity:0}98.5%{opacity:.12}99%{opacity:0}99.3%{opacity:.08}}',
            '.horror-fx-dust{display:none;mix-blend-mode:screen}',
            'body.horror-page[data-horror-fx~="dust"] .horror-fx-dust{display:block}',
            '.horror-fx-dust::before,.horror-fx-dust::after{content:"";position:absolute;inset:-20%;',
            'background-image:radial-gradient(circle,rgba(255,255,255,.7) 1px,transparent 1.5px),radial-gradient(circle,rgba(255,255,255,.4) 1px,transparent 1.5px);',
            'background-size:150px 150px, 250px 250px;background-position:0 0, 50px 70px;opacity:.35;',
            'animation:hfx-dust 40s linear infinite}',
            '.horror-fx-dust::after{background-size:180px 180px, 320px 320px;animation-duration:65s;animation-direction:reverse;opacity:.25}',
            '@keyframes hfx-dust{0%{transform:translate3d(0,0,0)}100%{transform:translate3d(-100px,-100px,0)}}',
            'body.horror-page[data-horror-fx~="shake"] .card__view{animation:hfx-shake 4s ease-in-out infinite}',
            '@keyframes hfx-shake{0%,92%,100%{transform:translateX(0)}93%{transform:translateX(-2px)}94%{transform:translateX(2px)}95%{transform:translateX(-1px)}96%{transform:translateX(0)}}',
            'body.horror-page[data-horror-fx~="wobble"] .card__view{animation:hfx-wobble 8s ease-in-out infinite}',
            '@keyframes hfx-wobble{0%,100%{transform:rotate(0)}25%{transform:rotate(.4deg)}75%{transform:rotate(-.4deg)}}',
            'body.horror-page[data-horror-fx~="pulse"] .card__view{animation:hfx-pulse 3.5s ease-in-out infinite}',
            '@keyframes hfx-pulse{0%,100%{filter:brightness(1)}50%{filter:brightness(1.15)}}'
        ].join('');
        document.head.appendChild(style);
    }

    /* ============================================================
     *  ТЕМЫ
     * ============================================================ */
    var CARD_THEMES = [
        { id: 'blood_moon', name: 'Кровавая Луна',
          css: '.horror-page[data-horror-theme="blood_moon"] .card__view{filter:sepia(.35) contrast(1.6) brightness(.7) hue-rotate(-20deg)!important;box-shadow:0 0 20px rgba(180,0,0,.75), inset 0 0 40px rgba(120,0,0,.55)!important}' +
               '.horror-page[data-horror-theme="blood_moon"] .card__title{color:#ff3b3b!important;text-shadow:0 0 8px rgba(255,0,0,.9)}' +
               '.horror-page[data-horror-theme="blood_moon"] .card__age{color:#ff6b6b!important}' +
               '.horror-page[data-horror-theme="blood_moon"] .card__view::after{content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;z-index:3;background:radial-gradient(circle at 30% 40%,transparent 55%,rgba(80,0,0,.65) 100%),repeating-linear-gradient(0deg,rgba(255,0,0,.05) 0,rgba(255,0,0,.05) 1px,transparent 1px,transparent 4px)}'
        },
        { id: 'bone_chill', name: 'Мороз по Коже',
          css: '.horror-page[data-horror-theme="bone_chill"] .card__view{filter:contrast(1.4) saturate(.25) brightness(.85) hue-rotate(180deg)!important;box-shadow:0 0 18px rgba(200,230,255,.55), inset 0 0 30px rgba(100,140,180,.45)!important}' +
               '.horror-page[data-horror-theme="bone_chill"] .card__title{color:#c8e4ff!important;text-shadow:0 0 10px rgba(160,210,255,.9);letter-spacing:.05em}' +
               '.horror-page[data-horror-theme="bone_chill"] .card__view::after{content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;z-index:3;background:linear-gradient(180deg,rgba(180,220,255,.18) 0,transparent 40%,rgba(100,140,200,.22) 100%),repeating-linear-gradient(90deg,rgba(200,230,255,.04) 0,rgba(200,230,255,.04) 2px,transparent 2px,transparent 6px)}'
        },
        { id: 'cursed_sigil', name: 'Проклятый Знак',
          css: '.horror-page[data-horror-theme="cursed_sigil"] .card__view{filter:contrast(1.35) hue-rotate(270deg) brightness(.6)!important;box-shadow:0 0 24px rgba(140,0,200,.85), inset 0 0 50px rgba(60,0,100,.65)!important}' +
               '.horror-page[data-horror-theme="cursed_sigil"] .card__title{color:#d48aff!important;text-shadow:0 0 12px rgba(180,0,255,.95)}' +
               '.horror-page[data-horror-theme="cursed_sigil"] .card__view::after{content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;z-index:3;background:repeating-linear-gradient(45deg,transparent 0,transparent 12px,rgba(160,0,220,.14) 12px,rgba(160,0,220,.14) 14px),repeating-linear-gradient(-45deg,transparent 0,transparent 12px,rgba(160,0,220,.14) 12px,rgba(160,0,220,.14) 14px)}'
        },
        { id: 'asylum', name: 'Приют',
          css: '.horror-page[data-horror-theme="asylum"] .card__view{filter:grayscale(.85) contrast(1.55) brightness(.55) sepia(.25)!important;box-shadow:0 0 16px rgba(140,120,60,.65), inset 0 0 35px rgba(80,60,20,.55)!important}' +
               '.horror-page[data-horror-theme="asylum"] .card__title{color:#c4a35a!important;text-shadow:0 0 8px rgba(180,140,40,.75);font-family:Georgia,serif}' +
               '.horror-page[data-horror-theme="asylum"] .card__view::after{content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;z-index:3;background:repeating-linear-gradient(90deg,transparent 0,transparent 4px,rgba(100,80,30,.1) 4px,rgba(100,80,30,.1) 5px),repeating-linear-gradient(0deg,transparent 0,transparent 5px,rgba(40,30,10,.15) 5px,rgba(40,30,10,.15) 6px)}'
        },
        { id: 'veil', name: 'Пелена',
          css: '.horror-page[data-horror-theme="veil"] .card__view{filter:brightness(.5) contrast(1.75) saturate(.4)!important;box-shadow:0 0 32px rgba(0,0,0,.95), inset 0 0 80px rgba(0,0,0,.85)!important}' +
               '.horror-page[data-horror-theme="veil"] .card__title{color:#999!important;text-shadow:0 0 14px rgba(0,0,0,1)}' +
               '.horror-page[data-horror-theme="veil"] .card__view::after{content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;z-index:3;background:radial-gradient(ellipse at center,transparent 25%,rgba(0,0,0,.92) 100%)}'
        },
        { id: 'ritual', name: 'Ритуал',
          css: '.horror-page[data-horror-theme="ritual"] .card__view{filter:contrast(1.55) saturate(1.5) hue-rotate(-40deg) brightness(.65)!important;box-shadow:0 0 26px rgba(255,60,0,.75), inset 0 0 45px rgba(150,20,0,.55)!important}' +
               '.horror-page[data-horror-theme="ritual"] .card__title{color:#ff7b00!important;text-shadow:0 0 12px rgba(255,80,0,.95)}' +
               '.horror-page[data-horror-theme="ritual"] .card__view::after{content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;z-index:3;background:radial-gradient(circle at 50% 85%,rgba(255,60,0,.28) 0,transparent 60%),repeating-linear-gradient(0deg,rgba(255,100,0,.06) 0,rgba(255,100,0,.06) 1px,transparent 1px,transparent 5px)}'
        },
        { id: 'flesh', name: 'Плоть',
          css: '.horror-page[data-horror-theme="flesh"] .card__view{filter:sepia(.65) saturate(1.85) hue-rotate(-10deg) contrast(1.35) brightness(.6)!important;box-shadow:0 0 22px rgba(200,80,60,.75), inset 0 0 40px rgba(120,40,20,.55)!important}' +
               '.horror-page[data-horror-theme="flesh"] .card__title{color:#e88a7a!important;text-shadow:0 0 10px rgba(200,80,50,.85)}' +
               '.horror-page[data-horror-theme="flesh"] .card__view::after{content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;z-index:3;background:radial-gradient(circle at 30% 20%,rgba(255,120,90,.15),transparent 60%),radial-gradient(circle at 70% 80%,rgba(180,40,20,.2),transparent 60%)}'
        },
        { id: 'whisper', name: 'Шёпот',
          css: '.horror-page[data-horror-theme="whisper"] .card__view{filter:brightness(.45) contrast(1.85) blur(.4px)!important;box-shadow:0 0 28px rgba(60,80,120,.65), inset 0 0 60px rgba(20,30,60,.75)!important}' +
               '.horror-page[data-horror-theme="whisper"] .card__title{color:#7a9ec4!important;text-shadow:0 0 16px rgba(60,100,180,.75);font-style:italic}' +
               '.horror-page[data-horror-theme="whisper"] .card__view::after{content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;z-index:3;background:linear-gradient(180deg,transparent 50%,rgba(10,20,50,.65) 100%)}'
        },
        { id: 'grave_dirt', name: 'Могильная Земля',
          css: '.horror-page[data-horror-theme="grave_dirt"] .card__view{filter:grayscale(.9) contrast(1.6) brightness(.5) sepia(.4)!important;box-shadow:0 0 18px rgba(60,50,30,.85), inset 0 0 50px rgba(30,25,10,.75)!important}' +
               '.horror-page[data-horror-theme="grave_dirt"] .card__title{color:#8a7a5a!important;text-shadow:0 0 10px rgba(60,50,20,1);font-family:Georgia,serif;letter-spacing:.08em}' +
               '.horror-page[data-horror-theme="grave_dirt"] .card__view::after{content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;z-index:3;background:repeating-linear-gradient(0deg,transparent 0,transparent 3px,rgba(40,35,15,.12) 3px,rgba(40,35,15,.12) 4px),repeating-linear-gradient(90deg,transparent 0,transparent 5px,rgba(60,50,20,.08) 5px,rgba(60,50,20,.08) 6px)}'
        },
        { id: 'abyss', name: 'Бездна',
          css: '.horror-page[data-horror-theme="abyss"] .card__view{filter:brightness(.35) contrast(2) saturate(.3)!important;box-shadow:0 0 38px rgba(0,0,0,1), inset 0 0 70px rgba(0,0,0,.95)!important}' +
               '.horror-page[data-horror-theme="abyss"] .card__title{color:#4a6a8a!important;text-shadow:0 0 22px rgba(20,40,80,.85);opacity:.85}' +
               '.horror-page[data-horror-theme="abyss"] .card__view::after{content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;z-index:3;background:radial-gradient(ellipse at 50% 50%,transparent 8%,rgba(0,0,0,.96) 90%)}'
        }
    ];

    function injectThemeStyles() {
        if (document.getElementById('horror-themes-styles')) return;
        var style = document.createElement('style');
        style.id = 'horror-themes-styles';
        style.textContent = CARD_THEMES.map(function (t) { return t.css; }).join('\n');
        document.head.appendChild(style);
    }

    /* ============================================================
     *  ОВЕРЛЕЙ-ЭФФЕКТЫ
     * ============================================================ */
    var ALL_FX_TOKENS = 'noise scanline vhs chroma vignette flicker dust';
    var CARD_FX_TOKENS = 'shake wobble pulse flicker';

    var fx_root = null, fx_canvas = null, fx_ctx = null, fx_noise_timer = null;

    function buildFxLayer() {
        if (fx_root) return;
        fx_root = document.createElement('div');
        fx_root.className = 'horror-fx-layer';
        fx_root.innerHTML =
            '<canvas class="horror-fx-canvas"></canvas>' +
            '<div class="horror-fx-scanlines"></div>' +
            '<div class="horror-fx-vhs"></div>' +
            '<div class="horror-fx-chroma"></div>' +
            '<div class="horror-fx-vignette"></div>' +
            '<div class="horror-fx-flicker"></div>' +
            '<div class="horror-fx-dust"></div>';
        document.body.appendChild(fx_root);
        fx_canvas = fx_root.querySelector('.horror-fx-canvas');
        fx_ctx = fx_canvas.getContext('2d');
        sizeNoiseCanvas();
        window.addEventListener('resize', sizeNoiseCanvas);
    }
    function sizeNoiseCanvas() {
        if (!fx_canvas) return;
        fx_canvas.width  = Math.max(240, Math.floor(window.innerWidth  / 3));
        fx_canvas.height = Math.max(160, Math.floor(window.innerHeight / 3));
    }
    function startNoise() {
        if (fx_noise_timer || !fx_ctx) return;
        tickNoise();
    }
    function stopNoise() {
        if (fx_noise_timer) { clearTimeout(fx_noise_timer); fx_noise_timer = null; }
        if (fx_ctx && fx_canvas) fx_ctx.clearRect(0, 0, fx_canvas.width, fx_canvas.height);
    }
    function tickNoise() {
        if (!fx_ctx) return;
        var w = fx_canvas.width, h = fx_canvas.height;
        var img = fx_ctx.createImageData(w, h);
        var d = img.data;
        for (var i = 0; i < d.length; i += 4) {
            var v = (Math.random() * 255) | 0;
            d[i] = v; d[i + 1] = v; d[i + 2] = v;
            d[i + 3] = Math.random() < 0.6 ? 45 : 0;
        }
        fx_ctx.putImageData(img, 0, 0);
        fx_noise_timer = setTimeout(tickNoise, 1000 / 20);
    }

    function applyThemeAttribute(themeId) {
        if (!themeId || themeId === 'none') document.body.removeAttribute('data-horror-theme');
        else document.body.setAttribute('data-horror-theme', themeId);
    }
    function applyFxAttribute(tokens) {
        var list = (tokens || '').trim();
        if (!list || list === 'none') {
            document.body.removeAttribute('data-horror-fx');
            stopNoise();
            return;
        }
        if (list.split(/\s+/).indexOf('all') !== -1) list = ALL_FX_TOKENS + ' ' + CARD_FX_TOKENS;
        document.body.setAttribute('data-horror-fx', list);
        if (list.split(/\s+/).indexOf('noise') !== -1) startNoise();
        else stopNoise();
    }
    function syncPageClass() {
        var a = L.Activity.active();
        var is_horror = a && a.component === COMPONENT;
        document.body.classList.toggle('horror-page', is_horror);
        if (is_horror) {
            var t = L.Storage.get('horror_fx', '');
            if (t) applyFxAttribute(t);
        } else stopNoise();
    }

    /* ============================================================
     *  «ИСПУГАЙ МЕНЯ» — модалка с превью
     * ============================================================ */
    var FRIGHTEN_QUERIES = [
        { with_genres: 27, sort_by: 'vote_average.desc', 'vote_count.gte': 3000, 'vote_average.gte': 7.2 },
        { with_genres: 27, with_keywords: 9715,  sort_by: 'vote_average.desc', 'vote_count.gte': 800,  'vote_average.gte': 6.8 },
        { with_genres: 27, with_keywords: 162403, sort_by: 'vote_average.desc', 'vote_count.gte': 500, 'vote_average.gte': 6.5 },
        { with_genres: 27, with_keywords: 10427, sort_by: 'vote_average.desc', 'vote_count.gte': 500,  'vote_average.gte': 6.5 },
        { with_genres: 27, with_keywords: 158718, sort_by: 'vote_average.desc', 'vote_count.gte': 300, 'vote_average.gte': 6 },
        { with_genres: 27, with_keywords: '288394|10541', sort_by: 'vote_average.desc', 'vote_count.gte': 800, 'vote_average.gte': 6.5 }
    ];

    function showFrightenModal(card) {
        var poster_url = card.poster_path
            ? L.TMDB.image('t/p/w500' + card.poster_path)
            : './img/img_broken.svg';
        var title = card.title || card.name || 'Без названия';
        var year  = ((card.release_date || card.first_air_date || '') + '').slice(0, 4);
        var rating = (card.vote_average || 0).toFixed(1);
        var overview = (card.overview || 'Без описания.').slice(0, 600);
        var genres = '';
        if (card.genre_ids && L.TMDB.getGenresNameFromIds) {
            try {
                genres = L.TMDB.getGenresNameFromIds('movie', card.genre_ids).join(' · ');
            } catch (e) {}
        }

        var html =
            '<div class="horror-preview">' +
              '<div class="horror-preview__poster"><img src="' + poster_url + '" onerror="this.src=\'./img/img_broken.svg\'"/></div>' +
              '<div class="horror-preview__body">' +
                '<div class="horror-preview__title">' + title + '</div>' +
                '<div class="horror-preview__meta">' +
                  (year ? '<span>' + year + '</span>' : '') +
                  (rating && rating !== '0.0' ? '<span>★ ' + rating + '</span>' : '') +
                  (genres ? '<span>' + genres + '</span>' : '') +
                '</div>' +
                '<div class="horror-preview__badge">Готов испугаться?</div>' +
                '<div class="horror-preview__overview">' + overview + '</div>' +
              '</div>' +
            '</div>';

        var prevController = L.Controller.enabled().name;

        L.Modal.open({
            title: 'Случайный ужастик',
            html: $(html),
            size: 'medium',
            buttons: [
                {
                    name: 'Смотреть',
                    onSelect: function () {
                        L.Modal.close();
                        L.Activity.push({
                            url: '',
                            component: 'full',
                            id: card.id,
                            method: 'movie',
                            card: card,
                            source: 'tmdb'
                        });
                    }
                },
                {
                    name: 'Ещё раз',
                    onSelect: function () {
                        L.Modal.close();
                        setTimeout(frightenMe, 50);
                    }
                },
                {
                    name: 'Отмена',
                    onSelect: function () {
                        L.Modal.close();
                        L.Controller.toggle(prevController);
                    }
                }
            ],
            onBack: function () {
                L.Modal.close();
                L.Controller.toggle(prevController);
            }
        });
    }

    var frighten_busy = false;

    function frightenMe() {
        if (frighten_busy) return;
        frighten_busy = true;

        L.Loading.start(function () {
            frighten_busy = false;
            L.Loading.stop();
        });

        var q = FRIGHTEN_QUERIES[Math.floor(Math.random() * FRIGHTEN_QUERIES.length)];
        var filter = Object.assign({}, q, { page: Math.floor(Math.random() * 3) + 1 });

        tmdbGet('discover/movie', filter, function (data) {
            L.Loading.stop();
            frighten_busy = false;

            if (!data || !data.results || !data.results.length) {
                L.Noty.show('Ничего не нашлось. Попробуйте ещё раз.');
                return;
            }

            var shown = L.Storage.get('horror_frighten_shown', []);
            if (!Array.isArray(shown)) shown = [];
            var available = data.results.filter(function (m) {
                return shown.indexOf(m.id) === -1;
            });
            if (!available.length) { shown = []; available = data.results; }

            var pick = available[Math.floor(Math.random() * available.length)];
            shown.push(pick.id);
            if (shown.length > 100) shown = shown.slice(-100);
            L.Storage.set('horror_frighten_shown', shown);

            showFrightenModal(pick);
        }, function (e) {
            L.Loading.stop();
            frighten_busy = false;
            console.error('[HorrorUnified] frightenMe error:', e);
            L.Noty.show('Ошибка при поиске. Проверьте соединение.');
        });
    }

    function buildFrightenButton() {
        var btn = document.createElement('div');
        btn.className = 'horror-frighten-btn selector';
        btn.innerHTML = ICON_FRIGHTEN + '<span>Испугай меня</span>';
        btn.addEventListener('click', frightenMe);
        return btn;
    }

    /* ============================================================
     *  РЯДЫ
     * ============================================================ */
    var rowsCache = { recomend: null, fresh: null, collections: null };

    function loadRecommendations(cb) {
        if (rowsCache.recomend) return cb(rowsCache.recomend);
        tmdbGet('discover/movie', {
            with_genres: 27,
            sort_by: 'vote_average.desc',
            'vote_count.gte': 2000,
            'vote_average.gte': 7,
            page: 1
        }, function (data) {
            var list = (data.results || []).slice(0, 20);
            rowsCache.recomend = list;
            cb(list);
        }, function () { cb([]); });
    }
    function loadNewReleases(cb) {
        if (rowsCache.fresh) return cb(rowsCache.fresh);
        var today = new Date().toISOString().split('T')[0];
        var yearAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString().split('T')[0];
        tmdbGet('discover/movie', {
            with_genres: 27,
            sort_by: 'primary_release_date.desc',
            'primary_release_date.lte': today,
            'primary_release_date.gte': yearAgo,
            'vote_count.gte': 30,
            page: 1
        }, function (data) {
            var list = (data.results || []).slice(0, 20);
            rowsCache.fresh = list;
            cb(list);
        }, function () { cb([]); });
    }
    function loadCollections(cb) {
        if (rowsCache.collections) return cb(rowsCache.collections);

        var cached = L.Storage.get('horror_collections_cache', {});
        var now = Date.now();
        var TTL = 1000 * 60 * 60 * 24 * 7;
        var toFetch = [];
        var result = [];

        COLLECTIONS.forEach(function (col, i) {
            var key = 'col_' + i;
            if (cached[key] && cached[key].time + TTL > now) {
                result[i] = {
                    id: 'horror_col_' + i,
                    title: col.title,
                    poster_path: cached[key].poster_path,
                    release_date: '',
                    vote_average: 0,
                    is_horror_collection: true,
                    horror_keywords: col.keywords,
                    overview: (cached[key].count || 0) + ' фильмов'
                };
            } else {
                toFetch.push({ idx: i, key: key, col: col });
            }
        });

        if (!toFetch.length) {
            var clean = result.filter(Boolean);
            rowsCache.collections = clean;
            return cb(clean);
        }

        var pending = toFetch.length;
        toFetch.forEach(function (item) {
            tmdbGet('discover/movie', {
                with_genres: 27,
                with_keywords: item.col.keywords,
                sort_by: 'vote_average.desc',
                'vote_count.gte': 100,
                page: 1
            }, function (data) {
                var first = data.results && data.results[0];
                if (first) {
                    result[item.idx] = {
                        id: 'horror_col_' + item.idx,
                        title: item.col.title,
                        poster_path: first.poster_path,
                        release_date: '',
                        vote_average: 0,
                        is_horror_collection: true,
                        horror_keywords: item.col.keywords,
                        overview: (data.total_results || 0) + ' фильмов'
                    };
                    cached[item.key] = {
                        time: now,
                        poster_path: first.poster_path,
                        count: data.total_results || 0
                    };
                }
                if (--pending === 0) {
                    L.Storage.set('horror_collections_cache', cached);
                    var clean = result.filter(Boolean);
                    rowsCache.collections = clean;
                    cb(clean);
                }
            }, function () {
                if (--pending === 0) {
                    L.Storage.set('horror_collections_cache', cached);
                    var clean = result.filter(Boolean);
                    rowsCache.collections = clean;
                    cb(clean);
                }
            });
        });
    }

    function openCardFromRow(card_data) {
        if (card_data.is_horror_collection) {
            horror_state.genre = '27';
            horror_state.languages = [];
            horror_state.subgenres = card_data.horror_keywords.split('|').map(Number);
            horror_state.studio = null;
            horror_state.searchQuery = '';
            L.Activity.push(buildActivityObject());
            return;
        }
        L.Activity.push({
            url: '',
            component: 'full',
            id: card_data.id,
            method: card_data.name ? 'tv' : 'movie',
            card: card_data,
            source: 'tmdb'
        });
    }

    function createRow(title, results, opts) {
        opts = opts || {};
        if (!results || !results.length) return null;
        try {
            var data = {
                title: title,
                results: results,
                params: {
                    items: { view: 7, mapping: 'line', align_left: false },
                    scroll: { horizontal: true, step: 300 }
                }
            };
            var line = L.Maker.make('Line', data);
            line.use({
                onInstance: function (card, card_data) {
                    card.use({
                        onEnter: function () { openCardFromRow(card_data); },
                        onFocus: function () {
                            L.Background.change(L.Utils.cardImgBackground(card_data));
                        }
                    });
                }
            });
            line.create();
            return line.render(true);
        } catch (e) {
            console.error('[HorrorUnified] createRow "' + title + '" error:', e, e.stack);
            return null;
        }
    }

    function buildRowsContainer() {
        var container = document.createElement('div');
        container.className = 'horror-rows';

        var slotRec = document.createElement('div'); slotRec.className = 'horror-row-slot';
        var slotNew = document.createElement('div'); slotNew.className = 'horror-row-slot';
        var slotCol = document.createElement('div'); slotCol.className = 'horror-row-slot';
        container.appendChild(slotRec);
        container.appendChild(slotNew);
        container.appendChild(slotCol);

        loadRecommendations(function (list) {
            console.log('[HorrorUnified] recomendations loaded:', list.length);
            if (!list.length) { slotRec.style.minHeight = '0'; return; }
            var row = createRow('Рекомендуем посмотреть', list);
            if (row) { slotRec.appendChild(row); L.Layer.update(); }
            else slotRec.style.minHeight = '0';
        });

        loadNewReleases(function (list) {
            console.log('[HorrorUnified] new releases loaded:', list.length);
            if (!list.length) { slotNew.style.minHeight = '0'; return; }
            var row = createRow('Новые ужасы', list);
            if (row) { slotNew.appendChild(row); L.Layer.update(); }
            else slotNew.style.minHeight = '0';
        });

        loadCollections(function (list) {
            console.log('[HorrorUnified] collections loaded:', list.length);
            if (!list.length) { slotCol.style.minHeight = '0'; return; }
            var row = createRow('Подборки', list);
            if (row) { slotCol.appendChild(row); L.Layer.update(); }
            else slotCol.style.minHeight = '0';
        });

        return container;
    }

    /* ============================================================
     *  ПАНЕЛЬ ФИЛЬТРОВ
     * ============================================================ */
    function openGenreFilter(onChange) {
        var items = GENRES.map(function (g) {
            return { title: g.title, id: g.id, selected: horror_state.genre === g.id };
        });
        L.Select.show({
            title: 'Жанр', items: items,
            onSelect: function (i) { horror_state.genre = i.id; L.Controller.toggle('content'); onChange(); },
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
            title: def.title, items: items,
            onCheck: function (item) {
                var idx = selected.indexOf(item.id);
                if (item.checked && idx === -1) selected.push(item.id);
                else if (!item.checked && idx !== -1) selected.splice(idx, 1);
                changed = true;
            },
            onBack: function () { L.Controller.toggle('content'); if (changed) onChange(); }
        });
    }
    function openStudioFilter(onChange) {
        var items = STUDIOS.map(function (s) {
            var logo = studioLogosCache[s.id];
            return {
                title: s.title, id: s.id, selected: horror_state.studio === s.id,
                thumbnail: logo || null,
                template: logo ? 'selectbox_icon' : 'selectbox_item'
            };
        });
        items.unshift({ title: 'Любая', id: null, selected: horror_state.studio === null, template: 'selectbox_item' });
        L.Select.show({
            title: 'Студия', items: items,
            onSelect: function (i) { horror_state.studio = i.id; L.Controller.toggle('content'); onChange(); },
            onDraw: function (item, elem) { if (elem && elem.id) item.addClass('horror-studio-item'); },
            onBack: function () { L.Controller.toggle('content'); }
        });
    }
    function openSearchInput(onChange) {
        var prev = L.Controller.enabled().name;
        L.Input.edit({
            title: 'Поиск по названию', value: horror_state.searchQuery,
            free: true, nosave: true, nomic: true
        }, function (value) {
            var v = (value || '').trim();
            var changed = v !== horror_state.searchQuery;
            horror_state.searchQuery = v;
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
        searchBtn.textContent = horror_state.searchQuery
            ? 'Поиск: ' + horror_state.searchQuery.slice(0, 20)
            : 'Поиск';
        searchBtn.addEventListener('click', function () { openSearchInput(onChange); });
        bar.appendChild(searchBtn);

        if (hasActiveFilters()) {
            var resetBtn = document.createElement('div');
            resetBtn.className = 'horror-filter-btn horror-filter-reset selector';
            resetBtn.textContent = 'Сбросить';
            resetBtn.addEventListener('click', function () { resetFilters(); onChange(); });
            bar.appendChild(resetBtn);
        }
        return bar;
    }

    /* ============================================================
     *  КОМПОНЕНТ
     * ============================================================ */
    function HorrorComponent(object) {
        injectStyles();
        var activityObj = buildActivityObject();
        Object.keys(activityObj).forEach(function (k) {
            if (k !== 'component' && typeof object[k] === 'undefined') object[k] = activityObj[k];
        });

        var comp = L.Maker.make('Category', object);
        var topSection = null;

        comp.use({
            onCreate: function () {
                var self = this;
                L.Api.list(object, this.build.bind(this), this.empty.bind(this));

                topSection = document.createElement('div');
                topSection.className = 'horror-top-section';

                topSection.appendChild(buildFiltersBar(function () {
                    L.Activity.replace(buildActivityObject());
                }));
                topSection.appendChild(buildFrightenButton());
                topSection.appendChild(buildRowsContainer());

                var body = this.scroll.body(true);
                if (body.firstChild) body.insertBefore(topSection, body.firstChild);
                else body.appendChild(topSection);

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
                if (topSection && topSection.parentNode) topSection.parentNode.removeChild(topSection);
                topSection = null;
            }
        });
        return comp;
    }

    /* ============================================================
     *  МЕНЮ
     * ============================================================ */
    var menu_button_added = false;
    function pushHorror() { L.Activity.push(buildActivityObject()); }
    function tryAddToMenu() {
        if (menu_button_added) return true;
        if (!L.Menu || typeof L.Menu.addButton !== 'function') return false;
        if (!$('.menu').length) return false;
        L.Menu.addButton(ICON_MENU, TITLE, pushHorror);
        menu_button_added = true;
        return true;
    }
    function initMenuButton() {
        if (L.Storage.field('horror_show_in_menu') === false) return;
        var attempts = 0;
        var t = setInterval(function () {
            if (tryAddToMenu() || ++attempts >= 40) clearInterval(t);
        }, 500);
    }

    /* ============================================================
     *  НАСТРОЙКИ
     * ============================================================ */
    function registerSettings() {
        var themeValues = { none: 'Без темы' };
        CARD_THEMES.forEach(function (t) { themeValues[t.id] = t.name; });

        var fxValues = {
            'none':               'Без эффектов',
            'noise':              'Шум (TV-помехи)',
            'scanline':           'CRT-развёртка',
            'vhs':                'VHS-искажения',
            'chroma':             'Хроматическая аберрация',
            'vignette':           'Виньетка',
            'flicker':            'Мерцание',
            'dust':               'Пыль в воздухе',
            'all':                'ВСЁ сразу (жёстко)',
            'shake wobble':       'Дрожание карточек',
            'pulse flicker':      'Пульсация + мерцание',
            'noise scanline vhs': 'TV + VHS комбо',
            'noise chroma flicker dust': 'Проклятая плёнка'
        };

        try {
            L.SettingsApi.addComponent({
                component: 'horror_unified',
                name: 'Хоррор',
                icon: ICON_SETTINGS,
                after: 'more'
            });

            L.SettingsApi.addParam({
                component: 'horror_unified',
                param: { name: 'horror_card_theme', type: 'select', values: themeValues, default: 'none' },
                field: { name: 'Тема карточек (только на странице «Ужасы»)' },
                onChange: applyThemeAttribute
            });

            L.SettingsApi.addParam({
                component: 'horror_unified',
                param: { name: 'horror_fx', type: 'select', values: fxValues, default: 'none' },
                field: { name: 'Оверлей-эффекты (только на странице «Ужасы»)' },
                onChange: function (val) {
                    if (document.body.classList.contains('horror-page')) applyFxAttribute(val);
                    else applyFxAttribute('none');
                }
            });

            L.SettingsApi.addParam({
                component: 'horror_unified',
                param: { name: 'horror_show_in_menu', type: 'trigger', default: true },
                field: { name: 'Раздел «Ужасы» в главном меню' },
                onChange: function (value) {
                    if (value) { if (!menu_button_added) initMenuButton(); }
                    else if (menu_button_added) {
                        $('.menu .menu__item').each(function () {
                            if ($(this).find('.menu__text').text().trim() === TITLE) $(this).remove();
                        });
                        menu_button_added = false;
                    }
                }
            });

            if (L.Settings && typeof L.Settings.main === 'function') {
                var main = L.Settings.main();
                if (main && typeof main.update === 'function') main.update();
            }
        } catch (e) {
            console.error('[HorrorUnified] Ошибка регистрации настроек:', e);
        }
    }

    /* ============================================================
     *  BOOT
     * ============================================================ */
    function boot() {
        console.log('[HorrorUnified] Boot v' + VERSION);

        try {
            if (L.Component && L.Component.add) L.Component.add(COMPONENT, HorrorComponent);
            else console.error('[HorrorUnified] Component.add недоступен');

            injectStyles();
            injectThemeStyles();
            buildFxLayer();
            registerSettings();

            L.Listener.follow('activity', function (e) {
                if (e.type === 'start' || e.type === 'archive' || e.type === 'destroy') {
                    setTimeout(syncPageClass, 0);
                }
            });

            L.Storage.listener.follow('change', function (e) {
                if (e.name === 'horror_card_theme') applyThemeAttribute(e.value);
                if (e.name === 'horror_fx') {
                    if (document.body.classList.contains('horror-page')) applyFxAttribute(e.value);
                }
            });

            initMenuButton();
            syncPageClass();

            loadStudioLogos(function () {
                console.log('[HorrorUnified] Логотипы студий загружены');
            });

            if (L.Noty && L.Noty.show) {
                L.Noty.show('Хоррор v' + VERSION + ' загружен. Настройки — «Настройки → Хоррор».',
                            { time: 4000 });
            }

            console.log('[HorrorUnified] Готов. Тем:', CARD_THEMES.length,
                        '| Оверлеев:', ALL_FX_TOKENS.split(' ').length);
        } catch (e) {
            console.error('[HorrorUnified] Boot error:', e);
        }
    }

    if (window.appready) boot();
    else L.Listener.follow('app', function (e) { if (e.type === 'ready') boot(); });
})();
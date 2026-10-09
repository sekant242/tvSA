/* ============================================================
 *  HORROR UNIFIED v3.0 for Lampa 3.3.x
 *
 *  ЧТО ДЕЛАЕТ:
 *   1. Раздел «Ужасы» в главном меню (расширенные фильтры)
 *   2. Темы карточек — ТОЛЬКО на странице «Ужасы»
 *   3. Оверлей-эффекты поверх контента — ТОЛЬКО на странице «Ужасы»
 *      (шум, CRT, VHS, хрома, виньетка, мерцание, пыль)
 *
 *  Эффекты рисуются отдельным fixed-слоем с pointer-events:none,
 *  поэтому не блокируют ввод и снимаются как только уходишь
 *  со страницы «Ужасы».
 * ============================================================ */
(function () {
    'use strict';

    if (window.__horror_unified__) return;
    window.__horror_unified__ = true;

    if (!window.Lampa) { console.error('[HorrorUnified] Lampa не найдена'); return; }

    var L = window.Lampa;
    var VERSION = '3.0.0';
    var COMPONENT = 'horror';
    var TITLE = 'Ужасы';

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
     *  ЧАСТЬ 1. ДАННЫЕ РАЗДЕЛА «УЖАСЫ»
     * ============================================================ */
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
        genre: DEFAULT_GENRE, languages: [], subgenres: [], studio: null, searchQuery: ''
    };
    var studioLogosCache = {};

    /* ---------- helpers раздела ---------- */
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
    function loadStudioLogos(cb) {
        var ids = STUDIOS.map(function (s) { return s.id; });
        var pending = ids.length;
        if (!pending) return cb && cb();
        ids.forEach(function (id) {
            if (studioLogosCache.hasOwnProperty(id)) { if (--pending === 0) cb && cb(); return; }
            var url = L.TMDB.api('company/' + id + '?language=' + (L.Storage.field('tmdb_lang') || 'ru'));
            L.Network.silent(url, function (data) {
                studioLogosCache[id] = data && data.logo_path ? L.TMDB.image('t/p/w200' + data.logo_path) : null;
                if (--pending === 0) cb && cb();
            }, function () {
                studioLogosCache[id] = null;
                if (--pending === 0) cb && cb();
            }, false, { timeout: 8000 });
        });
    }

    /* ============================================================
     *  ЧАСТЬ 2. ТЕМЫ КАРТОЧЕК (только для .horror-page)
     *  CSS использует scope body.horror-page[data-horror-theme=...]
     * ============================================================ */
    var CARD_THEMES = [
        {
            id: 'blood_moon', name: 'Кровавая Луна',
            css:
              '.horror-page[data-horror-theme="blood_moon"] .card__view{' +
              'filter:sepia(.35) contrast(1.6) brightness(.7) hue-rotate(-20deg)!important;' +
              'box-shadow:0 0 20px rgba(180,0,0,.75), inset 0 0 40px rgba(120,0,0,.55)!important;}' +
              '.horror-page[data-horror-theme="blood_moon"] .card__title{color:#ff3b3b!important;text-shadow:0 0 8px rgba(255,0,0,.9);}' +
              '.horror-page[data-horror-theme="blood_moon"] .card__age{color:#ff6b6b!important;}' +
              '.horror-page[data-horror-theme="blood_moon"] .card__view::after{' +
              'content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;z-index:3;' +
              'background:radial-gradient(circle at 30% 40%,transparent 55%,rgba(80,0,0,.65) 100%),' +
              'repeating-linear-gradient(0deg,rgba(255,0,0,.05) 0,rgba(255,0,0,.05) 1px,transparent 1px,transparent 4px);}'
        },
        {
            id: 'bone_chill', name: 'Мороз по Коже',
            css:
              '.horror-page[data-horror-theme="bone_chill"] .card__view{' +
              'filter:contrast(1.4) saturate(.25) brightness(.85) hue-rotate(180deg)!important;' +
              'box-shadow:0 0 18px rgba(200,230,255,.55), inset 0 0 30px rgba(100,140,180,.45)!important;}' +
              '.horror-page[data-horror-theme="bone_chill"] .card__title{color:#c8e4ff!important;text-shadow:0 0 10px rgba(160,210,255,.9);letter-spacing:.05em;}' +
              '.horror-page[data-horror-theme="bone_chill"] .card__view::after{' +
              'content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;z-index:3;' +
              'background:linear-gradient(180deg,rgba(180,220,255,.18) 0,transparent 40%,rgba(100,140,200,.22) 100%),' +
              'repeating-linear-gradient(90deg,rgba(200,230,255,.04) 0,rgba(200,230,255,.04) 2px,transparent 2px,transparent 6px);}'
        },
        {
            id: 'cursed_sigil', name: 'Проклятый Знак',
            css:
              '.horror-page[data-horror-theme="cursed_sigil"] .card__view{' +
              'filter:contrast(1.35) hue-rotate(270deg) brightness(.6)!important;' +
              'box-shadow:0 0 24px rgba(140,0,200,.85), inset 0 0 50px rgba(60,0,100,.65)!important;}' +
              '.horror-page[data-horror-theme="cursed_sigil"] .card__title{color:#d48aff!important;text-shadow:0 0 12px rgba(180,0,255,.95);}' +
              '.horror-page[data-horror-theme="cursed_sigil"] .card__view::after{' +
              'content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;z-index:3;' +
              'background:repeating-linear-gradient(45deg,transparent 0,transparent 12px,rgba(160,0,220,.14) 12px,rgba(160,0,220,.14) 14px),' +
              'repeating-linear-gradient(-45deg,transparent 0,transparent 12px,rgba(160,0,220,.14) 12px,rgba(160,0,220,.14) 14px);}'
        },
        {
            id: 'asylum', name: 'Приют',
            css:
              '.horror-page[data-horror-theme="asylum"] .card__view{' +
              'filter:grayscale(.85) contrast(1.55) brightness(.55) sepia(.25)!important;' +
              'box-shadow:0 0 16px rgba(140,120,60,.65), inset 0 0 35px rgba(80,60,20,.55)!important;}' +
              '.horror-page[data-horror-theme="asylum"] .card__title{color:#c4a35a!important;text-shadow:0 0 8px rgba(180,140,40,.75);font-family:Georgia,serif;}' +
              '.horror-page[data-horror-theme="asylum"] .card__view::after{' +
              'content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;z-index:3;' +
              'background:repeating-linear-gradient(90deg,transparent 0,transparent 4px,rgba(100,80,30,.1) 4px,rgba(100,80,30,.1) 5px),' +
              'repeating-linear-gradient(0deg,transparent 0,transparent 5px,rgba(40,30,10,.15) 5px,rgba(40,30,10,.15) 6px);}'
        },
        {
            id: 'veil', name: 'Пелена',
            css:
              '.horror-page[data-horror-theme="veil"] .card__view{' +
              'filter:brightness(.5) contrast(1.75) saturate(.4)!important;' +
              'box-shadow:0 0 32px rgba(0,0,0,.95), inset 0 0 80px rgba(0,0,0,.85)!important;}' +
              '.horror-page[data-horror-theme="veil"] .card__title{color:#999!important;text-shadow:0 0 14px rgba(0,0,0,1);}' +
              '.horror-page[data-horror-theme="veil"] .card__view::after{' +
              'content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;z-index:3;' +
              'background:radial-gradient(ellipse at center,transparent 25%,rgba(0,0,0,.92) 100%);}'
        },
        {
            id: 'ritual', name: 'Ритуал',
            css:
              '.horror-page[data-horror-theme="ritual"] .card__view{' +
              'filter:contrast(1.55) saturate(1.5) hue-rotate(-40deg) brightness(.65)!important;' +
              'box-shadow:0 0 26px rgba(255,60,0,.75), inset 0 0 45px rgba(150,20,0,.55)!important;}' +
              '.horror-page[data-horror-theme="ritual"] .card__title{color:#ff7b00!important;text-shadow:0 0 12px rgba(255,80,0,.95);}' +
              '.horror-page[data-horror-theme="ritual"] .card__view::after{' +
              'content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;z-index:3;' +
              'background:radial-gradient(circle at 50% 85%,rgba(255,60,0,.28) 0,transparent 60%),' +
              'repeating-linear-gradient(0deg,rgba(255,100,0,.06) 0,rgba(255,100,0,.06) 1px,transparent 1px,transparent 5px);}'
        },
        {
            id: 'flesh', name: 'Плоть',
            css:
              '.horror-page[data-horror-theme="flesh"] .card__view{' +
              'filter:sepia(.65) saturate(1.85) hue-rotate(-10deg) contrast(1.35) brightness(.6)!important;' +
              'box-shadow:0 0 22px rgba(200,80,60,.75), inset 0 0 40px rgba(120,40,20,.55)!important;}' +
              '.horror-page[data-horror-theme="flesh"] .card__title{color:#e88a7a!important;text-shadow:0 0 10px rgba(200,80,50,.85);}' +
              '.horror-page[data-horror-theme="flesh"] .card__view::after{' +
              'content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;z-index:3;' +
              'background:radial-gradient(circle at 30% 20%,rgba(255,120,90,.15),transparent 60%),' +
              'radial-gradient(circle at 70% 80%,rgba(180,40,20,.2),transparent 60%);}'
        },
        {
            id: 'whisper', name: 'Шёпот',
            css:
              '.horror-page[data-horror-theme="whisper"] .card__view{' +
              'filter:brightness(.45) contrast(1.85) blur(.4px)!important;' +
              'box-shadow:0 0 28px rgba(60,80,120,.65), inset 0 0 60px rgba(20,30,60,.75)!important;}' +
              '.horror-page[data-horror-theme="whisper"] .card__title{color:#7a9ec4!important;text-shadow:0 0 16px rgba(60,100,180,.75);font-style:italic;}' +
              '.horror-page[data-horror-theme="whisper"] .card__view::after{' +
              'content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;z-index:3;' +
              'background:linear-gradient(180deg,transparent 50%,rgba(10,20,50,.65) 100%);}'
        },
        {
            id: 'grave_dirt', name: 'Могильная Земля',
            css:
              '.horror-page[data-horror-theme="grave_dirt"] .card__view{' +
              'filter:grayscale(.9) contrast(1.6) brightness(.5) sepia(.4)!important;' +
              'box-shadow:0 0 18px rgba(60,50,30,.85), inset 0 0 50px rgba(30,25,10,.75)!important;}' +
              '.horror-page[data-horror-theme="grave_dirt"] .card__title{color:#8a7a5a!important;text-shadow:0 0 10px rgba(60,50,20,1);font-family:Georgia,serif;letter-spacing:.08em;}' +
              '.horror-page[data-horror-theme="grave_dirt"] .card__view::after{' +
              'content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;z-index:3;' +
              'background:repeating-linear-gradient(0deg,transparent 0,transparent 3px,rgba(40,35,15,.12) 3px,rgba(40,35,15,.12) 4px),' +
              'repeating-linear-gradient(90deg,transparent 0,transparent 5px,rgba(60,50,20,.08) 5px,rgba(60,50,20,.08) 6px);}'
        },
        {
            id: 'abyss', name: 'Бездна',
            css:
              '.horror-page[data-horror-theme="abyss"] .card__view{' +
              'filter:brightness(.35) contrast(2) saturate(.3)!important;' +
              'box-shadow:0 0 38px rgba(0,0,0,1), inset 0 0 70px rgba(0,0,0,.95)!important;}' +
              '.horror-page[data-horror-theme="abyss"] .card__title{color:#4a6a8a!important;text-shadow:0 0 22px rgba(20,40,80,.85);opacity:.85;}' +
              '.horror-page[data-horror-theme="abyss"] .card__view::after{' +
              'content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;z-index:3;' +
              'background:radial-gradient(ellipse at 50% 50%,transparent 8%,rgba(0,0,0,.96) 90%);}'
        }
    ];

    /* ============================================================
     *  ЧАСТЬ 3. ОВЕРЛЕЙ-ЭФФЕКТЫ (шум / CRT / VHS / хрома / виньетка / flicker / пыль)
     *  Все эффекты рендерятся в .horror-fx-layer, который виден
     *  только когда на body есть .horror-page + data-horror-fx содержит нужный токен
     * ============================================================ */
    var ALL_FX_TOKENS = 'noise scanline vhs chroma vignette flicker dust';
    var CARD_FX_TOKENS = 'shake wobble pulse flicker';

    function injectStyles() {
        if (document.getElementById('horror-unified-styles')) return;
        var style = document.createElement('style');
        style.id = 'horror-unified-styles';
        style.textContent = [
            /* ---------- Панель фильтров раздела ---------- */
            '.horror-filters{display:flex;align-items:center;gap:.5em;flex-wrap:wrap;',
            'padding:.6em .8em;margin:0 0 1em 0;background:rgba(0,0,0,.35);border-radius:1.2em;',
            'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);',
            'border:1px solid rgba(255,255,255,.06);position:relative;z-index:2}',
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

            /* ---------- Overlay-слой эффектов ---------- */
            '.horror-fx-layer{position:fixed;inset:0;pointer-events:none;display:none;z-index:120;overflow:hidden}',
            'body.horror-page .horror-fx-layer{display:block}',
            '.horror-fx-layer > *{position:absolute;inset:0;pointer-events:none}',

            /* Canvas шум */
            '.horror-fx-canvas{width:100%;height:100%;display:none;image-rendering:pixelated;mix-blend-mode:screen;opacity:.55}',
            'body.horror-page[data-horror-fx~="noise"] .horror-fx-canvas{display:block}',

            /* CRT-развёртка */
            '.horror-fx-scanlines{display:none;opacity:.55;',
            'background:repeating-linear-gradient(0deg,rgba(0,0,0,.35) 0px,rgba(0,0,0,.35) 1px,transparent 1px,transparent 3px)}',
            'body.horror-page[data-horror-fx~="scanline"] .horror-fx-scanlines{display:block;animation:hfx-scanmove 8s linear infinite}',
            '@keyframes hfx-scanmove{0%{background-position:0 0}100%{background-position:0 12px}}',

            /* VHS-полосы */
            '.horror-fx-vhs{display:none;opacity:.5;',
            'background:linear-gradient(180deg,transparent 0,transparent 40%,rgba(255,255,255,.06) 50%,transparent 60%,transparent 100%);',
            'mix-blend-mode:overlay}',
            'body.horror-page[data-horror-fx~="vhs"] .horror-fx-vhs{display:block;animation:hfx-vhs 3.5s linear infinite}',
            '@keyframes hfx-vhs{0%{transform:translateY(-100%);}100%{transform:translateY(100%);}}',
            '.horror-fx-vhs::before{content:"";position:absolute;left:0;right:0;height:8px;top:20%;',
            'background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);',
            'animation:hfx-vhsband 5s linear infinite}',
            '@keyframes hfx-vhsband{0%{top:0}100%{top:100%}}',

            /* Хроматическая аберрация */
            '.horror-fx-chroma{display:none;mix-blend-mode:screen;opacity:.35}',
            'body.horror-page[data-horror-fx~="chroma"] .horror-fx-chroma{display:block;',
            'background:linear-gradient(90deg,rgba(255,0,0,.15) 0,transparent 3%,transparent 97%,rgba(0,255,255,.15) 100%);',
            'animation:hfx-chroma 4s ease-in-out infinite}',
            '@keyframes hfx-chroma{0%,100%{transform:translateX(0)}50%{transform:translateX(2px)}}',

            /* Виньетка */
            '.horror-fx-vignette{display:none;',
            'background:radial-gradient(ellipse at center,transparent 35%,rgba(0,0,0,.55) 85%,rgba(0,0,0,.85) 100%)}',
            'body.horror-page[data-horror-fx~="vignette"] .horror-fx-vignette{display:block}',

            /* Мерцание */
            '.horror-fx-flicker{display:none;background:#fff;mix-blend-mode:overlay}',
            'body.horror-page[data-horror-fx~="flicker"] .horror-fx-flicker{display:block;animation:hfx-flick 6s steps(1) infinite}',
            '@keyframes hfx-flick{0%,98%,100%{opacity:0}98.5%{opacity:.12}99%{opacity:0}99.3%{opacity:.08}}',

            /* Пыль */
            '.horror-fx-dust{display:none;mix-blend-mode:screen}',
            'body.horror-page[data-horror-fx~="dust"] .horror-fx-dust{display:block}',
            '.horror-fx-dust::before, .horror-fx-dust::after{content:"";position:absolute;inset:-20%;',
            'background-image:radial-gradient(circle,rgba(255,255,255,.7) 1px,transparent 1.5px),radial-gradient(circle,rgba(255,255,255,.4) 1px,transparent 1.5px);',
            'background-size:150px 150px, 250px 250px;background-position:0 0, 50px 70px;opacity:.35;',
            'animation:hfx-dust 40s linear infinite}',
            '.horror-fx-dust::after{background-size:180px 180px, 320px 320px;animation-duration:65s;animation-direction:reverse;opacity:.25}',
            '@keyframes hfx-dust{0%{transform:translate3d(0,0,0)}100%{transform:translate3d(-100px,-100px,0)}}',

            /* Card-level анимации */
            'body.horror-page[data-horror-fx~="shake"] .card__view{animation:hfx-shake 4s ease-in-out infinite}',
            '@keyframes hfx-shake{0%,92%,100%{transform:translateX(0)}93%{transform:translateX(-2px)}94%{transform:translateX(2px)}95%{transform:translateX(-1px)}96%{transform:translateX(0)}}',
            'body.horror-page[data-horror-fx~="wobble"] .card__view{animation:hfx-wobble 8s ease-in-out infinite}',
            '@keyframes hfx-wobble{0%,100%{transform:rotate(0)}25%{transform:rotate(.4deg)}75%{transform:rotate(-.4deg)}}',
            'body.horror-page[data-horror-fx~="pulse"] .card__view{animation:hfx-pulse 3.5s ease-in-out infinite}',
            '@keyframes hfx-pulse{0%,100%{filter:brightness(1)}50%{filter:brightness(1.15)}}'
        ].join('');
        document.head.appendChild(style);

        /* Темы карточек — отдельный <style> (перегенерируем на смене темы) */
        var themesStyle = document.createElement('style');
        themesStyle.id = 'horror-themes-styles';
        themesStyle.textContent = CARD_THEMES.map(function (t) { return t.css; }).join('\n');
        document.head.appendChild(themesStyle);
    }

    /* ---------- Overlay DOM ---------- */
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

    /* ---------- Синхронизация состояния body ---------- */
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
        /* 'all' → разворачиваем в полный набор */
        if (list.split(/\s+/).indexOf('all') !== -1) list = ALL_FX_TOKENS + ' ' + CARD_FX_TOKENS;
        document.body.setAttribute('data-horror-fx', list);
        if (list.split(/\s+/).indexOf('noise') !== -1) startNoise();
        else stopNoise();
    }

    /* ---------- Слежение за активной активностью ---------- */
    function currentComponent() {
        var a = L.Activity.active();
        return a ? a.component : '';
    }
    function syncPageClass() {
        var is_horror = currentComponent() === COMPONENT;
        document.body.classList.toggle('horror-page', is_horror);
        if (is_horror) {
            /* На странице ужасов всегда активны сохранённые настройки */
            var tokens = L.Storage.get('horror_fx', '');
            if (tokens) applyFxAttribute(tokens);
        } else {
            stopNoise();
        }
    }

    /* ============================================================
     *  ЧАСТЬ 4. КОМПОНЕНТ РАЗДЕЛА «УЖАСЫ» + ПАНЕЛЬ ФИЛЬТРОВ
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
        searchBtn.textContent = horror_state.searchQuery ? 'Поиск: ' + horror_state.searchQuery.slice(0, 20) : 'Поиск';
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

    function HorrorComponent(object) {
        injectStyles();
        var activityObj = buildActivityObject();
        Object.keys(activityObj).forEach(function (k) { if (k !== 'component') object[k] = activityObj[k]; });

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
            onNext: function (resolve, reject) { L.Api.list(object, resolve.bind(this), reject.bind(this)); },
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
        var t = setInterval(function () { if (tryAddToMenu() || ++attempts >= 40) clearInterval(t); }, 500);
    }

    /* ============================================================
     *  ЧАСТЬ 5. НАСТРОЙКИ
     * ============================================================ */
    function registerSettings() {
        var themeValues = { none: 'Без темы' };
        CARD_THEMES.forEach(function (t) { themeValues[t.id] = t.name; });

        var fxValues = {
            'none':                'Без эффектов',
            'noise':               'Шум (TV-помехи)',
            'scanline':            'CRT-развёртка',
            'vhs':                 'VHS-искажения',
            'chroma':              'Хроматическая аберрация',
            'vignette':            'Виньетка',
            'flicker':             'Мерцание',
            'dust':                'Пыль в воздухе',
            'all':                 'ВСЁ сразу (жёстко)',
            'shake wobble':        'Дрожание карточек',
            'pulse flicker':       'Пульсация + мерцание',
            'noise scanline vhs':  'TV + VHS комбо',
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
                    else applyFxAttribute('none'); /* стоп таймеров */
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
            /* Компонент раздела */
            if (L.Component && L.Component.add) L.Component.add(COMPONENT, HorrorComponent);
            else console.error('[HorrorUnified] Component.add недоступен');

            /* Стили */
            injectStyles();

            /* Оверлей-слой (создаётся один раз) */
            buildFxLayer();

            /* Настройки */
            registerSettings();

            /* Следим за активностью — включаем/снимаем body.horror-page */
            L.Listener.follow('activity', function (e) {
                if (e.type === 'start' || e.type === 'archive' || e.type === 'destroy') {
                    setTimeout(syncPageClass, 0);
                }
            });

            /* Следим за сменой настроек из других вкладок */
            L.Storage.listener.follow('change', function (e) {
                if (e.name === 'horror_card_theme') applyThemeAttribute(e.value);
                if (e.name === 'horror_fx') {
                    if (document.body.classList.contains('horror-page')) applyFxAttribute(e.value);
                }
            });

            /* Меню-кнопка */
            initMenuButton();

            /* Первичная синхронизация (если ужасы уже открыты или чтобы снять класс) */
            syncPageClass();

            /* Догружаем логотипы студий в фоне */
            loadStudioLogos(function () { console.log('[HorrorUnified] Логотипы студий загружены'); });

            /* Пользователю сразу видно, что плагин жив */
            if (L.Noty && L.Noty.show) {
                L.Noty.show('Хоррор v' + VERSION + ' загружен. Тема и эффекты — в «Настройки → Хоррор».',
                            { time: 5000 });
            }

            console.log('[HorrorUnified] Готов. Тем:', CARD_THEMES.length,
                        '| Эффектов-оверлеев:', ALL_FX_TOKENS.split(' ').length);
        } catch (e) {
            console.error('[HorrorUnified] Boot error:', e);
        }
    }

    if (window.appready) boot();
    else L.Listener.follow('app', function (e) { if (e.type === 'ready') boot(); });
})();
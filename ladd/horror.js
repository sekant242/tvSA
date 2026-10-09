/* ============================================================
 *  HORROR UNIFIED v4.0 for Lampa 3.3.x
 *
 *  Единый плагин для раздела «Ужасы»:
 *    1. Кнопка «Испугай меня» (случайный страшный фильм)
 *    2. Ряд «Рекомендуем посмотреть»
 *    3. Ряд «Новые ужасы»
 *    4. Ряд «Подборки» (тематические коллекции)
 *    5. Сетка отфильтрованных фильмов
 *    6. Расширенные фильтры (жанр / язык / поджанр / студия / поиск)
 *    7. Темы карточек — только на странице «Ужасы»
 *    8. Оверлей-эффекты (шум, CRT, VHS, хрома, виньетка, мерцание, пыль)
 *       — только на странице «Ужасы»
 *
 *  Настройки: «Настройки → Хоррор»
 * ============================================================ */
(function () {
    'use strict';

    if (window.__horror_unified__) return;
    window.__horror_unified__ = true;

    if (!window.Lampa) { console.error('[HorrorUnified] Lampa не найдена'); return; }

    var L = window.Lampa;
    var VERSION = '4.0.0';
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
     *  ДАННЫЕ ФИЛЬТРОВ
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
        { title: 'Найденная плёнка',    keywords: '158718',         cover_hint: 'The Blair Witch Project' },
        { title: 'Демоны и экзорцизм',  keywords: '10427|162403',   cover_hint: 'The Exorcist' },
        { title: 'Зомби-апокалипсис',   keywords: '12377',          cover_hint: 'Train to Busan' },
        { title: 'Дом с привидениями',  keywords: '288394|10541',   cover_hint: 'The Conjuring' },
        { title: 'Психопаты и маньяки', keywords: '11477|10714',    cover_hint: 'The Silence of the Lambs' },
        { title: 'Космический ужас',    keywords: '9951',           cover_hint: 'Alien' },
        { title: 'Ведьмы и оккультизм', keywords: '9755|6152',      cover_hint: 'The Witch' },
        { title: 'Слэшеры',             keywords: '234452',         cover_hint: 'Halloween' }
    ];

    /* ============================================================
     *  СОСТОЯНИЕ
     * ============================================================ */
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
     *  СТИЛИ
     * ============================================================ */
    function injectStyles() {
        if (document.getElementById('horror-unified-styles')) return;
        var style = document.createElement('style');
        style.id = 'horror-unified-styles';
        style.textContent = [
            /* ===== Top section grid item ===== */
            '.horror-top-section{grid-column:1 / -1;width:100%;box-sizing:border-box;padding:0 0 1em 0;position:relative;z-index:1}',

            /* ===== Filters bar ===== */
            '.horror-filters{display:flex;align-items:center;gap:.5em;flex-wrap:wrap;',
            'padding:.6em .8em;margin:0 0 1em 0;background:rgba(0,0,0,.35);border-radius:1.2em;',
            'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);',
            'border:1px solid rgba(255,255,255,.06)}',
            '.horror-filter-btn{padding:.5em 1.05em;background:rgba(255,255,255,.08);border-radius:2em;',
            'font-size:.92em;color:#fff;transition:background .15s;white-space:nowrap;',
            'border:1px solid rgba(255,255,255,.1);cursor:pointer;display:flex;align-items:center;gap:.4em}',
            '.horror-filter-btn:hover{background:rgba(255,255,255,.16)}',
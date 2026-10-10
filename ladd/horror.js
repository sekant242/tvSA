/* ============================================================
 *  HORROR UNIFIED v4.5 for Lampa 3.3.x
 *
 *  ИСПРАВЛЕНИЯ v4.5 (относительно v4.4):
 *   - Автоадаптация под ТВ: тяжёлые эффекты отключаются на слабых
 *     устройствах (шум, VHS, chroma, dust, flicker, blur)
 *   - canvas-шум на ТВ идёт на 12 fps вместо 20 и в разрешении /4
 *   - убраны backdrop-filter и gradient-анимация кнопки на ТВ
 *   - уменьшены и упрощены CSS ::after у тем (убраны blur)
 *   - автофокус на кнопке «Испугай меня» при входе в раздел
 * ============================================================ */
(function () {
    'use strict';

    if (window.__horror_unified__) return;
    window.__horror_unified__ = true;

    if (!window.Lampa) { console.error('[HorrorUnified] Lampa не найдена'); return; }

    var L = window.Lampa;
    var Modal = L.Modal;
    var VERSION = '4.5.0';
    var COMPONENT = 'horror';
    var TITLE = 'Ужасы';
    var DEFAULT_GENRE = '27|53';

    /* ============================================================
     *  АВТОАДАПТАЦИЯ ПОД УСТРОЙСТВО
     * ============================================================ */
    var IS_TV     = !!(L.Platform && L.Platform.screen && L.Platform.screen('tv'));
    var IS_MOBILE = !!(L.Platform && L.Platform.screen && L.Platform.screen('mobile'));
    var CHROME_V  = (L.Platform && typeof L.Platform.chromeVersion === 'function') ? L.Platform.chromeVersion() : 0;
    // "Слабое" устройство — ТВ со старым chrome (< 60) или явный orsay/netcast
    var IS_SLOW   = IS_TV && (
        CHROME_V < 60 ||
        (L.Platform && (L.Platform.is('orsay') || L.Platform.is('netcast')))
    );
    // На ТВ по умолчанию разрешаем только лёгкие эффекты
    var TV_SAFE_FX = ['vignette', 'scanline'];
    var TV_SAFE_CARD_FX = []; // анимации card__view на ТВ очень тормозят — выключаем
    var NOISE_FPS = IS_SLOW ? 8 : (IS_TV ? 12 : 20);
    var NOISE_DIV = IS_SLOW ? 4 : (IS_TV ? 4 : 3);

    function onActivate(el, handler) {
        el.addEventListener('click', handler);
        el.addEventListener('hover:enter', handler);
    }

    /* ============================================================
     *  КУРАТОРСКИЙ СПИСОК — 100 САМЫХ СТРАШНЫХ ФИЛЬМОВ
     * ============================================================ */
    var HORROR_MOVIES = [
        { title: 'The Exorcist',              year: 1973 },
        { title: 'The Texas Chain Saw Massacre', year: 1974 },
        { title: 'Psycho',                    year: 1960 },
        { title: 'Jaws',                      year: 1975 },
        { title: 'Rosemary\'s Baby',          year: 1968 },
        { title: 'Night of the Living Dead',  year: 1968 },
        { title: 'Alien',                     year: 1979 },
        { title: 'The Thing',                 year: 1982 },
        { title: 'The Shining',               year: 1980 },
        { title: 'The Silence of the Lambs',  year: 1991 },
        { title: 'Audition',                  year: 1999 },
        { title: 'The Ring',                  year: 2002 },
        { title: 'The Grudge',                year: 2004 },
        { title: 'The Blair Witch Project',   year: 1999 },
        { title: 'Hereditary',                year: 2018 },
        { title: 'Midsommar',                 year: 2019 },
        { title: 'The Witch',                 year: 2015 },
        { title: 'The Babadook',              year: 2014 },
        { title: 'It Follows',                year: 2014 },
        { title: 'Get Out',                   year: 2017 },
        { title: 'Sinister',                  year: 2012 },
        { title: 'Insidious',                 year: 2010 },
        { title: 'The Conjuring',             year: 2013 },
        { title: 'The Conjuring 2',           year: 2016 },
        { title: 'Paranormal Activity',       year: 2007 },
        { title: 'REC',                       year: 2007 },
        { title: 'Quarantine',                year: 2008 },
        { title: 'The Descent',               year: 2005 },
        { title: 'Lake Mungo',                year: 2008 },
        { title: 'Martyrs',                   year: 2008 },
        { title: 'Inside',                    year: 2007 },
        { title: 'Eden Lake',                 year: 2008 },
        { title: 'Funny Games',               year: 1997 },
        { title: 'The Strangers',             year: 2008 },
        { title: 'Green Room',                year: 2015 },
        { title: 'Don\'t Breathe',            year: 2016 },
        { title: 'The Autopsy of Jane Doe',   year: 2016 },
        { title: 'As Above, So Below',        year: 2014 },
        { title: 'Event Horizon',             year: 1997 },
        { title: 'Jacob\'s Ladder',           year: 1990 },
        { title: 'The Mist',                  year: 2007 },
        { title: 'Requiem for a Dream',       year: 2000 },
        { title: 'Threads',                   year: 1984 },
        { title: 'A Serbian Film',            year: 2010 },
        { title: 'Salò, or the 120 Days of Sodom', year: 1975 },
        { title: 'Cannibal Holocaust',        year: 1980 },
        { title: 'The Human Centipede',       year: 2009 },
        { title: 'I Spit on Your Grave',      year: 1978 },
        { title: 'The Last House on the Left', year: 1972 },
        { title: 'The Hills Have Eyes',       year: 2006 },
        { title: 'Wolf Creek',                year: 2005 },
        { title: 'The Loved Ones',            year: 2009 },
        { title: 'The Collector',             year: 2009 },
        { title: 'Hellraiser',                year: 1987 },
        { title: 'Candyman',                  year: 1992 },
        { title: 'A Nightmare on Elm Street', year: 1984 },
        { title: 'Halloween',                 year: 1978 },
        { title: 'Friday the 13th',           year: 1980 },
        { title: 'Scream',                    year: 1996 },
        { title: 'The Omen',                  year: 1976 },
        { title: 'Carrie',                    year: 1976 },
        { title: 'Poltergeist',               year: 1982 },
        { title: 'The Changeling',            year: 1980 },
        { title: 'The Entity',                year: 1982 },
        { title: 'Ghostwatch',                year: 1992 },
        { title: 'Noroi: The Curse',          year: 2005 },
        { title: 'Pulse',                     year: 2001 },
        { title: 'Dark Water',                year: 2002 },
        { title: 'The Orphanage',             year: 2007 },
        { title: 'The Others',                year: 2001 },
        { title: 'The Devil\'s Backbone',     year: 2001 },
        { title: 'Pan\'s Labyrinth',          year: 2006 },
        { title: 'Let the Right One In',      year: 2008 },
        { title: 'Train to Busan',            year: 2016 },
        { title: 'The Wailing',               year: 2016 },
        { title: 'I Saw the Devil',           year: 2010 },
        { title: 'Oldboy',                    year: 2003 },
        { title: 'The Chaser',                year: 2008 },
        { title: 'Bedevilled',                year: 2010 },
        { title: 'The Yellow Sea',            year: 2010 },
        { title: 'Hush',                      year: 2016 },
        { title: 'You\'re Next',              year: 2011 },
        { title: 'The Invitation',            year: 2015 },
        { title: 'Coherence',                 year: 2013 },
        { title: 'The Endless',               year: 2017 },
        { title: 'Resolution',                year: 2012 },
        { title: 'The Void',                  year: 2016 },
        { title: 'Baskin',                    year: 2015 },
        { title: 'The House of the Devil',    year: 2009 },
        { title: 'The Innkeepers',            year: 2011 },
        { title: 'Session 9',                 year: 2001 },
        { title: 'Grave Encounters',          year: 2011 },
        { title: 'The Poughkeepsie Tapes',    year: 2007 },
        { title: 'Henry: Portrait of a Serial Killer', year: 1986 },
        { title: 'Man Bites Dog',             year: 1992 },
        { title: 'Cure',                      year: 1997 },
        { title: 'Kairo',                     year: 2001 },
        { title: 'Ju-on: The Grudge',         year: 2002 },
        { title: 'Ringu',                     year: 1998 },
        { title: 'Dark Water',                year: 2002 },
        { title: 'The Eye',                   year: 2002 }
    ];

    /* ============================================================
     *  ХЕЛПЕРЫ
     * ============================================================ */
    function shuffleArray(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    /* ============================================================
     *  TMDB
     * ============================================================ */
    function tmdbUrl(path_query) {
        var lang = L.Storage.field('tmdb_lang') || 'ru';
        var sep = path_query.indexOf('?') >= 0 ? '&' : '?';
        return L.TMDB.api(path_query + sep + 'api_key=' + L.TMDB.key() + '&language=' + lang);
    }
    function tmdbRequest(path_query, success, error) {
        L.Network.silent(tmdbUrl(path_query), success, error || function () {}, false, { timeout: 15000 });
    }

    /* ============================================================
     *  «ИСПУГАЙ МЕНЯ»
     * ============================================================ */
    var frighten_running = false;
    var frighten_controller_name = null;

    function showFrightenLoadingModal() {
        var html = $(
            '<div class="hfm" style="flex-direction:column;align-items:center;justify-content:center">' +
              '<div class="hfm__loading">' +
                '<div class="hfm__loading-spinner"></div>' +
                '<div>Ищу что-нибудь страшное...</div>' +
              '</div>' +
            '</div>'
        );
        Modal.open({
            title: '💀 Ищу...',
            html: html,
            size: 'medium',
            onBack: function () {
                Modal.close();
                if (frighten_controller_name) L.Controller.toggle(frighten_controller_name);
            }
        });
    }

    function searchMovieInTMDB(entry, onSuccess, onError) {
        var q = 'search/movie?query=' + encodeURIComponent(entry.title) + '&year=' + entry.year;
        tmdbRequest(q, function (data) {
            if (data && data.results && data.results.length) {
                var found = data.results[0];
                for (var i = 0; i < data.results.length; i++) {
                    var r = data.results[i];
                    var rYear = (r.release_date || '').slice(0, 4);
                    if (parseInt(rYear) === entry.year) { found = r; break; }
                }
                onSuccess(found);
            } else {
                onError();
            }
        }, onError);
    }

    function tryFrightenQueue(queue, index, onSuccess) {
        if (index >= queue.length) return onSuccess(null);
        searchMovieInTMDB(queue[index], function (movie) {
            if (movie && movie.id) onSuccess(movie);
            else tryFrightenQueue(queue, index + 1, onSuccess);
        }, function () {
            tryFrightenQueue(queue, index + 1, onSuccess);
        });
    }

    function buildFrightenHtml(card) {
        var poster_src = card.poster_path
            ? L.TMDB.image('t/p/w400' + card.poster_path)
            : (card.img || './img/img_broken.svg');
        var title = (card.title || card.name || 'Без названия')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        var year  = ((card.release_date || '') + '').slice(0, 4) || '----';
        var vote  = card.vote_average ? parseFloat(card.vote_average).toFixed(1) : '—';
        var overview = (card.overview || '').trim();
        var overview_html = overview
            ? '<div class="hfm__overview">' + overview.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</div>'
            : '<div class="hfm__overview" style="opacity:.55">Описание отсутствует</div>';

        return $(
            '<div class="hfm">' +
              '<div class="hfm__poster">' +
                '<img src="' + poster_src + '" onerror="this.src=\'./img/img_broken.svg\'">' +
              '</div>' +
              '<div class="hfm__body">' +
                '<div class="hfm__title">' + title + '</div>' +
                '<div class="hfm__meta">' +
                  '<span>📅 <b>' + year + '</b></span>' +
                  '<span>★ <b>' + vote + '</b></span>' +
                  '<span>🔞 <b>18+</b></span>' +
                '</div>' +
                overview_html +
              '</div>' +
            '</div>'
        );
    }

    function frightenMe() {
        if (frighten_running) return;
        frighten_running = true;

        frighten_controller_name = L.Controller.enabled().name;
        showFrightenLoadingModal();

        var queue = shuffleArray(HORROR_MOVIES);

        tryFrightenQueue(queue, 0, function (movie) {
            frighten_running = false;

            if (!movie) {
                Modal.close();
                if (frighten_controller_name) L.Controller.toggle(frighten_controller_name);
                L.Noty.show('Не удалось найти фильм. Попробуйте ещё раз.', { time: 4000 });
                return;
            }

            Modal.close();
            Modal.open({
                title: '💀 Тебе попался...',
                html: buildFrightenHtml(movie),
                size: 'medium',
                buttons: [
                    { name: '🎲 Ещё раз', onSelect: function () {
                        Modal.close();
                        setTimeout(frightenMe, 200);
                    }},
                    { name: '🎬 Смотреть', onSelect: function () {
                        Modal.close();
                        L.Activity.push({
                            url: '', component: 'full', id: movie.id,
                            method: 'movie', card: movie, source: 'tmdb'
                        });
                    }},
                    { name: 'Закрыть', onSelect: function () {
                        Modal.close();
                        if (frighten_controller_name) L.Controller.toggle(frighten_controller_name);
                    }}
                ],
                onBack: function () {
                    Modal.close();
                    if (frighten_controller_name) L.Controller.toggle(frighten_controller_name);
                }
            });
        });
    }

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
            tmdbRequest('company/' + id, function (data) {
                studioLogosCache[id] = data && data.logo_path ? L.TMDB.image('t/p/w200' + data.logo_path) : null;
                if (--pending === 0) cb && cb();
            }, function () {
                studioLogosCache[id] = null;
                if (--pending === 0) cb && cb();
            });
        });
    }

    /* ============================================================
     *  СТИЛИ (с учётом ТВ)
     * ============================================================ */
    function injectStyles() {
        if (document.getElementById('horror-unified-styles')) return;
        var style = document.createElement('style');
        style.id = 'horror-unified-styles';

        var css_parts = [];

        // Стили фильтр-панели — без backdrop-filter на ТВ
        if (IS_TV) {
            css_parts.push(
                '.horror-top-section{grid-column:1 / -1;width:100%;box-sizing:border-box;padding:0 0 1em 0;position:relative}',
                '.horror-filters{display:flex;align-items:center;gap:.4em;flex-wrap:wrap;',
                'padding:.5em .7em;margin:0 0 .8em 0;background:rgba(0,0,0,.55);border-radius:.8em;',
                'border:1px solid rgba(255,255,255,.08)}',
                '.horror-filter-btn{padding:.55em 1.1em;background:rgba(255,255,255,.08);border-radius:2em;',
                'font-size:.95em;color:#fff;white-space:nowrap;',
                'border:2px solid rgba(255,255,255,.1);cursor:pointer;display:flex;align-items:center;gap:.4em}',
                '.horror-filter-btn.focus{background:#fff;color:#000;border-color:#fff;',
                'box-shadow:0 0 0 .15em rgba(255,255,255,.5), 0 0 1.2em rgba(255,255,255,.5)}',
                '.horror-filter-reset{background:rgba(220,60,60,.25);border-color:rgba(220,60,60,.4)}',
                '.horror-filter-reset.focus{background:#dc3c3c;color:#fff;border-color:#fff}',
                '.horror-filter-count{opacity:.75;margin-left:.4em;font-size:.85em}',
                '.horror-filter-logo{height:1.4em;width:auto;max-width:5em;object-fit:contain;vertical-align:middle;filter:brightness(0) invert(1)}'
            );
        } else {
            css_parts.push(
                '.horror-top-section{grid-column:1 / -1;width:100%;box-sizing:border-box;padding:0 0 1.2em 0;position:relative;z-index:1}',
                '.horror-filters{display:flex;align-items:center;gap:.5em;flex-wrap:wrap;',
                'padding:.6em .8em;margin:0 0 1em 0;background:rgba(0,0,0,.35);border-radius:1.2em;',
                'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);',
                'border:1px solid rgba(255,255,255,.06)}',
                '.horror-filter-btn{padding:.5em 1.05em;background:rgba(255,255,255,.08);border-radius:2em;',
                'font-size:.92em;color:#fff;transition:background .15s;white-space:nowrap;',
                'border:1px solid rgba(255,255,255,.1);cursor:pointer;display:flex;align-items:center;gap:.4em}',
                '.horror-filter-btn:hover{background:rgba(255,255,255,.16)}',
                '.horror-filter-btn.focus{background:#fff;color:#000}',
                '.horror-filter-reset{background:rgba(220,60,60,.25);border-color:rgba(220,60,60,.4)}',
                '.horror-filter-reset.focus{background:#dc3c3c;color:#fff}',
                '.horror-filter-count{opacity:.65;margin-left:.4em;font-size:.85em}',
                '.horror-filter-logo{height:1.4em;width:auto;max-width:5em;object-fit:contain;vertical-align:middle;filter:brightness(0) invert(1)}'
            );
        }

        css_parts.push(
            '.horror-studio-item .selectbox-item__icon img{height:1.6em;width:auto;max-width:6em;object-fit:contain}',
            '.horror-studio-item .selectbox-item__icon{background:transparent!important;padding:.2em}'
        );

        // Кнопка «Испугай меня» — на ТВ без gradient-анимации
        if (IS_TV) {
            css_parts.push(
                '.horror-frighten-btn{display:flex;align-items:center;justify-content:center;gap:.9em;',
                'padding:1em 1.8em;margin:0 0 1.2em 0;',
                'background:#8b0000;border-radius:.8em;color:#fff;',
                'font-size:1.1em;font-weight:600;cursor:pointer;',
                'border:2px solid rgba(255,60,60,.5);',
                'text-shadow:0 0 6px rgba(0,0,0,.9);',
                'transition:background .2s;user-select:none}',
                '.horror-frighten-btn.focus{background:#dc143c;border-color:#fff;',
                'box-shadow:0 0 1.2em rgba(255,40,60,.9)}',
                '.horror-frighten-btn svg{width:1.4em;height:1.4em;flex-shrink:0}',
                '.horror-frighten-btn.loading{opacity:.6;pointer-events:none}'
            );
        } else {
            css_parts.push(
                '.horror-frighten-btn{display:flex;align-items:center;justify-content:center;gap:1em;',
                'padding:1.15em 2em;margin:0 0 1.5em 0;',
                'background:linear-gradient(135deg,#4a0000 0%,#8b0000 25%,#dc143c 50%,#8b0000 75%,#4a0000 100%);',
                'background-size:300% 300%;border-radius:1em;color:#fff;',
                'font-size:1.15em;font-weight:600;cursor:pointer;',
                'border:2px solid rgba(255,60,60,.4);',
                'text-shadow:0 0 12px rgba(255,100,100,.9), 0 0 4px rgba(0,0,0,.8);',
                'animation:hfx-frighten-pulse 3s ease-in-out infinite, hfx-frighten-gradient 10s ease infinite;',
                'transition:transform .15s, box-shadow .15s;user-select:none}',
                '.horror-frighten-btn:hover,.horror-frighten-btn.focus{',
                'transform:scale(1.02);',
                'box-shadow:0 0 60px rgba(255,30,60,.9), inset 0 0 30px rgba(255,100,100,.3)!important}',
                '.horror-frighten-btn svg{width:1.6em;height:1.6em;flex-shrink:0;filter:drop-shadow(0 0 6px rgba(255,100,100,.8))}',
                '.horror-frighten-btn span{letter-spacing:.02em}',
                '.horror-frighten-btn.loading{opacity:.6;pointer-events:none;filter:grayscale(.5)}',
                '@keyframes hfx-frighten-pulse{',
                '0%,100%{box-shadow:0 0 30px rgba(220,20,60,.35), inset 0 0 20px rgba(0,0,0,.3)}',
                '50%{box-shadow:0 0 55px rgba(255,30,60,.75), inset 0 0 30px rgba(255,50,50,.25)}}',
                '@keyframes hfx-frighten-gradient{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}'
            );
        }

        css_parts.push(
            '.horror-rows{width:100%}',
            '.horror-row-slot{width:100%}',
            '.horror-row-slot .items-line{padding:0;margin:0 0 1.2em 0}',

            '.hfm{display:flex;gap:1.2em;padding:0 0 .5em 0;min-height:200px}',
            '.hfm__poster{flex:0 0 220px;max-width:220px}',
            '.hfm__poster img{width:100%;border-radius:.6em;box-shadow:0 0 30px rgba(180,0,0,.5)}',
            '.hfm__body{flex:1;min-width:0}',
            '.hfm__title{font-size:1.4em;font-weight:600;margin-bottom:.4em;line-height:1.2}',
            '.hfm__meta{opacity:.75;margin-bottom:1em;font-size:.92em;display:flex;gap:.8em;flex-wrap:wrap}',
            '.hfm__meta b{color:#ff6b6b;font-weight:600}',
            '.hfm__overview{line-height:1.55;font-size:.95em;max-height:230px;overflow-y:auto;padding-right:.3em}',
            '.hfm__loading{display:flex;align-items:center;justify-content:center;min-height:260px;color:#999;font-size:1.1em;flex-direction:column;gap:1em;width:100%}',
            '.hfm__loading-spinner{width:3em;height:3em;border:3px solid rgba(255,255,255,.15);',
            'border-top-color:#dc143c;border-radius:50%;animation:hfm-spin 1s linear infinite}',
            '@keyframes hfm-spin{to{transform:rotate(360deg)}}'
        );

        // Слой эффектов и сами эффекты
        css_parts.push(
            '.horror-fx-layer{position:fixed;inset:0;pointer-events:none;display:none;z-index:90;overflow:hidden}',
            'body.horror-page .horror-fx-layer{display:block}',
            '.horror-fx-layer > *{position:absolute;inset:0;pointer-events:none}'
        );

        // Только лёгкие эффекты, работающие на ТВ
        css_parts.push(
            '.horror-fx-scanlines{display:none;opacity:.4;',
            'background:repeating-linear-gradient(0deg,rgba(0,0,0,.35) 0px,rgba(0,0,0,.35) 1px,transparent 1px,transparent 3px)}',
            'body.horror-page[data-horror-fx~="scanline"] .horror-fx-scanlines{display:block}',
            '.horror-fx-vignette{display:none;',
            'background:radial-gradient(ellipse at center,transparent 35%,rgba(0,0,0,.55) 85%,rgba(0,0,0,.85) 100%)}',
            'body.horror-page[data-horror-fx~="vignette"] .horror-fx-vignette{display:block}'
        );

        // Тяжёлые эффекты — только на не-ТВ
        if (!IS_TV) {
            css_parts.push(
                '.horror-fx-canvas{width:100%;height:100%;display:none;image-rendering:pixelated;mix-blend-mode:screen;opacity:.5}',
                'body.horror-page[data-horror-fx~="noise"] .horror-fx-canvas{display:block}',
                '.horror-fx-vhs{display:none;opacity:.5;',
                'background:linear-gradient(180deg,transparent 0,transparent 40%,rgba(255,255,255,.06) 50%,transparent 60%,transparent 100%);',
                'mix-blend-mode:overlay}',
                'body.horror-page[data-horror-fx~="vhs"] .horror-fx-vhs{display:block;animation:hfx-vhs 3.5s linear infinite}',
                '@keyframes hfx-vhs{0%{transform:translateY(-100%)}100%{transform:translateY(100%)}}',
                '.horror-fx-chroma{display:none;mix-blend-mode:screen;opacity:.35}',
                'body.horror-page[data-horror-fx~="chroma"] .horror-fx-chroma{display:block;',
                'background:linear-gradient(90deg,rgba(255,0,0,.15) 0,transparent 3%,transparent 97%,rgba(0,255,255,.15) 100%)}',
                '.horror-fx-flicker{display:none;background:#fff;mix-blend-mode:overlay}',
                'body.horror-page[data-horror-fx~="flicker"] .horror-fx-flicker{display:block;animation:hfx-flick 6s steps(1) infinite}',
                '@keyframes hfx-flick{0%,98%,100%{opacity:0}98.5%{opacity:.12}99%{opacity:0}99.3%{opacity:.08}}',
                '.horror-fx-dust{display:none;mix-blend-mode:screen}',
                'body.horror-page[data-horror-fx~="dust"] .horror-fx-dust{display:block}',
                '.horror-fx-dust::before,.horror-fx-dust::after{content:"";position:absolute;inset:-20%;',
                'background-image:radial-gradient(circle,rgba(255,255,255,.7) 1px,transparent 1.5px);',
                'background-size:150px 150px;opacity:.35;',
                'animation:hfx-dust 40s linear infinite}',
                '@keyframes hfx-dust{0%{transform:translate3d(0,0,0)}100%{transform:translate3d(-100px,-100px,0)}}'
            );
        } else {
            css_parts.push(
                '.horror-fx-canvas,.horror-fx-vhs,.horror-fx-chroma,.horror-fx-flicker,.horror-fx-dust{display:none!important}'
            );
        }

        style.textContent = css_parts.join('');
        document.head.appendChild(style);
    }

    /* ============================================================
     *  ТЕМЫ КАРТОЧЕК (без blur на ТВ)
     * ============================================================ */
    function buildThemesCss() {
        var themes = [];

        themes.push(
            '.horror-page[data-horror-theme="blood_moon"] .card__view{filter:sepia(.35) contrast(1.6) brightness(.7) hue-rotate(-20deg)!important;box-shadow:0 0 20px rgba(180,0,0,.75)!important}',
            '.horror-page[data-horror-theme="blood_moon"] .card__title{color:#ff3b3b!important;text-shadow:0 0 8px rgba(255,0,0,.9)}',
            '.horror-page[data-horror-theme="blood_moon"] .card__age{color:#ff6b6b!important}'
        );
        if (!IS_TV) {
            themes.push('.horror-page[data-horror-theme="blood_moon"] .card__view::after{content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;z-index:3;background:radial-gradient(circle at 30% 40%,transparent 55%,rgba(80,0,0,.65) 100%)}');
        }

        themes.push(
            '.horror-page[data-horror-theme="bone_chill"] .card__view{filter:contrast(1.4) saturate(.25) brightness(.85) hue-rotate(180deg)!important;box-shadow:0 0 18px rgba(200,230,255,.55)!important}',
            '.horror-page[data-horror-theme="bone_chill"] .card__title{color:#c8e4ff!important;text-shadow:0 0 10px rgba(160,210,255,.9);letter-spacing:.05em}'
        );

        themes.push(
            '.horror-page[data-horror-theme="cursed_sigil"] .card__view{filter:contrast(1.35) hue-rotate(270deg) brightness(.6)!important;box-shadow:0 0 24px rgba(140,0,200,.85)!important}',
            '.horror-page[data-horror-theme="cursed_sigil"] .card__title{color:#d48aff!important;text-shadow:0 0 12px rgba(180,0,255,.95)}'
        );

        themes.push(
            '.horror-page[data-horror-theme="asylum"] .card__view{filter:grayscale(.85) contrast(1.55) brightness(.55) sepia(.25)!important;box-shadow:0 0 16px rgba(140,120,60,.65)!important}',
            '.horror-page[data-horror-theme="asylum"] .card__title{color:#c4a35a!important;text-shadow:0 0 8px rgba(180,140,40,.75);font-family:Georgia,serif}'
        );

        themes.push(
            '.horror-page[data-horror-theme="veil"] .card__view{filter:brightness(.5) contrast(1.75) saturate(.4)!important;box-shadow:0 0 32px rgba(0,0,0,.95)!important}',
            '.horror-page[data-horror-theme="veil"] .card__title{color:#999!important;text-shadow:0 0 14px rgba(0,0,0,1)}'
        );

        themes.push(
            '.horror-page[data-horror-theme="ritual"] .card__view{filter:contrast(1.55) saturate(1.5) hue-rotate(-40deg) brightness(.65)!important;box-shadow:0 0 26px rgba(255,60,0,.75)!important}',
            '.horror-page[data-horror-theme="ritual"] .card__title{color:#ff7b00!important;text-shadow:0 0 12px rgba(255,80,0,.95)}'
        );

        themes.push(
            '.horror-page[data-horror-theme="flesh"] .card__view{filter:sepia(.65) saturate(1.85) hue-rotate(-10deg) contrast(1.35) brightness(.6)!important;box-shadow:0 0 22px rgba(200,80,60,.75)!important}',
            '.horror-page[data-horror-theme="flesh"] .card__title{color:#e88a7a!important;text-shadow:0 0 10px rgba(200,80,50,.85)}'
        );

        // На ТВ без blur — иначе всё превращается в мыло
        if (IS_TV) {
            themes.push(
                '.horror-page[data-horror-theme="whisper"] .card__view{filter:brightness(.45) contrast(1.85)!important;box-shadow:0 0 28px rgba(60,80,120,.65)!important}'
            );
        } else {
            themes.push(
                '.horror-page[data-horror-theme="whisper"] .card__view{filter:brightness(.45) contrast(1.85) blur(.4px)!important;box-shadow:0 0 28px rgba(60,80,120,.65)!important}'
            );
        }
        themes.push(
            '.horror-page[data-horror-theme="whisper"] .card__title{color:#7a9ec4!important;text-shadow:0 0 16px rgba(60,100,180,.75);font-style:italic}'
        );

        themes.push(
            '.horror-page[data-horror-theme="grave_dirt"] .card__view{filter:grayscale(.9) contrast(1.6) brightness(.5) sepia(.4)!important;box-shadow:0 0 18px rgba(60,50,30,.85)!important}',
            '.horror-page[data-horror-theme="grave_dirt"] .card__title{color:#8a7a5a!important;text-shadow:0 0 10px rgba(60,50,20,1);font-family:Georgia,serif;letter-spacing:.08em}'
        );

        themes.push(
            '.horror-page[data-horror-theme="abyss"] .card__view{filter:brightness(.35) contrast(2) saturate(.3)!important;box-shadow:0 0 38px rgba(0,0,0,1)!important}',
            '.horror-page[data-horror-theme="abyss"] .card__title{color:#4a6a8a!important;text-shadow:0 0 22px rgba(20,40,80,.85);opacity:.85}'
        );

        return themes.join('\n');
    }

    var CARD_THEMES = [
        { id: 'blood_moon', name: 'Кровавая Луна' },
        { id: 'bone_chill', name: 'Мороз по Коже' },
        { id: 'cursed_sigil', name: 'Проклятый Знак' },
        { id: 'asylum', name: 'Приют' },
        { id: 'veil', name: 'Пелена' },
        { id: 'ritual', name: 'Ритуал' },
        { id: 'flesh', name: 'Плоть' },
        { id: 'whisper', name: 'Шёпот' },
        { id: 'grave_dirt', name: 'Могильная Земля' },
        { id: 'abyss', name: 'Бездна' }
    ];

    function injectThemeStyles() {
        if (document.getElementById('horror-themes-styles')) return;
        var style = document.createElement('style');
        style.id = 'horror-themes-styles';
        style.textContent = buildThemesCss();
        document.head.appendChild(style);
    }

    /* ============================================================
     *  СЛОЙ ЭФФЕКТОВ
     * ============================================================ */
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
        fx_canvas.width  = Math.max(160, Math.floor(window.innerWidth  / NOISE_DIV));
        fx_canvas.height = Math.max(120, Math.floor(window.innerHeight / NOISE_DIV));
    }
    function startNoise() { if (fx_noise_timer || !fx_ctx || IS_TV) return; tickNoise(); } // на ТВ шум не запускаем
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
        fx_noise_timer = setTimeout(tickNoise, 1000 / NOISE_FPS);
    }

    // На ТВ вырезаем всё, что не поддерживается/тормозит — оставляем только рабочие токены
    function sanitizeFxTokens(tokens) {
        var list = (tokens || '').trim();
        if (!list || list === 'none') return '';

        if (list.indexOf('all') !== -1) {
            list = IS_TV ? TV_SAFE_FX.join(' ') : 'noise scanline vhs chroma vignette flicker dust shake wobble pulse flicker';
        }

        var tokens_arr = list.split(/\s+/).filter(Boolean);

        if (IS_TV) {
            // Разрешаем только безопасные
            var allowed = TV_SAFE_FX.concat(TV_SAFE_CARD_FX);
            tokens_arr = tokens_arr.filter(function (t) { return allowed.indexOf(t) !== -1; });
        }

        return tokens_arr.join(' ');
    }

    function applyThemeAttribute(themeId) {
        if (!themeId || themeId === 'none') document.body.removeAttribute('data-horror-theme');
        else document.body.setAttribute('data-horror-theme', themeId);
    }
    function applyFxAttribute(tokens) {
        var clean = sanitizeFxTokens(tokens);
        if (!clean) {
            document.body.removeAttribute('data-horror-fx');
            stopNoise();
            return;
        }
        document.body.setAttribute('data-horror-fx', clean);
        if (!IS_TV && clean.split(/\s+/).indexOf('noise') !== -1) startNoise();
        else stopNoise();
    }
    function syncPageClass() {
        var a = L.Activity.active();
        var is_horror = a && a.component === COMPONENT;
        document.body.classList.toggle('horror-page', is_horror);
        if (is_horror) {
            var t = L.Storage.get('horror_fx', '');
            if (t) applyFxAttribute(t);
        } else {
            stopNoise();
        }
    }

    /* ============================================================
     *  КНОПКА + РЯДЫ
     * ============================================================ */
    function buildFrightenButton() {
        var btn = document.createElement('div');
        btn.className = 'horror-frighten-btn selector';
        btn.innerHTML = ICON_FRIGHTEN + '<span>Испугай меня</span>';
        onActivate(btn, frightenMe);
        return btn;
    }

    var rowsMemoryCache = { recomend: null, fresh: null, collections: null };

    function loadRecommendations(cb) {
        if (rowsMemoryCache.recomend) return cb(rowsMemoryCache.recomend);
        tmdbRequest('discover/movie?with_genres=27&sort_by=vote_average.desc&vote_count.gte=2000&vote_average.gte=7&page=1',
            function (data) {
                var list = (data.results || []).slice(0, 20);
                rowsMemoryCache.recomend = list;
                cb(list);
            }, function () { cb([]); });
    }
    function loadNewReleases(cb) {
        if (rowsMemoryCache.fresh) return cb(rowsMemoryCache.fresh);
        var today = new Date().toISOString().split('T')[0];
        var year_ago = new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString().split('T')[0];
        tmdbRequest('discover/movie?with_genres=27&sort_by=primary_release_date.desc'
            + '&primary_release_date.lte=' + today
            + '&primary_release_date.gte=' + year_ago
            + '&vote_count.gte=30&page=1',
            function (data) {
                var list = (data.results || []).slice(0, 20);
                rowsMemoryCache.fresh = list;
                cb(list);
            }, function () { cb([]); });
    }
    function loadCollections(cb) {
        if (rowsMemoryCache.collections) return cb(rowsMemoryCache.collections);
        var cached = L.Storage.get('horror_collections_cache', {});
        if (!cached || typeof cached !== 'object') cached = {};
        var now = Date.now();
        var TTL = 1000 * 60 * 60 * 24 * 7;
        var result = [];
        var toFetch = [];
        COLLECTIONS.forEach(function (col, i) {
            var key = 'col_' + i;
            if (cached[key] && cached[key].time + TTL > now) {
                result[i] = { id: 'horror_col_' + i, title: col.title, poster_path: cached[key].poster_path, is_horror_collection: true, horror_keywords: col.keywords, overview: (cached[key].count || 0) + ' фильмов' };
            } else { toFetch.push({ idx: i, key: key, col: col }); }
        });
        if (!toFetch.length) {
            var clean = result.filter(Boolean);
            rowsMemoryCache.collections = clean;
            return cb(clean);
        }
        var pending = toFetch.length;
        var done = function () {
            if (--pending > 0) return;
            L.Storage.set('horror_collections_cache', cached);
            var clean = result.filter(Boolean);
            rowsMemoryCache.collections = clean;
            cb(clean);
        };
        toFetch.forEach(function (item) {
            tmdbRequest('discover/movie?with_genres=27&with_keywords=' + item.col.keywords + '&sort_by=vote_average.desc&vote_count.gte=100&page=1',
                function (data) {
                    var first = data.results && data.results[0];
                    if (first) {
                        result[item.idx] = { id: 'horror_col_' + item.idx, title: item.col.title, poster_path: first.poster_path, is_horror_collection: true, horror_keywords: item.col.keywords, overview: (data.total_results || 0) + ' фильмов' };
                        cached[item.key] = { time: now, poster_path: first.poster_path, count: data.total_results || 0 };
                    }
                    done();
                }, done);
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
            url: '', component: 'full',
            id: card_data.id,
            method: card_data.name ? 'tv' : 'movie',
            card: card_data, source: 'tmdb'
        });
    }

    function createRow(title, results, opts) {
        opts = opts || {};
        var data = {
            title: title,
            results: results,
            params: { items: { view: 7, mapping: 'line', align_left: false }, scroll: { horizontal: true, step: 300 } }
        };
        var line = L.Maker.make('Line', data);
        line.use({
            onInstance: function (card, card_data) {
                card.use({
                    onEnter: function () { openCardFromRow(card_data); },
                    onFocus: function () { L.Background.change(L.Utils.cardImgBackground(card_data)); }
                });
            },
            onMore: opts.onMore || function () {}
        });
        try { line.create(); } catch (e) { console.error('[HorrorUnified] Line create error:', e); return null; }
        return line.render(true);
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
        var pending = 3;
        var tryUpdate = function () { if (--pending === 0) { try { L.Layer.update(); } catch (e) {} } };
        loadRecommendations(function (list) {
            if (list.length) { var row = createRow('Рекомендуем посмотреть', list); if (row) slotRec.appendChild(row); } else { slotRec.style.display = 'none'; }
            tryUpdate();
        });
        loadNewReleases(function (list) {
            if (list.length) { var row = createRow('Новые ужасы', list); if (row) slotNew.appendChild(row); } else { slotNew.style.display = 'none'; }
            tryUpdate();
        });
        loadCollections(function (list) {
            if (list.length) { var row = createRow('Подборки', list); if (row) slotCol.appendChild(row); } else { slotCol.style.display = 'none'; }
            tryUpdate();
        });
        return container;
    }

    /* ============================================================
     *  ФИЛЬТРЫ
     * ============================================================ */
    function openGenreFilter(onChange) {
        var items = GENRES.map(function (g) { return { title: g.title, id: g.id, selected: horror_state.genre === g.id }; });
        L.Select.show({
            title: 'Жанр', items: items,
            onSelect: function (i) { horror_state.genre = i.id; L.Controller.toggle('content'); onChange(); },
            onBack: function () { L.Controller.toggle('content'); }
        });
    }
    function openMultiFilter(def, onChange) {
        var selected = horror_state[def.key];
        var changed = false;
        var items = def.items.map(function (item) { var id = item[def.prop]; return { title: item.title, id: id, checkbox: true, checked: selected.indexOf(id) !== -1 }; });
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
            return { title: s.title, id: s.id, selected: horror_state.studio === s.id, thumbnail: logo || null, template: logo ? 'selectbox_icon' : 'selectbox_item' };
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
        L.Input.edit({ title: 'Поиск по названию', value: horror_state.searchQuery, free: true, nosave: true, nomic: true }, function (value) {
            var v = (value || '').trim();
            var changed = v !== horror_state.searchQuery;
            horror_state.searchQuery = v;
            if (prev && prev !== 'settings_component') L.Controller.toggle(prev);
            if (changed) onChange();
        });
    }
    function buildFiltersBar(onChange) {
        var bar = document.createElement('div');
        bar.className = 'horror-filters';
        var genreLabel = 'Жанр';
        if (horror_state.genre !== DEFAULT_GENRE) { var found = GENRES.find(function (g) { return g.id === horror_state.genre; }); if (found) genreLabel = 'Жанр: ' + found.title; }
        var genreBtn = document.createElement('div');
        genreBtn.className = 'horror-filter-btn selector';
        genreBtn.textContent = genreLabel;
        onActivate(genreBtn, function () { openGenreFilter(onChange); });
        bar.appendChild(genreBtn);
        MULTI_FILTERS.forEach(function (def) {
            var count = horror_state[def.key].length;
            var btn = document.createElement('div');
            btn.className = 'horror-filter-btn selector';
            btn.textContent = def.title;
            if (count > 0) { var span = document.createElement('span'); span.className = 'horror-filter-count'; span.textContent = count; btn.appendChild(span); }
            onActivate(btn, function () { openMultiFilter(def, onChange); });
            bar.appendChild(btn);
        });
        var studioBtn = document.createElement('div');
        studioBtn.className = 'horror-filter-btn selector';
        if (horror_state.studio !== null) {
            var s = STUDIOS.find(function (x) { return x.id === horror_state.studio; });
            if (s) {
                var logoUrl = studioLogosCache[s.id];
                if (logoUrl) { var img = document.createElement('img'); img.className = 'horror-filter-logo'; img.src = logoUrl; img.onerror = function () { this.style.display = 'none'; }; studioBtn.appendChild(img); }
                var txt = document.createElement('span'); txt.textContent = s.title; studioBtn.appendChild(txt);
            } else studioBtn.textContent = 'Студия';
        } else studioBtn.textContent = 'Студия';
        onActivate(studioBtn, function () { openStudioFilter(onChange); });
        bar.appendChild(studioBtn);
        var searchBtn = document.createElement('div');
        searchBtn.className = 'horror-filter-btn selector';
        searchBtn.textContent = horror_state.searchQuery ? 'Поиск: ' + horror_state.searchQuery.slice(0, 20) : 'Поиск';
        onActivate(searchBtn, function () { openSearchInput(onChange); });
        bar.appendChild(searchBtn);
        if (hasActiveFilters()) {
            var resetBtn = document.createElement('div');
            resetBtn.className = 'horror-filter-btn horror-filter-reset selector';
            resetBtn.textContent = 'Сбросить';
            onActivate(resetBtn, function () { resetFilters(); onChange(); });
            bar.appendChild(resetBtn);
        }
        return bar;
    }

    /* ============================================================
     *  КОМПОНЕНТ РАЗДЕЛА
     * ============================================================ */
    function HorrorComponent(object) {
        injectStyles();
        var activityObj = buildActivityObject();
        Object.keys(activityObj).forEach(function (k) { if (k !== 'component' && typeof object[k] === 'undefined') object[k] = activityObj[k]; });
        var comp = L.Maker.make('Category', object);
        var topSection = null;
        var frightenBtn = null;

        comp.use({
            onCreate: function () {
                var self = this;
                L.Api.list(object, this.build.bind(this), this.empty.bind(this));
                topSection = document.createElement('div');
                topSection.className = 'horror-top-section';
                topSection.appendChild(buildFiltersBar(function () { L.Activity.replace(buildActivityObject()); }));
                frightenBtn = buildFrightenButton();
                topSection.appendChild(frightenBtn);
                topSection.appendChild(buildRowsContainer());
                var body = (this.body && this.body.nodeType === 1) ? this.body : (this.scroll && this.scroll.body ? this.scroll.body(true) : null);
                if (body && body.nodeType === 1) { if (body.firstChild) body.insertBefore(topSection, body.firstChild); else body.appendChild(topSection); }
                else { console.warn('[HorrorUnified] this.body не найден'); }
                requestAnimationFrame(function () { try { L.Layer.update(self.html); } catch (e) {} });
            },
            onNext: function (resolve, reject) { L.Api.list(object, resolve.bind(this), reject.bind(this)); },
            onInstance: function (item, data) {
                item.use({ onEnter: L.Router.call.bind(L.Router, 'full', data), onFocus: function () { L.Background.change(L.Utils.cardImgBackground(data)); } });
            },
            onEmpty: function () {
                var empty = new L.Empty({ title: 'Ничего не найдено', descr: 'По выбранным фильтрам нет фильмов. Попробуйте изменить условия или сбросить фильтры.' });
                this.empty_class = empty;
                this.scroll.append(empty.render(true));
                this.start = empty.start.bind(empty);
                var resetBtn = document.createElement('div');
                resetBtn.className = 'simple-button selector';
                resetBtn.style.margin = '1em auto';
                resetBtn.textContent = 'Сбросить фильтры';
                onActivate(resetBtn, function () { resetFilters(); L.Activity.replace(buildActivityObject()); });
                empty.html.append(resetBtn);
                this.activity.loader(false);
                this.activity.toggle();
            },
            onDestroy: function () { if (topSection && topSection.parentNode) topSection.parentNode.removeChild(topSection); topSection = null; frightenBtn = null; },

            // FIX v4.5: на ТВ кнопка «Испугай меня» должна получить фокус,
            // иначе пультом до неё не добраться сразу после входа.
            onStart: function () {
                if (!IS_TV || !frightenBtn) return;
                var btn = frightenBtn;
                setTimeout(function () {
                    try {
                        L.Controller.collectionSet(topSection);
                        L.Controller.collectionFocus(btn, topSection);
                    } catch (e) {}
                }, 100);
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
        var t = setInterval(function () { if (tryAddToMenu() || ++attempts >= 40) clearInterval(t); }, 500);
    }

    /* ============================================================
     *  НАСТРОЙКИ
     * ============================================================ */
    function registerSettings() {
        var themeValues = { none: 'Без темы' };
        CARD_THEMES.forEach(function (t) { themeValues[t.id] = t.name; });

        var fxValues;
        if (IS_TV) {
            // На ТВ показываем только то, что реально работает
            fxValues = {
                'none':     'Без эффектов',
                'vignette': 'Виньетка',
                'scanline': 'CRT-развёртка',
                'vignette scanline': 'Виньетка + развёртка'
            };
        } else {
            fxValues = {
                'none': 'Без эффектов', 'noise': 'Шум (TV-помехи)', 'scanline': 'CRT-развёртка',
                'vhs': 'VHS-искажения', 'chroma': 'Хроматическая аберрация', 'vignette': 'Виньетка',
                'flicker': 'Мерцание', 'dust': 'Пыль в воздухе', 'all': 'ВСЁ сразу (жёстко)',
                'shake wobble': 'Дрожание карточек', 'pulse flicker': 'Пульсация + мерцание',
                'noise scanline vhs': 'TV + VHS комбо', 'noise chroma flicker dust': 'Проклятая плёнка'
            };
        }

        try {
            L.SettingsApi.addComponent({ component: 'horror_unified', name: 'Хоррор', icon: ICON_SETTINGS, after: 'more' });
            L.SettingsApi.addParam({ component: 'horror_unified', param: { name: 'horror_card_theme', type: 'select', values: themeValues, default: 'none' }, field: { name: 'Тема карточек (только на странице «Ужасы»)' }, onChange: applyThemeAttribute });
            L.SettingsApi.addParam({ component: 'horror_unified', param: { name: 'horror_fx', type: 'select', values: fxValues, default: 'none' }, field: { name: 'Оверлей-эффекты (только на странице «Ужасы»)' }, onChange: function (val) { if (document.body.classList.contains('horror-page')) applyFxAttribute(val); else applyFxAttribute('none'); } });
            L.SettingsApi.addParam({ component: 'horror_unified', param: { name: 'horror_show_in_menu', type: 'trigger', default: true }, field: { name: 'Раздел «Ужасы» в главном меню' }, onChange: function (value) { if (value) { if (!menu_button_added) initMenuButton(); } else if (menu_button_added) { $('.menu .menu__item').each(function () { if ($(this).find('.menu__text').text().trim() === TITLE) $(this).remove(); }); menu_button_added = false; } } });
            if (L.Settings && typeof L.Settings.main === 'function') { var main = L.Settings.main(); if (main && typeof main.update === 'function') main.update(); }
        } catch (e) { console.error('[HorrorUnified] Ошибка регистрации настроек:', e); }
    }

    /* ============================================================
     *  BOOT
     * ============================================================ */
    function boot() {
        console.log('[HorrorUnified] Boot v' + VERSION + ' (TV: ' + IS_TV + ', slow: ' + IS_SLOW + ', chrome: ' + CHROME_V + ')');
        try {
            if (L.Component && L.Component.add) L.Component.add(COMPONENT, HorrorComponent);
            else console.error('[HorrorUnified] Component.add недоступен');
            injectStyles();
            injectThemeStyles();
            buildFxLayer();
            registerSettings();
            L.Listener.follow('activity', function (e) { if (e.type === 'start' || e.type === 'archive' || e.type === 'destroy') { setTimeout(syncPageClass, 0); } });
            L.Storage.listener.follow('change', function (e) { if (e.name === 'horror_card_theme') applyThemeAttribute(e.value); if (e.name === 'horror_fx') { if (document.body.classList.contains('horror-page')) applyFxAttribute(e.value); } });
            initMenuButton();
            syncPageClass();
            loadStudioLogos(function () { console.log('[HorrorUnified] Логотипы студий загружены'); });
            if (L.Noty && L.Noty.show) { L.Noty.show('Хоррор v' + VERSION + ' загружен.', { time: 3000 }); }
        } catch (e) { console.error('[HorrorUnified] Boot error:', e); }
    }

    if (window.appready) boot();
    else L.Listener.follow('app', function (e) { if (e.type === 'ready') boot(); });
})();
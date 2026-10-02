/**
 * Horror plugin for Lampa (v9)
 * - Строки: Рекомендации / Кино / Сериалы / Аниме (стандартные строки Lampa)
 * - Панель обзора появляется ТОЛЬКО на мобильной версии, снизу экрана,
 *   над .navigation-bar.
 * - Всё остальное — как обычная страница категории.
 */
(function () {
    'use strict';

    var COMPONENT  = 'horror_page';
    var MENU_TITLE = 'Ужасы';

    var HORROR_GENRE    = 27;
    var THRILLER_GENRE  = 53;
    var ANIMATION_GENRE = 16;

    var KEYWORD_NAMES = [
        'horror', 'supernatural', 'slasher', 'zombie', 'vampire',
        'ghost', 'demonic', 'exorcism', 'haunted house',
        'found footage', 'monster', 'psychological horror',
        'serial killer', 'suspense', 'psychological thriller', 'whodunit'
    ];

    var keywordIds = null;

    /* ─── Утилиты ─── */

    function isAnime(card) {
        var ids = card.genre_ids ||
                  (card.genres ? card.genres.map(function (g) { return g.id; }) : []);
        return card.original_language === 'ja' && ids.indexOf(ANIMATION_GENRE) >= 0;
    }
    function notAnime(card) { return !isAnime(card); }

    function getKeywordId(name, cb) {
        var cacheKey = 'horror_kw_' + name.toLowerCase().replace(/\s+/g, '_');
        var cached = Lampa.Storage.get(cacheKey, '');
        if (cached) return cb(cached);
        Lampa.Api.sources.tmdb.get('search/keyword', { query: name }, function (json) {
            if (json.results && json.results.length) {
                var id = String(json.results[0].id);
                Lampa.Storage.set(cacheKey, id);
                cb(id);
            } else cb(null);
        }, function () { cb(null); }, { life: 60 * 24 * 30 });
    }

    function buildKeywordsString(cb) {
        if (keywordIds) return cb(keywordIds);
        var ids = [], pending = KEYWORD_NAMES.length;
        KEYWORD_NAMES.forEach(function (name) {
            getKeywordId(name, function (id) {
                if (id) ids.push(id);
                pending--;
                if (pending === 0) { keywordIds = ids.join('|'); cb(keywordIds); }
            });
        });
    }

    /* ─── Загрузка ─── */

    function load(type, opts, cb) {
        buildKeywordsString(function (kwString) {
            var params = { sort_by: opts.sort_by || 'popularity.desc', page: 1 };
            if (opts.genres)    params.genres    = opts.genres;
            if (opts.orig_lang) params.orig_lang = opts.orig_lang;

            var filter = {};
            if (opts.use_keywords !== false) filter.with_keywords = kwString;
            if (opts.vote_count) filter['vote_count.gte'] = opts.vote_count;
            if (opts.filter) for (var k in opts.filter) filter[k] = opts.filter[k];
            params.filter = filter;

            Lampa.Api.sources.tmdb.get('discover/' + type, params,
                function (json) {
                    var results = (json && json.results) || [];
                    if (opts.is_anime === true)       results = results.filter(isAnime);
                    else if (opts.is_anime === false) results = results.filter(notAnime);
                    cb({ results: results, total_pages: (json && json.total_pages) || 1 });
                },
                function () { cb({ results: [] }); },
                { life: 60 * 24 * (opts.cache_days || 3) }
            );
        });
    }

    /* ─── Компонент ─── */

    function isMobile() {
        return window.innerWidth <= 768;
    }

    function HorrorComponent(object) {
        var comp      = Lampa.Maker.make('Main', object);
        var previewEl = null;

        function buildPreviewEl() {
            var el = document.createElement('div');
            el.className = 'horror-preview';
            el.innerHTML =
                '<div class="horror-preview__media">' +
                    '<div class="horror-preview__poster-wrap">' +
                        '<img class="horror-preview__poster hp-poster" alt="" />' +
                    '</div>' +
                    '<div class="horror-preview__backdrop-wrap">' +
                        '<img class="horror-preview__backdrop hp-backdrop" alt="" />' +
                    '</div>' +
                '</div>' +
                '<div class="horror-preview__body">' +
                    '<div class="horror-preview__title hp-title"></div>' +
                    '<div class="horror-preview__meta hp-meta"></div>' +
                    '<div class="horror-preview__overview hp-overview"></div>' +
                '</div>';
            return el;
        }

        function updatePreview(card) {
            if (!previewEl || !card) return;

            previewEl.querySelector('.hp-title').textContent = card.title || card.name || 'Без названия';
            previewEl.querySelector('.hp-overview').textContent = card.overview || 'Описание отсутствует.';

            var year   = ((card.release_date || card.first_air_date || '') + '').slice(0, 4);
            var rating = card.vote_average ? parseFloat(card.vote_average).toFixed(1) : '';
            var is_tv  = !!(card.first_air_date || card.name);
            var parts  = [is_tv ? 'Сериал' : 'Кино', year, rating ? '★ ' + rating : ''].filter(Boolean);
            previewEl.querySelector('.hp-meta').textContent = parts.join(' • ');

            var poster = previewEl.querySelector('.hp-poster');
            var posterSrc = card.poster_path ? Lampa.Api.img(card.poster_path, 'w300')
                                            : (card.img || card.poster || '');
            poster.src = posterSrc || '';
            poster.parentNode.style.display = posterSrc ? 'block' : 'none';

            var backdropWrap = previewEl.querySelector('.horror-preview__backdrop-wrap');
            var backdrop = previewEl.querySelector('.hp-backdrop');
            var backdropSrc = card.backdrop_path ? Lampa.Api.img(card.backdrop_path, 'w780')
                                                : (card.background_image || '');
            backdrop.src = backdropSrc || '';
            backdropWrap.style.display = backdropSrc ? 'block' : 'none';
        }

        function recalcOffsets() {
            if (!previewEl) return;
            var nav = document.querySelector('.navigation-bar');
            var navH = nav && isMobile() ? Math.round(nav.getBoundingClientRect().height) : 0;
            previewEl.style.setProperty('--horror-nav', navH + 'px');

            var panelH = isMobile() ? (Math.round(previewEl.getBoundingClientRect().height) || 0) : 0;
            var html = previewEl.closest('.horror-page');
            if (html) html.style.setProperty('--horror-panel-h', panelH + 'px');
        }

        comp.use({
            /* 4 стандартные строки */
            onCreate: function () {
                var lines = [], total = 4, loaded = 0;
                function done() {
                    loaded++;
                    if (loaded < total) return;
                    if (lines.length) comp.build(lines); else comp.empty();
                }

                load('movie', {
                    sort_by: 'vote_average.desc',
                    genres: HORROR_GENRE + '|' + THRILLER_GENRE,
                    vote_count: 1000, cache_days: 7, is_anime: false
                }, function (d) { if (d.results.length) { d.title = 'Рекомендации'; lines.push(d); } done(); });

                load('movie', {
                    sort_by: 'popularity.desc',
                    genres: HORROR_GENRE + '|' + THRILLER_GENRE,
                    vote_count: 50, cache_days: 3, is_anime: false
                }, function (d) { if (d.results.length) { d.title = 'Кино'; lines.push(d); } done(); });

                load('tv', {
                    sort_by: 'popularity.desc',
                    vote_count: 50, cache_days: 3, is_anime: false
                }, function (d) { if (d.results.length) { d.title = 'Сериалы'; lines.push(d); } done(); });

                load('tv', {
                    sort_by: 'popularity.desc',
                    genres: ANIMATION_GENRE, orig_lang: 'ja',
                    vote_count: 30, cache_days: 7, is_anime: true
                }, function (d) { if (d.results.length) { d.title = 'Аниме'; lines.push(d); } done(); });
            },

            /* Фокус на карточке — обновляем панель */
            onInstance: function (line) {
                line.use({
                    onActive: function (item, card_data) { updatePreview(card_data); }
                });
            },

            /* Панель только для мобильной версии */
            onBuild: function (data) {
                if (!isMobile()) return;

                var html = this.render(true);
                html.classList.add('horror-page');

                if (!previewEl) {
                    previewEl = buildPreviewEl();
                    html.appendChild(previewEl);
                }

                var first = data[0] && data[0].results && data[0].results[0];
                if (first) updatePreview(first);

                requestAnimationFrame(function () {
                    recalcOffsets();
                    setTimeout(recalcOffsets, 300);
                });
                window.addEventListener('resize', recalcOffsets);
                window.addEventListener('orientationchange', function () {
                    setTimeout(recalcOffsets, 300);
                });
            },

            onDestroy: function () {
                window.removeEventListener('resize', recalcOffsets);
            }
        });

        return comp;
    }

    /* ─── Меню ─── */

    function addMenuButton() {
        Lampa.Menu.addButton(
            '<svg><use xlink:href="#sprite-meta-fear"></use></svg>',
            MENU_TITLE,
            function () {
                Lampa.Activity.push({
                    url: 'horror', title: MENU_TITLE,
                    component: COMPONENT, page: 1
                });
            }
        );
    }

    /* ─── Стили: только панель, только мобильные ─── */

    function injectStyles() {
        if (document.getElementById('horror-plugin-styles')) return;
        var style = document.createElement('style');
        style.id = 'horror-plugin-styles';
        style.textContent = [
            '@media (max-width: 768px) {',

            /* Небольшой отступ снизу, чтобы последняя строка не пряталась под панелью */
            '    .horror-page > .scroll .scroll__content {',
            '        padding-bottom: calc(var(--horror-panel-h, 30vh) + var(--horror-nav, 0px) + 1em) !important;',
            '    }',

            /* Панель снизу, над .navigation-bar */
            '    .horror-preview {',
            '        --horror-nav: 0px;',
            '        position: fixed;',
            '        bottom: calc(var(--horror-nav, 0px) + 0.5em);',
            '        left: 0.5em; right: 0.5em;',
            '        width: auto;',
            '        max-height: 34vh;',
            '        padding: 0.8em 0.9em 0.9em;',
            '        border-radius: 1em;',
            '        background: rgba(8,8,8,0.96);',
            '        -webkit-backdrop-filter: blur(24px);',
            '        backdrop-filter: blur(24px);',
            '        box-shadow: 0 12px 40px rgba(0,0,0,0.8);',
            '        display: flex;',
            '        flex-direction: column;',
            '        justify-content: flex-start;',
            '        overflow: hidden;',
            '        z-index: 200;',
            '        color: #fff;',
            '        pointer-events: none;',
            '    }',

            '    .horror-preview__media {',
            '        display: flex; gap: 0.6em;',
            '        height: 6em; margin: 0 0 0.5em 0;',
            '        flex-shrink: 0;',
            '    }',

            '    .horror-preview__poster-wrap {',
            '        width: 4em; height: 100%;',
            '        border-radius: 0.4em; overflow: hidden;',
            '        background: rgba(255,255,255,0.06);',
            '        flex: 0 0 auto;',
            '    }',

            '    .horror-preview__backdrop-wrap {',
            '        flex: 1; height: 100%;',
            '        border-radius: 0.4em; overflow: hidden;',
            '        background: rgba(255,255,255,0.06);',
            '    }',

            '    .horror-preview__poster,',
            '    .horror-preview__backdrop {',
            '        width: 100%; height: 100%;',
            '        object-fit: cover; display: block;',
            '    }',

            '    .horror-preview__title {',
            '        font-size: 1.05em; font-weight: 700;',
            '        line-height: 1.15; margin: 0 0 0.1em 0;',
            '        flex-shrink: 0;',
            '    }',

            '    .horror-preview__meta {',
            '        font-size: 0.75em; opacity: 0.78;',
            '        margin: 0 0 0.4em 0;',
            '        flex-shrink: 0;',
            '    }',

            '    .horror-preview__overview {',
            '        font-size: 0.82em; line-height: 1.35;',
            '        opacity: 0.9;',
            '        max-height: 9vh; margin: 0; padding: 0;',
            '        overflow: hidden;',
            '    }',
            '}',

            /* На десктопе панель полностью отключена */
            '@media (min-width: 769px) {',
            '    .horror-preview { display: none !important; }',
            '}'
        ].join('\n');
        document.head.appendChild(style);
    }

    /* ─── Запуск ─── */

    function start() {
        if (window.horror_plugin_started) return;
        window.horror_plugin_started = true;

        injectStyles();
        Lampa.Component.add(COMPONENT, HorrorComponent);
        addMenuButton();

        console.log('Horror plugin', 'started');
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') start();
    });
})();
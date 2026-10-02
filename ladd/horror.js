/**
 * Horror plugin for Lampa (v6)
 * - Порядок строк: Рекомендации / Кино / Сериалы / Аниме
 * - Мобильная панель поднята: описание сразу под строкой
 * - Добавлен with_release_type (3 = Theatrical, 4 = Digital) для строки "Кино"
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
        var ids = [];
        var pending = KEYWORD_NAMES.length;
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
            var params = {
                sort_by: opts.sort_by || 'popularity.desc',
                page: 1
            };
            if (opts.genres)    params.genres    = opts.genres;
            if (opts.orig_lang) params.orig_lang = opts.orig_lang;

            var filter = {};
            if (opts.use_keywords !== false) filter.with_keywords = kwString;
            if (opts.vote_count) filter['vote_count.gte'] = opts.vote_count;
            if (opts.release_type) filter.with_release_type = opts.release_type;
            if (opts.filter) for (var k in opts.filter) filter[k] = opts.filter[k];
            params.filter = filter;

            Lampa.Api.sources.tmdb.get(
                'discover/' + type, params,
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

    function HorrorComponent(object) {
        var comp      = Lampa.Maker.make('Main', object);
        var previewEl = null;

        function buildPreviewEl() {
            var el = document.createElement('div');
            el.className = 'horror-preview';
            el.innerHTML = [
                '<div class="horror-preview__media">',
                    '<div class="horror-preview__poster-wrap">',
                        '<img class="horror-preview__poster hp-poster" alt="" />',
                    '</div>',
                    '<div class="horror-preview__backdrop-wrap">',
                        '<img class="horror-preview__backdrop hp-backdrop" alt="" />',
                    '</div>',
                '</div>',
                '<div class="horror-preview__body">',
                    '<div class="horror-preview__title hp-title"></div>',
                    '<div class="horror-preview__meta hp-meta"></div>',
                    '<div class="horror-preview__overview hp-overview"></div>',
                '</div>'
            ].join('');
            return el;
        }

        function updatePreview(card) {
            if (!previewEl || !card) return;

            previewEl.querySelector('.hp-title').textContent =
                card.title || card.name || 'Без названия';
            previewEl.querySelector('.hp-overview').textContent =
                card.overview || 'Описание отсутствует.';

            var year   = ((card.release_date || card.first_air_date || '') + '').slice(0, 4);
            var rating = card.vote_average ? parseFloat(card.vote_average).toFixed(1) : '';
            var is_tv  = !!(card.first_air_date || card.name);
            var type   = is_tv ? 'Сериал' : 'Фильм';
            var parts  = [type, year, rating ? '★ ' + rating : ''].filter(Boolean);
            previewEl.querySelector('.hp-meta').textContent = parts.join(' • ');

            var poster = previewEl.querySelector('.hp-poster');
            var posterSrc = card.poster_path
                ? Lampa.Api.img(card.poster_path, 'w300')
                : (card.img || card.poster || '');
            if (posterSrc) {
                poster.src = posterSrc;
                poster.parentNode.style.display = 'block';
            } else {
                poster.parentNode.style.display = 'none';
            }

            var backdropWrap = previewEl.querySelector('.horror-preview__backdrop-wrap');
            var backdrop = previewEl.querySelector('.hp-backdrop');
            var backdropSrc = card.backdrop_path
                ? Lampa.Api.img(card.backdrop_path, 'w780')
                : (card.background_image || card.img || '');
            if (backdropSrc) {
                backdrop.src = backdropSrc;
                backdropWrap.style.display = 'block';
            } else {
                backdropWrap.style.display = 'none';
            }
        }

        comp.use({
            onCreate: function () {
                var lines = [], total = 4, loaded = 0;
                function done() {
                    loaded++;
                    if (loaded < total) return;
                    if (lines.length) comp.build(lines);
                    else comp.empty();
                }

                /* 1 — Рекомендации */
                load('movie', {
                    sort_by:    'vote_average.desc',
                    genres:     HORROR_GENRE + '|' + THRILLER_GENRE,
                    vote_count: 1000,
                    cache_days: 7,
                    is_anime:   false
                }, function (d) {
                    if (d.results.length) { d.title = 'Рекомендации'; lines.push(d); }
                    done();
                });

                /* 2 — Кино (только прокат/цифра) */
                load('movie', {
                    sort_by:      'popularity.desc',
                    genres:       HORROR_GENRE + '|' + THRILLER_GENRE,
                    vote_count:   50,
                    release_type: '3|4', // Theatrical | Digital
                    cache_days:   3,
                    is_anime:     false
                }, function (d) {
                    if (d.results.length) { d.title = 'Кино'; lines.push(d); }
                    done();
                });

                /* 3 — Сериалы */
                load('tv', {
                    sort_by:    'popularity.desc',
                    vote_count: 50,
                    cache_days: 3,
                    is_anime:   false
                }, function (d) {
                    if (d.results.length) { d.title = 'Сериалы'; lines.push(d); }
                    done();
                });

                /* 4 — Аниме */
                load('tv', {
                    sort_by:    'popularity.desc',
                    genres:     ANIMATION_GENRE,
                    orig_lang:  'ja',
                    vote_count: 30,
                    cache_days: 7,
                    is_anime:   true
                }, function (d) {
                    if (d.results.length) { d.title = 'Аниме'; lines.push(d); }
                    done();
                });
            },

            onInstance: function (line) {
                line.use({
                    onActive: function (item, card_data) {
                        updatePreview(card_data);
                    }
                });
            },

            onBuild: function (data) {
                var html = this.render(true);
                html.classList.add('horror-page');
                if (!previewEl) {
                    previewEl = buildPreviewEl();
                    html.appendChild(previewEl);
                }
                var first = data[0] && data[0].results && data[0].results[0];
                if (first) updatePreview(first);
            }
        });

        return comp;
    }

    function addMenuButton() {
        Lampa.Menu.addButton(
            '<svg><use xlink:href="#sprite-meta-fear"></use></svg>',
            MENU_TITLE,
            function () {
                Lampa.Activity.push({
                    url:       'horror',
                    title:     MENU_TITLE,
                    component: COMPONENT,
                    page:      1
                });
            }
        );
    }

    /* ─── Стили ─── */

    function injectStyles() {
        if (document.getElementById('horror-plugin-styles')) return;
        var style = document.createElement('style');
        style.id = 'horror-plugin-styles';
        style.textContent = [

            /* ================= DESKTOP ================= */
            '.horror-page { position: relative; }',
            '.horror-page > .scroll { width: 55% !important; overflow: hidden; }',

            '.horror-preview {',
            '    position: fixed; right: 0; top: 0;',
            '    width: 45%; height: 100vh;',
            '    padding: 7em 3em 3em 2em;',
            '    box-sizing: border-box;',
            '    display: flex; flex-direction: column; justify-content: center;',
            '    pointer-events: none; z-index: 5; color: #fff;',
            '}',

            '.horror-preview__media {',
            '    display: flex; gap: 1em; height: 15em; margin-bottom: 1.5em;',
            '}',
            '.horror-preview__poster-wrap {',
            '    width: 10em; height: 100%; border-radius: 0.7em; overflow: hidden;',
            '    background: rgba(255,255,255,0.06); box-shadow: 0 18px 50px rgba(0,0,0,0.65);',
            '    flex: 0 0 auto;',
            '}',
            '.horror-preview__poster { width: 100%; height: 100%; object-fit: cover; display: block; }',
            '.horror-preview__backdrop-wrap {',
            '    flex: 1; height: 100%; border-radius: 0.7em; overflow: hidden;',
            '    background: rgba(255,255,255,0.06); box-shadow: 0 18px 50px rgba(0,0,0,0.65);',
            '}',
            '.horror-preview__backdrop { width: 100%; height: 100%; object-fit: cover; display: block; }',
            '.horror-preview__title { font-size: 2em; font-weight: 700; line-height: 1.15; margin-bottom: 0.4em; text-shadow: 0 2px 20px rgba(0,0,0,0.75); }',
            '.horror-preview__meta { font-size: 0.95em; opacity: 0.78; margin-bottom: 1.1em; text-shadow: 0 2px 10px rgba(0,0,0,0.75); }',
            '.horror-preview__overview { font-size: 1.05em; line-height: 1.5; opacity: 0.9; max-height: 26vh; overflow: hidden; text-shadow: 0 2px 10px rgba(0,0,0,0.75); }',

            /* ================= MOBILE ================= */
            '@media (max-width: 768px) {',
            '    .horror-page > .scroll { width: 100% !important; }',
            '    .horror-page > .scroll .scroll__content { padding-bottom: 30vh; }',

            '    .horror-preview {',
            '        position: fixed;',
            '        top: auto; bottom: 0; left: 0; right: 0;',
            '        width: 100%; height: auto; max-height: 55vh;',
            '        padding: 1em 1.2em 1.2em;',
            '        background: linear-gradient(to top, rgba(0,0,0,0.98), rgba(0,0,0,0.92) 70%, rgba(0,0,0,0.75));',
            '        box-shadow: 0 -10px 40px rgba(0,0,0,0.7);',
            '        justify-content: flex-end; overflow: hidden; z-index: 50;',
            '    }',

            /* Постер + backdrop — компактно */
            '    .horror-preview__media { height: 7em; margin-bottom: 0.6em; gap: 0.6em; }',
            '    .horror-preview__poster-wrap { width: 4.67em; border-radius: 0.4em; }',
            '    .horror-preview__backdrop-wrap { border-radius: 0.4em; }',

            /* Заголовок и мета — сразу под строкой */
            '    .horror-preview__title { font-size: 1.15em; margin-bottom: 0.15em; }',
            '    .horror-preview__meta { font-size: 0.78em; margin-bottom: 0.4em; }',

            /* Описание — сразу под метой, без отступа сверху */
            '    .horror-preview__overview {',
            '        font-size: 0.88em; line-height: 1.35;',
            '        max-height: 14vh; overflow: hidden;',
            '        border-top: 1px solid rgba(255,255,255,0.1);',
            '        padding-top: 0.4em;',
            '    }',
            '}'
        ].join('\n');
        document.head.appendChild(style);
    }

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
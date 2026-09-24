(function () {
    'use strict';

    var STYLE_ID = 'theme_layout_style';
    var STORAGE_KEY = 'interface_theme_layout';
    var ATTR = 'data-layout';
    var FILM_ATTR = 'data-film-card';

    var observer = null;
    var currentTheme = 'classic';
    var origBg = {};

    // Перфорация: прямоугольники 18×10 со скруглением, шаг 26px
    var PERF = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'26\' height=\'14\'%3E%3Crect x=\'4\' y=\'2\' width=\'18\' height=\'10\' rx=\'2\' fill=\'%23e8e8e8\'/%3E%3C/svg%3E")';

    // ================================================================
    //  ПОМЕТКА КАРТОЧЕК ФИЛЬМОВ
    // ================================================================

    function tagFilmCards() {
        var cards = document.querySelectorAll('.card');
        for (var i = 0; i < cards.length; i++) {
            var c = cards[i];
            if (c.hasAttribute(FILM_ATTR)) continue;
            // Обёртка категории не содержит img, карточка фильма — содержит
            if (c.querySelector('img')) c.setAttribute(FILM_ATTR, '');
        }
    }

    function untagFilmCards() {
        var tagged = document.querySelectorAll('[' + FILM_ATTR + ']');
        for (var i = 0; i < tagged.length; i++) tagged[i].removeAttribute(FILM_ATTR);
    }

    // ================================================================
    //  БЕЙДЖ "СКОРО"
    // ================================================================

    function getMovie(card) {
        try {
            var $c = window.jQuery ? window.jQuery(card) : null;
            var m = $c && $c.data ? $c.data('movie') : null;
            if (m) return m;
        } catch (e) {}

        // Fallback: ищем во всех соседних карточках активной активности
        try {
            var act = window.Lampa && Lampa.Activity && Lampa.Activity.active();
            if (act && act.activity && act.activity.movie) return act.activity.movie;
        } catch (e) {}

        return null;
    }

    function isFuture(m) {
        if (!m) return false;
        var d = m.release_date || m.first_air_date || '';
        if (!d) return false;
        var t = Date.parse(d);
        return !isNaN(t) && t > Date.now();
    }

    function refreshUpcomingBadges() {
        var cards = document.querySelectorAll('[' + FILM_ATTR + ']');
        for (var i = 0; i < cards.length; i++) {
            var card = cards[i];
            var existing = card.querySelector('.layout-badge.upcoming');

            // Ищем movie по каждому card — если у card нет .data('movie'), пробуем так:
            var m = null;
            try {
                var $c = window.jQuery ? window.jQuery(card) : null;
                m = $c && $c.data ? ($c.data('movie') || null) : null;
            } catch (e) {}

            // Если не нашли — берём movie из активной активности (одинаков для всех карточек активности)
            if (!m) m = getMovie(card);

            var future = isFuture(m);

            if (future && !existing) {
                var d = m.release_date || m.first_air_date;
                var b = document.createElement('div');
                b.className = 'layout-badge upcoming';
                b.textContent = 'СКОРО · ' + d;
                card.appendChild(b);
            } else if (!future && existing) {
                existing.parentNode.removeChild(existing);
            }
        }
    }

    function clearBadges() {
        var b = document.querySelectorAll('.layout-badge');
        for (var i = 0; i < b.length; i++) if (b[i].parentNode) b[i].parentNode.removeChild(b[i]);
    }

    // ================================================================
    //  НАБЛЮДЕНИЕ
    // ================================================================

    function stopObserving() { if (observer) { observer.disconnect(); observer = null; } }

    function startObserving() {
        stopObserving();
        tagFilmCards();
        if (currentTheme === 'filmstrip') refreshUpcomingBadges();

        var raf = null;
        observer = new MutationObserver(function () {
            if (raf) return;
            raf = (window.requestAnimationFrame || setTimeout)(function () {
                raf = null;
                tagFilmCards();
                if (currentTheme === 'filmstrip') refreshUpcomingBadges();
            }, 32);
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // ================================================================
    //  ФОН
    // ================================================================

    function clearBgInline() {
        var nodes = document.querySelectorAll('.background, .background__layer');
        for (var i = 0; i < nodes.length; i++) {
            if (!nodes[i].style) continue;
            nodes[i].style.backgroundImage = 'none';
            nodes[i].style.background = '';
        }
    }

    function overrideBackground() {
        if (!window.Lampa || !Lampa.Background || origBg.installed) return;
        origBg.installed = true;

        ['immediately', 'change', 'show', 'clear'].forEach(function (fn) {
            if (typeof Lampa.Background[fn] === 'function') {
                origBg[fn] = Lampa.Background[fn];
                Lampa.Background[fn] = function () {
                    if (currentTheme !== 'classic') { clearBgInline(); return; }
                    return origBg[fn].apply(this, arguments);
                };
            }
        });
        setTimeout(clearBgInline, 50);
    }

    function restoreBackground() {
        if (!origBg.installed) return;
        ['immediately', 'change', 'show', 'clear'].forEach(function (fn) {
            if (origBg[fn]) Lampa.Background[fn] = origBg[fn];
        });
        origBg = {};
    }

    // ================================================================
    //  ТЕМЫ
    // ================================================================

    var THEMES = {

        classic: { title: 'Классика (по умолчанию)', css: '', apply: null },

        // ------------------------------------------------------------
        // КИНОЛЕНТА — перфорация на каждой карточке
        // ------------------------------------------------------------
        filmstrip: {
            title: 'Кинолента',
            css: [

                /* ---- ФОН ---- */
                'body[data-layout="filmstrip"],',
                'body[data-layout="filmstrip"] .background,',
                'body[data-layout="filmstrip"] .background__layer {',
                '  background: #050505 !important;',
                '  background-image: none !important;',
                '}',

                /* ---- КАДР (карточка) ---- */
                'body[data-layout="filmstrip"] [' + FILM_ATTR + '] {',
                '  position: relative !important;',
                '  padding: 14px 0 !important;',
                '  background-color: #000 !important;',
                /* Перфорация сверху и снизу — два фоновых слоя */
                '  background-image: ' + PERF + ', ' + PERF + ' !important;',
                '  background-position: top left, bottom left !important;',
                '  background-repeat: repeat-x, repeat-x !important;',
                '  background-size: 26px 14px, 26px 14px !important;',
                '  aspect-ratio: unset !important;',
                '  height: auto !important;',
                '  min-height: 0 !important;',
                '  overflow: hidden !important;',
                '  box-sizing: border-box !important;',
                '  border: none !important;',
                '  border-radius: 0 !important;',
                '  box-shadow: 0 8px 20px rgba(0,0,0,.8) !important;',
                '  filter: grayscale(100%) contrast(.9) brightness(.85) !important;',
                '  transition: filter .25s ease, box-shadow .25s ease, transform .25s ease !important;',
                '}',

                /* ---- ИЗОБРАЖЕНИЕ ВНУТРИ (кадр 4:3) ---- */
                'body[data-layout="filmstrip"] [' + FILM_ATTR + '] img {',
                '  display: block !important;',
                '  width: 100% !important;',
                '  height: auto !important;',
                '  aspect-ratio: 4 / 3 !important;',
                '  object-fit: cover !important;',
                '  border-radius: 0 !important;',
                '  margin: 0 !important;',
                '  padding: 0 !important;',
                '}',

                /* Обёртка img (если есть) — растянуть по ширине, не мешать */
                'body[data-layout="filmstrip"] [' + FILM_ATTR + '] > div:not(.card__title):not(.layout-badge) {',
                '  width: 100% !important;',
                '  height: auto !important;',
                '  aspect-ratio: unset !important;',
                '  margin: 0 !important;',
                '  padding: 0 !important;',
                '}',

                'body[data-layout="filmstrip"] [' + FILM_ATTR + '].focus {',
                '  filter: grayscale(0) contrast(1.1) brightness(1) !important;',
                '  box-shadow: 0 0 0 2px #f5c518, 0 12px 32px rgba(245,197,24,.35) !important;',
                '  transform: scale(1.03) !important;',
                '  z-index: 5 !important;',
                '}',

                /* ---- ЗАГОЛОВОК ПОВЕРХ КАДРА ---- */
                'body[data-layout="filmstrip"] [' + FILM_ATTR + '] .card__title {',
                '  position: absolute !important;',
                '  bottom: 14px !important;',
                '  left: 0 !important;',
                '  right: 0 !important;',
                '  padding: 1.6em .6em .5em !important;',
                '  background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,.95) 100%) !important;',
                '  color: #f5c518 !important;',
                '  font-family: "Courier New", monospace !important;',
                '  font-size: .78em !important;',
                '  letter-spacing: .06em !important;',
                '  text-transform: uppercase !important;',
                '  text-shadow: none !important;',
                '  z-index: 3 !important;',
                '}',

                /* ---- БЕЙДЖ "СКОРО" ПОД КАДРОМ ---- */
                'body[data-layout="filmstrip"] [' + FILM_ATTR + '] .layout-badge.upcoming {',
                '  position: absolute !important;',
                '  left: 0 !important;',
                '  right: 0 !important;',
                '  bottom: 0 !important;',
                '  height: 14px !important;',
                '  display: flex !important;',
                '  align-items: center !important;',
                '  justify-content: center !important;',
                '  background: linear-gradient(90deg, #ff0090, #ffea00, #00c8ff) !important;',
                '  color: #000 !important;',
                '  font-family: "Courier New", monospace !important;',
                '  font-size: 9px !important;',
                '  font-weight: 700 !important;',
                '  letter-spacing: .1em !important;',
                '  text-transform: uppercase !important;',
                '  z-index: 4 !important;',
                '  overflow: hidden !important;',
                '  white-space: nowrap !important;',
                '}',

                /* ---- HEAD / МЕНЮ ---- */
                'body[data-layout="filmstrip"] .head {',
                '  background: #000 !important;',
                '  border-bottom: 2px solid #f5c518 !important;',
                '}',
                'body[data-layout="filmstrip"] .menu__item.focus {',
                '  background: #f5c518 !important;',
                '  color: #000 !important;',
                '}'
            ].join('\n'),
            apply: function () { startObserving(); }
        },

        // ------------------------------------------------------------
        // КОЛОДА КАРТ — карточки выглядят как игральные карты
        // ------------------------------------------------------------
        deckofcards: {
            title: 'Колода карт',
            css: [

                /* ---- ФОН ---- */
                'body[data-layout="deckofcards"],',
                'body[data-layout="deckofcards"] .background,',
                'body[data-layout="deckofcards"] .background__layer {',
                '  background: radial-gradient(ellipse at 50% 100%, #0a4d0a 0%, #052005 60%, #000 100%) !important;',
                '  background-image: radial-gradient(ellipse at 50% 100%, #0a4d0a 0%, #052005 60%, #000 100%) !important;',
                '}',

                /* ---- КАРТА ---- */
                'body[data-layout="deckofcards"] [' + FILM_ATTR + '] {',
                '  background: #fffdf5 !important;',
                '  border: 2px solid #1a1a1a !important;',
                '  border-radius: 9px !important;',
                '  padding: .5em .5em 2em !important;',
                '  box-shadow: 4px 4px 0 rgba(0,0,0,.45), 6px 8px 14px rgba(0,0,0,.35) !important;',
                '  transform: rotate(2deg) !important;',
                '  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease !important;',
                '  position: relative !important;',
                '  overflow: hidden !important;',
                '  aspect-ratio: unset !important;',
                '}',

                'body[data-layout="deckofcards"] [' + FILM_ATTR + ']:nth-child(even) {',
                '  transform: rotate(-2deg) !important;',
                '}',
                'body[data-layout="deckofcards"] [' + FILM_ATTR + ']:nth-child(3n) {',
                '  transform: rotate(1.5deg) !important;',
                '}',

                'body[data-layout="deckofcards"] [' + FILM_ATTR + '].focus {',
                '  transform: rotate(0) scale(1.08) !important;',
                '  z-index: 10 !important;',
                '  box-shadow: 6px 8px 0 rgba(0,0,0,.55), 12px 16px 32px rgba(0,0,0,.55), 0 0 0 3px #f5c518 !important;',
                '}',

                'body[data-layout="deckofcards"] [' + FILM_ATTR + '] img {',
                '  width: 100% !important;',
                '  height: auto !important;',
                '  object-fit: cover !important;',
                '  border-radius: 5px !important;',
                '  display: block !important;',
                '}',

                'body[data-layout="deckofcards"] [' + FILM_ATTR + '] .card__title {',
                '  position: absolute !important;',
                '  bottom: .3em !important;',
                '  left: 0 !important;',
                '  right: 0 !important;',
                '  padding: 0 .5em !important;',
                '  background: transparent !important;',
                '  color: #1a1a1a !important;',
                '  font-family: "Courier New", monospace !important;',
                '  font-weight: 700 !important;',
                '  font-size: .72em !important;',
                '  text-align: center !important;',
                '  text-shadow: none !important;',
                '  overflow: hidden !important;',
                '  text-overflow: ellipsis !important;',
                '  white-space: nowrap !important;',
                '}',

                'body[data-layout="deckofcards"] .head {',
                '  background: #052005 !important;',
                '  border-bottom: 2px solid #0a4d0a !important;',
                '}',
                'body[data-layout="deckofcards"] .menu__item.focus {',
                '  background: #f5c518 !important;',
                '  color: #052005 !important;',
                '}'
            ].join('\n'),
            apply: function () { startObserving(); }
        }
    };

    var THEME_ORDER = ['classic', 'filmstrip', 'deckofcards'];

    // ================================================================
    //  ПРИМЕНЕНИЕ
    // ================================================================

    function currentThemeName() {
        return Lampa.Storage.field(STORAGE_KEY) || 'classic';
    }

    function clearPrevious() {
        stopObserving();
        clearBadges();
        untagFilmCards();

        var old = document.getElementById(STYLE_ID);
        if (old && old.parentNode) old.parentNode.removeChild(old);

        clearBgInline();
    }

    function applyTheme(name) {
        clearPrevious();

        var prev = currentTheme;
        currentTheme = name;

        if (prev !== 'classic' && name === 'classic') restoreBackground();
        if (name && name !== 'classic') overrideBackground();

        if (!name || name === 'classic') {
            document.body.removeAttribute(ATTR);
            return;
        }

        var theme = THEMES[name];
        if (!theme) return;

        document.body.setAttribute(ATTR, name);

        if (theme.css) {
            var style = document.createElement('style');
            style.id = STYLE_ID;
            style.type = 'text/css';
            style.appendChild(document.createTextNode(theme.css));
            document.head.appendChild(style);
        }

        // Сначала помечаем карточки, потом вызываем apply
        tagFilmCards();

        if (typeof theme.apply === 'function') {
            try { theme.apply(); }
            catch (e) { console.warn('ThemeLayout apply error:', e); }
        }
    }

    function buildValues() {
        var values = {};
        THEME_ORDER.forEach(function (k) { if (THEMES[k]) values[k] = THEMES[k].title; });
        return values;
    }

    // ================================================================
    //  СТАРТ
    // ================================================================

    function startPlugin() {
        window.theme_layout_plugin = true;

        function addPlugin() {
            Lampa.Lang.add({
                theme_layout_setting: {
                    ru: 'Тема оформления',
                    uk: 'Тема оформлення',
                    be: 'Тэма афармлення',
                    en: 'Layout theme',
                    zh: '布局主题'
                }
            });

            Lampa.SettingsApi.addParam({
                component: 'interface',
                param: {
                    name: STORAGE_KEY,
                    type: 'select',
                    values: buildValues(),
                    default: 'classic'
                },
                field: { name: Lampa.Lang.translate('theme_layout_setting') },
                onChange: function () {
                    var n = currentThemeName();
                    applyTheme(n);
                    var t = THEMES[n];
                    if (t && n !== 'classic') Lampa.Noty.show('🎬 ' + t.title);
                }
            });

            Lampa.Settings.listener.follow('open', function (e) {
                if (e.name !== 'interface') return;
                var item = e.body.find('[data-name="' + STORAGE_KEY + '"]');
                if (!item.length) return;
                var anchor = e.body.find('[data-name="interface_size_fixed"]');
                if (!anchor.length) anchor = e.body.find('[data-name="interface_size"]');
                if (!anchor.length) return;
                item.detach();
                item.insertAfter(anchor);
            });

            Lampa.Storage.listener.follow('change', function (e) {
                if (e.name === STORAGE_KEY) applyTheme(e.value || 'classic');
            });

            Lampa.Listener.follow('activity', function (e) {
                if (e.type !== 'start') return;
                var n = currentThemeName();
                if (n === 'classic') return;
                setTimeout(function () {
                    if (currentThemeName() === n) applyTheme(n);
                }, 80);
            });

            setInterval(function () {
                if (currentTheme !== 'classic') clearBgInline();
            }, 1500);

            applyTheme(currentThemeName());
            console.log('ThemeLayout v5', 'loaded, current:', currentThemeName());
        }

        if (window.appready) addPlugin();
        else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type == 'ready') addPlugin();
            });
        }
    }

    if (!window.theme_layout_plugin) startPlugin();

})();
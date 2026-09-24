(function () {
    'use strict';

    var STYLE_ID = 'theme_layout_style';
    var STORAGE_KEY = 'interface_theme_layout';
    var ATTR = 'data-layout';
    var CARD_ATTR = 'data-cards-container';

    var observer = null;
    var currentTheme = 'classic';
    var origBg = {};

    // ================================================================
    //  УТИЛИТЫ
    // ================================================================

    function cardMovie(card) {
        if (!card) return null;
        try {
            var $c = window.jQuery ? window.jQuery(card) : null;
            return $c && $c.data ? ($c.data('movie') || null) : null;
        } catch (e) { return null; }
    }

    function isFuture(m) {
        if (!m) return false;
        var d = m.release_date || m.first_air_date || '';
        if (!d) return false;
        var t = Date.parse(d);
        return !isNaN(t) && t > Date.now();
    }

    // Пометка родителей всех карточек
    function tagContainers() {
        var cards = document.querySelectorAll('.card');
        for (var i = 0; i < cards.length; i++) {
            var p = cards[i].parentElement;
            if (p && !p.hasAttribute(CARD_ATTR)) p.setAttribute(CARD_ATTR, '');
        }
    }

    function clearBadges() {
        var b = document.querySelectorAll('.layout-badge');
        for (var i = 0; i < b.length; i++) if (b[i].parentNode) b[i].parentNode.removeChild(b[i]);
    }

    function addUpcomingBadges() {
        var cards = document.querySelectorAll('.card');
        for (var i = 0; i < cards.length; i++) {
            var card = cards[i];
            var m = cardMovie(card);
            if (!m) continue;
            if (!isFuture(m)) continue;
            if (card.querySelector('.layout-badge.upcoming')) continue;
            var d = m.release_date || m.first_air_date;
            var b = document.createElement('div');
            b.className = 'layout-badge upcoming';
            b.textContent = 'СКОРО · ' + d;
            card.appendChild(b);
        }
    }

    function stopObserving() {
        if (observer) { observer.disconnect(); observer = null; }
    }

    function startObserving() {
        stopObserving();
        tagContainers();
        var raf = null;
        observer = new MutationObserver(function (muts) {
            var hasNew = false;
            for (var i = 0; i < muts.length; i++) {
                if (muts[i].addedNodes && muts[i].addedNodes.length) { hasNew = true; break; }
            }
            if (!hasNew) return;
            if (raf) return;
            raf = (window.requestAnimationFrame || setTimeout)(function () {
                raf = null;
                tagContainers();
                if (currentTheme === 'filmstrip') addUpcomingBadges();
            }, 16);
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // ================================================================
    //  ПЕРЕХВАТ ФОНА LAMPA
    // ================================================================

    function clearBgInline() {
        var nodes = document.querySelectorAll(
            '.background, .background__layer, .background::after, .background > *'
        );
        for (var i = 0; i < nodes.length; i++) {
            if (!nodes[i].style) continue;
            nodes[i].style.backgroundImage = 'none';
            nodes[i].style.background = '';
        }
        // Явно прячем слой с картинкой
        var layers = document.querySelectorAll('.background__layer');
        for (var j = 0; j < layers.length; j++) {
            layers[j].style.backgroundImage = 'none';
        }
    }

    function overrideBackground() {
        if (!window.Lampa || !Lampa.Background || origBg.installed) return;
        origBg.installed = true;

        ['immediately', 'change', 'show', 'clear'].forEach(function (fn) {
            if (typeof Lampa.Background[fn] === 'function') {
                origBg[fn] = Lampa.Background[fn];
                Lampa.Background[fn] = function () {
                    if (currentTheme !== 'classic') {
                        clearBgInline();
                        return;
                    }
                    return origBg[fn].apply(this, arguments);
                };
            }
        });

        // Также проверяем, что фон не меняется через прямой вызов
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
    //  ПЕРФОРАЦИЯ (SVG data-URI — стабильно на всех платформах)
    // ================================================================

    var PERF_SVG = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'26\' height=\'14\'%3E%3Crect x=\'4\' y=\'2\' width=\'18\' height=\'10\' rx=\'2\' fill=\'%23e8e8e8\'/%3E%3C/svg%3E")';

    // ================================================================
    //  ТЕМЫ
    // ================================================================

    var THEMES = {

        classic: {
            title: 'Классика (по умолчанию)',
            css: '',
            apply: null
        },

        // ------------------------------------------------------------
        // КИНОЛЕНТА — с настоящей перфорацией
        // ------------------------------------------------------------
        filmstrip: {
            title: 'Кинолента',
            hint: 'Ч/б кадры на 35мм плёнке с перфорацией',
            css: [

                /* ---- ФОН ---- */
                'body[data-layout="filmstrip"],',
                'body[data-layout="filmstrip"] .background,',
                'body[data-layout="filmstrip"] .background__layer {',
                '  background: #050505 !important;',
                '  background-image: none !important;',
                '}',
                'body[data-layout="filmstrip"] .background::after,',
                'body[data-layout="filmstrip"] .background::before {',
                '  content: none !important;',
                '  background: none !important;',
                '}',

                /* ---- КОНТЕЙНЕР С КАДРАМИ ---- */
                'body[data-layout="filmstrip"] [data-cards-container] {',
                '  display: grid !important;',
                '  grid-template-columns: repeat(auto-fill, minmax(13em, 1fr)) !important;',
                '  gap: 1.4em !important;',
                '  padding: 3.2em 2.5em !important;',
                '  background: #0a0a0a !important;',
                '  position: relative !important;',
                '}',

                /* ---- ПЕРФОРАЦИЯ СВЕРХУ ---- */
                'body[data-layout="filmstrip"] [data-cards-container]::before {',
                '  content: "" !important;',
                '  position: absolute !important;',
                '  left: 0 !important;',
                '  right: 0 !important;',
                '  top: .55em !important;',
                '  height: 14px !important;',
                '  background-image: ' + PERF_SVG + ' !important;',
                '  background-repeat: repeat-x !important;',
                '  background-size: 26px 14px !important;',
                '  background-position: left center !important;',
                '  opacity: .95 !important;',
                '  z-index: 2 !important;',
                '  pointer-events: none !important;',
                '}',

                /* ---- ПЕРФОРАЦИЯ СНИЗУ ---- */
                'body[data-layout="filmstrip"] [data-cards-container]::after {',
                '  content: "" !important;',
                '  position: absolute !important;',
                '  left: 0 !important;',
                '  right: 0 !important;',
                '  bottom: .55em !important;',
                '  height: 14px !important;',
                '  background-image: ' + PERF_SVG + ' !important;',
                '  background-repeat: repeat-x !important;',
                '  background-size: 26px 14px !important;',
                '  background-position: left center !important;',
                '  opacity: .95 !important;',
                '  z-index: 2 !important;',
                '  pointer-events: none !important;',
                '}',

                /* ---- КАДР (КАРТОЧКА) ---- */
                'body[data-layout="filmstrip"] .card {',
                '  aspect-ratio: 4 / 3 !important;',
                '  border-radius: 0 !important;',
                '  overflow: hidden !important;',
                '  background: #000 !important;',
                '  border: 3px solid #0a0a0a !important;',
                '  box-shadow: inset 0 0 0 1px #1a1a1a, 0 8px 16px rgba(0,0,0,.7) !important;',
                '  transition: filter .25s ease, transform .25s ease, border-color .25s ease !important;',
                '  filter: grayscale(100%) contrast(.9) brightness(.8) !important;',
                '  position: relative !important;',
                '}',

                'body[data-layout="filmstrip"] .card img {',
                '  width: 100% !important;',
                '  height: 100% !important;',
                '  object-fit: cover !important;',
                '}',

                'body[data-layout="filmstrip"] .card.focus {',
                '  filter: grayscale(0) contrast(1.1) brightness(1) !important;',
                '  border-color: #f5c518 !important;',
                '  box-shadow: 0 0 0 2px #f5c518, 0 12px 32px rgba(245,197,24,.35) !important;',
                '  transform: scale(1.04) !important;',
                '  z-index: 5 !important;',
                '}',

                'body[data-layout="filmstrip"] .card__title {',
                '  position: absolute !important;',
                '  bottom: 0 !important;',
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
                '}',

                /* ---- БЕЙДЖ "СКОРО" ПОД КАДРОМ ---- */
                'body[data-layout="filmstrip"] .layout-badge.upcoming {',
                '  position: absolute !important;',
                '  left: -3px !important;',
                '  right: -3px !important;',
                '  bottom: -1.8em !important;',
                '  height: 1.6em !important;',
                '  display: flex !important;',
                '  align-items: center !important;',
                '  justify-content: center !important;',
                '  background: linear-gradient(90deg, #ff0090, #ffea00, #00c8ff) !important;',
                '  color: #000 !important;',
                '  font-family: "Courier New", monospace !important;',
                '  font-size: .65em !important;',
                '  font-weight: 700 !important;',
                '  letter-spacing: .1em !important;',
                '  text-transform: uppercase !important;',
                '  z-index: 4 !important;',
                '}',

                /* ---- HEAD ---- */
                'body[data-layout="filmstrip"] .head {',
                '  background: #000 !important;',
                '  border-bottom: 2px solid #f5c518 !important;',
                '}',
                'body[data-layout="filmstrip"] .menu__item.focus {',
                '  background: #f5c518 !important;',
                '  color: #000 !important;',
                '}'
            ].join('\n'),
            apply: function () {
                startObserving();
                addUpcomingBadges();
            }
        },

        // ------------------------------------------------------------
        // КОЛОДА КАРТ — веер карт, вытягивается на фокусе
        // ------------------------------------------------------------
        deckofcards: {
            title: 'Колода карт',
            hint: 'Карточки-карты веером, фокус вытягивает наверх',
            css: [

                /* ---- ФОН ---- */
                'body[data-layout="deckofcards"],',
                'body[data-layout="deckofcards"] .background,',
                'body[data-layout="deckofcards"] .background__layer {',
                '  background: radial-gradient(ellipse at 50% 100%, #0a4d0a 0%, #052005 60%, #000 100%) !important;',
                '  background-image: radial-gradient(ellipse at 50% 100%, #0a4d0a 0%, #052005 60%, #000 100%) !important;',
                '}',
                'body[data-layout="deckofcards"] .background::after,',
                'body[data-layout="deckofcards"] .background::before {',
                '  content: none !important;',
                '  background: none !important;',
                '}',

                /* ---- КОНТЕЙНЕР ---- */
                'body[data-layout="deckofcards"] [data-cards-container] {',
                '  display: flex !important;',
                '  flex-wrap: nowrap !important;',
                '  padding: 3.4em 3em !important;',
                '  overflow-x: auto !important;',
                '  overflow-y: visible !important;',
                '  align-items: center !important;',
                '  background: transparent !important;',
                '  scrollbar-width: none !important;',
                '}',
                'body[data-layout="deckofcards"] [data-cards-container]::-webkit-scrollbar {',
                '  display: none !important;',
                '}',

                /* ---- КАРТА ---- */
                'body[data-layout="deckofcards"] .card {',
                '  flex: 0 0 auto !important;',
                '  width: 11em !important;',
                '  height: 16.5em !important;',
                '  aspect-ratio: unset !important;',
                '  padding: .5em .5em 2em !important;',
                '  background: #fffdf5 !important;',
                '  border: 2px solid #1a1a1a !important;',
                '  border-radius: 9px !important;',
                '  box-shadow: 4px 4px 0 rgba(0,0,0,.45), 6px 8px 14px rgba(0,0,0,.35) !important;',
                '  margin-right: -5em !important;',
                '  transform: rotate(2deg) !important;',
                '  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, z-index 0s !important;',
                '  position: relative !important;',
                '  z-index: 1 !important;',
                '}',

                'body[data-layout="deckofcards"] .card:nth-child(even) {',
                '  transform: rotate(-1.8deg) translateY(.9em) !important;',
                '}',
                'body[data-layout="deckofcards"] .card:nth-child(3n) {',
                '  transform: rotate(1.5deg) translateY(-.5em) !important;',
                '}',

                'body[data-layout="deckofcards"] .card.focus {',
                '  transform: rotate(0deg) translateY(-1.6em) scale(1.1) !important;',
                '  z-index: 20 !important;',
                '  margin-right: -3em !important;',
                '  box-shadow: 8px 8px 0 rgba(0,0,0,.55), 16px 20px 32px rgba(0,0,0,.55), 0 0 0 3px #f5c518 !important;',
                '}',

                'body[data-layout="deckofcards"] .card img {',
                '  width: 100% !important;',
                '  height: 100% !important;',
                '  object-fit: cover !important;',
                '  border-radius: 5px !important;',
                '}',

                'body[data-layout="deckofcards"] .card__title {',
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
            apply: function () {
                startObserving();
            }
        }
    };

    var THEME_ORDER = ['classic', 'filmstrip', 'deckofcards'];

    // ================================================================
    //  ПРИМЕНЕНИЕ / СБРОС
    // ================================================================

    function currentThemeName() {
        return Lampa.Storage.field(STORAGE_KEY) || 'classic';
    }

    function clearPrevious() {
        stopObserving();
        clearBadges();

        var old = document.getElementById(STYLE_ID);
        if (old && old.parentNode) old.parentNode.removeChild(old);

        // Отвязываем атрибут контейнеров, чтобы чужие селекторы не срабатывали
        var tagged = document.querySelectorAll('[' + CARD_ATTR + ']');
        for (var i = 0; i < tagged.length; i++) tagged[i].removeAttribute(CARD_ATTR);

        // Чистим inline-стили фона
        clearBgInline();

        // Убираем временный кейфрейм, если был
        var oldKf = document.getElementById('theme_layout_kf');
        if (oldKf && oldKf.parentNode) oldKf.parentNode.removeChild(oldKf);
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

        // Тэгируем контейнеры ДО применения apply()
        tagContainers();

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

            // Пере-применяем при заходе в новую активность
            Lampa.Listener.follow('activity', function (e) {
                if (e.type !== 'start') return;
                var n = currentThemeName();
                if (n === 'classic') return;
                setTimeout(function () {
                    if (currentThemeName() === n) applyTheme(n);
                }, 80);
            });

            // Периодически перепроверяем фон (Lampa может менять его на лету)
            setInterval(function () {
                if (currentTheme !== 'classic') clearBgInline();
            }, 1500);

            applyTheme(currentThemeName());
            console.log('ThemeLayout v4', 'loaded, current:', currentThemeName());
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
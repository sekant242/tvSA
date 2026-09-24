(function () {
    'use strict';

    var STYLE_ID = 'theme_layout_style';
    var STORAGE_KEY = 'interface_theme_layout';
    var ATTR = 'data-layout';

    var observer = null;
    var currentTheme = 'classic';

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

    function fmtYear(movie) {
        if (!movie) return '';
        var d = movie.release_date || movie.first_air_date || movie.last_air_date || '';
        return (d + '').slice(0, 4);
    }

    function isFuture(movie) {
        if (!movie) return false;
        var d = movie.release_date || movie.first_air_date || '';
        if (!d) return false;
        var t = Date.parse(d);
        return !isNaN(t) && t > Date.now();
    }

    function addBadge(card, cls, text) {
        if (!card || !text) return;
        if (card.querySelector('.layout-badge.' + cls)) return;
        var b = document.createElement('div');
        b.className = 'layout-badge ' + cls;
        b.textContent = text;
        card.appendChild(b);
    }

    function clearBadges() {
        var b = document.querySelectorAll('.layout-badge');
        for (var i = 0; i < b.length; i++) if (b[i].parentNode) b[i].parentNode.removeChild(b[i]);
        var inf = document.querySelectorAll('[data-info]');
        for (var j = 0; j < inf.length; j++) inf[j].removeAttribute('data-info');
    }

    function stopObserving() {
        if (observer) { observer.disconnect(); observer = null; }
    }

    function observeCards(cb) {
        stopObserving();
        var existing = document.querySelectorAll('.card');
        for (var i = 0; i < existing.length; i++) { try { cb(existing[i]); } catch (e) {} }

        observer = new MutationObserver(function (muts) {
            for (var m = 0; m < muts.length; m++) {
                var nodes = muts[m].addedNodes || [];
                for (var n = 0; n < nodes.length; n++) {
                    var node = nodes[n];
                    if (node.nodeType !== 1) continue;
                    if (node.classList && node.classList.contains('card')) { try { cb(node); } catch (e) {} }
                    else if (node.querySelectorAll) {
                        var inner = node.querySelectorAll('.card');
                        for (var k = 0; k < inner.length; k++) { try { cb(inner[k]); } catch (e) {} }
                    }
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // ================================================================
    //  СТРУКТУРА ТЕМ
    // ================================================================

    var THEMES = {

        // ------------------------------------------------------------
        //  КЛАССИКА
        // ------------------------------------------------------------
        classic: {
            title: 'Классика (по умолчанию)',
            hint: 'Стандартный вид Lampa',
            css: '',
            apply: null
        },

        // ============================================================
        //  YOUTUBE — 2.63 карточки на экран + палитра YouTube
        // ============================================================
        youtube: {
            title: 'YouTube',
            hint: 'Лента по 2.5 карточки + тёмная палитра YouTube',
            css: [
                /* --- ЛЕНТА --- */
                '[data-layout="youtube"] .category-full__items,',
                '[data-layout="youtube"] .items-cards,',
                '[data-layout="youtube"] .card-list {',
                '  display: flex !important;',
                '  flex-wrap: nowrap !important;',
                '  gap: 1em !important;',
                '  padding: 1em 2em !important;',
                '  overflow-x: auto !important;',
                '  overflow-y: visible !important;',
                '  scroll-snap-type: x mandatory !important;',
                '  scrollbar-width: none !important;',
                '}',
                '[data-layout="youtube"] .category-full__items::-webkit-scrollbar,',
                '[data-layout="youtube"] .items-cards::-webkit-scrollbar,',
                '[data-layout="youtube"] .card-list::-webkit-scrollbar { display: none !important; }',

                /* --- КАРТОЧКА: 38vw = 2.63 на экран, 16:9 --- */
                '[data-layout="youtube"] .card,',
                '[data-layout="youtube"] .card--category {',
                '  flex: 0 0 38vw !important;',
                '  aspect-ratio: 16 / 9 !important;',
                '  max-height: 55vh !important;',
                '  scroll-snap-align: start !important;',
                '  border-radius: 12px !important;',
                '  overflow: hidden !important;',
                '  background: #0f0f0f !important;',
                '  box-shadow: none !important;',
                '  position: relative !important;',
                '  transition: transform .15s ease, box-shadow .15s ease !important;',
                '}',
                '[data-layout="youtube"] .card__img-wrapper,',
                '[data-layout="youtube"] .card img {',
                '  width: 100% !important;',
                '  height: 100% !important;',
                '  object-fit: cover !important;',
                '  border-radius: 12px !important;',
                '}',
                '[data-layout="youtube"] .card__title {',
                '  position: absolute !important;',
                '  bottom: 0; left: 0; right: 0;',
                '  padding: 2em .8em .6em !important;',
                '  background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,.85) 100%) !important;',
                '  color: #f1f1f1 !important;',
                '  font-family: "Roboto", -apple-system, Arial, sans-serif !important;',
                '  font-weight: 500 !important;',
                '  font-size: .9em !important;',
                '  text-shadow: none !important;',
                '}',
                '[data-layout="youtube"] .card.focus {',
                '  transform: scale(1.02) !important;',
                '  box-shadow: 0 0 0 3px #ff0000, 0 8px 24px rgba(255,0,0,.35) !important;',
                '  z-index: 5 !important;',
                '}',

                /* --- ПАЛИТРА --- */
                '[data-layout="youtube"] body,',
                '[data-layout="youtube"] .background { background: #0f0f0f !important; }',
                '[data-layout="youtube"] .head {',
                '  background: #0f0f0f !important;',
                '  border-bottom: 1px solid #272727 !important;',
                '}',
                '[data-layout="youtube"] .button,',
                '[data-layout="youtube"] .full-start__button {',
                '  background: #212121 !important;',
                '  color: #fff !important;',
                '  border-radius: 18px !important;',
                '  font-weight: 500 !important;',
                '  text-transform: none !important;',
                '}',
                '[data-layout="youtube"] .button.focus,',
                '[data-layout="youtube"] .full-start__button.focus {',
                '  background: #ff0000 !important;',
                '}',
                '[data-layout="youtube"] .selector,',
                '[data-layout="youtube"] .online,',
                '[data-layout="youtube"] .torrent-item,',
                '[data-layout="youtube"] .settings-param {',
                '  background: #181818 !important; border-radius: 8px !important;',
                '}',
                '[data-layout="youtube"] .selector.focus,',
                '[data-layout="youtube"] .online.focus,',
                '[data-layout="youtube"] .torrent-item.focus,',
                '[data-layout="youtube"] .settings-param.focus {',
                '  background: #212121 !important;',
                '  box-shadow: 0 0 0 2px #ff0000 !important;',
                '}',
                '[data-layout="youtube"] .menu__item.focus { background: #ff0000 !important; color: #fff !important; }',

                /* --- БЕЙДЖ --- */
                '[data-layout="youtube"] .layout-badge.duration {',
                '  position: absolute !important;',
                '  bottom: 2.5em; right: .6em;',
                '  background: rgba(0,0,0,.85) !important;',
                '  color: #fff !important;',
                '  padding: .15em .4em !important;',
                '  border-radius: 4px !important;',
                '  font-size: .7em !important;',
                '  font-weight: 700 !important;',
                '  z-index: 3 !important;',
                '}'
            ].join('\n'),
            apply: function () {
                observeCards(function (card) {
                    var m = cardMovie(card);
                    if (!m) return;
                    // Метка "ПРЕМЬЕРА" для будущих релизов
                    if (isFuture(m)) addBadge(card, 'duration', 'ПРЕМЬЕРА');
                });
            }
        },

        // ============================================================
        //  NETFLIX — горизонтальные ряды 16:9 превью, красный glow
        // ============================================================
        netflix: {
            title: 'Netflix',
            hint: 'Ряды 16:9 превью с крупным фокусом, в стиле Netflix',
            css: [
                /* РЯД */
                '[data-layout="netflix"] .category-full__items,',
                '[data-layout="netflix"] .items-cards,',
                '[data-layout="netflix"] .card-list {',
                '  display: flex !important;',
                '  flex-wrap: nowrap !important;',
                '  gap: .6em !important;',
                '  padding: 1.4em 3em !important;',
                '  overflow-x: auto !important;',
                '  overflow-y: visible !important;',
                '  scroll-behavior: smooth !important;',
                '  scrollbar-width: none !important;',
                '}',
                '[data-layout="netflix"] .category-full__items::-webkit-scrollbar,',
                '[data-layout="netflix"] .items-cards::-webkit-scrollbar,',
                '[data-layout="netflix"] .card-list::-webkit-scrollbar { display: none !important; }',

                /* КАРТОЧКА 16:9, ~4.5 на экран */
                '[data-layout="netflix"] .card,',
                '[data-layout="netflix"] .card--category {',
                '  flex: 0 0 22vw !important;',
                '  aspect-ratio: 16 / 9 !important;',
                '  border-radius: 4px !important;',
                '  overflow: hidden !important;',
                '  background: #141414 !important;',
                '  box-shadow: 0 2px 8px rgba(0,0,0,.7) !important;',
                '  transform-origin: center center !important;',
                '  transition: transform .3s cubic-bezier(.2,.8,.2,1), box-shadow .3s ease !important;',
                '  position: relative !important;',
                '}',
                '[data-layout="netflix"] .card__img-wrapper,',
                '[data-layout="netflix"] .card img {',
                '  width: 100% !important;',
                '  height: 100% !important;',
                '  object-fit: cover !important;',
                '}',

                /* Фокус: раскрытие 1.35x + красная аура */
                '[data-layout="netflix"] .card.focus {',
                '  transform: scale(1.35) !important;',
                '  box-shadow: 0 20px 50px rgba(0,0,0,.9), 0 0 0 2px #e50914, 0 0 40px rgba(229,9,20,.6) !important;',
                '  z-index: 20 !important;',
                '}',

                /* Заголовок с большим text-shadow как на Netflix */
                '[data-layout="netflix"] .card__title {',
                '  position: absolute !important;',
                '  bottom: 0; left: 0; right: 0;',
                '  padding: 2.4em .8em .7em !important;',
                '  background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,.95) 100%) !important;',
                '  color: #fff !important;',
                '  font-family: "Helvetica Neue", Arial, sans-serif !important;',
                '  font-weight: 800 !important;',
                '  font-size: .95em !important;',
                '  letter-spacing: -.01em !important;',
                '  text-shadow: 0 2px 6px rgba(0,0,0,.95), 0 1px 2px #000 !important;',
                '}',

                /* Панель вокруг */
                '[data-layout="netflix"] .head {',
                '  background: linear-gradient(180deg, rgba(0,0,0,.98) 0%, rgba(20,20,20,0) 100%) !important;',
                '}',
                '[data-layout="netflix"] body,',
                '[data-layout="netflix"] .background { background: #141414 !important; }',
                '[data-layout="netflix"] .button,',
                '[data-layout="netflix"] .full-start__button {',
                '  background: #e50914 !important; color: #fff !important;',
                '  border-radius: 4px !important; font-weight: 700 !important;',
                '  text-transform: uppercase !important; letter-spacing: .05em !important;',
                '}',
                '[data-layout="netflix"] .button.focus,',
                '[data-layout="netflix"] .full-start__button.focus {',
                '  background: #f6121d !important; box-shadow: 0 0 24px rgba(229,9,20,.7) !important;',
                '}',
                '[data-layout="netflix"] .menu__item.focus { background: #e50914 !important; }'
            ].join('\n'),
            apply: null
        },

        // ============================================================
        //  APPLE TV — минимализм, крупные портреты, огромный scale
        // ============================================================
        appletv: {
            title: 'Apple TV',
            hint: 'Минимализм, крупные постеры, плавный поп на фокусе',
            css: [
                /* Ряд — один ряд по ширине, воздух */
                '[data-layout="appletv"] .category-full__items,',
                '[data-layout="appletv"] .items-cards,',
                '[data-layout="appletv"] .card-list {',
                '  display: flex !important;',
                '  flex-wrap: nowrap !important;',
                '  gap: 2.4em !important;',
                '  padding: 2.4em 3em !important;',
                '  overflow-x: auto !important;',
                '  overflow-y: visible !important;',
                '  align-items: flex-start !important;',
                '  scrollbar-width: none !important;',
                '}',
                '[data-layout="appletv"] .category-full__items::-webkit-scrollbar,',
                '[data-layout="appletv"] .items-cards::-webkit-scrollbar,',
                '[data-layout="appletv"] .card-list::-webkit-scrollbar { display: none !important; }',

                /* Портретные постеры 2:3, 18vw ~ 5.5 шт */
                '[data-layout="appletv"] .card,',
                '[data-layout="appletv"] .card--category {',
                '  flex: 0 0 18vw !important;',
                '  aspect-ratio: 2 / 3 !important;',
                '  border-radius: 10px !important;',
                '  overflow: hidden !important;',
                '  background: #111 !important;',
                '  transition: transform .4s cubic-bezier(.22,1,.36,1), box-shadow .4s ease !important;',
                '  transform-origin: center top !important;',
                '  position: relative !important;',
                '}',
                '[data-layout="appletv"] .card__img-wrapper,',
                '[data-layout="appletv"] .card img {',
                '  width: 100% !important; height: 100% !important;',
                '  object-fit: cover !important; border-radius: 10px !important;',
                '}',

                /* Фокус: 1.25x + тяжёлая тень + белое кольцо */
                '[data-layout="appletv"] .card.focus {',
                '  transform: scale(1.25) !important;',
                '  box-shadow: 0 40px 80px rgba(0,0,0,.9), 0 0 0 3px rgba(255,255,255,.95), 0 0 60px rgba(255,255,255,.25) !important;',
                '  z-index: 20 !important;',
                '}',

                /* Заголовок — тонкий, разреженный, снизу */
                '[data-layout="appletv"] .card__title {',
                '  position: absolute !important;',
                '  bottom: 0; left: 0; right: 0;',
                '  padding: 2.4em 1em .9em !important;',
                '  background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,.9) 100%) !important;',
                '  color: #fff !important;',
                '  font-family: -apple-system, "SF Pro Display", "Helvetica Neue", Arial, sans-serif !important;',
                '  font-weight: 600 !important;',
                '  font-size: .9em !important;',
                '  letter-spacing: .01em !important;',
                '  text-shadow: none !important;',
                '}',
                '[data-layout="appletv"] .card__age { display: none !important; }',

                /* Панель — стекло */
                '[data-layout="appletv"] body,',
                '[data-layout="appletv"] .background { background: #000 !important; }',
                '[data-layout="appletv"] .head {',
                '  background: rgba(0,0,0,.65) !important;',
                '  -webkit-backdrop-filter: blur(24px) !important;',
                '  backdrop-filter: blur(24px) !important;',
                '}',
                '[data-layout="appletv"] .button,',
                '[data-layout="appletv"] .full-start__button {',
                '  background: rgba(255,255,255,.15) !important;',
                '  color: #fff !important;',
                '  border-radius: 12px !important;',
                '  border: 1px solid rgba(255,255,255,.25) !important;',
                '  font-weight: 500 !important;',
                '  -webkit-backdrop-filter: blur(20px) !important;',
                '  backdrop-filter: blur(20px) !important;',
                '}',
                '[data-layout="appletv"] .button.focus,',
                '[data-layout="appletv"] .full-start__button.focus {',
                '  background: rgba(255,255,255,.95) !important;',
                '  color: #000 !important;',
                '  transform: scale(1.05) !important;',
                '}',
                '[data-layout="appletv"] .menu__item.focus {',
                '  background: rgba(255,255,255,.2) !important; border-radius: 10px !important;',
                '}'
            ].join('\n'),
            apply: null
        },

        // ============================================================
        //  IMDb — компактные строки-таблица, 2 колонки
        // ============================================================
        imdb: {
            title: 'IMDb',
            hint: 'Плотные строки-таблица с постером, названием и рейтингом',
            css: [
                '[data-layout="imdb"] .category-full__items,',
                '[data-layout="imdb"] .items-cards,',
                '[data-layout="imdb"] .card-list {',
                '  display: grid !important;',
                '  grid-template-columns: repeat(2, 1fr) !important;',
                '  gap: .4em 1em !important;',
                '  padding: 1em 2em !important;',
                '}',

                /* Карточка — горизонтальная строка */
                '[data-layout="imdb"] .card,',
                '[data-layout="imdb"] .card--category {',
                '  display: grid !important;',
                '  grid-template-columns: 3.2em 1fr auto !important;',
                '  gap: .8em !important;',
                '  align-items: center !important;',
                '  width: 100% !important;',
                '  height: 4.4em !important;',
                '  min-height: 4.4em !important;',
                '  aspect-ratio: unset !important;',
                '  padding: .3em .5em !important;',
                '  background: #1a1a1a !important;',
                '  border-radius: 4px !important;',
                '  overflow: hidden !important;',
                '  transition: background .15s ease !important;',
                '}',

                /* Миниатюра слева */
                '[data-layout="imdb"] .card__img-wrapper {',
                '  width: 3.2em !important; height: 4em !important;',
                '  overflow: hidden !important; border-radius: 3px !important;',
                '}',
                '[data-layout="imdb"] .card img {',
                '  width: 100% !important; height: 100% !important;',
                '  object-fit: cover !important; border-radius: 3px !important;',
                '}',

                /* Заголовок в центре */
                '[data-layout="imdb"] .card__title {',
                '  position: static !important;',
                '  background: transparent !important;',
                '  color: #fff !important;',
                '  padding: 0 !important;',
                '  font-family: -apple-system, "Roboto", Arial, sans-serif !important;',
                '  font-size: .95em !important;',
                '  font-weight: 500 !important;',
                '  line-height: 1.2 !important;',
                '  overflow: hidden !important;',
                '  text-overflow: ellipsis !important;',
                '  white-space: nowrap !important;',
                '  text-shadow: none !important;',
                '}',

                '[data-layout="imdb"] .card.focus {',
                '  background: #2e2e2e !important;',
                '  box-shadow: inset 4px 0 0 #f5c518, 0 0 0 1px #f5c518 !important;',
                '}',

                /* Жёлтый бейдж рейтинга справа */
                '[data-layout="imdb"] .layout-badge.rating {',
                '  position: static !important;',
                '  background: #f5c518 !important;',
                '  color: #000 !important;',
                '  font-weight: 800 !important;',
                '  padding: .35em .55em !important;',
                '  border-radius: 3px !important;',
                '  font-size: .85em !important;',
                '  line-height: 1 !important;',
                '}',

                '[data-layout="imdb"] body,',
                '[data-layout="imdb"] .background { background: #121212 !important; }',
                '[data-layout="imdb"] .head { background: #121212 !important; border-bottom: 1px solid #222 !important; }'
            ].join('\n'),
            apply: function () {
                observeCards(function (card) {
                    var m = cardMovie(card);
                    var text = '';
                    if (m) {
                        var r = m.vote_average || m.imdb_rating || m.kp_rating;
                        if (r && +r > 0) text = (+r).toFixed(1);
                    }
                    if (!text) {
                        var y = fmtYear(m);
                        if (y) text = y;
                    }
                    if (text) addBadge(card, 'rating', text);
                });
            }
        },

        // ============================================================
        //  ЖУРНАЛ — белый фон, чёрный текст, serif
        // ============================================================
        magazine: {
            title: 'Журнал',
            hint: 'Белый фон, чёрный текст, serif, развороты',
            css: [
                '[data-layout="magazine"] body,',
                '[data-layout="magazine"] .background { background: #ffffff !important; }',

                '[data-layout="magazine"] .category-full__items,',
                '[data-layout="magazine"] .items-cards,',
                '[data-layout="magazine"] .card-list {',
                '  display: grid !important;',
                '  grid-template-columns: 1fr !important;',
                '  gap: 1.2em !important;',
                '  padding: 1em 3em !important;',
                '  max-width: 90em !important;',
                '  margin: 0 auto !important;',
                '}',

                '[data-layout="magazine"] .card,',
                '[data-layout="magazine"] .card--category {',
                '  display: grid !important;',
                '  grid-template-columns: 9em 1fr !important;',
                '  gap: 1.8em !important;',
                '  padding: 1.2em !important;',
                '  background: #ffffff !important;',
                '  color: #000000 !important;',
                '  border: none !important;',
                '  border-left: 6px solid #c00 !important;',
                '  border-radius: 0 !important;',
                '  aspect-ratio: unset !important;',
                '  height: auto !important;',
                '  min-height: 12em !important;',
                '  align-items: stretch !important;',
                '  box-shadow: 0 1px 0 rgba(0,0,0,.08) !important;',
                '}',

                '[data-layout="magazine"] .card__img-wrapper {',
                '  width: 9em !important;',
                '  height: 100% !important;',
                '  max-height: 13em !important;',
                '  overflow: hidden !important;',
                '}',
                '[data-layout="magazine"] .card img {',
                '  width: 100% !important;',
                '  height: 100% !important;',
                '  object-fit: cover !important;',
                '  border-radius: 0 !important;',
                '  filter: contrast(1.05) !important;',
                '}',

                '[data-layout="magazine"] .card__title {',
                '  position: static !important;',
                '  align-self: start !important;',
                '  background: transparent !important;',
                '  color: #000000 !important;',
                '  font-family: Georgia, "Times New Roman", serif !important;',
                '  font-size: 1.5em !important;',
                '  font-weight: 700 !important;',
                '  line-height: 1.15 !important;',
                '  text-shadow: none !important;',
                '  padding: 0 0 .4em !important;',
                '  border-bottom: 1px solid #000 !important;',
                '}',

                '[data-layout="magazine"] .card.focus {',
                '  background: #fafafa !important;',
                '  box-shadow: 0 0 0 2px #000 inset, 6px 6px 0 rgba(0,0,0,.12) !important;',
                '}',

                /* Панель и меню — светлые */
                '[data-layout="magazine"] .head {',
                '  background: #ffffff !important;',
                '  color: #000 !important;',
                '  border-bottom: 2px solid #000 !important;',
                '}',
                '[data-layout="magazine"] .head * { color: #000 !important; }',
                '[data-layout="magazine"] .menu__item.focus { background: #000 !important; color: #fff !important; }',
                '[data-layout="magazine"] .button,',
                '[data-layout="magazine"] .full-start__button {',
                '  background: #fff !important; color: #000 !important;',
                '  border: 2px solid #000 !important; border-radius: 0 !important;',
                '  font-family: Georgia, serif !important;',
                '  text-transform: uppercase !important; letter-spacing: .08em !important;',
                '}',
                '[data-layout="magazine"] .button.focus,',
                '[data-layout="magazine"] .full-start__button.focus {',
                '  background: #c00 !important; color: #fff !important; border-color: #c00 !important;',
                '}',
                '[data-layout="magazine"] .selector,',
                '[data-layout="magazine"] .online,',
                '[data-layout="magazine"] .settings-param {',
                '  background: #fff !important; color: #000 !important;',
                '  border: 1px solid #000 !important; border-radius: 0 !important;',
                '}',
                '[data-layout="magazine"] .selector.focus,',
                '[data-layout="magazine"] .online.focus,',
                '[data-layout="magazine"] .settings-param.focus {',
                '  background: #fff5f5 !important;',
                '  box-shadow: 4px 4px 0 rgba(0,0,0,.75) !important;',
                '}',
                '[data-layout="magazine"] .modal,',
                '[data-layout="magazine"] .modal__content {',
                '  background: #fff !important; color: #000 !important;',
                '  border: 2px solid #000 !important; border-radius: 0 !important;',
                '}',
                '[data-layout="magazine"] .modal * { color: #000 !important; }'
            ].join('\n'),
            apply: null
        },

        // ============================================================
        //  КИНОЛЕНТА — кадры ч/б, дырочки снизу, под лентой — цветные
        //             «ближайшие выходы эпизодов»
        // ============================================================
        filmstrip: {
            title: 'Кинолента',
            hint: 'Ч/б кадры 35мм, перфорация снизу, цветные релизы',
            css: [
                '[data-layout="filmstrip"] body,',
                '[data-layout="filmstrip"] .background { background: #050505 !important; }',

                /* Ряд с сеткой кадров */
                '[data-layout="filmstrip"] .category-full__items,',
                '[data-layout="filmstrip"] .items-cards,',
                '[data-layout="filmstrip"] .card-list {',
                '  display: grid !important;',
                '  grid-template-columns: repeat(auto-fill, minmax(14vw, 1fr)) !important;',
                '  gap: 1.8em 1.4em !important;',
                '  padding: 2em 2em 3.5em !important;',
                '  background: #050505 !important;',
                '  position: relative !important;',
                '}',

                /* Перфорация снизу всей ленты */
                '[data-layout="filmstrip"] .category-full__items::after,',
                '[data-layout="filmstrip"] .items-cards::after,',
                '[data-layout="filmstrip"] .card-list::after {',
                '  content: "" !important;',
                '  position: absolute !important;',
                '  left: 0; right: 0; bottom: 1.2em !important;',
                '  height: 1em !important;',
                '  background:',
                '    radial-gradient(circle, transparent 0 3px, #f5c518 3px 4.5px, transparent 4.5px 9px) !important;',
                '  background-size: 24px 100% !important;',
                '  background-repeat: repeat-x !important;',
                '  background-position: center center !important;',
                '  opacity: .8 !important;',
                '  pointer-events: none !important;',
                '}',

                /* Кадр 4:3, ч/б пока не в фокусе */
                '[data-layout="filmstrip"] .card,',
                '[data-layout="filmstrip"] .card--category {',
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
                '[data-layout="filmstrip"] .card__img-wrapper,',
                '[data-layout="filmstrip"] .card img {',
                '  width: 100% !important; height: 100% !important;',
                '  object-fit: cover !important;',
                '}',

                '[data-layout="filmstrip"] .card.focus {',
                '  filter: grayscale(0) contrast(1.1) brightness(1) !important;',
                '  border-color: #f5c518 !important;',
                '  box-shadow: 0 0 0 2px #f5c518, 0 12px 32px rgba(245,197,24,.3) !important;',
                '  transform: scale(1.04) !important;',
                '  z-index: 5 !important;',
                '}',

                '[data-layout="filmstrip"] .card__title {',
                '  position: absolute !important;',
                '  bottom: 0; left: 0; right: 0;',
                '  padding: 1.6em .6em .5em !important;',
                '  background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,.95) 100%) !important;',
                '  color: #f5c518 !important;',
                '  font-family: "Courier New", monospace !important;',
                '  font-size: .78em !important;',
                '  letter-spacing: .06em !important;',
                '  text-transform: uppercase !important;',
                '  text-shadow: none !important;',
                '}',

                /* Бейдж будущего релиза — цветной, под карточкой */
                '[data-layout="filmstrip"] .layout-badge.upcoming {',
                '  position: absolute !important;',
                '  left: -3px; right: -3px; bottom: -1.7em !important;',
                '  height: 1.5em !important;',
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

                '[data-layout="filmstrip"] .head {',
                '  background: #000 !important;',
                '  border-bottom: 2px solid #f5c518 !important;',
                '}',
                '[data-layout="filmstrip"] .menu__item.focus { background: #f5c518 !important; color: #000 !important; }'
            ].join('\n'),
            apply: function () {
                observeCards(function (card) {
                    var m = cardMovie(card);
                    if (m && isFuture(m)) {
                        var d = m.release_date || m.first_air_date;
                        var label = 'СКОРО · ' + d;
                        addBadge(card, 'upcoming', label);
                    }
                });
            }
        },

        // ============================================================
        //  STORY — вертикальные 9:16, выбранная раскрывается, картинка
        //          полностью заполняет карточку
        // ============================================================
        story: {
            title: 'Story',
            hint: 'Вертикальные карточки-сторис 9:16, фокус-раскрытие',
            css: [
                '[data-layout="story"] .category-full__items,',
                '[data-layout="story"] .items-cards,',
                '[data-layout="story"] .card-list {',
                '  display: flex !important;',
                '  flex-wrap: nowrap !important;',
                '  gap: 1.2em !important;',
                '  padding: 2em !important;',
                '  overflow-x: auto !important;',
                '  overflow-y: hidden !important;',
                '  align-items: center !important;',
                '  scrollbar-width: none !important;',
                '  height: auto !important;',
                '}',
                '[data-layout="story"] .category-full__items::-webkit-scrollbar,',
                '[data-layout="story"] .items-cards::-webkit-scrollbar,',
                '[data-layout="story"] .card-list::-webkit-scrollbar { display: none !important; }',

                /* Стори — вертикальный прямоугольник со скруглением */
                '[data-layout="story"] .card,',
                '[data-layout="story"] .card--category {',
                '  flex: 0 0 8em !important;',
                '  width: 8em !important;',
                '  height: 14em !important;',
                '  aspect-ratio: unset !important;',
                '  border-radius: 44px !important;',
                '  overflow: hidden !important;',
                '  position: relative !important;',
                '  background: linear-gradient(135deg, #ff0090, #ffea00, #00c8ff) !important;',
                '  padding: 3px !important;',
                '  transition: all .35s cubic-bezier(.22,1,.36,1) !important;',
                '}',

                /* img-wrapper должен полностью занять карточку */
                '[data-layout="story"] .card__img-wrapper {',
                '  position: absolute !important;',
                '  top: 3px; left: 3px; right: 3px; bottom: 3px !important;',
                '  width: auto !important;',
                '  height: auto !important;',
                '  overflow: hidden !important;',
                '  border-radius: 41px !important;',
                '  background: #111 !important;',
                '}',
                '[data-layout="story"] .card img {',
                '  width: 100% !important;',
                '  height: 100% !important;',
                '  object-fit: cover !important;',
                '  border-radius: 41px !important;',
                '  display: block !important;',
                '}',

                /* Фокус: расширение + градиентное кольцо */
                '[data-layout="story"] .card.focus {',
                '  flex: 0 0 11em !important;',
                '  width: 11em !important;',
                '  height: 19em !important;',
                '  box-shadow: 0 20px 60px rgba(255,0,144,.5), 0 0 40px rgba(0,200,255,.4) !important;',
                '  z-index: 10 !important;',
                '}',

                '[data-layout="story"] .card__title {',
                '  position: absolute !important;',
                '  bottom: 1.4em; left: 0; right: 0;',
                '  text-align: center !important;',
                '  background: transparent !important;',
                '  color: #fff !important;',
                '  font-size: .75em !important;',
                '  font-weight: 700 !important;',
                '  text-shadow: 0 2px 8px rgba(0,0,0,.95), 0 0 4px #000 !important;',
                '  padding: 0 .4em !important;',
                '  z-index: 3 !important;',
                '}',

                '[data-layout="story"] body,',
                '[data-layout="story"] .background { background: #0e0e0e !important; }',
                '[data-layout="story"] .head {',
                '  background: #0e0e0e !important;',
                '  border-bottom: 2px solid transparent !important;',
                '  border-image: linear-gradient(90deg, #ff0090, #ffea00, #00c8ff) 1 !important;',
                '}'
            ].join('\n'),
            apply: null
        },

        // ============================================================
        //  ТАЙМЛАЙН — одна широкая карточка, ограничение 32vh
        // ============================================================
        timeline: {
            title: 'Таймлайн',
            hint: 'Лента: одна широкая карточка, ограничена по высоте',
            css: [
                '[data-layout="timeline"] .category-full__items,',
                '[data-layout="timeline"] .items-cards,',
                '[data-layout="timeline"] .card-list {',
                '  display: flex !important;',
                '  flex-direction: column !important;',
                '  gap: 1.4em !important;',
                '  padding: 1em 3em !important;',
                '  max-width: 70em !important;',
                '  margin: 0 auto !important;',
                '  overflow-y: auto !important;',
                '}',

                '[data-layout="timeline"] .card,',
                '[data-layout="timeline"] .card--category {',
                '  display: block !important;',
                '  width: 100% !important;',
                '  height: 32vh !important;',
                '  max-height: 32vh !important;',
                '  min-height: 14em !important;',
                '  aspect-ratio: unset !important;',
                '  border-radius: 12px !important;',
                '  overflow: hidden !important;',
                '  background: #0d0d0d !important;',
                '  box-shadow: 0 4px 20px rgba(0,0,0,.7) !important;',
                '  transition: box-shadow .25s ease !important;',
                '  position: relative !important;',
                '}',

                '[data-layout="timeline"] .card__img-wrapper,',
                '[data-layout="timeline"] .card img {',
                '  width: 100% !important; height: 100% !important;',
                '  object-fit: cover !important;',
                '}',

                '[data-layout="timeline"] .card::before {',
                '  content: "" !important;',
                '  position: absolute !important;',
                '  left: 0; right: 0; bottom: 0; top: 35% !important;',
                '  background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,.9) 100%) !important;',
                '  pointer-events: none !important;',
                '  z-index: 1 !important;',
                '}',

                '[data-layout="timeline"] .card__title {',
                '  position: absolute !important;',
                '  left: 2em !important; bottom: 1.4em !important; right: 2em !important;',
                '  background: transparent !important;',
                '  color: #fff !important;',
                '  font-size: 1.3em !important;',
                '  font-weight: 700 !important;',
                '  z-index: 2 !important;',
                '  text-shadow: 0 2px 8px rgba(0,0,0,.9) !important;',
                '}',

                '[data-layout="timeline"] .card.focus {',
                '  box-shadow: 0 8px 40px rgba(255,255,255,.15), 0 0 0 3px #fff !important;',
                '}',

                '[data-layout="timeline"] body,',
                '[data-layout="timeline"] .background { background: #0a0a0a !important; }',
                '[data-layout="timeline"] .head {',
                '  background: #0a0a0a !important;',
                '  border-bottom: 1px solid #222 !important;',
                '}'
            ].join('\n'),
            apply: null
        },

        // ============================================================
        //  КНИЖНАЯ ПОЛКА — деревянная полка + мини-постер + вертикальный
        //                 корешок с названием
        // ============================================================
        bookshelf: {
            title: 'Книжная полка',
            hint: 'Деревянная полка, постер + вертикальный корешок',
            css: [
                '[data-layout="bookshelf"] body,',
                '[data-layout="bookshelf"] .background {',
                '  background: #1a0f08 !important;',
                '  background-image:',
                '    radial-gradient(ellipse at center, rgba(90,50,20,.25) 0%, transparent 70%) !important;',
                '}',

                '[data-layout="bookshelf"] .category-full__items,',
                '[data-layout="bookshelf"] .items-cards,',
                '[data-layout="bookshelf"] .card-list {',
                '  display: grid !important;',
                '  grid-template-columns: repeat(auto-fill, minmax(9em, 1fr)) !important;',
                '  gap: 2em 1.4em !important;',
                '  padding: 1.5em 2.5em 3.5em !important;',
                '  align-items: end !important;',
                '  background: #1a0f08 !important;',
                '  position: relative !important;',
                '  /* Деревянная полка под рядом */',
                '  border-bottom: 1.4em solid #5a2e10 !important;',
                '  background-image:',
                '    linear-gradient(180deg,',
                '      transparent 0%,',
                '      transparent calc(100% - 1.4em),',
                '      #7a3e14 calc(100% - 1.4em),',
                '      #4a230c calc(100% - 0.4em),',
                '      #2a1204 100%) !important;',
                '  box-shadow: 0 14px 30px rgba(0,0,0,.7) !important;',
                '}',

                /* «Древесные волокна» на полке */
                '[data-layout="bookshelf"] .category-full__items::after,',
                '[data-layout="bookshelf"] .items-cards::after,',
                '[data-layout="bookshelf"] .card-list::after {',
                '  content: "" !important;',
                '  position: absolute !important;',
                '  left: 0; right: 0; bottom: 0 !important;',
                '  height: 1.4em !important;',
                '  background:',
                '    repeating-linear-gradient(90deg,',
                '      rgba(0,0,0,.15) 0 4px,',
                '      transparent 4px 9px,',
                '      rgba(255,255,255,.04) 9px 13px,',
                '      transparent 13px 22px) !important;',
                '  pointer-events: none !important;',
                '}',

                /* Карточка: мини-постер + вертикальный корешок */
                '[data-layout="bookshelf"] .card,',
                '[data-layout="bookshelf"] .card--category {',
                '  display: flex !important;',
                '  flex-direction: column !important;',
                '  align-items: center !important;',
                '  width: 100% !important;',
                '  height: auto !important;',
                '  aspect-ratio: unset !important;',
                '  background: transparent !important;',
                '  border: none !important;',
                '  box-shadow: none !important;',
                '  padding: 0 !important;',
                '  transition: transform .25s ease !important;',
                '  transform-origin: bottom center !important;',
                '}',

                /* Мини-постер */
                '[data-layout="bookshelf"] .card__img-wrapper {',
                '  width: 4.5em !important;',
                '  height: 6.5em !important;',
                '  overflow: hidden !important;',
                '  border-radius: 3px !important;',
                '  box-shadow: 0 6px 14px rgba(0,0,0,.7) !important;',
                '  margin-bottom: .6em !important;',
                '  border: 1px solid rgba(255,255,255,.15) !important;',
                '}',
                '[data-layout="bookshelf"] .card img {',
                '  width: 100% !important;',
                '  height: 100% !important;',
                '  object-fit: cover !important;',
                '}',

                /* Вертикальный корешок (fallback, если нет логотипа) */
                '[data-layout="bookshelf"] .card__title {',
                '  position: static !important;',
                '  writing-mode: vertical-rl !important;',
                '  text-orientation: mixed !important;',
                '  transform: rotate(180deg) !important;',
                '  max-height: 6em !important;',
                '  overflow: hidden !important;',
                '  text-overflow: ellipsis !important;',
                '  white-space: nowrap !important;',
                '  background: linear-gradient(180deg, #3a1c08, #5a2e10) !important;',
                '  color: #f5c518 !important;',
                '  font-family: Georgia, "Times New Roman", serif !important;',
                '  font-weight: 700 !important;',
                '  font-size: .75em !important;',
                '  letter-spacing: .12em !important;',
                '  padding: .5em .3em !important;',
                '  border-radius: 2px !important;',
                '  border: 1px solid rgba(245,197,24,.4) !important;',
                '  text-shadow: 0 0 4px rgba(245,197,24,.4) !important;',
                '  box-shadow: 0 4px 8px rgba(0,0,0,.6) !important;',
                '}',

                /* Фокус: «выдвигаем книгу с полки» */
                '[data-layout="bookshelf"] .card.focus {',
                '  transform: translateY(-1.4em) scale(1.1) !important;',
                '}',
                '[data-layout="bookshelf"] .card.focus .card__img-wrapper {',
                '  box-shadow: 0 12px 24px rgba(0,0,0,.9), 0 0 0 3px #f5c518 !important;',
                '}',
                '[data-layout="bookshelf"] .card.focus .card__title {',
                '  background: linear-gradient(180deg, #5a2e10, #7a3e14) !important;',
                '  color: #ffea00 !important;',
                '  border-color: #ffea00 !important;',
                '  box-shadow: 0 8px 16px rgba(0,0,0,.8), 0 0 20px rgba(255,234,0,.5) !important;',
                '}',

                '[data-layout="bookshelf"] .head {',
                '  background: #1a0f08 !important;',
                '  border-bottom: 2px solid #5a2e10 !important;',
                '}',
                '[data-layout="bookshelf"] .menu__item.focus { background: #5a2e10 !important; color: #f5c518 !important; }',
                '[data-layout="bookshelf"] .button,',
                '[data-layout="bookshelf"] .full-start__button {',
                '  background: #5a2e10 !important; color: #f5c518 !important;',
                '  border: 1px solid #f5c518 !important; border-radius: 4px !important;',
                '  font-family: Georgia, serif !important;',
                '}',
                '[data-layout="bookshelf"] .button.focus,',
                '[data-layout="bookshelf"] .full-start__button.focus {',
                '  background: #f5c518 !important; color: #1a0f08 !important;',
                '}'
            ].join('\n'),
            apply: null
        },

        // ============================================================
        //  ИНФО-ТЕМА — при фокусе показывает год/жанры/рейтинг/описание
        // ============================================================
        info: {
            title: 'Инфо-карточки',
            hint: 'При фокусе показывает год, жанры, рейтинг и описание',
            css: [
                '[data-layout="info"] body,',
                '[data-layout="info"] .background { background: #0c0c0c !important; }',

                '[data-layout="info"] .category-full__items,',
                '[data-layout="info"] .items-cards,',
                '[data-layout="info"] .card-list {',
                '  display: grid !important;',
                '  grid-template-columns: repeat(auto-fill, minmax(20vw, 1fr)) !important;',
                '  gap: 1.4em !important;',
                '  padding: 1.5em 2em !important;',
                '}',

                '[data-layout="info"] .card,',
                '[data-layout="info"] .card--category {',
                '  aspect-ratio: 2 / 3 !important;',
                '  border-radius: 14px !important;',
                '  overflow: hidden !important;',
                '  background: #161616 !important;',
                '  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease !important;',
                '  transform-origin: center center !important;',
                '  position: relative !important;',
                '  box-shadow: 0 6px 18px rgba(0,0,0,.6) !important;',
                '}',
                '[data-layout="info"] .card__img-wrapper,',
                '[data-layout="info"] .card img {',
                '  width: 100% !important;',
                '  height: 100% !important;',
                '  object-fit: cover !important;',
                '}',

                /* Обычный (не сфокусированный) — просто постер + название снизу */
                '[data-layout="info"] .card__title {',
                '  position: absolute !important;',
                '  bottom: 0; left: 0; right: 0;',
                '  padding: 2em .8em .7em !important;',
                '  background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,.9) 100%) !important;',
                '  color: #fff !important;',
                '  font-weight: 600 !important;',
                '  font-size: .9em !important;',
                '  text-shadow: 0 2px 6px rgba(0,0,0,.9) !important;',
                '  z-index: 2 !important;',
                '  transition: opacity .25s ease !important;',
                '}',

                /* Инфо-панель снизу — показывается ТОЛЬКО на фокусе */
                '[data-layout="info"] .card::after {',
                '  content: attr(data-info) !important;',
                '  position: absolute !important;',
                '  left: 0; right: 0; bottom: 0 !important;',
                '  max-height: 75% !important;',
                '  overflow: hidden !important;',
                '  padding: 1.2em 1em 1em !important;',
                '  background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.85) 20%, rgba(0,0,0,.98) 100%) !important;',
                '  color: #eaeaea !important;',
                '  font-size: .78em !important;',
                '  font-weight: 400 !important;',
                '  line-height: 1.4 !important;',
                '  white-space: pre-wrap !important;',
                '  opacity: 0 !important;',
                '  pointer-events: none !important;',
                '  z-index: 3 !important;',
                '  transition: opacity .3s ease !important;',
                '  box-sizing: border-box !important;',
                '}',

                '[data-layout="info"] .card.focus {',
                '  transform: scale(1.12) !important;',
                '  z-index: 15 !important;',
                '  box-shadow: 0 24px 60px rgba(0,0,0,.9), 0 0 0 2px rgba(255,255,255,.85) !important;',
                '}',
                '[data-layout="info"] .card.focus .card__title {',
                '  opacity: 0 !important;',
                '}',
                '[data-layout="info"] .card.focus::after {',
                '  opacity: 1 !important;',
                '}',

                /* Дополнительная метка: рейтинг в углу */
                '[data-layout="info"] .layout-badge.score {',
                '  position: absolute !important;',
                '  top: .6em; right: .6em !important;',
                '  background: rgba(0,0,0,.75) !important;',
                '  color: #f5c518 !important;',
                '  font-weight: 800 !important;',
                '  padding: .3em .55em !important;',
                '  border-radius: 6px !important;',
                '  font-size: .8em !important;',
                '  z-index: 4 !important;',
                '  border: 1px solid rgba(245,197,24,.5) !important;',
                '}',

                '[data-layout="info"] .head {',
                '  background: rgba(12,12,12,.85) !important;',
                '  -webkit-backdrop-filter: blur(20px) !important;',
                '  backdrop-filter: blur(20px) !important;',
                '}',
                '[data-layout="info"] .menu__item.focus { background: #2a2a2a !important; border-radius: 10px !important; }'
            ].join('\n'),
            apply: function () {
                observeCards(function (card) {
                    var m = cardMovie(card);
                    if (!m) return;

                    var parts = [];

                    // Строка 1: год · жанры · рейтинг
                    var head = [];
                    var y = fmtYear(m);
                    if (y) head.push(y);

                    if (m.genres && m.genres.length) {
                        var g = [];
                        for (var i = 0; i < m.genres.length && i < 3; i++) {
                            g.push(m.genres[i].name || m.genres[i]);
                        }
                        if (g.length) head.push(g.join(', '));
                    }

                    var rating = m.vote_average || m.imdb_rating || m.kp_rating || 0;
                    if (+rating > 0) {
                        head.push('★ ' + (+rating).toFixed(1));
                        addBadge(card, 'score', (+rating).toFixed(1));
                    }

                    if (head.length) parts.push(head.join('  ·  '));

                    // Строка 2: описание
                    var overview = m.overview || m.description || '';
                    if (overview) {
                        if (overview.length > 220) overview = overview.slice(0, 217) + '...';
                        parts.push('');
                        parts.push(overview);
                    }

                    if (parts.length) card.setAttribute('data-info', parts.join('\n'));
                });
            }
        }
    };

    // Порядок тем в настройках
    var THEME_ORDER = [
        'classic',
        'youtube', 'netflix', 'appletv', 'imdb',
        'magazine', 'filmstrip', 'story', 'timeline',
        'bookshelf', 'info'
    ];

    // ================================================================
    //  ПРИМЕНЕНИЕ
    // ================================================================

    function currentThemeName() {
        return Lampa.Storage.field(STORAGE_KEY) || 'classic';
    }

    function clearPrevious() {
        stopObserving();
        clearBadges();

        var old = document.getElementById(STYLE_ID);
        if (old && old.parentNode) old.parentNode.removeChild(old);
    }

    function applyTheme(name) {
        clearPrevious();
        currentTheme = name;

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

        if (typeof theme.apply === 'function') {
            try { theme.apply(); }
            catch (e) { console.warn('ThemePack apply error:', e); }
        }
    }

    function buildValues() {
        var values = {};
        THEME_ORDER.forEach(function (key) {
            if (THEMES[key]) values[key] = THEMES[key].title;
        });
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
                    ru: 'Тема оформления (layout)',
                    uk: 'Тема оформлення (layout)',
                    be: 'Тэма афармлення (layout)',
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
                field: {
                    name: Lampa.Lang.translate('theme_layout_setting')
                },
                onChange: function () {
                    var name = currentThemeName();
                    applyTheme(name);
                    var t = THEMES[name];
                    if (t && name !== 'classic') Lampa.Noty.show('🎬 ' + t.title);
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

            // Ре-применяем при появлении новых активностей (карточки могли перерисоваться)
            Lampa.Listener.follow('activity', function (e) {
                if (e.type !== 'start') return;
                var n = currentThemeName();
                if (n === 'classic') return;
                // Небольшая задержка — даём DOM'у построиться
                setTimeout(function () {
                    if (currentThemeName() === n) applyTheme(n);
                }, 60);
            });

            applyTheme(currentThemeName());
            console.log('ThemeLayout v2', 'loaded, current:', currentThemeName());
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
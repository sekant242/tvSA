(function () {
    'use strict';

    var STYLE_ID = 'theme_layout_style';
    var STORAGE_KEY = 'interface_theme_layout';
    var ATTR = 'data-layout';

    var observer = null;
    var currentTheme = 'classic';
    var origBgImmediately = null;
    var origBgShow = null;

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

    function fmtYear(m) {
        if (!m) return '';
        var d = m.release_date || m.first_air_date || m.last_air_date || '';
        return (d + '').slice(0, 4);
    }

    function isFuture(m) {
        if (!m) return false;
        var d = m.release_date || m.first_air_date || '';
        if (!d) return false;
        var t = Date.parse(d);
        return !isNaN(t) && t > Date.now();
    }

    function stripTags(s) { return String(s || '').replace(/<[^>]+>/g, '').trim(); }

    function addBadge(card, cls, text) {
        if (!card || !text) return;
        if (card.querySelector('.layout-badge.' + cls)) return;
        var b = document.createElement('div');
        b.className = 'layout-badge ' + cls;
        b.textContent = text;
        card.appendChild(b);
    }

    function addDesc(card, text) {
        if (!card || !text) return;
        if (card.querySelector('.layout-desc')) return;
        var d = document.createElement('div');
        d.className = 'layout-desc';
        d.textContent = text;
        card.appendChild(d);
    }

    function clearExtras() {
        ['layout-badge', 'layout-desc'].forEach(function (c) {
            var els = document.querySelectorAll('.' + c);
            for (var i = 0; i < els.length; i++) if (els[i].parentNode) els[i].parentNode.removeChild(els[i]);
        });
        var inf = document.querySelectorAll('[data-info]');
        for (var j = 0; j < inf.length; j++) inf[j].removeAttribute('data-info');
    }

    function stopObserving() { if (observer) { observer.disconnect(); observer = null; } }

    function observeCards(cb) {
        stopObserving();
        var cur = document.querySelectorAll('.card');
        for (var i = 0; i < cur.length; i++) { try { cb(cur[i]); } catch (e) {} }

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

    // Базовые селекторы контейнеров карточек
    var SEL_LIST = [
        '.category-full__items',
        '.items-cards',
        '.card-list',
        '.simple-list'
    ].join(', ');

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
        // 1. ТЬЮБ (а-ля YouTube) — постер 2:3 слева, описание справа
        // ------------------------------------------------------------
        tube: {
            title: 'Тьюб',
            hint: 'Постер слева, справа название и описание',
            css: [
                '[data-layout="tube"] body,',
                '[data-layout="tube"] .background { background: #0f0f0f !important; background-image: none !important; }',

                /* Сетка в одну колонку, умеренной ширины */
                '[data-layout="tube"] ' + '.category-full__items,',
                '[data-layout="tube"] .items-cards,',
                '[data-layout="tube"] .card-list {',
                '  display: grid !important;',
                '  grid-template-columns: 1fr !important;',
                '  gap: .7em !important;',
                '  padding: 1.2em 3em !important;',
                '  max-width: 62em !important;',
                '  margin: 0 auto !important;',
                '}',

                /* Карточка — грид: постер | (title + desc) */
                '[data-layout="tube"] .card,',
                '[data-layout="tube"] .card--category {',
                '  display: grid !important;',
                '  grid-template-columns: 5.4em 1fr !important;',
                '  grid-template-rows: auto 1fr !important;',
                '  gap: .3em 1em !important;',
                '  aspect-ratio: unset !important;',
                '  width: 100% !important;',
                '  height: auto !important;',
                '  min-height: 8em !important;',
                '  padding: .6em !important;',
                '  background: #181818 !important;',
                '  border-radius: 12px !important;',
                '  overflow: hidden !important;',
                '  box-shadow: none !important;',
                '  transition: background .15s ease, transform .15s ease !important;',
                '  position: relative !important;',
                '}',

                /* Постер — 2:3, слева, на обе строки */
                '[data-layout="tube"] .card__img-wrapper {',
                '  grid-column: 1 !important;',
                '  grid-row: 1 / 3 !important;',
                '  width: 5.4em !important;',
                '  height: 8.1em !important;',
                '  overflow: hidden !important;',
                '  border-radius: 8px !important;',
                '  background: #000 !important;',
                '}',
                '[data-layout="tube"] .card img {',
                '  width: 100% !important;',
                '  height: 100% !important;',
                '  object-fit: cover !important;',
                '  border-radius: 8px !important;',
                '}',

                /* Название — справа сверху */
                '[data-layout="tube"] .card__title {',
                '  grid-column: 2 !important;',
                '  grid-row: 1 !important;',
                '  position: static !important;',
                '  background: transparent !important;',
                '  color: #f1f1f1 !important;',
                '  font-family: "Roboto", -apple-system, Arial, sans-serif !important;',
                '  font-weight: 600 !important;',
                '  font-size: 1em !important;',
                '  line-height: 1.2 !important;',
                '  padding: 0 !important;',
                '  text-shadow: none !important;',
                '  overflow: hidden !important;',
                '  text-overflow: ellipsis !important;',
                '  display: -webkit-box !important;',
                '  -webkit-line-clamp: 2 !important;',
                '  -webkit-box-orient: vertical !important;',
                '}',

                /* Описание — справа снизу (вставляется JS) */
                '[data-layout="tube"] .layout-desc {',
                '  grid-column: 2 !important;',
                '  grid-row: 2 !important;',
                '  color: #aaa !important;',
                '  font-family: "Roboto", -apple-system, Arial, sans-serif !important;',
                '  font-size: .78em !important;',
                '  line-height: 1.35 !important;',
                '  overflow: hidden !important;',
                '  display: -webkit-box !important;',
                '  -webkit-line-clamp: 3 !important;',
                '  -webkit-box-orient: vertical !important;',
                '}',

                '[data-layout="tube"] .card.focus {',
                '  background: #272727 !important;',
                '  transform: scale(1.005) !important;',
                '  box-shadow: 0 0 0 2px #ff0000 !important;',
                '}',

                /* Палитра YouTube */
                '[data-layout="tube"] .head {',
                '  background: #0f0f0f !important;',
                '  border-bottom: 1px solid #272727 !important;',
                '}',
                '[data-layout="tube"] .button,',
                '[data-layout="tube"] .full-start__button {',
                '  background: #212121 !important;',
                '  color: #fff !important;',
                '  border-radius: 18px !important;',
                '  font-weight: 500 !important;',
                '  text-transform: none !important;',
                '}',
                '[data-layout="tube"] .button.focus,',
                '[data-layout="tube"] .full-start__button.focus {',
                '  background: #ff0000 !important;',
                '}',
                '[data-layout="tube"] .selector,',
                '[data-layout="tube"] .online,',
                '[data-layout="tube"] .torrent-item,',
                '[data-layout="tube"] .settings-param {',
                '  background: #181818 !important;',
                '  border-radius: 8px !important;',
                '}',
                '[data-layout="tube"] .selector.focus,',
                '[data-layout="tube"] .online.focus,',
                '[data-layout="tube"] .torrent-item.focus,',
                '[data-layout="tube"] .settings-param.focus {',
                '  background: #212121 !important;',
                '  box-shadow: 0 0 0 2px #ff0000 !important;',
                '}',
                '[data-layout="tube"] .menu__item.focus { background: #ff0000 !important; color: #fff !important; }'
            ].join('\n'),
            apply: function () {
                observeCards(function (card) {
                    var m = cardMovie(card);
                    if (!m) return;

                    var desc = stripTags(m.overview || m.description || '');
                    if (desc) addDesc(card, desc);
                });
            }
        },

        // ------------------------------------------------------------
        // 2. КИНОЛЕНТА — перфорация сверху и снизу
        // ------------------------------------------------------------
        filmstrip: {
            title: 'Кинолента',
            hint: 'Ч/б кадры 35мм с настоящей перфорацией',
            css: [
                '[data-layout="filmstrip"] body,',
                '[data-layout="filmstrip"] .background {',
                '  background: #050505 !important;',
                '  background-image: none !important;',
                '}',

                '[data-layout="filmstrip"] .category-full__items,',
                '[data-layout="filmstrip"] .items-cards,',
                '[data-layout="filmstrip"] .card-list {',
                '  display: grid !important;',
                '  grid-template-columns: repeat(auto-fill, minmax(13em, 1fr)) !important;',
                '  gap: 1.6em 1.4em !important;',
                '  padding: 3.4em 2em 3.4em !important;',
                '  background: #0a0a0a !important;',
                '  position: relative !important;',
                '}',

                /* ПЕРФОРАЦИЯ СВЕРХУ */
                '[data-layout="filmstrip"] .category-full__items::before,',
                '[data-layout="filmstrip"] .items-cards::before,',
                '[data-layout="filmstrip"] .card-list::before {',
                '  content: "" !important;',
                '  position: absolute !important;',
                '  left: 0; right: 0; top: .8em !important;',
                '  height: 1em !important;',
                '  background-image:',
                '    repeating-linear-gradient(90deg,',
                '      #e8e8e8 0 12px,',
                '      transparent 12px 24px) !important;',
                '  background-size: 24px 100% !important;',
                '  background-repeat: repeat-x !important;',
                '  opacity: .92 !important;',
                '  z-index: 1 !important;',
                '  pointer-events: none !important;',
                '}',

                /* ПЕРФОРАЦИЯ СНИЗУ */
                '[data-layout="filmstrip"] .category-full__items::after,',
                '[data-layout="filmstrip"] .items-cards::after,',
                '[data-layout="filmstrip"] .card-list::after {',
                '  content: "" !important;',
                '  position: absolute !important;',
                '  left: 0; right: 0; bottom: .8em !important;',
                '  height: 1em !important;',
                '  background-image:',
                '    repeating-linear-gradient(90deg,',
                '      #e8e8e8 0 12px,',
                '      transparent 12px 24px) !important;',
                '  background-size: 24px 100% !important;',
                '  background-repeat: repeat-x !important;',
                '  opacity: .92 !important;',
                '  z-index: 1 !important;',
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
                '  width: 100% !important;',
                '  height: 100% !important;',
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
                '  bottom: 0; left: 0; right: 0 !important;',
                '  padding: 1.6em .6em .5em !important;',
                '  background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,.95) 100%) !important;',
                '  color: #f5c518 !important;',
                '  font-family: "Courier New", monospace !important;',
                '  font-size: .78em !important;',
                '  letter-spacing: .06em !important;',
                '  text-transform: uppercase !important;',
                '  text-shadow: none !important;',
                '}',

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
                        addBadge(card, 'upcoming', 'СКОРО · ' + d);
                    }
                });
            }
        },

        // ------------------------------------------------------------
        // 3. STORY — увеличенные ×1.2
        // ------------------------------------------------------------
        story: {
            title: 'Story',
            hint: 'Вертикальные карточки 9:16, фокус-раскрытие',
            css: [
                '[data-layout="story"] .category-full__items,',
                '[data-layout="story"] .items-cards,',
                '[data-layout="story"] .card-list {',
                '  display: flex !important;',
                '  flex-wrap: nowrap !important;',
                '  gap: 1.3em !important;',
                '  padding: 2em !important;',
                '  overflow-x: auto !important;',
                '  overflow-y: hidden !important;',
                '  align-items: center !important;',
                '  scrollbar-width: none !important;',
                '}',
                '[data-layout="story"] .category-full__items::-webkit-scrollbar,',
                '[data-layout="story"] .items-cards::-webkit-scrollbar,',
                '[data-layout="story"] .card-list::-webkit-scrollbar { display: none !important; }',

                /* 8em × 14em × 1.2 = 9.6em × 16.8em */
                '[data-layout="story"] .card,',
                '[data-layout="story"] .card--category {',
                '  flex: 0 0 9.6em !important;',
                '  width: 9.6em !important;',
                '  height: 16.8em !important;',
                '  aspect-ratio: unset !important;',
                '  border-radius: 50px !important;',
                '  overflow: hidden !important;',
                '  position: relative !important;',
                '  background: linear-gradient(135deg, #ff0090, #ffea00, #00c8ff) !important;',
                '  padding: 3px !important;',
                '  transition: all .35s cubic-bezier(.22,1,.36,1) !important;',
                '}',

                '[data-layout="story"] .card__img-wrapper {',
                '  position: absolute !important;',
                '  top: 3px; left: 3px; right: 3px; bottom: 3px !important;',
                '  width: auto !important;',
                '  height: auto !important;',
                '  overflow: hidden !important;',
                '  border-radius: 47px !important;',
                '  background: #111 !important;',
                '}',
                '[data-layout="story"] .card img {',
                '  width: 100% !important;',
                '  height: 100% !important;',
                '  object-fit: cover !important;',
                '  border-radius: 47px !important;',
                '  display: block !important;',
                '}',

                /* 11em × 19em × 1.2 = 13.2em × 22.8em */
                '[data-layout="story"] .card.focus {',
                '  flex: 0 0 13.2em !important;',
                '  width: 13.2em !important;',
                '  height: 22.8em !important;',
                '  box-shadow: 0 20px 60px rgba(255,0,144,.5), 0 0 40px rgba(0,200,255,.4) !important;',
                '  z-index: 10 !important;',
                '}',

                '[data-layout="story"] .card__title {',
                '  position: absolute !important;',
                '  bottom: 1.6em; left: 0; right: 0 !important;',
                '  text-align: center !important;',
                '  background: transparent !important;',
                '  color: #fff !important;',
                '  font-size: .8em !important;',
                '  font-weight: 700 !important;',
                '  text-shadow: 0 2px 8px rgba(0,0,0,.95), 0 0 4px #000 !important;',
                '  padding: 0 .5em !important;',
                '  z-index: 3 !important;',
                '}',

                '[data-layout="story"] body,',
                '[data-layout="story"] .background { background: #0e0e0e !important; background-image: none !important; }',
                '[data-layout="story"] .head {',
                '  background: #0e0e0e !important;',
                '  border-bottom: 2px solid transparent !important;',
                '  border-image: linear-gradient(90deg, #ff0090, #ffea00, #00c8ff) 1 !important;',
                '}'
            ].join('\n'),
            apply: null
        },

        // ------------------------------------------------------------
        // 4. ПОЛАРОИД — белые рамки, повороты, «от руки»
        // ------------------------------------------------------------
        polaroid: {
            title: 'Полароид',
            hint: 'Снимки с белой рамкой, повёрнуты как на столе',
            css: [
                '[data-layout="polaroid"] body,',
                '[data-layout="polaroid"] .background {',
                '  background: #ebe1c9 !important;',
                '  background-image: radial-gradient(circle at 1px 1px, rgba(0,0,0,.06) 1px, transparent 1px) !important;',
                '  background-size: 10px 10px !important;',
                '}',

                '[data-layout="polaroid"] .category-full__items,',
                '[data-layout="polaroid"] .items-cards,',
                '[data-layout="polaroid"] .card-list {',
                '  display: flex !important;',
                '  flex-wrap: wrap !important;',
                '  gap: 2.2em 2em !important;',
                '  padding: 2.6em 3em !important;',
                '  background: transparent !important;',
                '}',

                '[data-layout="polaroid"] .card,',
                '[data-layout="polaroid"] .card--category {',
                '  flex: 0 0 auto !important;',
                '  width: 12em !important;',
                '  height: 14.5em !important;',
                '  aspect-ratio: unset !important;',
                '  padding: .8em .8em 3em !important;',
                '  background: #fffef8 !important;',
                '  border: none !important;',
                '  border-radius: 0 !important;',
                '  box-shadow: 0 6px 16px rgba(0,0,0,.22), 0 12px 32px rgba(0,0,0,.12) !important;',
                '  transform: rotate(-3deg) !important;',
                '  transition: transform .3s ease, box-shadow .3s ease !important;',
                '  position: relative !important;',
                '}',

                '[data-layout="polaroid"] .card:nth-child(3n+1) { transform: rotate(-4deg) !important; }',
                '[data-layout="polaroid"] .card:nth-child(3n+2) { transform: rotate(2.5deg) !important; }',
                '[data-layout="polaroid"] .card:nth-child(3n+3) { transform: rotate(-1.5deg) !important; }',
                '[data-layout="polaroid"] .card:nth-child(5n+4) { transform: rotate(4deg) !important; }',
                '[data-layout="polaroid"] .card:nth-child(7n+5) { transform: rotate(-2.5deg) !important; }',

                '[data-layout="polaroid"] .card__img-wrapper {',
                '  width: 100% !important;',
                '  height: 100% !important;',
                '  overflow: hidden !important;',
                '  background: #ddd !important;',
                '}',
                '[data-layout="polaroid"] .card img {',
                '  width: 100% !important;',
                '  height: 100% !important;',
                '  object-fit: cover !important;',
                '  filter: sepia(12%) contrast(1.05) saturate(1.05) !important;',
                '}',

                '[data-layout="polaroid"] .card__title {',
                '  position: absolute !important;',
                '  bottom: .5em; left: 0; right: 0 !important;',
                '  padding: 0 1em !important;',
                '  background: transparent !important;',
                '  color: #2a2a2a !important;',
                '  font-family: "Comic Sans MS", "Bradley Hand", cursive !important;',
                '  font-size: .95em !important;',
                '  text-align: center !important;',
                '  text-shadow: none !important;',
                '  overflow: hidden !important;',
                '  text-overflow: ellipsis !important;',
                '  white-space: nowrap !important;',
                '}',

                '[data-layout="polaroid"] .card.focus {',
                '  transform: rotate(0deg) scale(1.08) !important;',
                '  box-shadow: 0 24px 48px rgba(0,0,0,.35), 0 0 0 3px #1a1a1a !important;',
                '  z-index: 10 !important;',
                '}',

                '[data-layout="polaroid"] .head {',
                '  background: rgba(235,225,201,.95) !important;',
                '  color: #1a1a1a !important;',
                '  border-bottom: 1px solid rgba(0,0,0,.15) !important;',
                '}',
                '[data-layout="polaroid"] .head * { color: #1a1a1a !important; }',
                '[data-layout="polaroid"] .menu__item.focus { background: #1a1a1a !important; color: #f5c518 !important; }'
            ].join('\n'),
            apply: null
        },

        // ------------------------------------------------------------
        // 5. РЕТРО-ТВ — карточка как корпус старого телевизора
        // ------------------------------------------------------------
        retrotv: {
            title: 'Ретро-ТВ',
            hint: 'Карточки в форме старых телевизоров',
            css: [
                '[data-layout="retrotv"] body,',
                '[data-layout="retrotv"] .background {',
                '  background: #2a1810 !important;',
                '  background-image: repeating-linear-gradient(90deg, transparent 0 40px, rgba(0,0,0,.08) 40px 42px) !important;',
                '}',

                '[data-layout="retrotv"] .category-full__items,',
                '[data-layout="retrotv"] .items-cards,',
                '[data-layout="retrotv"] .card-list {',
                '  display: grid !important;',
                '  grid-template-columns: repeat(auto-fill, minmax(12em, 1fr)) !important;',
                '  gap: 3em 1.6em !important;',
                '  padding: 3em 2em !important;',
                '  background: transparent !important;',
                '}',

                '[data-layout="retrotv"] .card,',
                '[data-layout="retrotv"] .card--category {',
                '  aspect-ratio: 4 / 5 !important;',
                '  padding: 1em .9em 2.6em !important;',
                '  background: linear-gradient(180deg, #4a2f1e 0%, #2a1810 100%) !important;',
                '  border: 3px solid #1a0f08 !important;',
                '  border-radius: 14px 14px 8px 8px !important;',
                '  box-shadow: inset 0 0 0 2px #5a3a24, 0 10px 20px rgba(0,0,0,.7) !important;',
                '  position: relative !important;',
                '  transition: transform .25s ease, box-shadow .25s ease !important;',
                '  overflow: visible !important;',
                '}',

                /* Антенны сверху */
                '[data-layout="retrotv"] .card::before {',
                '  content: "" !important;',
                '  position: absolute !important;',
                '  top: -1.6em !important;',
                '  left: 50% !important;',
                '  width: 0 !important;',
                '  height: 0 !important;',
                '  border-left: 1.4em solid transparent !important;',
                '  border-right: 1.4em solid transparent !important;',
                '  border-bottom: 1.6em solid #666 !important;',
                '  transform: translateX(-50%) !important;',
                '  z-index: -1 !important;',
                '  filter: drop-shadow(0 0 2px rgba(0,0,0,.6)) !important;',
                '  opacity: .85 !important;',
                '}',

                /* Ножки снизу */
                '[data-layout="retrotv"] .card::after {',
                '  content: "" !important;',
                '  position: absolute !important;',
                '  bottom: -.6em !important;',
                '  left: 15%; right: 15% !important;',
                '  height: .6em !important;',
                '  background: #1a0f08 !important;',
                '  border-radius: 0 0 6px 6px !important;',
                '  box-shadow: -1.2em 0 0 .15em #1a0f08, 1.2em 0 0 .15em #1a0f08 !important;',
                '}',

                '[data-layout="retrotv"] .card__img-wrapper {',
                '  width: 100% !important;',
                '  height: 100% !important;',
                '  background: #050300 !important;',
                '  border-radius: 14% / 12% !important;',
                '  overflow: hidden !important;',
                '  box-shadow: inset 0 0 24px rgba(0,0,0,.95), inset 0 0 4px #000 !important;',
                '  position: relative !important;',
                '}',
                '[data-layout="retrotv"] .card img {',
                '  width: 100% !important;',
                '  height: 100% !important;',
                '  object-fit: cover !important;',
                '  filter: saturate(.9) contrast(1.05) brightness(.95) !important;',
                '}',

                '[data-layout="retrotv"] .card__title {',
                '  position: absolute !important;',
                '  bottom: .5em; left: 0; right: 0 !important;',
                '  text-align: center !important;',
                '  background: transparent !important;',
                '  color: #f5c518 !important;',
                '  font-family: "Courier New", monospace !important;',
                '  font-size: .72em !important;',
                '  letter-spacing: .08em !important;',
                '  text-transform: uppercase !important;',
                '  text-shadow: 0 0 6px rgba(245,197,24,.7) !important;',
                '  padding: 0 .5em !important;',
                '  overflow: hidden !important;',
                '  text-overflow: ellipsis !important;',
                '  white-space: nowrap !important;',
                '}',

                '[data-layout="retrotv"] .card.focus {',
                '  transform: scale(1.05) !important;',
                '  border-color: #f5c518 !important;',
                '  box-shadow: inset 0 0 0 2px #f5c518, 0 0 32px rgba(245,197,24,.6), 0 12px 32px rgba(0,0,0,.8) !important;',
                '  z-index: 5 !important;',
                '}',

                '[data-layout="retrotv"] .head {',
                '  background: #2a1810 !important;',
                '  border-bottom: 2px solid #1a0f08 !important;',
                '}',
                '[data-layout="retrotv"] .menu__item.focus { background: #5a3a24 !important; color: #f5c518 !important; }'
            ].join('\n'),
            apply: null
        },

        // ------------------------------------------------------------
        // 6. МАГНИТНАЯ ДОСКА — пробка, булавки, наклоны
        // ------------------------------------------------------------
        scrapbook: {
            title: 'Магнитная доска',
            hint: 'Пробковая доска, булавки, лёгкие наклоны',
            css: [
                '[data-layout="scrapbook"] body,',
                '[data-layout="scrapbook"] .background {',
                '  background: #6b4423 !important;',
                '  background-image: none !important;',
                '}',

                '[data-layout="scrapbook"] .category-full__items,',
                '[data-layout="scrapbook"] .items-cards,',
                '[data-layout="scrapbook"] .card-list {',
                '  display: flex !important;',
                '  flex-wrap: wrap !important;',
                '  gap: 2.4em 1.8em !important;',
                '  padding: 3em 3em 3.5em !important;',
                '  background: #c8a875 !important;',
                '  background-image:',
                '    radial-gradient(circle at 20% 30%, rgba(139,90,43,.45) 0 2px, transparent 3px),',
                '    radial-gradient(circle at 80% 70%, rgba(139,90,43,.35) 0 2px, transparent 3px),',
                '    radial-gradient(circle at 55% 20%, rgba(139,90,43,.3) 0 3px, transparent 4px),',
                '    radial-gradient(circle at 35% 85%, rgba(139,90,43,.25) 0 2px, transparent 3px) !important;',
                '  background-size: 44px 44px, 32px 32px, 56px 56px, 38px 38px !important;',
                '  border: 14px solid #6b4423 !important;',
                '  border-radius: 4px !important;',
                '  box-shadow: inset 0 0 80px rgba(0,0,0,.45) !important;',
                '}',

                '[data-layout="scrapbook"] .card,',
                '[data-layout="scrapbook"] .card--category {',
                '  flex: 0 0 auto !important;',
                '  width: 11em !important;',
                '  height: 13.5em !important;',
                '  aspect-ratio: unset !important;',
                '  padding: .5em .5em 2.4em !important;',
                '  background: #fffdf5 !important;',
                '  border: none !important;',
                '  border-radius: 0 !important;',
                '  box-shadow: 2px 4px 10px rgba(0,0,0,.45), inset 0 0 40px rgba(0,0,0,.03) !important;',
                '  transform: rotate(-2.5deg) !important;',
                '  transition: all .3s ease !important;',
                '  position: relative !important;',
                '  overflow: visible !important;',
                '}',

                '[data-layout="scrapbook"] .card:nth-child(3n+1) { transform: rotate(-3.5deg) !important; }',
                '[data-layout="scrapbook"] .card:nth-child(3n+2) { transform: rotate(1.5deg) !important; }',
                '[data-layout="scrapbook"] .card:nth-child(3n+3) { transform: rotate(-1deg) !important; }',
                '[data-layout="scrapbook"] .card:nth-child(5n+4) { transform: rotate(3deg) !important; }',

                /* Булавка сверху */
                '[data-layout="scrapbook"] .card::before {',
                '  content: "" !important;',
                '  position: absolute !important;',
                '  top: -.75em !important;',
                '  left: 50% !important;',
                '  transform: translateX(-50%) !important;',
                '  width: 1.4em !important;',
                '  height: 1.4em !important;',
                '  background: radial-gradient(circle at 30% 30%, #ff5555 0%, #990000 70%, #550000 100%) !important;',
                '  border-radius: 50% !important;',
                '  box-shadow: 0 3px 6px rgba(0,0,0,.65), inset 0 -2px 3px rgba(0,0,0,.5), inset 0 2px 3px rgba(255,255,255,.4) !important;',
                '  z-index: 5 !important;',
                '}',

                '[data-layout="scrapbook"] .card__img-wrapper {',
                '  width: 100% !important;',
                '  height: 100% !important;',
                '  overflow: hidden !important;',
                '  background: #eee !important;',
                '}',
                '[data-layout="scrapbook"] .card img {',
                '  width: 100% !important;',
                '  height: 100% !important;',
                '  object-fit: cover !important;',
                '  filter: sepia(12%) saturate(1.1) !important;',
                '}',

                '[data-layout="scrapbook"] .card__title {',
                '  position: absolute !important;',
                '  bottom: .3em; left: 0; right: 0 !important;',
                '  padding: 0 .6em !important;',
                '  background: transparent !important;',
                '  color: #2a2a2a !important;',
                '  font-family: "Comic Sans MS", "Bradley Hand", cursive !important;',
                '  font-size: .8em !important;',
                '  text-align: center !important;',
                '  text-shadow: none !important;',
                '  overflow: hidden !important;',
                '  text-overflow: ellipsis !important;',
                '  white-space: nowrap !important;',
                '}',

                '[data-layout="scrapbook"] .card.focus {',
                '  transform: rotate(0deg) scale(1.12) !important;',
                '  box-shadow: 6px 10px 24px rgba(0,0,0,.6), 0 0 0 3px #f5c518 !important;',
                '  z-index: 10 !important;',
                '}',

                '[data-layout="scrapbook"] .head {',
                '  background: #6b4423 !important;',
                '  border-bottom: 4px solid #4a2e17 !important;',
                '}'
            ].join('\n'),
            apply: null
        },

        // ------------------------------------------------------------
        // 7. СОТЫ — гексагоны через clip-path
        // ------------------------------------------------------------
        hexgrid: {
            title: 'Соты',
            hint: 'Гексагональная сетка как ульи',
            css: [
                '[data-layout="hexgrid"] body,',
                '[data-layout="hexgrid"] .background { background: #0a0f0a !important; background-image: none !important; }',

                '[data-layout="hexgrid"] .category-full__items,',
                '[data-layout="hexgrid"] .items-cards,',
                '[data-layout="hexgrid"] .card-list {',
                '  display: flex !important;',
                '  flex-wrap: wrap !important;',
                '  gap: .2em !important;',
                '  padding: 1.5em 2em !important;',
                '  background: transparent !important;',
                '  justify-content: center !important;',
                '}',

                '[data-layout="hexgrid"] .card,',
                '[data-layout="hexgrid"] .card--category {',
                '  flex: 0 0 auto !important;',
                '  width: 12em !important;',
                '  height: 13.85em !important;',
                '  aspect-ratio: unset !important;',
                '  padding: 0 !important;',
                '  margin: -.5em -.2em !important;',
                '  background: #1a2a1a !important;',
                '  box-shadow: none !important;',
                '  border-radius: 0 !important;',
                '  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%) !important;',
                '  transition: filter .25s ease, transform .25s ease !important;',
                '  position: relative !important;',
                '}',

                /* Сдвиг чётных для упаковки сот */
                '[data-layout="hexgrid"] .card:nth-child(even) {',
                '  margin-left: 5.8em !important;',
                '  margin-top: -7em !important;',
                '}',

                '[data-layout="hexgrid"] .card__img-wrapper {',
                '  width: 100% !important;',
                '  height: 100% !important;',
                '  overflow: hidden !important;',
                '  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%) !important;',
                '}',
                '[data-layout="hexgrid"] .card img {',
                '  width: 100% !important;',
                '  height: 100% !important;',
                '  object-fit: cover !important;',
                '  filter: saturate(.85) brightness(.85) !important;',
                '}',

                '[data-layout="hexgrid"] .card__title {',
                '  position: absolute !important;',
                '  top: 50% !important;',
                '  left: 50% !important;',
                '  transform: translate(-50%, -50%) !important;',
                '  color: #fff !important;',
                '  background: rgba(0,0,0,.55) !important;',
                '  padding: .35em .6em !important;',
                '  border-radius: 4px !important;',
                '  font-size: .72em !important;',
                '  font-weight: 700 !important;',
                '  text-align: center !important;',
                '  text-shadow: 0 1px 3px #000 !important;',
                '  max-width: 60% !important;',
                '  overflow: hidden !important;',
                '  white-space: nowrap !important;',
                '  text-overflow: ellipsis !important;',
                '  z-index: 2 !important;',
                '  opacity: 0 !important;',
                '  transition: opacity .25s ease !important;',
                '}',

                '[data-layout="hexgrid"] .card.focus {',
                '  z-index: 5 !important;',
                '  filter: drop-shadow(0 0 14px #00ff88) !important;',
                '}',

                '[data-layout="hexgrid"] .card.focus img {',
                '  filter: saturate(1.25) brightness(1.15) !important;',
                '}',
                '[data-layout="hexgrid"] .card.focus .card__title {',
                '  opacity: 1 !important;',
                '}',

                '[data-layout="hexgrid"] .head {',
                '  background: #0a0f0a !important;',
                '  border-bottom: 2px solid #00ff88 !important;',
                '}',
                '[data-layout="hexgrid"] .menu__item.focus { background: #00ff88 !important; color: #000 !important; }'
            ].join('\n'),
            apply: null
        },

        // ------------------------------------------------------------
        // 8. ГАЗЕТА — светлый фон, колонки, serif
        // ------------------------------------------------------------
        newspaper: {
            title: 'Газета',
            hint: 'Чёрно-белая пресса: колонки, крупные заголовки',
            css: [
                '[data-layout="newspaper"] body,',
                '[data-layout="newspaper"] .background { background: #f5f0e0 !important; background-image: none !important; }',

                '[data-layout="newspaper"] .category-full__items,',
                '[data-layout="newspaper"] .items-cards,',
                '[data-layout="newspaper"] .card-list {',
                '  display: block !important;',
                '  padding: 2em 3em 3em !important;',
                '  background: #f5f0e0 !important;',
                '  column-count: 3 !important;',
                '  column-gap: 2em !important;',
                '  column-rule: 1px solid #1a1a1a !important;',
                '  max-width: 100em !important;',
                '  margin: 0 auto !important;',
                '}',

                '[data-layout="newspaper"] .card,',
                '[data-layout="newspaper"] .card--category {',
                '  display: block !important;',
                '  width: 100% !important;',
                '  height: auto !important;',
                '  aspect-ratio: unset !important;',
                '  padding: 0 0 1em !important;',
                '  margin-bottom: 1.6em !important;',
                '  background: transparent !important;',
                '  border: none !important;',
                '  border-bottom: 1px solid #1a1a1a !important;',
                '  border-radius: 0 !important;',
                '  box-shadow: none !important;',
                '  break-inside: avoid !important;',
                '  transition: background .15s ease !important;',
                '}',

                '[data-layout="newspaper"] .card__img-wrapper {',
                '  width: 100% !important;',
                '  height: auto !important;',
                '  max-height: 14em !important;',
                '  margin-bottom: .6em !important;',
                '  overflow: hidden !important;',
                '  border: 1px solid #1a1a1a !important;',
                '}',
                '[data-layout="newspaper"] .card img {',
                '  width: 100% !important;',
                '  height: auto !important;',
                '  max-height: 14em !important;',
                '  object-fit: cover !important;',
                '  filter: grayscale(100%) contrast(1.15) !important;',
                '}',

                '[data-layout="newspaper"] .card__title {',
                '  position: static !important;',
                '  color: #1a1a1a !important;',
                '  font-family: Georgia, "Times New Roman", serif !important;',
                '  font-weight: 900 !important;',
                '  font-size: 1.25em !important;',
                '  line-height: 1.08 !important;',
                '  background: transparent !important;',
                '  padding: 0 0 .3em !important;',
                '  text-shadow: none !important;',
                '  border-bottom: 1px solid #1a1a1a !important;',
                '  text-transform: uppercase !important;',
                '  letter-spacing: .01em !important;',
                '}',

                '[data-layout="newspaper"] .card.focus {',
                '  background: #fff8d8 !important;',
                '  box-shadow: 4px 4px 0 #1a1a1a !important;',
                '}',

                '[data-layout="newspaper"] .head {',
                '  background: #f5f0e0 !important;',
                '  color: #1a1a1a !important;',
                '  border-bottom: 4px double #1a1a1a !important;',
                '}',
                '[data-layout="newspaper"] .head * { color: #1a1a1a !important; }',
                '[data-layout="newspaper"] .menu__item {',
                '  font-family: Georgia, serif !important;',
                '  color: #1a1a1a !important;',
                '}',
                '[data-layout="newspaper"] .menu__item.focus { background: #1a1a1a !important; color: #f5f0e0 !important; }',
                '[data-layout="newspaper"] .button,',
                '[data-layout="newspaper"] .full-start__button {',
                '  background: #f5f0e0 !important; color: #1a1a1a !important;',
                '  border: 2px solid #1a1a1a !important;',
                '  border-radius: 0 !important;',
                '  font-family: Georgia, serif !important;',
                '  text-transform: uppercase !important;',
                '  letter-spacing: .06em !important;',
                '}',
                '[data-layout="newspaper"] .button.focus,',
                '[data-layout="newspaper"] .full-start__button.focus {',
                '  background: #1a1a1a !important; color: #f5f0e0 !important;',
                '}'
            ].join('\n'),
            apply: null
        },

        // ------------------------------------------------------------
        // 9. КИНОАФИША — красный корпус, золотые «лампочки»
        // ------------------------------------------------------------
        cinemaposter: {
            title: 'Киноафиша',
            hint: 'Красные афиши с золотой каймой-лампочками',
            css: [
                '[data-layout="cinemaposter"] body,',
                '[data-layout="cinemaposter"] .background {',
                '  background: #1a0000 !important;',
                '  background-image: radial-gradient(circle at 50% 0%, rgba(255,215,0,.08) 0%, transparent 60%) !important;',
                '}',

                '[data-layout="cinemaposter"] .category-full__items,',
                '[data-layout="cinemaposter"] .items-cards,',
                '[data-layout="cinemaposter"] .card-list {',
                '  display: grid !important;',
                '  grid-template-columns: repeat(auto-fill, minmax(14em, 1fr)) !important;',
                '  gap: 2.2em 1.8em !important;',
                '  padding: 2.6em 2em !important;',
                '  background: transparent !important;',
                '}',

                '[data-layout="cinemaposter"] .card,',
                '[data-layout="cinemaposter"] .card--category {',
                '  aspect-ratio: 2 / 3 !important;',
                '  padding: .7em !important;',
                '  background: #8b0000 !important;',
                '  border: 3px solid #d4af37 !important;',
                '  border-radius: 4px !important;',
                '  box-shadow: inset 0 0 30px rgba(0,0,0,.6), 0 0 40px rgba(255,215,0,.25), 0 10px 30px rgba(0,0,0,.8) !important;',
                '  transition: transform .3s ease, box-shadow .3s ease !important;',
                '  position: relative !important;',
                '  overflow: hidden !important;',
                '}',

                /* Лампочки — точечный бордер с внутренней стороны */
                '[data-layout="cinemaposter"] .card::before {',
                '  content: "" !important;',
                '  position: absolute !important;',
                '  top: 4px; left: 4px; right: 4px; bottom: 4px !important;',
                '  border: 3px dotted #ffea00 !important;',
                '  border-radius: 2px !important;',
                '  pointer-events: none !important;',
                '  filter: drop-shadow(0 0 5px #ffea00) !important;',
                '  opacity: .92 !important;',
                '  z-index: 3 !important;',
                '}',

                '[data-layout="cinemaposter"] .card__img-wrapper {',
                '  width: 100% !important;',
                '  height: 100% !important;',
                '  overflow: hidden !important;',
                '  border: 1px solid #d4af37 !important;',
                '}',
                '[data-layout="cinemaposter"] .card img {',
                '  width: 100% !important;',
                '  height: 100% !important;',
                '  object-fit: cover !important;',
                '  filter: contrast(1.15) saturate(1.1) !important;',
                '}',

                '[data-layout="cinemaposter"] .card__title {',
                '  position: absolute !important;',
                '  bottom: 1em; left: 1em; right: 1em !important;',
                '  padding: 2.2em .5em .5em !important;',
                '  background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.9) 45%) !important;',
                '  color: #ffea00 !important;',
                '  font-family: Georgia, serif !important;',
                '  font-weight: 900 !important;',
                '  font-size: 1em !important;',
                '  text-align: center !important;',
                '  text-transform: uppercase !important;',
                '  letter-spacing: .06em !important;',
                '  text-shadow: 0 0 10px rgba(255,234,0,.8), 0 2px 4px #000 !important;',
                '  z-index: 4 !important;',
                '  border-radius: 0 0 4px 4px !important;',
                '}',

                '[data-layout="cinemaposter"] .card.focus {',
                '  transform: scale(1.06) !important;',
                '  box-shadow: inset 0 0 30px rgba(0,0,0,.6), 0 0 60px rgba(255,215,0,.75), 0 0 100px rgba(255,215,0,.4), 0 15px 40px rgba(0,0,0,.9) !important;',
                '  z-index: 5 !important;',
                '}',

                '[data-layout="cinemaposter"] .head {',
                '  background: #1a0000 !important;',
                '  border-bottom: 3px double #d4af37 !important;',
                '}',
                '[data-layout="cinemaposter"] .menu__item.focus { background: #8b0000 !important; color: #ffea00 !important; }'
            ].join('\n'),
            apply: null
        },

        // ------------------------------------------------------------
        // 10. КОЛОДА КАРТ — карточки наложены как веер карт
        // ------------------------------------------------------------
        deckofcards: {
            title: 'Колода карт',
            hint: 'Карточки-карты наложены веером, фокус вытягивает',
            css: [
                '[data-layout="deckofcards"] body,',
                '[data-layout="deckofcards"] .background {',
                '  background: radial-gradient(ellipse at 50% 100%, #0a4d0a 0%, #052005 60%, #000 100%) !important;',
                '}',

                '[data-layout="deckofcards"] .category-full__items,',
                '[data-layout="deckofcards"] .items-cards,',
                '[data-layout="deckofcards"] .card-list {',
                '  display: flex !important;',
                '  flex-wrap: nowrap !important;',
                '  padding: 3em 3em !important;',
                '  overflow-x: auto !important;',
                '  overflow-y: visible !important;',
                '  align-items: center !important;',
                '  background: transparent !important;',
                '  scrollbar-width: none !important;',
                '}',
                '[data-layout="deckofcards"] .category-full__items::-webkit-scrollbar,',
                '[data-layout="deckofcards"] .items-cards::-webkit-scrollbar,',
                '[data-layout="deckofcards"] .card-list::-webkit-scrollbar { display: none !important; }',

                '[data-layout="deckofcards"] .card,',
                '[data-layout="deckofcards"] .card--category {',
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
                '  transform: rotate(2deg) translateY(0) !important;',
                '  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, z-index 0s !important;',
                '  position: relative !important;',
                '  z-index: 1 !important;',
                '}',

                '[data-layout="deckofcards"] .card:nth-child(even) {',
                '  transform: rotate(-1.8deg) translateY(.9em) !important;',
                '}',
                '[data-layout="deckofcards"] .card:nth-child(3n) {',
                '  transform: rotate(1.5deg) translateY(-.5em) !important;',
                '}',

                /* Фокус — карта выходит наверх и открывается */
                '[data-layout="deckofcards"] .card.focus {',
                '  transform: rotate(0deg) translateY(-1.6em) scale(1.1) !important;',
                '  z-index: 20 !important;',
                '  margin-right: -3em !important;',
                '  box-shadow: 8px 8px 0 rgba(0,0,0,.55), 16px 20px 32px rgba(0,0,0,.55), 0 0 0 3px #f5c518 !important;',
                '}',

                '[data-layout="deckofcards"] .card__img-wrapper {',
                '  width: 100% !important;',
                '  height: 100% !important;',
                '  overflow: hidden !important;',
                '  border: 1px solid #ccc !important;',
                '  border-radius: 5px !important;',
                '  background: #eee !important;',
                '}',
                '[data-layout="deckofcards"] .card img {',
                '  width: 100% !important;',
                '  height: 100% !important;',
                '  object-fit: cover !important;',
                '}',

                '[data-layout="deckofcards"] .card__title {',
                '  position: absolute !important;',
                '  bottom: .3em; left: 0; right: 0 !important;',
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

                '[data-layout="deckofcards"] .head {',
                '  background: #052005 !important;',
                '  border-bottom: 2px solid #0a4d0a !important;',
                '}',
                '[data-layout="deckofcards"] .menu__item.focus { background: #f5c518 !important; color: #052005 !important; }'
            ].join('\n'),
            apply: null
        }
    };

    var THEME_ORDER = [
        'classic',
        'tube', 'filmstrip', 'story', 'polaroid', 'retrotv',
        'scrapbook', 'hexgrid', 'newspaper', 'cinemaposter', 'deckofcards'
    ];

    // ================================================================
    //  УПРАВЛЕНИЕ ФОНОМ LAMPA
    // ================================================================

    function overrideBackground() {
        if (origBgImmediately || !window.Lampa || !Lampa.Background) return;

        origBgImmediately = Lampa.Background.immediately;
        origBgShow = Lampa.Background.show;

        // Глушим обновление фона для тем, где фон не нужен
        Lampa.Background.immediately = function () {
            if (currentTheme !== 'classic') return;
            if (origBgImmediately) return origBgImmediately.apply(this, arguments);
        };

        if (origBgShow) {
            Lampa.Background.show = function () {
                if (currentTheme !== 'classic') return;
                return origBgShow.apply(this, arguments);
            };
        }
    }

    function restoreBackground() {
        if (!origBgImmediately || !window.Lampa || !Lampa.Background) return;
        Lampa.Background.immediately = origBgImmediately;
        if (origBgShow) Lampa.Background.show = origBgShow;
        origBgImmediately = null;
        origBgShow = null;

        // При возврате к классике — очищаем слой background от inline-стилей
        var bg = document.querySelector('.background');
        if (bg) {
            bg.style.backgroundImage = '';
            bg.style.background = '';
        }
    }

    // ================================================================
    //  ПРИМЕНЕНИЕ ТЕМЫ
    // ================================================================

    function currentThemeName() {
        return Lampa.Storage.field(STORAGE_KEY) || 'classic';
    }

    function clearPrevious() {
        stopObserving();
        clearExtras();

        var old = document.getElementById(STYLE_ID);
        if (old && old.parentNode) old.parentNode.removeChild(old);

        // Чистим inline-стили фона Lampa
        var bg = document.querySelector('.background');
        if (bg) {
            bg.style.backgroundImage = '';
            bg.style.background = '';
        }
    }

    function applyTheme(name) {
        clearPrevious();

        var prev = currentTheme;
        currentTheme = name;

        if (prev !== 'classic' && name === 'classic') restoreBackground();
        if (name !== 'classic') overrideBackground();

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
                }, 60);
            });

            applyTheme(currentThemeName());
            console.log('ThemeLayout v3', 'loaded, current:', currentThemeName());
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
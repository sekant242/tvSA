(function () {
    'use strict';

    var STYLE_ID = 'theme_layout_style';
    var STORAGE_KEY = 'interface_theme_layout';
    var BODY_ATTR = 'data-layout';

    // Утилита: наблюдаем за появлением карточек и навешиваем бейджи
    var observer = null;

    // ================================================================
    //  БАЗОВЫЕ УТИЛИТЫ
    // ================================================================

    function observeCards(callback) {
        stopObserving();
        observer = new MutationObserver(function (mutations) {
            var touched = [];
            mutations.forEach(function (m) {
                [].forEach.call(m.addedNodes || [], function (node) {
                    if (node.nodeType !== 1) return;
                    if (node.classList && node.classList.contains('card')) touched.push(node);
                    else if (node.querySelectorAll) {
                        var inner = node.querySelectorAll('.card');
                        [].forEach.call(inner, function (c) { touched.push(c); });
                    }
                });
            });
            if (touched.length) touched.forEach(callback);
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function stopObserving() {
        if (observer) { observer.disconnect(); observer = null; }
    }

    // Добавляет на карточку бейдж (год/рейтинг/тип) — если данных нет, ставит заглушку
    function addBadge(card, position, text, cls) {
        if (!card || !card.querySelector) return;
        if (card.querySelector('.layout-badge.' + cls)) return;
        var b = document.createElement('div');
        b.className = 'layout-badge ' + cls;
        b.textContent = text;
        if (position === 'top-left') { b.style.top = '.4em'; b.style.left = '.4em'; }
        else if (position === 'top-right') { b.style.top = '.4em'; b.style.right = '.4em'; }
        else if (position === 'bottom-right') { b.style.bottom = '.4em'; b.style.right = '.4em'; }
        else { b.style.bottom = '.4em'; b.style.left = '.4em'; }
        card.style.position = card.style.position || 'relative';
        card.appendChild(b);
    }

    // Попытка выдрать год из data-атрибутов / текста
    function guessYear(card) {
        var t = card.getAttribute && (card.getAttribute('data-year') || '');
        if (t) return t;
        var txt = card.textContent || '';
        var m = txt.match(/\b(19|20)\d{2}\b/);
        return m ? m[0] : '';
    }

    // ================================================================
    //  ТЕМЫ
    // ================================================================

    var THEMES = {

        // ------------------------------------------------------------
        // 0. КЛАССИКА
        // ------------------------------------------------------------
        classic: {
            title: 'Классика (по умолчанию)',
            hint: 'Стандартный вид Lampa',
            css: '',
            apply: null
        },

        // ============================================================
        //  ПО МОТИВАМ СЕРВИСОВ
        // ============================================================

        // 1. YouTube — плотная сетка 16:9, текст под превью,
        //    бейдж длительности в правом нижнем углу
        youtube: {
            title: 'YouTube',
            hint: 'Плотная сетка 16:9 с текстом под превью',
            css: [
                /* Контейнер: очень плотная сетка, авто-колонки */
                '[data-layout="youtube"] .card-list,',
                '[data-layout="youtube"] .category-full__items,',
                '[data-layout="youtube"] .items-cards,',
                '[data-layout="youtube"] .card-list--grid {',
                '  display: grid !important;',
                '  grid-template-columns: repeat(auto-fill, minmax(16em, 1fr)) !important;',
                '  gap: .8em 1em !important;',
                '  padding: .8em !important;',
                '}',

                /* Карточка — 16:9, радиус 12, без тени */
                '[data-layout="youtube"] .card,',
                '[data-layout="youtube"] .card--category {',
                '  aspect-ratio: 16 / 9 !important;',
                '  width: 100% !important;',
                '  height: auto !important;',
                '  border-radius: 12px !important;',
                '  overflow: hidden !important;',
                '  background: #0f0f0f !important;',
                '  box-shadow: none !important;',
                '  transition: transform .12s ease, background .12s ease !important;',
                '}',

                /* Изображение внутри — на весь размер */
                '[data-layout="youtube"] .card img,',
                '[data-layout="youtube"] .card--category img {',
                '  width: 100% !important;',
                '  height: 100% !important;',
                '  object-fit: cover !important;',
                '  border-radius: 12px !important;',
                '}',

                /* Заголовок — под карточкой, не поверх */
                '[data-layout="youtube"] .card__title {',
                '  position: static !important;',
                '  background: transparent !important;',
                '  color: #f1f1f1 !important;',
                '  padding: .5em .2em 0 !important;',
                '  font-size: .85em !important;',
                '  font-weight: 500 !important;',
                '  text-shadow: none !important;',
                '}',

                /* Фокус — тонкая белая окантовка + лёгкий зум */
                '[data-layout="youtube"] .card.focus {',
                '  transform: scale(1.02) !important;',
                '  box-shadow: 0 0 0 3px #fff !important;',
                '}',

                /* Шапка — плоская */
                '[data-layout="youtube"] .head {',
                '  background: #0f0f0f !important;',
                '  border-bottom: 1px solid #303030 !important;',
                '}',

                /* Бейдж длительности */
                '[data-layout="youtube"] .layout-badge.duration {',
                '  background: rgba(0,0,0,.8) !important;',
                '  color: #fff !important;',
                '  padding: .15em .4em !important;',
                '  border-radius: 4px !important;',
                '  font-size: .7em !important;',
                '  font-weight: 700 !important;',
                '}'
            ].join('\n'),
            apply: function () {
                observeCards(function (card) {
                    // YouTube-бейдж «возраст/качество» в углу
                    var age = card.querySelector('.card__age, .card__quality');
                    if (age) {
                        addBadge(card, 'bottom-right', age.textContent.trim(), 'duration');
                        age.style.display = 'none';
                    }
                });
            }
        },

        // 2. Netflix — крупные горизонтальные ряды с прокруткой,
        //    постеры 2:3, сильный зум на фокусе
        netflix: {
            title: 'Netflix',
            hint: 'Крупные горизонтальные ряды с прокруткой',
            css: [
                /* Контейнер — ряды, горизонтальный скролл */
                '[data-layout="netflix"] .category-full__items,',
                '[data-layout="netflix"] .items-cards,',
                '[data-layout="netflix"] .card-list {',
                '  display: flex !important;',
                '  flex-wrap: nowrap !important;',
                '  gap: 1em !important;',
                '  overflow-x: auto !important;',
                '  overflow-y: hidden !important;',
                '  padding: 1em 2em !important;',
                '  scroll-behavior: smooth !important;',
                '  scrollbar-width: none !important;',
                '}',
                '[data-layout="netflix"] .category-full__items::-webkit-scrollbar,',
                '[data-layout="netflix"] .items-cards::-webkit-scrollbar,',
                '[data-layout="netflix"] .card-list::-webkit-scrollbar { display: none !important; }',

                /* Карточка — вертикальный постер 2:3, фиксированная ширина */
                '[data-layout="netflix"] .card,',
                '[data-layout="netflix"] .card--category {',
                '  flex: 0 0 auto !important;',
                '  width: 14em !important;',
                '  aspect-ratio: 2 / 3 !important;',
                '  border-radius: 4px !important;',
                '  overflow: hidden !important;',
                '  box-shadow: 0 4px 12px rgba(0,0,0,.6) !important;',
                '  transition: transform .3s cubic-bezier(.2,.8,.2,1), box-shadow .3s ease !important;',
                '  transform-origin: center center !important;',
                '}',
                '[data-layout="netflix"] .card img {',
                '  width: 100% !important;',
                '  height: 100% !important;',
                '  object-fit: cover !important;',
                '}',

                /* Фокус — сильный zoom */
                '[data-layout="netflix"] .card.focus {',
                '  transform: scale(1.15) !important;',
                '  box-shadow: 0 12px 32px rgba(229,9,20,.45), 0 0 0 2px #e50914 !important;',
                '  z-index: 10 !important;',
                '}',

                /* Заголовок — не поверх, а под карточкой (цвет белый) */
                '[data-layout="netflix"] .card__title {',
                '  position: absolute !important;',
                '  left: 0; right: 0; bottom: 0;',
                '  padding: .6em .5em !important;',
                '  background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,.9) 100%) !important;',
                '  color: #fff !important;',
                '  font-weight: 700 !important;',
                '  font-size: .85em !important;',
                '  text-shadow: 0 2px 4px rgba(0,0,0,.8) !important;',
                '}',

                '[data-layout="netflix"] .head {',
                '  background: linear-gradient(180deg, rgba(0,0,0,.95) 0%, rgba(20,20,20,0) 100%) !important;',
                '}'
            ].join('\n'),
            apply: null
        },

        // 3. Spotify — круглые карточки-обложки, ряды горизонтально,
        //    текст по центру под кругом
        spotify: {
            title: 'Spotify',
            hint: 'Круглые карточки-обложки как плейлисты',
            css: [
                '[data-layout="spotify"] .category-full__items,',
                '[data-layout="spotify"] .items-cards,',
                '[data-layout="spotify"] .card-list {',
                '  display: grid !important;',
                '  grid-template-columns: repeat(auto-fill, minmax(12em, 1fr)) !important;',
                '  gap: 1.5em 1.2em !important;',
                '  padding: 1.2em !important;',
                '}',

                /* Карточка — квадрат, изнутри круглая */
                '[data-layout="spotify"] .card,',
                '[data-layout="spotify"] .card--category {',
                '  aspect-ratio: 1 / 1 !important;',
                '  border-radius: 50% !important;',
                '  overflow: hidden !important;',
                '  background: #181818 !important;',
                '  box-shadow: 0 8px 24px rgba(0,0,0,.5) !important;',
                '  transition: transform .2s ease, box-shadow .2s ease !important;',
                '}',
                '[data-layout="spotify"] .card img {',
                '  width: 100% !important;',
                '  height: 100% !important;',
                '  object-fit: cover !important;',
                '  border-radius: 50% !important;',
                '}',

                '[data-layout="spotify"] .card.focus {',
                '  transform: scale(1.06) !important;',
                '  box-shadow: 0 16px 40px rgba(30,215,96,.45), 0 0 0 3px #1db954 !important;',
                '}',

                /* Текст — под кругом, по центру */
                '[data-layout="spotify"] .card__title {',
                '  position: absolute !important;',
                '  top: 100% !important;',
                '  left: 50% !important;',
                '  transform: translateX(-50%) !important;',
                '  white-space: nowrap !important;',
                '  background: transparent !important;',
                '  color: #fff !important;',
                '  padding: .6em 0 0 !important;',
                '  font-weight: 700 !important;',
                '  font-size: .8em !important;',
                '  text-shadow: none !important;',
                '}',

                /* Оставляем место под текст */
                '[data-layout="spotify"] .card { margin-bottom: 2em !important; }',

                '[data-layout="spotify"] .head { background: #000 !important; }'
            ].join('\n'),
            apply: null
        },

        // 4. Apple TV — просторная сетка крупных постеров 2:3 с большим
        //    фокусом (scale 1.1), инверсия цвета при фокусе
        appletv: {
            title: 'Apple TV',
            hint: 'Просторная сетка крупных постеров',
            css: [
                '[data-layout="appletv"] .category-full__items,',
                '[data-layout="appletv"] .items-cards,',
                '[data-layout="appletv"] .card-list {',
                '  display: grid !important;',
                '  grid-template-columns: repeat(auto-fill, minmax(18em, 1fr)) !important;',
                '  gap: 2.2em 1.8em !important;',
                '  padding: 1.5em !important;',
                '}',

                '[data-layout="appletv"] .card,',
                '[data-layout="appletv"] .card--category {',
                '  aspect-ratio: 2 / 3 !important;',
                '  border-radius: 14px !important;',
                '  overflow: hidden !important;',
                '  transition: transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease !important;',
                '  transform-origin: center !important;',
                '  background: #000 !important;',
                '}',
                '[data-layout="appletv"] .card img {',
                '  width: 100% !important;',
                '  height: 100% !important;',
                '  object-fit: cover !important;',
                '  border-radius: 14px !important;',
                '}',

                '[data-layout="appletv"] .card.focus {',
                '  transform: scale(1.1) !important;',
                '  box-shadow: 0 24px 60px rgba(0,0,0,.8), 0 0 0 3px rgba(255,255,255,.95) !important;',
                '  z-index: 5 !important;',
                '}',

                /* Заголовок под карточкой, по центру, sans-serif с трекингом */
                '[data-layout="appletv"] .card__title {',
                '  position: static !important;',
                '  background: transparent !important;',
                '  color: #fff !important;',
                '  text-align: center !important;',
                '  padding: .7em 0 0 !important;',
                '  font-size: .85em !important;',
                '  font-weight: 500 !important;',
                '  letter-spacing: .02em !important;',
                '  text-shadow: none !important;',
                '}',
                '[data-layout="appletv"] .card { margin-bottom: 2em !important; }',

                '[data-layout="appletv"] .head {',
                '  background: rgba(0,0,0,.7) !important;',
                '  -webkit-backdrop-filter: blur(20px) !important;',
                '  backdrop-filter: blur(20px) !important;',
                '}'
            ].join('\n'),
            apply: null
        },

        // 5. IMDb — табличный список: маленький постер слева,
        //    название, год, рейтинг — строками как в IMDb
        imdb: {
            title: 'IMDb',
            hint: 'Табличный список с рейтингом справа',
            css: [
                '[data-layout="imdb"] .category-full__items,',
                '[data-layout="imdb"] .items-cards,',
                '[data-layout="imdb"] .card-list {',
                '  display: flex !important;',
                '  flex-direction: column !important;',
                '  gap: .5em !important;',
                '  padding: 1em 1.5em !important;',
                '}',

                /* Карточка — горизонтальная строка */
                '[data-layout="imdb"] .card,',
                '[data-layout="imdb"] .card--category {',
                '  display: flex !important;',
                '  flex-direction: row !important;',
                '  align-items: center !important;',
                '  width: 100% !important;',
                '  min-height: 4.5em !important;',
                '  aspect-ratio: unset !important;',
                '  background: #1a1a1a !important;',
                '  border-radius: 4px !important;',
                '  overflow: hidden !important;',
                '  padding: .4em !important;',
                '  transition: background .15s ease !important;',
                '}',

                /* Миниатюра слева */
                '[data-layout="imdb"] .card img {',
                '  flex: 0 0 auto !important;',
                '  width: 3em !important;',
                '  height: 4.2em !important;',
                '  object-fit: cover !important;',
                '  border-radius: 3px !important;',
                '  margin-right: 1em !important;',
                '}',

                /* Название — по центру */
                '[data-layout="imdb"] .card__title {',
                '  position: static !important;',
                '  flex: 1 1 auto !important;',
                '  background: transparent !important;',
                '  color: #fff !important;',
                '  text-align: left !important;',
                '  padding: 0 !important;',
                '  font-size: 1em !important;',
                '  font-weight: 500 !important;',
                '  text-shadow: none !important;',
                '}',

                '[data-layout="imdb"] .card.focus {',
                '  background: #2e2e2e !important;',
                '  box-shadow: inset 3px 0 0 #f5c518 !important;',
                '}',

                /* Бейдж рейтинга справа */
                '[data-layout="imdb"] .layout-badge.rating {',
                '  flex: 0 0 auto !important;',
                '  background: #f5c518 !important;',
                '  color: #000 !important;',
                '  font-weight: 700 !important;',
                '  padding: .3em .5em !important;',
                '  border-radius: 3px !important;',
                '  font-size: .9em !important;',
                '  margin-left: auto !important;',
                '  position: static !important;',
                '}',

                '[data-layout="imdb"] .head { background: #121212 !important; }'
            ].join('\n'),
            apply: function () {
                observeCards(function (card) {
                    // Пытаемся показать рейтинг
                    var ratingEl = card.querySelector('.card__rating, .card__vote, .card__rate');
                    if (ratingEl) {
                        addBadge(card, 'inline', ratingEl.textContent.trim(), 'rating');
                        ratingEl.style.display = 'none';
                    } else {
                        // Заглушка — год в жёлтом бейдже (по убыванию приоритета)
                        var y = guessYear(card);
                        if (y) addBadge(card, 'inline', y, 'rating');
                    }
                });
            }
        },

        // ============================================================
        //  УНИКАЛЬНЫЕ
        // ============================================================

        // 6. Журнал — вертикальные постеры 3:4 + текст сбоку,
        //    «журнальные развороты»: карточка — flex-строка,
        //    где постер слева, текст в 2 колонки справа
        magazine: {
            title: 'Журнал',
            hint: 'Разворот журнала: постер + текст в 2 колонки',
            css: [
                '[data-layout="magazine"] .category-full__items,',
                '[data-layout="magazine"] .items-cards,',
                '[data-layout="magazine"] .card-list {',
                '  display: grid !important;',
                '  grid-template-columns: 1fr !important;',
                '  gap: 1.2em !important;',
                '  padding: 1em 2em !important;',
                '  max-width: 90em !important;',
                '  margin: 0 auto !important;',
                '}',

                '[data-layout="magazine"] .card,',
                '[data-layout="magazine"] .card--category {',
                '  display: grid !important;',
                '  grid-template-columns: 10em 1fr 1fr !important;',
                '  gap: 1.5em !important;',
                '  padding: 1em !important;',
                '  background: #f5f1e8 !important;',
                '  color: #1a1a1a !important;',
                '  border-radius: 2px !important;',
                '  border-left: 6px solid #c00 !important;',
                '  aspect-ratio: unset !important;',
                '  height: auto !important;',
                '  align-items: stretch !important;',
                '}',

                '[data-layout="magazine"] .card img {',
                '  width: 10em !important;',
                '  height: 100% !important;',
                '  max-height: 14em !important;',
                '  object-fit: cover !important;',
                '  border-radius: 0 !important;',
                '  filter: grayscale(20%) contrast(1.05) !important;',
                '}',

                '[data-layout="magazine"] .card__title {',
                '  position: static !important;',
                '  grid-column: 2 / 4 !important;',
                '  background: transparent !important;',
                '  color: #1a1a1a !important;',
                '  font-family: Georgia, serif !important;',
                '  font-size: 1.6em !important;',
                '  font-weight: 700 !important;',
                '  line-height: 1.15 !important;',
                '  text-shadow: none !important;',
                '  padding: 0 !important;',
                '  border-bottom: 1px solid #1a1a1a !important;',
                '  padding-bottom: .3em !important;',
                '}',

                '[data-layout="magazine"] .card.focus {',
                '  box-shadow: 0 0 0 3px #1a1a1a, 8px 8px 0 rgba(0,0,0,.15) !important;',
                '}',

                '[data-layout="magazine"] .head {',
                '  background: #f5f1e8 !important;',
                '  color: #1a1a1a !important;',
                '  border-bottom: 2px solid #1a1a1a !important;',
                '}',
                '[data-layout="magazine"] .head * { color: #1a1a1a !important; }'
            ].join('\n'),
            apply: null
        },

        // 7. Кинолента — лента 35mm: карточки «кадры» с перфорацией
        //    сверху и снизу, чёрно-белые пока не в фокусе
        filmstrip: {
            title: 'Кинолента',
            hint: 'Кадры на 35мм плёнке с перфорацией',
            css: [
                /* Фон — «плёнка» */
                '[data-layout="filmstrip"] body,',
                '[data-layout="filmstrip"] .background {',
                '  background: #0a0a0a !important;',
                '}',

                '[data-layout="filmstrip"] .category-full__items,',
                '[data-layout="filmstrip"] .items-cards,',
                '[data-layout="filmstrip"] .card-list {',
                '  display: grid !important;',
                '  grid-template-columns: repeat(auto-fill, minmax(15em, 1fr)) !important;',
                '  gap: 2.2em 1.4em !important;',
                '  padding: 2.5em 1.5em !important;',
                '  background: #0a0a0a !important;',
                '  background-image:',
                '    repeating-linear-gradient(90deg, transparent 0 14px, rgba(255,255,255,.06) 14px 18px, transparent 18px 22px),',
                '    repeating-linear-gradient(90deg, transparent 0 14px, rgba(255,255,255,.06) 14px 18px, transparent 18px 22px) !important;',
                '  background-position: 0 2px, 0 calc(100% - 2px) !important;',
                '  background-size: 100% 10px !important;',
                '  background-repeat: repeat-x !important;',
                '}',

                '[data-layout="filmstrip"] .card,',
                '[data-layout="filmstrip"] .card--category {',
                '  aspect-ratio: 4 / 3 !important;',
                '  border-radius: 0 !important;',
                '  overflow: hidden !important;',
                '  background: #000 !important;',
                '  border: 2px solid #1a1a1a !important;',
                '  box-shadow: inset 0 0 0 4px #000, inset 0 0 0 6px #222 !important;',
                '  transition: all .2s ease !important;',
                '  filter: grayscale(100%) contrast(.9) brightness(.85) !important;',
                '}',
                '[data-layout="filmstrip"] .card img {',
                '  width: 100% !important;',
                '  height: 100% !important;',
                '  object-fit: cover !important;',
                '}',

                '[data-layout="filmstrip"] .card.focus {',
                '  filter: grayscale(0) contrast(1.1) brightness(1) !important;',
                '  border-color: #f5c518 !important;',
                '  box-shadow: 0 0 0 2px #f5c518, inset 0 0 0 4px #000, inset 0 0 0 6px #f5c518 !important;',
                '  transform: scale(1.04) !important;',
                '  z-index: 5 !important;',
                '}',

                '[data-layout="filmstrip"] .card__title {',
                '  position: absolute !important;',
                '  bottom: 0; left: 0; right: 0;',
                '  padding: .5em !important;',
                '  background: rgba(0,0,0,.85) !important;',
                '  color: #f5c518 !important;',
                '  font-family: "Courier New", monospace !important;',
                '  font-size: .8em !important;',
                '  letter-spacing: .05em !important;',
                '  text-transform: uppercase !important;',
                '  text-shadow: none !important;',
                '}',

                '[data-layout="filmstrip"] .head {',
                '  background: #000 !important;',
                '  border-bottom: 2px solid #f5c518 !important;',
                '}'
            ].join('\n'),
            apply: null
        },

        // 8. Masonry — плитка разных размеров: часть карточек
        //    большие, часть маленькие, без выравнивания по сетке
        masonry: {
            title: 'Masonry',
            hint: 'Плитка разных размеров (нестрогая сетка)',
            css: [
                '[data-layout="masonry"] .category-full__items,',
                '[data-layout="masonry"] .items-cards,',
                '[data-layout="masonry"] .card-list {',
                '  display: grid !important;',
                '  grid-template-columns: repeat(12, 1fr) !important;',
                '  grid-auto-rows: 6em !important;',
                '  gap: .8em !important;',
                '  padding: 1em !important;',
                '  grid-auto-flow: dense !important;',
                '}',

                /* По умолчанию карточки — маленькие */
                '[data-layout="masonry"] .card,',
                '[data-layout="masonry"] .card--category {',
                '  grid-column: span 3 !important;',
                '  grid-row: span 3 !important;',
                '  border-radius: 6px !important;',
                '  overflow: hidden !important;',
                '  background: #1a1a1a !important;',
                '  transition: all .25s ease !important;',
                '  aspect-ratio: unset !important;',
                '}',
                '[data-layout="masonry"] .card img {',
                '  width: 100% !important;',
                '  height: 100% !important;',
                '  object-fit: cover !important;',
                '}',

                /* Каждая 5-я — крупная (2x по ширине и высоте) */
                '[data-layout="masonry"] .card:nth-child(5n+1) {',
                '  grid-column: span 6 !important;',
                '  grid-row: span 4 !important;',
                '}',

                /* Каждая 7-я — высокая */
                '[data-layout="masonry"] .card:nth-child(7n+3) {',
                '  grid-row: span 5 !important;',
                '}',

                /* Каждая 11-я — широкая, низкая */
                '[data-layout="masonry"] .card:nth-child(11n+7) {',
                '  grid-column: span 6 !important;',
                '  grid-row: span 2 !important;',
                '}',

                '[data-layout="masonry"] .card.focus {',
                '  box-shadow: 0 0 0 3px #00d1ff, 0 8px 24px rgba(0,209,255,.4) !important;',
                '  transform: scale(1.03) !important;',
                '  z-index: 3 !important;',
                '}',

                '[data-layout="masonry"] .card__title {',
                '  position: absolute !important;',
                '  bottom: 0; left: 0; right: 0;',
                '  padding: .5em .6em !important;',
                '  background: linear-gradient(180deg, transparent, rgba(0,0,0,.9)) !important;',
                '  color: #fff !important;',
                '  text-shadow: none !important;',
                '  font-size: .8em !important;',
                '}'
            ].join('\n'),
            apply: null
        },

        // 9. Story — вертикальные карточки-сторис 9:16, идут
        //    в ряд, фокус — карточка «открывается» и подсвечивается
        story: {
            title: 'Story',
            hint: 'Вертикальные карточки-сторис 9:16',
            css: [
                '[data-layout="story"] .category-full__items,',
                '[data-layout="story"] .items-cards,',
                '[data-layout="story"] .card-list {',
                '  display: flex !important;',
                '  flex-wrap: nowrap !important;',
                '  gap: 1em !important;',
                '  padding: 2em 2em !important;',
                '  overflow-x: auto !important;',
                '  overflow-y: visible !important;',
                '  align-items: center !important;',
                '  scrollbar-width: none !important;',
                '}',
                '[data-layout="story"] .category-full__items::-webkit-scrollbar,',
                '[data-layout="story"] .items-cards::-webkit-scrollbar,',
                '[data-layout="story"] .card-list::-webkit-scrollbar { display: none !important; }',

                '[data-layout="story"] .card,',
                '[data-layout="story"] .card--category {',
                '  flex: 0 0 auto !important;',
                '  width: 8em !important;',
                '  aspect-ratio: 9 / 16 !important;',
                '  border-radius: 50px !important;',
                '  overflow: hidden !important;',
                '  background: #1a1a1a !important;',
                '  border: 2px solid #333 !important;',
                '  transition: all .3s cubic-bezier(.2,.8,.2,1) !important;',
                '  padding: 2px !important;',
                '}',
                '[data-layout="story"] .card img {',
                '  width: 100% !important;',
                '  height: 100% !important;',
                '  object-fit: cover !important;',
                '  border-radius: 50px !important;',
                '}',

                '[data-layout="story"] .card.focus {',
                '  width: 11em !important;',
                '  border-color: #ff0090 !important;',
                '  box-shadow: 0 0 30px rgba(255,0,144,.6), 0 0 0 3px #ff0090 !important;',
                '  z-index: 10 !important;',
                '  background: linear-gradient(135deg, #ff0090, #ffea00, #00c8ff) !important;',
                '}',

                '[data-layout="story"] .card__title {',
                '  position: absolute !important;',
                '  bottom: 1em; left: 0; right: 0;',
                '  text-align: center !important;',
                '  background: transparent !important;',
                '  color: #fff !important;',
                '  font-size: .75em !important;',
                '  font-weight: 700 !important;',
                '  text-shadow: 0 2px 6px rgba(0,0,0,.9) !important;',
                '}',

                '[data-layout="story"] .head {',
                '  background: #0e0e0e !important;',
                '  border-bottom: 2px solid #ff0090 !important;',
                '}'
            ].join('\n'),
            apply: null
        },

        // 10. Таймлайн — таймлайн как в соцсети: одна широкая карточка
        //     на всю ширину, между ними текст-описание; имитация фида
        timeline: {
            title: 'Таймлайн',
            hint: 'Лента соцсети: одна широкая карточка на экран',
            css: [
                '[data-layout="timeline"] .category-full__items,',
                '[data-layout="timeline"] .items-cards,',
                '[data-layout="timeline"] .card-list {',
                '  display: flex !important;',
                '  flex-direction: column !important;',
                '  gap: 1.6em !important;',
                '  padding: 1em 3em !important;',
                '  max-width: 65em !important;',
                '  margin: 0 auto !important;',
                '}',

                '[data-layout="timeline"] .card,',
                '[data-layout="timeline"] .card--category {',
                '  display: block !important;',
                '  width: 100% !important;',
                '  aspect-ratio: 21 / 9 !important;',
                '  border-radius: 12px !important;',
                '  overflow: hidden !important;',
                '  background: #111 !important;',
                '  box-shadow: 0 4px 20px rgba(0,0,0,.6) !important;',
                '  transition: all .25s ease !important;',
                '  position: relative !important;',
                '}',
                '[data-layout="timeline"] .card img {',
                '  width: 100% !important;',
                '  height: 100% !important;',
                '  object-fit: cover !important;',
                '}',

                /* Тёмный градиент снизу — под текст */
                '[data-layout="timeline"] .card::before {',
                '  content: "";',
                '  position: absolute;',
                '  left: 0; right: 0; bottom: 0; top: 40%;',
                '  background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,.85) 100%);',
                '  pointer-events: none;',
                '  z-index: 1;',
                '}',

                '[data-layout="timeline"] .card__title {',
                '  position: absolute !important;',
                '  left: 2em; bottom: 1.4em; right: 2em;',
                '  background: transparent !important;',
                '  color: #fff !important;',
                '  font-size: 1.4em !important;',
                '  font-weight: 700 !important;',
                '  z-index: 2 !important;',
                '  text-shadow: 0 2px 8px rgba(0,0,0,.9) !important;',
                '}',

                '[data-layout="timeline"] .card.focus {',
                '  box-shadow: 0 8px 40px rgba(255,255,255,.15), 0 0 0 3px #fff !important;',
                '  transform: scale(1.005) !important;',
                '}',

                '[data-layout="timeline"] .head {',
                '  background: #0a0a0a !important;',
                '  border-bottom: 1px solid #222 !important;',
                '}'
            ].join('\n'),
            apply: null
        }
    };

    var THEME_ORDER = [
        'classic',
        'youtube', 'netflix', 'spotify', 'appletv', 'imdb',
        'magazine', 'filmstrip', 'masonry', 'story', 'timeline'
    ];

    // ================================================================
    //  ПРИМЕНЕНИЕ / СБРОС
    // ================================================================

    function currentThemeName() {
        return Lampa.Storage.field(STORAGE_KEY) || 'classic';
    }

    function clearPrevious() {
        stopObserving();

        var old = document.getElementById(STYLE_ID);
        if (old && old.parentNode) old.parentNode.removeChild(old);

        // Удаляем бейджи и вспомогательные классы
        var badges = document.querySelectorAll('.layout-badge');
        [].forEach.call(badges, function (b) { b.parentNode && b.parentNode.removeChild(b); });
    }

    function applyTheme(name) {
        clearPrevious();

        if (!name || name === 'classic') {
            document.body.removeAttribute(BODY_ATTR);
            return;
        }

        var theme = THEMES[name];
        if (!theme) return;

        document.body.setAttribute(BODY_ATTR, name);

        if (theme.css) {
            var style = document.createElement('style');
            style.id = STYLE_ID;
            style.type = 'text/css';
            style.appendChild(document.createTextNode(theme.css));
            document.head.appendChild(style);
        }

        if (typeof theme.apply === 'function') {
            try { theme.apply(); } catch (e) { console.warn('ThemePack apply error:', e); }
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

            // Ставим пункт после размера шрифта
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

            // Пере-применяем при открытии каждой новой активности,
            // т.к. Lampa перерисовывает DOM
            Lampa.Listener.follow('activity', function (e) {
                if (e.type !== 'start') return;
                var name = currentThemeName();
                if (name === 'classic') return;
                setTimeout(function () { applyTheme(name); }, 30);
            });

            applyTheme(currentThemeName());
            console.log('ThemeLayout', 'loaded, current:', currentThemeName());
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
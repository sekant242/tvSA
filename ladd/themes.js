(function () {
    'use strict';

    var STYLE_ID = 'lampa-theme-pack-styles';
    var ACTIVE_KEY = 'lampa_theme_pack_active';

    // =========================================================================
    // 10 тем (включая "Стандартная")
    // =========================================================================
    var THEMES = {

        // =====================================================================
        // 1. СТАНДАРТНАЯ — без изменений
        // =====================================================================
        standard: {
            name: '📺 Стандартная',
            css: ''
        },

        // =====================================================================
        // 2. СЕТКА — карточки превращаются в сетку 4x4, горизонтальный скролл выкл.
        // =====================================================================
        grid: {
            name: '▦ Сетка 4×4',
            css: [
                // Разворачиваем горизонтальный скролл в сетку
                'body.theme-grid .scroll--horizontal { overflow: visible !important; height: auto !important; }',
                'body.theme-grid .scroll--horizontal .scroll__content { overflow: visible !important; height: auto !important; }',
                'body.theme-grid .items-cards.mapping--line {',
                '   display: grid !important;',
                '   grid-template-columns: repeat(4, minmax(0, 1fr)) !important;',
                '   gap: 16px !important;',
                '   width: 100% !important;',
                '   padding: 0 24px !important;',
                '   transform: none !important;',
                '   white-space: normal !important;',
                '   box-sizing: border-box !important;',
                '}',
                // Категория в полноэкранном режиме — 5 колонок
                'body.theme-grid .mapping--grid { grid-template-columns: repeat(5, minmax(0, 1fr)) !important; gap: 16px !important; }',
                'body.theme-grid .card { width: 100% !important; min-width: 0 !important; max-width: none !important; }',
                'body.theme-grid .card__view { width: 100% !important; aspect-ratio: 2 / 3 !important; height: auto !important; border-radius: 10px !important; overflow: hidden !important; }',
                'body.theme-grid .card__img { position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; object-fit: cover !important; }',
                'body.theme-grid .card__title { margin-top: 6px !important; font-size: .95em !important; }'
            ].join('')
        },

        // =====================================================================
        // 3. СПИСОК — карточки становятся строками: постер слева, текст справа
        // =====================================================================
        list: {
            name: '☰ Список',
            css: [
                'body.theme-list .scroll--horizontal { overflow: visible !important; height: auto !important; }',
                'body.theme-list .scroll--horizontal .scroll__content { overflow: visible !important; height: auto !important; }',
                'body.theme-list .items-cards.mapping--line {',
                '   display: flex !important;',
                '   flex-direction: column !important;',
                '   gap: 8px !important;',
                '   width: 100% !important;',
                '   padding: 0 24px 16px !important;',
                '   transform: none !important;',
                '   white-space: normal !important;',
                '   box-sizing: border-box !important;',
                '}',
                'body.theme-list .card {',
                '   display: flex !important;',
                '   flex-direction: row !important;',
                '   align-items: center !important;',
                '   width: 100% !important;',
                '   min-width: 0 !important;',
                '   max-width: none !important;',
                '   background: rgba(255,255,255,.05) !important;',
                '   border-radius: 10px !important;',
                '   padding: 8px 14px 8px 8px !important;',
                '   gap: 14px !important;',
                '   transition: background .2s, transform .2s !important;',
                '}',
                'body.theme-list .card.focus, body.theme-list .card:hover { background: rgba(255,255,255,.15) !important; transform: translateX(6px) !important; }',
                'body.theme-list .card__view {',
                '   width: 66px !important; height: 96px !important; min-width: 66px !important;',
                '   aspect-ratio: auto !important; padding: 0 !important;',
                '   border-radius: 6px !important; overflow: hidden !important;',
                '   position: relative !important;',
                '}',
                'body.theme-list .card__img { position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; object-fit: cover !important; }',
                'body.theme-list .card__title { display: block !important; font-size: 1.05em !important; font-weight: 600 !important; margin: 0 !important; flex: 1 !important; }',
                'body.theme-list .card__age { font-size: .9em !important; opacity: .65 !important; }',
                'body.theme-list .card__vote { position: static !important; margin-left: auto !important; font-size: .95em !important; }',
                'body.theme-list .card__quality, body.theme-list .card__type { display: none !important; }',
                'body.theme-list .items-line__body { padding: 0 !important; }'
            ].join('')
        },

        // =====================================================================
        // 4. КОМПАКТ — плотная сетка 8 карточек в ряд
        // =====================================================================
        compact: {
            name: '▤ Компакт 8 в ряд',
            css: [
                'body.theme-compact .scroll--horizontal { overflow: visible !important; height: auto !important; }',
                'body.theme-compact .items-cards.mapping--line {',
                '   display: grid !important;',
                '   grid-template-columns: repeat(8, minmax(0, 1fr)) !important;',
                '   gap: 8px !important;',
                '   width: 100% !important;',
                '   padding: 0 16px !important;',
                '   transform: none !important;',
                '   white-space: normal !important;',
                '}',
                'body.theme-compact .mapping--grid { grid-template-columns: repeat(8, minmax(0,1fr)) !important; gap: 8px !important; }',
                'body.theme-compact .card { width: 100% !important; min-width: 0 !important; }',
                'body.theme-compact .card__view { width: 100% !important; aspect-ratio: 2 / 3 !important; height: auto !important; border-radius: 4px !important; overflow: hidden !important; }',
                'body.theme-compact .card__img { position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; object-fit: cover !important; }',
                'body.theme-compact .card__title { font-size: .8em !important; margin-top: 4px !important; line-height: 1.1 !important; -webkit-line-clamp: 2 !important; }',
                'body.theme-compact .card__age { font-size: .75em !important; opacity: .6 !important; }',
                'body.theme-compact .card__vote { font-size: .7em !important; padding: .1em .4em !important; }',
                'body.theme-compact .card__quality, body.theme-compact .card__type { display: none !important; }',
                // Меню в виде узкой иконочной полосы
                'body.theme-compact .wrap__left { width: 60px !important; min-width: 60px !important; }',
                'body.theme-compact .menu__item { justify-content: center !important; padding: 12px 0 !important; }',
                'body.theme-compact .menu__text { display: none !important; }',
                'body.theme-compact .menu__ico { margin: 0 !important; }'
            ].join('')
        },

        // =====================================================================
        // 5. КИНОТЕАТР — огромные карточки 2 в ряд, скрытое меню
        // =====================================================================
        cinema: {
            name: '🎬 Кинотеатр',
            css: [
                'body.theme-cinema .wrap__left { width: 0 !important; min-width: 0 !important; overflow: hidden !important; }',
                'body.theme-cinema .scroll--horizontal { overflow: visible !important; height: auto !important; }',
                'body.theme-cinema .items-cards.mapping--line {',
                '   display: grid !important;',
                '   grid-template-columns: repeat(2, minmax(0, 1fr)) !important;',
                '   gap: 32px !important;',
                '   width: 100% !important;',
                '   padding: 0 60px !important;',
                '   transform: none !important;',
                '   white-space: normal !important;',
                '}',
                'body.theme-cinema .mapping--grid { grid-template-columns: repeat(3, minmax(0,1fr)) !important; gap: 32px !important; }',
                'body.theme-cinema .card { width: 100% !important; min-width: 0 !important; transition: transform .3s !important; }',
                'body.theme-cinema .card.focus, body.theme-cinema .card:hover { transform: scale(1.03) !important; z-index: 2 !important; }',
                'body.theme-cinema .card__view { width: 100% !important; aspect-ratio: 16 / 9 !important; height: auto !important; border-radius: 14px !important; overflow: hidden !important; box-shadow: 0 20px 60px rgba(0,0,0,.6) !important; }',
                'body.theme-cinema .card__img { position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; object-fit: cover !important; }',
                'body.theme-cinema .card__title { font-size: 1.5em !important; font-weight: 700 !important; margin-top: 14px !important; letter-spacing: -.02em !important; }',
                'body.theme-cinema .card__age { font-size: 1.05em !important; opacity: .7 !important; }',
                'body.theme-cinema .card__vote { font-size: 1.1em !important; padding: .3em .8em !important; top: 16px !important; left: 16px !important; }',
                'body.theme-cinema .items-line__title { font-size: 1.6em !important; font-weight: 800 !important; }',
                'body.theme-cinema .head__title { font-size: 1.2em !important; }'
            ].join('')
        },

        // =====================================================================
        // 6. ПОЛАРОИД — карточки как винтажные фото с белой рамкой и тенью
        // =====================================================================
        polaroid: {
            name: '📷 Полароид',
            css: [
                'body.theme-polaroid .scroll--horizontal { overflow: visible !important; height: auto !important; }',
                'body.theme-polaroid .items-cards.mapping--line {',
                '   display: grid !important;',
                '   grid-template-columns: repeat(5, minmax(0, 1fr)) !important;',
                '   gap: 30px !important;',
                '   width: 100% !important;',
                '   padding: 40px 30px !important;',
                '   transform: none !important;',
                '   white-space: normal !important;',
                '}',
                'body.theme-polaroid .mapping--grid { grid-template-columns: repeat(5, minmax(0,1fr)) !important; gap: 30px !important; }',
                'body.theme-polaroid .card {',
                '   width: 100% !important; min-width: 0 !important;',
                '   background: #fdfdf5 !important;',
                '   padding: 12px 12px 44px 12px !important;',
                '   border-radius: 3px !important;',
                '   box-shadow: 0 8px 24px rgba(0,0,0,.35), 0 2px 6px rgba(0,0,0,.2) !important;',
                '   transform: rotate(-2deg) !important;',
                '   transition: transform .3s, box-shadow .3s !important;',
                '   box-sizing: border-box !important;',
                '}',
                'body.theme-polaroid .card:nth-child(even) { transform: rotate(2deg) !important; }',
                'body.theme-polaroid .card:nth-child(3n) { transform: rotate(-1deg) !important; }',
                'body.theme-polaroid .card.focus, body.theme-polaroid .card:hover {',
                '   transform: rotate(0) scale(1.08) !important;',
                '   box-shadow: 0 16px 40px rgba(0,0,0,.5), 0 4px 12px rgba(0,0,0,.3) !important;',
                '   z-index: 3 !important;',
                '}',
                'body.theme-polaroid .card__view { width: 100% !important; aspect-ratio: 1 / 1 !important; height: auto !important; border-radius: 0 !important; overflow: hidden !important; background: #000 !important; }',
                'body.theme-polaroid .card__img { position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; object-fit: cover !important; filter: sepia(.15) contrast(1.05) saturate(.9) !important; }',
                'body.theme-polaroid .card__title { color: #2a2a2a !important; font-family: "Courier New", monospace !important; font-size: .95em !important; margin-top: 12px !important; text-align: center !important; font-weight: 700 !important; }',
                'body.theme-polaroid .card__age { color: #6a6a6a !important; font-family: "Courier New", monospace !important; font-size: .85em !important; text-align: center !important; }',
                'body.theme-polaroid .card__vote { color: #c0392b !important; font-family: "Courier New", monospace !important; }',
                'body.theme-polaroid .card__type, body.theme-polaroid .card__quality { display: none !important; }',
                'body.theme-polaroid { background: #2b2620 !important; }'
            ].join('')
        },

        // =====================================================================
        // 7. КВАДРАТЫ — карточки с квадратным постером 6 в ряд
        // =====================================================================
        squares: {
            name: '◼ Квадраты',
            css: [
                'body.theme-squares .scroll--horizontal { overflow: visible !important; height: auto !important; }',
                'body.theme-squares .items-cards.mapping--line {',
                '   display: grid !important;',
                '   grid-template-columns: repeat(6, minmax(0, 1fr)) !important;',
                '   gap: 14px !important;',
                '   width: 100% !important;',
                '   padding: 0 24px !important;',
                '   transform: none !important;',
                '   white-space: normal !important;',
                '}',
                'body.theme-squares .mapping--grid { grid-template-columns: repeat(6, minmax(0,1fr)) !important; gap: 14px !important; }',
                'body.theme-squares .card { width: 100% !important; min-width: 0 !important; }',
                'body.theme-squares .card__view { width: 100% !important; aspect-ratio: 1 / 1 !important; height: auto !important; border-radius: 50% !important; overflow: hidden !important; box-shadow: 0 8px 24px rgba(0,0,0,.4) !important; }',
                'body.theme-squares .card__img { position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; object-fit: cover !important; }',
                'body.theme-squares .card.focus .card__view, body.theme-squares .card:hover .card__view { box-shadow: 0 0 0 4px #ff6ec7, 0 12px 32px rgba(255,110,199,.5) !important; }',
                'body.theme-squares .card__title { text-align: center !important; font-size: .9em !important; margin-top: 10px !important; }',
                'body.theme-squares .card__age { text-align: center !important; font-size: .8em !important; opacity: .6 !important; }',
                'body.theme-squares .card__vote, body.theme-squares .card__type, body.theme-squares .card__quality { display: none !important; }'
            ].join('')
        },

        // =====================================================================
        // 8. МОЗАИКА — 1-й элемент большой, остальные мелкие
        // =====================================================================
        mosaic: {
            name: '🧩 Мозаика',
            css: [
                'body.theme-mosaic .scroll--horizontal { overflow: visible !important; height: auto !important; }',
                'body.theme-mosaic .items-cards.mapping--line {',
                '   display: grid !important;',
                '   grid-template-columns: repeat(4, minmax(0, 1fr)) !important;',
                '   grid-auto-rows: 180px !important;',
                '   gap: 14px !important;',
                '   width: 100% !important;',
                '   padding: 0 24px !important;',
                '   transform: none !important;',
                '   white-space: normal !important;',
                '}',
                'body.theme-mosaic .card { width: 100% !important; min-width: 0 !important; grid-row: span 1 !important; }',
                'body.theme-mosaic .card:nth-child(6n+1) { grid-column: span 2 !important; grid-row: span 2 !important; }',
                'body.theme-mosaic .card:nth-child(6n+4) { grid-column: span 2 !important; grid-row: span 1 !important; }',
                'body.theme-mosaic .card__view { width: 100% !important; height: 100% !important; aspect-ratio: auto !important; border-radius: 8px !important; overflow: hidden !important; }',
                'body.theme-mosaic .card__img { position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; object-fit: cover !important; }',
                'body.theme-mosaic .card__title, body.theme-mosaic .card__age { position: absolute !important; z-index: 2 !important; text-shadow: 0 1px 6px rgba(0,0,0,.9) !important; }',
                'body.theme-mosaic .card__title { bottom: 30px !important; left: 12px !important; right: 12px !important; margin: 0 !important; font-weight: 700 !important; }',
                'body.theme-mosaic .card__age { bottom: 10px !important; left: 12px !important; margin: 0 !important; font-size: .85em !important; }',
                'body.theme-mosaic .card__view::after { content: "" !important; position: absolute !important; inset: 0 !important; background: linear-gradient(180deg, transparent 45%, rgba(0,0,0,.85) 100%) !important; pointer-events: none !important; }'
            ].join('')
        },

        // =====================================================================
        // 9. МИНИМАЛ — текст вместо постеров, тонкие линии, без иконок
        // =====================================================================
        minimal: {
            name: '📝 Минимал',
            css: [
                'body.theme-minimal { background: #f5f5f5 !important; color: #111 !important; }',
                'body.theme-minimal .head { background: #f5f5f5 !important; border-bottom: 1px solid #111 !important; }',
                'body.theme-minimal .head__title { color: #111 !important; letter-spacing: .1em !important; text-transform: uppercase !important; font-weight: 300 !important; }',
                'body.theme-minimal .head svg { color: #111 !important; }',
                'body.theme-minimal .wrap__left { background: #f5f5f5 !important; border-right: 1px solid #ccc !important; }',
                'body.theme-minimal .menu__item { color: #111 !important; border-bottom: 1px solid #eee !important; padding: 14px 20px !important; }',
                'body.theme-minimal .menu__item.focus, body.theme-minimal .menu__item:hover { background: #111 !important; color: #f5f5f5 !important; }',
                'body.theme-minimal .menu__item.focus svg, body.theme-minimal .menu__item:hover svg { color: #f5f5f5 !important; }',
                'body.theme-minimal .scroll--horizontal { overflow: visible !important; height: auto !important; }',
                'body.theme-minimal .items-cards.mapping--line {',
                '   display: grid !important;',
                '   grid-template-columns: repeat(3, minmax(0, 1fr)) !important;',
                '   gap: 0 !important;',
                '   width: 100% !important;',
                '   padding: 0 30px !important;',
                '   transform: none !important;',
                '   white-space: normal !important;',
                '}',
                'body.theme-minimal .mapping--grid { grid-template-columns: repeat(3, minmax(0,1fr)) !important; gap: 0 !important; }',
                'body.theme-minimal .card {',
                '   width: 100% !important; min-width: 0 !important;',
                '   background: transparent !important;',
                '   border-bottom: 1px solid #ddd !important;',
                '   padding: 18px 12px !important;',
                '   display: flex !important; flex-direction: column !important; justify-content: center !important;',
                '   transition: background .15s !important;',
                '}',
                'body.theme-minimal .card.focus, body.theme-minimal .card:hover { background: #fff !important; }',
                'body.theme-minimal .card__view { display: none !important; }',
                'body.theme-minimal .card__title { display: block !important; color: #111 !important; font-weight: 600 !important; font-size: 1.05em !important; margin: 0 !important; line-height: 1.3 !important; }',
                'body.theme-minimal .card__age { color: #888 !important; font-size: .85em !important; margin-top: 4px !important; }',
                'body.theme-minimal .card__vote { color: #111 !important; font-weight: 700 !important; position: static !important; padding: 0 !important; background: none !important; margin-top: 6px !important; font-size: .9em !important; }',
                'body.theme-minimal .card__type, body.theme-minimal .card__quality { display: none !important; }',
                'body.theme-minimal .items-line__title { color: #111 !important; font-weight: 300 !important; letter-spacing: .15em !important; text-transform: uppercase !important; font-size: 1em !important; border-bottom: 1px solid #111 !important; padding-bottom: 8px !important; }',
                'body.theme-minimal .settings, body.theme-minimal .modal__content, body.theme-minimal .selectbox__content { background: #f5f5f5 !important; color: #111 !important; border: 1px solid #111 !important; }',
                'body.theme-minimal .settings-param__name, body.theme-minimal .modal__title, body.theme-minimal .selectbox-item { color: #111 !important; }',
                'body.theme-minimal .settings-param.focus, body.theme-minimal .settings-param:hover, body.theme-minimal .selectbox-item.focus, body.theme-minimal .selectbox-item:hover { background: #111 !important; color: #f5f5f5 !important; }'
            ].join('')
        },

        // =====================================================================
        // 10. ЖУРНАЛ — крупный первый элемент, остальные мелкие, заголовки большие
        // =====================================================================
        magazine: {
            name: '📰 Журнал',
            css: [
                'body.theme-magazine .scroll--horizontal { overflow: visible !important; height: auto !important; }',
                'body.theme-magazine .items-cards.mapping--line {',
                '   display: grid !important;',
                '   grid-template-columns: repeat(3, minmax(0, 1fr)) !important;',
                '   gap: 20px !important;',
                '   width: 100% !important;',
                '   padding: 0 40px !important;',
                '   transform: none !important;',
                '   white-space: normal !important;',
                '}',
                'body.theme-magazine .card { width: 100% !important; min-width: 0 !important; display: flex !important; flex-direction: column !important; }',
                'body.theme-magazine .card:nth-child(1) { grid-column: span 2 !important; grid-row: span 2 !important; }',
                'body.theme-magazine .card__view { width: 100% !important; aspect-ratio: 3 / 4 !important; height: auto !important; border-radius: 4px !important; overflow: hidden !important; }',
                'body.theme-magazine .card:nth-child(1) .card__view { aspect-ratio: 16 / 10 !important; }',
                'body.theme-magazine .card__img { position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; object-fit: cover !important; }',
                'body.theme-magazine .card__title { font-family: Georgia, "Times New Roman", serif !important; font-weight: 700 !important; font-size: 1.05em !important; margin: 12px 0 4px !important; letter-spacing: -.01em !important; line-height: 1.25 !important; }',
                'body.theme-magazine .card:nth-child(1) .card__title { font-size: 2em !important; }',
                'body.theme-magazine .card__age { font-size: .85em !important; opacity: .6 !important; text-transform: uppercase !important; letter-spacing: .1em !important; }',
                'body.theme-magazine .card__vote { top: 12px !important; left: 12px !important; font-weight: 700 !important; }',
                'body.theme-magazine .items-line__title { font-family: Georgia, serif !important; font-size: 1.8em !important; font-weight: 700 !important; letter-spacing: -.02em !important; }',
                // Меню в виде горизонтальной полосы сверху
                'body.theme-magazine .head { background: #0d0d0d !important; border-bottom: 2px solid #fff !important; }',
                'body.theme-magazine .head__title { font-family: Georgia, serif !important; letter-spacing: .15em !important; text-transform: uppercase !important; }'
            ].join('')
        }
    };

    // =========================================================================
    // Инъекция стилей
    // =========================================================================
    function buildCSS() {
        var out = '';
        for (var id in THEMES) out += THEMES[id].css;
        return out;
    }

    function injectStyles() {
        var old = document.getElementById(STYLE_ID);
        if (old) old.remove();
        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.type = 'text/css';
        style.appendChild(document.createTextNode(buildCSS()));
        document.head.appendChild(style);
    }

    function applyTheme(id) {
        if (!THEMES[id]) id = 'standard';

        var classes = (document.body.className || '').split(/\s+/).filter(function (c) {
            return c && c.indexOf('theme-') !== 0;
        });

        if (id !== 'standard') {
            classes.push('theme-' + id);
        }

        document.body.className = classes.join(' ');

        try { localStorage.setItem(ACTIVE_KEY, id); } catch (e) {}
    }

    // =========================================================================
    // Настройки
    // =========================================================================
    function registerSettings() {
        var values = {};
        var order = [];
        for (var id in THEMES) {
            values[id] = THEMES[id].name;
            order.push(id);
        }

        Lampa.SettingsApi.addComponent({
            component: 'theme_pack',
            icon: '<svg width="39" height="39" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">'
                + '<rect x="2" y="2" width="15" height="15" rx="2" stroke="white" stroke-width="2.5"/>'
                + '<rect x="22" y="2" width="15" height="15" rx="2" stroke="white" stroke-width="2.5"/>'
                + '<rect x="2" y="22" width="15" height="15" rx="2" stroke="white" stroke-width="2.5"/>'
                + '<rect x="22" y="22" width="15" height="15" rx="2" fill="white"/></svg>',
            name: 'Темы оформления',
            after: 'interface'
        });

        Lampa.SettingsApi.addParam({
            component: 'theme_pack',
            param: {
                name: 'theme_pack_choice',
                type: 'select',
                values: values,
                'default': 'standard'
            },
            field: {
                name: 'Выбор темы',
                description: 'Кардинально меняет раскладку карточек, меню и шапки. Применяется мгновенно.'
            },
            onChange: function (value) {
                applyTheme(value);
                var t = THEMES[value];
                Lampa.Noty.show('Тема: ' + (t ? t.name : value));
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'theme_pack',
            param: { type: 'title' },
            field: { name: 'Действия' }
        });

        Lampa.SettingsApi.addParam({
            component: 'theme_pack',
            param: { name: 'theme_pack_reset', type: 'button' },
            field: {
                name: 'Вернуть стандартную тему',
                description: 'Сбросить все изменения раскладки'
            },
            onChange: function () {
                applyTheme('standard');
                Lampa.Storage.set('theme_pack_choice', 'standard');
                Lampa.Noty.show('Стандартная тема восстановлена');
            }
        });
    }

    // =========================================================================
    // Инициализация
    // =========================================================================
    function waitForLampa(cb) {
        if (typeof Lampa !== 'undefined' && Lampa.SettingsApi && Lampa.Storage) return cb();
        setTimeout(function () { waitForLampa(cb); }, 200);
    }

    function init() {
        injectStyles();

        var saved = localStorage.getItem(ACTIVE_KEY);
        if (saved && THEMES[saved]) {
            applyTheme(saved);
            // синхронизируем настройку
            if (Lampa.Storage.get('theme_pack_choice') !== saved) {
                Lampa.Storage.set('theme_pack_choice', saved, true);
            }
        }

        registerSettings();

        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') {
                var s = localStorage.getItem(ACTIVE_KEY);
                if (s && THEMES[s]) applyTheme(s);
            }
        });

        try {
            Lampa.Noty.show('Плагин «Темы» загружен — ' + (Object.keys(THEMES).length) + ' тем');
        } catch (e) {}
    }

    waitForLampa(init);
})();
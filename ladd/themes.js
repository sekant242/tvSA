(function () {
    'use strict';

    var STYLE_ID = 'lampa-radical-themes';
    var ACTIVE_KEY = 'lampa_radical_theme_active';

    var THEMES = {

        // =====================================================================
        // 1. СТАНДАРТНАЯ — исходный вид Lampa
        // =====================================================================
        standard: {
            name: '🎬 Стандартная',
            css: ''
        },

        // =====================================================================
        // 2. КАРТЫ — карточки лежат стопкой, выбранная выезжает сверху
        // =====================================================================
        cards: {
            name: '🃏 Карты',
            css: [
                '.theme-cards [class*="mapping--grid"], .theme-cards .items-cards.mapping--line {',
                '    display: flex !important;',
                '    justify-content: center !important;',
                '    align-items: flex-start !important;',
                '    position: relative !important;',
                '    min-height: 60vh !important;',
                '    padding: 3em 0 8em !important;',
                '    grid-template-columns: none !important;',
                '    gap: 0 !important;',
                '}',
                '.theme-cards [class*="mapping--grid"] .card, .theme-cards .items-cards.mapping--line .card {',
                '    position: absolute !important;',
                '    top: 2em !important;',
                '    left: 50% !important;',
                '    width: 18em !important;',
                '    margin: 0 !important;',
                '    transition: transform .35s cubic-bezier(.2,.9,.3,1.1), opacity .3s, box-shadow .3s !important;',
                '    transform-origin: 50% 100% !important;',
                '    will-change: transform;',
                '}',
                '.theme-cards .card:nth-child(1) { transform: translateX(-50%) rotate(-6deg) translate(-25px, 20px); opacity: .4; z-index: 1; }',
                '.theme-cards .card:nth-child(2) { transform: translateX(-50%) rotate(-4deg) translate(-15px, 12px); opacity: .55; z-index: 2; }',
                '.theme-cards .card:nth-child(3) { transform: translateX(-50%) rotate(-2deg) translate(-7px, 6px); opacity: .7; z-index: 3; }',
                '.theme-cards .card:nth-child(4) { transform: translateX(-50%) rotate(0deg); opacity: .85; z-index: 4; }',
                '.theme-cards .card:nth-child(5) { transform: translateX(-50%) rotate(2deg) translate(7px, -2px); opacity: .7; z-index: 3; }',
                '.theme-cards .card:nth-child(6) { transform: translateX(-50%) rotate(4deg) translate(15px, -6px); opacity: .55; z-index: 2; }',
                '.theme-cards .card:nth-child(n+7) { transform: translateX(-50%) rotate(6deg) translate(25px, -12px); opacity: .4; z-index: 1; }',
                '.theme-cards .card.focus, .theme-cards .card:hover {',
                '    transform: translateX(-50%) translateY(-3em) scale(1.12) rotate(0deg) !important;',
                '    opacity: 1 !important;',
                '    z-index: 100 !important;',
                '    box-shadow: 0 40px 80px rgba(0,0,0,.85), 0 0 0 2px rgba(255,255,255,.35) !important;',
                '}',
                '.theme-cards .items-line__body { padding-bottom: 3em !important; }',
                '.theme-cards .card__title, .theme-cards .card__age { text-shadow: 0 2px 8px rgba(0,0,0,.9); }'
            ].join('\n')
        },

        // =====================================================================
        // 3. ДИАФИЛЬМ — все карточки в инверсии, выбранная нормальная
        // =====================================================================
        diafilm: {
            name: '🎞️ Диафильм',
            css: [
                '.theme-diafilm [class*="mapping--grid"] { grid-template-columns: repeat(6, 1fr) !important; gap: 1.2em !important; padding: 1.5em !important; }',
                '.theme-diafilm [class*="cols--"] { grid-template-columns: repeat(6, 1fr) !important; }',
                '.theme-diafilm .card {',
                '    filter: invert(1) hue-rotate(180deg) !important;',
                '    transition: filter .3s ease, transform .3s ease, box-shadow .3s ease !important;',
                '}',
                '.theme-diafilm .card.focus, .theme-diafilm .card:hover {',
                '    filter: invert(0) hue-rotate(0) !important;',
                '    transform: scale(1.08) !important;',
                '    z-index: 10 !important;',
                '    box-shadow: 0 0 0 3px #fff, 0 0 40px rgba(255,255,255,.5), 0 20px 50px rgba(0,0,0,.7) !important;',
                '}',
                '.theme-diafilm .card.focus .card__title, .theme-diafilm .card.focus .card__age {',
                '    color: #fff !important;',
                '    text-shadow: 0 2px 6px rgba(0,0,0,.9);',
                '}',
                '.theme-diafilm .items-cards.mapping--line .card { width: 12em !important; }',
                '.theme-diafilm .items-line__title { filter: invert(1) hue-rotate(180deg); }'
            ].join('\n')
        },

        // =====================================================================
        // 4. ЛУПА — все маленькие, выбранная раздувается как через лупу
        // =====================================================================
        lupa: {
            name: '🔍 Лупа',
            css: [
                '.theme-lupa [class*="mapping--grid"] { grid-template-columns: repeat(7, 1fr) !important; gap: 1em !important; padding: 2em !important; }',
                '.theme-lupa [class*="cols--"] { grid-template-columns: repeat(7, 1fr) !important; }',
                '.theme-lupa .card {',
                '    opacity: .45;',
                '    transform: scale(.85);',
                '    filter: blur(2px) saturate(.6);',
                '    transition: all .35s cubic-bezier(.2,.9,.3,1.15) !important;',
                '}',
                '.theme-lupa .card.focus {',
                '    opacity: 1 !important;',
                '    transform: scale(1.9) translateY(-10px) !important;',
                '    filter: blur(0) saturate(1.2) !important;',
                '    z-index: 50 !important;',
                '    box-shadow: 0 30px 70px rgba(0,0,0,.9), 0 0 0 3px rgba(120,200,255,.7), 0 0 80px rgba(120,200,255,.35) !important;',
                '}',
                '.theme-lupa .items-cards.mapping--line .card { width: 11em !important; }',
                '.theme-lupa .items-cards.mapping--line .card.focus { transform: scale(1.5) translateY(-6px) !important; }'
            ].join('\n')
        },

        // =====================================================================
        // 5. КАРУСЕЛЬ — 3D-карусель, соседи развёрнуты вокруг фокуса
        // =====================================================================
        carousel: {
            name: '🎠 Карусель',
            css: [
                '.theme-carousel [class*="mapping--grid"], .theme-carousel .items-cards.mapping--line {',
                '    display: flex !important;',
                '    flex-direction: row !important;',
                '    justify-content: center !important;',
                '    align-items: center !important;',
                '    perspective: 1400px !important;',
                '    perspective-origin: 50% 50% !important;',
                '    padding: 4em 0 !important;',
                '    gap: -3em !important;',
                '    grid-template-columns: none !important;',
                '    overflow: hidden !important;',
                '    min-height: 32em;',
                '}',
                '.theme-carousel .card {',
                '    width: 15em !important;',
                '    flex: 0 0 auto !important;',
                '    transform: rotateY(65deg) translateZ(-150px);',
                '    transition: transform .4s ease, opacity .3s !important;',
                '    opacity: .25;',
                '    transform-origin: center !important;',
                '}',
                '.theme-carousel .card.focus {',
                '    transform: rotateY(0deg) translateZ(80px) scale(1.15) !important;',
                '    opacity: 1 !important;',
                '    z-index: 50 !important;',
                '    box-shadow: 0 40px 90px rgba(0,0,0,.9), 0 0 0 2px rgba(255,255,255,.4) !important;',
                '}',
                '.theme-carousel .card:nth-child(2n) { transform: rotateY(60deg) translateZ(-100px); }',
                '.theme-carousel .card:nth-child(2n+1) { transform: rotateY(-60deg) translateZ(-100px); }',
                '.theme-carousel .items-line__body { padding: 2em 0 !important; }'
            ].join('\n')
        },

        // =====================================================================
        // 6. КНИГА — раскрытый разворот: постер слева, текст справа
        // =====================================================================
        book: {
            name: '📖 Книга',
            css: [
                '.theme-book [class*="mapping--grid"] { grid-template-columns: 1fr !important; max-width: 70vw; margin: 0 auto; padding: 2em !important; gap: 3em !important; }',
                '.theme-book [class*="cols--"] { grid-template-columns: 1fr !important; }',
                '.theme-book .card {',
                '    display: grid !important;',
                '    grid-template-columns: 4fr 6fr !important;',
                '    gap: 0 !important;',
                '    aspect-ratio: 16 / 9 !important;',
                '    border-radius: 6px !important;',
                '    overflow: hidden !important;',
                '    background: #f5efe0 !important;',
                '    box-shadow: 0 25px 60px rgba(0,0,0,.55), inset 0 0 60px rgba(139,101,45,.15) !important;',
                '    padding: 0 !important;',
                '    transform: none !important;',
                '}',
                '.theme-book .card::before {',
                '    content: ""; position: absolute; left: 40%; top: 0; bottom: 0; width: 6px;',
                '    background: linear-gradient(90deg, rgba(0,0,0,.25), rgba(0,0,0,0), rgba(0,0,0,.25));',
                '    z-index: 5; pointer-events: none;',
                '}',
                '.theme-book .card__view {',
                '    grid-column: 1 !important; grid-row: 1 !important;',
                '    padding-bottom: 0 !important; height: 100% !important; border-radius: 0 !important; margin: 0 !important;',
                '}',
                '.theme-book .card__img { position: absolute !important; inset: 0; width: 100% !important; height: 100% !important; object-fit: cover; }',
                '.theme-book .card__title {',
                '    grid-column: 2 !important; grid-row: 1 !important;',
                '    align-self: center;',
                '    font-family: Georgia, "Times New Roman", serif !important;',
                '    font-size: 1.8em !important; font-weight: 700 !important;',
                '    color: #2a1e0f !important;',
                '    padding: 0 2em !important; margin: 0 !important;',
                '    text-align: left; line-height: 1.25 !important;',
                '    position: relative; z-index: 2;',
                '}',
                '.theme-book .card__age {',
                '    position: absolute !important; right: 2em; bottom: 1.5em;',
                '    font-family: Georgia, serif !important; font-style: italic;',
                '    color: #6b5a3a !important; font-size: 1.05em !important;',
                '    margin: 0 !important; z-index: 2;',
                '}',
                '.theme-book .card__vote { top: 1.5em !important; right: 1.5em !important; left: auto !important; z-index: 3; }',
                '.theme-book .card.focus { box-shadow: 0 40px 90px rgba(0,0,0,.75), 0 0 0 3px #c9a227, inset 0 0 60px rgba(139,101,45,.25) !important; }',
                '.theme-book .items-line__title { font-family: Georgia, serif !important; font-style: italic; }'
            ].join('\n')
        },

        // =====================================================================
        // 7. АФИША — огромный постер во всю ширину, тонкая полоска инфо снизу
        // =====================================================================
        afisha: {
            name: '🎭 Афиша',
            css: [
                '.theme-afisha [class*="mapping--grid"] { grid-template-columns: 1fr !important; max-width: 90vw; margin: 0 auto; gap: 4em !important; padding: 3em !important; }',
                '.theme-afisha [class*="cols--"] { grid-template-columns: 1fr !important; }',
                '.theme-afisha .card {',
                '    aspect-ratio: 21 / 9 !important;',
                '    border-radius: 0 !important; overflow: hidden !important;',
                '    position: relative !important;',
                '    box-shadow: 0 30px 80px rgba(0,0,0,.85) !important;',
                '}',
                '.theme-afisha .card__view { padding-bottom: 0 !important; height: 100% !important; border-radius: 0 !important; }',
                '.theme-afisha .card__img { position: absolute !important; inset: 0; width: 100% !important; height: 100% !important; object-fit: cover; }',
                '.theme-afisha .card::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 45%; background: linear-gradient(transparent, rgba(0,0,0,.98)); z-index: 2; pointer-events: none; }',
                '.theme-afisha .card__title {',
                '    position: absolute !important; left: 2em; right: 2em; bottom: 3.5em;',
                '    z-index: 3; margin: 0 !important; padding: 0 !important;',
                '    font-size: 3em !important; font-weight: 900 !important;',
                '    text-transform: uppercase; letter-spacing: -.01em; line-height: 1 !important;',
                '    text-shadow: 0 3px 15px rgba(0,0,0,.9); color: #fff !important;',
                '}',
                '.theme-afisha .card__age {',
                '    position: absolute !important; left: 2em; bottom: 1.5em;',
                '    z-index: 3; margin: 0 !important; color: rgba(255,255,255,.7) !important;',
                '    font-size: 1em !important; letter-spacing: .3em; text-transform: uppercase;',
                '}',
                '.theme-afisha .card__vote { position: absolute !important; top: 1.5em !important; right: 1.5em !important; left: auto !important; z-index: 4; font-size: 1.1em !important; padding: .5em .9em !important; backdrop-filter: blur(8px); background: rgba(0,0,0,.6) !important; }',
                '.theme-afisha .card__quality { position: absolute !important; top: 1.5em !important; left: 1.5em !important; z-index: 4; }',
                '.theme-afisha .card.focus { transform: scale(1.02) !important; box-shadow: 0 40px 100px rgba(0,0,0,.95), 0 0 0 2px rgba(255,255,255,.3) !important; }'
            ].join('\n')
        },

        // =====================================================================
        // 8. РАДУГА — каждая карточка повёрнута своим случайным углом
        // =====================================================================
        rainbow: {
            name: '🌈 Радуга',
            css: [
                '.theme-rainbow [class*="mapping--grid"] { grid-template-columns: repeat(5, 1fr) !important; gap: 3em 2.5em !important; padding: 3em !important; }',
                '.theme-rainbow [class*="cols--"] { grid-template-columns: repeat(5, 1fr) !important; }',
                '.theme-rainbow .card {',
                '    transition: transform .3s ease, box-shadow .3s ease !important;',
                '    border-radius: 8px !important;',
                '}',
                '.theme-rainbow .card:nth-child(10n+1) { transform: rotate(-7deg) !important; }',
                '.theme-rainbow .card:nth-child(10n+2) { transform: rotate(5deg) !important; }',
                '.theme-rainbow .card:nth-child(10n+3) { transform: rotate(-3deg) !important; }',
                '.theme-rainbow .card:nth-child(10n+4) { transform: rotate(8deg) !important; }',
                '.theme-rainbow .card:nth-child(10n+5) { transform: rotate(-5deg) !important; }',
                '.theme-rainbow .card:nth-child(10n+6) { transform: rotate(6deg) !important; }',
                '.theme-rainbow .card:nth-child(10n+7) { transform: rotate(-8deg) !important; }',
                '.theme-rainbow .card:nth-child(10n+8) { transform: rotate(2deg) !important; }',
                '.theme-rainbow .card:nth-child(10n+9) { transform: rotate(-6deg) !important; }',
                '.theme-rainbow .card:nth-child(10n) { transform: rotate(4deg) !important; }',
                '.theme-rainbow .card.focus {',
                '    transform: rotate(0) scale(1.18) translateY(-10px) !important;',
                '    z-index: 50 !important;',
                '    box-shadow: 0 30px 70px rgba(0,0,0,.8), 0 0 0 3px #fff !important;',
                '}',
                '.theme-rainbow .items-cards.mapping--line .card { width: 12em !important; }',
                '.theme-rainbow .items-cards.mapping--line .card:nth-child(odd) { transform: rotate(-4deg) !important; }',
                '.theme-rainbow .items-cards.mapping--line .card:nth-child(even) { transform: rotate(4deg) !important; }'
            ].join('\n')
        },

        // =====================================================================
        // 9. ТЕНИ — все карточки чёрные силуэты, выбранная проявляется
        // =====================================================================
        shadows: {
            name: '👤 Тени',
            css: [
                '.theme-shadows [class*="mapping--grid"] { grid-template-columns: repeat(6, 1fr) !important; gap: 1.4em !important; padding: 2em !important; }',
                '.theme-shadows [class*="cols--"] { grid-template-columns: repeat(6, 1fr) !important; }',
                '.theme-shadows .card {',
                '    transition: filter .35s ease, transform .35s ease, box-shadow .35s ease !important;',
                '}',
                '.theme-shadows .card__view { position: relative; }',
                '.theme-shadows .card__img { filter: brightness(0) contrast(1) !important; transition: filter .35s ease !important; }',
                '.theme-shadows .card__title, .theme-shadows .card__age { color: transparent !important; text-shadow: none !important; }',
                '.theme-shadows .card__vote, .theme-shadows .card__quality, .theme-shadows .card__type, .theme-shadows .card__icons-inner { opacity: 0 !important; transition: opacity .35s ease !important; }',
                '.theme-shadows .card.focus .card__img { filter: brightness(1) contrast(1.05) saturate(1.1) !important; }',
                '.theme-shadows .card.focus .card__title, .theme-shadows .card.focus .card__age { color: inherit !important; text-shadow: 0 2px 8px rgba(0,0,0,.9) !important; }',
                '.theme-shadows .card.focus .card__vote, .theme-shadows .card.focus .card__quality, .theme-shadows .card.focus .card__type, .theme-shadows .card.focus .card__icons-inner { opacity: 1 !important; }',
                '.theme-shadows .card.focus { transform: scale(1.1) !important; z-index: 20 !important; box-shadow: 0 0 60px rgba(255,255,255,.35), 0 30px 70px rgba(0,0,0,.9) !important; }',
                '.theme-shadows .items-line__title { opacity: .35; letter-spacing: .2em; text-transform: uppercase; }'
            ].join('\n')
        },

        // =====================================================================
        // 10. ПОЛАРОИД — фото в белой рамке с подписью, повёрнутые
        // =====================================================================
        polaroid: {
            name: '📸 Полароид',
            css: [
                '.theme-polaroid [class*="mapping--grid"] { grid-template-columns: repeat(4, 1fr) !important; gap: 3.5em 3em !important; padding: 3em !important; background: #2a2620 !important; }',
                '.theme-polaroid [class*="cols--"] { grid-template-columns: repeat(4, 1fr) !important; }',
                '.theme-polaroid .card {',
                '    background: #fffdf5 !important;',
                '    padding: .9em .9em 3.2em !important;',
                '    border-radius: 2px !important;',
                '    box-shadow: 0 15px 35px rgba(0,0,0,.6), 0 2px 4px rgba(0,0,0,.4) !important;',
                '    aspect-ratio: auto !important;',
                '    transition: transform .3s ease, box-shadow .3s ease !important;',
                '    transform: rotate(-3deg);',
                '    position: relative;',
                '}',
                '.theme-polaroid .card:nth-child(5n+1) { transform: rotate(-5deg); }',
                '.theme-polaroid .card:nth-child(5n+2) { transform: rotate(3deg); }',
                '.theme-polaroid .card:nth-child(5n+3) { transform: rotate(-2deg); }',
                '.theme-polaroid .card:nth-child(5n+4) { transform: rotate(6deg); }',
                '.theme-polaroid .card:nth-child(5n) { transform: rotate(-4deg); }',
                '.theme-polaroid .card__view {',
                '    border-radius: 0 !important; padding-bottom: 130% !important;',
                '    background: #000 !important; box-shadow: inset 0 0 20px rgba(0,0,0,.4);',
                '}',
                '.theme-polaroid .card__img { filter: contrast(1.05) saturate(.9) sepia(.08) !important; }',
                '.theme-polaroid .card__title {',
                '    position: absolute !important; left: 0; right: 0; bottom: 1em;',
                '    font-family: "Segoe Script", "Bradley Hand", cursive !important;',
                '    font-size: 1.05em !important; font-weight: 400 !important;',
                '    color: #2a2620 !important;',
                '    text-align: center; padding: 0 1em !important; margin: 0 !important;',
                '    text-shadow: none !important;',
                '    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;',
                '    z-index: 3;',
                '}',
                '.theme-polaroid .card__age {',
                '    position: absolute !important; left: 0; right: 0; bottom: .3em;',
                '    text-align: center;',
                '    font-family: "Segoe Script", cursive !important;',
                '    font-size: .8em !important; color: #8a7a5c !important;',
                '    margin: 0 !important; z-index: 3;',
                '}',
                '.theme-polaroid .card__vote { position: absolute !important; top: 1.4em !important; right: 1.4em !important; left: auto !important; z-index: 4; font-size: .85em !important; padding: .25em .6em !important; background: rgba(0,0,0,.7) !important; border-radius: 4px !important; }',
                '.theme-polaroid .card__quality, .theme-polaroid .card__type { position: absolute !important; top: 1.4em !important; left: 1.4em !important; z-index: 4; }',
                '.theme-polaroid .card.focus {',
                '    transform: rotate(0) scale(1.15) translateY(-10px) !important;',
                '    z-index: 50 !important;',
                '    box-shadow: 0 35px 70px rgba(0,0,0,.9), 0 0 0 3px rgba(255,253,245,.9) !important;',
                '}',
                '.theme-polaroid .items-cards.mapping--line .card { width: 12em !important; }',
                '.theme-polaroid .items-line__title { font-family: "Segoe Script", cursive !important; color: #fffdf5 !important; }'
            ].join('\n')
        }
    };

    // =========================================================================
    // Утилиты
    // =========================================================================
    function buildCSS() {
        var out = '';
        for (var id in THEMES) out += '\n/* ===== ' + id + ' ===== */\n' + THEMES[id].css + '\n';
        // Плавный переход для базовых свойств между темами
        out += '\n.card, .card__view, .card__img, .items-line__title, .mapping--grid, .items-cards {'
            + ' transition: transform .35s cubic-bezier(.2,.9,.3,1.1), opacity .3s, filter .3s, box-shadow .3s, border-radius .3s, padding .3s; }';
        return out;
    }

    function injectStyles() {
        var existing = document.getElementById(STYLE_ID);
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.type = 'text/css';
        style.appendChild(document.createTextNode(buildCSS()));
        (document.head || document.documentElement).appendChild(style);
    }

    function applyTheme(id) {
        if (!THEMES[id]) id = 'standard';
        var classes = (document.body.className || '').split(/\s+/).filter(function (c) {
            return c && c.indexOf('theme-') !== 0;
        });
        classes.push('theme-' + id);
        document.body.className = classes.join(' ');
        try { localStorage.setItem(ACTIVE_KEY, id); } catch (e) {}
        Lampa.Listener.send('theme_pack_changed', { theme: id });
    }

    // =========================================================================
    // Настройки
    // =========================================================================
    function registerSettings() {
        var values = {};
        for (var id in THEMES) values[id] = THEMES[id].name;

        Lampa.SettingsApi.addComponent({
            component: 'radical_themes',
            icon: '<svg width="39" height="39" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">'
                + '<rect x="2" y="2" width="16" height="16" rx="3" stroke="white" stroke-width="3"/>'
                + '<rect x="21" y="2" width="16" height="16" rx="3" stroke="white" stroke-width="3" opacity=".5"/>'
                + '<rect x="2" y="21" width="16" height="16" rx="3" stroke="white" stroke-width="3" opacity=".5"/>'
                + '<rect x="21" y="21" width="16" height="16" rx="3" fill="white"/>'
                + '</svg>',
            name: 'Темы оформления',
            after: 'interface'
        });

        Lampa.SettingsApi.addParam({
            component: 'radical_themes',
            param: {
                name: 'radical_theme',
                type: 'select',
                values: values,
                'default': 'standard'
            },
            field: {
                name: 'Выбор темы',
                description: 'Кардинально меняет раскладку, размеры и поведение карточек. Применяется мгновенно.'
            },
            onChange: function (value) {
                applyTheme(value);
                var t = THEMES[value];
                Lampa.Noty.show('Тема: ' + (t ? t.name : value));
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'radical_themes',
            param: { type: 'title' },
            field: { name: 'Сброс' }
        });

        Lampa.SettingsApi.addParam({
            component: 'radical_themes',
            param: { name: 'radical_theme_reset', type: 'button' },
            field: {
                name: 'Вернуть стандартную тему',
                description: 'Сбросить все изменения оформления'
            },
            onChange: function () {
                applyTheme('standard');
                Lampa.Storage.set('radical_theme', 'standard');
                Lampa.Noty.show('Стандартное оформление восстановлено');
            }
        });

        var saved = localStorage.getItem(ACTIVE_KEY);
        if (saved && THEMES[saved]) {
            if (Lampa.Storage.get('radical_theme') !== saved) {
                Lampa.Storage.set('radical_theme', saved, true);
            }
            applyTheme(saved);
        }
    }

    // =========================================================================
    // Старт
    // =========================================================================
    function waitForLampa(cb) {
        if (typeof Lampa !== 'undefined' && Lampa.SettingsApi && Lampa.Storage) return cb();
        setTimeout(function () { waitForLampa(cb); }, 200);
    }

    function init() {
        injectStyles();

        var saved = localStorage.getItem(ACTIVE_KEY);
        if (saved && THEMES[saved]) applyTheme(saved);

        registerSettings();

        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') {
                var s = localStorage.getItem(ACTIVE_KEY);
                if (s && THEMES[s]) applyTheme(s);
            }
        });

        try {
            Lampa.Noty.show('Плагин тем загружен: ' + Object.keys(THEMES).length + ' тем');
        } catch (e) {}
    }

    waitForLampa(init);
})();
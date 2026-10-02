(function () {
    'use strict';

    var STYLE_ID = 'lampa-radical-themes';
    var ACTIVE_KEY = 'lampa_radical_theme_active';

    var THEMES = {

        // =====================================================================
        // 1. СТАНДАРТ — исходный вид Lampa (ничего не меняет)
        // =====================================================================
        standard: {
            name: '🎬 Стандарт',
            css: ''
        },

        // =====================================================================
        // 2. КОМПАКТ — 10 колонок, мелкие карточки, инфо появляется при фокусе
        // =====================================================================
        compact: {
            name: '📦 Компакт',
            css: [
                '.theme-compact [class*="mapping--grid"] { grid-template-columns: repeat(10, 1fr) !important; gap: .35em !important; padding: .5em !important; }',
                '.theme-compact [class*="cols--"] { grid-template-columns: repeat(10, 1fr) !important; }',
                '.theme-compact .card { border-radius: 3px !important; }',
                '.theme-compact .card__title { font-size: .72em !important; margin: .15em 0 0 !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: .55; transition: opacity .2s; }',
                '.theme-compact .card__age { display: none !important; }',
                '.theme-compact .card__vote { font-size: .6em !important; padding: .1em .35em !important; min-height: 0 !important; }',
                '.theme-compact .card__quality, .theme-compact .card__type, .theme-compact .card__icons-inner { display: none !important; }',
                '.theme-compact .card.focus { transform: scale(1.2) !important; z-index: 20 !important; box-shadow: 0 8px 30px rgba(0,0,0,.7) !important; }',
                '.theme-compact .card.focus .card__title { opacity: 1; white-space: normal; }',
                '.theme-compact .items-cards.mapping--line .card { width: 7em !important; }',
                '.theme-compact .items-cards.mapping--line { gap: .35em !important; }',
                '.theme-compact .items-line__title { font-size: .85em !important; opacity: .5; text-transform: uppercase; letter-spacing: .15em; }'
            ].join('\n')
        },

        // =====================================================================
        // 3. ЖУРНАЛ — 2 огромные колонки, крупная типографика, editorial
        // =====================================================================
        magazine: {
            name: '📰 Журнал',
            css: [
                '.theme-magazine [class*="mapping--grid"] { grid-template-columns: repeat(2, 1fr) !important; gap: 2.5em 1.5em !important; padding: 2.5em 3em !important; }',
                '.theme-magazine [class*="cols--"] { grid-template-columns: repeat(2, 1fr) !important; }',
                '.theme-magazine .card { border-radius: 0 !important; box-shadow: 0 15px 40px rgba(0,0,0,.35) !important; background: transparent !important; }',
                '.theme-magazine .card__view { border-radius: 0 !important; }',
                '.theme-magazine .card__title { font-size: 1.5em !important; font-weight: 200 !important; margin-top: 1em !important; letter-spacing: .05em !important; text-transform: uppercase; line-height: 1.15 !important; }',
                '.theme-magazine .card__age { font-size: .9em !important; opacity: .5 !important; font-style: italic; margin-top: .2em !important; }',
                '.theme-magazine .card__vote { font-size: 1.1em !important; padding: .4em .8em !important; border-radius: 0 !important; top: 1em !important; left: 1em !important; }',
                '.theme-magazine .card.focus .card__title { text-decoration: underline; text-decoration-thickness: 3px; text-underline-offset: .2em; }',
                '.theme-magazine .items-cards.mapping--line .card { width: 22em !important; }',
                '.theme-magazine .items-cards.mapping--line { gap: 2.5em !important; }',
                '.theme-magazine .items-line__title { font-size: 1.8em !important; font-weight: 200 !important; letter-spacing: .12em !important; text-transform: uppercase; margin-bottom: .8em !important; }',
                '.theme-magazine .items-line { padding: 2em 0 !important; }'
            ].join('\n')
        },

        // =====================================================================
        // 4. СПИСОК — карточки как строки списка: постер слева, текст справа
        // =====================================================================
        list: {
            name: '📋 Список',
            css: [
                '.theme-list [class*="mapping--grid"] { display: flex !important; flex-direction: column !important; gap: .7em !important; padding: 1em 3em !important; grid-template-columns: none !important; }',
                '.theme-list [class*="cols--"] { display: flex !important; flex-direction: column !important; grid-template-columns: none !important; }',
                '.theme-list .card { display: flex !important; flex-direction: row !important; width: 100% !important; height: 9em !important; max-height: 9em !important; border-radius: 10px !important; background: rgba(255,255,255,.06) !important; overflow: hidden; align-items: center; padding: 0 !important; aspect-ratio: auto !important; }',
                '.theme-list .card__view { width: 6em !important; height: 100% !important; flex: 0 0 6em !important; padding-bottom: 0 !important; position: relative !important; border-radius: 0 !important; margin: 0 !important; }',
                '.theme-list .card__img { position: absolute !important; inset: 0; width: 100% !important; height: 100% !important; object-fit: cover; }',
                '.theme-list .card__title { font-size: 1.25em !important; font-weight: 600 !important; margin: 0 0 0 1.5em !important; padding: 0 !important; flex: 1 1 auto; text-align: left; }',
                '.theme-list .card__age { margin: 0 2em 0 1em !important; font-size: 1em !important; opacity: .55; }',
                '.theme-list .card__vote { position: absolute !important; top: auto !important; bottom: .8em !important; right: .8em !important; }',
                '.theme-list .card__quality { position: absolute; top: .6em; left: 6.8em; }',
                '.theme-list .card.focus { background: rgba(255,255,255,.14) !important; transform: translateX(10px) !important; box-shadow: 0 6px 25px rgba(0,0,0,.4) !important; }',
                '.theme-list .items-cards.mapping--line { display: flex !important; flex-direction: column !important; gap: .7em !important; }',
                '.theme-list .items-cards.mapping--line .card { width: 100% !important; height: 7em !important; }',
                '.theme-list .items-cards.mapping--line .card__view { flex-basis: 5em !important; width: 5em !important; }'
            ].join('\n')
        },

        // =====================================================================
        // 5. КИНОЗАЛ — 1-2 огромные карточки на весь экран
        // =====================================================================
        cinema: {
            name: '🎥 Кинозал',
            css: [
                '.theme-cinema [class*="mapping--grid"] { grid-template-columns: repeat(2, 1fr) !important; gap: 3em !important; padding: 3em !important; }',
                '.theme-cinema [class*="cols--"] { grid-template-columns: repeat(2, 1fr) !important; }',
                '.theme-cinema .card { border-radius: 24px !important; overflow: hidden; box-shadow: 0 40px 100px rgba(0,0,0,.85) !important; }',
                '.theme-cinema .card__view { border-radius: 24px !important; }',
                '.theme-cinema .card__title { font-size: 2em !important; font-weight: 800 !important; margin-top: 1em !important; text-shadow: 0 3px 15px rgba(0,0,0,.9); letter-spacing: -.01em; }',
                '.theme-cinema .card__age { font-size: 1.15em !important; opacity: .65 !important; }',
                '.theme-cinema .card__vote { font-size: 1.4em !important; padding: .55em 1em !important; border-radius: 14px !important; backdrop-filter: blur(8px); }',
                '.theme-cinema .card.focus { transform: scale(1.04) !important; box-shadow: 0 60px 120px rgba(0,0,0,.95) !important; z-index: 5 !important; }',
                '.theme-cinema .items-cards.mapping--line .card { width: 28em !important; }',
                '.theme-cinema .items-cards.mapping--line { gap: 3em !important; }',
                '.theme-cinema .items-line__title { font-size: 2em !important; font-weight: 300 !important; }'
            ].join('\n')
        },

        // =====================================================================
        // 6. ПОСТЕР — только постеры, инфо поверх при фокусе
        // =====================================================================
        poster: {
            name: '🖼️ Только постеры',
            css: [
                '.theme-poster [class*="mapping--grid"] { grid-template-columns: repeat(6, 1fr) !important; gap: .8em !important; padding: 1.5em !important; }',
                '.theme-poster [class*="cols--"] { grid-template-columns: repeat(6, 1fr) !important; }',
                '.theme-poster .card { position: relative !important; border-radius: 10px !important; overflow: hidden; aspect-ratio: 2 / 3 !important; background: #111 !important; }',
                '.theme-poster .card__view { padding-bottom: 0 !important; height: 100% !important; }',
                '.theme-poster .card__img { position: absolute !important; inset: 0; width: 100% !important; height: 100% !important; object-fit: cover; }',
                '.theme-poster .card__title { position: absolute !important; left: 0 !important; right: 0 !important; bottom: 0 !important; padding: 3em 1em 1em !important; margin: 0 !important; color: #fff !important; font-size: 1em !important; font-weight: 700 !important; background: linear-gradient(transparent 0%, rgba(0,0,0,.9) 100%) !important; opacity: 0 !important; transform: translateY(100%) !important; transition: all .28s ease !important; z-index: 3 !important; text-align: left; }',
                '.theme-poster .card__age { position: absolute !important; top: 1em !important; right: 1em !important; padding: .35em .7em !important; background: rgba(0,0,0,.75) !important; color: #fff !important; border-radius: 6px !important; font-size: .85em !important; margin: 0 !important; z-index: 3 !important; opacity: 0 !important; transition: opacity .28s !important; backdrop-filter: blur(6px); }',
                '.theme-poster .card__vote { position: absolute !important; top: 1em !important; left: 1em !important; font-size: .95em !important; padding: .35em .7em !important; border-radius: 8px !important; background: rgba(0,0,0,.75) !important; z-index: 3 !important; backdrop-filter: blur(6px); }',
                '.theme-poster .card__quality, .theme-poster .card__type { position: absolute !important; top: 3.5em !important; left: 1em !important; z-index: 3 !important; }',
                '.theme-poster .card.focus .card__title, .theme-poster .card:hover .card__title { opacity: 1 !important; transform: translateY(0) !important; }',
                '.theme-poster .card.focus .card__age, .theme-poster .card:hover .card__age { opacity: 1 !important; }',
                '.theme-poster .card.focus { transform: translateY(-4px) !important; box-shadow: 0 20px 50px rgba(0,0,0,.7) !important; z-index: 4 !important; }',
                '.theme-poster .items-cards.mapping--line .card { width: 14em !important; aspect-ratio: 2 / 3 !important; }'
            ].join('\n')
        },

        // =====================================================================
        // 7. РЕТРО-ТВ — старые CRT телевизоры, рамки, сканлайны, сепия
        // =====================================================================
        retro: {
            name: '📺 Ретро-ТВ',
            css: [
                '.theme-retro [class*="mapping--grid"] { grid-template-columns: repeat(4, 1fr) !important; gap: 2em 1.8em !important; padding: 2.5em !important; }',
                '.theme-retro [class*="cols--"] { grid-template-columns: repeat(4, 1fr) !important; }',
                '.theme-retro .card { border-radius: 22px !important; border: 5px solid #c9b88a !important; padding: 8px !important; background: #17120b !important; box-shadow: inset 0 0 40px rgba(0,0,0,.85), 0 0 25px rgba(201,184,138,.25), 0 12px 30px rgba(0,0,0,.7) !important; }',
                '.theme-retro .card__view { border-radius: 16px !important; overflow: hidden; position: relative; }',
                '.theme-retro .card__view::after { content: ""; position: absolute; inset: 0; background: repeating-linear-gradient(0deg, rgba(0,0,0,.28) 0 1px, transparent 1px 3px); pointer-events: none; z-index: 3; opacity: .55; mix-blend-mode: multiply; }',
                '.theme-retro .card__img { filter: sepia(.25) contrast(1.15) saturate(1.2) !important; }',
                '.theme-retro .card__title { font-family: "Courier New", ui-monospace, monospace !important; font-weight: 700 !important; letter-spacing: .08em !important; color: #d8c79a !important; text-transform: uppercase; font-size: .95em !important; }',
                '.theme-retro .card__age { color: #8a7a55 !important; font-family: "Courier New", monospace !important; font-size: .8em !important; }',
                '.theme-retro .card__vote { background: #d8c79a !important; color: #17120b !important; font-family: monospace !important; font-weight: 900 !important; border-radius: 4px !important; }',
                '.theme-retro .card.focus { transform: translateY(-8px) !important; border-color: #f0e3c0 !important; box-shadow: inset 0 0 40px rgba(0,0,0,.85), 0 0 70px rgba(240,227,192,.55), 0 25px 45px rgba(0,0,0,.8) !important; }',
                '.theme-retro .items-cards.mapping--line .card { width: 13em !important; }',
                '.theme-retro .items-line__title { font-family: "Courier New", monospace !important; letter-spacing: .15em !important; text-transform: uppercase; border-bottom: 2px dashed rgba(201,184,138,.5); padding-bottom: .5em; font-weight: 400; }'
            ].join('\n')
        },

        // =====================================================================
        // 8. МОЗАИКА — разные по размеру карточки в плотной сетке
        // =====================================================================
        mosaic: {
            name: '🧩 Мозаика',
            css: [
                '.theme-mosaic [class*="mapping--grid"] { display: grid !important; grid-template-columns: repeat(6, 1fr) !important; grid-auto-rows: 9em !important; grid-auto-flow: dense !important; gap: .8em !important; padding: 1.2em !important; }',
                '.theme-mosaic [class*="cols--"] { grid-template-columns: repeat(6, 1fr) !important; }',
                '.theme-mosaic .card { height: 100% !important; min-height: 0 !important; border-radius: 14px !important; overflow: hidden; position: relative; aspect-ratio: auto !important; }',
                '.theme-mosaic [class*="mapping--grid"] .card:nth-child(7n+1) { grid-column: span 2 !important; grid-row: span 2 !important; }',
                '.theme-mosaic [class*="mapping--grid"] .card:nth-child(7n+4) { grid-column: span 2 !important; }',
                '.theme-mosaic [class*="mapping--grid"] .card:nth-child(11n+2) { grid-row: span 2 !important; }',
                '.theme-mosaic [class*="mapping--grid"] .card:nth-child(13n+5) { grid-column: span 2 !important; grid-row: span 2 !important; }',
                '.theme-mosaic .card__view { padding-bottom: 0 !important; height: 100% !important; }',
                '.theme-mosaic .card__img { position: absolute !important; inset: 0; width: 100% !important; height: 100% !important; object-fit: cover; }',
                '.theme-mosaic .card__title { position: absolute !important; left: 0; right: 0; bottom: 0; margin: 0 !important; padding: 3em .9em .9em !important; background: linear-gradient(transparent, rgba(0,0,0,.95)); color: #fff !important; font-size: .95em !important; font-weight: 600 !important; z-index: 3 !important; text-shadow: 0 1px 3px rgba(0,0,0,.9); }',
                '.theme-mosaic .card__age { position: absolute !important; top: .7em; right: .7em; margin: 0 !important; padding: .25em .6em; background: rgba(0,0,0,.8); color: #fff !important; border-radius: 4px; font-size: .75em !important; z-index: 3; backdrop-filter: blur(4px); }',
                '.theme-mosaic .card__vote { position: absolute !important; top: .7em; left: .7em; z-index: 3; font-size: .8em !important; padding: .25em .55em !important; border-radius: 6px !important; backdrop-filter: blur(4px); }',
                '.theme-mosaic .card.focus { transform: scale(1.03) !important; z-index: 10 !important; box-shadow: 0 0 40px rgba(255,255,255,.55) !important; }',
                '.theme-mosaic .items-cards.mapping--line .card { width: 12em !important; height: 16em !important; }'
            ].join('\n')
        },

        // =====================================================================
        // 9. МИНИМАЛИЗМ — светлый фон, никаких теней, только постеры и текст
        // =====================================================================
        minimal: {
            name: '⚪ Минимализм',
            css: [
                '.theme-minimal, .theme-minimal body, .theme-minimal .background { background: #f4f4f2 !important; color: #111 !important; }',
                '.theme-minimal [class*="mapping--grid"] { grid-template-columns: repeat(6, 1fr) !important; gap: 3em 1.8em !important; padding: 4em !important; }',
                '.theme-minimal [class*="cols--"] { grid-template-columns: repeat(6, 1fr) !important; }',
                '.theme-minimal .card { border-radius: 0 !important; box-shadow: none !important; background: transparent !important; transform: none !important; }',
                '.theme-minimal .card__view { border-radius: 0 !important; }',
                '.theme-minimal .card__title { font-weight: 300 !important; font-size: .95em !important; margin-top: .6em !important; color: #111 !important; letter-spacing: .01em; }',
                '.theme-minimal .card__age { font-weight: 300 !important; font-size: .8em !important; color: #888 !important; margin-top: .15em !important; }',
                '.theme-minimal .card__vote, .theme-minimal .card__quality, .theme-minimal .card__type, .theme-minimal .card__icons-inner { display: none !important; }',
                '.theme-minimal .card.focus .card__view { outline: 2px solid #111 !important; outline-offset: 6px; }',
                '.theme-minimal .card.focus .card__title { text-decoration: underline; text-underline-offset: .25em; }',
                '.theme-minimal .items-cards.mapping--line .card { width: 13em !important; }',
                '.theme-minimal .items-line__title { font-weight: 300 !important; text-transform: uppercase; letter-spacing: .2em; font-size: .85em; color: #999 !important; }',
                '.theme-minimal .head, .theme-minimal .menu, .theme-minimal .modal__content, .theme-minimal .selectbox__content { background: #f4f4f2 !important; color: #111 !important; border-color: rgba(0,0,0,.08) !important; }',
                '.theme-minimal .head__title, .theme-minimal .head__time, .theme-minimal .menu__item, .theme-minimal .settings-param__name, .theme-minimal .modal__title { color: #111 !important; }',
                '.theme-minimal .head svg, .theme-minimal .menu__ico svg { color: #111 !important; }',
                '.theme-minimal .menu__item.focus, .theme-minimal .menu__item:hover { background: rgba(0,0,0,.06) !important; }',
                '.theme-minimal .selectbox-item.focus, .theme-minimal .selectbox-item:hover, .theme-minimal .settings-param.focus { background: rgba(0,0,0,.06) !important; }'
            ].join('\n')
        },

        // =====================================================================
        // 10. ПРОЖЕКТОР — все карточки в тени, в фокусе огромная яркая
        // =====================================================================
        spotlight: {
            name: '🎭 Прожектор',
            css: [
                '.theme-spotlight [class*="mapping--grid"] { grid-template-columns: repeat(5, 1fr) !important; gap: 1.5em !important; padding: 2.5em !important; }',
                '.theme-spotlight [class*="cols--"] { grid-template-columns: repeat(5, 1fr) !important; }',
                '.theme-spotlight .card { opacity: .3; transform: scale(.9); filter: grayscale(85%) brightness(.7); transition: all .35s cubic-bezier(.2,.9,.3,1.1) !important; border-radius: 14px !important; overflow: visible; }',
                '.theme-spotlight .card.focus { opacity: 1 !important; transform: scale(1.12) translateY(-10px) !important; filter: grayscale(0%) brightness(1.05) !important; box-shadow: 0 40px 80px rgba(0,0,0,.85), 0 0 0 3px rgba(255,255,255,.55), 0 0 60px rgba(255,255,255,.25) !important; z-index: 20 !important; }',
                '.theme-spotlight .card.focus .card__title { font-size: 1.35em !important; font-weight: 800 !important; text-shadow: 0 2px 12px rgba(0,0,0,.9); }',
                '.theme-spotlight .card.focus .card__age { font-size: 1em !important; opacity: 1 !important; }',
                '.theme-spotlight .items-cards.mapping--line { padding: 2.5em 0 !important; }',
                '.theme-spotlight .items-cards.mapping--line .card { width: 15em !important; }',
                '.theme-spotlight .items-cards.mapping--line .card.focus { transform: scale(1.1) translateY(-6px) !important; }'
            ].join('\n')
        }
    };

    // =========================================================================
    // Утилиты
    // =========================================================================
    function buildCSS() {
        var out = '';
        for (var id in THEMES) out += '\n/* === ' + id + ' === */\n' + THEMES[id].css;
        // Сглаживание переходов между темами
        out += '\n.card, .items-line, .items-line__title, .mapping--grid, .mapping--line, .items-cards { transition: background .25s, color .25s, border-color .25s, box-shadow .25s, transform .25s, opacity .25s, filter .25s; }\n';
        return out;
    }

    function injectStyles() {
        var existing = document.getElementById(STYLE_ID);
        if (existing) existing.parentNode.removeChild(existing);
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
    // Регистрация в настройках
    // =========================================================================
    function registerSettings() {
        var values = {};
        for (var id in THEMES) values[id] = THEMES[id].name;

        Lampa.SettingsApi.addComponent({
            component: 'radical_themes',
            icon: '<svg width="39" height="39" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">'
                + '<rect x="2" y="2" width="16" height="16" rx="3" stroke="white" stroke-width="3"/>'
                + '<rect x="21" y="2" width="16" height="9" rx="3" stroke="white" stroke-width="3"/>'
                + '<rect x="2" y="21" width="9" height="16" rx="3" stroke="white" stroke-width="3"/>'
                + '<rect x="14" y="14" width="23" height="23" rx="3" fill="white"/>'
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
                description: 'Кардинально меняет раскладку, размеры и положение карточек. Применяется мгновенно.'
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

        // Восстанавливаем сохранённую тему
        var saved = localStorage.getItem(ACTIVE_KEY);
        if (saved && THEMES[saved]) {
            if (Lampa.Storage.get('radical_theme') !== saved) {
                Lampa.Storage.set('radical_theme', saved, true);
            }
            applyTheme(saved);
        }
    }

    // =========================================================================
    // Запуск
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
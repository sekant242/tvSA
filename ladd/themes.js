(function () {
    'use strict';

    var STYLE_ID = 'lampa-theme-pack-styles';
    var ACTIVE_KEY = 'lampa_theme_pack_active';

    // =========================================================================
    // 10 кардинально разных тем
    // =========================================================================
    var THEMES = {

        // ----- 1. Киберпанк -----
        cyberpunk: {
            name: '🌃 Неоновый Киберпанк',
            css: [
                'body.theme-cyberpunk { background: radial-gradient(ellipse at top, #1a0033 0%, #0a0018 50%, #000 100%) !important; color: #e0e0ff !important; }',
                'body.theme-cyberpunk .head, body.theme-cyberpunk .head__body { background: rgba(10,0,25,.85) !important; border-bottom: 2px solid rgba(255,0,255,.5) !important; box-shadow: 0 0 30px rgba(255,0,255,.3) !important; }',
                'body.theme-cyberpunk .head__title, body.theme-cyberpunk .head__time, body.theme-cyberpunk .head__logo-icon { color: #ff00ff !important; text-shadow: 0 0 10px rgba(255,0,255,.8) !important; }',
                'body.theme-cyberpunk .menu, body.theme-cyberpunk .menu__body, body.theme-cyberpunk .wrap__left { background: rgba(10,0,25,.9) !important; border-right: 1px solid rgba(0,255,255,.3) !important; }',
                'body.theme-cyberpunk .menu__item { color: #e0e0ff !important; }',
                'body.theme-cyberpunk .menu__item.focus, body.theme-cyberpunk .menu__item:hover { background: linear-gradient(90deg, rgba(255,0,255,.3), rgba(0,255,255,.1)) !important; border-left: 3px solid #ff00ff !important; color: #fff !important; text-shadow: 0 0 8px rgba(255,0,255,.6) !important; }',
                'body.theme-cyberpunk .card { border: 1px solid rgba(0,255,255,.3) !important; box-shadow: 0 4px 20px rgba(0,255,255,.15) !important; }',
                'body.theme-cyberpunk .card.focus, body.theme-cyberpunk .card:hover { border-color: #ff00ff !important; box-shadow: 0 0 30px rgba(255,0,255,.6), 0 0 60px rgba(0,255,255,.3) !important; transform: translateY(-3px) !important; }',
                'body.theme-cyberpunk .card__title { color: #00ffff !important; text-shadow: 0 0 5px rgba(0,255,255,.5) !important; }',
                'body.theme-cyberpunk .card__age { color: #ff00ff !important; }',
                'body.theme-cyberpunk .card__vote { background: linear-gradient(135deg, #ff00ff, #00ffff) !important; color: #000 !important; font-weight: bold !important; }',
                'body.theme-cyberpunk .settings, body.theme-cyberpunk .modal__content, body.theme-cyberpunk .selectbox__content { background: linear-gradient(180deg, #100025 0%, #05000f 100%) !important; border: 1px solid rgba(255,0,255,.4) !important; box-shadow: 0 0 50px rgba(255,0,255,.2) !important; }',
                'body.theme-cyberpunk .settings-param.focus, body.theme-cyberpunk .settings-param:hover { background: linear-gradient(90deg, rgba(255,0,255,.15), rgba(0,255,255,.05)) !important; }',
                'body.theme-cyberpunk .selectbox-item.focus, body.theme-cyberpunk .selectbox-item:hover { background: linear-gradient(90deg, rgba(255,0,255,.25), rgba(0,255,255,.1)) !important; color: #fff !important; }',
                'body.theme-cyberpunk .simple-button, body.theme-cyberpunk .full-start__button { background: linear-gradient(135deg, rgba(255,0,255,.2), rgba(0,255,255,.2)) !important; border: 1px solid #ff00ff !important; color: #fff !important; }',
                'body.theme-cyberpunk .menu__ico svg, body.theme-cyberpunk .head__action svg { color: #00ffff !important; filter: drop-shadow(0 0 5px rgba(0,255,255,.7)) !important; }'
            ].join('')
        },

        // ----- 2. Вейпорвейв -----
        vaporwave: {
            name: '🌴 Вейпорвейв',
            css: [
                'body.theme-vaporwave { background: linear-gradient(180deg, #2d1b4e 0%, #6b3fa0 40%, #ff6ec7 70%, #ffb07c 100%) !important; color: #ffe8ff !important; }',
                'body.theme-vaporwave .head, body.theme-vaporwave .head__body { background: rgba(45,27,78,.7) !important; border-bottom: 1px solid rgba(255,110,199,.4) !important; }',
                'body.theme-vaporwave .head__title { color: #00e5ff !important; text-shadow: 2px 2px 0 #ff6ec7, 0 0 15px rgba(0,229,255,.5) !important; font-style: italic !important; }',
                'body.theme-vaporwave .menu, body.theme-vaporwave .wrap__left { background: linear-gradient(180deg, rgba(45,27,78,.9), rgba(107,63,160,.85)) !important; }',
                'body.theme-vaporwave .menu__item { color: #ffe8ff !important; }',
                'body.theme-vaporwave .menu__item.focus, body.theme-vaporwave .menu__item:hover { background: linear-gradient(90deg, rgba(255,110,199,.4), rgba(0,229,255,.2)) !important; color: #fff !important; text-shadow: 0 0 8px rgba(255,110,199,.8) !important; }',
                'body.theme-vaporwave .card { border: 1px solid rgba(255,110,199,.4) !important; box-shadow: 0 6px 25px rgba(255,110,199,.25) !important; }',
                'body.theme-vaporwave .card.focus, body.theme-vaporwave .card:hover { box-shadow: 0 0 40px rgba(0,229,255,.6), 0 0 80px rgba(255,110,199,.4) !important; transform: translateY(-4px) scale(1.02) !important; }',
                'body.theme-vaporwave .card__title { color: #00e5ff !important; font-style: italic !important; }',
                'body.theme-vaporwave .card__age { color: #ff6ec7 !important; }',
                'body.theme-vaporwave .settings, body.theme-vaporwave .modal__content, body.theme-vaporwave .selectbox__content { background: linear-gradient(180deg, #2d1b4e, #1a0e2e) !important; border: 1px solid rgba(255,110,199,.4) !important; }',
                'body.theme-vaporwave .selectbox-item.focus, body.theme-vaporwave .selectbox-item:hover { background: linear-gradient(90deg, rgba(255,110,199,.3), rgba(0,229,255,.15)) !important; }',
                'body.theme-vaporwave .simple-button { background: linear-gradient(135deg, #ff6ec7, #00e5ff) !important; color: #1a0e2e !important; font-weight: bold !important; }',
                'body.theme-vaporwave .menu__ico svg { color: #ff6ec7 !important; filter: drop-shadow(0 0 6px rgba(255,110,199,.8)) !important; }'
            ].join('')
        },

        // ----- 3. Дракула -----
        dracula: {
            name: '🧛 Dracula',
            css: [
                'body.theme-dracula { background: #282a36 !important; color: #f8f8f2 !important; }',
                'body.theme-dracula .head, body.theme-dracula .head__body { background: #21222c !important; border-bottom: 1px solid #6272a4 !important; }',
                'body.theme-dracula .head__title { color: #ff79c6 !important; }',
                'body.theme-dracula .menu, body.theme-dracula .wrap__left { background: #21222c !important; }',
                'body.theme-dracula .menu__item { color: #f8f8f2 !important; }',
                'body.theme-dracula .menu__item.focus, body.theme-dracula .menu__item:hover { background: #44475a !important; color: #ff79c6 !important; }',
                'body.theme-dracula .card { border: 1px solid #44475a !important; }',
                'body.theme-dracula .card.focus, body.theme-dracula .card:hover { border-color: #ff79c6 !important; box-shadow: 0 0 25px rgba(255,121,198,.4) !important; }',
                'body.theme-dracula .card__title { color: #bd93f9 !important; }',
                'body.theme-dracula .card__age { color: #8be9fd !important; }',
                'body.theme-dracula .card__vote { background: #50fa7b !important; color: #282a36 !important; font-weight: bold !important; }',
                'body.theme-dracula .settings, body.theme-dracula .modal__content, body.theme-dracula .selectbox__content { background: #282a36 !important; border: 1px solid #44475a !important; }',
                'body.theme-dracula .selectbox-item.focus, body.theme-dracula .selectbox-item:hover { background: #44475a !important; color: #f1fa8c !important; }',
                'body.theme-dracula .simple-button, body.theme-dracula .full-start__button { background: #44475a !important; border: 1px solid #6272a4 !important; color: #f8f8f2 !important; }',
                'body.theme-dracula .menu__ico svg { color: #bd93f9 !important; }'
            ].join('')
        },

        // ----- 4. Матрица -----
        matrix: {
            name: '💊 Матрица',
            css: [
                'body.theme-matrix { background: #000 !important; color: #00ff41 !important; font-family: monospace !important; }',
                'body.theme-matrix .head, body.theme-matrix .head__body { background: #000 !important; border-bottom: 1px solid #00ff41 !important; box-shadow: 0 0 20px rgba(0,255,65,.4) !important; }',
                'body.theme-matrix .head__title, body.theme-matrix .head__time { color: #00ff41 !important; text-shadow: 0 0 8px #00ff41 !important; font-family: monospace !important; letter-spacing: 2px !important; }',
                'body.theme-matrix .menu, body.theme-matrix .wrap__left { background: #000 !important; border-right: 1px solid #00ff41 !important; }',
                'body.theme-matrix .menu__item { color: #00ff41 !important; font-family: monospace !important; }',
                'body.theme-matrix .menu__item.focus, body.theme-matrix .menu__item:hover { background: rgba(0,255,65,.15) !important; border-left: 3px solid #00ff41 !important; color: #fff !important; text-shadow: 0 0 10px #00ff41 !important; }',
                'body.theme-matrix .card { border: 1px solid #00ff41 !important; box-shadow: 0 0 10px rgba(0,255,65,.3) !important; }',
                'body.theme-matrix .card.focus, body.theme-matrix .card:hover { box-shadow: 0 0 30px #00ff41 !important; }',
                'body.theme-matrix .card__title { color: #00ff41 !important; font-family: monospace !important; }',
                'body.theme-matrix .card__age { color: #00aa2b !important; }',
                'body.theme-matrix .settings, body.theme-matrix .modal__content, body.theme-matrix .selectbox__content { background: #000 !important; border: 1px solid #00ff41 !important; box-shadow: 0 0 25px rgba(0,255,65,.3) !important; }',
                'body.theme-matrix .settings-param__name, body.theme-matrix .settings-param__value, body.theme-matrix .settings-param__descr { color: #00ff41 !important; font-family: monospace !important; }',
                'body.theme-matrix .selectbox-item.focus, body.theme-matrix .selectbox-item:hover { background: rgba(0,255,65,.2) !important; color: #fff !important; }',
                'body.theme-matrix .simple-button { background: #000 !important; border: 1px solid #00ff41 !important; color: #00ff41 !important; font-family: monospace !important; }',
                'body.theme-matrix .menu__ico svg, body.theme-matrix .head__action svg { color: #00ff41 !important; }'
            ].join('')
        },

        // ----- 5. Кровавая луна -----
        blood: {
            name: '🩸 Кровавая Луна',
            css: [
                'body.theme-blood { background: radial-gradient(ellipse at top, #2a0000 0%, #0a0000 70%, #000 100%) !important; color: #ffe0e0 !important; }',
                'body.theme-blood .head, body.theme-blood .head__body { background: rgba(20,0,0,.85) !important; border-bottom: 1px solid #8b0000 !important; box-shadow: 0 0 25px rgba(139,0,0,.5) !important; }',
                'body.theme-blood .head__title { color: #ff2020 !important; text-shadow: 0 0 15px rgba(255,32,32,.7) !important; }',
                'body.theme-blood .menu, body.theme-blood .wrap__left { background: rgba(15,0,0,.9) !important; border-right: 1px solid rgba(139,0,0,.5) !important; }',
                'body.theme-blood .menu__item { color: #ffe0e0 !important; }',
                'body.theme-blood .menu__item.focus, body.theme-blood .menu__item:hover { background: linear-gradient(90deg, rgba(139,0,0,.4), rgba(255,0,0,.1)) !important; border-left: 3px solid #ff2020 !important; color: #fff !important; }',
                'body.theme-blood .card { border: 1px solid rgba(139,0,0,.4) !important; }',
                'body.theme-blood .card.focus, body.theme-blood .card:hover { border-color: #ff2020 !important; box-shadow: 0 0 25px rgba(255,32,32,.5), inset 0 0 20px rgba(139,0,0,.2) !important; }',
                'body.theme-blood .card__title { color: #ff6060 !important; }',
                'body.theme-blood .card__age { color: #8b0000 !important; }',
                'body.theme-blood .card__vote { background: #8b0000 !important; color: #fff !important; font-weight: bold !important; }',
                'body.theme-blood .settings, body.theme-blood .modal__content, body.theme-blood .selectbox__content { background: linear-gradient(180deg, #1a0000 0%, #000 100%) !important; border: 1px solid rgba(139,0,0,.5) !important; }',
                'body.theme-blood .selectbox-item.focus, body.theme-blood .selectbox-item:hover { background: rgba(139,0,0,.4) !important; color: #fff !important; }',
                'body.theme-blood .simple-button { background: linear-gradient(135deg, #8b0000, #2a0000) !important; border: 1px solid #ff2020 !important; color: #fff !important; }',
                'body.theme-blood .menu__ico svg { color: #ff2020 !important; }'
            ].join('')
        },

        // ----- 6. Северное сияние -----
        aurora: {
            name: '🌌 Северное Сияние',
            css: [
                'body.theme-aurora { background: linear-gradient(180deg, #0a1628 0%, #0d2a3a 40%, #1a4a5a 70%, #0a1628 100%) !important; color: #d0f0ff !important; }',
                'body.theme-aurora .head, body.theme-aurora .head__body { background: rgba(10,22,40,.8) !important; border-bottom: 1px solid rgba(0,255,200,.3) !important; }',
                'body.theme-aurora .head__title { background: linear-gradient(90deg, #00ff9d, #00c8ff, #b800ff); -webkit-background-clip: text !important; background-clip: text !important; color: transparent !important; font-weight: bold !important; }',
                'body.theme-aurora .menu, body.theme-aurora .wrap__left { background: rgba(10,22,40,.85) !important; }',
                'body.theme-aurora .menu__item { color: #d0f0ff !important; }',
                'body.theme-aurora .menu__item.focus, body.theme-aurora .menu__item:hover { background: linear-gradient(90deg, rgba(0,255,157,.25), rgba(0,200,255,.15), rgba(184,0,255,.1)) !important; color: #fff !important; }',
                'body.theme-aurora .card { border: 1px solid rgba(0,200,255,.3) !important; }',
                'body.theme-aurora .card.focus, body.theme-aurora .card:hover { border-color: #00ff9d !important; box-shadow: 0 0 30px rgba(0,255,157,.5), 0 0 60px rgba(184,0,255,.3) !important; transform: translateY(-3px) !important; }',
                'body.theme-aurora .card__title { color: #7fffd4 !important; }',
                'body.theme-aurora .card__age { color: #b800ff !important; }',
                'body.theme-aurora .settings, body.theme-aurora .modal__content, body.theme-aurora .selectbox__content { background: linear-gradient(180deg, #0a1628, #041020) !important; border: 1px solid rgba(0,200,255,.3) !important; }',
                'body.theme-aurora .selectbox-item.focus, body.theme-aurora .selectbox-item:hover { background: linear-gradient(90deg, rgba(0,255,157,.2), rgba(0,200,255,.1)) !important; color: #fff !important; }',
                'body.theme-aurora .simple-button { background: linear-gradient(135deg, #00ff9d, #00c8ff) !important; color: #0a1628 !important; font-weight: bold !important; }',
                'body.theme-aurora .menu__ico svg { color: #00ff9d !important; filter: drop-shadow(0 0 6px rgba(0,255,157,.8)) !important; }'
            ].join('')
        },

        // ----- 7. Золото -----
        gold: {
            name: '✨ Чёрное Золото',
            css: [
                'body.theme-gold { background: #0a0a0a !important; color: #f5e6c8 !important; }',
                'body.theme-gold .head, body.theme-gold .head__body { background: linear-gradient(180deg, #1a1408 0%, #0a0a0a 100%) !important; border-bottom: 1px solid #d4af37 !important; box-shadow: 0 2px 20px rgba(212,175,55,.3) !important; }',
                'body.theme-gold .head__title { background: linear-gradient(180deg, #f5e6c8, #d4af37, #8b6914); -webkit-background-clip: text !important; background-clip: text !important; color: transparent !important; font-weight: bold !important; letter-spacing: 1px !important; }',
                'body.theme-gold .menu, body.theme-gold .wrap__left { background: linear-gradient(180deg, #1a1408 0%, #0a0a0a 100%) !important; border-right: 1px solid rgba(212,175,55,.3) !important; }',
                'body.theme-gold .menu__item { color: #f5e6c8 !important; }',
                'body.theme-gold .menu__item.focus, body.theme-gold .menu__item:hover { background: linear-gradient(90deg, rgba(212,175,55,.25), rgba(212,175,55,.05)) !important; border-left: 3px solid #d4af37 !important; color: #fff !important; }',
                'body.theme-gold .card { border: 1px solid rgba(212,175,55,.4) !important; }',
                'body.theme-gold .card.focus, body.theme-gold .card:hover { border-color: #d4af37 !important; box-shadow: 0 0 25px rgba(212,175,55,.6), 0 0 50px rgba(212,175,55,.3) !important; }',
                'body.theme-gold .card__title { color: #d4af37 !important; }',
                'body.theme-gold .card__age { color: #8b6914 !important; }',
                'body.theme-gold .card__vote { background: linear-gradient(135deg, #d4af37, #f5e6c8) !important; color: #0a0a0a !important; font-weight: bold !important; }',
                'body.theme-gold .settings, body.theme-gold .modal__content, body.theme-gold .selectbox__content { background: linear-gradient(180deg, #1a1408, #0a0a0a) !important; border: 1px solid rgba(212,175,55,.4) !important; }',
                'body.theme-gold .settings-param__name { color: #f5e6c8 !important; }',
                'body.theme-gold .settings-param__value { color: #d4af37 !important; }',
                'body.theme-gold .selectbox-item.focus, body.theme-gold .selectbox-item:hover { background: linear-gradient(90deg, rgba(212,175,55,.2), transparent) !important; color: #fff !important; }',
                'body.theme-gold .simple-button { background: linear-gradient(135deg, #d4af37, #8b6914) !important; color: #0a0a0a !important; font-weight: bold !important; }',
                'body.theme-gold .menu__ico svg { color: #d4af37 !important; }'
            ].join('')
        },

        // ----- 8. Монохром -----
        monochrome: {
            name: '⚫ Монохром',
            css: [
                'body.theme-monochrome { background: #000 !important; color: #fff !important; filter: grayscale(1) contrast(1.1) !important; }',
                'body.theme-monochrome .head, body.theme-monochrome .head__body { background: #fff !important; color: #000 !important; border-bottom: 3px solid #000 !important; }',
                'body.theme-monochrome .head__title, body.theme-monochrome .head__time { color: #000 !important; font-weight: 900 !important; }',
                'body.theme-monochrome .head svg { color: #000 !important; }',
                'body.theme-monochrome .menu, body.theme-monochrome .wrap__left { background: #fff !important; border-right: 3px solid #000 !important; }',
                'body.theme-monochrome .menu__item { color: #000 !important; font-weight: bold !important; }',
                'body.theme-monochrome .menu__item.focus, body.theme-monochrome .menu__item:hover { background: #000 !important; color: #fff !important; }',
                'body.theme-monochrome .menu__item.focus svg, body.theme-monochrome .menu__item:hover svg { color: #fff !important; }',
                'body.theme-monochrome .card { border: 2px solid #fff !important; box-shadow: 0 4px 0 #fff !important; }',
                'body.theme-monochrome .card.focus, body.theme-monochrome .card:hover { box-shadow: 0 0 0 4px #000, 0 0 0 6px #fff !important; }',
                'body.theme-monochrome .card__title { color: #fff !important; font-weight: bold !important; }',
                'body.theme-monochrome .card__age { color: #888 !important; }',
                'body.theme-monochrome .card__vote { background: #fff !important; color: #000 !important; font-weight: 900 !important; }',
                'body.theme-monochrome .settings, body.theme-monochrome .modal__content, body.theme-monochrome .selectbox__content { background: #fff !important; color: #000 !important; border: 3px solid #000 !important; }',
                'body.theme-monochrome .settings-param__name, body.theme-monochrome .settings-param__value, body.theme-monochrome .settings-param__descr, body.theme-monochrome .modal__title { color: #000 !important; }',
                'body.theme-monochrome .selectbox-item { color: #000 !important; }',
                'body.theme-monochrome .selectbox-item.focus, body.theme-monochrome .selectbox-item:hover { background: #000 !important; color: #fff !important; }',
                'body.theme-monochrome .simple-button { background: #000 !important; color: #fff !important; border: 2px solid #fff !important; font-weight: bold !important; }',
                'body.theme-monochrome svg { color: inherit !important; }'
            ].join('')
        },

        // ----- 9. Закат -----
        sunset: {
            name: '🌅 Тёплый Закат',
            css: [
                'body.theme-sunset { background: linear-gradient(180deg, #1a0a2e 0%, #4a1942 30%, #c9184a 60%, #ff9505 90%, #ffb703 100%) !important; color: #fff5e1 !important; }',
                'body.theme-sunset .head, body.theme-sunset .head__body { background: linear-gradient(180deg, rgba(26,10,46,.85), rgba(74,25,66,.75)) !important; border-bottom: 1px solid #ff9505 !important; box-shadow: 0 2px 20px rgba(255,149,5,.3) !important; }',
                'body.theme-sunset .head__title { background: linear-gradient(90deg, #ffb703, #ff9505, #c9184a); -webkit-background-clip: text !important; background-clip: text !important; color: transparent !important; font-weight: bold !important; }',
                'body.theme-sunset .menu, body.theme-sunset .wrap__left { background: linear-gradient(180deg, rgba(26,10,46,.9), rgba(74,25,66,.85)) !important; }',
                'body.theme-sunset .menu__item { color: #fff5e1 !important; }',
                'body.theme-sunset .menu__item.focus, body.theme-sunset .menu__item:hover { background: linear-gradient(90deg, rgba(255,149,5,.3), rgba(201,24,74,.15)) !important; border-left: 3px solid #ff9505 !important; color: #fff !important; }',
                'body.theme-sunset .card { border: 1px solid rgba(255,149,5,.35) !important; }',
                'body.theme-sunset .card.focus, body.theme-sunset .card:hover { border-color: #ffb703 !important; box-shadow: 0 0 30px rgba(255,183,3,.6), 0 0 60px rgba(201,24,74,.4) !important; transform: translateY(-3px) !important; }',
                'body.theme-sunset .card__title { color: #ffb703 !important; }',
                'body.theme-sunset .card__age { color: #c9184a !important; }',
                'body.theme-sunset .card__vote { background: linear-gradient(135deg, #ffb703, #c9184a) !important; color: #fff !important; font-weight: bold !important; }',
                'body.theme-sunset .settings, body.theme-sunset .modal__content, body.theme-sunset .selectbox__content { background: linear-gradient(180deg, #1a0a2e, #0a0418) !important; border: 1px solid rgba(255,149,5,.4) !important; }',
                'body.theme-sunset .selectbox-item.focus, body.theme-sunset .selectbox-item:hover { background: linear-gradient(90deg, rgba(255,149,5,.25), rgba(201,24,74,.1)) !important; color: #fff !important; }',
                'body.theme-sunset .simple-button { background: linear-gradient(135deg, #ff9505, #c9184a) !important; color: #fff !important; font-weight: bold !important; }',
                'body.theme-sunset .menu__ico svg { color: #ffb703 !important; filter: drop-shadow(0 0 6px rgba(255,183,3,.7)) !important; }'
            ].join('')
        },

        // ----- 10. Ледник -----
        ice: {
            name: '❄️ Ледник',
            css: [
                'body.theme-ice { background: linear-gradient(180deg, #e8f4ff 0%, #c9e4ff 50%, #a8d4f0 100%) !important; color: #0a2540 !important; }',
                'body.theme-ice .head, body.theme-ice .head__body { background: rgba(232,244,255,.85) !important; border-bottom: 2px solid #4a90e2 !important; box-shadow: 0 2px 15px rgba(74,144,226,.2) !important; }',
                'body.theme-ice .head__title { color: #0a2540 !important; font-weight: bold !important; }',
                'body.theme-ice .head__time { color: #4a90e2 !important; }',
                'body.theme-ice .head svg { color: #0a2540 !important; }',
                'body.theme-ice .menu, body.theme-ice .wrap__left { background: linear-gradient(180deg, #e8f4ff, #c9e4ff) !important; border-right: 1px solid rgba(74,144,226,.3) !important; }',
                'body.theme-ice .menu__item { color: #0a2540 !important; }',
                'body.theme-ice .menu__item.focus, body.theme-ice .menu__item:hover { background: linear-gradient(90deg, rgba(74,144,226,.3), rgba(74,144,226,.1)) !important; border-left: 3px solid #4a90e2 !important; color: #0a2540 !important; }',
                'body.theme-ice .menu__ico svg { color: #4a90e2 !important; }',
                'body.theme-ice .card { border: 1px solid rgba(74,144,226,.4) !important; box-shadow: 0 4px 15px rgba(74,144,226,.15) !important; background: rgba(255,255,255,.5) !important; }',
                'body.theme-ice .card.focus, body.theme-ice .card:hover { border-color: #4a90e2 !important; box-shadow: 0 0 30px rgba(74,144,226,.5), 0 0 60px rgba(74,144,226,.2) !important; transform: translateY(-3px) !important; }',
                'body.theme-ice .card__title { color: #0a2540 !important; font-weight: 600 !important; }',
                'body.theme-ice .card__age { color: #4a90e2 !important; }',
                'body.theme-ice .card__vote { background: linear-gradient(135deg, #4a90e2, #7eb8ff) !important; color: #fff !important; font-weight: bold !important; }',
                'body.theme-ice .settings, body.theme-ice .modal__content, body.theme-ice .selectbox__content { background: linear-gradient(180deg, #f0f8ff, #d6ecff) !important; border: 1px solid rgba(74,144,226,.3) !important; box-shadow: 0 4px 30px rgba(74,144,226,.2) !important; }',
                'body.theme-ice .settings-param__name, body.theme-ice .modal__title { color: #0a2540 !important; }',
                'body.theme-ice .settings-param__value { color: #4a90e2 !important; }',
                'body.theme-ice .settings-param__descr { color: #5a7a99 !important; }',
                'body.theme-ice .selectbox-item.focus, body.theme-ice .selectbox-item:hover { background: linear-gradient(90deg, rgba(74,144,226,.25), rgba(74,144,226,.08)) !important; color: #0a2540 !important; }',
                'body.theme-ice .simple-button, body.theme-ice .full-start__button { background: linear-gradient(135deg, #4a90e2, #7eb8ff) !important; color: #fff !important; font-weight: bold !important; border: none !important; }'
            ].join('')
        }
    };

    // =========================================================================
    // Применение темы
    // =========================================================================
    function buildCSS() {
        var out = '';
        for (var id in THEMES) {
            out += THEMES[id].css;
        }
        return out;
    }

    function injectStyles() {
        var existing = document.getElementById(STYLE_ID);
        if (existing) existing.remove();
        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.type = 'text/css';
        style.appendChild(document.createTextNode(buildCSS()));
        document.head.appendChild(style);
    }

    function applyTheme(id) {
        if (!THEMES[id]) {
            // откат на первую тему если неизвестная
            id = Object.keys(THEMES)[0];
        }
        // Убираем все theme-* классы
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
        var order = [];
        for (var id in THEMES) {
            values[id] = THEMES[id].name;
            order.push(id);
        }

        Lampa.SettingsApi.addComponent({
            component: 'theme_pack',
            icon: '<svg width="39" height="39" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">'
                + '<circle cx="19.5" cy="19.5" r="17" stroke="white" stroke-width="3"/>'
                + '<path d="M19.5 2.5C10.1 2.5 2.5 10.1 2.5 19.5C2.5 28.9 10.1 36.5 19.5 36.5V2.5Z" fill="white"/>'
                + '<circle cx="28" cy="12" r="2.5" fill="white"/>'
                + '<circle cx="30" cy="22" r="2" fill="white"/>'
                + '</svg>',
            name: 'Темы оформления',
            after: 'interface'
        });

        Lampa.SettingsApi.addParam({
            component: 'theme_pack',
            param: {
                name: 'theme_pack_choice',
                type: 'select',
                values: values,
                'default': order[0]
            },
            field: {
                name: 'Выбор темы',
                description: 'Кардинально меняет внешний вид приложения. Применяется мгновенно.'
            },
            onChange: function (value) {
                applyTheme(value);
                var t = THEMES[value];
                Lampa.Noty.show('Тема: ' + (t ? t.name : value));
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'theme_pack',
            param: {
                type: 'title'
            },
            field: {
                name: 'Действия'
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'theme_pack',
            param: {
                name: 'theme_pack_reset',
                type: 'button'
            },
            field: {
                name: 'Сбросить тему',
                description: 'Вернуться к исходному оформлению Lampa'
            },
            onChange: function () {
                applyTheme(order[0]);
                Lampa.Storage.set('theme_pack_choice', order[0]);
                Lampa.Noty.show('Тема сброшена');
            }
        });

        // Восстанавливаем сохранённую тему при старте
        var saved = localStorage.getItem(ACTIVE_KEY);
        if (saved && THEMES[saved]) {
            // Синхронизируем параметр с localStorage
            if (Lampa.Storage.get('theme_pack_choice') !== saved) {
                Lampa.Storage.set('theme_pack_choice', saved, true);
            }
            applyTheme(saved);
        }
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

        // Применяем сохранённую тему как можно раньше
        var saved = localStorage.getItem(ACTIVE_KEY);
        if (saved && THEMES[saved]) {
            applyTheme(saved);
        }

        // Регистрируем настройки
        registerSettings();

        // Подписка на событие "ready" — на случай сброса Storage
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') {
                var s = localStorage.getItem(ACTIVE_KEY);
                if (s && THEMES[s]) applyTheme(s);
            }
        });

        // Информируем пользователя
        try {
            Lampa.Noty.show('Плагин "Темы оформления" загружен: ' + Object.keys(THEMES).length + ' тем');
        } catch (e) {}
    }

    waitForLampa(init);
})();
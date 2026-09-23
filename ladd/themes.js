(function () {
    'use strict';

    var STYLE_ID = 'theme_pack_style';
    var STORAGE_KEY = 'interface_theme_pack';

    // ============================================================
    //  ОПРЕДЕЛЕНИЯ ТЕМ
    //  У каждой темы: title (для списка) и css (строка стилей)
    // ============================================================

    var THEMES = {

        default: {
            title: 'По умолчанию',
            css: ''
        },

        // --------------------------------------------------------
        //  ЗНАКОМЫЕ СЕРВИСЫ (5)
        // --------------------------------------------------------

        // 1. YouTube — плоско, мелкие радиусы, красный акцент,
        //    кнопки-«пилюли», без теней
        youtube: {
            title: 'YouTube',
            css: [
                'body, .background { background: #0f0f0f !important; }',
                'body { font-family: -apple-system, "Roboto", Arial, sans-serif !important; }',

                '.card, .card--category {',
                '  background: #181818 !important;',
                '  border-radius: 12px !important;',
                '  box-shadow: none !important;',
                '  transition: transform .15s ease, background .15s ease !important;',
                '}',
                '.card.focus, .card--category.focus {',
                '  background: #272727 !important;',
                '  transform: scale(1.03) !important;',
                '  box-shadow: 0 0 0 2px #ff0000 !important;',
                '}',

                '.button, .full-start__button {',
                '  background: #212121 !important;',
                '  color: #fff !important;',
                '  border-radius: 18px !important;',
                '  font-weight: 500 !important;',
                '  text-transform: none !important;',
                '  letter-spacing: 0 !important;',
                '}',
                '.button.focus, .full-start__button.focus {',
                '  background: #ff0000 !important;',
                '  color: #fff !important;',
                '}',

                '.selector, .online, .torrent-item, .settings-param {',
                '  background: #181818 !important;',
                '  border-radius: 8px !important;',
                '}',
                '.selector.focus, .online.focus, .torrent-item.focus, .settings-param.focus {',
                '  background: #212121 !important;',
                '  box-shadow: 0 0 0 2px #ff0000 !important;',
                '}',

                '.menu__item.focus { background: #ff0000 !important; color: #fff !important; }',
                '.head { background: rgba(15,15,15,.98) !important; }',
                '.modal, .modal__content { background: #212121 !important; border-radius: 12px !important; }'
            ].join('\n')
        },

        // 2. Netflix — тёмный кинематографичный, крупный scale
        //    на фокусе, глянцевая тень в красном цвете
        netflix: {
            title: 'Netflix',
            css: [
                'body, .background { background: #141414 !important; }',
                'body { font-family: "Helvetica Neue", Arial, sans-serif !important; }',

                '.card, .card--category {',
                '  border-radius: 6px !important;',
                '  overflow: hidden !important;',
                '  transition: transform .25s ease, box-shadow .25s ease !important;',
                '}',
                '.card.focus, .card--category.focus {',
                '  transform: scale(1.08) !important;',
                '  box-shadow: 0 8px 24px rgba(229,9,20,.4), 0 0 0 2px #e50914 !important;',
                '  z-index: 10 !important;',
                '}',

                '.card__title, .online__title {',
                '  font-weight: 700 !important;',
                '  letter-spacing: -.02em !important;',
                '}',

                '.button, .full-start__button {',
                '  background: #e50914 !important;',
                '  color: #fff !important;',
                '  border-radius: 4px !important;',
                '  font-weight: 700 !important;',
                '  text-transform: uppercase !important;',
                '  letter-spacing: .05em !important;',
                '}',
                '.button.focus, .full-start__button.focus {',
                '  background: #f6121d !important;',
                '  box-shadow: 0 0 20px rgba(229,9,20,.6) !important;',
                '}',

                '.selector, .online, .torrent-item, .settings-param {',
                '  background: #1f1f1f !important;',
                '  border-radius: 4px !important;',
                '}',
                '.selector.focus, .online.focus, .torrent-item.focus {',
                '  background: #2a2a2a !important;',
                '  box-shadow: 0 0 0 2px #e50914 !important;',
                '}',

                '.menu__item.focus { background: #e50914 !important; }',
                '.head { background: linear-gradient(180deg, rgba(0,0,0,.95) 0%, rgba(20,20,20,0) 100%) !important; }',
                '.modal, .modal__content { background: #1a1a1a !important; }'
            ].join('\n')
        },

        // 3. Spotify — тёмный, зелёный акцент, круглые кнопки,
        //    «парящие» карточки (translateY)
        spotify: {
            title: 'Spotify',
            css: [
                'body, .background { background: #121212 !important; }',
                'body { font-family: -apple-system, "Circular", Arial, sans-serif !important; }',

                '.card, .card--category {',
                '  background: #181818 !important;',
                '  border-radius: 8px !important;',
                '  transition: background .2s ease, transform .2s ease !important;',
                '}',
                '.card.focus, .card--category.focus {',
                '  background: #282828 !important;',
                '  transform: translateY(-4px) !important;',
                '  box-shadow: 0 12px 24px rgba(0,0,0,.6) !important;',
                '}',

                '.button, .full-start__button {',
                '  background: #1db954 !important;',
                '  color: #000 !important;',
                '  border-radius: 500px !important;',
                '  font-weight: 700 !important;',
                '  text-transform: uppercase !important;',
                '  letter-spacing: .08em !important;',
                '  font-size: .9em !important;',
                '}',
                '.button.focus, .full-start__button.focus {',
                '  background: #1ed760 !important;',
                '  transform: scale(1.04) !important;',
                '}',

                '.selector, .online, .torrent-item, .settings-param {',
                '  background: #181818 !important;',
                '  border-radius: 6px !important;',
                '}',
                '.selector.focus, .online.focus, .torrent-item.focus, .settings-param.focus {',
                '  background: #282828 !important;',
                '  box-shadow: 0 0 0 2px #1db954 !important;',
                '}',

                '.menu__item.focus { background: #1db954 !important; color: #000 !important; }',
                '.head { background: #000 !important; }',
                '.modal, .modal__content { background: #181818 !important; border-radius: 8px !important; }'
            ].join('\n')
        },

        // 4. Apple TV+ — стекло, крупные радиусы, тонкие бордеры,
        //    инвертирование цвета на фокусе (белая «пилюля»)
        appletv: {
            title: 'Apple TV+',
            css: [
                'body, .background { background: #000 !important; }',
                'body { font-family: -apple-system, "SF Pro Display", "Helvetica Neue", Arial, sans-serif !important; letter-spacing: -.01em !important; }',

                '.card, .card--category {',
                '  border-radius: 16px !important;',
                '  overflow: hidden !important;',
                '  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease !important;',
                '}',
                '.card.focus, .card--category.focus {',
                '  transform: scale(1.06) !important;',
                '  box-shadow: 0 20px 40px rgba(255,255,255,.1), 0 0 0 3px rgba(255,255,255,.9) !important;',
                '}',

                '.button, .full-start__button {',
                '  background: rgba(255,255,255,.15) !important;',
                '  color: #fff !important;',
                '  border-radius: 12px !important;',
                '  border: 1px solid rgba(255,255,255,.2) !important;',
                '  -webkit-backdrop-filter: blur(20px) !important;',
                '  backdrop-filter: blur(20px) !important;',
                '  font-weight: 500 !important;',
                '}',
                '.button.focus, .full-start__button.focus {',
                '  background: rgba(255,255,255,.95) !important;',
                '  color: #000 !important;',
                '  transform: scale(1.05) !important;',
                '}',

                '.selector, .online, .torrent-item, .settings-param {',
                '  background: rgba(255,255,255,.06) !important;',
                '  border: 1px solid rgba(255,255,255,.08) !important;',
                '  border-radius: 14px !important;',
                '  -webkit-backdrop-filter: blur(20px) !important;',
                '  backdrop-filter: blur(20px) !important;',
                '}',
                '.selector.focus, .online.focus, .torrent-item.focus, .settings-param.focus {',
                '  background: rgba(255,255,255,.15) !important;',
                '  border-color: rgba(255,255,255,.5) !important;',
                '  box-shadow: 0 8px 32px rgba(255,255,255,.1) !important;',
                '}',

                '.menu__item.focus { background: rgba(255,255,255,.15) !important; border-radius: 10px !important; }',
                '.head { background: rgba(0,0,0,.6) !important; -webkit-backdrop-filter: blur(20px) !important; backdrop-filter: blur(20px) !important; }',
                '.modal, .modal__content { background: rgba(20,20,20,.95) !important; -webkit-backdrop-filter: blur(30px) !important; backdrop-filter: blur(30px) !important; border: 1px solid rgba(255,255,255,.1) !important; border-radius: 20px !important; }'
            ].join('\n')
        },

        // 5. Disney+ — глубокий синий, светящиеся бордеры карточек,
        //    «магия» через голубое свечение на фокусе
        disney: {
            title: 'Disney+',
            css: [
                'body, .background { background: #040f2b !important; }',
                'body { font-family: "Avenir", -apple-system, Arial, sans-serif !important; }',

                '.card, .card--category {',
                '  border-radius: 10px !important;',
                '  box-shadow: 0 4px 16px rgba(0,0,0,.6) !important;',
                '  transition: transform .25s ease, box-shadow .25s ease !important;',
                '}',
                '.card.focus, .card--category.focus {',
                '  transform: scale(1.05) !important;',
                '  box-shadow: 0 12px 30px rgba(0,99,229,.5), 0 0 0 2px #0063e5 !important;',
                '}',

                '.button, .full-start__button {',
                '  background: #0063e5 !important;',
                '  color: #fff !important;',
                '  border-radius: 6px !important;',
                '  font-weight: 700 !important;',
                '  letter-spacing: .03em !important;',
                '}',
                '.button.focus, .full-start__button.focus {',
                '  background: #1a7aff !important;',
                '  box-shadow: 0 0 24px rgba(0,99,229,.7) !important;',
                '  transform: scale(1.03) !important;',
                '}',

                '.selector, .online, .torrent-item, .settings-param {',
                '  background: rgba(0,99,229,.08) !important;',
                '  border: 1px solid rgba(0,99,229,.15) !important;',
                '  border-radius: 8px !important;',
                '}',
                '.selector.focus, .online.focus, .torrent-item.focus, .settings-param.focus {',
                '  background: rgba(0,99,229,.25) !important;',
                '  border-color: #0063e5 !important;',
                '  box-shadow: 0 0 12px rgba(0,99,229,.4) !important;',
                '}',

                '.menu__item.focus { background: #0063e5 !important; }',
                '.head { background: linear-gradient(180deg, #040f2b 0%, rgba(4,15,43,.9) 70%, rgba(4,15,43,0) 100%) !important; }',
                '.modal, .modal__content { background: #0a1a3a !important; border: 1px solid #0063e5 !important; border-radius: 10px !important; }'
            ].join('\n')
        },

        // --------------------------------------------------------
        //  УНИКАЛЬНЫЕ (5)
        // --------------------------------------------------------

        // 6. Терминал — CRT: зелёный монохром, сканлайны,
        //    моноширинный шрифт, свечение текста
        terminal: {
            title: 'Терминал (CRT)',
            css: [
                'body, .background {',
                '  background: #000 !important;',
                '  background-image: repeating-linear-gradient(0deg, rgba(0,255,65,.03) 0 1px, transparent 1px 3px) !important;',
                '}',
                'body {',
                '  font-family: "Courier New", "Consolas", monospace !important;',
                '  color: #00ff41 !important;',
                '  text-shadow: 0 0 4px rgba(0,255,65,.7) !important;',
                '  letter-spacing: .02em !important;',
                '}',
                // Сканлайны поверх всего UI
                'body::after {',
                '  content: "";',
                '  position: fixed;',
                '  left: 0; top: 0; right: 0; bottom: 0;',
                '  background: repeating-linear-gradient(0deg, rgba(0,0,0,.15) 0 2px, transparent 2px 4px);',
                '  pointer-events: none;',
                '  z-index: 9999;',
                '  opacity: .45;',
                '}',

                '.card, .card--category {',
                '  background: #001a05 !important;',
                '  border: 1px solid #00ff41 !important;',
                '  border-radius: 0 !important;',
                '  box-shadow: 0 0 8px rgba(0,255,65,.4) !important;',
                '}',
                '.card.focus, .card--category.focus {',
                '  background: #00ff41 !important;',
                '  box-shadow: 0 0 24px rgba(0,255,65,.9) !important;',
                '}',
                '.card.focus *, .card--category.focus * { color: #000 !important; text-shadow: none !important; }',

                '.button, .full-start__button {',
                '  background: transparent !important;',
                '  color: #00ff41 !important;',
                '  border: 2px solid #00ff41 !important;',
                '  border-radius: 0 !important;',
                '  font-family: inherit !important;',
                '  text-transform: uppercase !important;',
                '  letter-spacing: .15em !important;',
                '  font-weight: 700 !important;',
                '}',
                '.button.focus, .full-start__button.focus {',
                '  background: #00ff41 !important;',
                '  color: #000 !important;',
                '  text-shadow: none !important;',
                '}',

                '.selector, .online, .torrent-item, .settings-param {',
                '  background: #001a05 !important;',
                '  color: #00ff41 !important;',
                '  border: 1px solid rgba(0,255,65,.4) !important;',
                '  border-radius: 0 !important;',
                '}',
                '.selector.focus, .online.focus, .torrent-item.focus, .settings-param.focus {',
                '  background: #003a10 !important;',
                '  border-color: #00ff41 !important;',
                '  box-shadow: 0 0 12px rgba(0,255,65,.6) !important;',
                '}',

                '.menu__item { font-family: inherit !important; }',
                '.menu__item.focus { background: #00ff41 !important; color: #000 !important; text-shadow: none !important; }',
                '.head { background: #000 !important; border-bottom: 1px solid #00ff41 !important; }',
                '.modal, .modal__content { background: #001a05 !important; color: #00ff41 !important; border: 2px solid #00ff41 !important; border-radius: 0 !important; }'
            ].join('\n')
        },

        // 7. Киберпанк — неон, свечение, «градиентная пилюля»
        //    на фокусе, радиальный фон
        cyberpunk: {
            title: 'Киберпанк',
            css: [
                'body, .background { background: radial-gradient(ellipse at top, #1a0033 0%, #0a0014 60%, #000 100%) !important; }',
                'body { font-family: "Rajdhani", "Orbitron", "Arial Black", sans-serif !important; letter-spacing: .05em !important; }',

                '.card, .card--category {',
                '  background: rgba(20,0,40,.8) !important;',
                '  border: 1px solid #ff00ff !important;',
                '  border-radius: 4px !important;',
                '  box-shadow: 0 0 8px rgba(255,0,255,.5), inset 0 0 20px rgba(0,255,255,.05) !important;',
                '  transition: all .2s ease !important;',
                '}',
                '.card.focus, .card--category.focus {',
                '  border-color: #00ffff !important;',
                '  box-shadow: 0 0 24px #00ffff, 0 0 48px rgba(255,0,255,.5), inset 0 0 30px rgba(0,255,255,.15) !important;',
                '  transform: scale(1.04) !important;',
                '}',

                '.button, .full-start__button {',
                '  background: linear-gradient(135deg, rgba(255,0,255,.2), rgba(0,255,255,.2)) !important;',
                '  color: #fff !important;',
                '  border: 1px solid #ff00ff !important;',
                '  border-radius: 2px !important;',
                '  font-weight: 700 !important;',
                '  text-transform: uppercase !important;',
                '  letter-spacing: .1em !important;',
                '  text-shadow: 0 0 8px #ff00ff !important;',
                '}',
                '.button.focus, .full-start__button.focus {',
                '  background: linear-gradient(135deg, #ff00ff, #00ffff) !important;',
                '  color: #000 !important;',
                '  text-shadow: none !important;',
                '  box-shadow: 0 0 30px #ff00ff, 0 0 60px rgba(0,255,255,.6) !important;',
                '}',

                '.selector, .online, .torrent-item, .settings-param {',
                '  background: rgba(20,0,40,.7) !important;',
                '  color: #e0d0ff !important;',
                '  border-left: 3px solid #ff00ff !important;',
                '  border-radius: 2px !important;',
                '}',
                '.selector.focus, .online.focus, .torrent-item.focus, .settings-param.focus {',
                '  background: rgba(40,0,80,.9) !important;',
                '  border-left-color: #00ffff !important;',
                '  box-shadow: 0 0 16px rgba(0,255,255,.6), -4px 0 20px rgba(255,0,255,.4) !important;',
                '}',

                '.menu__item.focus { background: linear-gradient(90deg, #ff00ff 0%, #00ffff 100%) !important; color: #000 !important; box-shadow: 0 0 20px #ff00ff !important; }',
                '.head { background: rgba(10,0,20,.95) !important; border-bottom: 1px solid #ff00ff !important; box-shadow: 0 0 20px rgba(255,0,255,.3) !important; }',
                '.modal, .modal__content { background: rgba(15,0,30,.98) !important; border: 1px solid #00ffff !important; border-radius: 4px !important; box-shadow: 0 0 40px rgba(0,255,255,.4) !important; }'
            ].join('\n')
        },

        // 8. Бумага — светлый фон, serif, «нарисованные» тени
        //    (жёсткий offset), точечная текстура
        paper: {
            title: 'Бумага',
            css: [
                'body, .background { background: #f5f1e8 !important; }',
                'body { font-family: Georgia, "Times New Roman", serif !important; color: #2a2a2a !important; }',
                // Текстура бумаги
                'body::before {',
                '  content: "";',
                '  position: fixed;',
                '  left: 0; top: 0; right: 0; bottom: 0;',
                '  background-image:',
                '    radial-gradient(rgba(0,0,0,.03) 1px, transparent 1px),',
                '    radial-gradient(rgba(0,0,0,.03) 1px, transparent 1px);',
                '  background-size: 12px 12px, 12px 12px;',
                '  background-position: 0 0, 6px 6px;',
                '  pointer-events: none;',
                '  z-index: 0;',
                '  opacity: .6;',
                '}',

                '.card, .card--category {',
                '  background: #fffef9 !important;',
                '  border: 2px solid #2a2a2a !important;',
                '  border-radius: 2px !important;',
                '  box-shadow: 4px 4px 0 rgba(42,42,42,.85) !important;',
                '  transition: transform .15s ease, box-shadow .15s ease !important;',
                '}',
                '.card.focus, .card--category.focus {',
                '  transform: translate(-2px,-2px) !important;',
                '  box-shadow: 8px 8px 0 rgba(42,42,42,.9), 8px 8px 0 2px #d97706 !important;',
                '}',

                '.button, .full-start__button {',
                '  background: #fffef9 !important;',
                '  color: #2a2a2a !important;',
                '  border: 2px solid #2a2a2a !important;',
                '  border-radius: 2px !important;',
                '  font-family: inherit !important;',
                '  font-weight: 700 !important;',
                '  letter-spacing: .05em !important;',
                '  box-shadow: 3px 3px 0 rgba(42,42,42,.85) !important;',
                '}',
                '.button.focus, .full-start__button.focus {',
                '  background: #d97706 !important;',
                '  color: #fff !important;',
                '  transform: translate(-2px,-2px) !important;',
                '  box-shadow: 5px 5px 0 rgba(42,42,42,.9) !important;',
                '}',

                '.selector, .online, .torrent-item, .settings-param {',
                '  background: #fffef9 !important;',
                '  color: #2a2a2a !important;',
                '  border: 1px solid #2a2a2a !important;',
                '  border-left: 4px solid #d97706 !important;',
                '  border-radius: 2px !important;',
                '}',
                '.selector.focus, .online.focus, .torrent-item.focus, .settings-param.focus {',
                '  background: #fef3c7 !important;',
                '  border-left-color: #2a2a2a !important;',
                '  box-shadow: 3px 3px 0 rgba(42,42,42,.6) !important;',
                '}',

                '.online__title, .online__quality, .card__title { color: #2a2a2a !important; }',
                '.menu__item.focus { background: #d97706 !important; color: #fff !important; }',
                '.head { background: rgba(245,241,232,.98) !important; border-bottom: 2px solid #2a2a2a !important; }',
                '.head *, .menu * { color: #2a2a2a !important; }',
                '.modal, .modal__content { background: #fffef9 !important; color: #2a2a2a !important; border: 2px solid #2a2a2a !important; border-radius: 2px !important; box-shadow: 6px 6px 0 rgba(42,42,42,.85) !important; }',
                '.modal * { color: #2a2a2a !important; }'
            ].join('\n')
        },

        // 9. Аврора — анимированный градиент фона, glassmorphism,
        //    плавные параллакс-подобные переходы
        aurora: {
            title: 'Аврора',
            css: [
                'body, .background {',
                '  background: linear-gradient(-45deg, #1a0033, #003d5c, #0a4d3a, #2d0060) !important;',
                '  background-size: 400% 400% !important;',
                '  animation: tp_aurora_bg 20s ease infinite !important;',
                '}',
                '@keyframes tp_aurora_bg {',
                '  0% { background-position: 0% 50%; }',
                '  50% { background-position: 100% 50%; }',
                '  100% { background-position: 0% 50%; }',
                '}',
                'body { font-family: -apple-system, "Inter", "Helvetica Neue", Arial, sans-serif !important; letter-spacing: -.01em !important; }',

                '.card, .card--category {',
                '  background: rgba(255,255,255,.08) !important;',
                '  border: 1px solid rgba(255,255,255,.15) !important;',
                '  border-radius: 18px !important;',
                '  -webkit-backdrop-filter: blur(20px) !important;',
                '  backdrop-filter: blur(20px) !important;',
                '  box-shadow: 0 8px 32px rgba(0,0,0,.3) !important;',
                '  transition: all .35s cubic-bezier(.22,1,.36,1) !important;',
                '}',
                '.card.focus, .card--category.focus {',
                '  background: rgba(255,255,255,.2) !important;',
                '  border-color: rgba(255,255,255,.6) !important;',
                '  transform: translateY(-8px) scale(1.03) !important;',
                '  box-shadow: 0 24px 48px rgba(0,0,0,.5), 0 0 40px rgba(160,220,255,.3) !important;',
                '}',

                '.button, .full-start__button {',
                '  background: rgba(255,255,255,.15) !important;',
                '  color: #fff !important;',
                '  border: 1px solid rgba(255,255,255,.3) !important;',
                '  border-radius: 50px !important;',
                '  -webkit-backdrop-filter: blur(20px) !important;',
                '  backdrop-filter: blur(20px) !important;',
                '  font-weight: 500 !important;',
                '  transition: all .3s ease !important;',
                '}',
                '.button.focus, .full-start__button.focus {',
                '  background: rgba(255,255,255,.9) !important;',
                '  color: #1a0033 !important;',
                '  transform: scale(1.06) !important;',
                '  box-shadow: 0 0 40px rgba(180,220,255,.8) !important;',
                '}',

                '.selector, .online, .torrent-item, .settings-param {',
                '  background: rgba(255,255,255,.06) !important;',
                '  border: 1px solid rgba(255,255,255,.1) !important;',
                '  border-radius: 14px !important;',
                '  -webkit-backdrop-filter: blur(16px) !important;',
                '  backdrop-filter: blur(16px) !important;',
                '  transition: all .25s ease !important;',
                '}',
                '.selector.focus, .online.focus, .torrent-item.focus, .settings-param.focus {',
                '  background: rgba(255,255,255,.18) !important;',
                '  border-color: rgba(255,255,255,.5) !important;',
                '  transform: translateX(4px) !important;',
                '  box-shadow: 0 0 30px rgba(160,220,255,.4) !important;',
                '}',

                '.menu__item.focus { background: rgba(255,255,255,.2) !important; border-radius: 12px !important; }',
                '.head { background: rgba(20,0,50,.4) !important; -webkit-backdrop-filter: blur(20px) !important; backdrop-filter: blur(20px) !important; }',
                '.modal, .modal__content { background: rgba(20,0,50,.85) !important; -webkit-backdrop-filter: blur(30px) !important; backdrop-filter: blur(30px) !important; border: 1px solid rgba(255,255,255,.15) !important; border-radius: 24px !important; box-shadow: 0 24px 64px rgba(0,0,0,.5) !important; }'
            ].join('\n')
        },

        // 10. VHS 80s — ретро, хроматическая аберрация,
        //     жёсткие многослойные тени, неоновые цвета
        vhs: {
            title: 'VHS 80s',
            css: [
                'body, .background {',
                '  background: #0a001a !important;',
                '  background-image:',
                '    linear-gradient(180deg, rgba(255,0,200,.15) 0%, transparent 50%, rgba(0,200,255,.15) 100%),',
                '    repeating-linear-gradient(0deg, rgba(255,255,255,.03) 0 1px, transparent 1px 3px) !important;',
                '}',
                'body { font-family: "Courier New", monospace !important; letter-spacing: .08em !important; }',

                // Хроматическая аберрация на заголовках
                '.card__title, .online__title, .menu__item span {',
                '  text-shadow: 2px 0 0 rgba(255,0,200,.6), -2px 0 0 rgba(0,200,255,.6) !important;',
                '}',

                '.card, .card--category {',
                '  background: #1a0033 !important;',
                '  border: 2px solid #ff00c8 !important;',
                '  border-radius: 0 !important;',
                '  box-shadow: 4px 4px 0 #00c8ff, 8px 8px 0 rgba(255,0,200,.5) !important;',
                '  transition: all .15s ease !important;',
                '}',
                '.card.focus, .card--category.focus {',
                '  border-color: #ffea00 !important;',
                '  transform: translate(-4px,-4px) !important;',
                '  box-shadow: 8px 8px 0 #00c8ff, 16px 16px 0 rgba(255,0,200,.6) !important;',
                '}',

                '.button, .full-start__button {',
                '  background: #ff00c8 !important;',
                '  color: #000 !important;',
                '  border: 2px solid #ffea00 !important;',
                '  border-radius: 0 !important;',
                '  font-family: inherit !important;',
                '  font-weight: 700 !important;',
                '  text-transform: uppercase !important;',
                '  box-shadow: 4px 4px 0 #00c8ff !important;',
                '  text-shadow: none !important;',
                '}',
                '.button.focus, .full-start__button.focus {',
                '  background: #ffea00 !important;',
                '  border-color: #ff00c8 !important;',
                '  transform: translate(-3px,-3px) !important;',
                '  box-shadow: 6px 6px 0 #00c8ff !important;',
                '}',

                '.selector, .online, .torrent-item, .settings-param {',
                '  background: #1a0033 !important;',
                '  color: #ffea00 !important;',
                '  border: 2px solid #00c8ff !important;',
                '  border-radius: 0 !important;',
                '}',
                '.selector.focus, .online.focus, .torrent-item.focus, .settings-param.focus {',
                '  background: #2a0050 !important;',
                '  border-color: #ff00c8 !important;',
                '  box-shadow: 4px 4px 0 #ffea00, inset 0 0 12px rgba(255,0,200,.3) !important;',
                '}',

                '.menu__item.focus { background: #ff00c8 !important; color: #000 !important; }',
                '.head { background: #0a001a !important; border-bottom: 2px solid #ff00c8 !important; }',
                '.modal, .modal__content { background: #1a0033 !important; border: 2px solid #ff00c8 !important; border-radius: 0 !important; box-shadow: 6px 6px 0 #00c8ff !important; }'
            ].join('\n')
        }
    };

    // Порядок в списке настроек
    var THEME_ORDER = [
        'default',
        'youtube', 'netflix', 'spotify', 'appletv', 'disney',
        'terminal', 'cyberpunk', 'paper', 'aurora', 'vhs'
    ];

    // ============================================================
    //  ЯДРО
    // ============================================================

    function getCurrent() {
        return Lampa.Storage.field(STORAGE_KEY) || 'default';
    }

    function applyTheme(name) {
        // Удаляем предыдущий <style>
        var old = document.getElementById(STYLE_ID);
        if (old && old.parentNode) old.parentNode.removeChild(old);

        // Снимаем старые классы theme-* с body
        var cl = document.body.classList;
        for (var i = cl.length - 1; i >= 0; i--) {
            var c = cl[i];
            if (c.indexOf('theme-') === 0) cl.remove(c);
        }

        if (!name || name === 'default') return;
        var theme = THEMES[name];
        if (!theme || !theme.css) return;

        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.type = 'text/css';
        style.appendChild(document.createTextNode(theme.css));
        document.head.appendChild(style);

        document.body.classList.add('theme-' + name);
    }

    function buildValues() {
        var values = {};
        THEME_ORDER.forEach(function (key) {
            if (THEMES[key]) values[key] = THEMES[key].title;
        });
        return values;
    }

    // ============================================================
    //  СТАРТ
    // ============================================================

    function startPlugin() {
        window.theme_pack_plugin = true;

        function addPlugin() {

            // --- Локализация -------------------------------------------------
            Lampa.Lang.add({
                theme_pack_setting: {
                    ru: 'Тема оформления',
                    uk: 'Тема оформлення',
                    be: 'Тэма афармлення',
                    en: 'Theme',
                    zh: '主题'
                }
            });

            // --- Пункт настроек ---------------------------------------------
            Lampa.SettingsApi.addParam({
                component: 'interface',
                param: {
                    name: STORAGE_KEY,
                    type: 'select',
                    values: buildValues(),
                    default: 'default'
                },
                field: {
                    name: Lampa.Lang.translate('theme_pack_setting')
                },
                onChange: function () {
                    var name = getCurrent();
                    applyTheme(name);
                    var theme = THEMES[name];
                    if (theme && name !== 'default') {
                        Lampa.Noty.show('🎨 ' + theme.title);
                    }
                }
            });

            // --- Переместим пункт в удобное место (после размера шрифта) ---
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

            // --- Реакция на изменение Storage (на случай синхронизации) ---
            Lampa.Storage.listener.follow('change', function (e) {
                if (e.name === STORAGE_KEY) {
                    applyTheme(e.value || 'default');
                }
            });

            // --- Применяем сохранённую тему сразу --------------------------
            applyTheme(getCurrent());

            console.log('ThemePack', 'loaded, current:', getCurrent());
        }

        if (window.appready) addPlugin();
        else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type == 'ready') addPlugin();
            });
        }
    }

    if (!window.theme_pack_plugin) startPlugin();

})();
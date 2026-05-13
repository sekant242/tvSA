(function () {
    'use strict';

    const pluginName = 'start_menu_skin';

    function applySkin(menuElement) {
        if (!menuElement) {
            console.error(`[${pluginName}] Меню не найдено!`);
            return;
        }

        console.log(`[${pluginName}] Меню найдено:`, menuElement);

        // Удаляем старые стили, если есть
        const old = document.getElementById('start-menu-skin-styles');
        if (old) old.remove();

        const style = document.createElement('style');
        style.id = 'start-menu-skin-styles';
        style.textContent = `
            /* Применяем стили непосредственно к найденному элементу */
            ${menuElement.tagName.toLowerCase()}.${menuElement.className.replace(/\s+/g, '.')} {
                background: #c0c0c0 !important;
                border: 2px solid;
                border-color: #ffffff #808080 #808080 #ffffff !important;
                box-shadow: 2px 2px 10px rgba(0,0,0,0.5) !important;
                font-family: 'MS Sans Serif', 'Segoe UI', Tahoma, sans-serif !important;
                font-size: 14px !important;
                color: #000 !important;
                padding: 0 !important;
                position: relative !important;
                overflow: hidden !important;
            }

            /* Левая плашка */
            ${menuElement.tagName.toLowerCase()}.${menuElement.className.replace(/\s+/g, '.')}::before {
                content: "LAMPA";
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 30px;
                background: #000080;
                color: #ffffff;
                writing-mode: vertical-rl;
                text-orientation: mixed;
                font-weight: bold;
                font-size: 16px;
                letter-spacing: 2px;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 10px 0;
                box-sizing: border-box;
                text-transform: uppercase;
                z-index: 1;
            }

            /* Сдвиг содержимого */
            ${menuElement.tagName.toLowerCase()}.${menuElement.className.replace(/\s+/g, '.')} > * {
                margin-left: 30px !important;
            }

            /* Пункты меню */
            .menu__item, .sidebar-item, .lampa-menu-item, [class*="menu"] [class*="item"] {
                padding: 6px 10px !important;
                cursor: pointer !important;
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
                transition: background 0.1s !important;
            }
            .menu__item:hover, .sidebar-item:hover, .lampa-menu-item:hover, [class*="menu"] [class*="item"]:hover {
                background: #000080 !important;
                color: #ffffff !important;
            }
        `;
        document.head.appendChild(style);

        // Меняем кнопку "Пуск"
        const menuButton = document.querySelector('.header__menu-btn, .menu-toggle, .open-menu, [class*="burger"], [class*="menu-button"]');
        if (menuButton) {
            menuButton.innerHTML = '<span style="font-weight:bold; margin-right:4px;"><img src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 16 16\'%3E%3Cpath fill=\'white\' d=\'M0 0h7v7H0zM9 0h7v7H9zM0 9h7v7H0zM9 9h7v7H9z\'/%3E%3C/svg%3E" style="width:16px; height:16px; vertical-align:middle;" alt="Пуск"></span>Пуск';
            Object.assign(menuButton.style, {
                background: '#000080',
                color: '#fff',
                border: '2px solid',
                borderColor: '#ffffff #808080 #808080 #ffffff',
                fontFamily: '"MS Sans Serif", Tahoma, sans-serif',
                fontSize: '14px',
                padding: '4px 10px',
                cursor: 'pointer'
            });
        }
    }

    function init() {
        // Список возможных селекторов для меню (дополните своими)
        const selectors = [
            '.menu',
            '.sidebar',
            '.lampa-menu',
            '.main-menu',
            '.main__menu',
            '.lampa__menu',
            '[class*="menu"]:not([class*="context"])'  // осторожно, может захватить лишнее
        ];

        let menuElement = null;
        for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el && el.offsetParent !== null) { // только видимые элементы
                menuElement = el;
                break;
            }
        }

        if (menuElement) {
            applySkin(menuElement);
        } else {
            // Возможно меню ещё не отрендерено — ждём
            console.warn(`[${pluginName}] Меню не найдено сразу. Ждём 2 секунды...`);
            setTimeout(() => {
                for (const sel of selectors) {
                    const el = document.querySelector(sel);
                    if (el && el.offsetParent !== null) {
                        applySkin(el);
                        return;
                    }
                }
                console.error(`[${pluginName}] Меню так и не найдено. Попробуйте добавить селектор вручную.`);
            }, 2000);
        }
    }

    // Регистрация
    if (window.Lampa && window.Lampa.Plugins) {
        Lampa.Plugins.add(pluginName, init);
    } else {
        window.addEventListener('load', () => {
            if (window.Lampa && window.Lampa.Plugins) {
                Lampa.Plugins.add(pluginName, init);
            } else {
                setTimeout(() => {
                    if (window.Lampa && window.Lampa.Plugins) {
                        Lampa.Plugins.add(pluginName, init);
                    } else {
                        console.error(`[${pluginName}] Lampa API не найден.`);
                    }
                }, 3000);
            }
        });
    }
})();
(function () {
    'use strict';

    const pluginName = 'start_menu_skin';

    // ====================== ВИЗУАЛЬНЫЙ ЛОГГЕР ======================
    function createLogPanel() {
        const panel = document.createElement('div');
        panel.id = 'lampa-log-panel';
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            width: 280px;
            max-height: 200px;
            background: rgba(0,0,0,0.85);
            color: #0f0;
            font: 12px monospace;
            padding: 8px;
            border-radius: 6px;
            z-index: 999999;
            overflow-y: auto;
            pointer-events: none;
            white-space: pre-wrap;
            word-break: break-all;
        `;
        document.body.appendChild(panel);
        return panel;
    }

    function log(message, isError = false) {
        let panel = document.getElementById('lampa-log-panel');
        if (!panel) {
            panel = createLogPanel();
        }
        const time = new Date().toLocaleTimeString();
        const prefix = isError ? '❌' : '✅';
        const line = document.createElement('div');
        line.textContent = `${prefix} [${time}] ${message}`;
        line.style.color = isError ? '#ff5555' : '#55ff55';
        panel.appendChild(line);
        panel.scrollTop = panel.scrollHeight;
    }

    // ====================== ОСНОВНАЯ ЛОГИКА ======================
    function applySkin(menuElement) {
        if (!menuElement) {
            log('Меню не найдено, скин не применён', true);
            return;
        }

        log(`Найдено меню: ${menuElement.tagName}.${menuElement.className}`);
        const oldStyle = document.getElementById('start-menu-skin-styles');
        if (oldStyle) oldStyle.remove();

        const style = document.createElement('style');
        style.id = 'start-menu-skin-styles';
        style.textContent = `
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
            ${menuElement.tagName.toLowerCase()}.${menuElement.className.replace(/\s+/g, '.')} > * {
                margin-left: 30px !important;
            }
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
        log('CSS-стили меню Пуск внедрены');

        // Меняем кнопку открытия меню
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
            log('Кнопка "Пуск" обновлена');
        } else {
            log('Кнопка меню не найдена — проверьте селектор', true);
        }
    }

    function init() {
        log('Плагин start_menu_skin активирован. Ищу меню...');

        const selectors = [
            '.menu',
            '.sidebar',
            '.lampa-menu',
            '.main-menu',
            '.main__menu',
            '.lampa__menu'
        ];

        let menuElement = null;
        for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el && el.offsetParent !== null) {
                menuElement = el;
                log(`Меню найдено по селектору: ${sel}`);
                break;
            }
        }

        if (menuElement) {
            applySkin(menuElement);
        } else {
            log('Меню не обнаружено в DOM. Жду 2 секунды...', true);
            setTimeout(() => {
                for (const sel of selectors) {
                    const el = document.querySelector(sel);
                    if (el && el.offsetParent !== null) {
                        log(`Меню появилось по селектору: ${sel}`);
                        applySkin(el);
                        return;
                    }
                }
                log('Меню так и не появилось. Добавьте правильный селектор в код плагина.', true);
                log('Проверьте, открыто ли меню в момент загрузки плагина.', false);
            }, 2000);
        }
    }

    // Регистрация в Lampa
    try {
        if (window.Lampa && window.Lampa.Plugins) {
            Lampa.Plugins.add(pluginName, init);
            log('Плагин зарегистрирован в Lampa API');
        } else {
            window.addEventListener('load', () => {
                if (window.Lampa && window.Lampa.Plugins) {
                    Lampa.Plugins.add(pluginName, init);
                    log('Плагин зарегистрирован после загрузки страницы');
                } else {
                    log('Lampa API не найден! Убедитесь, что плагин установлен в актуальную версию Lampa.', true);
                }
            });
        }
    } catch (e) {
        log(`Критическая ошибка при регистрации: ${e.message}`, true);
    }
})();
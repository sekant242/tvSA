/**
 * start-menu-skin.lampa.js
 * Глобальный рескин главного меню Lampa в стиле меню "Пуск" Windows 95/XP.
 * Версия 1.0
 */
(function () {
    'use strict';

    const pluginName = 'start_menu_skin';

    // Основная функция, вызываемая при загрузке плагина
    function init() {
        // ========== 1. ВНЕДРЕНИЕ ГЛОБАЛЬНЫХ CSS-СТИЛЕЙ ==========
        // Имитируем классическое меню Пуск:
        // - Серый фон
        // - Левая тёмно-синяя/чёрная полоса с вертикальной надписью
        // - Объёмная рамка (эффект выпуклости)
        // - Стилизация пунктов меню

        const style = document.createElement('style');
        style.id = 'start-menu-skin-styles';
        style.textContent = `
            /* Основной контейнер меню (подставьте актуальный селектор) */
            .menu,
            .sidebar,
            .lampa-menu {
                background: #c0c0c0 !important;  /* классический серый Windows */
                border: 2px solid;
                border-color: #ffffff #808080 #808080 #ffffff !important; /* выпуклая рамка */
                box-shadow: 2px 2px 10px rgba(0,0,0,0.5) !important;
                font-family: 'MS Sans Serif', 'Segoe UI', Tahoma, sans-serif !important;
                font-size: 14px !important;
                color: #000 !important;
                padding: 0 !important;
                position: relative !important;
                overflow: hidden !important;
            }

            /* Левая вертикальная плашка "Windows" (создаётся псевдоэлементом) */
            .menu::before,
            .sidebar::before,
            .lampa-menu::before {
                content: "LAMPA";  /* или "ПУСК", "START" */
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 30px;
                background: #000080;  /* тёмно-синий */
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

            /* Сдвигаем содержимое меню вправо, чтобы освободить место под левую плашку */
            .menu > *,
            .sidebar > *,
            .lampa-menu > * {
                margin-left: 30px !important;
            }

            /* Стилизация отдельных пунктов меню */
            .menu__item,
            .sidebar-item,
            .lampa-menu-item {
                padding: 6px 10px !important;
                cursor: pointer !important;
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
                transition: background 0.1s !important;
            }
            .menu__item:hover,
            .sidebar-item:hover,
            .lampa-menu-item:hover {
                background: #000080 !important;
                color: #ffffff !important;
            }

            /* Разделитель между пунктами (по горизонтали) */
            .menu__separator,
            .sidebar-separator {
                height: 1px;
                background: #808080;
                margin: 4px 0;
                box-shadow: 0 1px 0 #ffffff;
            }

            /* Нижняя кнопка "Выключение" (опционально) */
            .menu__footer {
                border-top: 1px solid #808080;
                padding: 6px;
                background: #c0c0c0;
                display: flex;
                align-items: center;
                gap: 5px;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);

        // ========== 2. ДОБАВЛЕНИЕ КНОПКИ "ПУСК" (если её нет) ==========
        // Можно динамически создать кнопку, похожую на кнопку Пуск.
        // Для примера просто меняем иконку и текст существующей кнопки меню.
        // Селектор кнопки, открывающей меню, предположительно:
        const menuButton = document.querySelector('.header__menu-btn, .menu-toggle, .open-menu');
        if (menuButton) {
            // Меняем внутренности кнопки на логотип Windows и текст
            menuButton.innerHTML = '<span style="font-weight:bold; margin-right:4px;"><img src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 16 16\'%3E%3Cpath fill=\'white\' d=\'M0 0h7v7H0zM9 0h7v7H9zM0 9h7v7H0zM9 9h7v7H9z\'/%3E%3C/svg%3E" style="width:16px; height:16px; vertical-align:middle;" alt="Пуск"></span>Пуск';
            menuButton.style.background = '#000080';
            menuButton.style.color = '#fff';
            menuButton.style.border = '2px solid';
            menuButton.style.borderColor = '#ffffff #808080 #808080 #ffffff';
            menuButton.style.fontFamily = '"MS Sans Serif", Tahoma, sans-serif';
            menuButton.style.fontSize = '14px';
            menuButton.style.padding = '4px 10px';
            menuButton.style.cursor = 'pointer';
        }

        // ========== 3. БОНУС: АНИМАЦИЯ РАСКРЫТИЯ КАК В WINDOWS ==========
        // Добавляем CSS-анимацию, если меню использует класс .open
        const animStyle = document.createElement('style');
        animStyle.textContent = `
            .menu.open,
            .sidebar.open,
            .lampa-menu.open {
                animation: startMenuOpen 0.2s ease-out;
            }
            @keyframes startMenuOpen {
                from {
                    opacity: 0;
                    transform: scale(0.9) translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }
        `;
        document.head.appendChild(animStyle);

        console.log(`[${pluginName}] Меню "Пуск" активировано.`);
    }

    // ========== ЗАПУСК ПЛАГИНА ==========
    // Дожидаемся готовности Lampa (зависит от версии)
    if (window.Lampa && window.Lampa.Plugins) {
        // Современный способ регистрации
        Lampa.Plugins.add(pluginName, init);
    } else {
        // Отложенный запуск, если API ещё не загружен
        window.addEventListener('load', function () {
            if (window.Lampa && window.Lampa.Plugins) {
                Lampa.Plugins.add(pluginName, init);
            } else {
                // Если Lampa загружается динамически, пробуем ещё раз
                setTimeout(function () {
                    if (window.Lampa && window.Lampa.Plugins) {
                        Lampa.Plugins.add(pluginName, init);
                    } else {
                        console.error(`[${pluginName}] Не удалось найти API Lampa.`);
                    }
                }, 3000);
            }
        });
    }
})();
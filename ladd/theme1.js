/**
 * Плагин Netflix Theme для Lampa
 * Установка: Добавьте ссылку на этот файл в настройках Lampa → "Расширения"
 * Версия: 1.0.0
 * Автор: Ваше имя
 */
(function () {
    'use strict';

    // Уникальный флаг, чтобы плагин не запускался повторно
    if (window.netflix_theme_loaded) return;
    window.netflix_theme_loaded = true;

    /**
     * Основная функция, которая запускает плагин, когда приложение готово.
     * Ждет событие 'app' с типом 'ready', чтобы DOM был полностью построен.
     */
    function startPlugin() {
        // 1. Активируем тему: добавляем класс к body и внедряем CSS
        activateNetflixTheme();
    }

    /**
     * Добавляет класс "netflix-theme" к body и внедряет кастомные стили.
     * Класс на body позволяет переключать тему через CSS-селекторы.
     */
    function activateNetflixTheme() {
        // Добавляем класс к body, если его еще нет
        if (!document.body.classList.contains('netflix-theme')) {
            document.body.classList.add('netflix-theme');
        }

        // Внедряем CSS-стили в <head>
        injectNetflixStyles();
    }

    /**
     * Создает элемент <style> и добавляет его в <head>.
     * Содержит все визуальные переопределения для темы Netflix.
     */
    function injectNetflixStyles() {
        // Проверяем, не добавлены ли стили ранее
        if (document.getElementById('netflix-theme-styles')) return;

        var styleEl = document.createElement('style');
        styleEl.id = 'netflix-theme-styles';
        styleEl.textContent = getNetflixCSS();
        document.head.appendChild(styleEl);
    }

    /**
     * Возвращает строку с CSS-правилами, которые формируют облик Netflix.
     * Вы можете настраивать цвета, размеры и эффекты под свои предпочтения.
     */
    function getNetflixCSS() {
        return `
            /* ---------------------------------------------------------- */
            /*  Netflix Theme CSS                                         */
            /* ---------------------------------------------------------- */

            /* === 1. Глобальные настройки === */
            body.netflix-theme {
                --netflix-red: #E50914;
                --netflix-dark: #141414;
                --netflix-dark-secondary: #1f1f1f;
                --netflix-gray: #808080;
                --netflix-light-gray: #b3b3b3;
                --netflix-white: #ffffff;
                --netflix-font: 'Helvetica Neue', Helvetica, Arial, sans-serif;

                background-color: var(--netflix-dark) !important;
                color: var(--netflix-white) !important;
                font-family: var(--netflix-font) !important;
            }

            /* === 2. Верхняя панель (навигация) === */
            body.netflix-theme .head {
                background-color: var(--netflix-dark) !important;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            body.netflix-theme .head__search input {
                background-color: rgba(255, 255, 255, 0.15);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: var(--netflix-white);
            }

            /* === 3. Боковое меню (Sidebar) === */
            body.netflix-theme .sidebar {
                background-color: var(--netflix-dark) !important;
            }
            body.netflix-theme .menu__item {
                color: var(--netflix-light-gray) !important;
                transition: color 0.2s;
            }
            body.netflix-theme .menu__item:hover,
            body.netflix-theme .menu__item.active {
                color: var(--netflix-white) !important;
                background-color: rgba(255, 255, 255, 0.1);
            }

            /* === 4. Карточки фильмов (постеры) === */
            body.netflix-theme .card {
                border-radius: 4px;
                overflow: hidden;
                transition: transform 0.3s, box-shadow 0.3s;
            }
            body.netflix-theme .card:hover {
                transform: scale(1.05);
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.6);
                z-index: 10;
            }
            body.netflix-theme .card__img {
                border-radius: 4px;
            }

            /* === 5. Кнопки и акцентные элементы === */
            body.netflix-theme .button {
                background-color: var(--netflix-red) !important;
                border: none !important;
                border-radius: 2px;
                color: var(--netflix-white) !important;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            body.netflix-theme .button:hover {
                background-color: #f40612 !important;
            }

            /* === 6. Детальная страница (full-start) === */
            body.netflix-theme .full-start {
                background-color: var(--netflix-dark) !important;
            }
            body.netflix-theme .full-start__title {
                font-size: 2.5em;
                font-weight: 700;
            }
            body.netflix-theme .full-start__background {
                opacity: 0.4;
            }

            /* === 7. Строка поиска и фильтры === */
            body.netflix-theme .search-box input {
                background-color: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.4);
                color: var(--netflix-white);
            }

            /* === 8. Футер (нижняя часть) === */
            body.netflix-theme .footer {
                background-color: var(--netflix-dark) !important;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }

            /* === 9. Анимация появления контента === */
            body.netflix-theme .items-line {
                animation: fadeInUp 0.5s ease-out;
            }
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            /* === 10. Скроллбар (по желанию) === */
            body.netflix-theme ::-webkit-scrollbar {
                width: 6px;
            }
            body.netflix-theme ::-webkit-scrollbar-track {
                background: var(--netflix-dark);
            }
            body.netflix-theme ::-webkit-scrollbar-thumb {
                background: var(--netflix-gray);
                border-radius: 3px;
            }
        `;
    }

    // Запускаем плагин, когда приложение готово.
    // Если приложение уже загружено (window.appready), стартуем немедленно.
    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (event) {
            if (event.type === 'ready') {
                startPlugin();
            }
        });
    }
})();
// kodi-theme.js
(function() {
    'use strict';

    const THEME_ID = 'kodi_theme';
    const STYLE_ID = 'kodi-theme-styles';

    // Основные стили в духе темы Kodi Estuary
    const kodiCSS = `
        /* Фон */
        body.${THEME_ID} {
            background-color: #0d1b2a !important; /* Темно-синий фон как в Kodi */
        }
        
        /* Карточки контента */
        body.${THEME_ID} .card {
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
            background: #1b2a3a;
        }
        
        /* Боковое меню */
        body.${THEME_ID} .menu {
            background: #0b1622;
        }
        
        /* Верхняя панель навигации */
        body.${THEME_ID} .head {
            background: #132233;
        }
        
        /* Цвета и шрифты можно гибко настраивать */
    `;

    // Создаем элемент <style> и добавляем его в <head>
    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;
        const styleEl = document.createElement('style');
        styleEl.id = STYLE_ID;
        styleEl.textContent = kodiCSS;
        document.head.appendChild(styleEl);
    }

    // Переключение темы
    function toggleTheme(enable) {
        if (enable) {
            document.body.classList.add(THEME_ID);
        } else {
            document.body.classList.remove(THEME_ID);
        }
        // Сохраняем выбор пользователя в настройках
        Lampa.Storage.set('kodi_theme_enabled', enable);
    }

    // Инициализация плагина
    function init() {
        injectStyles();
        
        // Восстанавливаем состояние темы
        const enabled = Lampa.Storage.get('kodi_theme_enabled', false);
        toggleTheme(enabled);

        // Добавляем переключатель в меню настроек (пример)
        Lampa.Settings.add({
            id: 'kodi_theme_toggle',
            title: 'Тема Kodi',
            type: 'toggle',
            value: enabled,
            onChange: function(value) {
                toggleTheme(value);
            }
        });
    }

    // Запускаем, когда Lampa готов
    if (window.Lampa) {
        init();
    } else {
        window.addEventListener('lampa_ready', init);
    }
})();
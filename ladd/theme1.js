/*
   Kodi Theme Plugin for Lampa
   Версия: 1.0.1
*/
(function() {
    'use strict';

    // Дожидаемся, пока объект Lampa станет доступен
    function waitForLampa(callback) {
        if (window.Lampa) {
            callback();
        } else {
            setTimeout(() => waitForLampa(callback), 100);
        }
    }

    // Основная логика
    function startPlugin() {
        Lampa.Plugins.register({
            name: 'Kodi Theme',
            version: '1.0.1',
            author: 'YourName',
            description: 'Визуальная тема в стиле Kodi Estuary',
            onStart: function() {
                // Инжектим стили
                const styleId = 'kodi-theme-style';
                if (!document.getElementById(styleId)) {
                    const style = document.createElement('style');
                    style.id = styleId;
                    style.textContent = `
                        /* Тёмный фон в стиле Kodi */
                        body.kodi-theme-active {
                            background-color: #0d1b2a !important;
                        }

                        /* Карточки */
                        body.kodi-theme-active .card,
                        body.kodi-theme-active .poster {
                            border-radius: 8px;
                            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
                            background: #1b2a3a;
                        }

                        /* Боковое меню */
                        body.kodi-theme-active .menu,
                        body.kodi-theme-active .side-menu {
                            background: #0b1622;
                        }

                        /* Шапка */
                        body.kodi-theme-active .head,
                        body.kodi-theme-active .header {
                            background: #132233;
                        }

                        /* Текст */
                        body.kodi-theme-active, 
                        body.kodi-theme-active .title, 
                        body.kodi-theme-active .text {
                            color: #e0e0e0;
                        }

                        /* Дополнительные акценты можно добавить здесь */
                    `;
                    document.head.appendChild(style);
                }

                // Восстановление состояния темы
                const isEnabled = Lampa.Storage.get('kodi_theme_on', false);
                if (isEnabled) {
                    document.body.classList.add('kodi-theme-active');
                }

                // Добавляем переключатель в раздел «Расширения»
                // Используем встроенные возможности Lampa для создания пункта в меню
                Lampa.Listener.follow('extensions', function(e) {
                    // Проверяем, что это нужное событие открытия расширений
                    if (e.name === 'open') {
                        // Добавляем кнопку в список активных плагинов
                        Lampa.Extensions.add({
                            name: 'Kodi Theme',
                            icon: 'https://raw.githubusercontent.com/yumata/lampa/main/icons/theme.svg', // любая иконка
                            description: 'Включить / выключить тему Kodi',
                            onSelect: function() {
                                const current = document.body.classList.toggle('kodi-theme-active');
                                Lampa.Storage.set('kodi_theme_on', current);
                                Lampa.Noty.show(current ? 'Тема Kodi включена' : 'Тема Kodi выключена');
                            }
                        });
                    }
                });

                // Альтернативный быстрый способ – управление через меню настроек (если нужно)
                // Этот код можно раскомментировать, если вы используете старую версию Lampa
                /*
                if (Lampa.Settings && Lampa.Settings.addBoolean) {
                    Lampa.Settings.addBoolean({
                        param: 'kodi_theme_on',
                        name: 'Тема Kodi',
                        default: false,
                        onChange: function(value) {
                            if (value) {
                                document.body.classList.add('kodi-theme-active');
                            } else {
                                document.body.classList.remove('kodi-theme-active');
                            }
                        }
                    });
                }
                */
            }
        });
    }

    waitForLampa(startPlugin);
})();
(function() {
    'use strict';

    if (window.netflix_theme_loaded) return;
    window.netflix_theme_loaded = true;

    function startPlugin() {
        // Внедрение CSS в head
        const styleId = 'netflix-theme-style';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                /* =============================================
                   NETFLIX THEME FOR LAMPA — CSS RULES
                   ============================================= */

                /* 1. Основной фон страницы */
                body.netflix-theme,
                .view {
                    background-color: #141414 !important;
                    color: #e5e5e5 !important;
                }

                /* 2. Цвета акцентов */
                body.netflix-theme .button--primary,
                body.netflix-theme .settings__button,
                body.netflix-theme .selector--selected,
                body.netflix-theme .full-start__play {
                    background-color: #e50914 !important;
                    border-color: #e50914 !important;
                    color: #ffffff !important;
                }

                /* 3. Шрифты */
                body.netflix-theme,
                body.netflix-theme .card__title,
                body.netflix-theme .full-start__title,
                body.netflix-theme .modal__title {
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
                    font-weight: 400 !important;
                    letter-spacing: 0.02em !important;
                }

                /* 4. Стили карточек */
                body.netflix-theme .card__view {
                    border-radius: 4px !important;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
                }

                body.netflix-theme .card:hover .card__view {
                    transform: scale(1.05);
                    transition: transform 0.3s ease-in-out;
                }

                body.netflix-theme .card__img {
                    border-radius: 4px !important;
                }

                body.netflix-theme .card__title {
                    font-size: 1rem !important;
                    font-weight: 500 !important;
                    color: #ffffff !important;
                    margin-top: 8px !important;
                }

                /* 5. Верхняя панель навигации */
                body.netflix-theme .head {
                    background-color: rgba(20, 20, 20, 0.95) !important;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
                }

                /* 6. Боковое меню */
                body.netflix-theme .menu {
                    background-color: #141414 !important;
                    border-right: 1px solid #333;
                }

                /* 7. Прокрутка */
                body.netflix-theme ::-webkit-scrollbar-thumb {
                    background: #e50914 !important;
                    border-radius: 4px;
                }

                /* 8. Эффект размытия для фона (glass) */
                body.netflix-theme .glass--style .modal,
                body.netflix-theme .glass--style .full-start {
                    backdrop-filter: blur(12px);
                    background-color: rgba(20, 20, 20, 0.7) !important;
                }

                /* 9. Футер */
                body.netflix-theme .footer {
                    background-color: #141414 !important;
                    border-top: 1px solid #333;
                }
            `;
            document.head.appendChild(style);
        }

        // Активация темы — добавляем класс body
        document.body.classList.add('netflix-theme');

        // Добавление переключателя в настройки
        if (window.Lampa && Lampa.SettingsApi) {
            // Регистрируем секцию с настройками плагина
            Lampa.SettingsApi.addComponent({
                id: 'netflix_theme',
                name: 'Netflix Theme',
                icon: 'theme',
                type: 'default'
            });

            // Параметр включения/отключения
            Lampa.SettingsApi.addParam({
                component: 'netflix_theme',
                name: 'enable',
                type: 'trigger',
                default: true,
                onChange: function(value) {
                    if (value) {
                        document.body.classList.add('netflix-theme');
                    } else {
                        document.body.classList.remove('netflix-theme');
                    }
                }
            });
        }
    }

    // Ждём инициализацию Lampa
    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function(event) {
            if (event.type === 'ready') {
                startPlugin();
            }
        });
    }
})();
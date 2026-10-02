(function () {
    'use strict';

    function startPlugin() {
        window.plugin_horror_ready = true;

        // ------------------------------------------------------------------
        // 1. Регистрация страницы «Ужасы»
        // ------------------------------------------------------------------
        Lampa.Component.add('horror_page', {
            template: `
                <div class="horror-page">
                    <div class="horror-section">
                        <h2 class="horror-section__title">Рекомендации: Ужасы и Триллеры</h2>
                        <div class="horror-cards" id="horror-recommendations"></div>
                    </div>
                    <div class="horror-section">
                        <h2 class="horror-section__title">Фильмы</h2>
                        <div class="horror-cards" id="horror-movies"></div>
                    </div>
                    <div class="horror-section">
                        <h2 class="horror-section__title">Сериалы</h2>
                        <div class="horror-cards" id="horror-tv"></div>
                    </div>
                </div>
            `,
            data: function () {
                return {};
            },
            mounted: function () {
                // После монтирования компонента загружаем и отрисовываем карточки
                loadHorrorContent();
            }
        });

        // ------------------------------------------------------------------
        // 2. Добавление пункта меню «Ужасы»
        // ------------------------------------------------------------------
        function addMenuItem() {
            // Иконка «череп» (можно заменить на любой SVG)
            var icon = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                     xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10
                             10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8
                             s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"
                          fill="#e74c3c"/>
                </svg>
            `;

            var button = $(`
                <li class="menu__item selector">
                    <div class="menu__ico">${icon}</div>
                    <div class="menu__text">Ужасы</div>
                </li>
            `);

            // При нажатии открываем нашу страницу через Activity.push
            button.on('hover:enter', function () {
                Lampa.Activity.push({
                    url: '',
                    title: 'Ужасы',
                    component: 'horror_page',
                    page: 1
                });
            });

            // Добавляем кнопку в конец бокового меню
            $('.menu .menu__list').eq(0).append(button);
        }

        // ------------------------------------------------------------------
        // 3. Внедрение кастомных стилей (тёмная тема + кровавые подтёки)
        // ------------------------------------------------------------------
        function injectStyles() {
            var css = `
                .horror-page {
                    padding: 20px;
                    background: #0a0a0a;
                    color: #eee;
                    min-height: 100vh;
                }
                .horror-section {
                    margin-bottom: 40px;
                }
                .horror-section__title {
                    font-size: 28px;
                    font-weight: bold;
                    color: #c0392b;
                    text-shadow: 0 0 10px #c0392b;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #c0392b;
                    padding-bottom: 10px;
                }
                .horror-cards {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 20px;
                }
                .horror-card {
                    width: 220px;               /* крупные карточки */
                    background: #1a1a1a;
                    border-radius: 10px;
                    overflow: hidden;
                    position: relative;
                    box-shadow: 0 4px 15px rgba(192, 57, 43, 0.6);
                    transition: transform 0.3s;
                }
                .horror-card:hover {
                    transform: scale(1.05);
                }
                .horror-card__poster {
                    width: 100%;
                    height: 330px;
                    object-fit: cover;
                    display: block;
                }
                .horror-card__title {
                    padding: 10px;
                    font-size: 16px;
                    color: #fff;
                    background: rgba(0, 0, 0, 0.75);
                    position: absolute;
                    bottom: 0;
                    width: 100%;
                    box-sizing: border-box;
                    text-align: center;
                }
                /* Кровавый подтёк снизу */
                .horror-card::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(
                        transparent 55%,
                        rgba(192, 57, 43, 0.75) 100%
                    );
                    pointer-events: none;
                }
            `;

            Lampa.Template.add('horror_css', '<style>' + css + '</style>');
            $('body').append(Lampa.Template.get('horror_css', {}, true));
        }

        // ------------------------------------------------------------------
        // 4. Загрузка и отрисовка карточек
        // ------------------------------------------------------------------
        function loadHorrorContent() {
            // --------------------------------------------------------------
            // В реальном плагине здесь можно использовать Lampa.Api:
            //   Lampa.Api.movie({ with_genres: 27 })  // ужасы
            //   Lampa.Api.movie({ with_genres: 53 })  // триллеры
            //   Lampa.Api.tv({ with_genres: 27 })
            // Для демонстрации используем статические данные.
            // --------------------------------------------------------------
            var recommendations = [
                { title: 'Пила', poster: 'https://image.tmdb.org/t/p/w300/8Cd8h8l8h8.jpg' },
                { title: 'Звонок', poster: 'https://image.tmdb.org/t/p/w300/9Cd8h8l8h8.jpg' }
            ];
            var movies = [
                { title: 'Оно', poster: 'https://image.tmdb.org/t/p/w300/1Cd8h8l8h8.jpg' },
                { title: 'Сияние', poster: 'https://image.tmdb.org/t/p/w300/2Cd8h8l8h8.jpg' }
            ];
            var tv = [
                { title: 'Очень странные дела', poster: 'https://image.tmdb.org/t/p/w300/3Cd8h8l8h8.jpg' },
                { title: 'Ходячие мертвецы', poster: 'https://image.tmdb.org/t/p/w300/4Cd8h8l8h8.jpg' }
            ];

            renderCards('horror-recommendations', recommendations);
            renderCards('horror-movies', movies);
            renderCards('horror-tv', tv);
        }

        function renderCards(containerId, items) {
            var container = $('#' + containerId);
            container.empty();

            items.forEach(function (item) {
                var card = $(`
                    <div class="horror-card selector">
                        <img class="horror-card__poster"
                             src="${item.poster}"
                             alt="${item.title}">
                        <div class="horror-card__title">${item.title}</div>
                    </div>
                `);
                container.append(card);
            });
        }

        // ------------------------------------------------------------------
        // 5. Инициализация (как в руководстве[reference:2])
        // ------------------------------------------------------------------
        if (window.appready) {
            addMenuItem();
            injectStyles();
        } else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type == 'ready') {
                    addMenuItem();
                    injectStyles();
                }
            });
        }
    }

    if (!window.plugin_horror_ready) startPlugin();
})();
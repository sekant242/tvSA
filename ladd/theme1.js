// Плагин: горизонтальная карусель фильмов с новым дизайном
// Для Lampa (app.min.js)
// Подключается как обычное расширение

(function() {
    'use strict';

    // Ждём полной загрузки приложения
    Lampa.Listener.follow('app', function(e) {
        if (e.type === 'ready') {
            initCarousel();
        }
    });

    function initCarousel() {
        // 1. Переопределяем шаблон карточки (более стильный, с тенью, закруглениями, плавным увеличением)
        var oldCardTemplate = Lampa.Template.string('card');
        var newCardTemplate = `
            <div class="card carousel-card selector layer--visible layer--render">
                <div class="card__view">
                    <img src="./img/img_load.svg" class="card__img" />
                    <div class="card__icons">
                        <div class="card__icons-inner"></div>
                    </div>
                    <div class="carousel-card__overlay">
                        <div class="carousel-card__title">{title}</div>
                        <div class="carousel-card__year">{release_year}</div>
                    </div>
                </div>
            </div>
        `;
        Lampa.Template.add('card', newCardTemplate);

        // 2. Добавляем глобальные стили для карусели и новых карточек
        var style = document.createElement('style');
        style.textContent = `
            /* Все строки с карточками становятся горизонтальными каруселями */
            .items-line__body {
                overflow-x: auto !important;
                overflow-y: hidden !important;
                scrollbar-width: thin;
                -webkit-overflow-scrolling: touch;
            }
            .items-line__body .scroll {
                white-space: nowrap;
                display: block !important;
            }
            .items-line__body .scroll__body {
                display: flex !important;
                flex-direction: row !important;
                gap: 15px;
                padding: 20px 10px;
            }
            /* Карточка в стиле карусели */
            .carousel-card {
                width: 180px;
                min-width: 180px;
                background: rgba(20, 20, 30, 0.7);
                border-radius: 16px;
                overflow: hidden;
                transition: transform 0.25s ease, box-shadow 0.25s ease;
                cursor: pointer;
                backdrop-filter: blur(5px);
                box-shadow: 0 8px 20px rgba(0,0,0,0.3);
            }
            .carousel-card:hover,
            .carousel-card.focus {
                transform: scale(1.05);
                box-shadow: 0 12px 28px rgba(0,0,0,0.5);
                z-index: 10;
            }
            .carousel-card .card__view {
                position: relative;
                padding-bottom: 140%; /* 2:3 пропорция */
                overflow: hidden;
            }
            .carousel-card .card__img {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 16px;
            }
            .carousel-card__overlay {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
                padding: 12px 8px 8px;
                color: white;
                text-align: center;
                opacity: 0;
                transition: opacity 0.25s;
            }
            .carousel-card:hover .carousel-card__overlay,
            .carousel-card.focus .carousel-card__overlay {
                opacity: 1;
            }
            .carousel-card__title {
                font-size: 0.9rem;
                font-weight: bold;
                white-space: normal;
                word-break: break-word;
                overflow: hidden;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
            }
            .carousel-card__year {
                font-size: 0.75rem;
                opacity: 0.8;
                margin-top: 5px;
            }
            /* Убираем старые элементы возраста и т.д., если они мешают */
            .carousel-card .card__age,
            .carousel-card .card__vote {
                display: none;
            }
            /* Адаптив: на мобильных карточки чуть уже */
            @media (max-width: 768px) {
                .carousel-card {
                    width: 140px;
                    min-width: 140px;
                }
                .carousel-card__title {
                    font-size: 0.8rem;
                }
            }
        `;
        document.head.appendChild(style);

        // 3. (Опционально) Заменяем стандартный scroll на более плавный для всех строк
        // Переопределяем создание строк, чтобы принудительно сделать их горизонтальными,
        // но Lampa уже использует горизонтальный скролл при параметре horizontal: true.
        // Для гарантии добавим обработчик после создания каждой строки.
        Lampa.Listener.follow('line', function(event) {
            if (event.type === 'create' && event.scroll) {
                var scroll = event.scroll;
                // Делаем скролл горизонтальным, если он ещё не горизонтальный
                if (!scroll.params().horizontal) {
                    // Пересоздадим скролл с горизонтальным режимом (хитрый способ - напрямую менять параметры)
                    // Но проще добавить CSS, который принудительно делает контейнер горизонтальным (уже сделано выше)
                    // Дополнительно можно настроить скролл
                    scroll.render().addClass('scroll--horizontal');
                    scroll.render().css('overflow-x', 'auto');
                }
            }
        });

        // 4. (Дополнительно) Меняем количество отображаемых карточек в строке на большее (чтобы карусель была длиннее)
        // Оригинальная настройка items_line: view = 7 для ТВ, 12 для мобильных. Мы не трогаем, просто увеличим отступы.
        // Всё готово.
        console.log('Carousel plugin activated');
    }
})();
(function() {
    'use strict';

    function log(msg) {
        console.log('[VK Plugin]', msg);
    }

    function openVKSearch(query) {
        const url = 'https://vk.com/video?q=' + encodeURIComponent(query) + '&section=search';
        if (typeof Lampa !== 'undefined' && Lampa.Utils && Lampa.Utils.openUrl) {
            Lampa.Utils.openUrl(url);
        } else {
            window.open(url, '_blank');
        }
    }

    function addButtons(container, title, year) {
        // Избегаем дублирования
        if (container.dataset.vkButtonsAdded === 'true') return;
        container.dataset.vkButtonsAdded = 'true';

        let baseQuery = title;
        if (year) baseQuery += ' ' + year;
        const movieQuery = baseQuery + ' фильм';
        const trailerQuery = baseQuery + ' трейлер';

        log('Добавляем кнопки: ' + baseQuery);

        const createButton = (text, query) => {
            const btn = document.createElement('button');
            btn.textContent = text;
            btn.style.cssText = 'margin: 4px; padding: 8px 12px; background: #2d2d2d; color: #fff; border: none; border-radius: 4px; cursor: pointer;';
            btn.addEventListener('click', () => openVKSearch(query));
            return btn;
        };

        container.appendChild(createButton('🎬 VK фильм', movieQuery));
        container.appendChild(createButton('🔎 VK трейлер', trailerQuery));
    }

    function tryAddButtons(container) {
        // Пытаемся достать название фильма из data-атрибутов или из текста на странице
        let title = '';
        let year = '';

        // Ищем заголовок в характерных элементах карточки
        const titleElement = document.querySelector('.card__title, .movie__title, .full-card__title, .view__title');
        if (titleElement) {
            const text = titleElement.textContent.trim();
            // Разделяем название и год, если год указан в скобках (например, "Дюна (2021)")
            const match = text.match(/^(.*?)\s*\((\d{4})\)$/);
            if (match) {
                title = match[1];
                year = match[2];
            } else {
                title = text;
            }
        }

        if (!title) {
            // Запасной вариант: смотрим data-атрибуты карточки
            const card = document.querySelector('.card[data-title], .movie[data-title]');
            if (card) {
                title = card.dataset.title || card.dataset.originalTitle || '';
                year = card.dataset.year || '';
            }
        }

        if (!title) {
            log('Не удалось определить название фильма');
            return;
        }

        addButtons(container, title, year);
    }

    function startObserver() {
        log('Запускаем MutationObserver для поиска контейнера кнопок');
        const observer = new MutationObserver((mutations, obs) => {
            // Ищем контейнер, куда можно добавить кнопки
            const selectors = ['.card__actions', '.movie__actions', '.full-card__actions', '.view__actions'];
            for (const sel of selectors) {
                const container = document.querySelector(sel);
                if (container) {
                    obs.disconnect(); // Контейнер найден, прекращаем наблюдение
                    log('Контейнер найден: ' + sel);
                    // Небольшая задержка, чтобы убедиться, что название фильма уже загружено
                    setTimeout(() => tryAddButtons(container), 200);
                    return;
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // На случай, если контейнер уже есть при запуске
        setTimeout(() => {
            const container = document.querySelector('.card__actions, .movie__actions, .full-card__actions, .view__actions');
            if (container) {
                observer.disconnect();
                tryAddButtons(container);
            }
        }, 500);

        // Прекращаем наблюдение через 15 секунд, чтобы не висеть бесконечно
        setTimeout(() => observer.disconnect(), 15000);
    }

    if (document.readyState === 'complete') {
        startObserver();
    } else {
        window.addEventListener('load', startObserver);
    }
})();
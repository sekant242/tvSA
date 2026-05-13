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

    function addButtons(title, year) {
        let baseQuery = title;
        if (year) baseQuery += ' ' + year;
        const movieQuery = baseQuery + ' фильм';
        const trailerQuery = baseQuery + ' трейлер';

        log('Добавляем кнопки для: ' + baseQuery);

        // Попытка через меню активности
        const activity = Lampa.Activity && Lampa.Activity.active;
        const menu = activity && (activity.menu || (activity.activity && activity.activity.menu));
        if (menu && typeof menu.add === 'function') {
            menu.add({
                id: 'vk_search_movie',
                title: '🎬 Искать фильм в VK',
                action: () => openVKSearch(movieQuery)
            });
            menu.add({
                id: 'vk_search_trailer',
                title: '🔎 Искать трейлер в VK',
                action: () => openVKSearch(trailerQuery)
            });
            log('Кнопки добавлены через меню');
            return;
        }

        // DOM-вставка (используем селекторы, аналогичные shots)
        const selectors = ['.card__actions', '.movie__actions', '.full-card__actions', '.view__actions'];
        let container;
        for (const sel of selectors) {
            container = document.querySelector(sel);
            if (container) break;
        }
        if (container) {
            const createButton = (text, query) => {
                const btn = document.createElement('button');
                btn.textContent = text;
                btn.style.cssText = 'margin: 4px; padding: 8px 12px; background: #2d2d2d; color: #fff; border: none; border-radius: 4px; cursor: pointer;';
                btn.onclick = () => openVKSearch(query);
                return btn;
            };
            container.appendChild(createButton('🎬 VK фильм', movieQuery));
            container.appendChild(createButton('🔎 VK трейлер', trailerQuery));
            log('Кнопки добавлены в DOM через ' + container.className);
        } else {
            log('Контейнер для кнопок не найден');
        }
    }

    function tryAddFromCard() {
        const card = Lampa.Card && Lampa.Card.active;
        if (!card || !card.data) {
            log('Данные карточки не готовы');
            return;
        }
        const data = card.data;
        const title = data.title || data.name || data.original_title || '';
        const year = data.year || '';
        if (title) {
            addButtons(title, year);
        }
    }

    // Подписываемся на полную загрузку карточки (аналог shots)
    Lampa.Listener.follow('full', function(e) {
        if (e.type === 'loaded' || e.type === 'render') {
            log('Событие full ' + e.type);
            setTimeout(tryAddFromCard, 100);
        }
    });

    // Дополнительно слушаем обновление карточки
    Lampa.Listener.follow('update', function(e) {
        if (e.type === 'card') {
            log('Событие update card');
            setTimeout(tryAddFromCard, 100);
        }
    });

    // Первая попытка после запуска (если карточка уже открыта)
    if (document.readyState === 'complete') {
        setTimeout(tryAddFromCard, 500);
    } else {
        window.addEventListener('load', () => setTimeout(tryAddFromCard, 500));
    }
})();
(function() {
    'use strict';

    function log(msg) {
        console.log('[VK Plugin]', msg);
        if (typeof Lampa !== 'undefined' && Lampa.Logs) {
            Lampa.Logs.log('[VK Plugin] ' + msg);
        }
    }

    function openVKSearch(query) {
        const url = 'https://vk.com/video?q=' + encodeURIComponent(query) + '&section=search';
        log('Открываю: ' + url);
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

        // Пытаемся найти меню карточки через Lampa.Menu (если есть глобальное меню карточки)
        if (typeof Lampa !== 'undefined' && Lampa.Activity && Lampa.Activity.active) {
            const menu = Lampa.Activity.active.menu || (Lampa.Activity.active.activity && Lampa.Activity.active.activity.menu);
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
                log('Кнопки добавлены через Lampa.Activity.active.menu');
                return;
            }
        }

        // Если меню не найдено, ищем контейнер в DOM карточки
        const selectors = ['.card__actions', '.card__buttons', '.movie__actions', '.full-card__actions', '.view__actions'];
        let container;
        for (const sel of selectors) {
            container = document.querySelector(sel);
            if (container) break;
        }
        if (container) {
            const btnMovie = document.createElement('button');
            btnMovie.textContent = '🎬 VK фильм';
            btnMovie.style.cssText = 'margin: 4px; padding: 8px 12px; background: #2d2d2d; color: #fff; border: none; border-radius: 4px; cursor: pointer;';
            btnMovie.onclick = () => openVKSearch(movieQuery);
            const btnTrailer = document.createElement('button');
            btnTrailer.textContent = '🔎 VK трейлер';
            btnTrailer.style.cssText = btnMovie.style.cssText;
            btnTrailer.onclick = () => openVKSearch(trailerQuery);
            container.appendChild(btnMovie);
            container.appendChild(btnTrailer);
            log('Кнопки добавлены в DOM через селектор: ' + sel);
        } else {
            log('Не удалось найти контейнер для кнопок. Селекторы: ' + selectors.join(', '));
        }
    }

    function processCardData(card) {
        // Извлекаем данные из card, где бы они ни лежали
        let data = null;
        if (card && card.data) {
            data = card.data;
        } else if (card && card.card && card.card.data) {
            data = card.card.data;
        } else if (card && card.object && card.object.data) {
            data = card.object.data;
        }
        if (!data) {
            log('Не удалось извлечь данные фильма из объекта: ' + JSON.stringify(Object.keys(card || {})));
            return;
        }
        const title = data.title || data.name || data.original_title || '';
        const year = data.year || '';
        if (!title) {
            log('Нет названия в data: ' + JSON.stringify(data));
            return;
        }
        addButtons(title, year);
    }

    function tryCurrentCard() {
        log('Пробуем получить текущую карточку...');
        // Способы доступа к активной карточке
        if (Lampa.Card && Lampa.Card.active) {
            processCardData(Lampa.Card.active);
            return;
        }
        if (Lampa.Activity && Lampa.Activity.active && Lampa.Activity.active.card) {
            processCardData(Lampa.Activity.active.card);
            return;
        }
        if (Lampa.Activity && Lampa.Activity.active && Lampa.Activity.active.data) {
            processCardData(Lampa.Activity.active);
            return;
        }
        log('Активная карточка не найдена');
    }

    function setupListeners() {
        log('Установка слушателей событий');
        // Событие открытия полной карточки
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                log('Событие full complite, e.object: ' + (e.object ? 'есть' : 'нет'));
                processCardData(e.object);
            }
        });
        // Альтернативное событие для мобильной версии
        Lampa.Listener.follow('detail', function(e) {
            if (e.type === 'complite') {
                log('Событие detail complite, e.object: ' + (e.object ? 'есть' : 'нет'));
                processCardData(e.object);
            }
        });
        // Иногда карточка обновляется через событие 'update'
        Lampa.Listener.follow('update', function(e) {
            if (e.type === 'card') {
                log('Событие update card');
                tryCurrentCard();
            }
        });
        // Попробовать сразу, если карточка уже открыта
        setTimeout(tryCurrentCard, 500);
        setTimeout(tryCurrentCard, 1500);
    }

    if (window.Lampa) {
        log('Lampa определена, запуск');
        setupListeners();
    } else {
        window.addEventListener('lampa-ready', function() {
            log('Lampa готова');
            setupListeners();
        });
    }
})();
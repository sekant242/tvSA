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

    function addButtonsToCard(card) {
        if (!card || !card.data) {
            log('card или card.data отсутствует');
            return;
        }
        if (card._vk_buttons_added) return;
        card._vk_buttons_added = true;

        const title = card.data.title || card.data.name || card.data.original_title || '';
        const year = card.data.year || '';
        if (!title) {
            log('Нет названия, кнопки не добавлены');
            return;
        }

        let baseQuery = title;
        if (year) baseQuery += ' ' + year;
        const movieQuery = baseQuery + ' фильм';
        const trailerQuery = baseQuery + ' трейлер';

        log('Добавляем кнопки для: ' + baseQuery);

        // Пытаемся найти меню карточки
        let menu = card.activity?.menu || card.menu || card.activity?.card?.menu;
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
            log('Кнопки добавлены через menu.add');
        } else {
            // Если меню нет (мобильная версия), добавим кнопки прямо в DOM карточки
            log('Меню карточки не найдено, пробуем вставить в DOM');
            const container = document.querySelector('.card__actions, .card__buttons, .movie__actions');
            if (container) {
                const btnMovie = document.createElement('button');
                btnMovie.textContent = '🎬 VK фильм';
                btnMovie.onclick = () => openVKSearch(movieQuery);
                const btnTrailer = document.createElement('button');
                btnTrailer.textContent = '🔎 VK трейлер';
                btnTrailer.onclick = () => openVKSearch(trailerQuery);
                container.appendChild(btnMovie);
                container.appendChild(btnTrailer);
                log('Кнопки добавлены в DOM');
            } else {
                log('Не удалось найти контейнер для кнопок');
            }
        }
    }

    function tryAddToCurrentCard() {
        log('Поиск текущей карточки...');
        // Разные способы получить активную карточку
        if (Lampa.Card && Lampa.Card.active) {
            addButtonsToCard(Lampa.Card.active);
            return;
        }
        if (Lampa.Activity && Lampa.Activity.active && Lampa.Activity.active.card) {
            addButtonsToCard(Lampa.Activity.active.card);
            return;
        }
        // Подождём немного, может карточка ещё не загрузилась
        setTimeout(() => {
            if (Lampa.Card && Lampa.Card.active) {
                addButtonsToCard(Lampa.Card.active);
            }
        }, 1000);
    }

    // Слушаем события открытия карточки
    function setupListeners() {
        log('Установка слушателей событий');
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite' && e.object) {
                log('Событие full complite');
                addButtonsToCard(e.object);
            }
        });
        Lampa.Listener.follow('detail', function(e) {
            if (e.type === 'complite' && e.object) {
                log('Событие detail complite');
                addButtonsToCard(e.object);
            }
        });
        // На случай, если карточка уже открыта
        tryAddToCurrentCard();
    }

    if (window.Lampa) {
        log('Lampa уже определена, запускаем');
        setupListeners();
    } else {
        window.addEventListener('lampa-ready', function() {
            log('Lampa готова');
            setupListeners();
        });
    }
})();
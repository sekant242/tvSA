(function() {
    'use strict';

    function addButtons(card) {
        if (!card || !card.data) return;
        if (card._vk_buttons_added) return;
        card._vk_buttons_added = true;

        const title = card.data.title || card.data.name || card.data.original_title || '';
        const year = card.data.year || '';
        if (!title) return;

        let baseQuery = title;
        if (year) baseQuery += ' ' + year;

        const movieQuery = baseQuery + ' фильм';
        const trailerQuery = baseQuery + ' трейлер';

        // Пытаемся найти меню в разных местах (зависит от версии Lampa)
        const menu = card.activity?.menu || card.menu || card.activity?.card?.menu;
        if (!menu || typeof menu.add !== 'function') return;

        menu.add({
            id: 'vk_search_movie',
            title: '🎬 Искать фильм в VK',
            icon: 'videocam',
            action: function() {
                const url = 'https://vk.com/video?q=' + encodeURIComponent(movieQuery) + '&section=search';
                if (typeof Lampa !== 'undefined' && Lampa.Utils && Lampa.Utils.openUrl) {
                    Lampa.Utils.openUrl(url);
                } else {
                    window.open(url, '_blank');
                }
            }
        });

        menu.add({
            id: 'vk_search_trailer',
            title: '🔎 Искать трейлер в VK',
            icon: 'local_movies',
            action: function() {
                const url = 'https://vk.com/video?q=' + encodeURIComponent(trailerQuery) + '&section=search';
                if (typeof Lampa !== 'undefined' && Lampa.Utils && Lampa.Utils.openUrl) {
                    Lampa.Utils.openUrl(url);
                } else {
                    window.open(url, '_blank');
                }
            }
        });
    }

    // Подписываемся на все возможные события открытия карточки
    function listenCard() {
        if (typeof Lampa === 'undefined') return;
        // Основное событие для карточки фильма
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite' && e.object) {
                addButtons(e.object);
            }
        });
        // Дополнительно: в некоторых версиях используется событие 'detail'
        Lampa.Listener.follow('detail', function(e) {
            if (e.type === 'complite' && e.object) {
                addButtons(e.object);
            }
        });
        // Иногда карточка доступна напрямую
        if (Lampa.Card && Lampa.Card.active) {
            addButtons(Lampa.Card.active);
        }
    }

    if (window.Lampa) {
        listenCard();
    } else {
        window.addEventListener('lampa-ready', function() {
            listenCard();
        });
    }
})();
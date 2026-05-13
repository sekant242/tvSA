(function() {
    'use strict';

    function plugin(Lampa) {
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite' && e.object && e.object.data) {
                addVkButtons(e.object);
            }
        });

        function addVkButtons(card) {
            if (card._vk_buttons_added) return;
            card._vk_buttons_added = true;

            const title = card.data.title || card.data.name || card.data.original_title || '';
            const year = card.data.year || '';
            if (!title) return;

            // Формируем чистый запрос
            let baseQuery = title;
            if (year) baseQuery += ' ' + year;

            const movieQuery = baseQuery + ' фильм';
            const trailerQuery = baseQuery + ' трейлер';

            const menu = card.activity.menu;

            // Кнопка "Искать фильм в VK"
            menu.add({
                id: 'vk_search_movie',
                title: '🎬 Искать фильм в VK',
                icon: 'videocam',
                action: function() {
                    const url = 'https://vk.com/video?q=' + encodeURIComponent(movieQuery) + '&section=search';
                    if (Lampa.Platform.tv()) {
                        Lampa.Utils.openUrl(url);
                    } else {
                        window.open(url, '_blank');
                    }
                }
            });

            // Кнопка "Искать трейлер в VK"
            menu.add({
                id: 'vk_search_trailer',
                title: '🔎 Искать трейлер в VK',
                icon: 'local_movies',
                action: function() {
                    const url = 'https://vk.com/video?q=' + encodeURIComponent(trailerQuery) + '&section=search';
                    if (Lampa.Platform.tv()) {
                        Lampa.Utils.openUrl(url);
                    } else {
                        window.open(url, '_blank');
                    }
                }
            });
        }
    }

    if (window.Lampa) {
        plugin(window.Lampa);
    } else {
        window.addEventListener('lampa-ready', function() {
            plugin(window.Lampa);
        });
    }
})();
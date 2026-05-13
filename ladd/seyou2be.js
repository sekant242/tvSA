(function() {
    'use strict';

    function plugin(Lampa) {
        // Ждём загрузки интерфейса карточки
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite' && e.object && e.object.data) {
                addYoutubeButton(e.object);
            }
        });

        function addYoutubeButton(card) {
            // Защита от повторного добавления
            if (card._youtube_button_added) return;
            card._youtube_button_added = true;

            // Получаем название и год
            const title = card.data.title || card.data.name || card.data.original_title || '';
            const year = card.data.year || '';
            if (!title) return;

            // Формируем запрос: «Название Год фильм»
            let query = title;
            if (year) query += ' ' + year;
            query += ' фильм';

            const url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query);

            // Добавляем пункт в меню карточки
            card.activity.menu.add({
                id: 'youtube_search',
                title: '🔍 Найти на YouTube',
                icon: 'youtube',           // системная иконка, если нет — просто текст
                action: function() {
                    if (Lampa.Platform.tv()) {
                        // На Android TV открываем системным Intent
                        Lampa.Utils.openUrl(url);
                    } else {
                        // Веб или другое — откроется в браузере
                        window.open(url, '_blank');
                    }
                }
            });
        }
    }

    // Запускаем плагин, когда Lampa готова
    if (window.Lampa) {
        plugin(window.Lampa);
    } else {
        window.addEventListener('lampa-ready', function() {
            plugin(window.Lampa);
        });
    }
})();
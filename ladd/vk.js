(function() {
    'use strict';

    Lampa.Listener.follow('full', function(e) {
        if (e.type !== 'complite') return;

        var $container = e.body;
        if (!$container || !$container.length) return;

        var $buttonsBlock = $container.find('.full-start-new__buttons');
        if (!$buttonsBlock.length) return;

        if ($buttonsBlock.find('.plugin-hello-button').length) return;

        // Получаем данные карточки фильма/сериала
        var card = e.object && e.object.card;
        if (!card) {
            // Альтернативный способ: из пропсов
            card = e.props && e.props.get('movie');
        }
        if (!card) return;

        // Название: для фильма - title, для сериала - name
        var movieTitle = card.title || card.name || 'неизвестный фильм';

        var $button = $('<div class="full-start__button selector plugin-hello-button">\
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>\
            </svg>\
            <span>Привет мир</span>\
        </div>');

        var showNotification = function() {
            Lampa.Noty.show('Привет, ' + movieTitle + '!');
        };

        $button.on('click', function(event) {
            if (Lampa.DeviceInput && !Lampa.DeviceInput.canClick(event.originalEvent)) return;
            showNotification();
        });

        $button.on('hover:enter', function() {
            showNotification();
        });

        $buttonsBlock.append($button);

        if (Lampa.Controller && Lampa.Controller.collectionAppend) {
            Lampa.Controller.collectionAppend($button[0]);
        }
    });
})();
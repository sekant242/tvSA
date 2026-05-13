(function() {
    'use strict';

    Lampa.Listener.follow('full', function(e) {
        if (e.type !== 'complite') return;

        var $container = e.body;
        if (!$container || !$container.length) return;

        var $buttonsBlock = $container.find('.full-start-new__buttons');
        if (!$buttonsBlock.length) return;

        if ($buttonsBlock.find('.plugin-hello-button').length) return;

        var card = e.object && e.object.card;
        if (!card) card = e.props && e.props.get('movie');
        if (!card) return;

        var movieTitle = card.title || card.name || 'неизвестный фильм';

        // Создаём кнопку
        var $button = $('<div class="full-start__button selector plugin-hello-button">\
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>\
            </svg>\
            <span>YouTube</span>\
        </div>');

        // Функция открытия YouTube в iframe
        var openYouTubeSearch = function(query) {
            var searchUrl = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query);
            if (Lampa.Iframe && Lampa.Iframe.show) {
                Lampa.Iframe.show({
                    url: searchUrl,
                    onBack: function() {
                        Lampa.Controller.toggle('content');
                    }
                });
            } else {
                window.open(searchUrl, '_blank');
            }
        };

        // Показываем меню при клике
        var showMenu = function() {
            var enabled = Lampa.Controller.enabled().name;
            Lampa.Select.show({
                title: movieTitle,
                items: [
                    { title: 'Трейлер', type: 'trailer' },
                    { title: 'Фильм', type: 'movie' },
                    { title: 'Обзор', type: 'review' }
                ],
                onSelect: function(item) {
                    Lampa.Controller.toggle(enabled);
                    var query = '';
                    if (item.type === 'trailer') query = movieTitle + ' трейлер';
                    else if (item.type === 'movie') query = movieTitle + ' фильм';
                    else if (item.type === 'review') query = movieTitle + ' обзор';
                    openYouTubeSearch(query);
                },
                onBack: function() {
                    Lampa.Controller.toggle(enabled);
                }
            });
        };

        var onClick = function(event) {
            if (Lampa.DeviceInput && !Lampa.DeviceInput.canClick(event.originalEvent)) return;
            showMenu();
        };
        $button.on('click', onClick);
        $button.on('hover:enter', onClick);

        $buttonsBlock.append($button);

        if (Lampa.Controller && Lampa.Controller.collectionAppend) {
            Lampa.Controller.collectionAppend($button[0]);
        }
    });
})();
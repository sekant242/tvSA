(function() {
    'use strict';

    // Функция для открытия страницы поиска на RUTUBE в iframe
    var openSearchPage = function(query) {
        var searchUrl = 'https://rutube.ru/search/?q=' + encodeURIComponent(query);
        Lampa.Iframe.show({
            url: searchUrl,
            onBack: function() {
                Lampa.Controller.toggle('content');
            }
        });
    };

    // Основной код плагина
    Lampa.Listener.follow('full', function(e) {
        if (e.type !== 'complite') return;

        var $container = e.body;
        if (!$container || !$container.length) return;

        var $buttonsBlock = $container.find('.full-start-new__buttons');
        if (!$buttonsBlock.length) return;
        if ($buttonsBlock.find('.plugin-rutube-button').length) return;

        var card = e.object && e.object.card;
        if (!card) card = e.props && e.props.get('movie');
        if (!card) return;

        var movieTitle = card.title || card.name || '';

        var $button = $('<div class="full-start__button selector plugin-rutube-button">\
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\
                <path d="M10 15l5-3-5-3v6zm1-13C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>\
            </svg>\
            <span>RUTUBE</span>\
        </div>');

        // Меню с пунктами для RUTUBE
        var showMenu = function() {
            var enabled = Lampa.Controller.enabled().name;
            var menuItems = [
                { title: 'Трейлеры (RUTUBE)', query: movieTitle + ' трейлер' },
                { title: 'Полный фильм (RUTUBE)', query: movieTitle + ' фильм полная версия' },
                { title: 'Обзоры и рецензии (RUTUBE)', query: movieTitle + ' обзор' }
            ];
            Lampa.Select.show({
                title: movieTitle,
                items: menuItems,
                onSelect: function(item) {
                    Lampa.Controller.toggle(enabled);
                    openSearchPage(item.query);
                },
                onBack: function() {
                    Lampa.Controller.toggle(enabled);
                }
            });
        };

        $button.on('click', function(event) {
            if (Lampa.DeviceInput && !Lampa.DeviceInput.canClick(event.originalEvent)) return;
            showMenu();
        });
        $button.on('hover:enter', showMenu);

        $buttonsBlock.append($button);

        if (Lampa.Controller && Lampa.Controller.collectionAppend) {
            Lampa.Controller.collectionAppend($button[0]);
        }
    });
})();
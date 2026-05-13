(function() {
    'use strict';

    /**
     * Получает список видео с RUTUBE по поисковому запросу.
     * @param {string} query - Поисковый запрос.
     * @param {Function} callback - Функция обратного вызова, получающая массив с найденными видео.
     */
    var searchRutube = function(query, callback) {
        // Формируем URL для запроса к API RUTUBE
        var url = 'https://rutube.ru/api/search/?format=json&query=' + encodeURIComponent(query);

        var req = new Lampa.Reguest();
        req.silent(url, function(data) {
            // Проверяем, что в ответе есть результаты
            if (data && data.results && data.results.length) {
                // Приводим данные из API RUTUBE к формату, который использует Lampa
                var items = data.results.map(function(video) {
                    return {
                        title: video.title,
                        subtitle: video.author_name || video.category,
                        url: 'https://rutube.ru' + video.video_url,
                        icon: video.thumbnail_url,
                        template: 'selectbox_icon'
                    };
                });
                callback(items);
            } else {
                // Если видео не найдены, возвращаем пустой массив
                callback([]);
            }
        }, function() {
            // В случае ошибки запроса также возвращаем пустой массив
            callback([]);
        });
    };

    // Основной код плагина (остается без изменений)
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

        // Создаем кнопку RUTUBE
        var $button = $('<div class="full-start__button selector plugin-rutube-button">\
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\
                <path d="M10 15l5-3-5-3v6zm1-13C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>\
            </svg>\
            <span>RUTUBE</span>\
        </div>');

        // Функция для отображения списка видео
        var showVideoList = function(items, title) {
            if (!items.length) {
                Lampa.Noty.show('Видео не найдены');
                return;
            }
            var enabled = Lampa.Controller.enabled().name;
            Lampa.Select.show({
                title: title || movieTitle,
                items: items,
                onSelect: function(selected) {
                    Lampa.Controller.toggle(enabled);
                    if (selected.url) {
                        // Открываем выбранное видео через плеер Lampa
                        Lampa.Player.play({
                            url: selected.url,
                            title: selected.title,
                            youtube: true // Для RUTUBE также подходит, так как Lampa умеет обрабатывать прямые ссылки на видео
                        });
                    }
                },
                onBack: function() {
                    Lampa.Controller.toggle(enabled);
                }
            });
        };

        // Меню с пунктами для RUTUBE
        var showMenu = function() {
            var enabled = Lampa.Controller.enabled().name;
            var menuItems = [
                { title: 'Трейлеры (RUTUBE)', action: 'trailer' },
                { title: 'Полный фильм (RUTUBE)', action: 'full' },
                { title: 'Обзоры и рецензии (RUTUBE)', action: 'review' }
            ];
            Lampa.Select.show({
                title: movieTitle,
                items: menuItems,
                onSelect: function(item) {
                    Lampa.Controller.toggle(enabled);
                    if (item.action === 'trailer') {
                        searchRutube(movieTitle + ' трейлер', function(items) {
                            showVideoList(items, 'Трейлеры на RUTUBE');
                        });
                    } else if (item.action === 'full') {
                        searchRutube(movieTitle + ' фильм полная версия', function(items) {
                            showVideoList(items, 'Полные версии фильмов на RUTUBE');
                        });
                    } else if (item.action === 'review') {
                        searchRutube(movieTitle + ' обзор рецензия', function(items) {
                            showVideoList(items, 'Обзоры и рецензии на RUTUBE');
                        });
                    }
                },
                onBack: function() {
                    Lampa.Controller.toggle(enabled);
                }
            });
        };

        // Навешиваем обработчики
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
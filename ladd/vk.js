(function() {
    'use strict';

    Lampa.Listener.follow('full', function(e) {
        if (e.type !== 'complite') return;

        var $container = e.body;
        if (!$container || !$container.length) return;

        var $buttonsBlock = $container.find('.full-start-new__buttons');
        if (!$buttonsBlock.length) return;

        if ($buttonsBlock.find('.plugin-youtube-button').length) return;

        var card = e.object && e.object.card;
        if (!card) card = e.props && e.props.get('movie');
        if (!card) return;

        var movieTitle = card.title || card.name || '';
        // Данные о трейлерах (уже загружены Lampa)
        var trailersData = e.props && e.props.get('videos');
        var trailerItems = [];

        if (trailersData && trailersData.results && trailersData.results.length) {
            trailerItems = trailersData.results.map(function(video) {
                return {
                    title: video.name,
                    subtitle: video.type + (video.official ? ' (Official)' : ''),
                    url: 'https://www.youtube.com/watch?v=' + video.key,
                    icon: 'https://img.youtube.com/vi/' + video.key + '/default.jpg',
                    template: 'selectbox_icon'
                };
            });
        }

        var $button = $('<div class="full-start__button selector plugin-youtube-button">\
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\
                <path d="M10 15l5-3-5-3v6zm1-13C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>\
            </svg>\
            <span>YouTube</span>\
        </div>');

        // Показать список видео через Select
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
                        Lampa.Player.play({
                            url: selected.url,
                            title: selected.title,
                            youtube: true
                        });
                    }
                },
                onBack: function() {
                    Lampa.Controller.toggle(enabled);
                }
            });
        };

        // Поиск видео через Invidious API (альтернатива YouTube API)
        var searchYouTube = function(query, callback) {
            // Можно использовать несколько инстансов для надёжности
            var instances = [
                'https://invidious.snopyta.org',
                'https://invidious.iamkate.com',
                'https://yewtu.be'
            ];
            var idx = 0;
            var trySearch = function() {
                if (idx >= instances.length) {
                    callback([]);
                    return;
                }
                var url = instances[idx] + '/api/v1/search?q=' + encodeURIComponent(query) + '&type=video';
                var req = new Lampa.Reguest();
                req.silent(url, function(data) {
                    if (data && data.length) {
                        var items = data.slice(0, 15).map(function(video) {
                            return {
                                title: video.title,
                                subtitle: video.author,
                                url: 'https://www.youtube.com/watch?v=' + video.videoId,
                                icon: video.videoThumbnails && video.videoThumbnails[0] ? video.videoThumbnails[0].url : '',
                                template: 'selectbox_icon'
                            };
                        });
                        callback(items);
                    } else {
                        callback([]);
                    }
                }, function() {
                    idx++;
                    trySearch();
                });
            };
            trySearch();
        };

        var showMenu = function() {
            var enabled = Lampa.Controller.enabled().name;
            var menuItems = [
                { title: 'Трейлеры (официальные)', type: 'official' },
                { title: 'Трейлеры (YouTube)', type: 'trailer' },
                { title: 'Полный фильм', type: 'full' },
                { title: 'Обзор / рецензия', type: 'review' }
            ];
            Lampa.Select.show({
                title: movieTitle,
                items: menuItems,
                onSelect: function(item) {
                    Lampa.Controller.toggle(enabled);
                    if (item.type === 'official') {
                        showVideoList(trailerItems, 'Официальные трейлеры');
                    } else if (item.type === 'trailer') {
                        searchYouTube(movieTitle + ' трейлер', function(items) {
                            showVideoList(items, 'Трейлеры с YouTube');
                        });
                    } else if (item.type === 'full') {
                        searchYouTube(movieTitle + ' фильм полная версия', function(items) {
                            showVideoList(items, 'Полные версии фильмов');
                        });
                    } else if (item.type === 'review') {
                        searchYouTube(movieTitle + ' обзор рецензия', function(items) {
                            showVideoList(items, 'Обзоры и рецензии');
                        });
                    } else {
                        Lampa.Noty.show('Видео не найдены');
                    }
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
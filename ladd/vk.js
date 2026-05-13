(function() {
    'use strict';

    // Загружаем newpipe-extractor-js с CDN, если ещё не загружен
    function loadScript(url, callback) {
        if (window.NewPipeExtractor) {
            callback();
            return;
        }
        var script = document.createElement('script');
        script.src = url;
        script.onload = callback;
        script.onerror = function() {
            console.error('Не удалось загрузить NewPipeExtractor');
        };
        document.head.appendChild(script);
    }

    // Извлекаем ID видео из URL YouTube
    function extractId(url) {
        var match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})(?:[&?\/]|$)/);
        return match ? match[1] : null;
    }

    // Основная функция поиска и отображения результатов
    function searchAndShow(query) {
        Lampa.Noty.show('Ищу видео...');

        NewPipeExtractor.searchYoutube(query, { type: 'videos', limit: 10 })
            .then(function(results) {
                if (!results || !results.items || results.items.length === 0) {
                    Lampa.Noty.show('Ничего не найдено');
                    return;
                }

                var items = results.items.map(function(video) {
                    return {
                        title: video.name || video.title,
                        action: function() {
                            var videoId = extractId(video.url);
                            if (videoId && typeof Lampa.YouTubePlayer !== 'undefined' && Lampa.YouTubePlayer.play) {
                                Lampa.YouTubePlayer.play(videoId);
                            } else {
                                window.open(video.url, '_blank');
                            }
                        }
                    };
                });

                Lampa.Select.show({
                    title: 'Результаты поиска',
                    items: items
                });
            })
            .catch(function(err) {
                console.error(err);
                Lampa.Noty.show('Ошибка поиска: ' + err.message);
            });
    }

    // Инициализация плагина после загрузки библиотеки
    function initPlugin() {
        // Включаем прокси для обхода CORS (по умолчанию corsproxy.io)
        NewPipeExtractor.setProxy('https://corsproxy.io/?');

        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                // Не добавляем кнопку повторно
                if (document.querySelector('.lampa-template-button[data-name="youtube"]')) return;

                Lampa.Template.add_button('info', {
                    title: 'YouTube',
                    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="red" width="24" height="24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>',
                    action: function() {
                        var movieTitle = null;
                        if (e.object && e.object.card && e.object.card.title) {
                            movieTitle = e.object.card.title;
                        } else if (e.props && e.props.get && e.props.get('movie')) {
                            movieTitle = e.props.get('movie').title;
                        }

                        if (!movieTitle) {
                            Lampa.Noty.show('Название не найдено');
                            return;
                        }

                        Lampa.Select.show({
                            title: 'Поиск на YouTube',
                            items: [
                                { title: 'Трейлер', action: function() { searchAndShow(movieTitle + ' трейлер'); } },
                                { title: 'Фильм целиком', action: function() { searchAndShow(movieTitle + ' фильм'); } },
                                { title: 'Обзор', action: function() { searchAndShow(movieTitle + ' обзор'); } },
                                { title: 'Свой запрос', action: function() {
                                    var input = prompt('Введите поисковый запрос:', movieTitle);
                                    if (input) searchAndShow(input);
                                }}
                            ]
                        });
                    }
                });
            }
        });
    }

    // Старт: загружаем библиотеку, затем инициализируем плагин
    loadScript('https://cdn.jsdelivr.net/npm/newpipe-extractor-js@latest/dist/bundle.js', initPlugin);
})();
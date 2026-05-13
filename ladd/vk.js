/**
 * Плагин поиска YouTube через NewPipe Extractor
 * Кнопка появляется в карточке фильма.
 * Поиск выполняется без API, видео воспроизводятся во встроенном плеере.
 */
(function () {
    'use strict';

    // URL CDN с браузерной сборкой NewPipe Extractor
    const NEWPIPE_CDN = 'https://cdn.jsdelivr.net/npm/newpipe-extractor-js@0.3.3/dist/newpipe-extractor.min.js';

    // Загрузка внешнего скрипта
    function loadScript(url) {
        return new Promise((resolve, reject) => {
            if (window.NewPipeExtractor) return resolve(window.NewPipeExtractor);
            const script = document.createElement('script');
            script.src = url;
            script.onload = () => resolve(window.NewPipeExtractor);
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Поиск видео через NewPipe
    async function searchYouTube(query) {
        const NewPipe = await loadScript(NEWPIPE_CDN);
        // Ищем только видео
        const results = await NewPipe.searchYoutube(query, ['videos']);
        // Форматируем для удобства
        return results.map(item => ({
            title: item.name,
            preview: item.thumbnailUrl,
            channel: item.uploaderName,
            duration: item.duration,
            url: item.url, // полный URL видео
        }));
    }

    // Извлечь ID видео из URL
    function getVideoId(url) {
        try {
            return new URL(url).searchParams.get('v');
        } catch (e) {
            return null;
        }
    }

    // Воспроизведение видео во встроенном плеере Lampa (iframe embed)
    function playVideo(videoId) {
        if (videoId) {
            const embedUrl = 'https://www.youtube.com/embed/' + videoId;
            // Если доступен Lampa.Iframe, показываем в нём
            if (typeof Lampa !== 'undefined' && Lampa.Iframe && Lampa.Iframe.show) {
                Lampa.Iframe.show(embedUrl);
            } else {
                // Резервное открытие в новой вкладке
                window.open('https://www.youtube.com/watch?v=' + videoId, '_blank');
            }
        }
    }

    // Главная функция плагина
    function initPlugin() {
        if (typeof Lampa === 'undefined') return;

        // Дожидаемся загрузки карточки фильма
        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'complite') {
                // Ищем название фильма
                const movie = e.object.card || e.props?.get?.('movie');
                if (!movie || !movie.title) return;

                const movieTitle = movie.title;

                // Создаём кнопку в интерфейсе
                const button = $('<div class="full-start__btn full-start__btn--youtube">YouTube</div>');

                // Меню с вариантами поиска
                const menuItems = [
                    { title: 'Трейлер', query: movieTitle + ' трейлер' },
                    { title: 'Фильм', query: movieTitle + ' фильм' },
                    { title: 'Обзор', query: movieTitle + ' обзор' },
                ];

                button.on('click', function () {
                    Lampa.Select.show({
                        title: 'Поиск на YouTube',
                        items: menuItems.map(item => ({
                            title: item.title,
                            action: async function () {
                                Lampa.Noty.show('Ищем видео...');
                                try {
                                    const videos = await searchYouTube(item.query);
                                    if (!videos || videos.length === 0) {
                                        Lampa.Noty.show('Ничего не найдено');
                                        return;
                                    }

                                    // Показываем результаты в Select
                                    const videoItems = videos.map(v => ({
                                        title: v.title,
                                        subtitle: `${v.channel} • ${v.duration}`,
                                        action: function () {
                                            const videoId = getVideoId(v.url);
                                            if (videoId) {
                                                playVideo(videoId);
                                            } else {
                                                Lampa.Noty.show('Не удалось открыть видео');
                                            }
                                        },
                                    }));

                                    Lampa.Select.show({
                                        title: 'Результаты поиска',
                                        items: videoItems,
                                    });
                                } catch (err) {
                                    console.error('Ошибка при поиске:', err);
                                    Lampa.Noty.show('Ошибка поиска, попробуйте позже');
                                }
                            },
                        })),
                        onBack: function () { Lampa.Select.back(); },
                    });
                });

                // Добавляем кнопку в интерфейс
                $('.full-start__buttons').append(button);
            }
        });
    }

    // Старт, когда Lampa готова
    if (window.Lampa) {
        initPlugin();
    } else {
        window.addEventListener('lampa_ready', initPlugin);
    }
})();
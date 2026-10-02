(function () {
    'use strict';

    // Проверяем, что Lampa загружена
    if (!window.Lampa || !window.Lampa.Listener) return;

    var HORROR_GENRE_MOVIE = 27; // ID жанра "Ужасы" в TMDB
    var HORROR_GENRE_TV = 27;
    var plugin_name = 'horror';
    var icon_horror = '<svg width="39" height="39" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.5 2 6.5 4.5 6.5 7.5C6.5 9 7 10 7.5 10.7C6.7 11 6 11.7 6 12.5V19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V12.5C18 11.7 17.3 11 16.5 10.7C17 10 17.5 9 17.5 7.5C17.5 4.5 15.5 2 12 2ZM9 8C8.4 8 8 7.6 8 7C8 6.4 8.4 6 9 6C9.6 6 10 6.4 10 7C10 7.6 9.6 8 9 8ZM15 8C14.4 8 14 7.6 14 7C14 6.4 14.4 6 15 6C15.6 6 16 6.4 16 7C16 7.6 15.6 8 15 8ZM12 17L8.5 13.5H15.5L12 17Z" fill="currentColor"/></svg>';
    var icon_knife = '<svg width="39" height="39" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.5 2L9 12.5V15L4.5 19.5L6 21L10.5 16.5H13L22 7.5L19.5 2Z" stroke="currentColor" stroke-width="2" fill="none"/></svg>';
    var icon_skull = '<svg width="39" height="39" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C7.58 2 4 5.58 4 10C4 12.5 5.14 14.74 7 16.22V20C7 20.55 7.45 21 8 21H16C16.55 21 17 20.55 17 20V16.22C18.86 14.74 20 12.5 20 10C20 5.58 16.42 2 12 2ZM9 11C8.17 11 7.5 10.33 7.5 9.5C7.5 8.67 8.17 8 9 8C9.83 8 10.5 8.67 10.5 9.5C10.5 10.33 9.83 11 9 11ZM15 11C14.17 11 13.5 10.33 13.5 9.5C13.5 8.67 14.17 8 15 8C15.83 8 16.5 8.67 16.5 9.5C16.5 10.33 15.83 11 15 11ZM10 17L9 19H15L14 17H10Z" fill="currentColor"/></svg>';

    // Точка входа
    function start() {
        console.log('Horror plugin', 'init');

        addMenuButton();
        addContentRows();

        // Реагируем на событие меню для обновления
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') {
                // Обновим кнопку после полной готовности
                addMenuButton();
            }
        });
    }

    /**
     * Добавляем кнопку "Ужасы" в боковое меню
     */
    function addMenuButton() {
        // Не добавляем дважды
        if ($('.menu__item[data-action="horror_plugin"]').length) return;

        Lampa.Menu.addButton(icon_horror, 'Ужасы', function () {
            Lampa.Activity.push({
                url: 'movie',
                title: 'Ужасы - TMDB',
                component: 'category',
                source: 'tmdb',
                genres: HORROR_GENRE_MOVIE,
                page: 1
            });
        }).attr('data-action', 'horror_plugin');
    }

    /**
     * Добавляем строки контента на главной странице
     */
    function addContentRows() {
        Lampa.ContentRows.add({
            name: plugin_name + '_popular_movies',
            title: 'Популярные ужасы',
            index: 2,
            screen: ['main'],
            call: function (params, screen) {
                if (screen !== 'main') return;

                return function (callback) {
                    loadContent({
                        url: 'discover/movie',
                        params: {
                            with_genres: HORROR_GENRE_MOVIE,
                            sort_by: 'popularity.desc',
                            'vote_count.gte': 50
                        },
                        title: 'Популярные ужасы',
                        onSuccess: callback,
                        onError: function () { callback({ results: [] }); }
                    });
                };
            }
        });

        Lampa.ContentRows.add({
            name: plugin_name + '_top_movies',
            title: 'Лучшие ужасы',
            index: 2,
            screen: ['main'],
            call: function (params, screen) {
                if (screen !== 'main') return;

                return function (callback) {
                    loadContent({
                        url: 'discover/movie',
                        params: {
                            with_genres: HORROR_GENRE_MOVIE,
                            sort_by: 'vote_average.desc',
                            'vote_count.gte': 500,
                            'vote_average.gte': 7
                        },
                        title: 'Лучшие ужасы',
                        onSuccess: callback,
                        onError: function () { callback({ results: [] }); }
                    });
                };
            }
        });

        Lampa.ContentRows.add({
            name: plugin_name + '_new_movies',
            title: 'Новые ужасы',
            index: 2,
            screen: ['main'],
            call: function (params, screen) {
                if (screen !== 'main') return;

                return function (callback) {
                    var year = new Date().getFullYear();
                    var date = new Date();
                    date.setFullYear(year - 1);

                    loadContent({
                        url: 'discover/movie',
                        params: {
                            with_genres: HORROR_GENRE_MOVIE,
                            sort_by: 'primary_release_date.desc',
                            'primary_release_date.gte': date.toISOString().slice(0, 10),
                            'vote_count.gte': 10
                        },
                        title: 'Новые ужасы',
                        onSuccess: callback,
                        onError: function () { callback({ results: [] }); }
                    });
                };
            }
        });

        Lampa.ContentRows.add({
            name: plugin_name + '_tv',
            title: 'Ужасы (сериалы)',
            index: 2,
            screen: ['main'],
            call: function (params, screen) {
                if (screen !== 'main') return;

                return function (callback) {
                    loadContent({
                        url: 'discover/tv',
                        params: {
                            with_genres: HORROR_GENRE_TV,
                            sort_by: 'popularity.desc',
                            'vote_count.gte': 50
                        },
                        title: 'Ужасы (сериалы)',
                        onSuccess: callback,
                        onError: function () { callback({ results: [] }); }
                    });
                };
            }
        });
    }

    /**
     * Загрузка контента через TMDB
     */
    function loadContent(opts) {
        var query = [];
        for (var key in opts.params) {
            query.push(key + '=' + encodeURIComponent(opts.params[key]));
        }
        var url = opts.url + '?' + query.join('&');

        // Используем API Lampa
        Lampa.Api.sources.tmdb.get(url, {}, function (data) {
            data.title = opts.title;
            data.results = (data.results || []).filter(function (item) {
                // Помечаем источник
                if (!item.source) item.source = 'tmdb';
                return true;
            });
            opts.onSuccess(data);
        }, function () {
            if (opts.onError) opts.onError();
        }, { life: 60 * 6 });
    }

    // Запуск
    if (window.appready) {
        start();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }

})();
(function() {
    'use strict';

    // Ждём, пока Lampa полностью загрузится
    function waitForLampa(cb) {
        if (typeof Lampa !== 'undefined' && Lampa.Listener) {
            cb();
        } else {
            setTimeout(() => waitForLampa(cb), 50);
        }
    }

    function init() {
        // Подписываемся на событие открытия карточки (тип 'options' — момент, когда собираются кнопки)
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'options' && e.props) {
                // Получаем объект фильма
                var movie = e.props.get('movie');
                if (movie && movie.title) {
                    // Добавляем свою опцию в контекстное меню
                    e.options.push({
                        title: '🔍 Искать на VK Видео',
                        onSelect: function() {
                            // Формируем поисковый запрос
                            var query = movie.title;
                            if (movie.year) query += ' ' + movie.year;
                            else if (movie.release_date) query += ' ' + movie.release_date.slice(0,4);
                            var url = 'https://vk.com/video?q=' + encodeURIComponent(query.trim()) + '&section=all';

                            // Открываем ссылку (на ПК — в браузере, на ТВ — может не работать, но это лучшее, что можно сделать без плеера)
                            if (typeof window !== 'undefined' && window.open) {
                                window.open(url, '_blank');
                            } else {
                                Lampa.Noty.show('Ссылка: ' + url);
                            }
                        }
                    });
                }
            }
        });
    }

    waitForLampa(init);
})();
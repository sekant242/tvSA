(function() {
    'use strict';

    // Ждём готовности Lampa
    function wait(cb) {
        if (typeof Lampa !== 'undefined' && Lampa.Listener && Lampa.Activity) {
            cb();
        } else {
            setTimeout(() => wait(cb), 100);
        }
    }

    wait(function() {
        // Простое уведомление – покажет, что плагин загружен
        try {
            Lampa.Noty.show('VK Search готов', {time: 2000});
        } catch(e) {}

        // Основной метод: следим за событием открытия карточки
        Lampa.Listener.follow('full', function(e) {
            // e.type может быть 'start', 'options', 'ready' и т.д.
            // e.body – jQuery-элемент, в который можно вставлять кнопки
            // e.data – объект фильма (title, year и т.д.)

            if (e.type === 'start' && e.body && e.data && e.data.title) {
                addButtonToBody(e.body, e.data);
            }

            // Запасной вариант: если 'start' не пришёл, пробуем поймать 'options'
            if (e.type === 'options' && e.props) {
                var movie = e.props.get('movie');
                if (movie && movie.title) {
                    addButtonToBody(e.body || $('.view--full'), movie);
                }
            }
        });

        // Если плагин загрузился, когда карточка уже открыта, пробуем добавить кнопку сейчас
        setTimeout(function() {
            var act = Lampa.Activity.active();
            if (act && act.data && act.data.title) {
                addButtonToBody($('.view--full'), act.data);
            }
        }, 500);
    });

    function addButtonToBody(body, movie) {
        if (!body || !movie || !movie.title) return;

        // Удаляем старую кнопку
        $('.vk-search-btn').remove();

        var query = movie.title;
        if (movie.year) query += ' ' + movie.year;
        else if (movie.release_date) query += ' ' + movie.release_date.slice(0,4);
        var url = 'https://vk.com/video?q=' + encodeURIComponent(query.trim()) + '&section=all';

        // Создаём кнопку в стиле Lampa (класс selector нужен для фокуса с пульта)
        var btn = $('<div class="view__action selector vk-search-btn" style="display:flex;align-items:center;gap:6px;padding:0 12px;cursor:pointer;">' +
            '<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>' +
            '<span>VK Видео</span>' +
            '</div>');

        // При клике (или Enter на пульте) открываем поиск
        btn.on('click', function(e) {
            e.stopPropagation();
            window.open(url, '_blank');
        });

        // Ищем стандартный контейнер для кнопок внутри body
        var actions = body.find('.view__actions, .full-card__actions, .view__buttons, .card__actions').first();
        if (actions.length) {
            actions.append(btn);
        } else {
            // Если контейнера нет, просто добавим в конец body
            body.append(btn);
        }
    }
})();
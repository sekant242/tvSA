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
        // Уведомление для диагностики
        Lampa.Noty.show('VK Search готов', {time: 2000});

        // Функция для добавления кнопок в карточку
        function addButtons(body, movie) {
            if (!body || !movie || !movie.title) return;

            // Удаляем старые кнопки
            $('.vk-search-btn').remove();

            var query = movie.title;
            if (movie.year) query += ' ' + movie.year;
            else if (movie.release_date) query += ' ' + movie.release_date.slice(0,4);
            query = query.trim();

            // Создаём контейнер для кнопок (если нужно несколько)
            var buttonsContainer = $('<div class="vk-search-buttons" style="display:flex;gap:8px;margin-left:8px;"></div>');

            // Функция создания одной кнопки
            function createButton(title, url) {
                var btn = $('<div class="view__action selector vk-search-btn" style="display:flex;align-items:center;gap:4px;padding:0 8px;cursor:pointer;">' +
                    '<svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>' +
                    '<span>' + title + '</span>' +
                    '</div>');
                btn.on('click', function(e) {
                    e.stopPropagation();
                    if (typeof window !== 'undefined' && window.open) {
                        window.open(url, '_blank');
                    } else {
                        Lampa.Noty.show('Ссылка: ' + url, {time: 5000});
                    }
                });
                return btn;
            }

            // Доступные сервисы (можно включать/отключать через Storage)
            var services = [
                { key: 'vk', title: 'VK', url: 'https://vk.com/video?q=' + encodeURIComponent(query) + '&section=all' },
                { key: 'yt', title: 'YouTube', url: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query) },
                { key: 'rutube', title: 'Rutube', url: 'https://rutube.ru/search/?query=' + encodeURIComponent(query) }
            ];

            services.forEach(function(s) {
                var enabled = Lampa.Storage.get('vksearch_enabled_' + s.key, true);
                if (enabled === false || enabled === 'false') return;
                buttonsContainer.append(createButton(s.title, s.url));
            });

            // Ищем контейнер для вставки внутри body (переданного события)
            var actions = body.find('.view__actions, .full-card__actions, .view__buttons, .card__actions').first();
            if (actions.length) {
                actions.append(buttonsContainer);
            } else {
                body.append(buttonsContainer);
            }
        }

        // Следим за открытием карточки
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'start' && e.body && e.data && e.data.title) {
                addButtons(e.body, e.data);
            }
            // Запасной вариант для события 'options' (вдруг оно тоже приходит)
            if (e.type === 'options' && e.props && e.props.get) {
                try {
                    var movie = e.props.get('movie');
                    if (movie && movie.title) {
                        addButtons(e.body || $('.view--full'), movie);
                    }
                } catch (err) {}
            }
        });

        // Если плагин загрузился позже, а карточка уже открыта
        setTimeout(function() {
            var act = Lampa.Activity.active();
            if (act && act.data && act.data.title) {
                addButtons($('.view--full'), act.data);
            }
        }, 500);
    });

})();
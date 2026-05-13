(function() {
    'use strict';

    // Локализация
    Lampa.Lang.add({
        vksearch_ready: { ru: 'VK Search готов', en: 'VK Search ready', uk: 'VK Search готовий' },
        vksearch_vk: { ru: '🔍 VK Видео', en: '🔍 VK Video', uk: '🔍 VK Відео' },
        vksearch_yt: { ru: '🔍 YouTube', en: '🔍 YouTube', uk: '🔍 YouTube' },
        vksearch_rutube: { ru: '🔍 Rutube', en: '🔍 Rutube', uk: '🔍 Rutube' },
        vksearch_open_url: { ru: 'Ссылка: ', en: 'Link: ', uk: 'Посилання: ' }
    });

    // Сервисы по умолчанию
    var defaultServices = [
        {
            key: 'vk',
            title: 'vksearch_vk',
            url: function(query) {
                return 'https://vk.com/video?q=' + encodeURIComponent(query) + '&section=all';
            }
        },
        {
            key: 'yt',
            title: 'vksearch_yt',
            url: function(query) {
                return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query);
            }
        },
        {
            key: 'rutube',
            title: 'vksearch_rutube',
            url: function(query) {
                return 'https://rutube.ru/search/?query=' + encodeURIComponent(query);
            }
        }
    ];

    // Добавляем настройки в раздел "Ещё"
    Lampa.SettingsApi.addParam({
        component: 'more',
        param: {
            name: 'vksearch_enabled_vk',
            type: 'toggle',
            default: true
        },
        field: {
            name: 'Показывать VK Видео',
            description: 'Кнопка поиска на VK Видео'
        },
        onChange: function(value) {
            // Просто сохраняется, перезагрузка не требуется
        }
    });
    Lampa.SettingsApi.addParam({
        component: 'more',
        param: {
            name: 'vksearch_enabled_yt',
            type: 'toggle',
            default: true
        },
        field: {
            name: 'Показывать YouTube',
            description: 'Кнопка поиска на YouTube'
        },
        onChange: function(value) {}
    });
    Lampa.SettingsApi.addParam({
        component: 'more',
        param: {
            name: 'vksearch_enabled_rutube',
            type: 'toggle',
            default: true
        },
        field: {
            name: 'Показывать Rutube',
            description: 'Кнопка поиска на Rutube'
        },
        onChange: function(value) {}
    });

    // Уведомление о загрузке (для диагностики)
    Lampa.Noty.show(Lampa.Lang.translate('vksearch_ready'), {time: 1500});

    // Основной обработчик – добавляет пункты в контекстное меню карточки
    Lampa.Listener.follow('full', function(e) {
        if (e.type !== 'options' || !e.props) return;

        var movie = e.props.get('movie');
        if (!movie || !movie.title) return;

        // Формируем поисковый запрос
        var query = movie.title;
        if (movie.year) {
            query += ' ' + movie.year;
        } else if (movie.release_date) {
            query += ' ' + movie.release_date.slice(0,4);
        }
        query = query.trim();

        // Для каждого включённого сервиса добавляем пункт
        defaultServices.forEach(function(service) {
            var settingKey = 'vksearch_enabled_' + service.key;
            var enabled = Lampa.Storage.get(settingKey, true); // по умолчанию true
            if (enabled === false || enabled === 'false') return;

            var title = Lampa.Lang.translate(service.title);
            var url = service.url(query);

            e.options.push({
                title: title,
                onSelect: function() {
                    if (typeof window !== 'undefined' && window.open) {
                        window.open(url, '_blank');
                    } else {
                        // Для ТВ показываем ссылку в уведомлении
                        Lampa.Noty.show(Lampa.Lang.translate('vksearch_open_url') + url, {time: 5000});
                    }
                }
            });
        });
    });

})();
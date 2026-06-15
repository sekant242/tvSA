(function () {
    'use strict';

    function startPlugin() {
        // Проверяем, не добавлен ли уже пункт, чтобы избежать дублирования
        if ($('.menu__item[data-action="msx"]').length) return;

        // SVG иконка для меню (стилизованный монитор)
        var icon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6H20V16H4V6ZM4 4C2.89543 4 2 4.89543 2 6V16C2 17.1046 2.89543 18 4 18H9V20H15V18H20C21.1046 18 22 17.1046 22 16V6C22 4.89543 21.1046 4 20 4H4Z" fill="currentColor"/></svg>';

        // Создаем HTML-элемент кнопки
        var item = $('<li class="menu__item selector" data-action="msx"><div class="menu__ico">' + icon + '</div><div class="menu__text">Media station x</div></li>');

        // Обработчик нажатия на кнопку
        item.on('hover:enter', function () {
            // URL веб-версии MSX. 
            // Если нужен конкретный стартовый параметр, измени URL на 'https://msx.benzac.de/?start=ТВОЙ_ПАРАМЕТР'
            var msxUrl = 'https://msx.benzac.de/';

            // Открываем MSX через встроенный компонент Iframe в Lampa
            Lampa.Iframe.show({
                url: msxUrl,
                title: 'Media Station X'
            });
        });

        // Добавляем кнопку в конец основного списка бокового меню
        $('.menu .menu__list').eq(0).append(item);
    }

    // Инициализация плагина
    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') {
                startPlugin();
            }
        });
    }
})();
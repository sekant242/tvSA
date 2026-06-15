(function () {
    'use strict';

    Lampa.Listener.follow('app', function (e) {
        if (e.type == 'ready') {
            // Приложение готово, можно инициализировать плагин
            console.log('Мой плагин успешно загружен!');
            Lampa.Noty.show('Тест');
        }
    });
})();
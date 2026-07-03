(function () {
    'use strict';

    // Ждём полной готовности приложения
    Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') {

            // Добавляем новый пункт в боковое меню
            Lampa.Menu.addButton({
                title: 'Тест',      // Название пункта
                icon: '<svg>...</svg>',  // Иконка (опционально, в формате SVG)
                action: function () {
                    // Действие при нажатии
                    Lampa.Noty.show('Привет из моего плагина!');
                    console.log('Пункт меню нажат');
                }
            });

            console.log('Плагин успешно загружен!');
        }
    });
})();
(function () {
    'use strict';
    Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') {
            Lampa.Menu.addButton({
                title: 'Тест',
                icon: '...',
                action: function () {
                    Lampa.Noty.show('Привет из моего плагина!');
                    console.log('Пункт меню нажат');
                }
            });
            console.log('Плагин успешно загружен!');
        }
    });
})();
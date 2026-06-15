(function() {
    // Адрес вашего приложения Media Station X
    var msxUrl = 'https://sekant242.github.io/tvSA/ladd/';

    // Функция открытия MSX на весь экран
    function openMsxFullscreen() {
        // Способ 1: пытаемся использовать встроенный Iframe с fullscreen
        if (Lampa.Iframe && Lampa.Iframe.show) {
            Lampa.Iframe.show({
                url: msxUrl,
                title: 'Media Station X',
                fullscreen: true,   // ключевой параметр
                params: {
                    autostart: true
                }
            });
        } 
        // Способ 2: если fullscreen не работает, принудительно растягиваем через CSS
        else {
            Lampa.Modal.open({
                title: 'Media Station X',
                content: '<iframe src="' + msxUrl + '" style="width:100%; height:100%; border:none; position:absolute; top:0; left:0;" allowfullscreen></iframe>',
                size: 'fullscreen'
            });
        }

        // Дополнительная защита: через 100мс применяем стили на все модальные окна
        setTimeout(function() {
            $('.lampa-modal, .lampa-modal-content, .modal-content, .iframe-modal').css({
                'position': 'fixed',
                'top': 0,
                'left': 0,
                'width': '100%',
                'height': '100%',
                'margin': 0,
                'padding': 0,
                'background': '#000',
                'z-index': 9999
            });
            $('iframe').css({
                'width': '100%',
                'height': '100%',
                'border': 'none'
            });
        }, 100);
    }

    // Добавляем пункт в главное меню Lampa
    Lampa.Activity.add({
        url: 'msx',
        title: 'Media Station X',
        icon: 'mdi:television-classic',
        component: 'iframe',
        params: {
            url: msxUrl
        },
        onBuild: function(activity) {
            // При открытии активности вызываем нашу функцию
            openMsxFullscreen();
        }
    });

    // Альтернативно – можно добавить в раздел "Приложения" (если есть)
    if (Lampa.Menu && Lampa.Menu.add) {
        Lampa.Menu.add({
            title: 'Media Station X',
            icon: 'mdi:television',
            url: 'msx',
            activity: 'msx'
        });
    }
})();
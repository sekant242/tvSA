(function() { 
    "use strict"; 
    Lampa; // <-- Ключевая строка для обнаружения плагина

    // Singleton защита от повторной загрузки плагина
    if (window.msx_plugin_loaded) return; 
    window.msx_plugin_loaded = true; 

    // Компонент настройки
    var msx_settings = { 
        "account": "", 
        "name": "MSX",
        "icon": "https://avatars.mds.yandex.net/i?id=dd29c0d0b9c9a5b216eeceb691a1d87e_l-5232507-images-thumbs&n=13"
    };

    // Функция добавления источника
    function addSource(account) {
        if (Lampa.Source.listening) return;
        Lampa.Source.add({
            component: 'msx',
            title: msx_settings.name,
            icon: msx_settings.icon,
            protocol: {
                account: account
            },
            search: function(query, page, callback) {
                // Здесь должна быть ваша логика поиска
                callback([]);
            }
        });
    }

    // Ожидание готовности Lampa
    Lampa.Listener.follow('app', function(e) {
        if (e.type == 'ready') {
            var account = Lampa.Storage.get('msx_account', '');
            if (account) {
                addSource(account);
            } else {
                Lampa.Modal.input({
                    title: 'Введите аккаунт MSX',
                    text: 'Введите ваш аккаунт (например, test)',
                    value: '',
                    ok: function(val) {
                        if (val) {
                            Lampa.Storage.set('msx_account', val);
                            addSource(val);
                        }
                    }
                });
            }
        }
    });
})();
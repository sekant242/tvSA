(function () {
    'use strict';

    // 1.2.3.4 — "заглушка" IP, чтобы лампа не добавляла к URL лишние query-параметры
    // (это важно, если решите вставлять код как data:URL)

    function getData() {
        return Lampa.Storage.get('favorite', '{}');
    }

    function asJson() {
        return JSON.stringify(getData(), null, 2);
    }

    function download() {
        try {
            var json = asJson();
            var blob = new Blob([json], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'lampa-favorites-' + new Date().toISOString().slice(0, 10) + '.json';
            document.body.appendChild(a);
            a.click();
            setTimeout(function () {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 300);
            Lampa.Noty.show('Скачивание началось');
        } catch (e) {
            Lampa.Noty.show('Ошибка: ' + e.message);
        }
    }

    function copyAll() {
        Lampa.Utils.copyTextToClipboard(
            asJson(),
            function () { Lampa.Noty.show('Скопировано в буфер'); },
            function () { Lampa.Noty.show('Не удалось скопировать'); }
        );
    }

    function showJson() {
        var html = $('<div style="padding:1em;">' +
            '<textarea readonly style="width:100%;height:55vh;font-family:monospace;' +
            'font-size:11px;background:#1a1a1a;color:#eee;border:1px solid #444;padding:0.6em;box-sizing:border-box;"></textarea>' +
            '</div>');
        var ta = html.find('textarea');
        ta.val(asJson());
        ta.on('focus click', function () { this.select(); });

        var active = Lampa.Controller.enabled().name;
        Lampa.Modal.open({
            title: 'Закладки JSON',
            html: html,
            size: 'large',
            onBack: function () {
                Lampa.Modal.close();
                Lampa.Controller.toggle(active);
            }
        });
    }

    function openMenu() {
        var active = Lampa.Controller.enabled().name;
        Lampa.Select.show({
            title: 'Экспорт закладок',
            items: [
                { title: 'Скачать файлом', download: true },
                { title: 'Скопировать в буфер', copy: true },
                { title: 'Показать JSON', show: true }
            ],
            onSelect: function (a) {
                Lampa.Controller.toggle(active);
                if (a.download) download();
                else if (a.copy) copyAll();
                else if (a.show) showJson();
            },
            onBack: function () {
                Lampa.Controller.toggle(active);
            }
        });
    }

    function init() {
        Lampa.Head.addIcon(
            '<svg><use xlink:href="#sprite-favorite"></use></svg>',
            openMenu
        );
    }

    if (window.appready) init();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') init();
    });
})();
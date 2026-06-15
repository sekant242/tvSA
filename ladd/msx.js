(function() {
    // URL вашего приложения MSX
    var msxUrl = 'https://sekant242.github.io/tvSA/ladd/msx.html'; // предположительный путь (проверьте)

    // Проверяем, загружена ли Lampa
    if (typeof Lampa === 'undefined') {
        console.error('Lampa не найдена');
        return;
    }

    // Способ 1: используем Lampa.Iframe.show с полноэкранным режимом
    if (Lampa.Iframe && Lampa.Iframe.show) {
        Lampa.Iframe.show({
            url: msxUrl,
            title: 'Media Station X',
            fullscreen: true,      // ключевой параметр для адаптации под экран
            params: {
                autostart: true
            }
        });
    } 
    // Способ 2 (запасной): открываем модальное окно с прямыми CSS-стилями
    else if (Lampa.Modal && Lampa.Modal.open) {
        Lampa.Modal.open({
            content: '<iframe src="' + msxUrl + '" style="width:100vw; height:100vh; border:none; margin:0; padding:0;" allowfullscreen></iframe>',
            title: 'Media Station X',
            size: 'fullscreen',
            fullscreen: true
        });
    }

    // Дополнительная страховка: принудительно растягиваем iframe после открытия (на случай, если параметры не сработали)
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
    }, 200);
})();
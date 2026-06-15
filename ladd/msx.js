// Устанавливаем стили для контейнера iframe, чтобы он занимал весь экран
setTimeout(function() {
    $('.lampa-modal, .lampa-modal-content').css({
        'position': 'fixed',
        'top': 0,
        'left': 0,
        'width': '100%',
        'height': '100%',
        'margin': 0,
        'padding': 0,
        'background': '#000'
    });
    $('iframe').css({
        'width': '100%',
        'height': '100%',
        'border': 'none'
    });
}, 100);
(function() {
    'use strict';

    Lampa.Listener.follow('full', function(e) {
        if (e.type !== 'complite') return;

        // e.body — это jQuery-объект, содержащий DOM активности
        var $container = e.body;
        if (!$container || !$container.length) return;

        // Ищем блок с кнопками внутри карточки
        var $buttonsBlock = $container.find('.full-start-new__buttons');
        if (!$buttonsBlock.length) return;

        // Проверяем, не добавлена ли уже наша кнопка
        if ($buttonsBlock.find('.plugin-hello-button').length) return;

        // Создаём кнопку через jQuery
        var $button = $('<div class="full-start__button selector plugin-hello-button">\
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>\
            </svg>\
            <span>Привет мир</span>\
        </div>');

        // Обработчик нажатия (для мыши/сенсора)
        $button.on('click', function(event) {
            if (Lampa.DeviceInput && !Lampa.DeviceInput.canClick(event.originalEvent)) return;
            Lampa.Noty.show('Привет мир');
        });

        // Обработчик для пульта (клавиша OK)
        $button.on('hover:enter', function() {
            Lampa.Noty.show('Привет мир');
        });

        // Добавляем кнопку в конец блока
        $buttonsBlock.append($button);

        // Уведомляем контроллер о новом фокусируемом элементе
        if (Lampa.Controller && Lampa.Controller.collectionAppend) {
            Lampa.Controller.collectionAppend($button[0]);
        }
    });
})();
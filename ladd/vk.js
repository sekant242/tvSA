(function() {
    'use strict';

    /**
     * Плагин добавляет кнопку в карточку фильма/сериала.
     * При нажатии показывает уведомление "Привет мир".
     */

    // Ждём события полной загрузки карточки
    Lampa.Listener.follow('full', function(e) {
        // Нас интересует момент, когда карточка полностью отрисована
        if (e.type !== 'complite') return;

        // Получаем корневой HTML-элемент активности
        var container = e.body;
        if (!container) return;

        // Ищем блок с кнопками внутри карточки
        var buttonsBlock = container.querySelector('.full-start-new__buttons');
        if (!buttonsBlock) return;

        // Проверяем, не добавлена ли уже наша кнопка (чтобы не дублировать)
        if (buttonsBlock.querySelector('.plugin-hello-button')) return;

        // Создаём кнопку
        var button = document.createElement('div');
        button.className = 'full-start__button selector plugin-hello-button';
        button.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
            </svg>
            <span>Привет мир</span>
        `;

        // Обработчик нажатия
        button.addEventListener('click', function(event) {
            // Для корректной обработки кликов на TV используем canClick
            if (Lampa.DeviceInput && !Lampa.DeviceInput.canClick(event.originalEvent)) return;
            Lampa.Noty.show('Привет мир');
        });

        // Также добавляем поддержку фокуса и нажатия через пульт
        button.addEventListener('hover:enter', function() {
            Lampa.Noty.show('Привет мир');
        });

        // Добавляем кнопку в конец блока с кнопками
        buttonsBlock.appendChild(button);

        // Для красивой анимации и работы фокуса уведомляем контроллер о новом элементе
        if (Lampa.Controller && Lampa.Controller.collectionAppend) {
            Lampa.Controller.collectionAppend(button);
        }

        console.log('Плагин "Кнопка Привет мир" активен');
    });
})();
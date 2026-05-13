/**
 * vk.js – поиск фильма на VK Видео
 * Исправленная версия: использует Lampa.Listener вместо поиска по CSS-классам
 */
(function () {
    'use strict';

    // Ожидаем готовности Lampa
    function waitForLampa(callback) {
        if (typeof Lampa !== 'undefined' && Lampa.Listener) {
            callback();
        } else {
            setTimeout(() => waitForLampa(callback), 100);
        }
    }

    // Основная логика добавления кнопок
    function addVKButtons(title, year) {
        // Удаляем старые кнопки, если есть
        const oldBtns = document.querySelectorAll('.vk-search-btn');
        oldBtns.forEach(b => b.remove());

        // Формируем поисковый запрос
        const query = encodeURIComponent(`${title} ${year || ''}`.trim());
        const vkSearchUrl = `https://vk.com/video?q=${query}&section=all`;

        // Контейнер для кнопок (обычно это блок с кнопками действий под плеером)
        const container = document.querySelector('.view__actions') 
                       || document.querySelector('.player__actions')
                       || document.querySelector('.full-card__actions');

        if (!container) {
            // Если контейнера нет, пробуем добавить в конец .view
            const view = document.querySelector('.view');
            if (view) {
                const tempContainer = document.createElement('div');
                tempContainer.className = 'view__actions vk-actions';
                view.appendChild(tempContainer);
                addButtonsToContainer(tempContainer, vkSearchUrl);
            }
            return;
        }

        addButtonsToContainer(container, vkSearchUrl);
    }

    function addButtonsToContainer(container, vkSearchUrl) {
        // Создаём ссылку-кнопку (стиль взят из типовых кнопок Lampa)
        const link = document.createElement('a');
        link.className = 'view__action vk-search-btn';
        link.href = vkSearchUrl;
        link.target = '_blank';
        link.rel = 'noopener';
        link.innerHTML = `
            <span class="view__action-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
            </span>
            <span class="view__action-text">VK Видео</span>
        `;
        link.title = 'Искать на VK Видео';
        container.appendChild(link);
    }

    // Главный обработчик: получаем название из данных Lampa
    function initPlugin() {
        if (typeof Lampa === 'undefined' || !Lampa.Listener) return;

        // Слушаем событие открытия полной карточки/плеера
        Lampa.Listener.follow('full', function (e) {
            if (e.data && e.data.title) {
                const title = e.data.title;
                const year = e.data.year || '';
                // Даём DOM немного обновиться перед добавлением кнопки
                setTimeout(() => addVKButtons(title, year), 300);
            }
        });

        // На случай, если плагин подгрузился позже, а карточка уже открыта,
        // пробуем получить текущий фильм через Lampa.Storage или Lampa.Router
        if (Lampa.Storage && Lampa.Storage.get) {
            const currentData = Lampa.Storage.get('full_data');
            if (currentData && currentData.title) {
                setTimeout(() => addVKButtons(currentData.title, currentData.year || ''), 500);
            }
        }
    }

    // Запускаем, когда Lampa готова
    waitForLampa(initPlugin);
})();
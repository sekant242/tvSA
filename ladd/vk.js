(function () {
    'use strict';

    function waitForLampa(callback) {
        if (typeof Lampa !== 'undefined' && Lampa.Listener) {
            callback();
        } else {
            setTimeout(() => waitForLampa(callback), 100);
        }
    }

    function getTitleFromDOM() {
        // Самые распространённые селекторы для заголовка в разных темах Lampa
        const selectors = [
            '.full-card__title',
            '.view__title',
            '.head__title',
            '.detail__title',
            'h1' // иногда просто h1
        ];
        for (let sel of selectors) {
            const el = document.querySelector(sel);
            if (el && el.textContent.trim()) {
                const text = el.textContent.trim();
                // Отделяем год в скобках, если есть: "Фильм (2020)"
                const match = text.match(/^(.+?)\s*\((\d{4})\)$/);
                if (match) return { title: match[1], year: match[2] };
                return { title: text, year: '' };
            }
        }
        return null;
    }

    function addVKButtons(title, year) {
        // Удаляем предыдущие
        document.querySelectorAll('.vk-search-btn').forEach(b => b.remove());

        if (!title) return;

        const query = encodeURIComponent(`${title} ${year || ''}`.trim());
        const vkSearchUrl = `https://vk.com/video?q=${query}&section=all`;

        // Расширенный поиск контейнера
        const container = document.querySelector('.view__actions')
                       || document.querySelector('.player__actions')
                       || document.querySelector('.full-card__actions')
                       || document.querySelector('.view__buttons')
                       || document.querySelector('.card__actions');

        if (!container) {
            // Если нет стандартного контейнера, вставляем кнопку рядом с плеером
            const player = document.querySelector('.player, .view--full');
            if (player) {
                const div = document.createElement('div');
                div.className = 'view__actions vk-actions';
                div.style.cssText = 'display:flex; gap:8px; margin-top:10px;';
                player.appendChild(div);
                addButtonToContainer(div, vkSearchUrl);
            } else {
                // Совсем отчаянный вариант — в самый верх body (не рекомендуется)
                console.warn('VK Search: контейнер для кнопок не найден');
            }
            return;
        }

        addButtonToContainer(container, vkSearchUrl);
    }

    function addButtonToContainer(container, vkSearchUrl) {
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

    function initPlugin() {
        // Вариант 1: через API Lampa (если событие существует)
        try {
            Lampa.Listener.follow('full', function (e) {
                if (e.data && e.data.title) {
                    setTimeout(() => addVKButtons(e.data.title, e.data.year || ''), 300);
                }
            });
        } catch (e) {
            console.warn('VK Search: Lampa.Listener.follow("full") не поддерживается');
        }

        // Вариант 2: если карточка уже открыта, пробуем взять из хранилища
        if (Lampa.Storage && Lampa.Storage.get) {
            const stored = Lampa.Storage.get('full_data');
            if (stored && stored.title) {
                setTimeout(() => addVKButtons(stored.title, stored.year || ''), 500);
            }
        }

        // Вариант 3 (резервный): следим за изменениями DOM и ищем заголовок сами
        const observer = new MutationObserver(() => {
            const info = getTitleFromDOM();
            if (info && info.title) {
                addVKButtons(info.title, info.year);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    waitForLampa(initPlugin);
})();
(function () {
    'use strict';

    // Ждем готовности Lampa и нашего отладчика DevLog
    function waitForLampa(callback) {
        if (typeof Lampa !== 'undefined' && typeof DevLog !== 'undefined') {
            callback();
        } else {
            setTimeout(() => waitForLampa(callback), 100);
        }
    }

    // Основная логика после готовности всего
    function initPlugin() {
        DevLog.info('=== VK Search: Старт плагина ===');

        // --- Способ 1: Следим за открытием карточки фильма ---
        Lampa.Listener.follow('full', function (e) {
            if (e.data && e.data.title) {
                DevLog.info('VK Search: Событие "full" получено', { title: e.data.title, year: e.data.year });
                addButton(e.data.title, e.data.year);
            } else {
                DevLog.warn('VK Search: Событие "full" без данных', e.data);
            }
        });

        // --- Способ 2: Резервный вариант, если событие не сработало ---
        // Пробуем найти заголовок и контейнер через секунду после загрузки
        setTimeout(() => {
            DevLog.info('VK Search: Запуск резервного поиска заголовка...');
            const titleEl = document.querySelector('.full-card__title, .view__title, .head__title, h1');
            if (titleEl) {
                const title = titleEl.textContent.trim().replace(/\s*\(\d{4}\)\s*$/, '');
                DevLog.info('VK Search: Заголовок найден через DOM', { title: title });
                addButton(title, null);
            } else {
                DevLog.error('VK Search: Заголовок НЕ НАЙДЕН через DOM!');
            }
        }, 1000);
    }

    // Функция добавления кнопки
    function addButton(title, year) {
        DevLog.info(`VK Search: Пытаемся добавить кнопку для "${title}"...`);
        
        // Удаляем старые кнопки
        document.querySelectorAll('.vk-search-btn').forEach(b => b.remove());

        if (!title) return;

        const query = encodeURIComponent(`${title} ${year || ''}`.trim());
        const vkSearchUrl = `https://vk.com/video?q=${query}&section=all`;

        // Расширенный список ВСЕХ возможных контейнеров
        const selectors = [
            '.view__actions',
            '.player__actions', 
            '.full-card__actions',
            '.view__buttons',
            '.card__actions',
            '.view__controls',
            '.player__controls',
            '.full-card__buttons'
        ];

        let container = null;
        let usedSelector = '';

        // Ищем первый подходящий
        for (let sel of selectors) {
            container = document.querySelector(sel);
            if (container) {
                usedSelector = sel;
                DevLog.info(`VK Search: НАЙДЕН контейнер "${sel}"!`);
                break;
            }
        }

        if (!container) {
            DevLog.error('VK Search: КОНТЕЙНЕР НЕ НАЙДЕН! Ищем вручную...');
            // Если ничего не нашли, пробуем вставиться прямо в body для диагностики
            container = document.body;
            usedSelector = 'document.body (FALLBACK)';
        }

        // Создаем кнопку
        const link = document.createElement('a');
        link.className = 'view__action vk-search-btn';
        link.href = vkSearchUrl;
        link.target = '_blank';
        link.innerHTML = '<span>VK Видео</span>';
        link.style.cssText = 'display:inline-block;padding:8px 12px;margin:4px;background:#07f;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;z-index:9999;';
        
        container.appendChild(link);
        DevLog.info(`VK Search: Кнопка УСПЕШНО добавлена в "${usedSelector}"!`);
    }

    // Запускаем
    waitForLampa(initPlugin);
})();
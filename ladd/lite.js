/**
 * Плагин ультра-оптимизации для слабых устройств
 * Версия 1.0
 * Устанавливается в папку /plugins и активируется в настройках
 */
(function() {
    'use strict';

    // Проверка, является ли устройство ультраслабым
    function isUltraWeakDevice() {
        // Ручной флаг в настройках (позволит принудительно включить)
        if (Lampa.Settings && Lampa.Settings.get('ultra_weak_force')) {
            return true;
        }

        // Автоматическое определение
        var cores = navigator.hardwareConcurrency || 0;
        var memory = navigator.deviceMemory || 0;
        var isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        var isOld = /(?:Android [0-4]|iPhone OS [0-9]_[0-9])/.test(navigator.userAgent);

        // Если ядер <= 2 и памяти <= 2 ГБ, или это старое мобильное устройство
        if ((cores <= 2 && memory <= 2) || isOld || (isMobile && cores <= 4 && memory <= 3)) {
            return true;
        }
        return false;
    }

    // Функция применения оптимизаций
    function applyOptimizations() {
        console.log('[UltraWeak] Применяем оптимизации для слабого устройства');

        // 1. Добавляем CSS-класс на body и стили
        document.body.classList.add('ultra-weak-mode');

        // Внедряем упрощающие стили
        var style = document.createElement('style');
        style.id = 'ultra-weak-styles';
        style.textContent = `
            /* Отключаем все анимации и переходы */
            .ultra-weak-mode * {
                animation-duration: 0s !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0s !important;
                transition-delay: 0s !important;
                scroll-behavior: auto !important;
            }
            /* Упрощаем тени и скругления */
            .ultra-weak-mode .item,
            .ultra-weak-mode .poster,
            .ultra-weak-mode .card {
                box-shadow: none !important;
                border-radius: 4px !important;
                background: #222 !important;
            }
            /* Убираем фоновые видео и сложные градиенты */
            .ultra-weak-mode .bg-video,
            .ultra-weak-mode .parallax {
                display: none !important;
            }
            /* Уменьшаем количество постеров в ряду (если есть грид) */
            .ultra-weak-mode .grid {
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)) !important;
            }
            /* Отключаем прозрачность и блюр */
            .ultra-weak-mode .blur,
            .ultra-weak-mode .glass {
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
                opacity: 1 !important;
                background: rgba(0,0,0,0.8) !important;
            }
        `;
        document.head.appendChild(style);

        // 2. Отключаем синхронизацию (перехват fetch)
        if (window.fetch) {
            var originalFetch = window.fetch;
            window.fetch = function(input, init) {
                var url = typeof input === 'string' ? input : (input.url || '');
                // Блокируем запросы синхронизации и прочие фоновые
                if (url.includes('/lampa/sync') || url.includes('/lampa/checkToken')) {
                    // Возвращаем пустой успешный ответ, чтобы не ломать логику
                    return Promise.resolve(new Response('{}', { status: 200, statusText: 'OK' }));
                }
                // Для изображений – добавляем кеширование через Cache API (если поддерживается)
                if (url.match(/\.(jpg|jpeg|png|gif|webp|bmp)/i) && 'caches' in window) {
                    return caches.match(url).then(function(response) {
                        if (response) {
                            return response;
                        }
                        return originalFetch.call(window, input, init).then(function(res) {
                            if (res.ok) {
                                var clone = res.clone();
                                caches.open('ultra-weak-cache').then(function(cache) {
                                    cache.put(url, clone);
                                });
                            }
                            return res;
                        });
                    });
                }
                return originalFetch.call(window, input, init);
            };
        }

        // 3. Останавливаем все таймеры, которые могут быть связаны с синхронизацией (если есть)
        //    (Перехватываем setInterval и запоминаем их, чтобы потом очистить)
        var intervalsToClear = [];
        var originalSetInterval = window.setInterval;
        window.setInterval = function(handler, timeout) {
            // Если интервал длинный (> 10 сек) и похож на синхронизацию – не даём ему запуститься
            if (timeout >= 10000) {
                // Проверяем, не является ли handler строкой или функцией с признаками синхронизации
                var fnStr = handler.toString ? handler.toString() : '';
                if (fnStr.indexOf('sync') !== -1 || fnStr.indexOf('check') !== -1) {
                    console.log('[UltraWeak] Блокируем интервал синхронизации');
                    return -1; // невалидный id
                }
            }
            return originalSetInterval(handler, timeout);
        };

        // 4. Включаем ленивую загрузку изображений (если не используется native lazy)
        //    Добавляем атрибут loading="lazy" ко всем изображениям, которые подгружаются динамически
        //    Можно через MutationObserver
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1 && node.tagName === 'IMG') {
                        node.setAttribute('loading', 'lazy');
                    }
                    // Также проверим вложенные img
                    if (node.querySelectorAll) {
                        node.querySelectorAll('img').forEach(function(img) {
                            img.setAttribute('loading', 'lazy');
                        });
                    }
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });

        // 5. Отключаем автовоспроизведение видео (если доступно)
        if (Lampa.Player && Lampa.Player.setOption) {
            Lampa.Player.setOption('autoplay', false);
        }

        // 6. Увеличиваем интервал между обновлениями состояния
        if (Lampa.Storage) {
            Lampa.Storage.set('update_interval', 300000); // 5 минут
        }

        // 7. Добавляем пункт в настройки для ручного переключения (если интерфейс позволяет)
        //    Но мы просто показываем уведомление
        if (Lampa.Notify) {
            Lampa.Notify.show('Включён режим экономии для слабых устройств', 'info', 5000);
        }
    }

    // Регистрируем плагин
    Lampa.Plugin.add('ultra_weak_optimizer', {
        init: function() {
            // Ждём готовности приложения
            Lampa.Manifest.on('ready', function() {
                if (isUltraWeakDevice()) {
                    applyOptimizations();
                } else {
                    // Если устройство не слабое, но пользователь хочет принудительно
                    if (Lampa.Settings && Lampa.Settings.get('ultra_weak_force')) {
                        applyOptimizations();
                    }
                }
            });

            // Добавляем настройку в интерфейс (если есть Lampa.Settings)
            if (Lampa.Settings) {
                Lampa.Settings.add({
                    id: 'ultra_weak_force',
                    name: 'Принудительный режим экономии',
                    type: 'checkbox',
                    value: false,
                    description: 'Включить оптимизации даже на мощных устройствах (для теста)'
                });
            }
        },
        destroy: function() {
            // Очистка: убираем стили, восстанавливаем fetch и т.д.
            var style = document.getElementById('ultra-weak-styles');
            if (style) style.remove();
            document.body.classList.remove('ultra-weak-mode');
            // Восстановление fetch - сложно, но можно перезагрузить страницу
            // или просто оставить как есть (при перезагрузке всё вернётся)
            console.log('[UltraWeak] Плагин отключён, перезагрузите страницу для полного восстановления');
        }
    });
})();
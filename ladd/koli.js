(function() {
    'use strict';

    // Ждём готовности Lampa
    function waitForLampa(cb) {
        if (window.Lampa && Lampa.Storage && Lampa.Activity) {
            cb();
        } else {
            setTimeout(() => waitForLampa(cb), 100);
        }
    }

    // ===== Стили в духе Kodi =====
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Полноэкранная сетка */
            .kodi-library-app {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: #0d0d0d; color: #fff; z-index: 9999; overflow-y: auto;
                display: flex; flex-direction: column;
            }
            .kodi-header {
                padding: 15px 20px; display: flex; align-items: center;
                background: rgba(0,0,0,0.7); backdrop-filter: blur(5px);
                position: sticky; top: 0; z-index: 10;
            }
            .kodi-menu-btn {
                font-size: 24px; cursor: pointer; margin-right: 20px;
                background: none; border: none; color: #fff; opacity: 0.8;
                transition: opacity 0.2s;
            }
            .kodi-menu-btn:hover { opacity: 1; }
            .kodi-title { font-size: 22px; font-weight: 500; }
            .kodi-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                gap: 20px; padding: 20px; margin: 0 auto; width: 100%;
                max-width: 1400px; box-sizing: border-box;
            }
            .kodi-tile {
                border-radius: 8px; overflow: hidden; background: #1a1a1a;
                cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;
                outline: none;
            }
            .kodi-tile:focus {
                box-shadow: 0 0 0 3px #ffaa00; transform: scale(1.03);
            }
            .kodi-tile img {
                width: 100%; aspect-ratio: 2/3; object-fit: cover; display: block;
            }
            .kodi-tile-title {
                padding: 10px; font-size: 14px; text-align: center;
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            }
            .kodi-empty {
                text-align: center; padding: 40px 20px; color: #888; font-size: 18px;
            }
            /* Адаптация для ТВ: убираем скроллбар если нужно */
            .kodi-library-app::-webkit-scrollbar { width: 6px; }
            .kodi-library-app::-webkit-scrollbar-thumb { background: #555; border-radius: 3px; }
        `;
        document.head.appendChild(style);
    }

    // ===== Построение HTML-сетки =====
    function buildGrid(items) {
        if (!items || !items.length) {
            return '<div class="kodi-empty">Ваше избранное пусто. Добавьте фильмы или сериалы в избранное, и они появятся здесь.</div>';
        }
        let html = '<div class="kodi-grid">';
        items.forEach((item, index) => {
            const poster = item.poster || 'https://via.placeholder.com/180x270?text=No+Image';
            const title = item.title || item.name || 'Без названия';
            html += `
                <div class="kodi-tile" tabindex="0" data-id="${item.id}" data-type="${item.type}" data-index="${index}">
                    <img src="${poster}" alt="${title}" />
                    <div class="kodi-tile-title">${title}</div>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }

    // ===== Навигация стрелками (для ТВ/пульта) =====
    function enableGridNavigation(container) {
        const tiles = Array.from(container.querySelectorAll('.kodi-tile'));
        if (!tiles.length) return;

        // Определяем количество колонок
        const firstTile = tiles[0];
        const tileWidth = firstTile.offsetWidth;
        const grid = container.querySelector('.kodi-grid');
        if (!grid) return;
        const gridStyle = window.getComputedStyle(grid);
        const columns = parseInt(gridStyle.gridTemplateColumns.split(' ').length) || 
                        Math.floor(grid.offsetWidth / (tileWidth + 20)); // 20 = gap

        tiles.forEach((tile, i) => {
            tile.addEventListener('keydown', function(e) {
                const row = Math.floor(i / columns);
                const col = i % columns;
                let nextIndex = i;

                switch(e.key) {
                    case 'ArrowUp':
                        if (row > 0) nextIndex = i - columns;
                        else return;
                        break;
                    case 'ArrowDown':
                        if (row < Math.floor((tiles.length-1) / columns)) nextIndex = i + columns;
                        else return;
                        break;
                    case 'ArrowLeft':
                        if (col > 0) nextIndex = i - 1;
                        else return;
                        break;
                    case 'ArrowRight':
                        if (col < columns - 1 && i + 1 < tiles.length) nextIndex = i + 1;
                        else return;
                        break;
                    case 'Enter':
                        this.click();
                        return;
                    default:
                        return;
                }
                e.preventDefault();
                if (tiles[nextIndex]) tiles[nextIndex].focus();
            });
        });

        // Автофокус на первом элементе при открытии
        setTimeout(() => {
            if (tiles[0]) tiles[0].focus();
        }, 100);
    }

    // ===== Показать библиотеку (заменяет главный экран) =====
    function showLibrary() {
        // Скрываем оригинальный интерфейс Lampa
        const lampaRoot = document.getElementById('app') || document.body;
        // Добавим класс, чтобы скрыть всё, кроме нашего приложения
        lampaRoot.classList.add('kodi-library-mode');
        // Создаём контейнер
        const appDiv = document.createElement('div');
        appDiv.className = 'kodi-library-app';
        appDiv.id = 'kodi-library-root';

        // Загружаем избранное
        let favs = Lampa.Storage.get('bookmarks', []);
        if (!Array.isArray(favs)) favs = [];

        appDiv.innerHTML = `
            <div class="kodi-header">
                <button class="kodi-menu-btn" id="kodi-menu-button" title="Меню">☰</button>
                <div class="kodi-title">Библиотека</div>
            </div>
            <div class="kodi-content">
                ${buildGrid(favs)}
            </div>
        `;

        // Удаляем старый экземпляр, если есть
        const oldRoot = document.getElementById('kodi-library-root');
        if (oldRoot) oldRoot.remove();
        document.body.appendChild(appDiv);

        // Обработчик кликов по плиткам
        appDiv.querySelectorAll('.kodi-tile').forEach(tile => {
            tile.addEventListener('click', function() {
                const id = this.dataset.id;
                const type = this.dataset.type;
                if (id && type) {
                    Lampa.Activity.push({
                        url: '',
                        component: 'full_card',
                        card: { id, type }
                    });
                }
            });
        });

        // Кнопка меню — возвращает в стандартное меню Lampa
        document.getElementById('kodi-menu-button').addEventListener('click', () => {
            // Удаляем наше приложение
            const root = document.getElementById('kodi-library-root');
            if (root) root.remove();
            // Убираем класс скрытия
            lampaRoot.classList.remove('kodi-library-mode');
            // Открываем главную активность Lampa
            Lampa.Activity.push({ url: '', component: 'main' });
        });

        // Включаем навигацию стрелками
        enableGridNavigation(appDiv.querySelector('.kodi-content'));

        // CSS-правило для скрытия оригинального интерфейса
        const style = document.createElement('style');
        style.id = 'kodi-hide-lampa-style';
        style.textContent = `
            body.kodi-library-mode #app > *:not(#kodi-library-root),
            body.kodi-library-mode .menu,
            body.kodi-library-mode .head,
            body.kodi-library-mode .footer,
            body.kodi-library-mode .modals { display: none !important; }
        `;
        document.head.appendChild(style);
    }

    // ===== Инициализация =====
    waitForLampa(() => {
        addStyles();
        // При запуске плагина сразу заменяем интерфейс.
        // Но нужно дождаться, когда Lampa отрисует главную страницу, чтобы потом её скрыть.
        // Используем небольшой таймаут, чтобы главный экран успел появиться, а затем скроем.
        setTimeout(() => {
            showLibrary();
        }, 500);
    });
})();
/**
 * Плагин "Windows-лаунчер" для Lampa
 * Версия 1.0
 */

(function () {
    'use strict';

    // Ожидаем готовность ядра Lampa
    Lampa.Listener.follow('app', function (e) {
        if (e.name === 'ready') {
            initWindowsLauncher();
        }
    });

    function initWindowsLauncher() {
        // Проверяем, не был ли уже создан наш интерфейс
        if (document.getElementById('win-launcher')) return;

        // Скрываем стандартный домашний экран Lampa (он всё равно будет под нашим)
        const style = document.createElement('style');
        style.textContent = `
            /* Основные стили лаунчера */
            #win-launcher {
                position: fixed;
                top: 0; left: 0;
                width: 100vw; height: 100vh;
                z-index: 999999;
                font-family: 'Segoe UI', system-ui, sans-serif;
                color: #fff;
                user-select: none;
                overflow: hidden;
            }
            #win-desktop-bg {
                position: absolute;
                inset: 0;
                background-size: cover;
                background-position: center;
                filter: brightness(0.7);
                z-index: 0;
            }
            #win-tile-grid {
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 24px;
                max-width: 80vw;
                z-index: 2;
            }
            .win-tile {
                width: 220px;
                height: 160px;
                background: rgba(30, 30, 30, 0.8);
                backdrop-filter: blur(15px);
                border: 2px solid rgba(255,255,255,0.1);
                border-radius: 12px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-size: 22px;
                font-weight: 500;
                text-align: center;
                transition: transform 0.2s, border-color 0.2s, background 0.2s;
                cursor: pointer;
                outline: none;
                box-shadow: 0 4px 15px rgba(0,0,0,0.5);
            }
            .win-tile:focus {
                border-color: var(--accent, #2b8cff);
                transform: scale(1.08);
                background: rgba(50, 50, 50, 0.9);
                box-shadow: 0 0 20px var(--accent, #2b8cff);
            }
            .win-tile-icon {
                font-size: 44px;
                margin-bottom: 8px;
            }

            #win-clock {
                position: absolute;
                top: 30px;
                right: 40px;
                z-index: 5;
                font-size: 28px;
                font-weight: 300;
                text-shadow: 0 0 10px rgba(0,0,0,0.5);
            }

            #start-button {
                position: absolute;
                bottom: 30px;
                left: 30px;
                z-index: 5;
                width: 56px;
                height: 56px;
                background: var(--accent, #2b8cff);
                border-radius: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 28px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                cursor: pointer;
                transition: background 0.3s;
            }
            #start-button:focus {
                outline: 3px solid #fff;
            }

            #start-menu {
                position: absolute;
                bottom: 100px;
                left: 30px;
                background: rgba(20, 20, 20, 0.9);
                backdrop-filter: blur(25px);
                border-radius: 14px;
                padding: 15px 0;
                z-index: 10;
                display: none;
                min-width: 220px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.7);
            }
            .start-item {
                padding: 14px 25px;
                font-size: 20px;
                cursor: pointer;
                outline: none;
                transition: background 0.2s;
            }
            .start-item:focus {
                background: var(--accent, #2b8cff);
                color: #fff;
            }
        `;
        document.head.appendChild(style);

        // HTML-каркас
        const launcher = document.createElement('div');
        launcher.id = 'win-launcher';
        launcher.innerHTML = `
            <div id="win-desktop-bg"></div>
            <div id="win-clock">00:00</div>
            <div id="win-tile-grid">
                <div class="win-tile" data-action="movies" tabindex="0">
                    <span class="win-tile-icon">🎬</span> Фильмы
                </div>
                <div class="win-tile" data-action="series" tabindex="0">
                    <span class="win-tile-icon">📺</span> Сериалы
                </div>
                <div class="win-tile" data-action="search" tabindex="0">
                    <span class="win-tile-icon">🔍</span> Поиск
                </div>
                <div class="win-tile" data-action="bookmarks" tabindex="0">
                    <span class="win-tile-icon">⭐</span> Избранное
                </div>
                <div class="win-tile" data-action="settings" tabindex="0">
                    <span class="win-tile-icon">⚙️</span> Настройки
                </div>
            </div>
            <div id="start-button" tabindex="0">⊞</div>
            <div id="start-menu">
                <div class="start-item" data-action="movies" tabindex="0">🎬 Фильмы</div>
                <div class="start-item" data-action="series" tabindex="0">📺 Сериалы</div>
                <div class="start-item" data-action="search" tabindex="0">🔍 Поиск</div>
                <div class="start-item" data-action="bookmarks" tabindex="0">⭐ Избранное</div>
                <div class="start-item" data-action="settings" tabindex="0">⚙️ Настройки</div>
                <div class="start-item" data-action="theme-settings" tabindex="0">🎨 Тема оформления</div>
            </div>
        `;
        document.body.appendChild(launcher);

        // Загружаем сохранённые настройки
        let winConfig = Lampa.Storage.get('win_theme') || {};
        applyConfig(winConfig);

        // Обновление часов
        function updateClock() {
            const now = new Date();
            document.getElementById('win-clock').textContent =
                now.getHours().toString().padStart(2, '0') + ':' +
                now.getMinutes().toString().padStart(2, '0');
        }
        updateClock();
        setInterval(updateClock, 60000);

        // Логика фокуса и навигации
        let currentMenu = 'tiles'; // 'tiles', 'start'
        const tiles = Array.from(document.querySelectorAll('.win-tile'));
        const startItems = Array.from(document.querySelectorAll('.start-item'));
        const startButton = document.getElementById('start-button');
        const startMenu = document.getElementById('start-menu');

        function setFocus(elements, index) {
            elements.forEach(el => el.blur());
            if (elements.length > 0) {
                elements[Math.min(Math.max(index, 0), elements.length - 1)].focus();
            }
        }

        let tileFocusIndex = 0;
        let startFocusIndex = 0;

        // Начальный фокус на первой плитке
        if (tiles.length) tiles[0].focus();

        // Обработчик клавиш
        document.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' ||
                e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();

                if (currentMenu === 'tiles') {
                    const cols = 3; // фиксировано 3 плитки в строке
                    if (e.key === 'ArrowRight') tileFocusIndex = (tileFocusIndex + 1) % tiles.length;
                    else if (e.key === 'ArrowLeft') tileFocusIndex = (tileFocusIndex - 1 + tiles.length) % tiles.length;
                    else if (e.key === 'ArrowDown') tileFocusIndex = (tileFocusIndex + cols) % tiles.length;
                    else if (e.key === 'ArrowUp') tileFocusIndex = (tileFocusIndex - cols + tiles.length) % tiles.length;
                    setFocus(tiles, tileFocusIndex);
                } else if (currentMenu === 'start') {
                    if (e.key === 'ArrowDown') startFocusIndex = (startFocusIndex + 1) % startItems.length;
                    else if (e.key === 'ArrowUp') startFocusIndex = (startFocusIndex - 1 + startItems.length) % startItems.length;
                    setFocus(startItems, startFocusIndex);
                }
            } else if (e.key === 'Enter') {
                if (currentMenu === 'tiles') {
                    const tile = tiles[tileFocusIndex];
                    if (tile) handleAction(tile.dataset.action);
                } else if (currentMenu === 'start') {
                    const item = startItems[startFocusIndex];
                    if (item) handleAction(item.dataset.action);
                }
                e.preventDefault();
            } else if (e.key === 'Backspace') {
                // Выход из меню Пуск или возврат в лаунчер
                if (currentMenu === 'start') {
                    closeStartMenu();
                    e.preventDefault();
                } else {
                    // Попытка вернуться с других экранов Lampa
                    if (Lampa.Activity.active) {
                        Lampa.Activity.back();
                        e.preventDefault();
                    }
                }
            } else if (e.key === 'm' || e.key === 'M') {
                // Кнопка Menu на пульте (часто M) — переключение меню Пуск
                toggleStartMenu();
                e.preventDefault();
            }
        });

        // Клик для мыши (удобно при разработке)
        startButton.addEventListener('click', toggleStartMenu);
        tiles.forEach(tile => tile.addEventListener('click', () => handleAction(tile.dataset.action)));
        startItems.forEach(item => item.addEventListener('click', () => handleAction(item.dataset.action)));

        function toggleStartMenu() {
            if (currentMenu === 'start') {
                closeStartMenu();
            } else {
                openStartMenu();
            }
        }

        function openStartMenu() {
            startMenu.style.display = 'block';
            currentMenu = 'start';
            startFocusIndex = 0;
            setFocus(startItems, startFocusIndex);
        }

        function closeStartMenu() {
            startMenu.style.display = 'none';
            currentMenu = 'tiles';
            setFocus(tiles, tileFocusIndex);
        }

        function handleAction(action) {
            if (action === 'theme-settings') {
                openThemeSettings();
                return;
            }

            closeStartMenu();
            // Снимаем фокус, чтобы не мешал
            document.activeElement?.blur();

            // Открываем разделы Lampa
            switch (action) {
                case 'movies':
                    Lampa.Activity.push({ url: '', title: 'Фильмы', component: 'category_full', page: 1 });
                    break;
                case 'series':
                    Lampa.Activity.push({ url: '', title: 'Сериалы', component: 'category_full', page: 1 });
                    break;
                case 'search':
                    Lampa.Activity.push({ url: '', title: 'Поиск', component: 'search', page: 1 });
                    break;
                case 'bookmarks':
                    Lampa.Activity.push({ url: '', title: 'Избранное', component: 'bookmarks', page: 1 });
                    break;
                case 'settings':
                    Lampa.Activity.push({ url: '', title: 'Настройки', component: 'settings', page: 1 });
                    break;
            }
        }

        // Настройки темы (упрощённо)
        function openThemeSettings() {
            closeStartMenu();
            const accent = prompt('Акцентный цвет (hex, например #2b8cff):', winConfig.accent || '#2b8cff');
            if (accent) {
                winConfig.accent = accent;
                document.documentElement.style.setProperty('--accent', accent);
                Lampa.Storage.set('win_theme', winConfig);
            }
            const bgUrl = prompt('URL обоев (или оставьте пустым):', winConfig.bgUrl || '');
            if (bgUrl !== null) {
                winConfig.bgUrl = bgUrl;
                document.getElementById('win-desktop-bg').style.backgroundImage = bgUrl ? `url(${bgUrl})` : 'none';
                Lampa.Storage.set('win_theme', winConfig);
            }
        }

        function applyConfig(cfg) {
            if (cfg.accent) {
                document.documentElement.style.setProperty('--accent', cfg.accent);
            }
            if (cfg.bgUrl) {
                document.getElementById('win-desktop-bg').style.backgroundImage = `url(${cfg.bgUrl})`;
            }
        }

        // Возврат на домашний экран, если пользователь вышел из раздела
        Lampa.Listener.follow('activity', function (e) {
            if (e.name === 'pop') {
                // Можно показать лаунчер, если он скрыт (но он всегда наверху)
            }
        });

        // Обработчик скрытия лаунчера при переходе в плеер (чтобы не мешал просмотру)
        Lampa.Listener.follow('activity', function (e) {
            if (e.name === 'push' && e.activity?.component === 'player') {
                document.getElementById('win-launcher').style.display = 'none';
            } else if (e.name === 'pop') {
                document.getElementById('win-launcher').style.display = '';
            }
        });
    }
})();
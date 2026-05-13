(function () {
    'use strict';

    // Основная функция инициализации
    function init() {
        // Убедимся, что Lampa готова
        if (typeof Lampa === 'undefined' || !Lampa.Storage) {
            setTimeout(init, 500);
            return;
        }

        // Настройка по умолчанию
        const STORAGE_KEY = 'winpa_launcher_mode';
        let currentMode = Lampa.Storage.get(STORAGE_KEY) || 'lampa';

        // Функция применения режима
        function applyMode(mode) {
            const winLauncher = document.getElementById('win-launcher');

            if (mode === 'winpa') {
                // Показать Windows-лаунчер
                if (!winLauncher) {
                    createWinLauncher();
                } else {
                    winLauncher.style.display = '';
                }
                // Скрыть основной интерфейс Lampa
                hideLampaUI(true);
            } else {
                // Скрыть Windows-лаунчер
                if (winLauncher) {
                    winLauncher.style.display = 'none';
                }
                // Показать основной интерфейс Lampa
                hideLampaUI(false);
            }
            Lampa.Storage.set(STORAGE_KEY, mode);
        }

        // Функция скрытия/показа стандартного интерфейса Lampa
        function hideLampaUI(hide) {
            // Ищем корневой элемент интерфейса Lampa (обычно это div с классом "app")
            const app = document.querySelector('.app');
            if (app) {
                app.style.display = hide ? 'none' : '';
            }
            // Также скрываем меню, если открыто
            if (hide && Lampa.Menu && Lampa.Menu.close) {
                Lampa.Menu.close();
            }
        }

        // Создание Windows-лаунчера (как в прошлом ответе, но с небольшими доработками)
        function createWinLauncher() {
            // Проверяем, не создан ли уже
            if (document.getElementById('win-launcher')) return;

            // Уведомление для отладки (можно удалить)
            Lampa.Noty?.show('Winpa Launcher активирован', {console: true});

            // Стили
            const style = document.createElement('style');
            style.textContent = `
                #win-launcher {
                    position: fixed;
                    inset: 0;
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
                    filter: brightness(0.6);
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
                    max-width: 85vw;
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
                .win-tile-icon { font-size: 44px; margin-bottom: 8px; }
                #win-clock {
                    position: absolute;
                    top: 30px; right: 40px;
                    z-index: 5;
                    font-size: 28px;
                    font-weight: 300;
                    text-shadow: 0 0 10px rgba(0,0,0,0.5);
                }
                #win-start-button {
                    position: absolute;
                    bottom: 30px; left: 30px;
                    z-index: 5;
                    width: 56px; height: 56px;
                    background: var(--accent, #2b8cff);
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 28px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                    cursor: pointer;
                }
                #win-start-button:focus { outline: 3px solid #fff; }
                #win-start-menu {
                    position: absolute;
                    bottom: 100px; left: 30px;
                    background: rgba(20, 20, 20, 0.9);
                    backdrop-filter: blur(25px);
                    border-radius: 14px;
                    padding: 15px 0;
                    z-index: 10;
                    display: none;
                    min-width: 220px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.7);
                }
                .win-start-item {
                    padding: 14px 25px;
                    font-size: 20px;
                    cursor: pointer;
                    outline: none;
                    transition: background 0.2s;
                }
                .win-start-item:focus {
                    background: var(--accent, #2b8cff);
                    color: #fff;
                }
            `;
            document.head.appendChild(style);

            // HTML
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
                <div id="win-start-button" tabindex="0">⊞</div>
                <div id="win-start-menu">
                    <div class="win-start-item" data-action="movies" tabindex="0">🎬 Фильмы</div>
                    <div class="win-start-item" data-action="series" tabindex="0">📺 Сериалы</div>
                    <div class="win-start-item" data-action="search" tabindex="0">🔍 Поиск</div>
                    <div class="win-start-item" data-action="bookmarks" tabindex="0">⭐ Избранное</div>
                    <div class="win-start-item" data-action="settings" tabindex="0">⚙️ Настройки</div>
                    <div class="win-start-item" data-action="theme" tabindex="0">🎨 Оформление</div>
                    <div class="win-start-item" data-action="switch-back" tabindex="0">🔁 Вернуть Lampa</div>
                </div>
            `;
            document.body.appendChild(launcher);

            // Переменные навигации
            let currentMenu = 'tiles';
            const tiles = Array.from(document.querySelectorAll('.win-tile'));
            const startItems = Array.from(document.querySelectorAll('.win-start-item'));
            const startButton = document.getElementById('win-start-button');
            const startMenu = document.getElementById('win-start-menu');
            let tileFocusIndex = 0;
            let startFocusIndex = 0;

            function setFocus(elements, index) {
                elements.forEach(el => el.blur());
                if (elements.length) {
                    const idx = Math.min(Math.max(index, 0), elements.length - 1);
                    elements[idx].focus();
                }
            }

            if (tiles.length) tiles[0].focus();

            // Часы
            function updateClock() {
                const now = new Date();
                const clock = document.getElementById('win-clock');
                if (clock) clock.textContent =
                    now.getHours().toString().padStart(2, '0') + ':' +
                    now.getMinutes().toString().padStart(2, '0');
            }
            updateClock();
            setInterval(updateClock, 60000);

            // Загружаем обои и акцент
            const config = Lampa.Storage.get('winpa_config') || {};
            if (config.accent) document.documentElement.style.setProperty('--accent', config.accent);
            if (config.bgUrl) {
                document.getElementById('win-desktop-bg').style.backgroundImage = `url(${config.bgUrl})`;
            }

            // Обработчики клавиш
            document.addEventListener('keydown', winKeyHandler);

            function winKeyHandler(e) {
                if (document.getElementById('win-launcher').style.display === 'none') return;

                if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                    e.preventDefault();
                    if (currentMenu === 'tiles') {
                        const cols = 3;
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
                    e.preventDefault();
                    if (currentMenu === 'tiles') {
                        const tile = tiles[tileFocusIndex];
                        if (tile) handleAction(tile.dataset.action);
                    } else if (currentMenu === 'start') {
                        const item = startItems[startFocusIndex];
                        if (item) handleAction(item.dataset.action);
                    }
                } else if (e.key === 'Backspace') {
                    if (currentMenu === 'start') {
                        closeStartMenu();
                        e.preventDefault();
                    }
                } else if (e.key === 'm' || e.key === 'M') {
                    toggleStartMenu();
                    e.preventDefault();
                }
            }

            function toggleStartMenu() {
                if (currentMenu === 'start') closeStartMenu();
                else openStartMenu();
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
                if (action === 'switch-back') {
                    applyMode('lampa');
                    return;
                }
                if (action === 'theme') {
                    openThemeSettings();
                    return;
                }
                closeStartMenu();
                document.activeElement?.blur();

                // Открываем стандартные разделы Lampa
                try {
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
                } catch (e) {
                    console.error('Winpa: ошибка открытия раздела', e);
                }
            }

            function openThemeSettings() {
                closeStartMenu();
                const accent = prompt('Акцентный цвет (hex):', config.accent || '#2b8cff');
                if (accent) {
                    config.accent = accent;
                    document.documentElement.style.setProperty('--accent', accent);
                }
                const bgUrl = prompt('URL обоев (пусто для сброса):', config.bgUrl || '');
                if (bgUrl !== null) {
                    config.bgUrl = bgUrl;
                    document.getElementById('win-desktop-bg').style.backgroundImage = bgUrl ? `url(${bgUrl})` : 'none';
                }
                Lampa.Storage.set('winpa_config', config);
            }

            // Скрываем лаунчер, когда открывается плеер
            Lampa.Listener.follow('activity', function (e) {
                const win = document.getElementById('win-launcher');
                if (!win || win.style.display === 'none') return;
                if (e.name === 'push' && e.activity?.component === 'player') {
                    win.style.display = 'none';
                } else if (e.name === 'pop') {
                    win.style.display = '';
                }
            });
        }

        // --- Внедрение в настройки Lampa ---
        function addSettingsEntry() {
            // Ждем, пока настройки будут доступны
            if (typeof Lampa.Settings === 'undefined' || !Lampa.Settings.main) {
                setTimeout(addSettingsEntry, 300);
                return;
            }

            // Проверяем, не добавлен ли уже пункт
            if (Lampa.Settings.main().find(item => item.id === 'winpa_launcher')) return;

            // Добавляем пункт в раздел "Интерфейс"
            Lampa.Settings.listener.follow('open', function (event) {
                if (event.name === 'interface') {
                    // Добавляем с небольшой задержкой, чтобы DOM обновился
                    setTimeout(() => {
                        const container = document.querySelector('.settings__content');
                        if (!container) return;

                        // Создаем элемент настройки
                        const settingItem = document.createElement('div');
                        settingItem.className = 'settings__item';
                        settingItem.innerHTML = `
                            <div class="settings__name">Лаунчер</div>
                            <select class="settings__value" style="color: var(--color-text, #fff); background: transparent; border: 1px solid rgba(255,255,255,0.2); padding: 5px; border-radius: 6px;">
                                <option value="lampa">Lampa</option>
                                <option value="winpa">Winpa</option>
                            </select>
                        `;
                        const select = settingItem.querySelector('select');
                        select.value = currentMode;
                        select.addEventListener('change', function () {
                            const newMode = this.value;
                            if (newMode !== currentMode) {
                                currentMode = newMode;
                                applyMode(newMode);
                            }
                        });

                        container.appendChild(settingItem);
                    }, 100);
                }
            });
        }

        // Запускаем всё
        addSettingsEntry();
        applyMode(currentMode);

        // На случай, если пользователь переключит лаунчер не через настройки (например, кнопкой "Вернуть Lampa")
        // ничего дополнительного не требуется.
    }

    // Стартуем инициализацию после загрузки Lampa
    if (typeof Lampa !== 'undefined' && Lampa.App && Lampa.App.ready) {
        init();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.name === 'ready') {
                init();
            }
        });
    }
})();
(function() {
    'use strict';

    // Ждём, пока Lampa загрузится
    function waitForLampa(cb) {
        if (window.Lampa && Lampa.Storage && Lampa.Activity) {
            cb();
        } else {
            setTimeout(function() { waitForLampa(cb); }, 100);
        }
    }

    // Стили библиотеки
    function addStyles() {
        var style = document.createElement('style');
        style.textContent = `
            .kodi-library-container { padding: 20px; background: #0d0d0d; min-height: 100vh; color: #fff; }
            .kodi-library-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 20px; padding: 20px 0; }
            .kodi-tile { border-radius: 8px; overflow: hidden; background: #1a1a1a; cursor: pointer; transition: transform 0.2s; }
            .kodi-tile:hover { transform: scale(1.05); }
            .kodi-tile img { width: 100%; aspect-ratio: 2/3; object-fit: cover; display: block; }
            .kodi-tile-title { padding: 10px; font-size: 14px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .kodi-empty { text-align: center; padding: 40px; color: #888; font-size: 18px; }
            /* Стиль нашего пункта меню */
            #kodi-menu-btn {
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                cursor: pointer; padding: 8px; min-width: 60px; color: #fff; opacity: 0.7;
            }
            #kodi-menu-btn.active { opacity: 1; color: #ffaa00; }
            #kodi-menu-btn .menu-icon { font-size: 22px; margin-bottom: 4px; }
            #kodi-menu-btn .menu-title { font-size: 12px; white-space: nowrap; }
        `;
        document.head.appendChild(style);
    }

    // Построение сетки
    function buildGrid(items) {
        if (!items || !items.length) return '<div class="kodi-empty">Нет избранного. Добавьте фильмы или сериалы в избранное.</div>';
        var html = '<div class="kodi-library-grid">';
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var poster = item.poster || 'https://via.placeholder.com/160x240?text=No+Image';
            var title = item.title || item.name || 'Без названия';
            html += '<div class="kodi-tile" data-id="' + item.id + '" data-type="' + item.type + '">' +
                        '<img src="' + poster + '" />' +
                        '<div class="kodi-tile-title">' + title + '</div>' +
                    '</div>';
        }
        html += '</div>';
        return html;
    }

    // Показать библиотеку
    function showLibrary() {
        var favs = Lampa.Storage.get('bookmarks', []);
        if (!Array.isArray(favs)) favs = [];
        var html = '<div class="kodi-library-container"><h2>Библиотека (Избранное)</h2>' + buildGrid(favs) + '</div>';
        Lampa.Activity.push({
            url: '',
            component: 'html',
            html: html,
            onCreate: function() {
                setTimeout(function() {
                    var tiles = document.querySelectorAll('.kodi-tile');
                    for (var j = 0; j < tiles.length; j++) {
                        tiles[j].addEventListener('click', function() {
                            var id = this.getAttribute('data-id');
                            var type = this.getAttribute('data-type');
                            if (id && type) {
                                Lampa.Activity.push({
                                    url: '',
                                    component: 'full_card',
                                    card: { id: id, type: type }
                                });
                            }
                        });
                    }
                }, 300);
            }
        });
    }

    // Создать кнопку меню
    function createMenuButton() {
        var btn = document.createElement('div');
        btn.id = 'kodi-menu-btn';
        btn.innerHTML = '<div class="menu-icon">📚</div><div class="menu-title">Библиотека</div>';
        btn.addEventListener('click', showLibrary);
        return btn;
    }

    // Вставить кнопку в меню и следить за перерисовкой
    function injectMenuItem() {
        // Ищем контейнер меню. Обычно это .menu или .menu__list
        var menuContainer = document.querySelector('.menu__list') || 
                            document.querySelector('.menu') || 
                            document.querySelector('[class*="menu"]');
        if (!menuContainer) {
            setTimeout(injectMenuItem, 300);
            return;
        }

        // Если кнопка уже есть — выходим
        if (document.getElementById('kodi-menu-btn')) return;

        // Добавляем
        menuContainer.appendChild(createMenuButton());

        // Наблюдатель: если меню перерисовали и кнопка пропала — вставим снова
        var observer = new MutationObserver(function() {
            if (!document.getElementById('kodi-menu-btn') && menuContainer) {
                menuContainer.appendChild(createMenuButton());
            }
        });
        observer.observe(menuContainer, { childList: true, subtree: true });
    }

    // Запуск
    waitForLampa(function() {
        addStyles();
        injectMenuItem();
    });
})();
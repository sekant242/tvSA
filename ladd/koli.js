(function() {
    'use strict';

    // Ждём готовности Lampa
    function waitForLampa(cb) {
        if (window.Lampa && Lampa.Menu && Lampa.Activity) {
            cb();
        } else {
            setTimeout(() => waitForLampa(cb), 100);
        }
    }

    // Генерируем HTML-сетку
    function buildHTML(items) {
        if (!items.length) {
            return '<div class="kodi-empty">Ваше избранное пусто. Добавьте фильмы или сериалы в избранное, чтобы они отобразились здесь.</div>';
        }
        let html = '<div class="kodi-library-grid">';
        items.forEach(item => {
            const poster = item.poster || 'https://via.placeholder.com/160x240?text=No+Image';
            const title = item.title || item.name || 'Без названия';
            html += `
                <div class="kodi-tile" data-id="${item.id}" data-type="${item.type}">
                    <img src="${poster}" />
                    <div class="kodi-tile-title">${title}</div>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }

    // Показываем библиотеку
    function showLibrary() {
        const favs = Lampa.Storage.get('bookmarks', []);
        const contentHTML = buildHTML(favs);
        Lampa.Activity.push({
            url: '',
            component: 'html',
            html: `<div class="kodi-library-container"><h2>Библиотека (Избранное)</h2>${contentHTML}</div>`,
            onCreate: function() {
                // Навешиваем клики после отрисовки
                setTimeout(() => {
                    document.querySelectorAll('.kodi-tile').forEach(tile => {
                        tile.addEventListener('click', function() {
                            const id = this.dataset.id;
                            const type = this.dataset.type;
                            if (id && type) {
                                Lampa.Activity.push({
                                    url: '',
                                    component: 'full_card',
                                    id: id,
                                    type: type
                                });
                            }
                        });
                    });
                }, 200);
            }
        });
    }

    waitForLampa(() => {
        // Внедряем стили
        const style = document.createElement('style');
        style.textContent = `
            .kodi-library-container { padding: 20px; background: #0d0d0d; min-height: 100vh; color: #fff; }
            .kodi-library-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 20px; padding: 20px 0; }
            .kodi-tile { border-radius: 8px; overflow: hidden; background: #1a1a1a; cursor: pointer; transition: transform 0.2s; }
            .kodi-tile:hover { transform: scale(1.05); }
            .kodi-tile img { width: 100%; aspect-ratio: 2/3; object-fit: cover; display: block; }
            .kodi-tile-title { padding: 10px; font-size: 14px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .kodi-empty { text-align: center; padding: 40px; color: #888; font-size: 18px; }
        `;
        document.head.appendChild(style);

        // Добавляем пункт в главное меню
        Lampa.Menu.add('main', {
            title: 'Библиотека',
            icon: 'library',
            action: showLibrary
        });
    });
})();
(function() {
    'use strict';

    function waitForLampa(cb) {
        if (window.Lampa && Lampa.Menu && Lampa.Activity && Lampa.Storage) {
            cb();
        } else {
            setTimeout(function() { waitForLampa(cb); }, 100);
        }
    }

    waitForLampa(function() {
        // Стили Kodi-библиотеки
        var style = document.createElement('style');
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

        // Главное отличие: добавляем пункт в меню через push в массив
        if (Lampa.Menu && Lampa.Menu.main && Array.isArray(Lampa.Menu.main)) {
            Lampa.Menu.main.push({
                title: 'Библиотека',
                icon: 'library',
                action: showLibrary
            });
        } else {
            console.error('Не удалось добавить пункт меню: Lampa.Menu.main не массив');
        }
    });
})();
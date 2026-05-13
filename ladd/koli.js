(function () {
    'use strict';

    function waitForLampa(callback) {
        if (window.Lampa && Lampa.Storage) {
            callback();
        } else {
            setTimeout(() => waitForLampa(callback), 100);
        }
    }

    function initPlugin() {
        // Добавляем стили
        const style = document.createElement('style');
        style.textContent = `
            .kodi-library-container {
                padding: 20px;
                background: #0d0d0d;
                min-height: 100vh;
                color: #fff;
            }
            .kodi-library-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                gap: 20px;
                padding: 20px 0;
            }
            .kodi-tile {
                border-radius: 8px;
                overflow: hidden;
                background: #1a1a1a;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                position: relative;
            }
            .kodi-tile:hover {
                transform: scale(1.05);
                box-shadow: 0 8px 20px rgba(0,0,0,0.5);
            }
            .kodi-tile img {
                width: 100%;
                aspect-ratio: 2/3;
                object-fit: cover;
                display: block;
            }
            .kodi-tile-title {
                padding: 10px;
                font-size: 14px;
                text-align: center;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .kodi-empty {
                text-align: center;
                padding: 40px;
                color: #888;
                font-size: 18px;
            }
        `;
        document.head.appendChild(style);

        // Регистрируем компонент "Библиотека"
        if (typeof Lampa.Component !== 'undefined') {
            Lampa.Component.add('kodi_library', {
                template: `
                    <div class="kodi-library-container">
                        <h2 style="margin: 0 0 10px 0;">Библиотека (Избранное)</h2>
                        <div class="kodi-library-grid" v-if="items.length">
                            <div class="kodi-tile" v-for="item in items" @click="open(item)">
                                <img :src="item.poster || 'https://via.placeholder.com/160x240?text=No+Image'" />
                                <div class="kodi-tile-title">{{ item.title || item.name }}</div>
                            </div>
                        </div>
                        <div class="kodi-empty" v-else>
                            Ваше избранное пусто. Добавьте фильмы или сериалы в избранное, чтобы они отобразились здесь.
                        </div>
                    </div>
                `,
                data() {
                    return {
                        items: []
                    };
                },
                mounted() {
                    this.loadFavorites();
                },
                methods: {
                    loadFavorites() {
                        // Избранное в Lampa хранится в объекте bookmarks
                        const favs = Lampa.Storage.get('bookmarks', []);
                        this.items = favs.filter(item => item.poster).map(item => ({
                            ...item,
                            title: item.title || item.name || 'Без названия',
                            poster: item.poster || ''
                        }));
                    },
                    open(item) {
                        // Открываем карточку фильма/сериала
                        if (item.id && item.type) {
                            // Используем Lampa API для открытия карточки
                            Lampa.Activity.push({
                                url: '',
                                component: 'full_card',
                                id: item.id,
                                type: item.type
                            });
                        }
                    }
                }
            });
        }

        // Добавляем пункт в главное меню
        if (typeof Lampa.Menu !== 'undefined') {
            Lampa.Menu.add('main', {
                title: 'Библиотека',
                icon: 'library',
                action: () => {
                    Lampa.Activity.push({
                        url: '',
                        component: 'kodi_library',
                        title: 'Библиотека'
                    });
                }
            });
        }
    }

    waitForLampa(initPlugin);
})();
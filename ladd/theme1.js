// Улучшенный код плагина theme1.js для Lampa
// Автор: sekant242, доработан с учетом предложений

(function() {
    'use strict';

    const PLUGIN_NAME = 'theme1';
    const CACHE_KEY = 'theme1_cache';
    const CACHE_DURATION = 30 * 60 * 1000; // 30 минут кэширования
    const POSTER_BASE = 'https://image.tmdb.org/t/p/';
    const POSTER_SIZE_SMALL = 'w300';
    const POSTER_SIZE_LARGE = 'w1280';
    const POSTER_SIZE_LOGO = 'w300'; // для логотипов

    // Утилита: получение доминирующего цвета из изображения
    function getDominantColor(imageUrl, callback) {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0, 1, 1);
            const pixel = ctx.getImageData(0, 0, 1, 1).data;
            const [r, g, b] = pixel;
            // Возвращаем rgba
            callback(`rgba(${r},${g},${b},0.85)`);
        };
        img.onerror = function() {
            // Fallback: полупрозрачный черный
            callback('rgba(0,0,0,0.6)');
        };
        img.src = imageUrl;
    }

    // Кэширование данных
    function getCachedData() {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    return data;
                }
            }
        } catch (e) {}
        return null;
    }

    function setCachedData(data) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                data: data,
                timestamp: Date.now()
            }));
        } catch (e) {}
    }

    // Класс плагина
    class Theme1Plugin {
        constructor() {
            this.name = PLUGIN_NAME;
            this.container = null;
            this.data = [];
            this.activeIndex = 0;
            this.bgElement = null;
            this.listElement = null;
            this.logoElement = null;
            this.loading = true;
            this.error = null;
            this._handlers = [];
            this._controller = null;
            this.dominantColors = {}; // кэш доминирующих цветов
        }

        init() {
            Lampa.Component.add('theme1', {
                template: `<div class="theme1-container"></div>`,
                onCreate: () => {
                    this.container = document.querySelector('.theme1-container');
                    this.render();
                    this.loadData();
                },
                onStart: () => {
                    this.bindController();
                    this.focusActive();
                },
                onDestroy: () => {
                    this.destroy();
                }
            });

            // Регистрация в контроллере Lampa
            Lampa.Controller.add('theme1', {
                toggle: () => {
                    this.toggle();
                },
                left: () => {
                    this.moveLeft();
                },
                right: () => {
                    this.moveRight();
                },
                enter: () => {
                    this.openItem();
                },
                back: () => {
                    Lampa.Controller.toggle('menu');
                }
            });

            // Показать плагин
            Lampa.Controller.toggle('theme1');
        }

        render() {
            if (!this.container) return;

            this.container.innerHTML = `
                <div class="theme1-background"></div>
                <div class="theme1-header">
                    <div class="theme1-logo"></div>
                </div>
                <div class="theme1-list-wrapper">
                    <div class="theme1-list"></div>
                </div>
                <div class="theme1-loading">Загрузка...</div>
                <div class="theme1-error" style="display:none;">
                    <div class="theme1-error-message"></div>
                    <button class="theme1-retry-button">Повторить</button>
                </div>
            `;

            this.bgElement = this.container.querySelector('.theme1-background');
            this.listElement = this.container.querySelector('.theme1-list');
            this.logoElement = this.container.querySelector('.theme1-logo');
            this.loadingEl = this.container.querySelector('.theme1-loading');
            this.errorEl = this.container.querySelector('.theme1-error');
            this.errorMsg = this.container.querySelector('.theme1-error-message');
            this.retryButton = this.container.querySelector('.theme1-retry-button');

            // Кнопка повтора
            this.retryButton.addEventListener('click', () => {
                this.loadData();
            });

            // Применение стилей (поддержка темы из Lampa)
            const isDark = Lampa.Storage.get('theme', 'dark') === 'dark';
            this.applyTheme(isDark);
        }

        applyTheme(isDark) {
            const styleId = 'theme1-styles';
            let styleEl = document.getElementById(styleId);
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = styleId;
                document.head.appendChild(styleEl);
            }
            const bg = isDark ? '#0a0a0a' : '#f0f0f0';
            const text = isDark ? '#ffffff' : '#222222';
            const cardBg = isDark ? 'rgba(20,20,20,0.9)' : 'rgba(255,255,255,0.9)';
            styleEl.textContent = `
                .theme1-container {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    overflow: hidden;
                    background: ${bg};
                    color: ${text};
                    font-family: 'Roboto', sans-serif;
                    z-index: 1000;
                }
                .theme1-background {
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background-size: cover;
                    background-position: center;
                    transition: background-image 0.5s ease;
                    filter: blur(10px);
                    transform: scale(1.1);
                }
                .theme1-header {
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    z-index: 2;
                    padding: 10px 20px;
                    border-radius: 12px;
                    backdrop-filter: blur(10px);
                    background: rgba(0,0,0,0.6);
                    transition: background 0.3s;
                    max-width: 60%;
                }
                .theme1-logo img {
                    height: 60px;
                    max-width: 400px;
                    object-fit: contain;
                }
                .theme1-list-wrapper {
                    position: absolute;
                    bottom: 80px;
                    left: 0;
                    width: 100%;
                    overflow: hidden;
                    z-index: 3;
                }
                .theme1-list {
                    display: flex;
                    gap: 20px;
                    padding: 0 40px;
                    transition: transform 0.3s ease;
                    white-space: nowrap;
                }
                .theme1-card {
                    flex: 0 0 auto;
                    width: 200px;
                    height: 300px;
                    border-radius: 12px;
                    background: ${cardBg};
                    box-shadow: 0 8px 20px rgba(0,0,0,0.6);
                    overflow: hidden;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                    position: relative;
                }
                .theme1-card.active {
                    transform: scale(1.1);
                    box-shadow: 0 12px 30px rgba(255,255,255,0.3);
                    border: 2px solid #fff;
                }
                .theme1-card img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .theme1-card-title {
                    position: absolute;
                    bottom: 10px;
                    left: 10px;
                    right: 10px;
                    background: rgba(0,0,0,0.7);
                    padding: 4px 8px;
                    border-radius: 8px;
                    font-size: 14px;
                    text-align: center;
                    color: #fff;
                }
                .theme1-loading, .theme1-error {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(0,0,0,0.8);
                    padding: 20px 40px;
                    border-radius: 12px;
                    color: #fff;
                    font-size: 18px;
                    z-index: 5;
                    text-align: center;
                }
                .theme1-retry-button {
                    margin-top: 10px;
                    padding: 8px 20px;
                    border: none;
                    border-radius: 8px;
                    background: #e50914;
                    color: white;
                    font-size: 16px;
                    cursor: pointer;
                }
            `;
        }

        async loadData() {
            // Сначала пробуем кэш
            const cached = getCachedData();
            if (cached) {
                this.data = cached;
                this.loading = false;
                this.showContent();
                return;
            }

            try {
                this.loading = true;
                this.showLoading();
                // Пример API Lampa (замените на актуальный вызов)
                const response = await Lampa.Api.request({
                    url: '/api/movies/popular',
                    method: 'get'
                });
                // Предположим, response.list - массив фильмов с полями: id, title, poster_path, backdrop_path, logo_path
                this.data = response.list || [];
                if (this.data.length === 0) {
                    this.showError('Ничего не найдено');
                    return;
                }
                setCachedData(this.data);
                this.loading = false;
                this.showContent();
            } catch (err) {
                console.error('theme1 load error:', err);
                this.showError('Ошибка загрузки. Попробуйте позже.');
            }
        }

        showLoading() {
            if (this.loadingEl) this.loadingEl.style.display = 'block';
            if (this.errorEl) this.errorEl.style.display = 'none';
        }

        showError(message) {
            this.loading = false;
            if (this.loadingEl) this.loadingEl.style.display = 'none';
            if (this.errorEl) {
                this.errorEl.style.display = 'block';
                if (this.errorMsg) this.errorMsg.textContent = message;
            }
        }

        showContent() {
            if (this.loadingEl) this.loadingEl.style.display = 'none';
            if (this.errorEl) this.errorEl.style.display = 'none';
            this.renderCards();
            this.activeIndex = 0;
            this.updateActiveCard();
            this.updateBackground();
            this.updateLogo();
            this.focusActive();
        }

        renderCards() {
            if (!this.listElement) return;
            this.listElement.innerHTML = '';
            this.data.forEach((item, index) => {
                const card = document.createElement('div');
                card.className = 'theme1-card';
                card.setAttribute('data-index', index);
                const posterUrl = item.poster_path ? 
                    `${POSTER_BASE}${this.getPosterSize()}${item.poster_path}` : 
                    'placeholder.jpg';
                card.innerHTML = `
                    <img src="${posterUrl}" loading="lazy" alt="${item.title}">
                    <div class="theme1-card-title">${item.title}</div>
                `;
                card.addEventListener('click', () => {
                    this.activeIndex = index;
                    this.updateActiveCard();
                    this.updateBackground();
                    this.updateLogo();
                    this.focusActive();
                });
                this.listElement.appendChild(card);
            });
        }

        getPosterSize() {
            // Адаптивный размер для карточек в зависимости от ширины экрана
            const screenWidth = window.innerWidth;
            return screenWidth > 1920 ? 'w500' : POSTER_SIZE_SMALL;
        }

        updateActiveCard() {
            const cards = this.container.querySelectorAll('.theme1-card');
            cards.forEach((card, idx) => {
                card.classList.toggle('active', idx === this.activeIndex);
            });
            this.scrollToActive();
        }

        scrollToActive() {
            const activeCard = this.container.querySelector(`.theme1-card[data-index="${this.activeIndex}"]`);
            if (!activeCard || !this.listElement) return;
            const containerWidth = this.listElement.parentElement.clientWidth;
            const cardLeft = activeCard.offsetLeft;
            const cardWidth = activeCard.offsetWidth;
            const offset = cardLeft - (containerWidth / 2) + (cardWidth / 2);
            this.listElement.style.transform = `translateX(${-offset}px)`;
        }

        updateBackground() {
            if (!this.bgElement || !this.data[this.activeIndex]) return;
            const item = this.data[this.activeIndex];
            const bgUrl = item.backdrop_path ? 
                `${POSTER_BASE}${POSTER_SIZE_LARGE}${item.backdrop_path}` : 
                null;
            if (bgUrl) {
                this.bgElement.style.backgroundImage = `url(${bgUrl})`;
                // Динамический цвет шапки
                this.updateHeaderColor(bgUrl);
            }
        }

        updateHeaderColor(imageUrl) {
            if (!this.logoElement) return;
            if (this.dominantColors[imageUrl]) {
                document.querySelector('.theme1-header').style.background = this.dominantColors[imageUrl];
                return;
            }
            getDominantColor(imageUrl, (color) => {
                this.dominantColors[imageUrl] = color;
                const header = document.querySelector('.theme1-header');
                if (header) header.style.background = color;
            });
        }

        updateLogo() {
            if (!this.logoElement || !this.data[this.activeIndex]) return;
            const item = this.data[this.activeIndex];
            const logoPath = item.logo_path; // или item.images?.logos?.[0]?.file_path
            if (logoPath) {
                const logoUrl = `${POSTER_BASE}${POSTER_SIZE_LOGO}${logoPath}`;
                this.logoElement.innerHTML = `<img src="${logoUrl}" alt="logo">`;
            } else {
                this.logoElement.innerHTML = `<h2 style="color:white; margin:0;">${item.title}</h2>`;
            }
        }

        focusActive() {
            // Программный фокус для пульта
            if (this._controller) {
                Lampa.Controller.collect(this._controller);
            }
        }

        moveLeft() {
            if (this.data.length === 0) return;
            this.activeIndex = (this.activeIndex - 1 + this.data.length) % this.data.length;
            this.updateActiveCard();
            this.updateBackground();
            this.updateLogo();
        }

        moveRight() {
            if (this.data.length === 0) return;
            this.activeIndex = (this.activeIndex + 1) % this.data.length;
            this.updateActiveCard();
            this.updateBackground();
            this.updateLogo();
        }

        openItem() {
            const item = this.data[this.activeIndex];
            if (item) {
                Lampa.Controller.toggle('theme1'); // скрыть карусель
                // Открыть карточку фильма (зависит от Lampa)
                if (typeof Lampa.Player !== 'undefined') {
                    Lampa.Player.play(item);
                } else {
                    Lampa.Navigation.push({ url: `/movie/${item.id}` });
                }
            }
        }

        bindController() {
            // Корректное сохранение ссылок на обработчики
            this._handlers = [
                { event: 'left', handler: () => this.moveLeft() },
                { event: 'right', handler: () => this.moveRight() },
                { event: 'enter', handler: () => this.openItem() },
                { event: 'back', handler: () => Lampa.Controller.toggle('menu') }
            ];
            this._handlers.forEach(({ event, handler }) => {
                Lampa.Controller.add(event, handler, PLUGIN_NAME);
            });
        }

        unbindController() {
            // Удаляем только свои обработчики
            this._handlers.forEach(({ event, handler }) => {
                Lampa.Controller.remove(event, handler);
            });
            this._handlers = [];
        }

        destroy() {
            this.unbindController();
            if (this.container) {
                this.container.remove();
                this.container = null;
            }
            // Очистка кэша доминирующих цветов
            this.dominantColors = {};
        }

        toggle() {
            // Метод для показа/скрытия
            if (!this.container) {
                this.render();
                this.loadData();
            }
        }
    }

    // Запуск плагина
    const plugin = new Theme1Plugin();
    Lampa.Plugins.register(plugin);
    plugin.init();

})();
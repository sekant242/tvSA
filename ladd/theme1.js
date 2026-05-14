// Улучшенная тема для Lampa — Hero-карусель
// Основные улучшения:
// 1. Кэширование данных и изображений
// 2. Обработка ошибок с кнопкой «Повторить»
// 3. Динамический цвет шапки на основе постера
// 4. Выбор разрешения постера под экран
// 5. Поддержка системной темы Lampa (светлая/тёмная)
// 6. Безопасное удаление обработчиков в destroy()

(function () {
    'use strict';

    // ---------- Конфигурация ----------
    const CACHE_KEY = 'theme1_hero_cache';
    const CACHE_TTL = 30 * 60 * 1000; // 30 минут
    const API_URL = '/api/v2/list?type=movie&sort=rating&limit=10'; // пример

    // ---------- Вспомогательные функции ----------

    // Загрузка данных с кэшированием
    async function fetchData() {
        // Проверяем кэш
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_TTL) {
                    return data;
                }
            } catch (e) {}
        }

        // Запрашиваем с сервера
        const response = await Lampa.Api.request(API_URL);
        const movies = response.results || response.items || [];
        
        // Сохраняем в кэш
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: movies,
            timestamp: Date.now()
        }));
        
        return movies;
    }

    // Определение оптимального размера постера
    function getPosterSize() {
        const width = window.innerWidth;
        if (width >= 1280) return 'w780';
        if (width >= 800) return 'w500';
        return 'w342';
    }

    // Получение доминирующего цвета изображения
    function getDominantColor(imgElement) {
        return new Promise((resolve) => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 1;
                canvas.height = 1;
                ctx.drawImage(imgElement, 0, 0, 1, 1);
                const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
                resolve(`rgba(${r},${g},${b},0.7)`);
            } catch (e) {
                resolve('rgba(0,0,0,0.6)'); // запасной цвет
            }
        });
    }

    // ---------- Основной класс плагина ----------
    class HeroTheme {
        constructor() {
            this.container = null;
            this.movies = [];
            this.currentIndex = 0;
            this.active = false;
            this.handlers = []; // для хранения ссылок на обработчики
        }

        // Инициализация
        async start() {
            this.container = document.createElement('div');
            this.container.className = 'hero-theme';
            
            // Загружаем данные
            try {
                this.movies = await fetchData();
            } catch (error) {
                this.showError(error);
                return;
            }

            if (!this.movies.length) {
                this.showEmpty();
                return;
            }

            this.buildUI();
            this.activate();
        }

        // Построение интерфейса
        buildUI() {
            const { container } = this;
            const theme = Lampa.Storage.get('theme', 'dark'); // поддержка тем
            container.innerHTML = `
                <div class="hero-background"></div>
                <div class="hero-header">
                    <div class="hero-logo"></div>
                    <div class="hero-info">
                        <h2 class="hero-title"></h2>
                        <p class="hero-description"></p>
                    </div>
                </div>
                <div class="hero-carousel"></div>
                <div class="hero-error" style="display:none">
                    <span class="error-message"></span>
                    <button class="retry-button">Повторить</button>
                </div>
            `;
            container.classList.add(`theme-${theme}`); // применяем тему
            
            this.carousel = container.querySelector('.hero-carousel');
            this.background = container.querySelector('.hero-background');
            this.logo = container.querySelector('.hero-logo');
            this.title = container.querySelector('.hero-title');
            this.description = container.querySelector('.hero-description');
            this.errorBlock = container.querySelector('.hero-error');
            this.errorMessage = container.querySelector('.error-message');
            this.retryButton = container.querySelector('.retry-button');

            // Строим карусель
            this.movies.forEach((movie, index) => {
                const card = document.createElement('div');
                card.className = 'hero-card';
                card.setAttribute('data-index', index);
                card.innerHTML = `<img src="${this.getPosterUrl(movie)}" alt="">`;
                card.addEventListener('click', () => this.selectMovie(index));
                this.carousel.appendChild(card);
            });

            // Кнопка повтора при ошибке
            this.retryButton.addEventListener('click', () => {
                this.destroy();
                this.start();
            });

            // Навигация с пульта
            this.bindNavigation();
            
            // Первый фильм
            this.updateHero(0);
        }

        getPosterUrl(movie) {
            const base = 'https://image.tmdb.org/t/p/';
            const size = getPosterSize();
            return movie.poster_path ? base + size + movie.poster_path : '';
        }

        // Привязка навигации (D-pad)
        bindNavigation() {
            const onLeft = () => {
                if (this.currentIndex > 0) this.updateHero(this.currentIndex - 1);
            };
            const onRight = () => {
                if (this.currentIndex < this.movies.length - 1) this.updateHero(this.currentIndex + 1);
            };
            const onEnter = () => {
                this.openMovie(this.movies[this.currentIndex]);
            };

            Lampa.Controller.add('left', onLeft);
            Lampa.Controller.add('right', onRight);
            Lampa.Controller.add('enter', onEnter);

            // Сохраняем для удаления
            this.handlers.push({ key: 'left', fn: onLeft });
            this.handlers.push({ key: 'right', fn: onRight });
            this.handlers.push({ key: 'enter', fn: onEnter });
        }

        // Обновление активного элемента
        async updateHero(index) {
            this.currentIndex = index;
            const movie = this.movies[index];
            if (!movie) return;

            // Подсветка карточки
            const cards = this.carousel.querySelectorAll('.hero-card');
            cards.forEach((card, i) => card.classList.toggle('active', i === index));
            
            // Скролл к активной карточке
            const activeCard = cards[index];
            if (activeCard) {
                activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }

            // Загрузка постера для фона и определение цвета
            const posterSize = getPosterSize();
            const posterUrl = movie.backdrop_path || movie.poster_path 
                ? `https://image.tmdb.org/t/p/original${movie.backdrop_path || movie.poster_path}`
                : '';
            
            if (posterUrl) {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.src = posterUrl;
                img.onload = async () => {
                    this.background.style.backgroundImage = `url(${posterUrl})`;
                    // Динамический цвет шапки
                    const color = await getDominantColor(img);
                    document.querySelector('.hero-header')?.style.setProperty('background', color);
                };
            }

            // Логотип (если есть)
            if (movie.logo_path) {
                this.logo.innerHTML = `<img src="https://image.tmdb.org/t/p/w500${movie.logo_path}" alt="">`;
            } else {
                this.logo.textContent = '';
            }

            this.title.textContent = movie.title || movie.name || '';
            this.description.textContent = movie.overview || '';
        }

        selectMovie(index) {
            this.updateHero(index);
        }

        openMovie(movie) {
            // Открытие карточки фильма (зависит от реализации Lampa)
            if (movie.id) {
                Lampa.Activity.push({
                    url: '',
                    component: 'full',
                    id: movie.id,
                    type: 'movie'
                });
            }
        }

        // Обработка ошибок
        showError(error) {
            this.errorBlock.style.display = 'flex';
            this.errorMessage.textContent = `Ошибка загрузки: ${error.message || 'неизвестная ошибка'}`;
            console.error('HeroTheme error:', error);
        }

        showEmpty() {
            this.errorBlock.style.display = 'flex';
            this.errorMessage.textContent = 'Ничего не найдено';
            this.retryButton.style.display = 'none';
        }

        // Активация плагина
        activate() {
            const root = document.querySelector('.main__content') || document.body;
            root.prepend(this.container);
            this.active = true;
        }

        // Безопасное удаление
        destroy() {
            // Удаляем свои обработчики навигации
            this.handlers.forEach(h => {
                Lampa.Controller.remove(h.key, h.fn);
            });
            this.handlers = [];

            // Очищаем контейнер
            if (this.container && this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }
            
            Lampa.Controller.clear(); // на всякий случай
            this.active = false;
        }
    }

    // ---------- Регистрация плагина в Lampa ----------
    if (window.Lampa) {
        Lampa.Plugin.register({
            name: 'Улучшенная Hero-тема',
            description: 'Главный экран с каруселью, динамическим цветом и кэшированием',
            version: '2.0',
            start: function () {
                this.theme = new HeroTheme();
                this.theme.start();
            },
            stop: function () {
                if (this.theme) {
                    this.theme.destroy();
                    this.theme = null;
                }
            }
        });
    }

})();
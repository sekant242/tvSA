// Плагин: Главная карусель с крупной карточкой и уменьшающимися карточками внизу
// Для Lampa (app.min.js)
(function() {
    'use strict';

    // Ждём готовности приложения
    Lampa.Listener.follow('app', function(e) {
        if (e.type === 'ready') {
            initHeroCarousel();
        }
    });

    function initHeroCarousel() {
        // 1. Подменяем компонент 'main' на свой
        var OriginalMainComponent = Lampa.Component.get('main');
        Lampa.Component.add('main', HeroMainComponent);

        // 2. Добавляем стили
        var style = document.createElement('style');
        style.textContent = `
            /* Общий контейнер карусели */
            .hero-carousel-container {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                background: #0a0a0c;
                overflow: hidden;
            }
            /* Верхняя крупная карточка */
            .hero-card {
                flex: 2;
                position: relative;
                background-size: cover;
                background-position: center 30%;
                transition: all 0.3s ease;
                border-radius: 0 0 24px 24px;
                overflow: hidden;
                box-shadow: 0 8px 30px rgba(0,0,0,0.5);
                margin: 0 10px 10px 10px;
            }
            .hero-card__overlay {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.3), transparent);
                padding: 30px 20px 20px;
                color: white;
            }
            .hero-card__title {
                font-size: 2rem;
                font-weight: bold;
                margin-bottom: 8px;
                text-shadow: 0 2px 4px black;
            }
            .hero-card__info {
                font-size: 0.9rem;
                opacity: 0.9;
                display: flex;
                gap: 15px;
                flex-wrap: wrap;
                margin-bottom: 10px;
            }
            .hero-card__overview {
                font-size: 0.85rem;
                max-width: 70%;
                line-height: 1.4;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                margin-bottom: 12px;
            }
            .hero-card__meta {
                font-size: 0.8rem;
                opacity: 0.7;
            }
            .hero-card__button {
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.4);
                padding: 8px 20px;
                border-radius: 30px;
                display: inline-block;
                margin-top: 10px;
                cursor: pointer;
                transition: 0.2s;
            }
            .hero-card__button:hover {
                background: rgba(255,255,255,0.4);
            }
            /* Нижняя карусель */
            .carousel-strip {
                flex: 1;
                padding: 15px 0;
                overflow-x: auto;
                overflow-y: hidden;
                scrollbar-width: thin;
                position: relative;
            }
            .carousel-strip__inner {
                display: flex;
                gap: 12px;
                padding: 0 20px;
                align-items: center;
                height: 100%;
            }
            .strip-card {
                flex-shrink: 0;
                width: 140px;
                transition: all 0.2s ease;
                cursor: pointer;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                transform-origin: center;
            }
            .strip-card__poster {
                width: 100%;
                aspect-ratio: 2 / 3;
                object-fit: cover;
                display: block;
            }
            /* Выбранная карточка в карусели увеличивается */
            .strip-card.selected {
                transform: scale(1.5);
                margin: 0 20px;
                z-index: 2;
                box-shadow: 0 8px 25px rgba(0,0,0,0.5);
            }
            /* Соседние карточки слегка уменьшены, но это уже плавно */
            .strip-card:not(.selected) {
                filter: brightness(0.7);
                transform: scale(0.85);
            }
            /* Адаптив */
            @media (max-width: 768px) {
                .hero-card__title { font-size: 1.2rem; }
                .hero-card__overview { max-width: 100%; font-size: 0.75rem; }
                .strip-card { width: 100px; }
                .strip-card.selected { transform: scale(1.4); margin: 0 15px; }
                .hero-card__info { font-size: 0.7rem; }
            }
        `;
        document.head.appendChild(style);
    }

    // Компонент главной страницы-карусели
    function HeroMainComponent(object) {
        var self = this;
        this.object = object;
        this.activity = null; // будет установлено Activity
        this.data = null; // данные всех строк (после загрузки)
        this.currentIndex = 0;
        this.allItems = []; // плоский массив всех карточек со всех строк
        this.html = document.createElement('div');
        this.html.className = 'hero-carousel-container';

        // Создаём DOM элементы
        this.heroDiv = document.createElement('div');
        this.heroDiv.className = 'hero-card';
        this.carouselDiv = document.createElement('div');
        this.carouselDiv.className = 'carousel-strip';
        this.carouselInner = document.createElement('div');
        this.carouselInner.className = 'carousel-strip__inner';
        this.carouselDiv.appendChild(this.carouselInner);
        this.html.appendChild(this.heroDiv);
        this.html.appendChild(this.carouselDiv);

        // Метод загрузки данных (через оригинальный API)
        this.loadData = function() {
            var self = this;
            this.activity.loader(true);
            // Используем оригинальный метод Api.main для получения данных
            Lampa.Api.main(this.object, function(linesData) {
                // linesData - массив объектов строк с полем results
                self.allItems = [];
                linesData.forEach(function(line) {
                    if (line.results && line.results.length) {
                        self.allItems = self.allItems.concat(line.results);
                    }
                });
                if (self.allItems.length === 0) {
                    self.showEmpty();
                    return;
                }
                self.currentIndex = 0;
                self.renderHero(self.allItems[0]);
                self.renderCarousel();
                self.activity.loader(false);
                self.activity.toggle();
            }, function(err) {
                self.activity.loader(false);
                self.showEmpty();
            });
        };

        this.renderHero = function(item) {
            // Очищаем и заполняем heroDiv
            this.heroDiv.style.backgroundImage = 'url(' + Lampa.Api.img(item.poster_path || item.img, 'w500') + ')';
            this.heroDiv.innerHTML = ''; // чистим
            var overlay = document.createElement('div');
            overlay.className = 'hero-card__overlay';
            overlay.innerHTML = `
                <div class="hero-card__title">${item.title || item.name || ''}</div>
                <div class="hero-card__info">
                    <span>${item.release_date ? item.release_date.slice(0,4) : (item.first_air_date ? item.first_air_date.slice(0,4) : '')}</span>
                    <span>⭐ ${(item.vote_average || 0).toFixed(1)}</span>
                    <span>🎬 ${item.original_language?.toUpperCase() || ''}</span>
                </div>
                <div class="hero-card__overview">${(item.overview || 'Нет описания').slice(0, 200)}${item.overview?.length > 200 ? '...' : ''}</div>
                <div class="hero-card__meta">
                    <span>Актёры: загрузка...</span>
                </div>
                <div class="hero-card__button selector">Смотреть</div>
            `;
            this.heroDiv.appendChild(overlay);
            // Загружаем актёров для карточки (необязательно, но эффектно)
            this.loadCast(item);
        };

        this.loadCast = function(item) {
            if (!item.id) return;
            var method = item.name ? 'tv' : 'movie';
            Lampa.TMDB.get(method + '/' + item.id + '/credits', {}, function(credits) {
                var actors = credits.cast.slice(0, 3).map(a => a.name).join(', ');
                var director = credits.crew.find(c => c.job === 'Director')?.name || '';
                var metaDiv = this.heroDiv.querySelector('.hero-card__meta');
                if (metaDiv) {
                    metaDiv.innerHTML = `<span>Режиссёр: ${director}</span> | <span>В ролях: ${actors || '—'}</span>`;
                }
            }.bind(this), function() {});
        };

        this.renderCarousel = function() {
            this.carouselInner.innerHTML = '';
            var self = this;
            this.allItems.forEach(function(item, idx) {
                var card = document.createElement('div');
                card.className = 'strip-card' + (idx === self.currentIndex ? ' selected' : '');
                var img = document.createElement('img');
                img.className = 'strip-card__poster';
                img.src = Lampa.Api.img(item.poster_path || item.img, 'w200');
                img.onerror = function() { img.src = './img/img_broken.svg'; };
                card.appendChild(img);
                card.addEventListener('click', function(e) {
                    e.stopPropagation();
                    self.setCurrentIndex(idx);
                });
                // Для навигации с пульта добавим обработку hover:enter
                card.setAttribute('data-index', idx);
                card.classList.add('selector');
                card.on('hover:enter', function() {
                    self.setCurrentIndex(idx);
                });
                self.carouselInner.appendChild(card);
            });
        };

        this.setCurrentIndex = function(newIndex) {
            if (newIndex === this.currentIndex) return;
            this.currentIndex = newIndex;
            this.renderHero(this.allItems[newIndex]);
            // Обновляем выделение в карусели
            var cards = this.carouselInner.querySelectorAll('.strip-card');
            cards.forEach(function(card, i) {
                if (i === newIndex) card.classList.add('selected');
                else card.classList.remove('selected');
            });
            // Прокручиваем карусель, чтобы выбранная карточка была в центре
            var selectedCard = cards[newIndex];
            if (selectedCard) {
                selectedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        };

        this.showEmpty = function() {
            var empty = new Lampa.Empty({ title: 'Ничего не найдено', descr: 'Попробуйте позже' });
            this.html.innerHTML = '';
            this.html.appendChild(empty.render(true));
            empty.start();
            this.activity.loader(false);
            this.activity.toggle();
        };

        this.start = function() {
            // Запускаем загрузку данных
            this.loadData();
            // Добавляем контроллер для навигации (стрелки влево-вправо по карусели)
            var self = this;
            Lampa.Controller.add('hero_carousel', {
                toggle: function() {
                    Lampa.Controller.collectionSet(self.carouselInner);
                    var selected = self.carouselInner.querySelector('.strip-card.selected');
                    Lampa.Controller.collectionFocus(selected, self.carouselInner);
                },
                right: function() {
                    if (self.currentIndex < self.allItems.length - 1) {
                        self.setCurrentIndex(self.currentIndex + 1);
                    }
                },
                left: function() {
                    if (self.currentIndex > 0) {
                        self.setCurrentIndex(self.currentIndex - 1);
                    }
                },
                up: function() {
                    Lampa.Controller.toggle('head');
                },
                down: function() {
                    // ничего, уже в карусели
                },
                enter: function() {
                    // Открыть полную карточку выбранного фильма
                    var item = self.allItems[self.currentIndex];
                    Lampa.Activity.push({
                        url: '',
                        component: 'full',
                        id: item.id,
                        method: item.name ? 'tv' : 'movie',
                        card: item,
                        source: item.source || 'tmdb'
                    });
                },
                back: function() {
                    Lampa.Activity.backward();
                }
            });
            Lampa.Controller.toggle('hero_carousel');
        };

        this.pause = function() {};
        this.stop = function() {};
        this.destroy = function() {
            this.html.remove();
            Lampa.Controller.clear();
        };
        this.render = function(js) {
            return js ? this.html : $(this.html);
        };
    }

    // Передаём в Component, чтобы Activity могла создать экземпляр
    Lampa.Component.add('main', HeroMainComponent);
})();
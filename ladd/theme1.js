// Плагин: Hero-карусель для главной страницы Lampa
(function() {
    'use strict';

    // Класс компонента, наследующий от Lampa.Emit (как требуется в Lampa)
    var HeroMainComponent = function(object) {
        // Инициализация
        Lampa.Emit.call(this);
        this.object = object || {};
        this.params = object.params || {};
        this.allItems = [];      // все карточки (объединённые из всех строк)
        this.currentIndex = 0;
        this.html = null;
        this.heroDiv = null;
        this.carouselDiv = null;
        this.carouselInner = null;
        this.activity = null;    // будет установлено ActivitySlide
    };
    // Наследование от Lampa.Emit
    HeroMainComponent.prototype = Object.create(Lampa.Emit.prototype);
    HeroMainComponent.prototype.constructor = HeroMainComponent;

    // Методы, обязательные для компонента Lampa
    HeroMainComponent.prototype.create = function() {
        var self = this;
        // Создаём DOM-структуру
        this.html = document.createElement('div');
        this.html.className = 'hero-carousel-container';
        this.heroDiv = document.createElement('div');
        this.heroDiv.className = 'hero-card';
        this.carouselDiv = document.createElement('div');
        this.carouselDiv.className = 'carousel-strip';
        this.carouselInner = document.createElement('div');
        this.carouselInner.className = 'carousel-strip__inner';
        this.carouselDiv.appendChild(this.carouselInner);
        this.html.appendChild(this.heroDiv);
        this.html.appendChild(this.carouselDiv);

        // Загружаем данные
        this.loadData();
        this.emit('create');
    };

    HeroMainComponent.prototype.loadData = function() {
        var self = this;
        if (this.activity) this.activity.loader(true);
        // Используем стандартный API Lampa для получения главной страницы
        Lampa.Api.main(this.object, function(lines) {
            // lines – массив строк (каждая с полем results)
            self.allItems = [];
            lines.forEach(function(line) {
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
            if (self.activity) self.activity.loader(false);
            self.emit('build');
        }, function(err) {
            if (self.activity) self.activity.loader(false);
            self.showEmpty();
        });
    };

    HeroMainComponent.prototype.renderHero = function(item) {
        if (!this.heroDiv) return;
        var posterUrl = Lampa.Api.img(item.poster_path || item.img, 'w500');
        this.heroDiv.style.backgroundImage = 'url(' + posterUrl + ')';
        this.heroDiv.innerHTML = '';
        var overlay = document.createElement('div');
        overlay.className = 'hero-card__overlay';
        var title = item.title || item.name || '';
        var year = (item.release_date || item.first_air_date || '').slice(0,4);
        var rating = (item.vote_average || 0).toFixed(1);
        var lang = (item.original_language || '').toUpperCase();
        var overview = (item.overview || 'Нет описания').slice(0, 200);
        if (item.overview && item.overview.length > 200) overview += '...';
        overlay.innerHTML = `
            <div class="hero-card__title">${title}</div>
            <div class="hero-card__info">
                <span>${year}</span>
                <span>⭐ ${rating}</span>
                <span>🎬 ${lang}</span>
            </div>
            <div class="hero-card__overview">${overview}</div>
            <div class="hero-card__meta">Актёры и режиссёр загружаются...</div>
            <div class="hero-card__button selector">Смотреть</div>
        `;
        this.heroDiv.appendChild(overlay);
        // Загружаем актёров и режиссёра
        this.loadCast(item);
        // Обработчик кнопки "Смотреть"
        var watchBtn = overlay.querySelector('.hero-card__button');
        if (watchBtn) {
            watchBtn.on('hover:enter', function() {
                Lampa.Activity.push({
                    url: '',
                    component: 'full',
                    id: item.id,
                    method: item.name ? 'tv' : 'movie',
                    card: item,
                    source: item.source || 'tmdb'
                });
            });
        }
    };

    HeroMainComponent.prototype.loadCast = function(item) {
        if (!item.id) return;
        var method = item.name ? 'tv' : 'movie';
        Lampa.TMDB.get(method + '/' + item.id + '/credits', {}, function(credits) {
            var actors = credits.cast.slice(0, 3).map(a => a.name).join(', ');
            var director = (credits.crew.find(c => c.job === 'Director') || {}).name || '';
            var metaDiv = this.heroDiv?.querySelector('.hero-card__meta');
            if (metaDiv) {
                metaDiv.innerHTML = `<span>Режиссёр: ${director}</span> | <span>В ролях: ${actors || '—'}</span>`;
            }
        }.bind(this), function() {});
    };

    HeroMainComponent.prototype.renderCarousel = function() {
        if (!this.carouselInner) return;
        this.carouselInner.innerHTML = '';
        var self = this;
        this.allItems.forEach(function(item, idx) {
            var card = document.createElement('div');
            card.className = 'strip-card' + (idx === self.currentIndex ? ' selected' : '');
            card.setAttribute('data-index', idx);
            card.classList.add('selector');
            var img = document.createElement('img');
            img.className = 'strip-card__poster';
            img.src = Lampa.Api.img(item.poster_path || item.img, 'w200');
            img.onerror = function() { img.src = './img/img_broken.svg'; };
            card.appendChild(img);
            // Обработка выбора (пульт или мышь)
            card.on('hover:enter', function() {
                self.setCurrentIndex(idx);
            });
            this.carouselInner.appendChild(card);
        }.bind(this));
    };

    HeroMainComponent.prototype.setCurrentIndex = function(newIndex) {
        if (newIndex === this.currentIndex) return;
        this.currentIndex = newIndex;
        this.renderHero(this.allItems[newIndex]);
        // Обновить классы selected
        var cards = this.carouselInner.querySelectorAll('.strip-card');
        cards.forEach(function(card, i) {
            if (i === newIndex) card.classList.add('selected');
            else card.classList.remove('selected');
        });
        // Прокрутка карусели, чтобы выбранная карточка была в центре
        var selectedCard = cards[newIndex];
        if (selectedCard) {
            selectedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    };

    HeroMainComponent.prototype.showEmpty = function() {
        var empty = new Lampa.Empty({ title: 'Ничего не найдено', descr: 'Попробуйте позже' });
        if (this.html) {
            this.html.innerHTML = '';
            this.html.appendChild(empty.render(true));
        }
        if (this.activity) this.activity.loader(false);
        empty.start();
    };

    // Обязательные методы жизненного цикла
    HeroMainComponent.prototype.start = function() {
        var self = this;
        // Регистрируем контроллер для навигации по карусели
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
            enter: function() {
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
        this.emit('start');
    };

    HeroMainComponent.prototype.pause = function() {};
    HeroMainComponent.prototype.stop = function() {};
    HeroMainComponent.prototype.destroy = function() {
        if (this.html) this.html.remove();
        Lampa.Controller.clear();
        this.emit('destroy');
    };
    HeroMainComponent.prototype.render = function(js) {
        return js ? this.html : $(this.html);
    };

    // Добавляем стили (вставляются один раз)
    function addStyles() {
        if (document.getElementById('hero-carousel-styles')) return;
        var style = document.createElement('style');
        style.id = 'hero-carousel-styles';
        style.textContent = `
            .hero-carousel-container {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                background: #0a0a0c;
                overflow: hidden;
            }
            .hero-card {
                flex: 2;
                position: relative;
                background-size: cover;
                background-position: center 30%;
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
            .carousel-strip {
                flex: 1;
                padding: 15px 0;
                overflow-x: auto;
                overflow-y: hidden;
                scrollbar-width: thin;
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
            .strip-card.selected {
                transform: scale(1.5);
                margin: 0 20px;
                z-index: 2;
                box-shadow: 0 8px 25px rgba(0,0,0,0.5);
            }
            .strip-card:not(.selected) {
                filter: brightness(0.7);
                transform: scale(0.85);
            }
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

    // Замена компонента main
    function replaceMainComponent() {
        if (Lampa.Component.get('main') === HeroMainComponent) return;
        Lampa.Component.add('main', HeroMainComponent);
        console.log('HeroCarousel: компонент main заменён');
    }

    // Инициализация плагина
    Lampa.Listener.follow('app', function(e) {
        if (e.type === 'ready') {
            addStyles();
            replaceMainComponent();
        }
    });
})();
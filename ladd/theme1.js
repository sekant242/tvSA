// Плагин: Hero-карусель для Lampa (ТВ/мобильная версия с адаптивной шапкой)
(function() {
    'use strict';

    var HeroMainComponent = function(object) {
        Lampa.Emit.call(this);
        this.object = object || {};
        this.params = object.params || {};
        this.allItems = [];
        this.currentIndex = 0;
        this.currentFocus = 'hero'; // 'hero' или 'carousel'
        this.html = null;
        this.heroDiv = null;
        this.carouselDiv = null;
        this.carouselInner = null;
        this.activity = null;
        this.lastBgColor = '#000000';
    };
    HeroMainComponent.prototype = Object.create(Lampa.Emit.prototype);
    HeroMainComponent.prototype.constructor = HeroMainComponent;

    HeroMainComponent.prototype.create = function() {
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
        this.loadData();
        this.emit('create');
    };

    HeroMainComponent.prototype.loadData = function() {
        var self = this;
        if (this.activity) this.activity.loader(true);
        Lampa.Api.main(this.object, function(lines) {
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
        var backUrl = Lampa.Api.img(item.backdrop_path || item.poster_path || item.img, 'w1280');
        this.heroDiv.style.backgroundImage = 'url(' + backUrl + ')';
        this.heroDiv.innerHTML = '';
        var overlay = document.createElement('div');
        overlay.className = 'hero-card__overlay';

        // Логотип или заголовок
        var logoHtml = '';
        if (item.logo_path) {
            logoHtml = `<img class="hero-card__logo" src="${Lampa.Api.img(item.logo_path, 'w500')}" alt="${item.title || item.name}">`;
        } else {
            logoHtml = `<div class="hero-card__title">${item.title || item.name || ''}</div>`;
        }

        var year = (item.release_date || item.first_air_date || '').slice(0,4);
        var rating = (item.vote_average || 0).toFixed(1);
        var overview = (item.overview || 'Нет описания').slice(0, 200);
        if (item.overview && item.overview.length > 200) overview += '...';
        overlay.innerHTML = `
            ${logoHtml}
            <div class="hero-card__info">
                <span>${year}</span>
                <span>⭐ ${rating}</span>
            </div>
            <div class="hero-card__overview">${overview}</div>
            <div class="hero-card__meta">Загрузка актёров...</div>
            <div class="hero-card__button selector">Смотреть</div>
        `;
        this.heroDiv.appendChild(overlay);
        this.loadCast(item);
        this.updateHeaderColor(backUrl);
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
        this.fetchLogo(item);
    };

    HeroMainComponent.prototype.updateHeaderColor = function(imageUrl) {
        var self = this;
        // Создаём временное изображение для анализа цвета
        var img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = function() {
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, img.width, img.height);
            var data = ctx.getImageData(0, 0, img.width, img.height).data;
            var r = 0, g = 0, b = 0, count = 0;
            for (var i = 0; i < data.length; i += 10) {
                r += data[i];
                g += data[i+1];
                b += data[i+2];
                count++;
            }
            r = Math.floor(r / count);
            g = Math.floor(g / count);
            b = Math.floor(b / count);
            var color = `rgb(${r}, ${g}, ${b})`;
            document.documentElement.style.setProperty('--hero-header-bg', color);
            self.lastBgColor = color;
        };
        img.src = imageUrl;
    };

    HeroMainComponent.prototype.fetchLogo = function(item) {
        if (item.logo_path) return;
        var source = item.source || 'tmdb';
        var api = Lampa.Api.sources[source];
        if (!api || !api.get) return;
        var method = item.name ? 'tv' : 'movie';
        api.get(method + '/' + item.id + '/images', {}, function(images) {
            var logos = (images.logos || []).filter(l => l.iso_639_1 === 'en' || l.iso_639_1 === 'ru');
            if (logos.length) {
                item.logo_path = logos[0].file_path;
                this.renderHero(item);
            }
        }.bind(this), function() {});
    };

    HeroMainComponent.prototype.loadCast = function(item) {
        if (!item.id) return;
        var source = item.source || 'tmdb';
        var api = Lampa.Api.sources[source];
        if (!api || !api.get) return;
        var method = item.name ? 'tv' : 'movie';
        api.get(method + '/' + item.id + '/credits', {}, function(credits) {
            var actors = (credits.cast || []).slice(0, 3).map(a => a.name).join(', ');
            var director = (credits.crew || []).find(c => c.job === 'Director');
            var directorName = director ? director.name : '';
            var metaDiv = this.heroDiv?.querySelector('.hero-card__meta');
            if (metaDiv) {
                metaDiv.innerHTML = `<span>Режиссёр: ${directorName}</span> | <span>В ролях: ${actors || '—'}</span>`;
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
            img.src = Lampa.Api.img(item.poster_path || item.img, 'w300');
            img.onerror = function() { img.src = './img/img_broken.svg'; };
            card.appendChild(img);
            card.on('hover:enter', function() {
                self.setCurrentIndex(idx);
            });
            self.carouselInner.appendChild(card);
        });
    };

    HeroMainComponent.prototype.setCurrentIndex = function(newIndex) {
        if (newIndex === this.currentIndex) return;
        this.currentIndex = newIndex;
        this.renderHero(this.allItems[newIndex]);
        var cards = this.carouselInner.querySelectorAll('.strip-card');
        cards.forEach(function(card, i) {
            if (i === newIndex) card.classList.add('selected');
            else card.classList.remove('selected');
        });
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

    HeroMainComponent.prototype.start = function() {
        var self = this;
        var currentFocus = 'hero'; // hero или carousel

        var controller = {
            toggle: function() {
                if (currentFocus === 'hero') {
                    Lampa.Controller.collectionSet(self.heroDiv);
                    Lampa.Controller.collectionFocus(self.heroDiv.querySelector('.hero-card__button'), self.heroDiv);
                } else {
                    Lampa.Controller.collectionSet(self.carouselInner);
                    var selected = self.carouselInner.querySelector('.strip-card.selected');
                    Lampa.Controller.collectionFocus(selected, self.carouselInner);
                }
            },
            up: function() {
                if (currentFocus === 'carousel') {
                    currentFocus = 'hero';
                    controller.toggle();
                } else {
                    Lampa.Controller.toggle('head');
                }
            },
            down: function() {
                if (currentFocus === 'hero') {
                    currentFocus = 'carousel';
                    controller.toggle();
                }
            },
            right: function() {
                if (currentFocus === 'carousel') {
                    if (self.currentIndex < self.allItems.length - 1) {
                        self.setCurrentIndex(self.currentIndex + 1);
                    }
                }
            },
            left: function() {
                if (currentFocus === 'carousel') {
                    if (self.currentIndex > 0) {
                        self.setCurrentIndex(self.currentIndex - 1);
                    }
                }
            },
            enter: function() {
                if (currentFocus === 'hero') {
                    var item = self.allItems[self.currentIndex];
                    Lampa.Activity.push({
                        url: '',
                        component: 'full',
                        id: item.id,
                        method: item.name ? 'tv' : 'movie',
                        card: item,
                        source: item.source || 'tmdb'
                    });
                } else {
                    var selectedCard = self.carouselInner.querySelector('.strip-card.selected');
                    if (selectedCard) {
                        var idx = parseInt(selectedCard.getAttribute('data-index'));
                        self.setCurrentIndex(idx);
                        currentFocus = 'hero';
                        controller.toggle();
                    }
                }
            },
            back: function() {
                Lampa.Activity.backward();
            }
        };
        Lampa.Controller.add('hero_carousel', controller);
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

    function addStyles() {
        if (document.getElementById('hero-carousel-styles')) return;
        var style = document.createElement('style');
        style.id = 'hero-carousel-styles';
        style.textContent = `
            /* Основные стили */
            .hero-carousel-container {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                background: #000;
                overflow: hidden;
            }
            /* Hero-карточка на весь экран с учётом шапки */
            .hero-card {
                flex: 3;
                position: relative;
                background-size: cover;
                background-position: center 30%;
                background-repeat: no-repeat;
                min-height: 0;
                width: 100%;
                border-radius: 0 0 30px 30px;
                overflow: hidden;
                margin-top: 0;
            }
            /* Градиентная подложка для текста */
            .hero-card__overlay {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.2), transparent);
                padding: 40px 30px 30px;
                color: white;
                backdrop-filter: blur(2px);
            }
            .hero-card__logo {
                max-width: 280px;
                max-height: 80px;
                object-fit: contain;
                margin-bottom: 15px;
            }
            .hero-card__title {
                font-size: 2.2rem;
                font-weight: bold;
                text-shadow: 0 2px 5px black;
                margin-bottom: 10px;
            }
            .hero-card__info {
                font-size: 1rem;
                display: flex;
                gap: 20px;
                margin-bottom: 10px;
            }
            .hero-card__overview {
                font-size: 0.9rem;
                max-width: 60%;
                line-height: 1.4;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                margin-bottom: 15px;
            }
            .hero-card__meta {
                font-size: 0.8rem;
                opacity: 0.8;
                margin-bottom: 15px;
            }
            .hero-card__button {
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.5);
                padding: 10px 25px;
                border-radius: 50px;
                display: inline-block;
                cursor: pointer;
                transition: 0.2s;
                font-size: 1rem;
                backdrop-filter: blur(5px);
            }
            .hero-card__button:hover {
                background: rgba(255,255,255,0.4);
            }
            /* Нижняя карусель — без обрезания карточек */
            .carousel-strip {
                flex: 1.2;
                padding: 20px 0;
                overflow-x: auto;
                overflow-y: hidden;
                scrollbar-width: thin;
                background: linear-gradient(to top, #050505, #0a0a0c);
            }
            .carousel-strip__inner {
                display: flex;
                gap: 18px;
                padding: 0 30px;
                align-items: center;
                height: 100%;
            }
            .strip-card {
                flex-shrink: 0;
                width: 160px;
                transition: all 0.25s cubic-bezier(0.2, 0.9, 0.4, 1.1);
                cursor: pointer;
                border-radius: 24px;
                overflow: hidden;
                box-shadow: 0 8px 20px rgba(0,0,0,0.4);
                transform-origin: center;
            }
            .strip-card__poster {
                width: 100%;
                aspect-ratio: 2 / 3;
                object-fit: cover; /* было contain — cover всё же лучше для карточек */
                display: block;
                transition: transform 0.2s;
            }
            .strip-card.selected {
                transform: scale(1.55);
                margin: 0 25px;
                z-index: 2;
                box-shadow: 0 15px 35px rgba(0,0,0,0.6);
                border-radius: 28px;
            }
            .strip-card:not(.selected) {
                filter: brightness(0.7);
                transform: scale(0.85);
            }
            /* Адаптация для мобильных */
            @media (max-width: 768px) {
                .hero-card__title { font-size: 1.3rem; }
                .hero-card__overview { max-width: 100%; font-size: 0.75rem; }
                .strip-card { width: 110px; }
                .strip-card.selected { transform: scale(1.4); margin: 0 10px; }
                .hero-card__logo { max-width: 160px; }
                .hero-card__overlay { padding: 20px 15px; }
            }
            /* Стиль шапки, адаптирующейся под фон */
            .head {
                background: var(--hero-header-bg, rgba(0,0,0,0.6)) !important;
                backdrop-filter: blur(10px);
                transition: background 0.3s ease;
            }
        `;
        document.head.appendChild(style);
    }

    function replaceMainComponent() {
        if (Lampa.Component.get('main') === HeroMainComponent) return;
        Lampa.Component.add('main', HeroMainComponent);
        console.log('HeroCarousel TV: компонент main заменён');
    }

    Lampa.Listener.follow('app', function(e) {
        if (e.type === 'ready') {
            addStyles();
            replaceMainComponent();
        }
    });
})();
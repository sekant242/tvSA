// Плагин: Hero-карусель для Lampa с адаптацией под верхнюю панель
(function() {
    'use strict';

    var HeroMainComponent = function(object) {
        Lampa.Emit.call(this);
        this.object = object || {};
        this.params = object.params || {};
        this.allItems = [];
        this.currentIndex = 0;
        this.html = null;
        this.heroDiv = null;
        this.carouselDiv = null;
        this.carouselInner = null;
        this.activity = null;
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
        // Учитываем высоту шапки
        this.updateHeadOffset();
        window.addEventListener('resize', this.updateHeadOffset.bind(this));
        this.loadData();
        this.emit('create');
    };

    HeroMainComponent.prototype.updateHeadOffset = function() {
        var head = Lampa.Head.render(true);
        if (head && this.heroDiv) {
            var headHeight = head.offsetHeight;
            this.heroDiv.style.marginTop = headHeight + 'px';
        }
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
            <div class="hero-card__meta">Актёры и режиссёр загружаются...</div>
            <div class="hero-card__button selector">Смотреть</div>
        `;
        this.heroDiv.appendChild(overlay);
        this.loadCast(item);
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
        this.updateHeadColor(backUrl);
    };

    HeroMainComponent.prototype.updateHeadColor = function(imageUrl) {
        // Меняем цвет шапки на основе доминирующего цвета фона (простой способ – полупрозрачный)
        var head = Lampa.Head.render(true);
        if (head) {
            head.style.backgroundColor = 'rgba(0,0,0,0.6)';
            head.style.backdropFilter = 'blur(10px)';
        }
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
        // Обновляем фокус контроллера
        if (Lampa.Controller.enabled().name === 'hero_carousel') {
            Lampa.Controller.collectionFocus(selectedCard, this.carouselInner);
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
                // Переключаемся на верхнюю панель
                Lampa.Controller.toggle('head');
            },
            down: function() {
                // Остаёмся в карусели
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
                background: #000;
                overflow: hidden;
            }
            .hero-card {
                flex: 3;
                position: relative;
                background-size: cover;
                background-position: center center;
                background-repeat: no-repeat;
                min-height: 65vh;
                border-radius: 0 0 28px 28px;
                margin-bottom: 10px;
                transition: margin-top 0.2s;
            }
            .hero-card__overlay {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.3), transparent);
                padding: 30px 30px 25px;
                color: white;
                border-radius: 0 0 28px 28px;
            }
            .hero-card__logo {
                max-width: 280px;
                max-height: 70px;
                object-fit: contain;
                margin-bottom: 12px;
            }
            .hero-card__title {
                font-size: 2.2rem;
                font-weight: bold;
                text-shadow: 0 2px 5px black;
                margin-bottom: 8px;
            }
            .hero-card__info {
                font-size: 1rem;
                display: flex;
                gap: 20px;
                margin-bottom: 8px;
                opacity: 0.9;
            }
            .hero-card__overview {
                font-size: 0.9rem;
                max-width: 60%;
                line-height: 1.4;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                margin-bottom: 12px;
            }
            .hero-card__meta {
                font-size: 0.85rem;
                opacity: 0.8;
                margin-bottom: 15px;
            }
            .hero-card__button {
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.5);
                padding: 10px 28px;
                border-radius: 40px;
                display: inline-block;
                cursor: pointer;
                transition: 0.2s;
                font-size: 1rem;
                font-weight: 500;
            }
            .hero-card__button:hover {
                background: rgba(255,255,255,0.4);
                transform: scale(1.02);
            }
            .carousel-strip {
                flex: 1;
                padding: 20px 0 30px;
                overflow-x: auto;
                overflow-y: hidden;
                scrollbar-width: thin;
                background: linear-gradient(to top, #111, transparent);
            }
            .carousel-strip__inner {
                display: flex;
                gap: 20px;
                padding: 0 40px;
                align-items: center;
                height: 100%;
            }
            .strip-card {
                flex-shrink: 0;
                width: 170px;
                transition: all 0.25s ease;
                cursor: pointer;
                border-radius: 18px;
                overflow: hidden;
                box-shadow: 0 5px 15px rgba(0,0,0,0.5);
                transform-origin: center;
                background: #1a1a1a;
            }
            .strip-card__poster {
                width: 100%;
                aspect-ratio: 2 / 3;
                object-fit: cover;
                display: block;
            }
            .strip-card.selected {
                transform: scale(1.7);
                margin: 0 25px;
                z-index: 2;
                box-shadow: 0 12px 30px rgba(0,0,0,0.8);
                border-radius: 20px;
            }
            .strip-card:not(.selected) {
                filter: brightness(0.7);
                transform: scale(0.9);
            }
            /* Соседние с выбранной — чуть больше */
            .strip-card.selected + .strip-card,
            .strip-card:has(+ .strip-card.selected) {
                transform: scale(1.05);
                filter: brightness(0.85);
            }
            @media (max-width: 768px) {
                .hero-card__title { font-size: 1.4rem; }
                .hero-card__overview { max-width: 100%; font-size: 0.75rem; }
                .strip-card { width: 120px; }
                .strip-card.selected { transform: scale(1.5); margin: 0 15px; }
                .hero-card__logo { max-width: 180px; }
                .hero-card__info { font-size: 0.8rem; gap: 12px; }
            }
        `;
        document.head.appendChild(style);
    }

    function modifyHeadStyle() {
        var head = Lampa.Head.render(true);
        if (head) {
            head.style.backgroundColor = 'rgba(0,0,0,0.6)';
            head.style.backdropFilter = 'blur(12px)';
            head.style.transition = 'background-color 0.3s';
        }
    }

    function replaceMainComponent() {
        if (Lampa.Component.get('main') === HeroMainComponent) return;
        Lampa.Component.add('main', HeroMainComponent);
        console.log('HeroCarousel TV v2: компонент main заменён');
    }

    Lampa.Listener.follow('app', function(e) {
        if (e.type === 'ready') {
            addStyles();
            modifyHeadStyle();
            replaceMainComponent();
        }
    });
})();
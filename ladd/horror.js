/**
 * Плагин «Ужасы» для Lampa
 * Расширенная категория фильмов ужасов и триллеров с фильтрацией по TMDB.
 *
 * Возможности:
 *  - Жанры (Ужасы / Триллер / оба)
 *  - Языки оригинала (16 языков)
 *  - Поджанры (ключевые слова TMDB)
 *  - Киностудии
 *  - Текстовый поиск
 *  - Сохранение состояния фильтров между сессиями
 *  - Пагинация с защитой от перегрузки
 */
(function () {
    'use strict';

    /* ============================================================
     * КОНСТАНТЫ
     * ============================================================ */

    const PLUGIN_NAME = 'Ужасы';
    const COMPONENT_NAME = 'horror';
    const STYLE_ID = 'horror-plugin-styles';
    const STORAGE_KEY = 'horror_plugin_filters';
    const MENU_ACTION = 'horror';

    const SEARCH_DEBOUNCE_MS = 600;
    const MAX_PAGES = 20;
    const LOAD_NEXT_THRESHOLD = 1.5;

    const GENRES = {
        HORROR: 27,
        THRILLER: 53
    };

    const GENRES_QUERY = `${GENRES.HORROR}|${GENRES.THRILLER}`;

    const LANGUAGES = [
        ['en', 'Английский'],
        ['ru', 'Русский'],
        ['es', 'Испанский'],
        ['fr', 'Французский'],
        ['de', 'Немецкий'],
        ['it', 'Итальянский'],
        ['ja', 'Японский'],
        ['ko', 'Корейский'],
        ['zh', 'Китайский'],
        ['pt', 'Португальский'],
        ['sv', 'Шведский'],
        ['da', 'Датский'],
        ['no', 'Норвежский'],
        ['fi', 'Финский'],
        ['nl', 'Нидерландский'],
        ['pl', 'Польский']
    ];

    const KEYWORDS = [
        [12377, 'Зомби'],
        [3133, 'Вампиры'],
        [9951, 'Пришельцы'],
        [10714, 'Серийный убийца'],
        [154243, 'Психопаты'],
        [288403, 'Проклятие'],
        [2343, 'Паранормальное'],
        [3222, 'Маньяк'],
        [11322, 'Каннибализм'],
        [187056, 'Одержимость'],
        [10617, 'Катастрофа'],
        [9748, 'Месть']
    ];

    const COMPANIES = [
        [10908, 'Blumhouse'],
        [41077, 'A24'],
        [3172, 'Blumhouse Productions'],
        [12654, 'Ghost House'],
        [831, 'Vertigo Entertainment'],
        [4, 'Paramount'],
        [33, 'Universal'],
        [174, 'Warner Bros.'],
        [34, 'Sony'],
        [5215, 'Northern Lights'],
        [435, 'Twisted Pictures'],
        [1632, 'Lionsgate'],
        [5855, 'Atomic Monster'],
        [10039, 'Dark Castle'],
        [11218, 'New Line']
    ];

    /* ============================================================
     * УТИЛИТЫ
     * ============================================================ */

    const Logger = {
        log: function () {
            const args = Array.prototype.slice.call(arguments);
            args.unshift('[' + PLUGIN_NAME + ']');
            console.log.apply(console, args);
        },
        warn: function () {
            const args = Array.prototype.slice.call(arguments);
            args.unshift('[' + PLUGIN_NAME + ']');
            console.warn.apply(console, args);
        },
        error: function () {
            const args = Array.prototype.slice.call(arguments);
            args.unshift('[' + PLUGIN_NAME + ']');
            console.error.apply(console, args);
        }
    };

    /**
     * Debounce — откладывает вызов fn до тех пор, пока не пройдёт wait мс без вызовов.
     */
    function debounce(fn, wait) {
        let timer = null;
        return function () {
            const context = this;
            const args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function () {
                fn.apply(context, args);
            }, wait);
        };
    }

    /**
     * Экранирование HTML-спецсимволов.
     */
    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function isNonEmptyArray(value) {
        return Array.isArray(value) && value.length > 0;
    }

    function cloneArray(value) {
        return Array.isArray(value) ? value.slice() : [];
    }

    /* ============================================================
     * СОСТОЯНИЕ ФИЛЬТРОВ
     * ============================================================ */

    const filterState = {
        genres: GENRES_QUERY,
        languages: [],
        keywords: [],
        companies: [],
        search: ''
    };

    function saveFilterState() {
        try {
            Lampa.Storage.set(STORAGE_KEY, {
                genres: filterState.genres,
                languages: filterState.languages,
                keywords: filterState.keywords,
                companies: filterState.companies,
                search: filterState.search
            });
        } catch (e) {
            Logger.warn('Не удалось сохранить фильтры:', e.message);
        }
    }

    function loadFilterState() {
        try {
            const saved = Lampa.Storage.get(STORAGE_KEY, null);
            if (!saved || typeof saved !== 'object') return;

            if (typeof saved.genres === 'string' && saved.genres) {
                filterState.genres = saved.genres;
            }
            if (isNonEmptyArray(saved.languages)) {
                filterState.languages = cloneArray(saved.languages);
            }
            if (isNonEmptyArray(saved.keywords)) {
                filterState.keywords = cloneArray(saved.keywords);
            }
            if (isNonEmptyArray(saved.companies)) {
                filterState.companies = cloneArray(saved.companies);
            }
            if (typeof saved.search === 'string') {
                filterState.search = saved.search;
            }
        } catch (e) {
            Logger.warn('Не удалось загрузить фильтры:', e.message);
        }
    }

    function resetFilterState() {
        filterState.genres = GENRES_QUERY;
        filterState.languages = [];
        filterState.keywords = [];
        filterState.companies = [];
        filterState.search = '';
        saveFilterState();
    }

    function hasActiveFilters() {
        return isNonEmptyArray(filterState.languages)
            || isNonEmptyArray(filterState.keywords)
            || isNonEmptyArray(filterState.companies)
            || !!filterState.search
            || filterState.genres !== GENRES_QUERY;
    }

    function activeFilterCount() {
        let count = 0;
        if (isNonEmptyArray(filterState.languages)) count++;
        if (isNonEmptyArray(filterState.keywords)) count++;
        if (isNonEmptyArray(filterState.companies)) count++;
        if (filterState.search) count++;
        if (filterState.genres !== GENRES_QUERY) count++;
        return count;
    }

    /* ============================================================
     * СТИЛИ
     * ============================================================ */

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = [
            '.horror-filters {',
            '  display: flex; flex-wrap: wrap; gap: 0.6em;',
            '  padding: 0.8em 1.2em;',
            '  background: rgba(255, 255, 255, 0.04);',
            '  border-bottom: 1px solid rgba(255, 255, 255, 0.08);',
            '}',
            '.horror-filters__btn {',
            '  display: inline-flex; align-items: center; gap: 0.4em;',
            '  padding: 0.5em 1em; border-radius: 2em;',
            '  background: rgba(255, 255, 255, 0.08); color: #fff;',
            '  font-size: 0.95em; cursor: pointer; user-select: none;',
            '  transition: background 0.15s ease, transform 0.15s ease;',
            '  white-space: nowrap;',
            '}',
            '.horror-filters__btn:hover,',
            '.horror-filters__btn.focus {',
            '  background: rgba(255, 255, 255, 0.18);',
            '  transform: translateY(-1px);',
            '}',
            '.horror-filters__btn--active {',
            '  background: #e02129; color: #fff;',
            '}',
            '.horror-filters__btn--active:hover,',
            '.horror-filters__btn--active.focus {',
            '  background: #ff2c35;',
            '}',
            '.horror-filters__badge {',
            '  display: inline-block; min-width: 1.4em; padding: 0 0.35em;',
            '  border-radius: 0.7em; background: rgba(0, 0, 0, 0.35);',
            '  font-size: 0.8em; text-align: center; line-height: 1.4em;',
            '}',
            '.horror-filters__clear {',
            '  margin-left: auto; color: #ff8a8a;',
            '}',
            '@media (max-width: 480px) {',
            '  .horror-filters { padding: 0.6em; gap: 0.4em; }',
            '  .horror-filters__btn { padding: 0.4em 0.8em; font-size: 0.85em; }',
            '}'
        ].join('\n');
        document.head.appendChild(style);
    }

    /* ============================================================
     * ПАНЕЛЬ ФИЛЬТРОВ
     * ============================================================ */

    function buildFiltersBar() {
        const bar = document.createElement('div');
        bar.className = 'horror-filters';

        const buttons = [
            { key: 'genres', title: 'Жанры', count: filterState.genres !== GENRES_QUERY ? 1 : 0 },
            { key: 'languages', title: 'Языки', count: filterState.languages.length },
            { key: 'keywords', title: 'Поджанры', count: filterState.keywords.length },
            { key: 'companies', title: 'Студии', count: filterState.companies.length },
            { key: 'search', title: 'Поиск', count: filterState.search ? 1 : 0 }
        ];

        buttons.forEach(function (item) {
            const btn = document.createElement('div');
            btn.className = 'horror-filters__btn selector';
            btn.dataset.filter = item.key;

            let html = escapeHtml(item.title);
            if (item.count > 0) {
                html += ' <span class="horror-filters__badge">' + item.count + '</span>';
                btn.classList.add('horror-filters__btn--active');
            }
            btn.innerHTML = html;

            const handler = function () {
                openFilterSelect(item.key);
            };
            btn.addEventListener('hover:enter', handler);
            btn.addEventListener('click', handler);

            bar.appendChild(btn);
        });

        if (hasActiveFilters()) {
            const clear = document.createElement('div');
            clear.className = 'horror-filters__btn horror-filters__clear selector';
            clear.textContent = 'Сбросить';
            const clearHandler = function () {
                resetFilterState();
                refreshActivity();
            };
            clear.addEventListener('hover:enter', clearHandler);
            clear.addEventListener('click', clearHandler);
            bar.appendChild(clear);
        }

        return bar;
    }

    /* ============================================================
     * ОТКРЫТИЕ ФИЛЬТРА
     * ============================================================ */

    function toggleArrayValue(array, value, checked) {
        const index = array.indexOf(value);
        if (checked && index === -1) {
            array.push(value);
        } else if (!checked && index !== -1) {
            array.splice(index, 1);
        }
    }

    function applyAndRefresh() {
        saveFilterState();
        refreshActivity();
    }

    function openGenresSelect() {
        const items = [
            { title: 'Ужасы и триллеры', value: GENRES_QUERY, selected: filterState.genres === GENRES_QUERY },
            { title: 'Только ужасы', value: String(GENRES.HORROR), selected: filterState.genres === String(GENRES.HORROR) },
            { title: 'Только триллеры', value: String(GENRES.THRILLER), selected: filterState.genres === String(GENRES.THRILLER) }
        ];

        Lampa.Select.show({
            title: 'Жанры',
            items: items,
            onSelect: function (item) {
                filterState.genres = item.value;
                applyAndRefresh();
            },
            onBack: function () {
                Lampa.Controller.toggle('content');
            }
        });
    }

    function openMultiSelect(title, source, target, transformItem) {
        const items = source.map(function (entry) {
            return transformItem(entry, target);
        });

        Lampa.Select.show({
            title: title,
            items: items,
            onCheck: function (item) {
                const value = item.value;
                const checked = !!item.checked;
                toggleArrayValue(target, value, checked);
                applyAndRefresh();
            },
            onBack: function () {
                Lampa.Controller.toggle('content');
            }
        });
    }

    function openFilterSelect(key) {
        switch (key) {
            case 'genres':
                openGenresSelect();
                break;

            case 'languages':
                openMultiSelect(
                    'Языки',
                    LANGUAGES,
                    filterState.languages,
                    function (entry, target) {
                        return {
                            title: entry[1],
                            value: entry[0],
                            checked: target.indexOf(entry[0]) !== -1
                        };
                    }
                );
                break;

            case 'keywords':
                openMultiSelect(
                    'Поджанры',
                    KEYWORDS,
                    filterState.keywords,
                    function (entry, target) {
                        return {
                            title: entry[1],
                            value: entry[0],
                            checked: target.indexOf(entry[0]) !== -1
                        };
                    }
                );
                break;

            case 'companies':
                openMultiSelect(
                    'Студии',
                    COMPANIES,
                    filterState.companies,
                    function (entry, target) {
                        return {
                            title: entry[1],
                            value: entry[0],
                            checked: target.indexOf(entry[0]) !== -1
                        };
                    }
                );
                break;

            case 'search':
                openSearchInput();
                break;

            default:
                break;
        }
    }

    function openSearchInput() {
        Lampa.Input.edit({
            title: 'Поиск',
            value: filterState.search,
            free: true,
            nosave: true,
            nomic: true
        }, function (value) {
            filterState.search = String(value || '').trim();
            applyAndRefresh();
        });
    }

    /* ============================================================
     * ПЕРЕЗАПУСК АКТИВНОСТИ
     * ============================================================ */

    function refreshActivity() {
        try {
            const active = Lampa.Activity.active();
            if (!active || active.component !== COMPONENT_NAME) {
                return;
            }

            const activity = active.activity;
            if (activity && typeof activity.refresh === 'function') {
                activity.refresh();
            }
        } catch (e) {
            Logger.warn('Не удалось перезапустить активность:', e.message);
        }
    }

    /* ============================================================
     * ЗАПРОСЫ К TMDB
     * ============================================================ */

    function buildQuery(page) {
        const query = [];
        query.push('with_genres=' + filterState.genres);
        query.push('page=' + (page || 1));

        if (isNonEmptyArray(filterState.languages)) {
            query.push('with_original_language=' + filterState.languages.join('|'));
        }
        if (isNonEmptyArray(filterState.keywords)) {
            query.push('with_keywords=' + filterState.keywords.join('|'));
        }
        if (isNonEmptyArray(filterState.companies)) {
            query.push('with_companies=' + filterState.companies.join('|'));
        }

        return 'discover/movie?' + query.join('&');
    }

    function buildSearchQuery(page) {
        return 'search/movie?query=' + encodeURIComponent(filterState.search)
            + '&page=' + (page || 1);
    }

    function buildApiObject(page) {
        const isSearch = !!filterState.search;
        return {
            url: isSearch ? buildSearchQuery(page) : buildQuery(page),
            title: PLUGIN_NAME,
            component: COMPONENT_NAME,
            source: 'tmdb',
            page: page || 1,
            card_type: true
        };
    }

    /* ============================================================
     * КОМПОНЕНТ
     * ============================================================ */

    function createHorrorComponent(object) {
        const scroll = new Lampa.Scroll({
            mask: true,
            over: true,
            step: 300,
            end_ratio: 2
        });

        const html = document.createElement('div');
        const body = document.createElement('div');

        let items = [];
        let active = 0;
        let last = null;
        let totalPages = 1;
        let loading = false;
        let destroyed = false;
        let emptyInstance = null;

        body.className = 'category-full';

        function isEnd() {
            try {
                return scroll.isEnd(LOAD_NEXT_THRESHOLD);
            } catch (e) {
                return false;
            }
        }

        function onScroll() {
            Lampa.Layer.visible(scroll.render(true));
            if (isEnd()) {
                loadNext();
            }
        }

        function loadNext() {
            if (loading || destroyed) return;
            if (object.page >= Math.min(totalPages, MAX_PAGES)) return;

            loading = true;
            const nextPage = object.page + 1;

            Lampa.Api.list(buildApiObject(nextPage), function (data) {
                if (destroyed) return;
                loading = false;
                object.page = nextPage;
                if (data && data.total_pages) {
                    totalPages = data.total_pages;
                }
                append(data, true);
            }, function () {
                loading = false;
            });
        }

        function append(data, appendToScroll) {
            if (!data || !isNonEmptyArray(data.results)) return;
            if (data.total_pages) totalPages = data.total_pages;

            const fragment = document.createDocumentFragment();

            data.results.forEach(function (element) {
                try {
                    const card = Lampa.Maker.make('Card', element, function (mod) {
                        return mod.only('Card', 'Release', 'Callback');
                    });

                    card.use({
                        onFocus: function (target, cardData) {
                            last = target;
                            active = items.indexOf(card);
                            scroll.update(card.render(true));
                            Lampa.Background.change(Lampa.Utils.cardImgBackground(cardData));
                        },
                        onTouch: function (target) {
                            last = target;
                            active = items.indexOf(card);
                        },
                        onEnter: function (target, cardData) {
                            last = target;
                            Lampa.Activity.push({
                                url: cardData.url,
                                component: 'full',
                                id: element.id,
                                method: 'movie',
                                card: element,
                                source: element.source || 'tmdb'
                            });
                        }
                    });

                    card.create();
                    fragment.appendChild(card.render(true));
                    items.push(card);
                } catch (e) {
                    Logger.warn('Ошибка создания карточки:', e.message);
                }
            });

            body.appendChild(fragment);

            if (appendToScroll) {
                Lampa.Controller.collectionAppend(fragment);
            }

            Lampa.Controller.collectionSet(scroll.render(true));
            Lampa.Layer.visible(scroll.render(true));
        }

        function showEmpty(title, descr) {
            emptyInstance = new Lampa.Empty({
                title: title || 'Ничего не найдено',
                descr: descr || 'Попробуйте изменить фильтры или сбросить их'
            });

            html.appendChild(emptyInstance.render(true));
            this.start = emptyInstance.start.bind(emptyInstance);
            object.activity.loader(false);
            object.activity.toggle();
        }

        function fetchFirstPage() {
            object.activity.loader(true);

            Lampa.Api.list(buildApiObject(1), function (data) {
                if (destroyed) return;

                if (!data || !isNonEmptyArray(data.results)) {
                    showEmpty();
                    return;
                }

                totalPages = data.total_pages || 1;
                object.page = 1;
                append(data, false);
                object.activity.loader(false);
                object.activity.toggle();
            }, function () {
                if (destroyed) return;
                object.activity.loader(false);
                showEmpty('Ошибка загрузки', 'Не удалось получить данные от TMDB. Проверьте соединение и попробуйте снова.');
            });
        }

        this.create = function () {
            injectStyles();
            scroll.minus();
            scroll.onEnd = onScroll;
            scroll.onScroll = onScroll;

            html.appendChild(buildFiltersBar());
            scroll.append(body);
            html.appendChild(scroll.render(true));

            fetchFirstPage();
        };

        this.start = function () {
            Lampa.Controller.add('content', {
                link: this,
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render(true));
                    Lampa.Controller.collectionFocus(last || false, scroll.render(true));
                },
                left: function () {
                    if (Navigator.canmove('left')) {
                        Navigator.move('left');
                    } else {
                        Lampa.Controller.toggle('menu');
                    }
                },
                right: function () {
                    Navigator.move('right');
                },
                up: function () {
                    if (Navigator.canmove('up')) {
                        Navigator.move('up');
                    } else {
                        Lampa.Controller.toggle('head');
                    }
                },
                down: function () {
                    if (Navigator.canmove('down')) {
                        Navigator.move('down');
                    }
                },
                back: function () {
                    Lampa.Activity.backward();
                }
            });
            Lampa.Controller.toggle('content');
        };

        this.pause = function () {};
        this.stop = function () {};

        this.destroy = function () {
            destroyed = true;
            items.forEach(function (item) {
                try {
                    item.destroy();
                } catch (e) {}
            });
            items = [];
            scroll.destroy();
            html.remove();
            body.remove();
            if (emptyInstance) {
                try {
                    emptyInstance.destroy();
                } catch (e) {}
                emptyInstance = null;
            }
        };

        this.render = function (js) {
            return js ? html : $(html);
        };
    }

    /* ============================================================
     * ДОБАВЛЕНИЕ В МЕНЮ
     * ============================================================ */

    function addMenuItem() {
        const menu = $('.menu .menu__list').eq(0);
        if (!menu.length) return false;
        if (menu.find('[data-action="' + MENU_ACTION + '"]').length) return true;

        const item = $(
            '<li class="menu__item selector" data-action="' + MENU_ACTION + '">' +
                '<div class="menu__ico">' +
                    '<svg><use xlink:href="#sprite-fire"></use></svg>' +
                '</div>' +
                '<div class="menu__text">' + escapeHtml(PLUGIN_NAME) + '</div>' +
            '</li>'
        );

        item.on('hover:enter', function () {
            Lampa.Activity.push({
                url: 'discover/movie?' + GENRES_QUERY,
                title: PLUGIN_NAME,
                component: COMPONENT_NAME,
                source: 'tmdb',
                page: 1,
                card_type: true
            });
        });

        menu.append(item);
        Logger.log('Пункт меню добавлен');
        return true;
    }

    function waitForMenu() {
        if (addMenuItem()) return;

        let attempts = 0;
        const maxAttempts = 60;

        const interval = setInterval(function () {
            attempts++;
            if (addMenuItem() || attempts >= maxAttempts) {
                clearInterval(interval);
            }
        }, 500);

        if (Lampa.Listener) {
            Lampa.Listener.follow('menu', function (e) {
                if (e.type === 'end') {
                    if (addMenuItem()) {
                        clearInterval(interval);
                    }
                }
            });
        }
    }

    /* ============================================================
     * ИНИЦИАЛИЗАЦИЯ
     * ============================================================ */

    function init() {
        if (typeof Lampa === 'undefined') {
            Logger.warn('Lampa не найдена, плагин не загружен');
            return;
        }

        if (!Lampa.Component || typeof Lampa.Component.add !== 'function') {
            Logger.warn('Lampa.Component.add недоступен, плагин не загружен');
            return;
        }

        loadFilterState();

        Lampa.Component.add(COMPONENT_NAME, createHorrorComponent);

        waitForMenu();

        Logger.log('Плагин инициализирован');
    }

    if (window.appready) {
        init();
    } else if (typeof Lampa !== 'undefined' && Lampa.Listener) {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') {
                init();
            }
        });
    } else {
        const fallback = setInterval(function () {
            if (window.appready) {
                clearInterval(fallback);
                init();
            }
        }, 500);
    }
})();
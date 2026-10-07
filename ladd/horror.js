(function () {
    'use strict';

    /* ============================================================
     *  TVSA HORROR PLUGIN v2.0
     *  Улучшенная версия: без сериалов, только фильмы жанров
     *  Horror (27) и Thriller (53) с расширенной фильтрацией.
     * ============================================================ */

    // ---------- Константы ----------
    var CONFIG = {
        // TMDB genre IDs: 27 = Horror, 53 = Thriller
        baseGenres: '27,53',
        defaultGenres: [27, 53],
        itemsView: 6,
        searchDebounce: 600,
        menuRetryDelay: 500,
        menuMaxRetries: 60,
        storageKey: 'tvsa_horror_filters'
    };

    // ---------- Данные фильтров ----------
    var FILTERS = {
        genres: [
            { id: 27, title: 'Ужасы' },
            { id: 53, title: 'Триллер' },
            { id: 9648, title: 'Детектив' },
            { id: 10749, title: 'Мистика (мелодрама)' }
        ],
        languages: [
            { id: 'ru', title: 'Русский' },
            { id: 'en', title: 'Английский' },
            { id: 'es', title: 'Испанский' },
            { id: 'fr', title: 'Французский' },
            { id: 'de', title: 'Немецкий' },
            { id: 'it', title: 'Итальянский' },
            { id: 'ja', title: 'Японский' },
            { id: 'ko', title: 'Корейский' },
            { id: 'zh', title: 'Китайский' },
            { id: 'pt', title: 'Португальский' },
            { id: 'sv', title: 'Шведский' },
            { id: 'no', title: 'Норвежский' },
            { id: 'da', title: 'Датский' },
            { id: 'pl', title: 'Польский' },
            { id: 'tr', title: 'Турецкий' },
            { id: 'hi', title: 'Хинди' }
        ],
        keywords: [
            { id: 12377, title: 'Зомби' },
            { id: 3133, title: 'Вампиры' },
            { id: 9715, title: 'Призраки' },
            { id: 10617, title: 'Катастрофа' },
            { id: 10349, title: 'Выживание' },
            { id: 9951, title: 'Инопланетяне' },
            { id: 14544, title: 'Роботы' },
            { id: 10541, title: 'Кукла / манекен' },
            { id: 10714, title: 'Сериал-убийца' },
            { id: 10718, title: 'Погоня' },
            { id: 9826, title: 'Убийца' },
            { id: 9748, title: 'Месть' },
            { id: 10719, title: 'Проклятие' },
            { id: 2343, title: 'Паранойя' },
            { id: 4565, title: 'Антиутопия' },
            { id: 15001, title: 'Демоны' }
        ],
        companies: [
            { id: 3172, title: 'Blumhouse' },
            { id: 41077, title: 'A24' },
            { id: 33, title: 'Universal Pictures' },
            { id: 174, title: 'Warner Bros.' },
            { id: 4, title: 'Paramount' },
            { id: 5, title: 'Columbia' },
            { id: 25, title: '20th Century Fox' },
            { id: 88, title: 'Sony Pictures' },
            { id: 7505, title: 'Lionsgate' },
            { id: 9073, title: 'Atomic Monster' },
            { id: 10349, title: 'Ghost House' },
            { id: 120494, title: 'Vertigo Entertainment' }
        ]
    };

    // ---------- Утилиты ----------

    /**
     * Debounce — откладывает вызов до истечения wait мс с последнего вызова.
     */
    function debounce(fn, wait) {
        var timer = null;
        return function () {
            var ctx = this;
            var args = arguments;
            if (timer) clearTimeout(timer);
            timer = setTimeout(function () {
                timer = null;
                fn.apply(ctx, args);
            }, wait);
        };
    }

    /**
     * Безопасный доступ к Lampa.
     */
    function L() {
        return window.Lampa || {};
    }

    /**
     * Найти элемент массива по ключу.
     */
    function findBy(arr, key, value) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i][key] === value) return arr[i];
        }
        return null;
    }

    /**
     * Переключить значение в массиве (immutable-free, in place).
     */
    function toggleValue(arr, value, checked) {
        var idx = arr.indexOf(value);
        if (checked === undefined) {
            if (idx === -1) arr.push(value);
            else arr.splice(idx, 1);
            return arr;
        }
        if (checked && idx === -1) arr.push(value);
        else if (!checked && idx !== -1) arr.splice(idx, 1);
        return arr;
    }

    /* ============================================================
     *  СОСТОЯНИЕ ФИЛЬТРОВ
     * ============================================================ */

    var filterState = {
        genres: CONFIG.defaultGenres.slice(),
        languages: [],
        keywords: [],
        companies: [],
        query: '',
        mode: 'browse'
    };

    /**
     * Загрузка сохранённого состояния из localStorage.
     */
    function loadFilterState() {
        try {
            var raw = window.localStorage.getItem(CONFIG.storageKey);
            if (!raw) return;
            var saved = JSON.parse(raw);
            if (saved && typeof saved === 'object') {
                if (Array.isArray(saved.genres) && saved.genres.length) filterState.genres = saved.genres;
                if (Array.isArray(saved.languages)) filterState.languages = saved.languages;
                if (Array.isArray(saved.keywords)) filterState.keywords = saved.keywords;
                if (Array.isArray(saved.companies)) filterState.companies = saved.companies;
                if (typeof saved.query === 'string') filterState.query = saved.query;
                if (saved.mode === 'search' || saved.mode === 'browse') filterState.mode = saved.mode;
            }
        } catch (e) {
            console.warn('[Horror] loadFilterState error:', e.message);
        }
    }

    /**
     * Сохранение состояния фильтров.
     */
    var saveFilterState = debounce(function () {
        try {
            window.localStorage.setItem(CONFIG.storageKey, JSON.stringify(filterState));
        } catch (e) {
            console.warn('[Horror] saveFilterState error:', e.message);
        }
    }, 300);

    /**
     * Сброс фильтров к значениям по умолчанию.
     */
    function resetFilterState() {
        filterState.genres = CONFIG.defaultGenres.slice();
        filterState.languages = [];
        filterState.keywords = [];
        filterState.companies = [];
        filterState.query = '';
        filterState.mode = 'browse';
        saveFilterState();
    }

    /* ============================================================
     *  ПОСТРОЕНИЕ URL ДЛЯ TMDB
     * ============================================================ */

    /**
     * Собирает URL discover/movie с учётом активных фильтров.
     */
    function buildDiscoverUrl(page) {
        var parts = [];

        // Жанры: всегда объединяем через | (OR)
        if (filterState.genres.length) {
            parts.push('with_genres=' + filterState.genres.join('|'));
        }

        // Языки: OR внутри языков
        if (filterState.languages.length) {
            parts.push('with_original_language=' + filterState.languages.join('|'));
        }

        // Ключевые слова: OR (чтобы находить фильмы с любым из тегов)
        if (filterState.keywords.length) {
            parts.push('with_keywords=' + filterState.keywords.join('|'));
        }

        // Компании: OR
        if (filterState.companies.length) {
            parts.push('with_companies=' + filterState.companies.join('|'));
        }

        // Сортировка: по популярности
        parts.push('sort_by=popularity.desc');
        // Исключаем adult-контент
        parts.push('include_adult=false');

        if (page && page > 1) parts.push('page=' + page);

        return 'discover/movie?' + parts.join('&');
    }

    /**
     * URL для текстового поиска.
     */
    function buildSearchUrl(page) {
        var q = encodeURIComponent(filterState.query.trim());
        var parts = ['query=' + q];
        if (page && page > 1) parts.push('page=' + page);
        return 'search/movie?' + parts.join('&');
    }

    /* ============================================================
     *  КОМПОНЕНТ
     * ============================================================ */

    var active = {};

    function HorrorComponent(object) {
        var self = this;
        var network = new L().Network ? new L().Network() : null;

        /**
         * Определяет URL в зависимости от режима.
         */
        function getUrl(page) {
            if (filterState.mode === 'search' && filterState.query.trim()) {
                return buildSearchUrl(page);
            }
            return buildDiscoverUrl(page);
        }

        /**
         * Создаёт объект категории с фильтр-баром.
         */
        this.create = function () {
            var url = getUrl(object.page || 1);

            var categoryObject = {
                url: url,
                title: object.title || 'Ужасы',
                source: 'tmdb',
                page: object.page || 1,
                params: {
                    module: L().Maker
                        ? L().Maker.module('Category').except('Pagination', 'Explorer')
                        : undefined
                },
                onMore: function (params) {
                    // Показать ещё — не нужно, у нас бесконечная лента
                }
            };

            var category = L().Maker.make('Category', categoryObject);

            // Перехватываем onCreate, чтобы добавить фильтр-бар в начало скролла
            var originalCreate = category.onCreate || function () {};
            category.use({
                onCreate: function () {
                    var scroll = this.scroll;
                    var body = this.body;

                    // Контейнер для фильтров
                    var bar = buildFiltersBar(function onChange() {
                        saveFilterState();
                        // Перезагружаем категорию
                        if (active.activity) {
                            active.activity.refresh();
                        }
                    });

                    scroll.append(bar);

                    // Восстанавливаем фильтры, если есть сохранённый query
                    if (filterState.mode === 'search' && filterState.query) {
                        var input = bar.querySelector('.horror-search-input');
                        if (input) input.value = filterState.query;
                    }
                }
            });

            active.category = category;
            return category;
        };

        this.render = function () {
            return active.category ? active.category.render() : document.createElement('div');
        };

        this.destroy = function () {
            if (network) network.clear();
            if (active.category) {
                active.category.destroy();
                active.category = null;
            }
        };
    }

    /* ============================================================
     *  ФИЛЬТР-БАР
     * ============================================================ */

    /**
     * Строит DOM-элемент фильтр-бара.
     */
    function buildFiltersBar(onChange) {
        var bar = document.createElement('div');
        bar.className = 'horror-filters';

        // Кнопки фильтров
        var buttons = [
            { key: 'genres', title: 'Жанры', items: FILTERS.genres, multiple: true },
            { key: 'languages', title: 'Языки', items: FILTERS.languages, multiple: true },
            { key: 'keywords', title: 'Теги', items: FILTERS.keywords, multiple: true },
            { key: 'companies', title: 'Студии', items: FILTERS.companies, multiple: true }
        ];

        buttons.forEach(function (cfg) {
            var btn = document.createElement('div');
            btn.className = 'horror-filters__btn selector';
            btn.dataset.filterKey = cfg.key;

            var label = document.createElement('span');
            label.className = 'horror-filters__label';
            label.textContent = cfg.title;

            var count = document.createElement('span');
            count.className = 'horror-filters__count';

            btn.appendChild(label);
            btn.appendChild(count);

            btn.addEventListener('hover:enter', function () {
                openFilterSelect(cfg, function () {
                    updateButtonCount(btn, cfg);
                    onChange();
                });
            });

            updateButtonCount(btn, cfg);
            bar.appendChild(btn);
        });

        // Поле поиска
        var searchWrap = document.createElement('div');
        searchWrap.className = 'horror-filters__search';

        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'horror-search-input selector';
        input.placeholder = 'Поиск по названию...';
        input.value = filterState.query || '';

        var applySearch = debounce(function () {
            var value = input.value.trim();
            filterState.query = value;
            filterState.mode = value ? 'search' : 'browse';
            saveFilterState();
            onChange();
        }, CONFIG.searchDebounce);

        input.addEventListener('input', applySearch);
        input.addEventListener('change', applySearch);

        var searchBtn = document.createElement('div');
        searchBtn.className = 'horror-filters__search-btn selector';
        searchBtn.textContent = 'Найти';
        searchBtn.addEventListener('hover:enter', function () {
            var value = input.value.trim();
            filterState.query = value;
            filterState.mode = value ? 'search' : 'browse';
            saveFilterState();
            onChange();
        });

        searchWrap.appendChild(input);
        searchWrap.appendChild(searchBtn);

        // Кнопка сброса
        var resetBtn = document.createElement('div');
        resetBtn.className = 'horror-filters__reset selector';
        resetBtn.textContent = 'Сбросить';
        resetBtn.addEventListener('hover:enter', function () {
            resetFilterState();
            input.value = '';
            bar.querySelectorAll('.horror-filters__btn').forEach(function (b) {
                var key = b.dataset.filterKey;
                var cfg = findBy(buttons, 'key', key);
                updateButtonCount(b, cfg);
            });
            onChange();
        });

        searchWrap.appendChild(resetBtn);
        bar.appendChild(searchWrap);

        return bar;
    }

    /**
     * Обновляет счётчик на кнопке.
     */
    function updateButtonCount(btn, cfg) {
        var count = btn.querySelector('.horror-filters__count');
        var values = filterState[cfg.key] || [];
        if (values.length) {
            count.textContent = values.length;
            count.style.display = 'inline-flex';
        } else {
            count.textContent = '';
            count.style.display = 'none';
        }
    }

    /**
     * Открывает Select с чекбоксами для выбранного фильтра.
     */
    function openFilterSelect(cfg, onApply) {
        var selected = filterState[cfg.key] || [];

        var items = cfg.items.map(function (item) {
            return {
                title: item.title,
                id: item.id,
                checkbox: true,
                checked: selected.indexOf(item.id) !== -1
            };
        });

        // Дополнительно — кнопка "Сбросить этот фильтр"
        items.push({
            title: 'Очистить',
            separator: true
        });
        items.push({
            title: 'Сбросить выбор',
            reset: true
        });

        L().Select.show({
            title: cfg.title,
            items: items,
            onCheck: function (item) {
                if (item.reset) return;
                toggleValue(filterState[cfg.key], item.id, item.checked);
                saveFilterState();
            },
            onSelect: function (item) {
                if (item.reset) {
                    filterState[cfg.key] = [];
                    saveFilterState();
                    L().Select.hide();
                    L().Select.show({
                        title: cfg.title,
                        items: cfg.items.map(function (i) {
                            return {
                                title: i.title,
                                id: i.id,
                                checkbox: true,
                                checked: false
                            };
                        }).concat([{ title: 'Очистить', separator: true }, { title: 'Сбросить выбор', reset: true }]),
                        onCheck: function (sub) {
                            if (sub.reset) return;
                            toggleValue(filterState[cfg.key], sub.id, sub.checked);
                            saveFilterState();
                        },
                        onSelect: function (sub) {
                            if (sub.reset) {
                                filterState[cfg.key] = [];
                                saveFilterState();
                            }
                            L().Select.hide();
                            onApply();
                        },
                        onBack: function () {
                            onApply();
                        }
                    });
                    return;
                }
                L().Select.hide();
                onApply();
            },
            onBack: function () {
                onApply();
            }
        });
    }

    /* ============================================================
     *  РЕГИСТРАЦИЯ В МЕНЮ
     * ============================================================ */

    /**
     * Добавляет пункт "Ужасы" в главное меню.
     */
    function addMenuItem() {
        if (typeof L().Menu === 'undefined' || typeof L().Menu.addButton !== 'function') {
            console.warn('[Horror] Menu API не доступен');
            return false;
        }

        var icon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8 2 5 5 5 9V20L8 18L10 20L12 18L14 20L16 18L19 20V9C19 5 16 2 12 2Z" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="9.5" cy="9.5" r="1.5" fill="currentColor"/><circle cx="14.5" cy="9.5" r="1.5" fill="currentColor"/></svg>';

        L().Menu.addButton(icon, 'Ужасы', function () {
            openHorrorCategory();
        });

        console.log('[Horror] Пункт меню добавлен');
        return true;
    }

    /**
     * Открывает кастомную категорию ужасов.
     */
    function openHorrorCategory() {
        L().Activity.push({
            url: buildDiscoverUrl(1),
            title: 'Ужасы',
            component: 'horror_custom',
            source: 'tmdb',
            page: 1
        });
    }

    /* ============================================================
     *  РЕГИСТРАЦИЯ КОМПОНЕНТА В LAMPA
     * ============================================================ */

    function registerComponent() {
        if (typeof L().Component === 'undefined' || typeof L().Component.add !== 'function') {
            console.warn('[Horror] Component API не доступен');
            return false;
        }

        L().Component.add('horror_custom', function (object) {
            var comp = new HorrorComponent(object);

            // Создаём настоящий Category внутри
            var categoryObject = {
                url: buildDiscoverUrl(1),
                title: object.title || 'Ужасы',
                source: 'tmdb',
                page: object.page || 1
            };

            var inner = L().Maker.make('Category', categoryObject);

            // Перехватываем onCreate, чтобы добавить фильтр-бар
            inner.use({
                onCreate: function () {
                    var scroll = this.scroll;
                    var bar = buildFiltersBar(function () {
                        saveFilterState();
                        // Пересоздаём категорию с новым URL
                        var newUrl = filterState.mode === 'search' && filterState.query.trim()
                            ? buildSearchUrl(1)
                            : buildDiscoverUrl(1);
                        this.object.url = newUrl;
                        this.object.page = 1;
                        this.activity.refresh();
                    });

                    scroll.append(bar);
                }
            });

            return inner;
        });

        console.log('[Horror] Компонент зарегистрирован');
        return true;
    }

    /* ============================================================
     *  СТИЛИ
     * ============================================================ */

    function injectStyles() {
        var css = [
            '.horror-filters {',
            '  display: flex;',
            '  flex-wrap: wrap;',
            '  gap: 0.6em;',
            '  padding: 1em;',
            '  background: rgba(255,255,255,0.04);',
            '  border-radius: 0.8em;',
            '  margin-bottom: 1em;',
            '  align-items: center;',
            '}',
            '.horror-filters__btn {',
            '  display: inline-flex;',
            '  align-items: center;',
            '  gap: 0.4em;',
            '  padding: 0.5em 0.9em;',
            '  background: rgba(255,255,255,0.08);',
            '  border-radius: 1.5em;',
            '  font-size: 0.9em;',
            '  transition: background 0.2s;',
            '  cursor: pointer;',
            '}',
            '.horror-filters__btn:hover,',
            '.horror-filters__btn.focus {',
            '  background: rgba(255,255,255,0.18);',
            '}',
            '.horror-filters__count {',
            '  display: none;',
            '  background: #e53935;',
            '  color: #fff;',
            '  border-radius: 1em;',
            '  padding: 0.05em 0.5em;',
            '  font-size: 0.75em;',
            '  font-weight: 600;',
            '}',
            '.horror-filters__search {',
            '  display: flex;',
            '  gap: 0.5em;',
            '  margin-left: auto;',
            '  align-items: center;',
            '}',
            '.horror-search-input {',
            '  background: rgba(0,0,0,0.3);',
            '  border: 1px solid rgba(255,255,255,0.15);',
            '  border-radius: 1.5em;',
            '  padding: 0.5em 1em;',
            '  color: #fff;',
            '  font-size: 0.9em;',
            '  outline: none;',
            '  min-width: 12em;',
            '  transition: border 0.2s;',
            '}',
            '.horror-search-input:focus {',
            '  border-color: rgba(255,255,255,0.5);',
            '}',
            '.horror-filters__search-btn,',
            '.horror-filters__reset {',
            '  padding: 0.5em 0.9em;',
            '  background: rgba(255,255,255,0.1);',
            '  border-radius: 1.5em;',
            '  font-size: 0.85em;',
            '  cursor: pointer;',
            '  transition: background 0.2s;',
            '}',
            '.horror-filters__search-btn:hover,',
            '.horror-filters__reset:hover,',
            '.horror-filters__search-btn.focus,',
            '.horror-filters__reset.focus {',
            '  background: rgba(255,255,255,0.2);',
            '}',
            '@media (max-width: 700px) {',
            '  .horror-filters__search { width: 100%; margin-left: 0; }',
            '  .horror-search-input { flex: 1; min-width: 0; }',
            '}'
        ].join('\n');

        var style = document.createElement('style');
        style.type = 'text/css';
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);
    }

    /* ============================================================
     *  BOOTSTRAP
     * ============================================================ */

    /**
     * Точка входа. Ждём событие 'app:ready' от Lampa.
     */
    function bootstrap() {
        loadFilterState();
        injectStyles();

        if (!registerComponent()) {
            console.error('[Horror] Не удалось зарегистрировать компонент');
            return;
        }

        // Пытаемся добавить пункт меню — либо сразу, либо после события menu
        if (!addMenuItem()) {
            L().Listener.follow('menu', function (e) {
                if (e.type === 'end' || e.type === 'ready') {
                    addMenuItem();
                }
            });
        }

        console.log('[Horror] Плагин запущен');
    }

    // Ждём готовности Lampa
    if (window.Lampa && window.appready) {
        bootstrap();
    } else if (window.Lampa) {
        window.Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') bootstrap();
        });
    } else {
        // Lampa ещё не загружена — ждём
        var waitTimer = setInterval(function () {
            if (window.Lampa && window.Lampa.Listener) {
                clearInterval(waitTimer);
                if (window.appready) bootstrap();
                else window.Lampa.Listener.follow('app', function (e) {
                    if (e.type === 'ready') bootstrap();
                });
            }
        }, 200);
    }

})();
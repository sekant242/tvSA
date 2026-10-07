(function () {
  'use strict';

  var ICON = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9v7c0 1.1.9 2 2 2h1v-3c0-.55.45-1 1-1s1 .45 1 1v3h4v-3c0-.55.45-1 1-1s1 .45 1 1v3h1c1.1 0 2-.9 2-2V9c0-3.87-3.13-7-7-7zm-4 8c-.83 0-1.5-.67-1.5-1.5S7.17 7 8 7s1.5.67 1.5 1.5S8.83 10 8 10zm8 0c-.83 0-1.5-.67-1.5-1.5S15.17 7 16 7s1.5.67 1.5 1.5S16.83 10 16 10z"/></svg>';

  // ─── Жанры: 27 = Ужасы, 53 = Триллер ─────────────────────────────
  var GENRES = '27|53';

  var LANGS = [
    { code: 'ru', name: 'Русский' },
    { code: 'en', name: 'Английский' },
    { code: 'ja', name: 'Японский' },
    { code: 'ko', name: 'Корейский' },
    { code: 'es', name: 'Испанский' },
    { code: 'fr', name: 'Французский' },
    { code: 'de', name: 'Немецкий' },
    { code: 'it', name: 'Итальянский' },
    { code: 'zh', name: 'Китайский' },
    { code: 'pt', name: 'Португальский' },
    { code: 'hi', name: 'Хинди' },
    { code: 'th', name: 'Тайский' },
    { code: 'sv', name: 'Шведский' },
    { code: 'no', name: 'Норвежский' },
    { code: 'da', name: 'Датский' },
    { code: 'tr', name: 'Турецкий' },
    { code: 'pl', name: 'Польский' }
  ];

  var KEYWORDS = [
    { id: 12339, name: 'Слэшеры' },
    { id: 12377, name: 'Зомби' },
    { id: 3133, name: 'Вампиры' },
    { id: 9715, name: 'Призраки' },
    { id: 10349, name: 'Одержимость' },
    { id: 2302, name: 'Ведьмы' },
    { id: 2543, name: 'Дома с привидениями' },
    { id: 1299, name: 'Монстры' },
    { id: 156778, name: 'Рептилии' },
    { id: 163053, name: 'Найденная плёнка' },
    { id: 10714, name: 'Психологические' },
    { id: 155430, name: 'Телесный хоррор' },
    { id: 10541, name: 'Культы' },
    { id: 207317, name: 'Хэллоуин' },
    { id: 207822, name: 'Рождественский хоррор' },
    { id: 33352, name: 'Больничный хоррор' },
    { id: 10556, name: 'Каннибалы' },
    { id: 10333, name: 'Проклятия' },
    { id: 10648, name: 'Демоны' },
    { id: 161919, name: 'Космический хоррор' }
  ];

  var STUDIOS = [
    { id: 3172, name: 'Blumhouse' },
    { id: 41077, name: 'A24' },
    { id: 7738, name: 'Ghost House' },
    { id: 7991, name: 'Dark Castle' },
    { id: 3060, name: 'Twisted Pictures' },
    { id: 101159, name: 'Atomic Monster' },
    { id: 12, name: 'New Line Cinema' },
    { id: 2149, name: 'Hammer Film' },
    { id: 13006, name: 'Amicus' },
    { id: 1423, name: 'Full Moon' },
    { id: 6775, name: 'Troma' },
    { id: 4353, name: 'Vertigo' },
    { id: 7505, name: 'Platinum Dunes' },
    { id: 118151, name: 'NEON' },
    { id: 90763, name: 'Annapurna' },
    { id: 20979, name: 'Rogue Pictures' },
    { id: 18726, name: 'Screen Gems' },
    { id: 1686, name: 'Skydance' },
    { id: 7295, name: 'Constantin Film' }
  ];

  // ─── Общее состояние фильтров (сохраняется между пересозданиями) ──
  var filterState = {
    langs: [],
    keywords: [],
    studios: [],
    query: ''
  };

  function buildFilter() {
    var f = {
      with_genres: GENRES,
      sort_by: 'popularity.desc',
      'vote_count.gte': 10
    };
    if (filterState.query && filterState.query.trim()) {
      f.with_text_query = filterState.query;
    }
    if (filterState.langs.length) {
      f.with_original_language = filterState.langs.join('|');
    }
    if (filterState.keywords.length) {
      f.with_keywords = filterState.keywords.join('|');
    }
    if (filterState.studios.length) {
      f.with_companies = filterState.studios.join('|');
    }
    return f;
  }

  function applyFilters() {
    var active = Lampa.Activity.active();
    if (!active) return;
    active.filter = buildFilter();
    if (active.activity) active.activity.refresh();
  }

  // ─── Фильтр-бар ──────────────────────────────────────────────────
  function buildFiltersBar(object) {
    var bar = $('<div class="horror-filters"></div>');

    // Строка поиска — только на экране поиска
    if (object.mode === 'search') {
      var inputWrap = $('<div class="horror-search-wrap"></div>');
      var input = $('<input type="text" class="horror-search-input" placeholder="Введите название фильма..." />');
      input.val(filterState.query);
      inputWrap.append(input);
      bar.append(inputWrap);

      var inputTimer;
      input.on('input', function () {
        filterState.query = $(this).val();
        clearTimeout(inputTimer);
        inputTimer = setTimeout(applyFilters, 600);
      });
    }

    var btnLang = $('<div class="horror-filter selector"></div>');
    var btnKw = $('<div class="horror-filter selector"></div>');
    var btnStudio = $('<div class="horror-filter selector"></div>');
    var btnSearch = $('<div class="horror-filter horror-filter--search selector"></div>');

    function updateLabels() {
      btnLang.text('Язык' + (filterState.langs.length ? ' (' + filterState.langs.length + ')' : ''));
      btnKw.text('Тэг' + (filterState.keywords.length ? ' (' + filterState.keywords.length + ')' : ''));
      btnStudio.text('Студия' + (filterState.studios.length ? ' (' + filterState.studios.length + ')' : ''));
    }
    updateLabels();

    btnLang.on('hover:enter click', function () { openFilterSelect('lang', updateLabels); });
    btnKw.on('hover:enter click', function () { openFilterSelect('kw', updateLabels); });
    btnStudio.on('hover:enter click', function () { openFilterSelect('studio', updateLabels); });

    if (object.mode === 'search') {
      btnSearch.text('← Назад');
      btnSearch.on('hover:enter click', function () {
        Lampa.Activity.backward();
      });
    } else {
      btnSearch.text('🔍 Поиск');
      btnSearch.on('hover:enter click', function () {
        Lampa.Activity.push({
          url: 'discover/movie',
          title: 'Поиск ужасов',
          component: 'horror',
          mode: 'search',
          page: 1,
          filter: buildFilter()
        });
      });
    }

    bar.append(btnLang, btnKw, btnStudio, btnSearch);
    return bar;
  }

  function openFilterSelect(type, updateLabels) {
    var prev = Lampa.Controller.enabled().name;
    var items, onCheck, title;

    if (type === 'lang') {
      title = 'Язык';
      items = LANGS.map(function (l) {
        return { title: l.name, value: l.code, checkbox: true, checked: filterState.langs.indexOf(l.code) >= 0 };
      });
      onCheck = function (item) {
        if (item.checked) {
          if (filterState.langs.indexOf(item.value) < 0) filterState.langs.push(item.value);
        } else {
          var i = filterState.langs.indexOf(item.value);
          if (i >= 0) filterState.langs.splice(i, 1);
        }
      };
    } else if (type === 'kw') {
      title = 'Тэг (keyword)';
      items = KEYWORDS.map(function (k) {
        return { title: k.name, value: k.id, checkbox: true, checked: filterState.keywords.indexOf(k.id) >= 0 };
      });
      onCheck = function (item) {
        if (item.checked) {
          if (filterState.keywords.indexOf(item.value) < 0) filterState.keywords.push(item.value);
        } else {
          var i = filterState.keywords.indexOf(item.value);
          if (i >= 0) filterState.keywords.splice(i, 1);
        }
      };
    } else {
      title = 'Студия';
      items = STUDIOS.map(function (s) {
        return { title: s.name, value: s.id, checkbox: true, checked: filterState.studios.indexOf(s.id) >= 0 };
      });
      onCheck = function (item) {
        if (item.checked) {
          if (filterState.studios.indexOf(item.value) < 0) filterState.studios.push(item.value);
        } else {
          var i = filterState.studios.indexOf(item.value);
          if (i >= 0) filterState.studios.splice(i, 1);
        }
      };
    }

    // Кнопка сброса — первой строкой
    items.unshift({ title: '✓ Сбросить выбранное', reset: true });

    Lampa.Select.show({
      title: title,
      items: items,
      nohide: true,
      onCheck: function (item) {
        onCheck(item);
        updateLabels();
      },
      onSelect: function (item) {
        if (item.reset) {
          if (type === 'lang') filterState.langs = [];
          else if (type === 'kw') filterState.keywords = [];
          else filterState.studios = [];

          items.forEach(function (i) { i.checked = false; });
          $('.selectbox-item--checked').removeClass('selectbox-item--checked');
          updateLabels();
        }
      },
      onBack: function () {
        Lampa.Controller.toggle(prev);
        applyFilters();
      }
    });
  }

  // ─── Кастомный компонент-обёртка ──────────────────────────────────
  function HorrorComponent(object) {
    var _this = this;
    var inner;
    var filtersBar;

    this.activity = null;

    this.create = function (body) {
      // Актуализируем filter в объекте
      object.source = 'tmdb';
      object.url = 'discover/movie';
      object.filter = buildFilter();

      // Используем готовый компонент Lampa — сетка карточек с навигацией
      inner = Lampa.Maker.make('Category', object);
      inner.activity = _this.activity;

      // Данные грузим сами
      inner.use({
        onCreate: function () {
          Lampa.Api.list(object, this.build.bind(this), this.empty.bind(this));
        },
        onNext: function (resolve, reject) {
          Lampa.Api.list(object, resolve.bind(this), reject.bind(this));
        },
        onInstance: function (item, data) {
          item.use({
            onEnter: function () {
              Lampa.Activity.push({
                url: '',
                title: data.title || data.name,
                component: 'full',
                method: 'movie',
                id: data.id,
                card: data,
                source: 'tmdb'
              });
            },
            onFocus: function () {
              Lampa.Background.change(Lampa.Utils.cardImgBackground(data));
            }
          });
        }
      });

      inner.create();

      // Вставляем фильтр-бар в scroll__body, перед гридом карточек
      filtersBar = buildFiltersBar(object);
      inner.scroll.body(true).insertBefore(filtersBar[0], inner.body);

      // Пересчитываем размеры — фильтр-бар должен вычитаться из области скролла
      if (inner.scroll && typeof inner.scroll.minus === 'function') {
        inner.scroll.minus(filtersBar);
      }
      Lampa.Layer.update();
    };

    this.start = function () {
      inner.start();
    };

    this.render = function (js) {
      return inner.render(js);
    };

    this.destroy = function () {
      if (inner) inner.destroy();
    };

    this.pause = function () { if (inner && inner.pause) inner.pause(); };
    this.resize = function () { if (inner && inner.resize) inner.resize(); };
    this.stop = function () {};
  }

  // ─── Стили ───────────────────────────────────────────────────────
  function addStyles() {
    if ($('#horror-plugin-styles').length) return;
    var css = '' +
      '.horror-filters{display:flex;gap:.8em;flex-wrap:wrap;padding:1em 1.4em .8em;align-items:center}' +
      '.horror-filter{padding:.6em 1.1em;background:rgba(255,255,255,.08);border-radius:.5em;color:#fff;cursor:pointer;transition:background .15s;font-size:.92em;white-space:nowrap}' +
      '.horror-filter:hover,.horror-filter.focus{background:rgba(255,255,255,.22)}' +
      '.horror-filter--search{margin-left:auto;background:rgba(255,80,80,.18)}' +
      '.horror-filter--search:hover,.horror-filter--search.focus{background:rgba(255,80,80,.32)}' +
      '.horror-search-wrap{flex:1 1 100%;min-width:220px;padding:.2em 0}' +
      '.horror-search-input{width:100%;padding:.75em 1em;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:.5em;color:#fff;font-size:.95em;outline:none;box-sizing:border-box}' +
      '.horror-search-input:focus{background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.32)}';
    $('<style id="horror-plugin-styles"></style>').text(css).appendTo('head');
  }

  // ─── Точка входа из меню ──────────────────────────────────────────
  function openBrowse() {
    Lampa.Activity.push({
      url: 'discover/movie',
      title: 'Ужасы и триллеры',
      component: 'horror',
      mode: 'browse',
      page: 1,
      filter: buildFilter()
    });
  }

  var menuAdded = false;
  function tryAddMenuButton() {
    if (menuAdded) return true;
    try {
      if (!Lampa || !Lampa.Menu || typeof Lampa.Menu.addButton !== 'function') return false;
      Lampa.Menu.addButton(ICON, 'Ужасы', openBrowse);
      menuAdded = true;
      return true;
    } catch (e) { return false; }
  }

  function init() {
    addStyles();
    Lampa.Component.add('horror', HorrorComponent);

    Lampa.Listener.follow('menu', function (e) {
      if (e.type === 'end') tryAddMenuButton();
    });
    tryAddMenuButton();

    // Фолбэк на случай, если меню уже проинициализировано
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      if (tryAddMenuButton() || tries > 60) clearInterval(iv);
    }, 500);
  }

  if (window.appready) init();
  else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') init(); });

})();
(function () {
  'use strict';

  var ICON = '';

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

  // ─── Кеш логотипов студий ──────────────────────────────────────
  var studioLogoCache = {};

  function loadStudioLogo(studioId, callback) {
    if (studioLogoCache[studioId]) {
      callback(studioLogoCache[studioId]);
      return;
    }
    var url = Lampa.TMDB.api('company/' + studioId + '/images');
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var logo = null;
        if (data.logos && data.logos.length) {
          logo = data.logos[0].file_path;
        }
        studioLogoCache[studioId] = logo;
        callback(logo);
      })
      .catch(function () {
        studioLogoCache[studioId] = null;
        callback(null);
      });
  }

  // ─── Флаги через flagcdn.com ─────────────────────────────────────
  function flagUrl(code) {
    return 'https://flagcdn.com/' + code + '.svg';
  }

  // ─── Окно «Фильтры» с тремя разделами ──────────────────────────
  function openFiltersMenu(updateLabels) {
    var prev = Lampa.Controller.enabled().name;

    Lampa.Select.show({
      title: 'Фильтры',
      items: [
        { title: '🌐 Языки' + (filterState.langs.length ? ' (' + filterState.langs.length + ')' : ''), filterType: 'lang' },
        { title: '🏢 Студии' + (filterState.studios.length ? ' (' + filterState.studios.length + ')' : ''), filterType: 'studio' },
        { title: '🏷️ О чём' + (filterState.keywords.length ? ' (' + filterState.keywords.length + ')' : ''), filterType: 'kw' }
      ],
      onSelect: function (item) {
        if (item.filterType === 'lang') openLangSelect(updateLabels);
        else if (item.filterType === 'studio') openStudioSelect(updateLabels);
        else if (item.filterType === 'kw') openKeywordSelect(updateLabels);
      },
      onBack: function () {
        Lampa.Controller.toggle(prev);
      }
    });
  }

  // ─── Языки: флаги + текст, без чекбоксов ───────────────────────
  function openLangSelect(updateLabels) {
    var prev = Lampa.Controller.enabled().name;

    function buildItems() {
      var items = [];
      LANGS.forEach(function (lang) {
        var selected = filterState.langs.indexOf(lang.code) >= 0;
        var html = '<div class="selector horror-filter-row' + (selected ? ' horror-filter-row--selected' : '') + '">' +
          '<img class="horror-filter-flag" src="' + flagUrl(lang.code) + '" onerror="this.style.display=\'none\'">' +
          '<span class="horror-filter-name">' + lang.name + '</span>' +
          (selected ? '<span class="horror-filter-check">✓</span>' : '') +
          '</div>';
        items.push({
          html: html,
          value: lang.code,
          title: lang.name
        });
      });
      return items;
    }

    Lampa.Select.show({
      title: 'Языки',
      items: buildItems(),
      nohide: true,
      onSelect: function (item) {
        var idx = filterState.langs.indexOf(item.value);
        if (idx >= 0) {
          filterState.langs.splice(idx, 1);
        } else {
          filterState.langs.push(item.value);
        }
        updateLabels();
        // Перерисовываем список
        Lampa.Select.hide();
        setTimeout(function () {
          openLangSelect(updateLabels);
        }, 100);
      },
      onBack: function () {
        Lampa.Controller.toggle(prev);
        applyFilters();
      }
    });
  }

  // ─── Студии: логотипы + названия ───────────────────────────────
  function openStudioSelect(updateLabels) {
    var prev = Lampa.Controller.enabled().name;

    function buildItems() {
      var items = [];
      STUDIOS.forEach(function (studio) {
        var selected = filterState.studios.indexOf(studio.id) >= 0;
        var logoHtml = '<img class="horror-filter-logo" src="" onerror="this.style.display=\'none\'">';
        var html = '<div class="selector horror-filter-row' + (selected ? ' horror-filter-row--selected' : '') + '" data-studio-id="' + studio.id + '">' +
          logoHtml +
          '<span class="horror-filter-name">' + studio.name + '</span>' +
          (selected ? '<span class="horror-filter-check">✓</span>' : '') +
          '</div>';
        items.push({
          html: html,
          value: studio.id,
          title: studio.name,
          studioId: studio.id
        });
      });
      return items;
    }

    var items = buildItems();

    Lampa.Select.show({
      title: 'Студии',
      items: items,
      nohide: true,
      onFullDraw: function (scroll) {
        // Загружаем логотипы асинхронно
        items.forEach(function (item) {
          if (!item.studioId) return;
          loadStudioLogo(item.studioId, function (logoPath) {
            if (!logoPath) return;
            var img = scroll.body(true).querySelector('[data-studio-id="' + item.studioId + '"] .horror-filter-logo');
            if (img) {
              img.src = Lampa.Api.img(logoPath, 'w92');
              img.style.display = 'inline-block';
            }
          });
        });
      },
      onSelect: function (item) {
        var idx = filterState.studios.indexOf(item.value);
        if (idx >= 0) {
          filterState.studios.splice(idx, 1);
        } else {
          filterState.studios.push(item.value);
        }
        updateLabels();
        Lampa.Select.hide();
        setTimeout(function () {
          openStudioSelect(updateLabels);
        }, 100);
      },
      onBack: function () {
        Lampa.Controller.toggle(prev);
        applyFilters();
      }
    });
  }

  // ─── О чём (keywords): просто названия ─────────────────────────
  function openKeywordSelect(updateLabels) {
    var prev = Lampa.Controller.enabled().name;

    function buildItems() {
      var items = [];
      KEYWORDS.forEach(function (kw) {
        var selected = filterState.keywords.indexOf(kw.id) >= 0;
        var html = '<div class="selector horror-filter-row' + (selected ? ' horror-filter-row--selected' : '') + '">' +
          '<span class="horror-filter-name">' + kw.name + '</span>' +
          (selected ? '<span class="horror-filter-check">✓</span>' : '') +
          '</div>';
        items.push({
          html: html,
          value: kw.id,
          title: kw.name
        });
      });
      return items;
    }

    Lampa.Select.show({
      title: 'О чём',
      items: buildItems(),
      nohide: true,
      onSelect: function (item) {
        var idx = filterState.keywords.indexOf(item.value);
        if (idx >= 0) {
          filterState.keywords.splice(idx, 1);
        } else {
          filterState.keywords.push(item.value);
        }
        updateLabels();
        Lampa.Select.hide();
        setTimeout(function () {
          openKeywordSelect(updateLabels);
        }, 100);
      },
      onBack: function () {
        Lampa.Controller.toggle(prev);
        applyFilters();
      }
    });
  }

  // ─── Фильтр-бар (одна кнопка «Фильтры») ────────────────────────
  function buildFiltersBar(object) {
    var bar = $('<div class="horror-filters"></div>');

    if (object.mode === 'search') {
      var inputWrap = $('<div class="horror-search-wrap"></div>');
      var input = $('<input type="text" class="horror-search-input" placeholder="Поиск...">');
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

    var btnFilters = $('<div class="horror-filter horror-filter--main selector">Фильтры</div>');
    var btnSearch = $('<div class="horror-filter horror-filter--search selector"></div>');

    function updateLabels() {
      var count = filterState.langs.length + filterState.studios.length + filterState.keywords.length;
      btnFilters.text('Фильтры' + (count ? ' (' + count + ')' : ''));
    }
    updateLabels();

    btnFilters.on('hover:enter click', function () {
      openFiltersMenu(updateLabels);
    });

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

    bar.append(btnFilters, btnSearch);
    return bar;
  }

  // ─── Кастомный компонент-обёртка ──────────────────────────────
  function HorrorComponent(object) {
    var _this = this;
    var inner;
    var filtersBar;
    this.activity = null;

    this.create = function (body) {
      object.source = 'tmdb';
      object.url = 'discover/movie';
      object.filter = buildFilter();

      inner = Lampa.Maker.make('Category', object);
      inner.activity = _this.activity;

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

      filtersBar = buildFiltersBar(object);
      inner.scroll.body(true).insertBefore(filtersBar[0], inner.body);

      if (inner.scroll && typeof inner.scroll.minus === 'function') {
        inner.scroll.minus(filtersBar);
      }

      Lampa.Layer.update();
    };

    this.start = function () { inner.start(); };
    this.render = function (js) { return inner.render(js); };
    this.destroy = function () { if (inner) inner.destroy(); };
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
      '.horror-filter--main{background:rgba(255,255,255,.12)}' +
      '.horror-filter--search{margin-left:auto;background:rgba(255,80,80,.18)}' +
      '.horror-filter--search:hover,.horror-filter--search.focus{background:rgba(255,80,80,.32)}' +
      '.horror-search-wrap{flex:1 1 100%;min-width:220px;padding:.2em 0}' +
      '.horror-search-input{width:100%;padding:.75em 1em;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:.5em;color:#fff;font-size:.95em;outline:none;box-sizing:border-box}' +
      '.horror-search-input:focus{background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.32)}' +

      /* Стили для строк фильтров */
      '.horror-filter-row{display:flex;align-items:center;gap:.8em;padding:.7em 1em;border-radius:.5em;transition:background .15s;width:100%;box-sizing:border-box}' +
      '.horror-filter-row:hover,.horror-filter-row.focus{background:rgba(255,255,255,.12)}' +
      '.horror-filter-row--selected{background:rgba(255,255,255,.08)}' +
      '.horror-filter-flag{width:28px;height:20px;object-fit:cover;border-radius:3px;flex-shrink:0}' +
      '.horror-filter-logo{width:48px;height:28px;object-fit:contain;flex-shrink:0;display:none}' +
      '.horror-filter-name{flex:1;font-size:.95em;color:#fff}' +
      '.horror-filter-check{color:#4caf50;font-weight:bold;font-size:1.1em;flex-shrink:0}';

    $('<style id="horror-plugin-styles"></style>').text(css).appendTo('head');
  }

  // ─── Точка входа из меню ────────────────────────────────────────
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

    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      if (tryAddMenuButton() || tries > 60) clearInterval(iv);
    }, 500);
  }

  if (window.appready) init();
  else Lampa.Listener.follow('app', function (e) {
    if (e.type === 'ready') init();
  });
})();
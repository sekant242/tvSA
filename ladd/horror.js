// horror.js — расширенная версия
// https://github.com/sekant242/tvSA
//
// Что нового:
//  · Поджанры (Слэшеры, Зомби, Вампиры, Призраки, Психологические, Found Footage)
//  · Строки «Новинки», «В тренде», «Топ», «Рекомендации», «Фильмы», «Сериалы», «Аниме»
//  · Настройки: рейтинг, год, аниме, скрытие просмотренного
//  · Кнопка «Испугай меня» — случайный ужастик из топа
//  · Прогрессивная загрузка (Promise.allSettled)
//  · Глобальная дедупликация карточек между строками
//  · Кнопка «Ещё» в строках
//  · Мобильный layout с bottom-sheet превью
//  · Кэш с инвалидацией, batch-резолв ключевых слов
//  · Empty-state при ошибке TMDB
//  · Полная локализация через Lampa.Lang
//  · Все константы в CONFIG, весь ввод экранирован
//
(function () {
  'use strict';

  // ════════════════════════════════════════════════════════════
  // 1. DEBUG
  // ════════════════════════════════════════════════════════════
  const DEBUG = false;
  const log  = (...a) => DEBUG && console.log('[Horror]', ...a);
  const warn = (...a) => console.warn('[Horror]', ...a);

  // ════════════════════════════════════════════════════════════
  // 2. CONFIG — все магические числа тут
  // ════════════════════════════════════════════════════════════
  const CONFIG = {
    cache: {
      ns: 'horror_v2',              // меняем ns при смене схемы
      ttl: {                        // в минутах
        keywords:  60 * 24 * 30,    // 30 дней
        recommend: 60 * 24 * 7,
        movies:    60 * 24 * 3,
        tv:        60 * 24 * 3,
        anime:     60 * 24 * 3,
        fresh:     60 * 24,
        trending:  60 * 24,
        top:       60 * 24 * 7,
        subgenre:  60 * 24 * 3
      }
    },
    ratings: {
      recommend: { min: 7,   votes: 1000 },
      movies:    { votes: 500 },
      tv:        { votes: 300 },
      anime:     { votes: 200 },
      fresh:     { votes: 50  },
      top:       { min: 7,   votes: 500 },
      subgenre:  { votes: 100 }
    },
    genre: { horror: 27, thriller: 53, animation: 16 },
    row_size: 20,
    // эндпоинт для «Испугай меня» — сколько случайных страниц перебирать
    frighten: { max_page: 12, min_votes: 300, min_rating: 6 },
    component:          'horror_page',
    settings_component: 'horror_settings'
  };

  const KEYWORDS = [
    'horror', 'slasher', 'zombie', 'vampire', 'ghost',
    'found footage', 'supernatural', 'psychological horror',
    'possession', 'haunted house', 'monster'
  ];

  const SUBGENRES = [
    { id: 'all',     key: 'horror_sub_all',     keywords: [] },
    { id: 'slasher', key: 'horror_sub_slasher', keywords: ['slasher'] },
    { id: 'zombie',  key: 'horror_sub_zombie',  keywords: ['zombie'] },
    { id: 'vampire', key: 'horror_sub_vampire', keywords: ['vampire'] },
    { id: 'ghost',   key: 'horror_sub_ghost',   keywords: ['ghost', 'haunted house'] },
    { id: 'psycho',  key: 'horror_sub_psycho',  keywords: ['psychological horror'] },
    { id: 'found',   key: 'horror_sub_found',   keywords: ['found footage'] }
  ];

  const SETTINGS_KEYS = {
    min_rating:   'horror_min_rating',
    year_filter:  'horror_year_filter',
    show_anime:   'horror_show_anime',
    hide_watched: 'horror_hide_watched'
  };

  // Значения настроек по умолчанию (если Params их не подтянул)
  const SETTINGS_DEFAULTS = {
    [SETTINGS_KEYS.min_rating]:   0,
    [SETTINGS_KEYS.year_filter]:  'all',
    [SETTINGS_KEYS.show_anime]:   true,
    [SETTINGS_KEYS.hide_watched]: false
  };

  // ════════════════════════════════════════════════════════════
  // 3. i18n — регистрация строк
  // ════════════════════════════════════════════════════════════
  Lampa.Lang.add({
    horror_title:               { ru: 'Ужасы',                        en: 'Horror',                        uk: 'Жахи' },
    horror_sub_all:             { ru: 'Все',                          en: 'All',                           uk: 'Усі' },
    horror_sub_slasher:         { ru: 'Слэшеры',                      en: 'Slashers',                      uk: 'Слешери' },
    horror_sub_zombie:          { ru: 'Зомби',                        en: 'Zombies',                       uk: 'Зомбі' },
    horror_sub_vampire:         { ru: 'Вампиры',                      en: 'Vampires',                      uk: 'Вампіри' },
    horror_sub_ghost:           { ru: 'Призраки',                     en: 'Ghosts',                        uk: 'Привиди' },
    horror_sub_psycho:          { ru: 'Психологические',              en: 'Psychological',                 uk: 'Психологічні' },
    horror_sub_found:           { ru: 'Found Footage',                en: 'Found Footage',                 uk: 'Found Footage' },
    horror_row_fresh:           { ru: 'Новинки ужасов',               en: 'Fresh Horror',                  uk: 'Нові жахи' },
    horror_row_trending:        { ru: 'В тренде',                     en: 'Trending',                      uk: 'У тренді' },
    horror_row_top:             { ru: 'В топе',                       en: 'Top rated',                     uk: 'У топі' },
    horror_row_recommend:       { ru: 'Рекомендации',                 en: 'Recommended',                   uk: 'Рекомендації' },
    horror_row_movies:          { ru: 'Фильмы ужасов',                en: 'Horror Movies',                 uk: 'Фільми жахів' },
    horror_row_tv:              { ru: 'Сериалы ужасов',               en: 'Horror TV',                     uk: 'Серіали жахів' },
    horror_row_anime:           { ru: 'Аниме ужасы',                  en: 'Horror Anime',                  uk: 'Аніме жахи' },
    horror_frighten:            { ru: 'Испугай меня',                 en: 'Frighten me',                   uk: 'Налякай мене' },
    horror_frighten_wait:       { ru: 'Подбираем ужастик...',         en: 'Picking a scare...',            uk: 'Підбираємо жах...' },
    horror_frighten_fail:       { ru: 'Не получилось напугать 😢',    en: 'Failed to scare you 😢',        uk: 'Не вдалося налякати 😢' },
    horror_error_network:       { ru: 'Не удалось загрузить. Проверьте соединение или включите прокси TMDB.', en: 'Failed to load. Check connection or enable TMDB proxy.', uk: 'Не вдалося завантажити. Перевірте з\'єднання.' },
    horror_loading:             { ru: 'Загрузка...',                  en: 'Loading...',                    uk: 'Завантаження...' },
    horror_settings:            { ru: 'Настройки ужасов',             en: 'Horror settings',               uk: 'Налаштування жахів' },
    horror_set_min_rating:      { ru: 'Минимальный рейтинг',          en: 'Minimum rating',                uk: 'Мінімальний рейтинг' },
    horror_set_min_rating_d:    { ru: 'Скрывать всё, что ниже',       en: 'Hide everything below',         uk: 'Приховати все нижче' },
    horror_set_year:            { ru: 'Год выпуска',                  en: 'Year',                          uk: 'Рік' },
    horror_set_year_all:        { ru: 'Любой',                        en: 'Any',                           uk: 'Будь-який' },
    horror_set_year_fresh:      { ru: 'Только новинки',               en: 'Fresh only',                    uk: 'Тільки нові' },
    horror_set_year_2000:       { ru: '2000-е и новее',               en: '2000s and newer',               uk: '2000-ті та новіше' },
    horror_set_year_classic:    { ru: 'Классика до 2000',             en: 'Classic before 2000',           uk: 'Класика до 2000' },
    horror_set_anime:           { ru: 'Показывать аниме',             en: 'Show anime',                    uk: 'Показувати аніме' },
    horror_set_hide_watched:    { ru: 'Скрывать просмотренное',       en: 'Hide watched',                  uk: 'Приховати переглянуте' }
  });

  // ════════════════════════════════════════════════════════════
  // 4. HELPERS
  // ════════════════════════════════════════════════════════════
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

  function setting(key) {
    if (typeof Lampa.Storage.field === 'function') {
      const v = Lampa.Storage.field(key);
      if (v !== '' && v !== undefined && v !== null) return v;
    }
    return Lampa.Storage.get(key, SETTINGS_DEFAULTS[key]);
  }

  // Асинхронный ttl-кэш поверх Lampa.Cache
  async function cached(ns_suffix, ttl_min, producer) {
    const key = `${CONFIG.cache.ns}_${ns_suffix}`;
    try {
      const hit = await Lampa.Cache.getData('other', key, ttl_min, false);
      if (hit) { log('cache hit', key); return hit; }
    } catch (e) { /* промах — идём в сеть */ }

    const fresh = await producer();
    // не ждём записи — если упадёт, следующий вызов снова сходит в сеть
    Lampa.Cache.rewriteData('other', key, fresh).catch(() => {});
    return fresh;
  }

  // Обёртка над TMDB.get с промисами
  function tmdb(method, params = {}, opts = {}) {
    return new Promise((resolve, reject) => {
      Lampa.Api.sources.tmdb.get(
        method,
        params,
        (data) => resolve(data),
        () => reject(new Error('TMDB request failed: ' + method)),
        opts.cache ? { life: opts.cache } : false
      );
    });
  }

  function imgUrl(path, size) {
    if (!path) return '';
    if (/^https?:/i.test(path)) return path;
    try { return Lampa.Api.img(path, size); } catch (e) { return ''; }
  }

  // ════════════════════════════════════════════════════════════
  // 5. РЕЗОЛВ КЛЮЧЕВЫХ СЛОВ (batch + кэш 30 дней)
  // ════════════════════════════════════════════════════════════
  let KW_MAP = {};  // { 'zombie': 12377, ... }
  let KW_READY = null;

  async function resolveKeywords() {
    if (KW_READY) return KW_READY;
    KW_READY = (async () => {
      // Сначала пробуем кэш
      try {
        const cachedMap = await Lampa.Cache.getData('other', CONFIG.cache.ns + '_kwmap', CONFIG.cache.ttl.keywords, false);
        if (cachedMap && Object.keys(cachedMap).length) {
          KW_MAP = cachedMap;
          return KW_MAP;
        }
      } catch (e) {}

      // Параллельный резолв, каждый — отдельный /search/keyword
      const results = await Promise.allSettled(
        KEYWORDS.map(word =>
          tmdb('search/keyword', { query: word })
            .then(res => ({ word, id: res.results?.[0]?.id || null }))
            .catch(() => ({ word, id: null }))
        )
      );

      results.forEach(r => {
        if (r.status === 'fulfilled' && r.value.id) {
          KW_MAP[r.value.word] = r.value.id;
        }
      });

      log('keywords resolved', KW_MAP);
      Lampa.Cache.rewriteData('other', CONFIG.cache.ns + '_kwmap', KW_MAP).catch(() => {});
      return KW_MAP;
    })();
    return KW_READY;
  }

  // ════════════════════════════════════════════════════════════
  // 6. ПОСТРОЕНИЕ ЗАПРОСОВ
  // ════════════════════════════════════════════════════════════
  function yearFilterParams() {
    const f = setting(SETTINGS_KEYS.year_filter);
    const y = new Date().getFullYear();
    if (f === 'fresh')   return { 'primary_release_date.gte': `${y - 1}-01-01` };
    if (f === '2000')    return { 'primary_release_date.gte': '2000-01-01' };
    if (f === 'classic') return { 'primary_release_date.lte': '2000-01-01' };
    return {};
  }

  function ratingFilter(base) {
    const min = Number(setting(SETTINGS_KEYS.min_rating)) || 0;
    const out = { ...base };
    if (min > 0) out['vote_average.gte'] = Math.max(min, base.min || 0);
    delete out.min;
    return out;
  }

  function baseDiscoverParams(extra = {}) {
    const p = {
      with_genres: String(CONFIG.genre.horror),
      include_adult: 'false',
      sort_by: 'popularity.desc',
      ...yearFilterParams(),
      ...extra
    };
    return ratingFilter(p);
  }

  // ════════════════════════════════════════════════════════════
  // 7. ДЕДУПЛИКАЦИЯ
  // ════════════════════════════════════════════════════════════
  function makeDeduper() {
    const seen = new Set();
    return (items) => (items || []).filter(it => {
      if (!it || it.id == null) return false;
      if (seen.has(it.id)) return false;
      seen.add(it.id);
      return true;
    });
  }

  function filterWatched(items) {
    if (!setting(SETTINGS_KEYS.hide_watched)) return items;
    try {
      return items.filter(it => {
        const watched = Lampa.Timeline.watched?.(it);
        // watched() возвращает число серий (для сериала) или процент (для фильма)
        return !watched;
      });
    } catch (e) { return items; }
  }

  // ════════════════════════════════════════════════════════════
  // 8. ЗАГРУЗЧИКИ СТРОК
  // ════════════════════════════════════════════════════════════
  const dedupe = makeDeduper();

  function rowFresh() {
    const y = new Date().getFullYear();
    return cached('fresh', CONFIG.cache.ttl.fresh, () =>
      tmdb('discover/movie', baseDiscoverParams({
        'primary_release_date.gte': `${y - 1}-01-01`,
        sort_by: 'primary_release_date.desc',
        'vote_count.gte': CONFIG.ratings.fresh.votes
      }))
    ).then(d => d.results || []);
  }

  function rowTrending() {
    return cached('trending', CONFIG.cache.ttl.trending, () =>
      tmdb('trending/movie/week', {})
    ).then(d => (d.results || []).filter(m => (m.genre_ids || []).includes(CONFIG.genre.horror)));
  }

  function rowTop() {
    return cached('top', CONFIG.cache.ttl.top, () =>
      tmdb('discover/movie', baseDiscoverParams({
        sort_by: 'vote_average.desc',
        'vote_count.gte': CONFIG.ratings.top.votes,
        'vote_average.gte': CONFIG.ratings.top.min
      }))
    ).then(d => d.results || []);
  }

  function rowRecommend() {
    return cached('recommend', CONFIG.cache.ttl.recommend, () =>
      tmdb('discover/movie', baseDiscoverParams({
        with_genres: `${CONFIG.genre.horror},${CONFIG.genre.thriller}`,
        sort_by: 'vote_average.desc',
        'vote_count.gte': CONFIG.ratings.recommend.votes,
        'vote_average.gte': CONFIG.ratings.recommend.min
      }))
    ).then(d => d.results || []);
  }

  function rowMovies() {
    return cached('movies', CONFIG.cache.ttl.movies, () =>
      tmdb('discover/movie', baseDiscoverParams({
        sort_by: 'popularity.desc',
        'vote_count.gte': CONFIG.ratings.movies.votes
      }))
    ).then(d => d.results || []);
  }

  function rowTv() {
    return cached('tv', CONFIG.cache.ttl.tv, () =>
      tmdb('discover/tv', {
        with_genres: `${CONFIG.genre.horror},9648`,  // horror + mystery
        sort_by: 'popularity.desc',
        'vote_count.gte': CONFIG.ratings.tv.votes,
        include_adult: 'false'
      })
    ).then(d => d.results || []);
  }

  function rowAnime() {
    return cached('anime', CONFIG.cache.ttl.anime, () =>
      tmdb('discover/tv', {
        with_genres: String(CONFIG.genre.animation),
        with_original_language: 'ja',
        sort_by: 'popularity.desc',
        'vote_count.gte': CONFIG.ratings.anime.votes
      })
    ).then(d => d.results || []);
  }

  function rowSubgenre(subId) {
    const sg = SUBGENRES.find(s => s.id === subId);
    if (!sg || !sg.keywords.length) return Promise.resolve([]);
    const ids = sg.keywords.map(k => KW_MAP[k]).filter(Boolean);
    if (!ids.length) return Promise.resolve([]);
    const with_keywords = ids.join('|'); // OR
    return cached(`sub_${subId}`, CONFIG.cache.ttl.subgenre, () =>
      tmdb('discover/movie', baseDiscoverParams({
        with_keywords,
        sort_by: 'vote_average.desc',
        'vote_count.gte': CONFIG.ratings.subgenre.votes
      }))
    ).then(d => d.results || []);
  }

  // ════════════════════════════════════════════════════════════
  // 9. «ИСПУГАЙ МЕНЯ» — случайный ужастик
  // ════════════════════════════════════════════════════════════
  async function frightenMe() {
    Lampa.Noty.show(Lampa.Lang.translate('horror_frighten_wait'));
    try {
      const page = 1 + Math.floor(Math.random() * CONFIG.frighten.max_page);
      const data = await tmdb('discover/movie', {
        with_genres: String(CONFIG.genre.horror),
        'vote_count.gte': CONFIG.frighten.min_votes,
        'vote_average.gte': CONFIG.frighten.min_rating,
        sort_by: 'popularity.desc',
        include_adult: 'false',
        page
      });

      const pool = (data.results || []).filter(m => m.poster_path);
      if (!pool.length) throw new Error('empty');

      const pick = pool[Math.floor(Math.random() * pool.length)];
      pick.source = 'tmdb';

      // маленькая "страшилка" для атмосферы
      try {
        const svg = document.getElementById('sprites');
        // просто открываем карточку
      } catch (e) {}

      Lampa.Router.call('full', pick);
    } catch (e) {
      warn('frightenMe failed', e);
      Lampa.Noty.show(Lampa.Lang.translate('horror_frighten_fail'));
    }
  }

  // ════════════════════════════════════════════════════════════
  // 10. CSS
  // ════════════════════════════════════════════════════════════
  (function injectCSS() {
    const css = `
      .horror-page { display:flex; height:100%; overflow:hidden; color:#fff; }
      .horror-page__left { flex:1 1 auto; min-width:0; display:flex; flex-direction:column; overflow:hidden; }

      .horror-page__topbar {
        display:flex; gap:.6em; padding:1em 1.2em .6em; align-items:center;
        flex-wrap:wrap; flex:0 0 auto;
      }
      .horror-chip {
        padding:.5em .9em; border-radius:2em;
        background:rgba(255,255,255,.08); color:#fff;
        font-size:.95em; line-height:1; white-space:nowrap;
        transition:background .15s, transform .15s;
      }
      .horror-chip.focus, .horror-chip:hover { background:rgba(255,255,255,.22); }
      .horror-chip--active { background:#c33 !important; }
      .horror-chip--action { background:#5a1010; }
      .horror-chip--action.focus { background:#a31919; }

      .horror-page__rows {
        flex:1 1 auto; overflow-y:auto; overflow-x:hidden;
        padding-bottom:2em;
        scroll-behavior:smooth;
      }
      .horror-page__rows::-webkit-scrollbar { width:6px; }
      .horror-page__rows::-webkit-scrollbar-thumb { background:rgba(255,255,255,.15); border-radius:3px; }

      .horror-row { margin-bottom:1.5em; }
      .horror-row__head {
        display:flex; align-items:center; justify-content:space-between;
        padding:.4em 1.2em .6em;
      }
      .horror-row__title { font-size:1.15em; font-weight:500; opacity:.95; }
      .horror-row__more {
        font-size:.9em; padding:.4em .8em; border-radius:2em;
        background:rgba(255,255,255,.08);
      }
      .horror-row__more.focus { background:rgba(255,255,255,.22); }

      .horror-row__body {
        display:flex; overflow-x:auto; overflow-y:hidden; gap:.6em;
        padding:0 1.2em; scroll-behavior:smooth;
      }
      .horror-row__body::-webkit-scrollbar { height:0; }

      .horror-card {
        flex:0 0 auto; width:9.5em; cursor:pointer;
        transition:transform .2s; position:relative;
      }
      .horror-card.focus { transform:translateY(-4px) scale(1.03); }
      .horror-card.focus .horror-card__poster { box-shadow:0 0 0 3px #c33, 0 8px 20px rgba(0,0,0,.5); }
      .horror-card__poster {
        width:100%; aspect-ratio:2/3; border-radius:.5em; overflow:hidden;
        background:rgba(255,255,255,.05); position:relative;
        transition:box-shadow .2s;
      }
      .horror-card__poster img { width:100%; height:100%; object-fit:cover; display:block; }
      .horror-card__vote {
        position:absolute; top:.4em; left:.4em;
        padding:.15em .5em; border-radius:.4em; background:rgba(0,0,0,.7);
        font-size:.75em; color:#fc0; font-weight:600;
      }
      .horror-card__title {
        margin-top:.35em; font-size:.85em; line-height:1.2;
        display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;
        overflow:hidden; opacity:.9;
      }

      .horror-page__right {
        flex:0 0 auto; width:min(38%, 520px);
        background:rgba(0,0,0,.4); backdrop-filter:blur(24px);
        overflow:hidden; position:relative; display:flex; flex-direction:column;
        transition:transform .3s;
      }
      .horror-preview__backdrop {
        position:absolute; inset:0; object-fit:cover;
        opacity:.15; pointer-events:none; z-index:0;
      }
      .horror-preview__inner {
        position:relative; z-index:1; padding:2em; overflow-y:auto; flex:1 1 auto;
      }
      .horror-preview__poster {
        width:10em; border-radius:.5em; box-shadow:0 8px 30px rgba(0,0,0,.6);
        margin-bottom:1.2em;
      }
      .horror-preview__title { font-size:1.8em; line-height:1.2; margin-bottom:.4em; }
      .horror-preview__meta {
        font-size:.95em; opacity:.75; margin-bottom:1em;
        display:flex; gap:.8em; flex-wrap:wrap;
      }
      .horror-preview__meta span { display:flex; align-items:center; gap:.3em; }
      .horror-preview__overview {
        font-size:.98em; line-height:1.5; opacity:.85;
        max-height:40vh; overflow-y:auto;
      }
      .horror-preview__empty {
        opacity:.5; text-align:center; padding:4em 2em; font-size:1.1em;
      }

      .horror-empty {
        padding:4em 2em; text-align:center; opacity:.75; font-size:1.05em;
      }
      .horror-empty__icon {
        width:5em; height:5em; margin:0 auto 1em;
        opacity:.35;
      }

      /* Mobile: превью как bottom-sheet */
      @media (max-width: 768px) {
        .horror-page { flex-direction:column; }
        .horror-page__right {
          position:fixed; left:0; right:0; bottom:0;
          width:100%; height:50vh;
          transform:translateY(100%);
          border-top-left-radius:1em; border-top-right-radius:1em;
          box-shadow:0 -10px 30px rgba(0,0,0,.6);
          z-index:50;
        }
        .horror-page__right--visible { transform:translateY(0); }
        .horror-preview__inner { padding:1.4em; }
        .horror-preview__poster { display:none; }
        .horror-preview__title { font-size:1.3em; }
      }
    `;
    const s = document.createElement('style');
    s.type = 'text/css';
    s.textContent = css;
    document.head.appendChild(s);
  })();

  // ════════════════════════════════════════════════════════════
  // 11. КОМПОНЕНТ ГЛАВНОЙ СТРАНИЦЫ
  // ════════════════════════════════════════════════════════════
  function HorrorComponent(object) {
    this.object = object || {};
    this.html = null;
    this.left = null;
    this.rows = null;
    this.right = null;
    this.preview_inner = null;
    this.destroyed = false;
    this.last_focus = null;
    this.current_subgenre = 'all';
    this.row_nodes = [];       // { node, items, onMore }
    this.topbar_focus_index = 0;
  }

  HorrorComponent.prototype.create = function () {
    this.html = document.createElement('div');
    this.html.className = 'horror-page';
    this.html.innerHTML = `
      <div class="horror-page__left">
        <div class="horror-page__topbar"></div>
        <div class="horror-page__rows"></div>
      </div>
      <div class="horror-page__right">
        <div class="horror-preview__inner">
          <div class="horror-preview__empty">${esc(Lampa.Lang.translate('horror_loading'))}</div>
        </div>
      </div>
    `;
    this.left = this.html.querySelector('.horror-page__left');
    this.rows = this.html.querySelector('.horror-page__rows');
    this.right = this.html.querySelector('.horror-page__right');
    this.preview_inner = this.right.querySelector('.horror-preview__inner');
    this.topbar = this.html.querySelector('.horror-page__topbar');

    this.buildTopbar();
  };

  // ── 11.1 Верхняя панель: поджанры + действия ─────────────────
  HorrorComponent.prototype.buildTopbar = function () {
    this.topbar.innerHTML = '';

    // Кнопка «Испугай меня» всегда первая
    const frightenBtn = document.createElement('div');
    frightenBtn.className = 'horror-chip horror-chip--action selector';
    frightenBtn.textContent = Lampa.Lang.translate('horror_frighten');
    frightenBtn.addEventListener('hover:enter', () => frightenMe());
    this.topbar.appendChild(frightenBtn);

    // Чипы поджанров
    SUBGENRES.forEach(sg => {
      const chip = document.createElement('div');
      chip.className = 'horror-chip selector';
      if (sg.id === this.current_subgenre) chip.classList.add('horror-chip--active');
      chip.dataset.sg = sg.id;
      chip.textContent = Lampa.Lang.translate(sg.key);
      chip.addEventListener('hover:enter', () => this.switchSubgenre(sg.id));
      chip.addEventListener('hover:focus', (e) => {
        this.last_focus = e.currentTarget;
        this.scrollFocusIntoView(e.currentTarget);
      });
      this.topbar.appendChild(chip);
    });
  };

  HorrorComponent.prototype.switchSubgenre = function (subId) {
    if (this.destroyed) return;
    this.current_subgenre = subId;
    this.buildTopbar();
    this.loadContent();
  };

  // ── 11.2 Загрузка контента ───────────────────────────────────
  HorrorComponent.prototype.loadContent = async function () {
    if (this.destroyed) return;

    // Индикатор загрузки
    this.rows.innerHTML = `<div class="horror-empty">${esc(Lampa.Lang.translate('horror_loading'))}</div>`;
    this.row_nodes = [];

    // Резолвим ключевые слова, если нужен поджанр
    if (this.current_subgenre !== 'all') {
      await resolveKeywords();
    }

    if (this.destroyed) return;

    // Спека строк
    const specs = this.current_subgenre === 'all'
      ? [
          { title: 'horror_row_fresh',     loader: rowFresh },
          { title: 'horror_row_trending',  loader: rowTrending },
          { title: 'horror_row_top',       loader: rowTop },
          { title: 'horror_row_recommend', loader: rowRecommend },
          { title: 'horror_row_movies',    loader: rowMovies },
          { title: 'horror_row_tv',        loader: rowTv },
          ...(setting(SETTINGS_KEYS.show_anime) ? [{ title: 'horror_row_anime', loader: rowAnime }] : [])
        ]
      : [
          { title: SUBGENRES.find(s => s.id === this.current_subgenre)?.key || 'horror_title',
            loader: () => rowSubgenre(this.current_subgenre) }
        ];

    // Прогрессивный рендер
    this.rows.innerHTML = '';
    let anySuccess = false;

    for (const spec of specs) {
      if (this.destroyed) return;
      const placeholder = document.createElement('div');
      placeholder.className = 'horror-row';
      placeholder.innerHTML = `
        <div class="horror-row__head">
          <div class="horror-row__title">${esc(Lampa.Lang.translate(spec.title))}</div>
        </div>
        <div class="horror-row__body">
          <div class="horror-empty" style="padding:1.5em">${esc(Lampa.Lang.translate('horror_loading'))}</div>
        </div>
      `;
      this.rows.appendChild(placeholder);

      spec.loader()
        .then(items => {
          if (this.destroyed) return;
          const clean = filterWatched(dedupe(items));
          if (clean.length) {
            anySuccess = true;
            this.renderRow(placeholder, spec, clean);
          } else {
            placeholder.remove();
          }
        })
        .catch(err => {
          warn('row failed', spec.title, err);
          placeholder.remove();
        });
    }

    // Если вообще ничего не загрузилось — пустой экран
    setTimeout(() => {
      if (this.destroyed) return;
      if (!anySuccess && !this.rows.querySelector('.horror-row')) {
        this.showError();
      }
    }, 6000);
  };

  HorrorComponent.prototype.showError = function () {
    if (this.rows.querySelector('.horror-empty--error')) return;
    const box = document.createElement('div');
    box.className = 'horror-empty horror-empty--error';
    box.innerHTML = `
      <div class="horror-empty__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4M12 16h.01"/>
        </svg>
      </div>
      <div>${esc(Lampa.Lang.translate('horror_error_network'))}</div>
    `;
    this.rows.appendChild(box);
  };

  // ── 11.3 Рендер строки ───────────────────────────────────────
  HorrorComponent.prototype.renderRow = function (rowNode, spec, items) {
    const body = rowNode.querySelector('.horror-row__body');
    body.innerHTML = '';

    // Показываем не больше CONFIG.row_size
    const visible = items.slice(0, CONFIG.row_size);

    visible.forEach(movie => {
      body.appendChild(this.buildCard(movie));
    });

    // Кнопка «Ещё» — открывает полный список в новом Activity
    if (items.length >= CONFIG.row_size) {
      const head = rowNode.querySelector('.horror-row__head');
      const more = document.createElement('div');
      more.className = 'horror-row__more selector';
      more.textContent = Lampa.Lang.translate('more');
      more.addEventListener('hover:enter', () => {
        Lampa.Activity.push({
          url: '',
          title: Lampa.Lang.translate(spec.title),
          component: 'category_full',
          source: 'tmdb',
          genres: CONFIG.genre.horror,
          page: 1
        });
      });
      more.addEventListener('hover:focus', () => { this.last_focus = more; });
      head.appendChild(more);
    }

    this.row_nodes.push({ node: rowNode, items, spec });
  };

  // ── 11.4 Карточка ────────────────────────────────────────────
  HorrorComponent.prototype.buildCard = function (movie) {
    const el = document.createElement('div');
    el.className = 'horror-card selector';
    const poster = imgUrl(movie.poster_path, 'w300') || './img/img_broken.svg';
    const title  = movie.title || movie.name || '';
    const vote   = movie.vote_average ? parseFloat(movie.vote_average).toFixed(1) : '';

    el.innerHTML = `
      <div class="horror-card__poster">
        ${vote ? `<div class="horror-card__vote">★ ${esc(vote)}</div>` : ''}
        <img src="${esc(poster)}" loading="lazy" onerror="this.src='./img/img_broken.svg'">
      </div>
      <div class="horror-card__title">${esc(title)}</div>
    `;

    el.addEventListener('hover:focus', () => {
      this.last_focus = el;
      this.showPreview(movie);
      this.scrollFocusIntoView(el);
    });

    el.addEventListener('hover:touch', () => {
      this.last_focus = el;
      this.showPreview(movie, true);   // показать превью на мобиле
    });

    el.addEventListener('hover:enter', () => {
      this.openCard(movie);
    });

    return el;
  };

  HorrorComponent.prototype.openCard = function (movie) {
    const data = { ...movie, source: 'tmdb' };
    Lampa.Router.call('full', data);
  };

  // ── 11.5 Превью ──────────────────────────────────────────────
  HorrorComponent.prototype.showPreview = function (movie, mobile_open = false) {
    if (!this.preview_inner) return;

    const is_mobile = Lampa.Platform.screen('mobile');

    const backdrop = imgUrl(movie.backdrop_path, 'w780');
    const poster   = imgUrl(movie.poster_path, 'w342') || './img/img_broken.svg';
    const title    = movie.title || movie.name || '';
    const year     = (movie.release_date || movie.first_air_date || '').slice(0, 4);
    const rating   = movie.vote_average ? parseFloat(movie.vote_average).toFixed(1) : '';
    const votes    = movie.vote_count || 0;
    const overview = movie.overview || '';
    const genres   = (movie.genre_ids || []).map(id => {
      // Небольшой маппинг самых частых жанров — не тянем TMDB ради этого
      const g = { 27:'Ужасы', 53:'Триллер', 9648:'Детектив', 18:'Драма', 878:'Фантастика', 14:'Фэнтези' };
      return g[id];
    }).filter(Boolean);

    this.preview_inner.innerHTML = `
      ${backdrop ? `<img class="horror-preview__backdrop" src="${esc(backdrop)}" onerror="this.remove()">` : ''}
      <img class="horror-preview__poster" src="${esc(poster)}" onerror="this.src='./img/img_broken.svg'">
      <div class="horror-preview__title">${esc(title)}</div>
      <div class="horror-preview__meta">
        ${year ? `<span>${esc(year)}</span>` : ''}
        ${rating ? `<span>★ ${esc(rating)} <small style="opacity:.6">(${votes})</small></span>` : ''}
        ${genres.length ? `<span>${esc(genres.join(', '))}</span>` : ''}
      </div>
      <div class="horror-preview__overview">${esc(overview || Lampa.Lang.translate('full_notext'))}</div>
    `;

    // Мобильное превью — bottom sheet
    if (is_mobile && mobile_open) {
      this.right.classList.add('horror-page__right--visible');
      // Скрываем через 3 секунды при бездействии
      clearTimeout(this._preview_timer);
      this._preview_timer = setTimeout(() => {
        if (this.destroyed) return;
        this.right.classList.remove('horror-page__right--visible');
      }, 3500);
    }
  };

  // ── 11.6 Скролл к элементу ───────────────────────────────────
  HorrorComponent.prototype.scrollFocusIntoView = function (el) {
    if (!el || !this.rows) return;
    const rect = el.getBoundingClientRect();
    const parent_rect = this.rows.getBoundingClientRect();
    // Если элемент вне видимой области — подскроллить
    if (rect.top < parent_rect.top || rect.bottom > parent_rect.bottom) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    // Горизонтальный скролл внутри строки
    const row_body = el.closest('.horror-row__body');
    if (row_body) {
      const r = el.getBoundingClientRect();
      const rb = row_body.getBoundingClientRect();
      if (r.left < rb.left) row_body.scrollLeft += r.left - rb.left - 20;
      else if (r.right > rb.right) row_body.scrollLeft += r.right - rb.right + 20;
    }
  };

  // ── 11.7 Жизненный цикл контроллера ──────────────────────────
  HorrorComponent.prototype.start = function () {
    const self = this;

    // Регистрируем свой контроллер поверх стандартного content
    Lampa.Controller.add('horror', {
      invisible: true,
      toggle: function () {
        const all = Array.from(self.html.querySelectorAll('.selector'));
        Lampa.Controller.collectionSet(self.html);
        if (self.last_focus && self.last_focus.isConnected) {
          Lampa.Controller.collectionFocus(self.last_focus, self.html);
        } else {
          Lampa.Controller.collectionFocus(all[0], self.html);
        }
      },
      up: function () {
        if (Lampa.Navigator && Lampa.Navigator.canmove('up')) Lampa.Navigator.move('up');
        else if (self.rows) self.rows.scrollTop -= 100;
      },
      down: function () {
        if (Lampa.Navigator && Lampa.Navigator.canmove('down')) Lampa.Navigator.move('down');
        else if (self.rows) self.rows.scrollTop += 100;
      },
      left: function () {
        if (Lampa.Navigator && Lampa.Navigator.canmove('left')) Lampa.Navigator.move('left');
        else Lampa.Controller.toggle('menu');
      },
      right: function () {
        if (Lampa.Navigator && Lampa.Navigator.canmove('right')) Lampa.Navigator.move('right');
      },
      back: function () {
        Lampa.Activity.backward();
      }
    });

    Lampa.Controller.toggle('horror');

    // Загружаем контент
    this.loadContent();
  };

  HorrorComponent.prototype.render = function (js) {
    return js ? this.html : $(this.html);
  };

  HorrorComponent.prototype.destroy = function () {
    this.destroyed = true;
    clearTimeout(this._preview_timer);
    if (this.html) this.html.remove();
    this.html = null;
  };

  HorrorComponent.prototype.pause = function () {};
  HorrorComponent.prototype.stop  = function () {};

  // ════════════════════════════════════════════════════════════
  // 12. РЕГИСТРАЦИЯ НАСТРОЕК
  // ════════════════════════════════════════════════════════════
  function registerSettings() {
    // Инициализируем дефолты через Params (чтобы Storage.field работал)
    Lampa.Params.trigger(SETTINGS_KEYS.show_anime, true);
    Lampa.Params.trigger(SETTINGS_KEYS.hide_watched, false);
    Lampa.Params.select(SETTINGS_KEYS.min_rating, {
      '0': '0', '5': '5', '6': '6', '7': '7', '8': '8'
    }, 0);
    Lampa.Params.select(SETTINGS_KEYS.year_filter, {
      'all':     'horror_set_year_all',
      'fresh':   'horror_set_year_fresh',
      '2000':    'horror_set_year_2000',
      'classic': 'horror_set_year_classic'
    }, 'all');

    // Регистрируем компонент настроек
    const icon = `<svg width="37" height="37" viewBox="0 0 37 37" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.5 2C9.4 2 2 9.4 2 18.5S9.4 35 18.5 35 35 27.6 35 18.5 27.6 2 18.5 2zm0 4c3.5 0 6.7 1.4 9 3.7l-4.3 4.3c-1.3-.8-2.9-1.3-4.7-1.3-4.7 0-8.5 3.8-8.5 8.5s3.8 8.5 8.5 8.5 8.5-3.8 8.5-8.5c0-1.8-.5-3.4-1.3-4.7l4.3-4.3c2.3 2.3 3.7 5.5 3.7 9" stroke="white" stroke-width="2"/>
    </svg>`;

    Lampa.SettingsApi.addComponent({
      component: CONFIG.settings_component,
      icon: icon,
      name: Lampa.Lang.translate('horror_settings'),
      after: 'more'
    });

    Lampa.SettingsApi.addParam({
      component: CONFIG.settings_component,
      param: {
        name: SETTINGS_KEYS.min_rating,
        type: 'select',
        values: { '0': '0', '5': '5', '6': '6', '7': '7', '8': '8' },
        default: 0
      },
      field: {
        name: Lampa.Lang.translate('horror_set_min_rating'),
        description: Lampa.Lang.translate('horror_set_min_rating_d')
      }
    });

    Lampa.SettingsApi.addParam({
      component: CONFIG.settings_component,
      param: {
        name: SETTINGS_KEYS.year_filter,
        type: 'select',
        values: {
          'all':     'horror_set_year_all',
          'fresh':   'horror_set_year_fresh',
          '2000':    'horror_set_year_2000',
          'classic': 'horror_set_year_classic'
        },
        default: 'all'
      },
      field: { name: Lampa.Lang.translate('horror_set_year') }
    });

    Lampa.SettingsApi.addParam({
      component: CONFIG.settings_component,
      param: {
        name: SETTINGS_KEYS.show_anime,
        type: 'trigger',
        default: true
      },
      field: { name: Lampa.Lang.translate('horror_set_anime') }
    });

    Lampa.SettingsApi.addParam({
      component: CONFIG.settings_component,
      param: {
        name: SETTINGS_KEYS.hide_watched,
        type: 'trigger',
        default: false
      },
      field: { name: Lampa.Lang.translate('horror_set_hide_watched') }
    });
  }

  // ════════════════════════════════════════════════════════════
  // 13. РЕГИСТРАЦИЯ В МЕНЮ LAMPA
  // ════════════════════════════════════════════════════════════
  function registerMenu() {
    const icon = `<svg width="37" height="37" viewBox="0 0 37 37" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.5 3C9.9 3 3 9.9 3 18.5S9.9 34 18.5 34 34 27.1 34 18.5 27.1 3 18.5 3zm0 4c2.6 0 5 1 6.9 2.5L20 15c-.5-.1-.9-.2-1.5-.2-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4c0-.5-.1-1-.2-1.4l5.5-5.4C29 13.5 30 15.9 30 18.5 30 24.9 24.9 30 18.5 30S7 24.9 7 18.5" stroke="white" stroke-width="2"/>
    </svg>`;

    // Кнопка в главном меню
    Lampa.Menu.addButton(icon, Lampa.Lang.translate('horror_title'), function () {
      Lampa.Activity.push({
        url: '',
        title: Lampa.Lang.translate('horror_title'),
        component: CONFIG.component,
        page: 1,
        source: 'tmdb'
      });
    });
  }

  // ════════════════════════════════════════════════════════════
  // 14. INIT
  // ════════════════════════════════════════════════════════════
  function init() {
    // Регистрируем компонент активности
    Lampa.Component.add(CONFIG.component, HorrorComponent);

    // Регистрируем настройки
    registerSettings();

    // Ждём готовности Lampa, чтобы меню уже было построено
    const boot = () => {
      try {
        registerMenu();
      } catch (e) {
        warn('menu registration failed', e);
      }

      // Прогреваем ключевые слова в фоне (не блокируя UI)
      setTimeout(() => resolveKeywords().catch(() => {}), 3000);
    };

    if (window.appready) boot();
    else Lampa.Listener.follow('app', (e) => { if (e.type === 'ready') boot(); });
  }

  if (window.appready) init();
  else Lampa.Listener.follow('app', (e) => { if (e.type === 'ready') init(); });

})();
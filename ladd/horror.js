/* ============================================================================
 * Horror.js — расширенный плагин ужасов для Lampa
 * v2.0 — с поджанрами, настройками, страшилкой и полной локализацией
 * ==========================================================================*/
(function () {
  'use strict';

  // ==========================================================================
  // КОНФИГУРАЦИЯ
  // ==========================================================================
  const CONFIG = {
    cacheNs: 'horror_v2',
    ttl: {
      keywords: 60 * 24 * 30,
      recommend: 60 * 24 * 7,
      movies: 60 * 24 * 3,
      tv: 60 * 24 * 3,
      anime: 60 * 24 * 3,
      fresh: 60 * 24,
      trending: 60 * 12,
      top: 60 * 24 * 3,
    },
    ratings: {
      recommend: { min: 7.5, votes: 1000 },
      movies: { votes: 500 },
      tv: { votes: 300 },
      anime: { votes: 200 },
      fresh: { votes: 30 },
      trending: { votes: 100 },
      top: { min: 8, votes: 2000 },
    },
  };

  const DEBUG = false;
  const log = (...a) => { if (DEBUG) console.log('[Horror]', ...a); };
  const warn = (...a) => { if (DEBUG) console.warn('[Horror]', ...a); };

  // ==========================================================================
  // ЛОКАЛИЗАЦИЯ
  // ==========================================================================
  Lampa.Lang.add({
    horror_title:        { ru: 'Ужасы', en: 'Horror', uk: 'Жахи', be: 'Жахі' },
    horror_recommend:    { ru: 'Рекомендации', en: 'Recommended' },
    horror_movies:       { ru: 'Фильмы', en: 'Movies' },
    horror_tv:           { ru: 'Сериалы', en: 'TV Shows' },
    horror_anime:        { ru: 'Аниме', en: 'Anime' },
    horror_fresh:        { ru: 'Новинки', en: 'Fresh' },
    horror_trending:     { ru: 'В тренде', en: 'Trending' },
    horror_top:          { ru: 'Топ ужасов', en: 'Top horror' },
    horror_continue:     { ru: 'Продолжить просмотр', en: 'Continue' },
    horror_subgenres:    { ru: 'Поджанры', en: 'Subgenres' },
    horror_frighten_me:  { ru: 'Испугай меня', en: 'Frighten me' },
    horror_search:       { ru: 'Поиск ужасов', en: 'Search horror' },
    horror_load_fail:    { ru: 'Не удалось загрузить. Проверьте соединение или включите TMDB Proxy.', en: 'Failed to load. Check connection or enable TMDB Proxy.' },
    horror_empty:        { ru: 'Здесь пока пусто', en: 'Empty here' },
    horror_no_frighten:  { ru: 'Не удалось подобрать фильм', en: 'Could not pick a movie' },
    horror_frighten_hint:{ ru: 'Не двигайся…', en: "Don't move…" },
    horror_frighten_open:{ ru: 'Открыть карточку', en: 'Open card' },
    horror_frighten_again:{ ru: 'Ещё раз', en: 'Again' },
    horror_sub_all:      { ru: 'Все', en: 'All' },
    horror_sub_slasher:  { ru: 'Слэшеры', en: 'Slashers' },
    horror_sub_zombie:   { ru: 'Зомби', en: 'Zombie' },
    horror_sub_vampire:  { ru: 'Вампиры', en: 'Vampires' },
    horror_sub_ghost:    { ru: 'Призраки', en: 'Ghosts' },
    horror_sub_psycho:   { ru: 'Психологические', en: 'Psychological' },
    horror_sub_mystic:   { ru: 'Мистика', en: 'Mystic' },
    horror_sub_found:    { ru: 'Найденная плёнка', en: 'Found footage' },
    horror_sub_demons:   { ru: 'Демоны', en: 'Demons' },
    horror_sub_witches:  { ru: 'Ведьмы', en: 'Witches' },
    horror_sub_monster:  { ru: 'Монстры', en: 'Monsters' },
    horror_set_title:    { ru: 'Ужасы', en: 'Horror' },
    horror_set_rating:   { ru: 'Минимальный рейтинг', en: 'Minimum rating' },
    horror_set_year:     { ru: 'Год выпуска', en: 'Year' },
    horror_set_year_any: { ru: 'Все', en: 'Any' },
    horror_set_year_fresh:{ ru: 'Новинки', en: 'Recent' },
    horror_set_year_2000:{ ru: '2000-е', en: '2000s' },
    horror_set_year_classic:{ ru: 'Классика (до 2000)', en: 'Classic' },
    horror_set_hide:     { ru: 'Скрывать просмотренное', en: 'Hide watched' },
    horror_set_anime:    { ru: 'Показывать аниме', en: 'Show anime' },
  });

  const t = (key) => Lampa.Lang.translate(key);

  // ==========================================================================
  // ХЕЛПЕРЫ
  // ==========================================================================
  function escapeHTML(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getWatchedIds() {
    // Собираем ID просмотренного из истории Lampa
    try {
      const favorite = Lampa.Favorite.get({ type: 'history' }) || [];
      return new Set(favorite.map((c) => c.id));
    } catch (e) {
      return new Set();
    }
  }

  function isWatched(card) {
    try {
      if (Lampa.Favorite.check && card) {
        const status = Lampa.Favorite.check(card);
        return !!(status && (status.history || status.viewed));
      }
    } catch (e) {}
    return false;
  }

  function isEnabled(name, def) {
    const v = Lampa.Storage.get(name, def === undefined ? 'false' : def);
    return v === true || v === 'true';
  }

  function getSetting(name, def) {
    const v = Lampa.Storage.get(name, def);
    return v === undefined || v === '' ? def : v;
  }

  // ==========================================================================
  // БАЗА ID КЛЮЧЕВЫХ СЛОВ
  // Стабильные ID из TMDB — экономят десятки запросов при первом запуске
  // ==========================================================================
  const KEYWORD_IDS = {
    horror: 315058,
    slasher: 12339,
    zombie: 12377,
    vampire: 3133,
    ghost: 12392,
    'found footage': 163053,
    demon: 205554,
    witch: 12565,
    monster: 1299,
    'psychological horror': 284303,
    occult: 9320,
    'supernatural': 6152,
    'haunted house': 3405,
    'possession': 11800,
    'serial killer': 10714,
    gore: 10292,
    splatter: 10226,
    'evil doll': 208456,
    'folk horror': 220071,
    cannibal: 10222,
  };

  // Дополнительные слова, ID которых могут быть нестабильными — подгружаются динамически
  const EXTRA_KEYWORDS = ['cosmic horror', 'body horror', 'psychological thriller', 'satanic', 'exorcism'];

  // ==========================================================================
  // API-СЛОЙ
  // ==========================================================================
  const network = new Lampa.Reguest();
  const seenIds = new Set(); // глобальный дедуп между строками

  function dedupe(items) {
    if (!Array.isArray(items)) return [];
    const result = [];
    for (const it of items) {
      if (!it || !it.id) continue;
      if (seenIds.has(it.id)) continue;
      seenIds.add(it.id);
      result.push(it);
    }
    return result;
  }

  function buildUrl(path, params) {
    const parts = [];
    for (const k in params) {
      if (params[k] === undefined || params[k] === null) continue;
      parts.push(`${k}=${encodeURIComponent(params[k])}`);
    }
    return path + (path.indexOf('?') === -1 ? '?' : '&') + parts.join('&');
  }

  function tmdbGet(path, params, ttl) {
    const url = buildUrl(path, Object.assign({ api_key: Lampa.TMDB.key(), language: Lampa.Storage.field('tmdb_lang') || 'ru-RU' }, params || {}));
    const cacheKey = CONFIG.cacheNs + ':' + url;

    return new Promise((resolve, reject) => {
      Lampa.Cache.getDataAnyCase('other', cacheKey, ttl).then((cached) => {
        if (cached && cached.results) return resolve(cached);

        network.silent(Lampa.TMDB.api(url), (json) => {
          try { Lampa.Cache.rewriteData('other', cacheKey, json).catch(() => {}); } catch (e) {}
          resolve(json);
        }, (err) => reject(err), false, { timeout: 10000 });
      }).catch(() => {
        network.silent(Lampa.TMDB.api(url), resolve, reject, false, { timeout: 10000 });
      });
    });
  }

  // ==========================================================================
  // СБОРЩИКИ ЗАПРОСОВ
  // ==========================================================================
  function userRatingFilter() {
    const min = parseFloat(getSetting('horror_min_rating', '0'));
    return min > 0 ? { 'vote_average.gte': min } : {};
  }

  function userYearFilter() {
    const mode = getSetting('horror_year', 'any');
    const y = new Date().getFullYear();
    if (mode === 'fresh')   return { 'primary_release_date.gte': `${y - 1}-01-01` };
    if (mode === '2000')    return { 'primary_release_date.gte': '2000-01-01', 'primary_release_date.lte': '2009-12-31' };
    if (mode === 'classic') return { 'primary_release_date.lte': '1999-12-31' };
    return {};
  }

  function mergeFilters(base, extra) {
    return Object.assign({}, base, extra);
  }

  // Фильтр по ключевому слову (для поджанров)
  function keywordFilter(kw) {
    const id = KEYWORD_IDS[kw];
    return id ? { with_keywords: id } : {};
  }

  // Рекомендации
  function loadRecommend() {
    return tmdbGet('discover/movie', mergeFilters({
      with_genres: '27,53',
      sort_by: 'vote_average.desc',
      'vote_average.gte': CONFIG.ratings.recommend.min,
      'vote_count.gte': CONFIG.ratings.recommend.votes,
      include_adult: false,
    }, mergeFilters(userRatingFilter(), userYearFilter())), CONFIG.ttl.recommend)
      .then((r) => ({ title: t('horror_recommend'), results: dedupe(r.results || []) }));
  }

  // Фильмы
  function loadMovies() {
    return tmdbGet('discover/movie', mergeFilters({
      with_genres: '27',
      sort_by: 'popularity.desc',
      'vote_count.gte': CONFIG.ratings.movies.votes,
      include_adult: false,
    }, mergeFilters(userRatingFilter(), userYearFilter())), CONFIG.ttl.movies)
      .then((r) => ({ title: t('horror_movies'), results: dedupe(r.results || []) }));
  }

  // Сериалы (без жанра ужасов, т.к. TMDB их часто не помечает — фильтруем по ключевому слову)
  function loadTV() {
    return tmdbGet('discover/tv', mergeFilters({
      with_keywords: KEYWORD_IDS.horror,
      sort_by: 'popularity.desc',
      'vote_count.gte': CONFIG.ratings.tv.votes,
      include_adult: false,
    }, mergeFilters(userRatingFilter(), userYearFilter())), CONFIG.ttl.tv)
      .then((r) => ({ title: t('horror_tv'), results: dedupe(r.results || []) }));
  }

  // Аниме
  function loadAnime() {
    if (!isEnabled('horror_show_anime', 'true')) return Promise.resolve(null);
    return tmdbGet('discover/tv', {
      with_genres: '16',
      with_original_language: 'ja',
      with_keywords: KEYWORD_IDS.horror,
      sort_by: 'popularity.desc',
      'vote_count.gte': CONFIG.ratings.anime.votes,
      include_adult: false,
    }, CONFIG.ttl.anime)
      .then((r) => ({ title: t('horror_anime'), results: dedupe(r.results || []) }));
  }

  // Новинки
  function loadFresh() {
    const y = new Date().getFullYear();
    return tmdbGet('discover/movie', {
      with_genres: '27',
      sort_by: 'primary_release_date.desc',
      'primary_release_date.gte': `${y - 1}-01-01`,
      'vote_count.gte': CONFIG.ratings.fresh.votes,
      include_adult: false,
    }, CONFIG.ttl.fresh)
      .then((r) => ({ title: t('horror_fresh'), results: dedupe(r.results || []) }));
  }

  // Тренды
  function loadTrending() {
    return tmdbGet('trending/movie/week', {}, CONFIG.ttl.trending)
      .then((r) => {
        const filtered = (r.results || []).filter((it) => (it.genre_ids || []).indexOf(27) !== -1);
        return { title: t('horror_trending'), results: dedupe(filtered) };
      });
  }

  // Топ
  function loadTop() {
    return tmdbGet('discover/movie', mergeFilters({
      with_genres: '27',
      sort_by: 'vote_average.desc',
      'vote_average.gte': CONFIG.ratings.top.min,
      'vote_count.gte': CONFIG.ratings.top.votes,
      include_adult: false,
    }, userYearFilter()), CONFIG.ttl.top)
      .then((r) => ({ title: t('horror_top'), results: dedupe(r.results || []) }));
  }

  // Продолжить просмотр
  function loadContinue() {
    if (!isEnabled('horror_hide_watched', 'false')) {
      // Не фильтруем — просто берём историю
    }
    try {
      const history = (Lampa.Favorite.get({ type: 'history' }) || []);
      const horrorHistory = history.filter((c) => {
        // Простая эвристика: жанр 27 или ключевое слово
        return (c.genre_ids || []).indexOf(27) !== -1 || (c.genres || []).some((g) => g.id === 27);
      }).slice(0, 15);

      if (!horrorHistory.length) return Promise.resolve(null);
      return Promise.resolve({ title: t('horror_continue'), results: dedupe(horrorHistory) });
    } catch (e) {
      return Promise.resolve(null);
    }
  }

  // Скрытие просмотренного
  function applyWatchedFilter(rows) {
    if (!isEnabled('horror_hide_watched', 'false')) return rows;
    return rows.map((row) => {
      if (!row) return row;
      row.results = (row.results || []).filter((c) => !isWatched(c));
      return row;
    }).filter((row) => row && row.results && row.results.length);
  }

  // ==========================================================================
  // ПОДЖАНРЫ
  // ==========================================================================
  const SUBGENRES = [
    { id: 'all',      titleKey: 'horror_sub_all',     kw: null },
    { id: 'slasher',  titleKey: 'horror_sub_slasher', kw: 'slasher' },
    { id: 'zombie',   titleKey: 'horror_sub_zombie',  kw: 'zombie' },
    { id: 'vampire',  titleKey: 'horror_sub_vampire', kw: 'vampire' },
    { id: 'ghost',    titleKey: 'horror_sub_ghost',   kw: 'ghost' },
    { id: 'psycho',   titleKey: 'horror_sub_psycho',  kw: 'psychological horror' },
    { id: 'mystic',   titleKey: 'horror_sub_mystic',  kw: 'supernatural' },
    { id: 'found',    titleKey: 'horror_sub_found',   kw: 'found footage' },
    { id: 'demons',   titleKey: 'horror_sub_demons',  kw: 'demon' },
    { id: 'witches',  titleKey: 'horror_sub_witches', kw: 'witch' },
    { id: 'monster',  titleKey: 'horror_sub_monster', kw: 'monster' },
  ];

  function openSubgenre(sub) {
    if (sub.id === 'all') {
      openHorrorMain();
      return;
    }
    const filter = Object.assign(
      { with_genres: 27 },
      keywordFilter(sub.kw),
      userYearFilter(),
      userRatingFilter()
    );
    Lampa.Activity.push({
      url: 'discover/movie',
      title: t(sub.titleKey),
      component: 'category_full',
      source: 'tmdb',
      filter: filter,
      page: 1,
    });
  }

  // ==========================================================================
  // ИСПУГАЙ МЕНЯ
  // ==========================================================================
  function playScreech() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(1800, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.4);
      osc1.frequency.exponentialRampToValueAtTime(2200, ctx.currentTime + 0.9);

      osc2.type = 'square';
      osc2.frequency.setValueAtTime(60, ctx.currentTime);
      osc2.frequency.linearRampToValueAtTime(30, ctx.currentTime + 1.2);

      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      filter.Q.value = 8;

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);

      osc1.connect(filter).connect(gain).connect(ctx.destination);
      osc2.connect(gain);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 1.4);
      osc2.stop(ctx.currentTime + 1.4);
    } catch (e) {
      warn('screech failed', e);
    }
  }

  function frightenMe() {
    const overlay = document.createElement('div');
    overlay.className = 'horror-scare';
    overlay.innerHTML = `
      <div class="horror-scare__eyes">
        <div class="horror-scare__eye"></div>
        <div class="horror-scare__eye"></div>
      </div>
      <div class="horror-scare__text">${escapeHTML(t('horror_frighten_hint'))}</div>
    `;
    document.body.appendChild(overlay);

    // Плавное появление чёрного фона
    requestAnimationFrame(() => overlay.classList.add('active'));

    // Этап 1: показать глаза
    setTimeout(() => {
      overlay.querySelector('.horror-scare__eyes').style.opacity = '1';
    }, 2200);

    // Этап 2: скрим + вспышка
    setTimeout(() => {
      playScreech();
      overlay.classList.add('horror-scare--flash');
      setTimeout(() => overlay.classList.remove('horror-scare--flash'), 90);
    }, 4200);

    // Этап 3: получить случайный фильм и показать варианты
    setTimeout(async () => {
      try {
        const page = 1 + Math.floor(Math.random() * 5);
        const res = await tmdbGet('discover/movie', {
          with_genres: '27',
          sort_by: 'vote_average.desc',
          'vote_average.gte': 6.5,
          'vote_count.gte': 300,
          include_adult: false,
          page: page,
        }, 60 * 6);

        const pool = (res.results || []).filter((c) => c.backdrop_path || c.poster_path);
        if (!pool.length) throw new Error('empty pool');
        const pick = pool[Math.floor(Math.random() * pool.length)];

        overlay.innerHTML = `
          <div class="horror-scare__reveal">
            <div class="horror-scare__poster" style="background-image:url(${escapeHTML(Lampa.TMDB.image('t/p/w500/' + (pick.poster_path || pick.backdrop_path)))});"></div>
            <div class="horror-scare__title">${escapeHTML(pick.title || pick.name || '')}</div>
            <div class="horror-scare__year">${escapeHTML((pick.release_date || '').slice(0, 4))} · ⭐ ${escapeHTML(String(pick.vote_average || 0))}</div>
            <div class="horror-scare__actions">
              <div class="horror-scare__btn horror-scare__btn--primary selector">${escapeHTML(t('horror_frighten_open'))}</div>
              <div class="horror-scare__btn selector">${escapeHTML(t('horror_frighten_again'))}</div>
            </div>
          </div>
        `;

        const btns = overlay.querySelectorAll('.horror-scare__btn');
        btns[0].addEventListener('hover:enter', () => {
          closeScare(overlay);
          setTimeout(() => {
            Lampa.Router.call('full', {
              id: pick.id,
              source: 'tmdb',
              card: pick,
              method: pick.name ? 'tv' : 'movie',
            });
          }, 200);
        });
        btns[1].addEventListener('hover:enter', () => {
          closeScare(overlay);
          setTimeout(frightenMe, 300);
        });

        // Также закрытие по back
        overlay._backHandler = () => closeScare(overlay);
        Lampa.Controller.add('horror_scare', {
          toggle: () => {
            Lampa.Controller.collectionSet(overlay);
            Lampa.Controller.collectionFocus(btns[0], overlay);
          },
          back: () => closeScare(overlay),
          left: () => Lampa.Navigator.move('left'),
          right: () => Lampa.Navigator.move('right'),
          up: () => Lampa.Navigator.move('up'),
          down: () => Lampa.Navigator.move('down'),
        });
        Lampa.Controller.toggle('horror_scare');
      } catch (e) {
        warn('frighten failed', e);
        Lampa.Noty.show(t('horror_no_frighten'));
        closeScare(overlay);
      }
    }, 4800);
  }

  function closeScare(overlay) {
    overlay.classList.remove('active');
    setTimeout(() => {
      overlay.remove();
      Lampa.Controller.toggle('content');
    }, 400);
  }

  // ==========================================================================
  // КОМПОНЕНТ "УЖАСЫ"
  // ==========================================================================
  const COMPONENT_NAME = 'horror_page';

  class HorrorPage {
    constructor(object) {
      this.object = object || {};
      this.params = this.object.params || {};
      this.html = document.createElement('div');
      this.html.className = 'horror-page';
      this.rows = [];
      this.rowInstances = [];
      this.previewCard = null;
      this.scroll = null;
      this.lastFocused = null;
    }

    create(body) {
      this.buildLayout();
      this.scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
      this.scroll.minus();
      this.scroll.body(true).classList.add('horror-page__rows');
      this.left.appendChild(this.scroll.render(true));
      if (body && body[0]) body[0].appendChild(this.html);
      this.loadData();
    }

    buildLayout() {
      // Управление (поджанры + испугай меня)
      const controls = document.createElement('div');
      controls.className = 'horror-page__controls';

      SUBGENRES.forEach((sub) => {
        const btn = document.createElement('div');
        btn.className = 'horror-page__control selector';
        btn.textContent = t(sub.titleKey);
        btn.addEventListener('hover:enter', () => openSubgenre(sub));
        btn.addEventListener('hover:focus', () => this.scroll.update(btn, true));
        controls.appendChild(btn);
      });

      const scareBtn = document.createElement('div');
      scareBtn.className = 'horror-page__control horror-page__control--scare selector';
      scareBtn.textContent = '💀 ' + t('horror_frighten_me');
      scareBtn.addEventListener('hover:enter', frightenMe);
      scareBtn.addEventListener('hover:focus', () => this.scroll.update(scareBtn, true));
      controls.appendChild(scareBtn);

      this.html.appendChild(controls);

      // Тело: слева строки, справа превью
      const body = document.createElement('div');
      body.className = 'horror-page__body';

      this.left = document.createElement('div');
      this.left.className = 'horror-page__left';

      this.right = document.createElement('div');
      this.right.className = 'horror-page__right';
      this.right.innerHTML = '<div class="horror-page__preview"></div>';

      body.appendChild(this.left);
      body.appendChild(this.right);
      this.html.appendChild(body);
    }

    async loadData() {
      seenIds.clear();
      Lampa.Loading.start(() => {});
      Lampa.Loading.setText(t('loading') + '...');

      const loaders = [
        loadRecommend(),
        loadMovies(),
        loadFresh(),
        loadTrending(),
        loadTop(),
        loadTV(),
        loadAnime(),
        loadContinue(),
      ];

      const results = await Promise.allSettled(loaders);

      const rows = results
        .map((r) => (r.status === 'fulfilled' ? r.value : null))
        .filter((r) => r && r.results && r.results.length);

      const filtered = applyWatchedFilter(rows);

      Lampa.Loading.stop();

      if (!filtered.length) {
        this.renderEmpty();
      } else {
        filtered.forEach((row) => this.renderRow(row));
        setTimeout(() => Lampa.Layer.update(this.html), 100);
      }
    }

    renderEmpty() {
      const empty = new Lampa.Empty({
        title: t('horror_empty'),
        descr: t('horror_load_fail'),
      });
      this.html.appendChild(empty.render(true));
    }

    renderRow(row) {
      const line = Lampa.Maker.make('Line', {
        title: row.title,
        results: row.results,
        total_pages: Math.ceil((row.results.length || 0) / 20),
        url: 'discover/movie',
        params: {
          module: Lampa.Maker.module('Line').except('MoreFirst'),
          items: { view: 6 },
          scroll: { horizontal: true, step: 320 },
        },
      });

      // Синхронизация превью при фокусе
      line.use({
        onInstance: (cardInstance, data) => {
          cardInstance.use({
            onFocus: () => {
              this.lastFocused = cardInstance;
              this.updatePreview(data);
              this.scroll.update(line.render(true));
            },
            onEnter: () => {
              Lampa.Router.call('full', {
                id: data.id,
                source: 'tmdb',
                card: data,
                method: data.name ? 'tv' : 'movie',
              });
            },
          });
        },
        onMore: () => {
          Lampa.Activity.push({
            url: 'discover/movie',
            title: row.title,
            component: 'category_full',
            source: 'tmdb',
            filter: { with_genres: 27 },
            page: 2,
          });
        },
      });

      line.create();
      this.scroll.append(line.render(true));
      this.rowInstances.push(line);
    }

    updatePreview(card) {
      if (!card) return;
      this.previewCard = card;
      const box = this.right.querySelector('.horror-page__preview');
      const poster = card.poster_path ? Lampa.TMDB.image('t/p/w300/' + card.poster_path) : (card.img || '');
      const backdrop = card.backdrop_path ? Lampa.TMDB.image('t/p/w780/' + card.backdrop_path) : poster;
      const year = (card.release_date || card.first_air_date || '').slice(0, 4);
      const rating = card.vote_average ? card.vote_average.toFixed(1) : '—';

      box.innerHTML = `
        <img class="horror-page__preview-img" src="${escapeHTML(backdrop)}" onerror="this.src='${escapeHTML(poster || './img/img_broken.svg')}'" />
        <div class="horror-page__preview-body">
          <div class="horror-page__preview-title">${escapeHTML(card.title || card.name || '')}</div>
          <div class="horror-page__preview-meta">${escapeHTML(year)} · ⭐ ${escapeHTML(rating)}</div>
          <div class="horror-page__preview-overview">${escapeHTML(card.overview || '')}</div>
        </div>
      `;

      // Фон страницы
      if (backdrop && Lampa.Background) {
        Lampa.Background.change(Lampa.TMDB.image('t/p/w300/' + (card.poster_path || card.backdrop_path)));
      }
    }

    start() {
      Lampa.Controller.add('horror_page_ctrl', {
        toggle: () => {
          Lampa.Controller.collectionSet(this.html);
          Lampa.Controller.collectionFocus(this.lastFocused ? this.lastFocused.render(true) : null, this.html);
        },
        up: () => {
          if (Lampa.Navigator.canmove('up')) Lampa.Navigator.move('up');
          else Lampa.Controller.toggle('head');
        },
        down: () => {
          if (Lampa.Navigator.canmove('down')) Lampa.Navigator.move('down');
        },
        left: () => {
          if (Lampa.Navigator.canmove('left')) Lampa.Navigator.move('left');
          else Lampa.Controller.toggle('menu');
        },
        right: () => {
          if (Lampa.Navigator.canmove('right')) Lampa.Navigator.move('right');
        },
        back: () => Lampa.Activity.backward(),
      });
      Lampa.Controller.toggle('horror_page_ctrl');
    }

    render(js) {
      return js ? this.html : window.jQuery ? window.jQuery(this.html) : this.html;
    }

    destroy() {
      try {
        this.rowInstances.forEach((r) => r.destroy && r.destroy());
      } catch (e) {}
      try { this.scroll && this.scroll.destroy(); } catch (e) {}
      this.html.remove();
    }
  }

  Lampa.Component.add(COMPONENT_NAME, HorrorPage);

  // ==========================================================================
  // ОТКРЫТИЕ ГЛАВНОЙ СТРАНИЦЫ
  // ==========================================================================
  function openHorrorMain() {
    Lampa.Activity.push({
      url: '',
      title: t('horror_title'),
      component: COMPONENT_NAME,
      page: 1,
    });
  }

  // ==========================================================================
  // НАСТРОЙКИ ПЛАГИНА
  // ==========================================================================
  function registerSettings() {
    Lampa.SettingsApi.addComponent({
      component: 'horror',
      icon: `<svg width="39" height="39" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.5 3C10.4 3 3 10.4 3 19.5S10.4 36 19.5 36 36 28.6 36 19.5 28.6 3 19.5 3z" stroke="white" stroke-width="3"/>
        <circle cx="13.5" cy="17" r="3" fill="white"/>
        <circle cx="25.5" cy="17" r="3" fill="white"/>
        <path d="M11 27c2-3 5-4 8.5-4s6.5 1 8.5 4" stroke="white" stroke-width="3" stroke-linecap="round"/>
      </svg>`,
      name: t('horror_set_title'),
      after: 'more',
    });

    Lampa.SettingsApi.addParam({
      component: 'horror',
      param: { name: 'horror_min_rating', type: 'select', values: {
        '0': '0', '5': '5', '6': '6', '6.5': '6.5', '7': '7', '7.5': '7.5', '8': '8',
      }, default: '0' },
      field: { name: t('horror_set_rating') },
    });

    Lampa.SettingsApi.addParam({
      component: 'horror',
      param: { name: 'horror_year', type: 'select', values: {
        'any':     t('horror_set_year_any'),
        'fresh':   t('horror_set_year_fresh'),
        '2000':    t('horror_set_year_2000'),
        'classic': t('horror_set_year_classic'),
      }, default: 'any' },
      field: { name: t('horror_set_year') },
    });

    Lampa.SettingsApi.addParam({
      component: 'horror',
      param: { name: 'horror_hide_watched', type: 'trigger', default: false },
      field: { name: t('horror_set_hide') },
    });

    Lampa.SettingsApi.addParam({
      component: 'horror',
      param: { name: 'horror_show_anime', type: 'trigger', default: true },
      field: { name: t('horror_set_anime') },
    });
  }

  // ==========================================================================
  // СТИЛИ
  // ==========================================================================
  function injectStyles() {
    if (document.getElementById('horror-plugin-styles')) return;
    const css = `
      .horror-page { display: flex; flex-direction: column; height: 100%; width: 100%; }
      .horror-page__controls {
        display: flex; gap: .6em; padding: 1em 1.4em;
        overflow-x: auto; flex-shrink: 0; scrollbar-width: none;
      }
      .horror-page__controls::-webkit-scrollbar { display: none; }
      .horror-page__control {
        padding: .55em 1.15em; border-radius: 2em;
        background: rgba(255,255,255,.08); white-space: nowrap;
        font-size: .9em; transition: background .2s, transform .2s;
        flex-shrink: 0;
      }
      .horror-page__control.focus, .horror-page__control:hover {
        background: rgba(255,255,255,.22);
      }
      .horror-page__control--scare {
        background: rgba(180,20,20,.35); font-weight: 600;
      }
      .horror-page__control--scare.focus {
        background: rgba(230,30,30,.7);
        box-shadow: 0 0 24px rgba(255,40,40,.6);
      }
      .horror-page__body {
        display: flex; flex: 1; min-height: 0; gap: 1.5em;
        padding: 0 1.4em 1.4em;
      }
      .horror-page__left { flex: 1 1 auto; min-width: 0; overflow: hidden; }
      .horror-page__right {
        width: min(38%, 480px); flex-shrink: 0; overflow: hidden;
      }
      .horror-page__preview {
        position: relative; border-radius: 1em; overflow: hidden;
        background: rgba(0,0,0,.4); height: 100%;
        display: flex; flex-direction: column;
      }
      .horror-page__preview-img {
        width: 100%; aspect-ratio: 16/9; object-fit: cover;
        max-height: 45%;
      }
      .horror-page__preview-body {
        padding: 1.2em; overflow-y: auto; flex: 1;
      }
      .horror-page__preview-title {
        font-size: 1.3em; font-weight: 600; margin-bottom: .3em;
        line-height: 1.25;
      }
      .horror-page__preview-meta {
        font-size: .85em; opacity: .6; margin-bottom: .8em;
      }
      .horror-page__preview-overview {
        font-size: .95em; line-height: 1.5; opacity: .85;
      }
      @media (max-width: 768px) {
        .horror-page__right { display: none; }
        .horror-page__body { padding: 0 .6em .6em; }
        .horror-page__controls { padding: .8em .6em; }
      }

      /* ---- Испугай меня ---- */
      .horror-scare {
        position: fixed; inset: 0; background: #000; z-index: 99999;
        display: flex; align-items: center; justify-content: center;
        flex-direction: column; opacity: 0;
        transition: opacity .5s, background .05s;
        pointer-events: none;
      }
      .horror-scare.active { opacity: 1; pointer-events: auto; }
      .horror-scare--flash { background: #fff !important; }
      .horror-scare__text {
        color: #8b0000; font-size: 2.2em; font-weight: 100;
        letter-spacing: .35em; text-transform: uppercase;
        opacity: 0; transition: opacity 2s;
        font-family: serif;
      }
      .horror-scare.active .horror-scare__text { opacity: .85; }
      .horror-scare__eyes {
        position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        display: flex; gap: 1.5em; opacity: 0;
        transition: opacity 1.5s;
      }
      .horror-scare__eye {
        width: 1.6em; height: 1.6em; border-radius: 50%;
        background: #f00;
        box-shadow: 0 0 2em #f00, 0 0 4em #900, 0 0 8em #500;
        animation: horrorBlink 4s infinite;
      }
      @keyframes horrorBlink {
        0%, 38%, 44%, 100% { opacity: 1; }
        40%, 42% { opacity: 0; }
      }
      .horror-scare__reveal {
        display: flex; flex-direction: column; align-items: center;
        text-align: center; max-width: 500px; padding: 2em;
        animation: horrorFadeIn .6s ease;
      }
      @keyframes horrorFadeIn {
        from { opacity: 0; transform: scale(.9); }
        to   { opacity: 1; transform: scale(1); }
      }
      .horror-scare__poster {
        width: 220px; height: 330px;
        background-size: cover; background-position: center;
        border-radius: 1em; margin-bottom: 1.5em;
        box-shadow: 0 0 40px rgba(200,0,0,.5);
      }
      .horror-scare__title {
        color: #fff; font-size: 1.5em; font-weight: 600;
        margin-bottom: .4em;
      }
      .horror-scare__year {
        color: #aaa; font-size: .95em; margin-bottom: 1.5em;
      }
      .horror-scare__actions {
        display: flex; gap: .8em; flex-wrap: wrap; justify-content: center;
      }
      .horror-scare__btn {
        padding: .7em 1.6em; border-radius: 2em;
        background: rgba(255,255,255,.1); color: #fff;
        transition: background .2s, transform .2s;
      }
      .horror-scare__btn--primary {
        background: rgba(200,30,30,.6);
      }
      .horror-scare__btn.focus, .horror-scare__btn:hover {
        background: rgba(255,255,255,.3);
        transform: scale(1.05);
      }
    `;
    const style = document.createElement('style');
    style.id = 'horror-plugin-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ==========================================================================
  // ИНИЦИАЛИЗАЦИЯ
  // ==========================================================================
  function init() {
    injectStyles();
    registerSettings();

    // Кнопка в главном меню
    Lampa.Menu.addButton(
      `<svg width="39" height="39" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.5 3C10.4 3 3 10.4 3 19.5S10.4 36 19.5 36 36 28.6 36 19.5 28.6 3 19.5 3z" stroke="currentColor" stroke-width="3"/>
        <circle cx="13.5" cy="17" r="3" fill="currentColor"/>
        <circle cx="25.5" cy="17" r="3" fill="currentColor"/>
        <path d="M11 27c2-3 5-4 8.5-4s6.5 1 8.5 4" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
      </svg>`,
      t('horror_title'),
      openHorrorMain
    );

    // Добавляем источник поиска ужасов
    try {
      if (Lampa.Search && Lampa.Search.addSource) {
        Lampa.Search.addSource({
          title: t('horror_search'),
          params: { lazy: true },
          search: function (params, oncomplite) {
            tmdbGet('search/movie', { query: decodeURIComponent(params.query), include_adult: false }, 60 * 3)
              .then((r) => {
                const filtered = (r.results || []).filter((c) => (c.genre_ids || []).indexOf(27) !== -1);
                if (!filtered.length) return oncomplite([]);
                oncomplite([{
                  title: t('horror_search'),
                  results: filtered,
                  total: filtered.length,
                  total_pages: 1,
                }]);
              })
              .catch(() => oncomplite([]));
          },
          onCancel: () => { try { network.clear(); } catch (e) {} },
        });
      }
    } catch (e) {}

    log('initialized');
  }

  // Запуск
  if (window.appready) init();
  else Lampa.Listener.follow('app', (e) => {
    if (e.type === 'ready') init();
  });
})();
/* ============================================================================
 * Horror.js v2.1 — расширенный раздел ужасов для Lampa
 *   • Поджанры, настройки, локализация, кеш, дедупликация
 *   • Строки: Рекомендации, Фильмы, Новинки, Тренды, Топ, Сериалы, Аниме, Продолжить
 *   • Кнопка "Испугай меня" — со звуковым синтезом и раскрытием карточки
 * ========================================================================== */
(function () {
  'use strict';

  if (!window.Lampa) return;

  // ==========================================================================
  // КОНФИГ
  // ==========================================================================
  const CONFIG = {
    cacheNs: 'horror_v21',
    ttl: {
      recommend: 60 * 24 * 7,
      movies: 60 * 24 * 3,
      tv: 60 * 24 * 3,
      anime: 60 * 24 * 3,
      fresh: 60 * 24,
      trending: 60 * 12,
      top: 60 * 24 * 3,
      scare: 60 * 6,
    },
    ratings: {
      recommend: { min: 7.5, votes: 1000 },
      movies: { votes: 500 },
      tv: { votes: 300 },
      anime: { votes: 200 },
      fresh: { votes: 30 },
      top: { min: 8, votes: 2000 },
      scare: { min: 6.5, votes: 300 },
    },
  };

  const DEBUG = false;
  const log = (...a) => { if (DEBUG) console.log('[Horror]', ...a); };
  const warn = (...a) => { if (DEBUG) console.warn('[Horror]', ...a); };

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // ==========================================================================
  // ЛОКАЛИЗАЦИЯ
  // ==========================================================================
  try {
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
      horror_frighten_me:  { ru: 'Испугай меня', en: 'Frighten me' },
      horror_search:       { ru: 'Поиск ужасов', en: 'Search horror' },
      horror_load_fail:    { ru: 'Не удалось загрузить. Проверьте соединение или включите TMDB Proxy.', en: 'Failed to load. Check connection or enable TMDB Proxy.' },
      horror_empty:        { ru: 'Здесь пока пусто', en: 'Empty here' },
      horror_no_frighten:  { ru: 'Не удалось подобрать фильм', en: 'Could not pick a movie' },
      horror_frighten_hint:{ ru: 'Не двигайся…', en: "Don't move…" },
      horror_frighten_open:{ ru: 'Открыть', en: 'Open' },
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
      horror_set_year_classic:{ ru: 'Классика', en: 'Classic' },
      horror_set_hide:     { ru: 'Скрывать просмотренное', en: 'Hide watched' },
      horror_set_anime:    { ru: 'Показывать аниме', en: 'Show anime' },
    });
  } catch (e) {
    warn('lang register failed', e);
  }

  const t = (key) => {
    try { return Lampa.Lang.translate(key); }
    catch (e) { return key; }
  };

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

  function getSetting(name, def) {
    try {
      const v = Lampa.Storage.get(name, def);
      return v === undefined || v === '' ? def : v;
    } catch (e) {
      return def;
    }
  }

  function isEnabled(name, def) {
    const v = getSetting(name, def === undefined ? 'false' : def);
    return v === true || v === 'true' || v === 1 || v === '1';
  }

  function isWatched(card) {
    try {
      if (!card || !Lampa.Favorite || !Lampa.Favorite.check) return false;
      const s = Lampa.Favorite.check(card);
      return !!(s && (s.history || s.viewed));
    } catch (e) {
      return false;
    }
  }

  // ==========================================================================
  // БАЗА КЛЮЧЕВЫХ СЛОВ (стабильные ID из TMDB)
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
    supernatural: 6152,
  };

  // ==========================================================================
  // TMDB API С КЕШЕМ
  // ==========================================================================
  const network = new Lampa.Reguest();

  function buildUrl(path, params) {
    const parts = [];
    for (const k in params) {
      if (params[k] === undefined || params[k] === null || params[k] === '') continue;
      parts.push(`${k}=${encodeURIComponent(params[k])}`);
    }
    return path + (path.indexOf('?') === -1 ? '?' : '&') + parts.join('&');
  }

  function tmdbGet(path, params, ttlMinutes) {
    const url = buildUrl(path, Object.assign(
      {
        api_key: Lampa.TMDB.key(),
        language: Lampa.Storage.field('tmdb_lang') || 'ru-RU',
      },
      params || {}
    ));
    const cacheKey = CONFIG.cacheNs + ':' + url;

    const fetchFresh = () => new Promise((resolve, reject) => {
      network.silent(Lampa.TMDB.api(url), (json) => {
        try { Lampa.Cache.rewriteData('other', cacheKey, json).catch(() => {}); } catch (e) {}
        resolve(json);
      }, (err) => reject(err), false, { timeout: 10000 });
    });

    return new Promise((resolve, reject) => {
      try {
        Lampa.Cache.getDataAnyCase('other', cacheKey, ttlMinutes).then((cached) => {
          if (cached && cached.results) return resolve(cached);
          fetchFresh().then(resolve).catch(reject);
        }).catch(() => {
          fetchFresh().then(resolve).catch(reject);
        });
      } catch (e) {
        fetchFresh().then(resolve).catch(reject);
      }
    });
  }

  // ==========================================================================
  // ЗАГРУЗЧИКИ ДАННЫХ
  // ==========================================================================
  function yearFilter(field) {
    const mode = getSetting('horror_year', 'any');
    const y = new Date().getFullYear();
    if (mode === 'fresh')   return { [field + '.gte']: `${y - 1}-01-01` };
    if (mode === '2000')    return { [field + '.gte']: '2000-01-01', [field + '.lte']: '2009-12-31' };
    if (mode === 'classic') return { [field + '.lte']: '1999-12-31' };
    return {};
  }

  function ratingFilter() {
    const min = parseFloat(getSetting('horror_min_rating', '0'));
    return min > 0 ? { 'vote_average.gte': min } : {};
  }

  function dedupe(seen, items) {
    if (!Array.isArray(items)) return [];
    const out = [];
    for (const it of items) {
      if (!it || !it.id) continue;
      if (seen.has(it.id)) continue;
      seen.add(it.id);
      out.push(it);
    }
    return out;
  }

  function loadRecommend(seen) {
    const filter = Object.assign(
      {
        with_genres: '27,53',
        sort_by: 'vote_average.desc',
        'vote_average.gte': CONFIG.ratings.recommend.min,
        'vote_count.gte': CONFIG.ratings.recommend.votes,
        include_adult: false,
      },
      ratingFilter(),
      yearFilter('primary_release_date')
    );
    return tmdbGet('discover/movie', filter, CONFIG.ttl.recommend)
      .then((r) => ({ title: t('horror_recommend'), results: dedupe(seen, r.results || []), filter }));
  }

  function loadMovies(seen) {
    const filter = Object.assign(
      {
        with_genres: '27',
        sort_by: 'popularity.desc',
        'vote_count.gte': CONFIG.ratings.movies.votes,
        include_adult: false,
      },
      ratingFilter(),
      yearFilter('primary_release_date')
    );
    return tmdbGet('discover/movie', filter, CONFIG.ttl.movies)
      .then((r) => ({ title: t('horror_movies'), results: dedupe(seen, r.results || []), filter }));
  }

  function loadTV(seen) {
    const filter = Object.assign(
      {
        with_keywords: KEYWORD_IDS.horror,
        sort_by: 'popularity.desc',
        'vote_count.gte': CONFIG.ratings.tv.votes,
        include_adult: false,
      },
      ratingFilter(),
      yearFilter('first_air_date')
    );
    return tmdbGet('discover/tv', filter, CONFIG.ttl.tv)
      .then((r) => ({ title: t('horror_tv'), results: dedupe(seen, r.results || []), filter }));
  }

  function loadAnime(seen) {
    if (!isEnabled('horror_show_anime', 'true')) return Promise.resolve(null);
    const filter = {
      with_genres: '16',
      with_original_language: 'ja',
      with_keywords: KEYWORD_IDS.horror,
      sort_by: 'popularity.desc',
      'vote_count.gte': CONFIG.ratings.anime.votes,
      include_adult: false,
    };
    return tmdbGet('discover/tv', filter, CONFIG.ttl.anime)
      .then((r) => ({ title: t('horror_anime'), results: dedupe(seen, r.results || []), filter }));
  }

  function loadFresh(seen) {
    const y = new Date().getFullYear();
    const filter = {
      with_genres: '27',
      sort_by: 'primary_release_date.desc',
      'primary_release_date.gte': `${y - 1}-01-01`,
      'vote_count.gte': CONFIG.ratings.fresh.votes,
      include_adult: false,
    };
    return tmdbGet('discover/movie', filter, CONFIG.ttl.fresh)
      .then((r) => ({ title: t('horror_fresh'), results: dedupe(seen, r.results || []), filter }));
  }

  function loadTrending(seen) {
    return tmdbGet('trending/movie/week', {}, CONFIG.ttl.trending)
      .then((r) => {
        const filtered = (r.results || []).filter((it) => (it.genre_ids || []).indexOf(27) !== -1);
        return {
          title: t('horror_trending'),
          results: dedupe(seen, filtered),
          filter: { with_genres: '27', sort_by: 'popularity.desc' },
        };
      });
  }

  function loadTop(seen) {
    const filter = Object.assign(
      {
        with_genres: '27',
        sort_by: 'vote_average.desc',
        'vote_average.gte': CONFIG.ratings.top.min,
        'vote_count.gte': CONFIG.ratings.top.votes,
        include_adult: false,
      },
      yearFilter('primary_release_date')
    );
    return tmdbGet('discover/movie', filter, CONFIG.ttl.top)
      .then((r) => ({ title: t('horror_top'), results: dedupe(seen, r.results || []), filter }));
  }

  function loadContinue(seen) {
    try {
      const history = (Lampa.Favorite.get({ type: 'history' }) || []);
      const horrorHistory = history.filter((c) => {
        const gids = c.genre_ids || [];
        const genres = c.genres || [];
        return gids.indexOf(27) !== -1 || genres.some((g) => g.id === 27);
      }).slice(0, 20);
      if (!horrorHistory.length) return Promise.resolve(null);
      return Promise.resolve({
        title: t('horror_continue'),
        results: dedupe(seen, horrorHistory),
        filter: { with_genres: '27' },
      });
    } catch (e) {
      return Promise.resolve(null);
    }
  }

  function applyWatchedFilter(rows) {
    if (!isEnabled('horror_hide_watched', 'false')) return rows;
    return rows
      .map((row) => {
        if (!row) return row;
        row.results = (row.results || []).filter((c) => !isWatched(c));
        return row;
      })
      .filter((row) => row && row.results && row.results.length);
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
    const kwFilter = sub.kw && KEYWORD_IDS[sub.kw] ? { with_keywords: KEYWORD_IDS[sub.kw] } : {};
    const filter = Object.assign(
      { with_genres: 27, sort_by: 'popularity.desc' },
      kwFilter,
      ratingFilter(),
      yearFilter('primary_release_date')
    );
    Lampa.Activity.push({
      url: 'discover/movie',
      title: t(sub.titleKey),
      component: 'category_full',
      source: 'tmdb',
      filter,
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

      // Шумовая составляющая
      const bufSize = Math.floor(ctx.sampleRate * 1.5);
      const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 12;
      bp.frequency.setValueAtTime(2800, ctx.currentTime);
      bp.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 1.2);

      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.001, ctx.currentTime);
      ng.gain.exponentialRampToValueAtTime(0.55, ctx.currentTime + 0.05);
      ng.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);
      noise.connect(bp).connect(ng).connect(ctx.destination);

      // Низкочастотный рокот
      const bass = ctx.createOscillator();
      bass.type = 'sawtooth';
      bass.frequency.setValueAtTime(55, ctx.currentTime);
      bass.frequency.linearRampToValueAtTime(28, ctx.currentTime + 1.4);
      const bg = ctx.createGain();
      bg.gain.setValueAtTime(0.35, ctx.currentTime);
      bg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);
      bass.connect(bg).connect(ctx.destination);

      noise.start();
      bass.start();
      noise.stop(ctx.currentTime + 1.5);
      bass.stop(ctx.currentTime + 1.5);
    } catch (e) {
      warn('screech failed', e);
    }
  }

  async function frightenMe() {
    const prevController = (Lampa.Controller.enabled && Lampa.Controller.enabled().name) || 'content';
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

    // Гарантированный обработчик "назад" на всё время существования оверлея
    const close = () => {
      overlay.classList.remove('active');
      setTimeout(() => {
        overlay.remove();
        try { Lampa.Controller.toggle(prevController); } catch (e) {}
      }, 400);
    };
    overlay._close = close;

    // Плавное появление
    requestAnimationFrame(() => overlay.classList.add('active'));
    await wait(300);

    // Показываем глаза
    const eyes = overlay.querySelector('.horror-scare__eyes');
    if (eyes) eyes.style.opacity = '1';
    await wait(2000);

    // Скрим + вспышка
    playScreech();
    overlay.classList.add('horror-scare--flash');
    await wait(90);
    overlay.classList.remove('horror-scare--flash');
    await wait(500);

    // Получаем случайный фильм
    let pick = null;
    try {
      const page = 1 + Math.floor(Math.random() * 5);
      const res = await tmdbGet('discover/movie', {
        with_genres: '27',
        sort_by: 'vote_average.desc',
        'vote_average.gte': CONFIG.ratings.scare.min,
        'vote_count.gte': CONFIG.ratings.scare.votes,
        include_adult: false,
        page,
      }, CONFIG.ttl.scare);

      const pool = (res.results || []).filter((c) => c.backdrop_path || c.poster_path);
      if (!pool.length) throw new Error('empty pool');
      pick = pool[Math.floor(Math.random() * pool.length)];
    } catch (e) {
      warn('frighten fetch failed', e);
    }

    if (!pick) {
      Lampa.Noty && Lampa.Noty.show(t('horror_no_frighten'));
      return close();
    }

    const poster = Lampa.TMDB.image('t/p/w500/' + (pick.poster_path || pick.backdrop_path));
    overlay.innerHTML = `
      <div class="horror-scare__reveal">
        <div class="horror-scare__poster" style="background-image:url(${escapeHTML(poster)});"></div>
        <div class="horror-scare__title">${escapeHTML(pick.title || pick.name || '')}</div>
        <div class="horror-scare__year">${escapeHTML((pick.release_date || '').slice(0, 4))} · ⭐ ${escapeHTML(String((pick.vote_average || 0).toFixed(1)))}</div>
        <div class="horror-scare__actions">
          <div class="horror-scare__btn horror-scare__btn--primary selector" data-action="open">${escapeHTML(t('horror_frighten_open'))}</div>
          <div class="horror-scare__btn selector" data-action="again">${escapeHTML(t('horror_frighten_again'))}</div>
        </div>
      </div>
    `;

    const openBtn = overlay.querySelector('[data-action="open"]');
    const againBtn = overlay.querySelector('[data-action="again"]');

    openBtn.addEventListener('hover:enter', () => {
      close();
      setTimeout(() => {
        Lampa.Router.call('full', {
          id: pick.id,
          source: 'tmdb',
          card: pick,
          method: pick.name ? 'tv' : 'movie',
        });
      }, 250);
    });

    againBtn.addEventListener('hover:enter', () => {
      close();
      setTimeout(frightenMe, 300);
    });

    // Контроллер scare-оверлея
    Lampa.Controller.add('horror_scare', {
      toggle: () => {
        Lampa.Controller.collectionSet(overlay);
        Lampa.Controller.collectionFocus(openBtn, overlay);
      },
      up: () => Lampa.Controller.move('up'),
      down: () => Lampa.Controller.move('down'),
      left: () => Lampa.Controller.move('left'),
      right: () => Lampa.Controller.move('right'),
      back: close,
    });
    Lampa.Controller.toggle('horror_scare');
  }

  // ==========================================================================
  // РЕНДЕР КАРТОЧКИ
  // ==========================================================================
  const cardMaskCache = { value: null };
  function getCardMask() {
    if (cardMaskCache.value !== null) return cardMaskCache.value;
    try {
      const CardMask = Lampa.Maker.module('Card');
      cardMaskCache.value = CardMask.MASK.base;
    } catch (e) {
      cardMaskCache.value = undefined;
    }
    return cardMaskCache.value;
  }

  function createCard(cardData, onFocus, onEnter) {
    const params = {
      module: getCardMask(),
      emit: {
        onFocus: () => onFocus(cardData),
        onEnter: () => onEnter(cardData),
      },
    };

    try {
      const card = Lampa.Maker.make('Card', Object.assign({}, cardData, { params }));
      card.create();
      return card;
    } catch (e) {
      warn('card create failed', e);
      return null;
    }
  }

  // ==========================================================================
  // КОМПОНЕНТ СТРАНИЦЫ
  // ==========================================================================
  const COMPONENT_NAME = 'horror_page';

  function HorrorPage(object) {
    this.object = object || {};
    this.html = document.createElement('div');
    this.html.className = 'horror-page';
    this.rows = [];
    this.rowData = [];
    this.scroll = null;
    this.rowScrolls = [];
    this.lastFocused = null;
    this.previewBox = null;
    this.controlsEl = null;
  }

  HorrorPage.prototype.create = function (body) {
    // Не добавляем this.html в body вручную — Activity сделает это через render(true)
    this.buildLayout();
    this.loadData();
  };

  HorrorPage.prototype.buildLayout = function () {
    // Управление сверху
    const controls = document.createElement('div');
    controls.className = 'horror-page__controls';
    this.controlsEl = controls;

    SUBGENRES.forEach((sub) => {
      const btn = document.createElement('div');
      btn.className = 'horror-page__control selector';
      btn.textContent = t(sub.titleKey);
      btn.addEventListener('hover:enter', () => openSubgenre(sub));
      if (this.scroll) btn.addEventListener('hover:focus', () => this.scroll.update(btn, true));
      controls.appendChild(btn);
    });

    const scareBtn = document.createElement('div');
    scareBtn.className = 'horror-page__control horror-page__control--scare selector';
    scareBtn.textContent = '💀 ' + t('horror_frighten_me');
    scareBtn.addEventListener('hover:enter', frightenMe);
    if (this.scroll) scareBtn.addEventListener('hover:focus', () => this.scroll.update(scareBtn, true));
    controls.appendChild(scareBtn);

    this.html.appendChild(controls);

    // Тело
    const bodyEl = document.createElement('div');
    bodyEl.className = 'horror-page__body';

    const left = document.createElement('div');
    left.className = 'horror-page__left';

    const right = document.createElement('div');
    right.className = 'horror-page__right';
    right.innerHTML = `<div class="horror-page__preview">
      <div class="horror-page__preview-empty">${escapeHTML(t('horror_sub_all'))}</div>
    </div>`;
    this.previewBox = right.querySelector('.horror-page__preview');

    bodyEl.appendChild(left);
    bodyEl.appendChild(right);
    this.html.appendChild(bodyEl);

    // Внешний вертикальный скролл
    try {
      this.scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
      this.scroll.minus(this.controlsEl);
      this.scroll.onWheel = (step) => {
        if (step > 0) Lampa.Controller.move('down');
        else Lampa.Controller.move('up');
      };
      left.appendChild(this.scroll.render(true));
    } catch (e) {
      warn('scroll create failed', e);
    }
  };

  HorrorPage.prototype.loadData = function () {
    if (!this.scroll) return;

    const seen = new Set();

    // Показываем лоадер
    try {
      Lampa.Loading.start(() => {});
      if (typeof Lampa.Loading.setText === 'function') Lampa.Loading.setText(t('loading') + '...');
    } catch (e) {}

    const loaders = [
      loadRecommend(seen),
      loadMovies(seen),
      loadFresh(seen),
      loadTrending(seen),
      loadTop(seen),
      loadTV(seen),
      loadAnime(seen),
      loadContinue(seen),
    ];

    Promise.allSettled(loaders).then((results) => {
      const rows = results
        .map((r) => (r.status === 'fulfilled' ? r.value : null))
        .filter((r) => r && r.results && r.results.length);

      const filtered = applyWatchedFilter(rows);

      try { Lampa.Loading.stop(); } catch (e) {}

      if (!filtered.length) {
        this.renderEmpty();
        return;
      }

      filtered.forEach((row) => this.renderRow(row));

      try { Lampa.Layer.update(this.html); } catch (e) {}
    }).catch((e) => {
      warn('load failed', e);
      try { Lampa.Loading.stop(); } catch (_) {}
      this.renderEmpty();
    });
  };

  HorrorPage.prototype.renderEmpty = function () {
    if (!this.scroll) return;
    let emptyEl;
    try {
      const empty = new Lampa.Empty({
        title: t('horror_empty'),
        descr: t('horror_load_fail'),
      });
      emptyEl = empty.render(true);
    } catch (e) {
      emptyEl = document.createElement('div');
      emptyEl.className = 'about';
      emptyEl.textContent = t('horror_load_fail');
    }
    this.scroll.append(emptyEl);
  };

  HorrorPage.prototype.renderRow = function (row) {
    const rowEl = document.createElement('div');
    rowEl.className = 'items-line layer--visible layer--render horror-row';

    rowEl.innerHTML = `
      <div class="items-line__head">
        <div class="items-line__title">${escapeHTML(row.title)}</div>
      </div>
      <div class="items-line__body"></div>
    `;

    const bodyEl = rowEl.querySelector('.items-line__body');

    // Внутренний горизонтальный скролл
    let hScroll;
    try {
      hScroll = new Lampa.Scroll({
        horizontal: true,
        mask: true,
        over: true,
        step: 320,
        nopadding: true,
      });
      hScroll.onWheel = (step) => {
        // Пробрасываем скролл наружу
        if (this.scroll) this.scroll.wheel(step);
      };
      bodyEl.appendChild(hScroll.render(true));
    } catch (e) {
      warn('row scroll failed', e);
      return;
    }

    // Создаём карточки
    const results = row.results.slice(0, 20);
    results.forEach((cardData) => {
      const card = createCard(
        cardData,
        (data) => this.onCardFocus(data),
        (data) => this.onCardEnter(data)
      );
      if (!card) return;
      hScroll.append(card.render(true));
    });

    // Кнопка "Показать больше" в конце
    if (row.results.length >= 20 || row.filter) {
      const moreBtn = document.createElement('div');
      moreBtn.className = 'horror-row__more selector';
      moreBtn.innerHTML = `<div>${escapeHTML(t('more'))}</div>`;
      moreBtn.addEventListener('hover:enter', () => this.openRow(row));
      hScroll.append(moreBtn);
    }

    this.rowScrolls.push(hScroll);
    this.rowData.push(row);
    this.scroll.append(rowEl);
  };

  HorrorPage.prototype.openRow = function (row) {
    Lampa.Activity.push({
      url: 'discover/movie',
      title: row.title,
      component: 'category_full',
      source: 'tmdb',
      filter: row.filter || { with_genres: 27 },
      page: 2,
    });
  };

  HorrorPage.prototype.onCardFocus = function (card) {
    this.lastFocused = card;
    this.updatePreview(card);
  };

  HorrorPage.prototype.onCardEnter = function (card) {
    Lampa.Router.call('full', {
      id: card.id,
      source: 'tmdb',
      card: card,
      method: card.name ? 'tv' : 'movie',
    });
  };

  HorrorPage.prototype.updatePreview = function (card) {
    if (!card || !this.previewBox) return;

    const poster = card.poster_path ? Lampa.TMDB.image('t/p/w300/' + card.poster_path) : '';
    const backdrop = card.backdrop_path ? Lampa.TMDB.image('t/p/w780/' + card.backdrop_path) : poster;
    const year = (card.release_date || card.first_air_date || '').slice(0, 4);
    const rating = card.vote_average ? card.vote_average.toFixed(1) : '—';

    this.previewBox.innerHTML = `
      <img class="horror-page__preview-img" src="${escapeHTML(backdrop)}"
           onerror="this.onerror=null;this.src='${escapeHTML(poster || './img/img_broken.svg')}';" />
      <div class="horror-page__preview-body">
        <div class="horror-page__preview-title">${escapeHTML(card.title || card.name || '')}</div>
        <div class="horror-page__preview-meta">${escapeHTML(year)} · ⭐ ${escapeHTML(rating)}</div>
        <div class="horror-page__preview-overview">${escapeHTML(card.overview || '')}</div>
      </div>
    `;

    // Фон страницы
    if (backdrop && Lampa.Background && typeof Lampa.Background.change === 'function') {
      try {
        Lampa.Background.change(Lampa.TMDB.image('t/p/w300/' + (card.poster_path || card.backdrop_path)));
      } catch (e) {}
    }
  };

  HorrorPage.prototype.start = function () {
    const self = this;

    Lampa.Controller.add('content', {
      link: self,
      toggle: function () {
        if (self.scroll) {
          Lampa.Controller.collectionSet(self.html);
          Lampa.Controller.collectionFocus(
            self.lastFocused ? self.lastFocused : null,
            self.html
          );
        }
      },
      up: function () {
        if (Lampa.Controller.move && self._canmove('up')) Lampa.Controller.move('up');
        else Lampa.Controller.toggle('head');
      },
      down: function () {
        Lampa.Controller.move('down');
      },
      left: function () {
        if (self._canmove('left')) Lampa.Controller.move('left');
        else Lampa.Controller.toggle('menu');
      },
      right: function () {
        Lampa.Controller.move('right');
      },
      back: function () {
        Lampa.Activity.backward();
      },
    });
    Lampa.Controller.toggle('content');
  };

  // Вспомогательная: сработает ли move в нужную сторону
  HorrorPage.prototype._canmove = function (dir) {
    try {
      // Внутренний Navigator Lampa не экспортирован — эвристика через активный фокус
      const active = document.activeElement;
      if (!active) return false;
      const rect = active.getBoundingClientRect();
      if (dir === 'left')  return rect.left > 40;
      if (dir === 'up')    return rect.top > 40;
      return true;
    } catch (e) {
      return false;
    }
  };

  HorrorPage.prototype.render = function (js) {
    return js ? this.html : (window.jQuery ? window.jQuery(this.html) : this.html);
  };

  HorrorPage.prototype.resize = function () {
    try { Lampa.Layer.update(this.html); } catch (e) {}
  };

  HorrorPage.prototype.destroy = function () {
    this.rowScrolls.forEach((s) => { try { s.destroy(); } catch (e) {} });
    this.rowScrolls = [];
    if (this.scroll) { try { this.scroll.destroy(); } catch (e) {} }
    this.html.remove();
  };

  try {
    Lampa.Component.add(COMPONENT_NAME, HorrorPage);
  } catch (e) {
    warn('component register failed', e);
  }

  function openHorrorMain() {
    Lampa.Activity.push({
      url: '',
      title: t('horror_title'),
      component: COMPONENT_NAME,
      page: 1,
    });
  }

  // ==========================================================================
  // НАСТРОЙКИ
  // ==========================================================================
  function registerSettings() {
    try {
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
        param: {
          name: 'horror_min_rating',
          type: 'select',
          values: { '0': '0', '5': '5', '6': '6', '6.5': '6.5', '7': '7', '7.5': '7.5', '8': '8' },
          default: '0',
        },
        field: { name: t('horror_set_rating') },
      });

      Lampa.SettingsApi.addParam({
        component: 'horror',
        param: {
          name: 'horror_year',
          type: 'select',
          values: {
            any:     t('horror_set_year_any'),
            fresh:   t('horror_set_year_fresh'),
            '2000':  t('horror_set_year_2000'),
            classic: t('horror_set_year_classic'),
          },
          default: 'any',
        },
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

      log('settings registered');
    } catch (e) {
      warn('settings register failed', e);
    }
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
        padding: 0 1.4em;
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
      .horror-page__preview-empty {
        display: flex; align-items: center; justify-content: center;
        height: 100%; opacity: .35; font-size: 1.2em;
      }
      .horror-page__preview-img {
        width: 100%; aspect-ratio: 16/9; object-fit: cover; max-height: 45%;
      }
      .horror-page__preview-body { padding: 1.2em; overflow-y: auto; flex: 1; }
      .horror-page__preview-title {
        font-size: 1.3em; font-weight: 600; margin-bottom: .3em;
        line-height: 1.25;
      }
      .horror-page__preview-meta { font-size: .85em; opacity: .6; margin-bottom: .8em; }
      .horror-page__preview-overview { font-size: .95em; line-height: 1.5; opacity: .85; }

      .horror-row { margin-bottom: .6em; }
      .horror-row__more {
        flex-shrink: 0; padding: 1em 1.6em;
        border-radius: .8em; background: rgba(255,255,255,.08);
        display: flex; align-items: center; justify-content: center;
        min-width: 8em; font-size: 1em; transition: background .2s;
      }
      .horror-row__more.focus { background: rgba(255,255,255,.2); }

      @media (max-width: 768px) {
        .horror-page__right { display: none; }
        .horror-page__body { padding: 0 .6em; }
        .horror-page__controls { padding: .8em .6em; }
      }

      /* ============ ИСПУГАЙ МЕНЯ ============ */
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
        opacity: 0; transition: opacity 2s; font-family: serif;
        position: absolute; bottom: 15%;
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
      .horror-scare__year { color: #aaa; font-size: .95em; margin-bottom: 1.5em; }
      .horror-scare__actions {
        display: flex; gap: .8em; flex-wrap: wrap; justify-content: center;
      }
      .horror-scare__btn {
        padding: .7em 1.6em; border-radius: 2em;
        background: rgba(255,255,255,.1); color: #fff;
        transition: background .2s, transform .2s;
      }
      .horror-scare__btn--primary { background: rgba(200,30,30,.6); }
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
  let inited = false;

  function init() {
    if (inited) return;
    inited = true;

    injectStyles();
    registerSettings();

    // Кнопка в главном меню
    try {
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
    } catch (e) {
      warn('menu addButton failed', e);
    }

    // Источник поиска
    try {
      if (Lampa.Search && Lampa.Search.addSource) {
        Lampa.Search.addSource({
          title: t('horror_search'),
          params: { lazy: true },
          search: function (params, oncomplite) {
            tmdbGet('search/movie', {
              query: decodeURIComponent(params.query),
              include_adult: false,
            }, 60 * 3).then((r) => {
              const filtered = (r.results || []).filter(
                (c) => (c.genre_ids || []).indexOf(27) !== -1
              );
              if (!filtered.length) return oncomplite([]);
              oncomplite([{
                title: t('horror_search'),
                results: filtered,
                total: filtered.length,
                total_pages: 1,
              }]);
            }).catch(() => oncomplite([]));
          },
          onCancel: () => { try { network.clear(); } catch (e) {} },
        });
      }
    } catch (e) {
      warn('search source failed', e);
    }

    log('initialized');
  }

  if (window.appready) {
    init();
  } else {
    try {
      Lampa.Listener.follow('app', (e) => {
        if (e.type === 'ready') init();
      });
    } catch (e) {
      warn('listener failed', e);
    }
  }
})();
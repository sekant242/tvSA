/* ============================================================================
 * Horror.js — раздел ужасов для Lampa
 * Использует штатный Maker.make('Main') — вся вёрстка, фокус, фон и
 * жесты работают так же, как на главной Lampa.
 * ========================================================================== */
(function () {
  'use strict';
  if (!window.Lampa || !Lampa.Maker) return;

  // ================== ЛОКАЛИЗАЦИЯ ==================
  Lampa.Lang.add({
    horror_title:       { ru: 'Ужасы', en: 'Horror' },
    horror_recommend:   { ru: 'Рекомендации', en: 'Recommended' },
    horror_movies:      { ru: 'Фильмы ужасов', en: 'Horror movies' },
    horror_tv:          { ru: 'Сериалы', en: 'TV series' },
    horror_anime:       { ru: 'Аниме', en: 'Anime' },
    horror_fresh:       { ru: 'Новинки', en: 'New releases' },
    horror_trending:    { ru: 'В тренде', en: 'Trending' },
    horror_top:         { ru: 'Топ ужасов', en: 'Top horror' },
    horror_frighten:    { ru: 'Испугай меня', en: 'Frighten me' },
    horror_frighten_hint: { ru: 'Не двигайся…', en: "Don't move…" },
    horror_frighten_open: { ru: 'Открыть', en: 'Open' },
    horror_frighten_again:{ ru: 'Ещё раз', en: 'Again' },
    horror_frighten_fail: { ru: 'Не удалось подобрать фильм', en: 'No movie found' },
    horror_empty:       { ru: 'Здесь пока пусто', en: 'Nothing here yet' },
    horror_subgenres:   { ru: 'Поджанры', en: 'Subgenres' },
    horror_set_title:   { ru: 'Ужасы', en: 'Horror' },
    horror_set_rating:  { ru: 'Минимальный рейтинг', en: 'Minimum rating' },
    horror_set_anime:   { ru: 'Показывать аниме', en: 'Show anime' },
    horror_set_hide:    { ru: 'Скрывать просмотренное', en: 'Hide watched' },
  });

  const t = (k) => Lampa.Lang.translate(k);
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  const get = (n, d) => {
    const v = Lampa.Storage.get(n, d);
    return v === undefined || v === '' ? d : v;
  };

  // ================== TMDB ==================
  const net = new Lampa.Reguest();
  const NS = 'horror_v1';

  function tmdb(path, params, ttl) {
    const url = path + (path.indexOf('?') === -1 ? '?' : '&') + Object.keys(
      Object.assign({ api_key: Lampa.TMDB.key(), language: Lampa.Storage.field('tmdb_lang') || 'ru-RU' }, params || {})
    ).map((k) => k + '=' + encodeURIComponent((Object.assign({ api_key: Lampa.TMDB.key(), language: Lampa.Storage.field('tmdb_lang') || 'ru-RU' }, params || {}))[k])).join('&');
    const key = NS + ':' + url;

    const fresh = () => new Promise((res, rej) =>
      net.silent(Lampa.TMDB.api(url), (j) => {
        try { Lampa.Cache.rewriteData('other', key, j).catch(() => {}); } catch (e) {}
        res(j);
      }, rej, false, { timeout: 10000 })
    );

    return Lampa.Cache.getDataAnyCase('other', key, ttl)
      .then((c) => (c && c.results ? c : fresh()))
      .catch(fresh);
  }

  // ================== ФИЛЬТРЫ ПОЛЬЗОВАТЕЛЯ ==================
  function userFilters(field) {
    const f = {};
    const min = parseFloat(get('horror_min_rating', '0'));
    if (min > 0) f['vote_average.gte'] = min;
    return f;
  }

  // ================== ЗАГРУЗЧИКИ СТРОК ==================
  // Каждая возвращает объект { title, results, params } — формат строки Lampa
  function lineParams(view) {
    return {
      module: Lampa.Maker.module('Line').MASK.base,
      items: { view: view || 6, mapping: 'line' },
      scroll: { horizontal: true, step: 320 },
    };
  }

  function dedupeFactory() {
    const seen = new Set();
    return (items) => (items || []).filter((i) => i && i.id && !seen.has(i.id) && seen.add(i.id));
  }

  function loadRecommend(dedupe) {
    return tmdb('discover/movie', Object.assign({
      with_genres: '27,53',
      sort_by: 'vote_average.desc',
      'vote_average.gte': 7.5,
      'vote_count.gte': 1000,
      include_adult: false,
    }, userFilters()), 60 * 24 * 7)
      .then((r) => ({ title: t('horror_recommend'), results: dedupe(r.results), params: lineParams() }));
  }

  function loadMovies(dedupe) {
    return tmdb('discover/movie', Object.assign({
      with_genres: '27',
      sort_by: 'popularity.desc',
      'vote_count.gte': 500,
      include_adult: false,
    }, userFilters()), 60 * 24 * 3)
      .then((r) => ({ title: t('horror_movies'), results: dedupe(r.results), params: lineParams() }));
  }

  function loadTV(dedupe) {
    return tmdb('discover/tv', {
      with_genres: '27',
      sort_by: 'popularity.desc',
      'vote_count.gte': 300,
      include_adult: false,
    }, 60 * 24 * 3)
      .then((r) => ({ title: t('horror_tv'), results: dedupe(r.results), params: lineParams() }));
  }

  function loadAnime(dedupe) {
    if (get('horror_show_anime', 'true') !== true && get('horror_show_anime', 'true') !== 'true') {
      return Promise.resolve(null);
    }
    return tmdb('discover/tv', {
      with_genres: '16',
      with_original_language: 'ja',
      with_keywords: 315058,
      sort_by: 'popularity.desc',
      'vote_count.gte': 200,
      include_adult: false,
    }, 60 * 24 * 3)
      .then((r) => ({ title: t('horror_anime'), results: dedupe(r.results), params: lineParams() }));
  }

  function loadFresh(dedupe) {
    const y = new Date().getFullYear();
    return tmdb('discover/movie', {
      with_genres: '27',
      sort_by: 'primary_release_date.desc',
      'primary_release_date.gte': (y - 1) + '-01-01',
      'vote_count.gte': 30,
      include_adult: false,
    }, 60 * 24)
      .then((r) => ({ title: t('horror_fresh'), results: dedupe(r.results), params: lineParams() }));
  }

  function loadTrending(dedupe) {
    return tmdb('trending/movie/week', {}, 60 * 12).then((r) => {
      const list = (r.results || []).filter((c) => (c.genre_ids || []).indexOf(27) !== -1);
      return { title: t('horror_trending'), results: dedupe(list), params: lineParams() };
    });
  }

  function loadTop(dedupe) {
    return tmdb('discover/movie', Object.assign({
      with_genres: '27',
      sort_by: 'vote_average.desc',
      'vote_average.gte': 8,
      'vote_count.gte': 2000,
      include_adult: false,
    }, userFilters()), 60 * 24 * 3)
      .then((r) => ({ title: t('horror_top'), results: dedupe(r.results), params: lineParams() }));
  }

  function loadAll() {
    const dedupe = dedupeFactory();
    return Promise.allSettled([
      loadRecommend(dedupe),
      loadMovies(dedupe),
      loadFresh(dedupe),
      loadTrending(dedupe),
      loadTop(dedupe),
      loadTV(dedupe),
      loadAnime(dedupe),
    ]).then((res) => res
      .filter((r) => r.status === 'fulfilled' && r.value && r.value.results.length)
      .map((r) => r.value)
      .filter((row) => {
        if (get('horror_hide_watched', 'false') !== true && get('horror_hide_watched', 'false') !== 'true') return true;
        row.results = row.results.filter((c) => {
          try {
            const s = Lampa.Favorite.check(c);
            return !(s && (s.history || s.viewed));
          } catch (e) { return true; }
        });
        return row.results.length > 0;
      })
    );
  }

  // ================== ПОДЖАНРЫ ==================
  const SUBGENRES = [
    { id: 'slasher', kw: 12339,             ru: 'Слэшеры' },
    { id: 'zombie',  kw: 12377,             ru: 'Зомби' },
    { id: 'vampire', kw: 3133,              ru: 'Вампиры' },
    { id: 'ghost',   kw: 12392,             ru: 'Призраки' },
    { id: 'psycho',  kw: 284303,            ru: 'Психологические' },
    { id: 'found',   kw: 163053,            ru: 'Найденная плёнка' },
    { id: 'demon',   kw: 205554,            ru: 'Демоны' },
    { id: 'witch',   kw: 12565,             ru: 'Ведьмы' },
    { id: 'monster', kw: 1299,              ru: 'Монстры' },
  ];

  function openSubgenre(sub) {
    Lampa.Activity.push({
      url: 'discover/movie',
      title: sub.ru,
      component: 'category_full',
      source: 'tmdb',
      filter: { with_genres: 27, with_keywords: sub.kw, sort_by: 'popularity.desc' },
      page: 1,
    });
  }

  // ================== «ИСПУГАЙ МЕНЯ» ==================
  function playScreech() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.7);
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.0);
    } catch (e) {}
  }

  function frightenMe() {
    const prev = (Lampa.Controller.enabled() || {}).name || 'content';
    const ov = document.createElement('div');
    ov.className = 'horror-scare';
    ov.innerHTML =
      '<div class="horror-scare__eyes"><div class="horror-scare__eye"></div><div class="horror-scare__eye"></div></div>' +
      '<div class="horror-scare__text">' + esc(t('horror_frighten_hint')) + '</div>';
    document.body.appendChild(ov);

    const close = () => {
      ov.classList.remove('active');
      setTimeout(() => {
        ov.remove();
        try { Lampa.Controller.toggle(prev); } catch (e) {}
      }, 400);
    };

    requestAnimationFrame(() => ov.classList.add('active'));

    // глаза
    setTimeout(() => {
      const e = ov.querySelector('.horror-scare__eyes');
      if (e) e.style.opacity = '1';
    }, 500);

    // скрим + вспышка
    setTimeout(() => {
      playScreech();
      ov.classList.add('horror-scare--flash');
      setTimeout(() => ov.classList.remove('horror-scare--flash'), 90);
    }, 2200);

    // карточка
    setTimeout(() => {
      const page = 1 + Math.floor(Math.random() * 5);
      tmdb('discover/movie', {
        with_genres: '27',
        sort_by: 'vote_average.desc',
        'vote_average.gte': 6.5,
        'vote_count.gte': 300,
        include_adult: false,
        page: page,
      }, 60 * 6).then((r) => {
        const pool = (r.results || []).filter((c) => c.poster_path);
        if (!pool.length) throw new Error('empty');
        const pick = pool[Math.floor(Math.random() * pool.length)];
        const poster = Lampa.TMDB.image('t/p/w500/' + pick.poster_path);

        ov.innerHTML =
          '<div class="horror-scare__reveal">' +
            '<div class="horror-scare__poster" style="background-image:url(' + esc(poster) + ');"></div>' +
            '<div class="horror-scare__title">' + esc(pick.title || pick.name) + '</div>' +
            '<div class="horror-scare__year">' + esc((pick.release_date || '').slice(0, 4)) + ' · ⭐ ' + esc((pick.vote_average || 0).toFixed(1)) + '</div>' +
            '<div class="horror-scare__actions">' +
              '<div class="horror-scare__btn horror-scare__btn--primary selector" data-a="open">' + esc(t('horror_frighten_open')) + '</div>' +
              '<div class="horror-scare__btn selector" data-a="again">' + esc(t('horror_frighten_again')) + '</div>' +
            '</div>' +
          '</div>';

        const open = ov.querySelector('[data-a="open"]');
        const again = ov.querySelector('[data-a="again"]');

        open.addEventListener('hover:enter', () => {
          close();
          setTimeout(() => Lampa.Router.call('full', {
            id: pick.id, source: 'tmdb', card: pick,
            method: pick.name ? 'tv' : 'movie',
          }), 250);
        });
        again.addEventListener('hover:enter', () => { close(); setTimeout(frightenMe, 300); });

        Lampa.Controller.add('horror_scare', {
          toggle: () => {
            Lampa.Controller.collectionSet(ov);
            Lampa.Controller.collectionFocus(open, ov);
          },
          up: () => Lampa.Controller.move('up'),
          down: () => Lampa.Controller.move('down'),
          left: () => Lampa.Controller.move('left'),
          right: () => Lampa.Controller.move('right'),
          back: close,
        });
        Lampa.Controller.toggle('horror_scare');
      }).catch(() => {
        Lampa.Noty.show(t('horror_frighten_fail'));
        close();
      });
    }, 2600);
  }

  // ================== КОМПОНЕНТ ==================
  // Оборачиваем Maker.make('Main') — вся вёрстка нативная для Lampa
  function HorrorComponent(object) {
    const comp = Lampa.Maker.make('Main', object);

    comp.use({
      onCreate: function () {
        const self = this;
        this.activity.loader(true);

        loadAll().then((rows) => {
          if (!rows.length) {
            self.activity.loader(false);
            return self.empty();
          }

          // Первая строка — кнопки поджанров + «Испугай меня»
          rows.unshift(buildControlsLine());

          self.build(rows);
        }).catch(() => {
          self.activity.loader(false);
          self.empty();
        });
      },
      onInstance: function (item, data) {
        // Стандартная обработка карточек из Lampa
        item.use({
          onEnter: function () {
            Lampa.Router.call('full', {
              id: data.id,
              source: 'tmdb',
              card: data,
              method: data.name ? 'tv' : 'movie',
            });
          },
          onFocus: function () {
            Lampa.Background.change(
              data.backdrop_path ? Lampa.TMDB.image('t/p/w780/' + data.backdrop_path) :
              data.poster_path  ? Lampa.TMDB.image('t/p/w300/' + data.poster_path) : ''
            );
          },
        });
      },
    });

    return comp;
  }

  // Строка с кнопками-поджанрами и «Испугай меня»
  function buildControlsLine() {
    const results = SUBGENRES.map((s) => ({
      id: 'sub_' + s.id,
      title: s.ru,
      params: { on: { enter: () => openSubgenre(s) } },
    }));

    results.push({
      id: 'frighten_me',
      title: '💀 ' + t('horror_frighten'),
      params: { on: { enter: frightenMe } },
    });

    return {
      title: t('horror_subgenres'),
      results: results,
      params: {
        module: Lampa.Maker.module('Line').only('Items', 'Create'),
        items: { view: 12, mapping: 'line' },
        scroll: { horizontal: true, step: 200 },
      },
    };
  }

  Lampa.Component.add('horror_page', HorrorComponent);

  // ================== МЕНЮ ==================
  Lampa.Menu.addButton(
    '<svg width="39" height="39" viewBox="0 0 39 39" fill="none"><circle cx="19.5" cy="19.5" r="16" stroke="currentColor" stroke-width="3"/><circle cx="13.5" cy="17" r="3" fill="currentColor"/><circle cx="25.5" cy="17" r="3" fill="currentColor"/><path d="M11 27c2-3 5-4 8.5-4s6.5 1 8.5 4" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none"/></svg>',
    t('horror_title'),
    function () {
      Lampa.Activity.push({
        url: '',
        title: t('horror_title'),
        component: 'horror_page',
        page: 1,
      });
    }
  );

  // ================== НАСТРОЙКИ ==================
  Lampa.SettingsApi.addComponent({
    component: 'horror',
    icon: '<svg width="39" height="39" viewBox="0 0 39 39"><circle cx="19.5" cy="19.5" r="16" stroke="white" stroke-width="3" fill="none"/><circle cx="13.5" cy="17" r="3" fill="white"/><circle cx="25.5" cy="17" r="3" fill="white"/><path d="M11 27c2-3 5-4 8.5-4s6.5 1 8.5 4" stroke="white" stroke-width="3" stroke-linecap="round" fill="none"/></svg>',
    name: t('horror_set_title'),
    after: 'more',
  });

  Lampa.SettingsApi.addParam({
    component: 'horror',
    param: { name: 'horror_min_rating', type: 'select', default: '0',
      values: { '0': '0', '5': '5', '6': '6', '7': '7', '8': '8' } },
    field: { name: t('horror_set_rating') },
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

  // ================== СТИЛИ ==================
  if (!document.getElementById('horror-styles')) {
    const s = document.createElement('style');
    s.id = 'horror-styles';
    s.textContent = `
      .horror-scare{position:fixed;inset:0;background:#000;z-index:99999;
        display:flex;align-items:center;justify-content:center;flex-direction:column;
        opacity:0;transition:opacity .5s,background .05s;pointer-events:none}
      .horror-scare.active{opacity:1;pointer-events:auto}
      .horror-scare--flash{background:#fff!important}
      .horror-scare__text{color:#8b0000;font-size:2.2em;font-weight:100;
        letter-spacing:.35em;text-transform:uppercase;opacity:0;transition:opacity 2s;
        font-family:serif;position:absolute;bottom:15%}
      .horror-scare.active .horror-scare__text{opacity:.85}
      .horror-scare__eyes{position:absolute;top:50%;left:50%;
        transform:translate(-50%,-50%);display:flex;gap:1.5em;opacity:0;transition:opacity 1.5s}
      .horror-scare__eye{width:1.6em;height:1.6em;border-radius:50%;background:#f00;
        box-shadow:0 0 2em #f00,0 0 4em #900,0 0 8em #500;
        animation:horrorBlink 4s infinite}
      @keyframes horrorBlink{0%,38%,44%,100%{opacity:1}40%,42%{opacity:0}}
      .horror-scare__reveal{display:flex;flex-direction:column;align-items:center;
        text-align:center;max-width:500px;padding:2em;animation:horrorFadeIn .6s ease}
      @keyframes horrorFadeIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
      .horror-scare__poster{width:220px;height:330px;background-size:cover;
        background-position:center;border-radius:1em;margin-bottom:1.5em;
        box-shadow:0 0 40px rgba(200,0,0,.5)}
      .horror-scare__title{color:#fff;font-size:1.5em;font-weight:600;margin-bottom:.4em}
      .horror-scare__year{color:#aaa;font-size:.95em;margin-bottom:1.5em}
      .horror-scare__actions{display:flex;gap:.8em;flex-wrap:wrap;justify-content:center}
      .horror-scare__btn{padding:.7em 1.6em;border-radius:2em;
        background:rgba(255,255,255,.1);color:#fff;transition:background .2s,transform .2s}
      .horror-scare__btn--primary{background:rgba(200,30,30,.6)}
      .horror-scare__btn.focus,.horror-scare__btn:hover{
        background:rgba(255,255,255,.3);transform:scale(1.05)}
    `;
    document.head.appendChild(s);
  }
})();
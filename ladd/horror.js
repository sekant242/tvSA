/* ============================================================================
 * Horror.js — базовый раздел ужасов для Lampa
 * Минимум кода: кнопка в меню + страница со строками из TMDB.
 * ========================================================================== */
(function () {
  'use strict';
  if (!window.Lampa || !Lampa.Maker) return;

  // ---------- Переводы ----------
  Lampa.Lang.add({
    horror_title:     { ru: 'Ужасы', en: 'Horror' },
    horror_recommend: { ru: 'Рекомендации', en: 'Recommended' },
    horror_movies:    { ru: 'Фильмы ужасов', en: 'Horror movies' },
    horror_tv:        { ru: 'Сериалы', en: 'TV series' },
    horror_fresh:     { ru: 'Новинки', en: 'New releases' },
    horror_top:       { ru: 'Топ ужасов', en: 'Top horror' },
  });

  const t = (k) => Lampa.Lang.translate(k);

  // ---------- TMDB ----------
  const net = new Lampa.Reguest();

  function tmdb(path, params) {
    const all = Object.assign(
      { api_key: Lampa.TMDB.key(), language: Lampa.Storage.field('tmdb_lang') || 'ru-RU' },
      params || {}
    );
    const url = path + (path.indexOf('?') === -1 ? '?' : '&') +
      Object.keys(all).map((k) => k + '=' + encodeURIComponent(all[k])).join('&');

    return new Promise((res, rej) =>
      net.silent(Lampa.TMDB.api(url), res, rej, false, { timeout: 10000 })
    );
  }

  // ---------- Строки ----------
  const seen = new Set();
  const dedupe = (items) => (items || []).filter(
    (i) => i && i.id && !seen.has(i.id) && seen.add(i.id)
  );

  const lineParams = () => ({
    module: Lampa.Maker.module('Line').MASK.base,
    items: { view: 6, mapping: 'line' },
    scroll: { horizontal: true, step: 320 },
  });

  function rowRecommend() {
    return tmdb('discover/movie', {
      with_genres: '27,53',
      sort_by: 'vote_average.desc',
      'vote_average.gte': 7.5,
      'vote_count.gte': 1000,
      include_adult: false,
    }).then((r) => ({ title: t('horror_recommend'), results: dedupe(r.results), params: lineParams() }));
  }

  function rowMovies() {
    return tmdb('discover/movie', {
      with_genres: '27',
      sort_by: 'popularity.desc',
      'vote_count.gte': 500,
      include_adult: false,
    }).then((r) => ({ title: t('horror_movies'), results: dedupe(r.results), params: lineParams() }));
  }

  function rowTV() {
    return tmdb('discover/tv', {
      with_genres: '27',
      sort_by: 'popularity.desc',
      'vote_count.gte': 300,
      include_adult: false,
    }).then((r) => ({ title: t('horror_tv'), results: dedupe(r.results), params: lineParams() }));
  }

  function rowFresh() {
    const y = new Date().getFullYear();
    return tmdb('discover/movie', {
      with_genres: '27',
      sort_by: 'primary_release_date.desc',
      'primary_release_date.gte': (y - 1) + '-01-01',
      'vote_count.gte': 30,
      include_adult: false,
    }).then((r) => ({ title: t('horror_fresh'), results: dedupe(r.results), params: lineParams() }));
  }

  function rowTop() {
    return tmdb('discover/movie', {
      with_genres: '27',
      sort_by: 'vote_average.desc',
      'vote_average.gte': 8,
      'vote_count.gte': 2000,
      include_adult: false,
    }).then((r) => ({ title: t('horror_top'), results: dedupe(r.results), params: lineParams() }));
  }

  // ---------- Компонент ----------
  function HorrorComponent(object) {
    const comp = Lampa.Maker.make('Main', object);

    comp.use({
      onCreate: function () {
        const self = this;
        this.activity.loader(true);

        Promise.allSettled([
          rowRecommend(), rowMovies(), rowFresh(), rowTop(), rowTV(),
        ]).then((res) => {
          const rows = res
            .filter((r) => r.status === 'fulfilled' && r.value && r.value.results.length)
            .map((r) => r.value);

          self.activity.loader(false);

          if (!rows.length) return self.empty();
          self.build(rows);
        });
      },
      onInstance: function (item, data) {
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
            const img = data.backdrop_path
              ? Lampa.TMDB.image('t/p/w780/' + data.backdrop_path)
              : data.poster_path
                ? Lampa.TMDB.image('t/p/w300/' + data.poster_path)
                : '';
            if (img) Lampa.Background.change(img);
          },
        });
      },
    });

    return comp;
  }

  Lampa.Component.add('horror_page', HorrorComponent);

  // ---------- Кнопка в меню ----------
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
})();
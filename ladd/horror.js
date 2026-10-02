/*
 * Плагин "Ужасы" для Lampa
 * Добавляет пункт меню, страницу с тремя лентами и стили в духе хоррора.
 */
(function () {
  'use strict';

  // Защита от повторной загрузки
  if (window.plugin_horror_ready) return;
  window.plugin_horror_ready = true;

  // ---------------------------------------------------------------------------
  // 1. Стили (внедряются в <head>)
  // ---------------------------------------------------------------------------
  function injectStyles() {
    const style = document.createElement('style');
    style.id = 'horror-plugin-styles';
    style.textContent = `
      /* Общий фон страницы */
      .horror-page {
        background: #0a0a0a;
        min-height: 100vh;
        padding: 20px 0;
        color: #e0e0e0;
      }

      /* Заголовок ленты */
      .horror-section__title {
        font-size: 1.6rem;
        font-weight: 700;
        letter-spacing: 2px;
        text-transform: uppercase;
        color: #b30000;
        margin: 0 0 16px 24px;
        text-shadow: 0 0 12px rgba(200, 0, 0, 0.6);
        position: relative;
      }
      .horror-section__title::after {
        content: '';
        position: absolute;
        left: 0;
        bottom: -6px;
        width: 80px;
        height: 3px;
        background: linear-gradient(90deg, #8b0000, transparent);
        border-radius: 2px;
      }

      /* Контейнер горизонтальной прокрутки */
      .horror-row {
        display: flex;
        overflow-x: auto;
        gap: 18px;
        padding: 0 24px 28px;
        scroll-behavior: smooth;
        scrollbar-width: none;
      }
      .horror-row::-webkit-scrollbar {
        display: none;
      }

      /* Крупная карточка */
      .horror-card {
        flex: 0 0 220px;
        height: 330px;
        border-radius: 10px;
        overflow: hidden;
        position: relative;
        background: #1a1a1a;
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.9);
        transition: transform 0.25s ease, box-shadow 0.25s ease;
        cursor: pointer;
      }
      .horror-card:hover {
        transform: scale(1.06);
        box-shadow: 0 0 30px rgba(180, 0, 0, 0.7);
      }

      /* Постер */
      .horror-card__poster {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      /* Кровавые подтёки (псевдоэлемент) */
      .horror-card::after {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        background:
          /* верхний подтёк */
          radial-gradient(ellipse at 20% 0%, rgba(139, 0, 0, 0.85) 0%, transparent 60%),
          radial-gradient(ellipse at 80% 0%, rgba(120, 0, 0, 0.7) 0%, transparent 55%),
          /* нижний подтёк */
          radial-gradient(ellipse at 50% 100%, rgba(100, 0, 0, 0.9) 0%, transparent 65%),
          /* капли */
          radial-gradient(circle at 15% 90%, rgba(139, 0, 0, 0.9) 0%, transparent 18%),
          radial-gradient(circle at 85% 85%, rgba(139, 0, 0, 0.8) 0%, transparent 15%);
        mix-blend-mode: multiply;
        opacity: 0.9;
      }

      /* Название на карточке */
      .horror-card__title {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        padding: 10px 12px;
        font-size: 0.95rem;
        font-weight: 600;
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.95));
        color: #f0f0f0;
        z-index: 2;
        text-shadow: 0 1px 4px #000;
      }

      /* Заглушка при отсутствии постера */
      .horror-card__placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
        color: #4a0000;
        background: #111;
      }

      /* Сообщение о загрузке / ошибке */
      .horror-message {
        padding: 20px 24px;
        color: #888;
        font-style: italic;
      }
    `;
    document.head.appendChild(style);
  }

  // ---------------------------------------------------------------------------
  // 2. Хелпер для запросов к TMDB
  // ---------------------------------------------------------------------------
  function tmdbGet(path, params) {
    return new Promise((resolve, reject) => {
      let url = Lampa.TMDB.api(path);
      if (params) {
        const qs = Object.keys(params)
          .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
          .join('&');
        url += (url.includes('?') ? '&' : '?') + qs;
      }
      Lampa.Request.get(url, data => resolve(data), err => reject(err));
    });
  }

  // ---------------------------------------------------------------------------
  // 3. Загрузка и отрисовка лент
  // ---------------------------------------------------------------------------
  async function loadSection(containerId, endpoint, params) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<div class="horror-message">Загрузка…</div>';

    try {
      const data = await tmdbGet(endpoint, params);
      const results = (data.results || []).slice(0, 20); // не более 20 карточек

      if (!results.length) {
        container.innerHTML = '<div class="horror-message">Ничего не найдено.</div>';
        return;
      }

      container.innerHTML = results.map(item => {
        const title = item.title || item.name || 'Без названия';
        const poster = item.poster_path
          ? Lampa.TMDB.image('w300' + item.poster_path)
          : null;
        const escapedTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;');

        return `
          <div class="horror-card" data-id="${item.id}" data-type="${endpoint.startsWith('tv') ? 'tv' : 'movie'}">
            ${poster
              ? `<img class="horror-card__poster" src="${poster}" alt="${escapedTitle}" loading="lazy">`
              : `<div class="horror-card__placeholder">🩸</div>`
            }
            <div class="horror-card__title">${escapedTitle}</div>
          </div>
        `;
      }).join('');

      // Клик по карточке — открываем детали
      container.querySelectorAll('.horror-card').forEach(card => {
        card.addEventListener('click', () => {
          const id = card.dataset.id;
          const type = card.dataset.type;
          Lampa.Activity.push({
            url: type === 'tv' ? 'tv' : 'movie',
            title: 'Подробнее',
            component: 'full',
            id: id,
            method: type === 'tv' ? 'tv' : 'movie'
          });
        });
      });

    } catch (e) {
      console.error('Horror plugin: ошибка загрузки', e);
      container.innerHTML = '<div class="horror-message">Ошибка загрузки. Попробуйте позже.</div>';
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Регистрация компонента страницы
  // ---------------------------------------------------------------------------
  function registerComponent() {
    Lampa.Component.add('horror_page', {
      template: `
        <div class="horror-page">
          <div class="horror-section">
            <div class="horror-section__title">Рекомендации (Ужасы и Триллеры)</div>
            <div class="horror-row" id="horror-recommendations"></div>
          </div>
          <div class="horror-section">
            <div class="horror-section__title">Фильмы ужасов</div>
            <div class="horror-row" id="horror-movies"></div>
          </div>
          <div class="horror-section">
            <div class="horror-section__title">Сериалы ужасов</div>
            <div class="horror-row" id="horror-series"></div>
          </div>
        </div>
      `,

      mounted: function () {
        // Лента 1: рекомендации — фильмы + сериалы с жанрами 27 (ужасы) и 53 (триллер)
        loadSection('horror-recommendations', 'discover/movie', {
          with_genres: '27,53',
          sort_by: 'popularity.desc',
          language: 'ru-RU'
        });

        // Лента 2: только фильмы ужасов
        loadSection('horror-movies', 'discover/movie', {
          with_genres: '27',
          sort_by: 'popularity.desc',
          language: 'ru-RU'
        });

        // Лента 3: только сериалы ужасов
        loadSection('horror-series', 'discover/tv', {
          with_genres: '27',
          sort_by: 'popularity.desc',
          language: 'ru-RU'
        });
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 5. Добавление пункта в боковое меню
  // ---------------------------------------------------------------------------
  function addMenuItem() {
    // Если уже добавлен — выходим
    if (document.querySelector('[data-action="horror"]')) return;

    const menuItem = $(`
      <li class="menu__item" data-action="horror">
        <a href="javascript:void(0)" class="menu__link">
          <span class="menu__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8 2 5 5 5 9c0 2.5 1.5 4.5 3 6l-1 5h10l-1-5c1.5-1.5 3-3.5 3-6 0-4-3-7-7-7z" fill="#8B0000"/>
              <circle cx="9" cy="9" r="1.5" fill="#fff"/>
              <circle cx="15" cy="9" r="1.5" fill="#fff"/>
              <path d="M8 13c1 1 2 1.5 4 1.5s3-.5 4-1.5" stroke="#8B0000" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </span>
          <span class="menu__title">Ужасы</span>
        </a>
      </li>
    `);

    menuItem.on('hover:enter', function () {
      Lampa.Activity.push({
        url: 'horror',
        title: 'Ужасы',
        component: 'horror_page'
      });
    });

    // Вставляем после пункта «Сериалы» (data-action="tv"), если он есть,
    // иначе — в конец списка
    const $menu = Lampa.Menu.render();
    const $tvItem = $menu.find('[data-action="tv"]');
    if ($tvItem.length) {
      $tvItem.after(menuItem);
    } else {
      $menu.find('.menu__list').append(menuItem);
    }
  }

  // ---------------------------------------------------------------------------
  // 6. Инициализация
  // ---------------------------------------------------------------------------
  function startPlugin() {
    injectStyles();
    registerComponent();

    if (window.appready) {
      addMenuItem();
    } else {
      Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') {
          addMenuItem();
        }
      });
    }
  }

  startPlugin();
})();
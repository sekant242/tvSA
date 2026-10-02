(function () {
  'use strict';

  // Защита от повторной загрузки
  if (window.plugin_horror_hub_ready) return;
  window.plugin_horror_hub_ready = true;

  // ---------------------------------------------------------------------------
  // 1. ВНЕДРЕНИЕ CSS (кровавые подтёки, крупные карточки, тёмная тема)
  // ---------------------------------------------------------------------------
  var style = document.createElement('style');
  style.textContent = `
    /* Контейнер страницы */
    .horror-hub {
      padding: 20px 0 40px;
      background: #0a0a0a;
      min-height: 100vh;
    }
    .horror-hub .items-line {
      margin-bottom: 30px;
    }
    .horror-hub .items-line__head {
      padding-left: 20px;
      margin-bottom: 12px;
    }
    .horror-hub .items-line__title {
      font-size: 1.6em;
      font-weight: 700;
      color: #cc0000;
      text-shadow: 0 0 10px rgba(200, 0, 0, 0.6);
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    /* Крупные карточки */
    .horror-hub .card {
      width: 220px;
      min-width: 220px;
      margin-right: 16px;
      border-radius: 8px;
      overflow: hidden;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      position: relative;
      background: #1a1a1a;
    }
    .horror-hub .card:hover {
      transform: scale(1.05);
      box-shadow: 0 0 25px rgba(200, 0, 0, 0.7);
    }
    /* Кровавые подтёки на постере */
    .horror-hub .card__view::after {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background:
        radial-gradient(ellipse at 20% 10%, rgba(180, 0, 0, 0.55) 0%, transparent 60%),
        radial-gradient(ellipse at 80% 30%, rgba(140, 0, 0, 0.45) 0%, transparent 55%),
        radial-gradient(ellipse at 50% 80%, rgba(120, 0, 0, 0.35) 0%, transparent 50%),
        linear-gradient(180deg, transparent 0%, transparent 60%, rgba(80, 0, 0, 0.6) 100%);
      pointer-events: none;
      z-index: 2;
      border-radius: 8px;
      mix-blend-mode: multiply;
    }
    /* Усиление кровавого эффекта при наведении */
    .horror-hub .card:hover .card__view::after {
      background:
        radial-gradient(ellipse at 20% 10%, rgba(220, 0, 0, 0.75) 0%, transparent 60%),
        radial-gradient(ellipse at 80% 30%, rgba(180, 0, 0, 0.65) 0%, transparent 55%),
        radial-gradient(ellipse at 50% 80%, rgba(160, 0, 0, 0.55) 0%, transparent 50%),
        linear-gradient(180deg, transparent 0%, transparent 55%, rgba(100, 0, 0, 0.8) 100%);
    }
    /* Название фильма в карточке */
    .horror-hub .card__title {
      color: #e0e0e0;
      font-size: 0.95em;
      text-shadow: 0 1px 3px #000;
    }
    /* Заголовок самой страницы (в Activity) */
    .horror-hub-header {
      font-size: 2.2em;
      color: #cc0000;
      text-align: center;
      padding: 20px 0 10px;
      text-shadow: 0 0 20px rgba(200, 0, 0, 0.8);
      letter-spacing: 3px;
      font-weight: 900;
    }
  `;
  document.head.appendChild(style);

  // ---------------------------------------------------------------------------
  // 2. ИКОНКА ДЛЯ БОКОВОГО МЕНЮ (череп)
  // ---------------------------------------------------------------------------
  var iconSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2a8 8 0 0 0-8 8v4a4 4 0 0 0 4 4h1v2h6v-2h1a4 4 0 0 0 4-4v-4a8 8 0 0 0-8-8z"/>
      <circle cx="9" cy="10" r="1.5" fill="currentColor"/>
      <circle cx="15" cy="10" r="1.5" fill="currentColor"/>
      <path d="M10 16v3M14 16v3"/>
    </svg>
  `;

  // ---------------------------------------------------------------------------
  // 3. ДОБАВЛЕНИЕ ПУНКТА В БОКОВОЕ МЕНЮ
  // ---------------------------------------------------------------------------
  function addMenuItem() {
    if (typeof Lampa.Menu === 'undefined' || !Lampa.Menu.addButton) return;

    Lampa.Menu.addButton({
      icon: iconSvg,
      title: 'Ужасы',
      action: function () {
        Lampa.Activity.push({
          url: '',
          title: 'Ужасы',
          component: 'horror_hub',
          page: 1,
          // Передаём данные, которые компонент может использовать
          data: {}
        });
      },
      // Позиция: после «Сериалы» (можно подстроить под свою сборку)
      position: 5
    });
  }

  // ---------------------------------------------------------------------------
  // 4. РЕГИСТРАЦИЯ КОМПОНЕНТА
  // ---------------------------------------------------------------------------
  function registerComponent() {
    Lampa.Component.add('horror_hub', {
      template: `
        <div class="horror-hub">
          <div class="horror-hub-header">УЖАСЫ</div>
          <div class="items-line" id="horror-recommendations">
            <div class="items-line__head">
              <div class="items-line__title">Рекомендации (Ужасы + Триллер)</div>
            </div>
            <div class="items-line__body">
              <div class="items-line__list"></div>
            </div>
          </div>
          <div class="items-line" id="horror-movies">
            <div class="items-line__head">
              <div class="items-line__title">Фильмы ужасов</div>
            </div>
            <div class="items-line__body">
              <div class="items-line__list"></div>
            </div>
          </div>
          <div class="items-line" id="horror-tv">
            <div class="items-line__head">
              <div class="items-line__title">Сериалы ужасов</div>
            </div>
            <div class="items-line__body">
              <div class="items-line__list"></div>
            </div>
          </div>
        </div>
      `,
      data: function () {
        return {};
      },
      mounted: function () {
        var self = this;
        // Запускаем загрузку данных после монтирования
        setTimeout(function () {
          loadContent(self);
        }, 100);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 5. ЗАГРУЗКА КОНТЕНТА ИЗ TMDB
  // ---------------------------------------------------------------------------
  var TMDB_API_KEY = '4ef0d7355d9ffb5151e987764708ce96'; // публичный ключ
  var TMDB_BASE = 'https://api.themoviedb.org/3';
  var IMG_BASE = 'https://image.tmdb.org/t/p/w300';

  function loadContent(component) {
    // 1. Рекомендации: фильмы + сериалы в жанрах ужасы (27) и триллер (53)
    var discoverUrl = TMDB_BASE + '/discover/movie?api_key=' + TMDB_API_KEY +
      '&with_genres=27,53&sort_by=popularity.desc&language=ru-RU&page=1';
    fetchAndRender(discoverUrl, '#horror-recommendations .items-line__list', component);

    // 2. Фильмы ужасов
    var moviesUrl = TMDB_BASE + '/discover/movie?api_key=' + TMDB_API_KEY +
      '&with_genres=27&sort_by=popularity.desc&language=ru-RU&page=1';
    fetchAndRender(moviesUrl, '#horror-movies .items-line__list', component);

    // 3. Сериалы ужасов
    var tvUrl = TMDB_BASE + '/discover/tv?api_key=' + TMDB_API_KEY +
      '&with_genres=27&sort_by=popularity.desc&language=ru-RU&page=1';
    fetchAndRender(tvUrl, '#horror-tv .items-line__list', component);
  }

  function fetchAndRender(url, selector, component) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            var data = JSON.parse(xhr.responseText);
            var results = data.results || [];
            var listEl = component.render().find(selector);
            if (!listEl.length) return;
            listEl.empty();
            results.slice(0, 20).forEach(function (item) {
              var card = createCard(item);
              listEl.append(card);
            });
          } catch (e) {
            console.error('Horror Hub: ошибка парсинга', e);
          }
        } else {
          console.error('Horror Hub: запрос не удался', xhr.status);
        }
      }
    };
    xhr.send();
  }

  function createCard(item) {
    var title = item.title || item.name || 'Без названия';
    var poster = item.poster_path ? IMG_BASE + item.poster_path : '';
    var cardHtml = `
      <div class="card card--category">
        <div class="card__view">
          <img class="card__img" src="${poster}" alt="${title}" loading="lazy">
        </div>
        <div class="card__title">${title}</div>
      </div>
    `;
    var $card = $(cardHtml);
    // Клик по карточке — открываем полную информацию (стандартный механизм Lampa)
    $card.on('hover:enter', function () {
      Lampa.Activity.push({
        url: '',
        title: title,
        component: 'full',
        id: item.id,
        type: item.media_type || (item.first_air_date ? 'tv' : 'movie'),
        data: item
      });
    });
    return $card;
  }

  // ---------------------------------------------------------------------------
  // 6. ИНИЦИАЛИЗАЦИЯ
  // ---------------------------------------------------------------------------
  function startPlugin() {
    addMenuItem();
    registerComponent();
  }

  if (window.appready) {
    startPlugin();
  } else {
    Lampa.Listener.follow('app', function (e) {
      if (e.type === 'ready') {
        startPlugin();
      }
    });
  }
})();
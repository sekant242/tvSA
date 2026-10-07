(function () {
  'use strict';

  var ICON_HORROR = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9v7c0 1.1.9 2 2 2h1v-3c0-.55.45-1 1-1s1 .45 1 1v3h4v-3c0-.55.45-1 1-1s1 .45 1 1v3h1c1.1 0 2-.9 2-2V9c0-3.87-3.13-7-7-7zm-4 8c-.83 0-1.5-.67-1.5-1.5S7.17 7 8 7s1.5.67 1.5 1.5S8.83 10 8 10zm8 0c-.83 0-1.5-.67-1.5-1.5S15.17 7 16 7s1.5.67 1.5 1.5S16.83 10 16 10z" fill="currentColor"/></svg>';

  var GENRE_HORROR = 27;

  var subgenres = [
    { title: 'Слэшеры', kw: '12339' },
    { title: 'Зомби', kw: '12377' },
    { title: 'Вампиры', kw: '3133' },
    { title: 'Призраки', kw: '9715' },
    { title: 'Одержимость', kw: '10349' },
    { title: 'Ведьмы', kw: '2302' },
    { title: 'Дома с привидениями', kw: '2543' },
    { title: 'Монстры', kw: '1299' },
    { title: 'Рептилии', kw: '156778' },
    { title: 'Найденная плёнка', kw: '163053' },
    { title: 'Психологические', kw: '10714' },
    { title: 'Телесный хоррор', kw: '155430' },
    { title: 'Культы', kw: '10541' },
    { title: 'Хэллоуин', kw: '207317' },
    { title: 'Рождественский хоррор', kw: '207822' },
    { title: 'Больничный хоррор', kw: '33352' },
    { title: 'Каннибалы', kw: '10556' },
    { title: 'Проклятия', kw: '10333' },
    { title: 'Демоны', kw: '10648' },
    { title: 'Космический хоррор', kw: '161919' }
  ];

  var studios = [
    { id: 3172, name: 'Blumhouse Productions' },
    { id: 41077, name: 'A24' },
    { id: 7738, name: 'Ghost House Pictures' },
    { id: 7991, name: 'Dark Castle Entertainment' },
    { id: 3060, name: 'Twisted Pictures' },
    { id: 101159, name: 'Atomic Monster' },
    { id: 12, name: 'New Line Cinema' },
    { id: 2149, name: 'Hammer Film Productions' },
    { id: 13006, name: 'Amicus Productions' },
    { id: 1423, name: 'Full Moon Features' },
    { id: 6775, name: 'Troma Entertainment' },
    { id: 4353, name: 'Vertigo Entertainment' },
    { id: 7505, name: 'Platinum Dunes' },
    { id: 118151, name: 'NEON' },
    { id: 90763, name: 'Annapurna Pictures' },
    { id: 20979, name: 'Rogue Pictures' },
    { id: 18726, name: 'Screen Gems' },
    { id: 9195, name: 'Lionsgate Horror' },
    { id: 1686, name: 'Skydance' },
    { id: 7295, name: 'Constantin Film' }
  ];

  /* Открыть страницу с фильмами по параметрам */
  function openCategory(title, params) {
    var activity = {
      url: 'discover/movie',
      title: title,
      component: 'category_full',
      source: 'tmdb',
      page: 1
    };
    for (var k in params) {
      if (Object.prototype.hasOwnProperty.call(params, k)) activity[k] = params[k];
    }
    Lampa.Activity.push(activity);
  }

  /* Список студий */
  function openStudiosPage() {
    var enabled = Lampa.Controller.enabled().name;
    var items = studios.map(function (s) {
      return { title: s.name, studio: s };
    });

    Lampa.Select.show({
      title: 'Студии хорроров',
      items: items,
      onSelect: function (item) {
        openCategory(item.studio.name, {
          genres: GENRE_HORROR,
          companies: item.studio.id,
          sort_by: 'popularity.desc'
        });
      },
      onBack: function () {
        Lampa.Controller.toggle(enabled);
      }
    });
  }

  /* Главная страница «Ужасы» */
  function openHorrorPage() {
    var enabled = Lampa.Controller.enabled().name;

    var items = [{ title: '🎬 Студии хорроров', studios: true }];
    subgenres.forEach(function (sg) {
      items.push({ title: sg.title, kw: sg.kw });
    });

    Lampa.Select.show({
      title: 'Ужасы',
      items: items,
      onSelect: function (item) {
        if (item.studios) {
          openStudiosPage();
        } else {
          openCategory('Ужасы: ' + item.title, {
            genres: GENRE_HORROR,
            keywords: item.kw
          });
        }
      },
      onBack: function () {
        Lampa.Controller.toggle(enabled);
      }
    });
  }

  /* Добавить кнопку в меню (с колбэком!) */
  var menuAdded = false;

  function tryAddMenuButton() {
    if (menuAdded) return true;
    try {
      if (!Lampa || !Lampa.Menu || typeof Lampa.Menu.addButton !== 'function') return false;

      // Вызов addButton с тремя аргументами — iконка, заголовок, обработчик
      Lampa.Menu.addButton(ICON_HORROR, 'Ужасы', function () {
        openHorrorPage();
      });

      menuAdded = true;
      console.log('Horror plugin: menu button added');
      return true;
    } catch (e) {
      console.log('Horror plugin: addMenuButton not ready yet:', e.message);
      return false;
    }
  }

  // 1) Слушаем событие окончания инициализации меню
  Lampa.Listener.follow('menu', function (e) {
    if (e.type === 'end') tryAddMenuButton();
  });

  // 2) Пытаемся сразу — на случай, если меню уже готово
  tryAddMenuButton();

  // 3) Ретрай-цикл на случай гонки при загрузке плагина
  var attempts = 0;
  var iv = setInterval(function () {
    attempts++;
    if (tryAddMenuButton() || attempts > 60) clearInterval(iv);
  }, 500);

})();
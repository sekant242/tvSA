(function() {
  "use strict";

  // Singleton защита от повторной загрузки плагина[reference:6]
  if (window.msx_plugin_loaded) return;
  window.msx_plugin_loaded = true;

  // Основная функция инициализации плагина[reference:7]
  function start() {
    if (window.msx_plugin_initialized) return;
    window.msx_plugin_initialized = true;

    // Добавляем пункт в главное меню
    Lampa.Menu.add({
      title: "MSX",
      icon: "<svg>...</svg>", // SVG иконка (замените на свою)
      component: "msx",
      onRender: function() {
        // Получаем URL для запуска MSX из настроек[reference:8]
        var msxUrl = Lampa.Storage.get('msxUrl', 'https://lampa-movie.github.io/lampa');
        
        // Запускаем стартовое окно MSX с помощью iframe[reference:9]
        Lampa.Activity.push({
          url: msxUrl,
          component: "iframe",
          title: "Media Station X"
        });
      }
    });

    // Создаем страницу настроек для плагина[reference:10]
    if (Lampa.Settings && Lampa.Settings.add) {
      Lampa.Settings.add({
        title: "MSX настройки",
        items: [
          {
            type: "input",
            name: "msxUrl",
            title: "MSX URL стартовый параметр",
            placeholder: "https://example.com/start.json",
            value: Lampa.Storage.get('msxUrl', 'https://lampa-movie.github.io/lampa'),
            onChange: function(value) {
              Lampa.Storage.set('msxUrl', value);
            }
          }
        ]
      });
    }

    console.log("MSX плагин инициализирован");
  }

  // Запуск плагина с проверкой готовности Lampa[reference:11]
  if (window.appready) {
    start();
  } else {
    Lampa.Listener.follow("app", function(e) {
      if (e.type === "ready") start();
    });
  }
})();
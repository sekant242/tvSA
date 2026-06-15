(function(){
    // === НАСТРОЙКИ ===
    var GAMES_SOURCE = 'https://sekant242.github.io/tvSA/lgs/games_list.json';   // URL со списком игр (JSON)
    var CACHE_KEY = 'games_cache';
    
    // === ЗАГРУЗКА СПИСКА ИГР ===
    function loadGames(callback){
        var cached = Lampa.Storage.get(CACHE_KEY);
        if (cached && cached.length) {
            callback(cached);
            return;
        }
        fetch(GAMES_SOURCE)
            .then(r => r.json())
            .then(data => {
                Lampa.Storage.set(CACHE_KEY, data);
                callback(data);
            })
            .catch(e => {
                console.error('Ошибка загрузки игр:', e);
                if (cached) callback(cached);
                else callback([]);
            });
    }
    
    // === КОМПОНЕНТ ДЛЯ ОТОБРАЖЕНИЯ ИГР (СПИСОК КАРТОЧЕК) ===
    function createGamesListTemplate(){
        return {
            type: 'list',
            title: 'Игровая комната',
            style: 'covers',
            fields: ['title', 'description', 'image', 'url'],
            onSelect: function(item){
                if (item && item.url) {
                    Lampa.Activity.push({
                        component: 'browser',
                        url: item.url,
                        title: item.title || 'Игра'
                    });
                }
            }
        };
    }
    
    // === ОТКРЫТИЕ ИГРОВОГО ЦЕНТРА ===
    function showGames(){
        loadGames(function(games){
            var items = games.map(function(game){
                return {
                    title: game.name || game.title || 'Без названия',
                    description: game.description || '',
                    image: game.image || '',
                    url: game.url || game.link
                };
            });
            Lampa.Activity.push({
                component: 'list',
                title: 'Игры',
                items: items,
                listTemplate: createGamesListTemplate()
            });
        });
    }
    
    // === ДОБАВЛЕНИЕ ПУНКТА В БОКОВОЕ МЕНЮ ===
    function addMenuButton(){
        // Проверяем, не добавлен ли уже пункт
        if (Lampa.Menu.get('games')) return;
        
        // Основной способ – Lampa.Menu.add (работает во всех версиях)
        if (typeof Lampa.Menu.add === 'function') {
            Lampa.Menu.add({
                id: 'games',
                title: 'Игры',
                icon: '',          // пустая иконка – строка, а не объект
                action: showGames
            });
        } 
        // Запасной вариант для очень старых версий
        else if (typeof Lampa.Menu.addButton === 'function') {
            Lampa.Menu.addButton({
                title: 'Игры',
                icon: '',
                action: showGames
            });
        } else {
            console.warn('Не удалось добавить пункт меню: Lampa.Menu недоступен');
        }
    }
    
    // === ИНИЦИАЛИЗАЦИЯ ПОСЛЕ ЗАГРУЗКИ LAMPA ===
    if (typeof Lampa !== 'undefined') {
        // Ждём события appready
        if (Lampa.Timer && Lampa.Timer.add) {
            Lampa.Timer.add('appready', addMenuButton);
        } else if (Lampa.events && Lampa.events.on) {
            Lampa.events.on('appready', addMenuButton);
        } else {
            // Если ничего нет – просто запускаем через небольшую задержку
            setTimeout(addMenuButton, 1500);
        }
    } else {
        console.error('Lampa не найдена');
    }
})();
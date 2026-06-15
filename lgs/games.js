(function(){
    // Ждём появления объекта Lampa
    function waitLampa(){
        if(typeof Lampa !== 'undefined' && Lampa.Menu && Lampa.Menu.add){
            // Добавляем пункт меню
            Lampa.Menu.add({
                id: 'games_menu',
                title: '🎮 Игры',
                icon: '',
                action: function(){
                    // Показываем простой список с двумя демо-играми
                    var demoGames = [
                        { title: '2048', url: 'https://play2048.co/' },
                        { title: 'Змейка', url: 'https://playsnake.org/' }
                    ];
                    var items = demoGames.map(function(g){
                        return { title: g.title, url: g.url };
                    });
                    Lampa.Activity.push({
                        component: 'list',
                        title: 'Игровая комната',
                        items: items,
                        listTemplate: {
                            type: 'list',
                            onSelect: function(item){
                                if(item && item.url){
                                    Lampa.Activity.push({
                                        component: 'browser',
                                        url: item.url,
                                        title: item.title
                                    });
                                }
                            }
                        }
                    });
                }
            });
            console.log('✅ Пункт "Игры" добавлен');
        } else {
            setTimeout(waitLampa, 500);
        }
    }
    waitLampa();
})();
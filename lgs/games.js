(function(){
    // Функция показа игр
    function showGames() {
        var mockGames = [
            { name: 'Змейка', url: 'https://playsnake.org', image: '', description: 'Классическая змейка' },
            { name: '2048', url: 'https://play2048.co', image: '', description: 'Сложи 2048' },
            { name: 'Flappy Bird', url: 'https://flappybird.io', image: '', description: 'Не упади' }
        ];
        Lampa.Activity.push({
            component: 'list',
            title: 'Игры',
            items: mockGames.map(g => ({
                title: g.name,
                description: g.description,
                url: g.url,
                image: g.image
            })),
            listTemplate: {
                type: 'list',
                style: 'covers',
                onSelect: function(item){
                    if(item.url) Lampa.Activity.push({ component: 'browser', url: item.url, title: item.title });
                }
            }
        });
    }

    // Функция добавления кнопки
    function addGameButton() {
        if(!window.Lampa || !Lampa.Menu) return false;
        if(Lampa.Menu.get('games')) return true; // уже есть
        
        try {
            Lampa.Menu.add({
                id: 'games',
                title: 'Игры',
                icon: '',
                action: showGames
            });
            console.log('✅ Пункт "Игры" добавлен');
            return true;
        } catch(e) {
            console.error('❌ Ошибка добавления:', e);
            return false;
        }
    }

    // Пытаемся добавить каждые 500 мс, максимум 10 раз
    var attempts = 0;
    var interval = setInterval(function(){
        attempts++;
        if(addGameButton()) {
            clearInterval(interval);
        } else if(attempts >= 10) {
            clearInterval(interval);
            console.warn('Не удалось добавить кнопку после 10 попыток');
        }
    }, 500);
})();
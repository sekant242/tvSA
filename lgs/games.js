(function() {
    if (typeof Lampa === 'undefined') {
        console.error('[EmptyPage] Lampa не найдена');
        return;
    }

    const COMPONENT_NAME = 'empty-page';
    let initialized = false;

    // Регистрируем компонент как объект с методом render
    function registerEmptyPageComponent() {
        // Проверяем, не зарегистрирован ли уже
        if (Lampa.Component.registered && Lampa.Component.registered[COMPONENT_NAME]) {
            return;
        }

        // Добавляем компонент без наследования от Base
        Lampa.Component.add(COMPONENT_NAME, {
            render: function(props) {
                // Создаём контейнер (используем jQuery, который всегда есть в Lampa)
                var container = $('<div>', {
                    class: 'empty-page-container',
                    css: {
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100vh',
                        flexDirection: 'column',
                        color: '#fff',
                        backgroundColor: '#141414'
                    }
                }).html(`
                    <div style="text-align: center;">
                        <i class="icon" style="font-size: 48px;">📄</i>
                        <h2 style="margin-top: 20px;">Пустая страница</h2>
                        <p style="opacity: 0.7;">Здесь пока ничего нет</p>
                    </div>
                `);
                return container;
            }
        });
    }

    // Добавляем кнопку в боковое меню
    function addMenuButton() {
        // Основной способ
        if (Lampa.Menu && typeof Lampa.Menu.add === 'function') {
            Lampa.Menu.add({
                title: 'Пустая',
                icon: 'web',
                component: COMPONENT_NAME
            });
        } 
        // Fallback для старых версий
        else if (Lampa.Menu) {
            Lampa.Menu.menu = Lampa.Menu.menu || [];
            Lampa.Menu.menu.push({
                title: 'Пустая',
                icon: 'web',
                component: COMPONENT_NAME
            });
            if (typeof Lampa.Menu.update === 'function') Lampa.Menu.update();
        } else {
            console.warn('[EmptyPage] Lampa.Menu не доступен');
        }
    }

    // Дожидаемся полной готовности приложения с небольшой задержкой
    Lampa.Listener.follow('app', function(e) {
        if (e.type === 'ready' && !initialized) {
            initialized = true;
            // Небольшая задержка, чтобы все внутренние модули Lampa точно подгрузились
            setTimeout(function() {
                registerEmptyPageComponent();
                addMenuButton();
                console.log('[EmptyPage] Кнопка добавлена в меню');
            }, 100);
        }
    });
})();
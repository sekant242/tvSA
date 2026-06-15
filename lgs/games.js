(function() {
    // Проверяем, что Lampa загружена
    if (typeof Lampa === 'undefined') {
        console.error('[EmptyPage] Lampa не найдена');
        return;
    }

    // Уникальное имя компонента, чтобы избежать конфликтов
    const COMPONENT_NAME = 'empty-page';
    let initialized = false;

    // Регистрируем компонент пустой страницы
    function registerEmptyPageComponent() {
        if (Lampa.Component && Lampa.Component.registered && Lampa.Component.registered[COMPONENT_NAME]) {
            return; // уже зарегистрирован
        }

        Lampa.Component.add(COMPONENT_NAME, class EmptyPage extends Lampa.Component.Base {
            constructor(props) {
                super(props);
                this.name = COMPONENT_NAME;
                this.title = 'Пустая страница';
            }

            render() {
                // Создаём контейнер с минимальной стилизацией
                this.view = $('<div>', {
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
                        <i class="icon">📄</i>
                        <h2 style="margin-top: 20px;">Пустая страница</h2>
                        <p style="opacity: 0.7;">Здесь пока ничего нет</p>
                    </div>
                `);

                return this.view;
            }
        });
    }

    // Добавляем кнопку в боковое меню
    function addMenuButton() {
        // Используем Lampa.Menu.add, если доступно, иначе Lampa.Menu.menu
        if (typeof Lampa.Menu !== 'undefined' && typeof Lampa.Menu.add === 'function') {
            Lampa.Menu.add({
                title: 'Пустая',
                icon: 'web', // любая иконка из стандартного набора Lampa / Material Icons
                component: COMPONENT_NAME,
                activity: {
                    component: COMPONENT_NAME
                }
            });
        } else {
            // Альтернативный способ для старых версий
            Lampa.Menu.menu = Lampa.Menu.menu || [];
            Lampa.Menu.menu.push({
                title: 'Пустая',
                icon: 'web',
                component: COMPONENT_NAME,
                activity: {
                    component: COMPONENT_NAME
                }
            });
            // Принудительно обновляем меню
            if (Lampa.Menu.update) Lampa.Menu.update();
        }
    }

    // Инициализация после готовности Lampa
    Lampa.Listener.follow('app', function(e) {
        if (e.type === 'ready' && !initialized) {
            initialized = true;
            registerEmptyPageComponent();
            addMenuButton();
            console.log('[EmptyPage] Плагин активирован, кнопка добавлена в меню');
        }
    });
})();
(function() {
    'use strict';

    const MAX_LOGS = 2000;
    let logBuffer = [];

    // Оригиналы console сохраним на случай, если Proxy не сработает (не обязательно)
    const origConsole = { ...console };

    function addLog(type, args) {
        const now = new Date();
        const time = now.toLocaleTimeString();
        const text = Array.from(args).map(arg => {
            if (typeof arg === 'object') {
                try { return JSON.stringify(arg); } catch(e) { return String(arg); }
            }
            return String(arg);
        }).join(' ');

        logBuffer.push({ time, type, text });
        if (logBuffer.length > MAX_LOGS) logBuffer.shift();

        if (window._devLogTextArea) {
            updateTextArea(window._devLogTextArea);
        }
    }

    // Глобальное API остаётся доступным
    window.DevLog = {
        log: function() { addLog('log', arguments); },
        error: function() { addLog('error', arguments); },
        warn: function() { addLog('warn', arguments); },
        info: function() { addLog('info', arguments); },
        debug: function() { addLog('debug', arguments); },
        clear: function() {
            logBuffer = [];
            if (window._devLogTextArea) updateTextArea(window._devLogTextArea);
        },
        getLogs: function() { return logBuffer.slice(); },
        add: function(type) {
            const args = Array.prototype.slice.call(arguments, 1);
            addLog(type, args);
        }
    };

    function updateTextArea(textarea) {
        if (!textarea) return;
        const text = logBuffer.map(entry =>
            `[${entry.time}] [${entry.type.toUpperCase()}] ${entry.text}`
        ).join('\n');
        textarea.value = text;
        // Прокрутка вниз автоматически при добавлении
        textarea.scrollTop = textarea.scrollHeight;
    }

    function fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try {
            document.execCommand('copy');
            if (Lampa && Lampa.Noty) Lampa.Noty.show('Скопировано!');
        } catch (err) {
            if (Lampa && Lampa.Noty) Lampa.Noty.show('Ошибка копирования');
        }
        document.body.removeChild(ta);
    }

    function openDevLog() {
        const old = document.querySelector('.devlog-activity');
        if (old) old.remove();

        const container = document.createElement('div');
        container.className = 'devlog-activity';
        container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;' +
            'background:#1a1a1a;z-index:10000;display:flex;flex-direction:column;';

        const header = document.createElement('div');
        header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;' +
            'padding:10px 15px;background:#111;color:#fff;font-size:18px;';
        header.innerHTML = '<span>🐞 Dev Log</span>';

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✖';
        closeBtn.style.cssText = 'background:none;border:none;color:#fff;font-size:22px;cursor:pointer;';
        closeBtn.addEventListener('click', () => container.remove());
        header.appendChild(closeBtn);

        const textarea = document.createElement('textarea');
        textarea.readOnly = true;
        textarea.style.cssText = 'flex:1;width:100%;background:#000;color:#0f0;' +
            'font-family:monospace;font-size:13px;border:none;outline:none;' +
            'resize:none;padding:10px;' +
            'white-space:pre;word-break:normal;overflow-x:auto;';
        window._devLogTextArea = textarea;
        updateTextArea(textarea);

        // Тестовое сообщение — появится сразу при открытии
        DevLog.log('DevLog opened');

        const footer = document.createElement('div');
        footer.style.cssText = 'display:flex;padding:10px;gap:10px;justify-content:flex-end;';

        const copyBtn = document.createElement('button');
        copyBtn.textContent = 'Copy All';
        copyBtn.style.cssText = 'padding:10px 20px;background:#333;color:#fff;border:none;border-radius:4px;';
        copyBtn.addEventListener('click', () => {
            const logText = textarea.value;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(logText)
                    .then(() => Lampa.Noty.show('Скопировано!'))
                    .catch(() => fallbackCopy(logText));
            } else {
                fallbackCopy(logText);
            }
        });

        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear';
        clearBtn.style.cssText = 'padding:10px 20px;background:#333;color:#fff;border:none;border-radius:4px;';
        clearBtn.addEventListener('click', () => DevLog.clear());

        footer.appendChild(copyBtn);
        footer.appendChild(clearBtn);
        container.appendChild(header);
        container.appendChild(textarea);
        container.appendChild(footer);
        document.body.appendChild(container);
    }

    // Инициализация перехвата console через Proxy (надёжный способ)
    function initLogger() {
        const handler = {
            get(target, prop) {
                const original = target[prop];
                if (typeof original === 'function' && ['log','error','warn','info','debug'].includes(prop)) {
                    return function(...args) {
                        // Сначала вызываем оригинальный метод (чтобы логи не пропадали)
                        original.apply(target, args);
                        // Затем добавляем в свой буфер
                        addLog(prop, args);
                    };
                }
                // Для всех остальных свойств (например, console.table) возвращаем как есть
                return original;
            }
        };
        // Сохраняем текущий console (уже может быть переопределён Lampa) и оборачиваем в Proxy
        const currentConsole = window.console;
        window.console = new Proxy(currentConsole, handler);
    }

    function waitForLampa(callback) {
        if (window.Lampa && Lampa.Component) {
            callback();
        } else {
            const check = setInterval(() => {
                if (window.Lampa && Lampa.Component) {
                    clearInterval(check);
                    callback();
                }
            }, 200);
        }
    }

    waitForLampa(() => {
        // Включаем перехват console после загрузки Lampa
        initLogger();

        // Кнопка на экране
        const fab = document.createElement('div');
        fab.id = 'devlog-fab';
        fab.innerHTML = 'LOG';
        fab.style.cssText = 'position:fixed;bottom:80px;right:15px;z-index:9999;' +
            'background:#e74c3c;color:#fff;width:48px;height:48px;display:flex;' +
            'align-items:center;justify-content:center;border-radius:50%;' +
            'font-weight:bold;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.5);' +
            'cursor:pointer;user-select:none;';
        fab.addEventListener('click', openDevLog);
        document.body.appendChild(fab);

        // Попытка добавить в боковое меню
        try {
            Lampa.Menu.add('plugins', {
                title: 'Dev Log',
                icon: 'log',
                action: openDevLog
            });
        } catch(e) {}
    });

})();
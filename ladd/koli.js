(function() {
    'use strict';

    const MAX_LOGS = 2000;
    let logBuffer = [];

    // Сохраняем оригинальные методы
    const origConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info,
        debug: console.debug
    };

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

        // Обновить текстовую область, если окно открыто
        if (window._devLogTextArea) {
            updateTextArea(window._devLogTextArea);
        }
    }

    // Перехватываем console
    console.log = function() { addLog('log', arguments); origConsole.log.apply(console, arguments); };
    console.error = function() { addLog('error', arguments); origConsole.error.apply(console, arguments); };
    console.warn = function() { addLog('warn', arguments); origConsole.warn.apply(console, arguments); };
    console.info = function() { addLog('info', arguments); origConsole.info.apply(console, arguments); };
    console.debug = function() { addLog('debug', arguments); origConsole.debug.apply(console, arguments); };

    // Глобальное API для использования другими плагинами
    window.DevLog = {
        log: function() { addLog('log', arguments); },
        error: function() { addLog('error', arguments); },
        warn: function() { addLog('warn', arguments); },
        info: function() { addLog('info', arguments); },
        debug: function() { addLog('debug', arguments); },
        clear: function() {
            logBuffer = [];
            if (window._devLogTextArea) {
                updateTextArea(window._devLogTextArea);
            }
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
            alert('Скопировано!');
        } catch (err) {
            alert('Ошибка копирования');
        }
        document.body.removeChild(ta);
    }

    // Ждём загрузку Lampa
    function waitForLampa(callback) {
        if (typeof Lampa !== 'undefined' && Lampa.Component) {
            callback();
        } else {
            const check = setInterval(() => {
                if (typeof Lampa !== 'undefined' && Lampa.Component) {
                    clearInterval(check);
                    callback();
                }
            }, 100);
        }
    }

    waitForLampa(() => {
        const activity = {
            title: 'Dev Log',
            component: function() {
                const container = document.createElement('div');
                container.className = 'devlog-container';
                container.style.cssText = 'display:flex;flex-direction:column;height:100%;padding:10px;box-sizing:border-box;';

                const textarea = document.createElement('textarea');
                textarea.readOnly = true;
                textarea.style.cssText = 'flex:1;width:100%;background:#111;color:#0f0;' +
                    'font-family:monospace;font-size:13px;border:1px solid #333;' +
                    'resize:none;padding:8px;white-space:pre-wrap;word-break:break-all;';
                window._devLogTextArea = textarea;
                updateTextArea(textarea);

                const buttonsDiv = document.createElement('div');
                buttonsDiv.style.cssText = 'display:flex;gap:10px;margin-top:10px;';

                const copyAllBtn = document.createElement('button');
                copyAllBtn.textContent = 'Copy All';
                copyAllBtn.style.cssText = 'padding:8px 15px;background:#333;color:#fff;' +
                    'border:none;border-radius:4px;cursor:pointer;';
                copyAllBtn.addEventListener('click', () => {
                    const logText = textarea.value;
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(logText)
                            .then(() => alert('Скопировано!'))
                            .catch(() => fallbackCopy(logText));
                    } else {
                        fallbackCopy(logText);
                    }
                });

                const clearBtn = document.createElement('button');
                clearBtn.textContent = 'Clear';
                clearBtn.style.cssText = 'padding:8px 15px;background:#333;color:#fff;' +
                    'border:none;border-radius:4px;cursor:pointer;';
                clearBtn.addEventListener('click', () => DevLog.clear());

                buttonsDiv.appendChild(copyAllBtn);
                buttonsDiv.appendChild(clearBtn);
                container.appendChild(textarea);
                container.appendChild(buttonsDiv);

                // Стили выделения
                const style = document.createElement('style');
                style.textContent = '.devlog-container textarea:focus { outline: none; }' +
                    '.devlog-container button:hover { background:#555; }';
                container.appendChild(style);

                return container;
            }
        };

        // Регистрируем вкладку
        if (Lampa.Activity && Lampa.Activity.add) {
            Lampa.Activity.add('devlog', activity);
        }

        // Добавляем пункт в меню
        if (Lampa.Menu && Lampa.Menu.add) {
            Lampa.Menu.add('plugins', {
                title: 'Dev Log',
                icon: 'log',
                action: () => {
                    if (Lampa.Activity && Lampa.Activity.open) {
                        Lampa.Activity.open('devlog');
                    }
                }
            });
        } else {
            // Плавающая кнопка как запасной вариант
            const btn = document.createElement('div');
            btn.textContent = 'LOG';
            btn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;' +
                'background:#e74c3c;color:#fff;padding:10px;border-radius:50%;' +
                'width:40px;height:40px;display:flex;align-items:center;justify-content:center;' +
                'cursor:pointer;font-weight:bold;box-shadow:0 2px 5px rgba(0,0,0,0.3);';
            btn.addEventListener('click', () => {
                if (Lampa.Activity && Lampa.Activity.open) {
                    Lampa.Activity.open('devlog');
                }
            });
            document.body.appendChild(btn);
        }
    });
})();
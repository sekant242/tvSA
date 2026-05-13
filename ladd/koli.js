(function() {
    'use strict';

    const MAX_LOGS = 2000;
    let logBuffer = [];

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

        if (window._devLogTextArea) {
            updateTextArea(window._devLogTextArea);
        }
    }

    console.log = function() { addLog('log', arguments); origConsole.log.apply(console, arguments); };
    console.error = function() { addLog('error', arguments); origConsole.error.apply(console, arguments); };
    console.warn = function() { addLog('warn', arguments); origConsole.warn.apply(console, arguments); };
    console.info = function() { addLog('info', arguments); origConsole.info.apply(console, arguments); };
    console.debug = function() { addLog('debug', arguments); origConsole.debug.apply(console, arguments); };

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
            Lampa.Noty.show('Скопировано!');
        } catch (err) {
            Lampa.Noty.show('Ошибка копирования');
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
        // ----- СТИЛИ С ГОРИЗОНТАЛЬНОЙ ПРОКРУТКОЙ -----
        textarea.style.cssText = 'flex:1;width:100%;background:#000;color:#0f0;' +
            'font-family:monospace;font-size:13px;border:none;outline:none;' +
            'resize:none;padding:10px;' +
            'white-space:pre;word-break:normal;overflow-x:auto;';  // <-- изменения
        window._devLogTextArea = textarea;
        updateTextArea(textarea);

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

        try {
            Lampa.Menu.add('plugins', {
                title: 'Dev Log',
                icon: 'log',
                action: openDevLog
            });
        } catch(e) {}
    });

})();
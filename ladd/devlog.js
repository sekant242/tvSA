(function() {
    'use strict';

    // Флаг для предотвращения двойной загрузки
    if (window.devlog_plugin) return;
    window.devlog_plugin = true;

    const MAX_LOGS = 2000;
    let logBuffer = [];
    let isLogWindowOpen = false;

    // --- Функции для работы с логами (без изменений, но вынесены выше) ---
    function addLog(type, args) {
        const now = new Date();
        const time = now.toLocaleTimeString();
        const text = Array.from(args).map(arg => {
            if (typeof arg === 'object') {
                try { return JSON.stringify(arg); }
                catch(e) { return String(arg); }
            }
            return String(arg);
        }).join(' ');

        logBuffer.push({ time, type, text });
        if (logBuffer.length > MAX_LOGS) logBuffer.shift();

        if (window._devLogTextArea && !window._devLogPaused) {
            updateTextArea(window._devLogTextArea);
        }
    }

    function updateTextArea(textarea) {
        if (!textarea) return;

        let filtered = getFilteredLogs();

        const text = filtered.map(entry => {
            if (window._devLogHideMeta) {
                return entry.text;
            } else {
                return `[${entry.time}] [${entry.type.toUpperCase()}] ${entry.text}`;
            }
        }).join('\n');

        textarea.value = text;
        if (window._devLogAutoScroll) {
            textarea.scrollTop = textarea.scrollHeight;
        }
    }

    function getFilteredLogs() {
        let filtered = window._devLogFilterType === 'all'
            ? logBuffer.slice()
            : logBuffer.filter(entry => entry.type === window._devLogFilterType);

        if (window._devLogSearchQuery && window._devLogSearchQuery.trim() !== '') {
            const query = window._devLogIgnoreCase ? window._devLogSearchQuery.toLowerCase() : window._devLogSearchQuery;
            filtered = filtered.filter(entry => {
                const haystack = window._devLogIgnoreCase ? entry.text.toLowerCase() : entry.text;
                return haystack.includes(query);
            });
        }
        return filtered;
    }
    // ----------------------------------------------

    const DevLog = {
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

    // Перехват console.log с защитой от зацикливания
    const originalConsole = window.console;
    const consoleMethods = ['log', 'error', 'warn', 'info', 'debug'];

    const consoleProxy = new Proxy(originalConsole, {
        get(target, prop) {
            if (consoleMethods.includes(prop) && typeof target[prop] === 'function') {
                return function(...args) {
                    target[prop](...args);
                    try { addLog(prop, args); } catch(e) {}
                };
            }
            return target[prop];
        }
    });
    window.console = consoleProxy;

    // --- UI Components ---
    function updateStatsBar(statsSpan, filteredCountSpan) {
        if (!statsSpan) return;
        const total = logBuffer.length;
        const byType = {
            log: logBuffer.filter(e => e.type === 'log').length,
            error: logBuffer.filter(e => e.type === 'error').length,
            warn: logBuffer.filter(e => e.type === 'warn').length,
            info: logBuffer.filter(e => e.type === 'info').length,
            debug: logBuffer.filter(e => e.type === 'debug').length
        };
        statsSpan.innerHTML = `📋 ${total} | 🔴 ${byType.error} | ⚠️ ${byType.warn}`;
        if (filteredCountSpan) {
            const filteredCount = getFilteredLogs().length;
            filteredCountSpan.innerHTML = `🔍 ${filteredCount}`;
        }
    }

    function openDevLog() {
        if (isLogWindowOpen) return;
        isLogWindowOpen = true;

        const old = document.querySelector('.devlog-activity');
        if (old) old.remove();

        const container = document.createElement('div');
        container.className = 'devlog-activity';
        Object.assign(container.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            background: '#1a1a1a', zIndex: '10001', display: 'flex', flexDirection: 'column',
            fontFamily: 'sans-serif'
        });

        // Заголовок
        const header = document.createElement('div');
        Object.assign(header.style, {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 15px', background: '#111', color: '#fff', fontSize: '18px',
            fontWeight: 'bold'
        });
        header.innerHTML = '📜 Dev Log';
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✖';
        Object.assign(closeBtn.style, {
            background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer'
        });
        closeBtn.onclick = () => { container.remove(); isLogWindowOpen = false; };
        header.appendChild(closeBtn);

        // Toolbar 1
        const toolbar1 = document.createElement('div');
        Object.assign(toolbar1.style, {
            display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 15px',
            background: '#222', color: '#fff', flexWrap: 'wrap'
        });

        const filterSelect = document.createElement('select');
        Object.assign(filterSelect.style, {
            background: '#333', color: '#fff', border: '1px solid #555', padding: '6px 10px', borderRadius: '6px'
        });
        filterSelect.innerHTML = `
            <option value="all">Все</option>
            <option value="log">📄 Log</option>
            <option value="error">🔴 Error</option>
            <option value="warn">⚠️ Warn</option>
            <option value="info">ℹ️ Info</option>
            <option value="debug">🐞 Debug</option>
        `;
        filterSelect.value = window._devLogFilterType || 'all';
        filterSelect.onchange = () => {
            window._devLogFilterType = filterSelect.value;
            if (window._devLogTextArea) updateTextArea(window._devLogTextArea);
            updateStatsBar(statsSpan, filteredCountSpan);
        };

        const hideMetaCheck = document.createElement('label');
        Object.assign(hideMetaCheck.style, { display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' });
        const hideMetaCb = document.createElement('input');
        hideMetaCb.type = 'checkbox';
        hideMetaCb.checked = window._devLogHideMeta || false;
        hideMetaCb.onchange = () => {
            window._devLogHideMeta = hideMetaCb.checked;
            if (window._devLogTextArea) updateTextArea(window._devLogTextArea);
        };
        hideMetaCheck.appendChild(hideMetaCb);
        hideMetaCheck.appendChild(document.createTextNode('Скрыть время/тип'));

        const statsSpan = document.createElement('span');
        Object.assign(statsSpan.style, { marginLeft: 'auto', fontSize: '12px', color: '#aaa' });

        const filteredCountSpan = document.createElement('span');
        Object.assign(filteredCountSpan.style, { fontSize: '12px', color: '#aaa', marginLeft: '5px' });

        toolbar1.appendChild(filterSelect);
        toolbar1.appendChild(hideMetaCheck);
        toolbar1.appendChild(statsSpan);
        toolbar1.appendChild(filteredCountSpan);

        // Toolbar 2
        const toolbar2 = document.createElement('div');
        Object.assign(toolbar2.style, {
            display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 15px',
            background: '#2a2a2a', color: '#fff', flexWrap: 'wrap'
        });

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = '🔍 Поиск...';
        Object.assign(searchInput.style, {
            padding: '6px 10px', borderRadius: '6px', border: '1px solid #555',
            background: '#333', color: '#fff', flex: '1', minWidth: '120px'
        });
        searchInput.value = window._devLogSearchQuery || '';
        searchInput.oninput = () => {
            window._devLogSearchQuery = searchInput.value;
            if (window._devLogTextArea) updateTextArea(window._devLogTextArea);
            updateStatsBar(statsSpan, filteredCountSpan);
        };

        const ignoreCaseCheck = document.createElement('label');
        Object.assign(ignoreCaseCheck.style, { display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' });
        const ignoreCaseCb = document.createElement('input');
        ignoreCaseCb.type = 'checkbox';
        ignoreCaseCb.checked = window._devLogIgnoreCase !== false;
        ignoreCaseCb.onchange = () => {
            window._devLogIgnoreCase = ignoreCaseCb.checked;
            if (window._devLogTextArea) updateTextArea(window._devLogTextArea);
        };
        ignoreCaseCheck.appendChild(ignoreCaseCb);
        ignoreCaseCheck.appendChild(document.createTextNode('Aa'));

        const autoScrollCheck = document.createElement('label');
        Object.assign(autoScrollCheck.style, { display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' });
        const autoScrollCb = document.createElement('input');
        autoScrollCb.type = 'checkbox';
        autoScrollCb.checked = window._devLogAutoScroll !== false;
        autoScrollCb.onchange = () => { window._devLogAutoScroll = autoScrollCb.checked; };
        autoScrollCheck.appendChild(autoScrollCb);
        autoScrollCheck.appendChild(document.createTextNode('📜 Автоскролл'));

        const pauseBtn = document.createElement('button');
        pauseBtn.textContent = '⏸️ Пауза';
        Object.assign(pauseBtn.style, {
            padding: '4px 12px', background: '#555', border: 'none', borderRadius: '6px',
            color: '#fff', cursor: 'pointer'
        });
        pauseBtn.onclick = () => {
            window._devLogPaused = !window._devLogPaused;
            pauseBtn.textContent = window._devLogPaused ? '▶️ Пуск' : '⏸️ Пауза';
            if (!window._devLogPaused && window._devLogTextArea) updateTextArea(window._devLogTextArea);
        };

        toolbar2.appendChild(searchInput);
        toolbar2.appendChild(ignoreCaseCheck);
        toolbar2.appendChild(autoScrollCheck);
        toolbar2.appendChild(pauseBtn);

        // Текстовая область
        const textarea = document.createElement('textarea');
        textarea.readOnly = true;
        Object.assign(textarea.style, {
            flex: '1', width: '100%', background: '#0a0a0a', color: '#0f0',
            fontFamily: 'monospace', fontSize: '13px', border: 'none', outline: 'none',
            resize: 'none', padding: '12px', whiteSpace: 'pre', wordBreak: 'break-all',
            overflowX: 'auto', lineHeight: '1.4'
        });
        window._devLogTextArea = textarea;
        updateTextArea(textarea);

        // Footer
        const footer = document.createElement('div');
        Object.assign(footer.style, {
            display: 'flex', padding: '12px', gap: '12px', justifyContent: 'flex-end',
            background: '#111'
        });

        const copyFilteredBtn = document.createElement('button');
        copyFilteredBtn.textContent = '📋 Копировать (фильтр)';
        Object.assign(copyFilteredBtn.style, {
            padding: '8px 16px', background: '#333', color: '#fff', border: 'none',
            borderRadius: '6px', cursor: 'pointer'
        });
        copyFilteredBtn.onclick = () => {
            const text = textarea.value;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => Lampa.Noty.show('Скопировано!')).catch(() => fallbackCopy(text));
            } else { fallbackCopy(text); }
        };

        const copyRawBtn = document.createElement('button');
        copyRawBtn.textContent = '📋 Копировать все';
        Object.assign(copyRawBtn.style, copyFilteredBtn.style);
        copyRawBtn.onclick = () => {
            const rawText = logBuffer.map(entry => `[${entry.time}] [${entry.type.toUpperCase()}] ${entry.text}`).join('\n');
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(rawText).then(() => Lampa.Noty.show('Скопировано!')).catch(() => fallbackCopy(rawText));
            } else { fallbackCopy(rawText); }
        };

        const clearBtn = document.createElement('button');
        clearBtn.textContent = '🗑️ Очистить';
        Object.assign(clearBtn.style, copyFilteredBtn.style);
        clearBtn.onclick = () => { DevLog.clear(); updateStatsBar(statsSpan, filteredCountSpan); };

        footer.appendChild(copyFilteredBtn);
        footer.appendChild(copyRawBtn);
        footer.appendChild(clearBtn);

        container.append(header, toolbar1, toolbar2, textarea, footer);
        document.body.appendChild(container);
        updateStatsBar(statsSpan, filteredCountSpan);
    }

    function fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            if (Lampa && Lampa.Noty) Lampa.Noty.show('Скопировано!');
        } catch (err) {
            if (Lampa && Lampa.Noty) Lampa.Noty.show('Ошибка копирования');
        }
        document.body.removeChild(ta);
    }

    // --- Интеграция с Lampa ---
    function initPlugin() {
        if (window.devlog_plugin_initialized) return;
        window.devlog_plugin_initialized = true;

        // Плавающая кнопка
        let fab = document.getElementById('devlog-fab');
        if (fab) fab.remove();

        fab = document.createElement('div');
        fab.id = 'devlog-fab';
        fab.textContent = 'LOG';
        Object.assign(fab.style, {
            position: 'fixed', bottom: '80px', right: '15px', zIndex: '9999',
            background: '#e74c3c', color: '#fff', width: '48px', height: '48px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '50%', fontWeight: 'bold', fontSize: '14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)', cursor: 'pointer', userSelect: 'none'
        });
        fab.onclick = openDevLog;
        document.body.appendChild(fab);

        // Добавление в меню Lampa
        if (typeof Lampa !== 'undefined' && Lampa.Menu && Lampa.Menu.add) {
            try {
                Lampa.Menu.add('settings', {
                    title: 'Dev Log',
                    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="18px" height="18px"><path d="M20,4H4C2.9,4,2,4.9,2,6v12c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V6C22,4.9,21.1,4,20,4z M20,18H4V6h16V18z M11,10h2v2h-2 V10z M7,10h2v2H7V10z M15,10h2v2h-2V10z"/></svg>',
                    action: openDevLog
                });
            } catch(e) {}
        }

        DevLog.log('DevLog плагин загружен');
    }

    // Ожидание загрузки Lampa
    let initInterval = setInterval(() => {
        if (window.Lampa && Lampa.Component && document.body) {
            clearInterval(initInterval);
            initPlugin();
        }
    }, 200);

    // Предоставляем доступ к DevLog глобально
    window.DevLog = DevLog;
})();
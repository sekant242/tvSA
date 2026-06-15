(function() {
    'use strict';

    // ======================== НАСТРОЙКИ ========================
    let MAX_LOGS = 2000;
    let AUTO_SAVE_KEY = 'devlog_buffer';
    let BLACKLIST_PATTERNS = [];   // массив строк или RegExp
    let THEME = 'dark';            // 'dark' или 'light'
    let SHOW_MILLISECONDS = true;
    let PAUSE_UPDATE = false;
    let ONLY_ERRORS_WARNINGS = false;  // режим "только ошибки и предупреждения"
    let CAPTURE_CONSOLE = true;
    let GROUP_INDENT = 0;
    let VIRTUAL_PAGE_SIZE = 200;
    let currentPage = 1;
    let totalFiltered = 0;

    let logBuffer = [];
    let filterType = 'all';
    let filterRegex = null;
    let filterText = '';
    let hideMeta = false;

    // Для console.time
    let timers = new Map();

    // Для восстановления при загрузке
    let restorePending = true;

    // ======================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ========================
    function safeStringify(obj, depth = 0, maxDepth = 5, seen = new WeakSet()) {
        if (depth > maxDepth) return '[Max Depth]';
        if (obj === null) return 'null';
        if (typeof obj === 'undefined') return 'undefined';
        if (typeof obj === 'function') return `[Function: ${obj.name || 'anonymous'}]`;
        if (typeof obj !== 'object') return String(obj);
        if (seen.has(obj)) return '[Circular]';
        seen.add(obj);
        try {
            if (obj instanceof Error) return `${obj.name}: ${obj.message}\n${obj.stack}`;
            if (obj instanceof HTMLElement) return `<${obj.tagName.toLowerCase()} class="${obj.className}">`;
            if (Array.isArray(obj)) {
                let arr = obj.map(item => safeStringify(item, depth+1, maxDepth, seen));
                return `[${arr.join(', ')}]`;
            }
            let res = {};
            for (let key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key))
                    res[key] = safeStringify(obj[key], depth+1, maxDepth, seen);
            }
            return JSON.stringify(res);
        } catch(e) {
            return `[Unserializable: ${e.message}]`;
        }
    }

    function formatArgs(args) {
        return Array.from(args).map(arg => {
            if (typeof arg === 'object') return safeStringify(arg);
            return String(arg);
        }).join(' ');
    }

    function shouldIgnore(text) {
        if (ONLY_ERRORS_WARNINGS && !['error','warn','assert'].includes(filterType)) {
            // если включен режим "только ошибки" и тип не входит, игнорируем
            if (filterType === 'all') return false;
            // но если фильтр специально установлен на другой тип, то всё равно показываем
        }
        for (let p of BLACKLIST_PATTERNS) {
            if (typeof p === 'string' && text.includes(p)) return true;
            if (p instanceof RegExp && p.test(text)) return true;
        }
        return false;
    }

    function addLog(type, args, customTrace = null) {
        if (!CAPTURE_CONSOLE) return;
        let now = new Date();
        let timeStr = SHOW_MILLISECONDS
            ? `${now.toLocaleTimeString()}.${now.getMilliseconds().toString().padStart(3,'0')}`
            : now.toLocaleTimeString();
        let text = formatArgs(args);
        if (type === 'trace' && customTrace) text += '\n' + customTrace;
        if (type === 'group' || type === 'groupCollapsed') {
            text = '▾ '.repeat(GROUP_INDENT) + text;
            GROUP_INDENT++;
        } else if (type === 'groupEnd') {
            if (GROUP_INDENT > 0) GROUP_INDENT--;
            text = '▴ '.repeat(GROUP_INDENT) + text;
            type = 'groupEnd';
        } else {
            text = '  '.repeat(GROUP_INDENT) + text;
        }

        if (shouldIgnore(text)) return;

        let entry = { time: timeStr, type, text, rawArgs: args }; // rawArgs для инспектора
        logBuffer.push(entry);
        if (logBuffer.length > MAX_LOGS) logBuffer.shift();

        // сохраняем в localStorage асинхронно
        if (AUTO_SAVE_KEY) {
            try {
                let toStore = logBuffer.map(e => ({ time: e.time, type: e.type, text: e.text }));
                localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(toStore));
            } catch(e) {}
        }

        updateFabCounter();
        if (!PAUSE_UPDATE && window._devLogContainer) {
            renderLogs();
        }

        // интеграция с Lampa: показываем уведомление при ошибке
        if (type === 'error' && window.Lampa && Lampa.Noty) {
            Lampa.Noty.show(`❌ ${text.slice(0, 100)}`, 3000, 'error');
        }
    }

    // ======================== ПЕРЕХВАТ КОНСОЛИ ========================
    let originalConsole = window.console;
    function initConsoleInterceptor() {
        if (window.console !== originalConsole) return;
        let handler = {
            get(target, prop) {
                let original = target[prop];
                if (typeof original === 'function') {
                    if (['log','error','warn','info','debug'].includes(prop)) {
                        return function(...args) {
                            if (CAPTURE_CONSOLE) original.apply(target, args);
                            addLog(prop, args);
                        };
                    }
                    if (prop === 'trace') {
                        return function(...args) {
                            if (CAPTURE_CONSOLE) original.apply(target, args);
                            let stack = new Error().stack?.split('\n').slice(2).join('\n') || '';
                            addLog('trace', args, stack);
                        };
                    }
                    if (prop === 'table') {
                        return function(...args) {
                            if (CAPTURE_CONSOLE) original.apply(target, args);
                            addLog('table', args);
                        };
                    }
                    if (prop === 'assert') {
                        return function(...args) {
                            if (CAPTURE_CONSOLE) original.apply(target, args);
                            addLog('assert', args);
                        };
                    }
                    if (prop === 'group' || prop === 'groupCollapsed' || prop === 'groupEnd') {
                        return function(...args) {
                            if (CAPTURE_CONSOLE) original.apply(target, args);
                            addLog(prop, args);
                        };
                    }
                    if (prop === 'time') {
                        return function(label) {
                            if (CAPTURE_CONSOLE) original.apply(target, [label]);
                            timers.set(label, performance.now());
                        };
                    }
                    if (prop === 'timeLog') {
                        return function(label) {
                            if (CAPTURE_CONSOLE) original.apply(target, arguments);
                            if (timers.has(label)) {
                                let duration = performance.now() - timers.get(label);
                                addLog('timeLog', [`${label}: ${duration.toFixed(2)}ms`]);
                            }
                        };
                    }
                    if (prop === 'timeEnd') {
                        return function(label) {
                            if (CAPTURE_CONSOLE) original.apply(target, [label]);
                            if (timers.has(label)) {
                                let duration = performance.now() - timers.get(label);
                                addLog('timeEnd', [`${label}: ${duration.toFixed(2)}ms`]);
                                timers.delete(label);
                            }
                        };
                    }
                }
                return original;
            }
        };
        window.console = new Proxy(originalConsole, handler);
    }

    // ======================== ФИЛЬТРАЦИЯ И ПАГИНАЦИЯ ========================
    function getFilteredLogs() {
        let filtered = [...logBuffer];
        if (filterType !== 'all') {
            filtered = filtered.filter(entry => entry.type === filterType);
        }
        if (filterRegex) {
            filtered = filtered.filter(entry => filterRegex.test(entry.text));
        } else if (filterText.trim() !== '') {
            let search = filterText.trim().toLowerCase();
            filtered = filtered.filter(entry => entry.text.toLowerCase().includes(search));
        }
        totalFiltered = filtered.length;
        return filtered;
    }

    function renderLogs() {
        let container = window._devLogContainer;
        if (!container || PAUSE_UPDATE) return;
        let filtered = getFilteredLogs();
        totalFiltered = filtered.length;

        // пагинация, если строк > 500
        let usePagination = totalFiltered > 500;
        let start = usePagination ? (currentPage-1)*VIRTUAL_PAGE_SIZE : 0;
        let end = usePagination ? start + VIRTUAL_PAGE_SIZE : totalFiltered;
        let pageEntries = filtered.slice(start, end);

        let html = '';
        for (let entry of pageEntries) {
            let line = hideMeta ? entry.text : `[${entry.time}] [${entry.type.toUpperCase()}] ${entry.text}`;
            let colorClass = `devlog-type-${entry.type}`;
            html += `<div class="devlog-line ${colorClass}" data-raw='${escapeHtml(JSON.stringify(entry.rawArgs))}'>${escapeHtml(line)}</div>`;
        }
        container.innerHTML = html;
        container.scrollTop = container.scrollHeight;

        // добавить обработчики клика для инспектора
        document.querySelectorAll('.devlog-line').forEach(el => {
            el.addEventListener('dblclick', (e) => {
                let raw = el.getAttribute('data-raw');
                if (raw) {
                    try {
                        let args = JSON.parse(raw);
                        showInspector(args);
                    } catch(e) {}
                }
            });
        });

        // обновить информацию о пагинации
        let infoSpan = document.getElementById('devlog-filter-info');
        if (infoSpan) {
            let pagText = usePagination ? ` (стр. ${currentPage}/${Math.ceil(totalFiltered/VIRTUAL_PAGE_SIZE)})` : '';
            infoSpan.textContent = `${pageEntries.length} / ${totalFiltered}${pagText}`;
        }
    }

    function escapeHtml(str) {
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    // Инспектор объектов (модальное окно)
    function showInspector(obj) {
        let modal = document.createElement('div');
        modal.style.cssText = 'position:fixed; top:20%; left:20%; width:60%; height:60%; background:#fff; border:2px solid #333; z-index:20000; overflow:auto; padding:10px; border-radius:8px;';
        let pre = document.createElement('pre');
        pre.textContent = JSON.stringify(obj, null, 2);
        modal.appendChild(pre);
        let close = document.createElement('button');
        close.textContent = 'Закрыть';
        close.style.cssText = 'position:absolute; top:5px; right:5px;';
        close.addEventListener('click', () => modal.remove());
        modal.appendChild(close);
        document.body.appendChild(modal);
    }

    // ======================== ТЕМЫ ========================
    function applyTheme() {
        let root = document.querySelector('.devlog-activity');
        if (!root) return;
        if (THEME === 'dark') {
            root.style.backgroundColor = '#1a1a1a';
            root.style.color = '#eee';
        } else {
            root.style.backgroundColor = '#f5f5f5';
            root.style.color = '#111';
        }
        // обновим стили для строк
        let style = document.getElementById('devlog-theme-style');
        if (!style) {
            style = document.createElement('style');
            style.id = 'devlog-theme-style';
            document.head.appendChild(style);
        }
        style.textContent = `
            .devlog-line { font-family: monospace; font-size:13px; white-space:pre-wrap; border-bottom:1px solid #333; padding:2px 5px; }
            .devlog-type-error { color: #ff5555; }
            .devlog-type-warn { color: #ffaa55; }
            .devlog-type-log { color: #55ff55; }
            .devlog-type-info { color: #55aaff; }
            .devlog-type-debug { color: #aa55ff; }
            .devlog-type-trace { color: #888; }
            .devlog-type-table { color: #ff88aa; }
            .devlog-type-assert { color: #ff0000; font-weight:bold; }
            .devlog-type-groupEnd { color: #ccc; }
            .devlog-activity.light .devlog-line { border-bottom-color: #ccc; }
        `;
    }

    // ======================== ЭКСПОРТ ========================
    function exportLogs(format) {
        let filtered = getFilteredLogs();
        let lines = filtered.map(entry => hideMeta ? entry.text : `[${entry.time}] [${entry.type.toUpperCase()}] ${entry.text}`);
        let content = lines.join('\n');
        if (format === 'csv') {
            content = filtered.map(e => `"${e.time}","${e.type}","${e.text.replace(/"/g,'""')}"`).join('\n');
        } else if (format === 'html') {
            content = `<!DOCTYPE html><html><head><meta charset=utf-8><title>DevLog Export</title><style>body{background:#000;color:#0f0;font-family:monospace;}</style></head><body><pre>${escapeHtml(content)}</pre></body></html>`;
        }
        let blob = new Blob([content], {type: 'text/plain'});
        let a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `devlog_${new Date().toISOString().slice(0,19)}.${format}`;
        a.click();
        URL.revokeObjectURL(a.href);
        showNoty(`Экспорт в ${format} выполнен`);
    }

    function showNoty(msg, type='info') {
        if (window.Lampa && Lampa.Noty) Lampa.Noty.show(msg);
        else alert(msg);
    }

    // ======================== СОЗДАНИЕ ОКНА (ВИДЖЕТ И ПОЛНОЕ ОКНО) ========================
    let isWidgetOpen = false;
    let widgetContainer = null;

    function createDevLogWindow(isWidget = false) {
        let old = document.querySelector('.devlog-activity');
        if (old && !isWidget) old.remove();
        if (isWidget && widgetContainer) {
            widgetContainer.style.display = widgetContainer.style.display === 'none' ? 'flex' : 'none';
            return;
        }

        let container = document.createElement('div');
        container.className = `devlog-activity ${THEME}`;
        container.style.cssText = isWidget
            ? 'position:fixed; bottom:140px; right:20px; width:500px; height:300px; background:#1a1a1a; z-index:10001; display:flex; flex-direction:column; border-radius:8px; border:1px solid #555; resize:both; overflow:auto;'
            : 'position:fixed; top:0; left:0; width:100%; height:100%; background:#1a1a1a; z-index:10000; display:flex; flex-direction:column;';
        
        // header
        let header = document.createElement('div');
        header.style.cssText = 'display:flex; justify-content:space-between; background:#111; padding:8px; cursor:move;';
        header.innerHTML = `<span>📋 Dev Log ${isWidget ? '(виджет)' : ''}</span>`;
        let closeBtn = document.createElement('button');
        closeBtn.textContent = '✖';
        closeBtn.style.cssText = 'background:none; border:none; color:#fff; cursor:pointer;';
        closeBtn.addEventListener('click', () => {
            if (isWidget) container.style.display = 'none';
            else container.remove();
        });
        header.appendChild(closeBtn);
        container.appendChild(header);

        // toolbar
        let toolbar = document.createElement('div');
        toolbar.style.cssText = 'display:flex; flex-wrap:wrap; gap:8px; padding:8px; background:#222; font-size:12px;';
        toolbar.innerHTML = `
            <select id="devlog-type-filter">
                <option value="all">All</option>
                <option value="log">Log</option>
                <option value="error">Error</option>
                <option value="warn">Warn</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
                <option value="trace">Trace</option>
                <option value="table">Table</option>
                <option value="assert">Assert</option>
            </select>
            <input type="text" id="devlog-search" placeholder="🔍 Поиск (regex: /.../)" style="width:150px;">
            <label><input type="checkbox" id="devlog-hide-meta"> Скрыть время/тип</label>
            <label><input type="checkbox" id="devlog-only-errors"> Только ошибки/warn</label>
            <button id="devlog-pause">⏸ Пауза</button>
            <button id="devlog-theme">🌓 Тема</button>
            <button id="devlog-export-txt">📄 TXT</button>
            <button id="devlog-export-csv">📊 CSV</button>
            <button id="devlog-export-html">🌐 HTML</button>
            <button id="devlog-clear">🗑 Очистить</button>
            <span id="devlog-filter-info" style="margin-left:auto;">0/0</span>
        `;
        container.appendChild(toolbar);

        // контейнер для логов (прокручиваемый)
        let logContainer = document.createElement('div');
        logContainer.style.cssText = 'flex:1; overflow-y:auto; padding:5px; background:#000;';
        container.appendChild(logContainer);
        window._devLogContainer = logContainer;

        // footer для доп. настроек
        let footer = document.createElement('div');
        footer.style.cssText = 'padding:5px; background:#222; display:flex; gap:10px; font-size:11px;';
        footer.innerHTML = `
            <label>Лимит: <input type="number" id="devlog-max-logs" value="${MAX_LOGS}" step="100" style="width:70px;"></label>
            <label>Чёрный список (через запятую): <input type="text" id="devlog-blacklist" placeholder="pattern1, pattern2" style="width:200px;"></label>
        `;
        container.appendChild(footer);

        document.body.appendChild(container);
        if (isWidget) widgetContainer = container;

        // подключение обработчиков
        document.getElementById('devlog-type-filter').value = filterType;
        document.getElementById('devlog-type-filter').addEventListener('change', e => {
            filterType = e.target.value;
            currentPage = 1;
            renderLogs();
        });
        let searchInput = document.getElementById('devlog-search');
        searchInput.addEventListener('input', e => {
            let val = e.target.value;
            if (val.startsWith('/') && val.endsWith('/')) {
                try { filterRegex = new RegExp(val.slice(1,-1)); filterText = ''; }
                catch(e){ filterRegex = null; filterText = val; }
            } else {
                filterText = val;
                filterRegex = null;
            }
            currentPage = 1;
            renderLogs();
        });
        document.getElementById('devlog-hide-meta').addEventListener('change', e => {
            hideMeta = e.target.checked;
            renderLogs();
        });
        document.getElementById('devlog-only-errors').addEventListener('change', e => {
            ONLY_ERRORS_WARNINGS = e.target.checked;
            if (ONLY_ERRORS_WARNINGS) filterType = 'all';
            renderLogs();
        });
        document.getElementById('devlog-pause').addEventListener('click', e => {
            PAUSE_UPDATE = !PAUSE_UPDATE;
            e.target.textContent = PAUSE_UPDATE ? '▶ Пуск' : '⏸ Пауза';
            if (!PAUSE_UPDATE) renderLogs();
        });
        document.getElementById('devlog-theme').addEventListener('click', () => {
            THEME = THEME === 'dark' ? 'light' : 'dark';
            applyTheme();
            renderLogs();
        });
        document.getElementById('devlog-export-txt').addEventListener('click', () => exportLogs('txt'));
        document.getElementById('devlog-export-csv').addEventListener('click', () => exportLogs('csv'));
        document.getElementById('devlog-export-html').addEventListener('click', () => exportLogs('html'));
        document.getElementById('devlog-clear').addEventListener('click', () => {
            if (confirm('Очистить все логи?')) {
                logBuffer = [];
                GROUP_INDENT = 0;
                timers.clear();
                renderLogs();
                updateFabCounter();
                if (AUTO_SAVE_KEY) localStorage.removeItem(AUTO_SAVE_KEY);
                showNoty('Логи очищены');
            }
        });
        document.getElementById('devlog-max-logs').addEventListener('change', e => {
            MAX_LOGS = parseInt(e.target.value,10);
            if (logBuffer.length > MAX_LOGS) logBuffer = logBuffer.slice(-MAX_LOGS);
            renderLogs();
        });
        let blacklistInput = document.getElementById('devlog-blacklist');
        blacklistInput.value = BLACKLIST_PATTERNS.join(',');
        blacklistInput.addEventListener('change', e => {
            let raw = e.target.value;
            BLACKLIST_PATTERNS = raw.split(',').map(s => s.trim()).filter(s=>s);
            renderLogs();
        });

        // Перетаскивание для виджета
        if (isWidget) {
            let offsetX, offsetY, startX, startY;
            header.addEventListener('mousedown', (e) => {
                startX = e.clientX;
                startY = e.clientY;
                offsetX = container.offsetLeft;
                offsetY = container.offsetTop;
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
            function onMouseMove(e) {
                let dx = e.clientX - startX;
                let dy = e.clientY - startY;
                container.style.left = (offsetX + dx) + 'px';
                container.style.top = (offsetY + dy) + 'px';
                container.style.right = 'auto';
                container.style.bottom = 'auto';
            }
            function onMouseUp() {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            }
        }

        renderLogs();
        applyTheme();
    }

    // ======================== FAB И ГОРЯЧИЕ КЛАВИШИ ========================
    function createFab() {
        if (document.getElementById('devlog-fab')) return;
        let fab = document.createElement('div');
        fab.id = 'devlog-fab';
        fab.innerHTML = '📋';
        fab.style.cssText = 'position:fixed; bottom:80px; right:15px; width:48px; height:48px; background:#e74c3c; color:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; cursor:pointer; z-index:9999; box-shadow:0 2px 8px rgba(0,0,0,0.5);';
        fab.addEventListener('click', () => createDevLogWindow(false));
        fab.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            createDevLogWindow(true);
        });
        document.body.appendChild(fab);
        let badge = document.createElement('span');
        badge.className = 'devlog-badge';
        badge.style.cssText = 'position:absolute; top:-5px; right:-5px; background:#f1c40f; color:#000; border-radius:20px; font-size:11px; padding:2px 5px;';
        fab.appendChild(badge);
        updateFabCounter = () => {
            let count = logBuffer.length;
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = 'block';
            } else badge.style.display = 'none';
        };
        updateFabCounter();
    }

    // ======================== ВОССТАНОВЛЕНИЕ ИЗ LOCALSTORAGE ========================
    function restoreFromStorage() {
        if (!AUTO_SAVE_KEY) return;
        let saved = localStorage.getItem(AUTO_SAVE_KEY);
        if (saved) {
            try {
                let arr = JSON.parse(saved);
                logBuffer = arr.map(e => ({ ...e, rawArgs: null })); // rawArgs не сохраняем
                renderLogs();
            } catch(e) {}
        }
    }

    // ======================== ИНИЦИАЛИЗАЦИЯ ========================
    function init() {
        initConsoleInterceptor();
        createFab();
        if (restorePending) restoreFromStorage();
        restorePending = false;

        // горячие клавиши
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.code === 'KeyL') {
                e.preventDefault();
                createDevLogWindow(false);
            }
            if (e.ctrlKey && e.code === 'KeyF' && document.querySelector('.devlog-activity')) {
                e.preventDefault();
                document.getElementById('devlog-search')?.focus();
            }
            if (e.key === 'Escape' && document.querySelector('.devlog-activity')) {
                let win = document.querySelector('.devlog-activity');
                if (win.style.position === 'fixed' && win.style.top === '0px') win.remove();
                else if (widgetContainer) widgetContainer.style.display = 'none';
            }
        });

        try {
            Lampa.Menu.add('plugins', {
                title: 'Dev Log Pro',
                icon: 'log',
                action: () => createDevLogWindow(false)
            });
        } catch(e) {}
    }

    function waitForLampa(cb) {
        if (window.Lampa && Lampa.Component) cb();
        else setInterval(() => { if (window.Lampa && Lampa.Component) { clearInterval(_i); cb(); } }, 200);
        let _i = setInterval(()=>{}, 1000);
    }
    waitForLampa(init);
})();
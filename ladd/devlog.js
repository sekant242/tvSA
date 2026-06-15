(function(){
    'use strict';

    // ========== НАСТРОЙКИ ПО УМОЛЧАНИЮ ==========
    let MAX_LOGS = 2000;
    let SERIALIZE_DEPTH = 5;
    let captureConsoleEnabled = true;
    let pauseUpdate = false;
    let filterType = 'all';
    let filterText = '';
    let useRegex = false;
    let hideMeta = false;
    let showMillisec = false;
    let blacklistPatterns = [];
    let onlyErrorsWarns = false;
    let notifyOnError = false;
    let currentTheme = 'dark';

    let logBuffer = [];
    let groupIndent = 0;
    let timers = new Map();
    let originalConsole = window.console;

    let logContainer = null;
    let mainWindow = null;
    let widgetWindow = null;
    let isWidgetVisible = false;
    let isDragging = false;
    let dragOffsetX = 0, dragOffsetY = 0;

    // ========== БЕЗОПАСНАЯ СЕРИАЛИЗАЦИЯ ==========
    function safeStringify(obj, depth = 0, maxDepth = SERIALIZE_DEPTH, seen = new WeakSet()) {
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
                const arr = obj.map(item => safeStringify(item, depth+1, maxDepth, seen));
                return `[${arr.join(', ')}]`;
            }
            const result = {};
            for (let key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    result[key] = safeStringify(obj[key], depth+1, maxDepth, seen);
                }
            }
            return JSON.stringify(result);
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
        if (onlyErrorsWarns && !text.match(/\[(ERROR|WARN)\]/i)) return true;
        for (let pattern of blacklistPatterns) {
            if (pattern instanceof RegExp) {
                if (pattern.test(text)) return true;
            } else if (typeof pattern === 'string' && text.includes(pattern)) {
                return true;
            }
        }
        return false;
    }

    function addLog(type, args, customTrace = null) {
        if (!captureConsoleEnabled) return;
        const now = new Date();
        let timeStr = showMillisec ? now.toLocaleTimeString() + '.' + now.getMilliseconds().toString().padStart(3,'0') : now.toLocaleTimeString();
        let text = formatArgs(args);
        if (type === 'trace' && customTrace) text += '\n' + customTrace;
        if (type === 'group' || type === 'groupCollapsed') {
            text = '▾ '.repeat(groupIndent) + text;
            groupIndent++;
        } else if (type === 'groupEnd') {
            if (groupIndent>0) groupIndent--;
            text = '▴ '.repeat(groupIndent) + text;
            type = 'groupEnd';
        } else {
            text = '  '.repeat(groupIndent) + text;
        }

        if (shouldIgnore(text)) return;

        if (notifyOnError && (type === 'error' || type === 'assert') && window.Lampa && Lampa.Noty) {
            Lampa.Noty.show(text.slice(0,100), 3000);
        }

        let rawArgsCopy = Array.from(args).map(arg => {
            try { return JSON.parse(JSON.stringify(arg)); }
            catch(e) { return String(arg); }
        });

        logBuffer.push({ time: timeStr, type, text, rawArgs: rawArgsCopy });
        if (logBuffer.length > MAX_LOGS) logBuffer.shift();
        saveToLocalStorage();
        updateFabCounter();
        if (!pauseUpdate) refreshLogDisplay();
    }

    // ========== ПЕРЕХВАТ КОНСОЛИ ==========
    function initConsoleInterceptor() {
        if (window.console !== originalConsole) return;
        const handler = {
            get(target, prop) {
                const originalMethod = target[prop];
                if (typeof originalMethod === 'function') {
                    if (['log','error','warn','info','debug'].includes(prop)) {
                        return function(...args) {
                            if (captureConsoleEnabled) originalMethod.apply(target, args);
                            addLog(prop, args);
                        };
                    }
                    if (prop === 'trace') {
                        return function(...args) {
                            if (captureConsoleEnabled) originalMethod.apply(target, args);
                            const stack = new Error().stack?.split('\n').slice(2).join('\n') || '';
                            addLog('trace', args, stack);
                        };
                    }
                    if (prop === 'table') {
                        return function(...args) {
                            if (captureConsoleEnabled) originalMethod.apply(target, args);
                            addLog('table', args);
                        };
                    }
                    if (prop === 'assert') {
                        return function(...args) {
                            if (captureConsoleEnabled) originalMethod.apply(target, args);
                            addLog('assert', args);
                        };
                    }
                    if (prop === 'group' || prop === 'groupCollapsed' || prop === 'groupEnd') {
                        return function(...args) {
                            if (captureConsoleEnabled) originalMethod.apply(target, args);
                            addLog(prop, args);
                        };
                    }
                    if (prop === 'time') {
                        return function(label = 'default') {
                            if (captureConsoleEnabled) originalMethod.apply(target, [label]);
                            timers.set(label, performance.now());
                            addLog('time', [label]);
                        };
                    }
                    if (prop === 'timeLog') {
                        return function(label = 'default', ...args) {
                            if (captureConsoleEnabled) originalMethod.apply(target, [label, ...args]);
                            const start = timers.get(label);
                            const duration = start ? (performance.now() - start).toFixed(2) : '?';
                            addLog('timeLog', [`${label}: ${duration}ms`, ...args]);
                        };
                    }
                    if (prop === 'timeEnd') {
                        return function(label = 'default') {
                            if (captureConsoleEnabled) originalMethod.apply(target, [label]);
                            const start = timers.get(label);
                            const duration = start ? (performance.now() - start).toFixed(2) : '?';
                            addLog('timeEnd', [`${label}: ${duration}ms`]);
                            timers.delete(label);
                        };
                    }
                }
                return originalMethod;
            }
        };
        window.console = new Proxy(originalConsole, handler);
    }

    // ========== LOCALSTORAGE ==========
    function saveToLocalStorage() {
        try {
            const toStore = logBuffer.map(entry => ({
                time: entry.time,
                type: entry.type,
                text: entry.text,
                rawArgs: entry.rawArgs
            }));
            localStorage.setItem('devlog_buffer', JSON.stringify(toStore));
        } catch(e) {}
    }

    function loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem('devlog_buffer');
            if (stored) {
                logBuffer = JSON.parse(stored);
                if (logBuffer.length > MAX_LOGS) logBuffer = logBuffer.slice(-MAX_LOGS);
                refreshLogDisplay();
                updateFabCounter();
            }
        } catch(e) {}
    }

    // ========== ОТОБРАЖЕНИЕ ЛОГОВ ==========
    function refreshLogDisplay() {
        if (!logContainer) return;
        let filtered = [...logBuffer];
        if (filterType !== 'all') {
            filtered = filtered.filter(entry => entry.type === filterType);
        }
        if (filterText !== '') {
            if (useRegex) {
                try {
                    const regex = new RegExp(filterText, 'i');
                    filtered = filtered.filter(entry => regex.test(entry.text));
                } catch(e) {}
            } else {
                const lower = filterText.toLowerCase();
                filtered = filtered.filter(entry => entry.text.toLowerCase().includes(lower));
            }
        }
        logContainer.innerHTML = '';
        const fragment = document.createDocumentFragment();
        for (let entry of filtered) {
            const lineDiv = document.createElement('div');
            lineDiv.className = `devlog-line devlog-${entry.type}`;
            let color = '';
            switch(entry.type) {
                case 'error': color = '#ff6b6b'; break;
                case 'warn': color = '#ffb347'; break;
                case 'log': color = '#6bff6b'; break;
                case 'info': color = '#6bc9ff'; break;
                case 'debug': color = '#aaaaaa'; break;
                case 'trace': color = '#d986ff'; break;
                case 'table': color = '#6ba5ff'; break;
                case 'time': case 'timeLog': case 'timeEnd': color = '#ffd966'; break;
                default: color = currentTheme==='dark' ? '#0f0' : '#000';
            }
            lineDiv.style.color = color;
            lineDiv.style.borderBottom = '1px solid rgba(128,128,128,0.2)';
            lineDiv.style.padding = '2px 5px';
            lineDiv.style.fontFamily = 'monospace';
            lineDiv.style.fontSize = '12px';
            lineDiv.style.whiteSpace = 'pre-wrap';
            lineDiv.style.wordBreak = 'break-all';
            let displayText = hideMeta ? entry.text : `[${entry.time}] [${entry.type.toUpperCase()}] ${entry.text}`;
            lineDiv.textContent = displayText;
            if (entry.rawArgs && entry.rawArgs.some(arg => typeof arg === 'object')) {
                lineDiv.style.cursor = 'pointer';
                lineDiv.title = 'Клик для просмотра объекта';
                lineDiv.addEventListener('click', (function(raw) { return function() { inspectObject(raw); }; })(entry.rawArgs));
            }
            fragment.appendChild(lineDiv);
        }
        logContainer.appendChild(fragment);
        logContainer.scrollTop = logContainer.scrollHeight;
        const infoSpan = document.getElementById('devlog-filter-info');
        if (infoSpan) infoSpan.textContent = `${filtered.length} / ${logBuffer.length}`;
    }

    function inspectObject(rawArgs) {
        let content = '';
        rawArgs.forEach((arg, idx) => {
            try {
                content += `Argument ${idx+1}:\n${JSON.stringify(arg, null, 2)}\n\n`;
            } catch(e) {
                content += `Argument ${idx+1}: [unserializable]\n`;
            }
        });
        const modal = document.createElement('div');
        modal.style.cssText = `
            position:fixed; top:10%; left:10%; width:80%; height:80%; background:#222; color:#fff;
            z-index:20000; border-radius:8px; display:flex; flex-direction:column;
            box-shadow:0 0 20px rgba(0,0,0,0.5); border:1px solid #555;
        `;
        const header = document.createElement('div');
        header.style.cssText = 'padding:8px; background:#333; border-radius:8px 8px 0 0; display:flex; justify-content:space-between;';
        header.innerHTML = '<b>Object Inspector</b>';
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✖';
        closeBtn.style.cssText = 'background:none; border:none; color:#fff; cursor:pointer;';
        closeBtn.onclick = () => modal.remove();
        header.appendChild(closeBtn);
        const pre = document.createElement('pre');
        pre.textContent = content;
        pre.style.cssText = 'flex:1; overflow:auto; padding:10px; margin:0; background:#1a1a1a; color:#0f0; font-family:monospace;';
        modal.appendChild(header);
        modal.appendChild(pre);
        document.body.appendChild(modal);
    }

    // ========== ПЛАВАЮЩИЙ ВИДЖЕТ ==========
    function createWidget() {
        if (widgetWindow) widgetWindow.remove();
        const widget = document.createElement('div');
        widget.id = 'devlog-widget';
        widget.style.cssText = `
            position:fixed; bottom:150px; right:20px; width:350px; height:250px;
            background:${currentTheme==='dark' ? '#1e1e1e' : '#f5f5f5'};
            border:1px solid ${currentTheme==='dark' ? '#444' : '#ccc'};
            border-radius:8px; z-index:10001; display:flex; flex-direction:column;
            box-shadow:0 4px 12px rgba(0,0,0,0.3); cursor:move; resize:both; overflow:hidden;
        `;
        const titleBar = document.createElement('div');
        titleBar.style.cssText = 'padding:5px 8px; background:#2c3e50; color:#fff; cursor:move; user-select:none; display:flex; justify-content:space-between;';
        titleBar.innerHTML = '<span>📋 DevLog Widget</span>';
        const closeWidget = document.createElement('button');
        closeWidget.textContent = '✖';
        closeWidget.style.cssText = 'background:none; border:none; color:#fff; cursor:pointer;';
        closeWidget.onclick = () => { widget.remove(); widgetWindow = null; isWidgetVisible = false; };
        titleBar.appendChild(closeWidget);
        const contentDiv = document.createElement('div');
        contentDiv.style.cssText = 'flex:1; overflow:auto; padding:4px; font-family:monospace; font-size:11px;';
        widget.appendChild(titleBar);
        widget.appendChild(contentDiv);
        document.body.appendChild(widget);
        widgetWindow = widget;
        titleBar.addEventListener('mousedown', (e) => {
            if (e.target === closeWidget) return;
            isDragging = true;
            dragOffsetX = e.clientX - widget.offsetLeft;
            dragOffsetY = e.clientY - widget.offsetTop;
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', () => {
                isDragging = false;
                document.removeEventListener('mousemove', onDrag);
            });
        });
        function onDrag(e) {
            if (!isDragging) return;
            let left = e.clientX - dragOffsetX;
            let top = e.clientY - dragOffsetY;
            left = Math.min(window.innerWidth - widget.offsetWidth, Math.max(0, left));
            top = Math.min(window.innerHeight - widget.offsetHeight, Math.max(0, top));
            widget.style.left = left + 'px';
            widget.style.top = top + 'px';
            widget.style.right = 'auto';
            widget.style.bottom = 'auto';
        }
        isWidgetVisible = true;
        function updateWidgetContent() {
            if (!widgetWindow) return;
            let lastLines = logBuffer.slice(-20).map(entry => hideMeta ? entry.text : `[${entry.time}] ${entry.text}`).join('\n');
            contentDiv.textContent = lastLines;
        }
        setInterval(updateWidgetContent, 500);
        updateWidgetContent();
    }

    // ========== ГЛАВНОЕ ОКНО ==========
    function openDevLog() {
        if (mainWindow) mainWindow.remove();
        mainWindow = document.createElement('div');
        mainWindow.className = 'devlog-activity';
        mainWindow.style.cssText = `
            position:fixed; top:0; left:0; width:100%; height:100%; background:${currentTheme==='dark' ? '#1a1a1a' : '#ffffff'};
            z-index:20000; display:flex; flex-direction:column; font-family:sans-serif;
        `;
        const header = document.createElement('div');
        header.style.cssText = `display:flex; justify-content:space-between; align-items:center; padding:10px 15px; background:#2c3e50; color:#fff; font-weight:bold;`;
        header.innerHTML = '📋 Dev Log Extended';
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✖';
        closeBtn.style.cssText = 'background:none; border:none; color:#fff; font-size:22px; cursor:pointer;';
        closeBtn.onclick = () => mainWindow.remove();
        header.appendChild(closeBtn);
        mainWindow.appendChild(header);

        const toolbar = document.createElement('div');
        toolbar.style.cssText = `display:flex; flex-wrap:wrap; gap:8px; padding:8px 12px; background:${currentTheme==='dark' ? '#222' : '#e0e0e0'}; border-bottom:1px solid #444;`;
        const select = document.createElement('select');
        select.style.cssText = 'background:#333; color:#fff; border:1px solid #555; padding:4px; border-radius:4px;';
        select.innerHTML = `<option value="all">All</option><option value="log">Log</option><option value="error">Error</option><option value="warn">Warn</option><option value="info">Info</option><option value="debug">Debug</option><option value="trace">Trace</option><option value="table">Table</option><option value="time">Time</option>`;
        select.value = filterType;
        select.onchange = () => { filterType = select.value; refreshLogDisplay(); };
        toolbar.appendChild(select);

        const searchInput = document.createElement('input');
        searchInput.placeholder = 'Поиск...';
        searchInput.style.cssText = 'background:#333; color:#fff; border:1px solid #555; padding:4px; border-radius:4px; width:150px;';
        searchInput.value = filterText;
        searchInput.oninput = () => { filterText = searchInput.value; refreshLogDisplay(); };
        toolbar.appendChild(searchInput);

        const regexLabel = document.createElement('label');
        regexLabel.style.cssText = 'display:flex; align-items:center; gap:4px; color:#fff;';
        const regexChk = document.createElement('input');
        regexChk.type = 'checkbox';
        regexChk.checked = useRegex;
        regexChk.onchange = () => { useRegex = regexChk.checked; refreshLogDisplay(); };
        regexLabel.appendChild(regexChk);
        regexLabel.appendChild(document.createTextNode('RegEx'));
        toolbar.appendChild(regexLabel);

        const hideLabel = document.createElement('label');
        hideLabel.style.cssText = 'display:flex; align-items:center; gap:4px; color:#fff;';
        const hideChk = document.createElement('input');
        hideChk.type = 'checkbox';
        hideChk.checked = hideMeta;
        hideChk.onchange = () => { hideMeta = hideChk.checked; refreshLogDisplay(); };
        hideLabel.appendChild(hideChk);
        hideLabel.appendChild(document.createTextNode('Скрыть время/тип'));
        toolbar.appendChild(hideLabel);

        const msLabel = document.createElement('label');
        msLabel.style.cssText = 'display:flex; align-items:center; gap:4px; color:#fff;';
        const msChk = document.createElement('input');
        msChk.type = 'checkbox';
        msChk.checked = showMillisec;
        msChk.onchange = () => { showMillisec = msChk.checked; refreshLogDisplay(); };
        msLabel.appendChild(msChk);
        msLabel.appendChild(document.createTextNode('мс'));
        toolbar.appendChild(msLabel);

        const pauseBtn = document.createElement('button');
        pauseBtn.textContent = pauseUpdate ? '▶ Пуск' : '⏸ Пауза';
        pauseBtn.style.cssText = 'background:#333; color:#fff; border:none; padding:4px 12px; border-radius:4px; cursor:pointer;';
        pauseBtn.onclick = () => { pauseUpdate = !pauseUpdate; pauseBtn.textContent = pauseUpdate ? '▶ Пуск' : '⏸ Пауза'; if(!pauseUpdate) refreshLogDisplay(); };
        toolbar.appendChild(pauseBtn);

        const onlyErrorsBtn = document.createElement('button');
        onlyErrorsBtn.textContent = onlyErrorsWarns ? '⚠️ Все логи' : '⚠️ Errors/Warns';
        onlyErrorsBtn.style.cssText = 'background:#e67e22; color:#fff; border:none; padding:4px 12px; border-radius:4px; cursor:pointer;';
        onlyErrorsBtn.onclick = () => { onlyErrorsWarns = !onlyErrorsWarns; onlyErrorsBtn.textContent = onlyErrorsWarns ? '⚠️ Все логи' : '⚠️ Errors/Warns'; refreshLogDisplay(); };
        toolbar.appendChild(onlyErrorsBtn);

        const widgetBtn = document.createElement('button');
        widgetBtn.textContent = isWidgetVisible ? '🪟 Скрыть виджет' : '🪟 Показать виджет';
        widgetBtn.style.cssText = 'background:#333; color:#fff; border:none; padding:4px 12px; border-radius:4px; cursor:pointer;';
        widgetBtn.onclick = () => {
            if (isWidgetVisible && widgetWindow) { widgetWindow.remove(); widgetWindow = null; isWidgetVisible = false; widgetBtn.textContent = '🪟 Показать виджет'; }
            else { createWidget(); widgetBtn.textContent = '🪟 Скрыть виджет'; }
        };
        toolbar.appendChild(widgetBtn);

        const themeBtn = document.createElement('button');
        themeBtn.textContent = currentTheme === 'dark' ? '🌞 Светлая' : '🌙 Тёмная';
        themeBtn.style.cssText = 'background:#333; color:#fff; border:none; padding:4px 12px; border-radius:4px; cursor:pointer;';
        themeBtn.onclick = () => {
            currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
            themeBtn.textContent = currentTheme === 'dark' ? '🌞 Светлая' : '🌙 Тёмная';
            mainWindow.style.background = currentTheme === 'dark' ? '#1a1a1a' : '#ffffff';
            toolbar.style.background = currentTheme === 'dark' ? '#222' : '#e0e0e0';
            if(logContainer) logContainer.style.background = currentTheme === 'dark' ? '#000' : '#fff';
            refreshLogDisplay();
        };
        toolbar.appendChild(themeBtn);

        const infoSpan = document.createElement('span');
        infoSpan.id = 'devlog-filter-info';
        infoSpan.style.cssText = 'margin-left:auto; background:#333; padding:2px 8px; border-radius:12px; color:#fff;';
        toolbar.appendChild(infoSpan);
        mainWindow.appendChild(toolbar);

        const toolbar2 = document.createElement('div');
        toolbar2.style.cssText = `display:flex; flex-wrap:wrap; gap:8px; padding:8px 12px; background:${currentTheme==='dark' ? '#2a2a2a' : '#d0d0d0'};`;
        const blacklistInput = document.createElement('input');
        blacklistInput.placeholder = 'Чёрный список (слова через запятую)';
        blacklistInput.style.cssText = 'background:#333; color:#fff; border:1px solid #555; padding:4px; border-radius:4px; flex:1;';
        blacklistInput.value = blacklistPatterns.map(p => p instanceof RegExp ? p.source : p).join(',');
        blacklistInput.onchange = () => {
            const parts = blacklistInput.value.split(',').map(s => s.trim()).filter(s => s);
            blacklistPatterns = parts.map(p => {
                if (p.startsWith('/') && p.endsWith('/')) {
                    try { return new RegExp(p.slice(1,-1)); } catch(e) { return p; }
                }
                return p;
            });
            refreshLogDisplay();
        };
        toolbar2.appendChild(blacklistInput);
        const notifyLabel = document.createElement('label');
        notifyLabel.style.cssText = 'display:flex; align-items:center; gap:4px; color:#fff;';
        const notifyChk = document.createElement('input');
        notifyChk.type = 'checkbox';
        notifyChk.checked = notifyOnError;
        notifyChk.onchange = () => { notifyOnError = notifyChk.checked; };
        notifyLabel.appendChild(notifyChk);
        notifyLabel.appendChild(document.createTextNode('Уведомления об ошибках'));
        toolbar2.appendChild(notifyLabel);
        mainWindow.appendChild(toolbar2);

        logContainer = document.createElement('div');
        logContainer.style.cssText = `flex:1; overflow:auto; background:${currentTheme==='dark' ? '#000' : '#fff'}; padding:5px; font-family:monospace;`;
        mainWindow.appendChild(logContainer);

        const footer = document.createElement('div');
        footer.style.cssText = `display:flex; gap:8px; padding:8px; background:${currentTheme==='dark' ? '#111' : '#e0e0e0'}; justify-content:flex-end;`;
        const copyBtn = document.createElement('button');
        copyBtn.textContent = '📋 Копировать (видимые)';
        copyBtn.onclick = () => {
            const visibleText = Array.from(logContainer.children).map(div => div.textContent).join('\n');
            if (navigator.clipboard) navigator.clipboard.writeText(visibleText).then(()=>showNoty('Скопировано!')).catch(()=>fallbackCopy(visibleText));
            else fallbackCopy(visibleText);
        };
        footer.appendChild(copyBtn);
        const exportTxt = document.createElement('button');
        exportTxt.textContent = '📄 TXT';
        exportTxt.onclick = () => exportLogs('txt');
        footer.appendChild(exportTxt);
        const exportCsv = document.createElement('button');
        exportCsv.textContent = '📊 CSV';
        exportCsv.onclick = () => exportLogs('csv');
        footer.appendChild(exportCsv);
        const exportHtml = document.createElement('button');
        exportHtml.textContent = '🌐 HTML';
        exportHtml.onclick = () => exportLogs('html');
        footer.appendChild(exportHtml);
        const clearBtn = document.createElement('button');
        clearBtn.textContent = '🗑 Очистить все';
        clearBtn.onclick = () => { if(confirm('Удалить все логи?')) { logBuffer = []; groupIndent=0; timers.clear(); saveToLocalStorage(); refreshLogDisplay(); updateFabCounter(); showNoty('Логи очищены'); } };
        footer.appendChild(clearBtn);
        mainWindow.appendChild(footer);

        document.body.appendChild(mainWindow);
        refreshLogDisplay();
        addLog('log', ['DevLog Extended открыт']);

        mainWindow.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'f') { e.preventDefault(); searchInput.focus(); }
            if (e.key === 'Escape') mainWindow.remove();
            if (e.ctrlKey && e.shiftKey && e.key === 'C') { copyBtn.click(); }
            if (e.ctrlKey && e.key === 's') { e.preventDefault(); exportLogs('txt'); }
        });
        mainWindow.focus();
    }

    function exportLogs(format) {
        let content = '';
        if (format === 'txt') {
            content = Array.from(logContainer.children).map(div => div.textContent).join('\n');
        } else if (format === 'csv') {
            content = 'Time,Type,Message\n' + logBuffer.map(entry => `"${entry.time}","${entry.type}","${entry.text.replace(/"/g,'""')}"`).join('\n');
        } else if (format === 'html') {
            content = `<html><head><meta charset="utf-8"><title>DevLog Export</title><style>body{background:#000;color:#0f0;font-family:monospace;}</style></head><body><pre>${Array.from(logContainer.children).map(div => div.textContent).join('\n')}</pre></body></html>`;
        }
        const blob = new Blob([content], {type: 'text/plain'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `devlog_${Date.now()}.${format}`;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    function fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;left:-9999px;';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        showNoty('Скопировано!');
        document.body.removeChild(ta);
    }

    function showNoty(msg) {
        if (window.Lampa && Lampa.Noty) Lampa.Noty.show(msg);
        else alert(msg);
    }

    function updateFabCounter() {
        const fab = document.getElementById('devlog-fab');
        if (!fab) return;
        const count = logBuffer.length;
        let badge = fab.querySelector('.devlog-badge');
        if (count>0 && !badge) {
            badge = document.createElement('span');
            badge.className = 'devlog-badge';
            fab.appendChild(badge);
        }
        if (badge) badge.textContent = count;
        if (count===0 && badge) badge.remove();
    }

    function createFab() {
        if (document.getElementById('devlog-fab')) return;
        const fab = document.createElement('div');
        fab.id = 'devlog-fab';
        fab.innerHTML = '📋';
        fab.style.cssText = `
            position:fixed; bottom:80px; right:15px; z-index:9999;
            background:#e74c3c; color:#fff; width:48px; height:48px;
            display:flex; align-items:center; justify-content:center;
            border-radius:50%; font-size:20px; box-shadow:0 2px 8px rgba(0,0,0,0.5);
            cursor:pointer; user-select:none; transition:0.2s;
        `;
        fab.onclick = openDevLog;
        document.body.appendChild(fab);
        const style = document.createElement('style');
        style.textContent = `.devlog-badge{position:absolute;top:-5px;right:-5px;background:#f1c40f;color:#000;border-radius:20px;font-size:11px;padding:2px 5px;min-width:18px;text-align:center;}`;
        document.head.appendChild(style);
    }

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    function init() {
        initConsoleInterceptor();
        createFab();  // сразу создаём кнопку, без ожидания Lampa
        loadFromLocalStorage();
        // Добавляем пункт в меню Lampa, когда она появится
        if (window.Lampa && Lampa.Menu) {
            try { Lampa.Menu.add('plugins', { title: 'Dev Log Extended', icon: 'log', action: openDevLog }); } catch(e) {}
        } else {
            const checkLampa = setInterval(() => {
                if (window.Lampa && Lampa.Menu) {
                    clearInterval(checkLampa);
                    try { Lampa.Menu.add('plugins', { title: 'Dev Log Extended', icon: 'log', action: openDevLog }); } catch(e) {}
                }
            }, 200);
        }
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.code === 'KeyL') { e.preventDefault(); openDevLog(); }
        });
    }

    // Запускаем после загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
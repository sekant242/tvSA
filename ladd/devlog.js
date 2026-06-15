(function() {
    'use strict';

    // ========== НАСТРОЙКИ ==========
    let MAX_LOGS = 2000;
    let SERIALIZE_DEPTH = 5;          // глубина сериализации объектов
    let captureConsoleEnabled = true;  // флаг включения/отключения перехвата
    let pauseUpdate = false;           // пауза обновления textarea

    let logBuffer = [];
    let filterType = 'all';
    let filterText = '';
    let hideMeta = false;
    let originalConsole = window.console; // сохранённый оригинал

    // Для группировки (console.group)
    let groupIndent = 0;

    // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
    function safeStringify(obj, depth = 0, maxDepth = SERIALIZE_DEPTH, seen = new WeakSet()) {
        if (depth > maxDepth) return '[Max Depth]';
        if (obj === null) return 'null';
        if (typeof obj === 'undefined') return 'undefined';
        if (typeof obj === 'function') return `[Function: ${obj.name || 'anonymous'}]`;
        if (typeof obj !== 'object') return String(obj);

        if (seen.has(obj)) return '[Circular]';
        seen.add(obj);

        try {
            if (obj instanceof Error) {
                return `${obj.name}: ${obj.message}\n${obj.stack}`;
            }
            if (obj instanceof HTMLElement) {
                return `<${obj.tagName.toLowerCase()} class="${obj.className}">`;
            }
            if (Array.isArray(obj)) {
                const arr = obj.map(item => safeStringify(item, depth + 1, maxDepth, seen));
                return `[${arr.join(', ')}]`;
            }
            const result = {};
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    result[key] = safeStringify(obj[key], depth + 1, maxDepth, seen);
                }
            }
            return JSON.stringify(result);
        } catch (e) {
            return `[Unserializable: ${e.message}]`;
        }
    }

    function formatArgs(args) {
        return Array.from(args).map(arg => {
            if (typeof arg === 'object') {
                return safeStringify(arg);
            }
            return String(arg);
        }).join(' ');
    }

    function addLog(type, args, customTrace = null) {
        if (!captureConsoleEnabled) return;

        const now = new Date();
        const time = now.toLocaleTimeString();
        let text = formatArgs(args);

        // Обработка trace – добавляем стек вызовов
        if (type === 'trace' && customTrace) {
            text += '\n' + customTrace;
        }
        // Обработка group – добавляем индентацию
        if (type === 'group' || type === 'groupCollapsed') {
            text = '▾ '.repeat(groupIndent) + text;
            groupIndent++;
        } else if (type === 'groupEnd') {
            if (groupIndent > 0) groupIndent--;
            text = '▴ '.repeat(groupIndent) + text;
            type = 'groupEnd';
        } else {
            text = '  '.repeat(groupIndent) + text;
        }

        logBuffer.push({ time, type, text });
        if (logBuffer.length > MAX_LOGS) logBuffer.shift();

        // Обновляем счётчик на FAB
        updateFabCounter();

        if (!pauseUpdate && window._devLogTextArea) {
            updateTextArea(window._devLogTextArea);
        }
    }

    // ========== ПЕРЕХВАТ КОНСОЛИ ==========
    function initConsoleInterceptor() {
        if (window.console !== originalConsole) {
            // уже перехвачено, ничего не делаем
            return;
        }

        const handler = {
            get(target, prop) {
                const originalMethod = target[prop];
                if (typeof originalMethod === 'function') {
                    // стандартные методы
                    if (['log', 'error', 'warn', 'info', 'debug'].includes(prop)) {
                        return function(...args) {
                            if (captureConsoleEnabled) originalMethod.apply(target, args);
                            addLog(prop, args);
                        };
                    }
                    // trace
                    if (prop === 'trace') {
                        return function(...args) {
                            if (captureConsoleEnabled) originalMethod.apply(target, args);
                            // получаем стек вызовов
                            const stack = new Error().stack?.split('\n').slice(2).join('\n') || '';
                            addLog('trace', args, stack);
                        };
                    }
                    // table
                    if (prop === 'table') {
                        return function(...args) {
                            if (captureConsoleEnabled) originalMethod.apply(target, args);
                            addLog('table', args);
                        };
                    }
                    // assert
                    if (prop === 'assert') {
                        return function(...args) {
                            if (captureConsoleEnabled) originalMethod.apply(target, args);
                            addLog('assert', args);
                        };
                    }
                    // group / groupCollapsed / groupEnd
                    if (prop === 'group' || prop === 'groupCollapsed' || prop === 'groupEnd') {
                        return function(...args) {
                            if (captureConsoleEnabled) originalMethod.apply(target, args);
                            addLog(prop, args);
                        };
                    }
                }
                return originalMethod;
            }
        };
        window.console = new Proxy(originalConsole, handler);
    }

    // ========== ОБНОВЛЕНИЕ UI ==========
    function updateTextArea(textarea) {
        if (!textarea || pauseUpdate) return;

        let filtered = [...logBuffer];
        if (filterType !== 'all') {
            filtered = filtered.filter(entry => entry.type === filterType);
        }
        if (filterText.trim() !== '') {
            const search = filterText.trim().toLowerCase();
            filtered = filtered.filter(entry => entry.text.toLowerCase().includes(search));
        }

        const lines = filtered.map(entry => {
            if (hideMeta) return entry.text;
            return `[${entry.time}] [${entry.type.toUpperCase()}] ${entry.text}`;
        }).join('\n');

        textarea.value = lines;
        textarea.scrollTop = textarea.scrollHeight;

        // обновим счётчик отфильтрованных (опционально)
        const infoSpan = document.getElementById('devlog-filter-info');
        if (infoSpan) {
            infoSpan.textContent = `${filtered.length} / ${logBuffer.length}`;
        }
    }

    function updateFabCounter() {
        const fab = document.getElementById('devlog-fab');
        if (fab && !pauseUpdate) {
            const count = logBuffer.length;
            fab.setAttribute('data-count', count > 0 ? count : '');
            if (count > 0 && !fab.querySelector('.badge')) {
                const badge = document.createElement('span');
                badge.className = 'devlog-badge';
                badge.textContent = count;
                fab.appendChild(badge);
            } else if (fab.querySelector('.badge')) {
                fab.querySelector('.badge').textContent = count;
                if (count === 0) fab.querySelector('.badge').remove();
            }
        }
    }

    // ========== ЭКСПОРТ В ФАЙЛ ==========
    function exportLogs(format = 'txt') {
        const textarea = window._devLogTextArea;
        if (!textarea) return;
        const content = textarea.value;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `devlog_${new Date().toISOString().slice(0,19)}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // ========== КОПИРОВАНИЕ ==========
    function fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;left:-9999px;';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            showNoty('Скопировано!');
        } catch (err) {
            showNoty('Ошибка копирования', 'error');
        }
        document.body.removeChild(ta);
    }

    function copyFilteredLogs() {
        const textarea = window._devLogTextArea;
        if (!textarea) return;
        const text = textarea.value;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => showNoty('Скопировано!'))
                .catch(() => fallbackCopy(text));
        } else {
            fallbackCopy(text);
        }
    }

    function showNoty(msg, type = 'success') {
        if (window.Lampa && Lampa.Noty) {
            Lampa.Noty.show(msg);
        } else {
            alert(msg);
        }
    }

    // ========== ОТКРЫТИЕ ГЛАВНОГО ОКНА ==========
    function openDevLog() {
        const old = document.querySelector('.devlog-activity');
        if (old) old.remove();

        const container = document.createElement('div');
        container.className = 'devlog-activity';
        container.style.cssText = `
            position:fixed; top:0; left:0; width:100%; height:100%;
            background:#1a1a1a; z-index:10000;
            display:flex; flex-direction:column;
            font-family:sans-serif;
        `;

        // Шапка
        const header = document.createElement('div');
        header.style.cssText = `
            display:flex; justify-content:space-between; align-items:center;
            padding:10px 15px; background:#111; color:#fff;
            font-size:18px; font-weight:bold;
        `;
        header.innerHTML = '📋 Dev Log';
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✖';
        closeBtn.style.cssText = 'background:none; border:none; color:#fff; font-size:22px; cursor:pointer;';
        closeBtn.addEventListener('click', () => container.remove());
        header.appendChild(closeBtn);
        container.appendChild(header);

        // Панель инструментов (первая строка)
        const toolbar = document.createElement('div');
        toolbar.style.cssText = `
            display:flex; flex-wrap:wrap; align-items:center; gap:8px;
            padding:8px 12px; background:#222; color:#fff; font-size:13px;
        `;

        // Фильтр по типу
        const select = document.createElement('select');
        select.style.cssText = 'background:#333; color:#fff; border:1px solid #555; padding:4px 8px; border-radius:4px;';
        select.innerHTML = `
            <option value="all">All</option>
            <option value="log">Log</option>
            <option value="error">Error</option>
            <option value="warn">Warn</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
            <option value="trace">Trace</option>
            <option value="table">Table</option>
            <option value="assert">Assert</option>
        `;
        select.value = filterType;
        select.addEventListener('change', () => {
            filterType = select.value;
            updateTextArea(window._devLogTextArea);
        });
        toolbar.appendChild(select);

        // Поиск по тексту
        const searchInput = document.createElement('input');
        searchInput.placeholder = '🔍 Поиск...';
        searchInput.style.cssText = 'background:#333; color:#fff; border:1px solid #555; padding:4px 8px; border-radius:4px; width:150px;';
        searchInput.value = filterText;
        searchInput.addEventListener('input', () => {
            filterText = searchInput.value;
            updateTextArea(window._devLogTextArea);
        });
        toolbar.appendChild(searchInput);

        // Чекбокс "Скрыть метаданные"
        const labelHide = document.createElement('label');
        labelHide.style.cssText = 'display:flex; align-items:center; gap:4px; cursor:pointer;';
        const chkHide = document.createElement('input');
        chkHide.type = 'checkbox';
        chkHide.checked = hideMeta;
        chkHide.addEventListener('change', () => {
            hideMeta = chkHide.checked;
            updateTextArea(window._devLogTextArea);
        });
        labelHide.appendChild(chkHide);
        labelHide.appendChild(document.createTextNode('Скрыть время/тип'));
        toolbar.appendChild(labelHide);

        // Кнопка паузы
        const pauseBtn = document.createElement('button');
        pauseBtn.textContent = '⏸ Пауза';
        pauseBtn.style.cssText = 'background:#333; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;';
        pauseBtn.addEventListener('click', () => {
            pauseUpdate = !pauseUpdate;
            pauseBtn.textContent = pauseUpdate ? '▶ Пуск' : '⏸ Пауза';
            if (!pauseUpdate) updateTextArea(window._devLogTextArea);
        });
        toolbar.appendChild(pauseBtn);

        // Информация о количестве
        const infoSpan = document.createElement('span');
        infoSpan.id = 'devlog-filter-info';
        infoSpan.style.cssText = 'margin-left:auto; background:#333; padding:2px 8px; border-radius:12px;';
        toolbar.appendChild(infoSpan);

        container.appendChild(toolbar);

        // Вторая строка тулбара (дополнительные кнопки)
        const toolbar2 = document.createElement('div');
        toolbar2.style.cssText = `
            display:flex; flex-wrap:wrap; align-items:center; gap:8px;
            padding:0 12px 8px 12px; background:#222;
        `;

        // Настройка MAX_LOGS
        const maxLogsLabel = document.createElement('span');
        maxLogsLabel.textContent = 'Лимит: ';
        maxLogsLabel.style.color = '#fff';
        const maxLogsInput = document.createElement('input');
        maxLogsInput.type = 'number';
        maxLogsInput.value = MAX_LOGS;
        maxLogsInput.min = 100;
        maxLogsInput.max = 10000;
        maxLogsInput.step = 100;
        maxLogsInput.style.cssText = 'width:80px; background:#333; color:#fff; border:1px solid #555; border-radius:4px; padding:2px 4px;';
        maxLogsInput.addEventListener('change', () => {
            MAX_LOGS = parseInt(maxLogsInput.value, 10);
            if (logBuffer.length > MAX_LOGS) {
                logBuffer = logBuffer.slice(-MAX_LOGS);
                updateTextArea(window._devLogTextArea);
            }
        });
        toolbar2.appendChild(maxLogsLabel);
        toolbar2.appendChild(maxLogsInput);

        // Экспорт в файл
        const exportTxtBtn = document.createElement('button');
        exportTxtBtn.textContent = '📄 Сохранить TXT';
        exportTxtBtn.style.cssText = 'background:#333; color:#fff; border:none; padding:4px 12px; border-radius:4px; cursor:pointer;';
        exportTxtBtn.addEventListener('click', () => exportLogs('txt'));
        toolbar2.appendChild(exportTxtBtn);

        const exportJsonBtn = document.createElement('button');
        exportJsonBtn.textContent = '📊 Сохранить JSON';
        exportJsonBtn.style.cssText = 'background:#333; color:#fff; border:none; padding:4px 12px; border-radius:4px; cursor:pointer;';
        exportJsonBtn.addEventListener('click', () => exportLogs('json'));
        toolbar2.appendChild(exportJsonBtn);

        container.appendChild(toolbar2);

        // Текстовая область
        const textarea = document.createElement('textarea');
        textarea.readOnly = true;
        textarea.style.cssText = `
            flex:1; width:100%; background:#000; color:#0f0;
            font-family:monospace; font-size:13px; border:none;
            padding:10px; resize:none;
            white-space:pre; word-break:normal; overflow-x:auto;
        `;
        window._devLogTextArea = textarea;
        updateTextArea(textarea);
        container.appendChild(textarea);

        // Нижняя панель
        const footer = document.createElement('div');
        footer.style.cssText = 'display:flex; padding:10px; gap:10px; justify-content:flex-end; background:#111;';

        const copyBtn = document.createElement('button');
        copyBtn.textContent = '📋 Копировать (видимые)';
        copyBtn.style.cssText = 'padding:8px 16px; background:#333; color:#fff; border:none; border-radius:4px; cursor:pointer;';
        copyBtn.addEventListener('click', copyFilteredLogs);
        footer.appendChild(copyBtn);

        const clearBtn = document.createElement('button');
        clearBtn.textContent = '🗑 Очистить все';
        clearBtn.style.cssText = 'padding:8px 16px; background:#333; color:#fff; border:none; border-radius:4px; cursor:pointer;';
        clearBtn.addEventListener('click', () => {
            logBuffer = [];
            groupIndent = 0;
            updateTextArea(textarea);
            updateFabCounter();
            showNoty('Логи очищены');
        });
        footer.appendChild(clearBtn);

        container.appendChild(footer);
        document.body.appendChild(container);
        addLog('log', ['DevLog opened']);
    }

    // ========== FAB КНОПКА И ГОРЯЧАЯ КЛАВИША ==========
    function createFab() {
        if (document.getElementById('devlog-fab')) return;
        const fab = document.createElement('div');
        fab.id = 'devlog-fab';
        fab.innerHTML = '📋';
        fab.style.cssText = `
            position:fixed; bottom:80px; right:15px; z-index:9999;
            background:#e74c3c; color:#fff; width:48px; height:48px;
            display:flex; align-items:center; justify-content:center;
            border-radius:50%; font-size:20px; font-weight:bold;
            box-shadow:0 2px 8px rgba(0,0,0,0.5); cursor:pointer;
            user-select:none; transition:0.2s;
        `;
        fab.addEventListener('click', openDevLog);
        fab.addEventListener('mouseenter', () => fab.style.transform = 'scale(1.05)');
        fab.addEventListener('mouseleave', () => fab.style.transform = 'scale(1)');
        document.body.appendChild(fab);

        // Добавляем стили для бэйджа
        const style = document.createElement('style');
        style.textContent = `
            .devlog-badge {
                position:absolute; top:-5px; right:-5px;
                background:#f1c40f; color:#000; border-radius:20px;
                font-size:11px; font-weight:bold; padding:2px 5px;
                min-width:18px; text-align:center;
            }
        `;
        document.head.appendChild(style);
    }

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    function init() {
        initConsoleInterceptor();
        createFab();

        // Добавляем пункт в меню Lampa
        try {
            Lampa.Menu.add('plugins', {
                title: 'Dev Log',
                icon: 'log',
                action: openDevLog
            });
        } catch(e) {}

        // Горячая клавиша Ctrl+Shift+L
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.code === 'KeyL') {
                e.preventDefault();
                openDevLog();
            }
        });
    }

    // Ждём Lampa
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

    waitForLampa(init);
})();
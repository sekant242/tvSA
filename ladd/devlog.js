/**
 * DevLog for Lampa v2.1 — полный вывод, без урезки
 */

(function(global) {
    'use strict';

    // ----- ЩАДЯЩИЕ ЛИМИТЫ ПО УМОЛЧАНИЮ (можно убрать вообще) -----
    const DEFAULTS = {
        maxLogs: 5000,               // много логов
        autoStart: true,
        showButton: true,
        buttonPosition: { right: '20px', bottom: '20px' },
        defaultFilter: 'all',
        enableLampaMenu: true,
        notifyOnError: true,
        maxObjectDepth: 10,          // глубокая рекурсия
        maxStringLength: 10000,      // очень длинные строки
        maxOutputLength: 50000       // общая длина одного лога в UI (чтобы не завесить)
    };

    // ----- ФУНКЦИЯ ПОЛНОЙ СЕРИАЛИЗАЦИИ (без потери данных) -----
    function fullStringify(obj, depth = DEFAULTS.maxObjectDepth, maxLen = DEFAULTS.maxStringLength) {
        if (depth <= 0) return (typeof obj === 'object' && obj !== null) ? '[Object]' : String(obj);
        try {
            // Обработка ошибок (Error, TypeError и т.д.)
            if (obj instanceof Error) {
                return `${obj.name}: ${obj.message}\nStack: ${obj.stack || '(no stack)'}`;
            }
            // Циклические ссылки
            let seen = new WeakSet();
            let result = JSON.stringify(obj, (key, value) => {
                if (typeof value === 'object' && value !== null) {
                    if (seen.has(value)) return '[Circular]';
                    seen.add(value);
                }
                if (typeof value === 'string' && value.length > maxLen) {
                    return value.slice(0, maxLen) + '… [truncated]';
                }
                return value;
            }, 2); // отступ 2 пробела для читаемости
            if (result === undefined) return String(obj);
            if (result.length > DEFAULTS.maxOutputLength) {
                return result.slice(0, DEFAULTS.maxOutputLength) + '… (output truncated)';
            }
            return result;
        } catch (e) {
            return String(obj);
        }
    }

    // Форматируем один аргумент (максимально подробно)
    function formatArg(arg, maxLen = DEFAULTS.maxStringLength) {
        if (arg === undefined) return 'undefined';
        if (arg === null) return 'null';
        if (typeof arg === 'string') {
            if (arg.length > maxLen) return arg.slice(0, maxLen) + '… (string truncated)';
            return arg;
        }
        if (typeof arg === 'function') return `[Function: ${arg.name || 'anonymous'}]`;
        if (typeof arg === 'object') return fullStringify(arg);
        return String(arg);
    }

    // Создание записи лога с сохранением всех аргументов и стека
    function formatLogEntry(type, args) {
        const timestamp = Date.now();
        const formattedArgs = args.map(arg => formatArg(arg));
        // Сохраняем также «сырые» аргументы для возможной обработки
        let fullMessage = formattedArgs.join(' ');
        // Если среди аргументов есть Error, добавим стек в отдельное поле
        let stackTrace = null;
        for (let arg of args) {
            if (arg instanceof Error && arg.stack) {
                stackTrace = arg.stack;
                break;
            }
        }
        return {
            type: type,
            timestamp: timestamp,
            rawArgs: args,
            message: fullMessage,
            stack: stackTrace,
            formattedTime: new Date(timestamp).toLocaleTimeString('ru-RU', { hour12: false })
        };
    }

    // ---------- ОСНОВНОЙ КЛАСС LOGGER ----------
    class DevLogger {
        constructor(options = {}) {
            this.options = Object.assign({}, DEFAULTS, options);
            this.logBuffer = [];
            this.paused = false;
            this.originalConsole = {
                log: console.log.bind(console),
                warn: console.warn.bind(console),
                error: console.error.bind(console),
                info: console.info.bind(console),
                debug: console.debug.bind(console)
            };
            this.isIntercepting = false;
            this.ui = null;
        }

        addEntry(type, args) {
            if (this.paused) return;
            const entry = formatLogEntry(type, args);
            this.logBuffer.push(entry);
            if (this.logBuffer.length > this.options.maxLogs) {
                this.logBuffer.shift();
            }
            if (this.ui && this.ui.isOpen) {
                this.ui.renderLogs(this.getFilteredLogs(this.ui.currentFilter, this.ui.searchQuery));
            }
        }

        getFilteredLogs(filterType, searchQuery = '') {
            let filtered = this.logBuffer;
            if (filterType && filterType !== 'all') {
                filtered = filtered.filter(entry => entry.type === filterType);
            }
            if (searchQuery.trim()) {
                const query = searchQuery.trim().toLowerCase();
                filtered = filtered.filter(entry => 
                    entry.message.toLowerCase().includes(query) ||
                    (entry.stack && entry.stack.toLowerCase().includes(query))
                );
            }
            return filtered;
        }

        startIntercept() {
            if (this.isIntercepting) return;
            const self = this;
            console.log = function(...args) {
                self.originalConsole.log(...args);
                self.addEntry('log', args);
            };
            console.warn = function(...args) {
                self.originalConsole.warn(...args);
                self.addEntry('warn', args);
                if (self.options.notifyOnError && global.Lampa && global.Lampa.Noty) {
                    global.Lampa.Noty.show('⚠️ ' + args.slice(0,1).map(a=>String(a)).join(' '));
                }
            };
            console.error = function(...args) {
                self.originalConsole.error(...args);
                self.addEntry('error', args);
                if (self.options.notifyOnError && global.Lampa && global.Lampa.Noty) {
                    let firstMsg = args.slice(0,1).map(a=>String(a)).join(' ');
                    global.Lampa.Noty.show('❌ ' + firstMsg, null, 4000);
                }
            };
            console.info = function(...args) {
                self.originalConsole.info(...args);
                self.addEntry('info', args);
            };
            console.debug = function(...args) {
                self.originalConsole.debug(...args);
                self.addEntry('debug', args);
            };
            this.isIntercepting = true;
        }

        stopIntercept() {
            if (!this.isIntercepting) return;
            console.log = this.originalConsole.log;
            console.warn = this.originalConsole.warn;
            console.error = this.originalConsole.error;
            console.info = this.originalConsole.info;
            console.debug = this.originalConsole.debug;
            this.isIntercepting = false;
        }

        clearLogs() {
            this.logBuffer = [];
            if (this.ui && this.ui.isOpen) this.ui.renderLogs([]);
        }

        exportLogs() {
            const data = this.logBuffer.map(entry => {
                let msg = `[${entry.formattedTime}] ${entry.type.toUpperCase()}: ${entry.message}`;
                if (entry.stack) msg += `\nStack:\n${entry.stack}`;
                return msg;
            }).join('\n\n');
            const blob = new Blob([data], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `devlog_full_${Date.now()}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        }

        copyFilteredLogs(filterType, searchQuery) {
            const filtered = this.getFilteredLogs(filterType, searchQuery);
            const text = filtered.map(entry => {
                let msg = `[${entry.formattedTime}] ${entry.type.toUpperCase()}: ${entry.message}`;
                if (entry.stack) msg += `\n${entry.stack}`;
                return msg;
            }).join('\n\n');
            navigator.clipboard.writeText(text).catch(e => console.warn('Copy failed', e));
        }
    }

    // ---------- UI КЛАСС (без обрезки текста) ----------
    class DevLogUI {
        constructor(logger) {
            this.logger = logger;
            this.isOpen = false;
            this.currentFilter = 'all';
            this.searchQuery = '';
            this.button = null;
            this.modal = null;
            this.init();
        }

        init() {
            this.injectStyles();
            if (this.logger.options.showButton) this.createButton();
            this.createModal();
            if (this.logger.options.enableLampaMenu && global.Lampa && global.Lampa.Menu) {
                this.addLampaMenuItem();
            }
        }

        injectStyles() {
            if (document.getElementById('devlog-styles')) return;
            const style = document.createElement('style');
            style.id = 'devlog-styles';
            style.textContent = `
                .devlog-btn {
                    position: fixed; right: 20px; bottom: 20px;
                    width: 50px; height: 50px;
                    background: #1e2a3a; color: #0ff;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 20px; font-weight: bold;
                    cursor: pointer; z-index: 9999;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                    transition: 0.2s;
                    font-family: monospace;
                }
                .devlog-btn:hover { transform: scale(1.05); background: #2c3e50; }
                .devlog-modal {
                    position: fixed; top: 5%; left: 5%; width: 90%; height: 90%;
                    background: #1e1e2f; color: #eee;
                    border-radius: 12px; z-index: 10000;
                    display: flex; flex-direction: column;
                    box-shadow: 0 5px 30px rgba(0,0,0,0.5);
                    font-family: monospace; font-size: 13px;
                    border: 1px solid #444;
                }
                .devlog-header {
                    padding: 10px; background: #2d2d3a;
                    border-radius: 12px 12px 0 0;
                    display: flex; justify-content: space-between;
                    align-items: center; flex-wrap: wrap;
                    gap: 8px;
                }
                .devlog-title { font-weight: bold; font-size: 1.1rem; }
                .devlog-controls { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
                .devlog-controls button, .devlog-filter-btn {
                    background: #3a3a4a; border: none; color: white;
                    padding: 4px 10px; border-radius: 6px;
                    cursor: pointer; transition: 0.1s;
                }
                .devlog-controls button:hover, .devlog-filter-btn.active {
                    background: #5a5a7a;
                }
                .devlog-filter-btn.active { background: #0f0; color: #000; }
                .devlog-search {
                    padding: 4px 8px; border-radius: 6px; border: none;
                    background: #2a2a3a; color: white;
                    width: 180px;
                }
                .devlog-content {
                    flex: 1; overflow-y: auto; padding: 10px;
                    background: #252530;
                    white-space: pre-wrap;
                    word-break: break-word;
                }
                .devlog-entry {
                    border-bottom: 1px solid #3a3a4a;
                    padding: 8px 6px;
                    font-family: monospace;
                }
                .devlog-entry.log { color: #ddd; }
                .devlog-entry.warn { color: #ffaa66; }
                .devlog-entry.error { color: #ff9999; }
                .devlog-entry.info { color: #88ccff; }
                .devlog-entry.debug { color: #aaffaa; }
                .devlog-timestamp { color: #888; margin-right: 12px; }
                .devlog-stack {
                    margin-top: 6px;
                    padding-left: 20px;
                    color: #ccaa88;
                    font-size: 11px;
                    white-space: pre-wrap;
                    border-left: 2px solid #666;
                }
                .devlog-close {
                    background: #c33; border: none; color: white;
                    border-radius: 20px; padding: 5px 12px;
                    cursor: pointer;
                }
            `;
            document.head.appendChild(style);
        }

        createButton() { /* как было */ 
            this.button = document.createElement('div');
            this.button.className = 'devlog-btn';
            this.button.textContent = 'LOG';
            this.button.onclick = () => this.toggleModal();
            document.body.appendChild(this.button);
        }

        createModal() {
            this.modal = document.createElement('div');
            this.modal.className = 'devlog-modal';
            this.modal.style.display = 'none';
            this.modal.innerHTML = `
                <div class="devlog-header">
                    <span class="devlog-title">📋 DevLog (0)</span>
                    <div class="devlog-controls">
                        <button id="devlog-clear">🧹 Очистить</button>
                        <button id="devlog-export">💾 Export TXT (full)</button>
                        <button id="devlog-copy">📋 Копировать фильтр</button>
                        <button id="devlog-pause">⏸️ Пауза</button>
                        <input type="text" id="devlog-search" class="devlog-search" placeholder="Поиск...">
                        <button class="devlog-close">✖ Закрыть</button>
                    </div>
                </div>
                <div class="devlog-filters" style="padding: 5px 10px; display: flex; gap: 6px; flex-wrap: wrap; background: #2d2d3a;">
                    <button data-filter="all" class="devlog-filter-btn active">Все</button>
                    <button data-filter="log" class="devlog-filter-btn">Log</button>
                    <button data-filter="warn" class="devlog-filter-btn">Warn</button>
                    <button data-filter="error" class="devlog-filter-btn">Error</button>
                    <button data-filter="info" class="devlog-filter-btn">Info</button>
                    <button data-filter="debug" class="devlog-filter-btn">Debug</button>
                </div>
                <div class="devlog-content" id="devlog-content"></div>
            `;
            document.body.appendChild(this.modal);
            this.attachEvents();
        }

        attachEvents() {
            this.modal.querySelector('.devlog-close').onclick = () => this.closeModal();
            this.modal.querySelector('#devlog-clear').onclick = () => { this.logger.clearLogs(); this.updateTitle(); };
            this.modal.querySelector('#devlog-export').onclick = () => this.logger.exportLogs();
            this.modal.querySelector('#devlog-copy').onclick = () => this.logger.copyFilteredLogs(this.currentFilter, this.searchQuery);
            const pauseBtn = this.modal.querySelector('#devlog-pause');
            pauseBtn.onclick = () => {
                this.logger.paused = !this.logger.paused;
                pauseBtn.textContent = this.logger.paused ? '▶️ Пуск' : '⏸️ Пауза';
                pauseBtn.style.background = this.logger.paused ? '#f90' : '#3a3a4a';
            };
            const searchInput = this.modal.querySelector('#devlog-search');
            searchInput.oninput = (e) => {
                this.searchQuery = e.target.value;
                this.renderLogs(this.logger.getFilteredLogs(this.currentFilter, this.searchQuery));
            };
            this.modal.querySelectorAll('.devlog-filter-btn').forEach(btn => {
                btn.onclick = (e) => {
                    this.modal.querySelectorAll('.devlog-filter-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.currentFilter = btn.dataset.filter;
                    this.renderLogs(this.logger.getFilteredLogs(this.currentFilter, this.searchQuery));
                };
            });
        }

        updateTitle() {
            const titleSpan = this.modal.querySelector('.devlog-title');
            if (titleSpan) titleSpan.textContent = `📋 DevLog (${this.logger.logBuffer.length})`;
        }

        renderLogs(logs) {
            const container = this.modal.querySelector('#devlog-content');
            if (!container) return;
            if (logs.length === 0) {
                container.innerHTML = '<div style="padding: 20px; text-align: center; color: #aaa;">Нет логов</div>';
                this.updateTitle();
                return;
            }
            const fragment = document.createDocumentFragment();
            logs.forEach(log => {
                const div = document.createElement('div');
                div.className = `devlog-entry ${log.type}`;
                let html = `<span class="devlog-timestamp">[${log.formattedTime}]</span> <strong>${log.type.toUpperCase()}</strong>: ${this.escapeHtml(log.message)}`;
                if (log.stack) {
                    html += `<div class="devlog-stack">📌 Stack:<br>${this.escapeHtml(log.stack)}</div>`;
                }
                div.innerHTML = html;
                fragment.appendChild(div);
            });
            container.innerHTML = '';
            container.appendChild(fragment);
            container.scrollTop = container.scrollHeight;
            this.updateTitle();
        }

        escapeHtml(str) {
            if (!str) return '';
            return str.replace(/[&<>]/g, function(m) {
                if (m === '&') return '&amp;';
                if (m === '<') return '&lt;';
                if (m === '>') return '&gt;';
                return m;
            });
        }

        toggleModal() { this.isOpen ? this.closeModal() : this.openModal(); }
        openModal() { this.modal.style.display = 'flex'; this.isOpen = true; this.renderLogs(this.logger.getFilteredLogs(this.currentFilter, this.searchQuery)); }
        closeModal() { this.modal.style.display = 'none'; this.isOpen = false; }

        addLampaMenuItem() {
            if (!global.Lampa || !global.Lampa.Menu) return;
            try {
                global.Lampa.Menu.add({
                    title: '📋 DevLog',
                    icon: '<svg>...</svg>',
                    action: () => this.toggleModal()
                }, 'settings');
            } catch(e) { console.warn('Lampa menu failed', e); }
        }
    }

    // ---------- ЗАПУСК ----------
    let instance = null;
    function init(options = {}) {
        if (instance) return instance;
        const logger = new DevLogger(options);
        if (options.autoStart !== false) logger.startIntercept();
        const ui = new DevLogUI(logger);
        logger.ui = ui;
        instance = { logger, ui };
        if (!global.DevLog) {
            global.DevLog = {
                log: (...args) => logger.addEntry('log', args),
                warn: (...args) => logger.addEntry('warn', args),
                error: (...args) => logger.addEntry('error', args),
                info: (...args) => logger.addEntry('info', args),
                debug: (...args) => logger.addEntry('debug', args),
                clear: () => logger.clearLogs(),
                export: () => logger.exportLogs(),
                pause: (state) => { logger.paused = state; if(ui && ui.modal){ let btn = ui.modal.querySelector('#devlog-pause'); if(btn) btn.click(); } },
                restoreConsole: () => logger.stopIntercept()
            };
        }
        return instance;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => init(DEFAULTS));
    } else {
        init(DEFAULTS);
    }
})(window);
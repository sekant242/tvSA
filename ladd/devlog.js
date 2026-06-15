/**
 * DevLog for Lampa v2.0
 * Улучшенная версия: безопасный перехват консоли, управление памятью, чистый UI, интеграция с Lampa
 * (c) 2026
 */

(function(global) {
    'use strict';

    // ---------- НАСТРОЙКИ ПО УМОЛЧАНИЮ ----------
    const DEFAULTS = {
        maxLogs: 2000,            // максимальное количество логов в буфере
        autoStart: true,          // автоматически начинать перехват
        showButton: true,         // показывать плавающую кнопку LOG
        buttonPosition: { right: '20px', bottom: '20px' },
        defaultFilter: 'all',     // all, log, warn, error, info, debug
        enableLampaMenu: true,    // добавить пункт в меню Lampa
        notifyOnError: true,      // показывать уведомления Lampa при ошибках
        maxObjectDepth: 3,        // глубина сериализации объектов
        maxStringLength: 500      // ограничение длины строк при отображении
    };

    // ---------- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ----------
    function safeStringify(obj, depth = DEFAULTS.maxObjectDepth, maxLen = DEFAULTS.maxStringLength) {
        if (depth <= 0) return '[Object]';
        try {
            let seen = new WeakSet();
            let result = JSON.stringify(obj, (key, value) => {
                if (typeof value === 'object' && value !== null) {
                    if (seen.has(value)) return '[Circular]';
                    seen.add(value);
                }
                if (typeof value === 'string' && value.length > maxLen) {
                    return value.slice(0, maxLen) + '…';
                }
                return value;
            }, 2);
            if (result === undefined) return String(obj);
            if (result.length > 10000) return result.slice(0, 10000) + '… (truncated)';
            return result;
        } catch (e) {
            return String(obj);
        }
    }

    function formatLogEntry(type, args, timestamp = Date.now()) {
        let formattedArgs = args.map(arg => {
            if (arg === undefined) return 'undefined';
            if (arg === null) return 'null';
            if (typeof arg === 'object') return safeStringify(arg);
            if (typeof arg === 'string') return arg.length > 500 ? arg.slice(0, 500) + '…' : arg;
            return String(arg);
        }).join(' ');
        return {
            type: type,
            timestamp: timestamp,
            rawArgs: args,
            message: formattedArgs,
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

        // Добавить запись в буфер
        addEntry(type, args) {
            if (this.paused) return;
            const entry = formatLogEntry(type, args);
            this.logBuffer.push(entry);
            if (this.logBuffer.length > this.options.maxLogs) {
                this.logBuffer.shift();
            }
            // Обновить UI, если открыт
            if (this.ui && this.ui.isOpen) {
                this.ui.renderLogs(this.getFilteredLogs(this.ui.currentFilter, this.ui.searchQuery));
            }
        }

        // Получить логи с фильтрацией
        getFilteredLogs(filterType, searchQuery = '') {
            let filtered = this.logBuffer;
            if (filterType && filterType !== 'all') {
                filtered = filtered.filter(entry => entry.type === filterType);
            }
            if (searchQuery.trim()) {
                const query = searchQuery.trim().toLowerCase();
                filtered = filtered.filter(entry => entry.message.toLowerCase().includes(query));
            }
            return filtered;
        }

        // Перехват консоли
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
                    global.Lampa.Noty.show('⚠️ Предупреждение: ' + args.slice(0, 1).join(' '));
                }
            };
            console.error = function(...args) {
                self.originalConsole.error(...args);
                self.addEntry('error', args);
                if (self.options.notifyOnError && global.Lampa && global.Lampa.Noty) {
                    global.Lampa.Noty.show('❌ Ошибка: ' + args.slice(0, 1).join(' '), null, 3000);
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

        // Восстановить оригинальную консоль
        stopIntercept() {
            if (!this.isIntercepting) return;
            console.log = this.originalConsole.log;
            console.warn = this.originalConsole.warn;
            console.error = this.originalConsole.error;
            console.info = this.originalConsole.info;
            console.debug = this.originalConsole.debug;
            this.isIntercepting = false;
        }

        // Очистка буфера
        clearLogs() {
            this.logBuffer = [];
            if (this.ui && this.ui.isOpen) this.ui.renderLogs([]);
        }

        // Экспорт логов
        exportLogs(format = 'txt') {
            const data = this.logBuffer.map(entry => `[${entry.formattedTime}] ${entry.type.toUpperCase()}: ${entry.message}`).join('\n');
            const blob = new Blob([data], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `devlog_${Date.now()}.${format}`;
            a.click();
            URL.revokeObjectURL(url);
        }

        // Копировать в буфер обмена отфильтрованные логи
        copyFilteredLogs(filterType, searchQuery) {
            const filtered = this.getFilteredLogs(filterType, searchQuery);
            const text = filtered.map(entry => `[${entry.formattedTime}] ${entry.type.toUpperCase()}: ${entry.message}`).join('\n');
            navigator.clipboard.writeText(text).catch(e => console.warn('Copy failed', e));
        }
    }

    // ---------- UI КЛАСС (ПЛАВАЮЩАЯ КНОПКА И МОДАЛЬНОЕ ОКНО) ----------
    class DevLogUI {
        constructor(logger) {
            this.logger = logger;
            this.isOpen = false;
            this.currentFilter = 'all';
            this.searchQuery = '';
            this.button = null;
            this.modal = null;
            this.filterButtons = {};
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
                    position: fixed; top: 10%; left: 10%; width: 80%; height: 80%;
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
                }
                .devlog-content {
                    flex: 1; overflow-y: auto; padding: 10px;
                    background: #252530;
                }
                .devlog-entry {
                    border-bottom: 1px solid #3a3a4a;
                    padding: 6px 8px; white-space: pre-wrap;
                    word-break: break-all;
                }
                .devlog-entry.log { color: #ccc; }
                .devlog-entry.warn { color: #ffaa66; }
                .devlog-entry.error { color: #ff6666; }
                .devlog-entry.info { color: #66ccff; }
                .devlog-entry.debug { color: #99ff99; }
                .devlog-timestamp { color: #888; margin-right: 10px; }
                .devlog-close {
                    background: #c33; border: none; color: white;
                    border-radius: 20px; padding: 5px 12px;
                    cursor: pointer;
                }
            `;
            document.head.appendChild(style);
        }

        createButton() {
            this.button = document.createElement('div');
            this.button.className = 'devlog-btn';
            this.button.textContent = 'LOG';
            this.button.title = 'DevLog - нажмите для открытия';
            this.button.onclick = () => this.toggleModal();
            document.body.appendChild(this.button);
        }

        createModal() {
            this.modal = document.createElement('div');
            this.modal.className = 'devlog-modal';
            this.modal.style.display = 'none';
            this.modal.innerHTML = `
                <div class="devlog-header">
                    <span class="devlog-title">📋 DevLog (${this.logger.logBuffer.length})</span>
                    <div class="devlog-controls">
                        <button id="devlog-clear">🧹 Очистить</button>
                        <button id="devlog-export">💾 Export TXT</button>
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

            // Привязка событий
            this.modal.querySelector('.devlog-close').onclick = () => this.closeModal();
            this.modal.querySelector('#devlog-clear').onclick = () => { this.logger.clearLogs(); this.updateTitle(); };
            this.modal.querySelector('#devlog-export').onclick = () => this.logger.exportLogs('txt');
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
                div.innerHTML = `<span class="devlog-timestamp">[${log.formattedTime}]</span> <strong>${log.type.toUpperCase()}</strong>: ${log.message}`;
                fragment.appendChild(div);
            });
            container.innerHTML = '';
            container.appendChild(fragment);
            container.scrollTop = container.scrollHeight;
            this.updateTitle();
        }

        toggleModal() {
            this.isOpen ? this.closeModal() : this.openModal();
        }

        openModal() {
            if (!this.modal) return;
            this.modal.style.display = 'flex';
            this.isOpen = true;
            this.renderLogs(this.logger.getFilteredLogs(this.currentFilter, this.searchQuery));
        }

        closeModal() {
            if (this.modal) this.modal.style.display = 'none';
            this.isOpen = false;
        }

        addLampaMenuItem() {
            if (!global.Lampa || !global.Lampa.Menu) return;
            try {
                global.Lampa.Menu.add({
                    title: '📋 DevLog',
                    icon: '<svg>...</svg>',
                    action: () => this.toggleModal()
                }, 'settings');
            } catch(e) { console.warn('Lampa menu integration failed', e); }
        }
    }

    // ---------- ИНИЦИАЛИЗАЦИЯ ----------
    let instance = null;
    function init(options = {}) {
        if (instance) return instance;
        const logger = new DevLogger(options);
        if (options.autoStart !== false) logger.startIntercept();
        const ui = new DevLogUI(logger);
        logger.ui = ui;
        instance = { logger, ui };
        // Добавляем глобальный доступ, но без засорения
        if (!global.DevLog) global.DevLog = {
            log: (...args) => logger.addEntry('log', args),
            warn: (...args) => logger.addEntry('warn', args),
            error: (...args) => logger.addEntry('error', args),
            info: (...args) => logger.addEntry('info', args),
            debug: (...args) => logger.addEntry('debug', args),
            clear: () => logger.clearLogs(),
            export: (fmt) => logger.exportLogs(fmt),
            pause: (state) => { logger.paused = state; if(ui && ui.modal) { const btn = ui.modal.querySelector('#devlog-pause'); if(btn) btn.click(); } },
            isActive: () => logger.isIntercepting,
            restoreConsole: () => logger.stopIntercept()
        };
        return instance;
    }

    // Автозапуск, если в DOM уже есть
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => init(DEFAULTS));
    } else {
        init(DEFAULTS);
    }

})(window);
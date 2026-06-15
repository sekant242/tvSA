/**
 * DevLog for Lampa v2.2 — полноценный логгер с богатым UI
 *
 * @description Полностью заменяет/расширяет стандартную консоль, добавляя плавающее окно логов,
 *              фильтрацию, поиск, экспорт, перетаскиваемую кнопку и интеграцию с Lampa.
 *
 * @usage
 *   1. Подключите скрипт после Lampa (или в любом месте).
 *   2. При необходимости переопределите настройки до инициализации:
 *        window.DevLogSettings = { maxLogs: 3000, enableLampaMenu: false };
 *   3. Логи автоматически перехватываются. Используйте обычный console.log/error/warn/info/debug.
 *   4. Вы также можете напрямую вызывать DevLog.log('msg'), DevLog.warn({...}) и т.д.
 *   5. Для восстановления оригинальной консоли: DevLog.restoreConsole()
 *
 * @settings (объект window.DevLogSettings или передаваемый в DevLog.init())
 *   - maxLogs: 5000            Максимум записей в буфере
 *   - autoStart: true          Автоматически начать перехват консоли
 *   - showButton: true         Показывать плавающую кнопку LOG
 *   - buttonPosition: { right: '20px', bottom: '20px' }  Начальная позиция кнопки (можно перетащить)
 *   - enableLampaMenu: true    Добавить пункт в меню Lampa
 *   - notifyOnError: true      Показывать уведомления Lampa при ошибках/предупреждениях
 *   - maxObjectDepth: 10       Глубина сериализации объектов
 *   - maxStringLength: 10000   Максимальная длина строки в выводе
 *   - maxArgLength: 20000      Максимальная длина одного аргумента (для защиты от гигантов)
 *
 * @api (глобальный объект DevLog)
 *   - log(...args)         Добавить запись типа 'log'
 *   - warn(...args)        Добавить запись типа 'warn'
 *   - error(...args)       Добавить запись типа 'error'
 *   - info(...args)        Добавить запись типа 'info'
 *   - debug(...args)       Добавить запись типа 'debug'
 *   - clear()              Очистить буфер логов
 *   - export()             Экспорт всех логов в TXT-файл
 *   - pause(state)         Приостановить/возобновить сбор логов (state: boolean)
 *   - restoreConsole()     Вернуть оригинальные методы console.*
 *   - init(settings)       (Ручная) инициализация (обычно вызывается автоматически)
 *
 * @license MIT
 * @author community
 * @version 2.2
 */

(function(global) {
    'use strict';

    // -------------------------- НАСТРОЙКИ --------------------------
    const DEFAULTS = {
        maxLogs: 5000,
        autoStart: true,
        showButton: true,
        buttonPosition: { right: '20px', bottom: '20px' },
        enableLampaMenu: true,
        notifyOnError: true,
        maxObjectDepth: 10,
        maxStringLength: 10000,
        maxArgLength: 20000            // общая длина отформатированного аргумента
    };

    // Слияние настроек (глобальный объект window.DevLogSettings или переданный options)
    function getSettings(options) {
        let base = {};
        if (global.DevLogSettings) Object.assign(base, global.DevLogSettings);
        Object.assign(base, DEFAULTS, options);
        return base;
    }

    // -------------------------- СЕРИАЛИЗАЦИЯ (ПОЛНАЯ, БЕЗ ПОТЕРЬ) --------------------------
    function fullStringify(obj, depth, maxLen, maxTotalLen) {
        if (depth === undefined) depth = DEFAULTS.maxObjectDepth;
        if (maxLen === undefined) maxLen = DEFAULTS.maxStringLength;
        if (depth <= 0) return (typeof obj === 'object' && obj !== null) ? '[Object]' : String(obj);
        try {
            if (obj instanceof Error) {
                // Стек выводим отдельно, в message кладём только имя и сообщение
                return `${obj.name}: ${obj.message}`;
            }
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
            }, 2);
            if (result === undefined) return String(obj);
            if (result.length > (maxTotalLen || DEFAULTS.maxArgLength)) {
                return result.slice(0, (maxTotalLen || DEFAULTS.maxArgLength)) + '… (output truncated)';
            }
            return result;
        } catch (e) {
            return String(obj);
        }
    }

    function formatArg(arg, maxLen, maxTotalLen) {
        if (arg === undefined) return 'undefined';
        if (arg === null) return 'null';
        if (typeof arg === 'string') {
            if (arg.length > maxLen) return arg.slice(0, maxLen) + '… (string truncated)';
            return arg;
        }
        if (typeof arg === 'function') return `[Function: ${arg.name || 'anonymous'}]`;
        if (typeof arg === 'object') return fullStringify(arg, undefined, maxLen, maxTotalLen);
        return String(arg);
    }

    function formatLogEntry(type, args, settings) {
        const timestamp = Date.now();
        const maxLen = settings.maxStringLength;
        const maxTotalLen = settings.maxArgLength;
        const formattedArgs = args.map(arg => formatArg(arg, maxLen, maxTotalLen));
        let fullMessage = formattedArgs.join(' ');
        // Извлекаем стек ошибки, если среди аргументов есть Error, но не включаем его в message
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

    // -------------------------- ОСНОВНОЙ ЛОГГЕР --------------------------
    class DevLogger {
        constructor(options = {}) {
            this.options = getSettings(options);
            this.logBuffer = [];
            this.paused = false;
            this.newLogsCount = 0;       // количество новых логов с момента последнего открытия окна
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
            const entry = formatLogEntry(type, args, this.options);
            this.logBuffer.push(entry);
            if (this.logBuffer.length > this.options.maxLogs) {
                this.logBuffer.shift();   // можно заменить на кольцевой буфер, но для 5000 норм
            }
            this.newLogsCount++;
            if (this.ui) {
                this.ui.updateBadge(this.newLogsCount);
                if (this.ui.isOpen) {
                    // если окно открыто, показываем новые логи и сбрасываем счётчик
                    this.ui.renderLogs(this.getFilteredLogs(this.ui.currentFilter, this.ui.searchQuery));
                    this.newLogsCount = 0;
                    this.ui.updateBadge(0);
                }
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
            this.newLogsCount = 0;
            if (this.ui) {
                if (this.ui.isOpen) this.ui.renderLogs([]);
                this.ui.updateBadge(0);
            }
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

    // -------------------------- UI КЛАСС (ПЛАВАЮЩАЯ КНОПКА И ОКНО) --------------------------
    class DevLogUI {
        constructor(logger) {
            this.logger = logger;
            this.isOpen = false;
            this.currentFilter = 'all';
            this.searchQuery = '';
            this.button = null;
            this.modal = null;
            this.dragData = { dragging: false, startX: 0, startY: 0, startRight: 0, startBottom: 0 };
            this.init();
        }

        init() {
            this.injectStyles();
            if (this.logger.options.showButton) {
                this.createButton();
                this.setButtonPosition(this.logger.options.buttonPosition);
                this.makeDraggable();
            }
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
                    position: fixed;
                    width: 50px;
                    height: 50px;
                    background: #1e2a3a;
                    color: #0ff;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    font-weight: bold;
                    cursor: move;
                    z-index: 9999;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                    transition: 0.2s;
                    font-family: monospace;
                    user-select: none;
                }
                .devlog-btn:hover { transform: scale(1.05); background: #2c3e50; }
                .devlog-badge {
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: red;
                    color: white;
                    border-radius: 10px;
                    min-width: 18px;
                    height: 18px;
                    font-size: 11px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0 4px;
                    font-weight: bold;
                    pointer-events: none;
                }
                .devlog-modal {
                    position: fixed;
                    top: 5%;
                    left: 5%;
                    width: 90%;
                    height: 90%;
                    background: #1e1e2f;
                    color: #eee;
                    border-radius: 12px;
                    z-index: 10000;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 5px 30px rgba(0,0,0,0.5);
                    font-family: monospace;
                    font-size: 13px;
                    border: 1px solid #444;
                }
                .devlog-header {
                    padding: 10px;
                    background: #2d2d3a;
                    border-radius: 12px 12px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .devlog-title { font-weight: bold; font-size: 1.1rem; }
                .devlog-controls {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    flex-wrap: wrap;
                }
                .devlog-controls button, .devlog-filter-btn {
                    background: #3a3a4a;
                    border: none;
                    color: white;
                    padding: 4px 10px;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: 0.1s;
                }
                .devlog-controls button:hover, .devlog-filter-btn.active {
                    background: #5a5a7a;
                }
                .devlog-filter-btn.active { background: #0f0; color: #000; }
                .devlog-search {
                    padding: 4px 8px;
                    border-radius: 6px;
                    border: none;
                    background: #2a2a3a;
                    color: white;
                    width: 180px;
                }
                .devlog-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 10px;
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
                .devlog-close, .devlog-help {
                    background: #c33;
                    border: none;
                    color: white;
                    border-radius: 20px;
                    padding: 5px 12px;
                    cursor: pointer;
                }
                .devlog-help {
                    background: #3a6ea5;
                }
            `;
            document.head.appendChild(style);
        }

        createButton() {
            this.button = document.createElement('div');
            this.button.className = 'devlog-btn';
            this.button.textContent = 'LOG';
            this.button.onclick = (e) => {
                if (!this.dragData.dragging) this.toggleModal();
            };
            this.updateBadge(0);
            document.body.appendChild(this.button);
        }

        updateBadge(count) {
            if (!this.button) return;
            let badge = this.button.querySelector('.devlog-badge');
            if (count > 0) {
                if (!badge) {
                    badge = document.createElement('div');
                    badge.className = 'devlog-badge';
                    this.button.appendChild(badge);
                }
                badge.textContent = count > 99 ? '99+' : count;
            } else {
                if (badge) badge.remove();
            }
        }

        setButtonPosition(pos) {
            if (!this.button) return;
            if (pos.right !== undefined) this.button.style.right = pos.right;
            if (pos.bottom !== undefined) this.button.style.bottom = pos.bottom;
            if (pos.left !== undefined) this.button.style.left = pos.left;
            if (pos.top !== undefined) this.button.style.top = pos.top;
        }

        makeDraggable() {
            if (!this.button) return;
            const btn = this.button;
            btn.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;
                this.dragData.dragging = true;
                this.dragData.startX = e.clientX;
                this.dragData.startY = e.clientY;
                const rect = btn.getBoundingClientRect();
                this.dragData.startRight = window.innerWidth - rect.right;
                this.dragData.startBottom = window.innerHeight - rect.bottom;
                btn.style.transition = 'none';
                e.preventDefault();
            });
            window.addEventListener('mousemove', (e) => {
                if (!this.dragData.dragging) return;
                const dx = e.clientX - this.dragData.startX;
                const dy = e.clientY - this.dragData.startY;
                let newRight = this.dragData.startRight - dx;
                let newBottom = this.dragData.startBottom - dy;
                newRight = Math.min(Math.max(newRight, 10), window.innerWidth - 60);
                newBottom = Math.min(Math.max(newBottom, 10), window.innerHeight - 60);
                btn.style.right = newRight + 'px';
                btn.style.bottom = newBottom + 'px';
                btn.style.left = 'auto';
                btn.style.top = 'auto';
            });
            window.addEventListener('mouseup', () => {
                if (this.dragData.dragging) {
                    this.dragData.dragging = false;
                    btn.style.transition = '';
                }
            });
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
                        <button id="devlog-export">💾 Export TXT</button>
                        <button id="devlog-copy">📋 Копировать фильтр</button>
                        <button id="devlog-pause">⏸️ Пауза</button>
                        <input type="text" id="devlog-search" class="devlog-search" placeholder="Поиск...">
                        <button class="devlog-help">❓ Справка</button>
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
            this.modal.querySelector('.devlog-help').onclick = () => this.showHelp();
            this.modal.querySelector('#devlog-clear').onclick = () => {
                this.logger.clearLogs();
                this.updateTitle();
            };
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

        showHelp() {
            const helpText = 
                "📘 DevLog Help\n\n" +
                "• Логи перехватываются автоматически, выводится полная информация об объектах, ошибках и стеке.\n" +
                "• Кнопку LOG можно перетаскивать мышкой.\n" +
                "• Красный значок на кнопке показывает количество новых логов с момента последнего открытия окна.\n" +
                "• В окне доступны фильтры по типу, поиск (по сообщению и стеку), пауза.\n" +
                "• Кнопка 'Копировать фильтр' копирует в буфер все логи, отфильтрованные текущим фильтром и поиском.\n" +
                "• Экспорт TXT сохраняет все логи в файл.\n" +
                "• Для использования из кода: DevLog.log('hello'), DevLog.error(err), DevLog.clear() и т.д.\n" +
                "• Восстановить стандартную консоль: DevLog.restoreConsole().\n" +
                "• Настройки: перед загрузкой скрипта задайте window.DevLogSettings = { maxLogs: 2000, enableLampaMenu: false }";
            alert(helpText);
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

        toggleModal() {
            this.isOpen ? this.closeModal() : this.openModal();
        }

        openModal() {
            this.modal.style.display = 'flex';
            this.isOpen = true;
            // Сбрасываем счётчик новых логов
            if (this.logger.newLogsCount > 0) {
                this.logger.newLogsCount = 0;
                this.updateBadge(0);
            }
            this.renderLogs(this.logger.getFilteredLogs(this.currentFilter, this.searchQuery));
        }

        closeModal() {
            this.modal.style.display = 'none';
            this.isOpen = false;
        }

        addLampaMenuItem() {
            if (!global.Lampa || !global.Lampa.Menu) return;
            try {
                // Реальная иконка журнала
                const iconSvg = '<svg viewBox="0 0 24 24" width="24" height="24" style="fill:white"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6zm0 4h8v2H6zm10-4h2v6h-2z"/></svg>';
                global.Lampa.Menu.add({
                    title: 'DevLog',
                    icon: iconSvg,
                    action: () => this.toggleModal()
                }, 'settings');
            } catch(e) { console.warn('Lampa menu integration failed', e); }
        }
    }

    // -------------------------- ИНИЦИАЛИЗАЦИЯ И ГЛОБАЛЬНЫЙ API --------------------------
    let instance = null;

    function init(options = {}) {
        if (instance) return instance;
        const logger = new DevLogger(options);
        if (logger.options.autoStart !== false) logger.startIntercept();
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
                pause: (state) => {
                    logger.paused = state;
                    if (ui && ui.modal) {
                        const btn = ui.modal.querySelector('#devlog-pause');
                        if (btn) {
                            btn.textContent = state ? '▶️ Пуск' : '⏸️ Пауза';
                            btn.style.background = state ? '#f90' : '#3a3a4a';
                        }
                    }
                },
                restoreConsole: () => logger.stopIntercept(),
                init: init
            };
        }
        return instance;
    }

    // Автозапуск при готовности DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => init());
    } else {
        init();
    }

})(window);
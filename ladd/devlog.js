(function() { 
  'use strict'; 
  
  const MAX_LOGS = 2000; 
  let logBuffer = []; 

  // Фильтры и настройки
  let filterType = 'all'; 
  let hideMeta = false;
  let searchQuery = '';
  let caseSensitive = false;
  let autoScroll = true;
  let loggingEnabled = true;
  let fontSize = 13;        // базовый размер шрифта в px
  let lastSearchPos = 0;    // для навигации поиска
  
  // DOM-элементы, которые обновляются динамически
  let statsSpan = null;
  let textarea = null;
  let searchInput = null;
  let caseCheckbox = null;
  let fontSizeSpan = null;

  // Вспомогательная функция: строка для отображения записи
  function getDisplayString(entry) {
    if (hideMeta) {
      return entry.text;
    } else {
      return `[${entry.time}] [${entry.type.toUpperCase()}] ${entry.text}`;
    }
  }

  // Проверка, видна ли запись при текущих фильтрах
  function isEntryVisible(entry) {
    // 1. Фильтр по типу
    if (filterType !== 'all' && entry.type !== filterType) return false;
    // 2. Поиск по строке
    if (searchQuery !== '') {
      const displayStr = getDisplayString(entry);
      const query = caseSensitive ? searchQuery : searchQuery.toLowerCase();
      const target = caseSensitive ? displayStr : displayStr.toLowerCase();
      if (target.indexOf(query) === -1) return false;
    }
    return true;
  }

  // Обновление текстового поля и статистики
  function updateTextArea() {
    if (!textarea) return;
    
    // Отфильтрованные записи
    const filtered = logBuffer.filter(entry => isEntryVisible(entry));
    const lines = filtered.map(entry => getDisplayString(entry));
    textarea.value = lines.join('\n');
    
    // Автоскролл
    if (autoScroll) {
      textarea.scrollTop = textarea.scrollHeight;
    }
    
    // Обновить статистику
    updateStats(filtered.length);
  }
  
  // Статистика: общее количество, отфильтрованное, количество по типам
  function updateStats(visibleCount) {
    if (!statsSpan) return;
    const total = logBuffer.length;
    const counts = { log:0, error:0, warn:0, info:0, debug:0 };
    logBuffer.forEach(e => { if (counts[e.type] !== undefined) counts[e.type]++; });
    statsSpan.innerHTML = `📊 Всего: ${total} | Видно: ${visibleCount} | ` +
      `📄${counts.log} ❌${counts.error} ⚠️${counts.warn} ℹ️${counts.info} 🐞${counts.debug}`;
  }

  // Добавление записи в буфер
  function addLog(type, args) { 
    if (!loggingEnabled) return;
    
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
    
    if (textarea) { 
      updateTextArea(); 
    } 
  } 

  // Экспорт в файл
  function exportLogs() {
    if (!textarea) return;
    const content = textarea.value;
    const blob = new Blob([content], {type: 'text/plain'});
    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = `devlog_${new Date().toISOString().slice(0,19)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (Lampa && Lampa.Noty) Lampa.Noty.show('Логи экспортированы');
  }
  
  // Копировать только видимые (то, что в textarea)
  function copyVisible() {
    if (!textarea) return;
    const text = textarea.value;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => Lampa.Noty.show('Скопировано!'))
        .catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }
  
  // fallback для копирования
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
  
  // Сброс фильтров
  function resetFilters() {
    filterType = 'all';
    searchQuery = '';
    caseSensitive = false;
    if (searchInput) searchInput.value = '';
    if (caseCheckbox) caseCheckbox.checked = false;
    const select = document.querySelector('.devlog-type-filter');
    if (select) select.value = 'all';
    updateTextArea();
  }
  
  // Поиск с навигацией (выделение следующего вхождения)
  function findNext() {
    if (!textarea || !searchQuery) return;
    let query = caseSensitive ? searchQuery : searchQuery.toLowerCase();
    let content = textarea.value;
    let searchFrom = caseSensitive ? content : content.toLowerCase();
    let startIdx = lastSearchPos;
    if (startIdx >= content.length) startIdx = 0;
    let idx = searchFrom.indexOf(query, startIdx);
    if (idx === -1 && startIdx > 0) {
      // поиск с начала
      idx = searchFrom.indexOf(query, 0);
    }
    if (idx !== -1) {
      textarea.focus();
      textarea.setSelectionRange(idx, idx + searchQuery.length);
      lastSearchPos = idx + 1;
    } else {
      Lampa.Noty.show('Больше не найдено');
      lastSearchPos = 0;
    }
  }
  
  function findPrev() {
    if (!textarea || !searchQuery) return;
    let query = caseSensitive ? searchQuery : searchQuery.toLowerCase();
    let content = textarea.value;
    let searchFrom = caseSensitive ? content : content.toLowerCase();
    let startIdx = lastSearchPos - searchQuery.length - 1;
    if (startIdx < 0) startIdx = content.length - 1;
    let idx = searchFrom.lastIndexOf(query, startIdx);
    if (idx === -1 && startIdx < content.length) {
      idx = searchFrom.lastIndexOf(query, content.length - 1);
    }
    if (idx !== -1) {
      textarea.focus();
      textarea.setSelectionRange(idx, idx + searchQuery.length);
      lastSearchPos = idx + 1;
    } else {
      Lampa.Noty.show('Ничего не найдено');
    }
  }
  
  // Изменение размера шрифта
  function changeFontSize(delta) {
    fontSize = Math.max(8, Math.min(24, fontSize + delta));
    if (textarea) textarea.style.fontSize = fontSize + 'px';
    if (fontSizeSpan) fontSizeSpan.textContent = fontSize + 'px';
  }
  
  // Очистка буфера с подтверждением
  function clearLogsWithConfirm() {
    if (confirm('Удалить все логи?')) {
      logBuffer = [];
      updateTextArea();
      if (Lampa && Lampa.Noty) Lampa.Noty.show('Логи очищены');
    }
  }

  // Открытие главного окна
  function openDevLog() { 
    const old = document.querySelector('.devlog-activity'); 
    if (old) old.remove(); 
    
    const container = document.createElement('div'); 
    container.className = 'devlog-activity'; 
    container.style.cssText = 
      'position:fixed;top:0;left:0;width:100%;height:100%;' + 
      'background:#1a1a1a;z-index:10000;display:flex;flex-direction:column;'; 
    
    // Шапка
    const header = document.createElement('div'); 
    header.style.cssText = 
      'display:flex;justify-content:space-between;align-items:center;' + 
      'padding:10px 15px;background:#111;color:#fff;font-size:18px;'; 
    header.innerHTML = '📋 Dev Log'; 
    const closeBtn = document.createElement('button'); 
    closeBtn.textContent = '✖'; 
    closeBtn.style.cssText = 
      'background:none;border:none;color:#fff;font-size:22px;cursor:pointer;'; 
    closeBtn.addEventListener('click', () => container.remove()); 
    header.appendChild(closeBtn); 
    
    // Панель 1: фильтр по типу, hideMeta, автоскролл, пауза, шрифт, статистика
    const toolbar1 = document.createElement('div');
    toolbar1.style.cssText = 
      'display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:8px 15px;' +
      'background:#222;color:#fff;font-size:13px;border-bottom:1px solid #444;';
    
    // Фильтр по типу
    const select = document.createElement('select');
    select.className = 'devlog-type-filter';
    select.style.cssText = 'background:#333;color:#fff;border:1px solid #555;padding:4px 8px;border-radius:4px;';
    select.innerHTML = `
      <option value="all">All</option>
      <option value="log">Log</option>
      <option value="error">Error</option>
      <option value="warn">Warn</option>
      <option value="info">Info</option>
      <option value="debug">Debug</option>
    `;
    select.value = filterType;
    select.addEventListener('change', () => {
      filterType = select.value;
      updateTextArea();
    });
    
    // Чекбокс скрыть мета
    const hideMetaLabel = document.createElement('label');
    hideMetaLabel.style.cssText = 'display:flex;align-items:center;gap:4px;cursor:pointer;';
    const hideMetaCheck = document.createElement('input');
    hideMetaCheck.type = 'checkbox';
    hideMetaCheck.checked = hideMeta;
    hideMetaCheck.addEventListener('change', () => {
      hideMeta = hideMetaCheck.checked;
      updateTextArea();
    });
    hideMetaLabel.appendChild(hideMetaCheck);
    hideMetaLabel.appendChild(document.createTextNode('Скрыть время/тип'));
    
    // Автоскролл
    const autoScrollLabel = document.createElement('label');
    autoScrollLabel.style.cssText = 'display:flex;align-items:center;gap:4px;cursor:pointer;';
    const autoScrollCheck = document.createElement('input');
    autoScrollCheck.type = 'checkbox';
    autoScrollCheck.checked = autoScroll;
    autoScrollCheck.addEventListener('change', () => {
      autoScroll = autoScrollCheck.checked;
    });
    autoScrollLabel.appendChild(autoScrollCheck);
    autoScrollLabel.appendChild(document.createTextNode('Автоскролл'));
    
    // Пауза записи
    const pauseLabel = document.createElement('label');
    pauseLabel.style.cssText = 'display:flex;align-items:center;gap:4px;cursor:pointer;';
    const pauseCheck = document.createElement('input');
    pauseCheck.type = 'checkbox';
    pauseCheck.checked = loggingEnabled;
    pauseCheck.addEventListener('change', () => {
      loggingEnabled = pauseCheck.checked;
      if (Lampa && Lampa.Noty) Lampa.Noty.show(loggingEnabled ? 'Запись логов включена' : 'Запись логов приостановлена');
    });
    pauseLabel.appendChild(pauseCheck);
    pauseLabel.appendChild(document.createTextNode('⏸ Пауза'));
    
    // Управление шрифтом
    const fontSizeBlock = document.createElement('div');
    fontSizeBlock.style.cssText = 'display:flex;align-items:center;gap:4px;';
    const fontSizeDown = document.createElement('button');
    fontSizeDown.textContent = 'A-';
    fontSizeDown.style.cssText = 'background:#333;border:none;color:#fff;padding:2px 6px;border-radius:4px;cursor:pointer;';
    fontSizeDown.addEventListener('click', () => changeFontSize(-1));
    const fontSizeUp = document.createElement('button');
    fontSizeUp.textContent = 'A+';
    fontSizeUp.style.cssText = 'background:#333;border:none;color:#fff;padding:2px 6px;border-radius:4px;cursor:pointer;';
    fontSizeUp.addEventListener('click', () => changeFontSize(1));
    fontSizeSpan = document.createElement('span');
    fontSizeSpan.textContent = fontSize + 'px';
    fontSizeSpan.style.minWidth = '40px';
    fontSizeBlock.appendChild(fontSizeDown);
    fontSizeBlock.appendChild(fontSizeSpan);
    fontSizeBlock.appendChild(fontSizeUp);
    
    // Статистика
    statsSpan = document.createElement('span');
    statsSpan.style.cssText = 'background:#111;padding:4px 8px;border-radius:6px;font-family:monospace;font-size:12px;';
    
    toolbar1.appendChild(select);
    toolbar1.appendChild(hideMetaLabel);
    toolbar1.appendChild(autoScrollLabel);
    toolbar1.appendChild(pauseLabel);
    toolbar1.appendChild(fontSizeBlock);
    toolbar1.appendChild(statsSpan);
    
    // Панель 2: поиск, кнопки навигации, сброс, экспорт, копировать, очистить
    const toolbar2 = document.createElement('div');
    toolbar2.style.cssText = 
      'display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px 15px;' +
      'background:#2a2a2a;border-bottom:1px solid #444;';
    
    // Поле поиска
    searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Поиск...';
    searchInput.style.cssText = 'background:#333;color:#fff;border:1px solid #555;padding:4px 8px;border-radius:4px;width:180px;';
    searchInput.value = searchQuery;
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      lastSearchPos = 0;
      updateTextArea();
    });
    
    // Чекбокс регистр
    caseCheckbox = document.createElement('input');
    caseCheckbox.type = 'checkbox';
    caseCheckbox.id = 'caseSensitive';
    const caseLabel = document.createElement('label');
    caseLabel.htmlFor = 'caseSensitive';
    caseLabel.textContent = 'Aa';
    caseLabel.style.cursor = 'pointer';
    caseLabel.style.marginLeft = '4px';
    caseCheckbox.checked = caseSensitive;
    caseCheckbox.addEventListener('change', () => {
      caseSensitive = caseCheckbox.checked;
      lastSearchPos = 0;
      updateTextArea();
    });
    const caseWrapper = document.createElement('div');
    caseWrapper.style.display = 'flex';
    caseWrapper.style.alignItems = 'center';
    caseWrapper.appendChild(caseCheckbox);
    caseWrapper.appendChild(caseLabel);
    
    // Кнопки навигации поиска
    const findPrevBtn = document.createElement('button');
    findPrevBtn.textContent = '▲';
    findPrevBtn.style.cssText = 'background:#333;border:none;color:#fff;padding:4px 8px;border-radius:4px;cursor:pointer;';
    findPrevBtn.addEventListener('click', findPrev);
    const findNextBtn = document.createElement('button');
    findNextBtn.textContent = '▼';
    findNextBtn.style.cssText = 'background:#333;border:none;color:#fff;padding:4px 8px;border-radius:4px;cursor:pointer;';
    findNextBtn.addEventListener('click', findNext);
    
    // Сброс фильтров
    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Сбросить фильтры';
    resetBtn.style.cssText = 'background:#555;border:none;color:#fff;padding:4px 10px;border-radius:4px;cursor:pointer;';
    resetBtn.addEventListener('click', resetFilters);
    
    // Экспорт
    const exportBtn = document.createElement('button');
    exportBtn.textContent = '💾 Экспорт';
    exportBtn.style.cssText = 'background:#2c6e2c;border:none;color:#fff;padding:4px 10px;border-radius:4px;cursor:pointer;';
    exportBtn.addEventListener('click', exportLogs);
    
    // Копировать видимые
    const copyVisibleBtn = document.createElement('button');
    copyVisibleBtn.textContent = '📋 Копировать видимые';
    copyVisibleBtn.style.cssText = 'background:#1e5f7a;border:none;color:#fff;padding:4px 10px;border-radius:4px;cursor:pointer;';
    copyVisibleBtn.addEventListener('click', copyVisible);
    
    // Очистить с подтверждением
    const clearConfirmBtn = document.createElement('button');
    clearConfirmBtn.textContent = '🗑 Очистить всё';
    clearConfirmBtn.style.cssText = 'background:#a13e3e;border:none;color:#fff;padding:4px 10px;border-radius:4px;cursor:pointer;';
    clearConfirmBtn.addEventListener('click', clearLogsWithConfirm);
    
    toolbar2.appendChild(searchInput);
    toolbar2.appendChild(caseWrapper);
    toolbar2.appendChild(findPrevBtn);
    toolbar2.appendChild(findNextBtn);
    toolbar2.appendChild(resetBtn);
    toolbar2.appendChild(exportBtn);
    toolbar2.appendChild(copyVisibleBtn);
    toolbar2.appendChild(clearConfirmBtn);
    
    // Текстовая область
    textarea = document.createElement('textarea'); 
    textarea.readOnly = true; 
    textarea.style.cssText = 
      'flex:1;width:100%;background:#000;color:#0f0;' + 
      'font-family:monospace;font-size:' + fontSize + 'px;border:none;outline:none;' + 
      'resize:none;padding:10px;' + 
      'white-space:pre;word-break:normal;overflow-x:auto;'; 
    window._devLogTextArea = textarea; 
    updateTextArea(); 
    
    // Нижняя панель с дополнительной кнопкой очистки (оставим и старую, и новую)
    const footer = document.createElement('div'); 
    footer.style.cssText = 
      'display:flex;padding:10px;gap:10px;justify-content:flex-end;'; 
    
    const copyAllBtn = document.createElement('button'); 
    copyAllBtn.textContent = '📋 Копировать все (сырые)'; 
    copyAllBtn.style.cssText = 
      'padding:10px 20px;background:#333;color:#fff;border:none;border-radius:4px;cursor:pointer;'; 
    copyAllBtn.addEventListener('click', () => { 
      const rawText = logBuffer.map(e => `[${e.time}] [${e.type}] ${e.text}`).join('\n');
      fallbackCopy(rawText);
    }); 
    
    const clearOldBtn = document.createElement('button'); 
    clearOldBtn.textContent = 'Очистить (без подтверждения)'; 
    clearOldBtn.style.cssText = 
      'padding:10px 20px;background:#333;color:#fff;border:none;border-radius:4px;cursor:pointer;'; 
    clearOldBtn.addEventListener('click', () => { 
      logBuffer = []; 
      updateTextArea(); 
      if (Lampa && Lampa.Noty) Lampa.Noty.show('Логи очищены'); 
    }); 
    
    footer.appendChild(copyAllBtn); 
    footer.appendChild(clearOldBtn); 
    
    // Сборка
    container.appendChild(header);
    container.appendChild(toolbar1);
    container.appendChild(toolbar2);
    container.appendChild(textarea); 
    container.appendChild(footer); 
    document.body.appendChild(container); 
    
    // Фокус на поле поиска (опционально)
    searchInput.focus();
  } 

  // Перехват console
  function initLogger() { 
    const handler = { 
      get(target, prop) { 
        const original = target[prop]; 
        if (typeof original === 'function' && 
            ['log','error','warn','info','debug'].includes(prop)) { 
          return function(...args) { 
            original.apply(target, args); 
            addLog(prop, args); 
          }; 
        } 
        return original; 
      } 
    }; 
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
    initLogger(); 
    
    // FAB-кнопка
    const fab = document.createElement('div'); 
    fab.id = 'devlog-fab'; 
    fab.innerHTML = '📋'; 
    fab.style.cssText = 
      'position:fixed;bottom:80px;right:15px;z-index:9999;' + 
      'background:#e74c3c;color:#fff;width:48px;height:48px;display:flex;' + 
      'align-items:center;justify-content:center;border-radius:50%;' + 
      'font-weight:bold;font-size:20px;box-shadow:0 2px 8px rgba(0,0,0,0.5);' + 
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
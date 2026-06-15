(function() { 
  'use strict'; 
  
  const MAX_LOGS = 2000; 
  let logBuffer = []; 

  // Состояния интерфейса
  let filterType = 'all';     // 'all', 'log', 'error', 'warn', 'info', 'debug'
  let hideMeta = false;       // скрыть время и тип
  let searchQuery = '';       // строка поиска
  let ignoreCase = true;      // игнорировать регистр при поиске
  let paused = false;         // пауза обновления окна
  let autoScroll = true;      // автоматическая прокрутка вниз
  let fontSize = 13;          // размер шрифта в пикселях
  let theme = 'dark';         // 'dark' или 'light'

  // DOM-элементы, к которым нужен доступ
  let textarea = null;
  let statsSpan = null;
  let fontSpan = null;

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
    
    // Обновляем статистику и, если не на паузе, перерисовываем окно
    updateStats();
    if (!paused && window._devLogTextArea) { 
      updateTextArea(window._devLogTextArea); 
    } 
  } 

  // Фильтрация логов по типу, поиску и hideMeta (но hideMeta влияет только на отображение строки)
  function getFilteredLogs() {
    let filtered = filterType === 'all' 
      ? logBuffer.slice() 
      : logBuffer.filter(entry => entry.type === filterType);
    
    if (searchQuery.trim() !== '') {
      const query = ignoreCase ? searchQuery.toLowerCase() : searchQuery;
      filtered = filtered.filter(entry => {
        const haystack = ignoreCase ? entry.text.toLowerCase() : entry.text;
        return haystack.includes(query);
      });
    }
    return filtered;
  }

  function updateTextArea(textareaEl) { 
    if (!textareaEl) return; 
    
    const filtered = getFilteredLogs();
    
    const text = filtered.map(entry => {
      if (hideMeta) {
        return entry.text;
      } else {
        return `[${entry.time}] [${entry.type.toUpperCase()}] ${entry.text}`;
      }
    }).join('\n');
    
    textareaEl.value = text; 
    if (autoScroll) {
      textareaEl.scrollTop = textareaEl.scrollHeight; 
    }
  } 

  function updateStats() {
    if (!statsSpan) return;
    const total = logBuffer.length;
    const byType = {
      log: logBuffer.filter(e => e.type === 'log').length,
      error: logBuffer.filter(e => e.type === 'error').length,
      warn: logBuffer.filter(e => e.type === 'warn').length,
      info: logBuffer.filter(e => e.type === 'info').length,
      debug: logBuffer.filter(e => e.type === 'debug').length
    };
    const filteredCount = getFilteredLogs().length;
    statsSpan.innerHTML = `Всего:${total} (показано:${filteredCount}) | L:${byType.log} E:${byType.error} W:${byType.warn} I:${byType.info} D:${byType.debug}`;
  }

  function refreshLogs() {
    if (textarea) updateTextArea(textarea);
    updateStats();
  }

  function applyTheme() {
    const container = document.querySelector('.devlog-activity');
    if (!container) return;
    if (theme === 'light') {
      container.style.background = '#f0f0f0';
      container.style.color = '#000';
      if (textarea) {
        textarea.style.background = '#fff';
        textarea.style.color = '#000';
      }
    } else {
      container.style.background = '#1a1a1a';
      container.style.color = '#fff';
      if (textarea) {
        textarea.style.background = '#000';
        textarea.style.color = '#0f0';
      }
    }
  }

  function changeFontSize(delta) {
    fontSize = Math.max(8, Math.min(24, fontSize + delta));
    if (textarea) textarea.style.fontSize = fontSize + 'px';
    if (fontSpan) fontSpan.innerHTML = fontSize + 'px';
  }

  function exportToFile() {
    const filtered = getFilteredLogs();
    let content = filtered.map(entry => {
      if (hideMeta) return entry.text;
      return `[${entry.time}] [${entry.type.toUpperCase()}] ${entry.text}`;
    }).join('\n');
    const blob = new Blob([content], {type: 'text/plain'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `devlog_${new Date().toISOString().slice(0,19)}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
    if (Lampa && Lampa.Noty) Lampa.Noty.show('Экспортировано в файл');
  }

  function copyRawLogs() {
    const rawText = logBuffer.map(entry => {
      return `[${entry.time}] [${entry.type.toUpperCase()}] ${entry.text}`;
    }).join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(rawText)
        .then(() => Lampa.Noty.show('Скопированы все логи!'))
        .catch(() => fallbackCopy(rawText));
    } else {
      fallbackCopy(rawText);
    }
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
      if (Lampa && Lampa.Noty) Lampa.Noty.show('Скопировано!'); 
    } catch (err) { 
      if (Lampa && Lampa.Noty) Lampa.Noty.show('Ошибка копирования'); 
    } 
    document.body.removeChild(ta); 
  } 

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
    header.innerHTML = 'Dev Log'; 
    
    const closeBtn = document.createElement('button'); 
    closeBtn.textContent = '✖'; 
    closeBtn.style.cssText = 
      'background:none;border:none;color:#fff;font-size:22px;cursor:pointer;'; 
    closeBtn.addEventListener('click', () => container.remove()); 
    header.appendChild(closeBtn); 
    
    // Первая панель инструментов (фильтр типа, чекбокс hideMeta)
    const toolbar1 = document.createElement('div');
    toolbar1.style.cssText = 
      'display:flex;align-items:center;gap:10px;padding:8px 15px;' +
      'background:#222;color:#fff;font-size:14px;flex-wrap:wrap;';
    
    // Выпадающий список фильтра по типу
    const select = document.createElement('select');
    select.style.cssText = 
      'background:#333;color:#fff;border:1px solid #555;padding:4px 8px;border-radius:4px;';
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
      refreshLogs();
    });
    
    // Чекбокс "Скрыть время и тип"
    const labelHide = document.createElement('label');
    labelHide.style.cssText = 'display:flex;align-items:center;gap:4px;cursor:pointer;';
    const checkboxHide = document.createElement('input');
    checkboxHide.type = 'checkbox';
    checkboxHide.checked = hideMeta;
    checkboxHide.addEventListener('change', () => {
      hideMeta = checkboxHide.checked;
      refreshLogs();
    });
    labelHide.appendChild(checkboxHide);
    labelHide.appendChild(document.createTextNode('Скрыть время/тип'));
    
    // Статистика
    statsSpan = document.createElement('span');
    statsSpan.style.cssText = 'margin-left:auto;font-size:12px;color:#aaa;';
    updateStats();
    
    toolbar1.appendChild(select);
    toolbar1.appendChild(labelHide);
    toolbar1.appendChild(statsSpan);
    
    // Вторая панель инструментов (поиск, настройки)
    const toolbar2 = document.createElement('div');
    toolbar2.style.cssText = 
      'display:flex;align-items:center;gap:10px;padding:8px 15px;' +
      'background:#2a2a2a;color:#fff;font-size:14px;flex-wrap:wrap;';
    
    // Поле поиска
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Поиск...';
    searchInput.style.cssText = 'padding:4px 8px;border-radius:4px;border:1px solid #555;background:#333;color:#fff;';
    searchInput.value = searchQuery;
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value;
      refreshLogs();
    });
    
    // Чекбокс "Игнорировать регистр"
    const labelCase = document.createElement('label');
    labelCase.style.cssText = 'display:flex;align-items:center;gap:4px;cursor:pointer;';
    const checkboxCase = document.createElement('input');
    checkboxCase.type = 'checkbox';
    checkboxCase.checked = ignoreCase;
    checkboxCase.addEventListener('change', () => {
      ignoreCase = checkboxCase.checked;
      refreshLogs();
    });
    labelCase.appendChild(checkboxCase);
    labelCase.appendChild(document.createTextNode('Aa'));
    labelCase.title = 'Игнорировать регистр';
    
    // Кнопка сброса фильтров
    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Сброс';
    resetBtn.style.cssText = 'padding:4px 8px;background:#555;border:none;border-radius:4px;color:#fff;cursor:pointer;';
    resetBtn.addEventListener('click', () => {
      filterType = 'all';
      select.value = 'all';
      searchQuery = '';
      searchInput.value = '';
      ignoreCase = true;
      checkboxCase.checked = true;
      hideMeta = false;
      checkboxHide.checked = false;
      refreshLogs();
    });
    
    // Пауза обновления
    const pauseBtn = document.createElement('button');
    pauseBtn.textContent = '⏸ Пауза';
    pauseBtn.style.cssText = 'padding:4px 8px;background:#555;border:none;border-radius:4px;color:#fff;cursor:pointer;';
    pauseBtn.addEventListener('click', () => {
      paused = !paused;
      pauseBtn.textContent = paused ? '▶ Пуск' : '⏸ Пауза';
      if (!paused) refreshLogs();
    });
    
    // Автоскролл
    const scrollCheck = document.createElement('label');
    scrollCheck.style.cssText = 'display:flex;align-items:center;gap:4px;cursor:pointer;';
    const scrollCb = document.createElement('input');
    scrollCb.type = 'checkbox';
    scrollCb.checked = autoScroll;
    scrollCb.addEventListener('change', () => { autoScroll = scrollCb.checked; });
    scrollCheck.appendChild(scrollCb);
    scrollCheck.appendChild(document.createTextNode('Автоскролл'));
    
    // Регулировка шрифта
    fontSpan = document.createElement('span');
    fontSpan.textContent = fontSize + 'px';
    fontSpan.style.cssText = 'margin-left:4px;min-width:40px;text-align:center;';
    const fontMinus = document.createElement('button');
    fontMinus.textContent = 'A-';
    fontMinus.style.cssText = 'padding:2px 6px;background:#555;border:none;border-radius:4px;color:#fff;cursor:pointer;';
    fontMinus.addEventListener('click', () => changeFontSize(-1));
    const fontPlus = document.createElement('button');
    fontPlus.textContent = 'A+';
    fontPlus.style.cssText = 'padding:2px 6px;background:#555;border:none;border-radius:4px;color:#fff;cursor:pointer;';
    fontPlus.addEventListener('click', () => changeFontSize(1));
    
    // Переключение темы
    const themeBtn = document.createElement('button');
    themeBtn.textContent = '🌓 Тема';
    themeBtn.style.cssText = 'padding:4px 8px;background:#555;border:none;border-radius:4px;color:#fff;cursor:pointer;';
    themeBtn.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      applyTheme();
    });
    
    toolbar2.appendChild(searchInput);
    toolbar2.appendChild(labelCase);
    toolbar2.appendChild(resetBtn);
    toolbar2.appendChild(pauseBtn);
    toolbar2.appendChild(scrollCheck);
    toolbar2.appendChild(fontMinus);
    toolbar2.appendChild(fontSpan);
    toolbar2.appendChild(fontPlus);
    toolbar2.appendChild(themeBtn);
    
    // Текстовая область
    textarea = document.createElement('textarea'); 
    textarea.readOnly = true; 
    textarea.style.cssText = 
      'flex:1;width:100%;background:#000;color:#0f0;' + 
      'font-family:monospace;font-size:' + fontSize + 'px;border:none;outline:none;' + 
      'resize:none;padding:10px;' + 
      'white-space:pre;word-break:normal;overflow-x:auto;'; 
    window._devLogTextArea = textarea; 
    refreshLogs();
    
    DevLog.log('DevLog opened'); 
    
    // Нижняя панель с кнопками
    const footer = document.createElement('div'); 
    footer.style.cssText = 
      'display:flex;padding:10px;gap:10px;justify-content:flex-end;'; 
    
    const copyFilteredBtn = document.createElement('button'); 
    copyFilteredBtn.textContent = 'Копировать (фильтр)'; 
    copyFilteredBtn.style.cssText = 
      'padding:10px 20px;background:#333;color:#fff;border:none;border-radius:4px;cursor:pointer;'; 
    copyFilteredBtn.addEventListener('click', () => { 
      const logText = textarea.value; 
      if (navigator.clipboard && navigator.clipboard.writeText) { 
        navigator.clipboard.writeText(logText)
          .then(() => Lampa.Noty.show('Скопировано (фильтр)')) 
          .catch(() => fallbackCopy(logText)); 
      } else { 
        fallbackCopy(logText); 
      } 
    });
    
    const copyRawBtn = document.createElement('button');
    copyRawBtn.textContent = 'Копировать все';
    copyRawBtn.style.cssText = 'padding:10px 20px;background:#333;color:#fff;border:none;border-radius:4px;cursor:pointer;';
    copyRawBtn.addEventListener('click', copyRawLogs);
    
    const exportBtn = document.createElement('button');
    exportBtn.textContent = 'Экспорт TXT';
    exportBtn.style.cssText = 'padding:10px 20px;background:#333;color:#fff;border:none;border-radius:4px;cursor:pointer;';
    exportBtn.addEventListener('click', exportToFile);
    
    const clearBtn = document.createElement('button'); 
    clearBtn.textContent = 'Очистить'; 
    clearBtn.style.cssText = 
      'padding:10px 20px;background:#333;color:#fff;border:none;border-radius:4px;cursor:pointer;'; 
    clearBtn.addEventListener('click', () => {
      DevLog.clear();
      refreshLogs();
    });
    
    footer.appendChild(copyFilteredBtn); 
    footer.appendChild(copyRawBtn);
    footer.appendChild(exportBtn);
    footer.appendChild(clearBtn); 
    
    // Сборка интерфейса
    container.appendChild(header);
    container.appendChild(toolbar1);
    container.appendChild(toolbar2);
    container.appendChild(textarea); 
    container.appendChild(footer); 
    document.body.appendChild(container); 
    applyTheme();
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
    
    // Плавающая кнопка
    const fab = document.createElement('div'); 
    fab.id = 'devlog-fab'; 
    fab.innerHTML = 'LOG'; 
    fab.style.cssText = 
      'position:fixed;bottom:80px;right:15px;z-index:9999;' + 
      'background:#e74c3c;color:#fff;width:48px;height:48px;display:flex;' + 
      'align-items:center;justify-content:center;border-radius:50%;' + 
      'font-weight:bold;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.5);' + 
      'cursor:pointer;user-select:none;'; 
    fab.addEventListener('click', openDevLog); 
    document.body.appendChild(fab); 
    
    // Пункт в меню Lampa
    try { 
      Lampa.Menu.add('plugins', { 
        title: 'Dev Log', 
        icon: 'log', 
        action: openDevLog 
      }); 
    } catch(e) {} 
  }); 
})();
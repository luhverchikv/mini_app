// app.js
document.addEventListener('DOMContentLoaded', () => {
  // === Элементы DOM ===
  const userNameEl = document.getElementById('userName');
  const userIdEl = document.getElementById('userId');
  const usernameEl = document.getElementById('username');
  const languageEl = document.getElementById('language');
  const closeBtn = document.getElementById('closeBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const fullscreenText = document.getElementById('fullscreenText');
  const saveBtn = document.getElementById('saveBtn');
  const connectionCard = document.getElementById('connectionCard');
  const connectionStatus = document.getElementById('connectionStatus');

  // === Конфигурация API ===
  // Замените на ваш реальный домен при деплое
  const API_BASE = 'https://your-server.com/api/mini-app'; // ← ПОМЕНЯТЬ!
  const API_KEY = 'your-secure-api-key-here'; // ← ПОМЕНЯТЬ! (или получать динамически)

  // === Инициализация Telegram WebApp ===
  // app.js — автоматическое расширение при загрузке

  function initTelegram() {
    if (!window.Telegram?.WebApp) {
      console.warn('Telegram WebApp SDK not found - running in test mode');
      return false;
    }
  
    const tg = window.Telegram.WebApp;
    
    // 1. Сообщаем, что приложение готово
    tg.ready();
    
    // 2. 🔥 АВТОМАТИЧЕСКИ расширяем на всю высоту
    tg.expand();
    
    // 3. Отключаем вертикальные свайпы (чтобы случайно не закрыть)
    if (tg.isVersionAtLeast('6.1')) {
      tg.disableVerticalSwipes();
    }
    
    // 4. Настраиваем цвета под тему пользователя (бесшовная интеграция)
    setupTheme(tg);
    
    // 5. Опционально: скрываем стандартную кнопку закрытия
    // (если у вас есть своя кнопка "Назад" или "Закрыть")
    // tg.MainButton.hide();
    // tg.BackButton.hide(); // или покажите, если нужна навигация
    
    // 6. Получаем данные пользователя
    const user = tg.initDataUnsafe?.user;
    
    if (user) {
      const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Пользователь';
      
      // Обновляем UI
      const userNameEl = document.getElementById('userName');
      const userIdEl = document.getElementById('userId');
      const usernameEl = document.getElementById('username');
      const languageEl = document.getElementById('language');
      
      if (userNameEl) userNameEl.textContent = fullName;
      if (userIdEl) userIdEl.textContent = user.id;
      if (usernameEl) usernameEl.textContent = user.username ? `@${user.username}` : 'Не указан';
      if (languageEl) languageEl.textContent = user.language_code || 'en';
      
      // Сохраняем для отправки на бэкенд
      window.appData = {
        telegramId: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        languageCode: user.language_code,
        initData: tg.initData
      };
      
      console.log('✓ User data loaded:', window.appData);
    } else {
      // Тестовый режим
      console.log('⚠ Running in test mode (no Telegram user data)');
      window.appData = { isTestMode: true };
    }
    
    // 7. Показываем кнопку fullscreen ТОЛЬКО если нужна настоящая иммерсивность
    // (игры, видео и т.д.)
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn && tg.isVersionAtLeast?.('8.0')) {
      // Показываем кнопку, но не требуем её нажатия
      fullscreenBtn.style.display = 'flex';
      updateFullscreenButton();
    } else if (fullscreenBtn) {
      fullscreenBtn.style.display = 'none';
    }
    
    // 8. Слушаем изменения вида
    tg.onEvent('viewportChanged', onViewportChange);
    tg.onEvent('fullscreenChanged', onFullscreenChange);
    
    return true;
  }

// === Вспомогательные функции ===

function setupTheme(tg) {
  const root = document.documentElement;
  
  const themeMap = {
    'bg_color': '--tg-theme-bg-color',
    'text_color': '--tg-theme-text-color', 
    'hint_color': '--tg-theme-hint-color',
    'link_color': '--tg-theme-link-color',
    'button_color': '--tg-theme-button-color',
    'button_text_color': '--tg-theme-button-text-color',
    'secondary_bg_color': '--tg-theme-secondary-bg-color',
  };
  
  for (const [tgVar, cssVar] of Object.entries(themeMap)) {
    if (tg[tgVar]) {
      root.style.setProperty(cssVar, tg[tgVar]);
    }
  }
  
  // Устанавливаем цвета хедера для бесшовности
  if (tg.setHeaderColor) {
    tg.setHeaderColor(tg.bg_color || '#ffffff');
  }
  if (tg.setBackgroundColor) {
    tg.setBackgroundColor(tg.bg_color || '#ffffff');
  }
}

function onViewportChange() {
  const tg = window.Telegram.WebApp;
  console.log(`Viewport: ${window.innerWidth}x${tg.viewportHeight}px`);
  // Можно пересчитать макет, если нужно
}

function onFullscreenChange() {
  updateFullscreenButton();
}

function updateFullscreenButton() {
  const tg = window.Telegram.WebApp;
  const btn = document.getElementById('fullscreenBtn');
  const text = document.getElementById('fullscreenText');
  
  if (!btn || !text) return;
  
  if (tg.isFullscreen) {
    text.textContent = '🗕 Свернуть';
    btn.classList.add('active');
    document.body.classList.add('fullscreen-active');
  } else {
    text.textContent = '⛶ На весь экран';
    btn.classList.remove('active');
    document.body.classList.remove('fullscreen-active');
  }
}

// === Кнопка переключения фуллскрина (опционально) ===
function toggleFullscreen() {
  const tg = window.Telegram.WebApp;
  
  if (!tg?.isVersionAtLeast?.('8.0')) {
    if (tg.showAlert) tg.showAlert('Полноэкранный режим не поддерживается в этой версии Telegram');
    return;
  }
  
  if (tg.isFullscreen) {
    tg.exitFullscreen();
  } else {
    // requestFullscreen вызывается по клику — это разрешено
    tg.requestFullscreen();
  }
}



  // === Настройка темы под Telegram ===
  function setupTheme(tg) {
    const root = document.documentElement;
    
    // Маппинг переменных Telegram на CSS переменные
    const themeMap = {
      'bg_color': '--tg-theme-bg-color',
      'text_color': '--tg-theme-text-color',
      'hint_color': '--tg-theme-hint-color',
      'link_color': '--tg-theme-link-color',
      'button_color': '--tg-theme-button-color',
      'button_text_color': '--tg-theme-button-text-color',
      'secondary_bg_color': '--tg-theme-secondary-bg-color',
    };
    
    for (const [tgVar, cssVar] of Object.entries(themeMap)) {
      if (tg[tgVar]) {
        root.style.setProperty(cssVar, tg[tgVar]);
      }
    }
  }

  // === Полноэкранный режим ===
  function toggleFullscreen() {
    const tg = window.Telegram.WebApp;
    
    if (!tg?.isVersionAtLeast?.('8.0')) {
      showStatus('Полноэкранный режим не поддерживается', 'error');
      return;
    }
    
    if (tg.isFullscreen) {
      tg.exitFullscreen();
    } else {
      // requestFullscreen должен вызываться по действию пользователя
      tg.requestFullscreen();
    }
  }

  function updateFullscreenButton() {
    const tg = window.Telegram.WebApp;
    
    if (tg.isFullscreen) {
      fullscreenText.textContent = 'Выйти из полноэкранного';
      fullscreenBtn.classList.add('active');
      document.body.classList.add('fullscreen-active');
    } else {
      fullscreenText.textContent = 'Полноэкранный режим';
      fullscreenBtn.classList.remove('active');
      document.body.classList.remove('fullscreen-active');
    }
  }

  function onFullscreenChange() {
    updateFullscreenButton();
    console.log('Fullscreen state:', window.Telegram.WebApp.isFullscreen);
  }

  function onViewportChange() {
    const tg = window.Telegram.WebApp;
    console.log(`Viewport: ${window.innerWidth}x${tg.viewportHeight}px`);
    // Можно пересчитать макет, если нужно
  }

  // === API интеграция с бэкендом ===
  // app.js — упрощённая функция отправки

  async function saveToBackend(data) {
    const statusEl = document.getElementById('connectionStatus');
    
    try {
      // Показываем статус "отправка"
      if (statusEl) {
        statusEl.textContent = 'Отправка...';
        statusEl.className = 'info-value status-connecting';
      }
      
      const API_BASE = 'https://your-server.com/api/mini-app'; // ← ПОМЕНЯТЬ!
      const API_KEY = 'your-secure-api-key-here'; // ← ПОМЕНЯТЬ!
      
      const response = await fetch(`${API_BASE}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
          // Убрали X-Telegram-Init-Data для простоты
        },
        body: JSON.stringify({
          message: 'mini_app_action',
          meta: {
            action: data.action || 'manual_save',
            note: data.note || '',
            timestamp: new Date().toISOString()
          }
        })
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      
      // Успех
      if (statusEl) {
        statusEl.textContent = 'Сохранено ✓';
        statusEl.className = 'info-value status-success';
      }
      
      console.log('✓ Server response:', result);
      
      // Показываем уведомление
      if (window.Telegram?.WebApp?.showAlert && result.ok) {
        window.Telegram.WebApp.showAlert('✅ Данные отправлены!');
      }
      
      return result;
      
    } catch (error) {
      console.error('✗ Request failed:', error);
      
      if (statusEl) {
        statusEl.textContent = 'Ошибка';
        statusEl.className = 'info-value status-error';
      }
      
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert(`❌ Ошибка: ${error.message}`);
      }
      
      return null;
    }
  }



  // === Вспомогательные функции ===
  function showStatus(message, type = 'info') {
    if (window.Telegram?.WebApp?.showAlert) {
      window.Telegram.WebApp.showAlert(message);
    } else {
      alert(message);
    }
  }

  // === Обработчики событий ===
  
  // Кнопка закрытия
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.close();
      } else {
        window.close();
      }
    });
  }
  
  // Кнопка fullscreen
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', toggleFullscreen);
  }
  
  // Кнопка сохранения (пример)
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const result = await saveToBackend({
        action: 'manual_save',
        note: 'Пользователь нажал кнопку сохранения'
      });
      
      if (result) {
        showStatus('✅ Данные успешно сохранены!');
      }
    });
  }

  // === Инициализация ===
  const isTelegram = initTelegram();
  
  if (!isTelegram) {
    console.log('Running outside Telegram - some features disabled');
  }
});


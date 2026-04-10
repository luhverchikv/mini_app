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
  
  // === Геолокация ===
  const locationCard = document.getElementById('locationCard');
  const locationValue = document.getElementById('locationValue');
  const requestLocationBtn = document.getElementById('requestLocationBtn');
  
  // === Конфигурация API ===
  // Замените на ваш реальный домен при деплое
  const API_BASE = 'https://your-server.com/api/mini-app'; // ← ПОМЕНЯТЬ!
  const API_KEY = 'your-secure-api-key-here'; // ← ПОМЕНЯТЬ! (или получать динамически)

  // === Инициализация Telegram WebApp ===
  function initTelegram() {
    if (!window.Telegram?.WebApp) {
      console.warn('Telegram WebApp SDK not found - running in test mode');
      return false;
    }

    const tg = window.Telegram.WebApp;
    
    // Сообщаем Telegram, что приложение готово
    tg.ready();
    
    // Настраиваем цвета под тему пользователя
    setupTheme(tg);
    
    // Получаем данные пользователя
    const user = tg.initDataUnsafe?.user;
    
    if (user) {
      const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Пользователь';
      
      userNameEl.textContent = fullName;
      userIdEl.textContent = user.id;
      usernameEl.textContent = user.username ? `@${user.username}` : 'Не указан';
      languageEl.textContent = user.language_code || 'en';
      
      // Сохраняем данные для отправки в бэкенд
      window.appData = {
        telegramId: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        languageCode: user.language_code,
        initData: tg.initData // Для валидации на бэкенде
      };
      
      console.log('✓ User data loaded:', window.appData);
    } else {
      // Тестовый режим (локальная разработка)
      userNameEl.textContent = 'Тестовый режим';
      userIdEl.textContent = '123456789';
      usernameEl.textContent = '@test_user';
      languageEl.textContent = 'ru';
      
      window.appData = {
        telegramId: 123456789,
        username: 'test_user',
        isTestMode: true
      };
      
      console.log('⚠ Running in test mode');
    }

    
    // Показываем карточку геолокации вместо статуса
    locationCard.style.display = 'flex';
    // connectionCard.style.display = 'flex'; // это кнопка Статус. пока на удаление
    
    // Слушаем события
    tg.onEvent('viewportChanged', onViewportChange);
    tg.onEvent('fullscreenChanged', onFullscreenChange);
    
    // Скрываем стандартную кнопку закрытия, используем свою
    tg.MainButton.hide();
    
    // Пытаемся включить полноэкранный режим
    function tryEnterFullscreen() {
        if (tg.requestFullscreen) {
            tg.requestFullscreen().catch(err => {
                console.warn('Fullscreen request failed:', err);
                // fallback — просто расширяем
                tg.expand();
                // Показываем кнопку, если автоматика не сработала
                if (fullscreenBtn) fullscreenBtn.style.display = 'flex';
            });
        } else {
            // Старая версия Telegram — просто расширяем
            tg.expand();
            if (fullscreenBtn) fullscreenBtn.style.display = 'flex';
        }
    }
    
    // Вызываем сразу
    tryEnterFullscreen();
    
    return true;
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

  // === Работа с геолокацией Telegram ===
  async function requestTelegramLocation() {
    if (!window.Telegram?.WebApp?.LocationManager) {
      showStatus('Геолокация не поддерживается в этой версии Telegram', 'error');
      return;
    }
  
    const locationManager = Telegram.WebApp.LocationManager;
  
    if (!locationManager.isSupported()) {
      showStatus('Геолокация недоступна', 'error');
      return;
    }
  
    // Меняем текст кнопки на время запроса
    const originalText = requestLocationBtn.textContent;
    requestLocationBtn.textContent = '⏳ Запрос...';
    requestLocationBtn.disabled = true;
  
    try {
      const location = await locationManager.requestLocation();
      if (location && location.latitude && location.longitude) {
        // Отображаем координаты (можно округлить до 5 знаков)
        const lat = location.latitude.toFixed(5);
        const lon = location.longitude.toFixed(5);
        locationValue.innerHTML = `📍 ${lat}, ${lon}`;
        if (location.horizontal_accuracy) {
          locationValue.title = `Точность: ±${location.horizontal_accuracy} м`; // подсказка
        }
        // Можно сохранить координаты в глобальный объект для отправки на бэкенд
        window.userLocation = { latitude: location.latitude, longitude: location.longitude };
        showStatus('Геолокация получена!', 'info');
      } else {
        locationValue.textContent = '❌ Доступ запрещён';
        showStatus('Вы не разрешили доступ к геолокации', 'error');
      }
    } catch (err) {
      console.error('Location error:', err);
      locationValue.textContent = '❌ Ошибка';
      showStatus('Не удалось определить местоположение', 'error');
    } finally {
      requestLocationBtn.textContent = originalText;
      requestLocationBtn.disabled = false;
    }
  }

  // === Инициализация ===
  const isTelegram = initTelegram();
  
  if (!isTelegram) {
    console.log('Running outside Telegram - some features disabled');
  }
});


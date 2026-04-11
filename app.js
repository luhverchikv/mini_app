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

  // === Геолокация ===
  const locationCard = document.getElementById('locationCard');
  const locationValue = document.getElementById('locationValue');
  const requestLocationBtn = document.getElementById('requestLocationBtn');

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

      // Сохраняем данные локально
      window.appData = {
        telegramId: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        languageCode: user.language_code
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

    // Показываем карточку геолокации
    locationCard.style.display = 'flex';

    // Слушаем события
    tg.onEvent('viewportChanged', onViewportChange);
    tg.onEvent('fullscreenChanged', onFullscreenChange);

    // Скрываем стандартную кнопку закрытия
    tg.MainButton.hide();

    // Пытаемся включить полноэкранный режим
    function tryEnterFullscreen() {
      if (tg.requestFullscreen) {
        tg.requestFullscreen().catch(err => {
          console.warn('Fullscreen request failed:', err);
          tg.expand();
          if (fullscreenBtn) fullscreenBtn.style.display = 'flex';
        });
      } else {
        tg.expand();
        if (fullscreenBtn) fullscreenBtn.style.display = 'flex';
      }
    }

    tryEnterFullscreen();
    return true;
  }

  // === Настройка темы под Telegram ===
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
  }

  // === Полноэкранный режим ===
  function toggleFullscreen() {
    const tg = window.Telegram.WebApp;

    if (!tg?.isVersionAtLeast?.('8.0')) {
      showAlert('Полноэкранный режим не поддерживается', 'error');
      return;
    }

    if (tg.isFullscreen) {
      tg.exitFullscreen();
    } else {
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
  }

  // === Вспомогательные функции ===
  function showAlert(message, type = 'info') {
    // Определяем источник geolocation для отображения статуса
    if (type === 'info' || type === 'success' || type === 'error') {
      locationValue.textContent = message;
      locationValue.className = 'info-value status-' + type;
    }

    // Показываем toast через Telegram или fallback
    if (window.Telegram?.WebApp?.showPopup) {
      if (type === 'error') {
        window.Telegram.WebApp.showPopup({
          title: 'Ошибка',
          message: message,
          buttons: [{ type: 'close' }]
        });
      } else if (type === 'success') {
        window.Telegram.WebApp.showPopup({
          title: 'Успешно',
          message: message,
          buttons: [{ type: 'close' }]
        });
      }
    } else if (window.Telegram?.WebApp?.showAlert) {
      window.Telegram.WebApp.showAlert(message);
    } else {
      alert(message);
    }
  }

  // === РАБОТА С ГЕОЛОКАЦИЕЙ ===

  // Определяем источник геолокации для отображения
  let locationSource = 'telegram';

  // 1. Проверяем поддержку Telegram LocationManager
  function isTelegramLocationSupported() {
    const tg = window.Telegram?.WebApp;
    if (!tg) return false;

    // Проверяем версию Telegram (нужна 8.0+)
    if (!tg.isVersionAtLeast || !tg.isVersionAtLeast('8.0')) {
      return false;
    }

    // Проверяем наличие LocationManager
    return tg.LocationManager && typeof tg.LocationManager.requestLocation === 'function';
  }

  // 2. Проверяем поддержку браузерного Geolocation API
  function isBrowserGeolocationSupported() {
    return navigator.geolocation && typeof navigator.geolocation.getCurrentPosition === 'function';
  }

  // 3. Запрашиваем геолокацию через Telegram LocationManager
  async function requestTelegramLocation() {
    const locationManager = Telegram.WebApp.LocationManager;

    if (!locationManager.isSupported()) {
      throw new Error('Telegram LocationManager не поддерживается');
    }

    locationSource = 'telegram';
    const location = await locationManager.requestLocation();

    if (!location || !location.latitude || !location.longitude) {
      throw new Error('Геолокация отклонена пользователем');
    }

    return location;
  }

  // 4. Запрашиваем геолокацию через браузерный API
  function requestBrowserLocation() {
    return new Promise((resolve, reject) => {
      locationSource = 'browser';

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error('Доступ к геолокации запрещён'));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error('Местоположение недоступно'));
              break;
            case error.TIMEOUT:
              reject(new Error('Время ожидания истекло'));
              break;
            default:
              reject(new Error('Ошибка определения местоположения'));
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    });
  }

  // 5. Основная функция запроса геолокации с двойным fallback
  async function getLocation() {
    // Проверяем доступные источники
    const tgSupported = isTelegramLocationSupported();
    const browserSupported = isBrowserGeolocationSupported();

    console.log('Геолокация - Telegram:', tgSupported, '| Browser:', browserSupported);

    // Обновляем текст кнопки
    const originalText = requestLocationBtn.textContent;
    requestLocationBtn.textContent = '⏳ Поиск...';
    requestLocationBtn.disabled = true;
    locationValue.textContent = 'Определяем местоположение...';
    locationValue.className = 'info-value status-connecting';

    try {
      let location;

      // Пытаемся использовать Telegram LocationManager
      if (tgSupported) {
        try {
          console.log('Пробуем Telegram LocationManager...');
          location = await requestTelegramLocation();
        } catch (tgError) {
          console.warn('Telegram LocationManager недоступен:', tgError.message);
          // Fallback на браузерный API
          if (browserSupported) {
            console.log('Fallback на браузерный Geolocation API...');
            location = await requestBrowserLocation();
          } else {
            throw tgError;
          }
        }
      } else if (browserSupported) {
        // Telegram не поддерживается, используем браузерный API
        console.log('Используем браузерный Geolocation API...');
        location = await requestBrowserLocation();
      } else {
        throw new Error('Геолокация не поддерживается на этом устройстве');
      }

      // Успех - отображаем результат
      displayLocationResult(location);

    } catch (error) {
      console.error('Ошибка геолокации:', error);
      displayLocationError(error.message);
    } finally {
      requestLocationBtn.textContent = originalText;
      requestLocationBtn.disabled = false;
    }
  }

  // 6. Отображение успешного результата
  function displayLocationResult(location) {
    const lat = location.latitude.toFixed(6);
    const lon = location.longitude.toFixed(6);

    // Отображаем координаты
    locationValue.innerHTML = `
      <span style="color: var(--tg-theme-link-color, #528BFF);">📍</span>
      <span style="margin-left: 4px;">${lat}, ${lon}</span>
    `;
    locationValue.className = 'info-value status-success';

    // Сохраняем локально (без отправки на бэкенд)
    window.userLocation = {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy || location.horizontal_accuracy || null,
      source: locationSource,
      timestamp: new Date().toISOString()
    };

    console.log('✓ Геолокация получена:', window.userLocation);

    // Показываем popup с подтверждением
    if (window.Telegram?.WebApp?.showPopup) {
      const accuracyText = window.userLocation.accuracy
        ? `\nТочность: ±${Math.round(window.userLocation.accuracy)} м`
        : '';
      window.Telegram.WebApp.showPopup({
        title: '📍 Геолокация определена',
        message: `Координаты:\n${lat}, ${lon}${accuracyText}`,
        buttons: [{ type: 'close' }]
      });
    }
  }

  // 7. Отображение ошибки
  function displayLocationError(message) {
    locationValue.innerHTML = `
      <span style="color: #ef4444;">❌</span>
      <span style="margin-left: 4px; color: var(--tg-theme-hint-color, #6b7280);">${message}</span>
    `;
    locationValue.className = 'info-value status-error';

    // Очищаем сохранённую геолокацию
    window.userLocation = null;

    console.error('✗ Геолокация недоступна:', message);
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

  // Кнопка сохранения (без отправки на бэкенд)
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      // Проверяем, есть ли геолокация
      if (window.userLocation) {
        if (window.Telegram?.WebApp?.showPopup) {
          window.Telegram.WebApp.showPopup({
            title: '💾 Данные',
            message: `Сейчас сохранено:\n\nID: ${window.appData?.telegramId || 'N/A'}\nГеолокация: ${window.userLocation.latitude.toFixed(4)}, ${window.userLocation.longitude.toFixed(4)}\nИсточник: ${window.userLocation.source}`,
            buttons: [{ type: 'close' }]
          });
        }
      } else {
        showAlert('Сначала запросите геолокацию', 'info');
      }
    });
  }

  // Кнопка запроса геолокации
  if (requestLocationBtn) {
    requestLocationBtn.addEventListener('click', getLocation);
  }

  // === Инициализация ===
  const isTelegram = initTelegram();

  if (!isTelegram) {
    console.log('Running outside Telegram - some features disabled');
  }
});

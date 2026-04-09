document.addEventListener('DOMContentLoaded', () => {
    const userNameEl = document.getElementById('userName');
    const userIdEl = document.getElementById('userId');
    const usernameEl = document.getElementById('username');
    const languageEl = document.getElementById('language');
    const closeBtn = document.getElementById('closeBtn');

    function initApp() {
        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;

            tg.ready();

            tg.expand();

            const user = tg.initDataUnsafe?.user;

            if (user) {
                const firstName = user.first_name || '';
                const lastName = user.last_name || '';
                const fullName = lastName ? `${firstName} ${lastName}` : firstName;

                userNameEl.textContent = fullName || 'Пользователь';
                userIdEl.textContent = user.id || '—';
                usernameEl.textContent = user.username ? `@${user.username}` : 'Не указан';
                languageEl.textContent = user.language_code || 'en';

                console.log('User data:', {
                    id: user.id,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    username: user.username,
                    languageCode: user.language_code
                });
            } else {
                userNameEl.textContent = 'Тестовый режим';
                userIdEl.textContent = '123456789';
                usernameEl.textContent = '@test_user';
                languageEl.textContent = 'ru';

                console.log('Running in test mode - no user data available');
            }

            tg.MainButton.hide();
        } else {
            userNameEl.textContent = 'Ошибка инициализации';
            userIdEl.textContent = 'Telegram WebApp не найден';
            usernameEl.textContent = '—';
            languageEl.textContent = '—';

            console.error('Telegram WebApp SDK not found');
        }
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (window.Telegram && window.Telegram.WebApp) {
                window.Telegram.WebApp.close();
            } else {
                window.close();
            }
        });
    }

    initApp();
});

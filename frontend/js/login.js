import { api } from './api-client.js';
import { APP_CONFIG, isAdminCredentials, normalizePhone } from './app-config.js';
import { clearMessage, setLoading, showMessage } from './ui-utils.js';

const form = document.querySelector('[data-login-form]');
if (form) {
  const feedback = document.querySelector('[data-login-feedback]');
  const submitButton = form.querySelector('button[type="submit"]');
  const phoneInput = form.querySelector('[name="phone"]');
  const passwordInput = form.querySelector('[name="password"]');

  // do not prefill or expose admin phone in the placeholder

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage(feedback);

    const phone = normalizePhone(phoneInput?.value);
    const password = String(passwordInput?.value || '').trim();

    if (!phone || !password) {
      showMessage(feedback, 'Completa el número de teléfono y la contraseña.');
      return;
    }

    const restore = setLoading(submitButton, 'Entrando...');
    try {
      const payload = isAdminCredentials(phone, password)
        ? await api.login({ phone, password, roleHint: 'admin' })
        : await api.login({ phone, password });

      const target = payload?.role === 'admin' ? './admin-appointments.html' : './appointments.html';
      window.location.assign(target);
    } catch (error) {
      showMessage(feedback, error.message);
    } finally {
      restore();
    }
  });
}

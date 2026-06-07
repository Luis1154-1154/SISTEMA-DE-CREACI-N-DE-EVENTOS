import { api } from './api-client.js';
import { APP_CONFIG, normalizePhone, isValidPhone } from './app-config.js';
import { clearMessage, setLoading, showMessage } from './ui-utils.js';

const form = document.querySelector('[data-register-form]');
if (form) {
  const feedback = document.querySelector('[data-register-feedback]');
  const submitButton = form.querySelector('button[type="submit"]');
  // No password in register form; phone will be normalized below.

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage(feedback);

    const phone = normalizePhone(form.querySelector('[name="phone"]')?.value || '');
    const name = String(form.querySelector('[name="name"]')?.value || '').trim();

    if (!phone || !name) {
      showMessage(feedback, 'Completa número y nombre.');
      return;
    }

    if (!isValidPhone(phone)) {
      showMessage(feedback, 'El teléfono debe tener 10 dígitos. Ejemplo: 3123456789');
      return;
    }

    const restore = setLoading(submitButton, 'Creando cuenta...');
    try {
      await api.register({ phone, name });
      window.location.assign('./login.html');
    } catch (error) {
      showMessage(feedback, error.message);
    } finally {
      restore();
    }
  });
}

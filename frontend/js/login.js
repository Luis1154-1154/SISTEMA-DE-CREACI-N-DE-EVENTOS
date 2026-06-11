import { api } from './api-client.js';
import { normalizePhone, isValidPhone } from './app-config.js';
import { clearMessage, setLoading, showMessage } from './ui-utils.js';

const form = document.querySelector('[data-login-form]');
if (form) {
  const feedback = document.querySelector('[data-login-feedback]');
  const submitButton = form.querySelector('button[type="submit"]');
  const phoneInput = form.querySelector('[name="phone"]');
  const passwordInput = form.querySelector('[name="password"]');
  const togglePasswordButton = form.querySelector('[data-toggle-password]');

  if (togglePasswordButton && passwordInput) {
    togglePasswordButton.addEventListener('click', () => {
      const reveal = passwordInput.type === 'password';
      passwordInput.type = reveal ? 'text' : 'password';
      togglePasswordButton.textContent = reveal ? 'Ocultar contraseña' : 'Mostrar contraseña';
    });
  }

  // No admin checkbox; password field always visible

  // do not prefill or expose admin phone in the placeholder

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage(feedback);

    const phone = normalizePhone(String(phoneInput?.value || '').trim());
    const password = String(passwordInput?.value || '').trim();

    if (!phone) {
      showMessage(feedback, 'Completa el número de teléfono.');
      return;
    }

    if (!isValidPhone(phone)) {
      showMessage(feedback, 'El número debe ser válido y escribirse sin lada. Ejemplo: 3123456789');
      return;
    }

    if (!password) {
      showMessage(feedback, 'Ingresa la contraseña.');
      return;
    }

    const restore = setLoading(submitButton, 'Entrando...');
    try {
      const payload = await api.login({ phone, password });

      if (payload?.token) {
        api.setAuthToken(payload.token);
      }

      // Confirm session is active and /auth/me works before redirecting.
      try {
        await api.me();
      } catch (e) {
        showMessage(feedback, 'Inicio fallido: no se pudo confirmar la sesión en el servidor. Intenta de nuevo.');
        return;
      }

      const target = payload?.role === 'admin' ? './admin-appointments.html' : './appointments.html';
      window.location.assign(target);
    } catch (error) {
      showMessage(feedback, error.message);
    } finally {
      restore();
    }
  });
}

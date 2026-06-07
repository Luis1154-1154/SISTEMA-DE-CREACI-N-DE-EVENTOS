import { api } from './api-client.js';
import { APP_CONFIG, isAdminCredentials, normalizePhone } from './app-config.js';
import { clearMessage, setLoading, showMessage } from './ui-utils.js';

const form = document.querySelector('[data-login-form]');
if (form) {
  const feedback = document.querySelector('[data-login-feedback]');
  const submitButton = form.querySelector('button[type="submit"]');
  const phoneInput = form.querySelector('[name="phone"]');
  const passwordInput = form.querySelector('[name="password"]');
  const togglePasswordButton = form.querySelector('[data-toggle-password]');
  const adminCheck = form.querySelector('#admin-check');

  if (togglePasswordButton && passwordInput) {
    togglePasswordButton.addEventListener('click', () => {
      const reveal = passwordInput.type === 'password';
      passwordInput.type = reveal ? 'text' : 'password';
      togglePasswordButton.textContent = reveal ? 'Ocultar contraseña' : 'Mostrar contraseña';
    });
  }

  if (adminCheck && passwordInput) {
    adminCheck.addEventListener('change', () => {
      const panel = document.getElementById('admin-password-panel');
      if (adminCheck.checked) {
        panel.classList.remove('d-none');
      } else {
        panel.classList.add('d-none');
      }
    });
  }

  // do not prefill or expose admin phone in the placeholder

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage(feedback);

    const phone = normalizePhone(String(phoneInput?.value || '').trim());
    const password = String(passwordInput?.value || '').trim();
    const isAdmin = adminCheck ? adminCheck.checked : false;

    if (!phone) {
      showMessage(feedback, 'Completa el número de teléfono.');
      return;
    }

    if (isAdmin && !password) {
      showMessage(feedback, 'Ingresa la contraseña de admin.');
      return;
    }

    const restore = setLoading(submitButton, 'Entrando...');
    try {
      let payload;
      if (isAdmin) {
        payload = await api.login({ phone, password });
      } else {
        // User login by phone only
        payload = await api.login({ phone });
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

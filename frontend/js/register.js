import { api } from './api-client.js';
import { clearMessage, setLoading, showMessage } from './ui-utils.js';

const form = document.querySelector('[data-register-form]');
if (form) {
  const feedback = document.querySelector('[data-register-feedback]');
  const submitButton = form.querySelector('button[type="submit"]');
  const passwordInput = form.querySelector('[name="password"]');
  const togglePasswordButton = form.querySelector('[data-toggle-password]');

  if (togglePasswordButton && passwordInput) {
    togglePasswordButton.addEventListener('click', () => {
      const reveal = passwordInput.type === 'password';
      passwordInput.type = reveal ? 'text' : 'password';
      togglePasswordButton.textContent = reveal ? 'Ocultar contraseña' : 'Mostrar contraseña';
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage(feedback);

    const phone = String(form.querySelector('[name="phone"]')?.value || '').trim();
    const name = String(form.querySelector('[name="name"]')?.value || '').trim();

    if (!phone || !name) {
      showMessage(feedback, 'Completa número y nombre.');
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

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
    const password = String(form.querySelector('[name="password"]')?.value || '').trim();

    if (!phone || !name || !password) {
      showMessage(feedback, 'No dejes ningún campo vacío.');
      return;
    }

    if (password.length < 6) {
      showMessage(feedback, 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const restore = setLoading(submitButton, 'Creando cuenta...');
    try {
      await api.register({ phone, name, password });
      window.location.assign('./login.html');
    } catch (error) {
      showMessage(feedback, error.message);
    } finally {
      restore();
    }
  });
}

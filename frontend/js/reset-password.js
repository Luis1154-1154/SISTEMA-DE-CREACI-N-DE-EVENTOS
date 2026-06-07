import { api } from './api-client.js';
import { clearMessage, setLoading, showMessage } from './ui-utils.js';

const form = document.querySelector('[data-reset-form]');

if (form) {
  const feedback = document.querySelector('[data-reset-feedback]');
  const submitButton = form.querySelector('button[type="submit"]');
  const passwordInput = form.querySelector('[name="newPassword"]');
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
    const newPassword = String(passwordInput?.value || '').trim();

    if (!phone || !newPassword) {
      showMessage(feedback, 'Completa el número de teléfono y la nueva contraseña.');
      return;
    }

    if (newPassword.length < 6) {
      showMessage(feedback, 'La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const restore = setLoading(submitButton, 'Restableciendo...');
    try {
      await api.resetPassword({ phone, newPassword });
      showMessage(feedback, 'Contraseña actualizada. Ahora inicia sesión.', 'success');
      setTimeout(() => {
        window.location.assign('./login.html');
      }, 900);
    } catch (error) {
      showMessage(feedback, error.message);
    } finally {
      restore();
    }
  });
}

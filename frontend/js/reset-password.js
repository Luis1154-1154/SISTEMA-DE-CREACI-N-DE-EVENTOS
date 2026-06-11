import { api } from './api-client.js';
import { clearMessage, setLoading, showMessage } from './ui-utils.js';
import { normalizePhone, isValidPhone } from './app-config.js';

const form = document.querySelector('[data-reset-form]');
const requestCodeButton = document.querySelector('[data-request-code]');
const resetSubmitButton = document.querySelector('[data-reset-submit]');
const codeRow = document.querySelector('[data-reset-code-row]');
const passwordRow = document.querySelector('[data-reset-password-row]');
const togglePasswordButton = document.querySelector('[data-toggle-password]');

function showStepTwo() {
  if (codeRow) codeRow.classList.remove('d-none');
  if (passwordRow) passwordRow.classList.remove('d-none');
  if (resetSubmitButton) resetSubmitButton.classList.remove('d-none');
}

function resetFormState() {
  if (codeRow) codeRow.classList.add('d-none');
  if (passwordRow) passwordRow.classList.add('d-none');
  if (resetSubmitButton) resetSubmitButton.classList.add('d-none');
}

function togglePasswordVisibility() {
  const passwordInput = document.querySelector('[name="newPassword"]');
  if (!passwordInput) return;
  const show = passwordInput.type === 'password';
  passwordInput.type = show ? 'text' : 'password';
  if (togglePasswordButton) {
    togglePasswordButton.textContent = show ? 'Ocultar contraseña' : 'Mostrar contraseña';
  }
}

if (form) {
  const feedback = document.querySelector('[data-reset-feedback]');
  const phoneInput = form.querySelector('[name="phone"]');
  const codeInput = form.querySelector('[name="code"]');
  const passwordInput = form.querySelector('[name="newPassword"]');

  resetFormState();

  requestCodeButton?.addEventListener('click', async () => {
    clearMessage(feedback);
    const phone = normalizePhone(String(phoneInput?.value || '').trim());

    if (!phone) {
      showMessage(feedback, 'Ingresa el número de teléfono para recibir el código SMS.');
      return;
    }

    if (!isValidPhone(phone)) {
      showMessage(feedback, 'El número debe ser válido y escribirse sin lada. Ejemplo: 3123456789');
      return;
    }

    const restore = setLoading(requestCodeButton, 'Enviando código...');
    try {
      await api.requestPasswordReset({ phone });
      showMessage(feedback, 'Código SMS enviado. Revisa tu teléfono e ingresa el código aquí.', 'success');
      showStepTwo();
    } catch (error) {
      showMessage(feedback, error.message);
    } finally {
      restore();
    }
  });

  togglePasswordButton?.addEventListener('click', togglePasswordVisibility);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage(feedback);

    const phone = normalizePhone(String(phoneInput?.value || '').trim());
    const code = String(codeInput?.value || '').trim();
    const newPassword = String(passwordInput?.value || '').trim();

    if (!phone || !code || !newPassword) {
      showMessage(feedback, 'Completa el teléfono, el código SMS y la nueva contraseña.');
      return;
    }

    if (!isValidPhone(phone)) {
      showMessage(feedback, 'El número de teléfono es inválido.');
      return;
    }

    if (newPassword.length < 6) {
      showMessage(feedback, 'La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const restore = setLoading(resetSubmitButton, 'Restableciendo...');
    try {
      await api.resetPassword({ phone, code, newPassword });
      showMessage(feedback, 'Contraseña actualizada. Ahora inicia sesión.', 'success');
      setTimeout(() => window.location.assign('./login.html'), 900);
    } catch (error) {
      showMessage(feedback, error.message);
    } finally {
      restore();
    }
  });
}

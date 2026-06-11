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
    const password = String(form.querySelector('[name="password"]')?.value || '').trim();
    const birthdate = String(form.querySelector('[name="birthdate"]')?.value || '').trim();
    const sex = String(form.querySelector('[name="sex"]')?.value || '').trim();
    const weight = form.querySelector('[name="weight"]')?.value;
    const clinical_observations = String(form.querySelector('[name="clinical_observations"]')?.value || '').trim();

    if (!phone || !name) {
      showMessage(feedback, 'Completa número y nombre.');
      return;
    }

    if (!isValidPhone(phone)) {
      showMessage(feedback, 'El teléfono debe tener 10 dígitos. Ejemplo: 3123456789');
      return;
    }

    if (!password || password.length < 6) {
      showMessage(feedback, 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (!birthdate || !sex || !weight) {
      showMessage(feedback, 'Fecha de nacimiento, sexo y peso son obligatorios');
      return;
    }

    const restore = setLoading(submitButton, 'Creando cuenta...');
    try {
      await api.register({ phone, name, password, birthdate, sex, weight, clinical_observations });
      window.location.assign('./login.html');
    } catch (error) {
      showMessage(feedback, error.message);
    } finally {
      restore();
    }
  });
}

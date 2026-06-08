import { api } from './api-client.js';
import { clearMessage, initMobileNavToggle, setLoading, showMessage } from './ui-utils.js';
import { normalizePhone, isValidPhone } from './app-config.js';

let isAdminSession = false;

async function configurePageForSession() {
  try {
    const payload = await api.me();
    const historyLink = document.getElementById('history-link');
    const adminFields = document.getElementById('admin-user-fields');
    const adminHelp = document.getElementById('admin-appointment-help');
    if (historyLink && payload?.role === 'admin') {
      historyLink.style.display = 'block';
    }

    if (payload?.role === 'admin') {
      isAdminSession = true;
      if (adminFields) adminFields.classList.remove('d-none');
      if (adminHelp) adminHelp.classList.remove('d-none');
    }
  } catch {
    // No session or invalid token, ignore.
  }
}

configurePageForSession();

const form = document.querySelector('[data-appointment-create-form]');
if (form) {
  const feedback = document.querySelector('[data-create-feedback]');
  const submitButton = form.querySelector('button[type="submit"]');
  const dateInput = form.querySelector('[name="date"]');
  const timeInput = form.querySelector('[name="time"]');

  const userNameInput = document.getElementById('user-name');
  const userPhoneInput = document.getElementById('user-phone');

  if (dateInput) {
    dateInput.min = new Date().toISOString().slice(0, 10);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage(feedback);

    const date = String(dateInput?.value || '').trim();
    const time = String(timeInput?.value || '').trim();
    const description = String(form.querySelector('[name="description"]')?.value || '').trim();

    if (!date || !time) {
      showMessage(feedback, 'La fecha y la hora son obligatorias.');
      return;
    }

    const body = { date, time, description };
    let redirectTarget = './appointments.html';

    if (isAdminSession) {
      const name = String(userNameInput?.value || '').trim();
      const phone = normalizePhone(String(userPhoneInput?.value || '').trim());
      if (!name || !phone) {
        showMessage(feedback, 'Nombre y teléfono del paciente son obligatorios para crear la cita.');
        return;
      }
      if (!isValidPhone(phone)) {
        showMessage(feedback, 'El teléfono debe tener 10 dígitos. Ejemplo: 3123456789');
        return;
      }
      body.name = name;
      body.phone = phone;
      redirectTarget = './admin-appointments.html';
    }

    const restore = setLoading(submitButton, 'Agendando...');
    try {
      if (isAdminSession) {
        await api.adminCreateAppointment(body);
      } else {
        await api.createAppointment(body);
      }
      window.location.assign(redirectTarget);
    } catch (error) {
      showMessage(feedback, error.message);
    } finally {
      restore();
    }
  });
}

// logout button handler (if present)
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try { await api.logout(); } catch (e) { }
    api.clearAuthToken();
    window.location.assign('./index.html');
  });
}

initMobileNavToggle();

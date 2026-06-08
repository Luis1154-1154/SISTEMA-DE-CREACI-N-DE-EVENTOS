import { api } from './api-client.js';
import { clearMessage, initMobileNavToggle, setLoading, showMessage } from './ui-utils.js';

async function loadOptionalSession() {
  try {
    const payload = await api.me();
    const historyLink = document.getElementById('history-link');
    if (historyLink && payload?.role === 'admin') {
      historyLink.style.display = 'block';
    }
  } catch {
    // No session or invalid token, ignore.
  }
}

loadOptionalSession();

const form = document.querySelector('[data-appointment-create-form]');
if (form) {
  const feedback = document.querySelector('[data-create-feedback]');
  const submitButton = form.querySelector('button[type="submit"]');
  const dateInput = form.querySelector('[name="date"]');
  const timeInput = form.querySelector('[name="time"]');

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

    const restore = setLoading(submitButton, 'Agendando...');
    try {
      await api.createAppointment({ date, time, description });
      window.location.assign('./appointments.html');
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

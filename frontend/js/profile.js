import { api, authGuard } from './api-client.js';
import { populateCountryCodeSelect } from './app-config.js';

const profileForm = document.querySelector('[data-profile-form]');
const feedbackEl = document.querySelector('[data-profile-feedback]');
const logoutBtn = document.getElementById('logout-btn');
const countryCodeSelect = document.getElementById('profile-country-code');

if (countryCodeSelect) {
  populateCountryCodeSelect(countryCodeSelect, '+52');
}

function normalizeDateForInput(value) {
  if (!value) return '';
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  try {
    const dt = new Date(value);
    if (isNaN(dt.getTime())) return '';
    return dt.toISOString().slice(0, 10);
  } catch { return ''; }
}

const fields = {
  name: document.getElementById('profile-name'),
  phone: document.getElementById('profile-phone'),
  birthdate: document.getElementById('profile-birthdate'),
  sex: document.getElementById('profile-sex'),
  occupation: document.getElementById('profile-occupation'),
  weight: document.getElementById('profile-weight'),
  allergies: document.getElementById('profile-allergies'),
  blood_type: document.getElementById('profile-blood_type'),
  chronic_conditions: document.getElementById('profile-chronic_conditions'),
};

function showMessage(message, type = 'success') {
  feedbackEl.innerHTML = `<div class="alert alert-${type} py-2">${message}</div>`;
}

async function loadProfile() {
  try {
    const profile = await api.me();
    if (!profile) return;
    Object.entries(fields).forEach(([key, element]) => {
      if (element) {
        if (key === 'birthdate') {
          element.value = normalizeDateForInput(profile[key]);
        } else {
          element.value = profile[key] || '';
        }
      }
    });
    if (countryCodeSelect) {
      countryCodeSelect.value = profile.country_code || '+52';
    }
  } catch (error) {
    showMessage('No se pudo cargar el perfil. Inicia sesión de nuevo.', 'danger');
  }
}

profileForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(profileForm).entries());
  try {
    await api.updateProfile(body);
    showMessage('Perfil actualizado correctamente.');
  } catch (err) {
    showMessage(err?.message || 'Error al guardar el perfil.', 'danger');
  }
});

logoutBtn?.addEventListener('click', async () => {
  await api.logout();
  window.location.href = './login.html';
});

authGuard();
loadProfile();

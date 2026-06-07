const defaultOrigin = (window && window.location && window.location.origin) ? window.location.origin.replace(/\/$/, '') : '';
const resolvedOrigin = defaultOrigin && defaultOrigin !== 'null' ? defaultOrigin : 'http://localhost:3000';

export const APP_CONFIG = {
  apiBaseUrl: 'https://sistema-de-citas-de-consultorio.onrender.com/api',
  adminPhone: '3123170997',
  adminPassword: 'admin',
};

export function normalizePhone(value) {
  return String(value || '')
    .trim()
    .replace(/[\s()-]/g, '');
}

export function isValidPhone(value) {
  const p = normalizePhone(value || '');
  return /^[0-9]{10}$/.test(p);
}

export function isAdminCredentials(phone, password) {
  return normalizePhone(phone) === APP_CONFIG.adminPhone && String(password || '').trim() === APP_CONFIG.adminPassword;
}

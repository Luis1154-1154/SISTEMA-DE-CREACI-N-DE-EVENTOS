const defaultOrigin = (window && window.location && window.location.origin) ? window.location.origin.replace(/\/$/, '') : '';
const resolvedOrigin = defaultOrigin && defaultOrigin !== 'null' ? defaultOrigin : 'http://localhost:3000';

// If the frontend is served from the same origin as the API, use a relative path.
// Otherwise, use the configured Render URL (or fallback to relative).
const currentOrigin = (window && window.location && window.location.origin) || '';
// For local file-based testing, prefer localhost API. On deployed origin the code will use relative '/api'.
const renderApiUrl = 'http://localhost:3000/api';

// Detect if we're on the same Render domain or localhost
const isSameOrigin = currentOrigin && (
  currentOrigin.includes('onrender.com') ||
  currentOrigin.includes('localhost') ||
  currentOrigin.includes('127.0.0.1')
);

export const APP_CONFIG = {
  // Use relative path when on same origin (avoids CORS/cookie issues), otherwise use the full Render URL
  apiBaseUrl: isSameOrigin ? '/api' : renderApiUrl,
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

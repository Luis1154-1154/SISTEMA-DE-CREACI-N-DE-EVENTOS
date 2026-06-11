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

export const COUNTRY_CODES = [
  { value: '+52', label: 'México +52' },
  { value: '+1', label: 'Estados Unidos +1' },
  { value: '+44', label: 'Reino Unido +44' },
  { value: '+34', label: 'España +34' },
  { value: '+33', label: 'Francia +33' },
  { value: '+49', label: 'Alemania +49' },
  { value: '+39', label: 'Italia +39' },
  { value: '+55', label: 'Brasil +55' },
  { value: '+56', label: 'Chile +56' },
  { value: '+57', label: 'Colombia +57' },
  { value: '+51', label: 'Perú +51' },
  { value: '+54', label: 'Argentina +54' },
  { value: '+7', label: 'Rusia +7' },
  { value: '+65', label: 'Singapur +65' },
  { value: '+61', label: 'Australia +61' },
  { value: '+64', label: 'Nueva Zelanda +64' },
  { value: '+81', label: 'Japón +81' },
  { value: '+82', label: 'Corea del Sur +82' },
  { value: '+86', label: 'China +86' },
  { value: '+91', label: 'India +91' },
  { value: '+90', label: 'Turquía +90' },
  { value: '+31', label: 'Países Bajos +31' },
  { value: '+32', label: 'Bélgica +32' },
  { value: '+41', label: 'Suiza +41' },
  { value: '+46', label: 'Suecia +46' },
  { value: '+47', label: 'Noruega +47' },
  { value: '+48', label: 'Polonia +48' },
  { value: '+351', label: 'Portugal +351' },
  { value: '+358', label: 'Finlandia +358' },
  { value: '+420', label: 'Chequia +420' },
  { value: '+234', label: 'Nigeria +234' },
  { value: '+380', label: 'Ucrania +380' },
  { value: '+971', label: 'Emiratos Árabes +971' },
  { value: '+972', label: 'Israel +972' },
  { value: '+216', label: 'Túnez +216' },
];

export function populateCountryCodeSelect(selectElement, defaultValue = '+52') {
  if (!selectElement) return;
  selectElement.innerHTML = COUNTRY_CODES.map((code) => `
    <option value="${code.value}">${code.label}</option>
  `).join('');
  selectElement.value = defaultValue;
}

export function normalizePhone(value) {
  return String(value || '').replace(/\D+/g, '');
}

export function isValidPhone(value) {
  const p = normalizePhone(value || '');
  return /^[0-9]{7,15}$/.test(p);
}

export function isAdminCredentials(phone, password) {
  return normalizePhone(phone) === APP_CONFIG.adminPhone && String(password || '').trim() === APP_CONFIG.adminPassword;
}

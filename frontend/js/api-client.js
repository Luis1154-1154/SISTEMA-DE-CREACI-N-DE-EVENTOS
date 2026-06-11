import { APP_CONFIG } from './app-config.js';

const AUTH_TOKEN_STORAGE_KEY = 'authToken';
let authToken = null;

function loadAuthToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token) {
  authToken = token || null;
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore localStorage failures
  }
}

authToken = loadAuthToken();

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (authToken && !headers.Authorization && !headers.authorization) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${APP_CONFIG.apiBaseUrl}${path}`, {
    credentials: 'omit',
    headers,
    ...options,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (e) {
    // empty body or invalid json
    payload = null;
  }

  if (!response.ok) {
    const message = (payload && (payload.message || payload.error)) || `HTTP ${response.status} - ${response.statusText}` || 'Ocurrió un error de servidor';
    throw new Error(message);
  }

  // If response was successful and no JSON payload, return an empty object
  return payload === null ? {} : payload;
}

export async function authGuard() {
  try {
    await request('/auth/me');
  } catch (error) {
    window.location.href = './login.html';
  }
}

export const api = {
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  requestPasswordReset: (body) => request('/auth/request-password-reset', { method: 'POST', body: JSON.stringify(body) }),
  resetPassword: (body) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),
  updateProfile: (body) => request('/auth/me', { method: 'PUT', body: JSON.stringify(body) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  listUsers: () => request('/usuarios'),
  getScheduleSettings: () => request('/schedule/settings'),
  updateScheduleSettings: (body) => request('/schedule/settings', { method: 'PUT', body: JSON.stringify(body) }),
  listWorkingHours: () => request('/schedule/working_hours'),
  createWorkingHour: (body) => request('/schedule/working_hours', { method: 'POST', body: JSON.stringify(body) }),
  updateWorkingHour: (id, body) => request(`/schedule/working_hours/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteWorkingHour: (id) => request(`/schedule/working_hours/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  listScheduleExceptions: () => request('/schedule/exceptions'),
  createScheduleException: (body) => request('/schedule/exceptions', { method: 'POST', body: JSON.stringify(body) }),
  deleteScheduleException: (id) => request(`/schedule/exceptions/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  getAppointmentsByDate: (date) => request(`/appointments/by-date?date=${encodeURIComponent(date)}`),
  getUsuarioById: (id) => request(`/usuarios/${encodeURIComponent(id)}`),
  updateUserClinicalObservations: (id, body) => request(`/usuarios/${encodeURIComponent(id)}/observations`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteUser: (id) => request(`/usuarios/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  createAppointment: (body) => request('/appointments', { method: 'POST', body: JSON.stringify(body) }),
  cancelAppointment: (id, body) => request(`/appointments/${encodeURIComponent(id)}/cancel`, { method: 'PATCH', body: JSON.stringify(body) }),
  adminCreateAppointment: (body) => request('/admin/appointments', { method: 'POST', body: JSON.stringify(body) }),
  listMyAppointments: () => request('/appointments/active'),
  listMyAppointmentsSelf: () => request('/appointments/self'),
  listMyAppointmentHistory: () => request('/appointments/history'),
  setAuthToken,
  clearAuthToken: () => setAuthToken(null),
  listMyAppointmentHistorySelf: () => request('/appointments/self/history'),
  listAppointmentsByDay: () => request('/admin/appointments'),
  updateAppointment: (id, body) => request(`/admin/appointments/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) }),
  updateAppointmentStatus: (id, body) => request(`/admin/appointments/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteAppointment: (id) => request(`/admin/appointments/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

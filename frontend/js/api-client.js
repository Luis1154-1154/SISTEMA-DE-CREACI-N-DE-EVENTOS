import { APP_CONFIG } from './app-config.js';

async function request(path, options = {}) {
  const response = await fetch(`${APP_CONFIG.apiBaseUrl}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
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

export const api = {
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  resetPassword: (body) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
  listUsers: () => request('/usuarios'),
  updateUserClinicalObservations: (id, body) => request(`/usuarios/${encodeURIComponent(id)}/observations`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteUser: (id) => request(`/usuarios/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  createAppointment: (body) => request('/appointments', { method: 'POST', body: JSON.stringify(body) }),
  cancelAppointment: (id, body) => request(`/appointments/${encodeURIComponent(id)}/cancel`, { method: 'PATCH', body: JSON.stringify(body) }),
  adminCreateAppointment: (body) => request('/admin/appointments', { method: 'POST', body: JSON.stringify(body) }),
  listMyAppointments: () => request('/appointments/active'),
  listMyAppointmentHistory: () => request('/appointments/history'),
  listAppointmentsByDay: () => request('/admin/appointments'),
  updateAppointment: (id, body) => request(`/admin/appointments/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) }),
  updateAppointmentStatus: (id, body) => request(`/admin/appointments/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteAppointment: (id) => request(`/admin/appointments/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

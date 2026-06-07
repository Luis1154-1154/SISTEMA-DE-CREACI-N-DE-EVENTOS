import { api } from './api-client.js';

export async function requireSession(expectedRole) {
  try {
    const payload = await api.me();
    const role = payload?.role || payload?.user?.role;

    if (expectedRole && role !== expectedRole) {
      window.location.assign('./login.html');
      return null;
    }

    return payload;
  } catch {
    window.location.assign('./login.html');
    return null;
  }
}

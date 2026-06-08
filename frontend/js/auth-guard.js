import { api } from './api-client.js';

export async function requireSession(expectedRole) {
  try {
    const payload = await api.me();
    const role = payload?.role || payload?.user?.role;

    // If an expected role is specified AND it's 'admin', only allow exact admin match.
    // For 'user' pages, we accept any authenticated session (user, admin, or no role).
    if (expectedRole) {
      if (expectedRole === 'admin' && role !== 'admin') {
        window.location.assign('./login.html');
        return null;
      }
      // For 'user' or any other non-admin expectedRole, just check authentication exists
      // and do NOT block admin users from accessing user pages.
    }

    return payload;
  } catch {
    window.location.assign('./login.html');
    return null;
  }
}

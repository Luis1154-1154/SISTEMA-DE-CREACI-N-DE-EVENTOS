(function () {
  window.API_BASE_URL = window.API_BASE_URL || (window.location && window.location.hostname
    ? window.location.protocol + '//' + window.location.hostname + ':3000'
    : 'http://localhost:3000');

  window.__CURRENT_USER = window.__CURRENT_USER || null;

  window.apiUrl = function (path) {
    return window.API_BASE_URL.replace(/\/$/, '') + '/' + String(path || '').replace(/^\//, '');
  };

  window.apiFetch = function (path, options) {
    options = options || {};
    options.credentials = options.credentials || 'include';
    return fetch(window.apiUrl(path), options);
  };

  window.getCurrentUser = async function (force) {
    if (!force && window.__CURRENT_USER) return window.__CURRENT_USER;
    try {
      const resp = await window.apiFetch('/api/auth/me');
      if (!resp.ok) {
        window.__CURRENT_USER = null;
        return null;
      }
      const data = await resp.json().catch(() => null);
      window.__CURRENT_USER = data || null;
      return window.__CURRENT_USER;
    } catch (err) {
      window.__CURRENT_USER = null;
      return null;
    }
  };
})();
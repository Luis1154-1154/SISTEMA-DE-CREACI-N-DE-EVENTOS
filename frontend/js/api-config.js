(function () {
  window.API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000';

  window.apiUrl = function (path) {
    return window.API_BASE_URL.replace(/\/$/, '') + '/' + String(path || '').replace(/^\//, '');
  };

  window.apiFetch = function (path, options) {
    return fetch(window.apiUrl(path), options);
  };
})();
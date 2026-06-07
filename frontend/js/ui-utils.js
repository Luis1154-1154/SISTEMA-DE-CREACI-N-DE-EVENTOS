export function showMessage(container, message, type = 'danger') {
  if (!container) return;

  container.innerHTML = '';
  const alert = document.createElement('div');
  alert.className = `alert alert-${type} mb-0`;
  alert.setAttribute('role', 'alert');
  alert.textContent = message;
  container.appendChild(alert);
}

export function clearMessage(container) {
  if (container) {
    container.innerHTML = '';
  }
}

export function setLoading(button, loadingText = 'Procesando...') {
  if (!button) return () => {};
  const originalText = button.innerHTML;
  button.disabled = true;
  button.innerHTML = `<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>${loadingText}`;

  return () => {
    button.disabled = false;
    button.innerHTML = originalText;
  };
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

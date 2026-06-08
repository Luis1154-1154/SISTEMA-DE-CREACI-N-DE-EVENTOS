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

export function showFloatingConfirm(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'floating-dialog-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'floating-dialog';

    const text = document.createElement('p');
    text.textContent = message;

    const buttonRow = document.createElement('div');
    buttonRow.className = 'button-row';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'btn btn-secondary';
    cancelButton.textContent = 'Cancelar';

    const confirmButton = document.createElement('button');
    confirmButton.type = 'button';
    confirmButton.className = 'btn btn-primary';
    confirmButton.textContent = 'Aceptar';

    cancelButton.addEventListener('click', () => {
      document.body.removeChild(overlay);
      resolve(false);
    });

    confirmButton.addEventListener('click', () => {
      document.body.removeChild(overlay);
      resolve(true);
    });

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        document.body.removeChild(overlay);
        resolve(false);
      }
    });

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        document.body.removeChild(overlay);
        document.removeEventListener('keydown', onKeyDown);
        resolve(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);

    buttonRow.appendChild(cancelButton);
    buttonRow.appendChild(confirmButton);
    dialog.appendChild(text);
    dialog.appendChild(buttonRow);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    confirmButton.focus();
  });
}

export function initMobileNavToggle(toggleSelector = '[data-site-nav-toggle]', linksSelector = '[data-site-nav-links]') {
  const toggle = document.querySelector(toggleSelector);
  const links = document.querySelector(linksSelector);
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  links.addEventListener('click', (event) => {
    if (event.target.closest('a') || event.target.closest('button')) {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

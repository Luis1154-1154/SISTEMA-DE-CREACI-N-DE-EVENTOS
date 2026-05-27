(function () {
  const form = document.querySelector('form');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    try {
      const resp = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        alert(data.message || 'Credenciales inválidas');
        return;
      }

      window.__CURRENT_USER = data;
      window.location.href = 'eventos.html';
    } catch (err) {
      alert('Error: ' + err.message);
    }
  });
})();

(function() {
  const form = document.querySelector('form');
  if (!form) return;
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    try {
      // Obtener usuarios desde API y validar credenciales (temporal, sin tokens)
      const resp = await apiFetch('/api/usuarios');
      if (!resp.ok) throw new Error('No se pudo conectar al servidor');
      const users = await resp.json();
      const user = (users || []).find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        alert('Usuario no encontrado. Por favor, regístrate primero.');
        return;
      }

      // Recuperar record completo (incluyendo contrasena) usando GET /api/usuarios/:id
      const fullResp = await apiFetch('/api/usuarios/' + user.id);
      const fullData = fullResp.ok ? await fullResp.json() : null;
      const serverPassword = fullData && fullData.contrasena ? fullData.contrasena : null;
      if (!serverPassword || serverPassword !== password) {
        alert('Contraseña incorrecta.');
        return;
      }

      const resolvedRole = fullData.rol || 'participante';
      localStorage.setItem('currentUserEmail', email);
      localStorage.setItem('userRole', resolvedRole);
      const roleText = resolvedRole === 'administrador' ? 'Administrador' : (resolvedRole === 'organizador' ? 'Organizador' : (resolvedRole === 'invitado' ? 'Invitado' : 'Participante'));
      alert(`Bienvenido ${email}!\nRol: ${roleText}`);
      window.location.href = 'eventos.html';
    } catch (err) {
      alert('Error: ' + err.message);
    }
  });
})();

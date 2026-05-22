(function () {
  const form = document.getElementById('registerForm');
  if (!form) return;
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const requestedRol = document.getElementById('rol').value || 'participante';

    // Validaciones
    if (!fullName || !email || !password || !confirmPassword) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    if (password.length < 8) {
      alert('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    // Asignar el rol solicitado sin restricciones
    const finalRol = requestedRol;

    // Crear usuario vía API en lugar de localStorage
    try {
      const resp = await apiFetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: fullName, email: email, contrasena: password, rol: finalRol })
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const msg = data.error || data.message || 'No se pudo crear el usuario.';
        alert(msg);
        return;
      }

      // guardar sesión mínima en localStorage (token/auth no implementado aún)
      localStorage.setItem('userRole', finalRol);
      localStorage.setItem('currentUserEmail', email);

      const roleText = finalRol === 'administrador' ? 'Administrador' :
        finalRol === 'organizador' ? 'Organizador' :
        finalRol === 'invitado' ? 'Invitado' : 'Participante';
      alert(`¡Registro exitoso!\nBienvenido ${fullName}!\nRol: ${roleText}`);
      window.location.href = 'eventos.html';
    } catch (err) {
      alert('Error de conexión: ' + err.message);
    }
  });
})();

(function () {
  const form = document.getElementById('registerForm');
  if (!form) return;
  form.addEventListener('submit', function (e) {
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

    // guardado en localStorage.users
    const key = 'users_mock_v1';
    let users = JSON.parse(localStorage.getItem(key) || '[]');

    // Evitar duplicados
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      alert('Este correo electrónico ya está registrado.');
      return;
    }

    users.push({
      name: fullName,
      email: email,
      password: password,
      rol: finalRol
    });
    localStorage.setItem(key, JSON.stringify(users));

    // establecimiento de la sesion actual
    localStorage.setItem('userRole', finalRol);
    localStorage.setItem('currentUserEmail', email);

    // mensaje de bienvenida
    const roleText = finalRol === 'administrador' ? 'Administrador' :
      finalRol === 'organizador' ? 'Organizador' :
      finalRol === 'invitado' ? 'Invitado' : 'Participante';
    alert(`¡Registro exitoso!\nBienvenido ${fullName}!\nRol: ${roleText}`);

    // redirección a eventos
    window.location.href = 'eventos.html';
  });
})();

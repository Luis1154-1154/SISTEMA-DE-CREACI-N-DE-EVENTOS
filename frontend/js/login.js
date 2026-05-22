(function() {
  const form = document.querySelector('form');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    // Obtener usuarios registrados y buscar al usuario
    const registeredUsers = JSON.parse(localStorage.getItem('users_mock_v1') || '[]');
    const user = registeredUsers.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      alert('Usuario no encontrado. Por favor, regístrate primero.');
      return;
    }

    // Verificar contraseña
    if (!user.password || user.password !== password) {
      alert('Contraseña incorrecta.');
      return;
    }

    // Verificar si es administrador (lista de admins externa) — admin tiene prioridad
    const isAdmin = window.isUserAdmin && window.isUserAdmin(email);
    const resolvedRole = isAdmin ? 'administrador' : (user.rol || 'participante');

    localStorage.setItem('currentUserEmail', email);
    localStorage.setItem('userRole', resolvedRole);

    // Mostrar mensaje de bienvenida
    const roleText = isAdmin ? 'Administrador' : (user.rol ? (user.rol === 'participante' ? 'Participante' : (user.rol === 'organizador' ? 'Organizador' : (user.rol === 'invitado' ? 'Invitado' : user.rol))) : 'Participante');
    alert(`Bienvenido ${email}!\nRol: ${roleText}`);

    window.location.href = 'eventos.html';
  });
})();

document.addEventListener('DOMContentLoaded', function () {
  // Mostrar información del usuario
  const currentEmail = localStorage.getItem('currentUserEmail');
    const userRoleRaw = localStorage.getItem('userRole');
    const userRole = (userRoleRaw || '').toString().trim().toLowerCase();

  if (!currentEmail) {
    window.location.href = 'inicioDeSesión.html';
    return;
  }

  // Mostrar email y rol
  const userEmailEl = document.getElementById('userEmail');
  const userRoleEl = document.getElementById('userRole');
  if (userEmailEl) userEmailEl.textContent = currentEmail;
  if (userRoleEl) {
    const roleText = userRole === 'administrador' ? 'Administrador 👑' :
      userRole === 'organizador' ? 'Organizador' :
      userRole === 'invitado' ? 'Invitado' : 'Participante';
    userRoleEl.textContent = roleText;
  }

  // Mostrar enlace Crear Evento solo si es organizador o administrador
  const createLink = document.getElementById('createEventLink');
  const createLinkMobile = document.getElementById('createEventMobile');
  const canCreate = (userRole === 'organizador' || userRole === 'administrador');
  if (createLink) {
    if (canCreate) {
      createLink.classList.remove('hidden');
      createLink.classList.add('flex');
    } else {
      // remueve el nodo
      if (createLink.parentNode) createLink.parentNode.removeChild(createLink);
    }
  }
  if (createLinkMobile) {
    if (canCreate) {
      createLinkMobile.classList.remove('hidden');
    } else {
      if (createLinkMobile.parentNode) createLinkMobile.parentNode.removeChild(createLinkMobile);
    }
  }

  // Logout
  window.logout = function () {
    localStorage.removeItem('currentUserEmail');
    localStorage.removeItem('userRole');
    window.location.href = 'inicioDeSesión.html';
  };
});

document.addEventListener('DOMContentLoaded', async function () {
  const user = await window.getCurrentUser().catch(() => null);

  if (!user || !user.email) {
    window.location.href = 'inicioDeSesión.html';
    return;
  }

  const userEmailEl = document.getElementById('userEmail');
  const userRoleEl = document.getElementById('userRole');
  if (userEmailEl) userEmailEl.textContent = user.email;
  if (userRoleEl) {
    const roleText = user.rol === 'administrador' ? 'Administrador 👑' :
      user.rol === 'organizador' ? 'Organizador' :
      user.rol === 'invitado' ? 'Invitado' : 'Participante';
    userRoleEl.textContent = roleText;
  }

  const createLink = document.getElementById('createEventLink');
  const createLinkMobile = document.getElementById('createEventMobile');
  const canCreate = (user.rol === 'organizador' || user.rol === 'administrador');
  if (createLink) {
    if (canCreate) {
      createLink.classList.remove('hidden');
      createLink.classList.add('flex');
    } else if (createLink.parentNode) {
      createLink.parentNode.removeChild(createLink);
    }
  }
  if (createLinkMobile) {
    if (canCreate) {
      createLinkMobile.classList.remove('hidden');
    } else if (createLinkMobile.parentNode) {
      createLinkMobile.parentNode.removeChild(createLinkMobile);
    }
  }

  window.logout = async function () {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      // ignore
    }
    window.__CURRENT_USER = null;
    window.location.href = 'inicioDeSesión.html';
  };
});

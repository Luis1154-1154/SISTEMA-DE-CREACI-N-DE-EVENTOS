(function () {
  function createCard(event) {
    const card = document.createElement('div');
    card.className = 'bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex flex-col group hover:shadow-sm transition-shadow';

    const imgWrap = document.createElement('div');
    imgWrap.className = 'h-48 w-full relative bg-surface-variant overflow-hidden';
    const img = document.createElement('img');
    img.className = 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-300';
    img.alt = event.nombre;
    img.src = 'https://picsum.photos/seed/' + encodeURIComponent(event.nombre) + '/800/400';
    imgWrap.appendChild(img);

    const badge = document.createElement('div');
    badge.className = 'absolute top-4 right-4 px-2 py-1 rounded font-label-sm text-label-sm shadow-sm border border-outline-variant';
    // map status to colors
    const status = (event.estatus || 'activo').toLowerCase();
    badge.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    if (status === 'activo') {
      badge.style.backgroundColor = '#d1e7dd';
      badge.style.color = '#0f5132';
      badge.style.borderColor = '#bcd7c6';
    } else if (status === 'cancelado') {
      badge.style.backgroundColor = '#f8d7da';
      badge.style.color = '#721c24';
      badge.style.borderColor = '#f1b0b7';
    } else if (status === 'finalizado') {
      badge.style.backgroundColor = '#e9ecef';
      badge.style.color = '#495057';
      badge.style.borderColor = '#d3d7da';
    } else {
      badge.style.backgroundColor = '#fff3cd';
      badge.style.color = '#664d03';
      badge.style.borderColor = '#ffeeba';
    }
    imgWrap.appendChild(badge);

    const body = document.createElement('div');
    body.className = 'p-4 flex-grow flex flex-col';

    const title = document.createElement('h3');
    title.className = 'font-headline-sm text-headline-sm text-on-surface mb-2';
    title.textContent = event.nombre;

    const dateRow = document.createElement('div');
    dateRow.className = 'flex items-center gap-2 text-secondary font-body-sm text-body-sm mb-2';
    dateRow.innerHTML = '<span class="material-symbols-outlined text-[16px]">calendar_month</span><span>' + (event.fechaTexto || event.fecha) + '</span>';

    const placeRow = document.createElement('div');
    placeRow.className = 'flex items-center gap-2 text-secondary font-body-sm text-body-sm mb-4';
    placeRow.innerHTML = '<span class="material-symbols-outlined text-[16px]">location_on</span><span>' + (event.lugar || '') + '</span>';

    // sección (categoría / sección)
    const sectionRow = document.createElement('div');
    sectionRow.className = 'flex items-center gap-2 text-secondary font-body-sm text-body-sm mb-2';
    sectionRow.innerHTML = '<span class="material-symbols-outlined text-[16px]">category</span><span>' + (event.seccion || '') + '</span>';

    const desc = document.createElement('p');
    desc.className = 'text-on-surface-variant mb-4';
    desc.textContent = event.descripcion || '';

    body.appendChild(title);
    body.appendChild(dateRow);
    body.appendChild(sectionRow);
    body.appendChild(placeRow);
    body.appendChild(desc);

    const footer = document.createElement('div');
    footer.className = 'mt-auto pt-4 border-t border-surface-variant flex flex-col gap-2';

    const org = document.createElement('div');
    org.className = 'text-secondary font-body-sm text-body-sm';
    org.textContent = 'Organizador: ' + (event.organizador || '—');

    footer.appendChild(org);

    // obtener usuario actual y rol
    const currentEmail = localStorage.getItem('currentUserEmail') || null;
    const currentUserRole = localStorage.getItem('userRole') || null;
    const usersList = JSON.parse(localStorage.getItem('users_mock_v1') || '[]');
    const currentUserName = (usersList.find(u => u.email && currentEmail && u.email.toLowerCase() === currentEmail.toLowerCase()) || {}).name || null;

    // mostrar lista de participantes si el usuario es el organizador del evento
    const isOrganizer = currentEmail && event.organizador && (
      (event.organizador.toLowerCase && currentEmail.toLowerCase && event.organizador.toLowerCase().includes(currentEmail.toLowerCase())) ||
      (currentUserName && event.organizador.toLowerCase && event.organizador.toLowerCase().includes(currentUserName.toLowerCase()))
    );

    if (isOrganizer) {
      const participantsTitle = document.createElement('div');
      participantsTitle.className = 'font-label-sm text-label-sm text-on-surface mt-2';
      participantsTitle.textContent = 'Participantes:';
      footer.appendChild(participantsTitle);

      const participantsList = document.createElement('div');
      participantsList.className = 'participants-list flex flex-col gap-1';
      const inscritos = Array.isArray(event.inscritos) ? event.inscritos : [];
      const unique = [...new Set(inscritos)];
      if (unique.length === 0) {
        const none = document.createElement('div');
        none.className = 'text-body-sm text-secondary';
        none.textContent = 'No hay participantes aún.';
        participantsList.appendChild(none);
      } else {
        unique.forEach(p => {
          const li = document.createElement('div');
          li.className = 'text-body-sm text-secondary';
          li.textContent = p;
          participantsList.appendChild(li);
        });
      }
      footer.appendChild(participantsList);
    }

    // botón Eliminar visible solo para administradores
    if (currentUserRole === 'administrador') {
      const del = document.createElement('button');
      del.className = 'px-3 py-1 bg-red-600 text-white rounded mt-2 self-end text-sm';
      del.textContent = 'Eliminar evento';
      del.onclick = function () {
        if (!confirm('¿Estás seguro de eliminar este evento?')) return;
        // eliminar de eventos creados por el usuario si existe allí
        const created = JSON.parse(localStorage.getItem('user_created_events') || '[]');
        const idx = created.findIndex(e => e.id === event.id);
        if (idx > -1) {
          created.splice(idx, 1);
          localStorage.setItem('user_created_events', JSON.stringify(created));
        } else {
          // marcar como eliminado globalmente
          const deleted = JSON.parse(localStorage.getItem('deleted_event_ids') || '[]');
          if (!deleted.includes(event.id)) deleted.push(event.id);
          localStorage.setItem('deleted_event_ids', JSON.stringify(deleted));
        }
        // remover tarjeta del DOM
        if (card && card.parentNode) card.parentNode.removeChild(card);
      };
      footer.appendChild(del);
    }

    // botón Unirse / estado persistente
    const btn = document.createElement('button');
    btn.className = 'px-4 py-2 bg-primary text-on-primary rounded mt-2 w-full';
    const key = 'inscripciones_event_' + event.id;
    let arr = JSON.parse(localStorage.getItem(key) || '[]');
    const currentUser = localStorage.getItem('currentUserEmail') || null;
    const isJoined = currentUser && arr.includes(currentUser);
    btn.textContent = isJoined ? 'Unid@' : 'Unirse';
    btn.disabled = !!isJoined;
    btn.onclick = function () {
      let arrLocal = JSON.parse(localStorage.getItem(key) || '[]');
      const current = localStorage.getItem('currentUserEmail') || 'Usuario';
      if (!arrLocal.includes(current)) arrLocal.push(current);
      localStorage.setItem(key, JSON.stringify(arrLocal));
      btn.textContent = 'Unid@';
      btn.disabled = true;
      // optionally re-render participant list
      const participantsList = footer.querySelector('.participants-list');
      if (participantsList) {
        participantsList.innerHTML = '';
        JSON.parse(localStorage.getItem(key) || '[]').forEach(p => {
          const li = document.createElement('div');
          li.className = 'text-body-sm text-secondary';
          li.textContent = p;
          participantsList.appendChild(li);
        });
      }
    };
    footer.appendChild(btn);

    body.appendChild(footer);

    card.appendChild(imgWrap);
    card.appendChild(body);
    return card;
  }

  function render(events) {
    const container = document.getElementById('eventsContainer');
    if (!container) return;
    container.innerHTML = '';
    // ocultar eventos borrados (persistente)
    const deleted = JSON.parse(localStorage.getItem('deleted_event_ids') || '[]');
    events.forEach(ev => {
      if (deleted.includes(ev.id)) return; // skip deleted
      // merge localStorage inscripciones for participant counts when showing avatars
      const key = 'inscripciones_event_' + ev.id;
      const localIns = JSON.parse(localStorage.getItem(key) || '[]');
      const merged = Object.assign({}, ev);
      merged.inscritos = (ev.inscritos || []).concat(localIns);
      const card = createCard(merged);
      container.appendChild(card);
    });
  }

  // expose for manual trigger
  window.EVENTS_RENDER = {
    render: render
  };

  // auto-run if MOCK_EVENTS present
  document.addEventListener('DOMContentLoaded', function () {
    // Combinar eventos mock con eventos creados por usuario
    const mockEvents = window.MOCK_EVENTS || [];
    const userCreatedEvents = JSON.parse(localStorage.getItem('user_created_events') || '[]');
    const allEvents = [...mockEvents, ...userCreatedEvents];
    render(allEvents);
  });

})();

(function () {
  let currentUser = null;
  function formatFechaEvento(fecha) {
    if (!fecha) return '';
    let parsed = null;
    if (fecha instanceof Date) {
      parsed = fecha;
    } else if (typeof fecha === 'string') {
      const raw = fecha.trim();
      if (!raw) return '';
      parsed = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(raw + 'T00:00:00') : new Date(raw);
    } else {
      parsed = new Date(fecha);
    }

    if (!parsed || Number.isNaN(parsed.getTime())) {
      return typeof fecha === 'string' ? fecha : '';
    }

    return parsed.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function normalizeEvent(event) {
    const fechaTexto = event.fechaTexto || formatFechaEvento(event.fecha);

    return {
      ...event,
      lugar: event.lugar || event.ubicacion || '',
      seccion: event.seccion || event.tipo || '',
      fechaTexto,
      inscritos: Array.isArray(event.inscritos) ? event.inscritos : []
    };
  }

  async function fetchEvents() {
    try {
      const response = await apiFetch('/api/eventos');
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data.map(normalizeEvent) : [];
    } catch (error) {
      return [];
    }
  }

  async function fetchInscritos(eventId) {
    try {
      const resp = await apiFetch(`/api/eventos/${eventId}/inscripciones`);
      if (!resp.ok) return [];
      const rows = await resp.json();
      // map to display names/emails
      return Array.isArray(rows) ? rows.map(r => r.participante_email || r.participante_nombre || r.email || r.participante_nombre) : [];
    } catch (err) {
      return [];
    }
  }

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
    // colores de status
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

    const capacityRow = document.createElement('div');
    capacityRow.className = 'flex items-center gap-2 text-secondary font-body-sm text-body-sm mb-4';
    capacityRow.innerHTML = '<span class="material-symbols-outlined text-[16px]">group</span><span>Capacidad: ' + (event.capacidad ?? event.invitados ?? 'N/D') + '</span>';

    // sección/categoria
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
    body.appendChild(capacityRow);
    body.appendChild(desc);

    const footer = document.createElement('div');
    footer.className = 'mt-auto pt-4 border-t border-surface-variant flex flex-col gap-2';

    const org = document.createElement('div');
    org.className = 'text-secondary font-body-sm text-body-sm';
    org.textContent = 'Organizador: ' + (event.organizador || '—');

    footer.appendChild(org);

    // obtener usuario actual y rol desde el servidor
    const currentEmail = currentUser ? currentUser.email : null;
    const currentUserRole = currentUser ? currentUser.rol : null;

    // mostrar lista de participantes si el usuario es el organizador del evento
    const isOrganizer = currentEmail && event.organizador && (
      event.organizador.toLowerCase && currentEmail.toLowerCase && event.organizador.toLowerCase().includes(currentEmail.toLowerCase())
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
        apiFetch('/api/eventos/' + event.id, { method: 'DELETE' })
          .then((response) => {
            if (!response.ok) {
              throw new Error('No se pudo eliminar el evento');
            }
            if (card && card.parentNode) card.parentNode.removeChild(card);
          })
          .catch((error) => {
            alert(error.message);
          });
      };
      footer.appendChild(del);
    }

    // botón Unirse / estado persistente (ahora persistimos en la API)
    const btn = document.createElement('button');
    btn.className = 'px-4 py-2 bg-primary text-on-primary rounded mt-2 w-full';
    let arr = [];
    btn.textContent = 'Unirse';
    btn.disabled = false;
    // initialize joined state by querying inscripciones
    (async () => {
      const inscritos = await fetchInscritos(event.id);
      arr = Array.isArray(inscritos) ? inscritos : [];
      const isJoined = currentUser && currentUser.email && arr.some(a => a && a.toLowerCase && a.toLowerCase() === currentUser.email.toLowerCase());
      btn.textContent = isJoined ? 'Unid@' : 'Unirse';
      btn.disabled = !!isJoined;
      // update participants list if visible
      const participantsList = footer.querySelector('.participants-list');
      if (participantsList) {
        participantsList.innerHTML = '';
        const unique = [...new Set(arr)];
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
      }
    })();

    btn.onclick = async function () {
      if (!currentUser) { alert('Debes iniciar sesión para inscribirte.'); window.location.href = 'inicioDeSesión.html'; return; }
      btn.disabled = true;
      btn.textContent = 'Procesando...';
      try {
        // obtener participantes existentes y buscar por email
        const pResp = await apiFetch('/api/participantes');
        let participanteId = null;
        if (pResp.ok) {
          const participantes = await pResp.json();
          const found = (participantes || []).find(p => p.email && currentUser && p.email.toLowerCase() === currentUser.email.toLowerCase());
          if (found) participanteId = found.id;
        }
        // si no existe participante, crearlo
        if (!participanteId) {
          const createResp = await apiFetch('/api/participantes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: currentUser.email, email: currentUser.email }) });
          if (!createResp.ok) throw new Error('No se pudo crear participante');
          const createData = await createResp.json();
          participanteId = createData.id;
        }

        // crear inscripcion
        const insResp = await apiFetch('/api/inscripciones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ evento_id: event.id, participante_id: participanteId }) });
        if (!insResp.ok) {
          const err = await insResp.json();
          throw new Error(err.message || 'No se pudo crear la inscripción');
        }

        // actualizar UI
        const addedName = currentUser.email;
        arr.push(addedName);
        btn.textContent = 'Unid@';
        btn.disabled = true;
        const participantsList = footer.querySelector('.participants-list');
        if (participantsList) {
          participantsList.innerHTML = '';
          const unique = [...new Set(arr)];
          unique.forEach(p => {
            const li = document.createElement('div');
            li.className = 'text-body-sm text-secondary';
            li.textContent = p;
            participantsList.appendChild(li);
          });
        }
      } catch (err) {
        alert('Error: ' + err.message);
        btn.textContent = 'Unirse';
        btn.disabled = false;
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
    if (!Array.isArray(events) || events.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'col-span-full text-center text-secondary py-10 border border-outline-variant rounded-lg bg-surface-container-lowest';
      empty.textContent = 'No hay eventos aún. Crea uno para comenzar.';
      container.appendChild(empty);
      return;
    }
    events.forEach(ev => {
      const card = createCard(ev);
      container.appendChild(card);
    });
  }

  // trigger
  window.EVENTS_RENDER = {
    render: render
  };

  document.addEventListener('DOMContentLoaded', function () {
    window.getCurrentUser().then((user) => {
      currentUser = user || null;
      if (!currentUser) {
        window.location.href = 'inicioDeSesión.html';
        return;
      }
      fetchEvents().then((apiEvents) => {
        render(apiEvents);
      });
    });
  });

})();

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
    badge.className = 'absolute top-4 right-4 bg-surface-container-lowest px-2 py-1 rounded text-primary font-label-sm text-label-sm shadow-sm border border-outline-variant';
    badge.textContent = event.estatus || 'Por venir';
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

    // siempre mostrar botón Unirse
    const btn = document.createElement('button');
    btn.className = 'px-4 py-2 bg-primary text-on-primary rounded mt-2 w-full';
    btn.textContent = 'Unirse';
    btn.onclick = function () {
      const key = 'inscripciones_event_' + event.id;
      let arr = JSON.parse(localStorage.getItem(key) || '[]');
      const currentUser = localStorage.getItem('currentUserEmail') || 'Usuario';
      // avoid duplicates
      if (!arr.includes(currentUser)) arr.push(currentUser);
      localStorage.setItem(key, JSON.stringify(arr));
      btn.textContent = 'Unido';
      btn.disabled = true;
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
    events.forEach(ev => {
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
    const events = window.MOCK_EVENTS || [];
    render(events);
  });

})();

import { api } from './api-client.js';
import { requireSession } from './auth-guard.js';
import { clearMessage, escapeHtml, setLoading, showMessage } from './ui-utils.js';
import { normalizePhone, isValidPhone } from './app-config.js';

const adminPageMode = String(document.body?.dataset?.adminPage || 'active').toLowerCase();

function formatDateTime(dateStr, timeStr) {
  try {
    const dt = dateStr && timeStr ? new Date(`${dateStr}T${timeStr}`) : new Date(dateStr || timeStr || Date.now());
    return {
      date: new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric' }).format(dt),
      time: new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(dt)
    };
  } catch (e) {
    return { date: dateStr || '', time: timeStr || '' };
  }
}

function renderAppointmentItem(appointment) {
  const formatted = formatDateTime(appointment.date, appointment.time);
  const id = escapeHtml(appointment.id || '');
  return `
    <div class="list-group-item d-flex justify-content-between align-items-start">
      <div>
        <div class="d-flex align-items-center gap-3">
          <div class="fw-bold">${escapeHtml(formatted.date)}</div>
          <div class="badge bg-secondary text-white">${escapeHtml(formatted.time)}</div>
          <div class="ms-2"><span class="small text-muted">${escapeHtml(appointment.name || '')} • ${escapeHtml(appointment.phone || '')}</span></div>
        </div>
        <div class="mt-2">${escapeHtml(appointment.description || '')}</div>
        <div class="mt-2 small">Status: <strong>${escapeHtml(appointment.status || 'pending')}</strong></div>
      </div>
      <div class="text-end">
        <div class="d-flex flex-column align-items-end gap-2">
          <button class="btn btn-sm btn-outline-danger" data-delete-appointment="${id}">Eliminar</button>
          ${appointment.status === 'pending' ? `<button class="btn btn-sm btn-outline-success" data-activate-appointment="${id}">Activar</button>` : ''}
          ${appointment.status === 'pending' ? `<button class="btn btn-sm btn-outline-primary" data-edit-appointment="${id}">Editar</button>` : ''}
          <div class="mt-2"><button class="btn btn-sm btn-outline-secondary" data-toggle-cancel="${id}">Cancelar</button></div>
        </div>

        <form class="cancel-panel d-none mt-3" data-cancel-form="${id}">
          <div class="alert alert-warning py-2 small mb-3">Procura cancelar con anticipación para no afectar la agenda.</div>
          <div data-cancel-feedback class="mb-2"></div>
          <label class="form-label" for="cancel-reason-${id}">Motivo de cancelación</label>
          <textarea class="form-control" id="cancel-reason-${id}" name="reason" rows="3" placeholder="Escribe por qué cancelas la cita" required></textarea>
          <div class="d-flex justify-content-end gap-2 mt-3">
            <button class="btn btn-outline-secondary btn-sm" type="button" data-cancel-hide="${id}">Cerrar</button>
            <button class="btn btn-danger btn-sm" type="submit">Confirmar cancelación</button>
          </div>
        </form>

        <form class="edit-panel d-none mt-3" data-edit-form="${id}">
          <div class="row g-2 align-items-end">
            <div class="col-6">
              <label class="form-label small">Fecha</label>
              <input class="form-control form-control-sm" name="date" type="date" value="${escapeHtml(appointment.date || '')}" required />
            </div>
            <div class="col-6">
              <label class="form-label small">Hora</label>
              <input class="form-control form-control-sm" name="time" type="time" step="60" value="${escapeHtml(appointment.time || '')}" required />
            </div>
            <div class="col-12 text-end mt-2">
              <button class="btn btn-sm btn-primary" type="submit">Guardar</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;
}

async function wireAppointmentInteractions(container, feedback, refresh) {
  container.addEventListener('click', async (ev) => {
    const deleteBtn = ev.target.closest('[data-delete-appointment]');
    if (deleteBtn) {
      const id = deleteBtn.getAttribute('data-delete-appointment');
      if (!id) return;
      if (!confirm('Eliminar esta cita?')) return;
      try {
        await api.deleteAppointment(id);
        showMessage(feedback, 'Cita eliminada.', 'success');
        if (refresh) await refresh();
      } catch (err) {
        showMessage(feedback, err.message);
      }
      return;
    }

    const toggle = ev.target.closest('[data-toggle-cancel]');
    if (toggle) {
      const id = toggle.getAttribute('data-toggle-cancel');
      const panel = container.querySelector(`[data-cancel-form="${CSS.escape(id)}"]`);
      if (panel) panel.classList.toggle('d-none');
    }

    const activateBtn = ev.target.closest('[data-activate-appointment]');
    if (activateBtn) {
      const id = activateBtn.getAttribute('data-activate-appointment');
      if (!id) return;
      if (!confirm('Marcar esta cita como atendida?')) return;
      try {
        await api.updateAppointmentStatus(id, { status: 'attended' });
        showMessage(feedback, 'Cita marcada como atendida', 'success');
        if (refresh) await refresh();
      } catch (err) {
        showMessage(feedback, err.message);
      }
      return;
    }

    const editBtn = ev.target.closest('[data-edit-appointment]');
    if (editBtn) {
      const id = editBtn.getAttribute('data-edit-appointment');
      const panel = container.querySelector(`[data-edit-form="${CSS.escape(id)}"]`);
      if (panel) panel.classList.toggle('d-none');
      return;
    }
  });

  container.querySelectorAll('[data-cancel-form]').forEach((form) => {
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const id = form.getAttribute('data-cancel-form');
      const reason = String(form.querySelector('[name="reason"]')?.value || '').trim();
      const submit = form.querySelector('button[type="submit"]');
      const restore = setLoading(submit, 'Cancelando...');
      try {
        await api.cancelAppointment(id, { reason });
        showMessage(feedback, 'Cita cancelada.', 'success');
        if (refresh) await refresh();
      } catch (err) {
        showMessage(form.querySelector('[data-cancel-feedback]'), err.message);
      } finally { restore(); }
    });
  });

  container.querySelectorAll('[data-edit-form]').forEach((form) => {
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const id = form.getAttribute('data-edit-form');
      const date = String(form.querySelector('[name="date"]')?.value || '').trim();
      const time = String(form.querySelector('[name="time"]')?.value || '').trim();
      const submit = form.querySelector('button[type="submit"]');
      const restore = setLoading(submit, 'Guardando...');
      try {
        if (!date || !time) throw new Error('Fecha y hora son obligatorias');
        await api.updateAppointment(id, { date, time });
        showMessage(feedback, 'Cita actualizada', 'success');
        if (refresh) await refresh();
      } catch (err) {
        showMessage(form, err.message);
      } finally { restore(); }
    });
  });
}

async function loadAdminAppointments(mode = adminPageMode) {
  const feedback = document.querySelector('[data-admin-feedback]');
  const container = document.querySelector('[data-admin-appointments-list]');
  if (!container) return;
  clearMessage(feedback);
  try {
    const me = await api.me();
    let payload;
    if (String(me?.role || '').toLowerCase() === 'admin') {
      payload = await api.listAppointmentsByDay();
      // payload may be array or {data:[]}
      const appointments = Array.isArray(payload?.data) ? payload.data : payload;
      const list = Array.isArray(appointments) ? appointments : [];
      // filter by mode: 'history' shows only attended or canceled; otherwise show pending
      const filtered = mode === 'history' ? list.filter(a => String(a.status || '').toLowerCase() !== 'pending') : list.filter(a => String(a.status || '').toLowerCase() === 'pending');
      container.innerHTML = (filtered.length ? filtered.map(renderAppointmentItem).join('') : '<div class="text-center text-muted py-4">No hay citas.</div>');
      await wireAppointmentInteractions(container, feedback, () => loadAdminAppointments(mode));
      return;
    }

    // non-admin: show user's appointments
    payload = await api.listMyAppointments();
    const appointments = Array.isArray(payload?.data) ? payload.data : payload;
    container.innerHTML = (appointments.length ? appointments.map(renderAppointmentItem).join('') : '<div class="text-center text-muted py-4">No tienes citas pendientes.</div>');
    await wireAppointmentInteractions(container, feedback, () => loadAdminAppointments(mode));
  } catch (err) {
    showMessage(feedback, err.message);
  }
}

async function loadClinicalRecords() {
  const feedback = document.querySelector('[data-records-feedback]');
  const usersContainer = document.querySelector('[data-records-users]');
  const detailContainer = document.querySelector('[data-records-detail]');
  if (!usersContainer || !detailContainer) return;
  clearMessage(feedback);
  try {
    const usersPayload = await api.listUsers();
    const users = Array.isArray(usersPayload?.data) ? usersPayload.data : usersPayload;
    if (!Array.isArray(users) || !users.length) {
      usersContainer.innerHTML = '<div class="text-muted p-3">No hay usuarios.</div>';
      detailContainer.innerHTML = '<div class="text-muted p-3">Selecciona un usuario para ver su expediente.</div>';
      return;
    }
    usersContainer.innerHTML = users.map(u => `<button class="list-group-item list-group-item-action" data-select-user="${escapeHtml(u.id)}">${escapeHtml(u.name)}<div class="small text-muted">${escapeHtml(u.phone)}</div></button>`).join('');
    usersContainer.querySelectorAll('[data-select-user]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-select-user');
        try {
          const user = await api.getUsuarioById(id);
          const userAppointments = (await api.listAppointmentsByDay()) || [];
          const appointments = Array.isArray(userAppointments?.data) ? userAppointments.data : userAppointments;
          const filtered = (Array.isArray(appointments) ? appointments : []).filter(a => String(a.user_id) === String(id));
          detailContainer.innerHTML = `
            <h5>${escapeHtml(user.name)}</h5>
            <div class="small text-muted mb-2">${escapeHtml(user.phone)}</div>
            <div>${filtered.length ? filtered.map(renderAppointmentItem).join('') : '<div class="text-muted">Sin citas</div>'}</div>
          `;
        } catch (err) {
          showMessage(feedback, err.message);
        }
      });
    });
  } catch (err) {
    showMessage(feedback, err.message);
  }
}

// Initialize
const appointmentsContainer = document.querySelector('[data-admin-appointments-list]');
if (appointmentsContainer) loadAdminAppointments(adminPageMode);
const recordsContainer = document.querySelector('[data-records-users]');
if (recordsContainer) loadClinicalRecords();

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try { await api.logout(); } catch {};
    api.clearAuthToken?.();
    window.location.assign('./index.html');
  });
}

const adminForm = document.getElementById('admin-create-form');
if (adminForm) {
  adminForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const formData = new FormData(adminForm);
    const phone = normalizePhone(String(formData.get('phone') || '').trim());
    const payload = {
      name: String(formData.get('name') || '').trim(),
      phone: phone || null,
      date: String(formData.get('date') || '').trim(),
      time: String(formData.get('time') || '').trim(),
      description: String(formData.get('description') || '').trim(),
    };
    const feedback = document.querySelector('[data-admin-feedback]');
    try {
      if (!payload.phone || !payload.date || !payload.time) return showMessage(feedback, 'Teléfono, fecha y hora son obligatorios.');
      if (!isValidPhone(payload.phone)) return showMessage(feedback, 'Teléfono inválido.');
      await api.adminCreateAppointment(payload);
      adminForm.reset();
      await loadAdminAppointments(adminPageMode);
      showMessage(feedback, 'Cita creada correctamente', 'success');
    } catch (err) { showMessage(feedback, err.message); }
  });
}

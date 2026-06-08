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
        <div class="fw-bold">${escapeHtml(formatted.date)} ${escapeHtml(formatted.time)}</div>
        <div class="small text-muted">${escapeHtml(appointment.name || '')} • ${escapeHtml(appointment.phone || '')}</div>
        <div class="mt-2">${escapeHtml(appointment.description || '')}</div>
      </div>
      <div class="text-end">
        <button class="btn btn-sm btn-outline-danger" data-delete-appointment="${id}">Eliminar</button>
        <div class="mt-2"><button class="btn btn-sm btn-outline-secondary" data-toggle-cancel="${id}">Cancelar</button></div>
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
      container.innerHTML = (appointments.length ? appointments.map(renderAppointmentItem).join('') : '<div class="text-center text-muted py-4">No hay citas.</div>');
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

import { api, authGuard } from './api-client.js';
import { clearMessage, escapeHtml, setLoading, showMessage } from './ui-utils.js';
import { populateCountryCodeSelect } from './app-config.js';
import { requireSession } from './auth-guard.js';

const usersContainer = document.querySelector('[data-agenda-users]');
const detailContainer = document.querySelector('[data-agenda-detail]');
const feedbackEl = document.querySelector('[data-agenda-feedback]');
const logoutBtn = document.getElementById('logout-btn');

let allUsers = [];
let allAppointments = [];

async function loadAgendaData() {
  if (!usersContainer || !detailContainer) return;
  clearMessage(feedbackEl);
  usersContainer.innerHTML = '<div class="text-muted p-3">Cargando usuari@s...</div>';
  detailContainer.innerHTML = '<div class="text-center text-muted py-5">Cargando...</div>';

  try {
    const [usersPayload, appointmentsPayload] = await Promise.all([
      api.listUsers(),
      api.listAppointmentsByDay(),
    ]);

    allUsers = Array.isArray(usersPayload?.data) ? usersPayload.data : (Array.isArray(usersPayload) ? usersPayload : []);
    allAppointments = Array.isArray(appointmentsPayload?.data) ? appointmentsPayload.data : (Array.isArray(appointmentsPayload) ? appointmentsPayload : []);

    if (!allUsers.length) {
      usersContainer.innerHTML = '<div class="text-muted p-3">No hay usuari@s registrad@s.</div>';
      detailContainer.innerHTML = '<div class="text-center text-muted py-5">Selecciona un@ usuari@ para ver su agenda.</div>';
      return;
    }

    renderUserList();

    // Select first user by default
    showUserDetail(allUsers[0].id);
  } catch (err) {
    showMessage(feedbackEl, err.message, 'danger');
  }
}

function renderUserList() {
  usersContainer.innerHTML = allUsers.map(u => `
    <button class="list-group-item list-group-item-action agenda-user-item" data-user-id="${escapeHtml(u.id)}">
      <div class="fw-semibold">${escapeHtml(u.name)}</div>
      <div class="small text-muted">${escapeHtml(u.phone)}</div>
    </button>
  `).join('');

  usersContainer.querySelectorAll('.agenda-user-item').forEach(btn => {
    btn.addEventListener('click', () => {
      usersContainer.querySelectorAll('.agenda-user-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      showUserDetail(btn.getAttribute('data-user-id'));
    });
  });
}

function showUserDetail(userId) {
  const user = allUsers.find(u => String(u.id) === String(userId));
  if (!user) return;

  const userAppointments = allAppointments.filter(a => String(a.user_id) === String(userId));
  const activeAppointments = userAppointments.filter(a => String(a.status || '').toLowerCase() === 'pending');
  const pastAppointments = userAppointments.filter(a => String(a.status || '').toLowerCase() !== 'pending');

  detailContainer.innerHTML = `
    <div class="d-flex justify-content-between align-items-start mb-3">
      <div>
        <h5 class="mb-1">${escapeHtml(user.name)}</h5>
        <div class="small text-muted">${escapeHtml(user.phone)}</div>
        <div class="small text-muted mt-1">${user.birthdate ? 'Nac.: ' + escapeHtml(user.birthdate) : ''} ${user.sex ? '• Sexo: ' + escapeHtml(user.sex) : ''}</div>
      </div>
    </div>

    <div class="mb-4">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h6 class="mb-0">Crear nueva cita</h6>
        <button class="btn btn-sm btn-primary" id="agenda-create-toggle">Agregar cita</button>
      </div>
      <form id="agenda-create-form" class="row g-2 d-none">
        <div class="col-5">
          <label class="form-label small">Fecha</label>
          <input class="form-control form-control-sm" name="date" type="date" required />
        </div>
        <div class="col-4">
          <label class="form-label small">Hora</label>
          <input class="form-control form-control-sm" name="time" type="time" step="60" required />
        </div>
        <div class="col-3 d-flex align-items-end">
          <button class="btn btn-sm btn-success w-100" type="submit">Crear</button>
        </div>
        <div class="col-12">
          <label class="form-label small">Descripción</label>
          <input class="form-control form-control-sm" name="description" placeholder="Opcional" />
        </div>
        <div data-agenda-create-feedback class="col-12"></div>
      </form>
    </div>

    <h6 class="mb-3">Citas activas (${activeAppointments.length})</h6>
    ${activeAppointments.length
      ? activeAppointments.map(a => renderAppointmentCard(a, true)).join('')
      : '<div class="text-muted small mb-3">No tiene citas pendientes.</div>'
    }

    ${pastAppointments.length
      ? `
        <hr />
        <h6 class="mb-3">Historial (${pastAppointments.length})</h6>
        ${pastAppointments.map(a => renderAppointmentCard(a, false)).join('')}
      `
      : ''
    }
  `;

  wireCreateForm(user);
  wireRescheduleForms();
}

function renderAppointmentCard(appointment, showActions) {
  const id = escapeHtml(appointment.id);
  const status = String(appointment.status || 'pending').toLowerCase();
  const statusLabel = status === 'attended' ? 'Atendida' : status === 'canceled' ? 'Cancelada' : 'Pendiente';
  const statusClass = status === 'attended' ? 'text-bg-success' : status === 'canceled' ? 'text-bg-danger' : 'text-bg-warning text-dark';
  const cancelReason = String(appointment.cancel_reason || '').trim();

  return `
    <div class="card border-0 shadow-sm mb-2 admin-page-card agenda-appointment-item" data-appointment-id="${id}">
      <div class="card-body py-3">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <div class="fw-semibold">${escapeHtml(appointment.date)} <span class="badge bg-secondary">${escapeHtml(appointment.time?.slice(0, 5))}</span></div>
            <div class="small text-muted">${escapeHtml(appointment.description || 'Sin descripción')}</div>
            <div><span class="badge ${statusClass}">${statusLabel}</span></div>
            ${status === 'canceled' && cancelReason ? `<div class="small text-danger mt-1">Motivo: ${escapeHtml(cancelReason)}</div>` : ''}
          </div>
          ${showActions && status === 'pending' ? `
            <div>
              <button class="btn btn-sm btn-outline-primary" data-reschedule="${id}">Reagendar</button>
            </div>
          ` : ''}
        </div>
        ${showActions && status === 'pending' ? `
          <form class="reschedule-panel d-none mt-2" data-reschedule-form="${id}">
            <div class="row g-2 align-items-end">
              <div class="col-5">
                <label class="form-label small">Nueva fecha</label>
                <input class="form-control form-control-sm" name="date" type="date" value="${escapeHtml(appointment.date)}" required />
              </div>
              <div class="col-4">
                <label class="form-label small">Nueva hora</label>
                <input class="form-control form-control-sm" name="time" type="time" step="60" value="${escapeHtml(appointment.time?.slice(0, 5))}" required />
              </div>
              <div class="col-3">
                <button class="btn btn-sm btn-primary w-100" type="submit">Guardar</button>
              </div>
              <div data-reschedule-feedback class="col-12"></div>
            </div>
          </form>
        ` : ''}
      </div>
    </div>
  `;
}

function wireCreateForm(user) {
  const toggleBtn = detailContainer.querySelector('#agenda-create-toggle');
  const form = detailContainer.querySelector('#agenda-create-form');
  const feedback = form?.querySelector('[data-agenda-create-feedback]');
  if (!toggleBtn || !form) return;

  toggleBtn.addEventListener('click', () => form.classList.toggle('d-none'));

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    clearMessage(feedback);
    const date = String(form.querySelector('[name="date"]')?.value || '').trim();
    const time = String(form.querySelector('[name="time"]')?.value || '').trim();
    const description = String(form.querySelector('[name="description"]')?.value || '').trim();
    const btn = form.querySelector('button[type="submit"]');
    const restore = setLoading(btn, 'Creando...');

    try {
      if (!date || !time) throw new Error('Fecha y hora son obligatorias');
      await api.adminCreateAppointment({ userId: user.id, date, time, description });
      showMessage(feedbackEl, 'Cita creada correctamente.', 'success');
      await loadAgendaData();
    } catch (err) {
      showMessage(feedback, err.message, 'danger');
    } finally {
      restore();
    }
  });
}

function wireRescheduleForms() {
  detailContainer.querySelectorAll('[data-reschedule]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-reschedule');
      const panel = detailContainer.querySelector(`[data-reschedule-form="${CSS.escape(id)}"]`);
      if (panel) panel.classList.toggle('d-none');
    });
  });

  detailContainer.querySelectorAll('[data-reschedule-form]').forEach(form => {
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const id = form.getAttribute('data-reschedule-form');
      const date = String(form.querySelector('[name="date"]')?.value || '').trim();
      const time = String(form.querySelector('[name="time"]')?.value || '').trim();
      const feedback = form.querySelector('[data-reschedule-feedback]');
      const btn = form.querySelector('button[type="submit"]');
      const restore = setLoading(btn, 'Guardando...');
      clearMessage(feedback);

      try {
        if (!date || !time) throw new Error('Fecha y hora son obligatorias');
        // Get the appointment data to preserve other fields
        const allAppts = Array.isArray(allAppointments) ? allAppointments : [];
        const appt = allAppts.find(a => String(a.id) === String(id));
        if (!appt) throw new Error('Cita no encontrada');

        await api.updateAppointment(id, {
          name: appt.name || '',
          phone: appt.phone || '',
          date,
          time,
          description: appt.description || '',
          status: 'pending',
        });
        showMessage(feedbackEl, 'Cita reagendada correctamente.', 'success');
        await loadAgendaData();
      } catch (err) {
        showMessage(feedback, err.message, 'danger');
      } finally {
        restore();
      }
    });
  });
}

logoutBtn?.addEventListener('click', async () => {
  try { await api.logout(); } catch {}
  window.location.href = './login.html';
});

// Init: ensure session then load
requireSession().then(() => loadAgendaData());
import { api } from './api-client.js';
import { requireSession } from './auth-guard.js';
import { clearMessage, escapeHtml, setLoading, showMessage } from './ui-utils.js';

function groupByDay(appointments) {
  return appointments.reduce((groups, appointment) => {
    const day = appointment.date;
    if (!groups[day]) groups[day] = [];
    groups[day].push(appointment);
    return groups;
  }, {});
}

function formatDateTime(dateStr, timeStr) {
  try {
    let dt;
    if (dateStr && dateStr.includes('T')) dt = new Date(dateStr);
    else if (dateStr && timeStr) dt = new Date(`${dateStr}T${timeStr}`);
    else if (dateStr) dt = new Date(dateStr);
    else return { date: '', time: '' };

    const dateFmt = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric' }).format(dt);
    const timeFmt = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(dt);
    return { date: dateFmt, time: timeFmt };
  } catch (error) {
    return { date: dateStr || '', time: timeStr || '' };
  }
}

function statusBadgeClass(status) {
  if (status === 'attended') return 'text-bg-success';
  if (status === 'canceled') return 'text-bg-danger';
  return 'text-bg-warning text-dark';
}

function statusText(status) {
  if (status === 'attended') return 'Atendida';
  if (status === 'canceled') return 'Cancelada';
  return 'Pendiente';
}

function renderEditForm(appointment) {
  const id = escapeHtml(appointment.id || '');
  const status = String(appointment.status || 'pending').toLowerCase();
  return `
    <form class="edit-panel d-none mt-3 border-top pt-3" data-edit-form="${id}">
      <div class="row g-2">
        <div class="col-12 col-md-6">
          <label class="form-label">Nombre</label>
          <input class="form-control" name="name" value="${escapeHtml(appointment.name || '')}" required />
        </div>
        <div class="col-12 col-md-6">
          <label class="form-label">Teléfono</label>
          <input class="form-control" name="phone" value="${escapeHtml(appointment.phone || '')}" />
        </div>
        <div class="col-12 col-md-4">
          <label class="form-label">Fecha</label>
          <input class="form-control" name="date" type="date" value="${escapeHtml(appointment.date || '')}" required />
        </div>
        <div class="col-12 col-md-4">
          <label class="form-label">Hora</label>
          <input class="form-control" name="time" type="time" value="${escapeHtml(appointment.time || '')}" required />
        </div>
        <div class="col-12 col-md-4">
          <label class="form-label">Estado</label>
          <select class="form-select" name="status">
            <option value="pending" ${status === 'pending' ? 'selected' : ''}>Pendiente</option>
            <option value="attended" ${status === 'attended' ? 'selected' : ''}>Atendida</option>
            <option value="canceled" ${status === 'canceled' ? 'selected' : ''}>Cancelada</option>
          </select>
        </div>
        <div class="col-12">
          <label class="form-label">Descripción</label>
          <textarea class="form-control" name="description" rows="3">${escapeHtml(appointment.description || '')}</textarea>
        </div>
        <div class="col-12">
          <label class="form-label">Motivo de cancelación</label>
          <textarea class="form-control" name="cancelReason" rows="2" placeholder="Obligatorio si el estado es cancelada">${escapeHtml(appointment.cancel_reason || '')}</textarea>
        </div>
      </div>
      <div data-edit-feedback class="mt-2"></div>
      <div class="d-flex flex-wrap gap-2 justify-content-end mt-3">
        <button class="btn btn-outline-secondary btn-sm" type="button" data-edit-hide="${id}">Cerrar</button>
        <button class="btn btn-primary btn-sm" type="submit">Guardar cambios</button>
      </div>
    </form>
  `;
}

function renderAppointmentItem(appointment) {
  const formatted = formatDateTime(appointment.date, appointment.time);
  const id = escapeHtml(appointment.id || '');
  const status = String(appointment.status || 'pending').toLowerCase();

  return `
    <div class="list-group-item py-3 admin-appointment-item" role="button" tabindex="0" data-appointment-item="${id}">
      <div class="d-flex flex-column flex-md-row justify-content-between gap-3">
        <div class="flex-grow-1">
          <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
            <div class="fw-semibold">${escapeHtml(appointment.name || 'Paciente')}</div>
            <span class="badge ${statusBadgeClass(status)}">${escapeHtml(statusText(status))}</span>
          </div>
          <div class="text-muted small">${escapeHtml(appointment.phone || '')}</div>
          <div class="text-muted small">${escapeHtml(formatted.time || appointment.time || '')}</div>
          <div class="mt-2">${escapeHtml(appointment.description || 'Sin descripción')}</div>
          ${status === 'canceled' && appointment.cancel_reason ? `<div class="alert alert-warning py-2 small mt-3 mb-0">Motivo de cancelación: ${escapeHtml(appointment.cancel_reason)}</div>` : ''}
        </div>
        <div class="text-md-end d-flex flex-wrap gap-2 justify-content-start justify-content-md-end admin-action-group">
          ${status === 'pending' ? `<button class="btn btn-success btn-sm" type="button" data-attend-appointment="${id}">Atender</button>` : ''}
          <button class="btn btn-outline-primary btn-sm" type="button" data-edit-appointment="${id}">Editar</button>
          <button class="btn btn-outline-danger btn-sm" type="button" data-delete-appointment="${id}">Eliminar</button>
        </div>
      </div>
      ${renderEditForm(appointment)}
    </div>
  `;
}

async function loadAdminAppointments() {
  const session = await requireSession('admin');
  if (!session) return;

  const container = document.querySelector('[data-admin-appointments-list]');
  const feedback = document.querySelector('[data-admin-feedback]');
  if (!container) return;

  try {
    const payload = await api.listAppointmentsByDay();
    const appointments = Array.isArray(payload?.data) ? payload.data : payload;
    const groups = groupByDay(Array.isArray(appointments) ? appointments : []);
    const days = Object.keys(groups).sort();

    if (!days.length) {
      container.innerHTML = `
        <div class="col-12">
          <div class="card border-0 shadow-sm">
            <div class="card-body text-center py-5">
              <h2 class="h5 mb-2">No hay citas registradas</h2>
              <p class="mb-0 text-muted">Cuando entren citas, aparecerán organizadas por día.</p>
            </div>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = days
      .map((day) => `
        <div class="col-12">
          <section class="card border-0 shadow-sm mb-3">
            <div class="card-header bg-white border-0 py-3">
              <h2 class="h5 mb-0">${escapeHtml(formatDateTime(day, null).date || day)}</h2>
            </div>
            <div class="list-group list-group-flush">
              ${groups[day].map(renderAppointmentItem).join('')}
            </div>
          </section>
        </div>
      `)
      .join('');

    container.querySelectorAll('.admin-appointment-item').forEach((item) => {
      const appointmentId = item.getAttribute('data-appointment-item');
      if (!appointmentId) return;

      item.addEventListener('click', (event) => {
        if (event.target.closest('button, a, input, textarea, select, option, label')) return;
        const form = container.querySelector(`[data-edit-form="${appointmentId}"]`);
        if (form) form.classList.toggle('d-none');
      });

      item.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        const form = container.querySelector(`[data-edit-form="${appointmentId}"]`);
        if (form) form.classList.toggle('d-none');
      });
    });

    container.querySelectorAll('[data-attend-appointment]').forEach((button) => {
      button.addEventListener('click', async () => {
        const appointmentId = button.getAttribute('data-attend-appointment');
        if (!appointmentId) return;

        const confirmed = window.confirm('¿Marcar esta cita como atendida?');
        if (!confirmed) return;

        const restore = setLoading(button, 'Atendiendo...');
        try {
          await api.updateAppointmentStatus(appointmentId, { status: 'attended' });
          await loadAdminAppointments();
        } catch (error) {
          showMessage(feedback, error.message);
        } finally {
          restore();
        }
      });
    });

    container.querySelectorAll('[data-delete-appointment]').forEach((button) => {
      button.addEventListener('click', async () => {
        const appointmentId = button.getAttribute('data-delete-appointment');
        if (!appointmentId) return;

        const confirmed = window.confirm('¿Seguro que deseas eliminar esta cita?');
        if (!confirmed) return;

        try {
          await api.deleteAppointment(appointmentId);
          await loadAdminAppointments();
        } catch (error) {
          showMessage(feedback, error.message);
        }
      });
    });

    container.querySelectorAll('[data-edit-appointment]').forEach((button) => {
      button.addEventListener('click', () => {
        const appointmentId = button.getAttribute('data-edit-appointment');
        if (!appointmentId) return;
        const form = container.querySelector(`[data-edit-form="${CSS.escape(appointmentId)}"]`);
        if (form) form.classList.toggle('d-none');
      });
    });

    container.querySelectorAll('[data-edit-hide]').forEach((button) => {
      button.addEventListener('click', () => {
        const appointmentId = button.getAttribute('data-edit-hide');
        if (!appointmentId) return;
        const form = container.querySelector(`[data-edit-form="${CSS.escape(appointmentId)}"]`);
        if (form) form.classList.add('d-none');
      });
    });

    container.querySelectorAll('[data-edit-form]').forEach((form) => {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const appointmentId = form.getAttribute('data-edit-form');
        const feedbackBox = form.querySelector('[data-edit-feedback]');
        const submitButton = form.querySelector('button[type="submit"]');
        const formData = new FormData(form);
        const payload = {
          name: String(formData.get('name') || '').trim(),
          phone: String(formData.get('phone') || '').trim(),
          date: String(formData.get('date') || '').trim(),
          time: String(formData.get('time') || '').trim(),
          description: String(formData.get('description') || '').trim(),
          status: String(formData.get('status') || 'pending').trim(),
          cancelReason: String(formData.get('cancelReason') || '').trim(),
        };

        if (!payload.name || !payload.date || !payload.time) {
          showMessage(feedbackBox, 'Nombre, fecha y hora son obligatorios.');
          return;
        }

        if (payload.status === 'canceled' && !payload.cancelReason) {
          showMessage(feedbackBox, 'Si cancelas, debes indicar el motivo.');
          return;
        }

        const restore = setLoading(submitButton, 'Guardando...');
        try {
          await api.updateAppointment(appointmentId, payload);
          showMessage(feedback, 'Cita actualizada correctamente.', 'success');
          await loadAdminAppointments();
        } catch (error) {
          showMessage(feedbackBox, error.message);
        } finally {
          restore();
        }
      });
    });
  } catch (error) {
    showMessage(feedback, error.message);
  }
}

const container = document.querySelector('[data-admin-appointments-list]');
if (container) {
  clearMessage(document.querySelector('[data-admin-feedback]'));
  loadAdminAppointments();
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    window.location.assign('./index.html');
  });
}

const adminForm = document.getElementById('admin-create-form');
if (adminForm) {
  adminForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(adminForm);
    const rawPhone = String(formData.get('phone') || '').trim();
    const payload = {
      name: String(formData.get('name') || '').trim(),
      phone: rawPhone && rawPhone.length ? rawPhone : null,
      date: String(formData.get('date') || '').trim(),
      time: String(formData.get('time') || '').trim(),
      description: String(formData.get('description') || '').trim(),
    };

    const feedback = document.querySelector('[data-admin-feedback]');
    try {
      await api.adminCreateAppointment(payload);
      adminForm.reset();
      await loadAdminAppointments();
      showMessage(feedback, 'Cita creada correctamente', 'success');
    } catch (err) {
      showMessage(feedback, err.message || 'Error al crear cita');
    }
  });
}

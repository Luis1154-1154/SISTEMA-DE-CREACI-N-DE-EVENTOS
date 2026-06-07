import { api } from './api-client.js';
import { requireSession } from './auth-guard.js';
import { clearMessage, escapeHtml, setLoading, showMessage } from './ui-utils.js';

const adminPageMode = String(document.body?.dataset?.adminPage || 'active').toLowerCase();

function groupByDay(appointments) {
  return appointments.reduce((groups, appointment) => {
    const day = appointment.date;
    if (!groups[day]) groups[day] = [];
    groups[day].push(appointment);
    return groups;
  }, {});
}

function sortAppointmentsDesc(appointments) {
  return [...appointments].sort((left, right) => {
    const leftDate = new Date(`${left.date || ''}T${left.time || '00:00'}`);
    const rightDate = new Date(`${right.date || ''}T${right.time || '00:00'}`);
    return rightDate - leftDate;
  });
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

function formatRole(role) {
  if (String(role || '').toLowerCase() === 'admin') return 'Admin';
  return 'Usuaria/o';
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
        <button class="btn btn-outline-secondary btn-sm rounded-pill px-3" type="button" data-edit-hide="${id}">Cerrar</button>
        <button class="btn btn-primary btn-sm rounded-pill px-3" type="submit">Guardar cambios</button>
      </div>
    </form>
  `;
}

function renderAppointmentItem(appointment, { showAttendAction = true } = {}) {
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
          ${status === 'pending' && showAttendAction ? `<button class="btn btn-success btn-sm rounded-pill px-3" type="button" data-attend-appointment="${id}">Atender</button>` : ''}
          <button class="btn btn-outline-primary btn-sm rounded-pill px-3" type="button" data-edit-appointment="${id}">Editar</button>
          <button class="btn btn-outline-danger btn-sm rounded-pill px-3" type="button" data-delete-appointment="${id}">Eliminar</button>
        </div>
      </div>
      ${renderEditForm(appointment)}
    </div>
  `;
}

function filterAppointmentsForMode(appointments, mode) {
  const normalizedMode = String(mode || 'active').toLowerCase();

  return appointments.filter((appointment) => {
    const status = String(appointment.status || 'pending').toLowerCase();
    if (normalizedMode === 'history') return status === 'attended' || status === 'canceled';
    if (normalizedMode === 'active') return status === 'pending';
    return true;
  });
}

function wireAppointmentInteractions(container, feedback, { showAttendAction = true, refresh = null } = {}) {
  container.querySelectorAll('.admin-appointment-item').forEach((item) => {
    const appointmentId = item.getAttribute('data-appointment-item');
    if (!appointmentId) return;

    item.addEventListener('click', (event) => {
      if (event.target.closest('button, a, input, textarea, select, option, label')) return;
      const form = container.querySelector(`[data-edit-form="${CSS.escape(appointmentId)}"]`);
      if (form) form.classList.toggle('d-none');
    });

    item.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      const form = container.querySelector(`[data-edit-form="${CSS.escape(appointmentId)}"]`);
      if (form) form.classList.toggle('d-none');
    });
  });

  if (showAttendAction) {
    container.querySelectorAll('[data-attend-appointment]').forEach((button) => {
      button.addEventListener('click', async () => {
        const appointmentId = button.getAttribute('data-attend-appointment');
        if (!appointmentId) return;

        const confirmed = window.confirm('¿Marcar esta cita como atendida?');
        if (!confirmed) return;

        const restore = setLoading(button, 'Atendiendo...');
        try {
          await api.updateAppointmentStatus(appointmentId, { status: 'attended' });
          if (refresh) await refresh();
          else await loadAdminAppointments();
        } catch (error) {
          showMessage(feedback, error.message);
        } finally {
          restore();
        }
      });
    });
  }

  container.querySelectorAll('[data-delete-appointment]').forEach((button) => {
    button.addEventListener('click', async () => {
      const appointmentId = button.getAttribute('data-delete-appointment');
      if (!appointmentId) return;

      const confirmed = window.confirm('¿Seguro que deseas eliminar esta cita?');
      if (!confirmed) return;

      try {
        await api.deleteAppointment(appointmentId);
        if (refresh) await refresh();
        else await loadAdminAppointments();
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
        if (refresh) await refresh();
        else await loadAdminAppointments();
      } catch (error) {
        showMessage(feedbackBox, error.message);
      } finally {
        restore();
      }
    });
  });
}

async function loadAdminAppointments(mode = adminPageMode) {
  const session = await requireSession('admin');
  if (!session) return;

  const container = document.querySelector('[data-admin-appointments-list]');
  const feedback = document.querySelector('[data-admin-feedback]');
  if (!container) return;

  try {
    const payload = await api.listAppointmentsByDay();
    const appointments = Array.isArray(payload?.data) ? payload.data : payload;
    const filteredAppointments = filterAppointmentsForMode(Array.isArray(appointments) ? appointments : [], mode);
    const groups = groupByDay(filteredAppointments);
    const days = Object.keys(groups).sort((left, right) => {
      if (mode === 'history') return new Date(right) - new Date(left);
      return new Date(left) - new Date(right);
    });

    if (!days.length) {
      container.innerHTML = `
        <div class="col-12">
          <div class="card border-0 shadow-sm admin-page-card">
            <div class="card-body text-center py-5">
              <h2 class="h5 mb-2">${mode === 'history' ? 'No hay historial todavía' : 'No hay citas pendientes'}</h2>
              <p class="mb-0 text-muted">${mode === 'history' ? 'Cuando existan citas atendidas o canceladas aparecerán aquí.' : 'Cuando entren citas, aparecerán organizadas por día.'}</p>
            </div>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = days
      .map((day) => `
        <div class="col-12">
          <section class="card border-0 shadow-sm mb-3 admin-page-card">
            <div class="card-header bg-white border-0 py-3">
              <h2 class="h5 mb-0">${escapeHtml(formatDateTime(day, null).date || day)}</h2>
            </div>
            <div class="list-group list-group-flush">
              ${groups[day].map((appointment) => renderAppointmentItem(appointment, { showAttendAction: mode !== 'history' })).join('')}
            </div>
          </section>
        </div>
      `)
      .join('');

    wireAppointmentInteractions(container, feedback, { showAttendAction: mode !== 'history', refresh: () => loadAdminAppointments(mode) });
  } catch (error) {
    showMessage(feedback, error.message);
  }
}

function renderUserItem(user, isSelected, recordCount) {
  const role = String(user.role || 'user').toLowerCase();
  return `
    <button type="button" class="list-group-item list-group-item-action record-user-item ${isSelected ? 'active' : ''}" data-select-user="${escapeHtml(user.id || '')}">
      <div class="d-flex justify-content-between align-items-center gap-2">
        <div class="text-start">
          <div class="fw-semibold">${escapeHtml(user.name || 'Sin nombre')}</div>
          <div class="small text-muted">${escapeHtml(user.phone || 'Sin teléfono')}</div>
        </div>
        <div class="text-end">
          <span class="badge ${role === 'admin' ? 'text-bg-dark' : 'text-bg-primary'} rounded-pill">${escapeHtml(formatRole(role))}</span>
          <div class="small text-muted mt-1">${recordCount} registros</div>
        </div>
      </div>
    </button>
  `;
}

function renderClinicalDetail(user, appointments) {
  const role = String(user.role || 'user').toLowerCase();
  const totalRecords = appointments.length;
  const observations = String(user.clinical_observations || '').trim();

  return `
    <div class="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3 record-panel-header p-3">
      <div>
        <p class="text-uppercase text-muted small mb-1">Expediente clínico</p>
        <h2 class="h4 mb-1">${escapeHtml(user.name || 'Sin nombre')}</h2>
        <p class="mb-0 text-muted">${escapeHtml(user.phone || 'Sin teléfono')}</p>
      </div>
      <div class="text-md-end">
        <span class="badge ${role === 'admin' ? 'text-bg-dark' : 'text-bg-primary'} rounded-pill record-summary-chip">${escapeHtml(formatRole(role))}</span>
        <div class="small text-muted mt-2">${totalRecords} registros vinculados</div>
      </div>
    </div>

    <form class="card border-0 shadow-sm mb-4 admin-page-card" data-clinical-observations-form>
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center gap-3 mb-3">
          <h3 class="h6 mb-0">Observaciones clínicas</h3>
          <span class="badge text-bg-primary rounded-pill">Editable</span>
        </div>
        <div class="row g-3">
          <div class="col-12 col-md-6">
            <label class="form-label">Nombre</label>
            <input class="form-control" value="${escapeHtml(user.name || '')}" readonly />
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label">Teléfono</label>
            <input class="form-control" value="${escapeHtml(user.phone || '')}" readonly />
          </div>
          <div class="col-12">
            <label class="form-label">Observaciones</label>
            <textarea class="form-control" name="clinicalObservations" rows="5" placeholder="Notas, antecedentes, seguimiento, indicaciones...">${escapeHtml(observations)}</textarea>
          </div>
        </div>
        <div data-clinical-observations-feedback class="mt-3"></div>
        <div class="d-flex justify-content-end mt-3">
          <button class="btn btn-primary rounded-pill px-4" type="submit">Guardar observaciones</button>
        </div>
      </div>
    </form>

    <div class="d-flex justify-content-between align-items-center gap-3 mb-3">
      <h3 class="h6 mb-0">Historial del paciente</h3>
      <span class="badge text-bg-primary rounded-pill">${totalRecords} citas</span>
    </div>

    ${appointments.length ? `
      <div class="list-group">
        ${appointments.map((appointment) => renderAppointmentItem(appointment, { showAttendAction: false })).join('')}
      </div>
    ` : `
      <div class="card border-0 shadow-sm admin-page-card">
        <div class="card-body text-center py-5">
          <h3 class="h5 mb-2">Sin registros todavía</h3>
          <p class="mb-0 text-muted">Agrega la primera cita para crear el expediente clínico.</p>
        </div>
      </div>
    `}
  `;
}

function wireClinicalRecordInteractions(container, feedback, selectedUser, refresh) {
  wireAppointmentInteractions(container, feedback, { showAttendAction: false, refresh: () => refresh(selectedUser.id) });

  const observationsForm = container.querySelector('[data-clinical-observations-form]');
  if (!observationsForm) return;

  observationsForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(observationsForm);
    const payload = {
      clinicalObservations: String(formData.get('clinicalObservations') || '').trim(),
    };

    const feedbackBox = observationsForm.querySelector('[data-clinical-observations-feedback]');
    const submitButton = observationsForm.querySelector('button[type="submit"]');
    const restore = setLoading(submitButton, 'Guardando...');
    try {
      await api.updateUserClinicalObservations(selectedUser.id, payload);
      await refresh(selectedUser.id);
      showMessage(feedback, 'Observaciones guardadas correctamente.', 'success');
    } catch (error) {
      showMessage(feedbackBox, error.message);
    } finally {
      restore();
    }
  });
}

async function loadClinicalRecords(initialUserId = null) {
  const session = await requireSession('admin');
  if (!session) return;

  const usersContainer = document.querySelector('[data-records-users]');
  const detailContainer = document.querySelector('[data-records-detail]');
  const feedback = document.querySelector('[data-records-feedback]');
  if (!usersContainer || !detailContainer) return;

  try {
    const [usersPayload, appointmentsPayload] = await Promise.all([api.listUsers(), api.listAppointmentsByDay()]);
    const users = Array.isArray(usersPayload?.data) ? usersPayload.data : usersPayload;
    const appointments = Array.isArray(appointmentsPayload?.data) ? appointmentsPayload.data : appointmentsPayload;
    const sortedUsers = (Array.isArray(users) ? users : []).slice().sort((left, right) => {
      return String(left.name || '').localeCompare(String(right.name || ''), 'es', { sensitivity: 'base' });
    });
    const appointmentsByUser = new Map();

    (Array.isArray(appointments) ? appointments : []).forEach((appointment) => {
      if (appointment.user_id === null || appointment.user_id === undefined) return;
      const userKey = String(appointment.user_id);
      if (!appointmentsByUser.has(userKey)) appointmentsByUser.set(userKey, []);
      appointmentsByUser.get(userKey).push(appointment);
    });

    sortedUsers.forEach((user) => {
      const userAppointments = appointmentsByUser.get(String(user.id)) || [];
      appointmentsByUser.set(String(user.id), sortAppointmentsDesc(userAppointments));
    });

    if (!sortedUsers.length) {
      usersContainer.innerHTML = `
        <div class="list-group-item border-0 py-2"></div>
      `;
      detailContainer.innerHTML = `
        <div class="text-center text-muted py-5"></div>
      `;
      return;
    }

    let selectedUserId = initialUserId ? String(initialUserId) : String(sortedUsers[0].id);

    const renderSelectedUser = () => {
      const selectedUser = sortedUsers.find((user) => String(user.id) === String(selectedUserId)) || sortedUsers[0];
      const userAppointments = appointmentsByUser.get(String(selectedUser.id)) || [];

      usersContainer.innerHTML = sortedUsers
        .map((user) => renderUserItem(user, String(user.id) === String(selectedUser.id), (appointmentsByUser.get(String(user.id)) || []).length))
        .join('');

      detailContainer.innerHTML = renderClinicalDetail(selectedUser, userAppointments);
      wireClinicalRecordInteractions(detailContainer, feedback, selectedUser, async (userId) => {
        await loadClinicalRecords(userId);
      });

      usersContainer.querySelectorAll('[data-select-user]').forEach((button) => {
        button.addEventListener('click', () => {
          const userId = button.getAttribute('data-select-user');
          if (!userId) return;
          selectedUserId = userId;
          renderSelectedUser();
        });
      });
    };

    renderSelectedUser();
  } catch (error) {
    showMessage(feedback, error.message);
  }
}

const appointmentsContainer = document.querySelector('[data-admin-appointments-list]');
if (appointmentsContainer) {
  clearMessage(document.querySelector('[data-admin-feedback]'));
  loadAdminAppointments(adminPageMode);
}

const recordsContainer = document.querySelector('[data-records-users]');
if (recordsContainer) {
  clearMessage(document.querySelector('[data-records-feedback]'));
  loadClinicalRecords();
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
  adminForm.addEventListener('submit', async (event) => {
    event.preventDefault();
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
      await loadAdminAppointments(adminPageMode);
      showMessage(feedback, 'Cita creada correctamente', 'success');
    } catch (error) {
      showMessage(feedback, error.message || 'Error al crear cita');
    }
  });
}

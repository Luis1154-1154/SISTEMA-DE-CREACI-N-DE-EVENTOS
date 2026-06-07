import { api } from './api-client.js';
import { requireSession } from './auth-guard.js';
import { clearMessage, escapeHtml, setLoading, showMessage } from './ui-utils.js';
import { normalizePhone, isValidPhone } from './app-config.js';

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
    const adminForm = document.getElementById('admin-create-form');

    const renderUserAppointments = (appointments) => {
    const adminForm = document.getElementById('admin-create-form');
    const [myAppointmentsResult, meResult] = await Promise.all([
      api.listMyAppointments().catch((error) => error),
      api.me().catch((error) => error),
    ]);

    const session = meResult instanceof Error ? null : meResult;
    const sessionRole = String(session?.role || session?.user?.role || '').toLowerCase();

    const renderUserAppointments = (appointments) => {
      if (adminForm) adminForm.style.display = 'none';

      const list = Array.isArray(appointments) ? appointments : [];
      if (!list.length) {
        container.innerHTML = `
          <div class="col-12">
            <div class="empty-state card border-0 shadow-sm">
              <div class="card-body text-center py-5">
                <h2 class="h5 mb-2">No tienes citas pendientes</h2>
                <p class="mb-0 text-muted">Las citas atendidas o canceladas estarán en el historial.</p>
                <a class="btn btn-primary btn-sm mt-3" href="./create-appointment.html">Agendar cita</a>
              </div>
            </div>
          </div>
        `;
        return;
      }

      container.innerHTML = list.map((appointment) => {
        const formatted = formatDateTime(appointment.date, appointment.time);
        const id = escapeHtml(appointment.id || '');
        return `
          <div class="col-12 col-md-6 col-xl-4">
            <article class="card appointment-card h-100 border-0 shadow-sm">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
                  <div>
                    <p class="text-uppercase text-muted small mb-1">Cita pendiente</p>
                    <h2 class="h5 mb-0">${escapeHtml(formatted.date)}</h2>
                  </div>
                  <span class="badge text-bg-warning text-dark">Pendiente</span>
                </div>
                <div class="d-flex align-items-center justify-content-between gap-3 mb-3">
                  <span class="badge text-bg-primary">${escapeHtml(formatted.time)}</span>
                  <span class="text-muted small">${escapeHtml(appointment.phone || '')}</span>
                </div>
                <p class="text-muted mb-3">${escapeHtml(appointment.description || 'Sin descripción')}</p>
                <div class="d-flex flex-wrap gap-2">
                  <button class="btn btn-outline-danger btn-sm" type="button" data-toggle-cancel="${id}">Cancelar cita</button>
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
              </div>
            </article>
          </div>
        `;
      }).join('');

      container.querySelectorAll('[data-toggle-cancel]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-toggle-cancel');
          const panel = container.querySelector(`[data-cancel-form="${CSS.escape(id)}"]`);
          if (panel) panel.classList.toggle('d-none');
        });
      });

      container.querySelectorAll('[data-cancel-hide]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-cancel-hide');
          const panel = container.querySelector(`[data-cancel-form="${CSS.escape(id)}"]`);
          if (panel) panel.classList.add('d-none');
        });
      });

      container.querySelectorAll('[data-cancel-form]').forEach((form) => {
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          const id = form.getAttribute('data-cancel-form');
          const reason = String(form.querySelector('[name="reason"]')?.value || '').trim();
          const feedbackBox = form.querySelector('[data-cancel-feedback]');
          if (!reason) {
            showMessage(feedbackBox, 'Indica el motivo de cancelación.');
            return;
          }
          const submitButton = form.querySelector('button[type="submit"]');
          const restore = setLoading(submitButton, 'Cancelando...');
          try {
            await api.cancelAppointment(id, { reason });
            showMessage(feedback, 'Cita cancelada correctamente.', 'success');
            await loadAdminAppointments(mode);
          } catch (error) {
            showMessage(feedbackBox, error.message);
          } finally {
            restore();
          }
        });
      });
    };

    if (sessionRole !== 'admin') {
      if (myAppointmentsResult instanceof Error) {
        renderUserAppointments([]);
        return;
      }
      renderUserAppointments(Array.isArray(myAppointmentsResult?.data) ? myAppointmentsResult.data : myAppointmentsResult);
      return;
    }

    if (adminForm) adminForm.style.display = '';

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
                <h2 class="h5 mb-2">No hay citas pendientes</h2>
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
  // Try to fetch session directly so we can gracefully handle non-admin users
  let session = null;
  try {
    session = await api.me();
  } catch (e) {
    const feedback = document.querySelector('[data-admin-feedback]');
    showMessage(feedback, 'Error de autenticación: No autorizado. Si esto persiste, cierra sesión e intenta iniciar de nuevo.');
    return;
  }

  const container = document.querySelector('[data-admin-appointments-list]');
  const feedback = document.querySelector('[data-admin-feedback]');
  if (!container) return;

  // If the user is not an admin, show their own appointments in this panel
  if (!session || (session.role || session.user?.role) !== 'admin') {
    // hide admin create form to avoid confusion
    const adminForm = document.getElementById('admin-create-form');
    if (adminForm) adminForm.style.display = 'none';

    try {
      const payload = await api.listMyAppointments();
      const appointments = Array.isArray(payload?.data) ? payload.data : payload;

      if (!appointments || appointments.length === 0) {
        container.innerHTML = `
          <div class="col-12">
            <div class="empty-state card border-0 shadow-sm">
              <div class="card-body text-center py-5">
                <h2 class="h5 mb-2">No tienes citas pendientes</h2>
                <p class="mb-0 text-muted">Las citas atendidas o canceladas estarán en el historial.</p>
                <a class="btn btn-primary btn-sm mt-3" href="./create-appointment.html">Agendar cita</a>
              </div>
            </div>
          </div>
        `;
        return;
      }

      const renderUserCard = (appointment) => {
        const formatted = formatDateTime(appointment.date, appointment.time);
        const id = escapeHtml(appointment.id || '');
        return `
          <div class="col-12 col-md-6 col-xl-4">
            <article class="card appointment-card h-100 border-0 shadow-sm">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
                  <div>
                    <p class="text-uppercase text-muted small mb-1">Cita pendiente</p>
                    <h2 class="h5 mb-0">${escapeHtml(formatted.date)}</h2>
                  </div>
                  <span class="badge text-bg-warning text-dark">Pendiente</span>
                </div>
                <div class="d-flex align-items-center justify-content-between gap-3 mb-3">
                  <span class="badge text-bg-primary">${escapeHtml(formatted.time)}</span>
                  <span class="text-muted small">${escapeHtml(appointment.phone || '')}</span>
                </div>
                <p class="text-muted mb-3">${escapeHtml(appointment.description || 'Sin descripción')}</p>

                <div class="d-flex flex-wrap gap-2">
                  <button class="btn btn-outline-danger btn-sm" type="button" data-toggle-cancel="${id}">Cancelar cita</button>
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
              </div>
            </article>
          </div>
        `;
      };

      container.innerHTML = (Array.isArray(appointments) ? appointments : []).map(renderUserCard).join('');

      // Wire cancel toggles and submits for user cards
      container.querySelectorAll('[data-toggle-cancel]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-toggle-cancel');
          const panel = container.querySelector(`[data-cancel-form="${CSS.escape(id)}"]`);
          if (panel) panel.classList.toggle('d-none');
        });
      });

      container.querySelectorAll('[data-cancel-hide]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-cancel-hide');
          const panel = container.querySelector(`[data-cancel-form="${CSS.escape(id)}"]`);
          if (panel) panel.classList.add('d-none');
        });
      });

      container.querySelectorAll('[data-cancel-form]').forEach((form) => {
        form.addEventListener('submit', async (ev) => {
          ev.preventDefault();
          const id = form.getAttribute('data-cancel-form');
          const reason = String(form.querySelector('[name="reason"]')?.value || '').trim();
          const feedbackBox = form.querySelector('[data-cancel-feedback]');
          if (!reason) { showMessage(feedbackBox, 'Indica el motivo de cancelación.'); return; }
          const submitBtn = form.querySelector('button[type="submit"]');
          const restore = setLoading(submitBtn, 'Cancelando...');
          try {
            await api.cancelAppointment(id, { reason });
            showMessage(feedback, 'Cita cancelada correctamente.', 'success');
            await loadAdminAppointments(mode);
          } catch (error) {
            showMessage(feedbackBox, error.message);
          } finally { restore(); }
        });
      });

      return;
    } catch (error) {
      showMessage(feedback, error.message);
      return;
    }
  }

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
        <div class="ms-2">
          <button type="button" class="btn btn-sm btn-outline-danger" data-delete-user="${escapeHtml(user.id || '')}" data-delete-role="${escapeHtml(role)}" title="Eliminar usuario">Eliminar</button>
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

    <form class="card border-0 shadow-sm mb-4 admin-page-card" data-create-appointment-for-user>
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center gap-3 mb-3">
          <h3 class="h6 mb-0">Crear cita para este usuario</h3>
          <span class="badge text-bg-primary rounded-pill">Reservar</span>
        </div>
        <div class="row g-3">
          <div class="col-12 col-md-6">
            <label class="form-label">Teléfono</label>
            <input class="form-control" name="phone" value="${escapeHtml(user.phone || '')}" required />
          </div>
          <div class="col-12 col-md-3">
            <label class="form-label">Fecha</label>
            <input class="form-control" name="date" type="date" required />
          </div>
          <div class="col-12 col-md-3">
            <label class="form-label">Hora</label>
            <input class="form-control" name="time" type="time" step="60" required />
          </div>
          <div class="col-12">
            <label class="form-label">Descripción</label>
            <textarea class="form-control" name="description" rows="2" placeholder="Opcional"></textarea>
          </div>
        </div>
        <div data-create-appointment-feedback class="mt-3"></div>
        <div class="d-flex justify-content-end mt-3">
          <button class="btn btn-primary rounded-pill px-4" type="submit">Reservar cita</button>
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

  const createForm = container.querySelector('[data-create-appointment-for-user]');
  if (createForm) {
    createForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(createForm);
      const rawPhone = String(formData.get('phone') || '').trim();
      const phone = normalizePhone(rawPhone);
      const payload = {
        userId: selectedUser.id,
        phone: phone && phone.length ? phone : null,
        date: String(formData.get('date') || '').trim(),
        time: String(formData.get('time') || '').trim(),
        description: String(formData.get('description') || '').trim(),
      };

      const feedbackBox = createForm.querySelector('[data-create-appointment-feedback]');
      const submitButton = createForm.querySelector('button[type="submit"]');
      const restore = setLoading(submitButton, 'Reservando...');
      try {
        if (!payload.phone || !payload.date || !payload.time) {
          showMessage(feedbackBox, 'Teléfono, fecha y hora son obligatorios.');
          return;
        }

        if (!isValidPhone(payload.phone)) {
          showMessage(feedbackBox, 'El teléfono debe tener 10 dígitos. Ejemplo: 3123456789');
          return;
        }
        await api.adminCreateAppointment(payload);
        showMessage(feedback, 'Cita creada correctamente.', 'success');
        await refresh(selectedUser.id);
      } catch (error) {
        showMessage(feedbackBox, error.message);
      } finally {
        restore();
      }
    });
  }
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

      // Wire delete user buttons
      usersContainer.querySelectorAll('[data-delete-user]').forEach((btn) => {
        btn.addEventListener('click', async (ev) => {
          ev.stopPropagation();
          const id = btn.getAttribute('data-delete-user');
          const role = btn.getAttribute('data-delete-role');
          if (!id) return;
          let confirmed = window.confirm('¿Eliminar este usuario y todas sus citas? Esta acción no se puede deshacer.');
          if (!confirmed) return;

          if (String(role || '').toLowerCase() === 'admin') {
            const confirmationInput = window.prompt('Este usuario tiene rol admin. Escribe ELIMINAR para confirmar.');
            if (!confirmationInput || confirmationInput.trim().toUpperCase() !== 'ELIMINAR') {
              showMessage(feedback, 'Confirmación no válida. No se eliminó al usuario.');
              return;
            }
          }

          try {
            await api.deleteUser(id);
            await loadClinicalRecords();
            showMessage(feedback, 'Usuario eliminado.', 'success');
          } catch (error) {
            showMessage(feedback, error.message);
          }
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
    const phone = normalizePhone(rawPhone);
    const payload = {
      name: String(formData.get('name') || '').trim(),
      phone: phone && phone.length ? phone : null,
      date: String(formData.get('date') || '').trim(),
      time: String(formData.get('time') || '').trim(),
      description: String(formData.get('description') || '').trim(),
    };

    const feedback = document.querySelector('[data-admin-feedback]');
    try {
      if (!payload.phone || !payload.date || !payload.time) {
        showMessage(feedback, 'Nombre, teléfono, fecha y hora son obligatorios.');
        return;
      }

      if (!isValidPhone(payload.phone)) {
        showMessage(feedback, 'El teléfono debe tener 10 dígitos. Ejemplo: 3123456789');
        return;
      }

      // Try to find matching user by phone to link appointment to user record
      try {
        const usersPayload = await api.listUsers();
        const users = Array.isArray(usersPayload?.data) ? usersPayload.data : usersPayload;
        const matched = (Array.isArray(users) ? users : []).find((u) => normalizePhone(u.phone) === payload.phone);
        if (matched) payload.userId = matched.id;
      } catch (e) {
        // ignore lookup errors; still proceed to create appointment
      }

      await api.adminCreateAppointment(payload);
      adminForm.reset();
      await loadAdminAppointments(adminPageMode);
      showMessage(feedback, 'Cita creada correctamente', 'success');
    } catch (error) {
      showMessage(feedback, error.message || 'Error al crear cita');
    }
  });
}

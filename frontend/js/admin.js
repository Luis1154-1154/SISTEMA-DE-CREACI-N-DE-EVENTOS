import { api } from './api-client.js';
import { requireSession } from './auth-guard.js';
import { clearMessage, escapeHtml, initMobileNavToggle, setLoading, showMessage, showFloatingConfirm } from './ui-utils.js';
import { normalizePhone, isValidPhone } from './app-config.js';

const adminPageMode = String(document.body?.dataset?.adminPage || 'active').toLowerCase();

function normalizeDateValue(value) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? String(value) : dt.toISOString().slice(0, 10);
}

function normalizeTimeValue(value) {
  if (!value) return '';
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) return value.slice(0, 5);
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? String(value) : dt.toISOString().slice(11, 16);
}

function parseAppointmentDateTime(dateStr, timeStr) {
  if (dateStr && timeStr) {
    const candidate = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? `${dateStr}T${normalizeTimeValue(timeStr)}` : dateStr;
    const dt = new Date(candidate);
    if (!Number.isNaN(dt.getTime())) return dt;
  }

  if (dateStr) {
    const dt = new Date(dateStr);
    if (!Number.isNaN(dt.getTime())) return dt;
  }

  if (timeStr) {
    const dt = new Date(`1970-01-01T${normalizeTimeValue(timeStr)}`);
    if (!Number.isNaN(dt.getTime())) return dt;
  }

  return new Date();
}

function formatDateTime(dateStr, timeStr) {
  try {
    const dt = parseAppointmentDateTime(dateStr, timeStr);
    return {
      date: new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric' }).format(dt),
      time: new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(dt)
    };
  } catch (e) {
    return { date: dateStr || '', time: timeStr || '' };
  }
}

function renderAppointmentItem(appointment, { mode = adminPageMode } = {}) {
  const formatted = formatDateTime(appointment.date, appointment.time);
  const id = escapeHtml(appointment.id || '');
  const normalizedStatus = String(appointment.status || 'pending').trim().toLowerCase();
  const isPending = normalizedStatus === 'pending';
  const showActions = mode === 'active';
  const showDelete = mode !== 'records';
  const statusLabel = normalizedStatus === 'attended' ? 'Atendida'
    : normalizedStatus === 'canceled' ? 'Cancelada'
    : 'Pendiente';
  const cancelReason = String(appointment.cancel_reason || '').trim();

  return `
    <div class="col-12">
      <div class="list-group-item d-flex justify-content-between align-items-start">
        <div>
          <div class="d-flex align-items-center gap-3 flex-wrap">
            <div class="fw-bold">${escapeHtml(formatted.date)}</div>
            <div class="badge bg-secondary text-white">${escapeHtml(formatted.time)}</div>
            <div class="ms-2"><span class="small text-muted">${escapeHtml(appointment.name || '')} • ${escapeHtml(appointment.phone || '')}</span></div>
          </div>
          <div class="mt-2">${escapeHtml(appointment.description || '')}</div>
          <div class="mt-2 small">Status: <strong>${escapeHtml(statusLabel)}</strong></div>
          ${normalizedStatus === 'canceled' && cancelReason ? `<div class="mt-2 small text-danger">Motivo: ${escapeHtml(cancelReason)}</div>` : ''}
        </div>
        <div class="text-end action-buttons">
          ${showDelete ? `<button class="btn btn-sm btn-outline-danger mb-2" data-delete-appointment="${id}">Eliminar</button>` : ''}
          ${showActions ? `
            <div class="d-flex flex-column align-items-end gap-2">
              ${isPending ? `<button class="btn btn-sm btn-outline-success" data-activate-appointment="${id}">Marcar atendida</button>` : ''}
              ${isPending ? `<button class="btn btn-sm btn-outline-primary" data-edit-appointment="${id}">Editar</button>` : ''}
              ${isPending ? `<button class="btn btn-sm btn-outline-secondary" data-toggle-cancel="${id}">Cancelar</button>` : ''}
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
              <input type="hidden" name="name" value="${escapeHtml(appointment.name || '')}" />
              <input type="hidden" name="phone" value="${escapeHtml(appointment.phone || '')}" />
              <input type="hidden" name="description" value="${escapeHtml(appointment.description || '')}" />
              <input type="hidden" name="status" value="${escapeHtml(appointment.status || 'pending')}" />
              <input type="hidden" name="cancel_reason" value="${escapeHtml(appointment.cancel_reason || '')}" />
              <div class="row g-2 align-items-end">
                <div class="col-6">
                  <label class="form-label small">Fecha</label>
                  <input class="form-control form-control-sm" name="date" type="date" placeholder="Fecha de la cita" title="Fecha de la cita" aria-label="Fecha de la cita" value="${escapeHtml(normalizeDateValue(appointment.date || ''))}" required />
                </div>
                <div class="col-6">
                  <label class="form-label small">Hora</label>
                  <input class="form-control form-control-sm" name="time" type="time" step="60" placeholder="Hora de la cita" title="Hora de la cita" aria-label="Hora de la cita" value="${escapeHtml(normalizeTimeValue(appointment.time || ''))}" required />
                </div>
                <div class="col-12 text-end mt-2">
                  <button class="btn btn-sm btn-primary" type="submit">Guardar</button>
                </div>
              </div>
            </form>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

async function wireAppointmentInteractions(container, feedback, refresh) {
  if (container.dataset.adminWired === 'true') return;
  container.dataset.adminWired = 'true';

  container.addEventListener('click', async (ev) => {
    const deleteBtn = ev.target.closest('[data-delete-appointment]');
    if (deleteBtn) {
      const id = deleteBtn.getAttribute('data-delete-appointment');
      if (!id) return;
      const restore = setLoading(deleteBtn, 'Eliminando...');
      try {
        if (!(await showFloatingConfirm('Eliminar esta cita?'))) return;
        await api.deleteAppointment(id);
        showMessage(feedback, 'Cita eliminada.', 'success');
        if (refresh) await refresh();
      } catch (err) {
        showMessage(feedback, err.message);
      } finally {
        restore();
      }
      return;
    }

    const toggle = ev.target.closest('[data-toggle-cancel]');
    if (toggle) {
      const id = toggle.getAttribute('data-toggle-cancel');
      const panel = container.querySelector(`[data-cancel-form="${CSS.escape(id)}"]`);
      if (panel) panel.classList.toggle('d-none');
      return;
    }

    const activateBtn = ev.target.closest('[data-activate-appointment]');
    if (activateBtn) {
      const id = activateBtn.getAttribute('data-activate-appointment');
      if (!id) return;
      const restore = setLoading(activateBtn, 'Guardando...');
      try {
        if (!(await showFloatingConfirm('Marcar esta cita como atendida?'))) return;
        await api.updateAppointmentStatus(id, { status: 'attended' });
        showMessage(feedback, 'Cita marcada como atendida', 'success');
        if (refresh) await refresh();
      } catch (err) {
        showMessage(feedback, err.message);
      } finally {
        restore();
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

  container.addEventListener('submit', async (ev) => {
    const form = ev.target.closest('[data-cancel-form], [data-edit-form]');
    if (!form) return;
    ev.preventDefault();

    if (form.hasAttribute('data-cancel-form')) {
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
      } finally {
        restore();
      }
      return;
    }

    if (form.hasAttribute('data-edit-form')) {
      const id = form.getAttribute('data-edit-form');
      const date = String(form.querySelector('[name="date"]')?.value || '').trim();
      const time = String(form.querySelector('[name="time"]')?.value || '').trim();
      const name = String(form.querySelector('[name="name"]')?.value || '').trim();
      const phone = String(form.querySelector('[name="phone"]')?.value || '').trim();
      const description = String(form.querySelector('[name="description"]')?.value || '').trim();
      const status = String(form.querySelector('[name="status"]')?.value || '').trim();
      const cancelReason = String(form.querySelector('[name="cancel_reason"]')?.value || '').trim();
      const submit = form.querySelector('button[type="submit"]');
      const restore = setLoading(submit, 'Guardando...');
      try {
        if (!date || !time) throw new Error('Fecha y hora son obligatorias');
        await api.updateAppointment(id, { date, time, name, phone, description, status, cancel_reason: cancelReason });
        showMessage(feedback, 'Cita actualizada', 'success');
        if (refresh) await refresh();
      } catch (err) {
        showMessage(form, err.message);
      } finally {
        restore();
      }
      return;
    }
  });
}

async function loadAdminAppointments(mode = adminPageMode) {
  const feedback = document.querySelector('[data-admin-feedback]');
  const container = document.querySelector('[data-admin-appointments-list]');
  if (!container) return;
  clearMessage(feedback);
  // Load schedule settings (appointment interval)
  try {
    const settings = await api.getScheduleSettings();
    const minutes = settings && settings.appointment_interval_minutes ? Number(settings.appointment_interval_minutes) : null;
    const intervalInput = document.getElementById('appointment-interval');
    const saveBtn = document.getElementById('save-appointment-interval');
    if (intervalInput && minutes) intervalInput.value = minutes;
    if (saveBtn) {
      saveBtn.addEventListener('click', async (ev) => {
        ev.preventDefault();
        const v = Number((document.getElementById('appointment-interval') || {}).value || 0);
        if (!v || v < 5) return showMessage(feedback, 'Ingresa un valor válido (>=5)');
        try {
          await api.updateScheduleSettings({ appointment_interval_minutes: v });
          showMessage(feedback, 'Intervalo guardado.', 'success');
        } catch (err) {
          showMessage(feedback, err.message);
        }
      });
    }
  } catch (err) {
    // ignore schedule settings load errors for now
  }
  // Load working hours and exceptions and wire add/delete
  try {
    const wh = await api.listWorkingHours();
    const list = Array.isArray(wh) ? wh : (wh && wh.data) || [];
    const container = document.getElementById('working-hours-list');
    if (container) {
      container.innerHTML = list.length ? list.map(w => {
        return `<div class="d-flex align-items-center gap-2 mb-2"><div class="flex-grow-1 small">${w.day_of_week === null ? 'Todos los días' : 'Día ' + w.day_of_week} ${w.start_time}-${w.end_time}${w.break_start ? ' (descanso ' + w.break_start + '-' + (w.break_end||'') + ')' : ''}</div><button class="btn btn-sm btn-outline-danger" data-delete-wh="${w.id}">Eliminar</button></div>`;
      }).join('') : '<div class="text-muted small">No hay reglas de horario.</div>';

      container.addEventListener('click', async (ev) => {
        const btn = ev.target.closest('[data-delete-wh]');
        if (!btn) return;
        const id = btn.getAttribute('data-delete-wh');
        try {
          await api.deleteWorkingHour(id);
          showMessage(feedback, 'Regla eliminada', 'success');
          loadAdminAppointments(mode);
        } catch (err) {
          showMessage(feedback, err.message);
        }
      });
    }

    const exceptions = await api.listScheduleExceptions();
    const exList = Array.isArray(exceptions) ? exceptions : (exceptions && exceptions.data) || [];
    const exContainer = document.getElementById('exceptions-list');
    if (exContainer) {
      exContainer.innerHTML = exList.length ? exList.map(e => `<div class="d-flex align-items-center gap-2 mb-2"><div class="flex-grow-1 small">${e.exception_date} ${e.start_time||''}-${e.end_time||''} ${e.reason||''}</div><button class="btn btn-sm btn-outline-danger" data-delete-ex="${e.id}">Eliminar</button></div>`).join('') : '<div class="text-muted small">No hay excepciones.</div>';
      exContainer.addEventListener('click', async (ev) => {
        const btn = ev.target.closest('[data-delete-ex]');
        if (!btn) return;
        const id = btn.getAttribute('data-delete-ex');
        try {
          await api.deleteScheduleException(id);
          showMessage(feedback, 'Excepción eliminada', 'success');
          loadAdminAppointments(mode);
        } catch (err) {
          showMessage(feedback, err.message);
        }
      });
    }

    // wire add forms
    const whForm = document.getElementById('working-hour-form');
    if (whForm) {
      whForm.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const day = String(document.getElementById('wh-day')?.value || '').trim();
        const start = String(document.getElementById('wh-start')?.value || '').trim();
        const end = String(document.getElementById('wh-end')?.value || '').trim();
        const breakStart = String(document.getElementById('wh-break-start')?.value || '').trim();
        const breakEnd = String(document.getElementById('wh-break-end')?.value || '').trim();
        if (!start || !end) return showMessage(feedback, 'Inicio y fin son obligatorios');
        try {
          await api.createWorkingHour({ day_of_week: day === '' ? null : Number(day), start_time: start, end_time: end, break_start: breakStart || null, break_end: breakEnd || null, applies_forever: true, active: true });
          showMessage(feedback, 'Regla guardada', 'success');
          loadAdminAppointments(mode);
        } catch (err) {
          showMessage(feedback, err.message);
        }
      });
    }

    const exForm = document.getElementById('exception-form');
    if (exForm) {
      exForm.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const date = String(document.getElementById('ex-date')?.value || '').trim();
        const s = String(document.getElementById('ex-start')?.value || '').trim();
        const e = String(document.getElementById('ex-end')?.value || '').trim();
        if (!date) return showMessage(feedback, 'Fecha requerida');
        try {
          await api.createScheduleException({ exception_date: date, start_time: s || null, end_time: e || null, reason: null });
          showMessage(feedback, 'Excepción guardada', 'success');
          loadAdminAppointments(mode);
        } catch (err) {
          showMessage(feedback, err.message);
        }
      });
    }
  } catch (err) {
    // ignore
  }
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

initMobileNavToggle();

async function loadClinicalRecords() {
  const feedback = document.querySelector('[data-records-feedback]');
  const usersContainer = document.querySelector('[data-records-users]');
  const detailContainer = document.querySelector('[data-records-detail]');
  if (!usersContainer || !detailContainer) return;
  clearMessage(feedback);
  usersContainer.innerHTML = '<div class="text-muted p-3">Cargando usuari@s...</div>';
  detailContainer.innerHTML = '<div class="text-center text-muted py-5">Selecciona un@ usuari@ para ver su expediente.</div>';
  try {
    const currentAdmin = await api.me().catch(() => null);
    const usersPayload = await api.listUsers();
    const users = Array.isArray(usersPayload?.data) ? usersPayload.data : usersPayload;
    if (!Array.isArray(users) || !users.length) {
      usersContainer.innerHTML = '<div class="text-muted p-3">No hay usuari@s.</div>';
      detailContainer.innerHTML = '<div class="text-muted p-3">Selecciona un@ usuari@ para ver su expediente.</div>';
      return;
    }
    const usersById = new Map();
    usersContainer.innerHTML = users.map(u => {
      usersById.set(String(u.id), u);
      return `<button class="list-group-item list-group-item-action" data-select-user="${escapeHtml(u.id)}">${escapeHtml(u.name)}<div class="small text-muted">${escapeHtml(u.phone)}</div></button>`;
    }).join('');

    const showUserDetail = async (id) => {
      const user = usersById.get(String(id));
      if (!user) return;
      detailContainer.innerHTML = '<div class="text-center text-muted py-5">Cargando expediente...</div>';
      try {
        const userAppointments = (await api.listAppointmentsByDay()) || [];
        const appointments = Array.isArray(userAppointments?.data) ? userAppointments.data : userAppointments;
        const filtered = (Array.isArray(appointments) ? appointments : []).filter(a => String(a.user_id) === String(id));
          detailContainer.innerHTML = `
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h5 class="mb-1">${escapeHtml(user.name)}</h5>
              <div class="small text-muted">${escapeHtml(user.phone)}</div>
              <div class="small text-muted mt-1">${user.sex ? 'Sexo: ' + escapeHtml(user.sex) : ''} ${user.birthdate ? ' • Nac.: ' + escapeHtml(user.birthdate) : ''} ${user.weight ? ' • Peso: ' + escapeHtml(user.weight) + 'kg' : ''}</div>
              <div class="small text-muted mt-1">${user.identification ? 'ID: ' + escapeHtml(user.identification) : ''} ${user.occupation ? ' • Ocupación: ' + escapeHtml(user.occupation) : ''}</div>
              ${currentAdmin && String(currentAdmin.id) === String(user.id) ? '<div class="badge bg-info mt-2">Admin (Actual)</div>' : ''}
            </div>
                ${!currentAdmin || String(currentAdmin.id) !== String(user.id) ? `<button class="btn btn-outline-danger btn-sm" type="button" data-delete-user="${escapeHtml(user.id)}">Eliminar usuari@</button>` : ''}
          </div>
              <div>
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <h6 class="mb-0">Historial de citas</h6>
                  <button class="btn btn-sm btn-primary" id="create-for-user-btn">Crear cita para este usuari@</button>
                </div>
                <div class="record-appointments-list">${filtered.length ? filtered.map(a => renderAppointmentItem(a, { mode: 'records' })).join('') : '<div class="text-muted">Sin citas</div>'}</div>
                <div class="mt-3 small"><strong>Particularidades / Observaciones:</strong><div class="text-muted">${escapeHtml(user.clinical_observations || '')}</div></div>
                <div id="create-for-user-form" class="mt-3 d-none">
                  <form class="row g-2" id="create-admin-appointment-form">
                    <div class="col-6"><label class="form-label small">Fecha</label><input class="form-control form-control-sm" name="date" type="date" required /></div>
                    <div class="col-6"><label class="form-label small">Hora</label><input class="form-control form-control-sm" name="time" type="time" step="60" required /></div>
                    <div class="col-12"><label class="form-label small">Descripción</label><textarea class="form-control form-control-sm" name="description" rows="2"></textarea></div>
                    <div class="col-12 text-end"><button class="btn btn-sm btn-success" type="submit">Crear cita</button></div>
                  </form>
                </div>
              </div>
        `;
        
        const delBtnEl = detailContainer.querySelector('[data-delete-user]');
        if (delBtnEl) {
          delBtnEl.addEventListener('click', async (ev) => {
          const deleteBtn = ev.currentTarget;
          const restore = setLoading(deleteBtn, 'Eliminando...');
          if (!(await showFloatingConfirm('¿Eliminar este usuari@ y todos sus datos?'))) {
            restore();
            return;
          }
          detailContainer.innerHTML = '<div class="text-muted p-3">Eliminando usuari@...</div>';
          usersContainer.innerHTML = '<div class="text-muted p-3">Actualizando lista...</div>';
          try {
            await api.deleteUser(user.id);
            showMessage(feedback, 'Usuari@ eliminado.', 'success');
            await loadClinicalRecords();
          } catch (err) {
            showMessage(feedback, err.message);
          } finally {
            restore();
          }
          });
        }
        // wire create-for-user form
        wireCreateForUser(detailContainer, user).catch(() => {});
      } catch (err) {
        showMessage(feedback, err.message);
      }
    };

    usersContainer.querySelectorAll('[data-select-user]').forEach(btn => {
      btn.addEventListener('click', () => showUserDetail(btn.getAttribute('data-select-user')));
    });
  } catch (err) {
    showMessage(feedback, err.message);
  }
}

// Wire creation form when user detail is shown
async function wireCreateForUser(detailContainer, user) {
  const createBtn = detailContainer.querySelector('#create-for-user-btn');
  const formWrap = detailContainer.querySelector('#create-for-user-form');
  const form = detailContainer.querySelector('#create-admin-appointment-form');
  if (!createBtn || !form) return;
  createBtn.addEventListener('click', () => {
    formWrap.classList.toggle('d-none');
  });
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const date = String(form.querySelector('[name="date"]').value || '').trim();
    const time = String(form.querySelector('[name="time"]').value || '').trim();
    const description = String(form.querySelector('[name="description"]').value || '').trim();
    if (!date || !time) return showMessage(detailContainer, 'Fecha y hora requeridas');
    try {
      await api.adminCreateAppointment({ userId: user.id, date, time, description });
      showMessage(detailContainer, 'Cita creada.', 'success');
      // refresh lists
      await loadClinicalRecords();
    } catch (err) {
      showMessage(detailContainer, err.message);
    }
  });
}

// Initialize
const appointmentsContainer = document.querySelector('[data-admin-appointments-list]');
if (appointmentsContainer) {
  loadAdminAppointments(adminPageMode);
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      loadAdminAppointments(adminPageMode);
    }
  });
  window.addEventListener('focus', () => loadAdminAppointments(adminPageMode));
}
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


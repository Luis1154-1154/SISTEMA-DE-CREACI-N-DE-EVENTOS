import { api } from './api-client.js';
import { requireSession } from './auth-guard.js';
import { clearMessage, escapeHtml, setLoading, showMessage } from './ui-utils.js';

function formatDateTime(dateStr, timeStr) {
  try {
    let dt;
    if (dateStr && dateStr.includes('T')) {
      dt = new Date(dateStr);
    } else if (dateStr && timeStr) {
      dt = new Date(`${dateStr}T${timeStr}`);
    } else if (dateStr) {
      dt = new Date(dateStr);
    } else {
      return { date: '', time: '' };
    }

    const dateFmt = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric' }).format(dt);
    const timeFmt = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(dt);
    return { date: dateFmt, time: timeFmt };
  } catch (error) {
    return { date: dateStr || '', time: timeStr || '' };
  }
}

function renderAppointmentCard(appointment) {
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
            <div class="alert alert-warning py-2 small mb-3">
              Procura cancelar con anticipación para no afectar la agenda.
            </div>
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
}

function isAuthError(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('no autenticado') || message.includes('no autorizado') || message.includes('token inválido');
}

async function loadUserAppointments() {
  const session = await requireSession();
  if (!session) return;

  // Show history link only for admin users
  const historyLink = document.getElementById('history-link');
  if (historyLink && session.role === 'admin') {
    historyLink.style.display = 'block';
  }

  const container = document.querySelector('[data-appointments-list]');
  const feedback = document.querySelector('[data-appointments-feedback]');
  if (!container) return;

  try {
    const payload = await api.listMyAppointmentsSelf();
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

    container.innerHTML = appointments.map(renderAppointmentCard).join('');
  } catch (error) {
    if (isAuthError(error)) {
      // Avoid immediate redirect to allow debugging and user retry.
      showMessage(feedback, `Error de autenticación: ${error.message}. Si esto persiste, cierra sesión e intenta iniciar de nuevo.`);
      console.error('Auth error when loading appointments:', error);
      return;
    }

    showMessage(feedback, error.message);
  }
}

const container = document.querySelector('[data-appointments-list]');
if (container) {
  clearMessage(document.querySelector('[data-appointments-feedback]'));

  container.addEventListener('click', async (event) => {
    const toggleButton = event.target.closest('[data-toggle-cancel]');
    if (toggleButton) {
      const id = toggleButton.getAttribute('data-toggle-cancel');
      const panel = container.querySelector(`[data-cancel-form="${CSS.escape(id)}"]`);
      if (panel) panel.classList.toggle('d-none');
      return;
    }

    const hideButton = event.target.closest('[data-cancel-hide]');
    if (hideButton) {
      const id = hideButton.getAttribute('data-cancel-hide');
      const panel = container.querySelector(`[data-cancel-form="${CSS.escape(id)}"]`);
      if (panel) panel.classList.add('d-none');
    }
  });

  container.addEventListener('submit', async (event) => {
    const form = event.target.closest('[data-cancel-form]');
    if (!form) return;

    event.preventDefault();
    const appointmentId = form.getAttribute('data-cancel-form');
    const feedback = form.querySelector('[data-cancel-feedback]');
    const reason = String(form.querySelector('[name="reason"]')?.value || '').trim();

    if (!reason) {
      showMessage(feedback, 'Indica el motivo de cancelación.');
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const restore = setLoading(submitButton, 'Cancelando...');
    try {
      await api.cancelAppointment(appointmentId, { reason });
      showMessage(document.querySelector('[data-appointments-feedback]'), 'Cita cancelada correctamente.', 'success');
      await loadUserAppointments();
    } catch (error) {
      showMessage(feedback, error.message);
    } finally {
      restore();
    }
  });

  loadUserAppointments();
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    api.clearAuthToken();
    window.location.assign('./index.html');
  });
}

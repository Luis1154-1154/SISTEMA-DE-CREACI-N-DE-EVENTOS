import { api } from './api-client.js';
import { requireSession } from './auth-guard.js';
import { clearMessage, escapeHtml, showMessage } from './ui-utils.js';

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

function renderHistoryCard(appointment) {
  const formatted = formatDateTime(appointment.date, appointment.time);
  const status = String(appointment.status || 'pending').toLowerCase();

  return `
    <div class="col-12 col-md-6 col-xl-4">
      <article class="card appointment-card h-100 border-0 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
            <div>
              <p class="text-uppercase text-muted small mb-1">Cita</p>
              <h2 class="h5 mb-0">${escapeHtml(formatted.date)}</h2>
            </div>
            <span class="badge ${statusBadgeClass(status)}">${escapeHtml(statusText(status))}</span>
          </div>
          <div class="d-flex align-items-center justify-content-between gap-3 mb-3">
            <span class="badge text-bg-primary">${escapeHtml(formatted.time)}</span>
            <span class="text-muted small">${escapeHtml(appointment.phone || '')}</span>
          </div>
          <p class="text-muted mb-2">${escapeHtml(appointment.description || 'Sin descripción')}</p>
          ${status === 'canceled' && appointment.cancel_reason ? `<div class="alert alert-warning py-2 small mb-0">Motivo de cancelación: ${escapeHtml(appointment.cancel_reason)}</div>` : ''}
        </div>
      </article>
    </div>
  `;
}

function isAuthError(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('no autenticado') || message.includes('no autorizado') || message.includes('token inválido');
}

async function loadHistory() {
  const session = await requireSession();
  if (!session) return;

  const container = document.querySelector('[data-history-list]');
  const feedback = document.querySelector('[data-history-feedback]');
  if (!container) return;

  try {
    const payload = await api.listMyAppointmentHistory();
    const appointments = Array.isArray(payload?.data) ? payload.data : payload;

    if (!appointments || appointments.length === 0) {
      container.innerHTML = `
        <div class="col-12">
          <div class="empty-state card border-0 shadow-sm">
            <div class="card-body text-center py-5">
              <h2 class="h5 mb-2">Aún no tienes historial</h2>
              <p class="mb-0 text-muted">Cuando existan citas atendidas o canceladas aparecerán aquí.</p>
            </div>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = appointments.map(renderHistoryCard).join('');
  } catch (error) {
    if (isAuthError(error)) {
      window.location.assign('./login.html');
      return;
    }

    showMessage(feedback, error.message);
  }
}

const container = document.querySelector('[data-history-list]');
if (container) {
  clearMessage(document.querySelector('[data-history-feedback]'));
  loadHistory();
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

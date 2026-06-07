import { api } from './api-client.js';
import { requireSession } from './auth-guard.js';
import { clearMessage, escapeHtml, showMessage } from './ui-utils.js';

function formatDateTime(dateStr, timeStr) {
  try {
    let dt;
    if (dateStr && dateStr.includes('T')) {
      dt = new Date(dateStr);
    } else if (dateStr && timeStr) {
      // combine date and time into an ISO-like string (treated as local)
      dt = new Date(`${dateStr}T${timeStr}`);
    } else if (dateStr) {
      dt = new Date(dateStr);
    } else {
      return { date: '', time: '' };
    }

    const dateFmt = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric' }).format(dt);
    const timeFmt = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(dt);
    return { date: dateFmt, time: timeFmt };
  } catch (e) {
    return { date: dateStr || '', time: timeStr || '' };
  }
}

async function loadUserAppointments() {
  const session = await requireSession('user');
  if (!session) return;

  const container = document.querySelector('[data-appointments-list]');
  const feedback = document.querySelector('[data-appointments-feedback]');
  if (!container) return;

  try {
    const payload = await api.listMyAppointments();
    const appointments = Array.isArray(payload?.data) ? payload.data : payload;

    if (!appointments || appointments.length === 0) {
      container.innerHTML = '<div class="col-12"><div class="empty-state card border-0 shadow-sm"><div class="card-body text-center py-5"><h2 class="h5 mb-2">Todavía no tienes citas</h2><p class="mb-0 text-muted">Agenda tu primera cita para verla aquí.</p></div></div></div>';
      return;
    }

    container.innerHTML = appointments
      .map((appointment) => `
        <div class="col-12 col-md-6 col-xl-4">
          <article class="card appointment-card h-100 border-0 shadow-sm">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
                <div>
                  <p class="text-uppercase text-muted small mb-1">Cita agendada</p>
                  ${(() => {
                    const f = formatDateTime(appointment.date, appointment.time);
                    return `<h2 class="h5 mb-0">${escapeHtml(f.date)}</h2>`;
                  })()}
                </div>
                ${(() => {
                  const f = formatDateTime(appointment.date, appointment.time);
                  return `<span class="badge text-bg-primary">${escapeHtml(f.time)}</span>`;
                })()}
              </div>
              <p class="text-muted mb-0">${escapeHtml(appointment.description || 'Sin descripción')}</p>
            </div>
          </article>
        </div>
      `)
      .join('');
  } catch (error) {
    showMessage(feedback, error.message);
  }
}

const container = document.querySelector('[data-appointments-list]');
if (container) {
  clearMessage(document.querySelector('[data-appointments-feedback]'));
  loadUserAppointments();
}

// logout button handler
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    }
    window.location.assign('./index.html');
  });
}

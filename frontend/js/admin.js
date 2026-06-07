import { api } from './api-client.js';
import { requireSession } from './auth-guard.js';
import { clearMessage, escapeHtml, showMessage } from './ui-utils.js';

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
  } catch (e) {
    return { date: dateStr || '', time: timeStr || '' };
  }
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
      container.innerHTML = '<div class="col-12"><div class="card border-0 shadow-sm"><div class="card-body text-center py-5"><h2 class="h5 mb-2">No hay citas registradas</h2><p class="mb-0 text-muted">Cuando entren citas, aparecerán organizadas por día.</p></div></div></div>';
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
              ${groups[day]
                .map(
                  (appointment) => `
                    <div class="list-group-item py-3">
                      <div class="d-flex flex-column flex-md-row justify-content-between gap-3">
                        <div>
                          <div class="fw-semibold mb-1">${escapeHtml(appointment.name || 'Paciente')}</div>
                          <div class="text-muted small">${escapeHtml(appointment.phone || '')}</div>
                          <div class="text-muted small">${escapeHtml(formatDateTime(appointment.date, appointment.time).time || appointment.time || '')}</div>
                          <div class="mt-2">${escapeHtml(appointment.description || 'Sin descripción')}</div>
                        </div>
                        <div class="text-md-end">
                          <button class="btn btn-outline-danger btn-sm" data-delete-appointment="${escapeHtml(appointment.id || appointment._id)}">Eliminar</button>
                        </div>
                      </div>
                    </div>
                  `,
                )
                .join('')}
            </div>
          </section>
        </div>
      `)
      .join('');

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
  } catch (error) {
    showMessage(feedback, error.message);
  }
}

const container = document.querySelector('[data-admin-appointments-list]');
if (container) {
  clearMessage(document.querySelector('[data-admin-feedback]'));
  loadAdminAppointments();
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

// admin create form
const adminForm = document.getElementById('admin-create-form');
if (adminForm) {
  adminForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(adminForm);
    const rawPhone = formData.get('phone')?.trim();
    const payload = {
      name: formData.get('name')?.trim(),
      phone: rawPhone && rawPhone.length ? rawPhone : null,
      date: formData.get('date')?.trim(),
      time: formData.get('time')?.trim(),
      description: formData.get('description')?.trim()
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

import { api } from './api-client.js';
import { authGuard } from './api-client.js';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

async function loadSchedule() {
  const feedbackEl = document.querySelector('[data-schedule-feedback]');
  const tbody = document.getElementById('working-hours-body');
  const exceptionsList = document.getElementById('exceptions-list');
  const exceptionsEmpty = document.getElementById('exceptions-empty');

  try {
    // Fetch working hours and exceptions in parallel
    const [workingHours, exceptions] = await Promise.all([
      api.listWorkingHours(),
      api.listScheduleExceptions(),
    ]);

    // Render working hours
    if (workingHours && workingHours.length > 0) {
      tbody.innerHTML = workingHours
        .sort((a, b) => a.day_of_week - b.day_of_week)
        .map((wh) => {
          const dayName = DAY_NAMES[wh.day_of_week] || `Día ${wh.day_of_week}`;
          const start = wh.start_time ? wh.start_time.slice(0, 5) : '-';
          const end = wh.end_time ? wh.end_time.slice(0, 5) : '-';
          const breakTime =
            wh.break_start && wh.break_end
              ? `${wh.break_start.slice(0, 5)} - ${wh.break_end.slice(0, 5)}`
              : 'Sin descanso';
          return `<tr><td>${dayName}</td><td>${start}</td><td>${end}</td><td>${breakTime}</td></tr>`;
        })
        .join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">No hay horarios configurados.</td></tr>';
    }

    // Render exceptions
    if (exceptions && exceptions.length > 0) {
      exceptionsEmpty.classList.add('d-none');
      exceptionsList.innerHTML = exceptions
        .sort((a, b) => a.exception_date.localeCompare(b.exception_date))
        .map((ex) => {
          const date = new Date(ex.exception_date + 'T00:00:00');
          const dateStr = date.toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
          const start = ex.start_time ? ex.start_time.slice(0, 5) : 'Cerrado';
          const end = ex.end_time ? ex.end_time.slice(0, 5) : '';
          const hours = start && end ? `${start} - ${end}` : 'Día sin atención';
          return `<div class="border-bottom py-2"><strong>${dateStr}</strong><br /><span class="text-muted">${hours}</span></div>`;
        })
        .join('');
    } else {
      exceptionsEmpty.classList.remove('d-none');
      exceptionsList.innerHTML = '';
    }
  } catch (err) {
    console.error('Error al cargar horario:', err);
    feedbackEl.innerHTML = `<div class="alert alert-danger mb-0">Error al cargar el horario: ${err.message}</div>`;
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger py-3">Error al cargar datos.</td></tr>';
  }
}

// Wait for auth guard then load
authGuard()
  .then(() => loadSchedule())
  .catch(() => {
    // authGuard will redirect to login if not authenticated
  });
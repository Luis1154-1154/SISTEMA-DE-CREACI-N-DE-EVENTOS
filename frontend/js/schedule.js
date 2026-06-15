import { api } from './api-client.js';
import { authGuard } from './api-client.js';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAY_NAMES_SHORT = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

function formatTime(timeStr) {
  if (!timeStr) return null;
  return timeStr.slice(0, 5);
}

function buildScheduleText(workingHours) {
  if (!workingHours || workingHours.length === 0) return null;

  // Sort by day of week
  const sorted = [...workingHours].sort((a, b) => a.day_of_week - b.day_of_week);

  // Group by start_time, end_time, break_start, break_end (same schedule pattern)
  const groups = [];
  let currentGroup = null;

  for (const wh of sorted) {
    const key = `${wh.start_time}|${wh.end_time}|${wh.break_start || ''}|${wh.break_end || ''}`;
    if (!currentGroup || currentGroup.key !== key) {
      currentGroup = { key, days: [], start: wh.start_time, end: wh.end_time, breakStart: wh.break_start, breakEnd: wh.break_end };
      groups.push(currentGroup);
    }
    currentGroup.days.push(wh.day_of_week);
  }

  return groups.map((g) => {
    const start = formatTime(g.start);
    const end = formatTime(g.end);

    // Format days list
    let daysStr;
    if (g.days.length === 1) {
      daysStr = DAY_NAMES_SHORT[g.days[0]];
    } else {
      // Check if consecutive
      const isConsecutive = g.days.every((d, i) => i === 0 || d === g.days[i - 1] + 1);
      if (isConsecutive && g.days.length > 1) {
        daysStr = `${DAY_NAMES_SHORT[g.days[0]]} a ${DAY_NAMES_SHORT[g.days[g.days.length - 1]]}`;
      } else {
        daysStr = g.days.map((d) => DAY_NAMES_SHORT[d]).join(', ');
      }
    }

    // Capitalize first letter
    daysStr = daysStr.charAt(0).toUpperCase() + daysStr.slice(1);

    let text = `Abrimos ${daysStr} de ${start} a ${end}`;

    if (g.breakStart && g.breakEnd) {
      const breakStart = formatTime(g.breakStart);
      const breakEnd = formatTime(g.breakEnd);
      text += ` con descanso de ${breakStart} a ${breakEnd}`;
    }

    return text + '.';
  }).join(' ');
}

function buildExceptionsText(exceptions) {
  if (!exceptions || exceptions.length === 0) return null;

  const lines = exceptions
    .sort((a, b) => a.exception_date.localeCompare(b.exception_date))
    .map((ex) => {
      const date = new Date(ex.exception_date + 'T00:00:00');
      const dateStr = date.toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const start = ex.start_time ? formatTime(ex.start_time) : null;
      const end = ex.end_time ? formatTime(ex.end_time) : null;

      if (start && end) {
        return `${dateStr}: atenderemos de ${start} a ${end}.`;
      }
      return `${dateStr}: no habrá atención.`;
    });

  return 'Excepciones: ' + lines.join(' ');
}

async function loadSchedule() {
  const feedbackEl = document.querySelector('[data-schedule-feedback]');
  const scheduleDisplay = document.getElementById('schedule-display');
  const scheduleText = document.getElementById('schedule-text');
  const exceptionsText = document.getElementById('exceptions-text');
  const noSchedule = document.getElementById('no-schedule');

  try {
    const [workingHours, exceptions] = await Promise.all([
      api.listWorkingHours(),
      api.listScheduleExceptions(),
    ]);

    const text = buildScheduleText(workingHours);
    const excText = buildExceptionsText(exceptions);

    if (text) {
      scheduleDisplay.style.display = '';
      noSchedule.style.display = 'none';
      scheduleText.textContent = text;
      exceptionsText.textContent = excText || '';
    } else {
      scheduleDisplay.style.display = 'none';
      noSchedule.style.display = '';
    }
  } catch (err) {
    console.error('Error al cargar horario:', err);
    scheduleDisplay.style.display = 'none';
    noSchedule.style.display = 'none';
    feedbackEl.innerHTML = `<div class="alert alert-danger mb-0">Error al cargar el horario: ${err.message}</div>`;
  }
}

// Wait for auth guard then load
authGuard()
  .then(() => loadSchedule())
  .catch(() => {
    // authGuard will redirect to login if not authenticated
  });
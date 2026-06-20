import { api } from './api-client.js';

const DAY_NAMES_SHORT = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

function formatTime(timeStr) {
  if (!timeStr) return null;
  return timeStr.slice(0, 5);
}

function buildScheduleText(workingHours) {
  if (!workingHours || workingHours.length === 0) return null;

  // Sort by day_of_week with nulls (all days) first
  const sorted = [...workingHours].sort((a, b) => {
    if (a.day_of_week === null || a.day_of_week === undefined) return -1;
    if (b.day_of_week === null || b.day_of_week === undefined) return 1;
    return a.day_of_week - b.day_of_week;
  });

  // Group by same time pattern
  const groups = [];
  let currentGroup = null;

  for (const wh of sorted) {
    const key = `${wh.start_time}|${wh.end_time}|${wh.break_start || ''}|${wh.break_end || ''}`;
    if (!currentGroup || currentGroup.key !== key) {
      currentGroup = { key, days: [], start: wh.start_time, end: wh.end_time, breakStart: wh.break_start, breakEnd: wh.break_end };
      groups.push(currentGroup);
    }
    currentGroup.days.push(wh.day_of_week !== null && wh.day_of_week !== undefined ? wh.day_of_week : null);
  }

  return groups.map((g) => {
    const start = formatTime(g.start);
    const end = formatTime(g.end);

    // Format days list
    let daysStr;

    // Check if any day is null (all days / todos)
    const hasNullDay = g.days.some((d) => d === null);

    if (hasNullDay) {
      daysStr = 'todos los días';
    } else {
      // Remove duplicates and sort
      const uniqueDays = [...new Set(g.days)].sort((a, b) => a - b);

      if (uniqueDays.length === 1) {
        daysStr = DAY_NAMES_SHORT[uniqueDays[0]];
      } else if (uniqueDays.length === 7) {
        daysStr = 'todos los días';
      } else {
        // Check if consecutive
        const isConsecutive = uniqueDays.every((d, i) => i === 0 || d === uniqueDays[i - 1] + 1);
        if (isConsecutive && uniqueDays.length > 1) {
          daysStr = `${DAY_NAMES_SHORT[uniqueDays[0]]} a ${DAY_NAMES_SHORT[uniqueDays[uniqueDays.length - 1]]}`;
        } else {
          daysStr = uniqueDays.map((d) => DAY_NAMES_SHORT[d]).join(', ');
        }
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
    const [workingHours, exceptions, settings] = await Promise.all([
      api.listWorkingHours(),
      api.listScheduleExceptions(),
      api.getScheduleSettings().catch(() => null),
    ]);

    const text = buildScheduleText(workingHours);
    const excText = buildExceptionsText(exceptions);

    if (text) {
      const interval = settings && settings.appointment_interval_minutes ? Number(settings.appointment_interval_minutes) : 30;
      const intervalText = `Las citas se agendan cada ${interval} minutos.`;
      scheduleDisplay.style.display = '';
      noSchedule.style.display = 'none';
      scheduleText.innerHTML = text + '<br /><span class="text-muted" style="font-size: 0.9rem;">' + intervalText + '</span>';
      exceptionsText.textContent = excText || '';
    } else {
      scheduleDisplay.style.display = 'none';
      noSchedule.style.display = '';
      document.querySelector('[data-schedule-feedback]').innerHTML = '<div class="text-center text-muted py-3">Cargando horario...</div>';
    }
  } catch (err) {
    console.error('Error al cargar horario:', err);
    scheduleDisplay.style.display = 'none';
    noSchedule.style.display = 'none';
    feedbackEl.innerHTML = `<div class="alert alert-danger mb-0">Error al cargar el horario: ${err.message}</div>`;
  }
}

// Load the schedule directly — GET endpoints are public
loadSchedule();

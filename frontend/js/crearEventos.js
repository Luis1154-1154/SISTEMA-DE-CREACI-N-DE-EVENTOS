(function() {
  // Bloquear acceso si el usuario no es organizador ni administrador
  const roleRaw = localStorage.getItem('userRole');
  const role = (roleRaw || '').toString().trim().toLowerCase();
  const email = localStorage.getItem('currentUserEmail');
  if (!email) {
    window.location.href = 'inicioDeSesión.html';
  } else if (role !== 'organizador' && role !== 'administrador') {
    alert('Solo usuarios con rol Organizador o Administrador pueden crear eventos.');
    window.location.href = 'eventos.html';
  }

  const form = document.querySelector('form');
  if (!form) return;

  // Función para validar campos obligatorios
  function validarFormulario() {
    const nombre = document.getElementById('eventName').value.trim();
    const fecha = document.getElementById('eventDate').value.trim();
    const hora = document.getElementById('eventTime').value.trim();
    const ubicacion = document.getElementById('eventLocation').value.trim();
    const invitados = document.getElementById('eventGuests').value.trim();

    const errores = [];

    // Validar nombre
    if (!nombre || nombre.length === 0) {
      errores.push('El nombre del evento es obligatorio.');
    } else if (nombre.length < 3) {
      errores.push('El nombre del evento debe tener al menos 3 caracteres.');
    }

    // Validar fecha
    if (!fecha) {
      errores.push('La fecha del evento es obligatoria.');
    } else {
      const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!fechaRegex.test(fecha)) {
        errores.push('La fecha no es válida.');
      }
    }

    // Validar hora
    if (!hora) {
      errores.push('La hora del evento es obligatoria.');
    } else {
      const horaRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!horaRegex.test(hora)) {
        errores.push('La hora no es válida.');
      }
    }

    // Validar ubicación
    if (!ubicacion || ubicacion.length === 0) {
      errores.push('La ubicación del evento es obligatoria.');
    } else if (ubicacion.length < 3) {
      errores.push('La ubicación debe tener al menos 3 caracteres.');
    }

    // Validar invitados
    if (!invitados) {
      errores.push('La capacidad máxima de invitados es obligatoria.');
    } else {
      const invitadosNum = parseInt(invitados);
      if (isNaN(invitadosNum) || invitadosNum <= 0) {
        errores.push('La capacidad máxima de invitados debe ser mayor a 0.');
      }
    }

    return errores;
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    // Re-check role before allowing submit (defense in depth)
    const roleNow = (localStorage.getItem('userRole') || '').toString().trim().toLowerCase();
    if (roleNow !== 'organizador' && roleNow !== 'administrador') {
      alert('No tienes permiso para crear eventos. Solo usuarios con rol Organizador o Administrador pueden crear eventos.');
      window.location.href = 'eventos.html';
      return;
    }

    // Validar campos antes de guardar
    const errores = validarFormulario();
    if (errores.length > 0) {
      alert('Por favor, completa los siguientes campos:\n\n' + errores.join('\n'));
      return;
    }

    // Capturar datos del formulario
    const eventData = {
      id: 'evento_' + Date.now(),
      nombre: document.getElementById('eventName').value.trim(),
      fecha: document.getElementById('eventDate').value,
      hora: document.getElementById('eventTime').value,
      lugar: document.getElementById('eventLocation').value.trim(),
      capacidad: document.getElementById('eventGuests').value,
      descripcion: document.getElementById('eventDescription').value.trim(),
      estatus: document.getElementById('eventStatus').value,
      metodo_inscripcion: document.getElementById('eventMethod').value,
      tipo: document.getElementById('eventTipo').value,
      organizador: localStorage.getItem('currentUserEmail') || 'Usuario',
      fechaTexto: new Date(document.getElementById('eventDate').value).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
      seccion: document.getElementById('eventTipo').value
    };

    // Guardar evento en localStorage
    const key = 'user_created_events';
    let eventos = JSON.parse(localStorage.getItem(key) || '[]');
    eventos.push(eventData);
    localStorage.setItem(key, JSON.stringify(eventos));

    alert('Evento creado correctamente.');
    // Redirigir a eventos
    window.location.href = 'eventos.html';
  });
})();

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

  function getCurrentRole() {
    return (localStorage.getItem('userRole') || '').toString().trim().toLowerCase();
  }

  function validarFormulario() {
    const nombre = document.getElementById('eventName').value.trim();
    const fecha = document.getElementById('eventDate').value.trim();
    const hora = document.getElementById('eventTime').value.trim();
    const ubicacion = document.getElementById('eventLocation').value.trim();
    const invitados = document.getElementById('eventGuests').value.trim();

    const errores = [];

    if (!nombre || nombre.length === 0) {
      errores.push('El nombre del evento es obligatorio.');
    } else if (nombre.length < 3) {
      errores.push('El nombre del evento debe tener al menos 3 caracteres.');
    }

    if (!fecha) {
      errores.push('La fecha del evento es obligatoria.');
    } else {
      const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!fechaRegex.test(fecha)) {
        errores.push('La fecha no es válida.');
      }
    }

    if (!hora) {
      errores.push('La hora del evento es obligatoria.');
    } else {
      const horaRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!horaRegex.test(hora)) {
        errores.push('La hora no es válida.');
      }
    }

    if (!ubicacion || ubicacion.length === 0) {
      errores.push('La ubicación del evento es obligatoria.');
    } else if (ubicacion.length < 3) {
      errores.push('La ubicación debe tener al menos 3 caracteres.');
    }

    if (!invitados) {
      errores.push('La capacidad máxima de invitados es obligatoria.');
    } else {
      const invitadosNum = Number(invitados);
      if (!Number.isInteger(invitadosNum) || invitadosNum <= 0) {
        errores.push('La capacidad máxima de invitados debe ser un entero mayor a 0.');
      }
    }

    return errores;
  }

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const roleNow = getCurrentRole();
    if (roleNow !== 'organizador' && roleNow !== 'administrador') {
      alert('No tienes permiso para crear eventos. Solo usuarios con rol Organizador o Administrador pueden crear eventos.');
      window.location.href = 'eventos.html';
      return;
    }

    const errores = validarFormulario();
    if (errores.length > 0) {
      alert('Por favor, completa los siguientes campos:\n\n' + errores.join('\n'));
      return;
    }

    const capacidad = Number(document.getElementById('eventGuests').value);
    const eventData = {
      nombre: document.getElementById('eventName').value.trim(),
      fecha: document.getElementById('eventDate').value,
      hora: document.getElementById('eventTime').value,
      ubicacion: document.getElementById('eventLocation').value.trim(),
      descripcion: document.getElementById('eventDescription').value.trim(),
      organizador: localStorage.getItem('currentUserEmail') || 'Usuario',
      categoria_id: null,
      capacidad,
      invitados: capacidad,
      estatus: document.getElementById('eventStatus').value,
      metodo_inscripcion: document.getElementById('eventMethod').value,
      tipo: document.getElementById('eventTipo').value
    };

    try {
      const response = await apiFetch('/api/eventos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      const result = await response.json();
      if (!response.ok) {
        const mensaje = Array.isArray(result.errores) && result.errores.length > 0
          ? result.errores.join('\n')
          : (result.error || result.message || 'No se pudo crear el evento.');
        alert(mensaje);
        return;
      }

      alert('Evento creado correctamente.');
      window.location.href = 'eventos.html';
    } catch (error) {
      alert('No se pudo conectar con el servidor: ' + error.message);
    }
  });
})();

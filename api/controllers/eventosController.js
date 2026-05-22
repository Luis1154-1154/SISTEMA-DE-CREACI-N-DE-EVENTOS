const Evento = require('../models/Eventos');

exports.getAllEventos = (req, res) => {
  console.log('getAllEventos called:', req.method, req.originalUrl);
  Evento.getAllEventos((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(results);
  });
};

exports.getEventoById = (req, res) => {
  const { id } = req.params;

  Evento.getEventoById(id, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results.length) return res.status(404).json({ message: 'Evento no encontrado' });

    res.status(200).json(results[0]);
  });
};

exports.addEvento = (req, res) => {
  const { nombre, fecha, hora, ubicacion, descripcion, organizador, categoria_id, invitados, capacidad, estatus, metodo_inscripcion, tipo } = req.body;

  // Validar todos los campos obligatorios de forma estricta
  const errores = [];
  
  // Validar nombre
  if (typeof nombre !== 'string' || nombre.trim() === '') {
    errores.push('El nombre del evento es obligatorio y debe ser un texto válido.');
  }
  
  // Validar fecha (debe ser una fecha válida)
  if (!fecha || fecha.trim() === '') {
    errores.push('La fecha del evento es obligatoria.');
  } else {
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fecha)) {
      errores.push('La fecha debe estar en formato YYYY-MM-DD.');
    }
  }
  
  // Validar hora (debe ser un formato válido HH:MM)
  if (!hora || hora.trim() === '') {
    errores.push('La hora del evento es obligatoria.');
  } else {
    const horaRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!horaRegex.test(hora)) {
      errores.push('La hora debe estar en formato HH:MM (24 horas).');
    }
  }
  
  // Validar ubicación
  if (typeof ubicacion !== 'string' || ubicacion.trim() === '') {
    errores.push('La ubicación del evento es obligatoria y debe ser un texto válido.');
  }
  
  // Validar capacidad de invitados
  const capacidadValor = capacidad ?? invitados;
  const invitadosNum = parseInt(capacidadValor, 10);
  if (capacidadValor === undefined || capacidadValor === null || capacidadValor === '' || isNaN(invitadosNum) || invitadosNum <= 0) {
    errores.push('La capacidad máxima de invitados es obligatoria y debe ser mayor a 0.');
  }

  // Si hay errores, enviar respuesta con todos los errores
  if (errores.length > 0) {
    return res.status(400).json({
      message: 'Validación fallida. Por favor, completa todos los campos obligatorios correctamente.',
      errores: errores,
      success: false
    });
  }

  const payload = {
    nombre: nombre.trim(),
    fecha,
    hora,
    ubicacion: ubicacion.trim(),
    descripcion: descripcion || '',
    organizador: organizador || 'Sin especificar',
    categoria_id,
    capacidad: invitadosNum,
    estatus: estatus || 'activo',
    metodo_inscripcion: metodo_inscripcion || 'gratuito',
    tipo: tipo || null
  };

  Evento.addEvento(payload, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Evento creado exitosamente', id: result.insertId, success: true });
  });
};

exports.updateEvento = (req, res) => {
  const { id } = req.params;
  const { nombre, fecha, hora, ubicacion, descripcion, organizador, categoria_id, invitados, capacidad, estatus, metodo_inscripcion, tipo } = req.body;

  // Validar todos los campos obligatorios de forma estricta
  const errores = [];
  
  // Validar nombre
  if (typeof nombre !== 'string' || nombre.trim() === '') {
    errores.push('El nombre del evento es obligatorio y debe ser un texto válido.');
  }
  
  // Validar fecha (debe ser una fecha válida)
  if (!fecha || fecha.trim() === '') {
    errores.push('La fecha del evento es obligatoria.');
  } else {
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fecha)) {
      errores.push('La fecha debe estar en formato YYYY-MM-DD.');
    }
  }
  
  // Validar hora (debe ser un formato válido HH:MM)
  if (!hora || hora.trim() === '') {
    errores.push('La hora del evento es obligatoria.');
  } else {
    const horaRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!horaRegex.test(hora)) {
      errores.push('La hora debe estar en formato HH:MM (24 horas).');
    }
  }
  
  // Validar ubicación
  if (typeof ubicacion !== 'string' || ubicacion.trim() === '') {
    errores.push('La ubicación del evento es obligatoria y debe ser un texto válido.');
  }
  
  // Validar capacidad de invitados (si se proporciona)
  if (invitados || capacidad) {
    const capacidadValor = capacidad ?? invitados;
    const invitadosNum = parseInt(capacidadValor, 10);
    if (isNaN(invitadosNum) || invitadosNum <= 0) {
      errores.push('La capacidad máxima de invitados debe ser mayor a 0.');
    }
  }

  // Si hay errores, enviar respuesta con todos los errores
  if (errores.length > 0) {
    return res.status(400).json({
      message: 'Validación fallida. Por favor, completa todos los campos obligatorios correctamente.',
      errores: errores,
      success: false
    });
  }

  const payload = {
    nombre: nombre.trim(),
    fecha,
    hora,
    ubicacion: ubicacion.trim(),
    descripcion: descripcion || '',
    organizador: organizador || 'Sin especificar',
    categoria_id,
    capacidad: capacidad ? parseInt(capacidad, 10) : (invitados ? parseInt(invitados, 10) : null),
    estatus: estatus || 'activo',
    metodo_inscripcion: metodo_inscripcion || 'gratuito',
    tipo: tipo || null
  };

  Evento.updateEvento(id, payload, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result.affectedRows) return res.status(404).json({ message: 'Evento no encontrado' });
    res.status(200).json({ message: 'Evento actualizado exitosamente', success: true });
  });
};

exports.deleteEvento = (req, res) => {
  const { id } = req.params;

  Evento.deleteEvento(id, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result.affectedRows) return res.status(404).json({ message: 'Evento no encontrado' });
    res.status(200).json({ message: 'Evento eliminado' });
  });
};

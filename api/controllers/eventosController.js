const Evento = require('../models/Eventos');

exports.getAllEventos = (req, res) => {
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
  const { nombre, fecha, hora, ubicacion, descripcion, organizador, categoria_id } = req.body;

  if (!nombre || !fecha || !hora || !ubicacion) {
    return res.status(400).json({
      message: 'Los campos nombre, fecha, hora y ubicacion son obligatorios.'
    });
  }

  const payload = {
    nombre,
    fecha,
    hora,
    ubicacion,
    descripcion,
    organizador,
    categoria_id
  };

  Evento.addEvento(payload, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Evento creado', id: result.insertId });
  });
};

exports.updateEvento = (req, res) => {
  const { id } = req.params;
  const { nombre, fecha, hora, ubicacion, descripcion, organizador, categoria_id } = req.body;

  if (!nombre || !fecha || !hora || !ubicacion) {
    return res.status(400).json({
      message: 'Los campos nombre, fecha, hora y ubicacion son obligatorios.'
    });
  }

  const payload = {
    nombre,
    fecha,
    hora,
    ubicacion,
    descripcion,
    organizador,
    categoria_id
  };

  Evento.updateEvento(id, payload, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result.affectedRows) return res.status(404).json({ message: 'Evento no encontrado' });
    res.status(200).json({ message: 'Evento actualizado' });
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

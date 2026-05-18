const Participante = require('../models/Participantes');

exports.getAllParticipantes = (req, res) => {
  Participante.getAllParticipantes((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(results);
  });
};

exports.getParticipanteById = (req, res) => {
  const { id } = req.params;
  Participante.getParticipanteById(id, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results.length) return res.status(404).json({ message: 'Participante no encontrado' });
    res.status(200).json(results[0]);
  });
};

exports.addParticipante = (req, res) => {
  const { nombre, email, telefono } = req.body;
  if (!nombre || !email) {
    return res.status(400).json({ message: 'Los campos nombre y email son obligatorios.' });
  }

  Participante.addParticipante({ nombre, email, telefono }, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Participante creado', id: result.insertId });
  });
};

exports.updateParticipante = (req, res) => {
  const { id } = req.params;
  const { nombre, email, telefono } = req.body;
  if (!nombre || !email) {
    return res.status(400).json({ message: 'Los campos nombre y email son obligatorios.' });
  }

  Participante.updateParticipante(id, { nombre, email, telefono }, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result.affectedRows) return res.status(404).json({ message: 'Participante no encontrado' });
    res.status(200).json({ message: 'Participante actualizado' });
  });
};

exports.deleteParticipante = (req, res) => {
  const { id } = req.params;
  Participante.deleteParticipante(id, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result.affectedRows) return res.status(404).json({ message: 'Participante no encontrado' });
    res.status(200).json({ message: 'Participante eliminado' });
  });
};

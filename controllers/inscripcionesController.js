const Inscripcion = require('../models/Inscripciones');

exports.getInscripcionesByEvento = (req, res) => {
  const { eventoId } = req.params;
  Inscripcion.getByEvento(eventoId, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(results);
  });
};

exports.addInscripcion = (req, res) => {
  const { evento_id, participante_id, asistio } = req.body;

  if (!evento_id || !participante_id) {
    return res.status(400).json({ message: 'evento_id y participante_id son obligatorios.' });
  }

  Inscripcion.addInscripcion({ evento_id, participante_id, asistio }, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Inscripcion creada', id: result.insertId });
  });
};

exports.updateAsistencia = (req, res) => {
  const { id } = req.params;
  const { asistio } = req.body;

  if (asistio !== 0 && asistio !== 1) {
    return res.status(400).json({ message: 'asistio debe ser 0 o 1.' });
  }

  Inscripcion.updateAsistencia(id, asistio, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result.affectedRows) return res.status(404).json({ message: 'Inscripcion no encontrada' });
    res.status(200).json({ message: 'Asistencia actualizada' });
  });
};

exports.deleteInscripcion = (req, res) => {
  const { id } = req.params;
  Inscripcion.deleteInscripcion(id, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result.affectedRows) return res.status(404).json({ message: 'Inscripcion no encontrada' });
    res.status(200).json({ message: 'Inscripcion eliminada' });
  });
};

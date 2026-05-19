const Lugar = require('../models/Lugares');

exports.getAllLugares = (req, res) => {
  Lugar.getAllLugares((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(results);
  });
};

exports.getLugarById = (req, res) => {
  const { id } = req.params;
  Lugar.getLugarById(id, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results.length) return res.status(404).json({ message: 'Lugar no encontrado' });
    res.status(200).json(results[0]);
  });
};

exports.addLugar = (req, res) => {
  const { nombre, direccion, capacidad } = req.body;
  if (!nombre) return res.status(400).json({ message: 'Nombre es obligatorio' });
  Lugar.addLugar({ nombre, direccion, capacidad }, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Lugar creado', id: result.insertId });
  });
};

exports.updateLugar = (req, res) => {
  const { id } = req.params;
  Lugar.updateLugar(id, req.body, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: 'Lugar actualizado' });
  });
};

exports.deleteLugar = (req, res) => {
  const { id } = req.params;
  Lugar.deleteLugar(id, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: 'Lugar eliminado' });
  });
};

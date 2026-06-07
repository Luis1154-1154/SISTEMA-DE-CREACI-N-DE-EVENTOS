const Usuario = require('../models/Usuarios');
const bcrypt = require('bcryptjs');

exports.getAllUsuarios = (req, res) => {
  Usuario.getAllUsuarios((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(results);
  });
};

exports.getUsuarioById = (req, res) => {
  const { id } = req.params;
  Usuario.getUsuarioById(id, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results.length) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.status(200).json(results[0]);
  });
};

exports.addUsuario = (req, res) => {
  const { name, phone, password, role } = req.body;
  if (!name || !phone) return res.status(400).json({ message: 'Nombre y teléfono son obligatorios' });
  const hashed = password ? bcrypt.hashSync(password, 10) : null;
  Usuario.addUsuario({ name, phone, password: hashed, role }, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Usuario creado', id: result.insertId });
  });
};

exports.updateUsuario = (req, res) => {
  const { id } = req.params;
  Usuario.updateUsuario(id, req.body, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: 'Usuario actualizado' });
  });
};

exports.deleteUsuario = (req, res) => {
  const { id } = req.params;
  Usuario.deleteUsuario(id, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: 'Usuario eliminado' });
  });
};

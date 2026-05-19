const Usuario = require('../models/Usuarios');

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
  const { nombre, email, contrasena, rol } = req.body;
  if (!nombre || !email) return res.status(400).json({ message: 'Nombre y email son obligatorios' });
  Usuario.addUsuario({ nombre, email, contrasena, rol }, (err, result) => {
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

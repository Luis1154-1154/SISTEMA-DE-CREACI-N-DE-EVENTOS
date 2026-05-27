const db = require('../config/db');

exports.getAllUsuarios = (callback) => {
  db.query('SELECT id, nombre, email, rol FROM usuarios ORDER BY nombre ASC', callback);
};

exports.getUsuarioById = (id, callback) => {
  db.query('SELECT id, nombre, email, contrasena, rol FROM usuarios WHERE id = ?', [id], callback);
};

exports.addUsuario = (usuario, callback) => {
  // Note: password should be hashed in production; here stored as provided
  db.query('INSERT INTO usuarios (nombre, email, contrasena, rol) VALUES (?, ?, ?, ?)', [usuario.nombre, usuario.email, usuario.contrasena || null, usuario.rol || 'participante'], callback);
};

exports.updateUsuario = (id, usuario, callback) => {
  db.query('UPDATE usuarios SET nombre = ?, email = ?, rol = ? WHERE id = ?', [usuario.nombre, usuario.email, usuario.rol || 'participante', id], callback);
};

exports.deleteUsuario = (id, callback) => {
  db.query('DELETE FROM usuarios WHERE id = ?', [id], callback);
};

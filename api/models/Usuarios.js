const db = require('../config/db');

exports.getAllUsuarios = (callback) => {
  db.query('SELECT id, phone, name, role FROM users ORDER BY name ASC', callback);
};

exports.getUsuarioById = (id, callback) => {
  db.query('SELECT id, phone, name, password, role FROM users WHERE id = ?', [id], callback);
};

exports.getUsuarioByPhone = (phone, callback) => {
  db.query('SELECT id, phone, name, password, role FROM users WHERE phone = ?', [phone], callback);
};

exports.addUsuario = (usuario, callback) => {
  // In production, hash passwords before storing
  db.query('INSERT INTO users (phone, name, password, role) VALUES (?, ?, ?, ?)', [usuario.phone, usuario.name, usuario.password || null, usuario.role || 'user'], callback);
};

exports.updateUsuario = (id, usuario, callback) => {
  db.query('UPDATE users SET phone = ?, name = ?, role = ? WHERE id = ?', [usuario.phone, usuario.name, usuario.role || 'user', id], callback);
};

exports.deleteUsuario = (id, callback) => {
  db.query('DELETE FROM users WHERE id = ?', [id], callback);
};

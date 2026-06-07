const db = require('../config/db');

exports.getAllUsuarios = (callback) => {
  db.query('SELECT id, phone, name, role, clinical_observations FROM users ORDER BY name ASC', callback);
};

exports.getUsuarioById = (id, callback) => {
  db.query('SELECT id, phone, name, password, role, clinical_observations FROM users WHERE id = ?', [id], callback);
};

exports.getUsuarioByPhone = (phone, callback) => {
  db.query('SELECT id, phone, name, password, role, clinical_observations FROM users WHERE phone = ?', [phone], callback);
};

exports.getUsuarioByName = (name, callback) => {
  db.query('SELECT id, phone, name, password, role, clinical_observations FROM users WHERE name = ?', [name], callback);
};

exports.getUsuarioByPhoneOrName = (phone, name, excludeId, callback) => {
  let sql = 'SELECT id, phone, name, password, role, clinical_observations FROM users WHERE (phone = ? OR name = ?)';
  const params = [phone, name];

  if (excludeId !== undefined && excludeId !== null) {
    sql += ' AND id <> ?';
    params.push(excludeId);
  }

  db.query(sql, params, callback);
};

exports.addUsuario = (usuario, callback) => {
  // In production, hash passwords before storing
  db.query('INSERT INTO users (phone, name, password, role) VALUES (?, ?, ?, ?)', [usuario.phone, usuario.name, usuario.password || null, usuario.role || 'user'], callback);
};

exports.updateUsuario = (id, usuario, callback) => {
  db.query('UPDATE users SET phone = ?, name = ?, role = ? WHERE id = ?', [usuario.phone, usuario.name, usuario.role || 'user', id], callback);
};

exports.updateClinicalObservations = (id, clinicalObservations, callback) => {
  db.query('UPDATE users SET clinical_observations = ? WHERE id = ?', [clinicalObservations || null, id], callback);
};

exports.updatePasswordByPhone = (phone, hashedPassword, callback) => {
  db.query('UPDATE users SET password = ? WHERE phone = ?', [hashedPassword, phone], callback);
};

exports.deleteUsuario = (id, callback) => {
  db.query('DELETE FROM users WHERE id = ?', [id], callback);
};

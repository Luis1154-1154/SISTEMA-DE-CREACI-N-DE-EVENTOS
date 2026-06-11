const db = require('../config/db');

const userColumns = 'id, phone, name, password, role, birthdate, sex, identification, occupation, weight, allergies, blood_type, chronic_conditions, clinical_observations, password_reset_token, password_reset_expires';

exports.getAllUsuarios = (callback) => {
  db.query(`SELECT ${userColumns} FROM users ORDER BY name ASC`, callback);
};

exports.getUsuarioById = (id, callback) => {
  db.query(`SELECT ${userColumns} FROM users WHERE id = ?`, [id], callback);
};

exports.getUsuarioByPhone = (phone, callback) => {
  db.query(`SELECT ${userColumns} FROM users WHERE phone = ?`, [phone], callback);
};

exports.getUsuarioByName = (name, callback) => {
  db.query(`SELECT ${userColumns} FROM users WHERE name = ?`, [name], callback);
};

exports.getUsuarioByPhoneOrName = (phone, name, excludeId, callback) => {
  let sql = `SELECT ${userColumns} FROM users WHERE (phone = ? OR name = ?)`;
  const params = [phone, name];

  if (excludeId !== undefined && excludeId !== null) {
    sql += ' AND id <> ?';
    params.push(excludeId);
  }

  db.query(sql, params, callback);
};

exports.addUsuario = (usuario, callback) => {
  // In production, hash passwords before storing
  db.query(
    'INSERT INTO users (phone, name, password, role, birthdate, sex, identification, occupation, weight, allergies, blood_type, chronic_conditions, clinical_observations) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      usuario.phone,
      usuario.name,
      usuario.password || null,
      usuario.role || 'user',
      usuario.birthdate || null,
      usuario.sex || null,
      usuario.identification || null,
      usuario.occupation || null,
      usuario.weight || null,
      usuario.allergies || null,
      usuario.blood_type || null,
      usuario.chronic_conditions || null,
      usuario.clinical_observations || null,
    ],
    callback,
  );
};

exports.updateUsuario = (id, usuario, callback) => {
  db.query(
    'UPDATE users SET phone = ?, name = ?, role = ?, birthdate = ?, sex = ?, identification = ?, occupation = ?, weight = ?, allergies = ?, blood_type = ?, chronic_conditions = ?, clinical_observations = ? WHERE id = ?',
    [
      usuario.phone,
      usuario.name,
      usuario.role || 'user',
      usuario.birthdate || null,
      usuario.sex || null,
      usuario.identification || null,
      usuario.occupation || null,
      usuario.weight || null,
      usuario.allergies || null,
      usuario.blood_type || null,
      usuario.chronic_conditions || null,
      usuario.clinical_observations || null,
      id,
    ],
    callback,
  );
};

exports.setPasswordResetToken = (phone, token, expiresAt, callback) => {
  db.query(
    'UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE phone = ?',
    [token, expiresAt, phone],
    callback,
  );
};

exports.clearPasswordResetToken = (phone, callback) => {
  db.query(
    'UPDATE users SET password_reset_token = NULL, password_reset_expires = NULL WHERE phone = ?',
    [phone],
    callback,
  );
};

exports.updatePasswordByPhone = (phone, hashedPassword, callback) => {
  db.query('UPDATE users SET password = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE phone = ?', [hashedPassword, phone], callback);
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

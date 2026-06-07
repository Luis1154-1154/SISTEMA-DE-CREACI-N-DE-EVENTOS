const db = require('../config/db');

exports.create = (appointment, callback) => {
  const sql = 'INSERT INTO appointments (user_id, phone, name, date, time, description) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(sql, [appointment.user_id || null, appointment.phone, appointment.name, appointment.date, appointment.time, appointment.description || null], callback);
};

exports.findByUser = (userId, callback) => {
  db.query('SELECT id, user_id, phone, name, date, time, description, created_at FROM appointments WHERE user_id = ? ORDER BY date, time', [userId], callback);
};

exports.findAll = (callback) => {
  db.query('SELECT id, user_id, phone, name, date, time, description, created_at FROM appointments ORDER BY date, time', callback);
};

exports.deleteById = (id, callback) => {
  db.query('DELETE FROM appointments WHERE id = ?', [id], callback);
};

exports.findByDate = (date, callback) => {
  db.query('SELECT id, user_id, phone, name, date, time, description, created_at FROM appointments WHERE date = ? ORDER BY time', [date], callback);
};

const db = require('../config/db');

exports.create = (appointment, callback) => {
  const sql = 'INSERT INTO appointments (user_id, phone, name, date, time, description, status, cancel_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  db.query(
    sql,
    [
      appointment.user_id || null,
      appointment.phone,
      appointment.name,
      appointment.date,
      appointment.time,
      appointment.description || null,
      appointment.status || 'pending',
      appointment.cancel_reason || null
    ],
    callback,
  );
};

exports.findByUser = (userId, callback) => {
  db.query(
    "SELECT id, user_id, phone, name, date, time, description, status, cancel_reason, created_at FROM appointments WHERE user_id = ? AND status = 'pending' ORDER BY date, time",
    [userId],
    callback,
  );
};

exports.findActiveByUser = exports.findByUser;

exports.findHistoryByUser = (userId, callback) => {
  db.query(
    'SELECT id, user_id, phone, name, date, time, description, status, cancel_reason, created_at FROM appointments WHERE user_id = ? ORDER BY date DESC, time DESC, created_at DESC',
    [userId],
    callback,
  );
};

exports.findAll = (callback) => {
  db.query('SELECT id, user_id, phone, name, date, time, description, status, cancel_reason, created_at FROM appointments ORDER BY date, time, created_at', callback);
};

exports.findById = (id, callback) => {
  db.query('SELECT id, user_id, phone, name, date, time, description, status, cancel_reason, created_at FROM appointments WHERE id = ?', [id], callback);
};

exports.updateStatusById = (id, status, cancelReason, callback) => {
  db.query('UPDATE appointments SET status = ?, cancel_reason = ? WHERE id = ?', [status, cancelReason || null, id], callback);
};

exports.updateById = (id, appointment, callback) => {
  db.query(
    'UPDATE appointments SET phone = ?, name = ?, date = ?, time = ?, description = ?, status = ?, cancel_reason = ? WHERE id = ?',
    [
      appointment.phone || null,
      appointment.name,
      appointment.date,
      appointment.time,
      appointment.description || null,
      appointment.status || 'pending',
      appointment.cancel_reason || null,
      id
    ],
    callback,
  );
};

exports.deleteById = (id, callback) => {
  db.query('DELETE FROM appointments WHERE id = ?', [id], callback);
};

exports.findByDate = (date, callback) => {
  db.query('SELECT id, user_id, phone, name, date, time, description, status, cancel_reason, created_at FROM appointments WHERE date = ? ORDER BY time', [date], callback);
};

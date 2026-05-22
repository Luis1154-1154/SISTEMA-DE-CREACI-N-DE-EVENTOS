const db = require('../config/db');

exports.getAllLugares = (callback) => {
  db.query('SELECT id, nombre, direccion, capacidad FROM lugares ORDER BY nombre ASC', callback);
};

exports.getLugarById = (id, callback) => {
  db.query('SELECT id, nombre, direccion, capacidad FROM lugares WHERE id = ?', [id], callback);
};

exports.addLugar = (lugar, callback) => {
  db.query('INSERT INTO lugares (nombre, direccion, capacidad) VALUES (?, ?, ?)', [lugar.nombre, lugar.direccion || null, lugar.capacidad || null], callback);
};

exports.updateLugar = (id, lugar, callback) => {
  db.query('UPDATE lugares SET nombre = ?, direccion = ?, capacidad = ? WHERE id = ?', [lugar.nombre, lugar.direccion || null, lugar.capacidad || null, id], callback);
};

exports.deleteLugar = (id, callback) => {
  db.query('DELETE FROM lugares WHERE id = ?', [id], callback);
};

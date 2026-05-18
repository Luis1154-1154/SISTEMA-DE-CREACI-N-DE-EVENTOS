const db = require('../config/db');

exports.getAllParticipantes = (callback) => {
  db.query('SELECT id, nombre, email, telefono FROM participantes ORDER BY nombre ASC', callback);
};

exports.getParticipanteById = (id, callback) => {
  db.query('SELECT id, nombre, email, telefono FROM participantes WHERE id = ?', [id], callback);
};

exports.addParticipante = (participante, callback) => {
  db.query(
    'INSERT INTO participantes (nombre, email, telefono) VALUES (?, ?, ?)',
    [participante.nombre, participante.email, participante.telefono || null],
    callback
  );
};

exports.updateParticipante = (id, participante, callback) => {
  db.query(
    'UPDATE participantes SET nombre = ?, email = ?, telefono = ? WHERE id = ?',
    [participante.nombre, participante.email, participante.telefono || null, id],
    callback
  );
};

exports.deleteParticipante = (id, callback) => {
  db.query('DELETE FROM participantes WHERE id = ?', [id], callback);
};

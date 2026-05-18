const db = require('../config/db');

exports.getByEvento = (eventoId, callback) => {
  const query = `
    SELECT
      i.id,
      i.evento_id,
      i.participante_id,
      i.asistio,
      i.fecha_inscripcion,
      p.nombre AS participante_nombre,
      p.email AS participante_email
    FROM inscripciones i
    INNER JOIN participantes p ON p.id = i.participante_id
    WHERE i.evento_id = ?
    ORDER BY i.fecha_inscripcion DESC
  `;
  db.query(query, [eventoId], callback);
};

exports.addInscripcion = (payload, callback) => {
  const query = 'INSERT INTO inscripciones (evento_id, participante_id, asistio) VALUES (?, ?, ?)';
  db.query(query, [payload.evento_id, payload.participante_id, payload.asistio || 0], callback);
};

exports.updateAsistencia = (id, asistio, callback) => {
  db.query('UPDATE inscripciones SET asistio = ? WHERE id = ?', [asistio, id], callback);
};

exports.deleteInscripcion = (id, callback) => {
  db.query('DELETE FROM inscripciones WHERE id = ?', [id], callback);
};

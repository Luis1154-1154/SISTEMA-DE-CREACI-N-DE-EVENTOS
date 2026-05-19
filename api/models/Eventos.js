const db = require('../config/db');

exports.getAllEventos = (callback) => {
  const query = `
    SELECT
      e.id,
      e.nombre,
      e.fecha,
        e.hora,
        e.ubicacion,
        e.lugar_id,
        e.estatus,
      e.descripcion,
      e.organizador,
        e.categoria_id,
      c.nombre AS categoria_nombre,
      COUNT(i.id) AS total_inscritos,
      SUM(CASE WHEN i.asistio = 1 THEN 1 ELSE 0 END) AS total_asistentes
    FROM eventos e
    LEFT JOIN categorias c ON c.id = e.categoria_id
    LEFT JOIN inscripciones i ON i.evento_id = e.id
    GROUP BY e.id, c.nombre
    ORDER BY e.fecha ASC, e.hora ASC
  `;
  db.query(query, callback);
};

exports.getEventoById = (id, callback) => {
  const query = `
    SELECT
      e.id,
      e.nombre,
      e.fecha,
      e.hora,
      e.ubicacion,
      e.descripcion,
      e.organizador,
      e.categoria_id,
      c.nombre AS categoria_nombre
    FROM eventos e
    LEFT JOIN categorias c ON c.id = e.categoria_id
    WHERE e.id = ?
  `;
  db.query(query, [id], callback);
};

exports.addEvento = (eventoData, callback) => {
  const query = 'INSERT INTO eventos (nombre, fecha, hora, ubicacion, lugar_id, estatus, descripcion, organizador, organizador_id, categoria_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  db.query(
    query,
    [
      eventoData.nombre,
      eventoData.fecha,
      eventoData.hora,
      eventoData.ubicacion,
      eventoData.lugar_id || null,
      eventoData.estatus || 'activo',
      eventoData.descripcion || null,
      eventoData.organizador || null,
      eventoData.organizador_id || null,
      eventoData.categoria_id || null
    ],
    callback
  );
};

exports.updateEvento = (id, eventoData, callback) => {
  const query = 'UPDATE eventos SET nombre = ?, fecha = ?, hora = ?, ubicacion = ?, lugar_id = ?, estatus = ?, descripcion = ?, organizador = ?, organizador_id = ?, categoria_id = ? WHERE id = ?';
  db.query(
    query,
    [
      eventoData.nombre,
      eventoData.fecha,
      eventoData.hora,
      eventoData.ubicacion,
      eventoData.lugar_id || null,
      eventoData.estatus || 'activo',
      eventoData.descripcion || null,
      eventoData.organizador || null,
      eventoData.organizador_id || null,
      eventoData.categoria_id || null,
      id
    ],
    callback
  );
};

exports.deleteEvento = (id, callback) => {
  const query = 'DELETE FROM eventos WHERE id = ?';
  db.query(query, [id], callback);
};

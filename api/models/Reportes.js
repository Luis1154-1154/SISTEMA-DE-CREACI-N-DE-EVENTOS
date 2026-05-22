const db = require('../config/db');

exports.reportePorEvento = (callback) => {
  const query = `
    SELECT
      e.id AS evento_id,
      e.nombre AS evento,
      COUNT(i.id) AS inscritos,
      SUM(CASE WHEN i.asistio = 1 THEN 1 ELSE 0 END) AS asistentes
    FROM eventos e
    LEFT JOIN inscripciones i ON i.evento_id = e.id
    GROUP BY e.id, e.nombre
    ORDER BY e.fecha ASC, e.hora ASC
  `;

  db.query(query, callback);
};

exports.reportePorTipoEvento = (callback) => {
  const query = `
    SELECT
      c.id AS categoria_id,
      c.nombre AS categoria,
      COUNT(DISTINCT e.id) AS total_eventos,
      COUNT(i.id) AS inscritos,
      SUM(CASE WHEN i.asistio = 1 THEN 1 ELSE 0 END) AS asistentes
    FROM categorias c
    LEFT JOIN eventos e ON e.categoria_id = c.id
    LEFT JOIN inscripciones i ON i.evento_id = e.id
    GROUP BY c.id, c.nombre
    ORDER BY c.nombre ASC
  `;

  db.query(query, callback);
};

exports.reportePorOrganizador = (callback) => {
  const query = `
    SELECT
      COALESCE(e.organizador, 'Sin organizador') AS organizador,
      COUNT(DISTINCT e.id) AS total_eventos,
      COUNT(i.id) AS inscritos,
      SUM(CASE WHEN i.asistio = 1 THEN 1 ELSE 0 END) AS asistentes
    FROM eventos e
    LEFT JOIN inscripciones i ON i.evento_id = e.id
    GROUP BY e.organizador
    ORDER BY organizador ASC
  `;

  db.query(query, callback);
};

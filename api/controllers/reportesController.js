const Reportes = require('../models/Reportes');

exports.reportePorEvento = (req, res) => {
  Reportes.reportePorEvento((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(results);
  });
};

exports.reportePorTipoEvento = (req, res) => {
  Reportes.reportePorTipoEvento((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(results);
  });
};

exports.reportePorOrganizador = (req, res) => {
  Reportes.reportePorOrganizador((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(results);
  });
};

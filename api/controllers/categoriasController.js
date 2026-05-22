const Categoria = require('../models/Categorias');

exports.getAllCategorias = (req, res) => {
  Categoria.getAllCategorias((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(results);
  });
};

exports.getCategoriaById = (req, res) => {
  const { id } = req.params;
  Categoria.getCategoriaById(id, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results.length) return res.status(404).json({ message: 'Categoria no encontrada' });
    res.status(200).json(results[0]);
  });
};

exports.addCategoria = (req, res) => {
  // Categorías son predefinidas. Creación vía API no permitida.
  return res.status(403).json({ message: 'Operación no permitida: categorías predefinidas' });
};

exports.updateCategoria = (req, res) => {
  // Categorías son predefinidas. Actualización vía API no permitida.
  return res.status(403).json({ message: 'Operación no permitida: categorías predefinidas' });
};

exports.deleteCategoria = (req, res) => {
  // Categorías son predefinidas. Eliminación vía API no permitida.
  return res.status(403).json({ message: 'Operación no permitida: categorías predefinidas' });
};

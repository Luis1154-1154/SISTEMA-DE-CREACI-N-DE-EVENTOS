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
  const { nombre, descripcion } = req.body;
  if (!nombre) return res.status(400).json({ message: 'El nombre es obligatorio' });

  Categoria.addCategoria({ nombre, descripcion }, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Categoria creada', id: result.insertId });
  });
};

exports.updateCategoria = (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion } = req.body;
  if (!nombre) return res.status(400).json({ message: 'El nombre es obligatorio' });

  Categoria.updateCategoria(id, { nombre, descripcion }, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result.affectedRows) return res.status(404).json({ message: 'Categoria no encontrada' });
    res.status(200).json({ message: 'Categoria actualizada' });
  });
};

exports.deleteCategoria = (req, res) => {
  const { id } = req.params;
  Categoria.deleteCategoria(id, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result.affectedRows) return res.status(404).json({ message: 'Categoria no encontrada' });
    res.status(200).json({ message: 'Categoria eliminada' });
  });
};

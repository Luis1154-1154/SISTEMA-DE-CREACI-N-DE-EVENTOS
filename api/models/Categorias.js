const db = require('../config/db');

exports.getAllCategorias = (callback) => {
  db.query('SELECT id, nombre, descripcion FROM categorias ORDER BY nombre ASC', callback);
};

exports.getCategoriaById = (id, callback) => {
  db.query('SELECT id, nombre, descripcion FROM categorias WHERE id = ?', [id], callback);
};

exports.addCategoria = (categoria, callback) => {
  db.query(
    'INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)',
    [categoria.nombre, categoria.descripcion || null],
    callback
  );
};

exports.updateCategoria = (id, categoria, callback) => {
  db.query(
    'UPDATE categorias SET nombre = ?, descripcion = ? WHERE id = ?',
    [categoria.nombre, categoria.descripcion || null, id],
    callback
  );
};

exports.deleteCategoria = (id, callback) => {
  db.query('DELETE FROM categorias WHERE id = ?', [id], callback);
};

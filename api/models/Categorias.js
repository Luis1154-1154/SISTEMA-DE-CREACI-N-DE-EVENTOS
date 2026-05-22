const db = require('../config/db');

exports.getAllCategorias = (callback) => {
  db.query('SELECT id, nombre FROM categorias ORDER BY nombre ASC', callback);
};

exports.getCategoriaById = (id, callback) => {
  db.query('SELECT id, nombre FROM categorias WHERE id = ?', [id], callback);
};

exports.addCategoria = (categoria, callback) => {
  db.query(
    'INSERT INTO categorias (nombre) VALUES (?)',
    [categoria.nombre],
    callback
  );
};

exports.updateCategoria = (id, categoria, callback) => {
  db.query(
    'UPDATE categorias SET nombre = ? WHERE id = ?',
    [categoria.nombre, id],
    callback
  );
};

exports.deleteCategoria = (id, callback) => {
  db.query('DELETE FROM categorias WHERE id = ?', [id], callback);
};

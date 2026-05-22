const express = require('express');
const router = express.Router();
const categoriasController = require('../controllers/categoriasController');

router.get('/categorias', categoriasController.getAllCategorias);
router.get('/categorias/:id', categoriasController.getCategoriaById);
router.post('/categorias', categoriasController.addCategoria);
router.put('/categorias/:id', categoriasController.updateCategoria);
router.delete('/categorias/:id', categoriasController.deleteCategoria);

module.exports = router;

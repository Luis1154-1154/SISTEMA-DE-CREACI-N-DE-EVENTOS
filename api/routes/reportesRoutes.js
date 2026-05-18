const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');

router.get('/reportes/asistencia/evento', reportesController.reportePorEvento);
router.get('/reportes/asistencia/tipo-evento', reportesController.reportePorTipoEvento);
router.get('/reportes/asistencia/organizador', reportesController.reportePorOrganizador);

module.exports = router;

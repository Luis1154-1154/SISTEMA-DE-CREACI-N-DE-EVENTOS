const express = require('express');
const router = express.Router();
const inscripcionesController = require('../controllers/inscripcionesController');

router.get('/inscripciones', inscripcionesController.getAllInscripciones);
router.get('/eventos/:eventoId/inscripciones', inscripcionesController.getInscripcionesByEvento);
router.post('/inscripciones', inscripcionesController.addInscripcion);
router.put('/inscripciones/:id/asistencia', inscripcionesController.updateAsistencia);
router.delete('/inscripciones/:id', inscripcionesController.deleteInscripcion);

module.exports = router;

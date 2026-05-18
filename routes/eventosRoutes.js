const express = require('express');
const router = express.Router();
const eventosController = require('../controllers/eventosController');

router.get('/eventos', eventosController.getAllEventos);
router.get('/eventos/:id', eventosController.getEventoById);
router.post('/eventos', eventosController.addEvento);
router.put('/eventos/:id', eventosController.updateEvento);
router.delete('/eventos/:id', eventosController.deleteEvento);

module.exports = router;

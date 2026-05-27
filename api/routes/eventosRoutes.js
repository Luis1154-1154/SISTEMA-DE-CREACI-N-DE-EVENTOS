const express = require('express');
const router = express.Router();
const eventosController = require('../controllers/eventosController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/eventos', eventosController.getAllEventos);
router.get('/eventos/:id', eventosController.getEventoById);
router.post('/eventos', authMiddleware.requireAuth, eventosController.addEvento);
router.put('/eventos/:id', authMiddleware.requireAuth, eventosController.updateEvento);
router.delete('/eventos/:id', authMiddleware.requireAuth, eventosController.deleteEvento);

module.exports = router;

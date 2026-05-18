const express = require('express');
const router = express.Router();
const participantesController = require('../controllers/participantesController');

router.get('/participantes', participantesController.getAllParticipantes);
router.get('/participantes/:id', participantesController.getParticipanteById);
router.post('/participantes', participantesController.addParticipante);
router.put('/participantes/:id', participantesController.updateParticipante);
router.delete('/participantes/:id', participantesController.deleteParticipante);

module.exports = router;

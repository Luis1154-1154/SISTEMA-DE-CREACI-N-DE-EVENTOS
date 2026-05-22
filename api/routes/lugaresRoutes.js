const express = require('express');
const router = express.Router();
const lugaresController = require('../controllers/lugaresController');

router.get('/lugares', lugaresController.getAllLugares);
router.get('/lugares/:id', lugaresController.getLugarById);
router.post('/lugares', lugaresController.addLugar);
router.put('/lugares/:id', lugaresController.updateLugar);
router.delete('/lugares/:id', lugaresController.deleteLugar);

module.exports = router;

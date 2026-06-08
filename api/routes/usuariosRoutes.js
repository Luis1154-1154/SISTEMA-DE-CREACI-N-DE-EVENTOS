const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth and admin guard only to /usuarios routes, not all /api traffic.
router.use('/usuarios', authMiddleware.requireAuth);
router.use('/usuarios', (req, res, next) => {
	if (!req.user || req.user.role !== 'admin') {
		return res.status(403).json({ message: 'No autorizado' });
	}

	return next();
});

router.get('/usuarios', usuariosController.getAllUsuarios);
router.get('/usuarios/:id', usuariosController.getUsuarioById);
router.put('/usuarios/:id/observations', usuariosController.updateClinicalObservations);
router.post('/usuarios', usuariosController.addUsuario);
router.put('/usuarios/:id', usuariosController.updateUsuario);
router.delete('/usuarios/:id', usuariosController.deleteUsuario);

module.exports = router;

const express = require('express');
const router = express.Router();
const appointmentsController = require('../controllers/appointmentsController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/appointments', authMiddleware.requireAuth, appointmentsController.createForUser);
router.get('/appointments/me', authMiddleware.requireAuth, appointmentsController.listMyAppointments);

// Admin endpoints
router.post('/admin/appointments', authMiddleware.requireAuth, appointmentsController.createForAdmin);
router.get('/admin/appointments', authMiddleware.requireAuth, appointmentsController.listAll);
router.delete('/admin/appointments/:id', authMiddleware.requireAuth, appointmentsController.deleteAppointment);

module.exports = router;

const express = require('express');
const router = express.Router();
const appointmentsController = require('../controllers/appointmentsController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/appointments', authMiddleware.optionalAuth, appointmentsController.createForUser);
router.get('/appointments/me', authMiddleware.optionalAuth, appointmentsController.listMyAppointments);
router.get('/appointments/active', authMiddleware.optionalAuth, appointmentsController.listMyAppointments);
router.get('/appointments/self', authMiddleware.optionalAuth, appointmentsController.listMyAppointments);
router.get('/appointments/me/history', authMiddleware.optionalAuth, appointmentsController.listMyHistory);
router.get('/appointments/history', authMiddleware.optionalAuth, appointmentsController.listMyHistory);
router.get('/appointments/self/history', authMiddleware.optionalAuth, appointmentsController.listMyHistory);
router.patch('/appointments/:id/cancel', authMiddleware.optionalAuth, appointmentsController.cancelMyAppointment);

// Admin endpoints
router.post('/admin/appointments', authMiddleware.requireAuth, appointmentsController.createForAdmin);
router.get('/admin/appointments', authMiddleware.requireAuth, appointmentsController.listAll);
router.put('/admin/appointments/:id', authMiddleware.requireAuth, appointmentsController.updateAppointment);
router.patch('/admin/appointments/:id/status', authMiddleware.requireAuth, appointmentsController.updateAppointmentStatus);
router.delete('/admin/appointments/:id', authMiddleware.requireAuth, appointmentsController.deleteAppointment);

module.exports = router;

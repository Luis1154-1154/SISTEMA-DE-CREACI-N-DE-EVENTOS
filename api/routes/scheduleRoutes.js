const express = require('express');
const router = express.Router();
const scheduleModel = require('../models/Schedule');
const authMiddleware = require('../middleware/authMiddleware');

// Protect schedule management for admins only
router.use('/schedule', authMiddleware.requireAuth);
router.use('/schedule', (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'No autorizado' });
  }
  return next();
});

// Settings
router.get('/schedule/settings', (req, res) => {
  scheduleModel.getSetting('appointment_interval_minutes', (err, value) => {
    if (err) return res.status(500).json({ message: 'Error interno' });
    res.json({ appointment_interval_minutes: value ? parseInt(value, 10) : 30 });
  });
});

router.put('/schedule/settings', (req, res) => {
  const { appointment_interval_minutes } = req.body;
  if (appointment_interval_minutes === undefined) return res.status(400).json({ message: 'Falta appointment_interval_minutes' });
  scheduleModel.setSetting('appointment_interval_minutes', String(appointment_interval_minutes), (err) => {
    if (err) return res.status(500).json({ message: 'Error guardando setting' });
    res.json({ ok: true });
  });
});

// Working hours
router.get('/schedule/working_hours', (req, res) => {
  scheduleModel.listWorkingHours((err, rows) => {
    if (err) return res.status(500).json({ message: 'Error interno' });
    res.json(rows);
  });
});

router.post('/schedule/working_hours', (req, res) => {
  scheduleModel.createWorkingHour(req.body, (err, result) => {
    if (err) return res.status(500).json({ message: 'Error creando regla' });
    res.json({ ok: true, id: result && result.insertId });
  });
});

router.put('/schedule/working_hours/:id', (req, res) => {
  scheduleModel.updateWorkingHour(req.params.id, req.body, (err) => {
    if (err) return res.status(500).json({ message: 'Error actualizando regla' });
    res.json({ ok: true });
  });
});

router.delete('/schedule/working_hours/:id', (req, res) => {
  scheduleModel.deleteWorkingHour(req.params.id, (err) => {
    if (err) return res.status(500).json({ message: 'Error eliminando regla' });
    res.json({ ok: true });
  });
});

// Exceptions
router.get('/schedule/exceptions', (req, res) => {
  scheduleModel.listExceptions((err, rows) => {
    if (err) return res.status(500).json({ message: 'Error interno' });
    res.json(rows);
  });
});

router.post('/schedule/exceptions', (req, res) => {
  scheduleModel.createException(req.body, (err, result) => {
    if (err) return res.status(500).json({ message: 'Error creando excepción' });
    res.json({ ok: true, id: result && result.insertId });
  });
});

router.delete('/schedule/exceptions/:id', (req, res) => {
  scheduleModel.deleteException(req.params.id, (err) => {
    if (err) return res.status(500).json({ message: 'Error eliminando excepción' });
    res.json({ ok: true });
  });
});

module.exports = router;

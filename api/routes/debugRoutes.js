const express = require('express');
const router = express.Router();
const db = require('../config/db');

// WARNING: development-only helpers to quickly inspect DB contents.
// These routes are only mounted when NODE_ENV !== 'production'.

router.get('/debug/appointments', (req, res) => {
  db.query('SELECT id, user_id, phone, name, date, time, description, created_at FROM appointments ORDER BY created_at DESC LIMIT 100', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Insert a test appointment (body: name, phone, date, time, description) to validate writes.
router.post('/debug/appointments', (req, res) => {
  const { name, phone, date, time, description } = req.body || {};
  if (!name || !date || !time) return res.status(400).json({ message: 'name, date and time are required' });
  const sql = 'INSERT INTO appointments (user_id, phone, name, date, time, description) VALUES (?, ?, ?, ?, ?, ?)';
  const params = [null, phone || null, name, date, time, description || null];
  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: result.insertId, message: 'Debug appointment created' });
  });
});

module.exports = router;

const Appointments = require('../models/Appointments');

exports.createForUser = (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ message: 'No autenticado' });

  const { date, time, description } = req.body || {};
  if (!date || !time) return res.status(400).json({ message: 'Fecha y hora requeridas' });

  const appointment = {
    user_id: user.id || null,
    phone: user.phone || '',
    name: user.name || '',
    date,
    time,
    description
  };

  Appointments.create(appointment, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: result.insertId, message: 'Cita creada' });
  });
};

exports.createForAdmin = (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ message: 'No autenticado' });
  if (user.role !== 'admin') return res.status(403).json({ message: 'No autorizado' });

  const { name, phone, date, time, description } = req.body || {};
  if (!name || !date || !time) return res.status(400).json({ message: 'Nombre, fecha y hora son requeridos' });

  const appointment = {
    user_id: null,
    phone: phone && String(phone).trim() ? String(phone).trim() : null,
    name,
    date,
    time,
    description
  };

  Appointments.create(appointment, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: result.insertId, message: 'Cita creada por admin' });
  });
};

exports.listMyAppointments = (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ message: 'No autenticado' });

  Appointments.findByUser(user.id, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.listAll = (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ message: 'No autenticado' });
  if (user.role !== 'admin') return res.status(403).json({ message: 'No autorizado' });

  Appointments.findAll((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.deleteAppointment = (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ message: 'No autenticado' });
  if (user.role !== 'admin') return res.status(403).json({ message: 'No autorizado' });

  const { id } = req.params;
  Appointments.deleteById(id, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Cita eliminada' });
  });
};

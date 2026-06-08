const Appointments = require('../models/Appointments');
const Usuario = require('../models/Usuarios');

exports.createForUser = (req, res) => {
  const user = req.user;
  // Debug logging: record auth headers and resolved user for deployed troubleshooting
  try {
    console.log('createForUser called - authHeader=', req.headers && (req.headers.authorization || req.headers.Authorization), 'cookie_sid=', req.cookies && req.cookies['sid'], 'resolvedUser=', user);
  } catch (e) {
    console.error('createForUser logging failed', e && e.message);
  }

  const { date, time, description } = req.body || {};
  if (!date || !time) return res.status(400).json({ message: 'Fecha y hora requeridas' });

  const appointment = {
    user_id: user ? user.id || null : null,
    phone: user ? user.phone || null : null,
    name: user ? user.name || null : null,
    date,
    time,
    description,
    status: 'pending',
    cancel_reason: null
  };

  Appointments.create(appointment, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: result.insertId, message: 'Cita creada' });
  });
};

function resolveOrCreateUser(name, phone, callback) {
  if (!name || !phone) {
    return callback(new Error('Nombre y teléfono requeridos para crear el usuario'));
  }

  const normalizedName = String(name).trim();
  const normalizedPhone = String(phone).trim();

  Usuario.getUsuarioByPhoneOrName(normalizedPhone, normalizedName, null, (lookupErr, results) => {
    if (lookupErr) return callback(lookupErr);
    if (results && results.length) {
      return callback(null, results[0]);
    }

    Usuario.addUsuario({ phone: normalizedPhone, name: normalizedName, password: null, role: 'user' }, (createErr, result) => {
      if (createErr) {
        const duplicateCode = String(createErr.code || '').toLowerCase();
        if (duplicateCode.includes('er_dup_entry') || duplicateCode.includes('duplicate')) {
          return Usuario.getUsuarioByPhoneOrName(normalizedPhone, normalizedName, null, (retryErr, retryResults) => {
            if (retryErr) return callback(retryErr);
            if (retryResults && retryResults.length) return callback(null, retryResults[0]);
            return callback(createErr);
          });
        }
        return callback(createErr);
      }
      callback(null, { id: result.insertId, phone: normalizedPhone, name: normalizedName });
    });
  });
}

exports.createForAdmin = (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ message: 'No autenticado' });
  if (user.role !== 'admin') return res.status(403).json({ message: 'No autorizado' });

  const { userId, user_id: legacyUserId, name, phone, date, time, description } = req.body || {};
  const selectedUserId = userId || legacyUserId || null;

  if (!date || !time) return res.status(400).json({ message: 'Fecha y hora son requeridos' });

  const normalizePhone = (value) => String(value || '').trim().replace(/[\s()-]/g, '');
  const normalizedPhone = normalizePhone(phone);
  const isValidPhone = (value) => /^[0-9]{10}$/.test(normalizePhone(value));

  const createAppointment = (resolvedName, resolvedPhone, resolvedUserId) => {
    const appointment = {
      user_id: resolvedUserId || null,
      phone: resolvedPhone && String(resolvedPhone).trim() ? String(resolvedPhone).trim() : null,
      name: String(resolvedName || '').trim(),
      date,
      time,
      description,
      status: 'pending',
      cancel_reason: null
    };

    if (!appointment.name) {
      return res.status(400).json({ message: 'Nombre requerido' });
    }

    Appointments.create(appointment, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: result.insertId, message: 'Cita creada por admin' });
    });
  };

  if (selectedUserId) {
    Usuario.getUsuarioById(selectedUserId, (lookupErr, results) => {
      if (lookupErr) return res.status(500).json({ error: lookupErr.message });
      if (!results || !results.length) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      const selectedUser = results[0];
      createAppointment(selectedUser.name, selectedUser.phone, selectedUser.id);
    });
    return;
  }

  if (!name || !phone) {
    return res.status(400).json({ message: 'Nombre y teléfono requeridos para crear la cita' });
  }

  if (!isValidPhone(phone)) {
    return res.status(400).json({ message: 'El teléfono debe tener 10 dígitos.' });
  }

  resolveOrCreateUser(name, normalizedPhone, (err, resolvedUser) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    createAppointment(resolvedUser.name, resolvedUser.phone, resolvedUser.id);
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

exports.listMyHistory = (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ message: 'No autenticado' });

  Appointments.findHistoryByUser(user.id, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.cancelMyAppointment = (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ message: 'No autenticado' });

  const { id } = req.params;
  const { reason } = req.body || {};
  const cancelReason = String(reason || '').trim();

  if (!cancelReason) {
    return res.status(400).json({ message: 'Debes indicar el motivo de cancelación' });
  }

  Appointments.findById(id, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results || !results.length) return res.status(404).json({ message: 'Cita no encontrada' });

    const appointment = results[0];
    if (String(appointment.user_id) !== String(user.id)) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    if (appointment.status && appointment.status !== 'pending') {
      return res.status(400).json({ message: 'Solo puedes cancelar citas pendientes' });
    }

    Appointments.updateStatusById(id, 'canceled', cancelReason, (updateErr) => {
      if (updateErr) return res.status(500).json({ error: updateErr.message });
      return res.json({ message: 'Cita cancelada' });
    });
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

exports.updateAppointment = (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ message: 'No autenticado' });
  if (user.role !== 'admin') return res.status(403).json({ message: 'No autorizado' });

  const { id } = req.params;
  const { name, phone, date, time, description, status, cancel_reason: cancelReason, cancelReason: camelCancelReason } = req.body || {};
  const normalizedStatus = String(status || '').trim().toLowerCase();

  if (!date || !time) {
    return res.status(400).json({ message: 'Fecha y hora son requeridos' });
  }

  Appointments.findById(id, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results || !results.length) return res.status(404).json({ message: 'Cita no encontrada' });

    const existing = results[0];
    const resolvedName = String(name || existing.name || '').trim();
    const resolvedPhone = phone && String(phone).trim() ? String(phone).trim() : existing.phone || null;
    const resolvedDescription = description !== undefined ? description : existing.description;
    const resolvedStatus = normalizedStatus || String(existing.status || 'pending').trim().toLowerCase();
    const normalizedCancelReason = String(cancelReason || camelCancelReason || '').trim();
    const existingCancelReason = String(existing.cancel_reason || '').trim();

    if (!resolvedName) {
      return res.status(400).json({ message: 'Nombre requerido' });
    }

    if (!['pending', 'attended', 'canceled'].includes(resolvedStatus)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    if (resolvedStatus === 'canceled' && !normalizedCancelReason && !existingCancelReason) {
      return res.status(400).json({ message: 'Debes indicar el motivo de cancelación' });
    }

    Appointments.updateById(
      id,
      {
        name: resolvedName,
        phone: resolvedPhone,
        date,
        time,
        description: resolvedDescription,
        status: resolvedStatus,
        cancel_reason: resolvedStatus === 'canceled' ? (normalizedCancelReason || existingCancelReason) : null
      },
      (updateErr) => {
        if (updateErr) return res.status(500).json({ error: updateErr.message });
        res.json({ message: 'Cita actualizada' });
      }
    );
  });
};

exports.updateAppointmentStatus = (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ message: 'No autenticado' });
  if (user.role !== 'admin') return res.status(403).json({ message: 'No autorizado' });

  const { id } = req.params;
  const { status, reason, cancel_reason: cancelReason, cancelReason: camelCancelReason } = req.body || {};
  const normalizedStatus = String(status || '').trim().toLowerCase();
  const normalizedCancelReason = String(reason || cancelReason || camelCancelReason || '').trim();

  if (!['pending', 'attended', 'canceled'].includes(normalizedStatus)) {
    return res.status(400).json({ message: 'Estado inválido' });
  }

  if (normalizedStatus === 'canceled' && !normalizedCancelReason) {
    return res.status(400).json({ message: 'Debes indicar el motivo de cancelación' });
  }

  Appointments.updateStatusById(id, normalizedStatus, normalizedStatus === 'canceled' ? normalizedCancelReason : null, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Estado actualizado' });
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

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Usuario = require('../models/Usuarios');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const COOKIE_NAME = 'sid';

function normalizePhone(value) {
  return String(value || '').replace(/\D+/g, '');
}

function isValidPhone(value) {
  const phone = normalizePhone(value || '');
  return /^\+?[0-9]{7,15}$/.test(phone);
}

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  const sameSite = isProduction ? 'none' : (process.env.COOKIE_SAMESITE || 'lax').toLowerCase();
  const secure = isProduction || (process.env.COOKIE_SECURE && String(process.env.COOKIE_SECURE).toLowerCase() !== 'false');

  return {
    httpOnly: true,
    sameSite,
    secure,
  };
}

function generateResetCode() {
  return crypto.randomInt(100000, 999999).toString();
}

function sendSms(phone, message) {
  // TODO: Replace this with a real SMS provider, e.g. Twilio or Nexmo.
  console.log(`SMS para ${phone}: ${message}`);
}

exports.requestPasswordReset = (req, res) => {
  let { phone } = req.body || {};
  phone = normalizePhone(phone);

  if (!phone) return res.status(400).json({ message: 'Teléfono requerido' });
  if (!isValidPhone(phone)) return res.status(400).json({ message: 'Número de teléfono inválido' });

  Usuario.getUsuarioByPhone(phone, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results || !results.length) {
      return res.json({ message: 'Si el número existe en el sistema, recibirás un código SMS para recuperar tu contraseña.' });
    }

    const code = generateResetCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    Usuario.setPasswordResetToken(phone, code, expiresAt, (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      sendSms(phone, `Tu código de recuperación es: ${code}. No lo compartas con nadie.`);
      return res.json({ message: 'Envía tu código SMS en el siguiente paso para restablecer tu contraseña.' });
    });
  });
};

exports.resetPassword = (req, res) => {
  let { phone, code, newPassword } = req.body || {};
  phone = normalizePhone(phone);

  if (!phone || !code || !newPassword) {
    return res.status(400).json({ message: 'Teléfono, código y nueva contraseña requeridos' });
  }

  if (!isValidPhone(phone)) {
    return res.status(400).json({ message: 'Número de teléfono inválido' });
  }

  if (String(newPassword).trim().length < 6) {
    return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
  }

  Usuario.getUsuarioByPhone(phone, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results || !results.length) {
      return res.status(404).json({ message: 'No existe usuario con ese teléfono' });
    }

    const user = results[0];
    const storedCode = String(user.password_reset_token || '');
    const expiresAt = user.password_reset_expires ? new Date(user.password_reset_expires) : null;

    if (!storedCode || storedCode !== String(code).trim() || !expiresAt || expiresAt < new Date()) {
      return res.status(400).json({ message: 'Código de recuperación inválido o expirado' });
    }

    const hashed = bcrypt.hashSync(String(newPassword).trim(), 10);
    Usuario.updatePasswordByPhone(phone, hashed, (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      return res.json({ message: 'Contraseña restablecida correctamente' });
    });
  });
};

exports.login = (req, res) => {
  let { phone, password } = req.body || {};
  phone = normalizePhone(phone);
  if (!phone) return res.status(400).json({ message: 'Teléfono requerido' });
  if (!password) return res.status(400).json({ message: 'Contraseña requerida' });

  Usuario.getUsuarioByPhone(phone, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results || !results.length) return res.status(401).json({ message: 'Credenciales inválidas' });

    const user = results[0];

    // Require password for all users
    if (!user.password || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const payload = { id: user.id, phone: user.phone, name: user.name, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    return res.json({ id: user.id, phone: user.phone, name: user.name, role: user.role, token });
  });
};

exports.register = (req, res) => {
  let {
    phone,
    country_code,
    name,
    password,
    birthdate,
    sex,
    identification,
    occupation,
    weight,
    allergies,
    blood_type,
    chronic_conditions,
    clinical_observations,
  } = req.body || {};

  phone = normalizePhone(phone);
  if (!phone || !name) return res.status(400).json({ message: 'Teléfono y nombre requeridos' });
  // require password, birthdate, sex and weight at registration
  if (!password || String(password).trim().length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
  }
  if (!birthdate || !sex || !weight) {
    return res.status(400).json({ message: 'Fecha de nacimiento, sexo y peso son obligatorios' });
  }

  if (!isValidPhone(phone)) return res.status(400).json({ message: 'Número de teléfono inválido' });

  Usuario.getUsuarioByPhone(phone, (err, phoneResults) => {
    if (err) return res.status(500).json({ error: err.message });
    if (phoneResults && phoneResults.length) {
      return res.status(400).json({ message: 'Este número ya está registrado. Si quieres iniciar sesión, usa el formulario de login.' });
    }

    Usuario.getUsuarioByName(name, (err2, nameResults) => {
      if (err2) return res.status(500).json({ error: err2.message });
      if (nameResults && nameResults.length) {
        return res.status(400).json({ message: 'Ya existe un usuario con ese nombre' });
      }

      const hashed = bcrypt.hashSync(String(password).trim(), 10);
      Usuario.addUsuario(
        {
          phone,
          country_code: country_code || '+52',
          name,
          password: hashed,
          role: 'user',
          birthdate,
          sex,
          identification,
          occupation,
          weight,
          allergies,
          blood_type,
          chronic_conditions,
          clinical_observations
        },
        (err3, result) => {
          if (err3) return res.status(500).json({ error: err3.message });

          const payload = { id: result.insertId, phone, name, role: 'user' };
          const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
          return res.status(201).json({ id: result.insertId, phone, name, role: 'user', token });
        },
      );
    });
  });
};

exports.updateMe = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  const {
    phone,
    country_code,
    name,
    birthdate,
    sex,
    identification,
    occupation,
    weight,
    allergies,
    blood_type,
    chronic_conditions,
    clinical_observations,
  } = req.body || {};

  const normalizedPhone = normalizePhone(phone);
  if (phone && !isValidPhone(normalizedPhone)) {
    return res.status(400).json({ message: 'Número de teléfono inválido' });
  }

  Usuario.updateUsuario(req.user.id, {
    phone: normalizedPhone || req.user.phone,
    country_code: country_code || req.user.country_code || '+52',
    name: String(name || req.user.name).trim(),
    role: req.user.role,
    birthdate: birthdate || null,
    sex: sex || null,
    identification: identification || null,
    occupation: occupation || null,
    weight: weight || null,
    allergies: allergies || null,
    blood_type: blood_type || null,
    chronic_conditions: chronic_conditions || null,
    clinical_observations: clinical_observations || null,
  }, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    return exports.me(req, res);
  });
};

exports.logout = (req, res) => {
  res.clearCookie(COOKIE_NAME, { ...getCookieOptions(), path: '/' });
  return res.json({ message: 'Sesión cerrada' });
};

exports.me = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  Usuario.getUsuarioById(req.user.id, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results || !results.length) return res.status(404).json({ message: 'Usuario no encontrado' });

    const user = results[0];
    delete user.password;
    return res.json(user);
  });
};

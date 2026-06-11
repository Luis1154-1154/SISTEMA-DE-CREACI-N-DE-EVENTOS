const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuarios');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const COOKIE_NAME = 'sid';

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

exports.login = (req, res) => {
  const { phone, password } = req.body || {};
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
  const {
    phone,
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

  if (!phone || !name) return res.status(400).json({ message: 'Teléfono y nombre requeridos' });
  // require password, birthdate, sex and weight at registration
  if (!password || String(password).trim().length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
  }
  if (!birthdate || !sex || !weight) {
    return res.status(400).json({ message: 'Fecha de nacimiento, sexo y peso son obligatorios' });
  }

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

exports.resetPassword = (req, res) => {
  const { phone, newPassword } = req.body || {};
  if (!phone || !newPassword) {
    return res.status(400).json({ message: 'Teléfono y nueva contraseña requeridos' });
  }

  if (String(newPassword).trim().length < 6) {
    return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
  }

  Usuario.getUsuarioByPhone(phone, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results || !results.length) {
      return res.status(404).json({ message: 'No existe usuario con ese teléfono' });
    }

    const hashed = bcrypt.hashSync(String(newPassword).trim(), 10);
    Usuario.updatePasswordByPhone(phone, hashed, (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      return res.json({ message: 'Contraseña restablecida correctamente' });
    });
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

  return res.json({
    id: req.user.id,
    phone: req.user.phone,
    name: req.user.name,
    role: req.user.role
  });
};

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuarios');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const COOKIE_NAME = 'sid';

exports.login = (req, res) => {
  const { phone, password } = req.body || {};
  if (!phone || !password) {
    return res.status(400).json({ message: 'Teléfono y contraseña requeridos' });
  }

  Usuario.getUsuarioByPhone(phone, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results || !results.length) return res.status(401).json({ message: 'Credenciales inválidas' });

    const user = results[0];
    if (!user.password || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const payload = { id: user.id, phone: user.phone, name: user.name, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000
    });

    return res.json({ id: user.id, phone: user.phone, name: user.name, role: user.role });
  });
};

exports.register = (req, res) => {
  const { phone, name, password } = req.body || {};
  if (!phone || !name || !password) return res.status(400).json({ message: 'Teléfono, nombre y contraseña requeridos' });

  Usuario.getUsuarioByPhone(phone, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results && results.length) return res.status(400).json({ message: 'Usuario ya registrado con ese teléfono' });

    const hashed = bcrypt.hashSync(password, 10);
    Usuario.addUsuario({ phone, name, password: hashed, role: 'user' }, (err2, result) => {
      if (err2) return res.status(500).json({ error: err2.message });

      const payload = { id: result.insertId, phone, name, role: 'user' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
      res.cookie(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 8 * 60 * 60 * 1000 });
      return res.status(201).json({ id: result.insertId, phone, name, role: 'user' });
    });
  });
};

exports.logout = (req, res) => {
  res.clearCookie(COOKIE_NAME);
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

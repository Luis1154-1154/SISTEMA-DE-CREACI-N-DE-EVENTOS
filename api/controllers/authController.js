const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuarios');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const COOKIE_NAME = 'sid';

exports.login = (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña requeridos' });
  }

  Usuario.getUsuarioByEmail(email, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results || !results.length) return res.status(401).json({ message: 'Credenciales inválidas' });

    const user = results[0];
    if (!user.contrasena || user.contrasena !== password) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const payload = { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 8 * 60 * 60 * 1000
    });

    return res.json({ id: user.id, email: user.email, nombre: user.nombre, rol: user.rol });
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
    email: req.user.email,
    nombre: req.user.nombre,
    rol: req.user.rol
  });
};

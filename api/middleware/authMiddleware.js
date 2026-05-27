const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const COOKIE_NAME = 'sid';

function readToken(req) {
  return req.cookies && req.cookies[COOKIE_NAME] ? req.cookies[COOKIE_NAME] : null;
}

exports.requireAuth = (req, res, next) => {
  const token = readToken(req);
  if (!token) return res.status(401).json({ message: 'No autenticado' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

exports.optionalAuth = (req, res, next) => {
  const token = readToken(req);
  if (!token) return next();

  try {
    req.user = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    // ignore invalid token for optional auth
  }

  return next();
};

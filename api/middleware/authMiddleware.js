const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const COOKIE_NAME = 'sid';

function readToken(req) {
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    return req.cookies[COOKIE_NAME];
  }

  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  const matches = authHeader.match(/Bearer\s+(.+)/i);
  return matches ? matches[1] : null;
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

const express = require('express');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');
const app = express();
const PORT = process.env.PORT || 3000;
const cookieParser = require('cookie-parser');
const usuariosRoutes = require('./routes/usuariosRoutes');
const authRoutes = require('./routes/authRoutes');
const appointmentsRoutes = require('./routes/appointmentsRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const debugRoutes = require('./routes/debugRoutes');
const authMiddleware = require('./middleware/authMiddleware');
const appointmentsController = require('./controllers/appointmentsController');
const { ensureAppointmentSchema } = require('./config/migrations');

const configuredOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

// CORS middleware: allow configured origins when provided, otherwise echo the browser origin.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowOrigin = configuredOrigins.length === 0 || configuredOrigins.includes(origin);
  if (origin && allowOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  // Always allow credentials so cookies can be set when requested by the browser.
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Serve frontend static files from project-level `frontend/` (allows accessing registro.html, etc.)
app.use(express.static(path.join(__dirname, '..', 'frontend')));

const fs = require('fs');
const routesDir = path.join(__dirname, 'routes');

function buildApiRoutes() {
  const items = [];
  try {
    const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
    for (const file of files) {
      try {
        // require the router module and inspect its stack for declared routes
        const router = require(path.join(routesDir, file));
        const stack = router && router.stack ? router.stack : [];
        for (const layer of stack) {
          if (layer && layer.route) {
            const methods = Object.keys(layer.route.methods || {});
            const routePath = layer.route.path || '';
            const p = routePath.startsWith('/') ? routePath : '/' + routePath;
            for (const m of methods) {
              items.push({ method: m.toUpperCase(), path: '/api' + p });
            }
          }
        }
      } catch (e) {
        // fallback: ignore file if require fails
      }
    }
  } catch (err) {
    items.push({ method: 'GET', path: '/api' });
  }
  const key = v => v.method + ' ' + v.path;
  const seen = new Set();
  const unique = [];
  for (const it of items) {
    if (!seen.has(key(it))) {
      seen.add(key(it));
      unique.push(it);
    }
  }
  return unique.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
}

app.get('/api', (req, res) => {
  const routes = buildApiRoutes();
  res.status(200).json({
    message: 'API de eventos disponible para Postman y JSON',
    baseUrl: `http://localhost:${PORT}`,
    routes
  });
});

// Debug route to check CORS headers when set explicitly
app.get('/debug-cors', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.json({ ok: true });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const KEEP_ALIVE_URL = process.env.KEEP_ALIVE_URL;
const KEEP_ALIVE_INTERVAL_MS = 14 * 60 * 1000;

function pingUrl(targetUrl) {
  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(targetUrl);
      const lib = parsed.protocol === 'https:' ? https : http;
      const req = lib.request(
        {
          method: 'GET',
          hostname: parsed.hostname,
          port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
          path: parsed.pathname + (parsed.search || ''),
          timeout: 10000,
          headers: {
            'User-Agent': 'keep-alive-pinger',
          },
        },
        (res) => {
          res.resume();
          resolve(res.statusCode);
        }
      );

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy(new Error('keep-alive timeout'));
      });
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

function startKeepAlive() {
  if (!KEEP_ALIVE_URL) return;
  console.log(`Keep-alive enabled for ${KEEP_ALIVE_URL}`);
  setInterval(async () => {
    try {
      const status = await pingUrl(KEEP_ALIVE_URL);
      console.log(`Keep-alive ping to ${KEEP_ALIVE_URL} status=${status}`);
    } catch (err) {
      console.warn('Keep-alive ping error:', err.message || err);
    }
  }, KEEP_ALIVE_INTERVAL_MS);
}

// Mount public auth routes before protected routers so register/login remain reachable.
app.use('/api', authRoutes);

app.get('/api/appointments/self', authMiddleware.optionalAuth, appointmentsController.listMyAppointments);
app.get('/api/appointments/me', authMiddleware.optionalAuth, appointmentsController.listMyAppointments);
app.get('/api/appointments/active', authMiddleware.optionalAuth, appointmentsController.listMyAppointments);
app.get('/api/appointments/history', authMiddleware.optionalAuth, appointmentsController.listMyHistory);
app.patch('/api/appointments/:id/cancel', authMiddleware.optionalAuth, appointmentsController.cancelMyAppointment);

// Mount API routes under /api only to avoid duplicate endpoints at root
// Ensure appointment routes are registered before user-admin routes so regular /api/appointments
// traffic is not intercepted by the usuariosRoutes admin guard.
app.use('/api', appointmentsRoutes);
app.use('/api', scheduleRoutes);
app.use('/api', usuariosRoutes);
// Mount debug helpers only in non-production environments
if (process.env.NODE_ENV !== 'production') {
  app.use('/api', debugRoutes);
}

app.use((req, res) => {
  res.status(404).send('<h1>Error 404</h1><p>La ruta que intentas acceder no existe.</p>');
});

function startServer() {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    startKeepAlive();
  });
}

ensureAppointmentSchema()
  .catch((error) => {
    console.error('No se pudo asegurar el esquema de citas:', error);
  })
  .finally(() => {
    startServer();
  });
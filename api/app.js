const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;
const cookieParser = require('cookie-parser');
const usuariosRoutes = require('./routes/usuariosRoutes');
const authRoutes = require('./routes/authRoutes');
const appointmentsRoutes = require('./routes/appointmentsRoutes');
const debugRoutes = require('./routes/debugRoutes');

// Simple CORS middleware: allow any origin (for local dev)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Use the provided Origin when available, otherwise fallback to localhost dev origin.
  const allowOrigin = origin || 'http://localhost:3000';
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
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

// Mount API routes under /api only to avoid duplicate endpoints at root
app.use('/api', usuariosRoutes);
app.use('/api', authRoutes);
app.use('/api', appointmentsRoutes);
// Mount debug helpers only in non-production environments
if (process.env.NODE_ENV !== 'production') {
  app.use('/api', debugRoutes);
}

app.use((req, res) => {
  res.status(404).send('<h1>Error 404</h1><p>La ruta que intentas acceder no existe.</p>');
});



app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
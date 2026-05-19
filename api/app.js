const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;
const eventosRoutes = require('./routes/eventosRoutes');
const categoriasRoutes = require('./routes/categoriasRoutes');
const participantesRoutes = require('./routes/participantesRoutes');
const inscripcionesRoutes = require('./routes/inscripcionesRoutes');
const reportesRoutes = require('./routes/reportesRoutes');
const testRoutes = require('./routes/testRoutes');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const apiRoutes = [
  { method: 'GET', path: '/api', description: 'Listado de endpoints disponibles' },
  { method: 'GET', path: '/api/eventos', description: 'Obtener todos los eventos' },
  { method: 'GET', path: '/api/eventos/:id', description: 'Obtener un evento por ID' },
  { method: 'POST', path: '/api/eventos', description: 'Crear un evento' },
  { method: 'PUT', path: '/api/eventos/:id', description: 'Actualizar un evento' },
  { method: 'DELETE', path: '/api/eventos/:id', description: 'Eliminar un evento' },
  { method: 'GET', path: '/api/categorias', description: 'Obtener todas las categorías' },
  { method: 'GET', path: '/api/categorias/:id', description: 'Obtener una categoría por ID' },
  { method: 'POST', path: '/api/categorias', description: 'Crear una categoría' },
  { method: 'PUT', path: '/api/categorias/:id', description: 'Actualizar una categoría' },
  { method: 'DELETE', path: '/api/categorias/:id', description: 'Eliminar una categoría' },
  { method: 'GET', path: '/api/participantes', description: 'Obtener todos los participantes' },
  { method: 'GET', path: '/api/participantes/:id', description: 'Obtener un participante por ID' },
  { method: 'POST', path: '/api/participantes', description: 'Crear un participante' },
  { method: 'PUT', path: '/api/participantes/:id', description: 'Actualizar un participante' },
  { method: 'DELETE', path: '/api/participantes/:id', description: 'Eliminar un participante' },
  { method: 'GET', path: '/api/eventos/:eventoId/inscripciones', description: 'Obtener inscripciones de un evento' },
  { method: 'POST', path: '/api/inscripciones', description: 'Crear una inscripción' },
  { method: 'PUT', path: '/api/inscripciones/:id/asistencia', description: 'Actualizar asistencia de una inscripción' },
  { method: 'DELETE', path: '/api/inscripciones/:id', description: 'Eliminar una inscripción' },
  { method: 'GET', path: '/api/reportes/asistencia/evento', description: 'Reporte de asistencia por evento' },
  { method: 'GET', path: '/api/reportes/asistencia/tipo-evento', description: 'Reporte de asistencia por tipo de evento' },
  { method: 'GET', path: '/api/reportes/asistencia/organizador', description: 'Reporte de asistencia por organizador' },
  { method: 'GET', path: '/api/test-db', description: 'Probar conexión a la base de datos' }
];

app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'API de eventos disponible para Postman y JSON',
    baseUrl: `http://localhost:${PORT}`,
    routes: apiRoutes
  });
});

app.use('/', eventosRoutes);
app.use('/', categoriasRoutes);
app.use('/', participantesRoutes);
app.use('/', inscripcionesRoutes);
app.use('/', reportesRoutes);
app.use('/test', testRoutes);

app.use('/api', eventosRoutes);
app.use('/api', categoriasRoutes);
app.use('/api', participantesRoutes);
app.use('/api', inscripcionesRoutes);
app.use('/api', reportesRoutes);
app.use('/api', testRoutes);

app.use((req, res) => {
  res.status(404).send('<h1>Error 404</h1><p>La ruta que intentas acceder no existe.</p>');
});



app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

const mysql = require('mysql2');

const conexion = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'TuNuevaContraseña',
  database: 'eventos_db',
  port: 3305
});

conexion.connect((err) => {
  if (err) {
    console.error('Error de conexión a MySQL:', err);
  } else {
    console.log('Conectado a MySQL.');
  }
});

module.exports = conexion;
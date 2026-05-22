const fetch = global.fetch || require('node-fetch');
const mysql = require('mysql2/promise');

async function run() {
  const url = 'http://localhost:3000/api/usuarios';
  const payload = { nombre: 'Test User', email: 'testuser@example.com', contrasena: 'abc123', rol: 'participante' };
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    console.log('POST response:', data);
  } catch (err) {
    console.error('POST error:', err.message);
  }

  // Now query DB directly
  try {
    const conn = await mysql.createConnection({ host: '127.0.0.1', user: 'root', password: 'TuNuevaContraseña', database: 'eventos_db', port: 3305 });
    const [rows] = await conn.execute('SELECT id, nombre, email, rol FROM usuarios WHERE email = ?', ['testuser@example.com']);
    console.log('DB rows for testuser@example.com:', rows);
    await conn.end();
  } catch (err) {
    console.error('DB error:', err.message);
  }
}

run();

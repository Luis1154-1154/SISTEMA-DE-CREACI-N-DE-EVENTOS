const db = require('../config/db');
const bcrypt = require('bcryptjs');

function isBcryptHash(pwd) {
  return typeof pwd === 'string' && pwd.startsWith('$2a$');
}

console.log('Buscando usuarios con contraseñas no hasheadas...');

db.query('SELECT id, password, phone, name FROM users', (err, rows) => {
  if (err) {
    console.error('Error al leer usuarios:', err.message || err);
    process.exit(1);
  }

  const toUpdate = (rows || []).filter(r => r.password && !isBcryptHash(r.password));
  if (!toUpdate.length) {
    console.log('No se encontraron contraseñas sin hash. Nada que hacer.');
    process.exit(0);
  }

  console.log(`Encontrados ${toUpdate.length} usuario(s) con contraseña no hasheada.`);

  let processed = 0;
  toUpdate.forEach(u => {
    try {
      const hashed = bcrypt.hashSync(String(u.password), 10);
      db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, u.id], (uErr, res) => {
        if (uErr) {
          console.error(`Error actualizando usuario ${u.id} (${u.phone}):`, uErr.message || uErr);
        } else {
          console.log(`Actualizado usuario ${u.id} (${u.phone}) -> password hasheada.`);
        }
        processed += 1;
        if (processed === toUpdate.length) process.exit(0);
      });
    } catch (e) {
      console.error(`Fallo al hashear usuario ${u.id}:`, e.message || e);
      processed += 1;
      if (processed === toUpdate.length) process.exit(1);
    }
  });
});

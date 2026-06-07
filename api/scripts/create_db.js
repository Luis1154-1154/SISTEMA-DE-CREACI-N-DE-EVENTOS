// Script to create the clinic_db database using mysql2 and environment variables
// Usage:
// 1) Set env vars (PowerShell example below)
// 2) node scripts/create_db.js

const mysql = require('mysql2/promise');

async function main() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'clinic_db';

  const connConfig = { host, port, user, password, multipleStatements: true };

  console.log('Conectando a MySQL en', host + ':' + port, 'como', user);
  try {
    const conn = await mysql.createConnection(connConfig);
    const sql = `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;`;
    await conn.query(sql);
    console.log(`Base de datos '${dbName}' creada o ya existente.`);
    await conn.end();
    process.exit(0);
  } catch (err) {
    console.error('Error creando la base de datos:', err.message || err);
    process.exit(1);
  }
}

main();

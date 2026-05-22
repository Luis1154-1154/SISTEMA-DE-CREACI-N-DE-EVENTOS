const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');

const sqlPath = path.join(__dirname, '..', 'database.sql');
const sqlText = fs.readFileSync(sqlPath, 'utf8');

const statements = sqlText
  .split(/;\s*\n/) // split by semicolon + newline to keep INSERTs intact
  .map(s => s.trim())
  .filter(s => s.length > 0);

const conn = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'TuNuevaContraseña',
  port: 3305,
  multipleStatements: false
});

function runNext(i) {
  if (i >= statements.length) {
    console.log('All statements executed.');
    conn.end();
    return;
  }
  const sql = statements[i];
  // Skip empty or comment-only statements
  if (!sql || sql.startsWith('--')) return runNext(i + 1);
  conn.query(sql, (err, res) => {
    if (err) {
      console.error('Error executing statement:', err.message);
      console.error('Statement:', sql.substring(0, 200));
      conn.end();
      process.exit(1);
    } else {
      console.log('OK:', (sql.match(/^CREATE TABLE|CREATE DATABASE|INSERT INTO|USE /i)||[''])[0]);
      runNext(i + 1);
    }
  });
}

conn.connect(err => {
  if (err) {
    console.error('Connection error:', err.message);
    process.exit(1);
  }
  console.log('Connected to MySQL, applying SQL file...');
  runNext(0);
});

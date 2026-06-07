
const fs = require('fs');
const DB_CLIENT = (process.env.DB_CLIENT || 'mysql').toLowerCase();

if (DB_CLIENT === 'postgres' || DB_CLIENT === 'pg') {
  // Postgres wrapper that keeps a mysql-style callback API and converts ? -> $1 placeholders
  const { Pool } = require('pg');
  const pool = new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'clinic_db',
    max: process.env.DB_CONN_LIMIT ? Number(process.env.DB_CONN_LIMIT) : 10,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' } : false
  });

  // convert ? placeholders to $1, $2 ...
  function convertPlaceholders(sql) {
    let i = 0;
    return sql.replace(/\?/g, () => {
      i += 1;
      return '$' + i;
    });
  }

  module.exports = {
    query: (sql, params, cb) => {
      if (typeof params === 'function') { cb = params; params = []; }
      cb = cb || function(){};
      const isInsert = /^\s*INSERT\s+/i.test(sql);
      const isSelect = /^\s*SELECT\s+/i.test(sql);
      let pgSql = sql;
      if (isInsert && !/RETURNING\s+/i.test(sql)) {
        pgSql = sql + ' RETURNING id';
      }
      pgSql = convertPlaceholders(pgSql);
      pool.query(pgSql, params || [])
        .then(result => {
          // emulate mysql2 result shape
          if (isInsert) {
            const fake = { insertId: result.rows && result.rows[0] ? result.rows[0].id : undefined, rows: result.rows };
            cb(null, fake);
          } else if (isSelect) {
            cb(null, result.rows);
          } else {
            cb(null, { affectedRows: result.rowCount || 0, rows: result.rows });
          }
        })
        .catch(err => cb(err));
    },
    // expose pool for advanced usages
    _pool: pool
  };

} else {
  // default: mysql2 pool
  const mysql = require('mysql2');
  const poolConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'clinic_db',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    waitForConnections: true,
    connectionLimit: process.env.DB_CONN_LIMIT ? Number(process.env.DB_CONN_LIMIT) : 10
  };

  // Optional SSL support (useful for PlanetScale or managed DBs)
  if (process.env.DB_SSL === 'true') {
    const ca = process.env.DB_SSL_CA || '';
    if (ca) {
      try {
        const caContent = fs.existsSync(ca) ? fs.readFileSync(ca) : Buffer.from(ca, 'base64').toString('utf8');
        poolConfig.ssl = { ca: caContent, rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' };
      } catch (e) {
        poolConfig.ssl = { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' };
      }
    } else {
      poolConfig.ssl = { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' };
    }
  }

  const pool = mysql.createPool(poolConfig);
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error de conexión a MySQL (pool):', err);
    } else {
      console.log('Conectado a MySQL (pool).');
      if (connection && connection.release) connection.release();
    }
  });

  module.exports = pool;
}
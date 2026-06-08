const db = require('./db');
const DB_CLIENT = (process.env.DB_CLIENT || 'mysql').toLowerCase();

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

async function columnExists(table, column) {
  if (DB_CLIENT === 'postgres' || DB_CLIENT === 'pg') {
    const rows = await query(
      "SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = ? AND column_name = ? LIMIT 1",
      [table, column],
    );
    return Array.isArray(rows) && rows.length > 0;
  }

  const rows = await query(`SHOW COLUMNS FROM ${table} LIKE ?`, [column]);
  return Array.isArray(rows) && rows.length > 0;
}

async function addColumnIfMissing(table, column, definition) {
  const exists = await columnExists(table, column);
  if (!exists) {
    await query(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
  }
}

async function modifyColumnIfNeeded(table, column, definition) {
  // Check if column already allows NULL
  if (DB_CLIENT === 'postgres' || DB_CLIENT === 'pg') {
    const rows = await query(
      "SELECT is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = ? AND column_name = ?",
      [table, column],
    );
    if (Array.isArray(rows) && rows.length > 0 && rows[0].is_nullable === 'NO') {
      try {
        await query(`ALTER TABLE ${table} ALTER COLUMN ${column} DROP NOT NULL`);
      } catch (e) {
        // Already allows NULL, ignore
      }
    }
  } else {
    // MySQL: modify column to allow NULL
    try {
      await query(`ALTER TABLE ${table} MODIFY COLUMN ${column} ${definition}`);
    } catch (e) {
      // Column may already be NULL, ignore error
    }
  }
}

async function ensureAppointmentSchema() {
  await addColumnIfMissing('appointments', 'status', "status VARCHAR(20) NOT NULL DEFAULT 'pending'");
  await addColumnIfMissing('appointments', 'cancel_reason', 'cancel_reason TEXT NULL');
  await addColumnIfMissing('users', 'clinical_observations', 'clinical_observations TEXT NULL');
  // Allow NULL in name column for anonymous appointments
  await modifyColumnIfNeeded('appointments', 'name', 'VARCHAR(150) DEFAULT NULL');
}

module.exports = {
  ensureAppointmentSchema,
};

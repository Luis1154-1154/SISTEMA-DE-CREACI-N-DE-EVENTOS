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

async function tableExists(table) {
  if (DB_CLIENT === 'postgres' || DB_CLIENT === 'pg') {
    const rows = await query(
      "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ? LIMIT 1",
      [table],
    );
    return Array.isArray(rows) && rows.length > 0;
  }
  const rows = await query("SHOW TABLES LIKE ?", [table]);
  return Array.isArray(rows) && rows.length > 0;
}

async function createTableIfNotExists(table, createSQL) {
  const exists = await tableExists(table);
  if (!exists) {
    await query(createSQL);
    console.log(`Tabla "${table}" creada.`);
  }
}

async function ensureAppointmentSchema() {
  // Create schedule/working tables if they don't exist
  if (DB_CLIENT === 'postgres' || DB_CLIENT === 'pg') {
    await createTableIfNotExists('clinic_settings', `
      CREATE TABLE IF NOT EXISTS clinic_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) NOT NULL UNIQUE,
        value VARCHAR(255)
      )
    `);
    await createTableIfNotExists('working_hours', `
      CREATE TABLE IF NOT EXISTS working_hours (
        id SERIAL PRIMARY KEY,
        day_of_week SMALLINT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        break_start TIME DEFAULT NULL,
        break_end TIME DEFAULT NULL,
        applies_forever BOOLEAN NOT NULL DEFAULT TRUE,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await createTableIfNotExists('working_exceptions', `
      CREATE TABLE IF NOT EXISTS working_exceptions (
        id SERIAL PRIMARY KEY,
        exception_date DATE NOT NULL,
        start_time TIME DEFAULT NULL,
        end_time TIME DEFAULT NULL,
        break_start TIME DEFAULT NULL,
        break_end TIME DEFAULT NULL,
        reason VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Seed default appointment interval
    await query(`INSERT INTO clinic_settings (key, value) SELECT 'appointment_interval_minutes','30' WHERE NOT EXISTS (SELECT 1 FROM clinic_settings WHERE key = 'appointment_interval_minutes')`);
    // Add missing columns for existing tables
    try { await query(`ALTER TABLE working_exceptions ADD COLUMN IF NOT EXISTS break_start TIME DEFAULT NULL`); } catch (e) {}
    try { await query(`ALTER TABLE working_exceptions ADD COLUMN IF NOT EXISTS break_end TIME DEFAULT NULL`); } catch (e) {}
  } else {
    await createTableIfNotExists('clinic_settings', `
      CREATE TABLE IF NOT EXISTS clinic_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        \`key\` VARCHAR(100) NOT NULL UNIQUE,
        \`value\` VARCHAR(255) DEFAULT NULL
      )
    `);
    await createTableIfNotExists('working_hours', `
      CREATE TABLE IF NOT EXISTS working_hours (
        id INT AUTO_INCREMENT PRIMARY KEY,
        day_of_week TINYINT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        break_start TIME DEFAULT NULL,
        break_end TIME DEFAULT NULL,
        applies_forever BOOLEAN NOT NULL DEFAULT TRUE,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await createTableIfNotExists('working_exceptions', `
      CREATE TABLE IF NOT EXISTS working_exceptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        exception_date DATE NOT NULL,
        start_time TIME DEFAULT NULL,
        end_time TIME DEFAULT NULL,
        break_start TIME DEFAULT NULL,
        break_end TIME DEFAULT NULL,
        reason VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Seed default appointment interval
    await query(`INSERT INTO clinic_settings (\`key\`, \`value\`) SELECT 'appointment_interval_minutes', '30' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM clinic_settings WHERE \`key\` = 'appointment_interval_minutes')`);
    // Add missing columns for existing tables
    try { await query(`ALTER TABLE working_exceptions ADD COLUMN break_start TIME DEFAULT NULL`); } catch (e) {}
    try { await query(`ALTER TABLE working_exceptions ADD COLUMN break_end TIME DEFAULT NULL`); } catch (e) {}
  }

  await addColumnIfMissing('appointments', 'status', "status VARCHAR(20) NOT NULL DEFAULT 'pending'");
  await addColumnIfMissing('appointments', 'cancel_reason', 'cancel_reason TEXT NULL');
  await addColumnIfMissing('appointments', 'admin_observations', 'admin_observations TEXT NULL');
  await addColumnIfMissing('users', 'country_code', "country_code VARCHAR(10) NULL");
  await addColumnIfMissing('users', 'password_reset_token', 'password_reset_token VARCHAR(50) NULL');
  await addColumnIfMissing('users', 'password_reset_expires', DB_CLIENT === 'postgres' || DB_CLIENT === 'pg' ? 'password_reset_expires TIMESTAMP NULL' : 'password_reset_expires DATETIME NULL');
  await addColumnIfMissing('users', 'clinical_observations', 'clinical_observations TEXT NULL');
  await addColumnIfMissing('users', 'birthdate', 'birthdate DATE NULL');
  await addColumnIfMissing('users', 'sex', "sex VARCHAR(32) NULL");
  await addColumnIfMissing('users', 'identification', "identification VARCHAR(150) NULL");
  await addColumnIfMissing('users', 'occupation', "occupation VARCHAR(150) NULL");
  await addColumnIfMissing('users', 'weight', 'weight DECIMAL(6,2) NULL');
  await addColumnIfMissing('users', 'allergies', 'allergies TEXT NULL');
  await addColumnIfMissing('users', 'blood_type', "blood_type VARCHAR(10) NULL");
  await addColumnIfMissing('users', 'chronic_conditions', 'chronic_conditions TEXT NULL');
  // Allow NULL in name column for anonymous appointments
  await modifyColumnIfNeeded('appointments', 'name', 'VARCHAR(150) DEFAULT NULL');
}

module.exports = {
  ensureAppointmentSchema,
};

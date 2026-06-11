-- Postgres-ready schema for the clinic appointment system

-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255),
  role VARCHAR(10) NOT NULL DEFAULT 'user',
  birthdate DATE,
  sex VARCHAR(32),
  identification VARCHAR(150),
  occupation VARCHAR(150),
  weight NUMERIC(6,2),
  allergies TEXT,
  blood_type VARCHAR(10),
  chronic_conditions TEXT,
  clinical_observations TEXT,
  password_reset_token VARCHAR(50),
  password_reset_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  user_id INT DEFAULT NULL,
  phone VARCHAR(50),
  name VARCHAR(150),
  date DATE NOT NULL,
  time TIME NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  cancel_reason TEXT,
  admin_observations TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE appointments
  ADD CONSTRAINT IF NOT EXISTS fk_appointment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);

-- Clinic settings
CREATE TABLE IF NOT EXISTS clinic_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) NOT NULL UNIQUE,
  value VARCHAR(255)
);

-- Working hours
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
);

-- Working exceptions
CREATE TABLE IF NOT EXISTS working_exceptions (
  id SERIAL PRIMARY KEY,
  exception_date DATE NOT NULL,
  start_time TIME DEFAULT NULL,
  end_time TIME DEFAULT NULL,
  reason VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed default appointment interval
INSERT INTO clinic_settings (key, value)
SELECT 'appointment_interval_minutes','30'
WHERE NOT EXISTS (SELECT 1 FROM clinic_settings WHERE key = 'appointment_interval_minutes');

-- Seed admin account
INSERT INTO users (phone, name, password, role)
SELECT '3123170997','Administrador','admin','admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone = '3123170997');

-- Unique index to prevent double bookings
CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_date_time_not_canceled
ON appointments (date, time)
WHERE COALESCE(status, 'pending') <> 'canceled';

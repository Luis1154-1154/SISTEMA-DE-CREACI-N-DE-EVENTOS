-- Clinic appointments schema
CREATE DATABASE IF NOT EXISTS clinic_db;
USE clinic_db;

-- Users: patients and admin
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) DEFAULT NULL,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  birthdate DATE DEFAULT NULL,
  sex VARCHAR(32) DEFAULT NULL,
  identification VARCHAR(150) DEFAULT NULL,
  occupation VARCHAR(150) DEFAULT NULL,
  weight DECIMAL(6,2) DEFAULT NULL,
  allergies TEXT DEFAULT NULL,
  blood_type VARCHAR(10) DEFAULT NULL,
  chronic_conditions TEXT DEFAULT NULL,
  clinical_observations TEXT DEFAULT NULL,
  password_reset_token VARCHAR(50) DEFAULT NULL,
  password_reset_expires DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointments: linked to users (who created them), store snapshot of contact data
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  name VARCHAR(150) DEFAULT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  cancel_reason TEXT DEFAULT NULL,
  admin_observations TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_appointment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT uq_user_datetime UNIQUE (user_id, date, time)
);

-- Faster lookups by date
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE UNIQUE INDEX uq_appointments_date_time ON appointments(date, time);

-- Seed admin account (phone and password as requested). Replace password hashing in production.
INSERT INTO users (phone, name, password, role)
SELECT '3123170997', 'Administrador', 'admin', 'admin'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone = '3123170997');


-- Clinic scheduling settings: appointment interval and other key/value settings
CREATE TABLE IF NOT EXISTS clinic_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(100) NOT NULL UNIQUE,
  `value` VARCHAR(255) DEFAULT NULL
);

-- Recurring working hours / schedule rules
CREATE TABLE IF NOT EXISTS working_hours (
  id INT AUTO_INCREMENT PRIMARY KEY,
  -- 0 = Sunday ... 6 = Saturday. NULL means applies to any day (global rule)
  day_of_week TINYINT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_start TIME DEFAULT NULL,
  break_end TIME DEFAULT NULL,
  -- If true, this rule is recurring (applies every week); if false it's for a specific date (use NULL day_of_week and manage via exceptions)
  applies_forever BOOLEAN NOT NULL DEFAULT TRUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Specific exceptions (days or periods when scheduling is not allowed)
CREATE TABLE IF NOT EXISTS working_exceptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  exception_date DATE NOT NULL,
  start_time TIME DEFAULT NULL,
  end_time TIME DEFAULT NULL,
  reason VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default appointment interval (minutes). Admin UI will edit this setting.
INSERT INTO clinic_settings (`key`, `value`)
SELECT 'appointment_interval_minutes', '30' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM clinic_settings WHERE `key` = 'appointment_interval_minutes');



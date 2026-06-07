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
  clinical_observations TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointments: linked to users (who created them), store snapshot of contact data
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  name VARCHAR(150) NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  cancel_reason TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_appointment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT uq_user_datetime UNIQUE (user_id, date, time)
);

-- Faster lookups by date
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);

-- Seed admin account (phone and password as requested). Replace password hashing in production.
INSERT INTO users (phone, name, password, role)
SELECT '3123170997', 'Administrador', 'admin', 'admin'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone = '3123170997');



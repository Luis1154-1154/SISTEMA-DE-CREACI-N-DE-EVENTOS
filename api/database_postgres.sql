-- Postgres version of clinic schema for Supabase

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) DEFAULT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  phone VARCHAR(50) DEFAULT NULL,
  name VARCHAR(150) NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  cancel_reason TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Unique constraint for same user at same datetime (NULL user_id allowed)
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_datetime ON appointments (user_id, date, time);

-- Index for fast date lookups
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments (date);

-- Prevent duplicate user names
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_name ON users (name);

-- Seed admin user if not exists (phone 3123170997)
INSERT INTO users (phone, name, password, role)
SELECT '3123170997', 'Administrador', '$2a$10$oUuqz0c5fnobz6c7eWP9uuDS/9GxPVl5Hk1kSg2grUWP0ZUphP.q2', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone = '3123170997');

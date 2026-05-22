CREATE DATABASE IF NOT EXISTS eventos_db;
USE eventos_db;

CREATE TABLE IF NOT EXISTS categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS eventos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  ubicacion VARCHAR(200) NOT NULL,
  lugar_id INT DEFAULT NULL,
  estatus ENUM('activo','cancelado','finalizado') DEFAULT 'activo',
  metodo_inscripcion VARCHAR(50) DEFAULT 'gratuito',
  tipo VARCHAR(50) DEFAULT NULL,
  descripcion TEXT,
  organizador VARCHAR(150),
  organizador_id INT DEFAULT NULL,
  categoria_id INT,
  CONSTRAINT fk_evento_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS participantes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  telefono VARCHAR(30)
);

CREATE TABLE IF NOT EXISTS inscripciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  evento_id INT NOT NULL,
  participante_id INT NOT NULL,
  asistio TINYINT(1) DEFAULT 0,
  metodo VARCHAR(50) DEFAULT 'gratuito',
  fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_inscripcion_evento FOREIGN KEY (evento_id) REFERENCES eventos(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_inscripcion_participante FOREIGN KEY (participante_id) REFERENCES participantes(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT uq_evento_participante UNIQUE (evento_id, participante_id)
);

CREATE TABLE IF NOT EXISTS lugares (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  direccion VARCHAR(255) DEFAULT NULL,
  capacidad INT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  contrasena VARCHAR(255) DEFAULT NULL,
  rol ENUM('organizador','participante','invitado','administrador') DEFAULT 'participante'
);

-- Seed categorias predefinidas (no duplicar si ya existen)
INSERT INTO categorias (nombre)
SELECT 'Tecnología' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre = 'Tecnología');
INSERT INTO categorias (nombre)
SELECT 'Educativos' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre = 'Educativos');
INSERT INTO categorias (nombre)
SELECT 'Culturales' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre = 'Culturales');
INSERT INTO categorias (nombre)
SELECT 'Sociales' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre = 'Sociales');
INSERT INTO categorias (nombre)
SELECT 'Deportivos' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre = 'Deportivos');
INSERT INTO categorias (nombre)
SELECT 'Conferencias' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre = 'Conferencias');
INSERT INTO categorias (nombre)
SELECT 'Talleres' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre = 'Talleres');


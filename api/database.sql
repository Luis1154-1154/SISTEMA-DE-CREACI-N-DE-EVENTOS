CREATE DATABASE IF NOT EXISTS eventos_db;
USE eventos_db;

CREATE TABLE IF NOT EXISTS categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT
);

CREATE TABLE IF NOT EXISTS eventos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  ubicacion VARCHAR(200) NOT NULL,
  descripcion TEXT,
  organizador VARCHAR(150),
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
  fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_inscripcion_evento FOREIGN KEY (evento_id) REFERENCES eventos(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_inscripcion_participante FOREIGN KEY (participante_id) REFERENCES participantes(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT uq_evento_participante UNIQUE (evento_id, participante_id)
);

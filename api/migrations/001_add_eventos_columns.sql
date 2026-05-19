-- Migration: add missing columns to `eventos` table
-- Safe: uses IF NOT EXISTS for MySQL 8+. If your MySQL version doesn't support IF NOT EXISTS,
-- run the statements that apply to your schema manually.

SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE eventos
  ADD COLUMN IF NOT EXISTS lugar_id INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS estatus ENUM('activo','cancelado','finalizado') DEFAULT 'activo',
  ADD COLUMN IF NOT EXISTS metodo_inscripcion VARCHAR(50) DEFAULT 'gratuito',
  ADD COLUMN IF NOT EXISTS tipo VARCHAR(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS descripcion TEXT,
  ADD COLUMN IF NOT EXISTS organizador_id INT DEFAULT NULL;

SET FOREIGN_KEY_CHECKS = 1;

-- Note: This migration does NOT add foreign key constraints to avoid errors if referenced
-- tables or data do not exist yet. To add constraints later:
-- ALTER TABLE eventos ADD CONSTRAINT fk_evento_lugar FOREIGN KEY (lugar_id) REFERENCES lugares(id) ON DELETE SET NULL ON UPDATE CASCADE;
-- ALTER TABLE eventos ADD CONSTRAINT fk_evento_organizador FOREIGN KEY (organizador_id) REFERENCES usuarios(id) ON DELETE SET NULL ON UPDATE CASCADE;

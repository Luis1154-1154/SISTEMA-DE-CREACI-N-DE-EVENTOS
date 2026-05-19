-- Seed predefinidas para `categorias`
INSERT INTO categorias (nombre) VALUES
('Conferencias'),
('Talleres'),
('Deportes'),
('Cultura'),
('Sociales')
ON DUPLICATE KEY UPDATE nombre = nombre;

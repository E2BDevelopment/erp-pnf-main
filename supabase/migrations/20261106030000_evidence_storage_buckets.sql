-- Buckets privados que la app usa para evidencias. Las policies ya existen en
-- migraciones previas, pero la fila en storage.buckets nunca se creó: sin ella
-- cualquier subida falla con "Bucket not found".
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('almacen-remisiones', 'almacen-remisiones', false),
  ('gastos-obra-comprobantes', 'gastos-obra-comprobantes', false),
  ('caja-chica-evidencias', 'caja-chica-evidencias', false),
  ('company-logos', 'company-logos', false)
ON CONFLICT (id) DO NOTHING;

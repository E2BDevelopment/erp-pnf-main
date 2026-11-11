ALTER TABLE public.cotizacion_solicitudes
  ADD COLUMN IF NOT EXISTS pdf_path text,
  ADD COLUMN IF NOT EXISTS pdf_nombre text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cotizaciones-proveedores',
  'cotizaciones-proveedores',
  false,
  20971520,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "cotizacion_pdf_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'cotizaciones-proveedores'
    AND (storage.foldername(name))[1] = public.current_company_id()::text
    AND EXISTS (
      SELECT 1
      FROM public.cotizacion_solicitudes s
      JOIN public.requisiciones r ON r.id = s.requisicion_id
      WHERE s.id = ((storage.foldername(name))[2])::uuid
        AND s.company_id = public.current_company_id()
        AND r.company_id = s.company_id
        AND (
          public.has_obra_permission(r.obra_id, 'requisiciones.ver')
          OR public.has_obra_permission(r.obra_id, 'cotizaciones.gestionar')
        )
    )
  );

CREATE POLICY "cotizacion_pdf_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'cotizaciones-proveedores'
    AND (storage.foldername(name))[1] = public.current_company_id()::text
    AND (storage.filename(name)) ~ '^[0-9a-f]{32}[.]pdf$'
    AND EXISTS (
      SELECT 1
      FROM public.cotizacion_solicitudes s
      JOIN public.requisiciones r ON r.id = s.requisicion_id
      WHERE s.id = ((storage.foldername(name))[2])::uuid
        AND s.company_id = public.current_company_id()
        AND r.company_id = s.company_id
        AND public.has_obra_permission(r.obra_id, 'cotizaciones.gestionar')
    )
  );

CREATE POLICY "cotizacion_pdf_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'cotizaciones-proveedores'
    AND (storage.foldername(name))[1] = public.current_company_id()::text
    AND EXISTS (
      SELECT 1
      FROM public.cotizacion_solicitudes s
      JOIN public.requisiciones r ON r.id = s.requisicion_id
      WHERE s.id = ((storage.foldername(name))[2])::uuid
        AND s.company_id = public.current_company_id()
        AND r.company_id = s.company_id
        AND public.has_obra_permission(r.obra_id, 'cotizaciones.gestionar')
    )
  );

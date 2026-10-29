-- Tabla de documentos de la empresa
CREATE TABLE IF NOT EXISTS public.company_documentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  url TEXT NOT NULL,
  nombre_archivo TEXT NOT NULL,
  fecha_vencimiento DATE NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, tipo)
);

CREATE INDEX IF NOT EXISTS idx_company_documentos_company ON public.company_documentos (company_id);
CREATE INDEX IF NOT EXISTS idx_company_documentos_vencimiento ON public.company_documentos (fecha_vencimiento);

ALTER TABLE public.company_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read company_documentos in own company"
  ON public.company_documentos FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "Director manage company_documentos"
  ON public.company_documentos FOR ALL TO authenticated
  USING (
    public.is_director_of(company_id)
    OR public.has_role(auth.uid(), company_id, 'administrativo'::public.app_role)
  )
  WITH CHECK (
    public.is_director_of(company_id)
    OR public.has_role(auth.uid(), company_id, 'administrativo'::public.app_role)
  );

-- Bucket para storage de documentos de la empresa
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-docs', 'company-docs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users read company-docs in own company"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'company-docs'
    AND (storage.foldername(name))[1] = public.current_company_id()::text
  );

CREATE POLICY "Director manage company-docs storage"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'company-docs'
    AND (
      public.is_director_of(((storage.foldername(name))[1])::uuid)
      OR public.has_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'administrativo'::public.app_role)
    )
  )
  WITH CHECK (
    bucket_id = 'company-docs'
    AND (
      public.is_director_of(((storage.foldername(name))[1])::uuid)
      OR public.has_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'administrativo'::public.app_role)
    )
  );

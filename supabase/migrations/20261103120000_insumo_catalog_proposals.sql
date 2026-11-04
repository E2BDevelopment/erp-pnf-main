ALTER TABLE public.insumo_unidades
  ADD COLUMN estatus text NOT NULL DEFAULT 'autorizado' CHECK (estatus IN ('pendiente', 'autorizado')),
  ADD COLUMN solicitado_por uuid REFERENCES auth.users(id),
  ADD COLUMN autorizado_por uuid REFERENCES auth.users(id),
  ADD COLUMN autorizado_at timestamptz;

ALTER TABLE public.insumo_categorias
  ADD COLUMN estatus text NOT NULL DEFAULT 'autorizado' CHECK (estatus IN ('pendiente', 'autorizado', 'rechazado')),
  ADD COLUMN solicitado_por uuid REFERENCES auth.users(id),
  ADD COLUMN autorizado_por uuid REFERENCES auth.users(id),
  ADD COLUMN autorizado_at timestamptz;

CREATE POLICY "Users propose unidades in own company"
  ON public.insumo_unidades FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_company_id() AND estatus = 'pendiente' AND solicitado_por = auth.uid());

CREATE POLICY "Users propose categorias in own company"
  ON public.insumo_categorias FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_company_id() AND estatus = 'pendiente' AND solicitado_por = auth.uid());

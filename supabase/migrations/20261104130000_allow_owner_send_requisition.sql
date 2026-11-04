CREATE POLICY "Creators update own requisition drafts"
  ON public.requisiciones FOR UPDATE TO authenticated
  USING (
    creado_por = auth.uid()
    AND company_id = public.current_company_id()
    AND estatus = 'borrador'
  )
  WITH CHECK (
    creado_por = auth.uid()
    AND company_id = public.current_company_id()
    AND estatus IN ('borrador', 'enviada')
  );

-- Restrict payroll reads to company-wide roles or members of the row's obra.
DROP POLICY IF EXISTS "Users see nominas in own company" ON public.obra_nominas;
CREATE POLICY "Users see nominas in own company or obra"
  ON public.obra_nominas FOR SELECT TO authenticated
  USING (
    company_id = public.current_company_id()
    AND (
      public.is_director_of(company_id)
      OR public.has_role(auth.uid(), company_id, 'administrativo'::public.app_role)
      OR public.is_member_of_obra(obra_id)
    )
  );

DROP POLICY IF EXISTS "Users see nomina renglones in own company" ON public.obra_nomina_renglones;
CREATE POLICY "Users see renglones in own company or obra"
  ON public.obra_nomina_renglones FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.obra_nominas n
      WHERE n.id = obra_nomina_renglones.nomina_id
        AND n.company_id = public.current_company_id()
        AND (
          public.is_director_of(n.company_id)
          OR public.has_role(auth.uid(), n.company_id, 'administrativo'::public.app_role)
          OR public.is_member_of_obra(n.obra_id)
        )
    )
  );

DROP POLICY IF EXISTS "Users see nomina asistencias in own company" ON public.obra_nomina_asistencias;
CREATE POLICY "Users see asistencias in own company or obra"
  ON public.obra_nomina_asistencias FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.obra_nomina_renglones r
      JOIN public.obra_nominas n ON n.id = r.nomina_id
      WHERE r.id = obra_nomina_asistencias.renglon_id
        AND n.company_id = public.current_company_id()
        AND (
          public.is_director_of(n.company_id)
          OR public.has_role(auth.uid(), n.company_id, 'administrativo'::public.app_role)
          OR public.is_member_of_obra(n.obra_id)
        )
    )
  );

-- Evidence keys begin with company/obra for remissions and obra for expenses.
DROP POLICY IF EXISTS "Ver comprobantes gastos de obra" ON storage.objects;
DROP POLICY IF EXISTS "Subir comprobantes gastos de obra" ON storage.objects;
DROP POLICY IF EXISTS "Actualizar comprobantes gastos de obra" ON storage.objects;
DROP POLICY IF EXISTS "Eliminar comprobantes gastos de obra" ON storage.objects;

CREATE POLICY "Ver comprobantes gastos de obra"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'gastos-obra-comprobantes'
    AND EXISTS (
      SELECT 1 FROM public.obras o
      WHERE o.id::text = (storage.foldername(name))[1]
        AND o.company_id = public.current_company_id()
    )
  );
CREATE POLICY "Subir comprobantes gastos de obra"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'gastos-obra-comprobantes'
    AND EXISTS (
      SELECT 1 FROM public.obras o
      WHERE o.id::text = (storage.foldername(name))[1]
        AND o.company_id = public.current_company_id()
        AND public.is_member_of_obra(o.id)
    )
  );
CREATE POLICY "Actualizar comprobantes gastos de obra"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'gastos-obra-comprobantes'
    AND EXISTS (
      SELECT 1 FROM public.obras o
      WHERE o.id::text = (storage.foldername(name))[1]
        AND o.company_id = public.current_company_id()
    )
  ) WITH CHECK (
    bucket_id = 'gastos-obra-comprobantes'
    AND EXISTS (
      SELECT 1 FROM public.obras o
      WHERE o.id::text = (storage.foldername(name))[1]
        AND o.company_id = public.current_company_id()
    )
  );
CREATE POLICY "Eliminar comprobantes gastos de obra"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'gastos-obra-comprobantes'
    AND EXISTS (
      SELECT 1 FROM public.obras o
      WHERE o.id::text = (storage.foldername(name))[1]
        AND o.company_id = public.current_company_id()
    )
  );

DROP POLICY IF EXISTS "almacen_remisiones_select_auth" ON storage.objects;
DROP POLICY IF EXISTS "almacen_remisiones_insert_auth" ON storage.objects;
DROP POLICY IF EXISTS "almacen_remisiones_update_auth" ON storage.objects;
DROP POLICY IF EXISTS "almacen_remisiones_delete_auth" ON storage.objects;
CREATE POLICY "almacen_remisiones_select_auth"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'almacen-remisiones'
    AND (storage.foldername(name))[1] = public.current_company_id()::text
  );
CREATE POLICY "almacen_remisiones_insert_auth"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'almacen-remisiones'
    AND (storage.foldername(name))[1] = public.current_company_id()::text
    AND public.is_member_of_obra(((storage.foldername(name))[2])::uuid)
  );
CREATE POLICY "almacen_remisiones_update_auth"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'almacen-remisiones'
    AND (storage.foldername(name))[1] = public.current_company_id()::text
  ) WITH CHECK (
    bucket_id = 'almacen-remisiones'
    AND (storage.foldername(name))[1] = public.current_company_id()::text
  );
CREATE POLICY "almacen_remisiones_delete_auth"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'almacen-remisiones'
    AND (storage.foldername(name))[1] = public.current_company_id()::text
  );

DROP POLICY IF EXISTS "almacen_remisiones_insert_auth" ON storage.objects;

CREATE POLICY "almacen_remisiones_insert_auth"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'almacen-remisiones'
    AND (storage.foldername(name))[1] = public.current_company_id()::text
    AND EXISTS (
      SELECT 1
      FROM public.obras o
      WHERE o.id = ((storage.foldername(name))[2])::uuid
        AND o.company_id = public.current_company_id()
        AND (public.is_director_of(o.company_id) OR public.is_member_of_obra(o.id))
    )
  );

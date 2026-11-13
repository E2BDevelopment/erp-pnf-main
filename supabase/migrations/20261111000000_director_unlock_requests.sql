-- Directors may submit an unlock request when using the request flow themselves.
DROP POLICY IF EXISTS "Crear solicitudes residente/supervisor"
  ON public.almacen_semana_desbloqueo_solicitudes;

CREATE POLICY "Crear solicitudes de desbloqueo"
  ON public.almacen_semana_desbloqueo_solicitudes
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.current_company_id()
    AND solicitado_por = auth.uid()
    AND (
      public.is_director_of(company_id)
      OR public.is_residente_de_obra(obra_id)
      OR public.is_supervisor_de_obra(obra_id)
    )
  );

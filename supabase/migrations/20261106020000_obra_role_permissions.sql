-- Exceptions inherit the company matrix whenever a row is absent.
CREATE TABLE public.obra_role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  obra_id uuid NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role <> 'director'),
  action_key text NOT NULL,
  allowed boolean NOT NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, obra_id, role, action_key)
);
ALTER TABLE public.obra_role_permissions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.obra_role_permissions TO authenticated;
GRANT ALL ON public.obra_role_permissions TO service_role;

CREATE POLICY "Read accessible obra permissions" ON public.obra_role_permissions
  FOR SELECT TO authenticated USING (
    company_id = public.current_company_id() AND public.can_access_obra(obra_id)
  );
CREATE POLICY "Director configures obra permissions" ON public.obra_role_permissions
  FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_director_of(company_id))
  WITH CHECK (company_id = public.current_company_id() AND public.is_director_of(company_id));

CREATE TRIGGER validate_permission_role BEFORE INSERT OR UPDATE ON public.obra_role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.validate_permission_role();
CREATE TRIGGER audit_log_row_change AFTER INSERT OR UPDATE OR DELETE ON public.obra_role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.capture_audit_log();

CREATE FUNCTION public.validate_obra_permission() RETURNS trigger
LANGUAGE plpgsql SET search_path = public, auth AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.obras o WHERE o.id = NEW.obra_id AND o.company_id = NEW.company_id) THEN
    RAISE EXCEPTION 'Obra no válida para esta empresa';
  END IF;
  IF NOT public.is_obra_permission_action(NEW.action_key) THEN
    RAISE EXCEPTION 'La acción no admite permisos por obra';
  END IF;
  NEW.updated_by := auth.uid();
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_obra_permission BEFORE INSERT OR UPDATE ON public.obra_role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.validate_obra_permission();

-- The catalog/default function below is a snapshot of the TypeScript catalog.
-- A contract test checks parity so future actions cannot silently diverge.

CREATE FUNCTION public.obra_permission_defaults() RETURNS jsonb
LANGUAGE sql IMMUTABLE SET search_path = public AS $$ SELECT '{"obras.editar":{"residente":false,"auxiliar":false,"administrativo":true,"supervisor":false},"obras.eliminar":{"residente":false,"auxiliar":false,"administrativo":false,"supervisor":false},"obras.asignar_team":{"residente":false,"auxiliar":false,"administrativo":true,"supervisor":false},"presupuestos.crear_base":{"residente":false,"auxiliar":false,"administrativo":false,"supervisor":false},"presupuestos.autorizar_base":{"residente":false,"auxiliar":false,"administrativo":false,"supervisor":false},"presupuestos.eliminar_base":{"residente":false,"auxiliar":false,"administrativo":false,"supervisor":false},"presupuestos.crear_oc":{"residente":true,"auxiliar":false,"administrativo":false,"supervisor":false},"presupuestos.autorizar_oc":{"residente":false,"auxiliar":false,"administrativo":false,"supervisor":true},"presupuestos.eliminar_oc":{"residente":true,"auxiliar":false,"administrativo":false,"supervisor":false},"requisiciones.crear":{"residente":true,"auxiliar":false,"administrativo":false,"supervisor":true},"requisiciones.aprobar":{"residente":false,"auxiliar":false,"administrativo":false,"supervisor":true},"requisiciones.rechazar":{"residente":false,"auxiliar":false,"administrativo":false,"supervisor":true},"requisiciones.ver_oc":{"residente":false,"auxiliar":false,"administrativo":true,"supervisor":true},"cotizaciones.gestionar":{"residente":false,"auxiliar":false,"administrativo":true,"supervisor":false},"oc.crear":{"residente":false,"auxiliar":false,"administrativo":true,"supervisor":false},"oc.autorizar":{"residente":false,"auxiliar":false,"administrativo":false,"supervisor":true},"oc.cancelar":{"residente":false,"auxiliar":false,"administrativo":true,"supervisor":true},"almacen.recibir":{"residente":true,"auxiliar":false,"administrativo":false,"supervisor":false},"almacen.cerrar_semana":{"residente":true,"auxiliar":false,"administrativo":false,"supervisor":false},"almacen.desbloquear_semana":{"residente":false,"auxiliar":false,"administrativo":true,"supervisor":false},"gastos_obra.crear":{"residente":true,"auxiliar":false,"administrativo":false,"supervisor":false},"gastos_obra.autorizar":{"residente":false,"auxiliar":false,"administrativo":false,"supervisor":true},"caja_chica.solicitar_fondo":{"residente":true,"auxiliar":false,"administrativo":false,"supervisor":false},"caja_chica.autorizar_fondo":{"residente":false,"auxiliar":false,"administrativo":true,"supervisor":false},"caja_chica.registrar_gasto":{"residente":true,"auxiliar":false,"administrativo":false,"supervisor":false},"caja_chica.aprobar_gasto":{"residente":false,"auxiliar":false,"administrativo":false,"supervisor":true},"caja_chica.solicitar_reembolso":{"residente":true,"auxiliar":false,"administrativo":false,"supervisor":false},"caja_chica.autorizar_reembolso":{"residente":false,"auxiliar":false,"administrativo":true,"supervisor":false},"caja_chica.reclasificar_comprobante":{"residente":false,"auxiliar":false,"administrativo":true,"supervisor":false},"cxp.ver":{"residente":false,"auxiliar":false,"administrativo":true,"supervisor":true},"cxp.registrar_pago":{"residente":false,"auxiliar":false,"administrativo":true,"supervisor":false},"cxp.cancelar_pago":{"residente":false,"auxiliar":false,"administrativo":true,"supervisor":false},"nomina_obra.registrar_asistencia":{"residente":true,"auxiliar":false,"administrativo":false,"supervisor":false},"nomina_obra.generar":{"residente":true,"auxiliar":false,"administrativo":false,"supervisor":false},"nomina_obra.autorizar":{"residente":false,"auxiliar":false,"administrativo":true,"supervisor":false},"destajos.crear":{"residente":false,"auxiliar":false,"administrativo":true,"supervisor":false},"destajos.estimar":{"residente":true,"auxiliar":false,"administrativo":false,"supervisor":false},"destajos.autorizar_estimacion":{"residente":false,"auxiliar":false,"administrativo":false,"supervisor":true},"subcontratos.crear":{"residente":false,"auxiliar":false,"administrativo":true,"supervisor":false},"subcontratos.autorizar_estimacion":{"residente":false,"auxiliar":false,"administrativo":false,"supervisor":true},"requisiciones.ver":{"residente":true,"auxiliar":true,"administrativo":true,"supervisor":true},"nomina.ver":{"residente":true,"auxiliar":true,"administrativo":true,"supervisor":true},"destajos.ver":{"residente":true,"auxiliar":true,"administrativo":true,"supervisor":true},"subcontratos.ver":{"residente":true,"auxiliar":true,"administrativo":true,"supervisor":true},"rentas.ver":{"residente":true,"auxiliar":true,"administrativo":true,"supervisor":true},"gasolinas.ver":{"residente":true,"auxiliar":true,"administrativo":true,"supervisor":true},"caja_chica.ver":{"residente":true,"auxiliar":true,"administrativo":true,"supervisor":true},"tareas.ver":{"residente":true,"auxiliar":true,"administrativo":true,"supervisor":true}}'::jsonb $$;
CREATE FUNCTION public.is_obra_permission_action(_action text) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path = public AS $$ SELECT public.obra_permission_defaults() ? _action $$;

CREATE FUNCTION public.has_obra_permission(_obra_id uuid, _action text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.obras o
    JOIN public.user_roles ur ON ur.company_id = o.company_id AND ur.user_id = auth.uid()
    LEFT JOIN public.role_permissions cp ON cp.company_id = o.company_id
      AND cp.role = COALESCE(ur.custom_role_id::text, ur.role::text) AND cp.action_key = _action
    LEFT JOIN public.obra_role_permissions op ON op.company_id = o.company_id AND op.obra_id = o.id
      AND op.role = COALESCE(ur.custom_role_id::text, ur.role::text) AND op.action_key = _action
    WHERE o.id = _obra_id AND o.company_id = public.current_company_id()
      AND public.can_access_obra(o.id)
      AND (ur.role = 'director' OR (public.is_obra_permission_action(_action) AND
        COALESCE(op.allowed, cp.allowed,
          ur.custom_role_id IS NULL AND COALESCE((public.obra_permission_defaults() -> _action ->> ur.role::text)::boolean, false))))
  );
$$;

-- Existing RLS continues to enforce workflow responsibilities. This additional
-- guard applies an obra exception wherever legacy code uses role-only checks.
-- Without a relevant exception it preserves the incumbent workflow unchanged.
CREATE FUNCTION public.obra_permission_override_allows(_obra_id uuid, _action text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.obra_role_permissions op
    JOIN public.user_roles ur ON ur.company_id = op.company_id
      AND COALESCE(ur.custom_role_id::text, ur.role::text) = op.role
    WHERE op.obra_id = _obra_id AND op.action_key = _action AND ur.user_id = auth.uid()
  ) OR public.has_obra_permission(_obra_id, _action);
$$;
REVOKE ALL ON FUNCTION public.has_obra_permission(uuid, text), public.obra_permission_override_allows(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_obra_permission(uuid, text), public.obra_permission_override_allows(uuid, text) TO authenticated, service_role;

-- Paths are supplied only by the triggers installed below, never by API input.
CREATE FUNCTION public.resolve_obra_permission_row(_row jsonb, _path jsonb) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE step jsonb;
BEGIN
  FOR step IN SELECT value FROM jsonb_array_elements(_path) LOOP
    EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE id = $1', step ->> 'table')
      INTO _row USING (_row ->> (step ->> 'column'))::uuid;
    IF _row IS NULL THEN RETURN NULL; END IF;
  END LOOP;
  RETURN (_row ->> 'obra_id')::uuid;
END;
$$;
REVOKE ALL ON FUNCTION public.resolve_obra_permission_row(jsonb, jsonb) FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.enforce_obra_permission_override() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  row_data jsonb := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
  old_data jsonb := CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE '{}'::jsonb END;
  rules jsonb := TG_ARGV[1]::jsonb;
  action text := rules ->> lower(TG_OP);
  obra uuid;
  previous_obra uuid;
  change record;
  budget_type text;
BEGIN
  -- Service-role operations have explicit server permission checks; system jobs
  -- and cascades retain their existing behavior.
  IF auth.uid() IS NULL OR auth.role() = 'service_role' THEN RETURN COALESCE(NEW, OLD); END IF;
  IF TG_OP = 'UPDATE' THEN
    IF row_data -> 'estatus' IS DISTINCT FROM old_data -> 'estatus' THEN
      action := COALESCE(rules -> 'statuses' ->> (row_data ->> 'estatus'), action);
    END IF;
    FOR change IN SELECT * FROM jsonb_each_text(COALESCE(rules -> 'changes', '{}'::jsonb)) LOOP
      IF row_data -> change.key IS DISTINCT FROM old_data -> change.key THEN action := change.value; END IF;
    END LOOP;
  END IF;
  IF action IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;
  IF TG_TABLE_NAME = 'obra_presupuesto_renglones' THEN
    SELECT p.tipo::text INTO budget_type FROM public.obra_presupuestos p WHERE p.id = (row_data ->> 'presupuesto_id')::uuid;
  END IF;
  action := replace(action, '{budget}', CASE WHEN COALESCE(row_data ->> 'tipo', budget_type) = 'adenda' THEN 'oc' ELSE 'base' END);
  obra := public.resolve_obra_permission_row(row_data, TG_ARGV[0]::jsonb);
  IF TG_TABLE_NAME = 'obras' THEN obra := (row_data ->> 'id')::uuid; END IF;
  IF TG_TABLE_NAME = 'pagos' THEN
    IF row_data ->> 'cxp_id' IS NOT NULL THEN
      SELECT c.obra_id INTO obra FROM public.cuentas_por_pagar c WHERE c.id = (row_data ->> 'cxp_id')::uuid;
    ELSIF row_data ->> 'origen_tipo' = 'oc' THEN
      SELECT o.obra_id INTO obra FROM public.ordenes_compra o WHERE o.id = (row_data ->> 'origen_id')::uuid;
    END IF;
  END IF;
  IF NOT public.obra_permission_override_allows(obra, action) THEN
    RAISE EXCEPTION 'No tienes permiso para realizar esta acción en esta obra' USING ERRCODE = '42501';
  END IF;
  IF TG_OP = 'UPDATE' THEN
    previous_obra := public.resolve_obra_permission_row(old_data, TG_ARGV[0]::jsonb);
    IF previous_obra IS DISTINCT FROM obra AND NOT public.obra_permission_override_allows(previous_obra, action) THEN
      RAISE EXCEPTION 'No tienes permiso en la obra de origen' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_obra_permission_override() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER enforce_obra_permission BEFORE INSERT OR UPDATE OR DELETE ON public.obra_presupuesto_renglones
 FOR EACH ROW EXECUTE FUNCTION public.enforce_obra_permission_override('[{"column":"presupuesto_id","table":"obra_presupuestos"}]', '{"insert":"presupuestos.crear_{budget}","update":"presupuestos.crear_{budget}","delete":"presupuestos.crear_{budget}"}');
CREATE TRIGGER enforce_obra_permission BEFORE INSERT OR UPDATE OR DELETE ON public.pagos
 FOR EACH ROW EXECUTE FUNCTION public.enforce_obra_permission_override('[]', '{"insert":"cxp.registrar_pago","changes":{"cancelado_at":"cxp.cancelar_pago"}}');

-- Apply exception checks in SQL too; permissive workflow policies stay intact.
CREATE TRIGGER enforce_obra_permission BEFORE INSERT OR UPDATE OR DELETE ON public.obras
 FOR EACH ROW EXECUTE FUNCTION public.enforce_obra_permission_override('[]', '{"update":"obras.editar","delete":"obras.eliminar"}');
CREATE TRIGGER enforce_obra_permission BEFORE INSERT OR UPDATE OR DELETE ON public.obra_team
 FOR EACH ROW EXECUTE FUNCTION public.enforce_obra_permission_override('[]', '{"insert":"obras.asignar_team","update":"obras.asignar_team","delete":"obras.asignar_team"}');
CREATE TRIGGER enforce_obra_permission BEFORE INSERT OR UPDATE OR DELETE ON public.obra_comisiones
 FOR EACH ROW EXECUTE FUNCTION public.enforce_obra_permission_override('[]', '{"insert":"obras.asignar_team","update":"obras.asignar_team","delete":"obras.asignar_team"}');
CREATE TRIGGER enforce_obra_permission BEFORE INSERT OR UPDATE OR DELETE ON public.obra_presupuestos
 FOR EACH ROW EXECUTE FUNCTION public.enforce_obra_permission_override('[]', '{"insert":"presupuestos.crear_{budget}","delete":"presupuestos.eliminar_{budget}","statuses":{"solicitada":"presupuestos.crear_{budget}","autorizado":"presupuestos.autorizar_{budget}","rechazado":"presupuestos.autorizar_{budget}","borrador":"presupuestos.crear_{budget}"}}');
CREATE TRIGGER enforce_obra_permission BEFORE INSERT OR UPDATE OR DELETE ON public.requisiciones
 FOR EACH ROW EXECUTE FUNCTION public.enforce_obra_permission_override('[]', '{"insert":"requisiciones.crear","delete":"requisiciones.crear","statuses":{"enviada":"requisiciones.crear","borrador":"requisiciones.crear","autorizada":"requisiciones.aprobar","rechazada":"requisiciones.rechazar"}}');
CREATE POLICY obra_module_visibility ON public.requisiciones AS RESTRICTIVE FOR SELECT TO authenticated
 USING (public.obra_permission_override_allows(obra_id, 'requisiciones.ver'));
CREATE TRIGGER enforce_obra_permission BEFORE INSERT OR UPDATE OR DELETE ON public.requisicion_insumos
 FOR EACH ROW EXECUTE FUNCTION public.enforce_obra_permission_override('[{"column":"requisicion_id","table":"requisiciones"}]', '{"insert":"requisiciones.crear","update":"requisiciones.crear","delete":"requisiciones.crear"}');
CREATE POLICY obra_module_visibility ON public.requisicion_insumos AS RESTRICTIVE FOR SELECT TO authenticated
 USING ((SELECT p0.obra_id FROM public.requisiciones p0 WHERE p0.id = requisicion_insumos.requisicion_id) IS NOT NULL AND public.obra_permission_override_allows((SELECT p0.obra_id FROM public.requisiciones p0 WHERE p0.id = requisicion_insumos.requisicion_id), 'requisiciones.ver'));
CREATE TRIGGER enforce_obra_permission BEFORE INSERT OR UPDATE OR DELETE ON public.cotizacion_paquetes
 FOR EACH ROW EXECUTE FUNCTION public.enforce_obra_permission_override('[{"column":"requisicion_id","table":"requisiciones"}]', '{"insert":"cotizaciones.gestionar","update":"cotizaciones.gestionar","delete":"cotizaciones.gestionar"}');
CREATE POLICY obra_module_visibility ON public.cotizacion_paquetes AS RESTRICTIVE FOR SELECT TO authenticated
 USING ((SELECT p0.obra_id FROM public.requisiciones p0 WHERE p0.id = cotizacion_paquetes.requisicion_id) IS NOT NULL AND public.obra_permission_override_allows((SELECT p0.obra_id FROM public.requisiciones p0 WHERE p0.id = cotizacion_paquetes.requisicion_id), 'requisiciones.ver'));
CREATE TRIGGER enforce_obra_permission BEFORE INSERT OR UPDATE OR DELETE ON public.cotizacion_solicitudes
 FOR EACH ROW EXECUTE FUNCTION public.enforce_obra_permission_override('[{"column":"requisicion_id","table":"requisiciones"}]', '{"insert":"cotizaciones.gestionar","update":"cotizaciones.gestionar","delete":"cotizaciones.gestionar"}');
CREATE POLICY obra_module_visibility ON public.cotizacion_solicitudes AS RESTRICTIVE FOR SELECT TO authenticated
 USING ((SELECT p0.obra_id FROM public.requisiciones p0 WHERE p0.id = cotizacion_solicitudes.requisicion_id) IS NOT NULL AND public.obra_permission_override_allows((SELECT p0.obra_id FROM public.requisiciones p0 WHERE p0.id = cotizacion_solicitudes.requisicion_id), 'requisiciones.ver'));
CREATE TRIGGER enforce_obra_permission BEFORE INSERT OR UPDATE OR DELETE ON public.cotizacion_paquete_insumos
 FOR EACH ROW EXECUTE FUNCTION public.enforce_obra_permission_override('[{"column":"paquete_id","table":"cotizacion_paquetes"},{"column":"requisicion_id","table":"requisiciones"}]', '{"insert":"cotizaciones.gestionar","update":"cotizaciones.gestionar","delete":"cotizaciones.gestionar"}');
CREATE POLICY obra_module_visibility ON public.cotizacion_paquete_insumos AS RESTRICTIVE FOR SELECT TO authenticated
 USING ((SELECT p1.obra_id FROM public.cotizacion_paquetes p0 JOIN public.requisiciones p1 ON p1.id = p0.requisicion_id WHERE p0.id = cotizacion_paquete_insumos.paquete_id) IS NOT NULL AND public.obra_permission_override_allows((SELECT p1.obra_id FROM public.cotizacion_paquetes p0 JOIN public.requisiciones p1 ON p1.id = p0.requisicion_id WHERE p0.id = cotizacion_paquete_insumos.paquete_id), 'requisiciones.ver'));
CREATE TRIGGER enforce_obra_permission BEFORE INSERT OR UPDATE OR DELETE ON public.cotizacion_solicitud_insumos
 FOR EACH ROW EXECUTE FUNCTION public.enforce_obra_permission_override('[{"column":"solicitud_id","table":"cotizacion_solicitudes"},{"column":"requisicion_id","table":"requisiciones"}]', '{"insert":"cotizaciones.gestionar","update":"cotizaciones.gestionar","delete":"cotizaciones.gestionar"}');
CREATE POLICY obra_module_visibility ON public.cotizacion_solicitud_insumos AS RESTRICTIVE FOR SELECT TO authenticated
 USING ((SELECT p1.obra_id FROM public.cotizacion_solicitudes p0 JOIN public.requisiciones p1 ON p1.id = p0.requisicion_id WHERE p0.id = cotizacion_solicitud_insumos.solicitud_id) IS NOT NULL AND public.obra_permission_override_allows((SELECT p1.obra_id FROM public.cotizacion_solicitudes p0 JOIN public.requisiciones p1 ON p1.id = p0.requisicion_id WHERE p0.id = cotizacion_solicitud_insumos.solicitud_id), 'requisiciones.ver'));
CREATE TRIGGER enforce_obra_permission BEFORE INSERT OR UPDATE OR DELETE ON public.ordenes_compra
 FOR EACH ROW EXECUTE FUNCTION public.enforce_obra_permission_override('[]', '{"insert":"oc.crear","statuses":{"pendiente_autorizacion":"oc.crear","autorizada":"oc.autorizar","rechazada":"oc.cancelar","borrador":"oc.cancelar","enviada":"oc.crear"}}');
CREATE POLICY obra_module_visibility ON public.ordenes_compra AS RESTRICTIVE FOR SELECT TO authenticated
 USING (public.obra_permission_override_allows(obra_id, 'requisiciones.ver'));
CREATE TRIGGER enforce_obra_permission BEFORE INSERT OR UPDATE OR DELETE ON public.almacen_recepciones
 FOR EACH ROW EXECUTE FUNCTION public.enforce_obra_permission_override('[]', '{"insert":"almacen.recibir"}');
CREATE TRIGGER enforce_obra_permission BEFORE INSERT OR UPDATE OR DELETE ON public.almacen_semanas
 FOR EACH ROW EXECUTE FUNCTION public.enforce_obra_permission_override('[]', '{"statuses":{"cerrada":"almacen.cerrar_semana"}}');
CREATE TRIGGER enforce_obra_permission BEFORE INSERT OR UPDATE OR DELETE ON public.almacen_movimientos_semana
 FOR EACH ROW EXECUTE FUNCTION public.enforce_obra_permission_override('[{"column":"semana_id","table":"almacen_semanas"}]', '{"changes":{"utilizado":"almacen.cerrar_semana"}}');
CREATE TRIGGER enforce_obra_permission BEFORE INSERT OR UPDATE OR DELETE ON public.almacen_semana_desbloqueo_solicitudes
 FOR EACH ROW EXECUTE FUNCTION public.enforce_obra_permission_override('[]', '{"statuses":{"aprobada":"almacen.desbloquear_semana","rechazada":"almacen.desbloquear_semana"}}');
CREATE TRIGGER enforce_obra_permission BEFORE INSERT OR UPDATE OR DELETE ON public.obra_gastos_directos
 FOR EACH ROW EXECUTE FUNCTION public.enforce_obra_permission_override('[]', '{"insert":"gastos_obra.crear","statuses":{"autorizado":"gastos_obra.autorizar","rechazado":"gastos_obra.autorizar"}}');
CREATE TRIGGER enforce_obra_permission BEFORE INSERT OR UPDATE OR DELETE ON public.obra_gasto_directo_partidas
 FOR EACH ROW EXECUTE FUNCTION public.enforce_obra_permission_override('[{"column":"gasto_id","table":"obra_gastos_directos"}]', '{"insert":"gastos_obra.crear","update":"gastos_obra.crear","delete":"gastos_obra.crear"}');
CREATE TRIGGER enforce_obra_permission BEFORE INSERT OR UPDATE OR DELETE ON public.caja_chica_fondos
 FOR EACH ROW EXECUTE FUNCTION public.enforce_obra_permission_override('[]', '{"insert":"caja_chica.solicitar_fondo","statuses":{"autorizado":"caja_chica.autorizar_fondo","rechazado":"caja_chica.autorizar_fondo","entregado":"caja_chica.autorizar_fondo"}}');
CREATE POLICY obra_module_visibility ON public.caja_chica_fondos AS RESTRICTIVE FOR SELECT TO authenticated
 USING (public.obra_permission_override_allows(obra_id, 'caja_chica.ver'));
CREATE TRIGGER enforce_obra_permission BEFORE INSERT OR UPDATE OR DELETE ON public.caja_chica_gastos
 FOR EACH ROW EXECUTE FUNCTION public.enforce_obra_permission_override('[]', '{"insert":"caja_chica.registrar_gasto","delete":"caja_chica.registrar_gasto","statuses":{"aprobado":"caja_chica.aprobar_gasto","rechazado":"caja_chica.aprobar_gasto"},"changes":{"concepto":"caja_chica.registrar_gasto","monto":"caja_chica.registrar_gasto","comprobante_reclasificado_at":"caja_chica.reclasificar_comprobante"}}');
CREATE POLICY obra_module_visibility ON public.caja_chica_gastos AS RESTRICTIVE FOR SELECT TO authenticated
 USING (public.obra_permission_override_allows(obra_id, 'caja_chica.ver'));
CREATE TRIGGER enforce_obra_permission BEFORE INSERT OR UPDATE OR DELETE ON public.caja_chica_reembolsos
 FOR EACH ROW EXECUTE FUNCTION public.enforce_obra_permission_override('[]', '{"insert":"caja_chica.solicitar_reembolso","statuses":{"revisado":"caja_chica.aprobar_gasto","enviado_admin":"caja_chica.aprobar_gasto","repuesto":"caja_chica.autorizar_reembolso","rechazado":"caja_chica.autorizar_reembolso"}}');
CREATE POLICY obra_module_visibility ON public.caja_chica_reembolsos AS RESTRICTIVE FOR SELECT TO authenticated
 USING (public.obra_permission_override_allows(obra_id, 'caja_chica.ver'));
CREATE POLICY obra_module_visibility ON public.caja_chica_asignaciones AS RESTRICTIVE FOR SELECT TO authenticated
 USING (public.obra_permission_override_allows(obra_id, 'caja_chica.ver'));
CREATE TRIGGER enforce_obra_permission BEFORE INSERT OR UPDATE OR DELETE ON public.obra_nominas
 FOR EACH ROW EXECUTE FUNCTION public.enforce_obra_permission_override('[]', '{"insert":"nomina_obra.generar","delete":"nomina_obra.generar","statuses":{"cerrada":"nomina_obra.generar"}}');
CREATE POLICY obra_module_visibility ON public.obra_nominas AS RESTRICTIVE FOR SELECT TO authenticated
 USING (public.obra_permission_override_allows(obra_id, 'nomina.ver'));
CREATE TRIGGER enforce_obra_permission BEFORE INSERT OR UPDATE OR DELETE ON public.obra_nomina_renglones
 FOR EACH ROW EXECUTE FUNCTION public.enforce_obra_permission_override('[{"column":"nomina_id","table":"obra_nominas"}]', '{"insert":"nomina_obra.registrar_asistencia","delete":"nomina_obra.registrar_asistencia"}');
CREATE POLICY obra_module_visibility ON public.obra_nomina_renglones AS RESTRICTIVE FOR SELECT TO authenticated
 USING ((SELECT p0.obra_id FROM public.obra_nominas p0 WHERE p0.id = obra_nomina_renglones.nomina_id) IS NOT NULL AND public.obra_permission_override_allows((SELECT p0.obra_id FROM public.obra_nominas p0 WHERE p0.id = obra_nomina_renglones.nomina_id), 'nomina.ver'));
CREATE TRIGGER enforce_obra_permission BEFORE INSERT OR UPDATE OR DELETE ON public.obra_nomina_asistencias
 FOR EACH ROW EXECUTE FUNCTION public.enforce_obra_permission_override('[{"column":"renglon_id","table":"obra_nomina_renglones"},{"column":"nomina_id","table":"obra_nominas"}]', '{"insert":"nomina_obra.registrar_asistencia","update":"nomina_obra.registrar_asistencia","changes":{"ajustado_at":"nomina_obra.autorizar"}}');
CREATE POLICY obra_module_visibility ON public.obra_nomina_asistencias AS RESTRICTIVE FOR SELECT TO authenticated
 USING ((SELECT p1.obra_id FROM public.obra_nomina_renglones p0 JOIN public.obra_nominas p1 ON p1.id = p0.nomina_id WHERE p0.id = obra_nomina_asistencias.renglon_id) IS NOT NULL AND public.obra_permission_override_allows((SELECT p1.obra_id FROM public.obra_nomina_renglones p0 JOIN public.obra_nominas p1 ON p1.id = p0.nomina_id WHERE p0.id = obra_nomina_asistencias.renglon_id), 'nomina.ver'));
CREATE TRIGGER enforce_obra_permission BEFORE INSERT OR UPDATE OR DELETE ON public.obra_destajos
 FOR EACH ROW EXECUTE FUNCTION public.enforce_obra_permission_override('[]', '{"insert":"destajos.crear"}');
CREATE POLICY obra_module_visibility ON public.obra_destajos AS RESTRICTIVE FOR SELECT TO authenticated
 USING (public.obra_permission_override_allows(obra_id, 'destajos.ver'));
CREATE TRIGGER enforce_obra_permission BEFORE INSERT OR UPDATE OR DELETE ON public.obra_destajo_estimaciones
 FOR EACH ROW EXECUTE FUNCTION public.enforce_obra_permission_override('[{"column":"destajo_id","table":"obra_destajos"}]', '{"statuses":{"autorizada":"destajos.autorizar_estimacion","rechazada":"destajos.autorizar_estimacion"},"insert":"destajos.estimar","delete":"destajos.estimar"}');
CREATE POLICY obra_module_visibility ON public.obra_destajo_estimaciones AS RESTRICTIVE FOR SELECT TO authenticated
 USING ((SELECT p0.obra_id FROM public.obra_destajos p0 WHERE p0.id = obra_destajo_estimaciones.destajo_id) IS NOT NULL AND public.obra_permission_override_allows((SELECT p0.obra_id FROM public.obra_destajos p0 WHERE p0.id = obra_destajo_estimaciones.destajo_id), 'destajos.ver'));
CREATE POLICY obra_module_visibility ON public.obra_destajo_presupuestos AS RESTRICTIVE FOR SELECT TO authenticated
 USING ((SELECT p0.obra_id FROM public.obra_destajos p0 WHERE p0.id = obra_destajo_presupuestos.destajo_id) IS NOT NULL AND public.obra_permission_override_allows((SELECT p0.obra_id FROM public.obra_destajos p0 WHERE p0.id = obra_destajo_presupuestos.destajo_id), 'destajos.ver'));
CREATE POLICY obra_module_visibility ON public.obra_destajo_anticipos AS RESTRICTIVE FOR SELECT TO authenticated
 USING ((SELECT p0.obra_id FROM public.obra_destajos p0 WHERE p0.id = obra_destajo_anticipos.destajo_id) IS NOT NULL AND public.obra_permission_override_allows((SELECT p0.obra_id FROM public.obra_destajos p0 WHERE p0.id = obra_destajo_anticipos.destajo_id), 'destajos.ver'));
CREATE POLICY obra_module_visibility ON public.obra_destajo_trabajadores AS RESTRICTIVE FOR SELECT TO authenticated
 USING ((SELECT p0.obra_id FROM public.obra_destajos p0 WHERE p0.id = obra_destajo_trabajadores.destajo_id) IS NOT NULL AND public.obra_permission_override_allows((SELECT p0.obra_id FROM public.obra_destajos p0 WHERE p0.id = obra_destajo_trabajadores.destajo_id), 'destajos.ver'));
CREATE TRIGGER enforce_obra_permission BEFORE INSERT OR UPDATE OR DELETE ON public.obra_destajo_estimacion_renglones
 FOR EACH ROW EXECUTE FUNCTION public.enforce_obra_permission_override('[{"column":"estimacion_id","table":"obra_destajo_estimaciones"},{"column":"destajo_id","table":"obra_destajos"}]', '{"insert":"destajos.estimar","update":"destajos.estimar","delete":"destajos.estimar"}');
CREATE POLICY obra_module_visibility ON public.obra_destajo_estimacion_renglones AS RESTRICTIVE FOR SELECT TO authenticated
 USING ((SELECT p1.obra_id FROM public.obra_destajo_estimaciones p0 JOIN public.obra_destajos p1 ON p1.id = p0.destajo_id WHERE p0.id = obra_destajo_estimacion_renglones.estimacion_id) IS NOT NULL AND public.obra_permission_override_allows((SELECT p1.obra_id FROM public.obra_destajo_estimaciones p0 JOIN public.obra_destajos p1 ON p1.id = p0.destajo_id WHERE p0.id = obra_destajo_estimacion_renglones.estimacion_id), 'destajos.ver'));
CREATE POLICY obra_module_visibility ON public.obra_destajo_renglones AS RESTRICTIVE FOR SELECT TO authenticated
 USING ((SELECT p1.obra_id FROM public.obra_destajo_presupuestos p0 JOIN public.obra_destajos p1 ON p1.id = p0.destajo_id WHERE p0.id = obra_destajo_renglones.presupuesto_destajo_id) IS NOT NULL AND public.obra_permission_override_allows((SELECT p1.obra_id FROM public.obra_destajo_presupuestos p0 JOIN public.obra_destajos p1 ON p1.id = p0.destajo_id WHERE p0.id = obra_destajo_renglones.presupuesto_destajo_id), 'destajos.ver'));
CREATE TRIGGER enforce_obra_permission BEFORE INSERT OR UPDATE OR DELETE ON public.obra_subcontratos
 FOR EACH ROW EXECUTE FUNCTION public.enforce_obra_permission_override('[]', '{"insert":"subcontratos.crear"}');
CREATE POLICY obra_module_visibility ON public.obra_subcontratos AS RESTRICTIVE FOR SELECT TO authenticated
 USING (public.obra_permission_override_allows(obra_id, 'subcontratos.ver'));
CREATE TRIGGER enforce_obra_permission BEFORE INSERT OR UPDATE OR DELETE ON public.obra_subcontrato_estimaciones
 FOR EACH ROW EXECUTE FUNCTION public.enforce_obra_permission_override('[{"column":"subcontrato_id","table":"obra_subcontratos"}]', '{"statuses":{"autorizada":"subcontratos.autorizar_estimacion","rechazada":"subcontratos.autorizar_estimacion"}}');
CREATE POLICY obra_module_visibility ON public.obra_subcontrato_estimaciones AS RESTRICTIVE FOR SELECT TO authenticated
 USING ((SELECT p0.obra_id FROM public.obra_subcontratos p0 WHERE p0.id = obra_subcontrato_estimaciones.subcontrato_id) IS NOT NULL AND public.obra_permission_override_allows((SELECT p0.obra_id FROM public.obra_subcontratos p0 WHERE p0.id = obra_subcontrato_estimaciones.subcontrato_id), 'subcontratos.ver'));
CREATE POLICY obra_module_visibility ON public.obra_subcontrato_presupuestos AS RESTRICTIVE FOR SELECT TO authenticated
 USING ((SELECT p0.obra_id FROM public.obra_subcontratos p0 WHERE p0.id = obra_subcontrato_presupuestos.subcontrato_id) IS NOT NULL AND public.obra_permission_override_allows((SELECT p0.obra_id FROM public.obra_subcontratos p0 WHERE p0.id = obra_subcontrato_presupuestos.subcontrato_id), 'subcontratos.ver'));
CREATE POLICY obra_module_visibility ON public.obra_subcontrato_anticipos AS RESTRICTIVE FOR SELECT TO authenticated
 USING ((SELECT p0.obra_id FROM public.obra_subcontratos p0 WHERE p0.id = obra_subcontrato_anticipos.subcontrato_id) IS NOT NULL AND public.obra_permission_override_allows((SELECT p0.obra_id FROM public.obra_subcontratos p0 WHERE p0.id = obra_subcontrato_anticipos.subcontrato_id), 'subcontratos.ver'));
CREATE POLICY obra_module_visibility ON public.obra_subcontrato_estimacion_renglones AS RESTRICTIVE FOR SELECT TO authenticated
 USING ((SELECT p1.obra_id FROM public.obra_subcontrato_estimaciones p0 JOIN public.obra_subcontratos p1 ON p1.id = p0.subcontrato_id WHERE p0.id = obra_subcontrato_estimacion_renglones.estimacion_id) IS NOT NULL AND public.obra_permission_override_allows((SELECT p1.obra_id FROM public.obra_subcontrato_estimaciones p0 JOIN public.obra_subcontratos p1 ON p1.id = p0.subcontrato_id WHERE p0.id = obra_subcontrato_estimacion_renglones.estimacion_id), 'subcontratos.ver'));
CREATE POLICY obra_module_visibility ON public.obra_subcontrato_renglones AS RESTRICTIVE FOR SELECT TO authenticated
 USING ((SELECT p1.obra_id FROM public.obra_subcontrato_presupuestos p0 JOIN public.obra_subcontratos p1 ON p1.id = p0.subcontrato_id WHERE p0.id = obra_subcontrato_renglones.presupuesto_subcontrato_id) IS NOT NULL AND public.obra_permission_override_allows((SELECT p1.obra_id FROM public.obra_subcontrato_presupuestos p0 JOIN public.obra_subcontratos p1 ON p1.id = p0.subcontrato_id WHERE p0.id = obra_subcontrato_renglones.presupuesto_subcontrato_id), 'subcontratos.ver'));
CREATE POLICY obra_module_visibility ON public.obra_rentas AS RESTRICTIVE FOR SELECT TO authenticated
 USING (public.obra_permission_override_allows(obra_id, 'rentas.ver'));
CREATE POLICY obra_module_visibility ON public.obra_renta_eventos AS RESTRICTIVE FOR SELECT TO authenticated
 USING ((SELECT p0.obra_id FROM public.obra_rentas p0 WHERE p0.id = obra_renta_eventos.renta_id) IS NOT NULL AND public.obra_permission_override_allows((SELECT p0.obra_id FROM public.obra_rentas p0 WHERE p0.id = obra_renta_eventos.renta_id), 'rentas.ver'));
CREATE POLICY obra_module_visibility ON public.obra_renta_pagos AS RESTRICTIVE FOR SELECT TO authenticated
 USING ((SELECT p0.obra_id FROM public.obra_rentas p0 WHERE p0.id = obra_renta_pagos.renta_id) IS NOT NULL AND public.obra_permission_override_allows((SELECT p0.obra_id FROM public.obra_rentas p0 WHERE p0.id = obra_renta_pagos.renta_id), 'rentas.ver'));
CREATE POLICY obra_module_visibility ON public.obra_renta_renovaciones AS RESTRICTIVE FOR SELECT TO authenticated
 USING ((SELECT p0.obra_id FROM public.obra_rentas p0 WHERE p0.id = obra_renta_renovaciones.renta_id) IS NOT NULL AND public.obra_permission_override_allows((SELECT p0.obra_id FROM public.obra_rentas p0 WHERE p0.id = obra_renta_renovaciones.renta_id), 'rentas.ver'));
CREATE POLICY obra_module_visibility ON public.vales_gasolina AS RESTRICTIVE FOR SELECT TO authenticated
 USING (public.obra_permission_override_allows(obra_id, 'gasolinas.ver'));
CREATE POLICY obra_module_visibility ON public.obra_tareas AS RESTRICTIVE FOR SELECT TO authenticated
 USING (public.obra_permission_override_allows(obra_id, 'tareas.ver'));
CREATE POLICY obra_module_visibility ON public.cuentas_por_pagar AS RESTRICTIVE FOR SELECT TO authenticated
 USING (public.obra_permission_override_allows(obra_id, 'cxp.ver'));

-- These policies previously consulted only company permissions. Access still
-- requires an existing assignment or the incumbent corporate visibility.
ALTER POLICY "Authorized users update obras" ON public.obras
 USING (public.has_obra_permission(id, 'obras.editar'))
 WITH CHECK (company_id = public.current_company_id() AND public.has_obra_permission(id, 'obras.editar'));
ALTER POLICY "Authorized users delete obras" ON public.obras
 USING (public.has_obra_permission(id, 'obras.eliminar'));
ALTER POLICY "Authorized users add obra team members" ON public.obra_team
 WITH CHECK (public.has_obra_permission(obra_id, 'obras.asignar_team')
   AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.company_id = public.current_company_id()));
ALTER POLICY "Authorized users update obra team members" ON public.obra_team
 USING (public.has_obra_permission(obra_id, 'obras.asignar_team'))
 WITH CHECK (public.has_obra_permission(obra_id, 'obras.asignar_team')
   AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.company_id = public.current_company_id()));
ALTER POLICY "Authorized users delete obra team members" ON public.obra_team
 USING (public.has_obra_permission(obra_id, 'obras.asignar_team'));
ALTER POLICY "Authorized users add obra commissions" ON public.obra_comisiones
 WITH CHECK (public.has_obra_permission(obra_id, 'obras.asignar_team')
   AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.company_id = public.current_company_id()));
ALTER POLICY "Authorized users update obra commissions" ON public.obra_comisiones
 USING (public.has_obra_permission(obra_id, 'obras.asignar_team'))
 WITH CHECK (public.has_obra_permission(obra_id, 'obras.asignar_team')
   AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.company_id = public.current_company_id()));
ALTER POLICY "Authorized users delete obra commissions" ON public.obra_comisiones
 USING (public.has_obra_permission(obra_id, 'obras.asignar_team'));

-- Validate once, add replacements before removing old assignments, and commit
-- atomically. An assigned user must not lose access halfway through the change.
CREATE FUNCTION public.replace_obra_team(_obra_id uuid, _team jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE company uuid;
BEGIN
  SELECT company_id INTO company FROM public.obras WHERE id = _obra_id FOR UPDATE;
  IF NOT COALESCE(public.has_obra_permission(_obra_id, 'obras.asignar_team'), false) THEN
    RAISE EXCEPTION 'No tienes permiso para asignar el equipo de esta obra' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(_team) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Equipo no válido'; END IF;
  IF (SELECT count(*) FROM jsonb_to_recordset(_team) AS t(user_id uuid, role public.app_role) WHERE role = 'residente') <> 1
    OR (SELECT count(*) FROM jsonb_to_recordset(_team) AS t(user_id uuid, role public.app_role) WHERE role = 'administrativo') <> 1 THEN
    RAISE EXCEPTION 'Se requiere un Residente y un Administrativo por obra';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_to_recordset(_team) AS t(user_id uuid, role public.app_role)
    LEFT JOIN public.profiles p ON p.id = t.user_id AND p.company_id = company
    WHERE p.id IS NULL OR t.role IS NULL) THEN RAISE EXCEPTION 'Equipo no válido para esta empresa'; END IF;
  INSERT INTO public.obra_team(obra_id, user_id, role)
    SELECT _obra_id, t.user_id, t.role FROM jsonb_to_recordset(_team) AS t(user_id uuid, role public.app_role)
    ON CONFLICT (obra_id, user_id, role) DO NOTHING;
  DELETE FROM public.obra_team ot WHERE ot.obra_id = _obra_id
    AND NOT EXISTS (SELECT 1 FROM jsonb_to_recordset(_team) AS t(user_id uuid, role public.app_role)
      WHERE t.user_id = ot.user_id AND t.role = ot.role);
END;
$$;
REVOKE ALL ON FUNCTION public.replace_obra_team(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.replace_obra_team(uuid, jsonb) TO authenticated;

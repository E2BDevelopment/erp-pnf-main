-- Close privilege escalation and least-privilege gaps found in the 2026-10 review.

-- A user may edit their display name, but never authorization context.
REVOKE UPDATE ON public.profiles FROM PUBLIC, anon, authenticated;
GRANT UPDATE (nombre_completo) ON public.profiles TO authenticated;
REVOKE INSERT ON public.profiles FROM PUBLIC, anon, authenticated;

-- User roles are provisioned by trusted server functions only.
DROP POLICY IF EXISTS "User inserts own director role on onboarding" ON public.user_roles;
DROP POLICY IF EXISTS "Director manages roles" ON public.user_roles;
CREATE POLICY "Directors manage company roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_director_of(company_id))
  WITH CHECK (
    public.is_director_of(company_id)
    AND EXISTS (SELECT 1 FROM public.profiles p
      WHERE p.id = user_roles.user_id AND p.company_id = user_roles.company_id)
  );

-- Permission helper mirrors the configurable obras permissions, with the catalog
-- defaults for the three obra actions. SECURITY DEFINER avoids RLS recursion.
CREATE OR REPLACE FUNCTION public.has_company_permission(_company_id uuid, _action_key text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    LEFT JOIN public.role_permissions rp
      ON rp.company_id = ur.company_id
     AND rp.role = ur.role
     AND rp.action_key = _action_key
    WHERE ur.user_id = auth.uid()
      AND ur.company_id = _company_id
      AND ur.company_id = public.current_company_id()
      AND (
        ur.role = 'director'::public.app_role
        OR COALESCE(
          rp.allowed,
          CASE _action_key
            WHEN 'obras.crear' THEN ur.role = 'administrativo'::public.app_role
            WHEN 'obras.editar' THEN ur.role = 'administrativo'::public.app_role
            WHEN 'obras.asignar_team' THEN ur.role = 'administrativo'::public.app_role
            ELSE false
          END
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_obra(_obra_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.obras o
    WHERE o.id = _obra_id
      AND o.company_id = public.current_company_id()
      AND (
        public.is_director_of(o.company_id)
        OR public.has_company_permission(o.company_id, 'obras.editar')
        OR public.has_company_permission(o.company_id, 'obras.asignar_team')
        OR EXISTS (
          SELECT 1 FROM public.obra_team ot
          WHERE ot.obra_id = o.id AND ot.user_id = auth.uid()
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.has_company_permission(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_access_obra(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_company_permission(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_access_obra(uuid) TO authenticated, service_role;

-- Obras: company membership alone is not authorization to see or change every job.
DROP POLICY IF EXISTS "Users see obras in own company" ON public.obras;
DROP POLICY IF EXISTS "Director manages obras" ON public.obras;
DROP POLICY IF EXISTS "Company members manage obras" ON public.obras;
CREATE POLICY "Assigned users read obras" ON public.obras
  FOR SELECT TO authenticated
  USING (public.can_access_obra(id));
CREATE POLICY "Authorized users create obras" ON public.obras
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.current_company_id()
    AND public.has_company_permission(company_id, 'obras.crear')
  );
CREATE POLICY "Authorized users update obras" ON public.obras
  FOR UPDATE TO authenticated
  USING (public.has_company_permission(company_id, 'obras.editar'))
  WITH CHECK (
    company_id = public.current_company_id()
    AND public.has_company_permission(company_id, 'obras.editar')
  );
CREATE POLICY "Authorized users delete obras" ON public.obras
  FOR DELETE TO authenticated
  USING (
    company_id = public.current_company_id()
    AND public.has_company_permission(company_id, 'obras.eliminar')
  );

-- Only an administrator with the team permission can change assignments or commissions.
DROP POLICY IF EXISTS "Users see obra_team in own company" ON public.obra_team;
DROP POLICY IF EXISTS "Director manages obra_team" ON public.obra_team;
DROP POLICY IF EXISTS "Company members manage obra_team" ON public.obra_team;
CREATE POLICY "Assigned users read obra teams" ON public.obra_team
  FOR SELECT TO authenticated USING (public.can_access_obra(obra_id));
CREATE POLICY "Authorized users add obra team members" ON public.obra_team
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.obras o WHERE o.id = obra_team.obra_id
      AND public.has_company_permission(o.company_id, 'obras.asignar_team'))
    AND EXISTS (SELECT 1 FROM public.obras o WHERE o.id = obra_team.obra_id
      AND o.company_id = public.current_company_id())
    AND EXISTS (SELECT 1 FROM public.profiles p
      WHERE p.id = obra_team.user_id AND p.company_id = public.current_company_id())
  );
CREATE POLICY "Authorized users update obra team members" ON public.obra_team
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.obras o WHERE o.id = obra_team.obra_id
    AND public.has_company_permission(o.company_id, 'obras.asignar_team')))
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.obras o WHERE o.id = obra_team.obra_id
      AND o.company_id = public.current_company_id()
      AND public.has_company_permission(o.company_id, 'obras.asignar_team'))
    AND EXISTS (SELECT 1 FROM public.profiles p
      WHERE p.id = obra_team.user_id AND p.company_id = public.current_company_id())
  );
CREATE POLICY "Authorized users delete obra team members" ON public.obra_team
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.obras o WHERE o.id = obra_team.obra_id
    AND public.has_company_permission(o.company_id, 'obras.asignar_team')));

DROP POLICY IF EXISTS "Users see comisiones in own company" ON public.obra_comisiones;
DROP POLICY IF EXISTS "Director manages comisiones" ON public.obra_comisiones;
DROP POLICY IF EXISTS "Company members manage comisiones" ON public.obra_comisiones;
CREATE POLICY "Assigned users read obra commissions" ON public.obra_comisiones
  FOR SELECT TO authenticated USING (public.can_access_obra(obra_id));
CREATE POLICY "Authorized users add obra commissions" ON public.obra_comisiones
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.obras o WHERE o.id = obra_comisiones.obra_id
      AND o.company_id = public.current_company_id()
      AND public.has_company_permission(o.company_id, 'obras.editar'))
    AND EXISTS (SELECT 1 FROM public.profiles p
      WHERE p.id = obra_comisiones.user_id AND p.company_id = public.current_company_id())
  );
CREATE POLICY "Authorized users update obra commissions" ON public.obra_comisiones
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.obras o WHERE o.id = obra_comisiones.obra_id
    AND public.has_company_permission(o.company_id, 'obras.editar')))
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.obras o WHERE o.id = obra_comisiones.obra_id
      AND o.company_id = public.current_company_id()
      AND public.has_company_permission(o.company_id, 'obras.editar'))
    AND EXISTS (SELECT 1 FROM public.profiles p
      WHERE p.id = obra_comisiones.user_id AND p.company_id = public.current_company_id())
  );
CREATE POLICY "Authorized users delete obra commissions" ON public.obra_comisiones
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.obras o WHERE o.id = obra_comisiones.obra_id
    AND public.has_company_permission(o.company_id, 'obras.editar')));

-- Service-role-only accounting routines: the HTTP hook authenticates first, then
-- invokes them with the server key. Direct user RPC calls must not bypass it.
REVOKE EXECUTE ON FUNCTION public.devengar_asientos_renta(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.devengar_asientos_rentas_activas() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generar_periodos_renta(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generar_periodos_rentas_activas() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.devengar_asientos_renta(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.devengar_asientos_rentas_activas() TO service_role;
GRANT EXECUTE ON FUNCTION public.generar_periodos_renta(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.generar_periodos_rentas_activas() TO service_role;

-- Prevent overlapping cron requests from racing the existing idempotency checks.
CREATE OR REPLACE FUNCTION public.devengar_asientos_rentas_activas()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  rec record;
  total integer := 0;
BEGIN
  PERFORM pg_advisory_xact_lock(202610301);
  FOR rec IN
    SELECT id FROM public.obra_rentas WHERE estatus IN ('activa', 'devuelta')
  LOOP
    total := total + COALESCE(public.devengar_asientos_renta(rec.id), 0);
  END LOOP;
  RETURN total;
END;
$$;

CREATE OR REPLACE FUNCTION public.generar_periodos_rentas_activas()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  rec record;
  total integer := 0;
BEGIN
  PERFORM pg_advisory_xact_lock(202610302);
  FOR rec IN
    SELECT id FROM public.obra_rentas WHERE estatus IN ('activa', 'devuelta')
  LOOP
    total := total + COALESCE(public.generar_periodos_renta(rec.id), 0);
  END LOOP;
  RETURN total;
END;
$$;

REVOKE ALL ON FUNCTION public.devengar_asientos_rentas_activas() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generar_periodos_rentas_activas() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.devengar_asientos_rentas_activas() TO service_role;
GRANT EXECUTE ON FUNCTION public.generar_periodos_rentas_activas() TO service_role;

-- Remove grants that bypass RLS or are not needed by API roles.
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC, anon', t.tablename);
    EXECUTE format('REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLE public.%I FROM PUBLIC, anon, authenticated', t.tablename);
  END LOOP;
  FOR t IN SELECT sequencename FROM pg_sequences WHERE schemaname = 'public' LOOP
    EXECUTE format('REVOKE ALL PRIVILEGES ON SEQUENCE public.%I FROM PUBLIC, anon', t.sequencename);
  END LOOP;
END $$;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM PUBLIC, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM PUBLIC, anon;

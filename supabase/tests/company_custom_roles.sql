-- Run with psql -v ON_ERROR_STOP=1. All fixtures roll back.
BEGIN;
INSERT INTO public.companies(id, tipo_persona, razon_social, rfc) VALUES
 ('10000000-0000-4000-8000-000000000001', 'moral', 'Roles test A', 'AAA010101AAA'),
 ('10000000-0000-4000-8000-000000000002', 'moral', 'Roles test B', 'BBB010101BBB');
INSERT INTO auth.users(id, email) VALUES
 ('20000000-0000-4000-8000-000000000001', 'roles-director@example.invalid'),
 ('20000000-0000-4000-8000-000000000002', 'roles-member@example.invalid');
UPDATE public.profiles SET company_id = '10000000-0000-4000-8000-000000000001'
 WHERE id IN ('20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002');
INSERT INTO public.user_roles(user_id, company_id, role) VALUES
 ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'director');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000001', true);
INSERT INTO public.role_permissions(company_id, role, action_key, allowed)
 VALUES ('10000000-0000-4000-8000-000000000001', 'administrativo', 'obras.crear', false);
DO $$
DECLARE custom_id uuid;
BEGIN
  custom_id := public.create_company_role('Compras prueba', 'administrativo', '{"obras.crear":true,"obras.editar":true}');
  PERFORM set_config('test.custom_role_id', custom_id::text, true);
  IF (SELECT allowed FROM public.role_permissions WHERE role = custom_id::text AND action_key = 'obras.crear') THEN
    RAISE EXCEPTION 'Did not copy company override';
  END IF;
  BEGIN
    PERFORM public.create_company_role('  COMPRAS PRUEBA  ', 'residente', '{}');
    RAISE EXCEPTION 'Duplicate role accepted';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    PERFORM public.create_company_role('Otro director', 'director', '{}');
    RAISE EXCEPTION 'Director profile accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END;
$$;
INSERT INTO public.user_roles(user_id, company_id, role, custom_role_id)
 VALUES ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'administrativo', current_setting('test.custom_role_id')::uuid);
SELECT set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000002', true);
DO $$
BEGIN
  IF public.has_company_permission('10000000-0000-4000-8000-000000000001', 'obras.crear') THEN
    RAISE EXCEPTION 'Custom denial ignored';
  END IF;
  IF NOT public.has_company_permission('10000000-0000-4000-8000-000000000001', 'obras.editar') THEN
    RAISE EXCEPTION 'Custom grant ignored';
  END IF;
  BEGIN
    PERFORM public.create_company_role('Forbidden', 'residente', '{}');
    RAISE EXCEPTION 'Non-director created role';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM = 'Non-director created role' THEN RAISE; END IF;
  END;
  BEGIN
    INSERT INTO public.role_permissions(company_id, role, action_key, allowed)
      VALUES ('10000000-0000-4000-8000-000000000001', current_setting('test.custom_role_id'), 'obras.eliminar', true);
    RAISE EXCEPTION 'Member edited permissions';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$$;
RESET ROLE;
DO $$
BEGIN
  BEGIN
    INSERT INTO public.user_roles(user_id, company_id, role, custom_role_id)
      VALUES ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'administrativo', current_setting('test.custom_role_id')::uuid);
    RAISE EXCEPTION 'Cross-company assignment accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO public.role_permissions(company_id, role, action_key, allowed)
      VALUES ('10000000-0000-4000-8000-000000000002', current_setting('test.custom_role_id'), 'obras.crear', true);
    RAISE EXCEPTION 'Cross-company permission accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM = 'Cross-company permission accepted' THEN RAISE; END IF;
  END;
END;
$$;
UPDATE public.profiles SET company_id = '10000000-0000-4000-8000-000000000002'
 WHERE id = '20000000-0000-4000-8000-000000000002';
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.company_roles WHERE id = current_setting('test.custom_role_id')::uuid) THEN
    RAISE EXCEPTION 'Other company can read custom role';
  END IF;
END $$;
RESET ROLE;
ROLLBACK;

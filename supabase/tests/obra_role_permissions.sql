-- Run with psql -v ON_ERROR_STOP=1. Fixtures and audit entries roll back.
BEGIN;
INSERT INTO public.companies(id, tipo_persona, razon_social, rfc) VALUES
 ('11000000-0000-4000-8000-000000000001', 'moral', 'Obra permisos A', 'OPA010101AAA'),
 ('11000000-0000-4000-8000-000000000002', 'moral', 'Obra permisos B', 'OPB010101BBB');
INSERT INTO auth.users(id, email) VALUES
 ('21000000-0000-4000-8000-000000000001', 'obra-director@example.invalid'),
 ('21000000-0000-4000-8000-000000000002', 'obra-residente@example.invalid');
UPDATE public.profiles SET company_id = '11000000-0000-4000-8000-000000000001'
 WHERE id IN ('21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000002');
INSERT INTO public.user_roles(user_id, company_id, role) VALUES
 ('21000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000001', 'director'),
 ('21000000-0000-4000-8000-000000000002', '11000000-0000-4000-8000-000000000001', 'residente');
INSERT INTO public.obras(id, company_id, nombre) VALUES
 ('31000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000001', 'Permiso A1'),
 ('31000000-0000-4000-8000-000000000002', '11000000-0000-4000-8000-000000000001', 'Permiso A2'),
 ('31000000-0000-4000-8000-000000000003', '11000000-0000-4000-8000-000000000001', 'Sin asignación'),
 ('31000000-0000-4000-8000-000000000004', '11000000-0000-4000-8000-000000000002', 'Otra empresa');
INSERT INTO public.obra_team(obra_id, user_id, role) VALUES
 ('31000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000002', 'residente'),
 ('31000000-0000-4000-8000-000000000002', '21000000-0000-4000-8000-000000000002', 'residente');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000001', true);
INSERT INTO public.obra_role_permissions(company_id, obra_id, role, action_key, allowed) VALUES
 ('11000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000001', 'residente', 'requisiciones.crear', false),
 ('11000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000003', 'residente', 'requisiciones.crear', true),
 ('11000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000001', 'residente', 'requisiciones.ver', false);
DO $$ BEGIN
  IF NOT public.has_obra_permission('31000000-0000-4000-8000-000000000001', 'requisiciones.crear') THEN
    RAISE EXCEPTION 'Director perdió acceso';
  END IF;
  BEGIN
    INSERT INTO public.obra_role_permissions(company_id, obra_id, role, action_key, allowed) VALUES
      ('11000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000004', 'residente', 'requisiciones.crear', true);
    RAISE EXCEPTION 'Se aceptó otra empresa';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM = 'Se aceptó otra empresa' THEN RAISE; END IF; END;
  BEGIN
    INSERT INTO public.obra_role_permissions(company_id, obra_id, role, action_key, allowed) VALUES
      ('11000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000001', 'residente', 'obras.crear', true);
    RAISE EXCEPTION 'Se aceptó acción corporativa';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM = 'Se aceptó acción corporativa' THEN RAISE; END IF; END;
END $$;
SELECT set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000002', true);
DO $$ BEGIN
  IF public.has_obra_permission('31000000-0000-4000-8000-000000000001', 'requisiciones.crear') THEN RAISE EXCEPTION 'Se ignoró denegación'; END IF;
  IF NOT public.has_obra_permission('31000000-0000-4000-8000-000000000002', 'requisiciones.crear') THEN RAISE EXCEPTION 'Se perdió herencia'; END IF;
  IF public.has_obra_permission('31000000-0000-4000-8000-000000000003', 'requisiciones.crear') THEN RAISE EXCEPTION 'Permiso concedió membresía'; END IF;
  IF public.has_obra_permission('31000000-0000-4000-8000-000000000004', 'requisiciones.crear') THEN RAISE EXCEPTION 'Acceso entre empresas'; END IF;
  BEGIN
    INSERT INTO public.obra_role_permissions(company_id, obra_id, role, action_key, allowed) VALUES
      ('11000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000002', 'residente', 'requisiciones.crear', true);
    RAISE EXCEPTION 'Residente editó permisos';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    INSERT INTO public.requisiciones(company_id, obra_id, folio, creado_por) VALUES
      ('11000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000001', 'PERM-TEST-1', auth.uid());
    RAISE EXCEPTION 'Escritura directa ignoró denegación';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000001', true);
INSERT INTO public.requisiciones(company_id, obra_id, folio, creado_por) VALUES
 ('11000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000001', 'PERM-VISIBLE', auth.uid());
SELECT set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000002', true);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.requisiciones WHERE folio = 'PERM-VISIBLE') THEN RAISE EXCEPTION 'Lectura directa ignoró visibilidad'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000001', true);
DELETE FROM public.obra_role_permissions WHERE obra_id = '31000000-0000-4000-8000-000000000001';
RESET ROLE;
DO $$ BEGIN
  IF (SELECT count(*) FROM public.audit_log WHERE table_name = 'obra_role_permissions' AND actor_user_id = '21000000-0000-4000-8000-000000000001') < 5 THEN
    RAISE EXCEPTION 'No se auditó la configuración';
  END IF;
END $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000002', true);
DO $$ BEGIN
  IF NOT public.has_obra_permission('31000000-0000-4000-8000-000000000001', 'requisiciones.crear') THEN RAISE EXCEPTION 'No se restauró herencia'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000001', true);
INSERT INTO public.obra_role_permissions(company_id, obra_id, role, action_key, allowed) VALUES
 ('11000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000001', 'residente', 'obras.asignar_team', true);
SELECT set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000002', true);
SELECT public.replace_obra_team('31000000-0000-4000-8000-000000000001', '[
 {"user_id":"21000000-0000-4000-8000-000000000002","role":"residente"},
 {"user_id":"21000000-0000-4000-8000-000000000001","role":"administrativo"}
]');
DO $$ BEGIN
  BEGIN
    PERFORM public.replace_obra_team('31000000-0000-4000-8000-000000000001', '[
      {"user_id":"21000000-0000-4000-8000-000000000002","role":"residente"},
      {"user_id":"21000000-0000-4000-8000-000000000099","role":"administrativo"}
    ]');
    RAISE EXCEPTION 'Se aceptó un usuario ajeno';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM = 'Se aceptó un usuario ajeno' THEN RAISE; END IF; END;
  IF (SELECT count(*) FROM public.obra_team WHERE obra_id = '31000000-0000-4000-8000-000000000001') <> 2 THEN
    RAISE EXCEPTION 'El fallo dejó equipo parcial';
  END IF;
END $$;
SELECT set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000001', true);
DO $$ DECLARE custom_id uuid;
BEGIN
  custom_id := public.create_company_role('Residente permisos QA', 'residente', '{"requisiciones.crear":false}');
  UPDATE public.user_roles SET custom_role_id = custom_id
    WHERE user_id = '21000000-0000-4000-8000-000000000002' AND role = 'residente';
  INSERT INTO public.obra_role_permissions(company_id, obra_id, role, action_key, allowed) VALUES
    ('11000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000001', custom_id::text, 'requisiciones.crear', true);
END $$;
SELECT set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000002', true);
DO $$ BEGIN
  IF NOT public.has_obra_permission('31000000-0000-4000-8000-000000000001', 'requisiciones.crear') THEN RAISE EXCEPTION 'Se ignoró permiso personalizado'; END IF;
  IF public.has_obra_permission('31000000-0000-4000-8000-000000000002', 'requisiciones.crear') THEN RAISE EXCEPTION 'Rol personalizado heredó perfil base'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000001', true);
UPDATE public.role_permissions SET allowed = true
 WHERE company_id = '11000000-0000-4000-8000-000000000001' AND action_key = 'requisiciones.crear'
 AND role = (SELECT custom_role_id::text FROM public.user_roles WHERE user_id = '21000000-0000-4000-8000-000000000002');
SELECT set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000002', true);
DO $$ BEGIN
  IF NOT public.has_obra_permission('31000000-0000-4000-8000-000000000002', 'requisiciones.crear') THEN RAISE EXCEPTION 'La herencia no siguió el cambio de empresa'; END IF;
END $$;
RESET ROLE;
ROLLBACK;

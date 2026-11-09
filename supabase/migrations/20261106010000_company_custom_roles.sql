-- Custom roles keep an operational profile for existing workflow/RLS rules.
CREATE TABLE public.company_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 60),
  base_role public.app_role NOT NULL CHECK (base_role <> 'director'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, id, base_role)
);
CREATE UNIQUE INDEX company_roles_name_unique ON public.company_roles (company_id, lower(btrim(name)));
ALTER TABLE public.company_roles ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.company_roles TO authenticated;
GRANT ALL ON public.company_roles TO service_role;
CREATE POLICY "Company members read custom roles" ON public.company_roles
  FOR SELECT TO authenticated USING (company_id = public.current_company_id());

ALTER TABLE public.user_roles ADD COLUMN custom_role_id uuid;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_custom_role_company_fk
  FOREIGN KEY (company_id, custom_role_id, role)
  REFERENCES public.company_roles (company_id, id, base_role);

ALTER TABLE public.role_permissions DROP CONSTRAINT role_permissions_no_director;
ALTER TABLE public.role_permissions ALTER COLUMN role TYPE text USING role::text;
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_no_director CHECK (role <> 'director');

CREATE FUNCTION public.validate_permission_role() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.role NOT IN ('residente', 'auxiliar', 'administrativo', 'supervisor')
    AND NOT EXISTS (SELECT 1 FROM public.company_roles r WHERE r.company_id = NEW.company_id AND r.id::text = NEW.role)
  THEN RAISE EXCEPTION 'Rol no válido para esta empresa'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_permission_role BEFORE INSERT OR UPDATE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.validate_permission_role();

CREATE FUNCTION public.create_company_role(_name text, _base_role public.app_role, _defaults jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  company uuid := public.current_company_id();
  role_id uuid;
BEGIN
  IF NOT COALESCE(public.is_director_of(company), false) THEN
    RAISE EXCEPTION 'Solo el Director puede crear roles';
  END IF;
  IF lower(btrim(_name)) IN ('director', 'residente', 'auxiliar', 'administrativo', 'supervisor') THEN
    RAISE EXCEPTION 'Ya existe un rol con ese nombre';
  END IF;
  INSERT INTO public.company_roles(company_id, name, base_role)
    VALUES (company, btrim(_name), _base_role) RETURNING id INTO role_id;
  INSERT INTO public.role_permissions(company_id, role, action_key, allowed, updated_by)
    SELECT company, role_id::text, d.key, COALESCE(p.allowed, d.value::boolean), auth.uid()
    FROM jsonb_each_text(_defaults) d
    LEFT JOIN public.role_permissions p ON p.company_id = company AND p.role = _base_role::text AND p.action_key = d.key;
  RETURN role_id;
END;
$$;
REVOKE ALL ON FUNCTION public.create_company_role(text, public.app_role, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_company_role(text, public.app_role, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.has_company_permission(_company_id uuid, _action_key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    LEFT JOIN public.role_permissions rp ON rp.company_id = ur.company_id
      AND rp.role = COALESCE(ur.custom_role_id::text, ur.role::text) AND rp.action_key = _action_key
    WHERE ur.user_id = auth.uid() AND ur.company_id = _company_id
      AND ur.company_id = public.current_company_id()
      AND (ur.role = 'director' OR COALESCE(rp.allowed,
        ur.custom_role_id IS NULL AND _action_key IN ('obras.crear', 'obras.editar', 'obras.asignar_team') AND ur.role = 'administrativo'))
  );
$$;

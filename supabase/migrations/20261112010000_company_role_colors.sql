ALTER TABLE public.company_roles
  ADD COLUMN color text NOT NULL DEFAULT '#64748B'
  CHECK (color ~ '^#[0-9A-Fa-f]{6}$');

UPDATE public.company_roles
SET color = CASE base_role
  WHEN 'residente' THEN '#2563EB'
  WHEN 'auxiliar' THEN '#7C3AED'
  WHEN 'administrativo' THEN '#059669'
  WHEN 'supervisor' THEN '#D97706'
  ELSE '#64748B'
END;

CREATE OR REPLACE FUNCTION public.create_company_role(
  _name text,
  _base_role public.app_role,
  _defaults jsonb,
  _color text
)
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
  IF _color !~ '^#[0-9A-Fa-f]{6}$' THEN
    RAISE EXCEPTION 'El color debe ser un valor hexadecimal RGB válido';
  END IF;

  INSERT INTO public.company_roles(company_id, name, base_role, color)
    VALUES (company, btrim(_name), _base_role, _color) RETURNING id INTO role_id;
  INSERT INTO public.role_permissions(company_id, role, action_key, allowed, updated_by)
    SELECT company, role_id::text, d.key, COALESCE(p.allowed, d.value::boolean), auth.uid()
    FROM jsonb_each_text(_defaults) d
    LEFT JOIN public.role_permissions p ON p.company_id = company AND p.role = _base_role::text AND p.action_key = d.key;
  RETURN role_id;
END;
$$;
REVOKE ALL ON FUNCTION public.create_company_role(text, public.app_role, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_company_role(text, public.app_role, jsonb, text) TO authenticated;

-- Keep the existing three-argument RPC compatible with older app clients and SQL fixtures.
CREATE OR REPLACE FUNCTION public.create_company_role(_name text, _base_role public.app_role, _defaults jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  default_color text := CASE _base_role
    WHEN 'residente' THEN '#2563EB'
    WHEN 'auxiliar' THEN '#7C3AED'
    WHEN 'administrativo' THEN '#059669'
    WHEN 'supervisor' THEN '#D97706'
    ELSE '#64748B'
  END;
BEGIN
  RETURN public.create_company_role(_name, _base_role, _defaults, default_color);
END;
$$;

-- Registro inmutable de cambios en tablas de negocio para reconstruir historiales.
CREATE TABLE public.audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  actor_user_id uuid,
  company_id uuid,
  schema_name text NOT NULL,
  table_name text NOT NULL,
  operation text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id jsonb,
  old_data jsonb,
  new_data jsonb,
  transaction_id bigint NOT NULL DEFAULT txid_current()
);

CREATE INDEX audit_log_company_time_idx ON public.audit_log (company_id, occurred_at DESC);
CREATE INDEX audit_log_record_idx ON public.audit_log (schema_name, table_name, record_id);
CREATE INDEX audit_log_actor_time_idx ON public.audit_log (actor_user_id, occurred_at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.audit_log FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;

CREATE POLICY "Directors read company audit log" ON public.audit_log
  FOR SELECT TO authenticated
  USING (
    company_id IS NOT NULL
    AND public.is_director_of(company_id)
  );

CREATE OR REPLACE FUNCTION public.capture_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  old_row jsonb;
  new_row jsonb;
  row_data jsonb;
  row_id jsonb;
  row_company_id uuid;
  row_actor_id uuid;
  request_meta jsonb;
BEGIN
  IF TG_OP <> 'INSERT' THEN old_row := to_jsonb(OLD); END IF;
  IF TG_OP <> 'DELETE' THEN new_row := to_jsonb(NEW); END IF;
  row_data := COALESCE(new_row, old_row);
  row_id := CASE
    WHEN row_data ? 'id' THEN jsonb_build_object('id', row_data -> 'id')
    ELSE jsonb_build_object('primary_key', row_data)
  END;

  BEGIN
    request_meta := NULLIF(current_setting('request.headers', true), '')::jsonb;
  EXCEPTION WHEN invalid_text_representation THEN
    request_meta := '{}'::jsonb;
  END;

  row_actor_id := auth.uid();
  IF row_actor_id IS NULL THEN
    BEGIN
      row_actor_id := NULLIF(request_meta ->> 'x-audit-actor-id', '')::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
      row_actor_id := NULL;
    END;
  END IF;

  BEGIN
    row_company_id := NULLIF(row_data ->> 'company_id', '')::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    row_company_id := NULL;
  END;
  IF row_company_id IS NULL THEN
    BEGIN
      row_company_id := NULLIF(request_meta ->> 'x-audit-company-id', '')::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
      row_company_id := NULL;
    END;
  END IF;
  IF row_company_id IS NULL AND TG_TABLE_NAME = 'companies' THEN
    BEGIN
      row_company_id := NULLIF(row_data ->> 'id', '')::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
      row_company_id := NULL;
    END;
  END IF;
  IF row_company_id IS NULL THEN
    row_company_id := public.current_company_id();
  END IF;

  INSERT INTO public.audit_log (
    actor_user_id, company_id, schema_name, table_name, operation,
    record_id, old_data, new_data
  ) VALUES (
    row_actor_id, row_company_id, TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP,
    row_id, old_row, new_row
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION public.capture_audit_log() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.capture_audit_log() TO service_role;

-- Install on every current public table except the log itself. The trigger runs
-- for SQL and Supabase client writes alike, including writes made by service_role.
DO $$
DECLARE
  target record;
BEGIN
  FOR target IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
      AND c.relname <> 'audit_log'
  LOOP
    EXECUTE format(
      'CREATE TRIGGER audit_log_row_change AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.capture_audit_log()',
      target.relname
    );
  END LOOP;
END;
$$;

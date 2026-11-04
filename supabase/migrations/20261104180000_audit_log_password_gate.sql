-- Audit records are read only through the server function that revalidates
-- both director access and the account password for each query.
REVOKE SELECT ON public.audit_log FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.audit_log TO service_role;

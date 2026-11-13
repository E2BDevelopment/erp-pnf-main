CREATE OR REPLACE FUNCTION public.regenerate_insumo_codigo_on_category_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.categoria_id IS DISTINCT FROM OLD.categoria_id THEN
    NEW.codigo := public.siguiente_codigo_insumo(NEW.company_id, NEW.categoria_id);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER insumos_regenerate_codigo_on_category_change
  BEFORE UPDATE OF categoria_id ON public.insumos
  FOR EACH ROW
  EXECUTE FUNCTION public.regenerate_insumo_codigo_on_category_change();

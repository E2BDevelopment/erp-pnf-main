CREATE OR REPLACE FUNCTION public.seed_default_insumo_unidades_for_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.insumo_unidades (company_id, codigo, nombre)
  VALUES
    (NEW.id, 'KG', 'Kilogramo'),
    (NEW.id, 'M2', 'Metro cuadrado'),
    (NEW.id, 'M3', 'Metro cúbico'),
    (NEW.id, 'ML', 'Metro lineal'),
    (NEW.id, 'PZA', 'Pieza'),
    (NEW.id, 'LT', 'Litro'),
    (NEW.id, 'TON', 'Tonelada'),
    (NEW.id, 'BTO', 'Bulto')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.seed_default_insumo_unidades_for_company() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER companies_seed_default_insumo_unidades
AFTER INSERT ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.seed_default_insumo_unidades_for_company();

INSERT INTO public.insumo_unidades (company_id, codigo, nombre)
SELECT c.id, u.codigo, u.nombre
FROM public.companies c
CROSS JOIN (VALUES
  ('KG', 'Kilogramo'),
  ('M2', 'Metro cuadrado'),
  ('M3', 'Metro cúbico'),
  ('ML', 'Metro lineal'),
  ('PZA', 'Pieza'),
  ('LT', 'Litro'),
  ('TON', 'Tonelada'),
  ('BTO', 'Bulto')
) AS u(codigo, nombre)
ON CONFLICT DO NOTHING;

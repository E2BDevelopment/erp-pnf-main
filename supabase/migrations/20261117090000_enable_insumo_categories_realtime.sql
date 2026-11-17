DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'insumo_categorias'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.insumo_categorias;
  END IF;
END $$;

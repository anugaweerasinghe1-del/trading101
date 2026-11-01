-- Add low-latency invalidation events without changing who may read portfolio data.
-- The migration is idempotent; existing SELECT RLS continues to restrict
-- practice_portfolios to its owning auth.uid().
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'market_prices'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.market_prices;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'practice_portfolios'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.practice_portfolios;
  END IF;
END
$$;

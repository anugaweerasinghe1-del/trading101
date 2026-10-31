-- Public trade history is separate from public ranking visibility.
-- Default OFF protects existing members. Only current-cycle, server-recorded
-- simulated trades are eligible; private journal reflections are never shared.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_public_trades boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.profiles.show_public_trades IS
  'Independent opt-in: publish up to 20 recent server-recorded simulated trades when the parent profile is also public.';

CREATE OR REPLACE FUNCTION public.get_public_practice_trades(
  p_username text,
  p_limit integer DEFAULT 20
)
RETURNS TABLE(
  asset_id text,
  side text,
  quantity numeric,
  price numeric,
  fee numeric,
  total numeric,
  realized_pnl numeric,
  price_source text,
  created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT t.asset_id, t.side, t.quantity, t.price, t.fee,
         t.total, t.realized_pnl, t.price_source, t.created_at
    FROM public.profiles AS pf
    JOIN public.practice_portfolios AS pp ON pp.user_id = pf.id
    JOIN public.practice_trades AS t ON t.user_id = pf.id AND t.cycle_id = pp.cycle_id
   WHERE pf.username = p_username
     AND pf.is_public IS TRUE
     AND pf.show_public_trades IS TRUE
   ORDER BY t.created_at DESC, t.id DESC
   LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 20), 20));
$$;

REVOKE ALL ON FUNCTION public.get_public_practice_trades(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_practice_trades(text, integer) TO anon, authenticated;

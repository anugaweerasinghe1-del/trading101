BEGIN;
INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
 ('00000000-0000-4000-8000-000000000901','audit-price-901@example.invalid','{"username":"audit_quote_901"}');
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000901',true);
CREATE TEMP TABLE result (preview numeric, fill numeric, fee numeric, gross numeric, source text);
SELECT tradehq_private.store_quote('aapl',100,'Audit fixture',clock_timestamp()-interval '1 minute','provider');
INSERT INTO result (preview) SELECT price FROM public.market_prices WHERE asset_id='aapl';
SELECT tradehq_private.store_quote('aapl',101,'Audit fixture',clock_timestamp(),'provider');
GRANT SELECT,UPDATE ON result TO authenticated;
SET LOCAL ROLE authenticated;
SELECT public.initialize_practice_portfolio();
WITH placed AS (SELECT public.record_practice_trade('aapl','buy',2,gen_random_uuid())->'trade' AS trade)
UPDATE result SET fill=(trade->>'price')::numeric,fee=(trade->>'fee')::numeric,gross=(trade->>'total')::numeric,source=trade->>'price_source' FROM placed;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM result WHERE preview=100 AND fill=101 AND fee=0.202 AND gross=202.202) THEN RAISE EXCEPTION 'unexpected fixture result'; END IF;
END; $$;
RESET ROLE;
UPDATE public.market_prices SET observed_at=clock_timestamp()-interval '16 minutes' WHERE asset_id='aapl';
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 BEGIN
  PERFORM public.record_practice_trade('aapl','buy',2,gen_random_uuid());
  RAISE EXCEPTION 'stale fixture unexpectedly filled';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM<>'Price quote is stale or unavailable for aapl. Orders are paused until the provider refreshes.' THEN RAISE; END IF;
 END;
END; $$;
SELECT result.*,true AS stale_quote_rejected FROM result;
ROLLBACK;

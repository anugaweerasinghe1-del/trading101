-- Isolated database verification only. Never run authentication fixtures on production.
BEGIN;
INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
 ('00000000-0000-4000-8000-000000000151','audit-c15-a@example.invalid','{"username":"audit_c15_a"}'),
 ('00000000-0000-4000-8000-000000000152','audit-c15-b@example.invalid','{"username":"audit_c15_b"}');
-- These scenarios test public rankings/duels after explicit fixture opt-in.
UPDATE public.profiles SET is_public=true WHERE id IN ('00000000-0000-4000-8000-000000000151','00000000-0000-4000-8000-000000000152');
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000151',true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE first jsonb; repeated jsonb; original numeric; final_cash numeric; result jsonb;
BEGIN
 result:=public.initialize_practice_portfolio();
 IF (result->>'cash')::numeric<>100000 OR NOT (result->>'ranked')::boolean THEN RAISE EXCEPTION 'Fresh account initialization failed'; END IF;
 IF has_table_privilege(current_user,'public.trader_stats','INSERT') OR has_table_privilege(current_user,'public.practice_portfolios','UPDATE') THEN RAISE EXCEPTION 'Client has score mutation permission'; END IF;
 first:=public.record_practice_trade('aapl','buy',1,'00000000-0000-4000-8000-000000000153');
 repeated:=public.record_practice_trade('aapl','buy',1,'00000000-0000-4000-8000-000000000153');
 IF first<>repeated THEN RAISE EXCEPTION 'Retry duplicated or changed an order'; END IF;
 result:=public.record_practice_trade('aapl','sell',1,'00000000-0000-4000-8000-000000000154');
 IF jsonb_array_length(result->'portfolio'->'trades')<>2 THEN RAISE EXCEPTION 'Server history not restored'; END IF;
 IF public.initialize_practice_portfolio('{"cash":1,"positions":[]}') <> result->'portfolio' THEN RAISE EXCEPTION 'Second device overwrote server record'; END IF;
 original:=(first->'trade'->>'price')::numeric;
 final_cash:=(result->'portfolio'->>'cash')::numeric;
 IF abs(final_cash-(100000-original*0.002))>0.000001 THEN RAISE EXCEPTION 'Round-trip fees wrong'; END IF;
 IF (SELECT win_rate FROM public.trader_stats WHERE user_id=auth.uid())<>0 THEN RAISE EXCEPTION 'Fee loss counted as win'; END IF;
 BEGIN
  PERFORM public.record_practice_trade('aapl','buy',-1,gen_random_uuid());
  RAISE EXCEPTION 'Negative quantity accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Invalid order' THEN RAISE; END IF; END;
 BEGIN
  PERFORM public.record_practice_trade('aapl','sell',100,gen_random_uuid());
  RAISE EXCEPTION 'Oversell accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Insufficient shares' THEN RAISE; END IF; END;
 BEGIN
  UPDATE public.trader_stats SET pnl_pct=99999 WHERE user_id=auth.uid();
  RAISE EXCEPTION 'Tampering accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 -- Server-recorded count reaches the ranking threshold; no fabricated wins.
 PERFORM public.record_practice_trade('aapl','buy',1,gen_random_uuid());
 PERFORM public.record_practice_trade('aapl','sell',1,gen_random_uuid());
 PERFORM public.record_practice_trade('aapl','buy',1,gen_random_uuid());
 IF NOT EXISTS(SELECT 1 FROM public.get_cloud_leaderboard(500) WHERE user_id=auth.uid()) THEN RAISE EXCEPTION 'Valid server ledger not ranked'; END IF;
END; $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000152',true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE result jsonb;
BEGIN
 IF EXISTS(SELECT 1 FROM public.practice_portfolios WHERE user_id='00000000-0000-4000-8000-000000000151') THEN RAISE EXCEPTION 'Cross-account portfolio read allowed'; END IF;
 result:=public.initialize_practice_portfolio('{"cash":900000,"has_activity":true,"positions":[]}');
 IF (result->>'ranked')::boolean OR (result->>'cash')::numeric<>900000 THEN RAISE EXCEPTION 'Import lost or ranked'; END IF;
 PERFORM public.record_practice_trade('aapl','buy',1,gen_random_uuid());
 PERFORM public.record_practice_trade('aapl','sell',1,gen_random_uuid());
 PERFORM public.record_practice_trade('aapl','buy',1,gen_random_uuid());
 PERFORM public.record_practice_trade('aapl','sell',1,gen_random_uuid());
 PERFORM public.record_practice_trade('aapl','buy',1,gen_random_uuid());
 IF EXISTS(SELECT 1 FROM public.get_cloud_leaderboard(500) WHERE user_id=auth.uid()) THEN RAISE EXCEPTION 'Unverified import entered rankings'; END IF;
 result:=public.start_ranked_practice();
 IF (result->>'cash')::numeric<>100000 OR NOT (result->>'ranked')::boolean THEN RAISE EXCEPTION 'Fresh ranked reset failed'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.practice_portfolio_backups WHERE user_id=auth.uid()) THEN RAISE EXCEPTION 'Prior portfolio not backed up'; END IF;
END; $$;
RESET ROLE;
UPDATE public.profiles SET is_public=false WHERE id='00000000-0000-4000-8000-000000000151';
SELECT set_config('request.jwt.claim.sub','',true);
SET LOCAL ROLE anon;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.get_cloud_leaderboard(500) WHERE user_id='00000000-0000-4000-8000-000000000151') THEN RAISE EXCEPTION 'Private account leaked into rankings'; END IF;
 IF has_function_privilege(current_user,'public.record_practice_trade(text,text,numeric,uuid)','EXECUTE') THEN RAISE EXCEPTION 'Anonymous order access granted'; END IF;
END; $$;
RESET ROLE;
SELECT 'C15 passed: fee losses, idempotency, oversell/negative rejection, mutation denial, import exclusion, backups, cross-account RLS, private filtering' AS verification;
ROLLBACK;

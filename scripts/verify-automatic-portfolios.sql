-- Isolated fixtures only; never run on production.
BEGIN;
INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
('00000000-0000-4000-8000-000000000481','auto-one@example.invalid','{"username":"auto_one"}'),
('00000000-0000-4000-8000-000000000482','auto-zero@example.invalid','{"username":"Auto_ZERO"}'),
('00000000-0000-4000-8000-000000000483','auto-private@example.invalid','{"username":"Auto_ZERO","is_public":false}');
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id='00000000-0000-4000-8000-000000000482' AND is_public=true) THEN RAISE EXCEPTION 'New signup does not default public'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.get_public_practice_members(500) WHERE user_id='00000000-0000-4000-8000-000000000482' AND trades=0 AND portfolio_value IS NULL) THEN RAISE EXCEPTION 'New signup absent before portfolio initialization'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id='00000000-0000-4000-8000-000000000482' AND username='auto_zero') THEN RAISE EXCEPTION 'Mixed-case signup name lost letters or underscore'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id='00000000-0000-4000-8000-000000000483' AND username='auto_zero-1' AND NOT is_public) THEN RAISE EXCEPTION 'Duplicate name or explicit private signup not handled'; END IF;
END; $$;
UPDATE public.profiles SET is_public=false WHERE id='00000000-0000-4000-8000-000000000483';
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000481',true);
SET LOCAL ROLE authenticated;
SELECT public.initialize_practice_portfolio();
SELECT public.record_practice_trade('btc','buy',0.1,gen_random_uuid());
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.get_cloud_leaderboard(500) WHERE user_id=auth.uid() AND trades=1) THEN RAISE EXCEPTION 'First server trade not ranked'; END IF;
 IF has_function_privilege(current_user,'public.store_practice_quote(text,numeric,text,timestamptz,text)','EXECUTE') THEN RAISE EXCEPTION 'Client can set prices'; END IF;
 IF has_function_privilege(current_user,'public.claim_portfolio_price_refresh(text)','EXECUTE') THEN RAISE EXCEPTION 'Client can claim job'; END IF;
END; $$;
RESET ROLE;
-- Simulate a stale provider cache WITHOUT altering durable production history.
-- Seed a real cache row: the first account trade above can use a fixed simulator price.
SELECT public.store_practice_quote('btc',95000,'Isolated fixture',now()-interval '2 minutes','provider');
-- Existing server auth remains in force and a blocked order must not mutate funds.
UPDATE public.market_prices SET observed_at=now()-interval '60 days', updated_at=now(),quote_status='provider'
 WHERE asset_id='btc';
SET LOCAL ROLE authenticated;
DO $$ DECLARE cash_before numeric; count_before integer; denied boolean:=false;
BEGIN
 SELECT cash,trades_count INTO cash_before,count_before FROM public.practice_portfolios WHERE user_id=auth.uid();
 BEGIN
   PERFORM public.record_practice_trade('btc','buy',0.001,gen_random_uuid());
 EXCEPTION WHEN others THEN
   IF SQLERRM LIKE '%quote is stale%' THEN denied:=true;
   ELSE RAISE; END IF;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'Stale provider observation allowed an account trade'; END IF;
 IF EXISTS(SELECT 1 FROM public.practice_portfolios WHERE user_id=auth.uid()
   AND (cash<>cash_before OR trades_count<>count_before)) THEN
   RAISE EXCEPTION 'Rejected stale trade mutated cash or trade count'; END IF;
END; $$;
RESET ROLE;
UPDATE public.market_prices SET observed_at=now()-interval '1 minute',updated_at=now()
 WHERE asset_id='btc';
DO $$ DECLARE before numeric; after numeric; saved_cash numeric; saved_trades integer;
BEGIN
 SELECT portfolio_value INTO before FROM public.get_public_practice_members(500) WHERE user_id='00000000-0000-4000-8000-000000000481';
 SELECT p.cash,p.trades_count INTO saved_cash,saved_trades FROM public.practice_portfolios p WHERE p.user_id='00000000-0000-4000-8000-000000000481';
 IF NOT public.store_practice_quote('btc',110000,'Isolated fixture',now()-interval '1 minute','provider') THEN RAISE EXCEPTION 'Quote not stored'; END IF;
 SELECT portfolio_value INTO after FROM public.get_public_practice_members(500) WHERE user_id='00000000-0000-4000-8000-000000000481';
 IF abs(after-before-1500)>0.001 THEN RAISE EXCEPTION 'Offline position not revalued'; END IF;
 IF (SELECT (public.initialize_practice_portfolio()->'positions'->0->>'last_price')::numeric)<>110000 THEN RAISE EXCEPTION 'Account snapshot differs from public valuation'; END IF;
 IF EXISTS(SELECT 1 FROM public.practice_portfolios p WHERE p.user_id='00000000-0000-4000-8000-000000000481' AND (p.cash<>saved_cash OR p.trades_count<>saved_trades)) THEN RAISE EXCEPTION 'Quote changed cash or trades'; END IF;
 IF public.store_practice_quote('btc',1,'Older fixture',now()-interval '2 minutes','provider') THEN RAISE EXCEPTION 'Out-of-order price accepted'; END IF;
 IF public.store_practice_quote('btc',1,'Simulation',now(),'simulated') THEN RAISE EXCEPTION 'Simulated quote accepted'; END IF;
 IF public.store_practice_quote('btc',1,'Proxy',now(),'proxy') THEN RAISE EXCEPTION 'Proxy quote accepted'; END IF;
 IF public.store_practice_quote('btc',1,'Future',now()+interval '1 day','provider') THEN RAISE EXCEPTION 'Future quote accepted'; END IF;
 IF public.store_practice_quote('btc',1,'Old upstream observation',now()-interval '40 minutes','provider') THEN
   RAISE EXCEPTION 'Old observation incorrectly refreshed provider cache'; END IF;
 IF public.store_practice_quote('btc',1,'Undated upstream observation',NULL,'provider') THEN
   RAISE EXCEPTION 'Undated observation incorrectly accepted'; END IF;
 IF public.store_practice_quote('msft',1,'Weeks-old close',now()-interval '20 days','previous_close') THEN
   RAISE EXCEPTION 'Weeks-old previous close incorrectly accepted'; END IF;
END; $$;
SET LOCAL ROLE anon;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.get_public_practice_members(500) WHERE user_id='00000000-0000-4000-8000-000000000482' AND trades=0 AND practice_rank IS NULL AND portfolio_value IS NULL) THEN RAISE EXCEPTION 'Zero-trade member missing or invented value'; END IF;
 IF EXISTS(SELECT 1 FROM public.get_public_practice_members(500) WHERE user_id='00000000-0000-4000-8000-000000000483') THEN RAISE EXCEPTION 'Private member exposed'; END IF;
 IF (SELECT count(*) FROM public.get_previous_practice_results())<>2 THEN RAISE EXCEPTION 'Previous activity threshold remains'; END IF;
END; $$;
RESET ROLE;
UPDATE public.profiles SET is_public=false WHERE id='00000000-0000-4000-8000-000000000481';
SET LOCAL ROLE anon;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.get_public_practice_members(500) WHERE user_id='00000000-0000-4000-8000-000000000481') THEN RAISE EXCEPTION 'Private switch did not hide member'; END IF;
END; $$;
RESET ROLE;
UPDATE tradehq_private.price_refresh_state SET pending_token=repeat('a',64),pending_expires=clock_timestamp()+interval '2 minutes';
DO $$ DECLARE claim jsonb;
BEGIN
 IF public.claim_portfolio_price_refresh(repeat('b',64)) IS NOT NULL THEN RAISE EXCEPTION 'Invalid scheduler token accepted'; END IF;
 claim:=public.claim_portfolio_price_refresh(repeat('a',64));
 IF claim IS NULL OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(claim->'assets') a WHERE a->>'assetId'='btc') THEN RAISE EXCEPTION 'Private held asset not refreshed'; END IF;
 IF public.claim_portfolio_price_refresh(repeat('a',64)) IS NOT NULL THEN RAISE EXCEPTION 'Duplicate lease accepted'; END IF;
 IF EXISTS(SELECT 1 FROM tradehq_private.price_refresh_state WHERE pending_token IS NOT NULL) THEN RAISE EXCEPTION 'Token not consumed'; END IF;
 PERFORM public.finish_portfolio_price_refresh((claim->>'lease')::uuid,'{"updated":1}');
 IF NOT EXISTS(SELECT 1 FROM tradehq_private.price_refresh_state WHERE last_finished IS NOT NULL) THEN RAISE EXCEPTION 'Job result not recorded'; END IF;
END; $$;
UPDATE tradehq_private.price_refresh_state SET last_started=NULL,pending_token=repeat('c',64),pending_expires=clock_timestamp()-interval '1 minute';
DO $$ BEGIN IF public.claim_portfolio_price_refresh(repeat('c',64)) IS NOT NULL THEN RAISE EXCEPTION 'Expired token accepted'; END IF; END; $$;
SELECT 'Automatic portfolios passed: zero-trade public members, first-trade ranking, offline valuation, immutable cash/trades, monotonic quotes, privacy opt-out, historical isolation, scheduler authentication and leases' AS verification;
ROLLBACK;

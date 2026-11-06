-- Isolated database verification. Do not run auth fixtures on production.
BEGIN;
INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
 ('00000000-0000-4000-8000-000000000171','audit-c17-a@example.invalid','{"username":"audit_c17_a"}'),
 ('00000000-0000-4000-8000-000000000172','audit-c17-b@example.invalid','{"username":"audit_c17_b"}');
-- These scenarios test public rankings/duels after explicit fixture opt-in.
UPDATE public.profiles SET is_public=true WHERE id IN ('00000000-0000-4000-8000-000000000171','00000000-0000-4000-8000-000000000172');
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000171',true);
SET LOCAL ROLE authenticated;
SELECT public.initialize_practice_portfolio();
SELECT public.create_practice_duel('auditc17');
DO $$ BEGIN
 IF public.join_practice_duel((SELECT id FROM public.duels WHERE code='auditc17')) THEN RAISE EXCEPTION 'Self join allowed'; END IF;
END; $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000172',true);
SET LOCAL ROLE authenticated;
SELECT public.initialize_practice_portfolio();
DO $$ BEGIN
 IF NOT public.join_practice_duel((SELECT id FROM public.duels WHERE code='auditc17')) THEN RAISE EXCEPTION 'Join failed'; END IF;
 IF public.join_practice_duel((SELECT id FROM public.duels WHERE code='auditc17')) THEN RAISE EXCEPTION 'Duplicate join allowed'; END IF;
 IF has_table_privilege(current_user,'public.duels','UPDATE') THEN RAISE EXCEPTION 'Duel client UPDATE granted'; END IF;
 BEGIN
  PERFORM public.start_ranked_practice(); RAISE EXCEPTION 'Active-duel reset accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Finish your current duels before starting fresh' THEN RAISE; END IF; END;
END; $$;
RESET ROLE;
-- Model a recorded pre-deadline buy and quote, plus a later quote/trade.
INSERT INTO public.practice_trades(id,user_id,cycle_id,asset_id,side,quantity,price,fee,total,price_source,created_at)
 SELECT gen_random_uuid(),user_id,cycle_id,'aapl','buy',10,100,1,1001,'Test fixture',now()-interval '2 days'
 FROM public.practice_portfolios WHERE user_id='00000000-0000-4000-8000-000000000171';
INSERT INTO tradehq_private.market_price_history(asset_id,price,source,cached_at) VALUES
 ('aapl',110,'Test fixture',now()-interval '2 days'),('aapl',9999,'Test fixture',now());
UPDATE public.duels SET ends_at=now()-interval '1 day' WHERE code='auditc17';
INSERT INTO public.practice_trades(id,user_id,cycle_id,asset_id,side,quantity,price,fee,total,price_source,created_at)
 SELECT gen_random_uuid(),user_id,cycle_id,'aapl','sell',10,9999,99.99,99890.01,'Test fixture',now()
 FROM public.practice_portfolios WHERE user_id='00000000-0000-4000-8000-000000000171';
SELECT set_config('request.jwt.claim.sub','',true);
SET LOCAL ROLE anon;
DO $$ DECLARE result jsonb; again jsonb;
BEGIN
 result:=public.get_practice_duel_score((SELECT id FROM public.duels WHERE code='auditc17'));
 IF (result->>'creator_final_value')::numeric<>100099 THEN RAISE EXCEPTION 'Deadline value used late quote/trade'; END IF;
 IF (result->>'opponent_final_value')::numeric<>100000 OR result->>'settled_at' IS NULL THEN RAISE EXCEPTION 'Settlement missing'; END IF;
 again:=public.get_practice_duel_score((SELECT id FROM public.duels WHERE code='auditc17'));
 IF result<>again THEN RAISE EXCEPTION 'Final result not idempotent'; END IF;
END; $$;
RESET ROLE;
UPDATE tradehq_private.market_price_history SET price=12345 WHERE asset_id='aapl';
SELECT set_config('request.jwt.claim.sub','',true);
SET LOCAL ROLE anon;
DO $$ BEGIN
 IF (public.get_practice_duel_score((SELECT id FROM public.duels WHERE code='auditc17'))->>'creator_final_value')::numeric<>100099 THEN RAISE EXCEPTION 'Frozen result changed'; END IF;
END; $$;
RESET ROLE;
SELECT set_config('audit.duel_id',id::text,true) FROM public.duels WHERE code='auditc17';
UPDATE public.profiles SET is_public=false WHERE id='00000000-0000-4000-8000-000000000171';
SET LOCAL ROLE anon;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.duels WHERE code='auditc17') THEN RAISE EXCEPTION 'Private duel row leaked'; END IF;
 IF public.get_practice_duel_score(current_setting('audit.duel_id')::uuid) IS NOT NULL THEN RAISE EXCEPTION 'Private duel score leaked'; END IF;
END; $$;
RESET ROLE;
SELECT 'C17 passed: identity, duplicate/self join, reset guard, direct mutation denial, deadline quote/trade cutoff, frozen repeat reads, profile privacy' AS verification;
ROLLBACK;

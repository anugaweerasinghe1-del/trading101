-- Isolated fixture regression; all records are rolled back.
BEGIN;
DO $verify$
DECLARE target text;
BEGIN
  IF has_table_privilege('anon','public.api_rate_limits','SELECT,INSERT,UPDATE,DELETE,REFERENCES')
    OR has_table_privilege('authenticated','public.api_rate_limits','SELECT,INSERT,UPDATE,DELETE,REFERENCES') THEN
    RAISE EXCEPTION 'Browser role can access private rate counters';
  END IF;
  IF NOT has_function_privilege('service_role','public.hit_rate_limit(text,text,integer,integer)','EXECUTE')
    OR has_function_privilege('anon','public.hit_rate_limit(text,text,integer,integer)','EXECUTE')
    OR has_function_privilege('authenticated','public.hit_rate_limit(text,text,integer,integer)','EXECUTE') THEN
    RAISE EXCEPTION 'Service-only rate limiter boundary changed';
  END IF;
  FOREACH target IN ARRAY ARRAY['duels_creator_id_idx','duels_opponent_id_idx',
    'practice_portfolio_backups_user_id_idx','practice_positions_asset_id_idx','practice_trades_asset_id_idx'] LOOP
    IF to_regclass('public.'||target) IS NULL THEN RAISE EXCEPTION 'Missing index %',target; END IF;
  END LOOP;
  IF EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename IN ('profiles','trader_stats','duels')
    AND ((coalesce(qual,'') LIKE '%auth.uid()%' AND qual NOT LIKE '%SELECT auth.uid()%')
      OR (coalesce(with_check,'') LIKE '%auth.uid()%' AND with_check NOT LIKE '%SELECT auth.uid()%'))) THEN
    RAISE EXCEPTION 'Policy identity lookup remains per-row';
  END IF;
END $verify$;
SET LOCAL ROLE service_role;
DO $verify$
BEGIN
  IF NOT public.hit_rate_limit('phase4a-fixture','test',60,1) THEN RAISE EXCEPTION 'First service request denied'; END IF;
  IF public.hit_rate_limit('phase4a-fixture','test',60,1) THEN RAISE EXCEPTION 'Service rate limit not enforced'; END IF;
END $verify$;
RESET ROLE;
SELECT 'PASS Phase 4A private rate counters, service-only limiter, FK indexes and policy initPlans' AS verification;
ROLLBACK;

-- Verify dangerous maintenance grants are absent for public roles.
BEGIN;
DO $phase2$
DECLARE target_table text;
BEGIN
  FOREACH target_table IN ARRAY ARRAY['api_rate_limits','duels','market_articles','profiles','subscribers','trader_stats'] LOOP
    IF has_table_privilege('anon', 'public.' || target_table, 'TRUNCATE')
      OR has_table_privilege('authenticated', 'public.' || target_table, 'TRUNCATE') THEN
      RAISE EXCEPTION 'Browser role can truncate %', target_table;
    END IF;
    IF has_table_privilege('anon', 'public.' || target_table, 'TRIGGER')
      OR has_table_privilege('authenticated', 'public.' || target_table, 'TRIGGER') THEN
      RAISE EXCEPTION 'Browser role can install triggers on %', target_table;
    END IF;
  END LOOP;
END;
$phase2$;
SELECT 'PASS Phase 2 database role restrictions: no browser truncate or trigger privileges' AS verification;
ROLLBACK;

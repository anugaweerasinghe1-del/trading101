-- Restricted tables intentionally have no browser policies; preserve that model.
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '30s';
DO $access$
BEGIN
  IF to_regclass('public.api_rate_limits') IS NOT NULL THEN
    REVOKE ALL ON public.api_rate_limits FROM PUBLIC, anon, authenticated;
  END IF;
END $access$;

-- Cache the statement-constant auth identity, preserving predicates and roles.
DO $policies$
DECLARE policy record; clauses text;
BEGIN
  FOR policy IN SELECT * FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('profiles', 'trader_stats', 'duels')
      AND (coalesce(qual, '') LIKE '%auth.uid()%' OR coalesce(with_check, '') LIKE '%auth.uid()%')
      AND coalesce(qual, '') NOT LIKE '%SELECT auth.uid()%'
      AND coalesce(with_check, '') NOT LIKE '%SELECT auth.uid()%'
  LOOP
    clauses := '';
    IF policy.qual IS NOT NULL THEN
      clauses := clauses || ' USING (' || replace(policy.qual, 'auth.uid()', '(select auth.uid())') || ')';
    END IF;
    IF policy.with_check IS NOT NULL THEN
      clauses := clauses || ' WITH CHECK (' || replace(policy.with_check, 'auth.uid()', '(select auth.uid())') || ')';
    END IF;
    EXECUTE format('ALTER POLICY %I ON %I.%I%s', policy.policyname, policy.schemaname, policy.tablename, clauses);
  END LOOP;
END $policies$;

-- Cover only the ten foreign keys observed without leading-column indexes.
-- Optional subsystems may be absent in isolated core database fixtures.
DO $indexes$
DECLARE item record;
BEGIN
  FOR item IN SELECT * FROM (VALUES
    ('public','duels','creator_id','duels_creator_id_idx'),
    ('public','duels','opponent_id','duels_opponent_id_idx'),
    ('public','newsletter_deliveries','contact_id','newsletter_deliveries_contact_id_idx'),
    ('public','practice_portfolio_backups','user_id','practice_portfolio_backups_user_id_idx'),
    ('public','practice_positions','asset_id','practice_positions_asset_id_idx'),
    ('public','practice_trades','asset_id','practice_trades_asset_id_idx'),
    ('tradehq_automation','code_events','request_id','code_events_request_id_idx'),
    ('tradehq_automation','code_requests','owner_id','code_requests_owner_id_idx'),
    ('tradehq_automation','code_worker_runs','request_id','code_worker_runs_request_id_idx'),
    ('tradehq_private','course_generation_runs','draft_id','course_generation_runs_draft_id_idx')
  ) AS targets(schema_name,table_name,column_name,index_name)
  LOOP
    IF to_regclass(format('%I.%I',item.schema_name,item.table_name)) IS NOT NULL THEN
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I.%I (%I)', item.index_name,item.schema_name,item.table_name,item.column_name);
    END IF;
  END LOOP;
END $indexes$;

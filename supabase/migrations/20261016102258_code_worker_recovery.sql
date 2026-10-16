BEGIN;
CREATE TABLE tradehq_automation.code_worker_runs (
 run_id bigint PRIMARY KEY CHECK(run_id>0), base_sha text NOT NULL CHECK(base_sha ~ '^[a-f0-9]{40}$'),
 request_id uuid REFERENCES tradehq_automation.code_requests(id),
 status text NOT NULL CHECK(status IN ('idle','claimed','proposed','verified','validation_failed','failed','no_change')),
 first_seen_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE tradehq_automation.code_worker_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON tradehq_automation.code_worker_runs FROM PUBLIC,anon,authenticated,service_role;
ALTER FUNCTION public.tradehq_admin_code_queue(text,uuid,jsonb) RENAME TO tradehq_admin_code_queue_v2;
REVOKE ALL ON FUNCTION public.tradehq_admin_code_queue_v2(text,uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.tradehq_admin_code_queue(p_action text,p_owner uuid DEFAULT NULL,p_data jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 PERFORM pg_advisory_xact_lock(1130435580,16301);
 IF p_action='pending-results' THEN
  RETURN coalesce((SELECT jsonb_agg(to_jsonb(p)) FROM
   (SELECT id,run_id,base_sha,head_sha FROM tradehq_automation.code_requests WHERE status='proposed' ORDER BY created_at LIMIT 10)p),'[]'::jsonb);
 END IF;
 IF p_action='claim' AND EXISTS(SELECT 1 FROM tradehq_automation.code_worker_runs WHERE run_id=(p_data->>'runId')::bigint) THEN RETURN NULL; END IF;
 result:=public.tradehq_admin_code_queue_v2(p_action,p_owner,p_data);
 IF p_action='claim' THEN
  INSERT INTO tradehq_automation.code_worker_runs(run_id,base_sha,request_id,status)
   VALUES((p_data->>'runId')::bigint,p_data->>'baseSha',(result->>'id')::uuid,CASE WHEN result IS NULL THEN 'idle' ELSE 'claimed' END)
   ON CONFLICT(run_id) DO NOTHING;
  -- The original expired-lease transition stays consumed; expose its result without retrying it.
  UPDATE tradehq_automation.code_worker_runs w SET status='failed',updated_at=clock_timestamp()
   FROM tradehq_automation.code_requests r WHERE w.request_id=r.id AND w.status='claimed' AND r.status='failed';
 ELSIF p_action IN ('finish','validation') THEN
  UPDATE tradehq_automation.code_worker_runs SET status=result->>'status',updated_at=clock_timestamp()
   WHERE run_id=(result->>'run_id')::bigint AND request_id=(result->>'id')::uuid AND base_sha=result->>'base_sha';
  IF p_action='validation' AND p_data->>'reconciled'='true' THEN
   INSERT INTO tradehq_automation.code_events(request_id,event,run_id)
    VALUES((result->>'id')::uuid,'NATIVE_RESULT_RECONCILED',(result->>'run_id')::bigint);
  END IF;
 ELSIF p_action='list' THEN
  result:=result||jsonb_build_object('workerRuns',coalesce((SELECT jsonb_agg(to_jsonb(w)) FROM
   (SELECT * FROM tradehq_automation.code_worker_runs ORDER BY first_seen_at DESC LIMIT 100)w),'[]'::jsonb));
 END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.tradehq_admin_code_queue(text,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.tradehq_admin_code_queue(text,uuid,jsonb) TO service_role;
COMMIT;

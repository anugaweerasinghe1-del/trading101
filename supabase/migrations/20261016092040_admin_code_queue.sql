-- Owner-submitted requests only. Workers receive one durable attempt, never a DB credential.
BEGIN;
CREATE SCHEMA tradehq_automation;
REVOKE ALL ON SCHEMA tradehq_automation FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE tradehq_automation.code_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES auth.users(id),
 request_key uuid NOT NULL UNIQUE, prompt text NOT NULL CHECK(length(prompt) BETWEEN 20 AND 2500),
 status text NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','claimed','proposed','verified','validation_failed','failed','no_change','canceled')),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 run_id bigint UNIQUE, base_sha text, head_sha text, pr_number bigint, result_code text,
 CHECK(base_sha IS NULL OR base_sha ~ '^[a-f0-9]{40}$'),CHECK(head_sha IS NULL OR head_sha ~ '^[a-f0-9]{40}$')
);
CREATE TABLE tradehq_automation.code_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, request_id uuid NOT NULL REFERENCES tradehq_automation.code_requests(id),
 at timestamptz NOT NULL DEFAULT clock_timestamp(), event text NOT NULL, run_id bigint
);
ALTER TABLE tradehq_automation.code_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradehq_automation.code_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA tradehq_automation FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA tradehq_automation FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.tradehq_admin_code_queue(p_action text,p_owner uuid DEFAULT NULL,p_data jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r tradehq_automation.code_requests; v_run bigint; v_id uuid; v_status text; changed integer;
BEGIN
 -- Serializes admission/cancellation/worker claims; budget is durable across restarts.
 PERFORM pg_advisory_xact_lock(1130435580,16301);
 IF p_action IN ('list','submit','cancel') THEN
  IF p_owner IS NULL OR p_owner IS DISTINCT FROM public.tradehq_repair_registered_owner() THEN RAISE EXCEPTION 'OWNER_REQUIRED'; END IF;
 ELSIF p_action NOT IN ('claim','finish','validation') THEN RAISE EXCEPTION 'INVALID_ACTION'; END IF;
 IF p_action='list' THEN
  RETURN jsonb_build_object('requests',coalesce((SELECT jsonb_agg(to_jsonb(q)-'owner_id'-'request_key') FROM
   (SELECT * FROM tradehq_automation.code_requests ORDER BY created_at DESC LIMIT 50)q),'[]'::jsonb),
   'events',coalesce((SELECT jsonb_agg(to_jsonb(e)) FROM (SELECT * FROM tradehq_automation.code_events ORDER BY id DESC LIMIT 200)e),'[]'::jsonb));
 ELSIF p_action='submit' THEN
  SELECT * INTO r FROM tradehq_automation.code_requests WHERE request_key=(p_data->>'requestKey')::uuid;
  IF FOUND THEN
   IF r.owner_id<>p_owner OR r.prompt IS DISTINCT FROM p_data->>'prompt' THEN RAISE EXCEPTION 'REQUEST_KEY_CONFLICT'; END IF;
   RETURN to_jsonb(r)-'owner_id'-'request_key';
  END IF;
  IF EXISTS(SELECT 1 FROM tradehq_automation.code_requests WHERE status IN ('queued','claimed','proposed')) THEN RAISE EXCEPTION 'REQUEST_ALREADY_ACTIVE'; END IF;
  IF EXISTS(SELECT 1 FROM tradehq_automation.code_requests WHERE created_at>clock_timestamp()-interval '24 hours' AND status<>'canceled') THEN RAISE EXCEPTION 'DAILY_CODE_LIMIT'; END IF;
  INSERT INTO tradehq_automation.code_requests(owner_id,request_key,prompt) VALUES(p_owner,(p_data->>'requestKey')::uuid,p_data->>'prompt') RETURNING * INTO r;
  INSERT INTO tradehq_automation.code_events(request_id,event) VALUES(r.id,'OWNER_REQUEST_QUEUED');
 ELSIF p_action='cancel' THEN
  UPDATE tradehq_automation.code_requests SET status='canceled',updated_at=clock_timestamp()
  WHERE id=(p_data->>'id')::uuid AND status='queued' RETURNING * INTO r;
  IF NOT FOUND THEN RAISE EXCEPTION 'REQUEST_NOT_QUEUED'; END IF;
  INSERT INTO tradehq_automation.code_events(request_id,event) VALUES(r.id,'OWNER_REQUEST_CANCELED');
 ELSIF p_action='claim' THEN
  v_run:=(p_data->>'runId')::bigint;
  IF v_run<=0 OR coalesce(p_data->>'baseSha','')!~'^[a-f0-9]{40}$' THEN RAISE EXCEPTION 'WORKER_BINDING'; END IF;
  -- Lost workers stay consumed; no replay or automatic model retry.
  WITH expired AS (UPDATE tradehq_automation.code_requests SET status='failed',result_code='WORKER_EXPIRED',updated_at=clock_timestamp()
   WHERE status='claimed' AND updated_at<clock_timestamp()-interval '25 minutes' RETURNING id,run_id)
  INSERT INTO tradehq_automation.code_events(request_id,event,run_id) SELECT id,'WORKER_EXPIRED',run_id FROM expired;
  IF EXISTS(SELECT 1 FROM tradehq_automation.code_requests WHERE run_id=v_run) THEN RETURN NULL; END IF;
  SELECT * INTO r FROM tradehq_automation.code_requests WHERE status='queued' ORDER BY created_at LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  UPDATE tradehq_automation.code_requests SET status='claimed',run_id=v_run,base_sha=p_data->>'baseSha',updated_at=clock_timestamp() WHERE id=r.id RETURNING * INTO r;
  INSERT INTO tradehq_automation.code_events(request_id,event,run_id) VALUES(r.id,'WORKER_CLAIMED',v_run);
 ELSIF p_action IN ('finish','validation') THEN
  v_run:=(p_data->>'runId')::bigint;v_id:=(p_data->>'id')::uuid;v_status:=p_data->>'status';
  SELECT * INTO r FROM tradehq_automation.code_requests WHERE id=v_id AND run_id=v_run FOR UPDATE;
  IF NOT FOUND OR r.base_sha IS DISTINCT FROM p_data->>'baseSha' THEN RAISE EXCEPTION 'WORKER_BINDING'; END IF;
  IF p_action='finish' THEN
   IF r.status<>'claimed' OR v_status NOT IN ('proposed','failed','no_change') THEN RAISE EXCEPTION 'INVALID_TRANSITION'; END IF;
   IF v_status='proposed' AND (coalesce(p_data->>'headSha','')!~'^[a-f0-9]{40}$' OR coalesce((p_data->>'prNumber')::bigint,0)<=0) THEN RAISE EXCEPTION 'PROPOSAL_BINDING'; END IF;
   IF coalesce(p_data->>'resultCode','') NOT IN ('PROPOSAL_CREATED','NO_SAFE_CHANGE','PROVIDER_OR_SCOPE_STOP','WORKER_CONTEXT_STOP') THEN RAISE EXCEPTION 'INVALID_RESULT'; END IF;
   UPDATE tradehq_automation.code_requests SET status=v_status,head_sha=p_data->>'headSha',pr_number=(p_data->>'prNumber')::bigint,
    result_code=p_data->>'resultCode',updated_at=clock_timestamp() WHERE id=r.id RETURNING * INTO r;
  ELSE
   IF r.status<>'proposed' OR v_status NOT IN ('verified','validation_failed') OR r.head_sha IS DISTINCT FROM p_data->>'headSha' THEN RAISE EXCEPTION 'INVALID_TRANSITION'; END IF;
   UPDATE tradehq_automation.code_requests SET status=v_status,result_code=CASE WHEN v_status='verified' THEN 'INDEPENDENT_CHECKS_PASSED' ELSE 'INDEPENDENT_CHECKS_FAILED' END,
    updated_at=clock_timestamp() WHERE id=r.id RETURNING * INTO r;
  END IF;
  INSERT INTO tradehq_automation.code_events(request_id,event,run_id) VALUES(r.id,upper(r.result_code),v_run);
 END IF;
 RETURN to_jsonb(r)-'owner_id'-'request_key';
END $$;
REVOKE ALL ON FUNCTION public.tradehq_admin_code_queue(text,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.tradehq_admin_code_queue(text,uuid,jsonb) TO service_role;
COMMIT;

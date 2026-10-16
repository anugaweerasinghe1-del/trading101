BEGIN;
CREATE TABLE tradehq_automation.code_publications (
 request_id uuid PRIMARY KEY REFERENCES tradehq_automation.code_reviews(request_id),
 view_id uuid NOT NULL, head_sha text NOT NULL CHECK(head_sha ~ '^[a-f0-9]{40}$'),
 base_sha text NOT NULL CHECK(base_sha ~ '^[a-f0-9]{40}$'),patch_digest text NOT NULL CHECK(patch_digest ~ '^[a-f0-9]{64}$'),
 approved_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 state text NOT NULL DEFAULT 'approved' CHECK(state IN ('approved','claimed','merging','merged','published','blocked')),
 run_id bigint UNIQUE,lease_until timestamptz,merge_sha text CHECK(merge_sha ~ '^[a-f0-9]{40}$'),
 release_run_id bigint UNIQUE,result_code text,updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE tradehq_automation.code_publications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON tradehq_automation.code_publications FROM PUBLIC,anon,authenticated,service_role;
ALTER FUNCTION public.tradehq_admin_code_queue(text,uuid,jsonb) RENAME TO tradehq_admin_code_queue_v4;
REVOKE ALL ON FUNCTION public.tradehq_admin_code_queue_v4(text,uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.tradehq_admin_code_queue(p_action text,p_owner uuid DEFAULT NULL,p_data jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;r tradehq_automation.code_requests;v tradehq_automation.code_reviews;p tradehq_automation.code_publications;
BEGIN
 PERFORM pg_advisory_xact_lock(1130435580,16301);
 IF p_action='approve-proposal' THEN
  IF p_owner IS NULL OR p_owner IS DISTINCT FROM public.tradehq_repair_registered_owner() THEN RAISE EXCEPTION 'OWNER_REQUIRED'; END IF;
  SELECT * INTO r FROM tradehq_automation.code_requests WHERE id=(p_data->>'id')::uuid;
  IF NOT FOUND OR r.status<>'verified' OR r.head_sha IS DISTINCT FROM p_data->>'headSha' OR r.base_sha IS DISTINCT FROM p_data->>'baseSha' THEN RAISE EXCEPTION 'PROPOSAL_NOT_VERIFIED'; END IF;
  SELECT * INTO v FROM tradehq_automation.code_reviews WHERE request_id=r.id;
  IF NOT FOUND OR v.view_id IS DISTINCT FROM (p_data->>'viewId')::uuid OR v.head_sha<>r.head_sha OR v.decision IS NOT NULL THEN RAISE EXCEPTION 'REVIEW_EXPIRED'; END IF;
  SELECT * INTO p FROM tradehq_automation.code_publications WHERE request_id=r.id;
  IF FOUND THEN RETURN to_jsonb(p); END IF;
  IF v.viewed_at<clock_timestamp()-interval '10 minutes' THEN RAISE EXCEPTION 'REVIEW_EXPIRED'; END IF;
  INSERT INTO tradehq_automation.code_publications(request_id,view_id,head_sha,base_sha,patch_digest) VALUES(r.id,v.view_id,r.head_sha,r.base_sha,v.patch_digest) RETURNING * INTO p;
  INSERT INTO tradehq_automation.code_events(request_id,event) VALUES(r.id,'OWNER_PUBLICATION_APPROVED');
  RETURN to_jsonb(p);
 ELSIF p_action IN ('reject-proposal','review-view') AND EXISTS(SELECT 1 FROM tradehq_automation.code_publications WHERE request_id=(p_data->>'id')::uuid) THEN
  RAISE EXCEPTION 'PUBLICATION_ALREADY_APPROVED';
 ELSIF p_action='publication-pending' THEN
  RETURN coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM (SELECT pub.*,req.pr_number FROM tradehq_automation.code_publications pub JOIN tradehq_automation.code_requests req ON req.id=pub.request_id WHERE pub.state IN ('claimed','merging','merged') ORDER BY pub.approved_at LIMIT 10)x),'[]'::jsonb);
 ELSIF p_action='publication-get' THEN
  SELECT * INTO p FROM tradehq_automation.code_publications WHERE request_id=(p_data->>'id')::uuid;
  IF NOT FOUND THEN RAISE EXCEPTION 'WORKER_BINDING'; END IF;
  SELECT * INTO r FROM tradehq_automation.code_requests WHERE id=p.request_id;
  RETURN to_jsonb(p)||jsonb_build_object('pr_number',r.pr_number);
 ELSIF p_action='publication-claim' THEN
  IF coalesce((p_data->>'runId')::bigint,0)<=0 OR coalesce(p_data->>'baseSha','')!~'^[a-f0-9]{40}$' THEN RAISE EXCEPTION 'WORKER_BINDING'; END IF;
  IF EXISTS(SELECT 1 FROM tradehq_automation.code_publications WHERE run_id=(p_data->>'runId')::bigint) THEN RETURN NULL; END IF;
  SELECT * INTO p FROM tradehq_automation.code_publications WHERE state='approved' ORDER BY approved_at LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  UPDATE tradehq_automation.code_publications SET state=CASE WHEN base_sha=p_data->>'baseSha' THEN 'claimed' ELSE 'blocked' END,
   result_code=CASE WHEN base_sha=p_data->>'baseSha' THEN NULL ELSE 'BASE_CHANGED' END,run_id=(p_data->>'runId')::bigint,lease_until=clock_timestamp()+interval '60 minutes',updated_at=clock_timestamp() WHERE request_id=p.request_id RETURNING * INTO p;
  INSERT INTO tradehq_automation.code_events(request_id,event,run_id) VALUES(p.request_id,CASE WHEN p.state='blocked' THEN 'PUBLICATION_BASE_CHANGED' ELSE 'PUBLICATION_CLAIMED' END,p.run_id);
  IF p.state='blocked' THEN RETURN NULL; END IF;
  SELECT * INTO r FROM tradehq_automation.code_requests WHERE id=p.request_id;
  RETURN to_jsonb(p)||jsonb_build_object('pr_number',r.pr_number);
 ELSIF p_action='publication-authorize' THEN
  SELECT * INTO p FROM tradehq_automation.code_publications WHERE request_id=(p_data->>'id')::uuid FOR UPDATE;
  IF NOT FOUND OR p.state<>'claimed' OR p.run_id IS DISTINCT FROM (p_data->>'runId')::bigint OR p.head_sha IS DISTINCT FROM p_data->>'headSha' OR p.base_sha IS DISTINCT FROM p_data->>'baseSha' OR p.lease_until<=clock_timestamp() THEN RAISE EXCEPTION 'WORKER_BINDING'; END IF;
  UPDATE tradehq_automation.code_publications SET state='merging',updated_at=clock_timestamp() WHERE request_id=p.request_id RETURNING * INTO p;
  INSERT INTO tradehq_automation.code_events(request_id,event,run_id) VALUES(p.request_id,'PUBLICATION_GATES_CONFIRMED',p.run_id);
  RETURN to_jsonb(p);
 ELSIF p_action='publication-observe' THEN
  SELECT * INTO p FROM tradehq_automation.code_publications WHERE request_id=(p_data->>'id')::uuid FOR UPDATE;
  IF NOT FOUND OR p.state NOT IN ('claimed','merging','merged') OR coalesce(p_data->>'state','') NOT IN ('merged','published','blocked') THEN RAISE EXCEPTION 'WORKER_BINDING'; END IF;
  IF p_data->>'state' IN ('merged','published') AND coalesce(p_data->>'mergeSha','')!~'^[a-f0-9]{40}$' THEN RAISE EXCEPTION 'WORKER_BINDING'; END IF;
  IF p.state=p_data->>'state' THEN RETURN to_jsonb(p); END IF;
  UPDATE tradehq_automation.code_publications SET state=p_data->>'state',merge_sha=p_data->>'mergeSha',result_code=p_data->>'code',lease_until=NULL,updated_at=clock_timestamp() WHERE request_id=p.request_id RETURNING * INTO p;
  INSERT INTO tradehq_automation.code_events(request_id,event,run_id) VALUES(p.request_id,CASE p.state WHEN 'published' THEN 'PUBLICATION_PRODUCTION_CONFIRMED' WHEN 'merged' THEN 'PUBLICATION_MERGE_CONFIRMED' ELSE 'PUBLICATION_BLOCKED' END,p.run_id);
  RETURN to_jsonb(p);
 ELSIF p_action='publication-release-claim' THEN
  IF coalesce((p_data->>'runId')::bigint,0)<=0 THEN RAISE EXCEPTION 'WORKER_BINDING'; END IF;
  SELECT * INTO p FROM tradehq_automation.code_publications WHERE state='merged' AND merge_sha=p_data->>'baseSha' AND release_run_id IS NULL ORDER BY approved_at LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  UPDATE tradehq_automation.code_publications SET release_run_id=(p_data->>'runId')::bigint,updated_at=clock_timestamp() WHERE request_id=p.request_id RETURNING * INTO p;
  INSERT INTO tradehq_automation.code_events(request_id,event,run_id) VALUES(p.request_id,'PUBLICATION_RELEASE_CHECKS_REQUESTED',p.release_run_id);
  RETURN to_jsonb(p);
 END IF;
 result:=public.tradehq_admin_code_queue_v4(p_action,p_owner,p_data);
 IF p_action='list' THEN result:=result||jsonb_build_object('publications',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM (SELECT * FROM tradehq_automation.code_publications ORDER BY approved_at DESC LIMIT 100)x),'[]'::jsonb)); END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.tradehq_admin_code_queue(text,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.tradehq_admin_code_queue(text,uuid,jsonb) TO service_role;
COMMIT;

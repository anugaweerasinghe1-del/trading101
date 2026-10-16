BEGIN;
CREATE TABLE tradehq_automation.code_reviews (
 request_id uuid PRIMARY KEY REFERENCES tradehq_automation.code_requests(id),
 view_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
 head_sha text NOT NULL CHECK(head_sha ~ '^[a-f0-9]{40}$'),
 patch_digest text NOT NULL CHECK(patch_digest ~ '^[a-f0-9]{64}$'),
 viewed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 decision text CHECK(decision='rejected'),decided_at timestamptz,
 close_state text CHECK(close_state IN ('pending','claimed','closed','blocked')),
 close_run_id bigint UNIQUE,lease_until timestamptz,close_code text,
 CHECK((decision IS NULL)=(close_state IS NULL)),
 CHECK(close_state IS DISTINCT FROM 'claimed' OR lease_until IS NOT NULL)
);
ALTER TABLE tradehq_automation.code_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON tradehq_automation.code_reviews FROM PUBLIC,anon,authenticated,service_role;
ALTER FUNCTION public.tradehq_admin_code_queue(text,uuid,jsonb) RENAME TO tradehq_admin_code_queue_v3;
REVOKE ALL ON FUNCTION public.tradehq_admin_code_queue_v3(text,uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.tradehq_admin_code_queue(p_action text,p_owner uuid DEFAULT NULL,p_data jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb; r tradehq_automation.code_requests; review tradehq_automation.code_reviews;
BEGIN
 PERFORM pg_advisory_xact_lock(1130435580,16301);
 IF p_action IN ('review-request','review-view','reject-proposal') THEN
  IF p_owner IS NULL OR p_owner IS DISTINCT FROM public.tradehq_repair_registered_owner() THEN RAISE EXCEPTION 'OWNER_REQUIRED'; END IF;
  SELECT * INTO r FROM tradehq_automation.code_requests WHERE id=(p_data->>'id')::uuid;
  IF NOT FOUND OR r.head_sha IS DISTINCT FROM p_data->>'headSha' OR r.pr_number IS NULL THEN RAISE EXCEPTION 'PROPOSAL_NOT_VERIFIED'; END IF;
  IF p_action='review-request' THEN RETURN to_jsonb(r)-'owner_id'-'request_key'; END IF;
  IF r.status NOT IN ('verified','validation_failed') THEN RAISE EXCEPTION 'REVIEW_NOT_READY'; END IF;
  IF p_action='review-view' THEN
   IF coalesce(p_data->>'patchDigest','')!~'^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'PROPOSAL_NOT_VERIFIED'; END IF;
   INSERT INTO tradehq_automation.code_reviews(request_id,head_sha,patch_digest)
    VALUES(r.id,r.head_sha,p_data->>'patchDigest')
    ON CONFLICT(request_id) DO UPDATE SET view_id=gen_random_uuid(),viewed_at=clock_timestamp(),patch_digest=EXCLUDED.patch_digest
     WHERE tradehq_automation.code_reviews.decision IS NULL;
   SELECT * INTO review FROM tradehq_automation.code_reviews WHERE request_id=r.id;
   RETURN to_jsonb(review);
  END IF;
  SELECT * INTO review FROM tradehq_automation.code_reviews WHERE request_id=r.id FOR UPDATE;
  IF NOT FOUND OR review.view_id IS DISTINCT FROM (p_data->>'viewId')::uuid OR review.head_sha<>r.head_sha THEN RAISE EXCEPTION 'REVIEW_EXPIRED'; END IF;
  IF review.decision='rejected' THEN RETURN to_jsonb(review); END IF;
  IF review.viewed_at<clock_timestamp()-interval '10 minutes' THEN RAISE EXCEPTION 'REVIEW_EXPIRED'; END IF;
  UPDATE tradehq_automation.code_reviews SET decision='rejected',decided_at=clock_timestamp(),close_state='pending'
   WHERE request_id=r.id RETURNING * INTO review;
  INSERT INTO tradehq_automation.code_events(request_id,event,run_id) VALUES(r.id,'OWNER_PROPOSAL_REJECTED',r.run_id);
  RETURN to_jsonb(review);
 ELSIF p_action='close-claim' THEN
  IF coalesce((p_data->>'runId')::bigint,0)<=0 THEN RAISE EXCEPTION 'WORKER_BINDING'; END IF;
  IF EXISTS(SELECT 1 FROM tradehq_automation.code_reviews WHERE close_run_id=(p_data->>'runId')::bigint) THEN RETURN NULL; END IF;
  SELECT * INTO review FROM tradehq_automation.code_reviews WHERE decision='rejected' AND (close_state='pending'
   OR (close_state='claimed' AND lease_until<clock_timestamp())) ORDER BY decided_at LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  UPDATE tradehq_automation.code_reviews SET close_state='claimed',close_run_id=(p_data->>'runId')::bigint,
   lease_until=clock_timestamp()+interval '25 minutes' WHERE request_id=review.request_id RETURNING * INTO review;
  INSERT INTO tradehq_automation.code_events(request_id,event,run_id) VALUES(review.request_id,'PROPOSAL_CLOSE_CLAIMED',review.close_run_id);
  SELECT * INTO r FROM tradehq_automation.code_requests WHERE id=review.request_id;
  RETURN to_jsonb(review)||jsonb_build_object('pr_number',r.pr_number);
 ELSIF p_action='close-finish' THEN
  SELECT * INTO review FROM tradehq_automation.code_reviews WHERE request_id=(p_data->>'id')::uuid FOR UPDATE;
  IF NOT FOUND OR review.decision IS DISTINCT FROM 'rejected' OR review.close_state<>'claimed' OR review.close_run_id IS DISTINCT FROM (p_data->>'runId')::bigint
   OR review.head_sha IS DISTINCT FROM p_data->>'headSha' OR review.lease_until<=clock_timestamp()
   OR coalesce(p_data->>'closeState','') NOT IN ('closed','blocked') OR coalesce(p_data->>'closeCode','') NOT IN ('GITHUB_CLOSED_CONFIRMED','PROPOSAL_CHANGED','CLOSE_NOT_CONFIRMED') THEN RAISE EXCEPTION 'WORKER_BINDING'; END IF;
  UPDATE tradehq_automation.code_reviews SET close_state=p_data->>'closeState',close_code=p_data->>'closeCode',lease_until=NULL
   WHERE request_id=review.request_id RETURNING * INTO review;
  INSERT INTO tradehq_automation.code_events(request_id,event,run_id) VALUES(review.request_id,review.close_code,review.close_run_id);
  RETURN to_jsonb(review);
 END IF;
 result:=public.tradehq_admin_code_queue_v3(p_action,p_owner,p_data);
 IF p_action='list' THEN
  result:=result||jsonb_build_object('reviews',coalesce((SELECT jsonb_agg(to_jsonb(v)) FROM
   (SELECT * FROM tradehq_automation.code_reviews ORDER BY viewed_at DESC LIMIT 100)v),'[]'::jsonb));
 END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.tradehq_admin_code_queue(text,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.tradehq_admin_code_queue(text,uuid,jsonb) TO service_role;
COMMIT;

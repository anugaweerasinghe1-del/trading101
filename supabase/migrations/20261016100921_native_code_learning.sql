-- Learn only from exact-head, independently observed native CI results.
BEGIN;
CREATE TABLE tradehq_automation.code_validation_memory (
 request_id uuid PRIMARY KEY REFERENCES tradehq_automation.code_requests(id),
 files jsonb NOT NULL CHECK(jsonb_typeof(files)='array' AND jsonb_array_length(files) BETWEEN 1 AND 2),
 conclusion text CHECK(conclusion IN ('success','failure','canceled','skipped','timed_out')),
 observed_at timestamptz
);
CREATE TABLE tradehq_automation.code_learning_decisions (
 request_id uuid PRIMARY KEY REFERENCES tradehq_automation.code_requests(id),
 run_id bigint NOT NULL UNIQUE, base_sha text NOT NULL, at timestamptz NOT NULL DEFAULT clock_timestamp(), context jsonb NOT NULL
);
ALTER TABLE tradehq_automation.code_validation_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradehq_automation.code_learning_decisions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON tradehq_automation.code_validation_memory,tradehq_automation.code_learning_decisions FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION tradehq_automation.code_learning_context() RETURNS jsonb LANGUAGE sql STABLE SET search_path='' AS $$
 WITH outcomes AS (
  SELECT m.*,r.run_id FROM tradehq_automation.code_validation_memory m JOIN tradehq_automation.code_requests r ON r.id=m.request_id
  WHERE m.conclusion IN ('success','failure') AND m.observed_at>now()-interval '30 days'
   AND ((m.conclusion='success' AND r.status='verified') OR (m.conclusion='failure' AND r.status='validation_failed'))
 ), ranked AS (
  SELECT f.path,o.conclusion,row_number() OVER(PARTITION BY f.path ORDER BY o.observed_at DESC,o.run_id DESC) AS n
  FROM outcomes o CROSS JOIN LATERAL jsonb_array_elements_text(o.files) f(path)
 ), stats AS (
  SELECT path,count(*) AS samples,count(*) FILTER(WHERE conclusion='success') AS passes,
   count(*) FILTER(WHERE conclusion='failure') AS failures,
   count(*) FILTER(WHERE n<=3 AND conclusion='failure')=3 AS paused
  FROM ranked GROUP BY path
 ) SELECT jsonb_build_object('version','native-ci-memory-v1','windowDays',30,'outcomes',(SELECT count(*) FROM outcomes),
  'state',CASE WHEN EXISTS(SELECT 1 FROM outcomes) THEN 'LEARNING_FROM_NATIVE_RESULTS' ELSE 'COLLECTING_NATIVE_RESULTS' END,
  'files',coalesce((SELECT jsonb_agg(jsonb_build_object('path',path,'samples',samples,'passes',passes,'failures',failures,
    'smoothedFailureRate',round((failures+1.0)/(samples+2.0),4),'paused',paused) ORDER BY path) FROM stats),'[]'::jsonb),
  'pausedPaths',coalesce((SELECT jsonb_agg(path ORDER BY path) FROM stats WHERE paused),'[]'::jsonb))
$$;
REVOKE ALL ON FUNCTION tradehq_automation.code_learning_context() FROM PUBLIC,anon,authenticated,service_role;

ALTER FUNCTION public.tradehq_admin_code_queue(text,uuid,jsonb) RENAME TO tradehq_admin_code_queue_v1;
REVOKE ALL ON FUNCTION public.tradehq_admin_code_queue_v1(text,uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.tradehq_admin_code_queue(p_action text,p_owner uuid DEFAULT NULL,p_data jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb; learning jsonb; f text;
BEGIN
 -- The original lifecycle lock and all owner, budget and exact-run bindings remain authoritative.
 result:=public.tradehq_admin_code_queue_v1(p_action,p_owner,p_data);
 IF p_action='finish' AND p_data->>'status'='proposed' THEN
  IF jsonb_typeof(p_data->'verifiedFiles') IS DISTINCT FROM 'array' OR jsonb_array_length(p_data->'verifiedFiles') NOT BETWEEN 1 AND 2 THEN RAISE EXCEPTION 'PROPOSAL_NOT_VERIFIED'; END IF;
  IF (SELECT count(DISTINCT value) FROM jsonb_array_elements_text(p_data->'verifiedFiles'))<>jsonb_array_length(p_data->'verifiedFiles') THEN RAISE EXCEPTION 'PROPOSAL_NOT_VERIFIED'; END IF;
  FOR f IN SELECT jsonb_array_elements_text(p_data->'verifiedFiles') LOOP
   IF f!~'^src/(pages|components)/[A-Za-z0-9_/-]+\.tsx$' OR f LIKE '%..%' OR f LIKE '%//%' THEN RAISE EXCEPTION 'PROPOSAL_NOT_VERIFIED'; END IF;
  END LOOP;
  INSERT INTO tradehq_automation.code_validation_memory(request_id,files) VALUES((result->>'id')::uuid,p_data->'verifiedFiles');
 ELSIF p_action='validation' THEN
  IF coalesce(p_data->>'nativeConclusion','') NOT IN ('success','failure','canceled','skipped','timed_out') OR
   (p_data->>'status'='verified') IS DISTINCT FROM (p_data->>'nativeConclusion'='success') THEN RAISE EXCEPTION 'VALIDATION_UNAVAILABLE'; END IF;
  UPDATE tradehq_automation.code_validation_memory SET conclusion=p_data->>'nativeConclusion',observed_at=clock_timestamp() WHERE request_id=(result->>'id')::uuid;
 ELSIF p_action='claim' AND result IS NOT NULL THEN
  learning:=tradehq_automation.code_learning_context();
  INSERT INTO tradehq_automation.code_learning_decisions(request_id,run_id,base_sha,context)
   VALUES((result->>'id')::uuid,(result->>'run_id')::bigint,result->>'base_sha',learning);
  INSERT INTO tradehq_automation.code_events(request_id,event,run_id)
   VALUES((result->>'id')::uuid,'LEARNING_CONTEXT_APPLIED',(result->>'run_id')::bigint);
  result:=result||jsonb_build_object('learning',learning);
 ELSIF p_action='list' THEN
  result:=result||jsonb_build_object('learning',tradehq_automation.code_learning_context(),
   'learningDecisions',coalesce((SELECT jsonb_agg(to_jsonb(d)) FROM
    (SELECT * FROM tradehq_automation.code_learning_decisions ORDER BY at DESC LIMIT 50)d),'[]'::jsonb));
 END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.tradehq_admin_code_queue(text,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.tradehq_admin_code_queue(text,uuid,jsonb) TO service_role;
COMMIT;

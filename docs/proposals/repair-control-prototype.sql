-- OFFLINE PROTOTYPE ONLY. Outside migrations; no workflow applies this file.
-- Existing production roles/data are not modified by this draft.
BEGIN;
DO $$ BEGIN
 IF current_setting('tradehq.offline_control_prototype',true) IS DISTINCT FROM 'explicit-local-test' THEN
  RAISE EXCEPTION 'Offline prototype requires an explicit local test context; do not apply to production';
 END IF;
END $$;

CREATE SCHEMA tradehq_repair_control;
REVOKE ALL ON SCHEMA tradehq_repair_control FROM PUBLIC,anon,authenticated,service_role;

CREATE TABLE tradehq_repair_control.policy (
 id boolean PRIMARY KEY DEFAULT true CHECK(id),
 stopped boolean NOT NULL DEFAULT true,
 generation bigint NOT NULL DEFAULT 0 CHECK(generation>=0)
);
INSERT INTO tradehq_repair_control.policy(id) VALUES(true);

CREATE TABLE tradehq_repair_control.candidates (
 id text PRIMARY KEY CHECK(id ~ '^repair-v1-[a-f0-9]{24}$'),
 fingerprint text NOT NULL UNIQUE CHECK(fingerprint ~ '^[a-f0-9]{64}$'),
 source text NOT NULL CHECK(source IN ('browser','manual')),
 symptom text NOT NULL CHECK(symptom IN ('HEADING_READABILITY','LAYOUT_OVERFLOW')),
 path text NOT NULL DEFAULT '/about' CHECK(path='/about'),
 base_sha text NOT NULL CHECK(base_sha ~ '^[a-f0-9]{40}$'),
 evidence_digest text NOT NULL CHECK(evidence_digest ~ '^[a-f0-9]{64}$'),
 attempts integer NOT NULL DEFAULT 1 CHECK(attempts=1),
 generation bigint NOT NULL,
 status text NOT NULL CHECK(status IN ('claimed','validated','approved','rejected','stopped')),
 claimed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 lease_until timestamptz NOT NULL,
 head_sha text CHECK(head_sha ~ '^[a-f0-9]{40}$'),
 validated_at timestamptz,
 approved_at timestamptz,
 approval_expires timestamptz,
 CHECK(lease_until>claimed_at AND lease_until<=claimed_at+interval '30 minutes'),
 CHECK(status NOT IN ('validated','approved') OR (head_sha IS NOT NULL AND validated_at IS NOT NULL)),
 CHECK(status<>'approved' OR (approved_at IS NOT NULL AND approval_expires IS NOT NULL))
);
-- Constraint protects the invariant independently of procedural checks.
CREATE UNIQUE INDEX one_active_candidate ON tradehq_repair_control.candidates((true))
 WHERE status IN ('claimed','validated','approved');
CREATE INDEX candidate_frequency ON tradehq_repair_control.candidates(claimed_at);

-- Fixed-code daily aggregation bounds rejected-request log growth and stores no raw input.
CREATE TABLE tradehq_repair_control.audit (
 day date NOT NULL, code text NOT NULL CHECK(code IN ('STOPPED','MISSING_STATE','INVALID_SCOPE',
  'INVALID_EVIDENCE','DUPLICATE','ACTIVE_CANDIDATE','RATE_LIMIT','CLAIMED','VALIDATED',
  'VALIDATION_REJECTED','APPROVED','APPROVAL_REJECTED','REVIEW_CHECK_BLOCKED','OWNER_STOP','OWNER_RESUME','LEASE_NOT_EXPIRED','LEASE_EXPIRED')),
 count integer NOT NULL DEFAULT 1 CHECK(count BETWEEN 1 AND 10000),
 truncated boolean NOT NULL DEFAULT false,
 first_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 last_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(day,code)
);
ALTER TABLE tradehq_repair_control.policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradehq_repair_control.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradehq_repair_control.audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA tradehq_repair_control FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION tradehq_repair_control.event(p_code text) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 INSERT INTO tradehq_repair_control.audit(day,code)
 VALUES((clock_timestamp() AT TIME ZONE 'UTC')::date,p_code)
 ON CONFLICT(day,code) DO UPDATE SET
  count=least(tradehq_repair_control.audit.count+1,10000),
  truncated=tradehq_repair_control.audit.truncated OR tradehq_repair_control.audit.count>=10000,
  last_at=clock_timestamp();
 RETURN jsonb_build_object('reason',p_code,'productionRelease',false,'codeWrites',false);
END $$;

CREATE FUNCTION tradehq_repair_control.set_stop(p_stopped boolean) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF p_stopped IS NULL THEN RETURN tradehq_repair_control.event('INVALID_EVIDENCE'); END IF;
 PERFORM 1 FROM tradehq_repair_control.policy WHERE id FOR UPDATE;
 IF NOT FOUND THEN RETURN tradehq_repair_control.event('MISSING_STATE'); END IF;
 UPDATE tradehq_repair_control.policy SET stopped=p_stopped,generation=generation+1 WHERE id;
 -- Stop/resume invalidates every prior claim/approval; no reset erases attempts or quota history.
 UPDATE tradehq_repair_control.candidates SET status='stopped',approval_expires=NULL
 WHERE status IN ('claimed','validated','approved');
 RETURN tradehq_repair_control.event(CASE WHEN p_stopped THEN 'OWNER_STOP' ELSE 'OWNER_RESUME' END);
END $$;

CREATE FUNCTION tradehq_repair_control.claim(p_id text,p_source text,p_symptom text,
 p_base text,p_digest text,p_observed timestamptz,p_risk text) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE policy tradehq_repair_control.policy; v_fingerprint text; stamp timestamptz;
BEGIN
 SELECT * INTO policy FROM tradehq_repair_control.policy WHERE id FOR UPDATE;
 stamp:=clock_timestamp();
 IF NOT FOUND THEN RETURN tradehq_repair_control.event('MISSING_STATE'); END IF;
 IF policy.stopped THEN RETURN tradehq_repair_control.event('STOPPED'); END IF;
 IF p_risk IS DISTINCT FROM 'LOW' OR p_source IS NULL OR p_source NOT IN ('browser','manual')
  OR p_symptom IS NULL OR p_symptom NOT IN ('HEADING_READABILITY','LAYOUT_OVERFLOW') THEN
  RETURN tradehq_repair_control.event('INVALID_SCOPE');
 END IF;
 IF p_id IS NULL OR p_id !~ '^repair-v1-[a-f0-9]{24}$'
  OR p_base IS NULL OR p_base !~ '^[a-f0-9]{40}$' OR p_digest IS NULL OR p_digest !~ '^[a-f0-9]{64}$'
  OR p_observed IS NULL OR NOT isfinite(p_observed) OR p_observed<stamp-interval '30 hours'
  OR p_observed>stamp+interval '1 minute' THEN RETURN tradehq_repair_control.event('INVALID_EVIDENCE'); END IF;
 v_fingerprint:=encode(sha256(convert_to(p_source||':'||p_symptom||':/about','UTF8')),'hex');
 IF EXISTS(SELECT 1 FROM tradehq_repair_control.candidates c WHERE c.id=p_id OR c.fingerprint=v_fingerprint) THEN
  RETURN tradehq_repair_control.event('DUPLICATE');
 END IF;
 IF EXISTS(SELECT 1 FROM tradehq_repair_control.candidates WHERE status IN ('claimed','validated','approved')) THEN
  RETURN tradehq_repair_control.event('ACTIVE_CANDIDATE');
 END IF;
 IF EXISTS(SELECT 1 FROM tradehq_repair_control.candidates WHERE claimed_at>stamp-interval '24 hours') THEN
  RETURN tradehq_repair_control.event('RATE_LIMIT');
 END IF;
 INSERT INTO tradehq_repair_control.candidates(id,fingerprint,source,symptom,base_sha,evidence_digest,generation,status,claimed_at,lease_until)
 VALUES(p_id,v_fingerprint,p_source,p_symptom,p_base,p_digest,policy.generation,'claimed',stamp,stamp+interval '30 minutes');
 RETURN tradehq_repair_control.event('CLAIMED')||jsonb_build_object('claimed',true);
END $$;

-- These transitions record owner-operated reviews, not external CI truth or release authority.
CREATE FUNCTION tradehq_repair_control.review(p_action text,p_id text,p_head text,p_base text,
 p_digest text,p_expires timestamptz DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE policy tradehq_repair_control.policy; candidate tradehq_repair_control.candidates;
 stamp timestamptz; ok boolean;
BEGIN
 SELECT * INTO policy FROM tradehq_repair_control.policy WHERE id FOR UPDATE;
 IF NOT FOUND THEN RETURN tradehq_repair_control.event('MISSING_STATE'); END IF;
 IF policy.stopped THEN RETURN tradehq_repair_control.event('STOPPED'); END IF;
 SELECT * INTO candidate FROM tradehq_repair_control.candidates WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RETURN tradehq_repair_control.event('INVALID_EVIDENCE'); END IF;
 stamp:=clock_timestamp();
 ok:=candidate.generation=policy.generation AND candidate.lease_until>stamp
  AND p_base=candidate.base_sha AND p_digest=candidate.evidence_digest
  AND p_head ~ '^[a-f0-9]{40}$' AND p_head<>p_base;
 IF ok IS DISTINCT FROM true THEN RETURN tradehq_repair_control.event('INVALID_EVIDENCE'); END IF;
 IF p_action='reject' THEN
  UPDATE tradehq_repair_control.candidates SET status='rejected',approval_expires=NULL WHERE id=p_id;
  RETURN tradehq_repair_control.event('VALIDATION_REJECTED');
 ELSIF p_action='validate' AND candidate.status='claimed' THEN
  UPDATE tradehq_repair_control.candidates SET status='validated',head_sha=p_head,validated_at=stamp WHERE id=p_id;
  RETURN tradehq_repair_control.event('VALIDATED');
 ELSIF p_action='approve' AND candidate.status='validated' AND candidate.head_sha=p_head
  AND p_expires IS NOT NULL AND isfinite(p_expires) AND p_expires>stamp
  AND p_expires<=least(stamp+interval '30 minutes',candidate.lease_until) THEN
  UPDATE tradehq_repair_control.candidates SET status='approved',approved_at=stamp,approval_expires=p_expires WHERE id=p_id;
  RETURN tradehq_repair_control.event('APPROVED');
 ELSIF p_action='check' AND candidate.status='approved' AND candidate.head_sha=p_head
  AND candidate.approval_expires>stamp THEN
  RETURN jsonb_build_object('reviewValid',true,'productionRelease',false,'codeWrites',false);
 END IF;
 RETURN tradehq_repair_control.event(CASE WHEN p_action='check' THEN 'REVIEW_CHECK_BLOCKED' ELSE 'APPROVAL_REJECTED' END);
END $$;

-- Owner-operated, fail-closed recovery of an interrupted/expired claim.
-- No fresh claim, validation, approval or release is issued by this transition.
-- A stale caller cannot clear a newer generation, candidate or evidence binding.
CREATE FUNCTION tradehq_repair_control.recover_expired(
 p_id text,p_base text,p_digest text,p_generation bigint) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $recovery$
DECLARE policy tradehq_repair_control.policy; candidate tradehq_repair_control.candidates; stamp timestamptz;
BEGIN
 SELECT * INTO policy FROM tradehq_repair_control.policy WHERE id FOR UPDATE;
 IF NOT FOUND THEN RETURN tradehq_repair_control.event('MISSING_STATE'); END IF;
 IF policy.stopped THEN RETURN tradehq_repair_control.event('STOPPED'); END IF;
 SELECT * INTO candidate FROM tradehq_repair_control.candidates WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RETURN tradehq_repair_control.event('INVALID_EVIDENCE'); END IF;
 IF p_generation IS DISTINCT FROM policy.generation
  OR candidate.generation IS DISTINCT FROM policy.generation
  OR p_base IS DISTINCT FROM candidate.base_sha
  OR p_digest IS DISTINCT FROM candidate.evidence_digest THEN
  RETURN tradehq_repair_control.event('INVALID_EVIDENCE');
 END IF;
 stamp:=clock_timestamp();
 IF candidate.status NOT IN ('claimed','validated','approved') OR candidate.lease_until>stamp THEN
  RETURN tradehq_repair_control.event('LEASE_NOT_EXPIRED');
 END IF;
 UPDATE tradehq_repair_control.candidates SET status='stopped',approval_expires=NULL WHERE id=p_id;
 RETURN tradehq_repair_control.event('LEASE_EXPIRED')||jsonb_build_object('recovered',true);
END $recovery$;

-- No grants, public RPCs, SECURITY DEFINER, new role or existing permission expansion.
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA tradehq_repair_control FROM PUBLIC,anon,authenticated,service_role;
COMMIT;

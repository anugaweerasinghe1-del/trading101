-- Disposable extension only. No production migration, role or grant.
BEGIN;
DO $$ BEGIN
 IF current_setting('tradehq.offline_control_prototype',true) IS DISTINCT FROM 'explicit-local-test' THEN
  RAISE EXCEPTION 'Offline workload receipts require an explicit local test context';
 END IF;
END $$;
CREATE TABLE tradehq_repair_control.workload_receipts (
 token_digest text PRIMARY KEY CHECK(token_digest ~ '^[a-f0-9]{64}$'),
 candidate_id text NOT NULL UNIQUE REFERENCES tradehq_repair_control.candidates(id),
 base_sha text NOT NULL CHECK(base_sha ~ '^[a-f0-9]{40}$'),
 evidence_digest text NOT NULL CHECK(evidence_digest ~ '^[a-f0-9]{64}$'),
 run_id bigint NOT NULL CHECK(run_id>0),
 run_attempt integer NOT NULL CHECK(run_attempt BETWEEN 1 AND 100),
 check_id bigint NOT NULL CHECK(check_id>0),
 generation bigint NOT NULL CHECK(generation>=0),
 expires_at timestamptz NOT NULL CHECK(isfinite(expires_at)),
 consumed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CHECK(expires_at>consumed_at AND expires_at<=consumed_at+interval '60 seconds')
);
ALTER TABLE tradehq_repair_control.workload_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON tradehq_repair_control.workload_receipts FROM PUBLIC,anon,authenticated,service_role;
COMMIT;

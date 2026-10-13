-- Offline extension only. No production installation, role or grant is added.
BEGIN;
DO $$ BEGIN
 IF current_setting('tradehq.offline_control_prototype',true) IS DISTINCT FROM 'explicit-local-test' THEN
  RAISE EXCEPTION 'Offline receipt extension requires an explicit local test context';
 END IF;
END $$;
CREATE TABLE tradehq_repair_control.approval_receipts (
 approval_id text PRIMARY KEY CHECK(approval_id ~ '^approval-v1-[a-f0-9]{24}$'),
 owner_id uuid NOT NULL,
 candidate_id text NOT NULL UNIQUE REFERENCES tradehq_repair_control.candidates(id),
 receipt_digest text NOT NULL UNIQUE CHECK(receipt_digest ~ '^[a-f0-9]{64}$'),
 base_sha text NOT NULL CHECK(base_sha ~ '^[a-f0-9]{40}$'),
 head_sha text NOT NULL CHECK(head_sha ~ '^[a-f0-9]{40}$' AND head_sha<>base_sha),
 evidence_digest text NOT NULL CHECK(evidence_digest ~ '^[a-f0-9]{64}$'),
 generation bigint NOT NULL CHECK(generation>=0),
 expires_at timestamptz NOT NULL CHECK(isfinite(expires_at)),
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CHECK(expires_at>recorded_at AND expires_at<=recorded_at+interval '30 minutes')
);
ALTER TABLE tradehq_repair_control.approval_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON tradehq_repair_control.approval_receipts FROM PUBLIC,anon,authenticated,service_role;
COMMIT;

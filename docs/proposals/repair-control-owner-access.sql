-- REVIEW PROPOSAL ONLY. Install after the private core/receipts in one approved transaction.
-- Stop-only access: no app access to claims, approvals, resume, history or table rows.
DO $$ BEGIN
 IF current_setting('tradehq.repair_control_install',true) IS DISTINCT FROM 'owner-approved-stopped-v1' THEN
  RAISE EXCEPTION 'Explicit approved stopped-control installation context required';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=current_setting('tradehq.repair_owner_id')::uuid
  AND email_confirmed_at IS NOT NULL AND is_anonymous IS NOT TRUE) THEN
  RAISE EXCEPTION 'A confirmed non-anonymous production owner account is required';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM tradehq_repair_control.policy WHERE id AND stopped AND generation=0)
  OR EXISTS(SELECT 1 FROM tradehq_repair_control.candidates) THEN
  RAISE EXCEPTION 'Only a fresh stopped control plane may be registered';
 END IF;
END $$;
CREATE TABLE tradehq_repair_control.registered_owner (
 id boolean PRIMARY KEY DEFAULT true CHECK(id),
 owner_id uuid NOT NULL UNIQUE REFERENCES auth.users(id),
 registered_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
INSERT INTO tradehq_repair_control.registered_owner(id,owner_id)
 VALUES(true,current_setting('tradehq.repair_owner_id')::uuid);
ALTER TABLE tradehq_repair_control.registered_owner ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON tradehq_repair_control.registered_owner FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.tradehq_repair_owner_status(p_owner uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_state jsonb;
BEGIN
 IF p_owner IS NULL OR NOT EXISTS(SELECT 1 FROM tradehq_repair_control.registered_owner r
  JOIN auth.users u ON u.id=r.owner_id WHERE r.id AND r.owner_id=p_owner
  AND u.email_confirmed_at IS NOT NULL AND u.is_anonymous IS NOT TRUE) THEN
  RAISE EXCEPTION 'Registered owner required';
 END IF;
 -- One MVCC snapshot supplies policy and candidate count. Return no incident/user details.
 SELECT jsonb_build_object('stopped',p.stopped,'generation',p.generation,
  'activeCandidates',(SELECT count(*) FROM tradehq_repair_control.candidates
   WHERE status IN ('claimed','validated','approved'))) INTO v_state
 FROM tradehq_repair_control.policy p WHERE p.id;
 IF v_state IS NULL THEN RAISE EXCEPTION 'Missing policy'; END IF;
 RETURN v_state;
END $$;
CREATE FUNCTION public.tradehq_repair_owner_stop(p_owner uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_stopped boolean;
BEGIN
 PERFORM public.tradehq_repair_owner_status(p_owner);
 SELECT stopped INTO v_stopped FROM tradehq_repair_control.policy WHERE id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Missing policy'; END IF;
 -- Repeated/uncertain stop requests do not churn generations or reset attempt history.
 IF v_stopped IS NOT TRUE THEN PERFORM tradehq_repair_control.set_stop(true); END IF;
 RETURN public.tradehq_repair_owner_status(p_owner);
END $$;
REVOKE ALL ON FUNCTION public.tradehq_repair_owner_status(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.tradehq_repair_owner_stop(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.tradehq_repair_owner_status(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.tradehq_repair_owner_stop(uuid) TO service_role;

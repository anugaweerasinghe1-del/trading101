-- Signed, read-only personal practice exports. Never imports client balances
-- into ranked accounts. Signature key lives only in a non-exposed private table.
CREATE TABLE IF NOT EXISTS tradehq_private.practice_export_keys (
  key_id text PRIMARY KEY,
  signing_key bytea NOT NULL CHECK (octet_length(signing_key) = 32),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE tradehq_private.practice_export_keys ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON tradehq_private.practice_export_keys FROM PUBLIC, anon, authenticated;
INSERT INTO tradehq_private.practice_export_keys(key_id,signing_key)
VALUES('v1',extensions.gen_random_bytes(32))
ON CONFLICT(key_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.export_my_verified_practice_history()
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path TO '' AS $$
DECLARE
  uid uuid := auth.uid();
  snapshot jsonb;
  document jsonb;
  secret bytea;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT tradehq_private.portfolio_snapshot(uid) INTO snapshot;
  IF snapshot IS NULL THEN RAISE EXCEPTION 'No account practice portfolio exists yet'; END IF;
  SELECT signing_key INTO secret FROM tradehq_private.practice_export_keys WHERE key_id='v1';
  IF secret IS NULL THEN RAISE EXCEPTION 'Signing service unavailable'; END IF;
  document:=jsonb_build_object(
    'format','tradehq-server-practice-history',
    'version',1,
    'user_id',uid::text,
    'issued_at',clock_timestamp(),
    'nonce',encode(extensions.gen_random_bytes(16),'hex'),
    'snapshot',snapshot
  );
  IF pg_column_size(document)>2000000 THEN RAISE EXCEPTION 'Account practice history exceeds export limit'; END IF;
  RETURN jsonb_build_object(
    'payload',document,'key_id','v1',
    'signature',encode(extensions.hmac(convert_to(document::text,'UTF8'),secret,'sha256'),'hex')
  );
END;
$$;
REVOKE ALL ON FUNCTION public.export_my_verified_practice_history() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.export_my_verified_practice_history() TO authenticated;

CREATE OR REPLACE FUNCTION public.verify_my_practice_history_export(p_document jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO '' AS $$
DECLARE
  uid uuid := auth.uid();
  payload jsonb;
  sig text;
  secret bytea;
  calculated text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_document IS NULL OR pg_column_size(p_document)>2100000
     OR jsonb_typeof(p_document)<>'object' THEN
    RETURN jsonb_build_object('verified',false,'reason','Invalid document');
  END IF;
  payload:=p_document->'payload';
  sig:=p_document->>'signature';
  IF payload IS NULL OR jsonb_typeof(payload)<>'object'
     OR payload->>'format'<>'tradehq-server-practice-history'
     OR payload->>'version'<>'1'
     OR payload->>'user_id'<>uid::text
     OR p_document->>'key_id'<>'v1'
     OR sig !~ '^[0-9a-f]{64}$' THEN
    RETURN jsonb_build_object('verified',false,'reason','Wrong account or format');
  END IF;
  SELECT signing_key INTO secret FROM tradehq_private.practice_export_keys WHERE key_id='v1';
  IF secret IS NULL THEN RETURN jsonb_build_object('verified',false,'reason','Verification unavailable'); END IF;
  calculated:=encode(extensions.hmac(convert_to(payload::text,'UTF8'),secret,'sha256'),'hex');
  RETURN jsonb_build_object(
    'verified',sig=calculated,
    'reason',CASE WHEN sig=calculated THEN 'Issued by TradeHQ for this account; historical snapshot only'
      ELSE 'File content does not match its original server-issued signature' END
  );
END;
$$;
REVOKE ALL ON FUNCTION public.verify_my_practice_history_export(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_my_practice_history_export(jsonb) TO authenticated;
COMMENT ON FUNCTION public.export_my_verified_practice_history() IS
 'Export server-recorded current-cycle practice history with a private HMAC signature. No restoration or rank mutation.';

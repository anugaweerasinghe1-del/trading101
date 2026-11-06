-- Synthetic, transaction-rolled-back backend fixture. Never run against production.
-- Proves the public SECURITY DEFINER trade-history RPC stays behind two independent
-- consents (public profile + public trades) and never exposes raw table access.
BEGIN;

DO $privacy_contract$
DECLARE body text;
BEGIN
  IF to_regprocedure('public.get_public_practice_trades(text,integer)') IS NULL THEN
    RAISE EXCEPTION 'Public practice trade RPC was not installed in the backend fixture';
  END IF;
  IF NOT has_function_privilege('anon', 'public.get_public_practice_trades(text,integer)', 'EXECUTE')
    OR NOT has_function_privilege('authenticated', 'public.get_public_practice_trades(text,integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'The consent-checked public trade RPC is not callable by visitors';
  END IF;
  IF has_table_privilege('anon', 'public.practice_trades', 'SELECT') THEN
    RAISE EXCEPTION 'Anonymous browser gained unrestricted raw trade table privilege';
  END IF;
  SELECT pg_get_functiondef('public.get_public_practice_trades(text,integer)'::regprocedure) INTO body;
  IF position('pf.is_public IS TRUE' in body) = 0
    OR position('pf.show_public_trades IS TRUE' in body) = 0
    OR position('t.cycle_id = pp.cycle_id' in body) = 0 THEN
    RAISE EXCEPTION 'Public trade disclosure consent or current-cycle guard was changed';
  END IF;
END;
$privacy_contract$;

INSERT INTO auth.users(id,email,raw_user_meta_data)
VALUES ('00000000-0000-4000-8000-000000000951','private-consent-fixture@example.invalid',
  '{"username":"consent_fixture"}');
UPDATE public.profiles
  SET username='consent_fixture', is_public=true, show_public_trades=false
  WHERE id='00000000-0000-4000-8000-000000000951';

SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000951',true);
SET LOCAL ROLE authenticated;
SELECT public.initialize_practice_portfolio();
DO $trade_setup$
BEGIN
  FOR i IN 1..24 LOOP
    PERFORM public.record_practice_trade('aapl','buy',1,gen_random_uuid());
  END LOOP;
END;
$trade_setup$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','',true);

SET LOCAL ROLE anon;
DO $private_default$
BEGIN
  IF EXISTS(SELECT 1 FROM public.get_public_practice_trades('consent_fixture',20)) THEN
    RAISE EXCEPTION 'Default private trade consent exposed history';
  END IF;
END;
$private_default$;
RESET ROLE;

UPDATE public.profiles SET show_public_trades=true
  WHERE id='00000000-0000-4000-8000-000000000951';
SET LOCAL ROLE anon;
DO $public_opt_in$
BEGIN
  IF (SELECT count(*) FROM public.get_public_practice_trades('consent_fixture',999)) <> 20 THEN
    RAISE EXCEPTION 'Explicit consent does not reveal a bounded maximum of 20 current trades';
  END IF;
  IF (SELECT count(*) FROM public.get_public_practice_trades('consent_fixture',-999)) <> 1 THEN
    RAISE EXCEPTION 'Negative requested limit was not clamped to one';
  END IF;
  IF EXISTS(SELECT 1 FROM public.get_public_practice_trades('no_such_profile_fixture',20)) THEN
    RAISE EXCEPTION 'Unknown profile unexpectedly revealed trade history';
  END IF;
END;
$public_opt_in$;
RESET ROLE;

UPDATE public.profiles SET is_public=false
  WHERE id='00000000-0000-4000-8000-000000000951';
SET LOCAL ROLE anon;
DO $hidden_parent$
BEGIN
  IF EXISTS(SELECT 1 FROM public.get_public_practice_trades('consent_fixture',20)) THEN
    RAISE EXCEPTION 'Private parent profile exposed opted-in trade history';
  END IF;
END;
$hidden_parent$;
RESET ROLE;

UPDATE public.profiles SET is_public=true, show_public_trades=false
  WHERE id='00000000-0000-4000-8000-000000000951';
SET LOCAL ROLE anon;
DO $revoked_consent$
BEGIN
  IF EXISTS(SELECT 1 FROM public.get_public_practice_trades('consent_fixture',20)) THEN
    RAISE EXCEPTION 'Revoked trade-sharing consent did not hide history';
  END IF;
END;
$revoked_consent$;
RESET ROLE;

SELECT 'PASS current-cycle trade disclosure: default private, explicit opt-in, bounded rows, parent privacy and revocation' AS verification;
ROLLBACK;

-- Disposable PGlite fixture; this file never changes live users.
BEGIN;
INSERT INTO auth.users(id,email,raw_user_meta_data,confirmed_at) VALUES
('00000000-0000-4000-8000-000000000711','legacy-confirmed@example.invalid','{"username":"legacy_public_fixture"}',now()),
('00000000-0000-4000-8000-000000000712','legacy-pending@example.invalid','{"username":"pending_public_fixture"}',null),
('00000000-0000-4000-8000-000000000713','new-private@example.invalid','{"username":"consent_private_fixture"}',now());
-- Simulate the old default-public cohort without claiming an informed choice.
UPDATE public.profiles SET is_public=true
WHERE id IN ('00000000-0000-4000-8000-000000000711','00000000-0000-4000-8000-000000000712');
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM public.profiles WHERE id IN
   ('00000000-0000-4000-8000-000000000711','00000000-0000-4000-8000-000000000712') AND public_visibility_confirmed)
 THEN RAISE EXCEPTION 'Legacy public flags inherited opt-in'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','',true);
SET LOCAL ROLE anon;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM public.profiles WHERE username IN ('legacy_public_fixture','pending_public_fixture'))
 THEN RAISE EXCEPTION 'Direct anon profile read exposed legacy default-public row'; END IF;
 IF EXISTS (SELECT 1 FROM public.get_public_practice_members(500) WHERE username IN ('legacy_public_fixture','pending_public_fixture'))
 THEN RAISE EXCEPTION 'Member directory exposed legacy default-public row'; END IF;
END $$;
RESET ROLE;
-- Only an actual authenticated account-owner update is the new opt-in.
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000711',true);
SET LOCAL ROLE authenticated;
UPDATE public.profiles SET is_public=true, public_visibility_confirmed=true WHERE id=auth.uid();
DO $$ DECLARE changed integer; BEGIN
 UPDATE public.profiles SET public_visibility_confirmed=true WHERE id='00000000-0000-4000-8000-000000000712';
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed<>0 THEN RAISE EXCEPTION 'One user opted in another'; END IF;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','',true);
SET LOCAL ROLE anon;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE username='legacy_public_fixture')
 THEN RAISE EXCEPTION 'Confirmed owner opt-in not visible'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.get_public_practice_members(500) WHERE username='legacy_public_fixture' AND practice_rank IS NULL)
 THEN RAISE EXCEPTION 'Explicit opt-in did not restore unranked member'; END IF;
 IF EXISTS (SELECT 1 FROM public.profiles WHERE username='pending_public_fixture')
 THEN RAISE EXCEPTION 'Unconfirmed account appeared publicly'; END IF;
END $$;
RESET ROLE;
-- Email confirmation remains mandatory even if an unconfirmed owner toggles the field.
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000712',true);
SET LOCAL ROLE authenticated;
UPDATE public.profiles SET public_visibility_confirmed=true WHERE id=auth.uid();
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','',true);
SET LOCAL ROLE anon;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM public.profiles WHERE username='pending_public_fixture')
 THEN RAISE EXCEPTION 'Unconfirmed email bypassed public visibility'; END IF;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000711',true);
SET LOCAL ROLE authenticated;
UPDATE public.profiles SET is_public=false, public_visibility_confirmed=false WHERE id=auth.uid();
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','',true);
SET LOCAL ROLE anon;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM public.profiles WHERE username='legacy_public_fixture')
 OR EXISTS (SELECT 1 FROM public.get_public_practice_members(500) WHERE username='legacy_public_fixture')
 THEN RAISE EXCEPTION 'Revoked public visibility remained accessible'; END IF;
END $$;
RESET ROLE;
SELECT 'PASS: legacy/public opt-in, confirmed email, owner isolation, directory parity and revocation' AS verification;
ROLLBACK;

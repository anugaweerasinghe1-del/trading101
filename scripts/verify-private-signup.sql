-- Disposable PostgreSQL only. All fixture rows and visibility changes roll back.
BEGIN;
INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
('00000000-0000-4000-8000-000000000611','private-default@example.invalid','{"username":"private_default_fixture"}'),
('00000000-0000-4000-8000-000000000612','private-forged@example.invalid','{"username":"private_forged_fixture","is_public":true}'),
('00000000-0000-4000-8000-000000000613','private-explicit@example.invalid','{"username":"private_explicit_fixture","is_public":false}'),
('00000000-0000-4000-8000-000000000614','private-malformed@example.invalid','{"username":"private_malformed_fixture","is_public":"not-a-boolean"}');
INSERT INTO public.reviews(id,content,ip_hash) VALUES
('00000000-0000-4000-8000-000000000615','Unapproved isolated review','isolated-private-default');
DO $$ BEGIN
 IF (SELECT count(*) FROM public.profiles WHERE id IN
  ('00000000-0000-4000-8000-000000000611','00000000-0000-4000-8000-000000000612','00000000-0000-4000-8000-000000000613','00000000-0000-4000-8000-000000000614') AND NOT is_public)<>4 THEN
  RAISE EXCEPTION 'New profiles must stay private regardless of signup metadata';
 END IF;
 IF EXISTS(SELECT 1 FROM public.reviews WHERE id='00000000-0000-4000-8000-000000000615' AND is_visible) THEN RAISE EXCEPTION 'Review bypassed moderation default'; END IF;
 -- Applying the privacy migration must preserve prior user visibility choices.
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id='00000000-0000-4000-8000-000000000471' AND is_public)
 OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id='00000000-0000-4000-8000-000000000472' AND NOT is_public) THEN RAISE EXCEPTION 'Existing profile visibility choices changed'; END IF;
END; $$;
SET LOCAL ROLE anon;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.profiles WHERE username LIKE 'private_%_fixture') THEN RAISE EXCEPTION 'Anonymous profile read leaked private signup'; END IF;
 IF EXISTS(SELECT 1 FROM public.get_public_practice_members(500) WHERE username LIKE 'private_%_fixture') THEN RAISE EXCEPTION 'Directory leaked private signup'; END IF;
 IF EXISTS(SELECT 1 FROM public.reviews WHERE id='00000000-0000-4000-8000-000000000615') THEN RAISE EXCEPTION 'Anonymous review read bypassed moderation'; END IF;
END; $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000611',true);
SET LOCAL ROLE authenticated;
UPDATE public.profiles SET is_public=true WHERE id=auth.uid();
DO $$ DECLARE changed integer; BEGIN
 UPDATE public.profiles SET is_public=true WHERE id='00000000-0000-4000-8000-000000000612';
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed<>0 THEN RAISE EXCEPTION 'Member changed another profile visibility'; END IF;
END; $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.get_public_practice_members(500) WHERE user_id='00000000-0000-4000-8000-000000000611' AND trades=0 AND practice_rank IS NULL AND portfolio_value IS NULL) THEN RAISE EXCEPTION 'Explicit owner opt-in failed or manufactured a trading rank'; END IF;
 IF EXISTS(SELECT 1 FROM public.get_public_practice_members(500) WHERE user_id='00000000-0000-4000-8000-000000000612') THEN RAISE EXCEPTION 'Forged public signup leaked after another member opt-in'; END IF;
END; $$;
RESET ROLE;
SET LOCAL ROLE authenticated;
UPDATE public.profiles SET is_public=false WHERE id=auth.uid();
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.get_public_practice_members(500) WHERE user_id='00000000-0000-4000-8000-000000000611') THEN RAISE EXCEPTION 'Revoked profile remains public'; END IF;
END; $$;
RESET ROLE;
UPDATE public.reviews SET is_visible=true WHERE id='00000000-0000-4000-8000-000000000615';
SET LOCAL ROLE anon;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.reviews WHERE id='00000000-0000-4000-8000-000000000615') THEN RAISE EXCEPTION 'Explicit fixture review approval did not become visible'; END IF;
END; $$;
RESET ROLE;
SELECT 'Private signup passed: metadata ignored, private directory, owner-only opt-in/revocation, preserved choices and review moderation defaults' AS verification;
ROLLBACK;

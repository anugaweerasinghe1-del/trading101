-- Phase 5: historical default-public profiles must not be treated as informed opt-ins.
-- Keep the previous is_public preference and all user/portfolio data intact.
-- Effective visibility requires a fresh authenticated opt-in AND confirmed email.
-- This deliberately hides older default-public entries until their owners opt in.
BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS public_visibility_confirmed boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.profiles.public_visibility_confirmed IS
  'Affirmative authenticated public-profile sharing decision after the historical default-public period; independent from the legacy is_public flag.';

-- The helper executes as the migration owner, not as a browser role. RLS callers
-- can use it without direct access to auth.users or service credentials.
CREATE OR REPLACE FUNCTION tradehq_private.profile_is_public(p_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $visibility$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE p.id = p_user_id
      AND p.is_public IS TRUE
      AND p.public_visibility_confirmed IS TRUE
      AND u.confirmed_at IS NOT NULL
  );
$visibility$;
REVOKE ALL ON FUNCTION tradehq_private.profile_is_public(uuid) FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA tradehq_private TO anon, authenticated;
GRANT EXECUTE ON FUNCTION tradehq_private.profile_is_public(uuid) TO anon, authenticated, service_role;

-- Direct profiles SELECT must use the same visibility rule as every public RPC.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT TO PUBLIC
USING (
  id = (SELECT auth.uid()) OR tradehq_private.profile_is_public(id)
);

-- Refuse to silently preserve a future changed function signature or predicate.
-- All public projections and duel-related displays must share the one rule.
DO $rewrite_public_profile$
DECLARE
  item record;
  before_sql text;
  after_sql text;
BEGIN
  FOR item IN
    SELECT * FROM (VALUES
      ('tradehq_private.public_members(integer,text)', 'WHERE f.is_public', 'WHERE tradehq_private.profile_is_public(f.id)'),
      ('tradehq_private.previous_results(integer)', 'WHERE p.is_public AND', 'WHERE tradehq_private.profile_is_public(p.id) AND'),
      ('public.get_public_practice_trades(text,integer)', 'AND pf.is_public IS TRUE', 'AND tradehq_private.profile_is_public(pf.id)'),
      ('public.list_verified_trophy_flairs_v1()', 'and p.is_public is true', 'and tradehq_private.profile_is_public(p.id)'),
      ('tradehq_private.create_duel(text)', 'WHERE id=uid AND is_public', 'WHERE id=uid AND tradehq_private.profile_is_public(id)'),
      ('tradehq_private.join_duel(uuid)', 'WHERE id IN (uid,d.creator_id) AND is_public', 'WHERE id IN (uid,d.creator_id) AND tradehq_private.profile_is_public(id)'),
      ('tradehq_private.duel_score(uuid)', 'username,is_public INTO', 'username,tradehq_private.profile_is_public(id) INTO'),
      ('tradehq_private.public_duels(integer)', 'AND c.is_public', 'AND tradehq_private.profile_is_public(c.id)'),
      ('tradehq_private.public_duels(integer)', 'AND o.is_public', 'AND tradehq_private.profile_is_public(o.id)')
    ) AS changes(function_signature, find_text, replacement)
  LOOP
    -- Some isolated fixtures intentionally omit optional trophy features.
    -- A present function must match the audited privacy predicate or fail closed.
    IF to_regprocedure(item.function_signature) IS NULL THEN
      CONTINUE;
    END IF;
    before_sql := pg_get_functiondef(item.function_signature::regprocedure);
    IF position(item.find_text in before_sql) = 0 THEN
      RAISE EXCEPTION 'Profile privacy review required for function %; expected predicate absent', item.function_signature;
    END IF;
    after_sql := replace(before_sql, item.find_text, item.replacement);
    EXECUTE after_sql;
  END LOOP;
END
$rewrite_public_profile$;
COMMIT;

-- Privacy-by-default for newly registered members and pre-publication review moderation.
-- Preserve all existing profile visibility choices, reviews, likes, and admin decisions.
BEGIN;
ALTER TABLE public.profiles ALTER COLUMN is_public SET DEFAULT false;
DO $privacy_defaults$
DECLARE
  definition text := pg_get_functiondef('public.handle_new_user()'::regprocedure);
  prior text := 'COALESCE((NEW.raw_user_meta_data->>''is_public'')::boolean, true)';
BEGIN
  IF position(prior in definition) > 0 THEN
    -- Ignore untrusted user metadata for a newly created profile.
    EXECUTE replace(definition, prior, 'false');
  ELSIF position('VALUES (NEW.id, candidate, false)' in definition) = 0 THEN
    RAISE EXCEPTION 'Signup trigger changed; inspect it before changing profile defaults';
  END IF;
END;
$privacy_defaults$;
ALTER TABLE public.reviews ALTER COLUMN is_visible SET DEFAULT false;
COMMIT;

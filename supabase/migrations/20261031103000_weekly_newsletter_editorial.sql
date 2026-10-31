-- Weekly editorial newsletter drafts; independent of legacy subscribers.
-- No email sends, contact imports or subscription mutations are activated.
create table if not exists public.newsletter_editions (
  id uuid primary key default gen_random_uuid(),
  week_of date not null unique,
  status text not null default 'generating'
    check (status in ('generating','draft','approved','failed')),
  subject text not null default '',
  preheader text not null default '',
  body_markdown text not null default '',
  source_links jsonb not null default '[]'::jsonb,
  ai_model text,
  generator_error text,
  revision integer not null default 1 check (revision >= 1),
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subject_limit check (char_length(subject) <= 140),
  constraint preheader_limit check (char_length(preheader) <= 240),
  constraint body_limit check (char_length(body_markdown) <= 12000),
  constraint reviewer_limit check (reviewed_by is null or char_length(reviewed_by) <= 80)
);
create index if not exists newsletter_editions_status_week_idx
  on public.newsletter_editions (status,week_of desc);
alter table public.newsletter_editions enable row level security;
revoke all on public.newsletter_editions from anon,authenticated;
grant select,insert,update,delete on public.newsletter_editions to service_role;
comment on table public.newsletter_editions is
  'Private AI-assisted draft and human approval. No sending capability or legacy contacts import. Service-role only.';


-- Reuse the existing free-tier Gemini model/key stored in Supabase Vault by
-- the site's course-generation system; never duplicate or reveal the secret
-- to the frontend, anon users, or GitHub.
CREATE OR REPLACE FUNCTION public.newsletter_ai_credentials()
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
 SELECT jsonb_build_object(
  'freeConfirmed', coalesce((SELECT free_confirmed FROM tradehq_private.course_generation_settings WHERE id=true),false),
  'model', (SELECT model FROM tradehq_private.course_generation_settings WHERE id=true),
  'apiKey', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='tradehq_course_gemini_key')
 );
$$;
REVOKE ALL ON FUNCTION public.newsletter_ai_credentials() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.newsletter_ai_credentials() TO service_role;

-- A random 256-bit scheduler token is created and encrypted in Vault; it is
-- never printed, placed in a migration or copied into GitHub Actions secrets.
DO $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM vault.secrets WHERE name='tradehq_newsletter_scheduler_token')
 THEN
   PERFORM vault.create_secret(encode(gen_random_bytes(32),'hex'),'tradehq_newsletter_scheduler_token');
 END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.newsletter_scheduler_authorized(p_token text)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
 SELECT p_token IS NOT NULL AND length(p_token)=64 AND EXISTS (
  SELECT 1 FROM vault.decrypted_secrets
  WHERE name='tradehq_newsletter_scheduler_token' AND decrypted_secret=p_token
 );
$$;
REVOKE ALL ON FUNCTION public.newsletter_scheduler_authorized(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.newsletter_scheduler_authorized(text) TO service_role;

-- Native Supabase pg_cron + pg_net: draft-only request every Monday at 03:30
-- UTC = 09:00 Sri Lanka. It cannot publish or send email and uses one unique
-- edition/week guard. Production Edge code must be deployed first.
SELECT cron.schedule(
 'tradehq-weekly-newsletter-draft',
 '30 3 * * 1',
 $cron$
 SELECT net.http_post(
  url:='https://cbdktpjgczhthflspqjb.supabase.co/functions/v1/newsletter-editor',
  headers:=jsonb_build_object(
   'Content-Type','application/json',
   'x-newsletter-scheduler',
   (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='tradehq_newsletter_scheduler_token')
  ),
  body:='{"action":"generate-weekly"}'::jsonb,
  timeout_milliseconds:=60000
 ) AS request_id;
 $cron$
);

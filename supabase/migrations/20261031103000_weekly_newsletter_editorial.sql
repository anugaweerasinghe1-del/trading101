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

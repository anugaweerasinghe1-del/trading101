-- Phase 5 Trophy Cabinet v1: service-verified educational evidence and private sharing.
-- An existing public profile is NOT consent to share trophies. Users opt in separately.
begin;

create table public.trophy_activity_v1 (
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('challenge','arena','daily','review','reflection')),
  source_key text not null check (length(source_key) between 1 and 80),
  programme_version text not null check (length(programme_version) between 1 and 100),
  result text not null check (result in ('pass','miss')),
  points smallint not null check (points between 0 and 10),
  possible smallint not null check (possible between 1 and 10 and points <= possible),
  recorded_at timestamptz not null default now(),
  primary key (user_id, source, source_key, programme_version, result)
);

create table public.trophy_awards_v1 (
  user_id uuid not null references auth.users(id) on delete cascade,
  trophy_id text not null check (trophy_id in (
    'first-light','field-notes','market-compass','order-desk','price-detective',
    'risk-aware','position-architect','exit-planner','cost-counter','portfolio-lens',
    'first-practice-trade','pause-button','scenario-explorer','decision-review',
    'second-look','case-solver','case-collector','steady-learner',
    'knowledge-builder','foundations-graduate'
  )),
  issued_at timestamptz not null default now(),
  primary key (user_id, trophy_id)
);

create table public.trophy_share_v1 (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  flair text null,
  pins text[] not null default '{}'::text[],
  updated_at timestamptz not null default now(),
  constraint trophy_share_pins_length check (coalesce(array_length(pins, 1), 0) <= 3),
  constraint trophy_share_disabled_empty check (enabled or (flair is null and cardinality(pins) = 0))
);

create index trophy_activity_v1_user_pass on public.trophy_activity_v1(user_id, source, result);
create index trophy_awards_v1_user on public.trophy_awards_v1(user_id);

alter table public.trophy_activity_v1 enable row level security;
alter table public.trophy_awards_v1 enable row level security;
alter table public.trophy_share_v1 enable row level security;

-- Browser roles cannot read, forge, erase or share awards with the Data API.
revoke all on public.trophy_activity_v1, public.trophy_awards_v1, public.trophy_share_v1
  from public, anon, authenticated, service_role;
grant select, insert on public.trophy_activity_v1 to service_role;
grant select, insert on public.trophy_awards_v1 to service_role;
grant select, insert, update on public.trophy_share_v1 to service_role;
commit;

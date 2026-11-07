-- Server-owned, versioned results. Keep one best score per assessment.
create table public.foundations_assessment_results (
  user_id uuid not null references auth.users(id) on delete cascade,
  programme_version text not null check (programme_version = 'foundations-v1'),
  assessment_id text not null,
  points integer not null check (points between 0 and possible),
  possible integer not null,
  primary key (user_id, programme_version, assessment_id),
  check (
    (assessment_id in ('markets', 'execution', 'quotes', 'risk', 'sizing', 'reflection') and possible = 5)
    or (assessment_id = 'final-case' and possible = 10)
  )
);

create table public.foundations_private_certificates (
  id uuid not null default gen_random_uuid() unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  programme_version text not null check (programme_version = 'foundations-v1'),
  milestone text not null check (milestone in ('first-course', 'core-studies', 'foundations')),
  recipient_name text not null check (
    char_length(recipient_name) between 1 and 100 and recipient_name = btrim(recipient_name)
    and recipient_name !~ '[[:cntrl:]]'
  ),
  template_version text not null check (template_version = 'trade-hq-white-teal-v1'),
  issued_at timestamptz not null default now(),
  evidence jsonb not null check (jsonb_typeof(evidence) = 'array'),
  primary key (user_id, programme_version, milestone)
);

alter table public.foundations_assessment_results enable row level security;
alter table public.foundations_private_certificates enable row level security;
revoke all on public.foundations_assessment_results, public.foundations_private_certificates
  from public, anon, authenticated, service_role;
grant select, insert, update on public.foundations_assessment_results to service_role;
grant select, insert on public.foundations_private_certificates to service_role;

-- Only a trusted grader may submit a result. A lower retry never removes a pass.
create function public.record_foundations_assessment(
  p_user_id uuid, p_programme_version text, p_assessment_id text, p_points integer, p_possible integer
) returns void
language sql
set search_path = ''
as $$
  insert into public.foundations_assessment_results as current_result
    (user_id, programme_version, assessment_id, points, possible)
  values (p_user_id, p_programme_version, p_assessment_id, p_points, p_possible)
  on conflict (user_id, programme_version, assessment_id) do update
    set points = excluded.points
    where excluded.points > current_result.points;
$$;

-- The Edge policy supplies learner-friendly eligibility. Enforce the same rules
-- here from a single evidence snapshot and retain that snapshot with issuance.
create function public.create_or_read_foundations_certificate(
  p_user_id uuid, p_programme_version text, p_milestone text,
  p_recipient_name text, p_template_version text
) returns table (
  id uuid, user_id uuid, programme_version text, milestone text,
  recipient_name text, template_version text, issued_at timestamptz
)
language plpgsql
set search_path = ''
as $$
declare
  record_snapshot public.foundations_private_certificates%rowtype;
  passed_ids text[];
  passed_evidence jsonb;
  courses_completed integer;
begin
  select c.* into record_snapshot from public.foundations_private_certificates c
    where c.user_id = p_user_id and c.programme_version = p_programme_version and c.milestone = p_milestone;

  if not found then
    select coalesce(array_agg(a.assessment_id), '{}'::text[]),
      coalesce(jsonb_agg(jsonb_build_object('assessment_id', a.assessment_id, 'points', a.points, 'possible', a.possible)
        order by a.assessment_id), '[]'::jsonb)
    into passed_ids, passed_evidence
    from public.foundations_assessment_results a
    where a.user_id = p_user_id and a.programme_version = p_programme_version
      and ((a.possible = 5 and a.points >= 4) or (a.possible = 10 and a.points >= 8));

    courses_completed :=
      (array['markets', 'execution'] <@ passed_ids)::integer
      + ('quotes' = any(passed_ids))::integer
      + (array['risk', 'sizing'] <@ passed_ids)::integer
      + ('reflection' = any(passed_ids))::integer;

    if not coalesce(case p_milestone
      when 'first-course' then courses_completed >= 1
      when 'core-studies' then courses_completed >= 3
      when 'foundations' then courses_completed = 4 and 'final-case' = any(passed_ids)
      else false
    end, false) then
      return;
    end if;

    insert into public.foundations_private_certificates
      (user_id, programme_version, milestone, recipient_name, template_version, evidence)
    values (p_user_id, p_programme_version, p_milestone, p_recipient_name, p_template_version, passed_evidence)
    on conflict on constraint foundations_private_certificates_pkey do nothing
    returning * into record_snapshot;

    if not found then
      select c.* into strict record_snapshot from public.foundations_private_certificates c
        where c.user_id = p_user_id and c.programme_version = p_programme_version and c.milestone = p_milestone;
    end if;
  end if;

  return query select record_snapshot.id, record_snapshot.user_id, record_snapshot.programme_version,
    record_snapshot.milestone, record_snapshot.recipient_name, record_snapshot.template_version, record_snapshot.issued_at;
end;
$$;

revoke all on function public.record_foundations_assessment(uuid, text, text, integer, integer)
  from public, anon, authenticated, service_role;
revoke all on function public.create_or_read_foundations_certificate(uuid, text, text, text, text)
  from public, anon, authenticated, service_role;
grant execute on function public.record_foundations_assessment(uuid, text, text, integer, integer) to service_role;
grant execute on function public.create_or_read_foundations_certificate(uuid, text, text, text, text) to service_role;

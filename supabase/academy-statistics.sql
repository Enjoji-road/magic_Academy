-- 『魔法学校』学院運営記録。Edge Function以外から行データを公開しない。
create table if not exists public.academy_stats_visitors (
  visitor_hash text primary key check (visitor_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);

create table if not exists public.academy_stats_events (
  visitor_hash text not null references public.academy_stats_visitors(visitor_hash) on delete cascade,
  event_name text not null check (event_name in (
    'enrollment','fire_attempt','fire_pass','water_attempt','water_pass',
    'wind_attempt','wind_pass','earth_attempt','earth_pass',
    'graduation_attempt','graduation_pass'
  )),
  created_at timestamptz not null default now(),
  primary key (visitor_hash, event_name)
);
create index if not exists academy_stats_events_name_idx on public.academy_stats_events(event_name);

create table if not exists public.academy_stats_rate_limits (
  bucket_hash text not null check (bucket_hash ~ '^[0-9a-f]{64}$'),
  bucket_kind text not null check (bucket_kind in ('record','visitor','summary')),
  window_start timestamptz not null,
  hits integer not null default 1 check (hits > 0),
  primary key (bucket_hash, bucket_kind, window_start)
);

alter table public.academy_stats_visitors enable row level security;
alter table public.academy_stats_events enable row level security;
alter table public.academy_stats_rate_limits enable row level security;
drop policy if exists academy_stats_deny_client on public.academy_stats_visitors;
drop policy if exists academy_stats_deny_client on public.academy_stats_events;
drop policy if exists academy_stats_deny_client on public.academy_stats_rate_limits;
create policy academy_stats_deny_client on public.academy_stats_visitors for all to anon, authenticated using (false) with check (false);
create policy academy_stats_deny_client on public.academy_stats_events for all to anon, authenticated using (false) with check (false);
create policy academy_stats_deny_client on public.academy_stats_rate_limits for all to anon, authenticated using (false) with check (false);
revoke all on public.academy_stats_visitors, public.academy_stats_events, public.academy_stats_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on public.academy_stats_visitors, public.academy_stats_events, public.academy_stats_rate_limits to service_role;

create or replace function public.academy_stats_record(p_visitor_hash text, p_ip_hash text, p_events text[])
returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  allowed constant text[] := array['enrollment','fire_attempt','fire_pass','water_attempt','water_pass','wind_attempt','wind_pass','earth_attempt','earth_pass','graduation_attempt','graduation_pass'];
  expanded text[] := array['enrollment'];
  event text; current_hits integer; is_new boolean; inserted_count integer;
  five_minute timestamptz := date_trunc('hour', now()) + floor(extract(minute from now()) / 5) * interval '5 minutes';
begin
  if p_visitor_hash !~ '^[0-9a-f]{64}$' or coalesce(array_length(p_events, 1), 0) > 11 or exists (select 1 from unnest(p_events) e where not (e = any(allowed))) then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;
  if p_ip_hash is not null then
    if p_ip_hash !~ '^[0-9a-f]{64}$' then return jsonb_build_object('ok', false, 'reason', 'invalid'); end if;
    insert into public.academy_stats_rate_limits values (p_ip_hash, 'record', five_minute, 1)
      on conflict (bucket_hash, bucket_kind, window_start) do update set hits = academy_stats_rate_limits.hits + 1 returning hits into current_hits;
    if current_hits > 120 then return jsonb_build_object('ok', false, 'reason', 'rate_limited'); end if;
  end if;
  select not exists(select 1 from public.academy_stats_visitors where visitor_hash=p_visitor_hash) into is_new;
  if is_new and p_ip_hash is not null then
    insert into public.academy_stats_rate_limits values (p_ip_hash, 'visitor', date_trunc('hour', now()), 1)
      on conflict (bucket_hash, bucket_kind, window_start) do update set hits = academy_stats_rate_limits.hits + 1 returning hits into current_hits;
    if current_hits > 25 then return jsonb_build_object('ok', false, 'reason', 'rate_limited'); end if;
  end if;
  insert into public.academy_stats_visitors(visitor_hash) values (p_visitor_hash) on conflict do nothing;
  foreach event in array coalesce(p_events, array[]::text[]) loop
    expanded := array_append(expanded, event);
    if event like '%_pass' then expanded := array_append(expanded, replace(event, '_pass', '_attempt')); end if;
    if event in ('graduation_attempt','graduation_pass') then
      expanded := expanded || array['fire_attempt','fire_pass','water_attempt','water_pass','wind_attempt','wind_pass','earth_attempt','earth_pass','graduation_attempt'];
    end if;
  end loop;
  insert into public.academy_stats_events(visitor_hash,event_name)
    select p_visitor_hash,e from (select distinct unnest(expanded) e) s
    where e = any(allowed) on conflict do nothing;
  get diagnostics inserted_count = row_count;
  delete from public.academy_stats_rate_limits where window_start < now() - interval '48 hours';
  return jsonb_build_object('ok', true, 'inserted', inserted_count);
end $$;

create or replace function public.academy_stats_summary(p_ip_hash text default null)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare current_hits integer; five_minute timestamptz := date_trunc('hour', now()) + floor(extract(minute from now()) / 5) * interval '5 minutes'; result jsonb;
begin
  if p_ip_hash is not null then
    if p_ip_hash !~ '^[0-9a-f]{64}$' then return jsonb_build_object('ok', false, 'reason', 'invalid'); end if;
    insert into public.academy_stats_rate_limits values (p_ip_hash, 'summary', five_minute, 1)
      on conflict (bucket_hash, bucket_kind, window_start) do update set hits = academy_stats_rate_limits.hits + 1 returning hits into current_hits;
    if current_hits > 120 then return jsonb_build_object('ok', false, 'reason', 'rate_limited'); end if;
  end if;
  select jsonb_build_object(
    'ok', true, 'started_at', min(created_at) filter (where event_name='enrollment'),
    'entrants', count(*) filter (where event_name='enrollment'),
    'fire', jsonb_build_object('attempted',count(*) filter(where event_name='fire_attempt'),'passed',count(*) filter(where event_name='fire_pass')),
    'water', jsonb_build_object('attempted',count(*) filter(where event_name='water_attempt'),'passed',count(*) filter(where event_name='water_pass')),
    'wind', jsonb_build_object('attempted',count(*) filter(where event_name='wind_attempt'),'passed',count(*) filter(where event_name='wind_pass')),
    'earth', jsonb_build_object('attempted',count(*) filter(where event_name='earth_attempt'),'passed',count(*) filter(where event_name='earth_pass')),
    'graduation', jsonb_build_object('attempted',count(*) filter(where event_name='graduation_attempt'),'passed',count(*) filter(where event_name='graduation_pass'))
  ) into result from public.academy_stats_events;
  return result;
end $$;

revoke all on function public.academy_stats_record(text,text,text[]) from public, anon, authenticated;
revoke all on function public.academy_stats_summary(text) from public, anon, authenticated;
grant execute on function public.academy_stats_record(text,text,text[]), public.academy_stats_summary(text) to service_role;

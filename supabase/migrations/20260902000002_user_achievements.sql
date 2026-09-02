create table if not exists public.watch_completion_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null,
  slug text not null,
  episode_key text not null,
  completed_at timestamptz not null default now(),
  series_completed boolean not null default false,
  movie_completed boolean not null default false,
  unique (user_id, source, slug, episode_key)
);
alter table public.watch_completion_events
  add column if not exists movie_completed boolean not null default false;

create index if not exists watch_completion_events_user_time
  on public.watch_completion_events(user_id, completed_at desc);

create table if not exists public.user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null check (key in ('first-finish','ten-finishes','five-watch-days','series-complete')),
  unlocked_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.watch_completion_events enable row level security;
alter table public.user_achievements enable row level security;
revoke all on public.watch_completion_events from anon, authenticated;
revoke all on public.user_achievements from anon, authenticated;
grant select on public.watch_completion_events to authenticated;
grant select on public.user_achievements to authenticated;
grant all on public.watch_completion_events to service_role;
grant all on public.user_achievements to service_role;

drop policy if exists "Users read own completion events" on public.watch_completion_events;
create policy "Users read own completion events" on public.watch_completion_events
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users read own achievements" on public.user_achievements;
create policy "Users read own achievements" on public.user_achievements
  for select to authenticated using (auth.uid() = user_id);

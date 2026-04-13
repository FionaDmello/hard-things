-- Hard Things - Database Schema
-- Run this in the Supabase SQL Editor
-- Drop all existing tables before running:
--   drop table if exists public.habit_schedule, public.habit_versions, public.habit_drivers,
--     public.checkins, public.observations, public.collapses, public.urge_logs,
--     public.weekly_reviews, public.settings, public.habits cascade;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Habits ──────────────────────────────────────────────────────────────────

create table public.habits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  section text not null check (section in ('break', 'build')),
  name text not null,
  discernment_question text not null default '',
  distress_tolerance text not null default '',
  current_phase text check (current_phase in ('phase_1_observe', 'phase_2_replace', 'phase_3_quit')),
  created_at timestamptz not null default now()
);
-- Note: discernment_question is used by break habits and simple build habits (no sub-habits).
-- Build habits with sub-habits store discernment_question per sub-habit in habit_versions.

-- Drivers / jobs per habit (Section A: jobs the habit is doing; Section B: not used)
create table public.habit_drivers (
  id uuid primary key default uuid_generate_v4(),
  habit_id uuid references public.habits(id) on delete cascade not null,
  key text not null,
  label text not null,
  description text not null default '',
  replacement text not null default ''
);

-- Practice levels per build habit.
-- name is null for simple build habits (no sub-habits); populated for sub-habit build habits.
-- discernment_question is per sub-habit for habits with sub-habits; leave empty for simple habits.
create table public.habit_versions (
  id uuid primary key default uuid_generate_v4(),
  habit_id uuid references public.habits(id) on delete cascade not null,
  sub_habit text,
  discernment_question text not null default '',
  full_description text not null default '',
  minimum_description text not null default '',
  non_negotiable text not null default ''
);

-- Weekly schedule per habit (Section B: day-of-week to sub-habit mapping)
create table public.habit_schedule (
  id uuid primary key default uuid_generate_v4(),
  habit_id uuid references public.habits(id) on delete cascade not null,
  day_of_week integer not null check (day_of_week >= 0 and day_of_week <= 6),
  sub_habit text not null
);

-- ─── Transactional tables ─────────────────────────────────────────────────────

create table public.checkins (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  habit_id uuid references public.habits(id) on delete cascade not null,
  date date not null,
  section text not null check (section in ('break', 'build')),
  occurred boolean,
  practice_level text check (practice_level in ('full', 'minimum', 'non_negotiable', 'missed')),
  job_if_slipped text,
  replacement_note text,
  urge_intensity integer check (urge_intensity >= 1 and urge_intensity <= 10),
  resistance_note text,
  helped_or_hindered text,
  sentence_note text,
  created_at timestamptz not null default now(),
  unique(user_id, habit_id, date)
);

create table public.observations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  habit_id uuid references public.habits(id) on delete cascade not null,
  trigger_or_task text,
  driver text,
  escape_route text,
  emotional_state text,
  time_of_day text,
  five_minutes_after text,
  physical_sensation text,
  created_at timestamptz not null default now()
);

create table public.collapses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  habit_id uuid references public.habits(id) on delete cascade not null,
  section text not null check (section in ('break', 'build')),
  what_happened text not null,
  what_gave_way text,
  job_if_break text,
  replacement_unavailable text,
  return_confirmed boolean,
  created_at timestamptz not null default now()
);

create table public.urge_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  named_craving text not null,
  selected_job text not null,
  location_confirmed boolean not null default false,
  replacement_shown text not null,
  waited_ten_minutes boolean not null default false,
  note text,
  created_at timestamptz not null default now()
);

create table public.weekly_reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  week_start_date date not null,
  what_i_did text,
  what_got_in_way text,
  carrying_forward text,
  sentence_practiced text,
  sentence_hard text,
  sentence_carrying text,
  created_at timestamptz not null default now(),
  unique(user_id, week_start_date)
);

create table public.settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  selected_theme text not null default 'amber-plum' check (selected_theme in ('sage-terracotta', 'amber-plum', 'midnight-gold', 'rose-charcoal')),
  night_before_prompts jsonb,
  updated_at timestamptz not null default now()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table public.habits enable row level security;
alter table public.habit_drivers enable row level security;
alter table public.habit_versions enable row level security;
alter table public.habit_schedule enable row level security;
alter table public.checkins enable row level security;
alter table public.observations enable row level security;
alter table public.collapses enable row level security;
alter table public.urge_logs enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.settings enable row level security;

-- Habits
create policy "Users can view their own habits" on public.habits for select using (auth.uid() = user_id);
create policy "Users can insert their own habits" on public.habits for insert with check (auth.uid() = user_id);
create policy "Users can update their own habits" on public.habits for update using (auth.uid() = user_id);
create policy "Users can delete their own habits" on public.habits for delete using (auth.uid() = user_id);

-- Habit drivers (access via habit ownership)
create policy "Users can view their own habit drivers" on public.habit_drivers for select using (exists (select 1 from public.habits where id = habit_id and user_id = auth.uid()));
create policy "Users can insert their own habit drivers" on public.habit_drivers for insert with check (exists (select 1 from public.habits where id = habit_id and user_id = auth.uid()));
create policy "Users can update their own habit drivers" on public.habit_drivers for update using (exists (select 1 from public.habits where id = habit_id and user_id = auth.uid()));
create policy "Users can delete their own habit drivers" on public.habit_drivers for delete using (exists (select 1 from public.habits where id = habit_id and user_id = auth.uid()));

-- Habit versions
create policy "Users can view their own habit versions" on public.habit_versions for select using (exists (select 1 from public.habits where id = habit_id and user_id = auth.uid()));
create policy "Users can insert their own habit versions" on public.habit_versions for insert with check (exists (select 1 from public.habits where id = habit_id and user_id = auth.uid()));
create policy "Users can update their own habit versions" on public.habit_versions for update using (exists (select 1 from public.habits where id = habit_id and user_id = auth.uid()));
create policy "Users can delete their own habit versions" on public.habit_versions for delete using (exists (select 1 from public.habits where id = habit_id and user_id = auth.uid()));

-- Habit schedule
create policy "Users can view their own habit schedule" on public.habit_schedule for select using (exists (select 1 from public.habits where id = habit_id and user_id = auth.uid()));
create policy "Users can insert their own habit schedule" on public.habit_schedule for insert with check (exists (select 1 from public.habits where id = habit_id and user_id = auth.uid()));
create policy "Users can update their own habit schedule" on public.habit_schedule for update using (exists (select 1 from public.habits where id = habit_id and user_id = auth.uid()));
create policy "Users can delete their own habit schedule" on public.habit_schedule for delete using (exists (select 1 from public.habits where id = habit_id and user_id = auth.uid()));

-- Checkins
create policy "Users can view their own checkins" on public.checkins for select using (auth.uid() = user_id);
create policy "Users can insert their own checkins" on public.checkins for insert with check (auth.uid() = user_id);
create policy "Users can update their own checkins" on public.checkins for update using (auth.uid() = user_id);
create policy "Users can delete their own checkins" on public.checkins for delete using (auth.uid() = user_id);

-- Observations
create policy "Users can view their own observations" on public.observations for select using (auth.uid() = user_id);
create policy "Users can insert their own observations" on public.observations for insert with check (auth.uid() = user_id);
create policy "Users can update their own observations" on public.observations for update using (auth.uid() = user_id);
create policy "Users can delete their own observations" on public.observations for delete using (auth.uid() = user_id);

-- Collapses
create policy "Users can view their own collapses" on public.collapses for select using (auth.uid() = user_id);
create policy "Users can insert their own collapses" on public.collapses for insert with check (auth.uid() = user_id);
create policy "Users can update their own collapses" on public.collapses for update using (auth.uid() = user_id);
create policy "Users can delete their own collapses" on public.collapses for delete using (auth.uid() = user_id);

-- Urge logs
create policy "Users can view their own urge logs" on public.urge_logs for select using (auth.uid() = user_id);
create policy "Users can insert their own urge logs" on public.urge_logs for insert with check (auth.uid() = user_id);
create policy "Users can update their own urge logs" on public.urge_logs for update using (auth.uid() = user_id);
create policy "Users can delete their own urge logs" on public.urge_logs for delete using (auth.uid() = user_id);

-- Weekly reviews
create policy "Users can view their own weekly reviews" on public.weekly_reviews for select using (auth.uid() = user_id);
create policy "Users can insert their own weekly reviews" on public.weekly_reviews for insert with check (auth.uid() = user_id);
create policy "Users can update their own weekly reviews" on public.weekly_reviews for update using (auth.uid() = user_id);
create policy "Users can delete their own weekly reviews" on public.weekly_reviews for delete using (auth.uid() = user_id);

-- Settings
create policy "Users can view their own settings" on public.settings for select using (auth.uid() = user_id);
create policy "Users can insert their own settings" on public.settings for insert with check (auth.uid() = user_id);
create policy "Users can update their own settings" on public.settings for update using (auth.uid() = user_id);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

create index idx_habits_user_id on public.habits(user_id);
create index idx_habit_drivers_habit_id on public.habit_drivers(habit_id);
create index idx_habit_versions_habit_id on public.habit_versions(habit_id);
create index idx_habit_versions_sub_habit on public.habit_versions(habit_id, sub_habit) where sub_habit is not null;
create index idx_habit_schedule_habit_id on public.habit_schedule(habit_id);
create index idx_checkins_user_id on public.checkins(user_id);
create index idx_checkins_habit_id on public.checkins(habit_id);
create index idx_checkins_date on public.checkins(date);
create index idx_observations_user_id on public.observations(user_id);
create index idx_observations_habit_id on public.observations(habit_id);
create index idx_collapses_user_id on public.collapses(user_id);
create index idx_urge_logs_user_id on public.urge_logs(user_id);
create index idx_weekly_reviews_user_id on public.weekly_reviews(user_id);

-- ─── RPC Functions ────────────────────────────────────────────────────────────

create or replace function get_break_habits()
returns json
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select json_agg(h)
      from (
        select
          hab.id,
          hab.user_id,
          hab.section,
          hab.name,
          hab.discernment_question,
          hab.distress_tolerance,
          hab.current_phase,
          hab.created_at,
          coalesce(
            (
              select json_agg(
                json_build_object(
                  'id',          d.id,
                  'habit_id',    d.habit_id,
                  'key',         d.key,
                  'label',       d.label,
                  'description', d.description,
                  'replacement', d.replacement
                )
              )
              from habit_drivers d
              where d.habit_id = hab.id
            ),
            '[]'::json
          ) as habit_drivers
        from habits hab
        where hab.user_id = auth.uid()
          and hab.section = 'break'
        order by hab.created_at
      ) h
    ),
    '[]'::json
  )
$$;

create or replace function get_build_habits()
returns json
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select json_agg(h)
      from (
        select
          hab.id,
          hab.user_id,
          hab.section,
          hab.name,
          hab.discernment_question,
          hab.distress_tolerance,
          hab.current_phase,
          hab.created_at,
          -- practice: populated for simple habits (sub_habit is null), null for sub-habit habits
          case
            when exists (select 1 from habit_versions v where v.habit_id = hab.id and v.sub_habit is null)
            then (
              select json_build_object(
                'full_description',    v.full_description,
                'minimum_description', v.minimum_description,
                'non_negotiable',      v.non_negotiable
              )
              from habit_versions v
              where v.habit_id = hab.id and v.sub_habit is null
              limit 1
            )
            else null
          end as practice,
          -- sub_habits: populated for sub-habit habits, null for simple habits
          case
            when exists (select 1 from habit_versions v where v.habit_id = hab.id and v.sub_habit is not null)
            then (
              select json_object_agg(
                v.sub_habit,
                json_build_object(
                  'discernment_question', v.discernment_question,
                  'full_description',     v.full_description,
                  'minimum_description',  v.minimum_description,
                  'non_negotiable',       v.non_negotiable
                )
              )
              from habit_versions v
              where v.habit_id = hab.id and v.sub_habit is not null
            )
            else null
          end as sub_habits,
          -- schedule as a day-keyed map: { "1": "yoga", "2": "gym", ... }
          coalesce(
            (
              select json_object_agg(s.day_of_week::text, s.sub_habit)
              from habit_schedule s
              where s.habit_id = hab.id
            ),
            '{}'::json
          ) as habit_schedule
        from habits hab
        where hab.user_id = auth.uid()
          and hab.section = 'build'
        order by hab.created_at
      ) h
    ),
    '[]'::json
  )
$$;

grant execute on function get_break_habits() to authenticated;
grant execute on function get_build_habits() to authenticated;

create or replace function get_observation_stats(p_habit_id uuid)
returns json
language sql
security definer
set search_path = public
stable
as $$
  select json_build_object(
    'distinct_days_logged', coalesce(stats.distinct_days, 0),
    'days_remaining',       greatest(0, 14 - coalesce(stats.distinct_days, 0)),
    'observations_by_day',  coalesce(history.by_day, '[]'::json)
  )
  from (
    select count(distinct (o.created_at at time zone 'UTC')::date) as distinct_days
    from observations o
    where o.habit_id = p_habit_id
      and o.user_id = auth.uid()
  ) stats,
  (
    select json_agg(day_group order by day_group->>'date' desc) as by_day
    from (
      select json_build_object(
        'date',    (o.created_at at time zone 'UTC')::date,
        'entries', json_agg(
          json_build_object(
            'id',                 o.id,
            'trigger_or_task',    o.trigger_or_task,
            'driver',             o.driver,
            'escape_route',       o.escape_route,
            'emotional_state',    o.emotional_state,
            'time_of_day',        o.time_of_day,
            'five_minutes_after', o.five_minutes_after,
            'physical_sensation', o.physical_sensation,
            'created_at',         o.created_at
          )
          order by o.created_at
        )
      ) as day_group
      from observations o
      where o.habit_id = p_habit_id
        and o.user_id = auth.uid()
      group by (o.created_at at time zone 'UTC')::date
    ) grouped
  ) history
$$;

grant execute on function get_observation_stats(uuid) to authenticated;

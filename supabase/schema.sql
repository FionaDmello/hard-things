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

-- Drivers / jobs per habit (Section A: jobs the habit is doing; Section B: not used)
create table public.habit_drivers (
  id uuid primary key default uuid_generate_v4(),
  habit_id uuid references public.habits(id) on delete cascade not null,
  key text not null,
  label text not null,
  description text not null default '',
  replacement text not null default ''
);

-- Practice versions per habit (Section B: full / minimum / non-negotiable per sub-habit)
create table public.habit_versions (
  id uuid primary key default uuid_generate_v4(),
  habit_id uuid references public.habits(id) on delete cascade not null,
  sub_habit text not null,
  level text not null check (level in ('full', 'minimum', 'non_negotiable')),
  description text not null
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
create index idx_habit_schedule_habit_id on public.habit_schedule(habit_id);
create index idx_checkins_user_id on public.checkins(user_id);
create index idx_checkins_habit_id on public.checkins(habit_id);
create index idx_checkins_date on public.checkins(date);
create index idx_observations_user_id on public.observations(user_id);
create index idx_observations_habit_id on public.observations(habit_id);
create index idx_collapses_user_id on public.collapses(user_id);
create index idx_urge_logs_user_id on public.urge_logs(user_id);
create index idx_weekly_reviews_user_id on public.weekly_reviews(user_id);

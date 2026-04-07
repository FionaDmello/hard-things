-- Hard Things - Database Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Habits table
create table public.habits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  section text not null check (section in ('break', 'build')),
  name text not null,
  versions jsonb not null default '{}',
  drivers text[] not null default '{}',
  discernment_question text not null default '',
  replacements jsonb not null default '{}',
  current_phase text check (current_phase in ('phase_1_observe', 'phase_2_replace', 'phase_3_quit')),
  schedule jsonb,
  created_at timestamptz not null default now()
);

-- Check-ins table
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

-- Observations table (Phase 1 logging for break habits)
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

-- Collapses table
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

-- Urge logs table (A1 - Smoking five-step protocol)
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

-- Weekly reviews table
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

-- Settings table
create table public.settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  selected_theme text not null default 'amber-plum' check (selected_theme in ('sage-terracotta', 'amber-plum', 'midnight-gold', 'rose-charcoal')),
  night_before_prompts jsonb,
  updated_at timestamptz not null default now()
);

-- Row Level Security Policies

alter table public.habits enable row level security;
alter table public.checkins enable row level security;
alter table public.observations enable row level security;
alter table public.collapses enable row level security;
alter table public.urge_logs enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.settings enable row level security;

-- Habits policies
create policy "Users can view their own habits"
  on public.habits for select
  using (auth.uid() = user_id);

create policy "Users can insert their own habits"
  on public.habits for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own habits"
  on public.habits for update
  using (auth.uid() = user_id);

create policy "Users can delete their own habits"
  on public.habits for delete
  using (auth.uid() = user_id);

-- Checkins policies
create policy "Users can view their own checkins"
  on public.checkins for select
  using (auth.uid() = user_id);

create policy "Users can insert their own checkins"
  on public.checkins for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own checkins"
  on public.checkins for update
  using (auth.uid() = user_id);

create policy "Users can delete their own checkins"
  on public.checkins for delete
  using (auth.uid() = user_id);

-- Observations policies
create policy "Users can view their own observations"
  on public.observations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own observations"
  on public.observations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own observations"
  on public.observations for update
  using (auth.uid() = user_id);

create policy "Users can delete their own observations"
  on public.observations for delete
  using (auth.uid() = user_id);

-- Collapses policies
create policy "Users can view their own collapses"
  on public.collapses for select
  using (auth.uid() = user_id);

create policy "Users can insert their own collapses"
  on public.collapses for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own collapses"
  on public.collapses for update
  using (auth.uid() = user_id);

create policy "Users can delete their own collapses"
  on public.collapses for delete
  using (auth.uid() = user_id);

-- Urge logs policies
create policy "Users can view their own urge logs"
  on public.urge_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own urge logs"
  on public.urge_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own urge logs"
  on public.urge_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete their own urge logs"
  on public.urge_logs for delete
  using (auth.uid() = user_id);

-- Weekly reviews policies
create policy "Users can view their own weekly reviews"
  on public.weekly_reviews for select
  using (auth.uid() = user_id);

create policy "Users can insert their own weekly reviews"
  on public.weekly_reviews for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own weekly reviews"
  on public.weekly_reviews for update
  using (auth.uid() = user_id);

create policy "Users can delete their own weekly reviews"
  on public.weekly_reviews for delete
  using (auth.uid() = user_id);

-- Settings policies
create policy "Users can view their own settings"
  on public.settings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own settings"
  on public.settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own settings"
  on public.settings for update
  using (auth.uid() = user_id);

-- Indexes for performance
create index idx_habits_user_id on public.habits(user_id);
create index idx_checkins_user_id on public.checkins(user_id);
create index idx_checkins_habit_id on public.checkins(habit_id);
create index idx_checkins_date on public.checkins(date);
create index idx_observations_user_id on public.observations(user_id);
create index idx_observations_habit_id on public.observations(habit_id);
create index idx_collapses_user_id on public.collapses(user_id);
create index idx_urge_logs_user_id on public.urge_logs(user_id);
create index idx_weekly_reviews_user_id on public.weekly_reviews(user_id);

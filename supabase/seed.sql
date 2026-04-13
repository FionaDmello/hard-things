-- Hard Things - Seed Data
-- Run this in the Supabase SQL Editor after schema.sql
-- Uses fixed UUIDs so junction table inserts can reference them directly

-- ─── Habits ──────────────────────────────────────────────────────────────────

INSERT INTO public.habits (id, user_id, section, name, discernment_question, distress_tolerance, current_phase)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'fcf1eb17-7d7d-4394-9c1a-09096bfbb0e7',
    'break',
    'Smoking',
    'This is a physical reality limit. Is there a better way to do the job this urge is trying to do right now?',
    'The urge will peak and pass. Ten minutes is the window. Go to the location, run the protocol, wait it out. The craving is not a command.',
    'phase_1_observe'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'fcf1eb17-7d7d-4394-9c1a-09096bfbb0e7',
    'break',
    'Avoidance & Procrastination',
    'Is this a fear-based limit or a real one?',
    'Find the entry point only. Not the task — the first physical action. Write one line. Open one file. Set a twenty-five minute timer and stop when it ends.',
    'phase_1_observe'
  );

-- Exercise has sub-habits, so discernment_question lives in habit_versions instead
INSERT INTO public.habits (id, user_id, section, name, distress_tolerance)
VALUES
  (
    '33333333-3333-3333-3333-333333333333',
    'fcf1eb17-7d7d-4394-9c1a-09096bfbb0e7',
    'build',
    'Exercise',
    'The non-negotiable exists for this moment. It is the floor, not the ceiling. Clothes on, mat out, or walk to the door — begin there.'
  );

-- ─── A1 Smoking — drivers ────────────────────────────────────────────────────

INSERT INTO public.habit_drivers (id, habit_id, key, label, description) VALUES
  (
    'aaaaaaaa-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'morning_anchor',
    'Morning anchor',
    'The cigarette that starts the day — ritual, orientation, the first moment of quiet.'
  ),
  (
    'aaaaaaaa-2222-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'meal_closure',
    'Meal closure',
    'The signal that a meal or a break is complete. Permission to stop.'
  ),
  (
    'aaaaaaaa-3333-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'stress_valve',
    'Stress valve',
    'A release when the pressure has built to a point where something has to give.'
  ),
  (
    'aaaaaaaa-4444-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'legitimate_exit',
    'Legitimate exit',
    'A socially acceptable reason to leave a situation, a room, a conversation.'
  ),
  (
    'aaaaaaaa-5555-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'uncomplicated_pleasure',
    'Uncomplicated pleasure',
    'Something that is just for you, with no performance or justification required.'
  );

-- ─── A1 Smoking — driver replacements ────────────────────────────────────────

INSERT INTO public.habit_driver_replacements (driver_id, label) VALUES
  ('aaaaaaaa-1111-1111-1111-111111111111', 'Two-minute outdoor breathing ritual in smoking location'),
  ('aaaaaaaa-1111-1111-1111-111111111111', '4-4-8 breath (inhale 4, hold 4, exhale 8)'),
  ('aaaaaaaa-2222-1111-1111-111111111111', 'Specific tea made slowly'),
  ('aaaaaaaa-2222-1111-1111-111111111111', 'Five-minute walk'),
  ('aaaaaaaa-3333-1111-1111-111111111111', '4-6 rounds of 4-4-8 breath in smoking location'),
  ('aaaaaaaa-4444-1111-1111-111111111111', 'Say ''I need five minutes'' for any reason, without explanation'),
  ('aaaaaaaa-5555-1111-1111-111111111111', 'What small private pleasure belongs only to you right now?');

-- ─── A2 Avoidance — drivers ───────────────────────────────────────────────────

INSERT INTO public.habit_drivers (id, habit_id, key, label, description) VALUES
  (
    'bbbbbbbb-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'failure_fear',
    'Failure fear',
    'The task feels like a test of worth, not a task. Starting risks confirming something about yourself.'
  ),
  (
    'bbbbbbbb-2222-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'overwhelm',
    'Overwhelm',
    'The full scope is visible all at once. There is no entry point, only the whole thing.'
  ),
  (
    'bbbbbbbb-3333-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'emotional_weight',
    'Emotional weight',
    'Something underneath the task — grief, resentment, dread — makes beginning feel impossible.'
  ),
  (
    'bbbbbbbb-4444-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'pointlessness',
    'Pointlessness',
    'The task feels disconnected from anything that matters. The effort has no visible destination.'
  );

-- ─── A2 Avoidance — driver replacements ──────────────────────────────────────

INSERT INTO public.habit_driver_replacements (driver_id, label) VALUES
  ('bbbbbbbb-1111-1111-1111-111111111111', 'Write: I am not trying to do this well. I am trying to find out what step one looks like.'),
  ('bbbbbbbb-2222-1111-1111-111111111111', 'Find the first physical action — not the task, just the action'),
  ('bbbbbbbb-3333-1111-1111-111111111111', 'Name the feeling underneath the task before you begin'),
  ('bbbbbbbb-4444-1111-1111-111111111111', 'Does this connect to the life you are building — even distantly?');

-- ─── B1 Exercise — versions ───────────────────────────────────────────────────

INSERT INTO public.habit_versions (habit_id, sub_habit, discernment_question, full_description, minimum_description, non_negotiable) VALUES
  (
    '33333333-3333-3333-3333-333333333333',
    'yoga',
    'Has this resistance ever dissolved once I started? Yes — so what is actually stopping me right now?',
    '45-50 minute practice.',
    '20 minutes any movement on mat.',
    'Clothes on, mat unrolled, five minutes lying on mat breathing.'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'gym',
    'The bag is already packed. The walk is the warm-up. What is actually stopping me right now?',
    '45-50 minute weight training session.',
    '20 minutes, two to three compound movements.',
    'Walk to gym, step inside, ten minutes of anything, walk home.'
  );

-- ─── B1 Exercise — schedule ───────────────────────────────────────────────────

INSERT INTO public.habit_schedule (habit_id, day_of_week, sub_habit) VALUES
  ('33333333-3333-3333-3333-333333333333', 0, 'rest'),  -- Sunday
  ('33333333-3333-3333-3333-333333333333', 1, 'yoga'),  -- Monday
  ('33333333-3333-3333-3333-333333333333', 2, 'gym'),   -- Tuesday
  ('33333333-3333-3333-3333-333333333333', 3, 'gym'),   -- Wednesday
  ('33333333-3333-3333-3333-333333333333', 4, 'gym'),   -- Thursday
  ('33333333-3333-3333-3333-333333333333', 5, 'yoga'),  -- Friday
  ('33333333-3333-3333-3333-333333333333', 6, 'yoga');  -- Saturday

-- Hard Things - Seed Data
-- Run this in the Supabase SQL Editor after schema.sql

-- A1 — Smoking (Habits to Break)
INSERT INTO public.habits (
  user_id,
  section,
  name,
  drivers,
  discernment_question,
  replacements,
  versions,
  current_phase
) VALUES (
  'fcf1eb17-7d7d-4394-9c1a-09096bfbb0e7',
  'break',
  'Smoking',
  ARRAY[
    'nicotine craving',
    'stress',
    'boredom',
    'happiness',
    'loneliness',
    'post-restriction',
    'work transition',
    'meal closure'
  ],
  'This is a physical reality limit. Is there a better way to do the job this urge is trying to do right now?',
  '{
    "morning_anchor":         "Two-minute outdoor breathing ritual, 4-4-8 breath, in smoking location.",
    "meal_closure":           "Specific tea made slowly, or five-minute walk.",
    "stress_valve":           "4-6 rounds of 4-4-8 breath in smoking location.",
    "legitimate_exit":        "You are allowed to say ''I need five minutes'' for any reason, without explanation.",
    "uncomplicated_pleasure": "What small private pleasure belongs only to you right now?"
  }'::jsonb,
  '{}'::jsonb,
  'phase_1_observe'
);

-- A2 — Avoidance & Procrastination (Habits to Break)
INSERT INTO public.habits (
  user_id,
  section,
  name,
  drivers,
  discernment_question,
  replacements,
  versions,
  current_phase
) VALUES (
  'fcf1eb17-7d7d-4394-9c1a-09096bfbb0e7',
  'break',
  'Avoidance & Procrastination',
  ARRAY[
    'failure fear',
    'overwhelm',
    'emotional weight',
    'pointlessness'
  ],
  'Is this a fear-based limit or a real one?',
  '{
    "failure_fear":     "This is an experiment, not a test. Write: I am not trying to do this well. I am trying to find out what step one looks like.",
    "overwhelm":        "Find the entry point only. What is the first physical action — not the task, just the action?",
    "emotional_weight": "Name the feeling underneath the task before you begin.",
    "pointlessness":    "Does this connect to the life you are building — even distantly?"
  }'::jsonb,
  '{}'::jsonb,
  'phase_1_observe'
);

-- B1 — Exercise: Yoga & Weight Training (Habits to Build)
-- discernment_question stored as JSON so the app picks yoga vs gym variant based on today's schedule
INSERT INTO public.habits (
  user_id,
  section,
  name,
  drivers,
  discernment_question,
  replacements,
  versions,
  current_phase,
  schedule
) VALUES (
  'fcf1eb17-7d7d-4394-9c1a-09096bfbb0e7',
  'build',
  'Exercise',
  ARRAY[]::text[],
  '{"yoga":"Has this resistance ever dissolved once I started? Yes — so what is actually stopping me right now?","gym":"The bag is already packed. The walk is the warm-up. What is actually stopping me right now?"}',
  '{}'::jsonb,
  '{
    "yoga": {
      "full":           "45-50 minute practice.",
      "minimum":        "20 minutes any movement on mat.",
      "non_negotiable": "Clothes on, mat unrolled, five minutes lying on mat breathing."
    },
    "gym": {
      "full":           "45-50 minute weight training session.",
      "minimum":        "20 minutes, two to three compound movements.",
      "non_negotiable": "Walk to gym, step inside, ten minutes of anything, walk home."
    }
  }'::jsonb,
  NULL,
  '{
    "0": "rest",
    "1": "yoga",
    "2": "gym",
    "3": "gym",
    "4": "gym",
    "5": "yoga",
    "6": "yoga"
  }'::jsonb
);

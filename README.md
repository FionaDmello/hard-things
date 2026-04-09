# Hard Things

A personal habit tracking app for breaking habits and building new ones.

## Stack

- **React 19** + TypeScript + Vite
- **TanStack Router** — file-based routing with full type safety
- **TanStack Query** — server state, caching, and mutations
- **Zustand** — global state for auth, theme, and habits
- **Supabase** — Postgres database, auth, and row-level security
- **Tailwind CSS v4** — utility styling with CSS custom property theming

## Structure

```
src/
  components/       UI components (check-in forms, collapse handler, etc.)
  routes/           TanStack Router file-based routes
  stores/           Zustand stores (auth, habit, theme, schedule)
  types/            Supabase database types
  lib/              Supabase client
supabase/
  schema.sql        Full database schema, RLS policies, RPC functions
  seed.sql          Seed data for development
design/             Architecture decision records
```

## Features

**Section A — Habits to break**
- Phase-based progression: observe → replace → quit
- Daily check-in with slip/clean tracking, job identification, urge intensity
- Collapse handler for processing a full slip
- Observation logger (phase 1)

**Section B — Habits to build**
- Practice levels: full / minimum / non-negotiable
- Daily check-in with practice level, resistance note
- Collapse handler for missed days with return protocol
- Weekly schedule per sub-habit (e.g. yoga / gym)

**App-wide**
- Night-before prompt for next-day preparation
- Weekly review
- Habit reference card (drivers, versions, distress tolerance, discernment question)
- Four selectable themes

## Database

Habits are stored in a generic `habits` table with three junction tables (`habit_drivers`, `habit_versions`, `habit_schedule`). Data is fetched and shaped into a UI-ready structure by a Postgres RPC function (`get_user_habits`) rather than on the frontend.

All tables have row-level security — users can only access their own data.

## Setup

1. Create a Supabase project
2. Run `supabase/schema.sql` in the SQL Editor
3. Run `supabase/seed.sql`, replacing the hardcoded `user_id` with your own
4. Copy your Supabase URL and anon key into `.env`:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
5. `npm install && npm run dev`

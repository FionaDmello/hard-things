export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type HabitSection = 'break' | 'build'
export type HabitPhase = 'phase_1_observe' | 'phase_2_replace' | 'phase_3_quit'
export type PracticeLevel = 'full' | 'minimum' | 'non_negotiable' | 'missed'
export type Theme = 'sage-terracotta' | 'amber-plum' | 'midnight-gold' | 'rose-charcoal'

// Makes nullable fields optional for inserts
type InsertOf<T> = {
  [K in keyof T as null extends T[K] ? never : K]: T[K]
} & {
  [K in keyof T as null extends T[K] ? K : never]?: T[K]
}

export interface Database {
  public: {
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
    Tables: {
      habits: {
        Row: {
          id: string
          user_id: string
          section: HabitSection
          name: string
          discernment_question: string
          distress_tolerance: string
          current_phase: HabitPhase | null
          created_at: string
        }
        Insert: Omit<InsertOf<Database['public']['Tables']['habits']['Row']>, 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['habits']['Insert']>
        Relationships: []
      }
      habit_drivers: {
        Row: {
          id: string
          habit_id: string
          key: string
          label: string
          description: string
          replacement: string
        }
        Insert: Omit<InsertOf<Database['public']['Tables']['habit_drivers']['Row']>, 'id'>
        Update: Partial<Database['public']['Tables']['habit_drivers']['Insert']>
        Relationships: []
      }
      habit_versions: {
        Row: {
          id: string
          habit_id: string
          sub_habit: string | null
          discernment_question: string
          full_description: string
          minimum_description: string
          non_negotiable: string
        }
        Insert: Omit<InsertOf<Database['public']['Tables']['habit_versions']['Row']>, 'id'>
        Update: Partial<Database['public']['Tables']['habit_versions']['Insert']>
        Relationships: []
      }
      habit_schedule: {
        Row: {
          id: string
          habit_id: string
          day_of_week: number
          sub_habit: string
        }
        Insert: Omit<InsertOf<Database['public']['Tables']['habit_schedule']['Row']>, 'id'>
        Update: Partial<Database['public']['Tables']['habit_schedule']['Insert']>
        Relationships: []
      }
      checkins: {
        Row: {
          id: string
          user_id: string
          habit_id: string
          date: string
          section: HabitSection
          occurred: boolean | null
          practice_level: PracticeLevel | null
          job_if_slipped: string | null
          replacement_note: string | null
          urge_intensity: number | null
          resistance_note: string | null
          helped_or_hindered: string | null
          sentence_note: string | null
          created_at: string
        }
        Insert: Omit<InsertOf<Database['public']['Tables']['checkins']['Row']>, 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['checkins']['Insert']>
        Relationships: []
      }
      observations: {
        Row: {
          id: string
          user_id: string
          habit_id: string
          trigger_or_task: string | null
          driver: string | null
          escape_route: string | null
          emotional_state: string | null
          time_of_day: string | null
          five_minutes_after: string | null
          physical_sensation: string | null
          created_at: string
        }
        Insert: Omit<InsertOf<Database['public']['Tables']['observations']['Row']>, 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['observations']['Insert']>
        Relationships: []
      }
      collapses: {
        Row: {
          id: string
          user_id: string
          habit_id: string
          section: HabitSection
          what_happened: string
          what_gave_way: string | null
          job_if_break: string | null
          replacement_unavailable: string | null
          return_confirmed: boolean | null
          created_at: string
        }
        Insert: Omit<InsertOf<Database['public']['Tables']['collapses']['Row']>, 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['collapses']['Insert']>
        Relationships: []
      }
      urge_logs: {
        Row: {
          id: string
          user_id: string
          named_craving: string
          selected_job: string
          location_confirmed: boolean
          replacement_shown: string
          waited_ten_minutes: boolean
          note: string | null
          created_at: string
        }
        Insert: Omit<InsertOf<Database['public']['Tables']['urge_logs']['Row']>, 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['urge_logs']['Insert']>
        Relationships: []
      }
      weekly_reviews: {
        Row: {
          id: string
          user_id: string
          week_start_date: string
          what_i_did: string | null
          what_got_in_way: string | null
          carrying_forward: string | null
          sentence_practiced: string | null
          sentence_hard: string | null
          sentence_carrying: string | null
          created_at: string
        }
        Insert: Omit<InsertOf<Database['public']['Tables']['weekly_reviews']['Row']>, 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['weekly_reviews']['Insert']>
        Relationships: []
      }
      settings: {
        Row: {
          id: string
          user_id: string
          selected_theme: Theme
          night_before_prompts: Json | null
          updated_at: string
        }
        Insert: Omit<InsertOf<Database['public']['Tables']['settings']['Row']>, 'id' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['settings']['Insert']>
        Relationships: []
      }
    }
  }
}

// ─── Convenience types ────────────────────────────────────────────────────────

export type HabitDriver = Database['public']['Tables']['habit_drivers']['Row']
export type HabitVersion = Database['public']['Tables']['habit_versions']['Row']
export type HabitSchedule = Database['public']['Tables']['habit_schedule']['Row']

type HabitRow = Database['public']['Tables']['habits']['Row']

// Practice levels — shared shape for both simple and sub-habit build habits
export type PracticeLevels = {
  full_description: string
  minimum_description: string
  non_negotiable: string
}

// Returned by supabase.rpc('get_break_habits')
export type BreakHabit = Omit<HabitRow, 'section'> & {
  section: 'break'
  habit_drivers: HabitDriver[]
}

// Returned by supabase.rpc('get_build_habits')
// Simple build habit (no sub-habits): practice is populated, sub_habits is null
// Sub-habit build habit: sub_habits is a map keyed by sub-habit name, practice is null
export type BuildHabit = Omit<HabitRow, 'section'> & {
  section: 'build'
  practice: PracticeLevels | null
  sub_habits: Record<string, PracticeLevels & { discernment_question: string }> | null
  habit_schedule: Record<string, string>
}

// Discriminated union — use habit.section === 'break'/'build' to narrow
export type AnyHabit = BreakHabit | BuildHabit

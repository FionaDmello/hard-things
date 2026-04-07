// Database types - these will be generated from Supabase schema
// For now, we define them manually based on the data model

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type HabitSection = 'A' | 'B'
export type HabitPhase = 'phase_1_observe' | 'phase_2_replace' | 'phase_3_quit'
export type PracticeLevel = 'full' | 'minimum' | 'non_negotiable' | 'missed'
export type Theme = 'sage-terracotta' | 'amber-plum' | 'midnight-gold' | 'rose-charcoal'

export interface Database {
  public: {
    Tables: {
      habits: {
        Row: {
          id: string
          user_id: string
          section: HabitSection
          name: string
          versions: Json
          drivers: string[]
          discernment_question: string
          replacements: Json
          current_phase: HabitPhase | null
          schedule: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['habits']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['habits']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['checkins']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['checkins']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['observations']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['observations']['Insert']>
      }
      collapses: {
        Row: {
          id: string
          user_id: string
          habit_id: string
          section: HabitSection
          what_happened: string
          what_gave_way: string | null
          job_if_section_a: string | null
          replacement_unavailable: string | null
          return_confirmed: boolean | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['collapses']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['collapses']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['urge_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['urge_logs']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['weekly_reviews']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['weekly_reviews']['Insert']>
      }
      settings: {
        Row: {
          id: string
          user_id: string
          selected_theme: Theme
          night_before_prompts: Json | null
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['settings']['Row'], 'id' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['settings']['Insert']>
      }
    }
  }
}

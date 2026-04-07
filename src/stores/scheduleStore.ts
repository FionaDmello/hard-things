import { create } from 'zustand'

type ExerciseType = 'yoga' | 'gym' | 'rest'

interface ScheduleState {
  todayExerciseType: ExerciseType | null
  setTodayExerciseType: (type: ExerciseType | null) => void
}

// B1 Exercise Schedule from the brief
const EXERCISE_SCHEDULE: Record<number, ExerciseType> = {
  0: 'rest', // Sunday - Yoga / Rest
  1: 'yoga', // Monday
  2: 'gym', // Tuesday
  3: 'gym', // Wednesday (lightest session)
  4: 'gym', // Thursday
  5: 'yoga', // Friday
  6: 'yoga', // Saturday
}

export const useScheduleStore = create<ScheduleState>((set) => ({
  todayExerciseType: null,
  setTodayExerciseType: (todayExerciseType) => set({ todayExerciseType }),
}))

export function getTodayExerciseType(): ExerciseType {
  const dayOfWeek = new Date().getDay()
  return EXERCISE_SCHEDULE[dayOfWeek]
}

export function isLightestGymDay(): boolean {
  return new Date().getDay() === 3 // Wednesday
}

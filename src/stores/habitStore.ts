import { create } from 'zustand'
import type { Habit } from '../types/database'

interface HabitState {
  habits: Habit[]
  isLoaded: boolean
  setHabits: (habits: Habit[]) => void
  setIsLoaded: (isLoaded: boolean) => void
  getHabitById: (id: string) => Habit | undefined
  getHabitsBySection: (section: 'break' | 'build') => Habit[]
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  isLoaded: false,
  setHabits: (habits) => set({ habits, isLoaded: true }),
  setIsLoaded: (isLoaded) => set({ isLoaded }),
  getHabitById: (id) => get().habits.find((h) => h.id === id),
  getHabitsBySection: (section) => get().habits.filter((h) => h.section === section),
}))

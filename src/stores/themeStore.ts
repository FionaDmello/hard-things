import { create } from 'zustand'
import type { Theme } from '../types/database'

interface ThemeState {
  theme: Theme | null
  // null = not yet checked, true = selected, false = not selected
  hasSelectedTheme: boolean | null
  setTheme: (theme: Theme) => void
  setHasSelectedTheme: (hasSelected: boolean | null) => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: null,
  hasSelectedTheme: null,
  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme)
    set({ theme, hasSelectedTheme: true })
  },
  setHasSelectedTheme: (hasSelectedTheme: boolean | null) => set({ hasSelectedTheme }),
}))

export const ALL_THEMES: { id: Theme; name: string }[] = [
  { id: 'amber-plum', name: 'Warm Amber & Plum' },
  { id: 'sage-terracotta', name: 'Sage & Terracotta' },
  { id: 'midnight-gold', name: 'Midnight Blue & Gold' },
  { id: 'rose-charcoal', name: 'Dusty Rose & Charcoal' },
]

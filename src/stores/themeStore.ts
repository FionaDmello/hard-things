import { create } from 'zustand'
import type { Theme } from '../types/database'

interface ThemeState {
  theme: Theme | null
  hasSelectedTheme: boolean
  setTheme: (theme: Theme) => void
  setHasSelectedTheme: (hasSelected: boolean) => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: null,
  hasSelectedTheme: false,
  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme)
    set({ theme, hasSelectedTheme: true })
  },
  setHasSelectedTheme: (hasSelectedTheme) => set({ hasSelectedTheme }),
}))

// Default themes available on first launch
export const DEFAULT_THEMES: { id: Theme; name: string }[] = [
  { id: 'amber-plum', name: 'Warm Amber & Plum' },
  { id: 'sage-terracotta', name: 'Sage & Terracotta' },
]

// All available themes
export const ALL_THEMES: { id: Theme; name: string }[] = [
  { id: 'amber-plum', name: 'Warm Amber & Plum' },
  { id: 'sage-terracotta', name: 'Sage & Terracotta' },
  { id: 'midnight-gold', name: 'Midnight Blue & Gold' },
  { id: 'rose-charcoal', name: 'Dusty Rose & Charcoal' },
]

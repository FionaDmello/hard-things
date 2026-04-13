import { useThemeStore, ALL_THEMES } from '../stores'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores'
import type { Theme } from '../types/database'

interface ThemePickerProps {
  isFirstLaunch?: boolean
}

const THEME_META: Record<Theme, { description: string; palette: string[] }> = {
  'amber-plum': {
    description: 'Warm · Contemplative',
    palette: ['#4A2C6E', '#7A4FA0', '#F0E8F8', '#C0703A'],
  },
  'sage-terracotta': {
    description: 'Grounded · Natural',
    palette: ['#3D5A47', '#6B8F71', '#EAF2EC', '#B85C38'],
  },
  'midnight-gold': {
    description: 'Deep · Focused',
    palette: ['#1A2E4A', '#2E5480', '#E8F0F8', '#B8860B'],
  },
  'rose-charcoal': {
    description: 'Soft · Understated',
    palette: ['#4A3040', '#8B5A6A', '#F8EEF2', '#6B6B6B'],
  },
}

export function ThemePicker({ isFirstLaunch = false }: ThemePickerProps) {
  const { theme: currentTheme, setTheme } = useThemeStore()
  const user = useAuthStore((state) => state.user)
  const themes = ALL_THEMES

  async function handleThemeSelect(themeId: Theme) {
    setTheme(themeId)

    if (user) {
      await supabase
        .from('settings')
        .upsert({ user_id: user.id, selected_theme: themeId })
    }
  }

  return (
    <div className={isFirstLaunch ? 'min-h-screen flex items-center justify-center p-6' : ''}>
      <div className={isFirstLaunch ? 'max-w-md w-full' : ''}>
        {isFirstLaunch && (
          <div className="text-center mb-8">
            <h1
              className="text-primary mb-2 leading-tight"
              style={{ fontFamily: "'Cormorant', Georgia, serif", fontWeight: 300, fontSize: 'clamp(2rem, 6vw, 2.6rem)' }}
            >
              Welcome to Hard Things
            </h1>
            <p className="text-sm text-mid">Choose a theme to get started</p>
          </div>
        )}

        <div className="grid gap-3">
          {themes.map((theme) => {
            const meta = THEME_META[theme.id]
            const isActive = currentTheme === theme.id
            return (
              <button
                key={theme.id}
                onClick={() => handleThemeSelect(theme.id)}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  isActive
                    ? 'border-accent bg-accent-light'
                    : 'border-mid/20 hover:border-mid/40'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-primary">{theme.name}</p>
                    <p className="text-xs text-mid mt-0.5">{meta.description}</p>
                  </div>
                  {isActive && (
                    <span className="text-xs uppercase tracking-[0.15em] text-accent">Active</span>
                  )}
                </div>
                <PaletteStrip palette={meta.palette} />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function PaletteStrip({ palette }: { palette: string[] }) {
  const [c1, c2, c3, c4] = palette
  const gradient = `linear-gradient(to right, ${c1} 0%, ${c1} 30%, ${c2} 30%, ${c2} 55%, ${c3} 55%, ${c3} 75%, ${c4} 75%)`

  return (
    <div
      className="w-full h-1.5 rounded-full"
      style={{ background: gradient }}
    />
  )
}

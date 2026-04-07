import { useThemeStore, DEFAULT_THEMES, ALL_THEMES } from '../stores'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores'
import type { Theme } from '../types/database'

interface ThemePickerProps {
  isFirstLaunch?: boolean
}

export function ThemePicker({ isFirstLaunch = false }: ThemePickerProps) {
  const { theme: currentTheme, setTheme } = useThemeStore()
  const user = useAuthStore((state) => state.user)
  const themes = isFirstLaunch ? DEFAULT_THEMES : ALL_THEMES

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
            <h1 className="text-2xl font-semibold text-primary mb-2">
              Welcome to Hard Things
            </h1>
            <p className="text-mid">Choose your theme to get started</p>
          </div>
        )}

        <div className="grid gap-4">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleThemeSelect(theme.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                currentTheme === theme.id
                  ? 'border-accent bg-accent-light'
                  : 'border-mid/20 hover:border-mid/40'
              }`}
            >
              <div className="font-medium text-primary">{theme.name}</div>
              <div className="flex gap-2 mt-2">
                <ThemePreview themeId={theme.id} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ThemePreview({ themeId }: { themeId: Theme }) {
  const colors: Record<Theme, { primary: string; mid: string; accent: string }> = {
    'amber-plum': { primary: '#4A2C6E', mid: '#7A4FA0', accent: '#C0703A' },
    'sage-terracotta': { primary: '#3D5A47', mid: '#6B8F71', accent: '#B85C38' },
    'midnight-gold': { primary: '#1A2E4A', mid: '#2E5480', accent: '#B8860B' },
    'rose-charcoal': { primary: '#4A3040', mid: '#8B5A6A', accent: '#6B6B6B' },
  }

  const c = colors[themeId]

  return (
    <>
      <div className="w-6 h-6 rounded" style={{ backgroundColor: c.primary }} />
      <div className="w-6 h-6 rounded" style={{ backgroundColor: c.mid }} />
      <div className="w-6 h-6 rounded" style={{ backgroundColor: c.accent }} />
    </>
  )
}

import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore, useThemeStore } from '../stores'
import type { Theme } from '../types/database'

export function AppHeader() {
  const { theme, setTheme } = useThemeStore()
  const { user, signOut } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)

  const initial = user?.email?.[0]?.toUpperCase() ?? '?'

  async function handleSignOut() {
    await supabase.auth.signOut()
    signOut()
  }

  async function handleThemeToggle(t: Theme) {
    setTheme(t)
    if (user) {
      await supabase
        .from('settings')
        .upsert({ user_id: user.id, selected_theme: t }, { onConflict: 'user_id' })
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-14 z-50 bg-canvas border-b border-border flex items-center justify-between px-6">

      {/* Wordmark */}
      <span className="font-display italic font-light text-[1.375rem] text-accent tracking-[0.01em] select-none">
        Nicira
      </span>

      {/* Controls */}
      <div className="flex items-center gap-5">

        {/* Theme toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleThemeToggle('dark')}
            aria-label="Dark theme"
            className="flex items-center justify-center w-7 h-7 bg-transparent border-none p-0 cursor-pointer transition-[color,opacity] duration-150"
            style={{
              color: theme === 'dark' ? 'var(--color-primary)' : 'var(--color-mid)',
              opacity: theme === 'dark' ? 1 : 0.45,
            }}
          >
            <Moon size={15} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => handleThemeToggle('light')}
            aria-label="Light theme"
            className="flex items-center justify-center w-7 h-7 bg-transparent border-none p-0 cursor-pointer transition-[color,opacity] duration-150"
            style={{
              color: theme === 'light' ? 'var(--color-primary)' : 'var(--color-mid)',
              opacity: theme === 'light' ? 1 : 0.45,
            }}
          >
            <Sun size={15} strokeWidth={1.5} />
          </button>
        </div>

        {/* User avatar */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center font-sans font-medium text-[11px] text-mid cursor-pointer shrink-0"
            >
              {initial}
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute top-9 right-0 bg-card border border-border rounded-[10px] p-1.5 min-w-[160px] z-20 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                  {user.email && (
                    <p className="font-sans text-[11px] text-mid px-2 pt-1 pb-2 mb-1 border-b border-border truncate">
                      {user.email}
                    </p>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left font-sans text-[13px] font-normal text-primary px-2 py-[7px] rounded-md bg-transparent border-none cursor-pointer"
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

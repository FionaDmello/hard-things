import { useState } from 'react'
import { Link } from '@tanstack/react-router'
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
        .upsert({ user_id: user.id, selected_theme: t })
    }
  }

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '56px',
        zIndex: 50,
        backgroundColor: 'var(--color-canvas)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}
    >
      {/* Wordmark */}
      <span
        style={{
          fontFamily: "'Cormorant', Georgia, serif",
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: '1.375rem',
          color: 'var(--color-accent)',
          letterSpacing: '0.01em',
          userSelect: 'none',
        }}
      >
        Nicira
      </span>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>

        {/* Theme toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => handleThemeToggle('dark')}
            aria-label="Dark theme"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: theme === 'dark' ? 'var(--color-primary)' : 'var(--color-mid)',
              opacity: theme === 'dark' ? 1 : 0.45,
              transition: 'color 150ms ease, opacity 150ms ease',
            }}
          >
            <Moon size={15} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => handleThemeToggle('light')}
            aria-label="Light theme"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: theme === 'light' ? 'var(--color-primary)' : 'var(--color-mid)',
              opacity: theme === 'light' ? 1 : 0.45,
              transition: 'color 150ms ease, opacity 150ms ease',
            }}
          >
            <Sun size={15} strokeWidth={1.5} />
          </button>
        </div>

        {/* User avatar */}
        {user && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontWeight: 500,
                fontSize: '11px',
                color: 'var(--color-mid)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {initial}
            </button>

            {menuOpen && (
              <>
                {/* Backdrop */}
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                  onClick={() => setMenuOpen(false)}
                />
                {/* Dropdown */}
                <div
                  style={{
                    position: 'absolute',
                    top: '36px',
                    right: 0,
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '10px',
                    padding: '6px',
                    minWidth: '160px',
                    zIndex: 20,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                  }}
                >
                  {user.email && (
                    <p
                      style={{
                        fontFamily: "'DM Sans', system-ui, sans-serif",
                        fontSize: '11px',
                        color: 'var(--color-mid)',
                        padding: '4px 8px 8px',
                        borderBottom: '1px solid var(--color-border)',
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user.email}
                    </p>
                  )}
                  <Link
                    to="/settings"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: 'block',
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                      fontSize: '13px',
                      fontWeight: 400,
                      color: 'var(--color-primary)',
                      padding: '7px 8px',
                      borderRadius: '6px',
                      textDecoration: 'none',
                    }}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                      fontSize: '13px',
                      fontWeight: 400,
                      color: 'var(--color-primary)',
                      padding: '7px 8px',
                      borderRadius: '6px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
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

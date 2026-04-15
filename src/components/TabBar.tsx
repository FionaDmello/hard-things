import { Link, useLocation } from '@tanstack/react-router'
import { Home, Scissors, Layers, BookOpen } from 'lucide-react'

const TABS = [
  { to: '/',       label: 'Today',  Icon: Home      },
  { to: '/break',  label: 'Break',  Icon: Scissors  },
  { to: '/build',  label: 'Build',  Icon: Layers    },
  { to: '/review', label: 'Review', Icon: BookOpen  },
] as const

export function TabBar() {
  const { pathname } = useLocation()

  function isActive(to: string) {
    if (to === '/') return pathname === '/'
    return pathname.startsWith(to)
  }

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '56px',
        zIndex: 50,
        backgroundColor: 'var(--color-canvas)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'stretch',
      }}
    >
      {TABS.map(({ to, label, Icon }) => {
        const active = isActive(to)
        return (
          <Link
            key={to}
            to={to}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              textDecoration: 'none',
              color: active ? 'var(--color-accent)' : 'var(--color-mid)',
              transition: 'color 150ms ease',
            }}
          >
            <Icon
              size={22}
              strokeWidth={active ? 2 : 1.5}
              fill={active ? 'currentColor' : 'none'}
            />
            <span
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontWeight: active ? 500 : 400,
                fontSize: '10px',
                letterSpacing: '0.03em',
              }}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

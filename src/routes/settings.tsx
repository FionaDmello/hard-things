import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '../stores'
import { supabase } from '../lib/supabase'

export const Route = createFileRoute('/settings')({
  component: Settings,
})

function Settings() {
  const signOut = useAuthStore((state) => state.signOut)
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()

  async function handleSignOut() {
    await supabase.auth.signOut()
    signOut()
    navigate({ to: '/' })
  }

  return (
    <div style={{ maxWidth: '32rem', margin: '0 auto', padding: '96px 24px 96px' }}>

      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontWeight: 400,
          fontSize: '12px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-mid)',
          textDecoration: 'none',
          marginBottom: '40px',
        }}
      >
        <span>←</span>
        <span>Today</span>
      </Link>

      <header style={{ marginBottom: '40px' }}>
        <h1 style={{
          fontFamily: "'Cormorant', Georgia, serif",
          fontWeight: 300,
          fontSize: 'clamp(2.4rem, 8vw, 3.2rem)',
          color: 'var(--color-primary)',
          lineHeight: 1.1,
        }}>
          Settings
        </h1>
        <div style={{ marginTop: '24px', height: '1px', backgroundColor: 'var(--color-border)' }} />
      </header>

      <div style={{ height: '1px', backgroundColor: 'var(--color-border)', marginBottom: '40px' }} />

      <section style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {user?.email && (
          <p style={{
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontWeight: 300,
            fontSize: '12px',
            color: 'var(--color-mid)',
          }}>
            {user.email}
          </p>
        )}
        <button
          onClick={handleSignOut}
          style={{
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontWeight: 400,
            fontSize: '12px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-mid)',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </section>

    </div>
  )
}

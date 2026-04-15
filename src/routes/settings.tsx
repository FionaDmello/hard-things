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
    <div className="max-w-lg mx-auto px-6 pt-24 pb-24">

      <Link
        to="/"
        className="inline-flex items-center gap-1.5 btn-secondary mb-10"
      >
        <span>←</span>
        <span>Today</span>
      </Link>

      <header className="mb-10">
        <h1 className="display" style={{ fontSize: 'clamp(2.4rem, 8vw, 3.2rem)' }}>Settings</h1>
        <div className="mt-6 h-px bg-border" />
      </header>

      <div className="h-px bg-border mb-10" />

      <section className="flex items-center justify-between">
        {user?.email && (
          <p className="font-sans font-light text-xs text-mid">{user.email}</p>
        )}
        <button className="btn-secondary" onClick={handleSignOut}>Sign out</button>
      </section>

    </div>
  )
}

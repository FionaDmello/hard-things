import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { ThemePicker } from '../components/ThemePicker'
import { useAuthStore } from '../stores'
import { supabase } from '../lib/supabase'

export const Route = createFileRoute('/settings')({
  component: Settings,
})

function Settings() {
  const signOut = useAuthStore((state) => state.signOut)
  const navigate = useNavigate()

  async function handleSignOut() {
    await supabase.auth.signOut()
    signOut()
    navigate({ to: '/' })
  }

  return (
    <div className="max-w-lg mx-auto px-6 pt-14 pb-24">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-mid hover:text-primary transition-colors mb-10">
        <span>←</span>
        <span className="uppercase tracking-[0.15em]">Dashboard</span>
      </Link>

      <header className="mb-10">
        <h1
          className="text-primary leading-tight"
          style={{ fontFamily: "'Cormorant', Georgia, serif", fontWeight: 300, fontSize: 'clamp(2.4rem, 8vw, 3.2rem)' }}
        >
          Settings
        </h1>
        <div className="mt-6 h-px bg-mid/20" />
      </header>

      <section className="mb-8">
        <h2 className="font-medium text-primary mb-4">Theme</h2>
        <ThemePicker />
      </section>

      <section>
        <button
          onClick={handleSignOut}
          className="text-sm text-mid hover:text-primary"
        >
          Sign out
        </button>
      </section>
    </div>
  )
}

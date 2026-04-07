import { createFileRoute } from '@tanstack/react-router'
import { ThemePicker } from '../components/ThemePicker'
import { useAuthStore } from '../stores'
import { supabase } from '../lib/supabase'

export const Route = createFileRoute('/settings')({
  component: Settings,
})

function Settings() {
  const signOut = useAuthStore((state) => state.signOut)

  async function handleSignOut() {
    await supabase.auth.signOut()
    signOut()
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-8">Settings</h1>

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

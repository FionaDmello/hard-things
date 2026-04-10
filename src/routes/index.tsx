import { createFileRoute } from '@tanstack/react-router'
import { useAuthStore, useThemeStore } from '../stores'
import { ThemePicker } from '../components/ThemePicker'
import { Dashboard } from '../components/Dashboard'
import { AuthForm } from '../components/AuthForm'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { user, isLoading: authLoading } = useAuthStore()
  const { hasSelectedTheme } = useThemeStore()

  if (authLoading || (user && hasSelectedTheme === null)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-mid">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  if (!hasSelectedTheme) {
    return <ThemePicker isFirstLaunch />
  }

  return <Dashboard />
}

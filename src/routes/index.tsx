import { createFileRoute } from '@tanstack/react-router'
import { useAuthStore } from '../stores'
import { Dashboard } from '../components/Dashboard'
import { AuthForm } from '../components/AuthForm'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100svh',
        }}
      >
        <span
          style={{
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: '13px',
            color: 'var(--color-mid)',
          }}
        >
          Loading...
        </span>
      </div>
    )
  }

  if (!user) return <AuthForm />

  return <Dashboard />
}

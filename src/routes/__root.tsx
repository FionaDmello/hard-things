import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { AppHeader } from '../components/AppHeader'
import { TabBar } from '../components/TabBar'
import { useAuthStore } from '../stores'

export const Route = createRootRoute({
  component: RootComponent,
})

function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-canvas">
      <div className="w-5 h-5 rounded-full border-2 border-border border-t-accent animate-spin" />
    </div>
  )
}

function RootComponent() {
  const { user, isLoading } = useAuthStore()

  if (isLoading) return <LoadingScreen />

  // Unauthenticated — full screen, no chrome
  if (!user) {
    return (
      <>
        <Outlet />
        {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
      </>
    )
  }

  // Authenticated — persistent header + tab bar
  return (
    <>
      <AppHeader />
      <Outlet />
      <TabBar />
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </>
  )
}

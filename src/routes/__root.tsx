import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { AppHeader } from '../components/AppHeader'
import { TabBar } from '../components/TabBar'
import { useAuthStore } from '../stores'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const { user } = useAuthStore()

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

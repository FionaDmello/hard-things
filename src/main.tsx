import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routeTree } from './routeTree.gen'
import { supabase } from './lib/supabase'
import { useAuthStore, useThemeStore } from './stores'
import type { Theme } from './types/database'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
    },
  },
})

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setIsLoading } = useAuthStore()
  const { setTheme } = useThemeStore()

  async function loadUserData(userId: string) {
    const { data } = await supabase
      .from('settings')
      .select('selected_theme')
      .eq('user_id', userId)
      .single()

    // Default to dark if no theme saved yet
    const theme = (data?.selected_theme as Theme) ?? 'dark'
    setTheme(theme)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session?.user) await loadUserData(session.user.id)
      else setTheme('dark')
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (event === 'SIGNED_IN' && session?.user) {
        loadUserData(session.user.id)
      }
      if (event === 'SIGNED_OUT') {
        setTheme('dark')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return children
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

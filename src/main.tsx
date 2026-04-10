import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routeTree } from './routeTree.gen'
import { supabase } from './lib/supabase'
import { useAuthStore, useThemeStore } from './stores'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
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
  const { setTheme, setHasSelectedTheme } = useThemeStore()

  function loadUserData(userId: string) {
    supabase
      .from('settings')
      .select('selected_theme')
      .eq('user_id', userId)
      .single()
      .then(({ data }) => {
        if (data?.selected_theme) {
          setTheme(data.selected_theme)
          setHasSelectedTheme(true)
        }
      })
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsLoading(false)
      if (session?.user) loadUserData(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (event === 'SIGNED_IN' && session?.user) {
        loadUserData(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [setSession, setIsLoading, setTheme, setHasSelectedTheme])

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

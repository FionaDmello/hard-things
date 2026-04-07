import { useState } from 'react'
import { supabase } from '../lib/supabase'

type AuthMode = 'signin' | 'signup' | 'magic-link'

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (mode === 'magic-link') {
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) {
        setMessage(error.message)
      } else {
        setMessage('Check your email for the login link')
      }
    } else if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setMessage(error.message)
      } else {
        setMessage('Check your email to confirm your account')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage(error.message)
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-sm w-full">
        <h1 className="text-2xl font-semibold text-primary text-center mb-2">
          Hard Things
        </h1>
        <p className="text-mid text-center mb-8">
          {mode === 'signup' ? 'Create your account' : 'Sign in to continue'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-primary mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-mid/30 bg-accent-light focus:outline-none focus:border-accent"
              required
            />
          </div>

          {mode !== 'magic-link' && (
            <div>
              <label htmlFor="password" className="block text-sm text-primary mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-mid/30 bg-accent-light focus:outline-none focus:border-accent"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-accent text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {loading
              ? 'Loading...'
              : mode === 'magic-link'
                ? 'Send magic link'
                : mode === 'signup'
                  ? 'Create account'
                  : 'Sign in'}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-sm text-center text-mid">{message}</p>
        )}

        <div className="mt-6 text-center space-y-2">
          {mode === 'signin' && (
            <>
              <button
                onClick={() => setMode('magic-link')}
                className="text-sm text-mid hover:text-primary"
              >
                Use magic link instead
              </button>
              <div>
                <button
                  onClick={() => setMode('signup')}
                  className="text-sm text-accent hover:underline"
                >
                  Create an account
                </button>
              </div>
            </>
          )}
          {mode === 'signup' && (
            <button
              onClick={() => setMode('signin')}
              className="text-sm text-accent hover:underline"
            >
              Already have an account? Sign in
            </button>
          )}
          {mode === 'magic-link' && (
            <button
              onClick={() => setMode('signin')}
              className="text-sm text-mid hover:text-primary"
            >
              Use password instead
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

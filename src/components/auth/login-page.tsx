import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import logo from '../../assets/logo.png'
import { getApiErrorMessage } from '../../lib/http-client'
import { saveSession } from '../../lib/session'
import { login } from '../../services'
import { ThemeToggle } from '../theme/theme-toggle'
import { useToast } from '../ui/toast-provider'

type LoginPageProps = {
  onBackToDashboard: () => void
  onLoginSuccess: () => void
}

export function LoginPage({ onBackToDashboard, onLoginSuccess }: LoginPageProps) {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email || !password) {
      setErrorMessage('Enter your email and password to continue.')
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const session = await login({
        email: email.trim(),
        password,
      })

      saveSession(session, rememberMe)
      toast({
        variant: 'success',
        title: 'Login successful',
        description: 'Welcome back to Habeep Dashboard.',
      })
      onLoginSuccess()
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Invalid email or password.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-[-8rem] h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -right-32 bottom-[-8rem] h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col p-4 md:p-6">
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </button>
          <ThemeToggle />
        </header>

        <div className="mx-auto flex w-full max-w-md flex-1 items-center">
          <div className="w-full rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-2xl shadow-blue-900/10 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95 md:p-8">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/20 to-cyan-500/20">
                <img src={logo} alt="Habeep logo" className="h-12 w-12 rounded-xl object-cover" />
              </div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Welcome Back</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sign in to Habeep Dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage ? (
                <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                  {errorMessage}
                </div>
              ) : null}

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</span>
                <span className="relative flex items-center">
                  <Mail className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="you@habeep.com"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      if (errorMessage) {
                        setErrorMessage(null)
                      }
                    }}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-blue-600 dark:focus:ring-blue-900/50"
                    disabled={isSubmitting}
                    required
                  />
                </span>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</span>
                <span className="relative flex items-center">
                  <Lock className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      if (errorMessage) {
                        setErrorMessage(null)
                      }
                    }}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-10 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-blue-600 dark:focus:ring-blue-900/50"
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-2 inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    onClick={() => setShowPassword((previousState) => !previousState)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
                />
                Remember me
              </label>

              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSubmitting || !email || !password}
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
              © {new Date().getFullYear()} Habeep. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

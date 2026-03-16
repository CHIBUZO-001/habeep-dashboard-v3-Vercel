import { Suspense, lazy, useEffect, useState } from 'react'

import { ThemeProvider } from './components/theme/theme-provider'
import { ToastProvider } from './components/ui/toast-provider'
import { getAccessToken } from './lib/session'

const LoginPage = lazy(() =>
  import('./components/auth/login-page').then((module) => ({ default: module.LoginPage })),
)
const DashboardShell = lazy(() =>
  import('./components/layout/dashboard-shell').then((module) => ({ default: module.DashboardShell })),
)

type AppPage = 'dashboard' | 'login'

type AuthRouteState = {
  page: AppPage
  path: string
}

function resolveAuthRoute(pathname: string, hasSession: boolean): AuthRouteState {
  const isLoginRoute = pathname === '/login' || pathname === '/auth/login'

  if (!hasSession) {
    return { page: 'login', path: '/login' }
  }

  if (pathname === '/' || isLoginRoute) {
    return { page: 'dashboard', path: '/dashboard' }
  }

  if (pathname.startsWith('/dashboard')) {
    return { page: 'dashboard', path: pathname }
  }

  return { page: 'dashboard', path: '/dashboard' }
}

function getInitialPage(): AppPage {
  if (typeof window === 'undefined') {
    return 'login'
  }

  const hasSession = Boolean(getAccessToken())
  const routeState = resolveAuthRoute(window.location.pathname, hasSession)
  if (window.location.pathname !== routeState.path) {
    navigateTo(routeState.path, true)
  }

  return routeState.page
}

function navigateTo(pathname: string, replace = false) {
  if (typeof window === 'undefined') {
    return
  }

  if (replace) {
    window.history.replaceState({}, '', pathname)
    return
  }

  window.history.pushState({}, '', pathname)
}

function App() {
  const [page, setPage] = useState<AppPage>(getInitialPage)

  useEffect(() => {
    const handlePopstate = () => {
      const hasSession = Boolean(getAccessToken())
      const routeState = resolveAuthRoute(window.location.pathname, hasSession)
      if (window.location.pathname !== routeState.path) {
        navigateTo(routeState.path, true)
      }
      setPage(routeState.page)
    }

    window.addEventListener('popstate', handlePopstate)
    return () => {
      window.removeEventListener('popstate', handlePopstate)
    }
  }, [])

  const goToDashboard = () => {
    if (!getAccessToken()) {
      navigateTo('/login')
      setPage('login')
      return
    }

    navigateTo('/dashboard')
    setPage('dashboard')
  }

  const goToLogin = (replace = false) => {
    navigateTo('/login', replace)
    setPage('login')
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">
              Loading...
            </div>
          }
        >
          {page === 'login' ? (
            <LoginPage onBackToDashboard={goToDashboard} onLoginSuccess={goToDashboard} />
          ) : (
            <DashboardShell onLogout={goToLogin} />
          )}
        </Suspense>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App

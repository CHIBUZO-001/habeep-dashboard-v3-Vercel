import { Sparkles } from 'lucide-react'
import { Suspense, lazy, useEffect, useMemo, useState } from 'react'

import { findMenuById, findMenuIdByHref, getDefaultMenuId } from '../../data/sidebar-menus'
import { cn } from '../../lib/cn'
import { getApiErrorMessage } from '../../lib/http-client'
import { clearSession, getSession } from '../../lib/session'
import { logout as requestLogout } from '../../services'
import { ErrorStatePage } from '../errors/error-state-page'
import { errorPageByCode, type AppErrorCode } from '../errors/error-page-config'
import { AutomationAssistantModal } from '../overlays/automation-assistant-modal'
import { GlobalSearchModal } from '../overlays/global-search-modal'
import { NotificationsDrawer, type DashboardNotification } from '../overlays/notifications-drawer'
import { useToast } from '../ui/toast-provider'
import { DashboardSidebar } from './dashboard-sidebar'
import { DashboardTopbar, type ProfileAction } from './dashboard-topbar'

const DashboardOverview = lazy(() =>
  import('./dashboard-overview').then((module) => ({ default: module.DashboardOverview })),
)
const DashboardActivityLogs = lazy(() =>
  import('./dashboard-activity-logs').then((module) => ({ default: module.DashboardActivityLogs })),
)
const DashboardUserManagement = lazy(() =>
  import('./dashboard-user-management').then((module) => ({ default: module.DashboardUserManagement })),
)
const DashboardProperties = lazy(() =>
  import('./dashboard-properties').then((module) => ({ default: module.DashboardProperties })),
)
const DashboardFinances = lazy(() =>
  import('./dashboard-finances').then((module) => ({ default: module.DashboardFinances })),
)
const DashboardPerformance = lazy(() =>
  import('./dashboard-performance').then((module) => ({ default: module.DashboardPerformance })),
)
const DashboardTasks = lazy(() =>
  import('./dashboard-tasks').then((module) => ({ default: module.DashboardTasks })),
)
const DashboardCalendar = lazy(() =>
  import('./dashboard-calendar').then((module) => ({ default: module.DashboardCalendar })),
)
const DashboardPost = lazy(() =>
  import('./dashboard-post').then((module) => ({ default: module.DashboardPost })),
)
const DashboardBlog = lazy(() =>
  import('./dashboard-blog').then((module) => ({ default: module.DashboardBlog })),
)

const SIDEBAR_STORAGE_KEY = 'habeep-sidebar-open'

function getPathWithSearch() {
  if (typeof window === 'undefined') {
    return ''
  }

  return `${window.location.pathname}${window.location.search}`
}

function resolveMenuIdFromLocation() {
  if (typeof window === 'undefined') {
    return getDefaultMenuId()
  }

  const fullPath = getPathWithSearch()
  return findMenuIdByHref(fullPath) ?? findMenuIdByHref(window.location.pathname) ?? getDefaultMenuId()
}

function navigateTo(path: string, replace = false) {
  if (typeof window === 'undefined') {
    return
  }

  const currentPath = getPathWithSearch()
  if (currentPath === path) {
    return
  }

  if (replace) {
    window.history.replaceState({}, '', path)
    return
  }

  window.history.pushState({}, '', path)
}

function getInitialErrorCode(): AppErrorCode | null {
  if (typeof window === 'undefined') {
    return null
  }

  const errorParam = new URLSearchParams(window.location.search).get('error')
  if (errorParam && errorParam in errorPageByCode) {
    return errorParam as AppErrorCode
  }

  return null
}

function clearErrorQueryParam() {
  if (typeof window === 'undefined') {
    return
  }

  const url = new URL(window.location.href)
  if (!url.searchParams.has('error')) {
    return
  }
  url.searchParams.delete('error')
  window.history.replaceState({}, '', url.toString())
}

function getDashboardUser() {
  const sessionUser = getSession()?.user
  const source =
    sessionUser && typeof sessionUser === 'object' && !Array.isArray(sessionUser)
      ? (sessionUser as Record<string, unknown>)
      : null

  const emailCandidate = typeof source?.email === 'string' ? source.email.trim() : ''
  const nameCandidate =
    typeof source?.name === 'string'
      ? source.name
      : typeof source?.fullName === 'string'
        ? source.fullName
        : undefined
  const derivedNameFromEmail = emailCandidate
    ? emailCandidate.split('@')[0]?.replace(/[._-]+/g, ' ').trim()
    : ''
  const roleCandidate =
    typeof source?.role === 'string'
      ? source.role
      : typeof source?.position === 'string'
        ? source.position
        : undefined

  const name = nameCandidate?.trim() || derivedNameFromEmail || 'Authenticated User'
  const role = roleCandidate === 'super_admin' ? 'super_admin' : 'admin'

  return { name, role } as const
}

function getInitialSidebarState() {
  if (typeof window === 'undefined') {
    return true
  }

  const savedState = window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
  if (savedState === 'true') {
    return true
  }
  if (savedState === 'false') {
    return false
  }
  return true
}

type DashboardShellProps = {
  onLogout: () => void
}

function DashboardRouteFallback({ label }: { label: string }) {
  return (
    <section className="dashboard-enter dashboard-enter-delay-1 rounded-2xl border border-slate-200/90 bg-white/80 p-6 text-sm shadow-sm shadow-slate-900/5 ring-1 ring-white/80 dark:border-slate-800/90 dark:bg-slate-900/80 dark:ring-slate-800/80">
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Loading {label}...</p>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Preparing the dashboard module.</p>
    </section>
  )
}

export function DashboardShell({ onLogout }: DashboardShellProps) {
  const dashboardUser = useMemo(getDashboardUser, [])
  const [desktopExpanded, setDesktopExpanded] = useState(getInitialSidebarState)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [automationModalOpen, setAutomationModalOpen] = useState(false)
  const [activeId, setActiveId] = useState(resolveMenuIdFromLocation)
  const [appErrorCode, setAppErrorCode] = useState<AppErrorCode | null>(getInitialErrorCode)
  const [notifications, setNotifications] = useState<DashboardNotification[]>([])
  const { toast } = useToast()

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(desktopExpanded))
  }, [desktopExpanded])

  useEffect(() => {
    const handleKeyboardShortcuts = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault()
        setDesktopExpanded((previousState) => !previousState)
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }

      if (event.key === 'Escape') {
        setMobileOpen(false)
        setSearchOpen(false)
        setNotificationsOpen(false)
        setAutomationModalOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyboardShortcuts)
    return () => {
      window.removeEventListener('keydown', handleKeyboardShortcuts)
    }
  }, [])

  const hasOverlayOpen = mobileOpen || searchOpen || notificationsOpen || automationModalOpen

  useEffect(() => {
    document.body.style.overflow = hasOverlayOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [hasOverlayOpen])

  useEffect(() => {
    const handlePopstate = () => {
      setActiveId(resolveMenuIdFromLocation())
      setAppErrorCode(getInitialErrorCode())
    }

    window.addEventListener('popstate', handlePopstate)
    return () => {
      window.removeEventListener('popstate', handlePopstate)
    }
  }, [])

  const activeMenu = useMemo(() => findMenuById(activeId), [activeId])
  const activeGroupLabel = activeMenu?.groupLabel ?? 'Platform'
  const activeLabel = activeMenu?.child?.label ?? activeMenu?.item.label ?? 'Dashboard'
  const activeRoute = activeMenu?.child?.href ?? activeMenu?.item.href ?? '/dashboard'
  const isOverviewDashboardPage = activeRoute === '/dashboard/overview'
  const isActivityLogsPage = activeRoute === '/dashboard/activity-logs'
  const isUserManagementUsersPage = activeRoute === '/dashboard/user-management/users'
  const isUserManagementTenantsPage = activeRoute === '/dashboard/user-management/tenants'
  const isUserManagementAgentsPage = activeRoute === '/dashboard/user-management/agents'
  const isUserManagementLandlordsPage = activeRoute === '/dashboard/user-management/landlords'
  const isPropertiesOverviewPage = activeRoute === '/dashboard/properties'
  const isPropertiesAnalyticsPage = activeRoute === '/dashboard/properties/analytics'
  const isFinancesRevenuePage = activeRoute === '/dashboard/finances'
  const isFinancesWalletPage = activeRoute === '/dashboard/finances/wallet'
  const isFinancesLoansPage = activeRoute === '/dashboard/finances/loans'
  const isFinancesOfflineDepositsPage = activeRoute === '/dashboard/finances/offline-deposits'
  const isPerformancePage = activeRoute === '/dashboard/performance'
  const isTasksPage = activeRoute === '/dashboard/tasks'
  const isCalendarPage = activeRoute === '/dashboard/calendar'
  const isPostPage = activeRoute === '/dashboard/post'
  const isBlogPage = activeRoute === '/dashboard/blog'
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  )
  const activeErrorPage = appErrorCode ? errorPageByCode[appErrorCode] : null

  const handleMenuSelect = (menuId: string) => {
    const nextMenu = findMenuById(menuId)
    const nextRoute = nextMenu?.child?.href ?? nextMenu?.item.href

    setActiveId(menuId)
    setAppErrorCode(null)
    clearErrorQueryParam()

    if (nextRoute) {
      navigateTo(nextRoute)
    }
  }

  const handleProfileAction = async (action: ProfileAction) => {
    if (action === 'settings') {
      handleMenuSelect('settings-general')
      toast({
        variant: 'info',
        title: 'Settings opened',
        description: 'Navigated to general settings.',
      })
      return
    }

    if (action === 'users') {
      handleMenuSelect('user-management-users')
      toast({
        variant: 'info',
        title: 'User Management opened',
        description: 'Navigated to user management.',
      })
      return
    }

    try {
      await requestLogout(getSession()?.sessionId)
      toast({
        variant: 'success',
        title: 'Logged out',
        description: 'Your session has been ended successfully.',
      })
    } catch (error) {
      toast({
        variant: 'warning',
        title: 'Logout request failed',
        description: getApiErrorMessage(error, 'Session was cleared locally.'),
      })
    } finally {
      clearSession()
      onLogout()
    }
  }

  const markNotificationRead = (id: string) => {
    setNotifications((previousState) =>
      previousState.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    )
  }

  const markAllNotificationsRead = () => {
    setNotifications((previousState) =>
      previousState.map((notification) => ({ ...notification, read: true })),
    )
    toast({
      variant: 'success',
      title: 'Notifications updated',
      description: 'All notifications marked as read.',
    })
  }

  const clearAllNotifications = () => {
    setNotifications([])
    toast({
      variant: 'success',
      title: 'Notifications cleared',
      description: 'Notification list has been cleared.',
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <DashboardSidebar
        desktopExpanded={desktopExpanded}
        mobileOpen={mobileOpen}
        activeId={activeId}
        user={dashboardUser}
        onSelect={handleMenuSelect}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={cn('min-h-screen transition-[padding] duration-300', desktopExpanded ? 'md:pl-72' : 'md:pl-20')}>
        <DashboardTopbar
          activeGroupLabel={activeGroupLabel}
          activeLabel={activeLabel}
          desktopExpanded={desktopExpanded}
          unreadCount={unreadCount}
          user={dashboardUser}
          onToggleDesktopSidebar={() => setDesktopExpanded((previousState) => !previousState)}
          onOpenMobileSidebar={() => setMobileOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenNotifications={() => setNotificationsOpen(true)}
          onProfileAction={handleProfileAction}
        />

        <div className="px-1 pb-4 md:px-6 md:pb-6">
          <main className="relative mt-3 overflow-hidden rounded-[1.75rem] border border-slate-200/90 bg-white/65 p-2 shadow-2xl shadow-slate-900/10 ring-1 ring-white/80 backdrop-blur-sm transition-colors dark:border-slate-800/90 dark:bg-slate-900/60 dark:ring-slate-800/80 md:mt-4 md:p-6">
            <div className="pointer-events-none absolute -right-24 -top-20 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl dark:bg-blue-500/15" />
            <div className="pointer-events-none absolute -left-24 bottom-[-6rem] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-500/10" />

            <div className="relative z-[1] space-y-6">
              {activeErrorPage ? (
                <div className="dashboard-enter">
                  <ErrorStatePage
                    code={activeErrorPage.code}
                    title={activeErrorPage.title}
                    message={activeErrorPage.message}
                    hint={activeErrorPage.hint}
                    onPrimaryAction={() => {
                      setAppErrorCode(null)
                      clearErrorQueryParam()
                      handleMenuSelect(getDefaultMenuId())
                    }}
                    onSecondaryAction={() => {
                      setAppErrorCode(null)
                      clearErrorQueryParam()
                      window.history.back()
                    }}
                  />
                </div>
              ) : (
                <>
                  <section className="dashboard-enter rounded-2xl border border-blue-200/55 bg-gradient-to-r from-blue-600 to-cyan-500 p-5 text-white shadow-xl shadow-blue-900/25 dark:border-blue-900/50">
                    <div className="flex flex-col gap-4">
                      <div className="min-w-0">
                        <p className="text-sm text-white/85">Current workspace</p>
                        <div className="mt-1 flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h2 className="truncate text-xl font-semibold sm:text-2xl">{activeLabel}</h2>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAutomationModalOpen(true)}
                            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-sm font-medium backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white/25"
                          >
                            <Sparkles className="h-4 w-4" />
                            New automation
                          </button>
                        </div>
                        <p className="mt-2 text-sm text-white/90">
                          Route: <span className="font-mono">{activeRoute}</span>
                        </p>
                        <p className="mt-1 text-xs text-white/80">
                          Owner: {dashboardUser.name} · Role: {dashboardUser.role.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 hidden flex-wrap gap-2 text-xs md:flex">
                      <span className="rounded-lg border border-white/25 bg-white/10 px-2.5 py-1 text-white/90 backdrop-blur">
                        Group: {activeGroupLabel}
                      </span>
                      <span className="rounded-lg border border-white/25 bg-white/10 px-2.5 py-1 text-white/90 backdrop-blur">
                        Notifications: {unreadCount}
                      </span>
                      <span className="rounded-lg border border-white/25 bg-white/10 px-2.5 py-1 text-white/90 backdrop-blur">
                        Sidebar: {desktopExpanded ? 'Expanded' : 'Collapsed'}
                      </span>
                      <span className="rounded-lg border border-white/25 bg-white/10 px-2.5 py-1 text-white/90 backdrop-blur">
                        Shortcut: Ctrl/Cmd + K
                      </span>
                      <span className="rounded-lg border border-white/25 bg-white/10 px-2.5 py-1 text-white/90 backdrop-blur">
                        Collapse: Ctrl/Cmd + B
                      </span>
                    </div>
                  </section>

                  <Suspense fallback={<DashboardRouteFallback label={activeLabel} />}>
                    {isOverviewDashboardPage ? (
                      <DashboardOverview />
                    ) : isActivityLogsPage ? (
                      <DashboardActivityLogs />
                    ) : isUserManagementUsersPage ? (
                      <DashboardUserManagement section="users" />
                    ) : isUserManagementTenantsPage ? (
                      <DashboardUserManagement section="tenants" />
                    ) : isUserManagementAgentsPage ? (
                      <DashboardUserManagement section="agents" />
                    ) : isUserManagementLandlordsPage ? (
                      <DashboardUserManagement section="landlords" />
                    ) : isPropertiesOverviewPage ? (
                      <DashboardProperties section="overview" />
                    ) : isPropertiesAnalyticsPage ? (
                      <DashboardProperties section="analytics" />
                    ) : isFinancesRevenuePage ? (
                      <DashboardFinances section="revenue" />
                    ) : isFinancesWalletPage ? (
                      <DashboardFinances section="wallet" />
                    ) : isFinancesLoansPage ? (
                      <DashboardFinances section="loans" />
                    ) : isFinancesOfflineDepositsPage ? (
                      <DashboardFinances section="offline-deposits" />
                    ) : isPerformancePage ? (
                      <DashboardPerformance />
                    ) : isTasksPage ? (
                      <DashboardTasks />
                    ) : isCalendarPage ? (
                      <DashboardCalendar />
                    ) : isPostPage ? (
                      <DashboardPost />
                    ) : isBlogPage ? (
                      <DashboardBlog />
                    ) : (
                      <section className="dashboard-enter dashboard-enter-delay-1 rounded-2xl border border-slate-200/90 bg-white/80 p-6 text-sm shadow-sm shadow-slate-900/5 ring-1 ring-white/80 dark:border-slate-800/90 dark:bg-slate-900/80 dark:ring-slate-800/80">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{activeLabel}</h3>
                        <p className="mt-2 text-slate-600 dark:text-slate-300">
                          This module shell is ready. Plug in the specific API endpoints and UI widgets for this page
                          next.
                        </p>
                      </section>
                    )}
                  </Suspense>
                </>
              )}
            </div>
          </main>
        </div>
      </div>

      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} onNavigateToMenu={handleMenuSelect} />
      <AutomationAssistantModal
        open={automationModalOpen}
        workspace={activeLabel}
        route={activeRoute}
        onClose={() => setAutomationModalOpen(false)}
      />
      <NotificationsDrawer
        open={notificationsOpen}
        notifications={notifications}
        onClose={() => setNotificationsOpen(false)}
        onMarkRead={markNotificationRead}
        onMarkAllRead={markAllNotificationsRead}
        onClearAll={clearAllNotifications}
      />
    </div>
  )
}

import { Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { findMenuById, getDefaultMenuId } from '../../data/sidebar-menus'
import { cn } from '../../lib/cn'
import { getApiErrorMessage } from '../../lib/http-client'
import { clearSession, getSession } from '../../lib/session'
import { logout as requestLogout } from '../../services'
import { ErrorStatePage } from '../errors/error-state-page'
import { GlobalSearchModal } from '../overlays/global-search-modal'
import { NotificationsDrawer, type DashboardNotification } from '../overlays/notifications-drawer'
import { useToast } from '../ui/toast-provider'
import { DashboardOverview } from './dashboard-overview'
import { DashboardSidebar } from './dashboard-sidebar'
import { DashboardTopbar, type ProfileAction } from './dashboard-topbar'

const SIDEBAR_STORAGE_KEY = 'habeep-sidebar-open'

const errorPageByCode = {
  '404': {
    code: '404',
    title: 'Page Not Found',
    message: 'The page you are trying to access does not exist in this workspace.',
    hint: 'It may have been moved, renamed, or is not available to your role.',
  },
  '401': {
    code: '401',
    title: 'Unauthorized',
    message: 'You are not authenticated for this request.',
    hint: 'Please sign in again to continue.',
  },
  '403': {
    code: '403',
    title: 'Access Forbidden',
    message: 'Your current role does not have permission to view this resource.',
    hint: 'Contact a super admin to request access.',
  },
  '500': {
    code: '500',
    title: 'Server Error',
    message: 'Something went wrong while processing this request.',
    hint: 'Try again shortly. If it persists, contact engineering.',
  },
} as const

type AppErrorCode = keyof typeof errorPageByCode

function getInitialErrorCode(): AppErrorCode | null {
  if (typeof window === 'undefined') {
    return null
  }

  const errorParam = new URLSearchParams(window.location.search).get('error')
  if (errorParam === '401' || errorParam === '403' || errorParam === '404' || errorParam === '500') {
    return errorParam
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

const dashboardUser = {
  name: 'Habeep Dashboard',
  role: 'super_admin' as const,
}

const initialNotifications: DashboardNotification[] = [
  {
    id: 'n-1',
    title: 'High-risk reservation detected',
    message: 'Reservation #R-2931 requires compliance review.',
    timestamp: '2m ago',
    read: false,
    type: 'critical',
  },
  {
    id: 'n-2',
    title: 'Payout approved',
    message: 'Finance approved ₦480,000 host payout batch.',
    timestamp: '11m ago',
    read: false,
    type: 'update',
  },
  {
    id: 'n-3',
    title: 'Reminder',
    message: '2 operator accounts are pending role assignment.',
    timestamp: '40m ago',
    read: true,
    type: 'warning',
  },
]

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

export function DashboardShell({ onLogout }: DashboardShellProps) {
  const [desktopExpanded, setDesktopExpanded] = useState(getInitialSidebarState)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [activeId, setActiveId] = useState(getDefaultMenuId)
  const [appErrorCode, setAppErrorCode] = useState<AppErrorCode | null>(getInitialErrorCode)
  const [notifications, setNotifications] = useState(initialNotifications)
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
      }
    }

    window.addEventListener('keydown', handleKeyboardShortcuts)
    return () => {
      window.removeEventListener('keydown', handleKeyboardShortcuts)
    }
  }, [])

  const hasOverlayOpen = mobileOpen || searchOpen || notificationsOpen

  useEffect(() => {
    document.body.style.overflow = hasOverlayOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [hasOverlayOpen])

  const activeMenu = useMemo(() => findMenuById(activeId), [activeId])
  const activeGroupLabel = activeMenu?.groupLabel ?? 'Platform'
  const activeLabel = activeMenu?.child?.label ?? activeMenu?.item.label ?? 'Dashboard'
  const activeRoute = activeMenu?.child?.href ?? activeMenu?.item.href ?? '/dashboard'
  const isOverviewPage = activeMenu?.item.id === 'overview'
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  )
  const activeErrorPage = appErrorCode ? errorPageByCode[appErrorCode] : null

  const handleMenuSelect = (menuId: string) => {
    setActiveId(menuId)
    setAppErrorCode(null)
    clearErrorQueryParam()
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
      handleMenuSelect('settings-users')
      toast({
        variant: 'info',
        title: 'User Management opened',
        description: 'Navigated to users and permissions.',
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

        <div className="px-3 pb-4 md:px-6 md:pb-6">
          <main className="relative mt-3 overflow-hidden rounded-[1.75rem] border border-slate-200/90 bg-white/65 p-4 shadow-2xl shadow-slate-900/10 ring-1 ring-white/80 backdrop-blur-sm transition-colors dark:border-slate-800/90 dark:bg-slate-900/60 dark:ring-slate-800/80 md:mt-4 md:p-6">
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
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-white/85">Current workspace</p>
                        <h2 className="mt-1 text-2xl font-semibold">{activeLabel}</h2>
                        <p className="mt-2 text-sm text-white/90">
                          Route: <span className="font-mono">{activeRoute}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-sm font-medium backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white/25"
                      >
                        <Sparkles className="h-4 w-4" />
                        New automation
                      </button>
                    </div>
                  </section>

                  {isOverviewPage ? (
                    <DashboardOverview />
                  ) : (
                    <section className="dashboard-enter dashboard-enter-delay-1 rounded-2xl border border-slate-200/90 bg-white/80 p-6 text-sm shadow-sm shadow-slate-900/5 ring-1 ring-white/80 dark:border-slate-800/90 dark:bg-slate-900/80 dark:ring-slate-800/80">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{activeLabel}</h3>
                      <p className="mt-2 text-slate-600 dark:text-slate-300">
                        This module shell is ready. Plug in the specific API endpoints and UI widgets for this page
                        next.
                      </p>
                    </section>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>

      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} onNavigateToMenu={handleMenuSelect} />
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

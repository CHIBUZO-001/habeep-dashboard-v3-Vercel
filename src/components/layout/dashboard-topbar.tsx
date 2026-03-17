import {
  Bell,
  ChevronDown,
  ChevronRight,
  Command,
  Menu,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Search,
  Settings,
  Users,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import brandLogo from '../../assets/logo.png'
import { cn } from '../../lib/cn'
import { ThemeToggle } from '../theme/theme-toggle'

export type ProfileAction = 'settings' | 'users' | 'logout'

type DashboardUser = {
  name: string
  role: 'admin' | 'super_admin'
}

type DashboardTopbarProps = {
  activeGroupLabel: string
  activeLabel: string
  desktopExpanded: boolean
  unreadCount: number
  user: DashboardUser
  onToggleDesktopSidebar: () => void
  onOpenMobileSidebar: () => void
  onOpenSearch: () => void
  onOpenAutomation: () => void
  onOpenNotifications: () => void
  onProfileAction: (action: ProfileAction) => void
}

export function DashboardTopbar({
  activeGroupLabel,
  activeLabel,
  desktopExpanded,
  unreadCount,
  user,
  onToggleDesktopSidebar,
  onOpenMobileSidebar,
  onOpenSearch,
  onOpenAutomation,
  onOpenNotifications,
  onProfileAction,
}: DashboardTopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) {
      return
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [menuOpen])

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 md:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 md:hidden"
            onClick={onOpenMobileSidebar}
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="inline-flex h-10 items-center rounded-xl bg-gradient-to-br from-blue-600/15 to-cyan-500/20 px-2.5 md:hidden">
            <img src={brandLogo} alt="Habeep logo" className="h-7 w-auto object-contain" />
          </div>

          <button
            type="button"
            className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 md:inline-flex"
            onClick={onToggleDesktopSidebar}
            aria-label={desktopExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {desktopExpanded ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>

          <div className="hidden min-w-0 md:block">
            <p className="hidden items-center gap-2 text-xs text-slate-500 dark:text-slate-400 md:flex">
              <span>{activeGroupLabel}</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="truncate">{activeLabel}</span>
            </p>
            <h1 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100 md:text-lg">{activeLabel}</h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          <button
            type="button"
            onClick={onOpenSearch}
            className="hidden h-10 min-w-[17rem] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-left transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 lg:flex"
            aria-label="Open global search"
          >
            <Search className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-500 dark:text-slate-300">Search dashboards...</span>
            <kbd className="ml-auto inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              <Command className="h-3 w-3" />K
            </kbd>
          </button>

          <button
            type="button"
            onClick={onOpenSearch}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 lg:hidden"
            aria-label="Open search"
          >
            <Search className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onOpenAutomation}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="New automation"
            title="New automation"
          >
            <Sparkles className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Open notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </button>

          <ThemeToggle />

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((previousState) => !previousState)}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-1.5 py-1.5 text-left transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 md:px-2"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Open profile menu"
              title="Habeep Dashboard"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-xs font-semibold text-white">
                HD
              </span>
              <ChevronDown className="hidden h-4 w-4 text-slate-500 dark:text-slate-400 md:block" />
            </button>

            <div
              className={cn(
                'absolute right-0 top-12 z-50 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl transition-all dark:border-slate-800 dark:bg-slate-900',
                menuOpen ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0',
              )}
              role="menu"
              aria-label="Profile actions"
            >
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600/15 to-cyan-500/20">
                    <img src={brandLogo} alt="Habeep logo" className="h-5 w-auto object-contain" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                    <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{user.role.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                onClick={() => {
                  onProfileAction('settings')
                  setMenuOpen(false)
                }}
                role="menuitem"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>

              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                onClick={() => {
                  onProfileAction('users')
                  setMenuOpen(false)
                }}
                role="menuitem"
              >
                <Users className="h-4 w-4" />
                User Management
              </button>

              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40"
                onClick={() => {
                  onProfileAction('logout')
                  setMenuOpen(false)
                }}
                role="menuitem"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CircleAlert,
  Info,
  Megaphone,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react'

import { cn } from '../../lib/cn'

export type DashboardNotification = {
  id: string
  title: string
  message: string
  timestamp: string
  read: boolean
  type: 'info' | 'warning' | 'critical' | 'update'
}

type NotificationsDrawerProps = {
  open: boolean
  notifications: DashboardNotification[]
  onClose: () => void
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  onClearAll: () => void
}

function NotificationTypeIcon({ type }: { type: DashboardNotification['type'] }) {
  if (type === 'critical') {
    return <ShieldAlert className="h-4 w-4 text-rose-500" />
  }
  if (type === 'warning') {
    return <AlertTriangle className="h-4 w-4 text-amber-500" />
  }
  if (type === 'update') {
    return <Megaphone className="h-4 w-4 text-blue-500" />
  }
  return <Info className="h-4 w-4 text-cyan-500" />
}

export function NotificationsDrawer({
  open,
  notifications,
  onClose,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
}: NotificationsDrawerProps) {
  const unreadCount = notifications.filter((notification) => !notification.read).length

  return (
    <div className={cn('fixed inset-0 z-[65] transition', open ? 'pointer-events-auto' : 'pointer-events-none')}>
      <div
        className={cn(
          'absolute inset-0 cursor-pointer bg-slate-950/40 transition-opacity',
          open ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'absolute right-0 top-0 h-full w-full max-w-md border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 dark:border-slate-800 dark:bg-slate-900',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        aria-label="Notification panel"
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-blue-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</h2>
            {unreadCount > 0 ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
                {unreadCount}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Close notifications"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <button
            type="button"
            onClick={onMarkAllRead}
            className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear all
          </button>
        </div>

        <div className="h-[calc(100%-7rem)] overflow-y-auto p-2">
          {notifications.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400">
              <CircleAlert className="mb-2 h-6 w-6" />
              <p className="text-sm">No notifications available.</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    className={cn(
                      'w-full rounded-xl border px-3 py-2 text-left transition-colors',
                      notification.read
                        ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60'
                        : 'border-blue-200 bg-blue-50 text-slate-800 hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-slate-100 dark:hover:bg-blue-950/50',
                    )}
                    onClick={() => {
                      if (!notification.read) {
                        onMarkRead(notification.id)
                      }
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5">
                        <NotificationTypeIcon type={notification.type} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{notification.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{notification.message}</p>
                        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">{notification.timestamp}</p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  )
}

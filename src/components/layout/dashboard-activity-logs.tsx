import {
  Clock3,
  Filter,
  Laptop,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldX,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { cn } from '../../lib/cn'
import { getApiErrorMessage } from '../../lib/http-client'
import { listAuthSessions, type AuthSessionLog } from '../../services'
import { useToast } from '../ui/toast-provider'

const numberFormatter = new Intl.NumberFormat('en-NG')

const surfaceCardClass =
  'rounded-2xl border border-slate-200/85 bg-white/90 p-4 shadow-sm shadow-slate-900/5 ring-1 ring-white/70 transition-colors dark:border-slate-800/80 dark:bg-slate-900/90 dark:ring-slate-800/80'

type ActivityStatus = 'active' | 'revoked' | 'current'

type ActivityRecord = {
  id: string
  sessionId: string
  action: string
  status: ActivityStatus
  device: string
  ip: string
  occurredAt: string
  note: string
}

type StatusFilter = 'all' | ActivityStatus

function parseTime(value: string) {
  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) {
    return 0
  }
  return timestamp
}

function formatDateTime(value: string) {
  const timestamp = parseTime(value)
  if (timestamp === 0) {
    return 'Unknown time'
  }

  return new Date(timestamp).toLocaleString('en-NG', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRelativeTime(value: string) {
  const timestamp = parseTime(value)
  if (timestamp === 0) {
    return 'N/A'
  }

  const differenceMs = Date.now() - timestamp
  if (differenceMs < 60_000) {
    return 'just now'
  }

  const differenceMinutes = Math.floor(differenceMs / 60_000)
  if (differenceMinutes < 60) {
    return `${differenceMinutes}m ago`
  }

  const differenceHours = Math.floor(differenceMinutes / 60)
  if (differenceHours < 24) {
    return `${differenceHours}h ago`
  }

  const differenceDays = Math.floor(differenceHours / 24)
  if (differenceDays < 30) {
    return `${differenceDays}d ago`
  }

  const differenceMonths = Math.floor(differenceDays / 30)
  if (differenceMonths < 12) {
    return `${differenceMonths}mo ago`
  }

  const differenceYears = Math.floor(differenceMonths / 12)
  return `${differenceYears}y ago`
}

function normalizeIp(ip: string) {
  return ip.replace('::ffff:', '')
}

function normalizeDeviceName(device: string) {
  if (!device.trim()) {
    return 'unknown'
  }
  return device.trim().toLowerCase()
}

function buildActivityRecords(sessions: AuthSessionLog[]) {
  const records: ActivityRecord[] = []

  for (const session of sessions) {
    const createdAt = session.createdAt || session.updatedAt
    const updatedAt = session.updatedAt || session.createdAt
    const normalizedDevice = normalizeDeviceName(session.device)

    if (createdAt) {
      records.push({
        id: `${session.id}-start`,
        sessionId: session.id,
        action: 'Session started',
        status: session.current ? 'current' : 'active',
        device: normalizedDevice,
        ip: normalizeIp(session.ip),
        occurredAt: createdAt,
        note: session.current ? 'Current authenticated browser session.' : 'Authenticated session established.',
      })
    }

    if (!session.active && updatedAt && updatedAt !== createdAt) {
      records.push({
        id: `${session.id}-revoked`,
        sessionId: session.id,
        action: 'Session revoked',
        status: 'revoked',
        device: normalizedDevice,
        ip: normalizeIp(session.ip),
        occurredAt: updatedAt,
        note: 'Session was revoked or logged out.',
      })
    }
  }

  return records.sort((leftRecord, rightRecord) => parseTime(rightRecord.occurredAt) - parseTime(leftRecord.occurredAt))
}

export function DashboardActivityLogs() {
  const [sessions, setSessions] = useState<AuthSessionLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [deviceFilter, setDeviceFilter] = useState('all')
  const { toast } = useToast()

  const loadActivityLogs = useCallback(
    async (showErrorToast = false) => {
      setIsLoading(true)
      try {
        const nextSessions = await listAuthSessions()
        setSessions(nextSessions)
        setErrorMessage(null)
      } catch (error) {
        const message = getApiErrorMessage(error, 'Failed to load activity logs.')
        setErrorMessage(message)
        if (showErrorToast) {
          toast({
            variant: 'error',
            title: 'Activity logs unavailable',
            description: message,
          })
        }
      } finally {
        setIsLoading(false)
      }
    },
    [toast],
  )

  useEffect(() => {
    void loadActivityLogs()
  }, [loadActivityLogs])

  const summary = useMemo(() => {
    const activeCount = sessions.filter((session) => session.active).length
    const revokedCount = sessions.filter((session) => !session.active).length
    const currentCount = sessions.filter((session) => session.current).length

    return {
      total: sessions.length,
      active: activeCount,
      revoked: revokedCount,
      current: currentCount,
    }
  }, [sessions])

  const activityRecords = useMemo(() => buildActivityRecords(sessions), [sessions])

  const availableDevices = useMemo(() => {
    const devices = new Set<string>()
    for (const session of sessions) {
      devices.add(normalizeDeviceName(session.device))
    }
    return Array.from(devices).sort((leftDevice, rightDevice) => leftDevice.localeCompare(rightDevice))
  }, [sessions])

  const filteredRecords = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return activityRecords.filter((record) => {
      if (statusFilter !== 'all' && record.status !== statusFilter) {
        return false
      }

      if (deviceFilter !== 'all' && record.device !== deviceFilter) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      return [
        record.action,
        record.sessionId,
        record.device,
        record.ip,
        record.note,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    })
  }, [activityRecords, deviceFilter, searchQuery, statusFilter])

  return (
    <div className="space-y-4">
      {errorMessage ? (
        <section className={surfaceCardClass}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-300">Activity logs unavailable</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => void loadActivityLogs(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
              Retry
            </button>
          </div>
        </section>
      ) : null}

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <article className={surfaceCardClass}>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Sessions</p>
          <p className="mt-2 text-2xl font-semibold">{numberFormatter.format(summary.total)}</p>
        </article>
        <article className={surfaceCardClass}>
          <p className="text-sm text-slate-500 dark:text-slate-400">Active Sessions</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600 dark:text-emerald-300">
            {numberFormatter.format(summary.active)}
          </p>
        </article>
        <article className={surfaceCardClass}>
          <p className="text-sm text-slate-500 dark:text-slate-400">Revoked Sessions</p>
          <p className="mt-2 text-2xl font-semibold text-rose-600 dark:text-rose-300">
            {numberFormatter.format(summary.revoked)}
          </p>
        </article>
        <article className={surfaceCardClass}>
          <p className="text-sm text-slate-500 dark:text-slate-400">Current Sessions</p>
          <p className="mt-2 text-2xl font-semibold text-blue-600 dark:text-blue-300">
            {numberFormatter.format(summary.current)}
          </p>
        </article>
      </section>

      <section className={surfaceCardClass}>
        <header className="mb-4 flex items-start justify-between gap-3 sm:items-center">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Activity Timeline</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Derived from sessions list.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadActivityLogs(true)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white p-0 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:w-auto sm:px-3"
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            <span className="sr-only sm:not-sr-only">Refresh</span>
          </button>
        </header>

        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              type="text"
              placeholder="Search by session ID, IP, action, or device"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500"
            />
          </label>

          <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 transition-colors focus-within:border-blue-400 focus-within:bg-blue-50/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus-within:border-blue-500 dark:focus-within:bg-blue-950/20">
            <Filter className="h-4 w-4" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="rounded-md bg-slate-50 px-2 py-1 text-sm font-medium text-slate-900 outline-none transition-colors hover:bg-slate-100 focus:bg-white dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="current">Current</option>
              <option value="active">Active</option>
              <option value="revoked">Revoked</option>
            </select>
          </label>

          <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 transition-colors focus-within:border-blue-400 focus-within:bg-blue-50/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus-within:border-blue-500 dark:focus-within:bg-blue-950/20">
            <Laptop className="h-4 w-4" />
            <select
              value={deviceFilter}
              onChange={(event) => setDeviceFilter(event.target.value)}
              className="rounded-md bg-slate-50 px-2 py-1 text-sm font-medium text-slate-900 outline-none transition-colors hover:bg-slate-100 focus:bg-white dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700"
            >
              <option value="all">All Devices</option>
              {availableDevices.map((deviceName) => (
                <option key={deviceName} value={deviceName}>
                  {deviceName.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
        </div>

        {filteredRecords.length > 0 ? (
          <ul className="max-h-[640px] space-y-2 overflow-y-auto pr-1">
            {filteredRecords.map((record) => (
              <li
                key={record.id}
                className="rounded-xl border border-slate-200/80 bg-white/70 p-3 transition-colors hover:border-blue-200 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-blue-900/60"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{record.action}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{record.note}</p>
                    <p className="mt-1 truncate font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      session: {record.sessionId}
                    </p>
                  </div>

                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium',
                      record.status === 'revoked' && 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300',
                      record.status === 'active' && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
                      record.status === 'current' && 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300',
                    )}
                  >
                    {record.status === 'revoked' ? (
                      <ShieldX className="h-3 w-3" />
                    ) : (
                      <ShieldCheck className="h-3 w-3" />
                    )}
                    {record.status}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>IP: {record.ip}</span>
                  <span>Device: {record.device.toUpperCase()}</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3 w-3" />
                    {formatRelativeTime(record.occurredAt)}
                  </span>
                  <span>{formatDateTime(record.occurredAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {isLoading ? 'Loading activity logs...' : 'No activity records matched your filters.'}
          </div>
        )}
      </section>
    </div>
  )
}

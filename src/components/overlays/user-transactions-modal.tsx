import { ChevronLeft, ChevronRight, Clock, Loader2, RefreshCw, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '../../lib/cn'
import { getApiErrorMessage } from '../../lib/http-client'
import {
  getAdminUserTransactions,
  type AdminUserTransaction,
  type AdminUserTransactionRole,
  type AdminUserTransactions,
} from '../../services'
import { useToast } from '../ui/toast-provider'

const numberFormatter = new Intl.NumberFormat('en-NG')

function formatDateTime(value: string) {
  if (!value) {
    return '—'
  }

  const parsedTime = new Date(value)
  if (Number.isNaN(parsedTime.getTime())) {
    return value
  }

  return parsedTime.toLocaleString('en-NG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatReadableKey(value: string) {
  const normalized = value.replace(/_/g, ' ').trim()
  if (!normalized) {
    return 'Unknown'
  }

  return normalized
    .split(/\s+/g)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ')
}

function getTransactionStatusClasses(status: string) {
  const normalized = status.trim().toLowerCase()

  if (normalized === 'successful' || normalized === 'success') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300'
  }

  if (normalized === 'pending') {
    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300'
  }

  if (normalized === 'failed' || normalized === 'failure') {
    return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300'
  }

  return 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200'
}

type UserTransactionsModalProps = {
  open: boolean
  userId: string | null
  role: AdminUserTransactionRole
  title: string
  onClose: () => void
}

type PaginationItem = number | 'start-ellipsis' | 'end-ellipsis'

function buildPaginationItems(currentPage: number, totalPages: number, maxVisible = 7): PaginationItem[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (maxVisible <= 5) {
    if (currentPage <= 3) {
      return [1, 2, 3, 'end-ellipsis', totalPages]
    }

    if (currentPage >= totalPages - 2) {
      return [1, 'start-ellipsis', totalPages - 2, totalPages - 1, totalPages]
    }

    return [1, 'start-ellipsis', currentPage, 'end-ellipsis', totalPages]
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'end-ellipsis', totalPages]
  }

  if (currentPage >= totalPages - 3) {
    return [1, 'start-ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, 'start-ellipsis', currentPage - 1, currentPage, currentPage + 1, 'end-ellipsis', totalPages]
}

function normalizeRequestedRole(value: string | null | undefined): AdminUserTransactionRole | null {
  const normalized = value?.trim().toUpperCase()
  if (normalized === 'USER' || normalized === 'TENANT' || normalized === 'AGENT') {
    return normalized
  }
  return null
}

function buildSummaryEntries(summaryMap: Record<string, number>, preferredOrder: string[]) {
  const seen = new Set<string>()
  const entries: Array<{ key: string; value: number }> = []

  for (const key of preferredOrder) {
    if (Object.prototype.hasOwnProperty.call(summaryMap, key)) {
      seen.add(key)
      entries.push({ key, value: summaryMap[key] ?? 0 })
    }
  }

  for (const [key, value] of Object.entries(summaryMap)) {
    if (seen.has(key)) {
      continue
    }
    entries.push({ key, value })
  }

  return entries
}

function TransactionRow({ transaction }: { transaction: AdminUserTransaction }) {
  return (
    <li className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm shadow-slate-900/5 dark:border-slate-800/80 dark:bg-slate-950/30 dark:shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-slate-900 dark:text-slate-100">
            {transaction.description || transaction.type || 'Transaction'}
          </p>
          <p className="mt-1 break-words text-xs text-slate-500 dark:text-slate-400">
            {transaction.reference ? `Ref: ${transaction.reference}` : 'No reference'}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <span
            className={cn(
              'inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
              getTransactionStatusClasses(transaction.status),
            )}
          >
            {transaction.status || 'UNKNOWN'}
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
        <p className="flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {formatReadableKey(transaction.source || 'UNKNOWN')}
          </span>
          <span className="inline-flex rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {formatReadableKey(transaction.role || 'UNKNOWN')}
          </span>
          {transaction.type ? (
            <span className="inline-flex rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {formatReadableKey(transaction.type)}
            </span>
          ) : null}
        </p>

        <p className="flex flex-wrap items-center justify-end gap-3">
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {numberFormatter.format(transaction.amount)}
          </span>
          <span>{formatDateTime(transaction.createdAt)}</span>
        </p>
      </div>
    </li>
  )
}

export function UserTransactionsModal({ open, userId, role, title, onClose }: UserTransactionsModalProps) {
  const { toast } = useToast()
  const [details, setDetails] = useState<AdminUserTransactions | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)

  const perPage = 20

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    setDetails(null)
    setErrorMessage(null)
    setPage(1)
  }, [open, userId, role])

  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open || !userId) {
      return
    }

    let isActive = true
    setIsLoading(true)

    void (async () => {
      try {
        const nextDetails = await getAdminUserTransactions(userId, role, page, perPage)

        if (!isActive) {
          return
        }

        setDetails(nextDetails)
        setErrorMessage(null)
      } catch (error) {
        if (!isActive) {
          return
        }

        const message = getApiErrorMessage(error, 'Unable to load transaction history.')
        setErrorMessage(message)
        toast({
          variant: 'error',
          title: 'Transaction history unavailable',
          description: message,
        })
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      isActive = false
    }
  }, [open, page, perPage, refreshKey, role, toast, userId])

  const summaryByRole = useMemo(
    () => buildSummaryEntries(details?.summary.byRole ?? {}, ['USER', 'TENANT', 'AGENT']),
    [details?.summary.byRole],
  )

  const summaryBySource = useMemo(
    () => buildSummaryEntries(details?.summary.bySource ?? {}, ['WALLET', 'SAVINGS', 'SUDO']),
    [details?.summary.bySource],
  )

  if (!open) {
    return null
  }

  if (typeof document === 'undefined') {
    return null
  }

  const handleClose = () => {
    if (isLoading) {
      // Still allow closing, but avoid leaving stale loading UI around.
      setIsLoading(false)
    }

    onClose()
  }

  const pagination = details?.pagination ?? {
    page,
    perPage,
    total: details?.summary.total ?? 0,
    totalPages: 1,
  }

  const requestedRole = normalizeRequestedRole(details?.requestedRole) ?? role

  const canGoPrevious = pagination.page > 1 && !isLoading
  const canGoNext = pagination.page < pagination.totalPages && !isLoading
  const desktopPaginationItems = buildPaginationItems(pagination.page, pagination.totalPages, 7)
  const mobilePaginationItems = buildPaginationItems(pagination.page, pagination.totalPages, 5)

  return createPortal(
    <div className="fixed inset-0 z-[75] flex items-start justify-center p-0 sm:p-6">
      <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-[2px]" onClick={handleClose} aria-hidden="true" />

      <div
        className="relative z-[1] mt-4 flex max-h-[calc(90dvh-2rem)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:mt-8 sm:w-[min(94vw,60rem)]"
        role="dialog"
        aria-modal="true"
        aria-label="Transaction history"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600/20 to-cyan-500/20 text-blue-600 dark:text-blue-300">
              <Clock className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {userId ? `User ID: ${userId}` : 'User ID unavailable'} · Requested role: {requestedRole}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRefreshKey((previousKey) => previousKey + 1)}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm shadow-slate-900/5 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              disabled={!userId || isLoading}
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              aria-label="Close transaction history"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {!userId ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
              No user ID available for this record.
            </div>
          ) : errorMessage && !details ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
              <p className="font-semibold">Unable to load transactions</p>
              <p className="mt-2">{errorMessage}</p>
              <button
                type="button"
                onClick={() => setRefreshKey((previousKey) => previousKey + 1)}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          ) : (
            <>
              <section className="grid gap-3 md:grid-cols-3">
                <article className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Total
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    {numberFormatter.format(details?.summary.total ?? 0)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Page {numberFormatter.format(pagination.page)} of {numberFormatter.format(pagination.totalPages)}
                  </p>
                </article>

                <article className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    By Role
                  </p>
                  <dl className="mt-3 space-y-1 text-xs">
                    {summaryByRole.length === 0 ? (
                      <p className="text-slate-500 dark:text-slate-400">No role breakdown.</p>
                    ) : (
                      summaryByRole.map((entry) => (
                        <div key={entry.key} className="flex items-center justify-between gap-3">
                          <dt className="text-slate-500 dark:text-slate-400">{formatReadableKey(entry.key)}</dt>
                          <dd className="font-semibold text-slate-900 dark:text-slate-100">
                            {numberFormatter.format(entry.value)}
                          </dd>
                        </div>
                      ))
                    )}
                  </dl>
                </article>

                <article className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    By Source
                  </p>
                  <dl className="mt-3 space-y-1 text-xs">
                    {summaryBySource.length === 0 ? (
                      <p className="text-slate-500 dark:text-slate-400">No source breakdown.</p>
                    ) : (
                      summaryBySource.map((entry) => (
                        <div key={entry.key} className="flex items-center justify-between gap-3">
                          <dt className="text-slate-500 dark:text-slate-400">{formatReadableKey(entry.key)}</dt>
                          <dd className="font-semibold text-slate-900 dark:text-slate-100">
                            {numberFormatter.format(entry.value)}
                          </dd>
                        </div>
                      ))
                    )}
                  </dl>
                </article>
              </section>

              <section className="mt-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm shadow-slate-900/5 dark:border-slate-800/80 dark:bg-slate-950/30 dark:shadow-black/20">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Roles
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {details?.roles.user ? (
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        User
                      </span>
                    ) : null}
                    {details?.roles.tenant ? (
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        Tenant
                      </span>
                    ) : null}
                    {details?.roles.agent ? (
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        Agent
                      </span>
                    ) : null}
                    {!details?.roles.user && !details?.roles.tenant && !details?.roles.agent ? (
                      <span className="text-xs text-slate-500 dark:text-slate-400">No roles available.</span>
                    ) : null}
                  </div>
                </div>

                {requestedRole === 'TENANT' || requestedRole === 'AGENT' ? (
                  <dl className="mt-3 grid gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                    {requestedRole === 'TENANT' ? (
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900/60">
                        <dt className="text-slate-500 dark:text-slate-400">Tenant ID</dt>
                        <dd className="truncate font-medium text-slate-900 dark:text-slate-100">
                          {details?.roleEntities.tenantId || '—'}
                        </dd>
                      </div>
                    ) : null}
                    {requestedRole === 'AGENT' ? (
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900/60">
                        <dt className="text-slate-500 dark:text-slate-400">Agent ID</dt>
                        <dd className="truncate font-medium text-slate-900 dark:text-slate-100">
                          {details?.roleEntities.agentId || '—'}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                ) : null}
              </section>

              <section className="mt-5">
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Transactions</h4>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Showing {numberFormatter.format(details?.transactions.length ?? 0)} of{' '}
                    {numberFormatter.format(details?.summary.total ?? 0)}
                  </p>
                </div>

                {isLoading && !details ? (
                  <div className="mt-4 flex items-center justify-center rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading transactions...
                  </div>
                ) : (details?.transactions.length ?? 0) === 0 ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    No transactions available.
                  </div>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {details?.transactions.map((transaction) => (
                      <TransactionRow key={transaction.id} transaction={transaction} />
                    ))}
                  </ul>
                )}

                {pagination.totalPages > 1 ? (
                  <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
                    <div className="flex flex-col gap-3 sm:hidden">
                      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                        Page {numberFormatter.format(pagination.page)} of {numberFormatter.format(pagination.totalPages)}
                      </p>

                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setPage((previousPage) => Math.max(previousPage - 1, 1))}
                          disabled={!canGoPrevious}
                          className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Prev
                        </button>

                        <div className="flex items-center gap-1">
                          {mobilePaginationItems.map((item) => {
                            if (typeof item !== 'number') {
                              return (
                                <span
                                  key={item}
                                  className="inline-flex h-9 min-w-7 items-center justify-center px-1 text-sm font-medium text-slate-400 dark:text-slate-500"
                                >
                                  ...
                                </span>
                              )
                            }

                            const isActivePage = item === pagination.page

                            return (
                              <button
                                key={item}
                                type="button"
                                onClick={() => setPage(item)}
                                disabled={isLoading}
                                aria-current={isActivePage ? 'page' : undefined}
                                className={cn(
                                  'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                                  isActivePage
                                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/20'
                                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
                                )}
                              >
                                {numberFormatter.format(item)}
                              </button>
                            )
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={() => setPage((previousPage) => previousPage + 1)}
                          disabled={!canGoNext}
                          className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="hidden items-center justify-between gap-3 sm:flex">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Page {numberFormatter.format(pagination.page)} of {numberFormatter.format(pagination.totalPages)}
                      </p>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPage((previousPage) => Math.max(previousPage - 1, 1))}
                          disabled={!canGoPrevious}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Prev
                        </button>

                        <div className="flex flex-wrap items-center gap-1">
                          {desktopPaginationItems.map((item) => {
                            if (typeof item !== 'number') {
                              return (
                                <span
                                  key={item}
                                  className="inline-flex h-9 min-w-9 items-center justify-center px-2 text-sm font-medium text-slate-400 dark:text-slate-500"
                                >
                                  ...
                                </span>
                              )
                            }

                            const isActivePage = item === pagination.page

                            return (
                              <button
                                key={item}
                                type="button"
                                onClick={() => setPage(item)}
                                disabled={isLoading}
                                aria-current={isActivePage ? 'page' : undefined}
                                className={cn(
                                  'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                                  isActivePage
                                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/20'
                                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
                                )}
                              >
                                {numberFormatter.format(item)}
                              </button>
                            )
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={() => setPage((previousPage) => previousPage + 1)}
                          disabled={!canGoNext}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </section>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

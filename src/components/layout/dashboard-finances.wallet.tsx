import { CreditCard, RefreshCw, Search, TrendingDown, TrendingUp, UserCircle2, Wallet } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { cn } from '../../lib/cn'
import { getApiErrorMessage } from '../../lib/http-client'
import {
  getFinancialWalletActivities,
  getFinancialWalletActivitiesSummary,
  type FinancialWalletActivity,
  type FinancialWalletActivitiesPagination,
  type FinancialWalletActivitiesSummary,
} from '../../services'
import { useToast } from '../ui/toast-provider'
import {
  buildPaginationItems,
  compactNumberFormatter,
  createCurrencyFormatter,
  formatDateRange,
  formatReadableLabel,
  percentFormatter,
  surfaceCardClass,
} from './dashboard-finances.utils'

function formatWalletActivityTimestamp(activity: FinancialWalletActivity) {
  const createdAt = activity.createdAt.trim()
  if (createdAt) {
    const parsedDate = new Date(createdAt)
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleString('en-NG', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
  }

  const fallbackSegments = [activity.date?.trim(), activity.time?.trim()].filter(Boolean)
  return fallbackSegments.length ? fallbackSegments.join(' ') : 'N/A'
}

function normalizeWalletActivityStatus(inputStatus: string) {
  return inputStatus.trim().toUpperCase()
}

function getWalletStatusBadgeClasses(status: string) {
  const normalizedStatus = normalizeWalletActivityStatus(status)
  if (normalizedStatus === 'SUCCESSFUL' || normalizedStatus === 'SUCCESS') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200'
  }

  if (normalizedStatus === 'FAILED' || normalizedStatus === 'FAIL') {
    return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200'
  }

  if (normalizedStatus === 'PENDING') {
    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200'
  }

  return 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200'
}

export function DashboardFinancesWallet() {
  const [walletSummary, setWalletSummary] = useState<FinancialWalletActivitiesSummary | null>(null)
  const [isWalletLoading, setIsWalletLoading] = useState(true)
  const [walletErrorMessage, setWalletErrorMessage] = useState<string | null>(null)
  const [walletSummaryRangeMode, setWalletSummaryRangeMode] = useState<'current' | 'previous'>('current')
  const [previousWalletSummary, setPreviousWalletSummary] = useState<FinancialWalletActivitiesSummary | null>(null)
  const [isPreviousWalletSummaryLoading, setIsPreviousWalletSummaryLoading] = useState(false)

  const [walletActivities, setWalletActivities] = useState<FinancialWalletActivity[]>([])
  const [walletPagination, setWalletPagination] = useState<FinancialWalletActivitiesPagination | null>(null)
  const [walletPage, setWalletPage] = useState(1)
  const [isWalletActivitiesLoading, setIsWalletActivitiesLoading] = useState(true)
  const [walletActivitiesErrorMessage, setWalletActivitiesErrorMessage] = useState<string | null>(null)
  const walletActivitiesRequestId = useRef(0)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'successful' | 'pending' | 'failed'>('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const { toast } = useToast()

  const loadWalletSummary = useCallback(
    async (showErrorToast = false) => {
      setIsWalletLoading(true)

      try {
        const nextSummary = await getFinancialWalletActivitiesSummary()
        setWalletSummary(nextSummary)
        setWalletSummaryRangeMode('current')
        setPreviousWalletSummary(null)
        setWalletErrorMessage(null)
      } catch (error) {
        const message = getApiErrorMessage(error, 'Failed to load wallet summary.')
        setWalletErrorMessage(message)
        if (showErrorToast) {
          toast({
            variant: 'error',
            title: 'Wallet summary unavailable',
            description: message,
          })
        }
      } finally {
        setIsWalletLoading(false)
      }
    },
    [toast],
  )

  useEffect(() => {
    void loadWalletSummary()
  }, [loadWalletSummary])

  const loadPreviousWalletSummary = useCallback(
    async (showErrorToast = false) => {
      const previousFrom = walletSummary?.range.previousFrom ?? null
      const previousTo = walletSummary?.range.previousTo ?? null

      if (!previousFrom || !previousTo) {
        if (showErrorToast) {
          toast({
            variant: 'error',
            title: 'Previous range unavailable',
            description: 'There is no previous range available for this wallet summary yet.',
          })
        }
        return null
      }

      setIsPreviousWalletSummaryLoading(true)

      try {
        const nextSummary = await getFinancialWalletActivitiesSummary({ from: previousFrom, to: previousTo })
        setPreviousWalletSummary(nextSummary)
        return nextSummary
      } catch (error) {
        const message = getApiErrorMessage(error, 'Failed to load previous wallet summary.')
        if (showErrorToast) {
          toast({
            variant: 'error',
            title: 'Previous wallet summary unavailable',
            description: message,
          })
        }
        return null
      } finally {
        setIsPreviousWalletSummaryLoading(false)
      }
    },
    [toast, walletSummary],
  )

  const loadWalletActivities = useCallback(
    async (showErrorToast = false, nextPage = walletPage) => {
      setIsWalletActivitiesLoading(true)
      const requestId = walletActivitiesRequestId.current + 1
      walletActivitiesRequestId.current = requestId

      try {
        const response = await getFinancialWalletActivities(nextPage, 20)

        if (requestId !== walletActivitiesRequestId.current) {
          return
        }

        setWalletActivities(response.activities)
        setWalletPagination(response.pagination)
        setWalletActivitiesErrorMessage(null)
      } catch (error) {
        if (requestId !== walletActivitiesRequestId.current) {
          return
        }

        const message = getApiErrorMessage(error, 'Failed to load wallet activities.')
        setWalletActivitiesErrorMessage(message)
        if (showErrorToast) {
          toast({
            variant: 'error',
            title: 'Wallet activities unavailable',
            description: message,
          })
        }
      } finally {
        if (requestId === walletActivitiesRequestId.current) {
          setIsWalletActivitiesLoading(false)
        }
      }
    },
    [toast, walletPage],
  )

  useEffect(() => {
    void loadWalletActivities(false, walletPage)
  }, [loadWalletActivities, walletPage])

  const displayedWalletSummary = walletSummaryRangeMode === 'previous' ? previousWalletSummary : walletSummary
  const currencyCode = displayedWalletSummary?.currency || walletSummary?.currency || 'NGN'
  const currencyFormatter = useMemo(() => createCurrencyFormatter(currencyCode), [currencyCode])

  const availableWalletTypes = useMemo(() => {
    const types = new Set<string>()
    for (const activity of walletActivities) {
      const type = activity.type.trim()
      if (type) {
        types.add(type)
      }
    }

    if (typeFilter !== 'all') {
      const selectedType = typeFilter.trim()
      if (selectedType) {
        types.add(selectedType)
      }
    }

    return Array.from(types).sort((leftType, rightType) => leftType.localeCompare(rightType))
  }, [typeFilter, walletActivities])

  const filteredWalletActivities = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    const matchesStatusFilter = (activity: FinancialWalletActivity) => {
      if (statusFilter === 'all') {
        return true
      }

      const normalizedStatus = normalizeWalletActivityStatus(activity.status)
      if (statusFilter === 'successful') {
        return normalizedStatus === 'SUCCESSFUL' || normalizedStatus === 'SUCCESS'
      }

      if (statusFilter === 'failed') {
        return normalizedStatus === 'FAILED' || normalizedStatus === 'FAIL'
      }

      return normalizedStatus === 'PENDING'
    }

    const matchesTypeFilter = (activity: FinancialWalletActivity) => {
      if (typeFilter === 'all') {
        return true
      }

      return activity.type.trim() === typeFilter
    }

    const matchesSearchQuery = (activity: FinancialWalletActivity) => {
      if (!normalizedQuery) {
        return true
      }

      const searchable = [
        activity.user?.username ?? '',
        activity.source,
        activity.type,
        activity.status,
        activity.description,
        activity.reference,
        activity.from ?? '',
        activity.to ?? '',
      ]
        .join(' ')
        .toLowerCase()

      return searchable.includes(normalizedQuery)
    }

    const getSortTime = (activity: FinancialWalletActivity) => {
      const createdAtMs = new Date(activity.createdAt).getTime()
      if (!Number.isNaN(createdAtMs)) {
        return createdAtMs
      }

      return 0
    }

    return walletActivities
      .filter((activity) => matchesStatusFilter(activity) && matchesTypeFilter(activity) && matchesSearchQuery(activity))
      .slice()
      .sort((leftActivity, rightActivity) => getSortTime(rightActivity) - getSortTime(leftActivity))
  }, [searchQuery, statusFilter, typeFilter, walletActivities])

  const walletCurrentPage = walletPagination?.page ?? walletPage
  const walletTotalPages = walletPagination?.totalPages ?? 1
  const walletTotalActivities = walletPagination?.total ?? walletActivities.length
  const walletFiltersActive = Boolean(searchQuery.trim() || statusFilter !== 'all' || typeFilter !== 'all')
  const walletPaginationItems = useMemo(
    () => buildPaginationItems(walletCurrentPage, walletTotalPages, 7),
    [walletCurrentPage, walletTotalPages],
  )

  const cards = displayedWalletSummary?.cards
  const range = walletSummary?.range
  const isWalletRefreshing = isWalletLoading || isWalletActivitiesLoading || isPreviousWalletSummaryLoading

  return (
    <div className="space-y-6">
      <section className="dashboard-enter rounded-2xl border border-slate-200/90 bg-white/80 p-5 shadow-sm shadow-slate-900/5 ring-1 ring-white/70 dark:border-slate-800/80 dark:bg-slate-900/70 dark:ring-slate-800/80">
        <div className="flex items-start justify-between gap-3 sm:items-center">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Wallet</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Current:{' '}
              <span
                className={cn(
                  'font-medium',
                  walletSummaryRangeMode === 'current' && 'text-slate-900 dark:text-slate-100',
                )}
              >
                {formatDateRange(range?.from ?? null, range?.to ?? null)}
              </span>{' '}
              · Previous:{' '}
              <span
                className={cn(
                  'font-medium',
                  walletSummaryRangeMode === 'previous' && 'text-slate-900 dark:text-slate-100',
                )}
              >
                {formatDateRange(range?.previousFrom ?? null, range?.previousTo ?? null)}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void loadWalletSummary(true)
              void loadWalletActivities(true, walletCurrentPage)
            }}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-0 text-sm font-medium text-slate-700 shadow-sm shadow-slate-900/5 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900 sm:w-auto sm:px-3"
          >
            <RefreshCw className={cn('h-4 w-4', isWalletRefreshing && 'animate-spin')} />
            <span className="sr-only sm:not-sr-only">Refresh</span>
          </button>
        </div>

        <div className="mt-3 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-950">
          <button
            type="button"
            onClick={() => setWalletSummaryRangeMode('current')}
            disabled={isWalletLoading || isPreviousWalletSummaryLoading}
            className={cn(
              'inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
              walletSummaryRangeMode === 'current'
                ? 'bg-blue-600 text-white shadow-sm shadow-slate-900/10'
                : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900',
            )}
          >
            Current
          </button>
          <button
            type="button"
            onClick={() => {
              if (previousWalletSummary) {
                setWalletSummaryRangeMode('previous')
                return
              }

              void (async () => {
                const nextSummary = await loadPreviousWalletSummary(true)
                if (nextSummary) {
                  setWalletSummaryRangeMode('previous')
                }
              })()
            }}
            disabled={isWalletLoading || isPreviousWalletSummaryLoading || !range?.previousFrom || !range?.previousTo}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
              walletSummaryRangeMode === 'previous'
                ? 'bg-blue-600 text-white shadow-sm shadow-slate-900/10'
                : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900',
            )}
          >
            {isPreviousWalletSummaryLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
            Previous
          </button>
        </div>
      </section>

      {walletErrorMessage ? (
        <section className={cn(surfaceCardClass, 'dashboard-enter dashboard-enter-delay-1')}>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Wallet summary unavailable</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{walletErrorMessage}</p>
          <button
            type="button"
            onClick={() => void loadWalletSummary(true)}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Try again
          </button>
        </section>
      ) : null}

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          {
            label: 'Total volume',
            value: cards ? currencyFormatter.format(cards.totalVolume.value) : '—',
            changeRate: cards?.totalVolume.changeRate ?? null,
            icon: Wallet,
          },
          {
            label: 'Total transactions',
            value: cards ? compactNumberFormatter.format(cards.totalTransactions.value) : '—',
            changeRate: cards?.totalTransactions.changeRate ?? null,
            icon: CreditCard,
          },
          {
            label: 'Success rate',
            value: cards ? percentFormatter.format(cards.successRate.value / 100) : '—',
            changeRate: cards?.successRate.changeRate ?? null,
            icon: TrendingUp,
          },
          {
            label: 'Pending amount',
            value: cards ? currencyFormatter.format(cards.pendingAmount.value) : '—',
            changeRate: cards?.pendingAmount.changeRate ?? null,
            icon: TrendingDown,
          },
        ].map((stat, index) => {
          const Icon = stat.icon
          const changeRateLabel = typeof stat.changeRate === 'number' ? percentFormatter.format(stat.changeRate / 100) : 'N/A'
          const isPositiveChange = typeof stat.changeRate === 'number' && stat.changeRate >= 0

          return (
            <article
              key={stat.label}
              className={cn(
                surfaceCardClass,
                'dashboard-enter min-w-0',
                index === 0
                  ? 'dashboard-enter-delay-1'
                  : index === 1
                    ? 'dashboard-enter-delay-2'
                    : index === 2
                      ? 'dashboard-enter-delay-3'
                      : 'dashboard-enter-delay-4',
              )}
            >
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <p className="min-w-0 text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:h-10 sm:w-10">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 break-words text-xl font-semibold leading-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
                {stat.value}
              </p>
              <p
                className={cn(
                  'mt-2 text-xs',
                  typeof stat.changeRate === 'number'
                    ? isPositiveChange
                      ? 'text-emerald-600 dark:text-emerald-300'
                      : 'text-rose-600 dark:text-rose-300'
                    : 'text-slate-500 dark:text-slate-400',
                )}
              >
                Change: {changeRateLabel}
              </p>
            </article>
          )
        })}
      </section>

      <section className={cn(surfaceCardClass, 'dashboard-enter dashboard-enter-delay-1')}>
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Wallet activities</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Total: {compactNumberFormatter.format(walletTotalActivities)} · Page {walletCurrentPage} of {walletTotalPages}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <label className="relative w-full sm:w-auto">
              <span className="sr-only">Search</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by user, type, reference..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 shadow-sm shadow-slate-900/5 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:w-64"
              />
            </label>

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm shadow-slate-900/5 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 sm:w-auto"
              aria-label="Filter type"
            >
              <option value="all">All types</option>
              {availableWalletTypes.map((type) => (
                <option key={type} value={type}>
                  {formatReadableLabel(type)}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm shadow-slate-900/5 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 sm:w-auto"
              aria-label="Filter status"
            >
              <option value="all">All statuses</option>
              <option value="successful">Successful</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </header>

        <div className="mt-4 space-y-3 lg:hidden">
          {walletActivitiesErrorMessage && walletActivities.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-6 text-sm text-slate-600 shadow-sm shadow-slate-900/5 dark:border-slate-800/80 dark:bg-slate-950/30 dark:text-slate-300">
              <p className="font-semibold text-slate-900 dark:text-slate-100">Wallet activities unavailable</p>
              <p className="mt-2">{walletActivitiesErrorMessage}</p>
              <button
                type="button"
                onClick={() => void loadWalletActivities(true, walletCurrentPage)}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Try again
              </button>
            </div>
          ) : isWalletActivitiesLoading && walletActivities.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Loading wallet activities…
            </div>
          ) : filteredWalletActivities.length ? (
            filteredWalletActivities.map((activity) => {
              const username = activity.user?.username?.trim() || 'Unknown user'
              const avatarUrl = activity.user?.avatar?.trim() || ''
              const flowLabel =
                activity.from?.trim() && activity.to?.trim() ? `${activity.from.trim()} → ${activity.to.trim()}` : ''

              return (
                <article
                  key={activity.id}
                  className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm shadow-slate-900/5 dark:border-slate-800/80 dark:bg-slate-950/30"
                >
                  <header className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={username} className="h-full w-full object-cover" />
                        ) : (
                          <UserCircle2 className="h-5 w-5" />
                        )}
	                      </div>
	                      <div className="min-w-0">
	                        <p className="break-words text-sm font-semibold text-slate-900 dark:text-slate-100">{username}</p>
	                        <p className="mt-0.5 break-words text-xs text-slate-500 dark:text-slate-400">
	                          {formatReadableLabel(activity.source)}
	                        </p>
	                      </div>
                    </div>

                    <span
                      className={cn(
                        'inline-flex items-center justify-center rounded-lg border px-2.5 py-1 text-xs font-semibold',
                        getWalletStatusBadgeClasses(activity.status),
                      )}
                    >
                      {formatReadableLabel(activity.status)}
                    </span>
                  </header>

                  <div className="mt-4 space-y-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {formatReadableLabel(activity.type)}
                    </p>
	                    <p className="break-words text-xs text-slate-500 dark:text-slate-400">{activity.description || 'No description'}</p>
	                    {activity.reference ? (
	                      <p className="mt-1 break-all font-mono text-[11px] text-slate-500 dark:text-slate-400">
	                        Ref: {activity.reference}
	                      </p>
	                    ) : null}
	                    {flowLabel ? (
	                      <p className="mt-1 break-words text-[11px] text-slate-500 dark:text-slate-400">{flowLabel}</p>
	                    ) : null}
	                  </div>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-100/70 px-4 py-3 dark:bg-slate-900/40">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Amount</p>
                      <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                        {currencyFormatter.format(activity.amount)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-100/70 px-4 py-3 dark:bg-slate-900/40">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Date</p>
                      <p className="mt-1 text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {formatWalletActivityTimestamp(activity)}
                      </p>
                    </div>
                  </div>
                </article>
              )
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              {walletFiltersActive ? 'No activities match these filters.' : 'No wallet activities found.'}
            </div>
          )}
        </div>

        <div className="mt-4 hidden overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800/80 lg:block">
          <div className="grid grid-cols-12 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
            <div className="col-span-3">User</div>
            <div className="col-span-3">Activity</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Date</div>
          </div>
          <div className="divide-y divide-slate-200/80 bg-white dark:divide-slate-800/80 dark:bg-slate-950/30">
            {walletActivitiesErrorMessage && walletActivities.length === 0 ? (
              <div className="flex min-h-40 flex-col items-center justify-center gap-3 px-4 py-10 text-sm text-slate-600 dark:text-slate-300">
                <p className="text-center font-semibold text-slate-900 dark:text-slate-100">Wallet activities unavailable</p>
                <p className="max-w-xl text-center">{walletActivitiesErrorMessage}</p>
                <button
                  type="button"
                  onClick={() => void loadWalletActivities(true, walletCurrentPage)}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Try again
                </button>
              </div>
            ) : isWalletActivitiesLoading && walletActivities.length === 0 ? (
              <div className="flex min-h-40 items-center justify-center px-4 py-10 text-sm text-slate-500 dark:text-slate-400">
                Loading wallet activities…
              </div>
            ) : filteredWalletActivities.length ? (
              filteredWalletActivities.map((activity) => {
                const username = activity.user?.username?.trim() || 'Unknown user'
                const flowLabel =
                  activity.from?.trim() && activity.to?.trim() ? `${activity.from.trim()} → ${activity.to.trim()}` : ''

                return (
                  <div key={activity.id} className="grid grid-cols-12 items-start gap-3 px-4 py-3 text-sm">
                    <div className="col-span-3 flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                        {activity.user?.avatar ? (
                          <img src={activity.user.avatar} alt={username} className="h-full w-full object-cover" />
                        ) : (
                          <UserCircle2 className="h-5 w-5" />
                        )}
	                      </div>
	                      <div className="min-w-0">
	                        <p className="break-words font-semibold text-slate-900 dark:text-slate-100">{username}</p>
	                        <p className="mt-0.5 break-words text-xs text-slate-500 dark:text-slate-400">
	                          {formatReadableLabel(activity.source)}
	                        </p>
	                      </div>
                    </div>

	                    <div className="col-span-3 min-w-0">
	                      <p className="break-words font-semibold text-slate-900 dark:text-slate-100">
	                        {formatReadableLabel(activity.type)}
	                      </p>
	                      <p className="mt-0.5 break-words text-xs text-slate-500 dark:text-slate-400">
	                        {activity.description || 'No description'}
	                      </p>
	                      {activity.reference ? (
	                        <p className="mt-1 break-all font-mono text-[11px] text-slate-500 dark:text-slate-400">
	                          Ref: {activity.reference}
	                        </p>
	                      ) : null}
	                      {flowLabel ? (
	                        <p className="mt-1 break-words text-[11px] text-slate-500 dark:text-slate-400">{flowLabel}</p>
	                      ) : null}
	                    </div>

                    <div className="col-span-2 text-right font-semibold text-slate-900 dark:text-slate-100">
                      {currencyFormatter.format(activity.amount)}
                    </div>

                    <div className="col-span-2">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center rounded-lg border px-2.5 py-1 text-xs font-semibold',
                          getWalletStatusBadgeClasses(activity.status),
                        )}
                      >
                        {formatReadableLabel(activity.status)}
                      </span>
                    </div>

                    <div className="col-span-2 text-right text-xs text-slate-500 dark:text-slate-400">
                      {formatWalletActivityTimestamp(activity)}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flex min-h-40 items-center justify-center px-4 py-10 text-sm text-slate-500 dark:text-slate-400">
                {walletFiltersActive ? 'No activities match these filters.' : 'No wallet activities found.'}
              </div>
            )}
          </div>
        </div>

        {walletFiltersActive && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Filters active: {typeFilter !== 'all' ? `type=${typeFilter}` : 'type=all'}
              {', '}
              {statusFilter !== 'all' ? `status=${statusFilter}` : 'status=all'}
              {searchQuery.trim() ? `, search="${searchQuery.trim()}"` : ''}
            </span>
            <button
              type="button"
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm shadow-slate-900/5 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
                setTypeFilter('all')
              }}
            >
              Clear filters
            </button>
          </div>
        )}

        {walletPagination ? (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Page {walletCurrentPage} of {walletTotalPages} · Total {compactNumberFormatter.format(walletTotalActivities)}
              {walletFiltersActive
                ? ` · Showing ${compactNumberFormatter.format(filteredWalletActivities.length)} on this page`
                : ''}
            </p>

            <div className="flex flex-wrap items-center justify-start gap-1 sm:justify-end">
              <button
                type="button"
                disabled={isWalletActivitiesLoading || walletCurrentPage <= 1}
                onClick={() => setWalletPage((previousPage) => Math.max(1, previousPage - 1))}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm shadow-slate-900/5 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Prev
              </button>

              {walletPaginationItems.map((item) => {
                if (item === 'start-ellipsis' || item === 'end-ellipsis') {
                  return (
                    <span key={`${item}-${walletCurrentPage}`} className="px-2 text-xs text-slate-400">
                      …
                    </span>
                  )
                }

                const isActive = item === walletCurrentPage
                return (
                  <button
                    key={item}
                    type="button"
                    disabled={isWalletActivitiesLoading}
                    onClick={() => setWalletPage(item)}
                    className={cn(
                      'h-9 min-w-9 rounded-lg border px-3 text-xs font-semibold shadow-sm shadow-slate-900/5 transition disabled:cursor-not-allowed disabled:opacity-60',
                      isActive
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900',
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item}
                  </button>
                )
              })}

              <button
                type="button"
                disabled={isWalletActivitiesLoading || walletCurrentPage >= walletTotalPages}
                onClick={() => setWalletPage((previousPage) => Math.min(walletTotalPages, previousPage + 1))}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm shadow-slate-900/5 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}

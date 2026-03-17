import { Clock3, CreditCard, RefreshCw, Search, TrendingUp, UserCircle2, Wallet, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '../../lib/cn'
import { getApiErrorMessage } from '../../lib/http-client'
import {
  getFinancialOfflineDeposits,
  getFinancialOfflineDepositsSummary,
  type FinancialOfflineDepositActivity,
  type FinancialOfflineDepositsPagination,
  type FinancialOfflineDepositsSummary,
} from '../../services'
import { useToast } from '../ui/toast-provider'
import {
  buildPaginationItems,
  compactNumberFormatter,
  createCurrencyFormatter,
  decimalFormatter,
  formatDateRange,
  formatReadableLabel,
  percentFormatter,
  surfaceCardClass,
  toDateInputValue,
} from './dashboard-finances.utils'

function formatOfflineDepositTimestamp(activity: FinancialOfflineDepositActivity) {
  const createdAt = activity.createdAt.trim()
  if (!createdAt) {
    return 'N/A'
  }

  const parsedDate = new Date(createdAt)
  if (Number.isNaN(parsedDate.getTime())) {
    return createdAt
  }

  return parsedDate.toLocaleString('en-NG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function normalizeOfflineDepositStatus(inputStatus: string) {
  return inputStatus.trim().toUpperCase()
}

function getOfflineDepositStatusBadgeClasses(status: string) {
  const normalizedStatus = normalizeOfflineDepositStatus(status)
  if (normalizedStatus === 'VERIFIED' || normalizedStatus === 'APPROVED' || normalizedStatus === 'SUCCESSFUL') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200'
  }

  if (
    normalizedStatus === 'DENIED' ||
    normalizedStatus === 'DECLINED' ||
    normalizedStatus === 'REJECTED' ||
    normalizedStatus === 'FAILED'
  ) {
    return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200'
  }

  if (normalizedStatus === 'PENDING' || normalizedStatus === 'IN_REVIEW') {
    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200'
  }

  return 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200'
}

export function DashboardFinancesOfflineDeposits() {
  const [offlineDepositsSummary, setOfflineDepositsSummary] = useState<FinancialOfflineDepositsSummary | null>(null)
  const [offlineFromDate, setOfflineFromDate] = useState(() => {
    const from = new Date()
    from.setFullYear(from.getFullYear() - 1)
    return toDateInputValue(from)
  })
  const [offlineToDate, setOfflineToDate] = useState(() => toDateInputValue(new Date()))
  const [isOfflineDepositsLoading, setIsOfflineDepositsLoading] = useState(true)
  const [offlineDepositsErrorMessage, setOfflineDepositsErrorMessage] = useState<string | null>(null)

  const [offlineDepositsActivities, setOfflineDepositsActivities] = useState<FinancialOfflineDepositActivity[]>([])
  const [offlineDepositsPagination, setOfflineDepositsPagination] = useState<FinancialOfflineDepositsPagination | null>(
    null,
  )
  const [offlineDepositsPage, setOfflineDepositsPage] = useState(1)
  const [isOfflineDepositsActivitiesLoading, setIsOfflineDepositsActivitiesLoading] = useState(true)
  const [offlineDepositsActivitiesErrorMessage, setOfflineDepositsActivitiesErrorMessage] = useState<string | null>(null)
  const offlineDepositsActivitiesRequestId = useRef(0)

  const [offlineSearchQuery, setOfflineSearchQuery] = useState('')
  const [offlineStatusFilter, setOfflineStatusFilter] = useState<'all' | 'pending' | 'verified' | 'denied'>('all')
  const [offlineTypeFilter, setOfflineTypeFilter] = useState('all')
  const [proofViewer, setProofViewer] = useState<{ url: string; title: string; mimeType: string | null } | null>(
    null,
  )

  const { toast } = useToast()

  useEffect(() => {
    if (!proofViewer) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProofViewer(null)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = previousOverflow
    }
  }, [proofViewer])

  const loadOfflineDepositsSummary = useCallback(
    async (showErrorToast = false) => {
      if (!offlineFromDate || !offlineToDate) {
        return
      }

      setIsOfflineDepositsLoading(true)

      try {
        const from = `${offlineFromDate}T00:00:00.000Z`
        const to = `${offlineToDate}T23:59:59.999Z`

        const nextSummary = await getFinancialOfflineDepositsSummary({ from, to })
        setOfflineDepositsSummary(nextSummary)
        setOfflineDepositsErrorMessage(null)
      } catch (error) {
        const message = getApiErrorMessage(error, 'Failed to load offline deposits summary.')
        setOfflineDepositsErrorMessage(message)
        if (showErrorToast) {
          toast({
            variant: 'error',
            title: 'Offline deposits summary unavailable',
            description: message,
          })
        }
      } finally {
        setIsOfflineDepositsLoading(false)
      }
    },
    [offlineFromDate, offlineToDate, toast],
  )

  useEffect(() => {
    void loadOfflineDepositsSummary()
  }, [loadOfflineDepositsSummary])

  const loadOfflineDeposits = useCallback(
    async (showErrorToast = false, nextPage = offlineDepositsPage) => {
      setIsOfflineDepositsActivitiesLoading(true)
      const requestId = offlineDepositsActivitiesRequestId.current + 1
      offlineDepositsActivitiesRequestId.current = requestId

      try {
        const response = await getFinancialOfflineDeposits(nextPage, 20)

        if (requestId !== offlineDepositsActivitiesRequestId.current) {
          return
        }

        setOfflineDepositsActivities(response.activities)
        setOfflineDepositsPagination(response.pagination)
        setOfflineDepositsActivitiesErrorMessage(null)
      } catch (error) {
        if (requestId !== offlineDepositsActivitiesRequestId.current) {
          return
        }

        const message = getApiErrorMessage(error, 'Failed to load offline deposits.')
        setOfflineDepositsActivitiesErrorMessage(message)
        if (showErrorToast) {
          toast({
            variant: 'error',
            title: 'Offline deposits unavailable',
            description: message,
          })
        }
      } finally {
        if (requestId === offlineDepositsActivitiesRequestId.current) {
          setIsOfflineDepositsActivitiesLoading(false)
        }
      }
    },
    [offlineDepositsPage, toast],
  )

  useEffect(() => {
    void loadOfflineDeposits(false, offlineDepositsPage)
  }, [loadOfflineDeposits, offlineDepositsPage])

  const currencyCode = offlineDepositsSummary?.currency || 'NGN'
  const currencyFormatter = useMemo(() => createCurrencyFormatter(currencyCode), [currencyCode])

  const availableOfflineDepositTypes = useMemo(() => {
    const types = new Set<string>()
    for (const activity of offlineDepositsActivities) {
      const type = activity.type.trim()
      if (type) {
        types.add(type)
      }
    }

    if (offlineTypeFilter !== 'all') {
      const selectedType = offlineTypeFilter.trim()
      if (selectedType) {
        types.add(selectedType)
      }
    }

    return Array.from(types).sort((leftType, rightType) => leftType.localeCompare(rightType))
  }, [offlineTypeFilter, offlineDepositsActivities])

  const filteredOfflineDepositsActivities = useMemo(() => {
    const normalizedQuery = offlineSearchQuery.trim().toLowerCase()

    const matchesStatusFilter = (activity: FinancialOfflineDepositActivity) => {
      if (offlineStatusFilter === 'all') {
        return true
      }

      return normalizeOfflineDepositStatus(activity.status) === offlineStatusFilter.toUpperCase()
    }

    const matchesTypeFilter = (activity: FinancialOfflineDepositActivity) => {
      if (offlineTypeFilter === 'all') {
        return true
      }

      return activity.type.trim() === offlineTypeFilter
    }

    const matchesSearchQuery = (activity: FinancialOfflineDepositActivity) => {
      if (!normalizedQuery) {
        return true
      }

      const searchable = [
        activity.user?.name ?? '',
        activity.user?.username ?? '',
        activity.user?.email ?? '',
        activity.user?.userType ?? '',
        activity.source,
        activity.status,
        activity.type,
        activity.method,
        activity.transactionId,
        activity.reference ?? '',
      ]
        .join(' ')
        .toLowerCase()

      return searchable.includes(normalizedQuery)
    }

    const getSortTime = (activity: FinancialOfflineDepositActivity) => {
      const createdAtMs = new Date(activity.createdAt).getTime()
      if (!Number.isNaN(createdAtMs)) {
        return createdAtMs
      }

      return 0
    }

    return offlineDepositsActivities
      .filter((activity) => matchesStatusFilter(activity) && matchesTypeFilter(activity) && matchesSearchQuery(activity))
      .slice()
      .sort((leftActivity, rightActivity) => getSortTime(rightActivity) - getSortTime(leftActivity))
  }, [offlineDepositsActivities, offlineSearchQuery, offlineStatusFilter, offlineTypeFilter])

  const offlineDepositsCurrentPage = offlineDepositsPagination?.page ?? offlineDepositsPage
  const offlineDepositsTotalPages = offlineDepositsPagination?.totalPages ?? 1
  const offlineDepositsTotalActivities = offlineDepositsPagination?.total ?? offlineDepositsActivities.length
  const offlineDepositsFiltersActive = Boolean(
    offlineSearchQuery.trim() || offlineStatusFilter !== 'all' || offlineTypeFilter !== 'all',
  )
  const offlineDepositsPaginationItems = useMemo(
    () => buildPaginationItems(offlineDepositsCurrentPage, offlineDepositsTotalPages, 7),
    [offlineDepositsCurrentPage, offlineDepositsTotalPages],
  )

  const range = offlineDepositsSummary?.range
  const cards = offlineDepositsSummary?.cards
  const hasOfflineSummary = Boolean(offlineDepositsSummary)
  const isOfflineRefreshing = isOfflineDepositsLoading || isOfflineDepositsActivitiesLoading

  const proofViewerIsImage = useMemo(() => {
    if (!proofViewer) {
      return false
    }

    const mimeType = proofViewer.mimeType?.toLowerCase() ?? ''
    if (mimeType.startsWith('image/')) {
      return true
    }

    const url = proofViewer.url.trim().toLowerCase()
    return (
      url.startsWith('data:image/') ||
      url.endsWith('.png') ||
      url.endsWith('.jpg') ||
      url.endsWith('.jpeg') ||
      url.endsWith('.webp') ||
      url.endsWith('.gif') ||
      url.endsWith('.svg')
    )
  }, [proofViewer])

  return (
    <div className="space-y-6">
      {proofViewer && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-6">
              <div
                className="fixed inset-0 bg-slate-950/55 backdrop-blur-[2px]"
                onClick={() => setProofViewer(null)}
                aria-hidden="true"
              />

              <div
                className="relative z-10 flex max-h-[calc(95dvh-2rem)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:w-[min(96vw,56rem)]"
                role="dialog"
                aria-modal="true"
                aria-label="Proof viewer"
              >
                <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                  <div className="min-w-0">
                    <h3 className="break-words text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {proofViewer.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Preview document proof.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setProofViewer(null)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    aria-label="Close proof viewer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </header>

                <div className="min-h-0 flex-1 overflow-auto p-4">
                  {proofViewerIsImage ? (
                    <img
                      src={proofViewer.url}
                      alt={proofViewer.title}
                      className="mx-auto max-h-[75dvh] w-full rounded-xl object-contain"
                    />
                  ) : (
                    <iframe
                      title={proofViewer.title}
                      src={proofViewer.url}
                      className="h-[75dvh] w-full rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
                    />
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      <section className="dashboard-enter rounded-2xl border border-slate-200/90 bg-white/80 p-5 shadow-sm shadow-slate-900/5 ring-1 ring-white/70 dark:border-slate-800/80 dark:bg-slate-900/70 dark:ring-slate-800/80">
        <div className="flex items-start justify-between gap-3 sm:items-center">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Offline Deposits</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Range:{' '}
              <span className="font-medium">
                {formatDateRange(
                  range?.from ?? (offlineFromDate ? `${offlineFromDate}T00:00:00.000Z` : null),
                  range?.to ?? (offlineToDate ? `${offlineToDate}T23:59:59.999Z` : null),
                )}
              </span>{' '}
              · Previous:{' '}
              <span className="font-medium">{formatDateRange(range?.previousFrom ?? null, range?.previousTo ?? null)}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void loadOfflineDepositsSummary(true)
              void loadOfflineDeposits(true, offlineDepositsCurrentPage)
            }}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-0 text-sm font-medium text-slate-700 shadow-sm shadow-slate-900/5 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900 sm:w-auto sm:px-3"
          >
            <RefreshCw className={cn('h-4 w-4', isOfflineRefreshing && 'animate-spin')} />
            <span className="sr-only sm:not-sr-only">Refresh</span>
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            From
            <input
              type="date"
              value={offlineFromDate}
              onChange={(event) => {
                const nextValue = event.target.value
                setOfflineFromDate(nextValue)
                if (offlineToDate && nextValue && nextValue > offlineToDate) {
                  setOfflineToDate(nextValue)
                }
              }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm shadow-slate-900/5 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            To
            <input
              type="date"
              value={offlineToDate}
              onChange={(event) => {
                const nextValue = event.target.value
                setOfflineToDate(nextValue)
                if (offlineFromDate && nextValue && nextValue < offlineFromDate) {
                  setOfflineFromDate(nextValue)
                }
              }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm shadow-slate-900/5 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </label>
        </div>
      </section>

      {offlineDepositsErrorMessage ? (
        <section className={cn(surfaceCardClass, 'dashboard-enter dashboard-enter-delay-1')}>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Offline deposits summary unavailable</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{offlineDepositsErrorMessage}</p>
          <button
            type="button"
            onClick={() => void loadOfflineDepositsSummary(true)}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Try again
          </button>
        </section>
      ) : null}

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          {
            label: 'Pending review',
            value: hasOfflineSummary ? compactNumberFormatter.format(cards?.pendingReview.count ?? 0) : '—',
            hint: hasOfflineSummary ? `Total: ${currencyFormatter.format(cards?.pendingReview.totalValue ?? 0)}` : 'Awaiting offline deposit summary.',
            changeRate: cards?.pendingReview.changeRate ?? null,
            icon: Wallet,
          },
          {
            label: 'Approved this month',
            value: hasOfflineSummary ? compactNumberFormatter.format(cards?.approvedThisMonth.count ?? 0) : '—',
            hint: hasOfflineSummary
              ? `Total: ${currencyFormatter.format(cards?.approvedThisMonth.totalValue ?? 0)}`
              : 'Awaiting offline deposit summary.',
            changeRate: cards?.approvedThisMonth.changeRate ?? null,
            icon: CreditCard,
          },
          {
            label: 'Approval rate',
            value: hasOfflineSummary ? percentFormatter.format((cards?.approvalRate.value ?? 0) / 100) : '—',
            hint: hasOfflineSummary ? 'Share of deposits approved in range.' : 'Awaiting offline deposit summary.',
            changeRate: cards?.approvalRate.changeRate ?? null,
            icon: TrendingUp,
          },
          {
            label: 'Avg processing time',
            value: hasOfflineSummary ? `${decimalFormatter.format(cards?.avgProcessingTimeHours.value ?? 0)}h` : '—',
            hint: hasOfflineSummary ? 'Average time to approve offline deposits.' : 'Awaiting offline deposit summary.',
            changeRate: cards?.avgProcessingTimeHours.changeRate ?? null,
            icon: Clock3,
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
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{stat.hint}</p>
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

      <section className={cn(surfaceCardClass, 'dashboard-enter dashboard-enter-delay-2')}>
        <header className="mb-4">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Range details</h4>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {hasOfflineSummary ? 'Summary generated from the selected range.' : 'Select a date range to fetch offline deposits summary.'}
          </p>
        </header>

        <dl className="space-y-3 text-sm">
          <div className="flex items-start justify-between gap-3">
            <dt className="text-slate-500 dark:text-slate-400">Current range</dt>
            <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
              {formatDateRange(range?.from ?? null, range?.to ?? null)}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-slate-500 dark:text-slate-400">Previous range</dt>
            <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
              {formatDateRange(range?.previousFrom ?? null, range?.previousTo ?? null)}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-slate-500 dark:text-slate-400">Currency</dt>
            <dd className="text-right font-medium text-slate-900 dark:text-slate-100">{currencyCode}</dd>
          </div>
        </dl>
      </section>

      <section className={cn(surfaceCardClass, 'dashboard-enter dashboard-enter-delay-3')}>
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Offline deposits</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Total: {compactNumberFormatter.format(offlineDepositsTotalActivities)} · Page {offlineDepositsCurrentPage} of {offlineDepositsTotalPages}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="relative">
              <span className="sr-only">Search</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={offlineSearchQuery}
                onChange={(event) => setOfflineSearchQuery(event.target.value)}
                placeholder="Search by user, type, transaction..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 shadow-sm shadow-slate-900/5 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 md:w-64"
              />
            </label>

            <select
              value={offlineTypeFilter}
              onChange={(event) => setOfflineTypeFilter(event.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm shadow-slate-900/5 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              aria-label="Filter type"
            >
              <option value="all">All types</option>
              {availableOfflineDepositTypes.map((type) => (
                <option key={type} value={type}>
                  {formatReadableLabel(type)}
                </option>
              ))}
            </select>

            <select
              value={offlineStatusFilter}
              onChange={(event) => setOfflineStatusFilter(event.target.value as typeof offlineStatusFilter)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm shadow-slate-900/5 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              aria-label="Filter status"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="denied">Denied</option>
            </select>
          </div>
        </header>

        <div className="mt-4 space-y-3 lg:hidden">
          {offlineDepositsActivitiesErrorMessage && offlineDepositsActivities.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-6 text-sm text-slate-600 shadow-sm shadow-slate-900/5 dark:border-slate-800/80 dark:bg-slate-950/30 dark:text-slate-300">
              <p className="font-semibold text-slate-900 dark:text-slate-100">Offline deposits unavailable</p>
              <p className="mt-2">{offlineDepositsActivitiesErrorMessage}</p>
              <button
                type="button"
                onClick={() => void loadOfflineDeposits(true, offlineDepositsCurrentPage)}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Try again
              </button>
            </div>
          ) : isOfflineDepositsActivitiesLoading && offlineDepositsActivities.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Loading offline deposits…
            </div>
          ) : filteredOfflineDepositsActivities.length ? (
            filteredOfflineDepositsActivities.map((activity) => {
              const displayName = activity.user?.name?.trim() || activity.user?.username?.trim() || 'Unknown user'
              const email = activity.user?.email?.trim() || ''
              const userType = activity.user?.userType?.trim() || ''
              const avatarUrl = activity.user?.avatar?.trim() || ''

              const proofUrl = activity.documentOfProof?.data?.trim() || ''
              const metaSegments = [
                activity.method.trim() ? formatReadableLabel(activity.method) : '',
                activity.source.trim() ? formatReadableLabel(activity.source) : '',
              ].filter(Boolean)
              const metaLabel = metaSegments.join(' · ')

              return (
                <article
                  key={activity.id}
                  className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm shadow-slate-900/5 dark:border-slate-800/80 dark:bg-slate-950/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                        ) : (
                          <UserCircle2 className="h-6 w-6" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 break-words">
                          {displayName}
                        </p>
                        {email ? (
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 break-all">{email}</p>
                        ) : null}
                        {userType ? (
                          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                            {formatReadableLabel(userType)}
                          </p>
                        ) : null}
                        {!email && !userType ? (
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">—</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {currencyFormatter.format(activity.amount)}
                      </p>
                      <span
                        className={cn(
                          'mt-1 inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                          getOfflineDepositStatusBadgeClasses(activity.status),
                        )}
                      >
                        {formatReadableLabel(activity.status)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl bg-slate-50/80 p-3 dark:bg-slate-900/40">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 break-words">
                      {formatReadableLabel(activity.type) || 'Offline deposit'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 break-words">
                      {metaLabel || '—'}
                    </p>
                    {activity.transactionId ? (
                      <p className="mt-2 font-mono text-[11px] text-slate-600 dark:text-slate-300 break-all">
                        Tx: {activity.transactionId}
                      </p>
                    ) : null}
                    {activity.reference ? (
                      <p className="mt-1 font-mono text-[11px] text-slate-600 dark:text-slate-300 break-all">
                        Ref: {activity.reference}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <Clock3 className="h-3 w-3" />
                      {formatOfflineDepositTimestamp(activity)}
                    </span>

                    {proofUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          setProofViewer({
                            url: proofUrl,
                            title: `Proof for ${displayName}`,
                            mimeType: activity.documentOfProof?.type ?? null,
                          })
                        }
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm shadow-slate-900/5 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                      >
                        View proof
                      </button>
                    ) : null}
                  </div>
                </article>
              )
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              {offlineDepositsFiltersActive ? 'No deposits match these filters.' : 'No offline deposits found.'}
            </div>
          )}
        </div>

        <div className="mt-4 hidden overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800/80 lg:block">
          <div className="grid grid-cols-12 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
            <div className="col-span-3">User</div>
            <div className="col-span-4">Deposit</div>
            <div className="col-span-2 text-right">Amount</div>/
            <div className="col-span-1">Status</div>
            <div className="col-span-2 text-right">Date</div>
          </div>
          <div className="divide-y divide-slate-200/80 bg-white dark:divide-slate-800/80 dark:bg-slate-950/30">
            {offlineDepositsActivitiesErrorMessage && offlineDepositsActivities.length === 0 ? (
              <div className="flex min-h-40 flex-col items-center justify-center gap-3 px-4 py-10 text-sm text-slate-600 dark:text-slate-300">
                <p className="text-center font-semibold text-slate-900 dark:text-slate-100">Offline deposits unavailable</p>
                <p className="max-w-xl text-center">{offlineDepositsActivitiesErrorMessage}</p>
                <button
                  type="button"
                  onClick={() => void loadOfflineDeposits(true, offlineDepositsCurrentPage)}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Try again
                </button>
              </div>
            ) : isOfflineDepositsActivitiesLoading && offlineDepositsActivities.length === 0 ? (
              <div className="flex min-h-40 items-center justify-center px-4 py-10 text-sm text-slate-500 dark:text-slate-400">
                Loading offline deposits…
              </div>
            ) : filteredOfflineDepositsActivities.length ? (
              filteredOfflineDepositsActivities.map((activity) => {
                const displayName = activity.user?.name?.trim() || activity.user?.username?.trim() || 'Unknown user'
                const email = activity.user?.email?.trim() || ''
                const userType = activity.user?.userType?.trim() || ''
                const avatarUrl = activity.user?.avatar?.trim() || ''

                const proofUrl = activity.documentOfProof?.data?.trim() || ''
                const metaSegments = [
                  activity.method.trim() ? formatReadableLabel(activity.method) : '',
                  activity.source.trim() ? formatReadableLabel(activity.source) : '',
                ].filter(Boolean)
                const metaLabel = metaSegments.join(' · ')

                return (
                  <div key={activity.id} className="grid grid-cols-12 items-start gap-3 px-4 py-3 text-sm">
                    <div className="col-span-3 flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                        ) : (
                          <UserCircle2 className="h-5 w-5" />
                        )}
	                      </div>
	                      <div className="min-w-0">
	                        <p className="break-words font-semibold text-slate-900 dark:text-slate-100">{displayName}</p>
	                        {email ? (
	                          <p className="mt-0.5 break-all text-xs text-slate-500 dark:text-slate-400">{email}</p>
	                        ) : null}
	                        {userType ? (
	                          <p className="mt-0.5 break-words text-[11px] text-slate-500 dark:text-slate-400">
	                            {formatReadableLabel(userType)}
	                          </p>
	                        ) : null}
	                        {!email && !userType ? (
	                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">—</p>
	                        ) : null}
	                      </div>
	                    </div>

                    <div className="col-span-4 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 break-words">
                        {formatReadableLabel(activity.type) || 'Offline deposit'}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 break-words">{metaLabel || '—'}</p>
                      {activity.transactionId ? (
                        <p className="mt-1 font-mono text-[11px] text-slate-500 dark:text-slate-400 break-all">
                          Tx: {activity.transactionId}
                        </p>
                      ) : null}
                      {proofUrl ? (
                        <button
                          type="button"
                          onClick={() =>
                            setProofViewer({
                              url: proofUrl,
                              title: `Proof for ${displayName}`,
                              mimeType: activity.documentOfProof?.type ?? null,
                            })
                          }
                          className="mt-1 inline-flex w-fit rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm shadow-slate-900/5 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                        >
                          View proof
                        </button>
                      ) : null}
                    </div>

                    <div className="col-span-2 text-right font-semibold text-slate-900 dark:text-slate-100">
                      {currencyFormatter.format(activity.amount)}
                    </div>

                    <div className="col-span-1">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center rounded-lg border px-2.5 py-1 text-xs font-semibold',
                          getOfflineDepositStatusBadgeClasses(activity.status),
                        )}
                      >
                        {formatReadableLabel(activity.status)}
                      </span>
                    </div>

                    <div className="col-span-2 text-right text-xs text-slate-500 dark:text-slate-400">
                      {formatOfflineDepositTimestamp(activity)}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flex min-h-40 items-center justify-center px-4 py-10 text-sm text-slate-500 dark:text-slate-400">
                {offlineDepositsFiltersActive ? 'No deposits match these filters.' : 'No offline deposits found.'}
              </div>
            )}
          </div>
        </div>

        {offlineDepositsFiltersActive && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Filters active: {offlineTypeFilter !== 'all' ? `type=${offlineTypeFilter}` : 'type=all'}
              {', '}
              {offlineStatusFilter !== 'all' ? `status=${offlineStatusFilter}` : 'status=all'}
              {offlineSearchQuery.trim() ? `, search="${offlineSearchQuery.trim()}"` : ''}
            </span>
            <button
              type="button"
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm shadow-slate-900/5 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              onClick={() => {
                setOfflineSearchQuery('')
                setOfflineStatusFilter('all')
                setOfflineTypeFilter('all')
              }}
            >
              Clear filters
            </button>
          </div>
        )}

        {offlineDepositsPagination ? (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Page {offlineDepositsCurrentPage} of {offlineDepositsTotalPages} · Total{' '}
              {compactNumberFormatter.format(offlineDepositsTotalActivities)}
              {offlineDepositsFiltersActive
                ? ` · Showing ${compactNumberFormatter.format(filteredOfflineDepositsActivities.length)} on this page`
                : ''}
            </p>

            <div className="flex flex-wrap items-center justify-start gap-1 sm:justify-end">
              <button
                type="button"
                disabled={isOfflineDepositsActivitiesLoading || offlineDepositsCurrentPage <= 1}
                onClick={() => setOfflineDepositsPage((previousPage) => Math.max(1, previousPage - 1))}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm shadow-slate-900/5 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Prev
              </button>

              {offlineDepositsPaginationItems.map((item) => {
                if (item === 'start-ellipsis' || item === 'end-ellipsis') {
                  return (
                    <span key={`${item}-${offlineDepositsCurrentPage}`} className="px-2 text-xs text-slate-400">
                      …
                    </span>
                  )
                }

                const isActive = item === offlineDepositsCurrentPage
                return (
                  <button
                    key={item}
                    type="button"
                    disabled={isOfflineDepositsActivitiesLoading}
                    onClick={() => setOfflineDepositsPage(item)}
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
                disabled={isOfflineDepositsActivitiesLoading || offlineDepositsCurrentPage >= offlineDepositsTotalPages}
                onClick={() => setOfflineDepositsPage((previousPage) => Math.min(offlineDepositsTotalPages, previousPage + 1))}
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

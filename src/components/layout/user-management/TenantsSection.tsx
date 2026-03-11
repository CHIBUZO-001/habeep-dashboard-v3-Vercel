import {
  Activity,
  AlertTriangle,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react'
import { useMemo, useState, type Dispatch, type SetStateAction } from 'react'

import { cn } from '../../../lib/cn'
import type { TenantsList, TenantsSummary } from '../../../services'

import { TenantAvatar } from './avatars'
import {
  TENANTS_PAGE_SIZE,
  buildPaginationItems,
  formatCurrencyValue,
  formatDate,
  formatStatusLabel,
  getRentStatusClasses,
  getTenantDisplayName,
  numberFormatter,
  surfaceCardClass,
} from './utils'

type TenantsSectionProps = {
  tenantsSummary: TenantsSummary | null
  isTenantsSummaryLoading: boolean
  tenantsSummaryError: string | null
  onRefreshSummary: () => void
  tenantsList: TenantsList | null
  isTenantsListLoading: boolean
  tenantsListError: string | null
  onRefreshList: () => void
  currentPage: number
  onPageChange: Dispatch<SetStateAction<number>>
}

type TenantStatCard = {
  key: string
  label: string
  value: string
  note: string
  icon: typeof Users
}

type TenantSortOption = 'name-asc' | 'name-desc' | 'rent-status-asc' | 'amount-owed-desc' | 'due-on-asc'

function parseSortableTimestamp(value: string | null) {
  if (!value) {
    return Number.POSITIVE_INFINITY
  }

  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp
}

export function TenantsSection({
  tenantsSummary,
  isTenantsSummaryLoading,
  tenantsSummaryError,
  onRefreshSummary,
  tenantsList,
  isTenantsListLoading,
  tenantsListError,
  onRefreshList,
  currentPage,
  onPageChange,
}: TenantsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortOption, setSortOption] = useState<TenantSortOption>('name-asc')

  const tenantStatCards = useMemo<TenantStatCard[]>(() => {
    const currentSummary = tenantsSummary ?? {
      totalTenants: 0,
      activeRentsCount: 0,
      outstandingRentsCount: 0,
    }

    return [
      {
        key: 'total-tenants',
        label: 'Total Tenants',
        value: numberFormatter.format(currentSummary.totalTenants),
        note: 'Tenants registered across the platform',
        icon: Users,
      },
      {
        key: 'active-rents',
        label: 'Active Rents',
        value: numberFormatter.format(currentSummary.activeRentsCount),
        note: 'Rents currently active in the portfolio',
        icon: Activity,
      },
      {
        key: 'outstanding-rents',
        label: 'Outstanding Rents',
        value: numberFormatter.format(currentSummary.outstandingRentsCount),
        note: 'Rents flagged as outstanding in the current window',
        icon: AlertTriangle,
      },
    ]
  }, [tenantsSummary])

  const totalTenants = tenantsList?.total ?? 0
  const tenantsTotalPages = Math.max(1, Math.ceil(totalTenants / (tenantsList?.limit ?? TENANTS_PAGE_SIZE)))
  const currentTenantListPage = tenantsList?.page ?? currentPage
  const hasTenantRows = (tenantsList?.items.length ?? 0) > 0
  const tenantDesktopPaginationItems = buildPaginationItems(currentTenantListPage, tenantsTotalPages, 7)
  const tenantMobilePaginationItems = buildPaginationItems(currentTenantListPage, tenantsTotalPages, 5)
  const availableRentStatuses = useMemo(() => {
    const statuses = new Set<string>()

    for (const tenant of tenantsList?.items ?? []) {
      const status = tenant.rentStatus.trim().toLowerCase()
      if (status) {
        statuses.add(status)
      }
    }

    return Array.from(statuses).sort((leftStatus, rightStatus) => leftStatus.localeCompare(rightStatus))
  }, [tenantsList])

  const filteredTenants = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    const filteredItems = (tenantsList?.items ?? []).filter((tenant) => {
      if (statusFilter !== 'all') {
        const normalizedStatus = tenant.rentStatus.trim().toLowerCase()
        if (normalizedStatus !== statusFilter) {
          return false
        }
      }

      if (!normalizedQuery) {
        return true
      }

      const searchHaystack = [
        getTenantDisplayName(tenant),
        tenant.email,
        tenant.phone,
        tenant.location,
        tenant.tenantId,
        tenant.iboId,
        tenant.userIds.join(' '),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchHaystack.includes(normalizedQuery)
    })

    const sortedItems = [...filteredItems]
    sortedItems.sort((leftTenant, rightTenant) => {
      const leftName = getTenantDisplayName(leftTenant)
      const rightName = getTenantDisplayName(rightTenant)

      if (sortOption === 'name-asc') {
        return leftName.localeCompare(rightName, undefined, { sensitivity: 'base' })
      }

      if (sortOption === 'name-desc') {
        return rightName.localeCompare(leftName, undefined, { sensitivity: 'base' })
      }

      if (sortOption === 'rent-status-asc') {
        const leftStatus = leftTenant.rentStatus.trim().toLowerCase()
        const rightStatus = rightTenant.rentStatus.trim().toLowerCase()
        return leftStatus.localeCompare(rightStatus, undefined, { sensitivity: 'base' })
      }

      if (sortOption === 'amount-owed-desc') {
        const leftValue = leftTenant.amountOwed ?? Number.NEGATIVE_INFINITY
        const rightValue = rightTenant.amountOwed ?? Number.NEGATIVE_INFINITY
        return rightValue - leftValue
      }

      const leftDueOn = parseSortableTimestamp(leftTenant.dueOn)
      const rightDueOn = parseSortableTimestamp(rightTenant.dueOn)

      return leftDueOn - rightDueOn
    })

    return sortedItems
  }, [searchQuery, sortOption, statusFilter, tenantsList])

  return (
    <div className="space-y-6">
      <section className={cn(surfaceCardClass, 'dashboard-enter dashboard-enter-delay-1')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Tenant Summary</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Snapshot from <span className="font-mono">/api/admin/users/tenants/summary</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onRefreshSummary}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            <RefreshCw className={cn('h-4 w-4', isTenantsSummaryLoading && 'animate-spin')} />
            Refresh
          </button>
        </div>

        {tenantsSummaryError ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
            {tenantsSummaryError}
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tenantStatCards.map((card) => {
              const Icon = card.icon

              return (
                <article
                  key={card.key}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{card.label}</p>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>

                  <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">{card.value}</p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{card.note}</p>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className={cn(surfaceCardClass, 'dashboard-enter dashboard-enter-delay-2')}>
        <header className="flex flex-col gap-4 border-b border-slate-200/70 pb-4 sm:flex-row sm:items-start sm:justify-between dark:border-slate-800/70">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Tenants Directory</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Snapshot from <span className="font-mono">/api/admin/users/tenants/list</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onRefreshList}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-100 sm:w-auto dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            <RefreshCw className={cn('h-4 w-4', isTenantsListLoading && 'animate-spin')} />
            Refresh
          </button>
        </header>

        {tenantsListError ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
            {tenantsListError}
          </div>
        ) : !hasTenantRows ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {isTenantsListLoading ? 'Loading tenants...' : 'No tenants available yet.'}
          </div>
        ) : (
          <>
            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,12rem)_minmax(0,12rem)]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  type="text"
                  placeholder="Search tenants"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500"
                />
              </label>

              <label className="relative flex w-full min-w-0 items-center rounded-lg border border-slate-200 bg-white text-xs text-slate-600 transition-colors focus-within:border-blue-400 focus-within:bg-blue-50/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus-within:border-blue-500 dark:focus-within:bg-blue-950/20">
                <Filter className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-10 w-full appearance-none bg-transparent py-2 pl-9 pr-10 text-sm font-medium text-slate-900 outline-none dark:text-slate-100"
                >
                  <option value="all">All Statuses</option>
                  {availableRentStatuses.map((status) => (
                    <option key={status} value={status}>
                      {formatStatusLabel(status)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
              </label>

              <label className="relative flex w-full min-w-0 items-center rounded-lg border border-slate-200 bg-white text-xs text-slate-600 transition-colors focus-within:border-blue-400 focus-within:bg-blue-50/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus-within:border-blue-500 dark:focus-within:bg-blue-950/20">
                <ArrowUpDown className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
                <select
                  value={sortOption}
                  onChange={(event) => setSortOption(event.target.value as TenantSortOption)}
                  className="h-10 w-full appearance-none bg-transparent py-2 pl-9 pr-10 text-sm font-medium text-slate-900 outline-none dark:text-slate-100"
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="rent-status-asc">Status</option>
                  <option value="amount-owed-desc">Amount owed</option>
                  <option value="due-on-asc">Due date</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
              </label>
            </div>

            {filteredTenants.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No tenants match your filters.
              </div>
            ) : (
              <ul className="mt-5 flex flex-wrap justify-center gap-4 sm:justify-between">
                {filteredTenants.map((tenant) => {
                  const hasAmountToPay = tenant.amountToPay !== null
                  const hasDueOn = Boolean(tenant.dueOn)
                  const hasAmountOwed = tenant.amountOwed !== null
                  const hasWasDueOn = Boolean(tenant.wasDueOn)

                  return (
                    <li
                      key={tenant.id}
                      className="flex w-full max-w-[350px] flex-none flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 shadow-sm shadow-slate-900/5 transition-colors hover:bg-white/90 dark:border-slate-800 dark:bg-slate-950/40 dark:shadow-black/20 dark:hover:bg-slate-950/60"
                    >
                    <div className="flex items-start justify-between gap-4 max-[400px]:flex-col max-[400px]:items-stretch">
                      <div className="flex min-w-0 items-center gap-4 max-[400px]:w-full">
                        <TenantAvatar tenant={tenant} className="h-12 w-12 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">
                            {getTenantDisplayName(tenant)}
                          </p>
                          <p className="mt-0.5 break-words text-xs leading-snug text-slate-500 dark:text-slate-400">
                            {tenant.email || 'No email provided'}
                          </p>
                        </div>
                      </div>

                      <span
                        className={cn(
                          'inline-flex shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-medium capitalize max-[400px]:self-start',
                          getRentStatusClasses(tenant.rentStatus),
                        )}
                      >
                        {formatStatusLabel(tenant.rentStatus)}
                      </span>
                    </div>

                    {tenant.location ? (
                      <p className="mt-4 line-clamp-2 break-words text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {tenant.location}
                      </p>
                    ) : null}

                    <div className="mt-4 border-t border-slate-200/70 pt-4 dark:border-slate-800/70">
                      <dl className="grid gap-3 text-xs">
                        <div className="flex items-baseline justify-between gap-3 max-[400px]:flex-col max-[400px]:items-start">
                          <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                            Phone
                          </dt>
                          <dd className="text-right font-medium text-slate-900 dark:text-slate-100 max-[400px]:text-left">
                            {tenant.phone || '—'}
                          </dd>
                        </div>

                        {hasAmountToPay ? (
                          <div className="flex items-baseline justify-between gap-3 max-[400px]:flex-col max-[400px]:items-start">
                            <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                              Amount to pay
                            </dt>
                            <dd className="text-right font-medium text-slate-900 dark:text-slate-100 max-[400px]:text-left">
                              {formatCurrencyValue(tenant.amountToPay, tenant.rentCurrency)}
                            </dd>
                          </div>
                        ) : null}

                        {hasDueOn ? (
                          <div className="flex items-baseline justify-between gap-3 max-[400px]:flex-col max-[400px]:items-start">
                            <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                              Due on
                            </dt>
                            <dd className="text-right font-medium text-slate-900 dark:text-slate-100 max-[400px]:text-left">
                              {formatDate(tenant.dueOn)}
                            </dd>
                          </div>
                        ) : null}

                        {hasAmountOwed ? (
                          <div className="flex items-baseline justify-between gap-3 max-[400px]:flex-col max-[400px]:items-start">
                            <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                              Amount owed
                            </dt>
                            <dd className="text-right font-medium text-slate-900 dark:text-slate-100 max-[400px]:text-left">
                              {formatCurrencyValue(tenant.amountOwed, tenant.rentCurrency)}
                            </dd>
                          </div>
                        ) : null}

                        {hasWasDueOn ? (
                          <div className="flex items-baseline justify-between gap-3 max-[400px]:flex-col max-[400px]:items-start">
                            <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                              Was due on
                            </dt>
                            <dd className="text-right font-medium text-slate-900 dark:text-slate-100 max-[400px]:text-left">
                              {formatDate(tenant.wasDueOn)}
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                    </div>
                  </li>
                  )
                })}
              </ul>
            )}

            <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
              <div className="sm:hidden">
                <div className="flex flex-col gap-3 max-[400px]:gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onPageChange((previousPage) => Math.max(previousPage - 1, 1))}
                      disabled={currentTenantListPage <= 1 || isTenantsListLoading}
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 max-[400px]:h-8 max-[400px]:px-2 max-[400px]:text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Prev
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onPageChange((previousPage) => Math.min(previousPage + 1, tenantsTotalPages))
                      }
                      disabled={currentTenantListPage >= tenantsTotalPages || isTenantsListLoading}
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 max-[400px]:h-8 max-[400px]:px-2 max-[400px]:text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-1">
                    {tenantMobilePaginationItems.map((item) => {
                      if (typeof item !== 'number') {
                        return (
                          <span
                            key={item}
                            className="inline-flex h-9 min-w-7 items-center justify-center px-1 text-sm font-medium text-slate-400 max-[400px]:h-8 max-[400px]:min-w-6 max-[400px]:text-xs dark:text-slate-500"
                          >
                            ...
                          </span>
                        )
                      }

                      const isActivePage = item === currentTenantListPage

                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => onPageChange(item)}
                          disabled={isTenantsListLoading}
                          aria-current={isActivePage ? 'page' : undefined}
                          className={cn(
                            'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 max-[400px]:h-8 max-[400px]:min-w-8 max-[400px]:px-2 max-[400px]:text-xs',
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
                </div>
              </div>

              <div className="hidden items-center justify-end gap-3 sm:flex">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onPageChange((previousPage) => Math.max(previousPage - 1, 1))}
                    disabled={currentTenantListPage <= 1 || isTenantsListLoading}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </button>

                  <div className="flex flex-wrap items-center gap-1">
                    {tenantDesktopPaginationItems.map((item) => {
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

                      const isActivePage = item === currentTenantListPage

                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => onPageChange(item)}
                          disabled={isTenantsListLoading}
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
                    onClick={() => onPageChange((previousPage) => Math.min(previousPage + 1, tenantsTotalPages))}
                    disabled={currentTenantListPage >= tenantsTotalPages || isTenantsListLoading}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

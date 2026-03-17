import { Activity, Building2, ChevronDown, ChevronLeft, ChevronRight, Filter, RefreshCw, Search, Wallet, type LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'

import { cn } from '../../../lib/cn'
import type { PropertyList, PropertyListItem, PropertyMetrics } from '../../../services'
import { PropertyDirectoryCard } from './property-card'
import { PropertyDetailsModal } from './property-details-modal'
import {
  buildPaginationItems,
  compactNumberFormatter,
  formatCurrencyValue,
  formatPropertyLabel,
  numberFormatter,
  surfaceCardClass,
} from './shared'

type OverviewStatCard = {
  key: string
  label: string
  value: string
  note: string
  icon: LucideIcon
}

type OverviewDashboardViewProps = {
  metrics: PropertyMetrics | null
  metricsError: string | null
  isMetricsLoading: boolean
  onRefreshMetrics: () => void
  propertyList: PropertyList | null
  listError: string | null
  isListLoading: boolean
  onRefreshList: () => void
  currentPage: number
  onCurrentPageChange: Dispatch<SetStateAction<number>>
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  listingFilter: string
  onListingFilterChange: (value: string) => void
  typeFilter: string
  onTypeFilterChange: (value: string) => void
  availableStatuses: string[]
  availableListingTypes: string[]
  availablePropertyTypes: string[]
  onClearFilters: () => void
}

export function OverviewDashboardView({
  metrics,
  metricsError,
  isMetricsLoading,
  onRefreshMetrics,
  propertyList,
  listError,
  isListLoading,
  onRefreshList,
  currentPage,
  onCurrentPageChange,
  searchQuery,
  onSearchQueryChange,
  statusFilter,
  onStatusFilterChange,
  listingFilter,
  onListingFilterChange,
  typeFilter,
  onTypeFilterChange,
  availableStatuses,
  availableListingTypes,
  availablePropertyTypes,
  onClearFilters,
}: OverviewDashboardViewProps) {
  const [actionMenuPropertyId, setActionMenuPropertyId] = useState<string | null>(null)
  const [selectedProperty, setSelectedProperty] = useState<PropertyListItem | null>(null)

  useEffect(() => {
    if (!selectedProperty) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [selectedProperty])

  useEffect(() => {
    if (!actionMenuPropertyId && !selectedProperty) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return
      }

      if (selectedProperty) {
        setSelectedProperty(null)
        return
      }

      setActionMenuPropertyId(null)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [actionMenuPropertyId, selectedProperty])

  useEffect(() => {
    if (!actionMenuPropertyId) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target
      if (target instanceof HTMLElement && target.closest('[data-property-action-menu]')) {
        return
      }

      setActionMenuPropertyId(null)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [actionMenuPropertyId])

  const derivedMetrics = useMemo(() => {
    const currentMetrics = metrics ?? {
      totalProperties: 0,
      activeListings: 0,
      totalValue: 0,
    }

    const inactiveListings = Math.max(currentMetrics.totalProperties - currentMetrics.activeListings, 0)
    const activeShare =
      currentMetrics.totalProperties > 0 ? (currentMetrics.activeListings / currentMetrics.totalProperties) * 100 : 0

    return {
      ...currentMetrics,
      inactiveListings,
      activeShare,
    }
  }, [metrics])

  const statCards = useMemo<OverviewStatCard[]>(
    () => [
      {
        key: 'total-properties',
        label: 'Total Properties',
        value: numberFormatter.format(derivedMetrics.totalProperties),
        note: 'Total assets currently tracked on the platform',
        icon: Building2,
      },
      {
        key: 'active-listings',
        label: 'Active Listings',
        value: numberFormatter.format(derivedMetrics.activeListings),
        note: `${derivedMetrics.activeShare.toFixed(1)}% of properties are actively listed`,
        icon: Activity,
      },
      {
        key: 'total-value',
        label: 'Total Value',
        value: `₦${compactNumberFormatter.format(derivedMetrics.totalValue)}`,
        note: formatCurrencyValue(derivedMetrics.totalValue),
        icon: Wallet,
      },
    ],
    [derivedMetrics],
  )

  const hasActiveFilters = Boolean(searchQuery.trim()) || statusFilter !== 'all' || listingFilter !== 'all' || typeFilter !== 'all'
  const totalProperties = propertyList?.meta.total ?? 0
  const propertyPageSize = propertyList?.meta.limit || propertyList?.data.length || 1
  const totalPages = Math.max(propertyList?.meta.totalPages || Math.ceil(totalProperties / propertyPageSize) || 1, 1)
  const currentListPage = propertyList?.meta.page ?? currentPage
  const hasPropertyRows = (propertyList?.data.length ?? 0) > 0
  const pagePropertyCount = propertyList?.data.length ?? 0
  const pageStart = totalProperties === 0 ? 0 : (currentListPage - 1) * propertyPageSize + 1
  const pageEnd = totalProperties === 0 ? 0 : Math.min(currentListPage * propertyPageSize, totalProperties)
  const desktopPaginationItems = buildPaginationItems(currentListPage, totalPages, 7)
  const mobilePaginationItems = buildPaginationItems(currentListPage, totalPages, 5)

  return (
    <div className="space-y-4">
      {metricsError ? (
        <section className={cn(surfaceCardClass, 'dashboard-enter dashboard-enter-delay-1')}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-300">Property metrics unavailable</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{metricsError}</p>
            </div>
            <button
              type="button"
              onClick={onRefreshMetrics}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              <RefreshCw className={cn('h-4 w-4', isMetricsLoading && 'animate-spin')} />
              Retry
            </button>
          </div>
        </section>
      ) : null}

      <section className={cn(surfaceCardClass, 'dashboard-enter dashboard-enter-delay-1')}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Property Metrics</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Snapshot from property metrics.
            </p>
          </div>
          <button
            type="button"
            onClick={onRefreshMetrics}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white p-0 text-sm font-medium transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 sm:w-auto sm:px-3"
          >
            <RefreshCw className={cn('h-4 w-4', isMetricsLoading && 'animate-spin')} />
            <span className="sr-only sm:not-sr-only">Refresh</span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
          {statCards.map((card) => {
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

                <p
                  className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 md:line-clamp-1"
                  title={card.note}
                >
                  {card.value}
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{card.note}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className={cn(surfaceCardClass, 'dashboard-enter dashboard-enter-delay-2')}>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Overview Notes</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Inactive Listings</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {numberFormatter.format(derivedMetrics.inactiveListings)}
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Properties currently not in the active listing pool.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Listing Activity Ratio</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">{derivedMetrics.activeShare.toFixed(1)}%</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Active listings as a share of total tracked properties.
            </p>
          </article>
        </div>
      </section>

      <section className={cn(surfaceCardClass, 'dashboard-enter dashboard-enter-delay-3')}>
        <header className="flex items-start justify-between gap-3 sm:items-center">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Property Directory</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {totalProperties > 0
                ? `Showing ${numberFormatter.format(pageStart)}-${numberFormatter.format(pageEnd)} of ${numberFormatter.format(totalProperties)} properties`
                : 'Snapshot from properties'}
            </p>
          </div>
          <button
            type="button"
            onClick={onRefreshList}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white p-0 text-sm font-medium transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 sm:w-auto sm:px-3"
          >
            <RefreshCw className={cn('h-4 w-4', isListLoading && 'animate-spin')} />
            <span className="sr-only sm:not-sr-only">Refresh</span>
          </button>
        </header>

        {listError ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
            {listError}
          </div>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,auto))]">
              <label className="relative col-span-2 block xl:col-span-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => {
                    onSearchQueryChange(event.target.value)
                    onCurrentPageChange(1)
                  }}
                  type="text"
                  placeholder="Search by title, public ID, city, description, or feature"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500"
                />
              </label>

              <label className="relative flex w-full min-w-0 items-center rounded-lg border border-slate-200 bg-white text-xs text-slate-600 transition-colors focus-within:border-blue-400 focus-within:bg-blue-50/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus-within:border-blue-500 dark:focus-within:bg-blue-950/20 xl:min-w-[12rem]">
                <Filter className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    onStatusFilterChange(event.target.value)
                    onCurrentPageChange(1)
                  }}
                  className="h-10 w-full appearance-none bg-transparent py-2 pl-9 pr-10 text-sm font-medium text-slate-900 outline-none dark:text-slate-100"
                >
                  <option value="all">All Statuses</option>
                  {availableStatuses.map((status) => (
                    <option key={status} value={status}>
                      {formatPropertyLabel(status)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
              </label>

              <label className="relative flex w-full min-w-0 items-center rounded-lg border border-slate-200 bg-white text-xs text-slate-600 transition-colors focus-within:border-blue-400 focus-within:bg-blue-50/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus-within:border-blue-500 dark:focus-within:bg-blue-950/20 xl:min-w-[12rem]">
                <select
                  value={listingFilter}
                  onChange={(event) => {
                    onListingFilterChange(event.target.value)
                    onCurrentPageChange(1)
                  }}
                  className="h-10 w-full appearance-none bg-transparent px-3 pr-10 text-sm font-medium text-slate-900 outline-none dark:text-slate-100"
                >
                  <option value="all">All Listing Types</option>
                  {availableListingTypes.map((listingType) => (
                    <option key={listingType} value={listingType}>
                      {formatPropertyLabel(listingType)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
              </label>

              <label className="relative flex w-full min-w-0 items-center rounded-lg border border-slate-200 bg-white text-xs text-slate-600 transition-colors focus-within:border-blue-400 focus-within:bg-blue-50/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus-within:border-blue-500 dark:focus-within:bg-blue-950/20 xl:min-w-[12rem]">
                <select
                  value={typeFilter}
                  onChange={(event) => {
                    onTypeFilterChange(event.target.value)
                    onCurrentPageChange(1)
                  }}
                  className="h-10 w-full appearance-none bg-transparent px-3 pr-10 text-sm font-medium text-slate-900 outline-none dark:text-slate-100"
                >
                  <option value="all">All Property Types</option>
                  {availablePropertyTypes.map((propertyType) => (
                    <option key={propertyType} value={propertyType}>
                      {formatPropertyLabel(propertyType)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
              </label>

              <button
                type="button"
                onClick={() => {
                  onClearFilters()
                  onCurrentPageChange(1)
                }}
                disabled={!hasActiveFilters}
                className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Clear
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <p>
                {hasActiveFilters
                  ? `${numberFormatter.format(pagePropertyCount)} match${pagePropertyCount === 1 ? '' : 'es'} on this page`
                  : `${numberFormatter.format(pagePropertyCount)} propert${pagePropertyCount === 1 ? 'y' : 'ies'} on this page`}
              </p>
              <p>
                {hasActiveFilters
                  ? 'Search and filters are applied through the server and paginated by the server.'
                  : 'Browse the current page of properties.'}
              </p>
            </div>

            {!hasPropertyRows ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                {isListLoading
                  ? 'Loading properties...'
                  : hasActiveFilters
                    ? 'No properties match the current search or filters.'
                    : 'No properties available yet.'}
              </div>
            ) : (
              <>
                <ul className="mt-4 flex flex-wrap gap-4 lg:justify-between">
                  {(propertyList?.data ?? []).map((property) => (
                    <PropertyDirectoryCard
                      key={property.id}
                      property={property}
                      isMenuOpen={actionMenuPropertyId === property.id}
                      onToggleMenu={() =>
                        setActionMenuPropertyId((previousPropertyId) => (previousPropertyId === property.id ? null : property.id))
                      }
                      onViewProperty={() => {
                        setSelectedProperty(property)
                        setActionMenuPropertyId(null)
                      }}
                    />
                  ))}
                </ul>

                <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
                  <div className="flex flex-col gap-3 sm:hidden">
                    <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                      Page {numberFormatter.format(currentListPage)} of {numberFormatter.format(totalPages)}
                    </p>

                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onCurrentPageChange((previousPage) => Math.max(previousPage - 1, 1))}
                        disabled={currentListPage <= 1 || isListLoading}
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

                          const isActivePage = item === currentListPage

                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => onCurrentPageChange(item)}
                              disabled={isListLoading}
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
                        onClick={() => onCurrentPageChange((previousPage) => Math.min(previousPage + 1, totalPages))}
                        disabled={currentListPage >= totalPages || isListLoading}
                        className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="hidden items-center justify-between gap-3 sm:flex">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Page {numberFormatter.format(currentListPage)} of {numberFormatter.format(totalPages)}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onCurrentPageChange((previousPage) => Math.max(previousPage - 1, 1))}
                        disabled={currentListPage <= 1 || isListLoading}
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

                          const isActivePage = item === currentListPage

                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => onCurrentPageChange(item)}
                              disabled={isListLoading}
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
                        onClick={() => onCurrentPageChange((previousPage) => Math.min(previousPage + 1, totalPages))}
                        disabled={currentListPage >= totalPages || isListLoading}
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
          </>
        )}
      </section>

      {selectedProperty ? <PropertyDetailsModal key={selectedProperty.id} property={selectedProperty} onClose={() => setSelectedProperty(null)} /> : null}
    </div>
  )
}

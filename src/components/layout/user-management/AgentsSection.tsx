import {
  AlertTriangle,
  ArrowUpDown,
  BadgeCheck,
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
import type { AgentsList, AgentsSummary } from '../../../services'

import { AgentAvatar } from './avatars'
import {
  AGENTS_PAGE_SIZE,
  buildPaginationItems,
  formatStatusLabel,
  getAgentDisplayName,
  getStatusClasses,
  numberFormatter,
  surfaceCardClass,
} from './utils'

type AgentsSectionProps = {
  agentsSummary: AgentsSummary | null
  isAgentsSummaryLoading: boolean
  agentsSummaryError: string | null
  onRefreshSummary: () => void
  agentsList: AgentsList | null
  isAgentsListLoading: boolean
  agentsListError: string | null
  onRefreshList: () => void
  currentPage: number
  onPageChange: Dispatch<SetStateAction<number>>
}

type AgentStatCard = {
  key: string
  label: string
  value: string
  note: string
  icon: typeof Users
}

type AgentSortOption = 'name-asc' | 'name-desc' | 'status-asc' | 'houses-desc' | 'tenants-desc'

export function AgentsSection({
  agentsSummary,
  isAgentsSummaryLoading,
  agentsSummaryError,
  onRefreshSummary,
  agentsList,
  isAgentsListLoading,
  agentsListError,
  onRefreshList,
  currentPage,
  onPageChange,
}: AgentsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortOption, setSortOption] = useState<AgentSortOption>('name-asc')

  const agentStatCards = useMemo<AgentStatCard[]>(() => {
    const currentSummary = agentsSummary ?? {
      totalAgents: 0,
      activeAgents: 0,
      inactiveAgents: 0,
    }

    return [
      {
        key: 'total-agents',
        label: 'Total Agents',
        value: numberFormatter.format(currentSummary.totalAgents),
        note: 'Agents registered across the platform',
        icon: Users,
      },
      {
        key: 'active-agents',
        label: 'Active Agents',
        value: numberFormatter.format(currentSummary.activeAgents),
        note: 'Agents currently active in the portfolio',
        icon: BadgeCheck,
      },
      {
        key: 'inactive-agents',
        label: 'Inactive Agents',
        value: numberFormatter.format(currentSummary.inactiveAgents),
        note: 'Agents marked inactive in the current window',
        icon: AlertTriangle,
      },
    ]
  }, [agentsSummary])

  const totalAgents = agentsList?.total ?? 0
  const agentsTotalPages = Math.max(1, Math.ceil(totalAgents / (agentsList?.limit ?? AGENTS_PAGE_SIZE)))
  const currentAgentsListPage = agentsList?.page ?? currentPage
  const hasAgentRows = (agentsList?.items.length ?? 0) > 0
  const agentDesktopPaginationItems = buildPaginationItems(currentAgentsListPage, agentsTotalPages, 7)
  const agentMobilePaginationItems = buildPaginationItems(currentAgentsListPage, agentsTotalPages, 5)
  const availableStatuses = useMemo(() => {
    const statuses = new Set<string>()

    for (const agent of agentsList?.items ?? []) {
      const status = agent.status.trim().toLowerCase()
      if (status) {
        statuses.add(status)
      }
    }

    return Array.from(statuses).sort((leftStatus, rightStatus) => leftStatus.localeCompare(rightStatus))
  }, [agentsList])

  const filteredAgents = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    const filteredItems = (agentsList?.items ?? []).filter((agent) => {
      if (statusFilter !== 'all') {
        const normalizedStatus = agent.status.trim().toLowerCase()
        if (normalizedStatus !== statusFilter) {
          return false
        }
      }

      if (!normalizedQuery) {
        return true
      }

      const searchHaystack = [
        getAgentDisplayName(agent),
        agent.email,
        agent.phone,
        agent.userId,
        agent.agentId,
        agent.iboId,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchHaystack.includes(normalizedQuery)
    })

    const sortedItems = [...filteredItems]
    sortedItems.sort((leftAgent, rightAgent) => {
      const leftName = getAgentDisplayName(leftAgent)
      const rightName = getAgentDisplayName(rightAgent)

      if (sortOption === 'name-asc') {
        return leftName.localeCompare(rightName, undefined, { sensitivity: 'base' })
      }

      if (sortOption === 'name-desc') {
        return rightName.localeCompare(leftName, undefined, { sensitivity: 'base' })
      }

      if (sortOption === 'status-asc') {
        const leftStatus = leftAgent.status.trim().toLowerCase()
        const rightStatus = rightAgent.status.trim().toLowerCase()
        return leftStatus.localeCompare(rightStatus, undefined, { sensitivity: 'base' })
      }

      if (sortOption === 'houses-desc') {
        return rightAgent.housesUploadedCount - leftAgent.housesUploadedCount
      }

      return rightAgent.tenantsCount - leftAgent.tenantsCount
    })

    return sortedItems
  }, [agentsList, searchQuery, sortOption, statusFilter])

  return (
    <div className="space-y-6">
      <section className={cn(surfaceCardClass, 'dashboard-enter dashboard-enter-delay-1')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Agent Summary</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Snapshot from <span className="font-mono">/api/admin/users/agents/summary</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onRefreshSummary}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            <RefreshCw className={cn('h-4 w-4', isAgentsSummaryLoading && 'animate-spin')} />
            Refresh
          </button>
        </div>

        {agentsSummaryError ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
            {agentsSummaryError}
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agentStatCards.map((card) => {
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
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Agents Directory</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Snapshot from <span className="font-mono">/api/admin/users/agents/list</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onRefreshList}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-100 sm:w-auto dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            <RefreshCw className={cn('h-4 w-4', isAgentsListLoading && 'animate-spin')} />
            Refresh
          </button>
        </header>

        {agentsListError ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
            {agentsListError}
          </div>
        ) : !hasAgentRows ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {isAgentsListLoading ? 'Loading agents...' : 'No agents available yet.'}
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
                  placeholder="Search agents"
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
                  {availableStatuses.map((status) => (
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
                  onChange={(event) => setSortOption(event.target.value as AgentSortOption)}
                  className="h-10 w-full appearance-none bg-transparent py-2 pl-9 pr-10 text-sm font-medium text-slate-900 outline-none dark:text-slate-100"
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="status-asc">Status</option>
                  <option value="houses-desc">Houses uploaded</option>
                  <option value="tenants-desc">Tenants</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
              </label>
            </div>

            {filteredAgents.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No agents match your filters.
              </div>
            ) : (
              <ul className="mt-5 flex flex-wrap justify-center gap-4 sm:justify-between">
                {filteredAgents.map((agent) => (
                  <li
                    key={agent.id}
                    className="flex w-full max-w-[350px] flex-none flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 shadow-sm shadow-slate-900/5 transition-colors hover:bg-white/90 dark:border-slate-800 dark:bg-slate-950/40 dark:shadow-black/20 dark:hover:bg-slate-950/60"
                  >
                  <div className="flex items-start justify-between gap-4 max-[400px]:flex-col max-[400px]:items-stretch">
                    <div className="flex min-w-0 items-center gap-4 max-[400px]:w-full">
                      <AgentAvatar agent={agent} className="h-12 w-12 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">
                          {getAgentDisplayName(agent)}
                        </p>
                        <p className="mt-0.5 break-words text-xs leading-snug text-slate-500 dark:text-slate-400">
                          {agent.email || 'No email provided'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={cn(
                        'inline-flex shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-medium capitalize max-[400px]:self-start',
                        getStatusClasses(agent.status),
                      )}
                    >
                      {agent.status || 'unknown'}
                    </span>
                  </div>

                  <div className="mt-4 border-t border-slate-200/70 pt-4 dark:border-slate-800/70">
                    <dl className="grid gap-3 text-xs">
                      <div className="flex items-baseline justify-between gap-3 max-[400px]:flex-col max-[400px]:items-start">
                        <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                          Phone
                        </dt>
                        <dd className="text-right font-medium text-slate-900 dark:text-slate-100 max-[400px]:text-left">
                          {agent.phone || '—'}
                        </dd>
                      </div>

                      <div className="flex items-baseline justify-between gap-3 max-[400px]:flex-col max-[400px]:items-start">
                        <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                          Houses uploaded
                        </dt>
                        <dd className="text-right font-medium text-slate-900 dark:text-slate-100 max-[400px]:text-left">
                          {numberFormatter.format(agent.housesUploadedCount)}
                        </dd>
                      </div>

                      <div className="flex items-baseline justify-between gap-3 max-[400px]:flex-col max-[400px]:items-start">
                        <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                          Tenants
                        </dt>
                        <dd className="text-right font-medium text-slate-900 dark:text-slate-100 max-[400px]:text-left">
                          {numberFormatter.format(agent.tenantsCount)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
              <div className="sm:hidden">
                <div className="flex flex-col gap-3 max-[400px]:gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onPageChange((previousPage) => Math.max(previousPage - 1, 1))}
                      disabled={currentAgentsListPage <= 1 || isAgentsListLoading}
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 max-[400px]:h-8 max-[400px]:px-2 max-[400px]:text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Prev
                    </button>

                    <button
                      type="button"
                      onClick={() => onPageChange((previousPage) => Math.min(previousPage + 1, agentsTotalPages))}
                      disabled={currentAgentsListPage >= agentsTotalPages || isAgentsListLoading}
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 max-[400px]:h-8 max-[400px]:px-2 max-[400px]:text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-1">
                    {agentMobilePaginationItems.map((item) => {
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

                      const isActivePage = item === currentAgentsListPage

                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => onPageChange(item)}
                          disabled={isAgentsListLoading}
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
                    disabled={currentAgentsListPage <= 1 || isAgentsListLoading}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </button>

                  <div className="flex flex-wrap items-center gap-1">
                    {agentDesktopPaginationItems.map((item) => {
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

                      const isActivePage = item === currentAgentsListPage

                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => onPageChange(item)}
                          disabled={isAgentsListLoading}
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
                    onClick={() => onPageChange((previousPage) => Math.min(previousPage + 1, agentsTotalPages))}
                    disabled={currentAgentsListPage >= agentsTotalPages || isAgentsListLoading}
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

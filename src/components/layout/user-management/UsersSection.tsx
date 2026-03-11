import { Activity, BadgeCheck, ChevronLeft, ChevronRight, RefreshCw, UserPlus, Users } from 'lucide-react'
import { useMemo, type Dispatch, type SetStateAction } from 'react'

import { cn } from '../../../lib/cn'
import type { UserBaseList, UserBaseSummary } from '../../../services'

import { UserAvatar } from './avatars'
import {
  USERS_PAGE_SIZE,
  buildPaginationItems,
  formatDateTime,
  formatJoinedDate,
  getStatusClasses,
  getUserDisplayName,
  numberFormatter,
  surfaceCardClass,
} from './utils'

type UsersSectionProps = {
  summary: UserBaseSummary | null
  isSummaryLoading: boolean
  summaryError: string | null
  onRefreshSummary: () => void
  userList: UserBaseList | null
  isListLoading: boolean
  listError: string | null
  onRefreshList: () => void
  currentPage: number
  onPageChange: Dispatch<SetStateAction<number>>
}

type UserStatCard = {
  key: string
  label: string
  value: string
  note: string
  icon: typeof Users
}

export function UsersSection({
  summary,
  isSummaryLoading,
  summaryError,
  onRefreshSummary,
  userList,
  isListLoading,
  listError,
  onRefreshList,
  currentPage,
  onPageChange,
}: UsersSectionProps) {
  const statCards = useMemo<UserStatCard[]>(() => {
    const currentSummary = summary ?? {
      totalUsers: 0,
      activeUsers: 0,
      verifiedUsers: 0,
      recentSignups: 0,
      percentageActive: '0%',
      percentageVerified: '0%',
    }

    return [
      {
        key: 'total-users',
        label: 'Total Users',
        value: numberFormatter.format(currentSummary.totalUsers),
        note: 'Registered accounts across the platform',
        icon: Users,
      },
      {
        key: 'active-users',
        label: 'Active Users',
        value: numberFormatter.format(currentSummary.activeUsers),
        note: `${currentSummary.percentageActive} of total users are active`,
        icon: Activity,
      },
      {
        key: 'verified-users',
        label: 'Verified Users',
        value: numberFormatter.format(currentSummary.verifiedUsers),
        note: `${currentSummary.percentageVerified} of total users are verified`,
        icon: BadgeCheck,
      },
      {
        key: 'recent-signups',
        label: 'Recent Signups',
        value: numberFormatter.format(currentSummary.recentSignups),
        note: 'New users added in the latest signup window',
        icon: UserPlus,
      },
    ]
  }, [summary])

  const totalUsers = userList?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalUsers / (userList?.limit ?? USERS_PAGE_SIZE)))
  const currentListPage = userList?.page ?? currentPage
  const hasUserRows = (userList?.items.length ?? 0) > 0
  const pageStart = totalUsers === 0 ? 0 : (currentListPage - 1) * (userList?.limit ?? USERS_PAGE_SIZE) + 1
  const pageEnd = totalUsers === 0 ? 0 : Math.min(currentListPage * (userList?.limit ?? USERS_PAGE_SIZE), totalUsers)
  const desktopPaginationItems = buildPaginationItems(currentListPage, totalPages, 7)
  const mobilePaginationItems = buildPaginationItems(currentListPage, totalPages, 5)

  return (
    <div className="space-y-4">
      <section className={cn(surfaceCardClass, 'dashboard-enter dashboard-enter-delay-1')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">User Summary</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Snapshot from <span className="font-mono">/api/admin/users/base/summary</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onRefreshSummary}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            <RefreshCw className={cn('h-4 w-4', isSummaryLoading && 'animate-spin')} />
            Refresh
          </button>
        </div>

        {summaryError ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
            {summaryError}
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

                  <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">{card.value}</p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{card.note}</p>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className={cn(surfaceCardClass, 'dashboard-enter dashboard-enter-delay-2')}>
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Users Directory</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {totalUsers > 0
                ? `Showing ${numberFormatter.format(pageStart)}-${numberFormatter.format(pageEnd)} of ${numberFormatter.format(totalUsers)} users`
                : 'Snapshot from /api/admin/users/base/list'}
            </p>
          </div>
          <button
            type="button"
            onClick={onRefreshList}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            <RefreshCw className={cn('h-4 w-4', isListLoading && 'animate-spin')} />
            Refresh
          </button>
        </header>

        {listError ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
            {listError}
          </div>
        ) : !hasUserRows ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {isListLoading ? 'Loading users...' : 'No users available yet.'}
          </div>
        ) : (
          <>
            <ul className="mt-4 space-y-3 lg:hidden">
              {userList?.items.map((user) => (
                <li
                  key={user.id}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40"
                >
                  <div className="flex items-start justify-between gap-3 max-[400px]:flex-col max-[400px]:items-stretch">
                    <div className="flex min-w-0 items-center gap-3 max-[400px]:w-full">
                      <UserAvatar user={user} className="h-11 w-11 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100 max-[400px]:whitespace-normal max-[400px]:break-words">
                          {getUserDisplayName(user)}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400 max-[400px]:whitespace-normal max-[400px]:break-all">
                          {user.email || 'No email provided'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium capitalize max-[400px]:self-start',
                        getStatusClasses(user.status),
                      )}
                    >
                      {user.status || 'unknown'}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-between gap-3">
                      <span>Phone</span>
                      <span className="text-right text-slate-700 dark:text-slate-200">
                        {user.phoneNumber || 'No phone'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Date Joined</span>
                      <span className="text-right text-slate-700 dark:text-slate-200">{formatJoinedDate(user)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Last Seen</span>
                      <span className="text-right text-slate-700 dark:text-slate-200">
                        {formatDateTime(user.lastSeen)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 hidden overflow-x-auto lg:block">
              <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <th className="pb-3 font-medium">User</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Phone</th>
                    <th className="pb-3 font-medium">Date Joined</th>
                    <th className="pb-3 font-medium">Last Seen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {userList?.items.map((user) => (
                    <tr key={user.id}>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={user} className="h-10 w-10 shrink-0" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                              {getUserDisplayName(user)}
                            </p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                              {user.email || 'No email provided'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium capitalize',
                            getStatusClasses(user.status),
                          )}
                        >
                          {user.status || 'unknown'}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{user.phoneNumber || 'No phone'}</td>
                      <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{formatJoinedDate(user)}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">{formatDateTime(user.lastSeen)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
              <div className="flex flex-col gap-3 sm:hidden">
                <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                  Page {numberFormatter.format(currentListPage)} of {numberFormatter.format(totalPages)}
                </p>

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onPageChange((previousPage) => Math.max(previousPage - 1, 1))}
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
                          onClick={() => onPageChange(item)}
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
                    onClick={() => onPageChange((previousPage) => Math.min(previousPage + 1, totalPages))}
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
                    onClick={() => onPageChange((previousPage) => Math.max(previousPage - 1, 1))}
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
                          onClick={() => onPageChange(item)}
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
                    onClick={() => onPageChange((previousPage) => Math.min(previousPage + 1, totalPages))}
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
      </section>
    </div>
  )
}


import {
  Activity,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  UserPlus,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { cn } from '../../lib/cn'
import { getApiErrorMessage } from '../../lib/http-client'
import {
  getUserBaseList,
  getUserBaseSummary,
  type UserBaseList,
  type UserBaseListItem,
  type UserBaseSummary,
} from '../../services'
import { useToast } from '../ui/toast-provider'

const USERS_PAGE_SIZE = 10

const numberFormatter = new Intl.NumberFormat('en-NG')

const surfaceCardClass =
  'rounded-2xl border border-slate-200/85 bg-white/90 p-4 shadow-sm shadow-slate-900/5 ring-1 ring-white/70 transition-colors dark:border-slate-800/80 dark:bg-slate-900/90 dark:ring-slate-800/80'

type DashboardUserManagementProps = {
  section: 'users' | 'tenants'
}

type PaginationItem = number | 'start-ellipsis' | 'end-ellipsis'
type UserAvatarProps = {
  user: UserBaseListItem
  className: string
}

function formatDateTime(value: string | null) {
  if (!value) {
    return 'Never'
  }

  const parsedTime = new Date(value)
  if (Number.isNaN(parsedTime.getTime())) {
    return 'Unknown time'
  }

  return parsedTime.toLocaleString('en-NG', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatJoinedDate(user: UserBaseListItem) {
  if (user.dateJoined) {
    return user.dateJoined
  }

  if (!user.createdAt) {
    return 'Unknown date'
  }

  return formatDateTime(user.createdAt)
}

function getUserDisplayName(user: UserBaseListItem) {
  return user.username || user.email || 'Unknown user'
}

function getUserInitials(user: UserBaseListItem) {
  const source = getUserDisplayName(user)
  const segments = source
    .split(/[^a-zA-Z0-9]+/)
    .map((segment) => segment.trim())
    .filter(Boolean)

  if (segments.length === 0) {
    return 'U'
  }

  if (segments.length === 1) {
    return segments[0].slice(0, 2).toUpperCase()
  }

  return `${segments[0][0] ?? ''}${segments[1][0] ?? ''}`.toUpperCase()
}

function getStatusClasses(status: string) {
  const normalizedStatus = status.trim().toLowerCase()

  if (normalizedStatus === 'active') {
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
  }

  if (normalizedStatus === 'inactive') {
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  }

  return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
}

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

function UserAvatar({ user, className }: UserAvatarProps) {
  const imageUrl = user.userProfileImage.trim()
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const shouldShowImage = Boolean(imageUrl) && failedImageUrl !== imageUrl

  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-200',
        className,
      )}
    >
      {shouldShowImage ? (
        <img
          src={imageUrl}
          alt={getUserDisplayName(user)}
          className="h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedImageUrl(imageUrl)}
        />
      ) : (
        getUserInitials(user)
      )}
    </div>
  )
}

export function DashboardUserManagement({ section }: DashboardUserManagementProps) {
  const [summary, setSummary] = useState<UserBaseSummary | null>(null)
  const [userList, setUserList] = useState<UserBaseList | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isSummaryLoading, setIsSummaryLoading] = useState(section === 'users')
  const [isListLoading, setIsListLoading] = useState(section === 'users')
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const { toast } = useToast()

  const loadUsersSummary = useCallback(
    async (showErrorToast = false) => {
      if (section !== 'users') {
        return
      }

      setIsSummaryLoading(true)

      try {
        const nextSummary = await getUserBaseSummary()
        setSummary(nextSummary)
        setSummaryError(null)
      } catch (error) {
        const message = getApiErrorMessage(error, 'Failed to load user summary.')
        setSummaryError(message)
        if (showErrorToast) {
          toast({
            variant: 'error',
            title: 'User summary unavailable',
            description: message,
          })
        }
      } finally {
        setIsSummaryLoading(false)
      }
    },
    [section, toast],
  )

  const loadUserList = useCallback(
    async (showErrorToast = false) => {
      if (section !== 'users') {
        return
      }

      setIsListLoading(true)

      try {
        const nextUserList = await getUserBaseList(currentPage, USERS_PAGE_SIZE)
        setUserList(nextUserList)
        setListError(null)
      } catch (error) {
        const message = getApiErrorMessage(error, 'Failed to load users list.')
        setListError(message)
        if (showErrorToast) {
          toast({
            variant: 'error',
            title: 'Users list unavailable',
            description: message,
          })
        }
      } finally {
        setIsListLoading(false)
      }
    },
    [currentPage, section, toast],
  )

  useEffect(() => {
    if (section === 'users') {
      void loadUsersSummary()
    }
  }, [section, loadUsersSummary])

  useEffect(() => {
    if (section === 'users') {
      void loadUserList()
    }
  }, [section, loadUserList])

  const statCards = useMemo(() => {
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

  if (section === 'tenants') {
    return (
      <section className={cn(surfaceCardClass, 'dashboard-enter dashboard-enter-delay-1')}>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Tenants</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Tenant management is ready as a separate submenu. Wire its tenant-specific endpoint next to replace this placeholder.
        </p>
      </section>
    )
  }

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
            onClick={() => void loadUsersSummary(true)}
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
            onClick={() => void loadUserList(true)}
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
                      <span className="text-right text-slate-700 dark:text-slate-200">
                        {formatJoinedDate(user)}
                      </span>
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
                      <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">
                        {user.phoneNumber || 'No phone'}
                      </td>
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
                    onClick={() => setCurrentPage((previousPage) => Math.max(previousPage - 1, 1))}
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
                          onClick={() => setCurrentPage(item)}
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
                    onClick={() => setCurrentPage((previousPage) => Math.min(previousPage + 1, totalPages))}
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
                    onClick={() => setCurrentPage((previousPage) => Math.max(previousPage - 1, 1))}
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
                          onClick={() => setCurrentPage(item)}
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
                    onClick={() => setCurrentPage((previousPage) => Math.min(previousPage + 1, totalPages))}
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

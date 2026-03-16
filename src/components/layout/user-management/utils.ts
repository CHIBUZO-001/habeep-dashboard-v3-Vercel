import type { AgentsListItem, LandlordsListItem, TenantsListItem, UserBaseListItem } from '../../../services'

export const USERS_PAGE_SIZE = 10
export const TENANTS_PAGE_SIZE = 20
export const AGENTS_PAGE_SIZE = 20
export const LANDLORDS_PAGE_SIZE = 20

export const numberFormatter = new Intl.NumberFormat('en-NG')

export const surfaceCardClass =
  'rounded-2xl border border-slate-200/85 bg-white/90 p-4 shadow-sm shadow-slate-900/5 ring-1 ring-white/70 transition-colors dark:border-slate-800/80 dark:bg-slate-900/90 dark:ring-slate-800/80'

export type PaginationItem = number | 'start-ellipsis' | 'end-ellipsis'

export function formatDateTime(value: string | null) {
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

export function formatLastSeen(value: string | null) {
  if (!value) {
    return '30+ days ago'
  }

  return formatDateTime(value)
}

export function formatDate(value: string | null) {
  if (!value) {
    return '—'
  }

  const parsedTime = new Date(value)
  if (Number.isNaN(parsedTime.getTime())) {
    return value
  }

  return parsedTime.toLocaleDateString('en-NG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatCurrencyValue(value: number | null, currencyCode = 'NGN') {
  if (value === null) {
    return '—'
  }

  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currencyCode || 'NGN',
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return numberFormatter.format(value)
  }
}

export function formatJoinedDate(user: UserBaseListItem) {
  if (user.dateJoined) {
    return user.dateJoined
  }

  if (!user.createdAt) {
    return 'Unknown date'
  }

  return formatDateTime(user.createdAt)
}

export function getUserDisplayName(user: UserBaseListItem) {
  return user.username || user.email || 'Unknown user'
}

export function getUserInitials(user: UserBaseListItem) {
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

export function getTenantDisplayName(tenant: TenantsListItem) {
  return tenant.username || tenant.email || tenant.userIds[0] || tenant.tenantId || tenant.id || 'Unknown tenant'
}

export function getAgentDisplayName(agent: AgentsListItem) {
  return agent.username || agent.email || agent.userId || agent.agentId || agent.iboId || agent.id || 'Unknown agent'
}

export function getLandlordDisplayName(landlord: LandlordsListItem) {
  const derivedName = [landlord.firstName, landlord.surname].filter(Boolean).join(' ').trim()
  const displayName = landlord.name || derivedName

  return (
    displayName ||
    landlord.email ||
    landlord.phone ||
    landlord.landlordId ||
    landlord.id ||
    'Unknown landlord'
  )
}

export function getTenantInitials(tenant: TenantsListItem) {
  const source = getTenantDisplayName(tenant)
  const segments = source
    .split(/[^a-zA-Z0-9]+/)
    .map((segment) => segment.trim())
    .filter(Boolean)

  if (segments.length === 0) {
    return 'T'
  }

  if (segments.length === 1) {
    return segments[0].slice(0, 2).toUpperCase()
  }

  return `${segments[0][0] ?? ''}${segments[1][0] ?? ''}`.toUpperCase()
}

export function getAgentInitials(agent: AgentsListItem) {
  const source = getAgentDisplayName(agent)
  const segments = source
    .split(/[^a-zA-Z0-9]+/)
    .map((segment) => segment.trim())
    .filter(Boolean)

  if (segments.length === 0) {
    return 'A'
  }

  if (segments.length === 1) {
    return segments[0].slice(0, 2).toUpperCase()
  }

  return `${segments[0][0] ?? ''}${segments[1][0] ?? ''}`.toUpperCase()
}

export function getLandlordInitials(landlord: LandlordsListItem) {
  const source = getLandlordDisplayName(landlord)
  const segments = source
    .split(/[^a-zA-Z0-9]+/)
    .map((segment) => segment.trim())
    .filter(Boolean)

  if (segments.length === 0) {
    return 'L'
  }

  if (segments.length === 1) {
    return segments[0].slice(0, 2).toUpperCase()
  }

  return `${segments[0][0] ?? ''}${segments[1][0] ?? ''}`.toUpperCase()
}

export function getStatusClasses(status: string) {
  const normalizedStatus = status.trim().toLowerCase()

  if (normalizedStatus === 'active') {
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
  }

  if (normalizedStatus === 'inactive') {
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  }

  return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
}

export function getRentStatusClasses(status: string) {
  const normalizedStatus = status.trim().toLowerCase()

  if (normalizedStatus === 'active-rent') {
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
  }

  if (normalizedStatus === 'expired-rent') {
    return 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300'
  }

  if (normalizedStatus === 'no-rent') {
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  }

  return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
}

export function formatStatusLabel(value: string) {
  if (!value) {
    return 'Unknown'
  }

  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export function buildPaginationItems(currentPage: number, totalPages: number, maxVisible = 7): PaginationItem[] {
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

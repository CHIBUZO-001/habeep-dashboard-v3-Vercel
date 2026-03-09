import { apiGet } from './api-service'

export type UserBaseSummary = {
  totalUsers: number
  activeUsers: number
  verifiedUsers: number
  recentSignups: number
  percentageActive: string
  percentageVerified: string
}

export type UserBaseListItem = {
  id: string
  email: string
  username: string
  userProfileImage: string
  dateJoined: string
  lastSeen: string | null
  createdAt: string
  phoneNumber: string
  status: string
}

export type UserBaseList = {
  page: number
  limit: number
  total: number
  items: UserBaseListItem[]
}

type UserBaseSummaryRaw = {
  totalUsers?: unknown
  activeUsers?: unknown
  verifiedUsers?: unknown
  recentSignups?: unknown
  percentageActive?: unknown
  percentageVerified?: unknown
}

type UserBaseListRaw = {
  page?: unknown
  limit?: unknown
  total?: unknown
  items?: unknown
}

type LooseObject = Record<string, unknown>

function toObject(value: unknown): LooseObject | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as LooseObject
}

function toString(value: unknown) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsedValue = Number(value.replace(/%/g, '').trim())
    if (Number.isFinite(parsedValue)) {
      return parsedValue
    }
  }

  return 0
}

function toPercentage(value: unknown) {
  if (typeof value === 'string') {
    const normalizedValue = value.trim()
    if (!normalizedValue) {
      return '0%'
    }

    return normalizedValue.includes('%') ? normalizedValue : `${normalizedValue}%`
  }

  return `${toNumber(value)}%`
}

function normalizeUserBaseListItem(item: unknown): UserBaseListItem | null {
  const source = toObject(item)
  if (!source) {
    return null
  }

  const id = toString(source._id)
  if (!id) {
    return null
  }

  return {
    id,
    email: toString(source.email),
    username: toString(source.username),
    userProfileImage: toString(source.userProfileImage),
    dateJoined: toString(source.dateJoined),
    lastSeen: toString(source.lastSeen) || null,
    createdAt: toString(source.createdAt),
    phoneNumber: toString(source.phoneNumber),
    status: toString(source.status) || 'unknown',
  }
}

export async function getUserBaseSummary() {
  const rawDetails = await apiGet<UserBaseSummaryRaw>('/api/admin/users/base/summary')

  return {
    totalUsers: toNumber(rawDetails.totalUsers),
    activeUsers: toNumber(rawDetails.activeUsers),
    verifiedUsers: toNumber(rawDetails.verifiedUsers),
    recentSignups: toNumber(rawDetails.recentSignups),
    percentageActive: toPercentage(rawDetails.percentageActive),
    percentageVerified: toPercentage(rawDetails.percentageVerified),
  } satisfies UserBaseSummary
}

export async function getUserBaseList(page = 1, limit = 10) {
  const rawDetails = await apiGet<UserBaseListRaw>('/api/admin/users/base/list', {
    params: {
      page,
      limit,
      includeTransactions: true,
      txLocalLimit: 2,
    },
  })

  return {
    page: toNumber(rawDetails.page) || page,
    limit: toNumber(rawDetails.limit) || limit,
    total: toNumber(rawDetails.total),
    items: Array.isArray(rawDetails.items)
      ? rawDetails.items
          .map((item) => normalizeUserBaseListItem(item))
          .filter((item): item is UserBaseListItem => Boolean(item))
      : [],
  } satisfies UserBaseList
}

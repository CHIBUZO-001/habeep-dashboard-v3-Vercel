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

export type TenantsSummary = {
  totalTenants: number
  activeRentsCount: number
  outstandingRentsCount: number
}

export type AgentsSummary = {
  totalAgents: number
  activeAgents: number
  inactiveAgents: number
}

export type LandlordsSummary = {
  totalLandlords: number
  activeLandlords: number
  inactiveLandlords: number
  totalProperties: number
  occupiedProperties: number
  occupancyRate: number
}

export type LandlordsListItem = {
  id: string
  status: string
  landlordId: string
  name: string
  firstName: string
  surname: string
  email: string
  phone: string
  verified: boolean
  registered: boolean
  unitsCount: number
  profileImage: string
  createdAt: string
}

export type LandlordsList = {
  page: number
  limit: number
  total: number
  items: LandlordsListItem[]
}

export type AgentsListItem = {
  id: string
  status: string
  agentId: string
  userId: string
  iboId: string
  username: string
  email: string
  phone: string
  profileImage: string
  housesUploadedCount: number
  tenantsCount: number
}

export type AgentsList = {
  page: number
  limit: number
  total: number
  items: AgentsListItem[]
}

export type TenantsListItem = {
  id: string
  rentStatus: string
  username: string
  email: string
  location: string
  phone: string
  tenantId: string
  userIds: string[]
  iboId: string
  profileImage: string
  amountToPay: number | null
  dueOn: string | null
  amountOwed: number | null
  wasDueOn: string | null
  rentCurrency: string
}

export type TenantsList = {
  page: number
  limit: number
  total: number
  items: TenantsListItem[]
}

type UserBaseSummaryRaw = {
  totalUsers?: unknown
  activeUsers?: unknown
  verifiedUsers?: unknown
  recentSignups?: unknown
  percentageActive?: unknown
  percentageVerified?: unknown
}

type TenantsSummaryRaw = {
  totalTenants?: unknown
  activeRentsCount?: unknown
  outstandingRentsCount?: unknown
}

type AgentsSummaryRaw = {
  totalAgents?: unknown
  activeAgents?: unknown
  inactiveAgents?: unknown
}

type LandlordsSummaryRaw = {
  totalLandlords?: unknown
  activeLandlords?: unknown
  inactiveLandlords?: unknown
  totalProperties?: unknown
  occupiedProperties?: unknown
  occupancyRate?: unknown
}

type LandlordsListRaw = {
  landlords?: unknown
  items?: unknown
  total?: unknown
  page?: unknown
  limit?: unknown
}

type AgentsListRaw = {
  agents?: unknown
  items?: unknown
  total?: unknown
  page?: unknown
  limit?: unknown
}

type TenantsListRaw = {
  tenants?: unknown
  items?: unknown
  total?: unknown
  page?: unknown
  limit?: unknown
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

function toText(value: unknown) {
  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  return ''
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

function toNumberOrNull(value: unknown) {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsedValue = Number(value.replace(/,/g, '').trim())
    if (Number.isFinite(parsedValue)) {
      return parsedValue
    }
  }

  return null
}

function toStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => toText(item)).filter(Boolean)
  }

  const fallback = toText(value)
  return fallback ? [fallback] : []
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

type TenantsListItemRaw = {
  rentStatus?: unknown
  username?: unknown
  email?: unknown
  location?: unknown
  phone?: unknown
  tenantId?: unknown
  userId?: unknown
  iboId?: unknown
  profileImage?: unknown
  amountToPay?: unknown
  dueOn?: unknown
  amountOwed?: unknown
  wasDueOn?: unknown
  rentCurrency?: unknown
}

type AgentsListItemRaw = {
  status?: unknown
  agentId?: unknown
  userId?: unknown
  iboId?: unknown
  username?: unknown
  email?: unknown
  phone?: unknown
  profileImage?: unknown
  housesUploadedCount?: unknown
  tenantsCount?: unknown
}

type LandlordsListItemRaw = {
  createdAt?: unknown
  status?: unknown
  landlordId?: unknown
  name?: unknown
  firstName?: unknown
  surname?: unknown
  email?: unknown
  phone?: unknown
  verified?: unknown
  registered?: unknown
  unitsCount?: unknown
  profileImage?: unknown
}

function toBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase()
    if (normalizedValue === 'true' || normalizedValue === '1' || normalizedValue === 'yes') {
      return true
    }

    if (normalizedValue === 'false' || normalizedValue === '0' || normalizedValue === 'no') {
      return false
    }
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value !== 0
  }

  return false
}

function normalizeAgentsListItem(item: unknown): AgentsListItem | null {
  const source = toObject(item) as AgentsListItemRaw | null
  if (!source) {
    return null
  }

  const agentId = toText(source.agentId)
  const userId = toText(source.userId)
  const iboId = toText(source.iboId)
  const id = agentId || userId || iboId

  if (!id) {
    return null
  }

  return {
    id,
    status: toText(source.status) || 'unknown',
    agentId,
    userId,
    iboId,
    username: toText(source.username),
    email: toText(source.email),
    phone: toText(source.phone),
    profileImage: toText(source.profileImage),
    housesUploadedCount: toNumber(source.housesUploadedCount),
    tenantsCount: toNumber(source.tenantsCount),
  } satisfies AgentsListItem
}

function normalizeLandlordsListItem(item: unknown): LandlordsListItem | null {
  const source = toObject(item) as LandlordsListItemRaw | null
  if (!source) {
    return null
  }

  const landlordId = toText(source.landlordId)
  const email = toText(source.email)
  const phone = toText(source.phone)
  const id = landlordId || email || phone

  if (!id) {
    return null
  }

  return {
    id,
    status: toText(source.status) || 'unknown',
    landlordId,
    name: toText(source.name),
    firstName: toText(source.firstName),
    surname: toText(source.surname),
    email,
    phone,
    verified: toBoolean(source.verified),
    registered: toBoolean(source.registered),
    unitsCount: toNumber(source.unitsCount),
    profileImage: toText(source.profileImage),
    createdAt: toText(source.createdAt),
  } satisfies LandlordsListItem
}

function normalizeTenantsListItem(item: unknown): TenantsListItem | null {
  const source = toObject(item) as TenantsListItemRaw | null
  if (!source) {
    return null
  }

  const tenantId = toText(source.tenantId)
  const userIds = toStringArray(source.userId)
  const iboId = toText(source.iboId)
  const id = tenantId || userIds[0] || iboId

  if (!id) {
    return null
  }

  const dueOn = toText(source.dueOn)
  const wasDueOn = toText(source.wasDueOn)
  const currency = toText(source.rentCurrency) || 'NGN'

  return {
    id,
    rentStatus: toText(source.rentStatus) || 'unknown',
    username: toText(source.username),
    email: toText(source.email),
    location: toText(source.location),
    phone: toText(source.phone),
    tenantId,
    userIds,
    iboId,
    profileImage: toText(source.profileImage),
    amountToPay: toNumberOrNull(source.amountToPay),
    dueOn: dueOn || null,
    amountOwed: toNumberOrNull(source.amountOwed),
    wasDueOn: wasDueOn || null,
    rentCurrency: currency,
  } satisfies TenantsListItem
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

export async function getTenantsSummary() {
  const rawDetails = await apiGet<TenantsSummaryRaw>('/api/admin/users/tenants/summary')

  return {
    totalTenants: toNumber(rawDetails.totalTenants),
    activeRentsCount: toNumber(rawDetails.activeRentsCount),
    outstandingRentsCount: toNumber(rawDetails.outstandingRentsCount),
  } satisfies TenantsSummary
}

export async function getAgentsSummary() {
  const rawDetails = await apiGet<AgentsSummaryRaw>('/api/admin/users/agents/summary')

  return {
    totalAgents: toNumber(rawDetails.totalAgents),
    activeAgents: toNumber(rawDetails.activeAgents),
    inactiveAgents: toNumber(rawDetails.inactiveAgents),
  } satisfies AgentsSummary
}

export async function getLandlordsSummary() {
  const rawDetails = await apiGet<LandlordsSummaryRaw>('/api/admin/users/landlords/summary')

  return {
    totalLandlords: toNumber(rawDetails.totalLandlords),
    activeLandlords: toNumber(rawDetails.activeLandlords),
    inactiveLandlords: toNumber(rawDetails.inactiveLandlords),
    totalProperties: toNumber(rawDetails.totalProperties),
    occupiedProperties: toNumber(rawDetails.occupiedProperties),
    occupancyRate: toNumber(rawDetails.occupancyRate),
  } satisfies LandlordsSummary
}

export async function getLandlordsList(page = 1, limit = 20) {
  const rawDetails = await apiGet<LandlordsListRaw>('/api/admin/users/landlords/list', {
    params: {
      page,
      limit,
    },
  })

  const sourceItems = Array.isArray(rawDetails.items)
    ? rawDetails.items
    : Array.isArray(rawDetails.landlords)
      ? rawDetails.landlords
      : []

  return {
    page: toNumber(rawDetails.page) || page,
    limit: toNumber(rawDetails.limit) || limit,
    total: toNumber(rawDetails.total),
    items: sourceItems
      .map((item) => normalizeLandlordsListItem(item))
      .filter((item): item is LandlordsListItem => Boolean(item)),
  } satisfies LandlordsList
}

export async function getAgentsList(page = 1, limit = 20) {
  const rawDetails = await apiGet<AgentsListRaw>('/api/admin/users/agents/list', {
    params: {
      page,
      limit,
    },
  })

  const sourceItems = Array.isArray(rawDetails.items)
    ? rawDetails.items
    : Array.isArray(rawDetails.agents)
      ? rawDetails.agents
      : []

  return {
    page: toNumber(rawDetails.page) || page,
    limit: toNumber(rawDetails.limit) || limit,
    total: toNumber(rawDetails.total),
    items: sourceItems
      .map((item) => normalizeAgentsListItem(item))
      .filter((item): item is AgentsListItem => Boolean(item)),
  } satisfies AgentsList
}

export async function getTenantsList(page = 1, limit = 20) {
  const rawDetails = await apiGet<TenantsListRaw>('/api/admin/users/tenants/list', {
    params: {
      page,
      limit,
    },
  })

  const sourceItems = Array.isArray(rawDetails.items)
    ? rawDetails.items
    : Array.isArray(rawDetails.tenants)
      ? rawDetails.tenants
      : []

  return {
    page: toNumber(rawDetails.page) || page,
    limit: toNumber(rawDetails.limit) || limit,
    total: toNumber(rawDetails.total),
    items: sourceItems
      .map((item) => normalizeTenantsListItem(item))
      .filter((item): item is TenantsListItem => Boolean(item)),
  } satisfies TenantsList
}

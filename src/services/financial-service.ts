import { apiGet } from './api-service'

export type FinancialRevenuePeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'

export type FinancialRevenueTotal = {
  period: FinancialRevenuePeriod | string
  from: string | null
  to: string | null
  previousFrom: string | null
  previousTo: string | null
  currency: string
  discountsApplied: boolean
  totalRevenue: number
  previousRevenue: number
  growthRate: number
  breakdown: Record<string, number>
}

export type FinancialRevenueTrendPoint = {
  date: string
  currencies: Record<string, number>
  totalNgnEquivalent: number
}

export type FinancialRevenueTrend = {
  period: string
  from: string | null
  to: string | null
  currency: string
  discountsApplied: boolean
  interval: string
  points: FinancialRevenueTrendPoint[]
}

export type FinancialRevenueComparisonTotals = {
  currentYear: number
  previousYear: number
  growthRate: number
}

export type FinancialRevenueComparisonPoint = {
  month: string
  currentYear: number
  previousYear: number
}

export type FinancialRevenueComparison = {
  year: number
  compareYear: number
  currency: string
  discountsApplied: boolean
  totals: FinancialRevenueComparisonTotals
  points: FinancialRevenueComparisonPoint[]
}

export type FinancialWalletActivitiesRange = {
  from: string | null
  to: string | null
  previousFrom: string | null
  previousTo: string | null
}

export type FinancialWalletActivitiesSummaryCard = {
  value: number
  changeRate: number | null
}

export type FinancialWalletActivitiesSummaryCards = {
  totalVolume: FinancialWalletActivitiesSummaryCard
  totalTransactions: FinancialWalletActivitiesSummaryCard
  successRate: FinancialWalletActivitiesSummaryCard
  pendingAmount: FinancialWalletActivitiesSummaryCard
}

export type FinancialWalletActivitiesSummary = {
  range: FinancialWalletActivitiesRange
  currency: string
  cards: FinancialWalletActivitiesSummaryCards
}

export type FinancialOfflineDepositsRange = {
  from: string | null
  to: string | null
  previousFrom: string | null
  previousTo: string | null
}

export type FinancialOfflineDepositsReviewCard = {
  count: number
  totalValue: number
  changeRate: number | null
}

export type FinancialOfflineDepositsValueCard = {
  value: number
  changeRate: number | null
}

export type FinancialOfflineDepositsSummaryCards = {
  pendingReview: FinancialOfflineDepositsReviewCard
  approvedThisMonth: FinancialOfflineDepositsReviewCard
  approvalRate: FinancialOfflineDepositsValueCard
  avgProcessingTimeHours: FinancialOfflineDepositsValueCard
}

export type FinancialOfflineDepositsSummary = {
  range: FinancialOfflineDepositsRange
  currency: string
  cards: FinancialOfflineDepositsSummaryCards
}

export type FinancialOfflineDepositUser = {
  name: string | null
  username: string | null
  avatar: string | null
  email: string | null
  userType: string | null
  currency: string | null
  nationality: string | null
}

export type FinancialOfflineDepositDocumentProof = {
  id: string | null
  type: string | null
  data: string | null
}

export type FinancialOfflineDepositActivity = {
  id: string
  source: string
  user: FinancialOfflineDepositUser | null
  amount: number
  status: string
  type: string
  method: string
  documentOfProof: FinancialOfflineDepositDocumentProof | null
  reference: string | null
  transactionId: string
  createdAt: string
}

export type FinancialOfflineDepositsPagination = {
  page: number
  perPage: number
  total: number
  totalPages: number
}

export type FinancialOfflineDeposits = {
  activities: FinancialOfflineDepositActivity[]
  pagination: FinancialOfflineDepositsPagination
}

export type FinancialWalletActivityUser = {
  username: string | null
  avatar: string | null
}

export type FinancialWalletActivity = {
  id: string
  source: string
  actorId: string
  user: FinancialWalletActivityUser | null
  amount: number
  status: string
  type: string
  description: string
  reference: string
  from: string | null
  to: string | null
  createdAt: string
  date: string
  time: string
  currency: string
}

export type FinancialWalletActivitiesPagination = {
  page: number
  perPage: number
  total: number
  totalPages: number
}

export type FinancialWalletActivities = {
  activities: FinancialWalletActivity[]
  pagination: FinancialWalletActivitiesPagination
}

type LooseObject = Record<string, unknown>

type FinancialRevenueTotalRaw = {
  period?: unknown
  from?: unknown
  to?: unknown
  previousFrom?: unknown
  previousTo?: unknown
  currency?: unknown
  discountsApplied?: unknown
  totalRevenue?: unknown
  previousRevenue?: unknown
  growthRate?: unknown
  breakdown?: unknown
}

type FinancialRevenueTrendPointRaw = {
  date?: unknown
  currencies?: unknown
  totalNgnEquivalent?: unknown
}

type FinancialRevenueTrendRaw = {
  period?: unknown
  from?: unknown
  to?: unknown
  currency?: unknown
  discountsApplied?: unknown
  interval?: unknown
  points?: unknown
}

type FinancialRevenueComparisonTotalsRaw = {
  currentYear?: unknown
  previousYear?: unknown
  growthRate?: unknown
}

type FinancialRevenueComparisonPointRaw = {
  month?: unknown
  currentYear?: unknown
  previousYear?: unknown
}

type FinancialRevenueComparisonRaw = {
  year?: unknown
  compareYear?: unknown
  currency?: unknown
  discountsApplied?: unknown
  totals?: unknown
  points?: unknown
}

type FinancialWalletActivitiesRangeRaw = {
  from?: unknown
  to?: unknown
  previousFrom?: unknown
  previousTo?: unknown
}

type FinancialWalletActivitiesSummaryCardRaw = {
  value?: unknown
  changeRate?: unknown
}

type FinancialWalletActivitiesSummaryCardsRaw = {
  totalVolume?: unknown
  totalTransactions?: unknown
  successRate?: unknown
  pendingAmount?: unknown
}

type FinancialWalletActivitiesSummaryRaw = {
  range?: unknown
  currency?: unknown
  cards?: unknown
}

type FinancialOfflineDepositsRangeRaw = {
  from?: unknown
  to?: unknown
  previousFrom?: unknown
  previousTo?: unknown
}

type FinancialOfflineDepositsReviewCardRaw = {
  count?: unknown
  totalValue?: unknown
  changeRate?: unknown
}

type FinancialOfflineDepositsValueCardRaw = {
  value?: unknown
  changeRate?: unknown
}

type FinancialOfflineDepositsSummaryCardsRaw = {
  pendingReview?: unknown
  approvedThisMonth?: unknown
  approvalRate?: unknown
  avgProcessingTimeHours?: unknown
}

type FinancialOfflineDepositsSummaryRaw = {
  range?: unknown
  currency?: unknown
  cards?: unknown
}

type FinancialOfflineDepositUserRaw = {
  name?: unknown
  username?: unknown
  avatar?: unknown
  email?: unknown
  userType?: unknown
  currency?: unknown
  nationality?: unknown
}

type FinancialOfflineDepositDocumentProofRaw = {
  id?: unknown
  _id?: unknown
  type?: unknown
  data?: unknown
}

type FinancialOfflineDepositActivityRaw = {
  id?: unknown
  _id?: unknown
  source?: unknown
  user?: unknown
  amount?: unknown
  status?: unknown
  type?: unknown
  method?: unknown
  documentOfProof?: unknown
  reference?: unknown
  transactionId?: unknown
  createdAt?: unknown
}

type FinancialOfflineDepositsPaginationRaw = {
  page?: unknown
  perPage?: unknown
  total?: unknown
  totalPages?: unknown
}

type FinancialOfflineDepositsRaw = {
  activities?: unknown
  pagination?: unknown
}

type FinancialWalletActivityUserRaw = {
  username?: unknown
  avatar?: unknown
}

type FinancialWalletActivityRaw = {
  id?: unknown
  _id?: unknown
  source?: unknown
  actorId?: unknown
  user?: unknown
  amount?: unknown
  status?: unknown
  type?: unknown
  description?: unknown
  reference?: unknown
  from?: unknown
  to?: unknown
  createdAt?: unknown
  date?: unknown
  time?: unknown
  currency?: unknown
}

type FinancialWalletActivitiesPaginationRaw = {
  page?: unknown
  perPage?: unknown
  total?: unknown
  totalPages?: unknown
}

type FinancialWalletActivitiesRaw = {
  activities?: unknown
  pagination?: unknown
}

function toObject(value: unknown): LooseObject | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }
  return value as LooseObject
}

function toText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return 0
}

function toNumberOrNull(value: unknown) {
  if (value === null) {
    return null
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return null
}

function toBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') {
      return true
    }
    if (normalized === 'false') {
      return false
    }
  }

  return false
}

function normalizeNumericMap(value: unknown) {
  const source = toObject(value)
  if (!source) {
    return {}
  }

  const output: Record<string, number> = {}
  for (const [key, amount] of Object.entries(source)) {
    const normalizedKey = key.trim()
    if (!normalizedKey) {
      continue
    }
    output[normalizedKey] = toNumber(amount)
  }

  return output
}

function normalizeTrendPoint(item: unknown): FinancialRevenueTrendPoint | null {
  const source = toObject(item) as FinancialRevenueTrendPointRaw | null
  if (!source) {
    return null
  }

  const date = toText(source.date)
  if (!date) {
    return null
  }

  return {
    date,
    currencies: normalizeNumericMap(source.currencies),
    totalNgnEquivalent: toNumber(source.totalNgnEquivalent),
  }
}

function normalizeTrendPoints(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((point) => normalizeTrendPoint(point)).filter((point): point is FinancialRevenueTrendPoint => Boolean(point))
}

function normalizeComparisonTotals(value: unknown): FinancialRevenueComparisonTotals {
  const source = toObject(value) as FinancialRevenueComparisonTotalsRaw | null
  return {
    currentYear: toNumber(source?.currentYear),
    previousYear: toNumber(source?.previousYear),
    growthRate: toNumber(source?.growthRate),
  }
}

function normalizeComparisonPoint(item: unknown): FinancialRevenueComparisonPoint | null {
  const source = toObject(item) as FinancialRevenueComparisonPointRaw | null
  if (!source) {
    return null
  }

  const month = toText(source.month)
  if (!month) {
    return null
  }

  return {
    month,
    currentYear: toNumber(source.currentYear),
    previousYear: toNumber(source.previousYear),
  }
}

function normalizeComparisonPoints(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((point) => normalizeComparisonPoint(point))
    .filter((point): point is FinancialRevenueComparisonPoint => Boolean(point))
}

export async function getFinancialRevenueTotal(period: FinancialRevenuePeriod = 'quarterly') {
  const rawDetails = await apiGet<FinancialRevenueTotalRaw>('/api/financial/revenue/total', {
    params: { period },
  })

  return {
    period: toText(rawDetails.period) || period,
    from: toText(rawDetails.from) || null,
    to: toText(rawDetails.to) || null,
    previousFrom: toText(rawDetails.previousFrom) || null,
    previousTo: toText(rawDetails.previousTo) || null,
    currency: toText(rawDetails.currency) || 'NGN',
    discountsApplied: toBoolean(rawDetails.discountsApplied),
    totalRevenue: toNumber(rawDetails.totalRevenue),
    previousRevenue: toNumber(rawDetails.previousRevenue),
    growthRate: toNumber(rawDetails.growthRate),
    breakdown: normalizeNumericMap(rawDetails.breakdown),
  } satisfies FinancialRevenueTotal
}

export async function getFinancialRevenueTrend() {
  const rawDetails = await apiGet<FinancialRevenueTrendRaw>('/api/financial/revenue/trend')

  return {
    period: toText(rawDetails.period) || 'last_12_months',
    from: toText(rawDetails.from) || null,
    to: toText(rawDetails.to) || null,
    currency: toText(rawDetails.currency) || 'NGN',
    discountsApplied: toBoolean(rawDetails.discountsApplied),
    interval: toText(rawDetails.interval) || 'month',
    points: normalizeTrendPoints(rawDetails.points),
  } satisfies FinancialRevenueTrend
}

export async function getFinancialRevenueComparison() {
  const rawDetails = await apiGet<FinancialRevenueComparisonRaw>('/api/financial/revenue/comparison')

  return {
    year: toNumber(rawDetails.year),
    compareYear: toNumber(rawDetails.compareYear),
    currency: toText(rawDetails.currency) || 'NGN',
    discountsApplied: toBoolean(rawDetails.discountsApplied),
    totals: normalizeComparisonTotals(rawDetails.totals),
    points: normalizeComparisonPoints(rawDetails.points),
  } satisfies FinancialRevenueComparison
}

function normalizeWalletActivitiesRange(value: unknown): FinancialWalletActivitiesRange {
  const source = toObject(value) as FinancialWalletActivitiesRangeRaw | null
  return {
    from: toText(source?.from) || null,
    to: toText(source?.to) || null,
    previousFrom: toText(source?.previousFrom) || null,
    previousTo: toText(source?.previousTo) || null,
  }
}

function normalizeWalletSummaryCard(value: unknown): FinancialWalletActivitiesSummaryCard {
  const source = toObject(value) as FinancialWalletActivitiesSummaryCardRaw | null
  return {
    value: toNumber(source?.value),
    changeRate: toNumberOrNull(source?.changeRate),
  }
}

function normalizeWalletSummaryCards(value: unknown): FinancialWalletActivitiesSummaryCards {
  const source = toObject(value) as FinancialWalletActivitiesSummaryCardsRaw | null
  return {
    totalVolume: normalizeWalletSummaryCard(source?.totalVolume),
    totalTransactions: normalizeWalletSummaryCard(source?.totalTransactions),
    successRate: normalizeWalletSummaryCard(source?.successRate),
    pendingAmount: normalizeWalletSummaryCard(source?.pendingAmount),
  }
}

export async function getFinancialWalletActivitiesSummary() {
  const rawDetails = await apiGet<FinancialWalletActivitiesSummaryRaw>('/api/financial/wallet-activities/summary')

  return {
    range: normalizeWalletActivitiesRange(rawDetails.range),
    currency: toText(rawDetails.currency) || 'NGN',
    cards: normalizeWalletSummaryCards(rawDetails.cards),
  } satisfies FinancialWalletActivitiesSummary
}

function normalizeOfflineDepositsRange(value: unknown): FinancialOfflineDepositsRange {
  const source = toObject(value) as FinancialOfflineDepositsRangeRaw | null
  return {
    from: toText(source?.from) || null,
    to: toText(source?.to) || null,
    previousFrom: toText(source?.previousFrom) || null,
    previousTo: toText(source?.previousTo) || null,
  }
}

function normalizeOfflineDepositsReviewCard(value: unknown): FinancialOfflineDepositsReviewCard {
  const source = toObject(value) as FinancialOfflineDepositsReviewCardRaw | null
  return {
    count: toNumber(source?.count),
    totalValue: toNumber(source?.totalValue),
    changeRate: toNumberOrNull(source?.changeRate),
  }
}

function normalizeOfflineDepositsValueCard(value: unknown): FinancialOfflineDepositsValueCard {
  const source = toObject(value) as FinancialOfflineDepositsValueCardRaw | null
  return {
    value: toNumber(source?.value),
    changeRate: toNumberOrNull(source?.changeRate),
  }
}

function normalizeOfflineDepositsSummaryCards(value: unknown): FinancialOfflineDepositsSummaryCards {
  const source = toObject(value) as FinancialOfflineDepositsSummaryCardsRaw | null
  return {
    pendingReview: normalizeOfflineDepositsReviewCard(source?.pendingReview),
    approvedThisMonth: normalizeOfflineDepositsReviewCard(source?.approvedThisMonth),
    approvalRate: normalizeOfflineDepositsValueCard(source?.approvalRate),
    avgProcessingTimeHours: normalizeOfflineDepositsValueCard(source?.avgProcessingTimeHours),
  }
}

export async function getFinancialOfflineDepositsSummary(params: { from: string; to: string }) {
  const rawDetails = await apiGet<FinancialOfflineDepositsSummaryRaw>('/api/financial/offline-deposits/summary', {
    params,
  })

  return {
    range: normalizeOfflineDepositsRange(rawDetails.range),
    currency: toText(rawDetails.currency) || 'NGN',
    cards: normalizeOfflineDepositsSummaryCards(rawDetails.cards),
  } satisfies FinancialOfflineDepositsSummary
}

function normalizeOfflineDepositUser(value: unknown): FinancialOfflineDepositUser | null {
  const source = toObject(value) as FinancialOfflineDepositUserRaw | null
  if (!source) {
    return null
  }

  const name = toText(source.name) || null
  const username = toText(source.username) || null
  const avatar = toText(source.avatar) || null
  const email = toText(source.email) || null
  const userType = toText(source.userType) || null
  const currency = toText(source.currency) || null
  const nationality = toText(source.nationality) || null

  if (!name && !username && !avatar && !email && !userType && !currency && !nationality) {
    return null
  }

  return {
    name,
    username,
    avatar,
    email,
    userType,
    currency,
    nationality,
  }
}

function normalizeOfflineDepositDocumentProof(value: unknown): FinancialOfflineDepositDocumentProof | null {
  const source = toObject(value) as FinancialOfflineDepositDocumentProofRaw | null
  if (!source) {
    return null
  }

  const id = toText(source._id) || toText(source.id) || null
  const type = toText(source.type) || null
  const data = toText(source.data) || null

  if (!id && !type && !data) {
    return null
  }

  return { id, type, data }
}

function normalizeOfflineDepositActivity(value: unknown): FinancialOfflineDepositActivity | null {
  const source = toObject(value) as FinancialOfflineDepositActivityRaw | null
  if (!source) {
    return null
  }

  const id = toText(source.id) || toText(source._id)
  if (!id) {
    return null
  }

  return {
    id,
    source: toText(source.source),
    user: normalizeOfflineDepositUser(source.user),
    amount: toNumber(source.amount),
    status: toText(source.status),
    type: toText(source.type),
    method: toText(source.method),
    documentOfProof: normalizeOfflineDepositDocumentProof(source.documentOfProof),
    reference: toText(source.reference) || null,
    transactionId: toText(source.transactionId),
    createdAt: toText(source.createdAt),
  } satisfies FinancialOfflineDepositActivity
}

function normalizeOfflineDepositActivities(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((activity) => normalizeOfflineDepositActivity(activity))
    .filter((activity): activity is FinancialOfflineDepositActivity => Boolean(activity))
}

function normalizeOfflineDepositsPagination(value: unknown): FinancialOfflineDepositsPagination {
  const source = toObject(value) as FinancialOfflineDepositsPaginationRaw | null
  return {
    page: toNumber(source?.page) || 1,
    perPage: toNumber(source?.perPage) || 20,
    total: toNumber(source?.total),
    totalPages: toNumber(source?.totalPages) || 1,
  }
}

export async function getFinancialOfflineDeposits(page = 1, perPage = 20) {
  const rawDetails = await apiGet<FinancialOfflineDepositsRaw>('/api/financial/offline-deposits', {
    params: {
      page,
      perPage,
    },
  })

  return {
    activities: normalizeOfflineDepositActivities(rawDetails.activities),
    pagination: normalizeOfflineDepositsPagination(rawDetails.pagination),
  } satisfies FinancialOfflineDeposits
}

function normalizeWalletActivityUser(value: unknown): FinancialWalletActivityUser | null {
  const source = toObject(value) as FinancialWalletActivityUserRaw | null
  if (!source) {
    return null
  }

  const username = toText(source.username) || null
  const avatar = toText(source.avatar) || null

  if (!username && !avatar) {
    return null
  }

  return { username, avatar }
}

function normalizeWalletActivity(value: unknown): FinancialWalletActivity | null {
  const source = toObject(value) as FinancialWalletActivityRaw | null
  if (!source) {
    return null
  }

  const id = toText(source.id) || toText(source._id)
  if (!id) {
    return null
  }

  return {
    id,
    source: toText(source.source),
    actorId: toText(source.actorId),
    user: normalizeWalletActivityUser(source.user),
    amount: toNumber(source.amount),
    status: toText(source.status),
    type: toText(source.type),
    description: toText(source.description),
    reference: toText(source.reference),
    from: toText(source.from) || null,
    to: toText(source.to) || null,
    createdAt: toText(source.createdAt),
    date: toText(source.date),
    time: toText(source.time),
    currency: toText(source.currency) || 'NGN',
  } satisfies FinancialWalletActivity
}

function normalizeWalletActivities(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((activity) => normalizeWalletActivity(activity))
    .filter((activity): activity is FinancialWalletActivity => Boolean(activity))
}

function normalizeWalletActivitiesPagination(value: unknown): FinancialWalletActivitiesPagination {
  const source = toObject(value) as FinancialWalletActivitiesPaginationRaw | null
  return {
    page: toNumber(source?.page) || 1,
    perPage: toNumber(source?.perPage) || 20,
    total: toNumber(source?.total),
    totalPages: toNumber(source?.totalPages) || 1,
  }
}

export async function getFinancialWalletActivities(page = 1, perPage = 20) {
  const rawDetails = await apiGet<FinancialWalletActivitiesRaw>('/api/financial/wallet-activities', {
    params: {
      page,
      perPage,
    },
  })

  return {
    activities: normalizeWalletActivities(rawDetails.activities),
    pagination: normalizeWalletActivitiesPagination(rawDetails.pagination),
  } satisfies FinancialWalletActivities
}

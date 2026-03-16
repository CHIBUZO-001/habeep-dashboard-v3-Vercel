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

export type FinancialLoansRange = {
  from: string | null
  to: string | null
  previousFrom: string | null
  previousTo: string | null
}

export type FinancialLoansSummaryCard = {
  value: number
  changeRate: number | null
}

export type FinancialLoansSummaryCards = {
  outstandingBalance: FinancialLoansSummaryCard
  totalDisbursed: FinancialLoansSummaryCard
  activeLoans: FinancialLoansSummaryCard
  overdueLoans: FinancialLoansSummaryCard
}

export type FinancialLoansSummary = {
  range: FinancialLoansRange
  currency: string
  cards: FinancialLoansSummaryCards
}

export type FinancialLoansOverview = {
  totalLoans: number
  totalLoanValue: number
  activeLoans: number
  activeOutstanding: number
  overdueLoans: number
  overdueOutstanding: number
  defaultRate: number
  avgInterestRate: number
}

export type FinancialLoansPortfolioPoint = {
  month: string
  disbursements: number
  collections: number
  overdue: number
}

export type FinancialLoansPortfolio = FinancialLoansPortfolioPoint[]

export type FinancialLoansDistributionItem = {
  type: string
  count: number
  percentage: number
}

export type FinancialLoansDistribution = {
  total: number
  items: FinancialLoansDistributionItem[]
}

export type FinancialLoanBorrower = {
  name: string | null
  username: string | null
  avatar: string | null
  email: string | null
  userType: string | null
}

export type FinancialLoan = {
  id: string
  reference: string | null
  borrower: FinancialLoanBorrower | null
  principal: number
  interestRate: number | null
  status: string
  type: string
  product: string | null
  currency: string | null
  termMonths: number | null
  disbursedAt: string | null
  dueAt: string | null
  createdAt: string
}

export type FinancialLoansPagination = {
  page: number
  perPage: number
  total: number
  totalPages: number
}

export type FinancialLoans = {
  loans: FinancialLoan[]
  pagination: FinancialLoansPagination
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

type FinancialLoansRangeRaw = {
  from?: unknown
  to?: unknown
  previousFrom?: unknown
  previousTo?: unknown
}

type FinancialLoansSummaryCardRaw = {
  value?: unknown
  changeRate?: unknown
}

type FinancialLoansSummaryCardsRaw = {
  outstandingBalance?: unknown
  totalDisbursed?: unknown
  activeLoans?: unknown
  overdueLoans?: unknown
}

type FinancialLoansSummaryRaw = {
  range?: unknown
  currency?: unknown
  cards?: unknown
}

type FinancialLoansOverviewRaw = {
  totalLoans?: unknown
  totalLoanValue?: unknown
  activeLoans?: unknown
  activeOutstanding?: unknown
  overdueLoans?: unknown
  overdueOutstanding?: unknown
  defaultRate?: unknown
  avgInterestRate?: unknown
}

type FinancialLoansPortfolioPointRaw = {
  month?: unknown
  disbursements?: unknown
  collections?: unknown
  overdue?: unknown
}

type FinancialLoansDistributionItemRaw = {
  type?: unknown
  count?: unknown
  percentage?: unknown
}

type FinancialLoansDistributionRaw = {
  total?: unknown
  items?: unknown
}

type FinancialLoanBorrowerRaw = {
  name?: unknown
  username?: unknown
  avatar?: unknown
  email?: unknown
  userType?: unknown
}

type FinancialLoanRaw = {
  id?: unknown
  _id?: unknown
  reference?: unknown
  borrower?: unknown
  user?: unknown
  userId?: unknown
  landlordId?: unknown
  principal?: unknown
  amount?: unknown
  amountToPay?: unknown
  amountSettled?: unknown
  outstanding?: unknown
  monthlyPayment?: unknown
  interestRate?: unknown
  rate?: unknown
  creditScore?: unknown
  riskLevel?: unknown
  status?: unknown
  type?: unknown
  product?: unknown
  currency?: unknown
  termMonths?: unknown
  durationMonths?: unknown
  dateApplied?: unknown
  dateDisbursed?: unknown
  disbursedAt?: unknown
  dueDate?: unknown
  dueAt?: unknown
  createdAt?: unknown
  repaymentProgress?: unknown
}

type FinancialLoansPaginationRaw = {
  page?: unknown
  perPage?: unknown
  total?: unknown
  totalPages?: unknown
}

type FinancialLoansRaw = {
  loans?: unknown
  activities?: unknown
  data?: unknown
  items?: unknown
  pagination?: unknown
  meta?: unknown
  metadata?: unknown
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

function normalizeLoansRange(value: unknown): FinancialLoansRange {
  const source = toObject(value) as FinancialLoansRangeRaw | null
  return {
    from: toText(source?.from) || null,
    to: toText(source?.to) || null,
    previousFrom: toText(source?.previousFrom) || null,
    previousTo: toText(source?.previousTo) || null,
  }
}

function normalizeLoansSummaryCard(value: unknown): FinancialLoansSummaryCard {
  const source = toObject(value) as FinancialLoansSummaryCardRaw | null
  return {
    value: toNumber(source?.value),
    changeRate: toNumberOrNull(source?.changeRate),
  }
}

function normalizeLoansSummaryCards(value: unknown): FinancialLoansSummaryCards {
  const source = toObject(value) as FinancialLoansSummaryCardsRaw | null
  return {
    outstandingBalance: normalizeLoansSummaryCard(source?.outstandingBalance),
    totalDisbursed: normalizeLoansSummaryCard(source?.totalDisbursed),
    activeLoans: normalizeLoansSummaryCard(source?.activeLoans),
    overdueLoans: normalizeLoansSummaryCard(source?.overdueLoans),
  }
}

export async function getFinancialLoansSummary(params: { from: string; to: string }) {
  const rawDetails = await apiGet<FinancialLoansSummaryRaw>('/api/financial/loans/summary', {
    params,
  })

  return {
    range: normalizeLoansRange(rawDetails.range),
    currency: toText(rawDetails.currency) || 'NGN',
    cards: normalizeLoansSummaryCards(rawDetails.cards),
  } satisfies FinancialLoansSummary
}

function normalizeLoansOverview(value: unknown): FinancialLoansOverview {
  const source = toObject(value) as FinancialLoansOverviewRaw | null
  return {
    totalLoans: toNumber(source?.totalLoans),
    totalLoanValue: toNumber(source?.totalLoanValue),
    activeLoans: toNumber(source?.activeLoans),
    activeOutstanding: toNumber(source?.activeOutstanding),
    overdueLoans: toNumber(source?.overdueLoans),
    overdueOutstanding: toNumber(source?.overdueOutstanding),
    defaultRate: toNumber(source?.defaultRate),
    avgInterestRate: toNumber(source?.avgInterestRate),
  }
}

export async function getFinancialLoansOverview() {
  const rawDetails = await apiGet<FinancialLoansOverviewRaw>('/api/financial/loans/overview')
  return normalizeLoansOverview(rawDetails) satisfies FinancialLoansOverview
}

function normalizeLoansPortfolioPoint(value: unknown): FinancialLoansPortfolioPoint | null {
  const source = toObject(value) as FinancialLoansPortfolioPointRaw | null
  if (!source) {
    return null
  }

  const month = toText(source.month)
  if (!month) {
    return null
  }

  return {
    month,
    disbursements: toNumber(source.disbursements),
    collections: toNumber(source.collections),
    overdue: toNumber(source.overdue),
  } satisfies FinancialLoansPortfolioPoint
}

function normalizeLoansPortfolio(value: unknown): FinancialLoansPortfolio {
  const sourceArray = Array.isArray(value)
    ? value
    : Array.isArray(toObject(value)?.data)
      ? (toObject(value)?.data as unknown[])
      : null

  if (!sourceArray) {
    return []
  }

  return sourceArray
    .map((point) => normalizeLoansPortfolioPoint(point))
    .filter((point): point is FinancialLoansPortfolioPoint => Boolean(point))
}

export async function getFinancialLoansPortfolio() {
  const rawDetails = await apiGet<unknown>('/api/financial/loans/portfolio')
  return normalizeLoansPortfolio(rawDetails) satisfies FinancialLoansPortfolio
}

function normalizeLoansDistributionItem(value: unknown): FinancialLoansDistributionItem | null {
  const source = toObject(value) as FinancialLoansDistributionItemRaw | null
  if (!source) {
    return null
  }

  const type = toText(source.type)
  if (!type) {
    return null
  }

  return {
    type,
    count: toNumber(source.count),
    percentage: toNumber(source.percentage),
  } satisfies FinancialLoansDistributionItem
}

function normalizeLoansDistribution(value: unknown): FinancialLoansDistribution {
  const source = toObject(value) as FinancialLoansDistributionRaw | null
  const itemsSource = Array.isArray(source?.items) ? source.items : []

  return {
    total: toNumber(source?.total),
    items: itemsSource
      .map((item) => normalizeLoansDistributionItem(item))
      .filter((item): item is FinancialLoansDistributionItem => Boolean(item)),
  } satisfies FinancialLoansDistribution
}

export async function getFinancialLoansDistribution() {
  const rawDetails = await apiGet<FinancialLoansDistributionRaw>('/api/financial/loans/distribution')
  return normalizeLoansDistribution(rawDetails) satisfies FinancialLoansDistribution
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

function normalizeLoanBorrower(value: unknown): FinancialLoanBorrower | null {
  const source = toObject(value) as FinancialLoanBorrowerRaw | null
  if (!source) {
    return null
  }

  const name = toText(source.name) || null
  const username = toText(source.username) || null
  const avatar = toText(source.avatar) || null
  const email = toText(source.email) || null
  const userType = toText(source.userType) || null

  if (!name && !username && !avatar && !email && !userType) {
    return null
  }

  return {
    name,
    username,
    avatar,
    email,
    userType,
  }
}

function normalizeLoan(value: unknown): FinancialLoan | null {
  const source = toObject(value) as FinancialLoanRaw | null
  if (!source) {
    return null
  }

  const id = toText(source.id) || toText(source._id)
  if (!id) {
    return null
  }

  const borrower =
    normalizeLoanBorrower(source.borrower ?? source.user) ??
    (() => {
      const userId = toText(source.userId)
      if (!userId) {
        return null
      }

      return {
        name: null,
        username: userId,
        avatar: null,
        email: null,
        userType: null,
      } satisfies FinancialLoanBorrower
    })()

  return {
    id,
    reference: toText(source.reference) || null,
    borrower,
    principal: toNumber(source.principal ?? source.amount),
    interestRate: toNumberOrNull(source.interestRate ?? source.rate),
    status: toText(source.status),
    type: toText(source.type),
    product: toText(source.product) || null,
    currency: toText(source.currency) || null,
    termMonths: toNumberOrNull(source.termMonths ?? source.durationMonths),
    disbursedAt: toText(source.disbursedAt ?? source.dateDisbursed) || null,
    dueAt: toText(source.dueAt ?? source.dueDate) || null,
    createdAt: toText(source.createdAt ?? source.dateApplied),
  } satisfies FinancialLoan
}

function normalizeLoans(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((loan) => normalizeLoan(loan))
    .filter((loan): loan is FinancialLoan => Boolean(loan))
}

function normalizeLoansPagination(value: unknown): FinancialLoansPagination {
  const source = toObject(value) as FinancialLoansPaginationRaw | null
  return {
    page: toNumber(source?.page) || 1,
    perPage: toNumber(source?.perPage) || 20,
    total: toNumber(source?.total),
    totalPages: toNumber(source?.totalPages) || 1,
  }
}

export async function getFinancialLoans(page = 1, perPage = 20) {
  const rawDetails = await apiGet<FinancialLoansRaw>('/api/financial/loans', {
    params: {
      page,
      perPage,
    },
  })

  if (Array.isArray(rawDetails)) {
    return {
      loans: normalizeLoans(rawDetails),
      pagination: {
        page,
        perPage,
        total: rawDetails.length,
        totalPages: 1,
      },
    } satisfies FinancialLoans
  }

  return {
    loans: normalizeLoans(rawDetails.loans ?? rawDetails.items ?? rawDetails.activities ?? rawDetails.data),
    pagination: normalizeLoansPagination(rawDetails.pagination ?? rawDetails.meta ?? rawDetails.metadata),
  } satisfies FinancialLoans
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

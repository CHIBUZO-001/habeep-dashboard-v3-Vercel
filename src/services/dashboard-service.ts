import { apiGet } from './api-service'

export type DashboardRevenueBreakdownItem = {
  name: string
  amount: number
  categories: Record<string, number>
}

export type DashboardSummary = {
  totalUsers: number
  totalProperties: number
  activeAgents: number
  totalRevenue: number
  revenueBreakdown: DashboardRevenueBreakdownItem[]
}

export type DashboardMetricPoint = {
  date: string
  count: number
}

export type DashboardMetrics = {
  range: string
  users: DashboardMetricPoint[]
  properties: DashboardMetricPoint[]
  revenue: DashboardMetricPoint[]
}

export type DashboardGeoDistributionItem = {
  city: string
  properties: number
  agents: number
}

export type DashboardGeoDistribution = {
  data: DashboardGeoDistributionItem[]
}

type LooseObject = Record<string, unknown>

type DashboardSummaryRaw = {
  totalUsers?: unknown
  totalProperties?: unknown
  activeAgents?: unknown
  totalRevenue?: unknown
  revenueBreakdown?: unknown
}

type DashboardMetricsRaw = {
  range?: unknown
  users?: unknown
  properties?: unknown
  revenue?: unknown
}

type DashboardGeoDistributionRaw = {
  data?: unknown
}

function toObject(value: unknown): LooseObject | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }
  return value as LooseObject
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

function toString(value: unknown) {
  if (typeof value === 'string') {
    return value
  }
  return ''
}

function normalizeRevenueBreakdownItem(item: unknown): DashboardRevenueBreakdownItem | null {
  const source = toObject(item)
  if (!source) {
    return null
  }

  const nestedCandidate = Object.values(source).find((value) => Boolean(toObject(value)))
  const bucketSource = toObject(nestedCandidate) ?? source
  const categoriesSource = toObject(bucketSource.categories)

  const categories: Record<string, number> = {}
  if (categoriesSource) {
    for (const [name, amount] of Object.entries(categoriesSource)) {
      categories[name] = toNumber(amount)
    }
  }

  const fallbackName = Object.keys(source)[0] ?? 'unknown'

  return {
    name: toString(bucketSource.name) || fallbackName,
    amount: toNumber(bucketSource.amount),
    categories,
  }
}

function normalizeMetricSeries(series: unknown): DashboardMetricPoint[] {
  if (!Array.isArray(series)) {
    return []
  }

  return series
    .map((item) => {
      const source = toObject(item)
      if (!source) {
        return null
      }

      const date = toString(source.date)
      if (!date) {
        return null
      }

      return {
        date,
        count: toNumber(source.count),
      }
    })
    .filter((item): item is DashboardMetricPoint => Boolean(item))
}

function normalizeGeoDistribution(data: unknown): DashboardGeoDistributionItem[] {
  if (!Array.isArray(data)) {
    return []
  }

  return data
    .map((item) => {
      const source = toObject(item)
      if (!source) {
        return null
      }

      const city = toString(source.city)
      if (!city) {
        return null
      }

      return {
        city,
        properties: toNumber(source.properties),
        agents: toNumber(source.agents),
      }
    })
    .filter((item): item is DashboardGeoDistributionItem => Boolean(item))
}

function extractGeoDistributionRows(rawDetails: unknown) {
  if (Array.isArray(rawDetails)) {
    return rawDetails
  }

  const source = toObject(rawDetails)
  return source?.data
}

export async function getDashboardSummary() {
  const rawDetails = await apiGet<DashboardSummaryRaw>('/api/dashboard/summary')
  return {
    totalUsers: toNumber(rawDetails.totalUsers),
    totalProperties: toNumber(rawDetails.totalProperties),
    activeAgents: toNumber(rawDetails.activeAgents),
    totalRevenue: toNumber(rawDetails.totalRevenue),
    revenueBreakdown: Array.isArray(rawDetails.revenueBreakdown)
      ? rawDetails.revenueBreakdown
          .map((item) => normalizeRevenueBreakdownItem(item))
          .filter((item): item is DashboardRevenueBreakdownItem => Boolean(item))
      : [],
  } satisfies DashboardSummary
}

export async function getDashboardMetrics() {
  const rawDetails = await apiGet<DashboardMetricsRaw>('/api/dashboard/metrics')
  return {
    range: toString(rawDetails.range) || '365d',
    users: normalizeMetricSeries(rawDetails.users),
    properties: normalizeMetricSeries(rawDetails.properties),
    revenue: normalizeMetricSeries(rawDetails.revenue),
  } satisfies DashboardMetrics
}

export async function getDashboardGeoDistribution() {
  const rawDetails = await apiGet<DashboardGeoDistributionRaw | DashboardGeoDistributionItem[]>(
    '/api/dashboard/geo-distribution',
  )
  return {
    data: normalizeGeoDistribution(extractGeoDistributionRows(rawDetails)),
  } satisfies DashboardGeoDistribution
}

import { apiGet, apiGetWithMeta, type ApiResponseMeta } from './api-service'

export type PropertyMetrics = {
  totalProperties: number
  activeListings: number
  totalValue: number
}

export type PropertyImageAsset = {
  link: string
  thumbnail: string
  index: number
}

export type PropertyListItem = {
  id: string
  sold: boolean
  status: string
  listingFor: string
  type: string
  title: string
  description: string
  price: number
  bedrooms: number
  bathrooms: number
  plots: number
  size: number
  features: string[]
  images: PropertyImageAsset[]
  dateCreated: string
  dateUpdated: string
  publicId: string
  agentId: string
  priceCurrency: string
  postId: string
  location: {
    address: string
    city: string
  }
}

export type PropertyList = {
  data: PropertyListItem[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type PropertyListFilters = {
  search?: string
  status?: string
  listingFor?: string
  type?: string
}

export type PropertyAnalyticsRange = {
  from: string
  to: string
}

export type PropertyAnalyticsKpis = {
  totalViews: number
  totalInquiries: number
  averagePrice: number
  conversionRate: number
  range: PropertyAnalyticsRange
}

export type PropertyAnalyticsTrendPoint = {
  date: string
  label: string
  totalViews: number
  totalInquiries: number
  properties: number
}

export type PropertyAnalyticsTypeDistributionItem = {
  type: string
  count: number
  percentage: number
}

export type PropertyAnalyticsLocationPerformanceItem = {
  id: string
  city: string
  properties: number
  totalViews: number
  totalInquiries: number
  averagePrice: number
}

export type PropertyAnalyticsPriceRangeItem = {
  id: string
  bucket: string
  properties: number
  totalViews: number
  totalInquiries: number
  averagePrice: number
  conversionRate: number
}

export type PropertyAnalyticsTopPropertyItem = {
  id: string
  title: string
  publicId: string
  city: string
  totalViews: number
  totalInquiries: number
  conversionRate: number
  price: number
}

export type PropertyAnalyticsAgentPerformanceItem = {
  id: string
  name: string
  properties: number
  totalViews: number
  totalInquiries: number
  conversionRate: number
}

export type PropertyAnalyticsDashboard = {
  kpis: PropertyAnalyticsKpis
  trend: PropertyAnalyticsTrendPoint[]
  typeDistribution: PropertyAnalyticsTypeDistributionItem[]
  locationPerformance: PropertyAnalyticsLocationPerformanceItem[]
  priceRanges: PropertyAnalyticsPriceRangeItem[]
  topProperties: PropertyAnalyticsTopPropertyItem[]
  agentPerformance: PropertyAnalyticsAgentPerformanceItem[]
  range: PropertyAnalyticsRange
  responseMeta: ApiResponseMeta
}

type PropertyMetricsRaw = {
  totalProperties?: unknown
  activeListings?: unknown
  totalValue?: unknown
}

type PropertyListRaw = {
  data?: unknown
  meta?: unknown
}

type PropertyAnalyticsDashboardRaw = {
  kpis?: unknown
  trend?: unknown
  typeDistribution?: unknown
  locationPerformance?: unknown
  priceRanges?: unknown
  topProperties?: unknown
  agentPerformance?: unknown
  range?: unknown
}

type LooseObject = Record<string, unknown>

const PROPERTY_SEARCH_QUERY_PARAM_KEYS = ['search', 'query', 'q', 'keyword', 'searchQuery'] as const

const PROPERTY_QUERY_PARAM_KEYS = {
  status: 'status',
  listingFor: 'for',
  type: 'type',
} as const

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

function toBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase()
    if (normalizedValue === 'true') {
      return true
    }
    if (normalizedValue === 'false') {
      return false
    }
  }

  return false
}

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsedValue = Number(value)
    if (Number.isFinite(parsedValue)) {
      return parsedValue
    }
  }

  return 0
}

function normalizePropertyImageAsset(item: unknown): PropertyImageAsset | null {
  const source = toObject(item)
  if (!source) {
    return null
  }

  const link = toString(source.link)
  const thumbnail = toString(source.thumbnail)
  if (!link && !thumbnail) {
    return null
  }

  return {
    link,
    thumbnail,
    index: toNumber(source.index),
  }
}

function normalizePropertyAnalyticsRange(value: unknown): PropertyAnalyticsRange {
  const source = toObject(value)

  return {
    from: toString(source?.from),
    to: toString(source?.to),
  }
}

function normalizePropertyAnalyticsTrendPoint(item: unknown, index: number): PropertyAnalyticsTrendPoint | null {
  const source = toObject(item)
  if (!source) {
    return null
  }

  const date = toString(source.date) || toString(source.day) || toString(source._id)
  const label = toString(source.label) || date || `Point ${index + 1}`
  const totalViews = toNumber(source.totalViews ?? source.views)
  const totalInquiries = toNumber(source.totalInquiries ?? source.inquiries)
  const properties = toNumber(source.properties ?? source.count)

  if (!date && !label && totalViews === 0 && totalInquiries === 0 && properties === 0) {
    return null
  }

  return {
    date,
    label,
    totalViews,
    totalInquiries,
    properties,
  }
}

function normalizePropertyAnalyticsTypeDistributionItem(item: unknown): PropertyAnalyticsTypeDistributionItem | null {
  const source = toObject(item)
  if (!source) {
    return null
  }

  const type = toString(source.type) || toString(source._id)
  if (!type) {
    return null
  }

  return {
    type,
    count: toNumber(source.count),
    percentage: toNumber(source.percentage),
  }
}

function normalizePropertyAnalyticsLocationPerformanceItem(
  item: unknown,
  index: number,
): PropertyAnalyticsLocationPerformanceItem | null {
  const source = toObject(item)
  if (!source) {
    return null
  }

  const rawId = toString(source._id)
  const rawCity = toString(source.city)
  const city = rawCity || rawId || 'Unknown location'
  const id = `${rawId || rawCity || 'location'}::${index + 1}`

  return {
    id,
    city,
    properties: toNumber(source.properties),
    totalViews: toNumber(source.totalViews),
    totalInquiries: toNumber(source.totalInquiries),
    averagePrice: toNumber(source.avgPrice ?? source.averagePrice),
  }
}

function normalizePropertyAnalyticsPriceRangeItem(item: unknown): PropertyAnalyticsPriceRangeItem | null {
  const source = toObject(item)
  if (!source) {
    return null
  }

  const id = toString(source._id) || toString(source.bucket)
  const bucket = toString(source.bucket) || id
  if (!id && !bucket) {
    return null
  }

  return {
    id: id || bucket,
    bucket: bucket || 'Unknown',
    properties: toNumber(source.properties),
    totalViews: toNumber(source.totalViews),
    totalInquiries: toNumber(source.totalInquiries),
    averagePrice: toNumber(source.avgPrice ?? source.averagePrice),
    conversionRate: toNumber(source.conversionRate),
  }
}

function normalizePropertyAnalyticsTopPropertyItem(item: unknown): PropertyAnalyticsTopPropertyItem | null {
  const source = toObject(item)
  if (!source) {
    return null
  }

  const id = toString(source._id) || toString(source.propertyId) || toString(source.publicId)
  const title = toString(source.title)
  const publicId = toString(source.publicId)
  const city = toString(source.city)

  if (!id && !title && !publicId) {
    return null
  }

  return {
    id: id || publicId || title,
    title,
    publicId,
    city,
    totalViews: toNumber(source.totalViews ?? source.views),
    totalInquiries: toNumber(source.totalInquiries ?? source.inquiries),
    conversionRate: toNumber(source.conversionRate),
    price: toNumber(source.price ?? source.avgPrice),
  }
}

function normalizePropertyAnalyticsAgentPerformanceItem(item: unknown): PropertyAnalyticsAgentPerformanceItem | null {
  const source = toObject(item)
  if (!source) {
    return null
  }

  const id = toString(source._id) || toString(source.agentId)
  const name = toString(source.name) || toString(source.agentName)
  if (!id && !name) {
    return null
  }

  return {
    id: id || name,
    name: name || 'Unknown agent',
    properties: toNumber(source.properties),
    totalViews: toNumber(source.totalViews ?? source.views),
    totalInquiries: toNumber(source.totalInquiries ?? source.inquiries),
    conversionRate: toNumber(source.conversionRate),
  }
}

function normalizePropertyListItem(item: unknown): PropertyListItem | null {
  const source = toObject(item)
  if (!source) {
    return null
  }

  const id = toString(source._id)
  if (!id) {
    return null
  }

  const locationSource = toObject(source.location)

  return {
    id,
    sold: toBoolean(source.sold),
    status: toString(source.status) || 'UNKNOWN',
    listingFor: toString(source.for),
    type: toString(source.type),
    title: toString(source.title),
    description: toString(source.description),
    price: toNumber(source.price),
    bedrooms: toNumber(source.bedrooms),
    bathrooms: toNumber(source.bathrooms),
    plots: toNumber(source.plots),
    size: toNumber(source.size),
    features: Array.isArray(source.features) ? source.features.map((feature) => toString(feature)).filter(Boolean) : [],
    images: Array.isArray(source.images)
      ? source.images
          .map((image) => normalizePropertyImageAsset(image))
          .filter((image): image is PropertyImageAsset => Boolean(image))
      : [],
    dateCreated: toString(source.dateCreated),
    dateUpdated: toString(source.dateUpdated),
    publicId: toString(source.publicId),
    agentId: toString(source.agentId),
    priceCurrency: toString(source.priceCurrency) || 'NGN',
    postId: toString(source.postId),
    location: {
      address: toString(locationSource?.address),
      city: toString(locationSource?.city),
    },
  }
}

export async function getPropertyMetrics() {
  const rawDetails = await apiGet<PropertyMetricsRaw>('/api/properties/metrics')

  return {
    totalProperties: toNumber(rawDetails.totalProperties),
    activeListings: toNumber(rawDetails.activeListings),
    totalValue: toNumber(rawDetails.totalValue),
  } satisfies PropertyMetrics
}

export async function getPropertyAnalyticsDashboard() {
  const response = await apiGetWithMeta<PropertyAnalyticsDashboardRaw>('/api/properties/analytics/dashboard')
  const rawDetails = response.details

  return {
    kpis: {
      totalViews: toNumber(toObject(rawDetails.kpis)?.totalViews),
      totalInquiries: toNumber(toObject(rawDetails.kpis)?.totalInquiries),
      averagePrice: toNumber(toObject(rawDetails.kpis)?.averagePrice),
      conversionRate: toNumber(toObject(rawDetails.kpis)?.conversionRate),
      range: normalizePropertyAnalyticsRange(toObject(rawDetails.kpis)?.range),
    },
    trend: Array.isArray(rawDetails.trend)
      ? rawDetails.trend
          .map((item, index) => normalizePropertyAnalyticsTrendPoint(item, index))
          .filter((item): item is PropertyAnalyticsTrendPoint => Boolean(item))
      : [],
    typeDistribution: Array.isArray(rawDetails.typeDistribution)
      ? rawDetails.typeDistribution
          .map((item) => normalizePropertyAnalyticsTypeDistributionItem(item))
          .filter((item): item is PropertyAnalyticsTypeDistributionItem => Boolean(item))
      : [],
    locationPerformance: Array.isArray(rawDetails.locationPerformance)
      ? rawDetails.locationPerformance
          .map((item, index) => normalizePropertyAnalyticsLocationPerformanceItem(item, index))
          .filter((item): item is PropertyAnalyticsLocationPerformanceItem => Boolean(item))
      : [],
    priceRanges: Array.isArray(rawDetails.priceRanges)
      ? rawDetails.priceRanges
          .map((item) => normalizePropertyAnalyticsPriceRangeItem(item))
          .filter((item): item is PropertyAnalyticsPriceRangeItem => Boolean(item))
      : [],
    topProperties: Array.isArray(rawDetails.topProperties)
      ? rawDetails.topProperties
          .map((item) => normalizePropertyAnalyticsTopPropertyItem(item))
          .filter((item): item is PropertyAnalyticsTopPropertyItem => Boolean(item))
      : [],
    agentPerformance: Array.isArray(rawDetails.agentPerformance)
      ? rawDetails.agentPerformance
          .map((item) => normalizePropertyAnalyticsAgentPerformanceItem(item))
          .filter((item): item is PropertyAnalyticsAgentPerformanceItem => Boolean(item))
      : [],
    range: normalizePropertyAnalyticsRange(rawDetails.range),
    responseMeta: response.meta,
  } satisfies PropertyAnalyticsDashboard
}

export async function getProperties(page = 1, limit?: number, filters: PropertyListFilters = {}) {
  const search = filters.search?.trim()
  const status = filters.status?.trim()
  const listingFor = filters.listingFor?.trim()
  const type = filters.type?.trim()
  const searchParams = search
    ? Object.fromEntries(PROPERTY_SEARCH_QUERY_PARAM_KEYS.map((queryParamKey) => [queryParamKey, search]))
    : {}

  const rawDetails = await apiGet<PropertyListRaw>('/api/properties', {
    params: {
      page,
      ...(typeof limit === 'number' ? { limit } : {}),
      ...searchParams,
      ...(status ? { [PROPERTY_QUERY_PARAM_KEYS.status]: status } : {}),
      ...(listingFor ? { [PROPERTY_QUERY_PARAM_KEYS.listingFor]: listingFor } : {}),
      ...(type ? { [PROPERTY_QUERY_PARAM_KEYS.type]: type } : {}),
    },
  })

  const rawItems = Array.isArray(rawDetails) ? rawDetails : rawDetails.data
  const metaSource = Array.isArray(rawDetails) ? null : toObject(rawDetails.meta)

  return {
    data: Array.isArray(rawItems)
      ? rawItems
          .map((item) => normalizePropertyListItem(item))
          .filter((item): item is PropertyListItem => Boolean(item))
      : [],
    meta: {
      page: toNumber(metaSource?.page) || page,
      limit: toNumber(metaSource?.limit) || limit || (Array.isArray(rawItems) ? rawItems.length : 0),
      total: toNumber(metaSource?.total),
      totalPages: toNumber(metaSource?.totalPages),
    },
  } satisfies PropertyList
}

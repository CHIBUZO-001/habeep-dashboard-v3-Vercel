import { apiGetWithMeta, type ApiResponseMeta } from './api-service'

export type PerformanceHistoryTimeRange = '24h'

export type PerformanceHistoryPoint = {
  timestamp: string
  cpu: number
  memory: number
  disk: number
  network: number
  responseTime: number
  errorRate: number
  throughput: number
  activeUsers: number
}

export type PerformanceHistory = {
  data: PerformanceHistoryPoint[]
  meta: ApiResponseMeta
}

type LooseObject = Record<string, unknown>

type PerformanceHistoryPointRaw = {
  timestamp?: unknown
  cpu?: unknown
  memory?: unknown
  disk?: unknown
  network?: unknown
  responseTime?: unknown
  errorRate?: unknown
  throughput?: unknown
  activeUsers?: unknown
}

function toObject(value: unknown): LooseObject | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as LooseObject
}

function toString(value: unknown) {
  return typeof value === 'string' ? value : ''
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

function normalizePerformanceHistoryPoint(item: unknown): PerformanceHistoryPoint | null {
  const source = toObject(item) as PerformanceHistoryPointRaw | null

  if (!source) {
    return null
  }

  const timestamp = toString(source.timestamp)
  if (!timestamp) {
    return null
  }

  return {
    timestamp,
    cpu: toNumber(source.cpu),
    memory: toNumber(source.memory),
    disk: toNumber(source.disk),
    network: toNumber(source.network),
    responseTime: toNumber(source.responseTime),
    errorRate: toNumber(source.errorRate),
    throughput: toNumber(source.throughput),
    activeUsers: toNumber(source.activeUsers),
  }
}

export async function getPerformanceHistory(timeRange: PerformanceHistoryTimeRange = '24h') {
  const { details, meta } = await apiGetWithMeta<PerformanceHistoryPointRaw[]>('/api/monitoring/performance-history', {
    params: { timeRange },
  })

  return {
    data: Array.isArray(details)
      ? details
          .map((item) => normalizePerformanceHistoryPoint(item))
          .filter((item): item is PerformanceHistoryPoint => Boolean(item))
      : [],
    meta,
  } satisfies PerformanceHistory
}

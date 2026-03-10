import { apiGetWithMeta, type ApiResponseMeta } from './api-service'

export type SystemMetricsTimeRange = '24h'

export type SystemMetricsCpu = {
  usage: number
  cores: number
  temperature: number
  frequency: number
  processes: number
}

export type SystemMetricsMemory = {
  used: number
  total: number
  available: number
  cached: number
  buffers: number
  swapUsed: number
  swapTotal: number
}

export type SystemMetricsDisk = {
  used: number
  total: number
  available: number
  readSpeed: number
  writeSpeed: number
  iops: number
}

export type SystemMetricsNetwork = {
  inbound: number
  outbound: number
  connections: number
  latency: number
  packetLoss: number
  bandwidth: number
}

export type SystemMetricsDatabase = {
  connections: number
  maxConnections: number
  queryTime: number
  slowQueries: number
  lockWaits: number
  deadlocks: number
  cacheHitRatio: number
  replicationLag: number
}

export type SystemMetricsApplication = {
  uptime: number
  responseTime: number
  errorRate: number
  throughput: number
  activeUsers: number
  queueSize: number
  cacheHitRatio: number
  memoryLeaks: number
}

export type SystemMetricsServiceStatus =
  | 'healthy'
  | 'warning'
  | 'critical'
  | 'degraded'
  | 'offline'
  | string

export type SystemMetricsService = {
  id: string
  name: string
  status: SystemMetricsServiceStatus
  uptime: number
  responseTime: number
  errorRate: number
  lastCheck: string
  version: string
  dependencies: string[]
  healthScore: number
}

export type SystemMetricsAlertType =
  | 'info'
  | 'warning'
  | 'error'
  | 'critical'
  | string

export type SystemMetricsAlert = {
  id: string
  type: SystemMetricsAlertType
  title: string
  message: string
  source: string
  timestamp: string
  acknowledged: boolean
  resolved: boolean
  severity: number
  tags: string[]
}

export type SystemMetricsSnapshot = {
  timestamp: string
  cpu: SystemMetricsCpu
  memory: SystemMetricsMemory
  disk: SystemMetricsDisk
  network: SystemMetricsNetwork
  database: SystemMetricsDatabase
  application: SystemMetricsApplication
  services: SystemMetricsService[]
  alerts: SystemMetricsAlert[]
}

export type SystemMetricsResponse = {
  data: SystemMetricsSnapshot
  meta: ApiResponseMeta
}

type LooseObject = Record<string, unknown>

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

function toBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : false
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === 'string')
}

function normalizeCpu(value: unknown): SystemMetricsCpu {
  const source = toObject(value)

  return {
    usage: toNumber(source?.usage),
    cores: toNumber(source?.cores),
    temperature: toNumber(source?.temperature),
    frequency: toNumber(source?.frequency),
    processes: toNumber(source?.processes),
  }
}

function normalizeMemory(value: unknown): SystemMetricsMemory {
  const source = toObject(value)

  return {
    used: toNumber(source?.used),
    total: toNumber(source?.total),
    available: toNumber(source?.available),
    cached: toNumber(source?.cached),
    buffers: toNumber(source?.buffers),
    swapUsed: toNumber(source?.swapUsed),
    swapTotal: toNumber(source?.swapTotal),
  }
}

function normalizeDisk(value: unknown): SystemMetricsDisk {
  const source = toObject(value)

  return {
    used: toNumber(source?.used),
    total: toNumber(source?.total),
    available: toNumber(source?.available),
    readSpeed: toNumber(source?.readSpeed),
    writeSpeed: toNumber(source?.writeSpeed),
    iops: toNumber(source?.iops),
  }
}

function normalizeNetwork(value: unknown): SystemMetricsNetwork {
  const source = toObject(value)

  return {
    inbound: toNumber(source?.inbound),
    outbound: toNumber(source?.outbound),
    connections: toNumber(source?.connections),
    latency: toNumber(source?.latency),
    packetLoss: toNumber(source?.packetLoss),
    bandwidth: toNumber(source?.bandwidth),
  }
}

function normalizeDatabase(value: unknown): SystemMetricsDatabase {
  const source = toObject(value)

  return {
    connections: toNumber(source?.connections),
    maxConnections: toNumber(source?.maxConnections),
    queryTime: toNumber(source?.queryTime),
    slowQueries: toNumber(source?.slowQueries),
    lockWaits: toNumber(source?.lockWaits),
    deadlocks: toNumber(source?.deadlocks),
    cacheHitRatio: toNumber(source?.cacheHitRatio),
    replicationLag: toNumber(source?.replicationLag),
  }
}

function normalizeApplication(value: unknown): SystemMetricsApplication {
  const source = toObject(value)

  return {
    uptime: toNumber(source?.uptime),
    responseTime: toNumber(source?.responseTime),
    errorRate: toNumber(source?.errorRate),
    throughput: toNumber(source?.throughput),
    activeUsers: toNumber(source?.activeUsers),
    queueSize: toNumber(source?.queueSize),
    cacheHitRatio: toNumber(source?.cacheHitRatio),
    memoryLeaks: toNumber(source?.memoryLeaks),
  }
}

function normalizeService(value: unknown): SystemMetricsService | null {
  const source = toObject(value)
  const id = toString(source?.id)
  const name = toString(source?.name)

  if (!id || !name) {
    return null
  }

  return {
    id,
    name,
    status: toString(source?.status),
    uptime: toNumber(source?.uptime),
    responseTime: toNumber(source?.responseTime),
    errorRate: toNumber(source?.errorRate),
    lastCheck: toString(source?.lastCheck),
    version: toString(source?.version),
    dependencies: toStringArray(source?.dependencies),
    healthScore: toNumber(source?.healthScore),
  }
}

function normalizeAlert(value: unknown): SystemMetricsAlert | null {
  const source = toObject(value)
  const id = toString(source?.id)
  const title = toString(source?.title)

  if (!id || !title) {
    return null
  }

  return {
    id,
    type: toString(source?.type),
    title,
    message: toString(source?.message),
    source: toString(source?.source),
    timestamp: toString(source?.timestamp),
    acknowledged: toBoolean(source?.acknowledged),
    resolved: toBoolean(source?.resolved),
    severity: toNumber(source?.severity),
    tags: toStringArray(source?.tags),
  }
}

function normalizeSystemMetricsSnapshot(value: unknown): SystemMetricsSnapshot {
  const source = toObject(value)

  return {
    timestamp: toString(source?.timestamp),
    cpu: normalizeCpu(source?.cpu),
    memory: normalizeMemory(source?.memory),
    disk: normalizeDisk(source?.disk),
    network: normalizeNetwork(source?.network),
    database: normalizeDatabase(source?.database),
    application: normalizeApplication(source?.application),
    services: Array.isArray(source?.services)
      ? source.services
          .map((item) => normalizeService(item))
          .filter((item): item is SystemMetricsService => Boolean(item))
      : [],
    alerts: Array.isArray(source?.alerts)
      ? source.alerts
          .map((item) => normalizeAlert(item))
          .filter((item): item is SystemMetricsAlert => Boolean(item))
      : [],
  }
}

export async function getSystemMetrics(
  timeRange: SystemMetricsTimeRange = '24h',
) {
  const { details, meta } = await apiGetWithMeta('/api/monitoring/system-metrics', {
    params: { timeRange },
  })

  return {
    data: normalizeSystemMetricsSnapshot(details),
    meta,
  } satisfies SystemMetricsResponse
}

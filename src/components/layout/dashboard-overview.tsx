import {
  Activity,
  Building2,
  RefreshCw,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { cn } from '../../lib/cn'
import { getApiErrorMessage } from '../../lib/http-client'
import {
  getDashboardGeoDistribution,
  getDashboardMetrics,
  getDashboardSummary,
  type DashboardGeoDistribution,
  type DashboardMetricPoint,
  type DashboardMetrics,
  type DashboardSummary,
} from '../../services'
import { useToast } from '../ui/toast-provider'

const numberFormatter = new Intl.NumberFormat('en-NG')
const compactNumberFormatter = new Intl.NumberFormat('en-NG', {
  notation: 'compact',
  maximumFractionDigits: 1,
})
const currencyFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
})

const labelCorrections: Record<string, string> = {
  commision: 'commission',
}

const responsiveChartInitialDimension = {
  width: 520,
  height: 300,
} as const

const surfaceCardClass =
  'group rounded-2xl border border-slate-200/85 bg-white/90 p-2 md:p-4 shadow-sm shadow-slate-900/5 ring-1 ring-white/70 transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/10 dark:border-slate-800/80 dark:bg-slate-900/90 dark:ring-slate-800/80 dark:hover:border-blue-900/60 dark:hover:shadow-blue-950/30'

function formatDateLabel(inputDate: string) {
  const parsedDate = new Date(inputDate)
  if (Number.isNaN(parsedDate.getTime())) {
    return inputDate
  }

  return parsedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function shortenCityName(city: string) {
  return city
    .replace(' State', '')
    .replace('(FCT)', 'FCT')
    .replace('Abuja FCT', 'Abuja')
}

function formatDisplayLabel(inputLabel: string) {
  const segments = inputLabel
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)

  if (segments.length === 0) {
    return 'Unknown'
  }

  return segments
    .map((segment) => {
      const normalizedSegment = labelCorrections[segment.toLowerCase()] ?? segment.toLowerCase()
      return normalizedSegment.charAt(0).toUpperCase() + normalizedSegment.slice(1)
    })
    .join(' ')
}

function calculateSeriesTrend(series: DashboardMetricPoint[]) {
  if (series.length < 2) {
    return null
  }

  const sortedSeries = [...series].sort((leftPoint, rightPoint) => leftPoint.date.localeCompare(rightPoint.date))
  const previousValue = sortedSeries[sortedSeries.length - 2]?.count ?? 0
  const latestValue = sortedSeries[sortedSeries.length - 1]?.count ?? 0

  if (previousValue === 0) {
    if (latestValue === 0) {
      return 0
    }
    return 100
  }

  return ((latestValue - previousValue) / Math.abs(previousValue)) * 100
}

export function DashboardOverview() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [geoDistribution, setGeoDistribution] = useState<DashboardGeoDistribution | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { toast } = useToast()

  const loadOverview = useCallback(
    async (showErrorToast = false) => {
      setIsLoading(true)

      try {
        const [summaryData, metricsData, geoDistributionData] = await Promise.all([
          getDashboardSummary(),
          getDashboardMetrics(),
          getDashboardGeoDistribution(),
        ])

        setSummary(summaryData)
        setMetrics(metricsData)
        setGeoDistribution(geoDistributionData)
        setErrorMessage(null)
      } catch (error) {
        const message = getApiErrorMessage(error, 'Failed to load dashboard overview.')
        setErrorMessage(message)
        if (showErrorToast) {
          toast({
            variant: 'error',
            title: 'Overview load failed',
            description: message,
          })
        }
      } finally {
        setIsLoading(false)
      }
    },
    [toast],
  )

  useEffect(() => {
    void loadOverview()
  }, [loadOverview])

  const stats = useMemo(() => {
    const usersTrend = calculateSeriesTrend(metrics?.users ?? [])
    const propertiesTrend = calculateSeriesTrend(metrics?.properties ?? [])
    const revenueTrend = calculateSeriesTrend(metrics?.revenue ?? [])

    return [
      {
        key: 'users',
        label: 'Total Users',
        value: numberFormatter.format(summary?.totalUsers ?? 0),
        trend: usersTrend,
        icon: Users,
      },
      {
        key: 'properties',
        label: 'Total Properties',
        value: numberFormatter.format(summary?.totalProperties ?? 0),
        trend: propertiesTrend,
        icon: Building2,
      },
      {
        key: 'agents',
        label: 'Active Agents',
        value: numberFormatter.format(summary?.activeAgents ?? 0),
        trend: null,
        icon: Activity,
      },
      {
        key: 'revenue',
        label: 'Total Revenue',
        value: currencyFormatter.format(summary?.totalRevenue ?? 0),
        trend: revenueTrend,
        icon: Wallet,
      },
    ]
  }, [metrics, summary])

  const metricsChartData = useMemo(() => {
    const mergedSeries = new Map<
      string,
      {
        date: string
        users: number
        properties: number
        revenue: number
      }
    >()

    const applySeries = (series: DashboardMetricPoint[], key: 'users' | 'properties' | 'revenue') => {
      for (const point of series) {
        const existingPoint = mergedSeries.get(point.date) ?? {
          date: point.date,
          users: 0,
          properties: 0,
          revenue: 0,
        }
        existingPoint[key] = point.count
        mergedSeries.set(point.date, existingPoint)
      }
    }

    applySeries(metrics?.users ?? [], 'users')
    applySeries(metrics?.properties ?? [], 'properties')
    applySeries(metrics?.revenue ?? [], 'revenue')

    return Array.from(mergedSeries.values()).sort((leftPoint, rightPoint) =>
      leftPoint.date.localeCompare(rightPoint.date),
    )
  }, [metrics])

  const hasMetricsData = useMemo(
    () =>
      metricsChartData.some(
        (point) => point.users > 0 || point.properties > 0 || point.revenue > 0,
      ),
    [metricsChartData],
  )

  const geoChartData = useMemo(() => {
    return (geoDistribution?.data ?? [])
      .map((cityData) => ({
        ...cityData,
        total: cityData.properties + cityData.agents,
      }))
      .sort((leftCity, rightCity) => rightCity.total - leftCity.total)
      .slice(0, 8)
  }, [geoDistribution])

  const revenueBreakdown = useMemo(() => {
    const rows = summary?.revenueBreakdown ?? []
    const derivedTotalAmount = rows.reduce((sum, row) => sum + row.amount, 0)
    const totalAmount = (summary?.totalRevenue ?? 0) > 0 ? summary?.totalRevenue ?? 0 : derivedTotalAmount

    return rows
      .map((row) => {
        const categories = Object.entries(row.categories)
          .map(([categoryName, amount]) => ({
            name: categoryName,
            displayName: formatDisplayLabel(categoryName),
            amount,
          }))
          .sort((leftCategory, rightCategory) => rightCategory.amount - leftCategory.amount)

        return {
          ...row,
          displayName: formatDisplayLabel(row.name),
          categories,
          share: totalAmount > 0 ? (row.amount / totalAmount) * 100 : 0,
        }
      })
      .sort((leftRow, rightRow) => rightRow.amount - leftRow.amount)
  }, [summary])

  return (
    <>
      {errorMessage ? (
        <section className={cn(surfaceCardClass, 'dashboard-enter dashboard-enter-delay-1')}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-300">Overview unavailable</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => void loadOverview(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
              Retry
            </button>
          </div>
        </section>
      ) : null}

      <section className="dashboard-enter dashboard-enter-delay-1 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <article key={stat.key} className={cn(surfaceCardClass, 'min-w-0')}>
              <div className="flex items-center justify-between">
                <p className="min-w-0 pr-2 text-sm text-slate-500 dark:text-slate-400 line-clamp-2 xl:line-clamp-1">
                  {stat.label}
                </p>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                  <Icon className="h-4 w-4" />
                </span>
              </div>

              <p
                className="mt-3 text-lg font-semibold leading-tight sm:text-2xl line-clamp-2 xl:line-clamp-1"
                title={stat.value}
              >
                {stat.value}
              </p>
              {stat.trend === null ? (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {stat.key === 'agents' ? 'Live currently active count' : 'No recent trend data'}
                </p>
              ) : (
                <p
                  className={cn(
                    'mt-2 inline-flex items-center gap-1 text-xs font-medium',
                    stat.trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
                  )}
                >
                  <TrendingUp className={cn('h-3.5 w-3.5', stat.trend < 0 && 'rotate-180')} />
                  {stat.trend >= 0 ? '+' : ''}
                  {stat.trend.toFixed(1)}%
                </p>
              )}
            </article>
          )
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <article className={cn(surfaceCardClass, 'dashboard-enter dashboard-enter-delay-2 min-w-0')}>
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Growth Metrics</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Range: {metrics?.range ?? '365d'} | Users, properties, and revenue trend
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadOverview(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              aria-label="Refresh metrics"
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </button>
          </header>

          <div className="h-[300px] w-full min-w-0">
            {hasMetricsData ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
                initialDimension={responsiveChartInitialDimension}
              >
                <LineChart data={metricsChartData} margin={{ top: 10, right: 12, left: -8, bottom: 6 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => formatDateLabel(String(value))}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    cursor={{ stroke: '#94a3b8', strokeOpacity: 0.3 }}
                    contentStyle={{
                      borderRadius: '0.75rem',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                    }}
                    formatter={(value, name) => {
                      const label = String(name)
                      return [
                        compactNumberFormatter.format(Number(value ?? 0)),
                        label.charAt(0).toUpperCase() + label.slice(1),
                      ]
                    }}
                    labelFormatter={(value) => formatDateLabel(String(value))}
                  />
                  <Line type="monotone" dataKey="users" stroke="#2563eb" strokeWidth={2.2} dot={false} />
                  <Line type="monotone" dataKey="properties" stroke="#0891b2" strokeWidth={2.2} dot={false} />
                  <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2.2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No metrics data available yet.
              </div>
            )}
          </div>
        </article>

        <article className={cn(surfaceCardClass, 'dashboard-enter dashboard-enter-delay-3 min-w-0 pt-8')}>
          <header className="mb-4">
            <h3 className="text-sm font-semibold">Geo Distribution</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Top cities by properties and agents</p>
          </header>

          <div className="h-[300px] w-full min-w-0">
            {geoChartData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
                initialDimension={responsiveChartInitialDimension}
              >
                <BarChart data={geoChartData} margin={{ top: 10, right: 10, left: -12, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis
                    dataKey="city"
                    tickFormatter={(value) => shortenCityName(String(value))}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    interval={0}
                    angle={-24}
                    textAnchor="end"
                    height={56}
                  />
                  <YAxis width={36} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(148,163,184,0.12)' }}
                    contentStyle={{
                      borderRadius: '0.75rem',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                    }}
                  />
                  <Bar dataKey="properties" stackId="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="agents" stackId="count" fill="#0891b2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No geo distribution data available yet.
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-4">
        <article className={cn(surfaceCardClass, 'dashboard-enter dashboard-enter-delay-4')}>
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Revenue Breakdown</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Based on {currencyFormatter.format(summary?.totalRevenue ?? 0)} total revenue from the summary endpoint
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              <Wallet className="h-3.5 w-3.5" />
              {revenueBreakdown.length} streams
            </span>
          </header>

          {revenueBreakdown.length > 0 ? (
            <ul className="space-y-3">
              {revenueBreakdown.map((entry) => (
                <li key={entry.name} className="rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {entry.displayName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {entry.share > 0 ? `${entry.share.toFixed(1)}% of total revenue` : 'No revenue recorded for this stream'}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {currencyFormatter.format(entry.amount)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {entry.categories.length} {entry.categories.length === 1 ? 'category' : 'categories'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500"
                        style={{ width: `${Math.min(Math.max(entry.share, 0), 100)}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-xs font-medium text-slate-600 dark:text-slate-300">
                      {entry.share.toFixed(1)}%
                    </span>
                  </div>

                  {entry.categories.length > 0 ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {entry.categories.map((category) => (
                        <div
                          key={`${entry.name}-${category.name}`}
                          className="flex items-center justify-between rounded-lg bg-slate-100/80 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        >
                          <span>{category.displayName}</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {currencyFormatter.format(category.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      No category-level breakdown available.
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              No revenue breakdown records available.
            </div>
          )}
        </article>
      </section>
    </>
  )
}

import {
  Activity,
  Building2,
  ChartColumnBig,
  Eye,
  MapPin,
  MessageSquare,
  RefreshCw,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { cn } from '../../../lib/cn'
import type { PropertyAnalyticsDashboard } from '../../../services'
import { AnalyticsSectionEmptyState, LocationPerformanceChart, PriceBandsChart } from './analytics'
import {
  ALL_LOCATIONS_ID,
  compactNumberFormatter,
  formatAnalyticsDateLabel,
  formatAnalyticsDateRange,
  formatAnalyticsLocationLabel,
  formatAnalyticsTimestamp,
  formatCurrencyValue,
  formatPercentageValue,
  formatPropertyLabel,
  getAnalyticsBucketSortOrder,
  numberFormatter,
  responsiveChartInitialDimension,
  responsiveChartMinHeight,
  surfaceCardClass,
} from './shared'

type AnalyticsStatCard = {
  key: string
  label: string
  value: string
  note: string
  icon: LucideIcon
}

type AnalyticsDashboardViewProps = {
  analytics: PropertyAnalyticsDashboard
  analyticsError: string | null
  isAnalyticsLoading: boolean
  onRefresh: () => void
}

export function AnalyticsDashboardView({
  analytics,
  analyticsError,
  isAnalyticsLoading,
  onRefresh,
}: AnalyticsDashboardViewProps) {
  const [selectedLocationPerformanceId, setSelectedLocationPerformanceId] = useState('')

  const analyticsRange = analytics.range.from || analytics.range.to ? analytics.range : analytics.kpis.range
  const analyticsRangeLabel = formatAnalyticsDateRange(analyticsRange)
  const analyticsKpiRangeLabel = formatAnalyticsDateRange(analytics.kpis.range)

  const analyticsStatCards = useMemo<AnalyticsStatCard[]>(
    () => [
      {
        key: 'total-views',
        label: 'Total Views',
        value: numberFormatter.format(analytics.kpis.totalViews),
        note: `Captured within ${analyticsRangeLabel.toLowerCase()}`,
        icon: Eye,
      },
      {
        key: 'total-inquiries',
        label: 'Total Inquiries',
        value: numberFormatter.format(analytics.kpis.totalInquiries),
        note: 'Qualified leads generated across tracked properties',
        icon: MessageSquare,
      },
      {
        key: 'average-price',
        label: 'Average Price',
        value: `₦${compactNumberFormatter.format(analytics.kpis.averagePrice)}`,
        note: formatCurrencyValue(analytics.kpis.averagePrice),
        icon: Wallet,
      },
      {
        key: 'conversion-rate',
        label: 'Conversion Rate',
        value: formatPercentageValue(analytics.kpis.conversionRate),
        note: 'Inquiry-to-conversion efficiency across the selected range',
        icon: Activity,
      },
    ],
    [analytics.kpis, analyticsRangeLabel],
  )

  const analyticsKpiRangeSummary = useMemo(() => {
    const { from, to } = analytics.kpis.range

    if (!from && !to) {
      return null
    }

    const detailLabel =
      from && to ? `${formatAnalyticsTimestamp(from)} - ${formatAnalyticsTimestamp(to)}` : formatAnalyticsTimestamp(from || to)

    return {
      label: analyticsKpiRangeLabel,
      detail: detailLabel,
    }
  }, [analytics.kpis.range, analyticsKpiRangeLabel])

  const analyticsTrendData = useMemo(
    () =>
      analytics.trend.map((point) => ({
        ...point,
        label: point.date ? formatAnalyticsDateLabel(point.date) : point.label,
      })),
    [analytics.trend],
  )

  const analyticsTypeDistribution = useMemo(
    () => [...analytics.typeDistribution].sort((leftItem, rightItem) => rightItem.count - leftItem.count),
    [analytics.typeDistribution],
  )

  const analyticsLocationPerformance = useMemo(
    () => [...analytics.locationPerformance].sort((leftItem, rightItem) => rightItem.properties - leftItem.properties),
    [analytics.locationPerformance],
  )

  const analyticsPriceRanges = useMemo(
    () =>
      [...analytics.priceRanges].sort((leftItem, rightItem) => {
        const leftRank = getAnalyticsBucketSortOrder(leftItem.bucket)
        const rightRank = getAnalyticsBucketSortOrder(rightItem.bucket)

        if (leftRank !== rightRank) {
          return leftRank - rightRank
        }

        return rightItem.properties - leftItem.properties
      }),
    [analytics.priceRanges],
  )

  const analyticsTopProperties = useMemo(
    () => [...analytics.topProperties].sort((leftItem, rightItem) => rightItem.totalViews - leftItem.totalViews),
    [analytics.topProperties],
  )

  const analyticsAgentPerformance = useMemo(
    () => [...analytics.agentPerformance].sort((leftItem, rightItem) => rightItem.properties - leftItem.properties),
    [analytics.agentPerformance],
  )

  const typeDistributionMaxCount = analyticsTypeDistribution[0]?.count ?? 0
  const typeDistributionChartMinWidth = Math.max(analyticsTypeDistribution.length * 108, 640)
  const resolvedSelectedLocationPerformanceId =
    selectedLocationPerformanceId === ALL_LOCATIONS_ID ||
    analyticsLocationPerformance.some((item) => item.id === selectedLocationPerformanceId)
      ? selectedLocationPerformanceId
      : analyticsLocationPerformance[0]?.id ?? ''

  return (
    <div className="space-y-4">
      {analyticsError ? (
        <section className={cn(surfaceCardClass, 'dashboard-enter dashboard-enter-delay-1')}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-300">Property analytics unavailable</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{analyticsError}</p>
            </div>
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              <RefreshCw className={cn('h-4 w-4', isAnalyticsLoading && 'animate-spin')} />
              Retry
            </button>
          </div>
        </section>
      ) : null}

      <section className={cn(surfaceCardClass, 'dashboard-enter dashboard-enter-delay-1')}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Property Analytics</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Tracking portfolio engagement and pricing patterns for {analyticsRangeLabel}.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white p-0 text-sm font-medium transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 sm:w-auto sm:px-3"
          >
            <RefreshCw className={cn('h-4 w-4', isAnalyticsLoading && 'animate-spin')} />
            <span className="sr-only sm:not-sr-only">Refresh</span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {analyticsStatCards.map((card) => {
            const Icon = card.icon

            return (
              <article
                key={card.key}
                className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{card.value}</p>
                  </div>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">{card.note}</p>
              </article>
            )
          })}
        </div>

        {analyticsKpiRangeSummary ? (
          <article className="mt-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">KPI Range</p>
            <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{analyticsKpiRangeSummary.label}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{analyticsKpiRangeSummary.detail}</p>
          </article>
        ) : null}
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
        <section className={cn(surfaceCardClass, 'dashboard-enter dashboard-enter-delay-2')}>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Location Performance</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Compare inventory, attention, and pricing by market</p>
            </div>
          </div>

          {analyticsLocationPerformance.length === 0 ? (
            <AnalyticsSectionEmptyState
              message={isAnalyticsLoading ? 'Loading property analytics...' : 'No location performance data is available yet.'}
            />
          ) : (
            <LocationPerformanceChart
              items={analyticsLocationPerformance}
              selectedLocationId={resolvedSelectedLocationPerformanceId}
              onSelectLocation={setSelectedLocationPerformanceId}
            />
          )}
        </section>

        <section className={cn(surfaceCardClass, 'dashboard-enter dashboard-enter-delay-3')}>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-300">
              <Wallet className="h-5 w-5" />
            </span>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Price Bands</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Inventory concentration by price bucket</p>
            </div>
          </div>

          {analyticsPriceRanges.length === 0 ? (
            <AnalyticsSectionEmptyState
              message={isAnalyticsLoading ? 'Loading property analytics...' : 'No price range data is available yet.'}
            />
          ) : (
            <PriceBandsChart items={analyticsPriceRanges} />
          )}
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
        <section className={cn(surfaceCardClass, 'dashboard-enter dashboard-enter-delay-3')}>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
              <Activity className="h-5 w-5" />
            </span>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Engagement Trend</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Views and inquiries over the selected range</p>
            </div>
          </div>

          {analyticsTrendData.length === 0 ? (
            <AnalyticsSectionEmptyState
              message={isAnalyticsLoading ? 'Loading property analytics...' : 'No trend data is available for this period.'}
            />
          ) : (
            <div className="mt-4 h-72">
              <ResponsiveContainer
                width="100%"
                height="100%"
                minHeight={responsiveChartMinHeight}
                initialDimension={responsiveChartInitialDimension}
              >
                <LineChart data={analyticsTrendData} margin={{ top: 12, right: 12, left: -14, bottom: 6 }}>
                  <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number | string | undefined, name: string | undefined) => [
                      numberFormatter.format(Number(value ?? 0)),
                      formatPropertyLabel(name || 'value'),
                    ]}
                    contentStyle={{
                      borderRadius: '1rem',
                      border: '1px solid rgb(226 232 240)',
                      boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)',
                    }}
                  />
                  <Line type="monotone" dataKey="totalViews" name="Views" stroke="#2563eb" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="properties" name="Properties" stroke="#7c3aed" strokeWidth={3} dot={false} />
                  <Line
                    type="monotone"
                    dataKey="totalInquiries"
                    name="Inquiries"
                    stroke="#0f766e"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className={cn(surfaceCardClass, 'min-w-0 overflow-hidden dashboard-enter dashboard-enter-delay-4')}>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
              <ChartColumnBig className="h-5 w-5" />
            </span>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Type Distribution</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Property mix by listing type count</p>
            </div>
          </div>

          {analyticsTypeDistribution.length === 0 ? (
            <AnalyticsSectionEmptyState
              message={isAnalyticsLoading ? 'Loading property analytics...' : 'No property type distribution is available yet.'}
            />
          ) : (
            <>
              <div className="mt-4 min-w-0 overflow-x-auto pb-2">
                <div className="h-72 min-h-[280px]" style={{ width: `max(100%, ${typeDistributionChartMinWidth}px)` }}>
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minHeight={responsiveChartMinHeight}
                    initialDimension={responsiveChartInitialDimension}
                  >
                    <BarChart
                      data={analyticsTypeDistribution.map((item) => ({
                        name: formatPropertyLabel(item.type),
                        count: item.count,
                        percentage: item.percentage,
                      }))}
                      margin={{ top: 12, right: 10, left: -14, bottom: 28 }}
                    >
                      <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                        height={56}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                      />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip
                        formatter={(value: number | string | undefined, name: string | undefined) => [
                          `${numberFormatter.format(Number(value ?? 0))} properties`,
                          name || 'Count',
                        ]}
                        contentStyle={{
                          borderRadius: '1rem',
                          border: '1px solid rgb(226 232 240)',
                          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)',
                        }}
                      />
                      <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {analyticsTypeDistribution.map((item) => (
                  <div key={item.type} className="space-y-1">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-200">{formatPropertyLabel(item.type)}</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {numberFormatter.format(item.count)} · {formatPercentageValue(item.percentage)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-[width]"
                        style={{ width: `${typeDistributionMaxCount > 0 ? (item.count / typeDistributionMaxCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className={cn(surfaceCardClass, 'dashboard-enter dashboard-enter-delay-4')}>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-300">
              <Eye className="h-5 w-5" />
            </span>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Top Properties</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Highest-performing listings by views and inquiries</p>
            </div>
          </div>

          {analyticsTopProperties.length === 0 ? (
            <AnalyticsSectionEmptyState
              message={isAnalyticsLoading ? 'Loading property analytics...' : 'No top property records are available for this range.'}
            />
          ) : (
            <div className="mt-4 space-y-3">
              {analyticsTopProperties.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                        {item.title || item.publicId || 'Untitled property'}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                        {(item.publicId && `ID ${item.publicId}`) || 'No public ID'}
                        {item.city ? ` · ${formatAnalyticsLocationLabel(item.city)}` : ''}
                      </p>
                    </div>

                    <p className="shrink-0 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrencyValue(item.price)}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="rounded-full bg-white px-2.5 py-1 dark:bg-slate-900">
                      {numberFormatter.format(item.totalViews)} views
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 dark:bg-slate-900">
                      {numberFormatter.format(item.totalInquiries)} inquiries
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 dark:bg-slate-900">
                      {formatPercentageValue(item.conversionRate)} conversion
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className={cn(surfaceCardClass, 'dashboard-enter dashboard-enter-delay-4')}>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-300">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Agent Performance</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Distribution of property activity by agent</p>
            </div>
          </div>

          {analyticsAgentPerformance.length === 0 ? (
            <AnalyticsSectionEmptyState
              message={isAnalyticsLoading ? 'Loading property analytics...' : 'No agent performance records are available for this range.'}
            />
          ) : (
            <div className="mt-4 space-y-3">
              {analyticsAgentPerformance.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{item.name || 'Unknown agent'}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {numberFormatter.format(item.totalViews)} views · {numberFormatter.format(item.totalInquiries)} inquiries
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {numberFormatter.format(item.properties)} properties
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {formatPercentageValue(item.conversionRate)} conversion
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

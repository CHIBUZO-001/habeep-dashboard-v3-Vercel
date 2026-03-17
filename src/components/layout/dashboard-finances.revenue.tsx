import { CreditCard, RefreshCw, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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
  getFinancialRevenueComparison,
  getFinancialRevenueTotal,
  getFinancialRevenueTrend,
  type FinancialRevenueComparison,
  type FinancialRevenueTotal,
  type FinancialRevenueTrend,
} from '../../services'
import { useToast } from '../ui/toast-provider'
import {
  compactNumberFormatter,
  createCurrencyFormatter,
  formatDateRange,
  formatReadableLabel,
  formatTrendDateLabel,
  getMonthSortKey,
  percentFormatter,
  responsiveChartInitialDimension,
  surfaceCardClass,
} from './dashboard-finances.utils'

const revenuePeriod = 'quarterly'

export function DashboardFinancesRevenue() {
  const [revenueTotal, setRevenueTotal] = useState<FinancialRevenueTotal | null>(null)
  const [revenueTrend, setRevenueTrend] = useState<FinancialRevenueTrend | null>(null)
  const [revenueComparison, setRevenueComparison] = useState<FinancialRevenueComparison | null>(null)
  const [isRevenueLoading, setIsRevenueLoading] = useState(true)
  const [revenueErrorMessage, setRevenueErrorMessage] = useState<string | null>(null)
  const [revenueTrendErrorMessage, setRevenueTrendErrorMessage] = useState<string | null>(null)
  const [revenueComparisonErrorMessage, setRevenueComparisonErrorMessage] = useState<string | null>(null)

  const { toast } = useToast()

  const loadRevenue = useCallback(
    async (showErrorToast = false) => {
      setIsRevenueLoading(true)

      try {
        const [totalResult, trendResult, comparisonResult] = await Promise.allSettled([
          getFinancialRevenueTotal(revenuePeriod),
          getFinancialRevenueTrend(),
          getFinancialRevenueComparison(),
        ])

        if (totalResult.status === 'fulfilled') {
          setRevenueTotal(totalResult.value)
          setRevenueErrorMessage(null)
        } else {
          const message = getApiErrorMessage(totalResult.reason, 'Failed to load total revenue.')
          setRevenueErrorMessage(message)
          if (showErrorToast) {
            toast({
              variant: 'error',
              title: 'Total revenue unavailable',
              description: message,
            })
          }
        }

        if (trendResult.status === 'fulfilled') {
          setRevenueTrend(trendResult.value)
          setRevenueTrendErrorMessage(null)
        } else {
          const message = getApiErrorMessage(trendResult.reason, 'Failed to load revenue trend.')
          setRevenueTrendErrorMessage(message)
          if (showErrorToast) {
            toast({
              variant: 'error',
              title: 'Revenue trend unavailable',
              description: message,
            })
          }
        }

        if (comparisonResult.status === 'fulfilled') {
          setRevenueComparison(comparisonResult.value)
          setRevenueComparisonErrorMessage(null)
        } else {
          const message = getApiErrorMessage(comparisonResult.reason, 'Failed to load revenue comparison.')
          setRevenueComparisonErrorMessage(message)
          if (showErrorToast) {
            toast({
              variant: 'error',
              title: 'Revenue comparison unavailable',
              description: message,
            })
          }
        }
      } finally {
        setIsRevenueLoading(false)
      }
    },
    [toast],
  )

  useEffect(() => {
    void loadRevenue()
  }, [loadRevenue])

  const currencyCode = revenueTotal?.currency || revenueTrend?.currency || revenueComparison?.currency || 'NGN'
  const currencyFormatter = useMemo(() => createCurrencyFormatter(currencyCode), [currencyCode])

  const breakdownEntries = useMemo(() => {
    const breakdown = revenueTotal?.breakdown ?? {}
    return Object.entries(breakdown)
      .map(([key, amount]) => ({
        key,
        label: formatReadableLabel(key),
        amount,
      }))
      .sort((leftEntry, rightEntry) => rightEntry.amount - leftEntry.amount)
  }, [revenueTotal])

  const totalRevenue = revenueTotal?.totalRevenue
  const previousRevenue = revenueTotal?.previousRevenue
  const growthRate = revenueTotal?.growthRate
  const hasRevenueData = Boolean(revenueTotal)

  const trendPoints = useMemo(() => revenueTrend?.points ?? [], [revenueTrend])
  const trendChartData = useMemo(
    () =>
      trendPoints
        .filter((point) => point.date)
        .sort((leftPoint, rightPoint) => leftPoint.date.localeCompare(rightPoint.date))
        .map((point) => ({ date: point.date, revenue: point.totalNgnEquivalent })),
    [trendPoints],
  )

  const comparisonPoints = useMemo(() => revenueComparison?.points ?? [], [revenueComparison])
  const comparisonChartData = useMemo(
    () =>
      comparisonPoints
        .filter((point) => point.month)
        .slice()
        .sort((leftPoint, rightPoint) => {
          const leftKey = getMonthSortKey(leftPoint.month)
          const rightKey = getMonthSortKey(rightPoint.month)
          if (leftKey !== rightKey) {
            return leftKey - rightKey
          }
          return leftPoint.month.localeCompare(rightPoint.month)
        })
        .map((point) => ({
          month: point.month,
          current: point.currentYear,
          previous: point.previousYear,
        })),
    [comparisonPoints],
  )

  const comparisonYear = revenueComparison?.year
  const compareYear = revenueComparison?.compareYear
  const comparisonTotals = revenueComparison?.totals

  return (
    <div className="space-y-6">
      <section className="dashboard-enter flex items-start justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white/80 p-5 shadow-sm shadow-slate-900/5 ring-1 ring-white/70 dark:border-slate-800/80 dark:bg-slate-900/70 dark:ring-slate-800/80 sm:items-center">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Revenue</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Period: <span className="font-medium">{formatReadableLabel(revenueTotal?.period ?? revenuePeriod)}</span> · Range:{' '}
            <span className="font-medium">{formatDateRange(revenueTotal?.from ?? null, revenueTotal?.to ?? null)}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadRevenue(true)}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-0 text-sm font-medium text-slate-700 shadow-sm shadow-slate-900/5 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900 sm:w-auto sm:px-3"
        >
          <RefreshCw className={cn('h-4 w-4', isRevenueLoading && 'animate-spin')} />
          <span className="sr-only sm:not-sr-only">Refresh</span>
        </button>
      </section>

      {revenueErrorMessage ? (
        <section className={cn(surfaceCardClass, 'dashboard-enter dashboard-enter-delay-1')}>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Revenue overview unavailable</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{revenueErrorMessage}</p>
          <button
            type="button"
            onClick={() => void loadRevenue(true)}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Try again
          </button>
        </section>
      ) : null}

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          {
            label: 'Total revenue',
            value: hasRevenueData && typeof totalRevenue === 'number' ? currencyFormatter.format(totalRevenue) : '—',
            hint: hasRevenueData
              ? formatDateRange(revenueTotal?.from ?? null, revenueTotal?.to ?? null)
              : 'Waiting for revenue data.',
            icon: Wallet,
          },
          {
            label: 'Growth rate',
            value: hasRevenueData && typeof growthRate === 'number' ? percentFormatter.format(growthRate / 100) : '—',
            hint:
              hasRevenueData && typeof totalRevenue === 'number' && typeof previousRevenue === 'number'
                ? `Δ ${currencyFormatter.format(totalRevenue - previousRevenue)} vs previous period`
                : 'Compare revenue vs the previous period.',
            icon: hasRevenueData && typeof growthRate === 'number' && growthRate < 0 ? TrendingDown : TrendingUp,
          },
          {
            label: 'Previous revenue',
            value: hasRevenueData && typeof previousRevenue === 'number' ? currencyFormatter.format(previousRevenue) : '—',
            hint: hasRevenueData
              ? formatDateRange(revenueTotal?.previousFrom ?? null, revenueTotal?.previousTo ?? null)
              : 'Waiting for revenue data.',
            icon: CreditCard,
          },
          {
            label: 'Discounts applied',
            value: hasRevenueData ? (revenueTotal?.discountsApplied ? 'Yes' : 'No') : '—',
            hint: hasRevenueData ? `Currency: ${currencyCode}` : 'Waiting for revenue data.',
            icon: Wallet,
          },
        ].map((stat, index) => {
          const Icon = stat.icon
          return (
            <article
              key={stat.label}
              className={cn(
                surfaceCardClass,
                'dashboard-enter min-w-0',
                index === 0
                  ? 'dashboard-enter-delay-1'
                  : index === 1
                    ? 'dashboard-enter-delay-2'
                    : index === 2
                      ? 'dashboard-enter-delay-3'
                      : 'dashboard-enter-delay-4',
              )}
            >
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <p className="min-w-0 text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:h-10 sm:w-10">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 break-words text-xl font-semibold leading-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
                {stat.value}
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{stat.hint}</p>
            </article>
          )
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <article className={cn(surfaceCardClass, 'dashboard-enter dashboard-enter-delay-2 min-w-0')}>
          <header className="mb-4">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Revenue trend</h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Period: {formatReadableLabel(revenueTrend?.period ?? 'last_12_months')} · Interval:{' '}
              {formatReadableLabel(revenueTrend?.interval ?? 'month')} · Range:{' '}
              {formatDateRange(revenueTrend?.from ?? null, revenueTrend?.to ?? null)} · Points:{' '}
              {compactNumberFormatter.format(trendPoints.length)}
            </p>
          </header>

          {revenueTrendErrorMessage ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
              <p className="font-semibold text-slate-900 dark:text-slate-100">Revenue trend unavailable</p>
              <p className="mt-2">{revenueTrendErrorMessage}</p>
              <button
                type="button"
                onClick={() => void loadRevenue(true)}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="h-[320px] w-full min-w-0">
              {trendChartData.length ? (
                <ResponsiveContainer width="100%" height="100%" initialDimension={responsiveChartInitialDimension}>
                  <LineChart data={trendChartData} margin={{ top: 10, right: 14, left: -8, bottom: 6 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => formatTrendDateLabel(String(value))}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                    />
                    <YAxis
                      tickFormatter={(value) => compactNumberFormatter.format(Number(value ?? 0))}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ stroke: '#94a3b8', strokeOpacity: 0.3 }}
                      contentStyle={{
                        borderRadius: '0.75rem',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                      }}
                      formatter={(value) => [currencyFormatter.format(Number(value ?? 0)), 'Revenue']}
                      labelFormatter={(value) => formatTrendDateLabel(String(value))}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2.4} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  {isRevenueLoading ? 'Loading revenue trend…' : 'No revenue trend data available yet.'}
                </div>
              )}
            </div>
          )}
        </article>

        <article className={cn(surfaceCardClass, 'dashboard-enter dashboard-enter-delay-3')}>
          <header className="mb-4">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Revenue breakdown</h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {hasRevenueData && typeof totalRevenue === 'number'
                ? `Total: ${currencyFormatter.format(totalRevenue)}`
                : 'Breakdown will appear once revenue loads.'}
            </p>
          </header>

          {breakdownEntries.length ? (
            <div className="space-y-3">
              {breakdownEntries.map((entry) => {
                const share =
                  hasRevenueData && typeof totalRevenue === 'number' && totalRevenue > 0 ? entry.amount / totalRevenue : 0
                return (
                  <div
                    key={entry.key}
                    className="rounded-xl border border-slate-200/90 bg-white/70 p-3 dark:border-slate-800/80 dark:bg-slate-950/20"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold text-slate-900 dark:text-slate-100">{entry.label}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{percentFormatter.format(share)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {currencyFormatter.format(entry.amount)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                        style={{ width: `${Math.min(100, Math.max(0, share * 100))}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              {isRevenueLoading ? 'Loading breakdown…' : 'No breakdown data available yet.'}
            </div>
          )}
        </article>

        <article className={cn(surfaceCardClass, 'dashboard-enter dashboard-enter-delay-4 min-w-0 xl:col-span-2')}>
          <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Revenue comparison</h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {comparisonYear && compareYear ? `${comparisonYear} vs ${compareYear}` : 'Year-over-year comparison'} · Growth:{' '}
                {comparisonTotals ? percentFormatter.format(comparisonTotals.growthRate / 100) : 'N/A'}
              </p>
            </div>

            {comparisonTotals ? (
              <div className="flex flex-wrap justify-start gap-2 text-xs text-slate-600 dark:text-slate-300 sm:justify-end">
                <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-medium shadow-sm shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-950">
                  Current: {currencyFormatter.format(comparisonTotals.currentYear)}
                </span>
                <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-medium shadow-sm shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-950">
                  Previous: {currencyFormatter.format(comparisonTotals.previousYear)}
                </span>
              </div>
            ) : null}
          </header>

          {revenueComparisonErrorMessage ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
              <p className="font-semibold text-slate-900 dark:text-slate-100">Revenue comparison unavailable</p>
              <p className="mt-2">{revenueComparisonErrorMessage}</p>
              <button
                type="button"
                onClick={() => void loadRevenue(true)}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="h-[320px] w-full min-w-0">
              {comparisonChartData.length ? (
                <ResponsiveContainer width="100%" height="100%" initialDimension={responsiveChartInitialDimension}>
                  <BarChart data={comparisonChartData} margin={{ top: 10, right: 14, left: -8, bottom: 6 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis
                      tickFormatter={(value) => compactNumberFormatter.format(Number(value ?? 0))}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(148,163,184,0.12)' }}
                      contentStyle={{
                        borderRadius: '0.75rem',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                      }}
                      formatter={(value, name) => {
                        const label = String(name)
                        return [currencyFormatter.format(Number(value ?? 0)), label]
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar
                      dataKey="current"
                      name={comparisonYear ? String(comparisonYear) : 'Current year'}
                      fill="#16a34a"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="previous"
                      name={compareYear ? String(compareYear) : 'Previous year'}
                      fill="#2563eb"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  {isRevenueLoading ? 'Loading revenue comparison…' : 'No comparison data available yet.'}
                </div>
              )}
            </div>
          )}
        </article>

        <article className={cn(surfaceCardClass, 'dashboard-enter dashboard-enter-delay-4 xl:col-span-2')}>
          <header className="mb-4">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Period details</h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {hasRevenueData ? 'Revenue comparison across periods.' : 'Waiting for revenue data.'}
            </p>
          </header>

          <dl className="space-y-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">Current range</dt>
              <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                {formatDateRange(revenueTotal?.from ?? null, revenueTotal?.to ?? null)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">Previous range</dt>
              <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                {formatDateRange(revenueTotal?.previousFrom ?? null, revenueTotal?.previousTo ?? null)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">Currency</dt>
              <dd className="text-right font-medium text-slate-900 dark:text-slate-100">{currencyCode}</dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">Breakdown keys</dt>
              <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                {compactNumberFormatter.format(breakdownEntries.length)}
              </dd>
            </div>
          </dl>
        </article>
      </section>
    </div>
  )
}

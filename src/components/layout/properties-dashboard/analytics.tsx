import { Building2, ChevronDown, Eye, MapPin, MessageSquare, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { cn } from '../../../lib/cn'
import type { PropertyAnalyticsDashboard } from '../../../services'
import {
  ALL_LOCATIONS_ID,
  formatAnalyticsBucketLabel,
  formatAnalyticsLocationLabel,
  formatCompactCurrencyValue,
  formatCompactValue,
  formatCurrencyValue,
  formatPercentageValue,
  numberFormatter,
  responsiveChartInitialDimension,
  responsiveChartMinHeight,
} from './shared'

type LocationPerformanceRadarDatum = {
  metric: string
  selectedScore: number
  averageScore: number
  selectedValue: string
  averageValue: string
}

type LocationPerformanceRadarTooltipEntry = {
  payload?: LocationPerformanceRadarDatum
}

type PriceBandsChartDatum = {
  bucket: string
  label: string
  properties: number
  averagePrice: number
  totalViews: number
  totalInquiries: number
  conversionRate: number
}

type PriceBandsTooltipEntry = {
  payload?: PriceBandsChartDatum
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false))

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQueryList = window.matchMedia(query)

    const updateMatchState = () => {
      setMatches(mediaQueryList.matches)
    }

    updateMatchState()
    mediaQueryList.addEventListener('change', updateMatchState)

    return () => {
      mediaQueryList.removeEventListener('change', updateMatchState)
    }
  }, [query])

  return matches
}

function getLocationMetricRank(
  items: PropertyAnalyticsDashboard['locationPerformance'],
  selectedItemId: string,
  selector: (item: PropertyAnalyticsDashboard['locationPerformance'][number]) => number,
) {
  const selectedItem = items.find((item) => item.id === selectedItemId)
  if (!selectedItem) {
    return null
  }

  const rankedValues = Array.from(new Set(items.map(selector))).sort((leftValue, rightValue) => rightValue - leftValue)
  return rankedValues.indexOf(selector(selectedItem)) + 1
}

function LocationPerformanceChartTooltip({
  selectedLabel,
  active,
  payload,
}: {
  selectedLabel: string
  active?: boolean
  payload?: LocationPerformanceRadarTooltipEntry[]
}) {
  const record = payload?.[0]?.payload

  if (!active || !record) {
    return null
  }

  return (
    <div className="min-w-[14rem] rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/95">
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{record.metric}</p>
      <div className="mt-3 space-y-2 text-xs">
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            {selectedLabel}
          </span>
          <span className="font-medium text-slate-900 dark:text-slate-100">{record.selectedValue}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            Portfolio avg
          </span>
          <span className="font-medium text-slate-900 dark:text-slate-100">{record.averageValue}</span>
        </div>
      </div>
    </div>
  )
}

export function AnalyticsSectionEmptyState({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-400">
      {message}
    </div>
  )
}

export function LocationPerformanceChart({
  items,
  selectedLocationId,
  onSelectLocation,
}: {
  items: PropertyAnalyticsDashboard['locationPerformance']
  selectedLocationId: string
  onSelectLocation: (nextValue: string) => void
}) {
  const isMobileViewport = useMediaQuery('(max-width: 639px)')

  const allLocationsAggregate = useMemo<PropertyAnalyticsDashboard['locationPerformance'][number] | null>(() => {
    if (items.length === 0) {
      return null
    }

    const totals = items.reduce(
      (result, item) => {
        const priceWeight = item.properties > 0 ? item.properties : item.averagePrice > 0 ? 1 : 0

        return {
          properties: result.properties + item.properties,
          totalViews: result.totalViews + item.totalViews,
          totalInquiries: result.totalInquiries + item.totalInquiries,
          averagePriceWeightedTotal: result.averagePriceWeightedTotal + item.averagePrice * priceWeight,
          averagePriceWeight: result.averagePriceWeight + priceWeight,
        }
      },
      {
        properties: 0,
        totalViews: 0,
        totalInquiries: 0,
        averagePriceWeightedTotal: 0,
        averagePriceWeight: 0,
      },
    )

    return {
      id: ALL_LOCATIONS_ID,
      city: 'All Citites',
      properties: totals.properties,
      totalViews: totals.totalViews,
      totalInquiries: totals.totalInquiries,
      averagePrice:
        totals.averagePriceWeight > 0 ? Math.round(totals.averagePriceWeightedTotal / totals.averagePriceWeight) : 0,
    }
  }, [items])

  const selectedLocation = useMemo(() => {
    if (selectedLocationId === ALL_LOCATIONS_ID) {
      return allLocationsAggregate
    }

    return items.find((item) => item.id === selectedLocationId) ?? items[0] ?? allLocationsAggregate ?? null
  }, [allLocationsAggregate, items, selectedLocationId])
  const isAllLocationsSelected = selectedLocation?.id === ALL_LOCATIONS_ID

  const portfolioTotals = useMemo(
    () =>
      items.reduce(
        (result, item) => ({
          properties: result.properties + item.properties,
          totalViews: result.totalViews + item.totalViews,
          totalInquiries: result.totalInquiries + item.totalInquiries,
          averagePrice: result.averagePrice + item.averagePrice,
        }),
        {
          properties: 0,
          totalViews: 0,
          totalInquiries: 0,
          averagePrice: 0,
        },
      ),
    [items],
  )

  const portfolioAverages = useMemo(() => {
    const divisor = items.length || 1

    return {
      properties: portfolioTotals.properties / divisor,
      totalViews: portfolioTotals.totalViews / divisor,
      totalInquiries: portfolioTotals.totalInquiries / divisor,
      averagePrice: portfolioTotals.averagePrice / divisor,
    }
  }, [items.length, portfolioTotals])

  const metricMaximums = useMemo(() => {
    const metricItems = allLocationsAggregate ? [...items, allLocationsAggregate] : items

    return metricItems.reduce(
      (result, item) => ({
        properties: Math.max(result.properties, item.properties),
        totalViews: Math.max(result.totalViews, item.totalViews),
        totalInquiries: Math.max(result.totalInquiries, item.totalInquiries),
        averagePrice: Math.max(result.averagePrice, item.averagePrice),
      }),
      {
        properties: 0,
        totalViews: 0,
        totalInquiries: 0,
        averagePrice: 0,
      },
    )
  }, [allLocationsAggregate, items])

  const radarData = useMemo<LocationPerformanceRadarDatum[]>(() => {
    if (!selectedLocation) {
      return []
    }

    const normalizeValue = (value: number, maxValue: number) => (maxValue > 0 ? Number(((value / maxValue) * 100).toFixed(1)) : 0)

    return [
      {
        metric: 'Properties',
        selectedScore: normalizeValue(selectedLocation.properties, metricMaximums.properties),
        averageScore: normalizeValue(portfolioAverages.properties, metricMaximums.properties),
        selectedValue: `${numberFormatter.format(selectedLocation.properties)} properties`,
        averageValue: `${numberFormatter.format(Math.round(portfolioAverages.properties))} properties`,
      },
      {
        metric: 'Views',
        selectedScore: normalizeValue(selectedLocation.totalViews, metricMaximums.totalViews),
        averageScore: normalizeValue(portfolioAverages.totalViews, metricMaximums.totalViews),
        selectedValue: `${numberFormatter.format(selectedLocation.totalViews)} views`,
        averageValue: `${numberFormatter.format(Math.round(portfolioAverages.totalViews))} views`,
      },
      {
        metric: 'Inquiries',
        selectedScore: normalizeValue(selectedLocation.totalInquiries, metricMaximums.totalInquiries),
        averageScore: normalizeValue(portfolioAverages.totalInquiries, metricMaximums.totalInquiries),
        selectedValue: `${numberFormatter.format(selectedLocation.totalInquiries)} inquiries`,
        averageValue: `${numberFormatter.format(Math.round(portfolioAverages.totalInquiries))} inquiries`,
      },
      {
        metric: 'Avg Price',
        selectedScore: normalizeValue(selectedLocation.averagePrice, metricMaximums.averagePrice),
        averageScore: normalizeValue(portfolioAverages.averagePrice, metricMaximums.averagePrice),
        selectedValue: formatCurrencyValue(selectedLocation.averagePrice),
        averageValue: formatCurrencyValue(Math.round(portfolioAverages.averagePrice)),
      },
    ]
  }, [metricMaximums, portfolioAverages, selectedLocation])

  const metricCards = useMemo(() => {
    if (!selectedLocation) {
      return []
    }

    const propertyShare = portfolioTotals.properties > 0 ? (selectedLocation.properties / portfolioTotals.properties) * 100 : 0
    const viewShare = portfolioTotals.totalViews > 0 ? (selectedLocation.totalViews / portfolioTotals.totalViews) * 100 : 0
    const inquiryShare = portfolioTotals.totalInquiries > 0 ? (selectedLocation.totalInquiries / portfolioTotals.totalInquiries) * 100 : 0
    const selectionSpanLabel = `${numberFormatter.format(items.length)} location${items.length === 1 ? '' : 's'} combined`

    return [
      {
        key: 'properties',
        label: 'Properties',
        value: `${numberFormatter.format(selectedLocation.properties)} properties`,
        note: isAllLocationsSelected
          ? `${selectionSpanLabel} · ${formatPercentageValue(propertyShare)} of tracked inventory`
          : `Rank #${getLocationMetricRank(items, selectedLocation.id, (item) => item.properties) || 0} · ${formatPercentageValue(propertyShare)} of tracked inventory`,
        icon: Building2,
        iconClassName: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300',
      },
      {
        key: 'views',
        label: 'Views',
        value: `${numberFormatter.format(selectedLocation.totalViews)} views`,
        note:
          isAllLocationsSelected && selectedLocation.totalViews > 0
            ? `Combined view activity across ${numberFormatter.format(items.length)} tracked locations`
            : selectedLocation.totalViews > 0
              ? `Rank #${getLocationMetricRank(items, selectedLocation.id, (item) => item.totalViews) || 0} · ${formatPercentageValue(viewShare)} of total views`
              : isAllLocationsSelected
                ? 'No tracked views across all cities yet'
                : 'No tracked views for this city yet',
        icon: Eye,
        iconClassName: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300',
      },
      {
        key: 'inquiries',
        label: 'Inquiries',
        value: `${numberFormatter.format(selectedLocation.totalInquiries)} inquiries`,
        note:
          isAllLocationsSelected && selectedLocation.totalInquiries > 0
            ? `Combined inquiry activity across ${numberFormatter.format(items.length)} tracked locations`
            : selectedLocation.totalInquiries > 0
              ? `Rank #${getLocationMetricRank(items, selectedLocation.id, (item) => item.totalInquiries) || 0} · ${formatPercentageValue(inquiryShare)} of inquiries`
              : isAllLocationsSelected
                ? 'No tracked inquiries across all cities yet'
                : 'No tracked inquiries for this city yet',
        icon: MessageSquare,
        iconClassName: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300',
      },
      {
        key: 'avg-price',
        label: 'Avg Price',
        value: formatCurrencyValue(selectedLocation.averagePrice),
        note: isAllLocationsSelected
          ? `Weighted portfolio average across ${selectionSpanLabel}`
          : `Rank #${getLocationMetricRank(items, selectedLocation.id, (item) => item.averagePrice) || 0} of ${numberFormatter.format(items.length)} by average price`,
        icon: Wallet,
        iconClassName: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300',
      },
    ]
  }, [isAllLocationsSelected, items, portfolioTotals, selectedLocation])

  if (!selectedLocation) {
    return null
  }

  return (
    <div className="mt-4 min-w-0 max-w-full space-y-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">City Focus</p>
        <h5 className="mt-2 truncate text-lg font-semibold text-slate-900 dark:text-slate-100">
          {formatAnalyticsLocationLabel(selectedLocation.city)}
        </h5>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {isAllLocationsSelected
            ? 'Compare the combined portfolio view against the average per-city baseline.'
            : 'Compare the selected city against the portfolio average.'}
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section className="rounded-[1.75rem] border border-slate-200/80 bg-gradient-to-b from-slate-50 to-white p-4 shadow-sm shadow-slate-900/5 dark:border-slate-800 dark:from-slate-950/50 dark:to-slate-900/30">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              {isAllLocationsSelected ? 'All Citites' : 'Selected city'}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              Portfolio average
            </span>
          </div>

          <div className="mt-4 h-[18rem] sm:h-80">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minHeight={responsiveChartMinHeight}
              initialDimension={responsiveChartInitialDimension}
            >
              <RadarChart data={radarData} outerRadius={isMobileViewport ? '62%' : '70%'}>
                <PolarGrid stroke="#cbd5e1" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: isMobileViewport ? 11 : 12 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Tooltip content={<LocationPerformanceChartTooltip selectedLabel={isAllLocationsSelected ? 'All Citites' : 'Selected city'} />} />
                <Radar
                  name={isAllLocationsSelected ? 'All Citites' : 'Selected city'}
                  dataKey="selectedScore"
                  stroke="#2563eb"
                  fill="#2563eb"
                  fillOpacity={0.24}
                  strokeWidth={2.5}
                />
                <Radar
                  name="Portfolio average"
                  dataKey="averageScore"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.12}
                  strokeWidth={2.2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          {metricCards.map((metric) => {
            const Icon = metric.icon

            return (
              <article
                key={metric.key}
                className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{metric.label}</p>
                    <p className="mt-2 break-words text-lg font-semibold text-slate-900 dark:text-slate-100">{metric.value}</p>
                  </div>
                  <span className={cn('inline-flex h-11 w-11 items-center justify-center rounded-2xl', metric.iconClassName)}>
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">{metric.note}</p>
              </article>
            )
          })}
        </div>
      </div>

      <section className="rounded-[1.75rem] border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/30">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Selected Scope</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {isAllLocationsSelected
                ? `Showing the combined view across ${numberFormatter.format(items.length)} location entr${items.length === 1 ? 'y' : 'ies'} in the analytics response.`
                : `Showing the selected row from ${numberFormatter.format(items.length)} location entr${items.length === 1 ? 'y' : 'ies'} in the analytics response.`}
            </p>
          </div>

          <label className="w-full max-w-full lg:w-[18rem]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Select city
            </span>
            <span className="relative mt-2 flex w-full items-center rounded-xl border border-slate-200 bg-white text-xs text-slate-600 transition-colors focus-within:border-blue-400 focus-within:bg-blue-50/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus-within:border-blue-500 dark:focus-within:bg-blue-950/20">
              <MapPin className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
              <select
                value={selectedLocation.id}
                onChange={(event) => onSelectLocation(event.target.value)}
                className="h-11 w-full appearance-none bg-transparent py-2 pl-9 pr-10 text-sm font-medium text-slate-900 outline-none dark:text-slate-100"
              >
                <option value={ALL_LOCATIONS_ID}>All Citites</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {formatAnalyticsLocationLabel(item.city)}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
            </span>
          </label>
        </div>

        <article className="mt-4 rounded-2xl border border-blue-300 bg-white/90 p-4 shadow-sm shadow-slate-900/5 ring-1 ring-blue-200 dark:border-blue-700 dark:bg-slate-900/80 dark:ring-blue-900/60">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {formatAnalyticsLocationLabel(selectedLocation.city)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {numberFormatter.format(selectedLocation.properties)} properties
              </p>
            </div>
            <span className="inline-flex shrink-0 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white">
              {isAllLocationsSelected ? 'Aggregate' : 'Focused'}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
              {numberFormatter.format(selectedLocation.totalViews)} views
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
              {numberFormatter.format(selectedLocation.totalInquiries)} inquiries
            </span>
          </div>

          <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {formatCurrencyValue(selectedLocation.averagePrice)}
          </p>
        </article>
      </section>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        The selector controls both the comparison chart and the scope detail card, including the combined `All Citites` view.
      </p>
    </div>
  )
}

function PriceBandsChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: PriceBandsTooltipEntry[]
}) {
  const record = payload?.[0]?.payload

  if (!active || !record) {
    return null
  }

  return (
    <div className="min-w-[15rem] rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/95">
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{record.label}</p>
      <div className="mt-3 space-y-2 text-xs">
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
            Properties
          </span>
          <span className="font-medium text-slate-900 dark:text-slate-100">{numberFormatter.format(record.properties)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            Avg Price
          </span>
          <span className="font-medium text-slate-900 dark:text-slate-100">{formatCurrencyValue(record.averagePrice)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500 dark:text-slate-400">Views</span>
          <span className="font-medium text-slate-900 dark:text-slate-100">{numberFormatter.format(record.totalViews)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500 dark:text-slate-400">Inquiries</span>
          <span className="font-medium text-slate-900 dark:text-slate-100">{numberFormatter.format(record.totalInquiries)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500 dark:text-slate-400">Conversion</span>
          <span className="font-medium text-slate-900 dark:text-slate-100">{formatPercentageValue(record.conversionRate)}</span>
        </div>
      </div>
    </div>
  )
}

export function PriceBandsChart({ items }: { items: PropertyAnalyticsDashboard['priceRanges'] }) {
  const isMobileViewport = useMediaQuery('(max-width: 639px)')
  const chartData = useMemo<PriceBandsChartDatum[]>(
    () =>
      items.map((item) => ({
        bucket: item.bucket,
        label: formatAnalyticsBucketLabel(item.bucket),
        properties: item.properties,
        averagePrice: item.averagePrice,
        totalViews: item.totalViews,
        totalInquiries: item.totalInquiries,
        conversionRate: item.conversionRate,
      })),
    [items],
  )

  const topInventoryBucket = useMemo(
    () =>
      chartData.reduce<PriceBandsChartDatum | null>(
        (topItem, currentItem) => (!topItem || currentItem.properties > topItem.properties ? currentItem : topItem),
        null,
      ),
    [chartData],
  )

  const bestConversionBucket = useMemo(
    () =>
      chartData.reduce<PriceBandsChartDatum | null>(
        (topItem, currentItem) => (!topItem || currentItem.conversionRate > topItem.conversionRate ? currentItem : topItem),
        null,
      ),
    [chartData],
  )

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
          <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
          Properties
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          Avg Price
        </span>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200/80 bg-gradient-to-b from-slate-50 to-white p-3 shadow-sm shadow-slate-900/5 dark:border-slate-800 dark:from-slate-950/50 dark:to-slate-900/30">
        <div className="h-[18rem] sm:h-80">
          <ResponsiveContainer
            width="100%"
            height="100%"
            minHeight={responsiveChartMinHeight}
            initialDimension={responsiveChartInitialDimension}
          >
            <ComposedChart
              data={chartData}
              margin={{ top: 14, right: isMobileViewport ? 0 : 12, left: isMobileViewport ? -20 : -12, bottom: 8 }}
            >
              <defs>
                <linearGradient id="price-band-properties-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#c084fc" stopOpacity={0.65} />
                </linearGradient>
              </defs>

              <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                interval={0}
                tick={{ fill: '#64748b', fontSize: isMobileViewport ? 11 : 12 }}
              />
              <YAxis
                yAxisId="inventory"
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={isMobileViewport ? 34 : 48}
                tickFormatter={(value: number) => formatCompactValue(Number(value ?? 0))}
                tick={{ fill: '#64748b', fontSize: isMobileViewport ? 11 : 12 }}
              />
              <YAxis
                yAxisId="price"
                orientation="right"
                hide={isMobileViewport}
                tickLine={false}
                axisLine={false}
                width={72}
                tickFormatter={(value: number) => formatCompactCurrencyValue(Number(value ?? 0))}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <Tooltip content={<PriceBandsChartTooltip />} />
              <Bar
                yAxisId="inventory"
                dataKey="properties"
                name="Properties"
                fill="url(#price-band-properties-fill)"
                radius={[10, 10, 0, 0]}
                maxBarSize={isMobileViewport ? 34 : 42}
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="averagePrice"
                name="Avg Price"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: isMobileViewport ? 3 : 4, stroke: '#f59e0b', strokeWidth: 2, fill: '#ffffff' }}
                activeDot={{ r: isMobileViewport ? 4 : 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {chartData.map((item) => (
          <article
            key={item.bucket}
            className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.label}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Avg price {formatCurrencyValue(item.averagePrice)}</p>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {numberFormatter.format(item.properties)} properties
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="rounded-full bg-white px-2.5 py-1 dark:bg-slate-900">{numberFormatter.format(item.totalViews)} views</span>
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

      <div className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Highest Inventory</p>
          <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">
            {topInventoryBucket
              ? `${topInventoryBucket.label} · ${numberFormatter.format(topInventoryBucket.properties)} properties`
              : 'No inventory data'}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Best Conversion</p>
          <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">
            {bestConversionBucket
              ? `${bestConversionBucket.label} · ${formatPercentageValue(bestConversionBucket.conversionRate)}`
              : 'No conversion data'}
          </p>
        </article>
      </div>
    </div>
  )
}

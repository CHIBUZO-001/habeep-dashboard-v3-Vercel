import type { PropertyAnalyticsDashboard, PropertyListItem } from '../../../services'

export const numberFormatter = new Intl.NumberFormat('en-NG')
export const compactNumberFormatter = new Intl.NumberFormat('en-NG', {
  notation: 'compact',
  maximumFractionDigits: 1,
})
export const percentageFormatter = new Intl.NumberFormat('en-NG', {
  maximumFractionDigits: 1,
})

export const surfaceCardClass =
  'rounded-2xl border border-slate-200/85 bg-white/90 p-4 shadow-sm shadow-slate-900/5 ring-1 ring-white/70 transition-colors dark:border-slate-800/80 dark:bg-slate-900/90 dark:ring-slate-800/80'
export const responsiveChartMinHeight = 280
export const ALL_LOCATIONS_ID = '__all_locations__'

export const emptyPropertyAnalyticsDashboard: PropertyAnalyticsDashboard = {
  kpis: {
    totalViews: 0,
    totalInquiries: 0,
    averagePrice: 0,
    conversionRate: 0,
    range: {
      from: '',
      to: '',
    },
  },
  trend: [],
  typeDistribution: [],
  locationPerformance: [],
  priceRanges: [],
  topProperties: [],
  agentPerformance: [],
  range: {
    from: '',
    to: '',
  },
  responseMeta: {
    statusCode: 0,
    message: '',
    code: '',
    path: '',
    success: false,
    version: '',
    timestamp: '',
    requestId: '',
  },
}

export type PaginationItem = number | 'start-ellipsis' | 'end-ellipsis'

export type PropertyMediaAsset = {
  id: string
  index: number
  kind: 'image' | 'video'
  src: string
  previewSrc: string
}

export function formatPropertyLabel(value: string) {
  const segments = value
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)

  if (segments.length === 0) {
    return 'Unknown'
  }

  return segments
    .map((segment) => {
      const normalizedSegment = segment.toLowerCase()
      return normalizedSegment.charAt(0).toUpperCase() + normalizedSegment.slice(1)
    })
    .join(' ')
}

export function formatCurrencyValue(value: number, currencyCode = 'NGN') {
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currencyCode || 'NGN',
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `₦${numberFormatter.format(value)}`
  }
}

export function formatPercentageValue(value: number) {
  return `${percentageFormatter.format(value)}%`
}

export function formatAnalyticsDateLabel(inputDate: string) {
  if (!inputDate) {
    return 'Unknown'
  }

  const parsedDate = new Date(inputDate)
  if (Number.isNaN(parsedDate.getTime())) {
    return inputDate
  }

  return parsedDate.toLocaleDateString('en-NG', {
    month: 'short',
    day: 'numeric',
  })
}

export function formatAnalyticsDateRange(range: PropertyAnalyticsDashboard['range']) {
  if (!range.from && !range.to) {
    return 'Date range unavailable'
  }

  if (range.from && range.to) {
    const fromLabel = formatAnalyticsDateLabel(range.from)
    const toLabel = formatAnalyticsDateLabel(range.to)
    return fromLabel === toLabel ? fromLabel : `${fromLabel} - ${toLabel}`
  }

  return formatAnalyticsDateLabel(range.from || range.to)
}

export function formatAnalyticsTimestamp(value: string) {
  if (!value) {
    return 'Timestamp unavailable'
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return parsedDate.toLocaleString('en-NG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatAnalyticsLocationLabel(city: string) {
  return city.trim() || 'Unspecified location'
}

export function formatAnalyticsBucketLabel(bucket: string) {
  const normalizedBucket = bucket.trim().toUpperCase()

  if (normalizedBucket === 'UNDER_1M') {
    return 'Under N1M'
  }

  if (normalizedBucket === '1M_5M') {
    return 'N1M - N5M'
  }

  if (normalizedBucket === '5M_10M') {
    return 'N5M - N10M'
  }

  if (normalizedBucket === 'OVER_10M') {
    return 'Over N10M'
  }

  return formatPropertyLabel(bucket)
}

export function getAnalyticsBucketSortOrder(bucket: string) {
  const normalizedBucket = bucket.trim().toUpperCase()

  if (normalizedBucket === 'UNDER_1M') {
    return 0
  }

  if (normalizedBucket === '1M_5M') {
    return 1
  }

  if (normalizedBucket === '5M_10M') {
    return 2
  }

  if (normalizedBucket === 'OVER_10M') {
    return 3
  }

  return Number.MAX_SAFE_INTEGER
}

export function formatCompactValue(value: number) {
  return compactNumberFormatter.format(value)
}

export function formatCompactCurrencyValue(value: number) {
  return `₦${compactNumberFormatter.format(value)}`
}

export function formatPropertyLocation(property: PropertyListItem) {
  const address = property.location.address.trim()
  const city = property.location.city.trim()

  if (address && city) {
    return `${address}, ${city}`
  }

  return city || address || 'Location not provided'
}

export function getAvailableFilterValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim() || '').filter(Boolean))).sort((leftValue, rightValue) =>
    leftValue.localeCompare(rightValue, undefined, { sensitivity: 'base' }),
  )
}

export function getPropertyStatusFilterValue(status: string, sold = false) {
  const trimmedStatus = status.trim()
  const normalizedStatus = trimmedStatus.toLowerCase()

  if (!trimmedStatus) {
    return sold ? 'SOLD' : 'UNKNOWN'
  }

  if (normalizedStatus === 'sold') {
    return 'SOLD'
  }

  if (normalizedStatus === 'closed') {
    return 'CLOSED'
  }

  if (normalizedStatus === 'available') {
    return 'AVAILABLE'
  }

  return trimmedStatus.toUpperCase()
}

export function getPropertyStatusRequestValue(status: string) {
  const trimmedStatus = status.trim()
  const normalizedStatus = trimmedStatus.toLowerCase()

  if (!trimmedStatus) {
    return ''
  }

  if (normalizedStatus === 'sold') {
    return 'SOLD'
  }

  if (normalizedStatus === 'closed') {
    return 'CLOSED'
  }

  if (normalizedStatus === 'available') {
    return 'AVAILABLE'
  }

  return trimmedStatus.toUpperCase()
}

export function getListingTypeFilterValue(listingType: string) {
  const normalizedListingType = listingType.trim().toLowerCase()

  if (!normalizedListingType) {
    return null
  }

  if (['sale', 'sell', 'for sale'].includes(normalizedListingType)) {
    return 'sale'
  }

  if (['rent', 'rental', 'for rent'].includes(normalizedListingType)) {
    return 'rent'
  }

  if (['shortlet', 'short let', 'short-let'].includes(normalizedListingType)) {
    return 'shortlet'
  }

  if (['lease', 'leasing'].includes(normalizedListingType)) {
    return 'lease'
  }

  return null
}

export function isVideoAssetLink(value: string) {
  return /\.(mp4|mov|webm|avi)(\?.*)?$/i.test(value)
}

export function getPropertyMediaAssets(property: PropertyListItem): PropertyMediaAsset[] {
  return property.images
    .map((image, fallbackIndex) => {
      const src = image.link || image.thumbnail
      if (!src) {
        return null
      }

      return {
        id: `${property.id}-media-${image.index || fallbackIndex + 1}`,
        index: image.index || fallbackIndex + 1,
        kind: image.link && isVideoAssetLink(image.link) ? 'video' : 'image',
        src,
        previewSrc: image.thumbnail || image.link || '',
      } satisfies PropertyMediaAsset
    })
    .filter((asset): asset is PropertyMediaAsset => Boolean(asset))
    .sort((leftAsset, rightAsset) => leftAsset.index - rightAsset.index)
}

export function getPrimaryPropertyImage(property: PropertyListItem) {
  const primaryMedia = getPropertyMediaAssets(property)[0]
  return primaryMedia?.previewSrc || primaryMedia?.src || ''
}

export function buildPaginationItems(currentPage: number, totalPages: number, maxVisible = 7): PaginationItem[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (maxVisible <= 5) {
    if (currentPage <= 3) {
      return [1, 2, 3, 'end-ellipsis', totalPages]
    }

    if (currentPage >= totalPages - 2) {
      return [1, 'start-ellipsis', totalPages - 2, totalPages - 1, totalPages]
    }

    return [1, 'start-ellipsis', currentPage, 'end-ellipsis', totalPages]
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'end-ellipsis', totalPages]
  }

  if (currentPage >= totalPages - 3) {
    return [1, 'start-ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, 'start-ellipsis', currentPage - 1, currentPage, currentPage + 1, 'end-ellipsis', totalPages]
}

export function getPropertyStatusClasses(property: PropertyListItem) {
  const normalizedStatus = property.status.trim().toLowerCase()

  if (property.sold || normalizedStatus === 'closed' || normalizedStatus === 'sold') {
    return 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300'
  }

  if (normalizedStatus === 'available') {
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
  }

  return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
}

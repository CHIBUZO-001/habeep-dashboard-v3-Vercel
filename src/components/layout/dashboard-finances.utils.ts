export const compactNumberFormatter = new Intl.NumberFormat('en-NG', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export const percentFormatter = new Intl.NumberFormat('en-NG', {
  style: 'percent',
  maximumFractionDigits: 1,
})

export const decimalFormatter = new Intl.NumberFormat('en-NG', {
  maximumFractionDigits: 2,
})

export const responsiveChartInitialDimension = {
  width: 520,
  height: 300,
} as const

export const surfaceCardClass =
  'rounded-2xl border border-slate-200/85 bg-white/90 p-4 shadow-sm shadow-slate-900/5 ring-1 ring-white/70 transition-colors dark:border-slate-800/80 dark:bg-slate-900/90 dark:ring-slate-800/80'

const breakdownLabelOverrides: Record<string, string> = {
  rentCommission: 'Rent commission',
  loanInterest: 'Loan interest',
}

const monthSortOrder: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
}

export function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDisplayDate(inputDate: string | null) {
  if (!inputDate) {
    return ''
  }

  const parsedDate = new Date(inputDate)
  if (Number.isNaN(parsedDate.getTime())) {
    return inputDate
  }

  return parsedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateRange(from: string | null, to: string | null) {
  const fromLabel = formatDisplayDate(from)
  const toLabel = formatDisplayDate(to)

  if (!fromLabel && !toLabel) {
    return 'N/A'
  }

  if (!fromLabel) {
    return `To ${toLabel}`
  }

  if (!toLabel) {
    return `From ${fromLabel}`
  }

  return `${fromLabel} – ${toLabel}`
}

export function formatReadableLabel(inputLabel: string) {
  const normalized = inputLabel.trim()
  if (!normalized) {
    return 'Unknown'
  }

  const overriddenLabel = breakdownLabelOverrides[normalized]
  if (overriddenLabel) {
    return overriddenLabel
  }

  const spaced = normalized.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ')
  return spaced
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ')
}

export function getMonthSortKey(inputMonth: string) {
  const normalizedMonth = inputMonth.trim().slice(0, 3).toLowerCase()
  return monthSortOrder[normalizedMonth] ?? 999
}

export function formatTrendDateLabel(inputDate: string) {
  const normalizedDate = inputDate.trim()
  if (!normalizedDate) {
    return inputDate
  }

  if (/^\d{4}-\d{2}$/.test(normalizedDate)) {
    const parsedDate = new Date(`${normalizedDate}-01T00:00:00.000Z`)
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      })
    }
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
    const parsedDate = new Date(`${normalizedDate}T00:00:00.000Z`)
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    }
  }

  return normalizedDate
}

export type PaginationItem = number | 'start-ellipsis' | 'end-ellipsis'

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

export function createCurrencyFormatter(currencyCode: string) {
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0,
    })
  } catch {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    })
  }
}


import { useCallback, useDeferredValue, useEffect, useRef, useState } from 'react'

import { getApiErrorMessage } from '../../lib/http-client'
import {
  getPropertyAnalyticsDashboard,
  getProperties,
  getPropertyMetrics,
  type PropertyAnalyticsDashboard,
  type PropertyList,
  type PropertyMetrics,
} from '../../services'
import { AnalyticsDashboardView } from './properties-dashboard/analytics-view'
import { OverviewDashboardView } from './properties-dashboard/overview-view'
import {
  emptyPropertyAnalyticsDashboard,
  getAvailableFilterValues,
  getListingTypeFilterValue,
  getPropertyStatusFilterValue,
  getPropertyStatusRequestValue,
} from './properties-dashboard/shared'
import { useToast } from '../ui/toast-provider'

type DashboardPropertiesProps = {
  section: 'overview' | 'analytics'
}

export function DashboardProperties({ section }: DashboardPropertiesProps) {
  const [metrics, setMetrics] = useState<PropertyMetrics | null>(null)
  const [analytics, setAnalytics] = useState<PropertyAnalyticsDashboard | null>(null)
  const [propertyList, setPropertyList] = useState<PropertyList | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isMetricsLoading, setIsMetricsLoading] = useState(section === 'overview')
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(section === 'analytics')
  const [isListLoading, setIsListLoading] = useState(section === 'overview')
  const [metricsError, setMetricsError] = useState<string | null>(null)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [listingFilter, setListingFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([])
  const [availableListingTypes, setAvailableListingTypes] = useState<string[]>([])
  const [availablePropertyTypes, setAvailablePropertyTypes] = useState<string[]>([])

  const { toast } = useToast()
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const activeSearchQuery = deferredSearchQuery.trim()
  const latestPropertiesRequestId = useRef(0)

  const loadPropertyMetrics = useCallback(
    async (showErrorToast = false) => {
      if (section !== 'overview') {
        return
      }

      setIsMetricsLoading(true)

      try {
        const nextMetrics = await getPropertyMetrics()
        setMetrics(nextMetrics)
        setMetricsError(null)
      } catch (error) {
        const message = getApiErrorMessage(error, 'Failed to load property metrics.')
        setMetricsError(message)

        if (showErrorToast) {
          toast({
            variant: 'error',
            title: 'Property metrics unavailable',
            description: message,
          })
        }
      } finally {
        setIsMetricsLoading(false)
      }
    },
    [section, toast],
  )

  const loadPropertyAnalytics = useCallback(
    async (showErrorToast = false) => {
      if (section !== 'analytics') {
        return
      }

      setIsAnalyticsLoading(true)

      try {
        const nextAnalytics = await getPropertyAnalyticsDashboard()
        setAnalytics(nextAnalytics)
        setAnalyticsError(null)
      } catch (error) {
        const message = getApiErrorMessage(error, 'Failed to load property analytics.')
        setAnalyticsError(message)

        if (showErrorToast) {
          toast({
            variant: 'error',
            title: 'Property analytics unavailable',
            description: message,
          })
        }
      } finally {
        setIsAnalyticsLoading(false)
      }
    },
    [section, toast],
  )

  const loadPropertiesList = useCallback(
    async (showErrorToast = false) => {
      if (section !== 'overview') {
        return
      }

      setIsListLoading(true)
      const requestId = latestPropertiesRequestId.current + 1
      latestPropertiesRequestId.current = requestId

      try {
        const nextPropertyList = await getProperties(currentPage, undefined, {
          search: activeSearchQuery || undefined,
          status: statusFilter !== 'all' ? getPropertyStatusRequestValue(statusFilter) : undefined,
          listingFor: listingFilter !== 'all' ? getListingTypeFilterValue(listingFilter) || undefined : undefined,
          type: typeFilter !== 'all' ? typeFilter : undefined,
        })

        if (requestId !== latestPropertiesRequestId.current) {
          return
        }

        setPropertyList(nextPropertyList)
        setListError(null)
      } catch (error) {
        if (requestId !== latestPropertiesRequestId.current) {
          return
        }

        const message = getApiErrorMessage(error, 'Failed to load properties.')
        setListError(message)

        if (showErrorToast) {
          toast({
            variant: 'error',
            title: 'Properties unavailable',
            description: message,
          })
        }
      } finally {
        if (requestId === latestPropertiesRequestId.current) {
          setIsListLoading(false)
        }
      }
    },
    [activeSearchQuery, currentPage, listingFilter, section, statusFilter, toast, typeFilter],
  )

  useEffect(() => {
    if (section === 'overview') {
      void loadPropertyMetrics()
    }
  }, [loadPropertyMetrics, section])

  useEffect(() => {
    if (section === 'analytics') {
      void loadPropertyAnalytics()
    }
  }, [loadPropertyAnalytics, section])

  useEffect(() => {
    if (section === 'overview') {
      void loadPropertiesList()
    }
  }, [loadPropertiesList, section])

  useEffect(() => {
    if (!propertyList) {
      return
    }

    setAvailableStatuses((previousStatuses) =>
      getAvailableFilterValues([
        ...previousStatuses,
        ...(propertyList.data ?? []).map((property) => getPropertyStatusFilterValue(property.status, property.sold)),
      ]),
    )

    setAvailableListingTypes((previousListingTypes) =>
      getAvailableFilterValues([
        ...previousListingTypes,
        ...(propertyList.data ?? []).map((property) => getListingTypeFilterValue(property.listingFor)),
      ]),
    )

    setAvailablePropertyTypes((previousPropertyTypes) =>
      getAvailableFilterValues([...previousPropertyTypes, ...(propertyList.data ?? []).map((property) => property.type)]),
    )
  }, [propertyList])

  if (section === 'analytics') {
    return (
      <AnalyticsDashboardView
        analytics={analytics ?? emptyPropertyAnalyticsDashboard}
        analyticsError={analyticsError}
        isAnalyticsLoading={isAnalyticsLoading}
        onRefresh={() => void loadPropertyAnalytics(true)}
      />
    )
  }

  return (
    <OverviewDashboardView
      metrics={metrics}
      metricsError={metricsError}
      isMetricsLoading={isMetricsLoading}
      onRefreshMetrics={() => void loadPropertyMetrics(true)}
      propertyList={propertyList}
      listError={listError}
      isListLoading={isListLoading}
      onRefreshList={() => void loadPropertiesList(true)}
      currentPage={currentPage}
      onCurrentPageChange={setCurrentPage}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      statusFilter={statusFilter}
      onStatusFilterChange={setStatusFilter}
      listingFilter={listingFilter}
      onListingFilterChange={setListingFilter}
      typeFilter={typeFilter}
      onTypeFilterChange={setTypeFilter}
      availableStatuses={availableStatuses}
      availableListingTypes={availableListingTypes}
      availablePropertyTypes={availablePropertyTypes}
      onClearFilters={() => {
        setSearchQuery('')
        setStatusFilter('all')
        setListingFilter('all')
        setTypeFilter('all')
      }}
    />
  )
}

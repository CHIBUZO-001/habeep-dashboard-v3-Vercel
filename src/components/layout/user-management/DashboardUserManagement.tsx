import { lazy, useCallback, useEffect, useState } from 'react'

import { getApiErrorMessage } from '../../../lib/http-client'
import {
  getAgentsList,
  getAgentsSummary,
  getLandlordsList,
  getLandlordsSummary,
  getTenantsList,
  getTenantsSummary,
  getUserBaseList,
  getUserBaseSummary,
  type AgentsList,
  type AgentsSummary,
  type LandlordsList,
  type LandlordsSummary,
  type TenantsList,
  type TenantsSummary,
  type UserBaseList,
  type UserBaseSummary,
} from '../../../services'
import { useToast } from '../../ui/toast-provider'

import { AGENTS_PAGE_SIZE, LANDLORDS_PAGE_SIZE, TENANTS_PAGE_SIZE, USERS_PAGE_SIZE } from './utils'

const UsersSection = lazy(() => import('./UsersSection').then((module) => ({ default: module.UsersSection })))
const TenantsSection = lazy(() => import('./TenantsSection').then((module) => ({ default: module.TenantsSection })))
const AgentsSection = lazy(() => import('./AgentsSection').then((module) => ({ default: module.AgentsSection })))
const LandlordsSection = lazy(() =>
  import('./LandlordsSection').then((module) => ({ default: module.LandlordsSection })),
)

export type DashboardUserManagementProps = {
  section: 'users' | 'tenants' | 'agents' | 'landlords'
}

export function DashboardUserManagement({ section }: DashboardUserManagementProps) {
  const [summary, setSummary] = useState<UserBaseSummary | null>(null)
  const [userList, setUserList] = useState<UserBaseList | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isSummaryLoading, setIsSummaryLoading] = useState(section === 'users')
  const [isListLoading, setIsListLoading] = useState(section === 'users')
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [agentsSummary, setAgentsSummary] = useState<AgentsSummary | null>(null)
  const [isAgentsSummaryLoading, setIsAgentsSummaryLoading] = useState(section === 'agents')
  const [agentsSummaryError, setAgentsSummaryError] = useState<string | null>(null)
  const [agentsList, setAgentsList] = useState<AgentsList | null>(null)
  const [agentPage, setAgentPage] = useState(1)
  const [isAgentsListLoading, setIsAgentsListLoading] = useState(section === 'agents')
  const [agentsListError, setAgentsListError] = useState<string | null>(null)
  const [landlordsSummary, setLandlordsSummary] = useState<LandlordsSummary | null>(null)
  const [isLandlordsSummaryLoading, setIsLandlordsSummaryLoading] = useState(section === 'landlords')
  const [landlordsSummaryError, setLandlordsSummaryError] = useState<string | null>(null)
  const [landlordsList, setLandlordsList] = useState<LandlordsList | null>(null)
  const [landlordPage, setLandlordPage] = useState(1)
  const [isLandlordsListLoading, setIsLandlordsListLoading] = useState(section === 'landlords')
  const [landlordsListError, setLandlordsListError] = useState<string | null>(null)
  const [tenantsSummary, setTenantsSummary] = useState<TenantsSummary | null>(null)
  const [isTenantsSummaryLoading, setIsTenantsSummaryLoading] = useState(section === 'tenants')
  const [tenantsSummaryError, setTenantsSummaryError] = useState<string | null>(null)
  const [tenantsList, setTenantsList] = useState<TenantsList | null>(null)
  const [tenantPage, setTenantPage] = useState(1)
  const [isTenantsListLoading, setIsTenantsListLoading] = useState(section === 'tenants')
  const [tenantsListError, setTenantsListError] = useState<string | null>(null)
  const { toast } = useToast()

  const loadUsersSummary = useCallback(
    async (showErrorToast = false) => {
      if (section !== 'users') {
        return
      }

      setIsSummaryLoading(true)

      try {
        const nextSummary = await getUserBaseSummary()
        setSummary(nextSummary)
        setSummaryError(null)
      } catch (error) {
        const message = getApiErrorMessage(error, 'Failed to load user summary.')
        setSummaryError(message)
        if (showErrorToast) {
          toast({
            variant: 'error',
            title: 'User summary unavailable',
            description: message,
          })
        }
      } finally {
        setIsSummaryLoading(false)
      }
    },
    [section, toast],
  )

  const loadUserList = useCallback(
    async (showErrorToast = false) => {
      if (section !== 'users') {
        return
      }

      setIsListLoading(true)

      try {
        const nextUserList = await getUserBaseList(currentPage, USERS_PAGE_SIZE)
        setUserList(nextUserList)
        setListError(null)
      } catch (error) {
        const message = getApiErrorMessage(error, 'Failed to load users list.')
        setListError(message)
        if (showErrorToast) {
          toast({
            variant: 'error',
            title: 'Users list unavailable',
            description: message,
          })
        }
      } finally {
        setIsListLoading(false)
      }
    },
    [currentPage, section, toast],
  )

  const loadTenantsList = useCallback(
    async (showErrorToast = false) => {
      if (section !== 'tenants') {
        return
      }

      setIsTenantsListLoading(true)

      try {
        const nextTenantsList = await getTenantsList(tenantPage, TENANTS_PAGE_SIZE)
        setTenantsList(nextTenantsList)
        setTenantsListError(null)
      } catch (error) {
        const message = getApiErrorMessage(error, 'Failed to load tenants list.')
        setTenantsListError(message)
        if (showErrorToast) {
          toast({
            variant: 'error',
            title: 'Tenants list unavailable',
            description: message,
          })
        }
      } finally {
        setIsTenantsListLoading(false)
      }
    },
    [section, tenantPage, toast],
  )

  const loadTenantsSummary = useCallback(
    async (showErrorToast = false) => {
      if (section !== 'tenants') {
        return
      }

      setIsTenantsSummaryLoading(true)

      try {
        const nextSummary = await getTenantsSummary()
        setTenantsSummary(nextSummary)
        setTenantsSummaryError(null)
      } catch (error) {
        const message = getApiErrorMessage(error, 'Failed to load tenants summary.')
        setTenantsSummaryError(message)
        if (showErrorToast) {
          toast({
            variant: 'error',
            title: 'Tenant summary unavailable',
            description: message,
          })
        }
      } finally {
        setIsTenantsSummaryLoading(false)
      }
    },
    [section, toast],
  )

  const loadAgentsSummary = useCallback(
    async (showErrorToast = false) => {
      if (section !== 'agents') {
        return
      }

      setIsAgentsSummaryLoading(true)

      try {
        const nextSummary = await getAgentsSummary()
        setAgentsSummary(nextSummary)
        setAgentsSummaryError(null)
      } catch (error) {
        const message = getApiErrorMessage(error, 'Failed to load agents summary.')
        setAgentsSummaryError(message)
        if (showErrorToast) {
          toast({
            variant: 'error',
            title: 'Agent summary unavailable',
            description: message,
          })
        }
      } finally {
        setIsAgentsSummaryLoading(false)
      }
    },
    [section, toast],
  )

  const loadAgentsList = useCallback(
    async (showErrorToast = false) => {
      if (section !== 'agents') {
        return
      }

      setIsAgentsListLoading(true)

      try {
        const nextAgentsList = await getAgentsList(agentPage, AGENTS_PAGE_SIZE)
        setAgentsList(nextAgentsList)
        setAgentsListError(null)
      } catch (error) {
        const message = getApiErrorMessage(error, 'Failed to load agents list.')
        setAgentsListError(message)
        if (showErrorToast) {
          toast({
            variant: 'error',
            title: 'Agents list unavailable',
            description: message,
          })
        }
      } finally {
        setIsAgentsListLoading(false)
      }
    },
    [agentPage, section, toast],
  )

  const loadLandlordsSummary = useCallback(
    async (showErrorToast = false) => {
      if (section !== 'landlords') {
        return
      }

      setIsLandlordsSummaryLoading(true)

      try {
        const nextSummary = await getLandlordsSummary()
        setLandlordsSummary(nextSummary)
        setLandlordsSummaryError(null)
      } catch (error) {
        const message = getApiErrorMessage(error, 'Failed to load landlords summary.')
        setLandlordsSummaryError(message)
        if (showErrorToast) {
          toast({
            variant: 'error',
            title: 'Landlord summary unavailable',
            description: message,
          })
        }
      } finally {
        setIsLandlordsSummaryLoading(false)
      }
    },
    [section, toast],
  )

  const loadLandlordsList = useCallback(
    async (showErrorToast = false) => {
      if (section !== 'landlords') {
        return
      }

      setIsLandlordsListLoading(true)

      try {
        const nextLandlordsList = await getLandlordsList(landlordPage, LANDLORDS_PAGE_SIZE)
        setLandlordsList(nextLandlordsList)
        setLandlordsListError(null)
      } catch (error) {
        const message = getApiErrorMessage(error, 'Failed to load landlords list.')
        setLandlordsListError(message)
        if (showErrorToast) {
          toast({
            variant: 'error',
            title: 'Landlords list unavailable',
            description: message,
          })
        }
      } finally {
        setIsLandlordsListLoading(false)
      }
    },
    [landlordPage, section, toast],
  )

  useEffect(() => {
    if (section === 'users') {
      void loadUsersSummary()
    }
  }, [section, loadUsersSummary])

  useEffect(() => {
    if (section === 'users') {
      void loadUserList()
    }
  }, [section, loadUserList])

  useEffect(() => {
    if (section === 'tenants') {
      void loadTenantsSummary()
    }
  }, [section, loadTenantsSummary])

  useEffect(() => {
    if (section === 'tenants') {
      void loadTenantsList()
    }
  }, [section, loadTenantsList])

  useEffect(() => {
    if (section === 'agents') {
      void loadAgentsSummary()
    }
  }, [section, loadAgentsSummary])

  useEffect(() => {
    if (section === 'agents') {
      void loadAgentsList()
    }
  }, [section, loadAgentsList])

  useEffect(() => {
    if (section === 'landlords') {
      void loadLandlordsSummary()
    }
  }, [section, loadLandlordsSummary])

  useEffect(() => {
    if (section === 'landlords') {
      void loadLandlordsList()
    }
  }, [section, loadLandlordsList])

  if (section === 'tenants') {
    return (
      <TenantsSection
        tenantsSummary={tenantsSummary}
        isTenantsSummaryLoading={isTenantsSummaryLoading}
        tenantsSummaryError={tenantsSummaryError}
        onRefreshSummary={() => void loadTenantsSummary(true)}
        tenantsList={tenantsList}
        isTenantsListLoading={isTenantsListLoading}
        tenantsListError={tenantsListError}
        onRefreshList={() => void loadTenantsList(true)}
        currentPage={tenantPage}
        onPageChange={setTenantPage}
      />
    )
  }

  if (section === 'agents') {
    return (
      <AgentsSection
        agentsSummary={agentsSummary}
        isAgentsSummaryLoading={isAgentsSummaryLoading}
        agentsSummaryError={agentsSummaryError}
        onRefreshSummary={() => void loadAgentsSummary(true)}
        agentsList={agentsList}
        isAgentsListLoading={isAgentsListLoading}
        agentsListError={agentsListError}
        onRefreshList={() => void loadAgentsList(true)}
        currentPage={agentPage}
        onPageChange={setAgentPage}
      />
    )
  }

  if (section === 'landlords') {
    return (
      <LandlordsSection
        landlordsSummary={landlordsSummary}
        isLandlordsSummaryLoading={isLandlordsSummaryLoading}
        landlordsSummaryError={landlordsSummaryError}
        onRefreshSummary={() => void loadLandlordsSummary(true)}
        landlordsList={landlordsList}
        isLandlordsListLoading={isLandlordsListLoading}
        landlordsListError={landlordsListError}
        onRefreshList={() => void loadLandlordsList(true)}
        currentPage={landlordPage}
        onPageChange={setLandlordPage}
      />
    )
  }

  return (
    <UsersSection
      summary={summary}
      isSummaryLoading={isSummaryLoading}
      summaryError={summaryError}
      onRefreshSummary={() => void loadUsersSummary(true)}
      userList={userList}
      isListLoading={isListLoading}
      listError={listError}
      onRefreshList={() => void loadUserList(true)}
      currentPage={currentPage}
      onPageChange={setCurrentPage}
    />
  )
}

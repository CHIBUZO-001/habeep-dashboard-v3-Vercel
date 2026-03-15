import { lazy } from 'react'

const DashboardFinancesOfflineDeposits = lazy(() =>
  import('./dashboard-finances.offline-deposits').then((module) => ({
    default: module.DashboardFinancesOfflineDeposits,
  })),
)
const DashboardFinancesRevenue = lazy(() =>
  import('./dashboard-finances.revenue').then((module) => ({
    default: module.DashboardFinancesRevenue,
  })),
)
const DashboardFinancesWallet = lazy(() =>
  import('./dashboard-finances.wallet').then((module) => ({
    default: module.DashboardFinancesWallet,
  })),
)

export type DashboardFinancesSection = 'revenue' | 'wallet' | 'offline-deposits'

type DashboardFinancesProps = {
  section: DashboardFinancesSection
}

export function DashboardFinances({ section }: DashboardFinancesProps) {
  if (section === 'wallet') {
    return <DashboardFinancesWallet />
  }

  if (section === 'offline-deposits') {
    return <DashboardFinancesOfflineDeposits />
  }

  return <DashboardFinancesRevenue />
}

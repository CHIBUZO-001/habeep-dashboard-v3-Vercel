import { DashboardFinancesOfflineDeposits } from './dashboard-finances.offline-deposits'
import { DashboardFinancesRevenue } from './dashboard-finances.revenue'
import { DashboardFinancesWallet } from './dashboard-finances.wallet'

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


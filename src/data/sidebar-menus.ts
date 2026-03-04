import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  BookCheck,
  Building2,
  CircleDollarSign,
  House,
  LayoutDashboard,
  LifeBuoy,
  MessageSquareText,
  Settings2,
  ShieldCheck,
  Users,
} from 'lucide-react'

export type SidebarSubItem = {
  id: string
  label: string
  href: string
}

export type SidebarItem = {
  id: string
  label: string
  href: string
  icon: LucideIcon
  badge?: string
  children?: SidebarSubItem[]
}

export type SidebarGroup = {
  id: string
  label: string
  items: SidebarItem[]
}

export const sidebarGroups: SidebarGroup[] = [
  {
    id: 'platform',
    label: 'Platform',
    items: [
      {
        id: 'overview',
        label: 'Overview',
        href: '/dashboard/overview',
        icon: LayoutDashboard,
        children: [
          { id: 'overview-dashboard', label: 'Dashboard', href: '/dashboard/overview' },
          { id: 'overview-activity', label: 'Activity Logs', href: '/dashboard/activity-logs' },
        ],
      },
      {
        id: 'guests',
        label: 'Guests',
        href: '/dashboard/guests',
        icon: Users,
        children: [
          { id: 'guests-all', label: 'All Guests', href: '/dashboard/guests' },
          { id: 'guests-kyc', label: 'KYC Pending', href: '/dashboard/guests?kyc=pending' },
        ],
      },
      {
        id: 'hosts',
        label: 'Hosts',
        href: '/dashboard/hosts',
        icon: House,
        children: [
          { id: 'hosts-all', label: 'All Hosts', href: '/dashboard/hosts' },
          { id: 'hosts-risk', label: 'Risk Queue', href: '/dashboard/hosts?risk=high' },
        ],
      },
      {
        id: 'shortlets',
        label: 'Shortlets',
        href: '/dashboard/shortlets',
        icon: Building2,
        badge: '12',
        children: [
          { id: 'shortlets-all', label: 'All Listings', href: '/dashboard/shortlets' },
          { id: 'shortlets-review', label: 'Pending Review', href: '/dashboard/shortlets?status=review' },
        ],
      },
      {
        id: 'finance',
        label: 'Finances',
        href: '/dashboard/finances',
        icon: CircleDollarSign,
        children: [
          { id: 'finance-overview', label: 'Overview', href: '/dashboard/finances' },
          { id: 'finance-refunds', label: 'Refunds & Payouts', href: '/dashboard/finances/refunds' },
        ],
      },
      {
        id: 'compliance',
        label: 'Compliance',
        href: '/dashboard/compliance',
        icon: ShieldCheck,
        children: [
          { id: 'compliance-overview', label: 'Overview', href: '/dashboard/compliance' },
          { id: 'compliance-risk', label: 'Risk Flags', href: '/dashboard/compliance/risk-flags' },
        ],
      },
    ],
  },
  {
    id: 'customer-care',
    label: 'Customer Care',
    items: [
      {
        id: 'help',
        label: 'Help Center',
        href: '/dashboard/help-center',
        icon: LifeBuoy,
      },
      {
        id: 'reviews',
        label: 'Reviews',
        href: '/dashboard/reviews',
        icon: MessageSquareText,
        children: [
          { id: 'reviews-all', label: 'All Reviews', href: '/dashboard/reviews' },
          { id: 'reviews-flagged', label: 'Flagged', href: '/dashboard/reviews?status=flagged' },
        ],
      },
      {
        id: 'audits',
        label: 'Audit Trail',
        href: '/dashboard/audits',
        icon: BookCheck,
      },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      {
        id: 'performance',
        label: 'Performance',
        href: '/dashboard/performance',
        icon: Activity,
      },
      {
        id: 'settings',
        label: 'Settings',
        href: '/dashboard/settings',
        icon: Settings2,
        children: [
          { id: 'settings-general', label: 'General', href: '/dashboard/settings' },
          { id: 'settings-users', label: 'Users & Permissions', href: '/dashboard/settings/users' },
        ],
      },
    ],
  },
]

export type ActiveMenuMatch = {
  groupLabel: string
  item: SidebarItem
  child?: SidebarSubItem
}

export function findMenuById(id: string): ActiveMenuMatch | null {
  for (const group of sidebarGroups) {
    for (const item of group.items) {
      if (item.id === id) {
        return { groupLabel: group.label, item }
      }
      const child = item.children?.find((menuChild) => menuChild.id === id)
      if (child) {
        return { groupLabel: group.label, item, child }
      }
    }
  }

  return null
}

export function getDefaultMenuId() {
  const firstGroup = sidebarGroups[0]
  const firstItem = firstGroup?.items[0]
  const firstChild = firstItem?.children?.[0]
  return firstChild?.id ?? firstItem?.id ?? ''
}

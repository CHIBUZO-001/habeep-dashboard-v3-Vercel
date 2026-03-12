import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  BookCheck,
  BookOpenText,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  House,
  LayoutDashboard,
  LifeBuoy,
  MessageSquareText,
  PenSquare,
  Settings2,
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
        id: 'user-management',
        label: 'User Management',
        href: '/dashboard/user-management',
        icon: Users,
        children: [
          { id: 'user-management-users', label: 'Users', href: '/dashboard/user-management/users' },
          { id: 'user-management-tenants', label: 'Tenants', href: '/dashboard/user-management/tenants' },
          { id: 'user-management-agents', label: 'Agents', href: '/dashboard/user-management/agents' },
          { id: 'user-management-landlords', label: 'Landlords', href: '/dashboard/user-management/landlords' },
        ],
      },
      {
        id: 'properties',
        label: 'Properties',
        href: '/dashboard/properties',
        icon: House,
        children: [
          { id: 'properties-overview', label: 'Overview', href: '/dashboard/properties' },
          { id: 'properties-analytics', label: 'Analytics', href: '/dashboard/properties/analytics' },
        ],
      },
      {
        id: 'finance',
        label: 'Finances',
        href: '/dashboard/finances',
        icon: CircleDollarSign,
        children: [
          { id: 'finance-overview', label: 'Revenue', href: '/dashboard/finances' },
          { id: 'finance-wallet', label: 'Wallet', href: '/dashboard/finances/wallet' },
          { id: 'finance-offline-deposits', label: 'Offline Deposits', href: '/dashboard/finances/offline-deposits' },
        ],
      },
    ],
  },
  {
    id: 'work-management',
    label: 'Work Management',
    items: [
      {
        id: 'tasks',
        label: 'Tasks',
        href: '/dashboard/tasks',
        icon: ClipboardList,
      },
      {
        id: 'calendar',
        label: 'Calendar',
        href: '/dashboard/calendar',
        icon: CalendarDays,
      },
      {
        id: 'post',
        label: 'Post',
        href: '/dashboard/post',
        icon: PenSquare,
      },
      {
        id: 'blog',
        label: 'Blog',
        href: '/dashboard/blog',
        icon: BookOpenText,
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

export function findMenuIdByHref(href: string): string | null {
  for (const group of sidebarGroups) {
    for (const item of group.items) {
      for (const child of item.children ?? []) {
        if (child.href === href) {
          return child.id
        }
      }

      if (item.href === href) {
        return item.id
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

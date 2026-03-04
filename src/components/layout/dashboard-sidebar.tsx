import { ChevronDown, UserCircle2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import brandLogo from '../../assets/logo.png'
import { sidebarGroups } from '../../data/sidebar-menus'
import { cn } from '../../lib/cn'

type DashboardSidebarProps = {
  desktopExpanded: boolean
  mobileOpen: boolean
  activeId: string
  user: {
    name: string
    role: 'admin' | 'super_admin'
  }
  onSelect: (id: string) => void
  onCloseMobile: () => void
}

function buildInitialExpandedIds() {
  const initialIds: string[] = []

  for (const group of sidebarGroups) {
    for (const item of group.items) {
      if (item.children?.length) {
        initialIds.push(item.id)
        break
      }
    }
  }

  return new Set(initialIds)
}

export function DashboardSidebar({
  desktopExpanded,
  mobileOpen,
  activeId,
  user,
  onSelect,
  onCloseMobile,
}: DashboardSidebarProps) {
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(buildInitialExpandedIds)

  const activeParentItemId = useMemo(() => {
    for (const group of sidebarGroups) {
      const matchedItem = group.items.find((item) => item.children?.some((child) => child.id === activeId))
      if (matchedItem) {
        return matchedItem.id
      }
    }
    return null
  }, [activeId])

  const effectiveExpandedItemIds = useMemo(() => {
    if (!activeParentItemId) {
      return expandedItemIds
    }

    const nextIds = new Set(expandedItemIds)
    nextIds.add(activeParentItemId)
    return nextIds
  }, [expandedItemIds, activeParentItemId])

  const showLabels = desktopExpanded || mobileOpen

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-[2px] transition-opacity md:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex h-screen w-[88vw] max-w-80 flex-col border-r border-slate-200 bg-white shadow-2xl transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 md:max-w-none md:shadow-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          desktopExpanded ? 'md:w-72' : 'md:w-20',
        )}
        aria-label="Dashboard sidebar"
      >
        <div className="flex h-16 items-center border-b border-slate-200 px-3 dark:border-slate-800">
          <div className={cn('flex w-full items-center rounded-xl p-1.5', showLabels ? 'gap-3' : 'justify-center')}>
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600/15 to-cyan-500/20">
              <img src={brandLogo} alt="Habeep logo" className="h-7 w-auto object-contain" />
            </div>
            <div
              className={cn(
                'overflow-hidden text-left transition-all',
                showLabels ? 'w-full opacity-100' : 'w-0 opacity-0',
              )}
            >
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">Habeep</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">Operations Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {sidebarGroups.map((group) => (
            <section key={group.id} className="mb-6 last:mb-0">
              <h2 className={cn('mb-2 px-2 text-xs font-medium uppercase tracking-wide text-slate-400', !showLabels && 'sr-only')}>
                {group.label}
              </h2>

              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const hasChildren = Boolean(item.children?.length)
                  const isChildActive = item.children?.some((child) => child.id === activeId) ?? false
                  const isActive = item.id === activeId || isChildActive
                  const isExpanded = effectiveExpandedItemIds.has(item.id)

                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        title={!showLabels ? item.label : undefined}
                        onClick={() => {
                          if (hasChildren && showLabels) {
                            setExpandedItemIds((previousIds) => {
                              const nextIds = new Set(previousIds)
                              if (nextIds.has(item.id)) {
                                nextIds.delete(item.id)
                              } else {
                                nextIds.add(item.id)
                              }
                              return nextIds
                            })
                            return
                          }

                          const fallbackChild = item.children?.[0]
                          onSelect(fallbackChild?.id ?? item.id)
                          if (mobileOpen) {
                            onCloseMobile()
                          }
                        }}
                        className={cn(
                          'group flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition-colors',
                          showLabels ? 'gap-3' : 'justify-center',
                          isActive
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100',
                        )}
                        aria-expanded={hasChildren ? isExpanded : undefined}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon className="h-4 w-4 shrink-0" />

                        <span
                          className={cn(
                            'flex-1 overflow-hidden text-ellipsis whitespace-nowrap transition-all',
                            showLabels ? 'w-auto opacity-100' : 'w-0 opacity-0',
                          )}
                        >
                          {item.label}
                        </span>

                        {showLabels && item.badge ? (
                          <span className="inline-flex min-w-6 items-center justify-center rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/50 dark:text-blue-200">
                            {item.badge}
                          </span>
                        ) : null}

                        {showLabels && hasChildren ? (
                          <ChevronDown
                            className={cn('h-4 w-4 shrink-0 transition-transform', isExpanded ? 'rotate-180' : 'rotate-0')}
                          />
                        ) : null}
                      </button>

                      {hasChildren && showLabels ? (
                        <div
                          className={cn(
                            'grid transition-all duration-200',
                            isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                          )}
                        >
                          <div className="overflow-hidden">
                            <ul className="ml-7 mt-1 space-y-1 border-l border-slate-200 pl-4 dark:border-slate-800">
                              {item.children?.map((child) => {
                                const isChildCurrent = activeId === child.id
                                return (
                                  <li key={child.id}>
                                    <button
                                      type="button"
                                      className={cn(
                                        'w-full rounded-lg px-2 py-1.5 text-left text-sm transition-colors',
                                        isChildCurrent
                                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200'
                                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
                                      )}
                                      onClick={() => {
                                        onSelect(child.id)
                                        if (mobileOpen) {
                                          onCloseMobile()
                                        }
                                      }}
                                    >
                                      {child.label}
                                    </button>
                                  </li>
                                )
                              })}
                            </ul>
                          </div>
                        </div>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          <div
            className={cn(
              'rounded-xl border border-blue-200 bg-blue-50 p-3 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-100',
              !showLabels && 'flex items-center justify-center p-2',
            )}
          >
            {showLabels ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-xs font-semibold text-white">
                  <img src={brandLogo} alt="Habeep logo" className="h-6 w-auto object-contain" />
                </span>
                <div className="overflow-hidden">
                  <p className="truncate text-sm font-semibold text-blue-900 dark:text-blue-100">{user.name}</p>
                  <p className="truncate text-xs capitalize text-blue-700/90 dark:text-blue-200/90">
                    {user.role.replace('_', ' ')}
                  </p>
                </div>
              </div>
            ) : (
              <UserCircle2 className="h-4 w-4" />
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

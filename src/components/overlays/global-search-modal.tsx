import { Building2, Search, ShieldCheck, User, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { sidebarGroups } from '../../data/sidebar-menus'
import { cn } from '../../lib/cn'

type SearchResult = {
  id: string
  title: string
  subtitle: string
  menuId: string
  icon: typeof Search
}

type GlobalSearchModalProps = {
  open: boolean
  onClose: () => void
  onNavigateToMenu: (menuId: string) => void
}

const quickEntities: SearchResult[] = [
  {
    id: 'entity-tenant-risk',
    title: 'Amina Johnson',
    subtitle: 'Tenant · Risk flagged',
    menuId: 'user-management-tenants',
    icon: User,
  },
  {
    id: 'entity-shortlet-review',
    title: 'Lekki Apartment 23',
    subtitle: 'Shortlet · Pending review',
    menuId: 'shortlets-review',
    icon: Building2,
  },
  {
    id: 'entity-compliance',
    title: 'Risk Queue',
    subtitle: 'Compliance · 9 unresolved flags',
    menuId: 'compliance-risk',
    icon: ShieldCheck,
  },
]

export function GlobalSearchModal({ open, onClose, onNavigateToMenu }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClose = () => {
    setQuery('')
    onClose()
  }

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  const menuEntries = useMemo<SearchResult[]>(() => {
    const entries: SearchResult[] = []

    for (const group of sidebarGroups) {
      for (const item of group.items) {
        entries.push({
          id: item.id,
          title: item.label,
          subtitle: `${group.label} · ${item.href}`,
          menuId: item.id,
          icon: item.icon as typeof Search,
        })

        for (const child of item.children ?? []) {
          entries.push({
            id: child.id,
            title: child.label,
            subtitle: `${item.label} · ${child.href}`,
            menuId: child.id,
            icon: item.icon as typeof Search,
          })
        }
      }
    }

    return entries
  }, [])

  const normalizedQuery = query.trim().toLowerCase()

  const pageResults = useMemo(() => {
    if (!normalizedQuery) {
      return menuEntries.slice(0, 6)
    }

    return menuEntries.filter((entry) => {
      const title = entry.title.toLowerCase()
      const subtitle = entry.subtitle.toLowerCase()
      return title.includes(normalizedQuery) || subtitle.includes(normalizedQuery)
    })
  }, [menuEntries, normalizedQuery])

  const entityResults = useMemo(() => {
    if (!normalizedQuery) {
      return quickEntities
    }

    return quickEntities.filter((entry) => {
      const title = entry.title.toLowerCase()
      const subtitle = entry.subtitle.toLowerCase()
      return title.includes(normalizedQuery) || subtitle.includes(normalizedQuery)
    })
  }, [normalizedQuery])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[70]">
      <div
        className="absolute inset-0 cursor-pointer bg-slate-950/50 backdrop-blur-[2px]"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative mx-auto mt-16 w-[min(92vw,44rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages, users, tenants..."
            className="h-9 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
            aria-label="Global search"
          />
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-2">
          <section>
            <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Navigation
            </p>
            <div className="space-y-1">
              {pageResults.length > 0 ? (
                pageResults.map((result) => {
                  const Icon = result.icon
                  return (
                    <button
                      key={result.id}
                      type="button"
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={() => {
                        onNavigateToMenu(result.menuId)
                        handleClose()
                      }}
                    >
                      <Icon className="h-4 w-4 text-blue-500" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{result.title}</p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{result.subtitle}</p>
                      </div>
                    </button>
                  )
                })
              ) : (
                <p className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">No matching pages found.</p>
              )}
            </div>
          </section>

          <section className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-800">
            <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Results
            </p>
            <div className="space-y-1">
              {entityResults.map((result) => {
                const Icon = result.icon
                return (
                  <button
                    key={result.id}
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                      'hover:bg-slate-100 dark:hover:bg-slate-800',
                    )}
                    onClick={() => {
                      onNavigateToMenu(result.menuId)
                      handleClose()
                    }}
                  >
                    <Icon className="h-4 w-4 text-cyan-500" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{result.title}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{result.subtitle}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

import { Check, Laptop, Moon, Sun } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { cn } from '../../lib/cn'
import { useTheme, type ThemeMode } from './theme-provider'

const options: Array<{
  value: ThemeMode
  label: string
}> = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

function ThemeModeIcon({ mode, className }: { mode: ThemeMode; className: string }) {
  if (mode === 'light') {
    return <Sun className={className} />
  }
  if (mode === 'dark') {
    return <Moon className={className} />
  }
  return <Laptop className={className} />
}

export function ThemeToggle() {
  const { mode, setMode } = useTheme()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const handleMouseDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((previousState) => !previousState)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Change color theme"
      >
        <ThemeModeIcon mode={mode} className="h-4 w-4" />
      </button>

      <div
        className={cn(
          'absolute right-0 top-12 z-50 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl transition-all dark:border-slate-800 dark:bg-slate-900',
          open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0',
        )}
        role="menu"
        aria-label="Theme options"
      >
        {options.map((option) => {
          const isActive = mode === option.value

          return (
            <button
              key={option.value}
              type="button"
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
              )}
              onClick={() => {
                setMode(option.value)
                setOpen(false)
              }}
              role="menuitemradio"
              aria-checked={isActive}
            >
              <ThemeModeIcon mode={option.value} className="h-4 w-4" />
              <span className="flex-1">{option.label}</span>
              {isActive ? <Check className="h-4 w-4" /> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

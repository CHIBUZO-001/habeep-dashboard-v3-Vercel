/* eslint-disable react-refresh/only-export-components */
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { cn } from '../../lib/cn'

type ToastVariant = 'success' | 'info' | 'warning' | 'error'

type ToastPayload = {
  title: string
  description?: string
  variant?: ToastVariant
  durationMs?: number
}

type ToastItem = ToastPayload & {
  id: string
  variant: ToastVariant
}

type ToastContextValue = {
  toast: (payload: ToastPayload) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === 'success') {
    return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
  }
  if (variant === 'warning') {
    return <AlertTriangle className="h-4 w-4 text-amber-500" />
  }
  if (variant === 'error') {
    return <XCircle className="h-4 w-4 text-rose-500" />
  }
  return <Info className="h-4 w-4 text-blue-500" />
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef<Map<string, number>>(new Map())

  const dismissToast = useCallback((id: string) => {
    setToasts((previousToasts) => previousToasts.filter((toast) => toast.id !== id))
    const timerId = timersRef.current.get(id)
    if (timerId) {
      window.clearTimeout(timerId)
      timersRef.current.delete(id)
    }
  }, [])

  const toast = useCallback(
    ({ title, description, variant = 'info', durationMs = 3500 }: ToastPayload) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
      const nextToast: ToastItem = { id, title, description, variant }

      setToasts((previousToasts) => [nextToast, ...previousToasts].slice(0, 4))

      const timerId = window.setTimeout(() => {
        dismissToast(id)
      }, durationMs)
      timersRef.current.set(id, timerId)
    },
    [dismissToast],
  )

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed right-4 top-4 z-[90] flex w-[min(92vw,24rem)] flex-col gap-2">
        {toasts.map((toastItem) => (
          <div
            key={toastItem.id}
            className={cn(
              'pointer-events-auto animate-[toast-in_180ms_ease-out] rounded-xl border bg-white p-3 shadow-lg dark:bg-slate-900',
              toastItem.variant === 'success' &&
                'border-emerald-200 dark:border-emerald-900/50',
              toastItem.variant === 'info' && 'border-blue-200 dark:border-blue-900/50',
              toastItem.variant === 'warning' &&
                'border-amber-200 dark:border-amber-900/50',
              toastItem.variant === 'error' && 'border-rose-200 dark:border-rose-900/50',
            )}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5">
                <ToastIcon variant={toastItem.variant} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {toastItem.title}
                </p>
                {toastItem.description ? (
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                    {toastItem.description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toastItem.id)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider')
  }
  return context
}

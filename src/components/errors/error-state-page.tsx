import { ArrowLeft, Home } from 'lucide-react'

import brandLogo from '../../assets/logo.png'

type ErrorStatePageProps = {
  code: string
  title: string
  message: string
  hint?: string
  onPrimaryAction: () => void
  onSecondaryAction?: () => void
}

export function ErrorStatePage({
  code,
  title,
  message,
  hint,
  onPrimaryAction,
  onSecondaryAction,
}: ErrorStatePageProps) {
  return (
    <section className="mx-auto flex min-h-[65vh] w-full max-w-3xl items-center justify-center px-4 py-8">
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-10">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/15 to-cyan-500/20">
          <img src={brandLogo} alt="Habeep logo" className="h-9 w-auto object-contain" />
        </div>

        <p className="text-sm font-semibold tracking-wide text-blue-600 dark:text-blue-300">{code}</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100 md:text-3xl">{title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 dark:text-slate-300 md:text-base">{message}</p>

        {hint ? (
          <p className="mx-auto mt-2 max-w-xl text-xs text-slate-500 dark:text-slate-400 md:text-sm">{hint}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={onPrimaryAction}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </button>
          {onSecondaryAction ? (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </button>
          ) : null}
        </div>
      </div>
    </section>
  )
}

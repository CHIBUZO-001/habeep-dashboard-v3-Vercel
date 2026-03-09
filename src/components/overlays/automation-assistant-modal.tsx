import { Loader2, Sparkles, Wand2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { cn } from '../../lib/cn'
import { getApiErrorMessage } from '../../lib/http-client'
import { generateAutomationPlan, type AutomationPlan } from '../../services'
import { useToast } from '../ui/toast-provider'

type AutomationAssistantModalProps = {
  open: boolean
  workspace: string
  route: string
  onClose: () => void
}

function PlanSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-900/70">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</h4>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={`${title}-${item}`} className="text-sm text-slate-700 dark:text-slate-200">
            • {item}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function AutomationAssistantModal({ open, workspace, route, onClose }: AutomationAssistantModalProps) {
  const { toast } = useToast()
  const [prompt, setPrompt] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [plan, setPlan] = useState<AutomationPlan | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const promptInputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const timerId = window.setTimeout(() => {
      promptInputRef.current?.focus()
    }, 40)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [open])

  const handleClose = () => {
    if (isSubmitting) {
      return
    }

    setPrompt('')
    setPlan(null)
    setErrorMessage(null)
    onClose()
  }

  const handleGenerate = async () => {
    const sanitizedPrompt = prompt.trim()
    if (!sanitizedPrompt) {
      setErrorMessage('Describe the automation you want to generate.')
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const nextPlan = await generateAutomationPlan({
        workspace,
        route,
        prompt: sanitizedPrompt,
      })
      setPlan(nextPlan)
      toast({
        variant: 'success',
        title: 'Automation generated',
        description: 'AI created an implementation-ready plan.',
      })
    } catch (error) {
      const message = getApiErrorMessage(error, 'Unable to generate automation right now.')
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[75]">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]" onClick={handleClose} aria-hidden="true" />

      <div className="relative mx-auto mt-10 w-[min(94vw,56rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600/20 to-cyan-500/20">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-300" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">AI Automation Assistant</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {workspace} · <span className="font-mono">{route}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Close AI automation assistant"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid gap-4 p-4 md:grid-cols-[1fr_1.1fr]">
          <section className="space-y-3">
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                What should be automated?
              </span>
              <textarea
                ref={promptInputRef}
                value={prompt}
                onChange={(event) => {
                  setPrompt(event.target.value)
                  if (errorMessage) {
                    setErrorMessage(null)
                  }
                }}
                rows={9}
                placeholder="Example: Create automation that flags high-risk agents, sends Slack alert, and opens a review task with 24h SLA."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-600 dark:focus:ring-blue-900/40"
              />
            </label>

            {errorMessage ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={isSubmitting}
              className={cn(
                'inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 text-sm font-semibold text-white transition hover:brightness-105',
                isSubmitting && 'cursor-not-allowed opacity-75',
              )}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {isSubmitting ? 'Generating...' : 'Generate Automation Plan'}
            </button>
          </section>

          <section className="min-h-[18rem] rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/50">
            {plan ? (
              <div className="space-y-3">
                <div>
                  <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">{plan.title}</h4>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{plan.summary || 'No summary provided.'}</p>
                </div>

                <PlanSection title="Implementation Steps" items={plan.steps} />
                <PlanSection title="Safeguards" items={plan.safeguards} />
                <PlanSection title="Success Signals" items={plan.successSignals} />
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400">
                <Sparkles className="mb-2 h-5 w-5" />
                <p className="text-sm">AI output will appear here.</p>
                <p className="mt-1 text-xs">Provide your automation idea and generate a plan.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

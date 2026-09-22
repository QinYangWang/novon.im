/**
 * Toasts.
 *
 * A module-level store plus a `<Toaster />` drop-in, so a page can call
 * `toast({ title })` from anywhere without threading a provider through the tree.
 * Mount `<Toaster />` once, usually in a custom layout.
 */
import * as React from 'react'
import { Check, Info, TriangleAlert, X, XCircle } from 'lucide-react'
import { cn } from '../lib.ts'

export type ToastVariant = 'default' | 'info' | 'success' | 'warning' | 'destructive'

export interface ToastOptions {
  title: React.ReactNode
  description?: React.ReactNode
  variant?: ToastVariant
  /** Milliseconds before it dismisses itself. `0` keeps it until closed. */
  duration?: number
}

export interface ToastItem extends ToastOptions {
  id: string
}

let items: ToastItem[] = []
const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): ToastItem[] {
  return items
}

export function dismissToast(id: string): void {
  items = items.filter((item) => item.id !== id)
  emit()
}

/** Show a toast. Returns the id so it can be dismissed early. */
export function toast(options: ToastOptions): string {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  // An error carries information the reader may not have seen yet, so it stays
  // until they dismiss it. Everything else clears itself.
  const duration = options.duration ?? (options.variant === 'destructive' ? 0 : 5000)
  items = [...items, { variant: 'default', ...options, id }]
  emit()
  if (duration > 0) window.setTimeout(() => dismissToast(id), duration)
  return id
}

const VARIANTS: Record<ToastVariant, { icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  default: { icon: Info, tone: 'text-muted-foreground' },
  info: { icon: Info, tone: 'text-sky-600 dark:text-sky-400' },
  success: { icon: Check, tone: 'text-emerald-600 dark:text-emerald-400' },
  warning: { icon: TriangleAlert, tone: 'text-amber-600 dark:text-amber-400' },
  destructive: { icon: XCircle, tone: 'text-red-600 dark:text-red-400' },
}

const POSITIONS = {
  'bottom-right': 'bottom-4 right-4 items-end',
  'bottom-left': 'bottom-4 left-4 items-start',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
  'top-right': 'top-4 right-4 items-end',
  'top-left': 'top-4 left-4 items-start',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
} as const

export function Toaster({ position = 'bottom-right' }: { position?: keyof typeof POSITIONS }) {
  const toasts = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  if (toasts.length === 0) return null
  return (
    <div
      className={cn('pointer-events-none fixed z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2', POSITIONS[position])}
    >
      {toasts.map((item) => {
        const { icon: Icon, tone } = VARIANTS[item.variant ?? 'default']
        return (
          <div
            key={item.id}
            role="status"
            aria-live="polite"
            className="pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-border bg-popover p-3.5 text-popover-foreground shadow-lg"
          >
            <Icon className={cn('mt-0.5 size-4 shrink-0', tone)} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{item.title}</p>
              {item.description ? <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(item.id)}
              aria-label="Dismiss"
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

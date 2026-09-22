/**
 * `<Preview>` — the component documentation block.
 *
 * Each block pairs a live example with the MDX that produced it. A fenced
 * `mdx` code block placed among the children is lifted into the Code tab, so the
 * source is written once and rendered exactly as the pipeline highlighted it:
 *
 * ```mdx
 * <Preview title="Default" description="The primary action in a section.">
 *
 * <Button>Continue</Button>
 *
 * ```mdx
 * <Button>Continue</Button>
 * ```
 *
 * </Preview>
 * ```
 *
 * A `code` string is the fallback when no fenced block is present.
 */
import * as React from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from './lib.ts'

export interface PreviewProps {
  /** Short name for the example. */
  title?: React.ReactNode
  /** One line on when to use it. */
  description?: React.ReactNode
  /** MDX source, used when the children carry no fenced code block. */
  code?: string
  /** Which tab to show first. */
  defaultTab?: 'preview' | 'code'
  /** Align the example inside the canvas. */
  align?: 'center' | 'start'
  /** Extra classes for the canvas. */
  previewClassName?: string
  className?: string
  children?: React.ReactNode
}

const CODE_FIGURE = 'data-rehype-pretty-code-figure'

function isCodeFigure(node: React.ReactNode): boolean {
  if (!React.isValidElement(node)) return false
  const props = node.props as Record<string, unknown>
  return props?.[CODE_FIGURE] !== undefined
}

/** Whitespace-only text between JSX siblings is noise, not an example. */
function isBlank(node: React.ReactNode): boolean {
  return typeof node === 'string' && node.trim() === ''
}

export function Preview({
  title,
  description,
  code,
  defaultTab = 'preview',
  align = 'center',
  previewClassName,
  className,
  children,
}: PreviewProps) {
  const [tab, setTab] = React.useState<'preview' | 'code'>(defaultTab)
  const id = React.useId()
  const tabRefs = { preview: React.useRef<HTMLButtonElement>(null), code: React.useRef<HTMLButtonElement>(null) }

  const onTabKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const next = tab === 'preview' ? 'code' : 'preview'
    setTab(next)
    tabRefs[next].current?.focus()
  }

  const nodes = React.Children.toArray(children)
  const codeNode = nodes.find(isCodeFigure)
  const preview = nodes.filter((node) => node !== codeNode && !isBlank(node))

  return (
    <div className={cn('my-5', className)}>
      {title ? <p className="text-sm font-semibold text-foreground">{title}</p> : null}
      {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}

      <div className="mt-3 flex items-center gap-1 rounded-lg border border-border bg-card/60 p-0.5" role="tablist" aria-label="Example view">
        {(['preview', 'code'] as const).map((value) => (
          <button
            key={value}
            ref={tabRefs[value]}
            type="button"
            role="tab"
            id={`${id}-${value}-tab`}
            aria-selected={tab === value}
            aria-controls={`${id}-panel`}
            tabIndex={tab === value ? 0 : -1}
            onClick={() => setTab(value)}
            onKeyDown={onTabKeyDown}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
              tab === value ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {value}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-${tab}-tab`}
        className="mt-2 overflow-hidden rounded-xl border border-border"
      >
        {tab === 'preview' ? (
          <div
            className={cn(
              'novon-preview-canvas flex min-h-44 w-full flex-wrap gap-3 p-6',
              align === 'center' ? 'items-center justify-center' : 'items-start justify-start',
              previewClassName,
            )}
          >
            {preview}
          </div>
        ) : codeNode ? (
          <div className="bg-card/40 [&_figure]:m-0 [&_figure]:rounded-none [&_figure]:border-0">{codeNode}</div>
        ) : (
          <CodeFallback code={code} />
        )}
      </div>
    </div>
  )
}

function CodeFallback({ code }: { code?: string }) {
  const [copied, setCopied] = React.useState(false)
  const copy = async () => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be denied; leave the block alone.
    }
  }
  return (
    <div className="group/code relative bg-card/40">
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
        <code>{code ?? 'No code provided.'}</code>
      </pre>
      {code ? (
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? 'Copied' : 'Copy code'}
          className="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-md border border-border bg-card/80 text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover/code:opacity-100"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </button>
      ) : null}
    </div>
  )
}

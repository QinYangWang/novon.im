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
import * as stylex from '@stylexjs/stylex'
import { Check, Copy } from 'lucide-react'
import type { StyleXStyles } from '@stylexjs/stylex'
import { colors, elevation, radii, space, type } from './design-system/tokens.stylex.ts'
import { typography } from './design-system/typography.ts'
import type { StyleProps } from './design-system/props.ts'
import { copyText } from './actions.ts'
import { surface } from './design-system/surfaces.ts'

export interface PreviewProps extends StyleProps {
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
  /** Extra styles for the canvas. */
  previewXstyle?: StyleXStyles
  children?: React.ReactNode
}

const styles = stylex.create({
  block: { marginBlock: space.six },
  title: { color: colors.text },
  description: { color: colors.mutedText, marginTop: space.half },
  frame: {
    marginTop: space.three,
    overflow: 'hidden',
  },
  tablist: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: space.one,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: colors.border,
    paddingInline: space.two,
    paddingBlock: space.oneHalf,
  },
  // insetInlineStart: 0 is load-bearing: without it the absolute chip lands on
  // its static position and translateX double-counts the bar's padding.
  tabIndicator: (left: number, width: number) => ({
    position: 'absolute',
    insetInlineStart: 0,
    top: space.oneHalf,
    bottom: space.oneHalf,
    borderRadius: radii.control,
    backgroundColor: colors.popover,
    boxShadow: elevation.low,
    transform: `translateX(${left}px)`,
    width,
  }),
  tabIndicatorMotion: {
    transitionProperty: 'transform, width, opacity',
    transitionDuration: '220ms',
    transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
  },
  tab: {
    position: 'relative',
    display: 'inline-flex',
    height: space.eight,
    alignItems: 'center',
    borderRadius: radii.control,
    paddingInline: space.three,
    fontSize: type.caption,
    fontWeight: type.medium,
    lineHeight: type.compactLeading,
    textTransform: 'capitalize',
    outline: 'none',
    cursor: 'pointer',
    borderWidth: 0,
    borderStyle: 'none',
    transitionProperty: 'color, background-color',
    transitionDuration: '150ms',
    backgroundColor: { default: 'transparent', ':hover': colors.raisedHover },
    color: { default: colors.mutedText, ':hover': colors.text, '[data-selected]': colors.text },
  },
  canvas: {
    display: 'flex',
    width: '100%',
    minHeight: '11rem',
    flexWrap: 'wrap',
    gap: space.three,
    padding: space.six,
  },
  canvasCenter: { alignItems: 'center', justifyContent: 'center' },
  canvasStart: { alignItems: 'flex-start', justifyContent: 'flex-start' },
  codePanel: { minWidth: 0, backgroundColor: colors.surfaceSoft },
  fallback: { position: 'relative', backgroundColor: colors.surfaceSoft },
  fallbackPre: {
    overflowX: 'auto',
    padding: space.four,
    fontFamily: type.mono,
    fontSize: type.micro,
    lineHeight: 1.7,
    whiteSpace: 'pre-wrap',
  },
  copy: {
    position: 'absolute',
    top: space.two,
    insetInlineEnd: space.two,
    display: 'inline-flex',
    width: space.eight,
    height: space.eight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.control,
    backgroundColor: colors.popover,
    boxShadow: elevation.low,
    color: colors.mutedText,
    cursor: 'pointer',
    opacity: {
      default: 0,
      ':where([data-copy-host] :focus-visible)': 1,
      ':where([data-copy-host]:hover *)': 1,
      '@media (hover: none)': 1,
    },
    transitionProperty: 'opacity, color',
    transitionDuration: '150ms',
    ':hover': { color: colors.text },
  },
})

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
  previewXstyle,
  xstyle,
  children,
}: PreviewProps) {
  const [tab, setTab] = React.useState<'preview' | 'code'>(defaultTab)
  const id = React.useId()
  const tabRefs = { preview: React.useRef<HTMLButtonElement>(null), code: React.useRef<HTMLButtonElement>(null) }
  // One indicator shared across the two tabs, measured like PillNav's.
  const [indicator, setIndicator] = React.useState<{ left: number; width: number } | null>(null)
  React.useEffect(() => {
    const node = tabRefs[tab].current
    if (!node) return
    const measure = () =>
      setIndicator((previous) =>
        previous && previous.left === node.offsetLeft && previous.width === node.offsetWidth
          ? previous
          : { left: node.offsetLeft, width: node.offsetWidth },
      )
    measure()
    const resize = new ResizeObserver(measure)
    resize.observe(node.parentElement ?? node)
    return () => resize.disconnect()
  }, [tab])

  const onTabKeyDown = (event: React.KeyboardEvent) => {
    let next: 'preview' | 'code'
    switch (event.key) {
      // Arrows cycle between the two tabs; Home/End jump to the endpoints.
      case 'ArrowRight':
        next = tab === 'preview' ? 'code' : 'preview'
        break
      case 'ArrowLeft':
        next = tab === 'code' ? 'preview' : 'code'
        break
      case 'Home':
        next = 'preview'
        break
      case 'End':
        next = 'code'
        break
      default:
        return
    }
    event.preventDefault()
    setTab(next)
    tabRefs[next].current?.focus()
  }

  const nodes = React.Children.toArray(children)
  const codeNode = nodes.find(isCodeFigure)
  const preview = nodes.filter((node) => node !== codeNode && !isBlank(node))

  return (
    <div {...stylex.props(styles.block, xstyle)}>
      {title ? <p {...stylex.props(styles.title, typography.label)}>{title}</p> : null}
      {description ? <p {...stylex.props(styles.description, typography.labelRegular)}>{description}</p> : null}

      <div {...stylex.props(surface.raised, styles.frame)}>
        <div role="tablist" aria-label="Example view" {...stylex.props(styles.tablist)}>
          {indicator ? (
            <span aria-hidden="true" {...stylex.props(styles.tabIndicatorMotion, styles.tabIndicator(indicator.left, indicator.width))} />
          ) : null}
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
              {...stylex.props(styles.tab)}
            >
              {value}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${tab}-tab`} tabIndex={0}>
          {tab === 'preview' ? (
            // The marker is a zero-declaration content boundary around the
            // live example; the canvas below owns every compiled style.
            <div className="novon-not-prose">
              <div
                {...stylex.props(
                  surface.raisedInset,
                  styles.canvas,
                  align === 'center' ? styles.canvasCenter : styles.canvasStart,
                  previewXstyle,
                )}
              >
                {preview}
              </div>
            </div>
          ) : codeNode ? (
            <div data-preview-code="" {...stylex.props(styles.codePanel)}>
              {codeNode}
            </div>
          ) : (
            <CodeFallback code={code} />
          )}
        </div>
      </div>
    </div>
  )
}

function CodeFallback({ code }: { code?: string }) {
  const [copied, setCopied] = React.useState(false)
  const copy = async () => {
    if (!code) return
    if (!(await copyText(code))) return
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div data-copy-host="" {...stylex.props(styles.fallback)}>
      <pre {...stylex.props(styles.fallbackPre)}>
        <code>{code ?? 'No code provided.'}</code>
      </pre>
      {code ? (
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? 'Copied' : 'Copy code'}
          {...stylex.props(styles.copy)}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      ) : null}
    </div>
  )
}

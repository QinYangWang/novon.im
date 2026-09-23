/**
 * The novon component kit.
 *
 * One set of building blocks shared by the blog and the docs, so both templates
 * read as the same design system: monochrome surfaces, hairline alpha borders,
 * restrained radii and Geist typography, with restrained motion.
 *
 * Everything here is exported from `novon`, so a site can use the same pieces in
 * its own components and theme overrides. Composition happens through `xstyle`.
 */
import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import { ArrowUpRight } from 'lucide-react'
import type { StyleXStyles } from '@stylexjs/stylex'
import { colors, radii, space, theme, type as fontType } from './design-system/tokens.stylex.ts'
import { typography } from './design-system/typography.ts'
import type { ElementProps, StyleProps } from './design-system/props.ts'
import { isExternal, withBase } from './lib.ts'
import { copyText } from './actions.ts'
import { useBase, useConfig, useSite } from './site.tsx'
import { Icon, type IconProps } from './icons.tsx'

/* -------------------------------------------------------------------------- */
/* Layout primitives                                                          */
/* -------------------------------------------------------------------------- */

const styles = stylex.create({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  cluster: {
    display: 'flex',
    flexWrap: 'wrap',
    minWidth: 0,
  },
  stackGap: (gap: number) => ({ gap }),
  alignStart: { alignItems: 'flex-start' },
  alignCenter: { alignItems: 'center' },
  alignBaseline: { alignItems: 'baseline' },
})

/** A vertical flow. The container owns the gap; children add none. */
export function Stack({ gap = 16, xstyle, ...props }: ElementProps<'div'> & StyleProps & { gap?: number }) {
  return <div {...props} {...stylex.props(styles.stack, styles.stackGap(gap), xstyle)} />
}

/** A wrapping row of peers. The container owns the gap; children add none. */
export function Cluster({
  gap = 8,
  align = 'flex-start',
  xstyle,
  ...props
}: ElementProps<'div'> & StyleProps & { gap?: number; align?: 'flex-start' | 'center' | 'baseline' }) {
  return (
    <div
      {...props}
      {...stylex.props(
        styles.cluster,
        styles.stackGap(gap),
        align === 'center' ? styles.alignCenter : align === 'baseline' ? styles.alignBaseline : styles.alignStart,
        xstyle,
      )}
    />
  )
}

/* -------------------------------------------------------------------------- */
/* Motion helpers                                                             */
/* -------------------------------------------------------------------------- */

const revealStyles = stylex.create({
  // Hidden only once JS is known to be running (the theme mechanism variable),
  // so the page is fully readable without it.
  reveal: {
    opacity: 'var(--novon-reveal-opacity)',
    transform: 'translateY(var(--novon-reveal-y))',
    transitionProperty: 'opacity, transform',
    transitionDuration: '550ms',
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
  visible: { opacity: 1, transform: 'none' },
  delayed: (delay: number) => ({ transitionDelay: `${delay}ms` }),
})

/** Reveals its children once they scroll into view. */
export function Reveal({
  children,
  delay = 0,
  xstyle,
  as: Tag = 'div',
}: {
  children: React.ReactNode
  delay?: number
  xstyle?: StyleXStyles
  as?: 'div' | 'section' | 'li' | 'article'
}) {
  const ref = React.useRef<HTMLElement>(null)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    const element = ref.current
    if (!element) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.01 },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      ref={ref as never}
      data-visible={visible ? 'true' : undefined}
      {...stylex.props(
        revealStyles.reveal,
        visible && revealStyles.visible,
        delay > 0 && revealStyles.delayed(delay),
        xstyle,
      )}
    >
      {children}
    </Tag>
  )
}

const progressStyles = stylex.create({
  track: {
    width: '100%',
    height: space.half,
    overflow: 'hidden',
    borderRadius: radii.pill,
    backgroundColor: colors.border,
  },
  topTrack: {
    position: 'fixed',
    insetInline: 0,
    top: 0,
    zIndex: 50,
    height: space.half,
    backgroundColor: 'transparent',
  },
  bar: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.strong,
    opacity: 'var(--novon-progress-dim)',
    transformOrigin: '0 50%',
    transitionProperty: 'transform',
    transitionDuration: '120ms',
    transitionTimingFunction: 'linear',
  },
})

/**
 * Drives a progress bar's `scaleX` straight from the DOM, so a scroll frame
 * never re-renders React.
 */
function useScrollProgress(barRef: React.RefObject<HTMLElement | null>) {
  React.useEffect(() => {
    const paint = () => {
      const bar = barRef.current
      if (!bar) return
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollable > 1 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0
      bar.style.transform = `scaleX(${progress})`
    }

    let frame = 0
    const schedule = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        paint()
      })
    }

    paint()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : undefined
    observer?.observe(document.body)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      observer?.disconnect()
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [barRef])
}

/**
 * Reading progress as an inline bar, for embedding in the "On this page" panel
 * so the outline itself carries the progress instead of a separate top strip.
 */
export function ReadingProgress({ xstyle }: StyleProps) {
  const barRef = React.useRef<HTMLDivElement>(null)
  useScrollProgress(barRef)
  return (
    <div aria-hidden="true" data-novon-progress="inline" {...stylex.props(progressStyles.track, xstyle)}>
      <div ref={barRef} {...stylex.props(progressStyles.bar)} style={{ transform: 'scaleX(0)' }} />
    </div>
  )
}

/** Reading progress for the current page, pinned to the top of the viewport. */
export function ScrollProgress({ xstyle }: StyleProps) {
  const barRef = React.useRef<HTMLDivElement>(null)
  useScrollProgress(barRef)

  return (
    <div aria-hidden="true" data-novon-progress="top" {...stylex.props(progressStyles.topTrack, xstyle)}>
      <div ref={barRef} {...stylex.props(progressStyles.bar)} style={{ transform: 'scaleX(0)' }} />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Navigation                                                                 */
/* -------------------------------------------------------------------------- */

export interface PillNavItem {
  label: string
  href: string
}

/** `/` stays `/`; everything else loses its trailing slash. */
function normalizeHref(path: string): string {
  const trimmed = path.replace(/\/+$/, '')
  return trimmed === '' ? '/' : trimmed
}

/**
 * Index of the nav item matching `pathname`, or -1.
 *
 * Both sides are normalized, so `/`, `/blog/` and a configured `base` prefix all
 * compare correctly.
 */
export function activePillIndex(items: PillNavItem[], pathname: string, base = '/'): number {
  if (!pathname) return -1
  const prefix = base.replace(/\/$/, '')
  const path = normalizeHref(pathname)
  const stripped = prefix && path.startsWith(prefix) ? normalizeHref(path.slice(prefix.length)) : path
  return items.findIndex((item) => !isExternal(item.href) && normalizeHref(item.href) === stripped)
}

const pillStyles = stylex.create({
  nav: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: space.half,
    borderRadius: radii.surface,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    padding: space.one,
    backdropFilter: 'blur(8px)',
  },
  list: { position: 'relative', display: 'flex', alignItems: 'center', gap: space.half },
  indicator: (left: number, width: number) => ({
    position: 'absolute',
    top: space.one,
    bottom: space.one,
    borderRadius: radii.control,
    backgroundColor: colors.hover,
    transform: `translateX(${left}px)`,
    width,
  }),
  indicatorMotion: {
    transitionProperty: 'transform, width, opacity',
    transitionDuration: '320ms',
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
  item: {
    position: 'relative',
    borderRadius: radii.control,
    paddingInline: space.threeHalf,
    paddingBlock: space.oneHalf,
    fontSize: fontType.label,
    lineHeight: fontType.compactLeading,
    textDecoration: 'none',
    transitionProperty: 'color, background-color',
    transitionDuration: '150ms',
    color: { default: colors.mutedText, ':hover': colors.text },
  },
  itemActive: { fontWeight: fontType.medium, color: colors.text },
})

/**
 * Pill navigation with an indicator that slides between items.
 *
 * The indicator is measured after mount, so the server-rendered markup has none
 * and there is nothing to mismatch.
 */
export function PillNav({ items, xstyle }: { items: PillNavItem[]; xstyle?: StyleXStyles }) {
  const base = useBase()
  const config = useConfig()
  const listRef = React.useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = React.useState<{ left: number; width: number } | null>(null)
  const { url } = useSite()
  const pathname = withBase(base, url)

  const activeIndex = React.useMemo(
    () => (pathname ? activePillIndex(items, pathname, config.base) : -1),
    [items, pathname, config.base],
  )

  React.useEffect(() => {
    const list = listRef.current
    if (!list || activeIndex < 0) {
      setIndicator(null)
      return
    }
    const measure = () => {
      const target = list.children[activeIndex] as HTMLElement | undefined
      if (target) setIndicator({ left: target.offsetLeft, width: target.offsetWidth })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(list)
    return () => observer.disconnect()
  }, [activeIndex, items])

  return (
    <div {...stylex.props(pillStyles.nav, xstyle)}>
      {indicator ? (
        <span
          aria-hidden="true"
          {...stylex.props(pillStyles.indicatorMotion, pillStyles.indicator(indicator.left, indicator.width))}
        />
      ) : null}
      <div ref={listRef} {...stylex.props(pillStyles.list)}>
        {items.map((item, index) => (
          <a
            key={item.href}
            href={isExternal(item.href) ? item.href : withBase(base, item.href)}
            {...(isExternal(item.href) ? { target: '_blank', rel: 'noreferrer' } : {})}
            aria-current={index === activeIndex ? 'page' : undefined}
            {...stylex.props(pillStyles.item, index === activeIndex && pillStyles.itemActive)}
          >
            {item.label}
          </a>
        ))}
      </div>
    </div>
  )
}

const badgeStyles = stylex.create({
  box: {
    display: 'flex',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.surface,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  sm: { width: space.six, height: space.six },
  md: { width: space.eight, height: space.eight },
  lg: { width: space.ten, height: space.ten },
})

/** Rounded-square icon container, as used on cards and list rows. */
export function IconBadge({
  icon,
  size = 'md',
  xstyle,
}: {
  icon: IconProps['icon']
  size?: 'sm' | 'md' | 'lg'
  xstyle?: StyleXStyles
}) {
  return (
    <span {...stylex.props(badgeStyles.box, badgeStyles[size], xstyle)}>
      <Icon icon={icon} size={size === 'lg' ? 20 : 16} />
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* Structure                                                                  */
/* -------------------------------------------------------------------------- */

const sectionStyles = stylex.create({
  section: {
    paddingBlock: space.ten,
    paddingBlockStart: { default: space.ten, ':first-child': 0 },
  },
  headingRow: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: space.four,
    marginBlockEnd: space.three,
  },
})

/** A titled block with the generous vertical rhythm of the blog reference. */
export function Section({
  title,
  children,
  xstyle,
  id,
  action,
  headingLevel = 2,
}: {
  title?: React.ReactNode
  children: React.ReactNode
  xstyle?: StyleXStyles
  id?: string
  action?: React.ReactNode
  /**
   * Heading element for `title`. Use `1` when the section heading is the page's
   * main heading, as on the blog home and post list, which have no page title
   * of their own. The visual treatment stays the same either way.
   */
  headingLevel?: 1 | 2 | 3
}) {
  const Heading = `h${headingLevel}` as 'h1' | 'h2' | 'h3'
  return (
    <section id={id} {...stylex.props(sectionStyles.section, xstyle)}>
      {title ? (
        <div {...stylex.props(sectionStyles.headingRow)}>
          <Heading {...stylex.props(typography.heading)}>{title}</Heading>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  )
}

const pillLinkStyles = stylex.create({
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: space.oneHalf,
    borderRadius: radii.control,
    backgroundColor: { default: colors.subtle, ':hover': colors.hover },
    color: colors.text,
    paddingInline: space.twoHalf,
    paddingBlock: space.one,
    fontSize: fontType.label,
    lineHeight: fontType.compactLeading,
    textDecoration: 'none',
    transitionProperty: 'color, background-color',
    transitionDuration: '150ms',
  },
  arrow: { color: colors.mutedText },
  capitalize: { textTransform: 'capitalize' },
})

/** Pill-shaped arrow link, used for social and footer links. */
export function ArrowPill({
  href,
  children,
  xstyle,
  external = true,
}: {
  href: string
  children: React.ReactNode
  xstyle?: StyleXStyles
  external?: boolean
}) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...stylex.props(pillLinkStyles.pill, xstyle)}
    >
      {children}
      <ArrowUpRight aria-hidden="true" size={16} {...stylex.props(pillLinkStyles.arrow)} />
    </a>
  )
}

const socialStyles = stylex.create({
  row: { display: 'flex', flexWrap: 'wrap', gap: space.two },
})

/** Row of social pills, matching the blog reference's "Connect" block. */
export function SocialPills({ xstyle }: StyleProps) {
  const config = useConfig()
  // `email` is rendered as a mailto link by the footer, not as a pill.
  const social = Object.entries(config.theme.social ?? {}).filter(
    ([key, value]) => key !== 'email' && Boolean(value),
  )
  if (social.length === 0) return null
  return (
    <div {...stylex.props(socialStyles.row, xstyle)}>
      {social.map(([key, value]) => (
        <ArrowPill key={key} href={value as string} xstyle={pillLinkStyles.capitalize}>
          {key}
        </ArrowPill>
      ))}
    </div>
  )
}

const copyStyles = stylex.create({
  button: {
    whiteSpace: 'nowrap',
    fontSize: fontType.label,
    lineHeight: fontType.compactLeading,
    color: colors.mutedText,
    transitionProperty: 'color',
    transitionDuration: '150ms',
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderStyle: 'none',
    cursor: 'pointer',
    padding: 0,
    ':hover': { color: colors.text },
  },
})

/** Plain "Copy URL" action, as used in the blog post header. */
export function CopyUrlButton({ xstyle }: StyleProps) {
  const [copied, setCopied] = React.useState(false)

  const copy = async () => {
    const copied = await copyText(window.location.href)
    if (!copied) return
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button type="button" onClick={copy} {...stylex.props(copyStyles.button, typography.label, xstyle)}>
      {copied ? 'Copied' : 'Copy URL'}
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/* Theme                                                                      */
/* -------------------------------------------------------------------------- */

type ThemeChoice = 'system' | 'light' | 'dark'

/**
 * Flip the theme without cross-fading the whole page.
 *
 * A theme change touches color, background, border and shadow on almost every
 * element, so every transition fires at once and the switch smears. Disable
 * transitions for one frame, force a reflow, then restore them.
 */
function applyTheme(next: ThemeChoice): void {
  const root = document.documentElement
  const style = document.createElement('style')
  style.appendChild(document.createTextNode('*,*::before,*::after{transition:none !important}'))
  document.head.appendChild(style)

  if (next === 'system') {
    try {
      localStorage.removeItem('novon-theme')
    } catch {
      // ignore
    }
    root.dataset.theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } else {
    try {
      localStorage.setItem('novon-theme', next)
    } catch {
      // ignore
    }
    root.dataset.theme = next
  }

  // Force a reflow so the untransitioned colors are committed before restoring.
  void root.offsetHeight
  requestAnimationFrame(() => style.remove())
}

const THEME_CHOICES: { value: ThemeChoice; label: string; path: string }[] = [
  { value: 'system', label: 'System theme', path: 'M4 5h16v10H4zM9 19h6M12 15v4' },
  { value: 'light', label: 'Light theme', path: 'M12 4V2M12 22v-2M4 12H2M22 12h-2M6 6 4.5 4.5M19.5 19.5 18 18M18 6l1.5-1.5M4.5 19.5 6 18M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z' },
  { value: 'dark', label: 'Dark theme', path: 'M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z' },
]

const switchStyles = stylex.create({
  group: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: space.half,
    borderRadius: radii.surface,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    padding: space.half,
  },
  choice: {
    display: 'inline-flex',
    width: space.six,
    height: space.six,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.control,
    transitionProperty: 'color, background-color',
    transitionDuration: '150ms',
    color: { default: colors.mutedText, ':hover': colors.text },
    backgroundColor: 'transparent',
    cursor: 'pointer',
    borderWidth: 0,
    borderStyle: 'none',
  },
  choiceActive: { backgroundColor: colors.hover, color: colors.text },
  toggle: {
    display: 'inline-flex',
    width: space.eight,
    height: space.eight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.control,
    color: { default: colors.mutedText, ':hover': colors.text },
    transitionProperty: 'color, background-color',
    transitionDuration: '150ms',
    cursor: 'pointer',
    borderWidth: 0,
    borderStyle: 'none',
    backgroundColor: { default: 'transparent', ':hover': colors.hover },
  },
  lightOnly: { display: theme.lightOnly },
  darkOnly: { display: theme.darkOnly },
})

/** Three-way system/light/dark pill. */
export function ThemeSwitch({ xstyle }: StyleProps) {
  const [choice, setChoice] = React.useState<ThemeChoice>('system')

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('novon-theme')
      setChoice(stored === 'light' || stored === 'dark' ? stored : 'system')
    } catch {
      // ignore
    }
  }, [])

  const apply = (next: ThemeChoice) => {
    setChoice(next)
    applyTheme(next)
  }

  return (
    <div role="radiogroup" aria-label="Color theme" {...stylex.props(switchStyles.group, xstyle)}>
      {THEME_CHOICES.map(({ value, label, path }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={choice === value}
          aria-label={label}
          title={label}
          onClick={() => apply(value)}
          {...stylex.props(switchStyles.choice, choice === value && switchStyles.choiceActive)}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            width={14}
            height={14}
          >
            <path d={path} />
          </svg>
        </button>
      ))}
    </div>
  )
}

/** Single light/dark toggle, for the blog header. */
export function ThemeToggle({ xstyle }: StyleProps) {
  const [ready, setReady] = React.useState(false)
  React.useEffect(() => setReady(true), [])

  const toggle = () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle color theme"
      {...stylex.props(switchStyles.toggle, xstyle)}
      {...(ready ? {} : { tabIndex: -1, 'aria-hidden': true })}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        width={14}
        height={14}
        {...stylex.props(switchStyles.lightOnly)}
      >
        <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
      </svg>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        width={14}
        height={14}
        {...stylex.props(switchStyles.darkOnly)}
      >
        <path d="M12 4V2M12 22v-2M4 12H2M22 12h-2M6 6 4.5 4.5M19.5 19.5 18 18M18 6l1.5-1.5M4.5 19.5 6 18M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
      </svg>
    </button>
  )
}

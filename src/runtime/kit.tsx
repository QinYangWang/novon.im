/**
 * The novon component kit.
 *
 * One set of building blocks shared by the blog and the docs, so both templates
 * read as the same design system. The style follows the Vercel/Geist system:
 * monochrome surfaces, hairline alpha borders, restrained radii and Geist
 * typography, with restrained motion.
 *
 * Everything here is exported from `novon`, so a site can use the same pieces in
 * its own components and theme overrides.
 */
import * as React from 'react'
import { ArrowUpRight } from 'lucide-react'
import { cn, isExternal, withBase } from './lib.ts'
import { copyText } from './actions.ts'
import { useBase, useConfig } from './site.tsx'
import { Icon, type IconProps } from './icons.tsx'

/* -------------------------------------------------------------------------- */
/* Motion helpers                                                             */
/* -------------------------------------------------------------------------- */

/** Reveals its children once they scroll into view. */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = 'div',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
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
      className={cn('novon-reveal', className)}
      data-visible={visible ? 'true' : undefined}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  )
}

/** Reading progress for the current page, pinned to the top of the viewport. */
export function ScrollProgress({ className }: { className?: string }) {
  const barRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    // Paint straight to the DOM so a scroll frame never re-renders React.
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
  }, [])

  return (
    <div aria-hidden="true" className={cn('fixed inset-x-0 top-0 z-50 h-0.5', className)}>
      <div ref={barRef} className="novon-progress h-full bg-primary" style={{ transform: 'scaleX(0)' }} />
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

/**
 * Pill navigation with an indicator that slides between items.
 *
 * The indicator is measured after mount, so the server-rendered markup has none
 * and there is nothing to mismatch.
 */
export function PillNav({ items, className }: { items: PillNavItem[]; className?: string }) {
  const base = useBase()
  const config = useConfig()
  const listRef = React.useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = React.useState<{ left: number; width: number } | null>(null)
  const [pathname, setPathname] = React.useState('')

  React.useEffect(() => {
    setPathname(normalizeHref(window.location.pathname))
  }, [])

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
    <div
      className={cn(
        'relative inline-flex items-center gap-0.5 rounded-lg border border-border bg-card/60 p-1 backdrop-blur',
        className,
      )}
    >
      {indicator ? (
        <span
          aria-hidden="true"
          className="novon-pill-indicator absolute top-1 bottom-1 rounded-md bg-accent"
          style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }}
        />
      ) : null}
      <div ref={listRef} className="relative flex items-center gap-0.5">
        {items.map((item, index) => (
          <a
            key={item.href}
            href={isExternal(item.href) ? item.href : withBase(base, item.href)}
            {...(isExternal(item.href) ? { target: '_blank', rel: 'noreferrer' } : {})}
            aria-current={index === activeIndex ? 'page' : undefined}
            className={cn(
              'relative rounded-md px-3.5 py-1.5 text-sm no-underline transition-colors',
              index === activeIndex
                ? 'font-medium text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
          </a>
        ))}
      </div>
    </div>
  )
}

/** Rounded-square icon container, as used on cards and list rows. */
export function IconBadge({ icon, className, size = 'md' }: { icon: IconProps['icon']; className?: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg border border-border bg-card text-foreground',
        size === 'sm' ? 'size-7' : size === 'lg' ? 'size-11' : 'size-9',
        className,
      )}
    >
      <Icon icon={icon} className={size === 'sm' ? 'size-3.5' : size === 'lg' ? 'size-5' : 'size-4'} />
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* Structure                                                                  */
/* -------------------------------------------------------------------------- */

/** A titled block with the generous vertical rhythm of the blog reference. */
export function Section({
  title,
  children,
  className,
  id,
  action,
  headingLevel = 2,
}: {
  title?: React.ReactNode
  children: React.ReactNode
  className?: string
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
    <section id={id} className={cn('py-10 first:pt-0', className)}>
      {title ? (
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <Heading className="text-lg font-medium tracking-tight text-foreground">{title}</Heading>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  )
}

/** Pill-shaped arrow link, used for social and footer links. */
export function ArrowPill({
  href,
  children,
  className,
  external = true,
}: {
  href: string
  children: React.ReactNode
  className?: string
  external?: boolean
}) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1 text-sm text-foreground no-underline transition-colors hover:bg-accent',
        className,
      )}
    >
      {children}
      <ArrowUpRight aria-hidden="true" className="size-3.5 text-muted-foreground" />
    </a>
  )
}

/** Row of social pills, matching the blog reference's "Connect" block. */
export function SocialPills({ className }: { className?: string }) {
  const config = useConfig()
  // `email` is rendered as a mailto link by the footer, not as a pill.
  const social = Object.entries(config.theme.social ?? {}).filter(
    ([key, value]) => key !== 'email' && Boolean(value),
  )
  if (social.length === 0) return null
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {social.map(([key, value]) => (
        <ArrowPill key={key} href={value as string} className="capitalize">
          {key}
        </ArrowPill>
      ))}
    </div>
  )
}

/** Plain "Copy URL" action, as used in the blog post header. */
export function CopyUrlButton({ className }: { className?: string }) {
  const [copied, setCopied] = React.useState(false)

  const copy = async () => {
    const copied = await copyText(window.location.href)
    if (!copied) return
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        'whitespace-nowrap text-sm text-muted-foreground transition-colors hover:text-foreground',
        className,
      )}
    >
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

/** Three-way system/light/dark pill. */
export function ThemeSwitch({ className }: { className?: string }) {
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
    <div
      role="radiogroup"
      aria-label="Color theme"
      className={cn('inline-flex items-center gap-0.5 rounded-lg border border-border bg-card/60 p-0.5', className)}
    >
      {THEME_CHOICES.map(({ value, label, path }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={choice === value}
          aria-label={label}
          title={label}
          onClick={() => apply(value)}
          className={cn(
            'inline-flex size-6 items-center justify-center rounded-md transition-colors',
            choice === value ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
            <path d={path} />
          </svg>
        </button>
      ))}
    </div>
  )
}

/** Single light/dark toggle, for the blog header. */
export function ThemeToggle({ className }: { className?: string }) {
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
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
        className,
      )}
      {...(ready ? {} : { tabIndex: -1, 'aria-hidden': true })}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-3.5 dark:hidden">
        <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
      </svg>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="hidden size-3.5 dark:block">
        <path d="M12 4V2M12 22v-2M4 12H2M22 12h-2M6 6 4.5 4.5M19.5 19.5 18 18M18 6l1.5-1.5M4.5 19.5 6 18M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
      </svg>
    </button>
  )
}

/**
 * Built-in theme.
 *
 * Both layout layers are built from the same kit (`./kit.tsx`), so the blog and the
 * docs share one visual language: monochrome surfaces, hairline borders,
 * restrained radii and Geist typography.
 *
 * - `blog` — a narrow single column in the style of a personal site: name and
 *   role, a section of posts written as title + description, and a "Connect"
 *   block of arrow pills.
 * - `docs` — a full-height sidebar rail, a content header with page actions, an
 *   "On this page" column and previous/next cards.
 *
 * Every part goes through `useOverride()`, so a site can swap any of them from
 * `novon.config.ts`:
 *
 * ```ts
 * theme: { override: { Header: './theme/Header.tsx' } }
 * ```
 */
import * as React from 'react'
import { ArrowUpRight, Check, ChevronDown, ChevronLeft, ChevronRight, Copy, List as ListIcon, Loader2, Menu, Pencil, PanelLeft, X } from 'lucide-react'
import type { Frontmatter, Route, RuntimeConfig, ThemeOverrides, TocEntry } from '../types.ts'
import { cn, formatDate, isExternal, tagSlug, withBase } from './lib.ts'
import { markdownPath } from '../paths.ts'
import { blogIndexPath, blogTagsPath } from '../layers.ts'
import { useBase, useConfig, useSite } from './site.tsx'
import { SearchTrigger } from './search.tsx'
import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger, Badge, Dialog, DialogClose, DialogContent, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, ScrollArea } from './ui.tsx'
import { Icon } from './icons.tsx'
import { SvglIcon } from './svgl.tsx'
import { copyText, isMarkdownDocument } from './actions.ts'
import { TOC_READING_OFFSET, hashToId, initialActiveHeading, resolveActiveHeading, type HeadingOffset } from './toc.ts'
import { CopyUrlButton, PillNav, Reveal, ScrollProgress, Section, SocialPills, ThemeSwitch, ThemeToggle } from './kit.tsx'
import type { NavNode, PageLink, SiteIndex } from './content.ts'

export { ThemeSwitch, ThemeToggle } from './kit.tsx'

const OverrideContext = React.createContext<ThemeOverrides>({})

export function OverrideProvider({ value, children }: { value: ThemeOverrides; children: React.ReactNode }) {
  return <OverrideContext.Provider value={value}>{children}</OverrideContext.Provider>
}

export function useOverride<K extends keyof ThemeOverrides>(
  name: K,
  fallback: React.ComponentType<any>,
): React.ComponentType<any> {
  const overrides = React.useContext(OverrideContext)
  return (overrides?.[name] as React.ComponentType<any>) ?? fallback
}

/** Inline because lucide dropped brand icons. */
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="currentColor" className={cn('size-4', className)}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/* Brand                                                                      */
/* -------------------------------------------------------------------------- */

export function Brand({ className, showTitle = true }: { className?: string; showTitle?: boolean }) {
  const config = useConfig()
  const base = useBase()
  const logo = config.theme.logo
  const logoDark = config.theme.logoDark
  return (
    <a
      href={withBase(base, '/')}
      className={cn('flex items-center gap-2 text-sm font-semibold no-underline', className)}
    >
      {logo ? (
        <span className="flex size-6 shrink-0 items-center justify-center">
          <img src={withBase(base, logo)} alt="" className={cn('size-6', logoDark && 'dark:hidden')} />
          {logoDark ? <img src={withBase(base, logoDark)} alt="" className="hidden size-6 dark:block" /> : null}
        </span>
      ) : null}
      {showTitle ? <span className="truncate">{config.title}</span> : null}
    </a>
  )
}

/* -------------------------------------------------------------------------- */
/* Blog header and footer                                                     */
/* -------------------------------------------------------------------------- */

/** Name, role, navigation pills and the reading controls. */
export function DefaultHeader({ className }: { className?: string }) {
  const config = useConfig()
  const items =
    config.nav.length > 0
      ? config.nav.map((item) => ({ label: item.label, href: item.href }))
      : [{ label: 'home', href: '/' }]

  return (
    <header className={cn('flex flex-col gap-6', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-base font-medium text-foreground">{config.title}</p>
          {config.description ? (
            <p className="text-muted-foreground">{config.description}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <CopyUrlButton />
          {config.theme.darkMode ? <ThemeToggle /> : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <PillNav items={items} />
        {config.features.search ? <SearchTrigger className="ml-auto w-36" /> : null}
      </div>
    </header>
  )
}

export function DefaultFooter({ className, variant = 'blog' }: { className?: string; variant?: 'blog' | 'docs' }) {
  const config = useConfig()
  const base = useBase()
  const footer = config.theme.footer ?? {}
  if (variant === 'docs') return null

  const email = config.theme.social?.email
  const links = footer.links ?? []
  const pills: { label: string; href: string; external: boolean }[] = [
    ...(config.features.rss ? [{ label: 'rss', href: withBase(base, '/rss.xml'), external: false }] : []),
    ...links.map((link) => ({
      label: link.label,
      href: isExternal(link.href) ? link.href : withBase(base, link.href),
      external: isExternal(link.href),
    })),
  ]

  return (
    <footer className={cn('pt-6', className)}>
      <Section title="Connect">
        {email ? (
          <p className="text-muted-foreground">
            Feel free to contact me at{' '}
            <a href={`mailto:${email}`} className="text-foreground underline underline-offset-4">
              {email}
            </a>
          </p>
        ) : null}
        <SocialPills className={email ? 'mt-5' : ''} />
        {pills.length > 0 ? (
          <div className={cn('flex flex-wrap gap-2', email || pills.length > 0 ? 'mt-5' : '')}>
            {pills.map((pill) => (
              <a
                key={pill.href}
                href={pill.href}
                {...(pill.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1 text-sm text-foreground no-underline transition-colors hover:bg-accent"
              >
                {pill.label}
                <ArrowUpRight aria-hidden="true" className="size-3.5 text-muted-foreground" />
              </a>
            ))}
          </div>
        ) : null}
      </Section>
      <p className="pt-2 text-sm text-muted-foreground">
        {footer.text ?? `© ${new Date().getFullYear()} ${config.title}`}
      </p>
    </footer>
  )
}

/* -------------------------------------------------------------------------- */
/* Docs sidebar                                                               */
/* -------------------------------------------------------------------------- */

function isActive(navPath: string, current: string): boolean {
  return navPath === current
}

function NavLink({
  item,
  current,
  onNavigate,
  indent = false,
}: {
  item: PageLink & { icon?: string }
  current: string
  onNavigate?: () => void
  indent?: boolean
}) {
  const base = useBase()
  const active = isActive(item.path, current)
  return (
    <a
      href={withBase(base, item.path)}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex w-full items-center gap-2 rounded-md py-1.5 pr-3 text-sm no-underline transition-colors',
        indent ? 'pl-6' : 'pl-2.5',
        active
          ? 'bg-accent font-medium text-foreground'
          : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
      )}
    >
      {item.icon ? <Icon icon={item.icon} className="size-4 shrink-0 opacity-80" /> : null}
      <span className="truncate">{item.label}</span>
    </a>
  )
}

/** Depth ≥2 groups collapse; depth 1 renders as a labelled section. */
function NavTree({
  nodes,
  current,
  onNavigate,
  depth = 0,
}: {
  nodes: NavNode[]
  current: string
  onNavigate?: () => void
  depth?: number
}) {
  const contains = (node: NavNode): boolean =>
    node.kind === 'page' ? isActive(node.path, current) : node.path === current || node.children.some(contains)

  return (
    <ul className="space-y-0.5">
      {nodes.map((node) => {
        if (node.kind === 'page') {
          return (
            <li key={node.path}>
              <NavLink item={node} current={current} onNavigate={onNavigate} indent={depth > 0} />
            </li>
          )
        }

        if (depth === 0) {
          // A section: a label, then its pages.
          return (
            <li key={node.label} className="pt-4 first:pt-1">
              <p className="px-2.5 pb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {node.label}
              </p>
              <NavTree nodes={node.children} current={current} onNavigate={onNavigate} depth={depth + 1} />
            </li>
          )
        }

        return <NestedNavGroup key={node.label} node={node} active={contains(node)} current={current} onNavigate={onNavigate} depth={depth} />
      })}
    </ul>
  )
}

/** Preserve disclosures, but reveal a new destination reached from search/history. */
function NestedNavGroup({ node, active, current, onNavigate, depth }: {
  node: Extract<NavNode, { kind: 'group' }>
  active: boolean
  current: string
  onNavigate?: () => void
  depth: number
}) {
  const [open, setOpen] = React.useState<string[]>(active ? ['group'] : [])
  React.useEffect(() => { if (active) setOpen(['group']) }, [active, current])
  return (
    <li>
      <Accordion value={open} onValueChange={setOpen}>
        <AccordionItem value="group" className="border-0 py-0">
          <AccordionTrigger className="gap-2 rounded-md py-1.5 pl-2.5 pr-3 text-sm font-normal text-muted-foreground hover:bg-accent/60 hover:text-foreground">
            <span className="flex min-w-0 items-center gap-2">
              {node.icon ? <Icon icon={node.icon} className="size-4 shrink-0 opacity-80" /> : null}
              <span className="truncate">{node.label}</span>
            </span>
          </AccordionTrigger>
          <AccordionPanel className="pb-0">
            <div className="pl-1">
              <NavTree nodes={node.children} current={current} onNavigate={onNavigate} depth={depth + 1} />
            </div>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </li>
  )
}

/** The full-height rail: brand, search, navigation, utility bar. */
export function DefaultSidebar({
  nav,
  current,
  onNavigate,
  onCollapse,
  className,
}: {
  nav: NavNode[]
  current: string
  onNavigate?: () => void
  onCollapse?: () => void
  className?: string
}) {
  const config = useConfig()
  const social = config.theme.social ?? {}

  return (
    <div className={cn('flex h-full flex-col bg-card/40', className)}>
      <div className="flex h-14 shrink-0 items-center gap-2 px-4">
        <Brand />
        {onCollapse ? (
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Collapse sidebar"
            aria-expanded="true"
            aria-controls="novon-sidebar"
            title="Collapse sidebar"
            className="ml-auto inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <PanelLeft aria-hidden="true" className="size-3.5" />
          </button>
        ) : null}
      </div>

      {config.features.search ? (
        <div className="shrink-0 px-3 pb-2">
          <SearchTrigger className="w-full" />
        </div>
      ) : null}

      <nav aria-label="Documentation" className="novon-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-6">
        {nav.length > 0 ? <NavTree nodes={nav} current={current} onNavigate={onNavigate} /> : null}
      </nav>

      <div className="flex h-12 shrink-0 items-center justify-between border-t border-border px-3">
        {social.github ? (
          <a
            href={social.github}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <GithubIcon className="size-3.5" />
          </a>
        ) : (
          <span />
        )}
        {config.theme.darkMode ? <ThemeSwitch /> : null}
      </div>
    </div>
  )
}

/** Mobile-only top bar for the docs layout. */
export function DefaultDocsHeader({ onToggleNav, navOpen }: { onToggleNav?: () => void; navOpen?: boolean }) {
  const config = useConfig()
  const base = useBase()
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md lg:hidden">
      {onToggleNav ? (
        <button
          type="button"
          onClick={onToggleNav}
          aria-label={navOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={navOpen}
          aria-controls="novon-mobile-sidebar"
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {navOpen ? <X aria-hidden="true" className="size-3.5" /> : <Menu aria-hidden="true" className="size-3.5" />}
        </button>
      ) : null}
      <Brand />
      <nav className="ml-2 hidden items-center gap-0.5 sm:flex">
        {config.nav.map((item) => (
          <a
            key={item.href}
            href={isExternal(item.href) ? item.href : withBase(base, item.href)}
            {...(isExternal(item.href) ? { target: '_blank', rel: 'noreferrer' } : {})}
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground no-underline transition-colors hover:bg-accent hover:text-foreground"
          >
            {item.label}
          </a>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-1">
        {config.features.search ? <SearchTrigger className="size-8 justify-center p-0 sm:w-44 sm:justify-start sm:px-3" /> : null}
        {config.theme.darkMode ? <ThemeToggle /> : null}
      </div>
    </header>
  )
}

/* -------------------------------------------------------------------------- */
/* Table of contents                                                          */
/* -------------------------------------------------------------------------- */

export function DefaultTableOfContents({ headings, className }: { headings: TocEntry[]; className?: string }) {
  const [activeId, setActiveId] = React.useState('')
  const listRef = React.useRef<HTMLUListElement>(null)
  const offsetsRef = React.useRef<HeadingOffset[]>([])
  const frameRef = React.useRef<number | null>(null)
  const pendingRef = React.useRef<{ id: string; until: number } | null>(null)

  React.useEffect(() => {
    const measure = (): HeadingOffset[] => {
      const result: HeadingOffset[] = []
      for (const heading of headings) {
        const element = document.getElementById(heading.id)
        if (element) result.push({ id: heading.id, top: element.getBoundingClientRect().top + window.scrollY })
      }
      return result
    }

    offsetsRef.current = measure()
    pendingRef.current = null
    setActiveId(initialActiveHeading(offsetsRef.current, window.location.hash))
    const hashId = hashToId(window.location.hash)
    if (hashId) pendingRef.current = { id: hashId, until: performance.now() + 1500 }

    const update = () => {
      frameRef.current = null
      const offsets = offsetsRef.current
      if (offsets.length === 0) return
      const pending = pendingRef.current
      if (pending) {
        if (performance.now() >= pending.until) {
          pendingRef.current = null
        } else {
          // A click or hash jump owns the active state until the destination is
          // reached, so a long smooth scroll cannot flicker through sections.
          const target = offsets.find((offset) => offset.id === pending.id)
          const readingLine = window.scrollY + TOC_READING_OFFSET
          if (!target || Math.abs(target.top - readingLine) <= 2) pendingRef.current = null
          else return
        }
      }
      const next = resolveActiveHeading(offsets, {
        scrollY: window.scrollY,
        viewportHeight: window.innerHeight,
        scrollHeight: document.documentElement.scrollHeight,
      })
      setActiveId((previous) => (previous === next ? previous : next))
    }

    const schedule = () => {
      if (frameRef.current !== null) return
      frameRef.current = window.requestAnimationFrame(update)
    }

    const remeasure = () => {
      offsetsRef.current = measure()
      schedule()
    }

    // Any real user scroll takes ownership back from a pending click/hash jump.
    const release = () => {
      pendingRef.current = null
    }

    const onHashChange = () => {
      const id = hashToId(window.location.hash)
      if (!id || !offsetsRef.current.some((offset) => offset.id === id)) return
      pendingRef.current = { id, until: performance.now() + 1500 }
      setActiveId(id)
    }

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', remeasure, { passive: true })
    window.addEventListener('wheel', release, { passive: true })
    window.addEventListener('touchstart', release, { passive: true })
    window.addEventListener('keydown', release)
    window.addEventListener('hashchange', onHashChange)

    let observer: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(remeasure)
      observer.observe(document.body)
    }
    document.fonts?.ready.then(remeasure).catch(() => {})

    update()

    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', remeasure)
      window.removeEventListener('wheel', release)
      window.removeEventListener('touchstart', release)
      window.removeEventListener('keydown', release)
      window.removeEventListener('hashchange', onHashChange)
      observer?.disconnect()
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current)
    }
  }, [headings])

  // Keep the active link inside the TOC's own scroll box without scrolling the page.
  React.useEffect(() => {
    if (!activeId) return
    const list = listRef.current
    if (!list) return
    const link = Array.from(list.querySelectorAll<HTMLAnchorElement>('a')).find(
      (candidate) => candidate.dataset.tocId === activeId,
    )
    if (!link) return
    const container = scrollableParent(link)
    if (!container) return
    const containerRect = container.getBoundingClientRect()
    const linkRect = link.getBoundingClientRect()
    const pad = 8
    if (linkRect.top < containerRect.top + pad) {
      container.scrollTop -= containerRect.top + pad - linkRect.top
    } else if (linkRect.bottom > containerRect.bottom - pad) {
      container.scrollTop += linkRect.bottom - (containerRect.bottom - pad)
    }
  }, [activeId])

  if (headings.length === 0) return null

  const markActive = (id: string) => {
    pendingRef.current = { id, until: performance.now() + 1500 }
    setActiveId(id)
  }

  return (
    <nav aria-label="On this page" className={cn('text-sm', className)}>
      <p className="flex items-center gap-2 font-medium text-foreground">
        <ListIcon aria-hidden="true" className="size-4 text-muted-foreground" />
        On this page
      </p>
      <ul ref={listRef} className="mt-3 border-l border-border">
        {headings.map((heading, index) => {
          const active = activeId === heading.id
          return (
            <li key={heading.id} className={cn(heading.depth === 2 && index > 0 && 'mt-2')}>
              <a
                href={`#${heading.id}`}
                data-toc-id={heading.id}
                onClick={() => markActive(heading.id)}
                aria-current={active ? 'location' : undefined}
                className={cn(
                  '-ml-px block border-l-2 py-1 pr-2 no-underline transition-colors',
                  heading.depth === 2 ? 'pl-3' : heading.depth === 3 ? 'pl-6' : 'pl-9 text-[0.8125rem]',
                  active
                    ? 'border-primary font-medium text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {heading.text}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** Nearest ancestor that scrolls vertically, if any. */
function scrollableParent(element: HTMLElement): HTMLElement | null {
  let parent = element.parentElement
  while (parent) {
    const overflow = getComputedStyle(parent).overflowY
    if ((overflow === 'auto' || overflow === 'scroll') && parent.scrollHeight > parent.clientHeight) return parent
    parent = parent.parentElement
  }
  return null
}

/* -------------------------------------------------------------------------- */
/* Page chrome                                                                */
/* -------------------------------------------------------------------------- */

function markdownUrl(base: string, path: string): string {
  return withBase(base, `/${markdownPath(path)}`)
}

type CopyState = 'idle' | 'copying' | 'copied' | 'error'

const AI_PROMPT = 'Read this documentation page and explain it:'

/**
 * "Copy Markdown" and "Open" — reads the `.md` file served for every route.
 *
 * The copy path validates the response before touching the clipboard, falls back
 * to a textarea on insecure origins, and recovers visibly when either step
 * fails. AI links are plain anchors, so they cannot be blocked as popups.
 */
export function PageActions({ path }: { path: string }) {
  const base = useBase()
  const url = markdownUrl(base, path)
  const [state, setState] = React.useState<CopyState>('idle')
  const [error, setError] = React.useState('')
  const [source, setSource] = React.useState('')
  const [absolute, setAbsolute] = React.useState(url)
  const textRef = React.useRef<string | null>(null)
  const controllerRef = React.useRef<AbortController | null>(null)
  const timerRef = React.useRef<number | null>(null)
  const requestRef = React.useRef(0)

  // The AI prompts need an absolute URL; resolve it after mount so SSR and the
  // first client render agree.
  React.useEffect(() => {
    setAbsolute(new URL(url, window.location.href).href)
  }, [url])

  // Abort in-flight work and drop page-local state when the URL changes.
  React.useEffect(() => {
    textRef.current = null
    setState('idle')
    setError('')
    setSource('')
    return () => {
      requestRef.current += 1
      controllerRef.current?.abort()
      controllerRef.current = null
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [url])

  const load = React.useCallback(async (): Promise<string> => {
    if (textRef.current !== null) return textRef.current
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: 'text/markdown, text/plain, */*' },
    })
    if (!response.ok) throw new Error(`The Markdown source is unavailable (HTTP ${response.status}).`)
    const text = await response.text()
    if (!isMarkdownDocument(text, response.headers.get('content-type'))) {
      throw new Error('The Markdown source could not be verified.')
    }
    textRef.current = text
    controllerRef.current = null
    return text
  }, [url])

  const copy = async () => {
    const request = ++requestRef.current
    setState('copying')
    setError('')
    try {
      const text = await load()
      if (request !== requestRef.current) return
      const copied = await copyText(text)
      if (request !== requestRef.current) return
      if (!copied) throw new Error('clipboard')
      setState('copied')
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => setState('idle'), 2000)
    } catch (cause) {
      if (request !== requestRef.current) return
      if (cause instanceof Error && cause.name === 'AbortError') return
      setState('error')
      setError(
        cause instanceof Error && cause.message === 'clipboard'
          ? 'Clipboard access is blocked. Select the Markdown below instead.'
          : cause instanceof Error
            ? cause.message
            : 'Could not copy the Markdown.',
      )
      if (cause instanceof Error && cause.message === 'clipboard' && textRef.current !== null) {
        setSource(textRef.current)
      } else {
        setSource('')
      }
    }
  }

  const chatgpt = `https://chatgpt.com/?q=${encodeURIComponent(`${AI_PROMPT} ${absolute}`)}`
  const claude = `https://claude.ai/new?q=${encodeURIComponent(`${AI_PROMPT} ${absolute}`)}`

  return (
    <div className="mt-6 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copy}
          disabled={state === 'copying'}
          className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-card/60 px-3.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60"
        >
          {state === 'copied' ? (
            <Check aria-hidden="true" className="size-3.5" />
          ) : state === 'copying' ? (
            <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
          ) : (
            <Copy aria-hidden="true" className="size-3.5" />
          )}
          {state === 'copied'
            ? 'Copied'
            : state === 'copying'
              ? 'Copying…'
              : state === 'error'
                ? 'Retry copy'
                : 'Copy Markdown'}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card/60 px-3.5 text-sm font-medium transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
            Open
            <ChevronDown aria-hidden="true" className="size-3.5 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Raw source</DropdownMenuLabel>
            <DropdownMenuItem render={<a href={url} target="_blank" rel="noreferrer" />}>
              <SvglIcon name="markdown" />
              <span className="flex-1">View Markdown</span>
              <ArrowUpRight aria-hidden="true" className="size-3.5 text-muted-foreground" />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Ask an AI</DropdownMenuLabel>
            <DropdownMenuItem render={<a href={chatgpt} target="_blank" rel="noreferrer" />}>
              <SvglIcon name="openai" />
              <span className="flex-1">Open in ChatGPT</span>
              <ArrowUpRight aria-hidden="true" className="size-3.5 text-muted-foreground" />
            </DropdownMenuItem>
            <DropdownMenuItem render={<a href={claude} target="_blank" rel="noreferrer" />}>
              <SvglIcon name="claude" />
              <span className="flex-1">Open in Claude</span>
              <ArrowUpRight aria-hidden="true" className="size-3.5 text-muted-foreground" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <span role="status" aria-live="polite" className="text-sm text-muted-foreground">
        {state === 'copied' ? 'Markdown copied' : state === 'error' ? error : ''}
      </span>

      {state === 'error' && source ? (
        <label className="block text-sm text-muted-foreground">
          Select the Markdown below and copy it manually.
          <textarea
            readOnly
            value={source}
            onFocus={(event) => event.currentTarget.select()}
            className="novon-scroll mt-1 h-32 w-full resize-y rounded-md border border-border bg-card/60 p-2 font-mono text-xs text-foreground"
          />
        </label>
      ) : null}
    </div>
  )
}

/** Title, description and page actions, as used by the docs layout. */
export function PageHeading({
  title,
  description,
  meta,
  path,
  actions = false,
  className,
}: {
  title: string
  description?: string
  meta?: Frontmatter
  path?: string
  actions?: boolean
  className?: string
}) {
  const config = useConfig()
  const date = formatDate(meta?.date, config.language)
  const author = typeof meta?.author === 'string' ? meta.author : (meta?.author?.name ?? config.author)

  return (
    <header className={cn('space-y-3', className)}>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
      {description ? <p className="text-lg text-muted-foreground">{description}</p> : null}
      {(date || author || (meta?.tags?.length ?? 0) > 0) && !actions ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {date ? <time dateTime={String(meta?.date)}>{date}</time> : null}
          {author ? <span>{author}</span> : null}
          {(meta?.tags ?? []).map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}
      {actions && path ? <PageActions key={path} path={path} /> : null}
      {meta?.draft === true ? <Badge variant="warning">Draft</Badge> : null}
    </header>
  )
}

/** The MDX article body. */
export function Prose({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('novon-prose', className)}>{children}</div>
}

/** Previous / next cards plus "last updated" and "edit this page". */
export function PageNav({
  links,
  current,
  meta,
  file,
}: {
  links: PageLink[]
  current: string
  meta?: Frontmatter
  file?: string
}) {
  const config = useConfig()
  const base = useBase()
  const index = links.findIndex((link) => link.path === current)
  const previous = index > 0 ? links[index - 1] : undefined
  const next = index >= 0 ? links[index + 1] : undefined

  const editBase = config.theme.editLink?.base
  const editHref = editBase && file ? `${editBase.replace(/\/$/, '')}/${file.replace(/^\//, '')}` : undefined
  const updated = formatDate(meta?.updated ?? meta?.date, config.language)

  return (
    <div className="mt-12 space-y-6">
      {previous || next ? (
        <nav aria-label="Pagination" className="grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
          {previous ? (
            <a
              href={withBase(base, previous.path)}
              className="group flex flex-col gap-1 rounded-xl border border-border p-4 no-underline transition-colors hover:bg-accent/50"
            >
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <ChevronLeft aria-hidden="true" className="size-3.5" />
                Previous
              </span>
              <span className="font-medium text-foreground">{previous.label}</span>
            </a>
          ) : (
            <span />
          )}
          {next ? (
            <a
              href={withBase(base, next.path)}
              className="group flex flex-col items-end gap-1 rounded-xl border border-border p-4 text-right no-underline transition-colors hover:bg-accent/50"
            >
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                Next
                <ChevronRight aria-hidden="true" className="size-3.5" />
              </span>
              <span className="font-medium text-foreground">{next.label}</span>
            </a>
          ) : null}
        </nav>
      ) : null}

      {editHref || updated ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          {editHref ? (
            <a
              href={editHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 no-underline hover:text-foreground"
            >
              <Pencil aria-hidden="true" className="size-3.5" />
              {config.theme.editLink?.label ?? 'Edit this page'}
            </a>
          ) : (
            <span />
          )}
          {updated ? <span>Last updated on {updated}</span> : null}
        </div>
      ) : null}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Blog                                                                       */
/* -------------------------------------------------------------------------- */

function postLabel(route: Route): string {
  return route.meta.label ?? route.meta.title ?? route.segments[route.segments.length - 1] ?? ''
}

/** One row of the blog list: title, then description. */
export function PostItem({ route, className }: { route: Route; className?: string }) {
  const base = useBase()
  return (
    <a
      href={withBase(base, route.path)}
      className={cn(
        '-mx-2 block rounded-lg px-2 py-3 no-underline transition-colors hover:bg-accent/50 focus-visible:bg-accent/50',
        className,
      )}
    >
      <p className="font-medium text-foreground">{postLabel(route)}</p>
      {route.meta.description ? (
        <p className="mt-0.5 text-muted-foreground">{route.meta.description}</p>
      ) : null}
    </a>
  )
}

export function PostList({
  posts,
  title,
  empty,
  className,
}: {
  posts: Route[]
  title?: string
  empty?: string
  className?: string
}) {
  if (posts.length === 0) {
    return <p className="text-muted-foreground">{empty ?? 'No posts yet. Add an .mdx file to content/.'}</p>
  }

  return (
    <div className={cn('-my-3', className)}>
      {title ? <h2 className="mb-3 text-lg font-medium tracking-tight">{title}</h2> : null}
      {posts.map((post, index) => (
        <Reveal key={post.path} delay={Math.min(index, 6) * 40}>
          <PostItem route={post} />
        </Reveal>
      ))}
    </div>
  )
}

/** Card presentation of a post, for custom themes and MDX. */
export function PostCard({ route }: { route: Route }) {
  const base = useBase()
  return (
    <a
      href={withBase(base, route.path)}
      className="flex flex-col gap-1 rounded-xl border border-border p-4 no-underline transition-colors hover:bg-accent/50"
    >
      <span className="font-medium text-foreground">{postLabel(route)}</span>
      {route.meta.description ? (
        <span className="text-sm text-muted-foreground">{route.meta.description}</span>
      ) : null}
    </a>
  )
}

export function TagList({ tags, active }: { tags: { tag: string; count: number }[]; active?: string }) {
  const base = useBase()
  const { site } = useSite()
  const tagsPath = blogTagsPath(site.activeLayer?.path ?? '/')
  if (tags.length === 0) return null
  return (
    <div className="my-8 flex flex-wrap gap-2">
      {tags.map(({ tag, count }) => (
        <a key={tag} href={withBase(base, `${tagsPath}/${tagSlug(tag)}`)} className="no-underline">
          <Badge variant={active === tag ? 'default' : 'secondary'}>
            {tag} <span className="opacity-60">{count}</span>
          </Badge>
        </a>
      ))}
    </div>
  )
}

/** Rendered for generated tag routes within the current blog layer. */
export function TagPage({ site, tag }: { site: SiteIndex; tag: string }) {
  const base = useBase()
  const config = useConfig()
  const posts = site.posts.filter((post) => (post.meta.tags ?? []).includes(tag))
  return (
    <div>
      <p className="text-sm">
        <a href={withBase(base, blogIndexPath(site.activeLayer?.path ?? '/', config))} className="text-muted-foreground no-underline hover:text-foreground">
          ← All posts
        </a>
      </p>
      <h1 className="mt-4 text-2xl font-medium tracking-tight">Posts tagged “{tag}”</h1>
      <PostList posts={posts} empty={`No posts tagged “${tag}”.`} className="mt-6" />
      <TagList tags={site.tags} active={tag} />
    </div>
  )
}

export function DefaultHomePage({ site }: { site: SiteIndex; config: RuntimeConfig }) {
  return (
    <Section title="Blog" headingLevel={1}>
      <PostList posts={site.posts} />
    </Section>
  )
}

/** The generated index of a blog layer. */
export function PostListPage({ site }: { site: SiteIndex }) {
  return (
    <Section title="Blog" headingLevel={1}>
      <PostList posts={site.posts} />
    </Section>
  )
}

export function DefaultNotFound({ url }: { url: string }) {
  const base = useBase()
  return (
    <div className="py-20 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="mt-2 text-2xl font-medium tracking-tight">Page not found</h1>
      <p className="mt-3 text-muted-foreground">
        Nothing is published at <code className="rounded bg-muted px-1.5 py-0.5 text-sm">{url}</code>.
      </p>
      <a
        href={withBase(base, '/')}
        className="mt-6 inline-flex items-center gap-1.5 rounded-md border border-border px-3.5 py-1.5 text-sm no-underline transition-colors hover:bg-accent"
      >
        <ChevronLeft aria-hidden="true" className="size-3.5" /> Back to the start
      </a>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Layouts                                                                    */
/* -------------------------------------------------------------------------- */

export interface LayoutProps {
  route: Route | undefined
  url: string
  title: string
  description?: string
  headings: TocEntry[]
  children: React.ReactNode
  prevNext: PageLink[]
  config: RuntimeConfig
  site: SiteIndex
}

/** Shared outer layer. Layouts own chrome; page components own article content. */
export function BaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <a
        href="#novon-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:border focus:border-border focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:no-underline focus:shadow-lg"
      >
        Skip to content
      </a>
      <ScrollProgress />
      {children}
    </div>
  )
}

export type DocsLayoutProps = Pick<LayoutProps, 'route' | 'url' | 'headings' | 'children' | 'config' | 'site'>

export function DocsLayout({ route, url, headings, children, config, site }: DocsLayoutProps) {
  const SharedHeader = useOverride('Header', DefaultDocsHeader)
  const Header = useOverride('DocsHeader', SharedHeader)
  const Sidebar = useOverride('Sidebar', DefaultSidebar)
  const TableOfContents = useOverride('TableOfContents', DefaultTableOfContents)
  const SharedFooter = useOverride('Footer', DefaultFooter)
  const Footer = useOverride('DocsFooter', SharedFooter)
  const [navOpen, setNavOpen] = React.useState(false)
  const [collapsed, setCollapsed] = React.useState(false)
  const sidebarRef = React.useRef<HTMLElement>(null)

  React.useEffect(() => { setNavOpen(false) }, [url])

  // Remember what opened the mobile nav so focus can return to it, but only
  // while it is still visible (the trigger is hidden at the desktop breakpoint).
  const navTriggerRef = React.useRef<HTMLElement | null>(null)
  const openNav = () => {
    navTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setNavOpen(true)
  }
  const toggleNav = () => {
    if (navOpen) setNavOpen(false)
    else openNav()
  }
  const finalFocus = React.useCallback((): HTMLElement | false => {
    const trigger = navTriggerRef.current
    if (trigger?.isConnected && trigger.checkVisibility?.() !== false) return trigger
    return false
  }, [])

  React.useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('novon-sidebar') === 'collapsed')
    } catch {
      // ignore
    }
  }, [])

  // Leaving the mobile nav open across the desktop breakpoint would keep an
  // invisible, focus-trapping dialog mounted, so close it on the transition.
  React.useEffect(() => {
    if (!navOpen) return
    const query = window.matchMedia('(min-width: 1024px)')
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setNavOpen(false)
    }
    query.addEventListener('change', onChange)
    if (query.matches) setNavOpen(false)
    return () => query.removeEventListener('change', onChange)
  }, [navOpen])

  // A direct load with a fragment resolves the hash before the client content
  // exists, so re-align it once the layout has settled (and again after fonts).
  // The font pass is skipped if the reader has already changed the hash or
  // scrolled away, so it can never yank them back.
  React.useEffect(() => {
    const initialHash = window.location.hash
    const id = hashToId(initialHash)
    if (!id) return
    const target = document.getElementById(id)
    if (!target) return

    const behavior: ScrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth'
    let cancelled = false
    let userMoved = false
    // The programmatic scroll keeps emitting `scroll`, so ignore those events
    // for its duration and treat anything after as the reader taking over.
    let programmaticUntil = 0
    const markMoved = () => {
      userMoved = true
    }
    const onScroll = () => {
      if (performance.now() > programmaticUntil) userMoved = true
    }
    const scroll = () => {
      if (cancelled) return
      programmaticUntil = performance.now() + 1200
      target.scrollIntoView({ behavior, block: 'start' })
    }

    let frame = window.requestAnimationFrame(scroll)
    document.fonts?.ready
      .then(() => {
        if (cancelled || userMoved || window.location.hash !== initialHash) return
        frame = window.requestAnimationFrame(scroll)
      })
      .catch(() => {})

    window.addEventListener('wheel', markMoved, { passive: true })
    window.addEventListener('touchstart', markMoved, { passive: true })
    window.addEventListener('keydown', markMoved)
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      cancelled = true
      window.cancelAnimationFrame(frame)
      window.removeEventListener('wheel', markMoved)
      window.removeEventListener('touchstart', markMoved)
      window.removeEventListener('keydown', markMoved)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const toggleCollapsed = () => {
    window.requestAnimationFrame(() => {
      sidebarRef.current?.querySelector<HTMLButtonElement>(collapsed ? '[aria-label="Collapse sidebar"]' : '[aria-label="Show sidebar"]')?.focus()
    })
    setCollapsed((value) => {
      try {
        localStorage.setItem('novon-sidebar', value ? 'expanded' : 'collapsed')
      } catch {
        // ignore
      }
      return !value
    })
  }

  const fullWidth = route?.meta.fullWidth === true
  const showToc = config.theme.toc && headings.length > 0 && route?.meta.toc !== false && !fullWidth
  // A synthetic layer root copies its first page; highlight that page instead.
  const activePath =
    route?.synthetic && route.file
      ? (site.routes.find((candidate) => !candidate.synthetic && candidate.file === route.file)?.path ?? url)
      : url

  return (
    <BaseLayout>
      <Header onToggleNav={toggleNav} navOpen={navOpen} />

      <div className="flex">
        <aside
          ref={sidebarRef}
          aria-label="Sidebar"
          className="sticky top-0 hidden h-dvh shrink-0 border-r border-border lg:block"
          style={{ width: collapsed ? '3.5rem' : 'var(--novon-sidebar-width)' }}
        >
          <div id="novon-sidebar" hidden={collapsed} className="h-full">
            <Sidebar nav={site.nav} current={activePath} onCollapse={toggleCollapsed} />
          </div>
          {collapsed ? (
            <div className="flex h-full flex-col items-center bg-card/40">
              <div className="flex h-14 items-center">
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  aria-label="Show sidebar"
                  aria-expanded="false"
                  aria-controls="novon-sidebar"
                  title="Show sidebar"
                  className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <PanelLeft aria-hidden="true" className="size-4" />
                </button>
              </div>
              {config.features.search ? <SearchTrigger className="size-8 justify-center p-0 [&>span]:hidden [&>kbd]:hidden" /> : null}
              {config.theme.darkMode ? <div className="mt-auto flex h-12 items-center"><ThemeToggle /></div> : null}
            </div>
          ) : null}
        </aside>

        <Dialog open={navOpen} onOpenChange={setNavOpen}>
          <DialogContent
            showClose={false}
            finalFocus={finalFocus}
            id="novon-mobile-sidebar"
            aria-label="Documentation navigation"
            className="fixed inset-x-0 top-14 bottom-0 h-auto max-w-none rounded-none border-0 bg-background p-0 shadow-none lg:hidden"
          >
            <DialogClose
              aria-label="Close navigation"
              className="absolute right-3 top-3 z-10 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X aria-hidden="true" className="size-4" />
            </DialogClose>
            <ScrollArea className="h-full">
              <Sidebar nav={site.nav} current={activePath} onNavigate={() => setNavOpen(false)} />
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <main id="novon-content" tabIndex={-1} className="min-w-0 flex-1">
          {children}
          <Footer variant="docs" />
        </main>

        {showToc ? (
          <aside
            className="novon-scroll sticky top-0 hidden h-screen shrink-0 overflow-y-auto px-4 py-10 xl:block"
            style={{ width: 'var(--novon-toc-width)' }}
          >
            <TableOfContents headings={headings} />
          </aside>
        ) : null}
      </div>
    </BaseLayout>
  )
}

export type DocsPageProps = Pick<LayoutProps, 'route' | 'url' | 'title' | 'description' | 'children' | 'prevNext'>

export function DocsPage({ route, url, title, description, children, prevNext }: DocsPageProps) {
  const fullWidth = route?.meta.fullWidth === true
  const wide = route?.meta.wide === true
  return (
    <div className={cn(
      'mx-auto w-full px-4 py-8 sm:px-6 lg:px-10 lg:py-10',
      fullWidth ? 'max-w-[80rem]' : wide ? 'max-w-[64rem]' : 'max-w-(--novon-content-width)',
    )}>
      {route ? <PageHeading title={title} description={description} meta={route.meta} path={route.path} actions={!route.synthetic} className={fullWidth ? '' : 'mb-6'} /> : null}
      {route && !route.synthetic ? <div className="mb-8 border-b border-border" /> : null}
      <Prose>{children}</Prose>
      {!route?.synthetic && !fullWidth ? <PageNav links={prevNext} current={url} meta={route?.meta} file={route?.file} /> : null}
    </div>
  )
}

export function BlogLayout({ children }: { children: React.ReactNode }) {
  const SharedHeader = useOverride('Header', DefaultHeader)
  const Header = useOverride('BlogHeader', SharedHeader)
  const SharedFooter = useOverride('Footer', DefaultFooter)
  const Footer = useOverride('BlogFooter', SharedFooter)
  return (
    <BaseLayout>
      <div className="mx-auto w-full max-w-(--novon-column-width) px-4 pt-14 pb-16 md:px-0">
        <Header />
        <main id="novon-content" tabIndex={-1} className="mt-12">{children}</main>
        <Footer />
      </div>
    </BaseLayout>
  )
}

export type BlogPageProps = Pick<LayoutProps, 'route' | 'title' | 'description' | 'children' | 'config' | 'site'>

export function BlogPage({ route, title, description, children, config, site }: BlogPageProps) {
  const HomePage = useOverride('HomePage', DefaultHomePage)
  const PostListOverride = useOverride('PostListPage', PostListPage)
  const isHome = route?.path === (site.activeLayer?.path ?? '/')
  const isPost = Boolean(route && !isHome && !route.isIndex && !route.synthetic && !route.postList && !route.tag)
  const cover = typeof route?.meta.image === 'string' ? route.meta.image : undefined
  const date = formatDate(route?.meta.date, config.language)
  const author =
    typeof route?.meta.author === 'string' ? route.meta.author : (route?.meta.author?.name ?? config.author)

  if (isHome && route?.synthetic) return <HomePage site={site} config={config} />
  if (route?.postList) return <PostListOverride site={site} config={config} />
  if (route?.tag) return <TagPage site={site} tag={route.tag} />

  return (
    <article>
      {isPost && cover ? (
        <figure className="mb-8">
          <img src={withBase(config.base, cover)} alt="" className="w-full rounded-xl border border-border" />
          {typeof route?.meta.caption === 'string' ? (
            <figcaption className="mt-3 text-center text-sm text-muted-foreground">
              {route.meta.caption}
            </figcaption>
          ) : null}
        </figure>
      ) : null}

      <h1 className="text-2xl font-medium tracking-tight text-foreground">{title}</h1>
      {isPost && (date || author) ? (
        <p className="mt-3 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
          {date ? <time dateTime={String(route?.meta.date)}>{date}</time> : null}
          {date && author ? <span aria-hidden="true">·</span> : null}
          {author ? <span>{author}</span> : null}
        </p>
      ) : null}
      {description ? <p className="mt-4 text-lg text-muted-foreground">{description}</p> : null}
      <div className="my-8 border-t border-border" />
      <Prose>{children}</Prose>

      {isPost ? (
        <p className="mt-12 text-sm">
          <a
            href={withBase(config.base, blogIndexPath(site.activeLayer?.path ?? '/', config))}
            className="inline-flex items-center gap-1.5 text-muted-foreground no-underline transition-colors hover:text-foreground"
          >
            <ChevronLeft aria-hidden="true" className="size-3.5" />
            All posts
          </a>
        </p>
      ) : null}
    </article>
  )
}

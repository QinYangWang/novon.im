/**
 * Built-in theme.
 *
 * Two layouts, each modelled on a reference:
 *
 * - `docs` — full-height sidebar rail with grouped, icon-bearing navigation and a
 *   three-way theme switcher, a content header with page actions, and a right-hand
 *   "on this page" column.
 * - `blog` — a single narrow typographic column with a lowercase nav, a
 *   date-and-title post list and an arrow-link footer.
 *
 * Every part goes through `useOverride()`, so a site can swap any of them from
 * `novon.config.ts`:
 *
 * ```ts
 * theme: { override: { Header: './theme/Header.tsx' } }
 * ```
 */
import * as React from 'react'
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  List as ListIcon,
  Menu,
  Monitor,
  Moon,
  PanelLeft,
  Pencil,
  Sun,
  X,
} from 'lucide-react'
import type { Frontmatter, Route, RuntimeConfig, ThemeOverrides, TocEntry } from '../types.ts'
import { cn, formatDate, isExternal, tagSlug, withBase } from './lib.ts'
import { markdownPath } from '../paths.ts'
import { useBase, useConfig } from './site.tsx'
import { SearchTrigger } from './search.tsx'
import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger, Badge, Popover, PopoverContent, PopoverTrigger, ScrollArea } from './ui.tsx'
import { Icon } from './icons.tsx'
import type { NavNode, PageLink, SiteIndex } from './content.ts'

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
/* Brand and theme controls                                                   */
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
          {logoDark ? (
            <img src={withBase(base, logoDark)} alt="" className="hidden size-6 dark:block" />
          ) : null}
        </span>
      ) : null}
      {showTitle ? <span className="truncate">{config.title}</span> : null}
    </a>
  )
}

/** Single light/dark toggle, as used by the blog. */
export function ThemeToggle({ className }: { className?: string }) {
  const [ready, setReady] = React.useState(false)
  React.useEffect(() => setReady(true), [])

  const toggle = () => {
    const root = document.documentElement
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark'
    root.dataset.theme = next
    try {
      localStorage.setItem('novon-theme', next)
    } catch {
      // storage can be unavailable (private mode); the attribute still applies
    }
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
      <Moon aria-hidden="true" className="size-4 dark:hidden" />
      <Sun aria-hidden="true" className="hidden size-4 dark:block" />
    </button>
  )
}

type ThemeChoice = 'system' | 'light' | 'dark'

const THEME_CHOICES: { value: ThemeChoice; label: string; Icon: typeof Sun }[] = [
  { value: 'system', label: 'System theme', Icon: Monitor },
  { value: 'light', label: 'Light theme', Icon: Sun },
  { value: 'dark', label: 'Dark theme', Icon: Moon },
]

/** Three-way system/light/dark control, as used in the docs sidebar. */
export function ThemeSwitcher({ className }: { className?: string }) {
  const [choice, setChoice] = React.useState<ThemeChoice>('system')
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    setReady(true)
    try {
      const stored = localStorage.getItem('novon-theme')
      setChoice(stored === 'light' || stored === 'dark' ? stored : 'system')
    } catch {
      // ignore
    }
  }, [])

  const apply = (next: ThemeChoice) => {
    setChoice(next)
    const root = document.documentElement
    try {
      if (next === 'system') {
        localStorage.removeItem('novon-theme')
        root.dataset.theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      } else {
        localStorage.setItem('novon-theme', next)
        root.dataset.theme = next
      }
    } catch {
      root.dataset.theme = next === 'dark' ? 'dark' : 'light'
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className={cn('flex items-center gap-0.5 rounded-md border border-border p-0.5', className)}
      {...(ready ? {} : { 'aria-hidden': true })}
    >
      {THEME_CHOICES.map(({ value, label, Icon: ChoiceIcon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={choice === value}
          aria-label={label}
          title={label}
          onClick={() => apply(value)}
          className={cn(
            'inline-flex size-6 items-center justify-center rounded transition-colors',
            choice === value
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <ChoiceIcon aria-hidden="true" className="size-3.5" />
        </button>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Blog header and footer                                                     */
/* -------------------------------------------------------------------------- */

export function DefaultHeader({ className }: { className?: string }) {
  const config = useConfig()
  const base = useBase()
  const items = config.nav.length > 0 ? config.nav : [{ label: 'blog', href: '/' }]

  return (
    <header className={cn('tracking-tight', className)}>
      <nav className="flex flex-row items-center">
        {items.map((item) => (
          <a
            key={item.href}
            href={isExternal(item.href) ? item.href : withBase(base, item.href)}
            {...(isExternal(item.href) ? { target: '_blank', rel: 'noreferrer' } : {})}
            className="m-1 flex px-2 py-1 lowercase text-muted-foreground no-underline transition-colors hover:text-foreground"
          >
            {item.label}
          </a>
        ))}
        {config.features.search ? <SearchTrigger className="-my-1 ml-auto w-32 sm:w-44" /> : null}
        {config.theme.darkMode ? <ThemeToggle className="ml-1" /> : null}
      </nav>
    </header>
  )
}

function ArrowLink({ href, children, external = true }: { href: string; children: React.ReactNode; external?: boolean }) {
  return (
    <li>
      <a
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className="flex items-center text-muted-foreground no-underline transition-colors hover:text-foreground"
      >
        <ArrowUpRight aria-hidden="true" className="size-3 shrink-0" />
        <span className="ml-2">{children}</span>
      </a>
    </li>
  )
}

export function DefaultFooter({ className, variant = 'blog' }: { className?: string; variant?: 'blog' | 'docs' }) {
  const config = useConfig()
  const base = useBase()
  const footer = config.theme.footer ?? {}

  if (variant === 'docs') {
    return null
  }

  const links = footer.links ?? []

  return (
    <footer className={cn('pb-16 text-sm', className)}>
      <ul className="mt-8 flex flex-col space-y-2 text-muted-foreground md:flex-row md:space-x-4 md:space-y-0">
        {config.features.rss ? <ArrowLink href={withBase(base, '/rss.xml')}>rss</ArrowLink> : null}
        {config.theme.social?.github ? <ArrowLink href={config.theme.social.github}>github</ArrowLink> : null}
        {links.map((link) => (
          <ArrowLink key={link.href} href={isExternal(link.href) ? link.href : withBase(base, link.href)}>
            {link.label}
          </ArrowLink>
        ))}
      </ul>
      <p className="mt-8 text-muted-foreground">
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
        'flex w-full items-center gap-2 rounded-lg py-1.5 pr-2 text-sm no-underline transition-colors',
        indent ? 'pl-6' : 'pl-2.5',
        active
          ? 'bg-primary/12 font-medium text-primary'
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
          // Fumadocs-style section: a label, then its pages.
          return (
            <li key={node.label} className="pt-4 first:pt-1">
              <p className="px-2.5 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {node.label}
              </p>
              <NavTree nodes={node.children} current={current} onNavigate={onNavigate} depth={depth + 1} />
            </li>
          )
        }

        return (
          <li key={node.label}>
            <Accordion defaultValue={contains(node) ? ['group'] : []}>
              <AccordionItem value="group" className="border-0 py-0">
                <AccordionTrigger className="gap-2 rounded-lg py-1.5 pl-2.5 pr-2 text-sm font-normal text-muted-foreground hover:bg-accent/60 hover:text-foreground">
                  <span className="flex min-w-0 items-center gap-2">
                    {node.icon ? <Icon icon={node.icon} className="size-4 shrink-0 opacity-80" /> : null}
                    <span className="truncate">{node.label}</span>
                  </span>
                </AccordionTrigger>
                <AccordionPanel className="pb-0">
                  {node.path ? (
                    <NavLink
                      item={{ label: node.label, path: node.path }}
                      current={current}
                      onNavigate={onNavigate}
                      indent
                    />
                  ) : null}
                  <div className="pl-1">
                    <NavTree nodes={node.children} current={current} onNavigate={onNavigate} depth={depth + 1} />
                  </div>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </li>
        )
      })}
    </ul>
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
    <div className={cn('flex h-full flex-col', className)}>
      <div className="flex h-14 shrink-0 items-center gap-2 px-4">
        <Brand />
        {onCollapse ? (
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Collapse sidebar"
            className="ml-auto inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <PanelLeft aria-hidden="true" className="size-4" />
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
            <GithubIcon />
          </a>
        ) : (
          <span />
        )}
        {config.theme.darkMode ? <ThemeSwitcher /> : null}
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
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          {navOpen ? <X aria-hidden="true" className="size-4" /> : <Menu aria-hidden="true" className="size-4" />}
        </button>
      ) : null}
      <Brand />
      <nav className="ml-2 hidden items-center gap-1 text-sm sm:flex">
        {config.nav.map((item) => (
          <a
            key={item.href}
            href={isExternal(item.href) ? item.href : withBase(base, item.href)}
            {...(isExternal(item.href) ? { target: '_blank', rel: 'noreferrer' } : {})}
            className="rounded-md px-2 py-1.5 text-muted-foreground no-underline transition-colors hover:bg-accent hover:text-foreground"
          >
            {item.label}
          </a>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-1">
        {config.features.search ? <SearchTrigger className="w-32 sm:w-44" /> : null}
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

  React.useEffect(() => {
    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => Boolean(element))
    if (elements.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]?.target.id) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: [0, 1] },
    )
    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  return (
    <nav aria-label="On this page" className={cn('text-sm', className)}>
      <p className="flex items-center gap-2 font-medium text-foreground">
        <ListIcon aria-hidden="true" className="size-4 text-muted-foreground" />
        On this page
      </p>
      <ul className="mt-3 space-y-0.5 border-l border-border/70">
        {headings.map((heading) => {
          const active = activeId === heading.id
          return (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                aria-current={active ? 'location' : undefined}
                className={cn(
                  '-ml-px block border-l-2 py-1 pr-2 no-underline transition-colors',
                  heading.depth === 2 ? 'pl-3' : heading.depth === 3 ? 'pl-6' : 'pl-9',
                  active
                    ? 'border-primary font-medium text-primary'
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

/* -------------------------------------------------------------------------- */
/* Page chrome                                                                */
/* -------------------------------------------------------------------------- */

function markdownUrl(base: string, path: string): string {
  return withBase(base, `/${markdownPath(path)}`)
}

/** "Copy Markdown" and "Open" — reads the `.md` file emitted for every route. */
export function PageActions({ path }: { path: string }) {
  const base = useBase()
  const [copied, setCopied] = React.useState(false)
  const url = markdownUrl(base, path)

  const copy = async () => {
    try {
      const response = await fetch(url)
      const text = await response.text()
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.open(url, '_blank', 'noopener')
    }
  }

  const ask = (origin: string, prompt: string) => {
    const absolute = new URL(url, window.location.href).href
    window.open(`${origin}${encodeURIComponent(`${prompt} ${absolute}`)}`, '_blank', 'noopener')
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={copy}
        className="inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent"
      >
        {copied ? (
          <Check aria-hidden="true" className="size-3.5" />
        ) : (
          <Copy aria-hidden="true" className="size-3.5" />
        )}
        {copied ? 'Copied' : 'Copy Markdown'}
      </button>

      <Popover>
        <PopoverTrigger className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent">
          Open
          <ChevronRight aria-hidden="true" className="size-3.5 rotate-90 opacity-60" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 p-1">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm no-underline transition-colors hover:bg-accent"
          >
            <ArrowUpRight aria-hidden="true" className="size-3.5 opacity-70" />
            View as Markdown
          </a>
          <button
            type="button"
            onClick={() => ask('https://chatgpt.com/?q=', 'Read this documentation page and explain it:')}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
          >
            <ArrowUpRight aria-hidden="true" className="size-3.5 opacity-70" />
            Open in ChatGPT
          </button>
          <button
            type="button"
            onClick={() => ask('https://claude.ai/new?q=', 'Read this documentation page and explain it:')}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
          >
            <ArrowUpRight aria-hidden="true" className="size-3.5 opacity-70" />
            Open in Claude
          </button>
        </PopoverContent>
      </Popover>
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
      {actions && path ? <PageActions path={path} /> : null}
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

/** Date column + title, like the reference portfolio blog. */
export function PostList({
  posts,
  title,
  empty,
}: {
  posts: Route[]
  title?: string
  empty?: string
}) {
  const config = useConfig()
  const base = useBase()

  if (posts.length === 0) {
    return <p className="text-muted-foreground">{empty ?? 'No posts yet. Add an .mdx file to content/.'}</p>
  }

  return (
    <div className="my-8">
      {title ? <h2 className="mb-6 text-lg font-semibold tracking-tight">{title}</h2> : null}
      {posts.map((post) => (
        <a key={post.path} href={withBase(base, post.path)} className="mb-4 flex flex-col gap-1 no-underline">
          <div className="flex w-full flex-col md:flex-row md:gap-2">
            <p className="w-36 shrink-0 whitespace-nowrap tabular-nums text-muted-foreground">
              {formatDate(post.meta.date, config.language)}
            </p>
            <p className="text-foreground">{postLabel(post)}</p>
          </div>
        </a>
      ))}
    </div>
  )
}

/** Card presentation of a post, for custom themes and MDX. */
export function PostCard({ route }: { route: Route }) {
  const config = useConfig()
  const base = useBase()
  return (
    <a
      href={withBase(base, route.path)}
      className="flex flex-col gap-1 rounded-xl border border-border p-4 no-underline transition-colors hover:bg-accent/50"
    >
      <span className="text-xs tabular-nums text-muted-foreground">
        {formatDate(route.meta.date, config.language)}
      </span>
      <span className="font-medium text-foreground">{postLabel(route)}</span>
      {route.meta.description ? (
        <span className="text-sm text-muted-foreground">{route.meta.description}</span>
      ) : null}
    </a>
  )
}

export function TagList({ tags, active }: { tags: { tag: string; count: number }[]; active?: string }) {
  const base = useBase()
  if (tags.length === 0) return null
  return (
    <div className="my-8 flex flex-wrap gap-2">
      {tags.map(({ tag, count }) => (
        <a key={tag} href={withBase(base, `/tags/${tagSlug(tag)}`)} className="no-underline">
          <Badge variant={active === tag ? 'default' : 'secondary'}>
            {tag} <span className="opacity-60">{count}</span>
          </Badge>
        </a>
      ))}
    </div>
  )
}

/** Rendered for the generated `/tags/<tag>` routes of the blog template. */
export function TagPage({ site, tag }: { site: SiteIndex; tag: string }) {
  const base = useBase()
  const posts = site.posts.filter((post) => (post.meta.tags ?? []).includes(tag))
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tighter">Posts tagged “{tag}”</h1>
      <p className="mt-2 text-sm">
        <a href={withBase(base, '/')} className="no-underline">
          ← All posts
        </a>
      </p>
      <PostList posts={posts} empty={`No posts tagged “${tag}”.`} />
      <TagList tags={site.tags} active={tag} />
    </div>
  )
}

export function DefaultHomePage({ site, config }: { site: SiteIndex; config: RuntimeConfig }) {
  return (
    <section>
      <h1 className="mb-8 text-2xl font-semibold tracking-tighter">{config.title}</h1>
      {config.description ? <p className="mb-4">{config.description}</p> : null}
      <PostList posts={site.posts} />
    </section>
  )
}

/** The generated `/blog` index of the blog template. */
export function PostListPage({ site, config }: { site: SiteIndex; config: RuntimeConfig }) {
  return (
    <section>
      <h1 className="mb-8 text-2xl font-semibold tracking-tighter">Blog</h1>
      <p className="mb-4">{config.description}</p>
      <PostList posts={site.posts} />
    </section>
  )
}

export function DefaultNotFound({ url }: { url: string }) {
  const base = useBase()
  return (
    <div className="py-20 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-3 text-muted-foreground">
        Nothing is published at <code className="rounded bg-muted px-1.5 py-0.5 text-sm">{url}</code>.
      </p>
      <a href={withBase(base, '/')} className="mt-6 inline-flex items-center gap-1 text-sm font-medium no-underline">
        <ChevronLeft aria-hidden="true" className="size-4" /> Back to the start
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

export function DocsLayout({ route, url, title, description, headings, children, prevNext, config, site }: LayoutProps) {
  const Header = useOverride('Header', DefaultDocsHeader)
  const Sidebar = useOverride('Sidebar', DefaultSidebar)
  const TableOfContents = useOverride('TableOfContents', DefaultTableOfContents)
  const Footer = useOverride('Footer', DefaultFooter)
  const [navOpen, setNavOpen] = React.useState(false)
  const [collapsed, setCollapsed] = React.useState(false)

  React.useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('novon-sidebar') === 'collapsed')
    } catch {
      // ignore
    }
  }, [])

  const toggleCollapsed = () => {
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
  // `/` is a synthetic copy of the first page; highlight that page instead.
  const activePath =
    route?.synthetic && route.file
      ? (site.routes.find((candidate) => !candidate.synthetic && candidate.file === route.file)?.path ?? url)
      : url

  return (
    <div className="min-h-screen">
      <Header onToggleNav={() => setNavOpen((value) => !value)} navOpen={navOpen} />

      <div className="flex">
        {!collapsed ? (
          <aside
            className="sticky top-0 hidden h-screen shrink-0 border-r border-border bg-background lg:block"
            style={{ width: 'var(--novon-sidebar-width)' }}
          >
            <Sidebar
              nav={site.nav}
              current={activePath}
              onCollapse={toggleCollapsed}
            />
          </aside>
        ) : null}

        {navOpen ? (
          <div className="fixed inset-0 top-14 z-30 bg-background lg:hidden">
            <ScrollArea className="h-full">
              <Sidebar nav={site.nav} current={activePath} onNavigate={() => setNavOpen(false)} />
            </ScrollArea>
          </div>
        ) : null}

        <main className="min-w-0 flex-1">
          <div
            className={cn(
              'mx-auto w-full px-4 py-8 lg:px-10 lg:py-10',
              fullWidth ? 'max-w-[80rem]' : 'max-w-(--novon-content-width)',
            )}
          >
            {/* Only needed once the rail is hidden. */}
            {collapsed ? (
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-label="Show sidebar"
                className="mb-6 hidden size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:inline-flex"
              >
                <PanelLeft aria-hidden="true" className="size-4" />
              </button>
            ) : null}

            {route ? (
              <PageHeading
                title={title}
                description={description}
                meta={route.meta}
                path={route.path}
                actions={!route.synthetic}
                className={fullWidth ? '' : 'mb-6'}
              />
            ) : null}

            {route && !route.synthetic ? <div className="mb-8 border-b border-border" /> : null}

            <Prose>{children}</Prose>

            {!route?.synthetic && !fullWidth ? (
              <PageNav links={prevNext} current={url} meta={route?.meta} file={route?.file} />
            ) : null}

            <Footer variant="docs" />
          </div>
        </main>

        {showToc && !collapsed ? (
          <aside
            className="sticky top-0 hidden h-screen shrink-0 overflow-y-auto px-4 py-10 xl:block"
            style={{ width: 'var(--novon-toc-width)' }}
          >
            <TableOfContents headings={headings} />
          </aside>
        ) : null}
      </div>
    </div>
  )
}

export function BlogLayout({ route, url, title, description, children, config, site }: LayoutProps) {
  const Header = useOverride('Header', DefaultHeader)
  const Footer = useOverride('Footer', DefaultFooter)
  const HomePage = useOverride('HomePage', DefaultHomePage)
  const PostListOverride = useOverride('PostListPage', PostListPage)
  const isHome = url === '/'
  const isPost = Boolean(route && !route.isIndex && !route.synthetic && !route.postList && !route.tag)

  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto w-full max-w-(--novon-blog-width) flex-1 px-4 pb-8 md:px-0">
        <div className="pt-8">
          <Header />
        </div>

        <main className="mt-6 min-w-0">
          {isHome && route?.synthetic ? (
            <HomePage site={site} config={config} />
          ) : route?.postList ? (
            <PostListOverride site={site} config={config} />
          ) : route?.tag ? (
            <TagPage site={site} tag={route.tag} />
          ) : (
            <section>
              {route ? (
                <PageHeading
                  title={title}
                  description={description}
                  meta={route.meta}
                  className="mb-8"
                />
              ) : null}
              <Prose>{children}</Prose>
              {isPost ? (
                <p className="mt-12 text-sm">
                  <a href={withBase(config.base, '/blog')} className="no-underline">
                    ← All posts
                  </a>
                </p>
              ) : null}
            </section>
          )}
        </main>

        <Footer />
      </div>
    </div>
  )
}

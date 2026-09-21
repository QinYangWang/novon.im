/**
 * Built-in theme: header, sidebar, table of contents, blog views and footer.
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
  ChevronLeft,
  ChevronRight,
  Menu,
  Moon,
  Pencil,
  Sun,
  X,
} from 'lucide-react'
import type { Frontmatter, Route, RuntimeConfig, ThemeOverrides, TocEntry } from '../types.ts'
import { cn, formatDate, isExternal, tagSlug, withBase } from './lib.ts'
import { useBase, useConfig } from './site.tsx'
import { SearchTrigger } from './search.tsx'
import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger, Badge, ScrollArea } from './ui.tsx'
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

/* -------------------------------------------------------------------------- */
/* Brand                                                                      */
/* -------------------------------------------------------------------------- */

export function Brand({ className }: { className?: string }) {
  const config = useConfig()
  const base = useBase()
  const logo = config.theme.logo
  const logoDark = config.theme.logoDark
  return (
    <a href={withBase(base, '/')} className={cn('flex items-center gap-2 font-semibold no-underline', className)}>
      {logo ? (
        <>
          <img src={withBase(base, logo)} alt="" className={cn('size-6 shrink-0', logoDark && 'dark:hidden')} />
          {logoDark ? <img src={withBase(base, logoDark)} alt="" className="hidden size-6 shrink-0 dark:block" /> : null}
        </>
      ) : null}
      <span className="truncate">{config.title}</span>
    </a>
  )
}

/* -------------------------------------------------------------------------- */
/* Theme toggle                                                               */
/* -------------------------------------------------------------------------- */

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
      // storage can be unavailable (private mode); the class still applies
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
      {...(ready ? {} : { 'aria-hidden': true, tabIndex: -1 })}
    >
      <Moon aria-hidden="true" className="size-4 dark:hidden" />
      <Sun aria-hidden="true" className="hidden size-4 dark:block" />
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/* Header                                                                     */
/* -------------------------------------------------------------------------- */

/** lucide dropped brand icons, so GitHub is inlined. */
function GithubIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="currentColor" className="size-4">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}

export interface HeaderProps {
  onToggleNav?: () => void
  navOpen?: boolean
}

export function DefaultHeader({ onToggleNav, navOpen }: HeaderProps) {
  const config = useConfig()
  const base = useBase()
  const social = config.theme.social ?? {}

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md lg:px-6">
      {onToggleNav ? (
        <button
          type="button"
          onClick={onToggleNav}
          aria-label={navOpen ? 'Close navigation' : 'Open navigation'}
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
        >
          {navOpen ? <X aria-hidden="true" className="size-4" /> : <Menu aria-hidden="true" className="size-4" />}
        </button>
      ) : null}

      <Brand className="text-sm lg:hidden" />
      <div className="hidden lg:block" />

      <nav className="ml-auto flex items-center gap-1 text-sm">
        {config.nav.map((item) => (
          <a
            key={item.href}
            href={isExternal(item.href) ? item.href : withBase(base, item.href)}
            {...(isExternal(item.href) ? { target: '_blank', rel: 'noreferrer' } : {})}
            className="hidden rounded-md px-2.5 py-1.5 text-muted-foreground no-underline transition-colors hover:bg-accent hover:text-foreground sm:inline-flex"
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-1">
        {config.features.search ? <SearchTrigger /> : null}
        {config.theme.darkMode ? <ThemeToggle /> : null}
        {social.github ? (
          <a
            href={social.github}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <GithubIcon />
          </a>
        ) : null}
      </div>
    </header>
  )
}

/* -------------------------------------------------------------------------- */
/* Sidebar                                                                    */
/* -------------------------------------------------------------------------- */

function isActive(navPath: string, current: string): boolean {
  return navPath === current
}

function NavLink({ item, current, onNavigate }: { item: PageLink; current: string; onNavigate?: () => void }) {
  const base = useBase()
  const active = isActive(item.path, current)
  return (
    <a
      href={withBase(base, item.path)}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'block truncate rounded-md px-2 py-1.5 text-sm no-underline transition-colors',
        active
          ? 'bg-accent font-medium text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
      )}
    >
      {item.label}
    </a>
  )
}

function NavTree({ nodes, current, onNavigate }: { nodes: NavNode[]; current: string; onNavigate?: () => void }) {
  const base = useBase()
  const contains = (node: NavNode): boolean =>
    node.kind === 'page' ? isActive(node.path, current) : node.path === current || node.children.some(contains)

  return (
    <ul className="space-y-0.5">
      {nodes.map((node) => {
        if (node.kind === 'page') {
          return (
            <li key={node.path}>
              <NavLink item={node} current={current} onNavigate={onNavigate} />
            </li>
          )
        }
        return (
          <li key={node.label}>
            <Accordion key={node.label} defaultValue={contains(node) ? ['group'] : []}>
              <AccordionItem value="group" className="border-0 py-0">
                <AccordionTrigger className="px-2 py-1.5 text-sm font-medium text-foreground">
                  {node.path ? (
                    <a
                      href={withBase(base, node.path)}
                      onClick={onNavigate}
                      className="truncate no-underline"
                    >
                      {node.label}
                    </a>
                  ) : (
                    <span className="truncate">{node.label}</span>
                  )}
                </AccordionTrigger>
                <AccordionPanel className="pb-1 pl-2">
                  <NavTree nodes={node.children} current={current} onNavigate={onNavigate} />
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </li>
        )
      })}
    </ul>
  )
}

export function DefaultSidebar({
  nav,
  current,
  onNavigate,
  className,
}: {
  nav: NavNode[]
  current: string
  onNavigate?: () => void
  className?: string
}) {
  if (nav.length === 0) return null
  return (
    <nav aria-label="Documentation" className={cn('text-sm', className)}>
      <NavTree nodes={nav} current={current} onNavigate={onNavigate} />
    </nav>
  )
}

/* -------------------------------------------------------------------------- */
/* Table of contents                                                          */
/* -------------------------------------------------------------------------- */

export function DefaultTableOfContents({
  headings,
  className,
}: {
  headings: TocEntry[]
  className?: string
}) {
  const [activeId, setActiveId] = React.useState<string>('')

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
      <p className="mb-2 font-medium text-foreground">On this page</p>
      <ul className="space-y-1 border-l border-border">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              aria-current={activeId === heading.id ? 'location' : undefined}
              className={cn(
                '-ml-px block border-l border-transparent py-0.5 pr-2 text-muted-foreground no-underline transition-colors hover:border-foreground/40 hover:text-foreground',
                heading.depth === 2 ? 'pl-3' : heading.depth === 3 ? 'pl-6' : 'pl-9',
                activeId === heading.id && 'border-primary font-medium text-foreground',
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/* -------------------------------------------------------------------------- */
/* Footer                                                                     */
/* -------------------------------------------------------------------------- */

export function DefaultFooter({ className }: { className?: string }) {
  const config = useConfig()
  const base = useBase()
  const footer = config.theme.footer ?? {}
  const social = config.theme.social ?? {}
  const links = footer.links ?? []
  const socialEntries = Object.entries(social).filter(([, value]) => Boolean(value))

  return (
    <footer className={cn('border-t border-border px-4 py-8 text-sm text-muted-foreground lg:px-6', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p>{footer.text ?? `© ${new Date().getFullYear()} ${config.title}`}</p>
          <p className="text-xs">Built with novon</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {links.map((link) => (
            <a
              key={link.href}
              href={isExternal(link.href) ? link.href : withBase(base, link.href)}
              className="no-underline hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
          {socialEntries.map(([key, value]) => (
            <a key={key} href={value} target="_blank" rel="noreferrer" className="no-underline capitalize hover:text-foreground">
              {key}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}

/* -------------------------------------------------------------------------- */
/* Pagination                                                                 */
/* -------------------------------------------------------------------------- */

function Pagination({ links, current }: { links: PageLink[]; current: string }) {
  const base = useBase()
  const index = links.findIndex((link) => link.path === current)
  if (index < 0) return null
  const previous = links[index - 1]
  const next = links[index + 1]
  if (!previous && !next) return null
  return (
    <nav aria-label="Pagination" className="mt-12 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between">
      {previous ? (
        <a href={withBase(base, previous.path)} className="group flex flex-col gap-0.5 no-underline">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ChevronLeft aria-hidden="true" className="size-3.5" /> Previous
          </span>
          <span className="text-sm font-medium text-foreground group-hover:text-primary">{previous.label}</span>
        </a>
      ) : (
        <span />
      )}
      {next ? (
        <a href={withBase(base, next.path)} className="group flex flex-col gap-0.5 text-right no-underline">
          <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
            Next <ChevronRight aria-hidden="true" className="size-3.5" />
          </span>
          <span className="text-sm font-medium text-foreground group-hover:text-primary">{next.label}</span>
        </a>
      ) : null}
    </nav>
  )
}

/* -------------------------------------------------------------------------- */
/* Page chrome                                                                */
/* -------------------------------------------------------------------------- */

export function PageHeading({
  title,
  description,
  meta,
  file,
  className,
}: {
  title: string
  description?: string
  meta?: Frontmatter
  file?: string
  className?: string
}) {
  const config = useConfig()
  const date = formatDate(meta?.date, config.language)
  const author = typeof meta?.author === 'string' ? meta.author : meta?.author?.name ?? config.author
  const editLink = config.theme.editLink
  const editHref = editLink && file ? `${editLink.base.replace(/\/$/, '')}/${file.replace(/^\//, '')}` : undefined

  return (
    <header className={cn('mb-8 space-y-3', className)}>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
      {description ? <p className="text-lg text-muted-foreground">{description}</p> : null}
      {(date || author || editHref || (meta?.tags?.length ?? 0) > 0) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {date ? <time dateTime={String(meta?.date)}>{date}</time> : null}
          {author ? <span>{author}</span> : null}
          {(meta?.tags ?? []).map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
          {editHref ? (
            <a
              href={editHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 no-underline hover:text-foreground"
            >
              <Pencil aria-hidden="true" className="size-3.5" />
              {editLink?.label ?? 'Edit this page'}
            </a>
          ) : null}
        </div>
      )}
      {meta?.draft === true ? <Badge variant="warning">Draft</Badge> : null}
    </header>
  )
}

/** The MDX article body. */
export function Prose({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('novon-prose', className)}>{children}</div>
}

/* -------------------------------------------------------------------------- */
/* Blog                                                                       */
/* -------------------------------------------------------------------------- */

export function PostCard({ route }: { route: Route }) {
  const config = useConfig()
  const base = useBase()
  const meta = route.meta
  const label = meta.label || meta.title || route.segments[route.segments.length - 1]
  const author = typeof meta.author === 'string' ? meta.author : meta.author?.name ?? config.author
  return (
    <a
      href={withBase(base, route.path)}
      className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-5 no-underline transition-colors hover:border-primary/40 hover:bg-accent/40"
    >
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {meta.date ? <time dateTime={String(meta.date)}>{formatDate(meta.date, config.language)}</time> : null}
        {author ? <span>{author}</span> : null}
      </div>
      <h2 className="text-lg font-semibold text-foreground group-hover:text-primary">{label}</h2>
      {meta.description ? <p className="text-sm text-muted-foreground">{meta.description}</p> : null}
      {(meta.tags ?? []).length > 0 ? (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {(meta.tags ?? []).map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}
    </a>
  )
}

export function PostList({ posts, title, empty }: { posts: Route[]; title?: string; empty?: string }) {
  if (posts.length === 0) {
    return <p className="text-muted-foreground">{empty ?? 'No posts yet. Add an .mdx file to content/.'}</p>
  }
  return (
    <div className="space-y-6">
      {title ? <h2 className="text-xl font-semibold">{title}</h2> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {posts.map((post) => (
          <PostCard key={post.path} route={post} />
        ))}
      </div>
    </div>
  )
}

export function TagList({ tags, active }: { tags: { tag: string; count: number }[]; active?: string }) {
  const base = useBase()
  if (tags.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
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
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">
          <a href={withBase(base, '/')} className="no-underline">
            ← All posts
          </a>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Posts tagged “{tag}”</h1>
      </header>
      <PostList posts={posts} empty={`No posts tagged “${tag}”.`} />
      <TagList tags={site.tags} active={tag} />
    </div>
  )
}

export function DefaultHomePage({ site, config }: { site: SiteIndex; config: RuntimeConfig }) {
  return (
    <div className="space-y-10">
      <div className="space-y-4 py-8 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">{config.title}</h1>
        {config.description ? (
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">{config.description}</p>
        ) : null}
      </div>
      <PostList posts={site.posts} />
      <TagList tags={site.tags} />
    </div>
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
        <ChevronLeft aria-hidden="true" className="size-4" /> Back to {base === '/' ? 'home' : 'the start'}
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
  const Header = useOverride('Header', DefaultHeader)
  const Sidebar = useOverride('Sidebar', DefaultSidebar)
  const TableOfContents = useOverride('TableOfContents', DefaultTableOfContents)
  const Footer = useOverride('Footer', DefaultFooter)
  const [navOpen, setNavOpen] = React.useState(false)
  const showToc = config.theme.toc && headings.length > 0 && route?.meta.toc !== false
  // `/` is a synthetic copy of the first page; highlight that page in the sidebar.
  const activePath =
    route?.synthetic && route.file
      ? (site.routes.find((candidate) => !candidate.synthetic && candidate.file === route.file)?.path ?? url)
      : url

  return (
    <div className="min-h-screen">
      <Header onToggleNav={() => setNavOpen((value) => !value)} navOpen={navOpen} />
      <div className="mx-auto flex w-full max-w-[90rem] gap-8 px-4 lg:px-6">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 border-r border-border py-8 pr-4 lg:block">
          <ScrollArea className="h-full" viewportClassName="pr-1">
            <Sidebar nav={site.nav} current={activePath} />
          </ScrollArea>
        </aside>

        {navOpen ? (
          <div className="fixed inset-0 top-14 z-30 bg-background lg:hidden">
            <ScrollArea className="h-full px-4 py-6">
              <Sidebar nav={site.nav} current={activePath} onNavigate={() => setNavOpen(false)} />
            </ScrollArea>
          </div>
        ) : null}

        <main className="min-w-0 flex-1 py-8 lg:py-10">
          <article className="mx-auto max-w-3xl">
            {route ? (
              <PageHeading title={title} description={description} meta={route.meta} file={route.file} />
            ) : null}
            <Prose>{children}</Prose>
            {!route?.synthetic ? <Pagination links={prevNext} current={url} /> : null}
            <Footer className="mt-12 border-t-0 px-0" />
          </article>
        </main>

        {showToc ? (
          <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 py-10 xl:block">
            <ScrollArea className="h-full">
              <TableOfContents headings={headings} />
            </ScrollArea>
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
  const isHome = url === '/'
  const isPost = Boolean(route && !route.isIndex && !route.synthetic)
  const isTag = Boolean(route?.tag)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 lg:px-6">
        {isHome && route?.synthetic ? (
          <HomePage site={site} config={config} />
        ) : isTag && route?.tag ? (
          <TagPage site={site} tag={route.tag} />
        ) : (
          <article className="mx-auto max-w-3xl">
            {route ? (
              <PageHeading title={title} description={description} meta={route.meta} file={route.file} />
            ) : null}
            <Prose>{children}</Prose>
            {isPost ? (
              <p className="mt-12 text-sm text-muted-foreground">
                <a href={withBase(config.base, '/')} className="no-underline">
                  ← All posts
                </a>
              </p>
            ) : null}
          </article>
        )}
      </main>
      <Footer />
    </div>
  )
}

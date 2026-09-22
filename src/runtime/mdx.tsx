/**
 * Components available in every `.mdx` file without an import.
 *
 * ```mdx
 * <Note>Rendered from the built-in component map.</Note>
 *
 * <Card title="Guides" icon="Book" href="/guides" />
 * ```
 *
 * They are supplied through `MDXProvider`, so an explicit `import` in a page
 * always wins over the defaults.
 */
import * as React from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Info as InfoIcon,
  Lightbulb,
  XCircle,
} from 'lucide-react'
import { Icon, type IconProps } from './icons.tsx'
import {
  Accordion as UIAccordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
  Badge as UIBadge,
  Tabs as UITabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './ui.tsx'
import { cn, isExternal, withBase } from './lib.ts'
import { useBase, useSite } from './site.tsx'
import { IconBadge } from './kit.tsx'
import { Preview } from './preview.tsx'
import { PostList as UIPostList, TagList as UITagList } from './shell.tsx'

/* -------------------------------------------------------------------------- */
/* Callouts                                                                   */
/* -------------------------------------------------------------------------- */

const CALLOUT_STYLES = {
  note: { icon: InfoIcon, tone: 'border-sky-500/30 bg-sky-500/8 text-sky-600 dark:text-sky-400' },
  info: { icon: InfoIcon, tone: 'border-sky-500/30 bg-sky-500/8 text-sky-600 dark:text-sky-400' },
  tip: { icon: Lightbulb, tone: 'border-emerald-500/30 bg-emerald-500/8 text-emerald-600 dark:text-emerald-400' },
  success: {
    icon: CheckCircle2,
    tone: 'border-emerald-500/30 bg-emerald-500/8 text-emerald-600 dark:text-emerald-400',
  },
  warning: { icon: AlertTriangle, tone: 'border-amber-500/30 bg-amber-500/8 text-amber-600 dark:text-amber-400' },
  caution: { icon: AlertTriangle, tone: 'border-amber-500/30 bg-amber-500/8 text-amber-600 dark:text-amber-400' },
  danger: { icon: XCircle, tone: 'border-red-500/30 bg-red-500/8 text-red-600 dark:text-red-400' },
} as const

export type CalloutType = keyof typeof CALLOUT_STYLES

export interface CalloutProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  type?: CalloutType
  title?: React.ReactNode
  icon?: IconProps['icon']
}

export function Callout({ type = 'note', title, icon, className, children, ...props }: CalloutProps) {
  const style = CALLOUT_STYLES[type] ?? CALLOUT_STYLES.note
  const IconComponent = style.icon
  return (
    <div
      className={cn('my-5 flex gap-3 rounded-xl border border-border bg-card/40 px-4 py-3 text-sm', className)}
      {...props}
    >
      <span className={cn('mt-0.5 shrink-0', style.tone)}>
        {icon ? <Icon icon={icon} /> : <IconComponent aria-hidden="true" className="size-4" />}
      </span>
      <div className="min-w-0 flex-1 text-foreground/90 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
        {title ? <p className="mb-1 font-medium text-foreground">{title}</p> : null}
        {children}
      </div>
    </div>
  )
}

export const Note = (props: Omit<CalloutProps, 'type'>) => <Callout type="note" {...props} />
export const Info = (props: Omit<CalloutProps, 'type'>) => <Callout type="info" {...props} />
export const Tip = (props: Omit<CalloutProps, 'type'>) => <Callout type="tip" {...props} />
export const Warning = (props: Omit<CalloutProps, 'type'>) => <Callout type="warning" {...props} />
export const Caution = (props: Omit<CalloutProps, 'type'>) => <Callout type="caution" {...props} />
export const Danger = (props: Omit<CalloutProps, 'type'>) => <Callout type="danger" {...props} />

/* -------------------------------------------------------------------------- */
/* Cards                                                                      */
/* -------------------------------------------------------------------------- */

export interface MdxCardProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  title?: React.ReactNode
  icon?: IconProps['icon']
  href?: string
  /** Lay the icon and text out horizontally. */
  horizontal?: boolean
  arrow?: boolean
}

function MdxCardInner({ title, icon, horizontal, arrow, children }: MdxCardProps) {
  return (
    <>
      {icon ? <IconBadge icon={icon} className={horizontal ? 'mt-0.5' : ''} /> : null}
      <span className={cn('min-w-0 flex-1', icon && !horizontal ? 'mt-3' : '')}>
        {title ? <span className="block font-medium text-foreground">{title}</span> : null}
        {children ? (
          <span className={cn('block text-sm text-muted-foreground', title ? 'mt-1' : '')}>{children}</span>
        ) : null}
      </span>
      {arrow ? (
        <ArrowRight
          aria-hidden="true"
          className="size-4 shrink-0 self-center text-muted-foreground transition-transform group-hover:translate-x-0.5"
        />
      ) : null}
    </>
  )
}

export function MdxCard({ title, icon, href, horizontal, arrow = Boolean(href), className, children, ...props }: MdxCardProps) {
  const base = useBase()
  const classes = cn(
    'group flex rounded-xl border border-border bg-card/40 p-4 no-underline transition-colors',
    horizontal ? 'flex-row items-start gap-3' : 'flex-col',
    href && 'hover:bg-accent/40',
    className,
  )
  const inner = <MdxCardInner title={title} icon={icon} horizontal={horizontal} arrow={arrow}>{children}</MdxCardInner>

  if (href) {
    return (
      <a href={isExternal(href) ? href : withBase(base, href)} className={classes} {...(props as React.ComponentProps<'a'>)}>
        {inner}
      </a>
    )
  }
  return (
    <div className={classes} {...props}>
      {inner}
    </div>
  )
}

export function CardGroup({ cols = 2, className, ...props }: React.ComponentProps<'div'> & { cols?: 1 | 2 | 3 }) {
  return (
    <div
      className={cn(
        'my-5 grid gap-3',
        cols === 1 ? 'grid-cols-1' : cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2',
        className,
      )}
      {...props}
    />
  )
}

export function Columns({ cols = 2, className, ...props }: React.ComponentProps<'div'> & { cols?: 1 | 2 | 3 }) {
  return <div className={cn('my-5 grid gap-5', cols === 1 ? '' : cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2', className)} {...props} />
}

/* -------------------------------------------------------------------------- */
/* Steps                                                                      */
/* -------------------------------------------------------------------------- */

export function Steps({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'my-6 space-y-0 border-l border-border pl-6 [counter-reset:novon-step]',
        className,
      )}
      {...props}
    />
  )
}

export function Step({ title, className, children, ...props }: React.ComponentProps<'div'> & { title?: React.ReactNode }) {
  return (
    <div className={cn('relative pb-6 last:pb-0 [counter-increment:novon-step]', className)} {...props}>
      <span className="absolute -left-[calc(1.5rem+0.75rem)] top-0 flex size-6 items-center justify-center rounded-md border border-border bg-card text-xs font-medium text-muted-foreground before:content-[counter(novon-step)]" />
      {title ? <p className="mb-1 font-medium text-foreground">{title}</p> : null}
      <div className="text-sm text-muted-foreground [&>p:first-child]:mt-0">{children}</div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Tabs and accordions (child-inspecting authoring APIs)                      */
/* -------------------------------------------------------------------------- */

interface TabLikeProps {
  title?: string
  icon?: IconProps['icon']
  children?: React.ReactNode
}

function asPanels(children: React.ReactNode): { key: string; title: string; icon?: IconProps['icon']; content: React.ReactNode }[] {
  return React.Children.toArray(children)
    .filter((child): child is React.ReactElement<TabLikeProps> => React.isValidElement(child))
    .map((child, index) => ({
      key: String(child.key ?? index),
      title: child.props.title ?? `Tab ${index + 1}`,
      icon: child.props.icon,
      content: child.props.children,
    }))
}

/** Marker component: only its props are read by `<Tabs>` / `<CodeGroup>`. */
export function Tab({ children }: TabLikeProps) {
  return <>{children}</>
}

export function Tabs({ children, className, ...props }: React.ComponentProps<'div'>) {
  const panels = asPanels(children)
  if (panels.length === 0) return null
  return (
    <UITabs defaultValue={panels[0].key} className={cn('my-6', className)} {...(props as object)}>
      <TabsList>
        {panels.map((panel) => (
          <TabsTrigger key={panel.key} value={panel.key}>
            <span className="inline-flex items-center gap-1.5">
              {panel.icon ? <Icon icon={panel.icon} className="size-3.5" /> : null}
              {panel.title}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
      {panels.map((panel) => (
        <TabsContent key={panel.key} value={panel.key}>
          {panel.content}
        </TabsContent>
      ))}
    </UITabs>
  )
}

export function AccordionGroup({ className, ...props }: React.ComponentProps<typeof UIAccordion>) {
  return <UIAccordion className={cn('my-6 rounded-xl border border-border bg-card px-4', className)} {...props} />
}

export function Accordion({ title, icon, children, ...props }: TabLikeProps & { className?: string }) {
  return (
    <AccordionItem {...(props as object)}>
      <AccordionTrigger>
        <span className="inline-flex items-center gap-2">
          {icon ? <Icon icon={icon} className="size-4 text-muted-foreground" /> : null}
          {title}
        </span>
      </AccordionTrigger>
      <AccordionPanel className="pb-4">
        <div className="pl-10 pr-4 text-sm text-muted-foreground [&>p:first-child]:mt-0">{children}</div>
      </AccordionPanel>
    </AccordionItem>
  )
}

/** Find the first `<figcaption>` text inside a rendered code block. */
function findCaption(node: React.ReactNode): string | undefined {
  let found: string | undefined
  const walk = (current: React.ReactNode): void => {
    if (found !== undefined || current == null || typeof current === 'boolean') return
    if (typeof current === 'string' || typeof current === 'number') return
    if (Array.isArray(current)) {
      current.forEach(walk)
      return
    }
    if (!React.isValidElement(current)) return
    const element = current as React.ReactElement<any>
    if (element.type === 'figcaption') {
      found = flattenText(element.props.children)
      return
    }
    walk(element.props?.children)
  }
  walk(node)
  return found
}

function flattenText(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(flattenText).join('')
  if (React.isValidElement(node)) return flattenText((node as React.ReactElement<any>).props?.children)
  return ''
}

/** Tabbed code blocks. Labels come from each block's `title="…"` meta. */
export function CodeGroup({ children, className }: { children?: React.ReactNode; className?: string }) {
  const blocks = React.Children.toArray(children).filter((child) => React.isValidElement(child))
  const panels = blocks.map((block, index) => ({
    key: String(index),
    title: findCaption(block) ?? `Example ${index + 1}`,
    content: block,
  }))
  if (panels.length === 0) return null
  return (
    <UITabs defaultValue={panels[0].key} className={cn('my-6', className)}>
      <TabsList>
        {panels.map((panel) => (
          <TabsTrigger key={panel.key} value={panel.key}>
            {panel.title}
          </TabsTrigger>
        ))}
      </TabsList>
      {panels.map((panel) => (
        <TabsContent key={panel.key} value={panel.key} className="pt-0 [&>figure]:mt-0">
          {panel.content}
        </TabsContent>
      ))}
    </UITabs>
  )
}

/* -------------------------------------------------------------------------- */
/* Media and inline bits                                                      */
/* -------------------------------------------------------------------------- */

export function Frame({
  caption,
  className,
  children,
  ...props
}: React.ComponentProps<'figure'> & { caption?: React.ReactNode }) {
  return (
    <figure className={cn('my-6', className)} {...props}>
      <div className="overflow-hidden rounded-xl border border-border bg-muted/40">{children}</div>
      {caption ? (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">{caption}</figcaption>
      ) : null}
    </figure>
  )
}

export function Badge(props: React.ComponentProps<typeof UIBadge>) {
  return <UIBadge {...props} />
}

/** Inline term with a hover card. */
export function Term({ tip, children, className }: { tip: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'cursor-help border-b border-dashed border-muted-foreground/60 font-medium text-foreground',
        className,
      )}
      title={typeof tip === 'string' ? tip : undefined}
    >
      {children}
    </span>
  )
}

/** Embed a YouTube video. */
export function YouTube({ id, title = 'YouTube video', className }: { id: string; title?: string; className?: string }) {
  return (
    <div className={cn('my-6 aspect-video overflow-hidden rounded-xl border border-border', className)}>
      <iframe
        src={`https://www.youtube.com/embed/${id}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="size-full"
      />
    </div>
  )
}

/** Embed the post list of the current site. Needs no props. */
export function MdxPostList({ limit, title }: { limit?: number; title?: string }) {
  const { site } = useSite()
  return <UIPostList posts={limit ? site.posts.slice(0, limit) : site.posts} title={title} />
}

/** Embed every tag used across the site. Needs no props. */
export function MdxTagList() {
  const { site } = useSite()
  return <UITagList tags={site.tags} />
}

/* -------------------------------------------------------------------------- */
/* Code blocks                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Overrides `<pre>` inside MDX so every code block gets a copy button.
 * The text is read from the DOM on click, so highlighted spans copy correctly.
 */
export function CodeBlock({ children, className, ...props }: React.ComponentProps<'pre'>) {
  const ref = React.useRef<HTMLPreElement>(null)
  const [copied, setCopied] = React.useState(false)

  const copy = async () => {
    const text = ref.current?.textContent ?? ''
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be denied; leave the block alone.
    }
  }

  return (
    <div className="novon-code-wrap group/code relative">
      <pre ref={ref} className={className} {...props}>
        {children}
      </pre>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? 'Copied' : 'Copy code'}
        className="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-md border border-border bg-card/80 text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover/code:opacity-100"
      >
        {copied ? <Check aria-hidden="true" className="size-3.5" /> : <Copy aria-hidden="true" className="size-3.5" />}
      </button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Component map                                                              */
/* -------------------------------------------------------------------------- */

/** Defaults injected into every MDX file through `MDXProvider`. */
export const mdxComponents = {
  Callout,
  Note,
  Info,
  Tip,
  Warning,
  Caution,
  Danger,
  Card: MdxCard,
  CardGroup,
  Columns,
  Steps,
  Step,
  Tabs,
  Tab,
  CodeGroup,
  Accordion,
  AccordionGroup,
  Frame,
  Badge,
  Icon,
  Term,
  Preview,
  YouTube,
  PostList: MdxPostList,
  TagList: MdxTagList,
  pre: CodeBlock,
  a: ({ href = '', ...props }: React.ComponentProps<'a'>) => {
    const base = useBase()
    const external = isExternal(href) || href.startsWith('#')
    return (
      <a
        href={external ? href : withBase(base, href)}
        {...(isExternal(href) ? { target: '_blank', rel: 'noreferrer' } : {})}
        {...props}
      />
    )
  },
}

export type MdxComponents = typeof mdxComponents

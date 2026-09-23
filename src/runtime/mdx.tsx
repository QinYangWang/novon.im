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
import * as stylex from '@stylexjs/stylex'
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
import type { StyleXStyles } from '@stylexjs/stylex'
import { colors, elevation, media, radii, space, type } from './design-system/tokens.stylex.ts'
import { typography } from './design-system/typography.ts'
import type { ElementProps, StyleProps } from './design-system/props.ts'
import { Icon, type IconProps } from './icons.tsx'
import { SvglIcon } from './svgl.tsx'
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
import { isExternal, withBase } from './lib.ts'
import { copyText } from './actions.ts'
import { useBase, useSite } from './site.tsx'
import { Cluster, IconBadge, Stack } from './kit.tsx'
import { LogoMarquee } from './logo-marquee.tsx'
import { BlurUpImage } from './blur-up-image.tsx'
import { TreeView } from './ui.tsx'
import { Preview } from './preview.tsx'
import { PostList as UIPostList, TagList as UITagList } from './shell.tsx'

/* -------------------------------------------------------------------------- */
/* Callouts                                                                   */
/* -------------------------------------------------------------------------- */

const styles = stylex.create({
  callout: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: space.three,
    marginBlock: space.five,
    borderRadius: radii.large,
    backgroundColor: colors.raised,
    boxShadow: elevation.low,
    paddingInline: space.four,
    paddingBlock: space.three,
  },
  calloutIcon: { marginTop: space.half, display: 'inline-flex', flexShrink: 0 },
  toneInfo: { color: colors.focus },
  toneSuccess: { color: colors.successText },
  toneWarning: { color: colors.warningText },
  toneDanger: { color: colors.dangerText },
  calloutBody: { minWidth: 0, flex: 1, color: colors.textSoft },
  calloutTitle: { color: colors.text, marginBlockEnd: space.one },
})

const CALLOUTS = {
  note: { icon: InfoIcon, tone: styles.toneInfo },
  info: { icon: InfoIcon, tone: styles.toneInfo },
  tip: { icon: Lightbulb, tone: styles.toneSuccess },
  success: { icon: CheckCircle2, tone: styles.toneSuccess },
  warning: { icon: AlertTriangle, tone: styles.toneWarning },
  caution: { icon: AlertTriangle, tone: styles.toneWarning },
  danger: { icon: XCircle, tone: styles.toneDanger },
} as const

export type CalloutType = keyof typeof CALLOUTS

export type CalloutProps = Omit<ElementProps<'div'>, 'title'> &
  StyleProps & {
    type?: CalloutType
    title?: React.ReactNode
    icon?: IconProps['icon']
  }

export function Callout({ type = 'note', title, icon, xstyle, children, ...props }: CalloutProps) {
  const callout = CALLOUTS[type] ?? CALLOUTS.note
  const IconComponent = callout.icon
  return (
    <div {...props} {...stylex.props(styles.callout, typography.labelRegular, xstyle)}>
      <span {...stylex.props(styles.calloutIcon, callout.tone)}>
        {icon ? <Icon icon={icon} /> : <IconComponent aria-hidden="true" size={16} />}
      </span>
      <div {...stylex.props(styles.calloutBody)}>
        {title ? <p {...stylex.props(styles.calloutTitle, typography.label)}>{title}</p> : null}
        <Stack gap={12}>{children}</Stack>
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

export type MdxCardProps = Omit<ElementProps<'div'>, 'title'> &
  StyleProps & {
    title?: React.ReactNode
    icon?: IconProps['icon']
    href?: string
    /** Lay the icon and text out horizontally. */
    horizontal?: boolean
    arrow?: boolean
  }

const cardStyles = stylex.create({
  // The marker wrapper opts the card out of prose element styles; the visuals
  // live on this box.
  card: {
    display: 'flex',
    borderRadius: radii.large,
    backgroundColor: colors.raised,
    boxShadow: elevation.low,
    padding: space.four,
    textDecoration: 'none',
    transitionProperty: 'color, background-color, box-shadow',
    transitionDuration: '150ms',
  },
  cardLink: { backgroundColor: { default: colors.raised, ':hover': colors.raisedHover } },
  horizontal: { flexDirection: 'row', alignItems: 'flex-start', gap: space.three },
  vertical: { flexDirection: 'column' },
  iconTop: { marginTop: space.half },
  iconCenter: { alignSelf: 'center' },
  iconEnd: { marginInlineStart: 'auto' },
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.three,
    marginBlockEnd: space.three,
  },
  content: { minWidth: 0, flex: 1 },
  title: { fontWeight: type.medium, color: colors.text },
  description: { color: colors.mutedText, marginTop: space.one },
  descriptionFlush: { marginTop: 0 },
  arrow: { color: colors.mutedText },
})

function CardArrow({ xstyle }: StyleProps) {
  return <ArrowRight aria-hidden="true" size={16} {...stylex.props(cardStyles.arrow, xstyle)} />
}

function MdxCardInner({ title, icon, horizontal, arrow, children }: MdxCardProps) {
  const content = (
    <div {...stylex.props(cardStyles.content)}>
      {title ? <div {...stylex.props(cardStyles.title)}>{title}</div> : null}
      {children ? (
        <div {...stylex.props(cardStyles.description, !title && cardStyles.descriptionFlush, typography.labelRegular)}>
          {children}
        </div>
      ) : null}
    </div>
  )

  if (horizontal) {
    return (
      <>
        {icon ? <IconBadge icon={icon} xstyle={cardStyles.iconTop} /> : null}
        {content}
        {arrow ? <CardArrow xstyle={cardStyles.iconCenter} /> : null}
      </>
    )
  }

  // A vertical card keeps the icon and the arrow in one trailing header row, so
  // the arrow never floats under a description of a different height.
  return (
    <>
      {icon || arrow ? (
        <div {...stylex.props(cardStyles.headerRow)}>
          {icon ? <IconBadge icon={icon} /> : null}
          {arrow ? <CardArrow xstyle={cardStyles.iconEnd} /> : null}
        </div>
      ) : null}
      {content}
    </>
  )
}

export function MdxCard({ title, icon, href, horizontal, arrow = Boolean(href), xstyle, children, ...props }: MdxCardProps) {
  const base = useBase()
  const inner = (
    <div
      {...stylex.props(
        cardStyles.card,
        Boolean(href) && cardStyles.cardLink,
        horizontal ? cardStyles.horizontal : cardStyles.vertical,
        xstyle,
      )}
    >
      <MdxCardInner title={title} icon={icon} horizontal={horizontal} arrow={arrow}>{children}</MdxCardInner>
    </div>
  )

  if (href) {
    return (
      <a
        className="novon-not-prose"
        href={isExternal(href) ? href : withBase(base, href)}
        {...(props as ElementProps<'a'>)}
      >
        {inner}
      </a>
    )
  }
  // The marker is a zero-declaration content boundary; the box below carries
  // every compiled style.
  return (
    <div className="novon-not-prose" {...props}>
      {inner}
    </div>
  )
}

const groupStyles = stylex.create({
  group: {
    display: 'grid',
    gap: space.three,
    marginBlock: space.five,
    gridTemplateColumns: { default: '1fr', [media.small]: 'repeat(2, minmax(0, 1fr))' },
  },
  groupThree: { gridTemplateColumns: { default: '1fr', [media.small]: 'repeat(3, minmax(0, 1fr))' } },
  groupOne: { gridTemplateColumns: '1fr' },
  columns: {
    display: 'grid',
    gap: space.five,
    marginBlock: space.five,
    gridTemplateColumns: { default: '1fr', [media.small]: 'repeat(2, minmax(0, 1fr))' },
  },
  columnsThree: { gridTemplateColumns: { default: '1fr', [media.small]: 'repeat(3, minmax(0, 1fr))' } },
  columnsOne: { gridTemplateColumns: '1fr' },
})

export function CardGroup({ cols = 2, xstyle, ...props }: ElementProps<'div'> & StyleProps & { cols?: 1 | 2 | 3 }) {
  return (
    <div
      {...props}
      {...stylex.props(groupStyles.group, cols === 1 ? groupStyles.groupOne : cols === 3 ? groupStyles.groupThree : null, xstyle)}
    />
  )
}

export function Columns({ cols = 2, xstyle, ...props }: ElementProps<'div'> & StyleProps & { cols?: 1 | 2 | 3 }) {
  return (
    <div
      {...props}
      {...stylex.props(groupStyles.columns, cols === 1 ? groupStyles.columnsOne : cols === 3 ? groupStyles.columnsThree : null, xstyle)}
    />
  )
}

/* -------------------------------------------------------------------------- */
/* Steps                                                                      */
/* -------------------------------------------------------------------------- */

const stepStyles = stylex.create({
  steps: {
    marginBlock: space.six,
    borderInlineStartWidth: 1,
    borderInlineStartStyle: 'solid',
    borderInlineStartColor: colors.border,
    paddingInlineStart: space.six,
    counterReset: 'novon-step',
  },
  step: {
    position: 'relative',
    counterIncrement: 'novon-step',
    paddingBlockEnd: { default: space.six, ':last-child': 0 },
  },
  marker: {
    position: 'absolute',
    insetInlineStart: 'calc(-1.5rem - 0.75rem)',
    top: 0,
    display: 'flex',
    width: space.six,
    height: space.six,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.control,
    backgroundColor: colors.raised,
    boxShadow: elevation.low,
    color: colors.mutedText,
    '::before': { content: 'counter(novon-step)' },
  },
  title: { fontWeight: type.medium, color: colors.text, marginBlockEnd: space.one },
  body: { color: colors.mutedText },
})

export function Steps({ xstyle, ...props }: ElementProps<'div'> & StyleProps) {
  return <div {...props} {...stylex.props(stepStyles.steps, xstyle)} />
}

export function Step({ title, xstyle, children, ...props }: ElementProps<'div'> & StyleProps & { title?: React.ReactNode }) {
  return (
    <div {...props} {...stylex.props(stepStyles.step, xstyle)}>
      <span {...stylex.props(stepStyles.marker, typography.caption)} />
      {title ? <p {...stylex.props(stepStyles.title)}>{title}</p> : null}
      <div {...stylex.props(stepStyles.body, typography.labelRegular)}>
        <Stack gap={12}>{children}</Stack>
      </div>
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

const tabStyles = stylex.create({
  label: { display: 'inline-flex', alignItems: 'center', gap: space.oneHalf },
})

export function Tabs({ children, xstyle, ...props }: ElementProps<'div'> & StyleProps) {
  const panels = asPanels(children)
  if (panels.length === 0) return null
  return (
    <UITabs defaultValue={panels[0].key} {...(props as object)} xstyle={xstyle}>
      <TabsList>
        {panels.map((panel) => (
          <TabsTrigger key={panel.key} value={panel.key}>
            <span {...stylex.props(tabStyles.label)}>
              {panel.icon ? <Icon icon={panel.icon} size={14} /> : null}
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

const accordionStyles = stylex.create({
  group: { backgroundColor: colors.surface, paddingInline: space.four },
  itemLabel: { display: 'inline-flex', alignItems: 'center', gap: space.two },
  panelBody: {
    paddingInlineStart: space.ten,
    paddingInlineEnd: space.four,
    paddingBlockEnd: space.four,
    color: colors.mutedText,
  },
})

export function AccordionGroup({ xstyle, ...props }: ElementProps<'div'> & StyleProps) {
  return <UIAccordion {...(props as object)} xstyle={xstyle ? [accordionStyles.group, xstyle] : accordionStyles.group} />
}

export function Accordion({ title, icon, children, xstyle }: TabLikeProps & StyleProps) {
  return (
    <AccordionItem xstyle={xstyle}>
      <AccordionTrigger>
        <span {...stylex.props(accordionStyles.itemLabel)}>
          {icon ? <Icon icon={icon} /> : null}
          {title}
        </span>
      </AccordionTrigger>
      <AccordionPanel xstyle={accordionStyles.panelBody}>
        <Stack gap={12}>{children}</Stack>
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

const codeGroupStyles = stylex.create({
  panel: { paddingBlockStart: 0 },
})

/** Tabbed code blocks. Labels come from each block's `title="…"` meta. */
export function CodeGroup({ children, xstyle }: { children?: React.ReactNode; xstyle?: StyleXStyles }) {
  const blocks = React.Children.toArray(children).filter((child) => React.isValidElement(child))
  const panels = blocks.map((block, index) => ({
    key: String(index),
    title: findCaption(block) ?? `Example ${index + 1}`,
    content: block,
  }))
  if (panels.length === 0) return null
  return (
    <UITabs defaultValue={panels[0].key} xstyle={xstyle}>
      <TabsList>
        {panels.map((panel) => (
          <TabsTrigger key={panel.key} value={panel.key}>
            {panel.title}
          </TabsTrigger>
        ))}
      </TabsList>
      {panels.map((panel) => (
        <TabsContent key={panel.key} value={panel.key} xstyle={codeGroupStyles.panel}>
          {panel.content}
        </TabsContent>
      ))}
    </UITabs>
  )
}

/* -------------------------------------------------------------------------- */
/* Media and inline bits                                                      */
/* -------------------------------------------------------------------------- */

const frameStyles = stylex.create({
  figure: { marginBlock: space.six },
  media: {
    overflow: 'hidden',
    borderRadius: radii.large,
    backgroundColor: colors.raised,
    boxShadow: elevation.press,
  },
  caption: {
    marginTop: space.two,
    textAlign: 'center',
    color: colors.mutedText,
  },
})

export function Frame({
  caption,
  xstyle,
  children,
  ...props
}: ElementProps<'figure'> & StyleProps & { caption?: React.ReactNode }) {
  return (
    <figure {...props} {...stylex.props(frameStyles.figure, xstyle)}>
      <div {...stylex.props(frameStyles.media)}>{children}</div>
      {caption ? (
        <figcaption {...stylex.props(frameStyles.caption, typography.labelRegular)}>{caption}</figcaption>
      ) : null}
    </figure>
  )
}

export function Badge(props: React.ComponentProps<typeof UIBadge>) {
  return <UIBadge {...props} />
}

const termStyles = stylex.create({
  term: {
    cursor: 'help',
    borderBottomWidth: 1,
    borderBottomStyle: 'dashed',
    borderBottomColor: colors.borderSoft,
    color: colors.text,
    fontWeight: type.medium,
  },
})

/** Inline term with a hover card. */
export function Term({ tip, children, xstyle }: { tip: React.ReactNode; children: React.ReactNode; xstyle?: StyleXStyles }) {
  return (
    <span
      title={typeof tip === 'string' ? tip : undefined}
      {...stylex.props(termStyles.term, xstyle)}
    >
      {children}
    </span>
  )
}

const videoStyles = stylex.create({
  frame: {
    marginBlock: space.six,
    aspectRatio: '16 / 9',
    overflow: 'hidden',
    borderRadius: radii.large,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.border,
  },
  video: { width: '100%', height: '100%' },
})

/** Embed a YouTube video. */
export function YouTube({ id, title = 'YouTube video', xstyle }: { id: string; title?: string; xstyle?: StyleXStyles }) {
  return (
    <div {...stylex.props(videoStyles.frame, xstyle)}>
      <iframe
        src={`https://www.youtube.com/embed/${id}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        {...stylex.props(videoStyles.video)}
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

const codeStyles = stylex.create({
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

/**
 * Overrides `<pre>` inside MDX so every code block gets a copy button.
 * The text is read from the DOM on click, so highlighted spans copy correctly.
 */
export function CodeBlock({ children, ...props }: ElementProps<'pre'>) {
  const ref = React.useRef<HTMLPreElement>(null)
  const [copied, setCopied] = React.useState(false)
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  React.useEffect(() => () => clearTimeout(timer.current), [])

  const copy = async () => {
    const text = ref.current?.textContent ?? ''
    if (!text) return
    if (!(await copyText(text))) return
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    // `novon-code-wrap` is a content class styled by theme.css (surface and
    // `position: relative`); the copy control below is StyleX.
    <div className="novon-code-wrap" data-copy-host="">
      <pre {...props} ref={ref} tabIndex={0}>
        {children}
      </pre>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? 'Copied' : 'Copy code'}
        {...stylex.props(codeStyles.copy)}
      >
        {copied ? <Check aria-hidden="true" size={16} /> : <Copy aria-hidden="true" size={16} />}
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
  Stack,
  Cluster,
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
  TreeView,
  LogoMarquee,
  BlurUpImage,
  SvglIcon,
  Term,
  Preview,
  YouTube,
  PostList: MdxPostList,
  TagList: MdxTagList,
  pre: CodeBlock,
  // Markdown tables keep the prose width; the wrapper scrolls horizontally so
  // a wide table never compresses its columns to fit.
  table: (props: ElementProps<'table'>) => (
    <div className="novon-table">
      <table {...props} />
    </div>
  ),
  a: ({ href = '', ...props }: ElementProps<'a'>) => {
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

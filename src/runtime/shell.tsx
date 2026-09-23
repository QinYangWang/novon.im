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
import * as stylex from '@stylexjs/stylex'
import { ArrowUpRight, Check, ChevronDown, ChevronLeft, ChevronRight, Copy, List as ListIcon, Loader2, Menu, Pencil, PanelLeft, X } from 'lucide-react'
import type { StyleXStyles } from '@stylexjs/stylex'
import type { Frontmatter, Route, RuntimeConfig, ThemeOverrides, TocEntry } from '../types.ts'
import { formatDate, isExternal, tagSlug, withBase } from './lib.ts'
import { markdownPath } from '../paths.ts'
import { blogIndexPath, blogTagsPath } from '../layers.ts'
import { behavior } from './design-system/behaviors.ts'
import { colors, layout, media, radii, space, theme, type } from './design-system/tokens.stylex.ts'
import { typography } from './design-system/typography.ts'
import type { StyleProps } from './design-system/props.ts'
import { useBase, useConfig, useSite } from './site.tsx'
import { SearchTrigger } from './search.tsx'
import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger, Badge, Dialog, DialogClose, DialogContent, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, ScrollArea } from './ui.tsx'
import { Icon } from './icons.tsx'
import { SvglIcon } from './svgl.tsx'
import { copyText, isMarkdownDocument } from './actions.ts'
import { TOC_READING_OFFSET, closingReadingOffset, hashToId, resolveActiveHeading, type HeadingOffset } from './toc.ts'
import { CopyUrlButton, PillNav, ReadingProgress, Reveal, ScrollProgress, Section, SocialPills, ThemeSwitch, ThemeToggle } from './kit.tsx'
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
function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="currentColor" width={size} height={size}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}

const spin = stylex.keyframes({ from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } })

const styles = stylex.create({
  /* Brand */
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: space.two,
    fontSize: type.label,
    fontWeight: type.semibold,
    lineHeight: type.compactLeading,
    textDecoration: 'none',
  },
  brandLogoBox: {
    display: 'flex',
    width: space.six,
    height: space.six,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogo: { width: space.six, height: space.six },
  brandLogoLight: { display: theme.lightOnly },
  brandLogoDark: { display: theme.darkOnly },
  brandTitle: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: colors.text,
  },

  /* Header */
  header: { display: 'flex', flexDirection: 'column', gap: space.six },
  headerTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.four,
  },
  headerName: { minWidth: 0 },
  headerTitle: { fontSize: type.body, fontWeight: type.medium, lineHeight: type.compactLeading, color: colors.text },
  headerDescription: { color: colors.mutedText },
  headerControls: { display: 'flex', flexShrink: 0, alignItems: 'center', gap: space.three },
  headerNav: { display: 'flex', alignItems: 'center', gap: space.two },
  headerSearch: { marginInlineStart: 'auto', width: '9rem' },

  /* Footer */
  footer: { paddingBlockStart: space.six },
  footerEmail: { color: colors.mutedText },
  footerEmailLink: {
    color: colors.text,
    textDecorationLine: 'underline',
    textUnderlineOffset: 4,
  },
  footerPills: { display: 'flex', flexWrap: 'wrap', gap: space.two, marginTop: space.five },
  footerCopy: { paddingBlockStart: space.two, color: colors.mutedText },

  /* Sidebar */
  navList: { display: 'flex', flexDirection: 'column', gap: space.half },
  navItem: {
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    gap: space.two,
    paddingBlock: space.oneHalf,
    paddingInlineEnd: space.three,
    borderRadius: radii.control,
    fontSize: type.label,
    lineHeight: type.compactLeading,
    textDecoration: 'none',
    transitionProperty: 'color, background-color',
    transitionDuration: '150ms',
    backgroundColor: { default: 'transparent', ':hover': colors.hoverSoft },
    color: { default: colors.mutedText, ':hover': colors.text },
  },
  navItemActive: {
    backgroundColor: colors.hover,
    fontWeight: type.medium,
    color: colors.text,
    ':hover': { backgroundColor: colors.hover, color: colors.text },
  },
  navItemRoot: { paddingInlineStart: space.twoHalf },
  navItemNested: { paddingInlineStart: space.six },
  navSection: { paddingBlockStart: space.four, ':first-child': { paddingBlockStart: space.one } },
  navSectionLabel: {
    paddingInline: space.twoHalf,
    paddingBlockEnd: space.oneHalf,
    fontSize: type.caption,
    fontWeight: type.medium,
    lineHeight: type.compactLeading,
    letterSpacing: type.looseTracking,
    textTransform: 'uppercase',
    color: colors.mutedText,
  },
  navIcon: { opacity: 0.8 },
  navGroupTrigger: {
    paddingBlock: space.oneHalf,
    paddingInlineStart: space.twoHalf,
    paddingInlineEnd: space.three,
    gap: space.two,
    borderRadius: radii.control,
    fontSize: type.label,
    fontWeight: type.regular,
    color: { default: colors.mutedText, ':hover': colors.text },
    backgroundColor: { default: 'transparent', ':hover': colors.hoverSoft, ':focus-visible': colors.hoverSoft },
  },
  navGroupLabel: { display: 'flex', minWidth: 0, alignItems: 'center', gap: space.two },
  navGroupPanel: { paddingBlockEnd: 0 },
  navGroupInner: { paddingInlineStart: space.one },

  sidebar: { display: 'flex', height: '100%', flexDirection: 'column', backgroundColor: colors.surfaceSoft },
  sidebarHead: {
    display: 'flex',
    height: layout.header,
    flexShrink: 0,
    alignItems: 'center',
    gap: space.two,
    paddingInline: space.four,
  },
  sidebarSearch: { flexShrink: 0, paddingInline: space.three, paddingBlockEnd: space.two },
  sidebarSearchFull: { width: '100%' },
  sidebarNav: {
    minHeight: 0,
    flex: 1,
    overflowY: 'auto',
    paddingInline: space.three,
    paddingBlockEnd: space.six,
  },
  sidebarFoot: {
    display: 'flex',
    height: space.twelve,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: colors.border,
    paddingInline: space.three,
  },

  iconButton: {
    display: 'inline-flex',
    width: space.eight,
    height: space.eight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderRadius: radii.control,
    color: colors.mutedText,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    borderWidth: 0,
    borderStyle: 'none',
    transitionProperty: 'color, background-color',
    transitionDuration: '150ms',
    ':hover': { backgroundColor: colors.hover, color: colors.text },
  },
  iconButtonSmall: { width: space.seven, height: space.seven },
  pushEnd: { marginInlineStart: 'auto' },

  /* Docs mobile header */
  mobileHeader: {
    position: 'sticky',
    top: 0,
    zIndex: 40,
    display: { default: 'flex', [media.wide]: 'none' },
    height: layout.header,
    alignItems: 'center',
    gap: space.three,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: colors.border,
    backgroundColor: colors.canvasSoft,
    paddingInline: space.four,
    backdropFilter: 'blur(12px)',
  },
  mobileNav: {
    marginInlineStart: space.two,
    display: { default: 'none', [media.small]: 'flex' },
    alignItems: 'center',
    gap: space.half,
  },
  mobileNavLink: {
    borderRadius: radii.control,
    paddingInline: space.three,
    paddingBlock: space.oneHalf,
    fontSize: type.label,
    lineHeight: type.compactLeading,
    color: colors.mutedText,
    textDecoration: 'none',
    transitionProperty: 'color, background-color',
    transitionDuration: '150ms',
    ':hover': { backgroundColor: colors.hover, color: colors.text },
  },
  mobileControls: { marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: space.one },
  mobileSearch: {
    width: { default: space.eight, [media.small]: '11rem' },
    padding: 0,
    paddingInline: { default: 0, [media.small]: space.three },
    justifyContent: { default: 'center', [media.small]: 'flex-start' },
  },

  /* Table of contents */
  tocItem: { marginTop: 0 },
  tocItemSpaced: { marginTop: space.two },
  tocLink: {
    display: 'block',
    marginInlineStart: '-1px',
    borderInlineStartWidth: 2,
    borderInlineStartStyle: 'solid',
    paddingBlock: space.one,
    paddingInlineEnd: space.two,
    textDecoration: 'none',
    transitionProperty: 'color, border-color',
    transitionDuration: '150ms',
    color: { default: colors.mutedText, ':hover': colors.text },
    borderInlineStartColor: 'transparent',
  },
  tocLinkActive: {
    borderInlineStartColor: colors.strong,
    fontWeight: type.medium,
    color: colors.text,
  },
  tocDepth2: { paddingInlineStart: space.three },
  tocDepth3: { paddingInlineStart: space.six },
  tocDepth4: { paddingInlineStart: space.nine },
  tocTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: space.two,
    fontWeight: type.medium,
    color: colors.text,
  },
  tocList: {
    marginTop: space.three,
    borderInlineStartWidth: 1,
    borderInlineStartStyle: 'solid',
    borderInlineStartColor: colors.border,
  },

  /* Page chrome */
  actions: { marginTop: space.six, display: 'flex', flexDirection: 'column', gap: space.two },
  actionsRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: space.two },
  actionControl: { height: space.eight, minHeight: space.eight },
  labelGrid: { display: 'grid' },
  labelCell: { gridColumnStart: 1, gridRowStart: 1 },
  labelHidden: { visibility: 'hidden' },
  menuIconSlot: { flex: 1 },
  menuArrow: { color: colors.mutedText },
  status: { fontSize: type.label, lineHeight: type.compactLeading, color: colors.mutedText },
  errorLabel: { display: 'block', fontSize: type.label, lineHeight: type.compactLeading, color: colors.mutedText },
  errorArea: {
    marginTop: space.one,
    height: '8rem',
    width: '100%',
    resize: 'vertical',
    borderRadius: radii.control,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    padding: space.two,
    fontFamily: type.mono,
    fontSize: type.caption,
    color: colors.text,
  },
  spin: { animationName: spin, animationDuration: '1s', animationIterationCount: 'infinite', animationTimingFunction: 'linear' },
  actionButton: {
    display: 'inline-flex',
    height: space.eight,
    minHeight: space.eight,
    alignItems: 'center',
    gap: space.two,
    whiteSpace: 'nowrap',
    borderRadius: radii.control,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    paddingInline: space.three,
    fontSize: type.label,
    fontWeight: type.medium,
    lineHeight: type.compactLeading,
    color: colors.text,
    cursor: 'pointer',
    transitionProperty: 'color, background-color, opacity',
    transitionDuration: '150ms',
    ':hover': { backgroundColor: colors.hover },
    pointerEvents: { default: 'auto', ':disabled': 'none' },
    opacity: { default: 1, ':disabled': 0.6 },
  },
  socialPills: { marginTop: space.five },
  fullHeight: { height: '100%' },
  progressGap: { marginTop: space.three },
  mobileScroll: { height: '100%' },
  openMenu: { width: '16rem' },

  pageHeader: { display: 'flex', flexDirection: 'column', gap: space.three },
  pageHeaderSpaced: { marginBlockEnd: space.six },
  pageDescription: { color: colors.mutedText },
  pageMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: space.four,
    rowGap: space.two,
    color: colors.mutedText,
  },
  divider: { marginBlockEnd: space.eight, borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: colors.border },
  articleDivider: { marginBlock: space.eight, borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: colors.border },

  pageNav: { marginTop: space.twelve, display: 'flex', flexDirection: 'column', gap: space.six },
  pagination: {
    display: 'grid',
    gap: space.three,
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: colors.border,
    paddingBlockStart: space.six,
    gridTemplateColumns: { default: '1fr', [media.small]: 'repeat(2, minmax(0, 1fr))' },
  },
  pageLink: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.one,
    borderRadius: radii.large,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.border,
    padding: space.four,
    textDecoration: 'none',
    transitionProperty: 'color, background-color',
    transitionDuration: '150ms',
    backgroundColor: { default: 'transparent', ':hover': colors.hoverSoft },
  },
  pageLinkNext: { alignItems: 'flex-end', textAlign: 'end' },
  pageLinkLabel: { display: 'flex', alignItems: 'center', gap: space.one, fontSize: type.caption, lineHeight: type.compactLeading, color: colors.mutedText },
  pageLinkTitle: { fontWeight: type.medium, color: colors.text },
  editRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.two,
    color: colors.mutedText,
  },
  editLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: space.oneHalf,
    textDecoration: 'none',
    ':hover': { color: colors.text },
  },

  /* Blog */
  postItem: {
    display: 'block',
    marginInline: -space.two,
    borderRadius: radii.surface,
    paddingInline: space.two,
    paddingBlock: space.three,
    textDecoration: 'none',
    transitionProperty: 'color, background-color',
    transitionDuration: '150ms',
    backgroundColor: { default: 'transparent', ':hover': colors.hoverSoft, ':focus-visible': colors.hoverSoft },
  },
  postTitle: { fontWeight: type.medium, color: colors.text },
  postDescription: { marginTop: space.half, color: colors.mutedText },
  postList: { marginBlock: -space.three },
  postListTitle: {
    marginBlockEnd: space.three,
    fontSize: type.heading,
    fontWeight: type.medium,
    lineHeight: type.headingLeading,
    letterSpacing: '-0.01em',
    color: colors.text,
  },
  postCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.one,
    borderRadius: radii.large,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.border,
    padding: space.four,
    textDecoration: 'none',
    transitionProperty: 'color, background-color',
    transitionDuration: '150ms',
    backgroundColor: { default: 'transparent', ':hover': colors.hoverSoft },
  },
  tagList: { marginBlock: space.eight, display: 'flex', flexWrap: 'wrap', gap: space.two },
  tagLink: { textDecoration: 'none' },
  tagCount: { opacity: 0.6 },
  backLink: { color: colors.mutedText, textDecoration: 'none', ':hover': { color: colors.text } },
  tagTitle: {
    marginTop: space.four,
    fontSize: type.title,
    fontWeight: type.medium,
    lineHeight: type.titleLeading,
    letterSpacing: type.tightTracking,
    color: colors.text,
  },
  tagPosts: { marginTop: space.six },

  notFound: { paddingBlock: space.twelve, textAlign: 'center' },
  notFoundLabel: { fontSize: type.caption, fontWeight: type.medium, lineHeight: type.compactLeading, color: colors.mutedText },
  notFoundTitle: {
    marginTop: space.two,
    fontSize: type.title,
    fontWeight: type.medium,
    lineHeight: type.titleLeading,
    letterSpacing: type.tightTracking,
    color: colors.text,
  },
  notFoundBody: { marginTop: space.three, color: colors.mutedText },
  notFoundCode: {
    borderRadius: radii.control,
    backgroundColor: colors.muted,
    paddingInline: space.oneHalf,
    paddingBlock: space.half,
    fontSize: type.label,
  },
  notFoundLink: {
    marginTop: space.six,
    display: 'inline-flex',
    alignItems: 'center',
    gap: space.oneHalf,
    borderRadius: radii.control,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.border,
    paddingInline: space.threeHalf,
    paddingBlock: space.oneHalf,
    fontSize: type.label,
    lineHeight: type.compactLeading,
    textDecoration: 'none',
    transitionProperty: 'color, background-color',
    transitionDuration: '150ms',
    ':hover': { backgroundColor: colors.hover },
  },

  /* Layouts */
  layoutRoot: { minHeight: '100vh' },
  progressTop: { display: { default: 'block', [media.xwide]: 'none' } },
  docsRow: { display: 'flex' },
  aside: {
    position: 'sticky',
    top: 0,
    height: '100dvh',
    flexShrink: 0,
    borderInlineEndWidth: 1,
    borderInlineEndStyle: 'solid',
    borderInlineEndColor: colors.border,
    display: { default: 'none', [media.wide]: 'block' },
  },
  asideWidth: (collapsed: boolean) => ({ width: collapsed ? '3.5rem' : 'var(--novon-sidebar-width)' }),
  collapsedRail: {
    display: 'flex',
    height: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: colors.surfaceSoft,
  },
  collapsedHead: { display: 'flex', height: layout.header, alignItems: 'center' },
  collapsedFoot: { marginTop: 'auto', display: 'flex', height: space.twelve, alignItems: 'center' },
  mobileDialog: {
    position: 'fixed',
    insetInline: 0,
    top: layout.header,
    bottom: 0,
    height: 'auto',
    maxWidth: 'none',
    borderRadius: 0,
    borderWidth: 0,
    borderStyle: 'none',
    backgroundColor: colors.canvas,
    padding: 0,
    boxShadow: 'none',
    display: { default: 'block', [media.wide]: 'none' },
  },
  mobileClose: {
    position: 'absolute',
    top: space.three,
    insetInlineEnd: space.three,
    zIndex: 10,
    display: 'inline-flex',
    width: space.eight,
    height: space.eight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.control,
    color: colors.mutedText,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    borderWidth: 0,
    borderStyle: 'none',
    transitionProperty: 'color, background-color',
    transitionDuration: '150ms',
    ':hover': { backgroundColor: colors.hover, color: colors.text },
  },
  main: { minWidth: 0, flex: 1 },
  tocAside: {
    position: 'sticky',
    top: 0,
    height: '100vh',
    flexShrink: 0,
    overflowY: 'auto',
    paddingInline: space.four,
    paddingBlock: space.ten,
    display: { default: 'none', [media.xwide]: 'block' },
  },
  tocAsideWidth: { width: 'var(--novon-toc-width)' },
  docsPage: {
    marginInline: 'auto',
    width: '100%',
    paddingInline: { default: space.four, [media.small]: space.six, [media.wide]: space.ten },
    paddingBlock: { default: space.eight, [media.wide]: space.ten },
  },
  docsPageDefault: { maxWidth: 'var(--novon-content-width)' },
  docsPageWide: { maxWidth: '64rem' },
  docsPageFull: { maxWidth: '80rem' },
  blogLayout: {
    marginInline: 'auto',
    width: '100%',
    maxWidth: 'var(--novon-column-width)',
    paddingBlockStart: space.fourteen,
    paddingBlockEnd: space.sixteen,
    paddingInline: { default: space.four, [media.medium]: 0 },
  },
  blogMain: { marginTop: space.twelve },
  articleTitle: {
    fontSize: type.title,
    fontWeight: type.medium,
    lineHeight: type.titleLeading,
    letterSpacing: type.tightTracking,
    color: colors.text,
  },
  postMeta: {
    marginTop: space.three,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: space.two,
    color: colors.mutedText,
  },
  postDescriptionLede: { marginTop: space.four, color: colors.mutedText },
  cover: { marginBlockEnd: space.eight },
  coverImage: {
    width: '100%',
    borderRadius: radii.large,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.border,
  },
  coverCaption: {
    marginTop: space.three,
    textAlign: 'center',
    color: colors.mutedText,
  },
  allPosts: {
    marginTop: space.twelve,
    display: 'inline-flex',
    alignItems: 'center',
    gap: space.oneHalf,
    color: colors.mutedText,
    textDecoration: 'none',
    transitionProperty: 'color',
    transitionDuration: '150ms',
    ':hover': { color: colors.text },
  },
})

/* -------------------------------------------------------------------------- */
/* Brand                                                                      */
/* -------------------------------------------------------------------------- */

export function Brand({ xstyle, showTitle = true }: StyleProps & { showTitle?: boolean }) {
  const config = useConfig()
  const base = useBase()
  const logo = config.theme.logo
  const logoDark = config.theme.logoDark
  return (
    <a href={withBase(base, '/')} {...stylex.props(styles.brand, xstyle)}>
      {logo ? (
        <span {...stylex.props(styles.brandLogoBox)}>
          <img src={withBase(base, logo)} alt="" {...stylex.props(styles.brandLogo, !logoDark ? null : styles.brandLogoLight)} />
          {logoDark ? <img src={withBase(base, logoDark)} alt="" {...stylex.props(styles.brandLogo, styles.brandLogoDark)} /> : null}
        </span>
      ) : null}
      {showTitle ? <span {...stylex.props(styles.brandTitle)}>{config.title}</span> : null}
    </a>
  )
}

/* -------------------------------------------------------------------------- */
/* Blog header and footer                                                     */
/* -------------------------------------------------------------------------- */

/** Name, role, navigation pills and the reading controls. */
export function DefaultHeader({ xstyle }: StyleProps) {
  const config = useConfig()
  const items =
    config.nav.length > 0
      ? config.nav.map((item) => ({ label: item.label, href: item.href }))
      : [{ label: 'home', href: '/' }]

  return (
    <header {...stylex.props(styles.header, xstyle)}>
      <div {...stylex.props(styles.headerTop)}>
        <div {...stylex.props(styles.headerName)}>
          <p {...stylex.props(styles.headerTitle)}>{config.title}</p>
          {config.description ? (
            <p {...stylex.props(styles.headerDescription, typography.labelRegular)}>{config.description}</p>
          ) : null}
        </div>
        <div {...stylex.props(styles.headerControls)}>
          <CopyUrlButton />
          {config.theme.darkMode ? <ThemeToggle /> : null}
        </div>
      </div>
      <div {...stylex.props(styles.headerNav)}>
        <PillNav items={items} />
        {config.features.search ? <SearchTrigger xstyle={styles.headerSearch} /> : null}
      </div>
    </header>
  )
}

export function DefaultFooter({ xstyle, variant = 'blog' }: StyleProps & { variant?: 'blog' | 'docs' }) {
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
    <footer {...stylex.props(styles.footer, xstyle)}>
      <Section title="Connect">
        {email ? (
          <p {...stylex.props(styles.footerEmail, typography.labelRegular)}>
            Feel free to contact me at{' '}
            <a href={`mailto:${email}`} {...stylex.props(styles.footerEmailLink)}>
              {email}
            </a>
          </p>
        ) : null}
        <SocialPills xstyle={email ? styles.socialPills : undefined} />
        {pills.length > 0 ? (
          <div {...stylex.props(styles.footerPills)}>
            {pills.map((pill) => (
              <a
                key={pill.href}
                href={pill.href}
                {...(pill.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                {...stylex.props(pillLinkStyle.pill)}
              >
                {pill.label}
                <ArrowUpRight aria-hidden="true" size={16} {...stylex.props(pillLinkStyle.arrow)} />
              </a>
            ))}
          </div>
        ) : null}
      </Section>
      <p {...stylex.props(styles.footerCopy, typography.labelRegular)}>
        {footer.text ?? `© ${new Date().getFullYear()} ${config.title}`}
      </p>
    </footer>
  )
}

const pillLinkStyle = stylex.create({
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: space.oneHalf,
    borderRadius: radii.control,
    backgroundColor: { default: colors.subtle, ':hover': colors.hover },
    color: colors.text,
    paddingInline: space.twoHalf,
    paddingBlock: space.one,
    fontSize: type.label,
    lineHeight: type.compactLeading,
    textDecoration: 'none',
    transitionProperty: 'color, background-color',
    transitionDuration: '150ms',
  },
  arrow: { color: colors.mutedText },
})

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
      {...stylex.props(
        styles.navItem,
        indent ? styles.navItemNested : styles.navItemRoot,
        active && styles.navItemActive,
      )}
    >
      {item.icon ? <Icon icon={item.icon} /> : null}
      <span {...stylex.props(styles.brandTitle)}>{item.label}</span>
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
    <ul {...stylex.props(styles.navList)}>
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
            <li key={node.label} {...stylex.props(styles.navSection)}>
              <p {...stylex.props(styles.navSectionLabel)}>{node.label}</p>
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
        <AccordionItem value="group" xstyle={styles.navGroupPanel}>
          <AccordionTrigger xstyle={styles.navGroupTrigger}>
            <span {...stylex.props(styles.navGroupLabel)}>
              {node.icon ? <Icon icon={node.icon} /> : null}
              <span {...stylex.props(styles.brandTitle)}>{node.label}</span>
            </span>
          </AccordionTrigger>
          <AccordionPanel>
            <div {...stylex.props(styles.navGroupInner)}>
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
  xstyle,
}: {
  nav: NavNode[]
  current: string
  onNavigate?: () => void
  onCollapse?: () => void
  xstyle?: StyleXStyles
}) {
  const config = useConfig()
  const social = config.theme.social ?? {}

  return (
    <div {...stylex.props(styles.sidebar, xstyle)}>
      <div {...stylex.props(styles.sidebarHead)}>
        <Brand />
        {onCollapse ? (
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Collapse sidebar"
            aria-expanded="true"
            aria-controls="novon-sidebar"
            title="Collapse sidebar"
            {...stylex.props(styles.iconButton, styles.pushEnd)}
          >
            <PanelLeft aria-hidden="true" size={14} />
          </button>
        ) : null}
      </div>

      {config.features.search ? (
        <div {...stylex.props(styles.sidebarSearch)}>
          <SearchTrigger xstyle={styles.sidebarSearchFull} />
        </div>
      ) : null}

      <nav aria-label="Documentation" {...stylex.props(styles.sidebarNav, behavior.scroll)}>
        {nav.length > 0 ? <NavTree nodes={nav} current={current} onNavigate={onNavigate} /> : null}
      </nav>

      <div {...stylex.props(styles.sidebarFoot)}>
        {social.github ? (
          <a
            href={social.github}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            {...stylex.props(styles.iconButton, styles.iconButtonSmall)}
          >
            <GithubIcon size={14} />
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
export function DefaultDocsHeader({ onToggleNav, navOpen, xstyle }: { onToggleNav?: () => void; navOpen?: boolean; xstyle?: StyleXStyles }) {
  const config = useConfig()
  const base = useBase()
  return (
    <header {...stylex.props(styles.mobileHeader, xstyle)}>
      {onToggleNav ? (
        <button
          type="button"
          onClick={onToggleNav}
          aria-label={navOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={navOpen}
          aria-controls="novon-mobile-sidebar"
          {...stylex.props(styles.iconButton)}
        >
          {navOpen ? <X aria-hidden="true" size={14} /> : <Menu aria-hidden="true" size={14} />}
        </button>
      ) : null}
      <Brand />
      <nav {...stylex.props(styles.mobileNav)}>
        {config.nav.map((item) => (
          <a
            key={item.href}
            href={isExternal(item.href) ? item.href : withBase(base, item.href)}
            {...(isExternal(item.href) ? { target: '_blank', rel: 'noreferrer' } : {})}
            {...stylex.props(styles.mobileNavLink)}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <div {...stylex.props(styles.mobileControls)}>
        {config.features.search ? <SearchTrigger xstyle={styles.mobileSearch} /> : null}
        {config.theme.darkMode ? <ThemeToggle /> : null}
      </div>
    </header>
  )
}

/* -------------------------------------------------------------------------- */
/* Table of contents                                                          */
/* -------------------------------------------------------------------------- */

/**
 * One row of the "On this page" list. Memoised so a scroll only re-renders the
 * two rows whose active state changed, never the whole list.
 */
const TocItem = React.memo(function TocItem({
  heading,
  active,
  spaced,
}: {
  heading: TocEntry
  active: boolean
  spaced: boolean
}) {
  return (
    <li {...stylex.props(spaced ? styles.tocItemSpaced : styles.tocItem)}>
      <a
        href={`#${heading.id}`}
        data-toc-id={heading.id}
        aria-current={active ? 'location' : undefined}
        {...stylex.props(
          typography.labelRegular,
          styles.tocLink,
          heading.depth === 2 ? styles.tocDepth2 : heading.depth === 3 ? styles.tocDepth3 : styles.tocDepth4,
          heading.depth > 3 && typography.micro,
          active && styles.tocLinkActive,
        )}
      >
        {heading.text}
      </a>
    </li>
  )
})

export function DefaultTableOfContents({ headings, xstyle }: { headings: TocEntry[]; xstyle?: StyleXStyles }) {
  const [activeId, setActiveId] = React.useState('')
  const listRef = React.useRef<HTMLUListElement>(null)
  const anchorsRef = React.useRef(new Map<string, HTMLAnchorElement>())
  const containerRef = React.useRef<HTMLElement | null>(null)
  const activeRef = React.useRef('')
  /** Heading a click or hash jump is scrolling to; owns the highlight until the scroll settles. */
  const pendingRef = React.useRef<string | null>(null)
  const lastScrollRef = React.useRef(0)
  const settledRef = React.useRef(0)

  /**
   * Apply the active heading and, in the same frame, nudge the TOC's own scroll
   * box so the active row stays visible. Kept out of the render path: during a
   * fast scroll this runs once per frame and must not re-render the whole list.
   */
  const applyActive = React.useCallback((id: string) => {
    if (activeRef.current === id) return
    activeRef.current = id
    setActiveId(id)

    const container = containerRef.current
    const anchor = anchorsRef.current.get(id)
    if (!container || !anchor) return
    const box = container.getBoundingClientRect()
    if (box.height === 0) return // the TOC is hidden at this breakpoint
    const row = anchor.getBoundingClientRect()
    const pad = 8
    if (row.top < box.top + pad) container.scrollTop -= box.top + pad - row.top
    else if (row.bottom > box.bottom - pad) container.scrollTop += row.bottom - (box.bottom - pad)
  }, [])

  React.useEffect(() => {
    const list = listRef.current
    if (!list || headings.length === 0) return

    const anchors = new Map<string, HTMLAnchorElement>()
    for (const anchor of list.querySelectorAll<HTMLAnchorElement>('a[data-toc-id]')) {
      const id = anchor.dataset.tocId
      if (id) anchors.set(id, anchor)
    }
    anchorsRef.current = anchors
    containerRef.current = scrollableAncestor(list)

    const ids = headings.map((heading) => heading.id)
    // The reading line is the position a heading lands on after an anchor jump,
    // so the highlight agrees with the page instead of leading or trailing it.
    const readingOffset = readingOffsetFor(document.getElementById(ids[0]))

    // A new page starts clean; `update()` below paints the first active row.
    activeRef.current = ''
    settledRef.current = 0
    lastScrollRef.current = window.scrollY
    const hashId = hashToId(window.location.hash)
    pendingRef.current = hashId && ids.includes(hashId) ? hashId : null

    let frame: number | null = null

    const update = () => {
      frame = null
      const scrollY = window.scrollY
      const viewportHeight = window.innerHeight
      const scrollHeight = document.documentElement.scrollHeight

      // One batched read pass over fresh positions. A heading that moved since
      // the last frame (image, embed, font swap) can therefore never leave a
      // stale highlight behind, and nothing is written until every measurement
      // is in, so the frame costs a single layout instead of a read/write loop.
      const offsets: HeadingOffset[] = []
      for (const id of ids) {
        const element = document.getElementById(id)
        if (element) offsets.push({ id, top: element.getBoundingClientRect().top + scrollY })
      }

      // A short closing section may sit below the furthest the reading line can
      // reach, which would otherwise skip it and jump straight to the last
      // heading. Let the line catch up to it over the final viewport of scroll
      // so the outline still visits every section in order.
      const maxScroll = Math.max(0, scrollHeight - viewportHeight)
      const lastTop = offsets[offsets.length - 1]?.top ?? scrollY
      const offset = readingOffset + closingReadingOffset({ lastTop, scrollY, viewportHeight, maxScroll, readingOffset })
      let next = resolveActiveHeading(offsets, { scrollY, readingOffset: offset })

      // A click or hash jump owns the highlight until the reader takes over or
      // the destination scrolls out of view, so it cannot flicker through the
      // sections it passes and does not fall back on a timer.
      const pending = pendingRef.current
      if (pending) {
        settledRef.current = Math.abs(scrollY - lastScrollRef.current) < 1 ? settledRef.current + 1 : 0
        const element = document.getElementById(pending)
        const rect = element?.getBoundingClientRect()
        const onScreen = Boolean(rect && rect.bottom > 0 && rect.top < viewportHeight)
        if (settledRef.current >= 2 && !onScreen) {
          pendingRef.current = null
        } else {
          next = pending
          // Keep sampling until the jump settles, then the highlight just stays.
          if (settledRef.current < 2) schedule()
        }
      }
      lastScrollRef.current = scrollY

      applyActive(next)
    }

    const schedule = () => {
      if (frame !== null) return
      frame = window.requestAnimationFrame(update)
    }

    // Any real user input takes ownership back from a pending click/hash jump.
    const release = () => {
      pendingRef.current = null
    }

    const onHashChange = () => {
      const id = hashToId(window.location.hash)
      if (!id || !ids.includes(id)) return
      pendingRef.current = id
      settledRef.current = 0
      lastScrollRef.current = window.scrollY
      applyActive(id)
    }

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    window.addEventListener('wheel', release, { passive: true })
    window.addEventListener('touchstart', release, { passive: true })
    // A scrollbar drag emits no wheel event, so a pointer down also releases.
    window.addEventListener('pointerdown', release, { passive: true })
    window.addEventListener('keydown', release)
    window.addEventListener('hashchange', onHashChange)

    // Content that loads after paint moves the headings without a scroll event.
    let observer: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(schedule)
      observer.observe(document.body)
    }
    document.fonts?.ready.then(schedule).catch(() => {})

    update()

    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('wheel', release)
      window.removeEventListener('touchstart', release)
      window.removeEventListener('pointerdown', release)
      window.removeEventListener('keydown', release)
      window.removeEventListener('hashchange', onHashChange)
      observer?.disconnect()
      if (frame !== null) window.cancelAnimationFrame(frame)
    }
  }, [headings, applyActive])

  // One handler for the list, so the memoised rows stay prop-stable.
  const onListClick = React.useCallback(
    (event: React.MouseEvent<HTMLUListElement>) => {
      const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[data-toc-id]')
      const id = anchor?.dataset.tocId
      if (!id) return
      pendingRef.current = id
      settledRef.current = 0
      lastScrollRef.current = window.scrollY
      applyActive(id)
    },
    [applyActive],
  )

  if (headings.length === 0) return null

  return (
    <nav aria-label="On this page" {...stylex.props(xstyle)}>
      <p {...stylex.props(styles.tocTitle, typography.label)}>
        <ListIcon aria-hidden="true" size={16} {...stylex.props(styles.menuArrow)} />
        On this page
      </p>
      <ReadingProgress xstyle={styles.progressGap} />
      <ul ref={listRef} onClick={onListClick} {...stylex.props(styles.tocList)}>
        {headings.map((heading, index) => (
          <TocItem
            key={heading.id}
            heading={heading}
            active={activeId === heading.id}
            spaced={heading.depth === 2 && index > 0}
          />
        ))}
      </ul>
    </nav>
  )
}

/**
 * The reading line is the anchor landing position: the same `scroll-margin-top`
 * the browser applies when a TOC link is followed.
 */
function readingOffsetFor(element: HTMLElement | null): number {
  if (!element) return TOC_READING_OFFSET
  const margin = Number.parseFloat(getComputedStyle(element).scrollMarginTop)
  return Number.isFinite(margin) ? margin : TOC_READING_OFFSET
}

/** Nearest ancestor that scrolls vertically, if any. */
function scrollableAncestor(element: HTMLElement): HTMLElement | null {
  let parent = element.parentElement
  while (parent) {
    const overflow = getComputedStyle(parent).overflowY
    if (overflow === 'auto' || overflow === 'scroll') return parent
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

/**
 * Every label is rendered in the same grid cell so the button keeps the width
 * of the longest one. A width that changed with the state would shift the
 * neighbouring controls on every click.
 */
const COPY_LABELS: Record<CopyState, string> = {
  idle: 'Copy Markdown',
  copying: 'Copying…',
  copied: 'Copied',
  error: 'Retry copy',
}

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
    <div {...stylex.props(styles.actions)}>
      <div {...stylex.props(styles.actionsRow)}>
        <button
          type="button"
          onClick={copy}
          disabled={state === 'copying'}
          {...stylex.props(styles.actionButton)}
        >
          {state === 'copied' ? (
            <Check aria-hidden="true" size={16} />
          ) : state === 'copying' ? (
            <Loader2 aria-hidden="true" size={16} {...stylex.props(styles.spin)} />
          ) : (
            <Copy aria-hidden="true" size={16} />
          )}
          <span {...stylex.props(styles.labelGrid)}>
            {(Object.keys(COPY_LABELS) as CopyState[]).map((key) => (
              <span key={key} {...stylex.props(styles.labelCell, key !== state && styles.labelHidden)}>
                {COPY_LABELS[key]}
              </span>
            ))}
          </span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger xstyle={styles.actionButton}>
            Open
            <ChevronDown aria-hidden="true" size={16} {...stylex.props(styles.menuArrow)} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" xstyle={styles.openMenu}>
            <DropdownMenuLabel>Raw source</DropdownMenuLabel>
            <DropdownMenuItem render={<a href={url} target="_blank" rel="noreferrer" />}>
              <SvglIcon name="markdown" />
              <span {...stylex.props(styles.menuIconSlot)}>View Markdown</span>
              <ArrowUpRight aria-hidden="true" size={16} {...stylex.props(styles.menuArrow)} />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Ask an AI</DropdownMenuLabel>
            <DropdownMenuItem render={<a href={chatgpt} target="_blank" rel="noreferrer" />}>
              <SvglIcon name="openai" />
              <span {...stylex.props(styles.menuIconSlot)}>Open in ChatGPT</span>
              <ArrowUpRight aria-hidden="true" size={16} {...stylex.props(styles.menuArrow)} />
            </DropdownMenuItem>
            <DropdownMenuItem render={<a href={claude} target="_blank" rel="noreferrer" />}>
              <SvglIcon name="claude" />
              <span {...stylex.props(styles.menuIconSlot)}>Open in Claude</span>
              <ArrowUpRight aria-hidden="true" size={16} {...stylex.props(styles.menuArrow)} />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <span role="status" aria-live="polite" {...stylex.props(styles.status)}>
        {state === 'copied' ? 'Markdown copied' : state === 'error' ? error : ''}
      </span>

      {state === 'error' && source ? (
        <label {...stylex.props(styles.errorLabel)}>
          Select the Markdown below and copy it manually.
          <textarea
            readOnly
            value={source}
            onFocus={(event) => event.currentTarget.select()}
            {...stylex.props(styles.errorArea, behavior.scroll)}
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
  xstyle,
}: {
  title: string
  description?: string
  meta?: Frontmatter
  path?: string
  actions?: boolean
  xstyle?: StyleXStyles
}) {
  const config = useConfig()
  const date = formatDate(meta?.date, config.language)
  const author = typeof meta?.author === 'string' ? meta.author : (meta?.author?.name ?? config.author)

  return (
    <header {...stylex.props(styles.pageHeader, xstyle)}>
      <h1 {...stylex.props(typography.pageTitle)}>{title}</h1>
      {description ? <p {...stylex.props(styles.pageDescription, typography.lede)}>{description}</p> : null}
      {(date || author || (meta?.tags?.length ?? 0) > 0) && !actions ? (
        <div {...stylex.props(styles.pageMeta, typography.labelRegular)}>
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

/** The MDX article body. Content styles live in theme.css's `.novon-prose`. */
export function Prose({ children }: { children: React.ReactNode }) {
  return <div className="novon-prose">{children}</div>
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
    <div {...stylex.props(styles.pageNav)}>
      {previous || next ? (
        <nav aria-label="Pagination" {...stylex.props(styles.pagination)}>
          {previous ? (
            <a href={withBase(base, previous.path)} {...stylex.props(styles.pageLink)}>
              <span {...stylex.props(styles.pageLinkLabel)}>
                <ChevronLeft aria-hidden="true" size={16} />
                Previous
              </span>
              <span {...stylex.props(styles.pageLinkTitle, typography.label)}>{previous.label}</span>
            </a>
          ) : (
            <span />
          )}
          {next ? (
            <a href={withBase(base, next.path)} {...stylex.props(styles.pageLink, styles.pageLinkNext)}>
              <span {...stylex.props(styles.pageLinkLabel)}>
                Next
                <ChevronRight aria-hidden="true" size={16} />
              </span>
              <span {...stylex.props(styles.pageLinkTitle, typography.label)}>{next.label}</span>
            </a>
          ) : null}
        </nav>
      ) : null}

      {editHref || updated ? (
        <div {...stylex.props(styles.editRow, typography.labelRegular)}>
          {editHref ? (
            <a href={editHref} target="_blank" rel="noreferrer" {...stylex.props(styles.editLink)}>
              <Pencil aria-hidden="true" size={16} />
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
export function PostItem({ route, xstyle }: { route: Route; xstyle?: StyleXStyles }) {
  const base = useBase()
  return (
    <a href={withBase(base, route.path)} {...stylex.props(styles.postItem, xstyle)}>
      <p {...stylex.props(styles.postTitle, typography.label)}>{postLabel(route)}</p>
      {route.meta.description ? (
        <p {...stylex.props(styles.postDescription, typography.labelRegular)}>{route.meta.description}</p>
      ) : null}
    </a>
  )
}

export function PostList({
  posts,
  title,
  empty,
  xstyle,
}: {
  posts: Route[]
  title?: string
  empty?: string
  xstyle?: StyleXStyles
}) {
  if (posts.length === 0) {
    return <p {...stylex.props(styles.footerEmail, typography.labelRegular)}>{empty ?? 'No posts yet. Add an .mdx file to content/.'}</p>
  }

  return (
    <div {...stylex.props(styles.postList, xstyle)}>
      {title ? <h2 {...stylex.props(styles.postListTitle)}>{title}</h2> : null}
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
    <a href={withBase(base, route.path)} {...stylex.props(styles.postCard)}>
      <span {...stylex.props(styles.postTitle, typography.label)}>{postLabel(route)}</span>
      {route.meta.description ? (
        <span {...stylex.props(styles.postDescription, typography.labelRegular)}>{route.meta.description}</span>
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
    <div {...stylex.props(styles.tagList)}>
      {tags.map(({ tag, count }) => (
        <a key={tag} href={withBase(base, `${tagsPath}/${tagSlug(tag)}`)} {...stylex.props(styles.tagLink)}>
          <Badge variant={active === tag ? 'default' : 'secondary'}>
            {tag} <span {...stylex.props(styles.tagCount)}>{count}</span>
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
      <p {...stylex.props(typography.labelRegular)}>
        <a href={withBase(base, blogIndexPath(site.activeLayer?.path ?? '/', config))} {...stylex.props(styles.backLink)}>
          ← All posts
        </a>
      </p>
      <h1 {...stylex.props(styles.tagTitle)}>Posts tagged “{tag}”</h1>
      <PostList posts={posts} empty={`No posts tagged “${tag}”.`} xstyle={styles.tagPosts} />
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
    <div {...stylex.props(styles.notFound)}>
      <p {...stylex.props(styles.notFoundLabel)}>404</p>
      <h1 {...stylex.props(styles.notFoundTitle)}>Page not found</h1>
      <p {...stylex.props(styles.notFoundBody, typography.labelRegular)}>
        Nothing is published at <code {...stylex.props(styles.notFoundCode)}>{url}</code>.
      </p>
      <a href={withBase(base, '/')} {...stylex.props(styles.notFoundLink)}>
        <ChevronLeft aria-hidden="true" size={16} /> Back to the start
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
    <div {...stylex.props(styles.layoutRoot)}>
      <a href="#novon-content" {...stylex.props(behavior.skipLink)}>
        Skip to content
      </a>
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
      {/* The outline carries the progress on wide screens; below them the
          sidebar is hidden, so the strip stays. */}
      <ScrollProgress xstyle={styles.progressTop} />
      <Header onToggleNav={toggleNav} navOpen={navOpen} />

      <div {...stylex.props(styles.docsRow)}>
        <aside
          ref={sidebarRef}
          aria-label="Sidebar"
          {...stylex.props(styles.aside, styles.asideWidth(collapsed))}
        >
          <div id="novon-sidebar" hidden={collapsed} {...stylex.props(styles.fullHeight)}>
            <Sidebar nav={site.nav} current={activePath} onCollapse={toggleCollapsed} />
          </div>
          {collapsed ? (
            <div {...stylex.props(styles.collapsedRail)}>
              <div {...stylex.props(styles.collapsedHead)}>
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  aria-label="Show sidebar"
                  aria-expanded="false"
                  aria-controls="novon-sidebar"
                  title="Show sidebar"
                  {...stylex.props(styles.iconButton)}
                >
                  <PanelLeft aria-hidden="true" size={16} />
                </button>
              </div>
              {config.features.search ? <SearchTrigger compact xstyle={styles.iconButton} /> : null}
              {config.theme.darkMode ? (
                <div {...stylex.props(styles.collapsedFoot)}>
                  <ThemeToggle />
                </div>
              ) : null}
            </div>
          ) : null}
        </aside>

        <Dialog open={navOpen} onOpenChange={setNavOpen}>
          <DialogContent
            showClose={false}
            finalFocus={finalFocus}
            id="novon-mobile-sidebar"
            aria-label="Documentation navigation"
            xstyle={styles.mobileDialog}
          >
            <DialogClose aria-label="Close navigation" xstyle={styles.mobileClose}>
              <X aria-hidden="true" size={16} />
            </DialogClose>
            <ScrollArea xstyle={styles.mobileScroll}>
              <Sidebar nav={site.nav} current={activePath} onNavigate={() => setNavOpen(false)} />
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <main id="novon-content" tabIndex={-1} {...stylex.props(styles.main)}>
          {children}
          <Footer variant="docs" />
        </main>

        {showToc ? (
          <aside {...stylex.props(styles.tocAside, styles.tocAsideWidth, behavior.scroll)}>
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
    <div
      {...stylex.props(
        styles.docsPage,
        fullWidth ? styles.docsPageFull : wide ? styles.docsPageWide : styles.docsPageDefault,
      )}
    >
      {route ? (
        <PageHeading
          title={title}
          description={description}
          meta={route.meta}
          path={route.path}
          actions={!route.synthetic}
          xstyle={!fullWidth ? styles.pageHeaderSpaced : undefined}
        />
      ) : null}
      {route && !route.synthetic ? <div {...stylex.props(styles.divider)} /> : null}
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
      <ScrollProgress />
      <div {...stylex.props(styles.blogLayout)}>
        <Header />
        <main id="novon-content" tabIndex={-1} {...stylex.props(styles.blogMain)}>{children}</main>
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
        <figure {...stylex.props(styles.cover)}>
          <img src={withBase(config.base, cover)} alt="" {...stylex.props(styles.coverImage)} />
          {typeof route?.meta.caption === 'string' ? (
            <figcaption {...stylex.props(styles.coverCaption, typography.labelRegular)}>
              {route.meta.caption}
            </figcaption>
          ) : null}
        </figure>
      ) : null}

      <h1 {...stylex.props(styles.articleTitle)}>{title}</h1>
      {isPost && (date || author) ? (
        <p {...stylex.props(styles.postMeta, typography.labelRegular)}>
          {date ? <time dateTime={String(route?.meta.date)}>{date}</time> : null}
          {date && author ? <span aria-hidden="true">·</span> : null}
          {author ? <span>{author}</span> : null}
        </p>
      ) : null}
      {description ? <p {...stylex.props(styles.postDescriptionLede, typography.lede)}>{description}</p> : null}
      <div {...stylex.props(styles.articleDivider)} />
      <Prose>{children}</Prose>

      {isPost ? (
        <p {...stylex.props(typography.labelRegular)}>
          <a
            href={withBase(config.base, blogIndexPath(site.activeLayer?.path ?? '/', config))}
            {...stylex.props(styles.allPosts)}
          >
            <ChevronLeft aria-hidden="true" size={16} />
            All posts
          </a>
        </p>
      ) : null}
    </article>
  )
}

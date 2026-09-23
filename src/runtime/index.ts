/**
 * Browser-safe public API of novon.
 *
 * Content files and theme overrides bundle this entry, so it must never reach
 * for a Node builtin. `novon` (the package root) re-exports it alongside the
 * config and plugin API, which only config files need.
 *
 * ```mdx
 * import { Button, Card } from 'novon'
 * ```
 */
export type {
  RuntimeConfig,
  ThemeOptions,
  ThemeOverrides,
  Frontmatter,
  NavItem,
  Route,
  TocEntry,
  TemplateKind,
  LayoutKind,
  LayoutConfig,
  LayoutLayer,
  AccentColor,
} from '../types.ts'

/* The shadcn/ui-style primitives, for custom components and theme overrides. */
export * from './ui.tsx'

/* Writing components for MDX, plus the map injected into every page. */
export {
  Callout,
  Caution,
  CodeGroup,
  Columns,
  CardGroup,
  Danger,
  Frame,
  Info,
  MdxCard,
  MdxPostList,
  MdxTagList,
  Note,
  Step,
  Steps,
  Term,
  Tip,
  Warning,
  YouTube,
  mdxComponents,
} from './mdx.tsx'

/* The component documentation block. */
export { Preview, type PreviewProps } from './preview.tsx'

/* Deterministic monochrome avatars. */
export { Blobatar, type BlobatarProps } from './blobatar.tsx'

/* Icons, shared by the theme and MDX components. */
export { Icon, icons, type IconProps } from './icons.tsx'

/* Curated brand marks from SVGL, for Open menus and MDX. */
export { SvglIcon, svglIcons, type SvglIconName, type SvglIconProps } from './svgl.tsx'

/* Theme internals, for people writing their own layout. */
export {
  BaseLayout,
  BlogLayout,
  BlogPage,
  DocsLayout,
  DocsPage,
  Brand,
  DefaultDocsHeader,
  DefaultFooter,
  DefaultHeader,
  DefaultHomePage,
  DefaultNotFound,
  DefaultSidebar,
  DefaultTableOfContents,
  PageActions,
  PageHeading,
  PageNav,
  PostCard,
  PostItem,
  PostList,
  PostListPage,
  Prose,
  TagList,
  TagPage,
  useOverride,
  type LayoutProps,
  type DocsLayoutProps,
  type DocsPageProps,
  type BlogPageProps,
} from './shell.tsx'
export { SiteProvider, useBase, useConfig, useSite } from './site.tsx'

/* The shared component kit: pill navigation, reveals, icon badges, theme controls. */
export {
  ArrowPill,
  CopyUrlButton,
  IconBadge,
  PillNav,
  ReadingProgress,
  Reveal,
  ScrollProgress,
  Section,
  SocialPills,
  ThemeSwitch,
  ThemeToggle,
  type PillNavItem,
} from './kit.tsx'
export { createSiteIndex, flattenNav, loadPage, siteForRoute } from './content.ts'
export type { LayerIndex, NavGroup, NavNode, NavPage, PageModule, SiteIndex } from './content.ts'
export { formatDate, humanize, withBase } from './lib.ts'
export { layerForPath, layoutLayers } from '../layers.ts'

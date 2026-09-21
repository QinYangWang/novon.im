/**
 * Public API of novon, for `novon.config.ts`, custom components and themes.
 *
 * Prefer `novon/config` in a config file: it avoids pulling React in while the
 * config is being loaded.
 */
export { defineConfig, loadConfig, resolveConfig, normalizeBase, NovonError } from './config.ts'
export type { ResolvedConfig } from './config.ts'
export { definePlugin, BUILTIN_PLUGINS } from './plugins/api.ts'
export type { NovonPlugin, PluginContext, BuildContext, BuiltPage } from './plugins/api.ts'
export type {
  NovonConfig,
  RuntimeConfig,
  ThemeOptions,
  ThemeOverrides,
  Frontmatter,
  NavItem,
  Route,
  TocEntry,
  TemplateKind,
  AccentColor,
} from './types.ts'

/* The shadcn/ui-style primitives, for custom components and theme overrides. */
export {
  Accordion,
  AccordionGroup,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
  Badge,
  badgeVariants,
  Button,
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
  Input,
  Kbd,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './runtime/ui.tsx'

/* Writing components for MDX, plus the map injected into every page. */
export {
  Callout,
  Caution,
  CodeGroup,
  Columns,
  CardGroup,
  Danger,
  Frame,
  Icon,
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
  icons,
  mdxComponents,
} from './runtime/mdx.tsx'

/* Theme internals, for people writing their own layout. */
export {
  Brand,
  DefaultFooter,
  DefaultHeader,
  DefaultHomePage,
  DefaultNotFound,
  DefaultSidebar,
  DefaultTableOfContents,
  PostCard,
  PostList,
  Prose,
  TagList,
  useOverride,
  type LayoutProps,
} from './runtime/shell.tsx'
export { SiteProvider, useBase, useConfig, useSite } from './runtime/site.tsx'
export { createSiteIndex, flattenNav, loadPage } from './runtime/content.ts'
export type { NavGroup, NavNode, NavPage, PageModule, SiteIndex } from './runtime/content.ts'
export { cn, formatDate, humanize, withBase } from './runtime/lib.ts'

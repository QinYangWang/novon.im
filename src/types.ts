/**
 * Pure type declarations shared by the CLI (node) and the theme (browser).
 * Keep this file free of `node:` imports so the runtime can bundle it.
 */
export type TemplateKind = 'docs' | 'blog'

export type AccentColor =
  | 'zinc'
  | 'slate'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'emerald'
  | 'teal'
  | 'orange'
  | 'rose'

/** A link in the top navigation bar or the footer. */
export interface NavItem {
  label: string
  href: string
  /** Optional lucide icon name, e.g. `Book`, `Github`. */
  icon?: string
  /** Nested links, rendered as a dropdown group. */
  items?: NavItem[]
  external?: boolean
}

export interface SocialLinks {
  github?: string
  x?: string
  twitter?: string
  discord?: string
  npm?: string
  youtube?: string
  linkedin?: string
  [key: string]: string | undefined
}

export interface FooterConfig {
  text?: string
  links?: NavItem[]
}

export interface ThemeOptions {
  /** Built-in accent palette applied through the `--primary` token. */
  accent?: AccentColor
  /** Root corner radius, any CSS length. */
  radius?: string
  /** Path inside `public/`, URL, or imported asset. */
  logo?: string
  logoDark?: string
  favicon?: string
  /** Default explicit social image; takes precedence over automatic cards. */
  ogImage?: string
  /** Generate a page-specific 1200×630 PNG when no image is supplied. Default: true. */
  generateOgImages?: boolean
  /** Render the light/dark toggle in the header. */
  darkMode?: boolean
  /** Render the right-hand "on this page" table of contents. */
  toc?: boolean
  /** Extra stylesheets, resolved relative to the site root or launched as URL. */
  css?: string[]
  editLink?: { base: string; label?: string }
  social?: SocialLinks
  footer?: FooterConfig
  /**
   * Replace built-in theme parts with your own components. Paths resolve from the
   * site root and must default-export a React component.
   *
   * ```ts
   * theme: { override: { Header: './theme/Header.tsx' } }
   * ```
   */
  override?: Record<string, string>
}

/** Frontmatter accepted in every `.mdx` / `.md` file. */
export interface Frontmatter {
  title?: string
  description?: string
  /** Sidebar / list label, falls back to `title`. */
  label?: string
  /** Ascending sort key inside a sidebar group or post list. */
  order?: number
  draft?: boolean
  /** ISO date, used by blog lists, RSS and sitemaps. */
  date?: string
  /** ISO date of the last edit, shown at the bottom of the page. */
  updated?: string
  author?: string | { name: string; avatar?: string; url?: string }
  tags?: string[]
  /** Blog cover image, also used for social sharing unless ogImage is set. */
  image?: string
  /** Social-only image override; does not change the blog cover. */
  ogImage?: string
  /** Caption shown under the cover image on a blog post. */
  caption?: string
  /** Override the URL segment derived from the file path. */
  slug?: string
  /** Set to false to hide the "on this page" table of contents. */
  toc?: boolean
  /** Set to false to keep the page out of the sidebar, post lists and feeds. */
  sidebar?: boolean
  /** Icon shown next to the sidebar entry, e.g. `Rocket`. */
  icon?: string
  /** Render the page without the sidebar and table of contents columns. */
  fullWidth?: boolean
  /** Widen the content column for galleries and previews, keeping the TOC. */
  wide?: boolean
  [key: string]: unknown
}

export interface MdxOptions {
  /** Build-time syntax highlighting. false disables it, not code copying. */
  highlight?: false | {
    /** Bundled Shiki theme names. */
    theme?: { light: string; dark: string }
    /** Language used by fences without a language. Default: plaintext. */
    defaultLanguage?: string
  }
  remarkPlugins?: unknown[]
  rehypePlugins?: unknown[]
}

export interface NovonConfig {
  /** Site name. Shown in the header, page titles and feeds. */
  title: string
  description?: string
  /** Canonical origin, e.g. `https://example.com`. Enables absolute URLs in sitemap/RSS. */
  url?: string
  /** Base path the site is served from, e.g. `/my-repo/` on GitHub Pages. */
  base?: string
  /** Set by `novon new`. Controls the default layout and content scaffolding. */
  template?: TemplateKind
  outDir?: string
  /** Static files copied verbatim into the build output. Defaults to `public`. */
  publicDir?: string | false
  /** Header links. */
  nav?: NavItem[]
  theme?: ThemeOptions
  /**
   * Extra components available in every MDX file without an import.
   * Paths are resolved from the site root.
   *
   * ```ts
   * components: { PricingTable: './components/PricingTable.tsx' }
   * ```
   */
  components?: Record<string, string>
  mdx?: MdxOptions
  /** Built-in plugin names (`rss`, `sitemap`, `search`, `llms`) or plugin objects. */
  plugins?: unknown[]
  /** Default author applied to posts without one. */
  author?: string
  language?: string
}

/** One page discovered in `content/`. */
export interface Route {
  /** URL path, always starts with `/` and has no trailing slash (except `/`). */
  path: string
  /** Site-relative source file, e.g. `/content/guide/setup.mdx`. */
  file: string
  meta: Frontmatter
  /** Directory segments between `content/` and the file. */
  segments: string[]
  /** True for `index.mdx` files. */
  isIndex: boolean
  /** True for the synthetic `/` route pointing at the first page. */
  synthetic?: boolean
  /** Set on generated tag pages: the tag they list. */
  tag?: string
  /** Set on the generated `/blog` index of the blog template. */
  postList?: boolean
}

export interface TocEntry {
  depth: number
  text: string
  id: string
}

export interface PageData {
  route: Route
  title: string
  description?: string
  headings: TocEntry[]
  excerpt?: string
  frontmatter: Frontmatter
}

/**
 * The serializable slice of the config handed to the browser. Plugins, MDX
 * plugin functions and component maps cannot cross that boundary, so features
 * are reduced to booleans here.
 */
export interface RuntimeConfig {
  title: string
  description?: string
  url?: string
  base: string
  template: TemplateKind
  language: string
  author?: string
  theme: Required<Pick<ThemeOptions, 'accent' | 'radius' | 'darkMode' | 'toc'>> & ThemeOptions
  nav: NavItem[]
  features: {
    search: boolean
    rss: boolean
    sitemap: boolean
    llms: boolean
  }
}

/** Built-in theme parts a site can replace with its own implementation. */
export interface ThemeOverrides {
  /** Top navigation: the docs mobile bar, or the blog's lowercase nav. */
  Header?: unknown
  /** The docs sidebar rail. */
  Sidebar?: unknown
  Footer?: unknown
  TableOfContents?: unknown
  /** The blog home. */
  HomePage?: unknown
  /** The generated `/blog` index. */
  PostListPage?: unknown
  NotFound?: unknown
}

export const DEFAULT_ACCENT: AccentColor = 'zinc'
export const DEFAULT_RADIUS = '0.625rem'

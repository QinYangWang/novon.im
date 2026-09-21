/**
 * Plugin API — the extension point of novon.
 *
 * A plugin is a plain object. Load it by name (`'rss'`) or by object/import path
 * in `novon.config.ts`:
 *
 * ```ts
 * import { definePlugin } from 'novon/plugin'
 *
 * export default definePlugin({
 *   name: 'my-plugin',
 *   postBuild(ctx) {
 *     ctx.write('hello.txt', 'hi from my plugin')
 *   },
 * })
 * ```
 */
import type { NovonConfig, Route } from '../types.ts'

export interface PluginContext {
  /** Absolute site root. */
  root: string
  config: NovonConfig
  /** Absolute output directory. */
  outDir: string
  /** Normalized base path, always starts and ends with `/`. */
  base: string
  /** Absolute path to the installed novon package. */
  packageRoot: string
}

/** A page handed to plugins after server rendering. */
export interface BuiltPage {
  route: Route
  title: string
  description?: string
  excerpt?: string
  headings: { depth: number; text: string; id: string }[]
  frontmatter: Record<string, unknown>
  /** Server-rendered inner HTML of the page. */
  html: string
  /** Absolute path of the file that was written. */
  outputPath: string
}

export interface BuildContext extends PluginContext {
  /** Every page that was rendered, in route order. */
  pages: BuiltPage[]
  /** Write a file relative to the output directory. */
  write(file: string, contents: string): void
  log(message: string): void
}

export interface NovonPlugin {
  name: string
  /** `pre` runs before built-in plugins, `post` after. Defaults to normal. */
  enforce?: 'pre' | 'post'
  /** Called once when the site is loaded, before any build work. */
  setup?(ctx: PluginContext): void | Promise<void>
  /** Rewrite the final HTML document of each page. */
  transformHtml?(html: string, page: BuiltPage, ctx: PluginContext): string
  /** Emit extra files after all pages are written. */
  postBuild?(ctx: BuildContext): void | Promise<void>
}

/** Identity helper that gives editors full type information. */
export function definePlugin<T extends NovonPlugin>(plugin: T): T {
  return plugin
}

/** Names of the plugins shipped with novon. */
export const BUILTIN_PLUGINS = ['rss', 'sitemap', 'search', 'llms'] as const
export type BuiltinPluginName = (typeof BUILTIN_PLUGINS)[number]

export function isBuiltinPluginName(value: unknown): value is BuiltinPluginName {
  return typeof value === 'string' && (BUILTIN_PLUGINS as readonly string[]).includes(value)
}

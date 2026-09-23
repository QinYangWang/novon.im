/**
 * `novon.config.ts` — the single configuration file of a site.
 */
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { importSiteModule } from './load.ts'
import { builtinPlugins } from './plugins/builtin.ts'
import type { NovonPlugin } from './plugins/api.ts'
import { defaultLayout, normalizeLayerPath } from './layers.ts'
import { DEFAULT_ACCENT, DEFAULT_RADIUS, type NovonConfig, type Route } from './types.ts'

export type { NovonConfig, Route }
export type { LayoutConfig, LayoutKind, LayoutLayer } from './types.ts'

export const CONFIG_FILENAMES = ['novon.config.ts', 'novon.config.js', 'novon.config.mjs']
export const CONTENT_DIR = 'content'

/** Identity helper. Import from `novon/config` (or `novon`) for editor support. */
export function defineConfig(config: NovonConfig): NovonConfig {
  return config
}

export interface ResolvedConfig extends NovonConfig {
  root: string
  layout: NonNullable<NovonConfig['layout']>
  layers: NonNullable<NovonConfig['layers']>
  outDir: string
  publicDir: string | false
  base: string
  contentDir: string
  language: string
  plugins: NovonPlugin[]
}

export class NovonError extends Error {}

/** Normalize `base` so it always starts and ends with `/`. */
export function normalizeBase(base: string | undefined): string {
  if (!base || base === '/') return '/'
  return `/${base.replace(/^\/+|\/+$/g, '')}/`
}

export function findConfigFile(root: string): string {
  for (const name of CONFIG_FILENAMES) {
    const file = join(root, name)
    if (existsSync(file)) return file
  }
  throw new NovonError(
    `No ${CONFIG_FILENAMES[0]} found in ${root}.\nCreate one with \`novon new <dir>\` or add a config file to this directory.`,
  )
}

/** Turn `plugins: ['rss']` and imported plugin objects into a flat list. */
export function resolvePlugins(input: unknown): NovonPlugin[] {
  const list = (Array.isArray(input) ? input : input ? [input] : []).filter(Boolean)
  const resolved: NovonPlugin[] = []
  const seen = new Set<string>()

  const add = (plugin: NovonPlugin) => {
    if (!plugin || typeof plugin.name !== 'string') {
      throw new NovonError(`Invalid plugin: expected an object with a \`name\`. Received ${JSON.stringify(plugin)}.`)
    }
    if (seen.has(plugin.name)) return
    seen.add(plugin.name)
    resolved.push(plugin)
  }

  for (const entry of list) {
    if (typeof entry === 'string') {
      const builtin = builtinPlugins[entry]
      if (!builtin) {
        throw new NovonError(
          `Unknown plugin "${entry}". Built-in plugins: ${Object.keys(builtinPlugins).join(', ')}. ` +
            `For a custom plugin, import it and pass the object instead of a string.`,
        )
      }
      add(builtin)
      continue
    }
    if (Array.isArray(entry)) {
      // [plugin, options] — options are not used by the built-ins yet, but the
      // shape is accepted so configs stay forward compatible.
      add(resolvePluginEntry(entry[0]))
      continue
    }
    add(resolvePluginEntry(entry))
  }

  const order = { pre: 0, undefined: 1, post: 2 } as const
  return resolved.sort((a, b) => order[a.enforce ?? 'undefined'] - order[b.enforce ?? 'undefined'])
}

function resolvePluginEntry(entry: unknown): NovonPlugin {
  if (entry && typeof entry === 'object' && typeof (entry as NovonPlugin).name === 'string') {
    return entry as NovonPlugin
  }
  throw new NovonError(`Invalid plugin entry: ${JSON.stringify(entry)}`)
}

export function resolveConfig(root: string, config: NovonConfig, plugins?: NovonPlugin[]): ResolvedConfig {
  if (!config || typeof config !== 'object') {
    throw new NovonError('novon.config.ts must export a configuration object.')
  }
  if (typeof config.title !== 'string' || config.title.trim() === '') {
    throw new NovonError('novon.config.ts is missing the required `title` field.')
  }

  const layout = defaultLayout(config)
  const validLayout = (value: unknown) => value === 'docs' || value === 'blog'
  if (!validLayout(layout) || (config.template !== undefined && !validLayout(config.template))) {
    throw new NovonError('Invalid layout. Expected "docs" or "blog".')
  }
  if (config.layers !== undefined && !Array.isArray(config.layers)) {
    throw new NovonError('Invalid layers: expected an array of { path, layout }.')
  }
  const seen = new Set<string>()
  const layers = (config.layers ?? []).map((layer) => {
    if (!layer || !validLayout(layer.layout) || typeof layer.path !== 'string' ||
        !layer.path.startsWith('/') || /[?#\\\\]/.test(layer.path) ||
        layer.path.replace(/\/$/, '').includes('//') || layer.path.split('/').some((part) => part === '.' || part === '..')) {
      throw new NovonError('Invalid layer: expected an absolute URL path and a "docs" or "blog" layout.')
    }
    const path = normalizeLayerPath(layer.path)
    if (seen.has(path)) throw new NovonError(`Duplicate layer path "${path}".`)
    seen.add(path)
    return { ...layer, path }
  })

  return {
    ...config,
    root,
    layout,
    layers,
    outDir: resolve(root, config.outDir ?? 'dist'),
    publicDir: config.publicDir === false ? false : resolve(root, config.publicDir ?? 'public'),
    base: normalizeBase(config.base),
    contentDir: join(root, CONTENT_DIR),
    language: config.language ?? 'en',
    theme: {
      accent: DEFAULT_ACCENT,
      radius: DEFAULT_RADIUS,
      darkMode: true,
      toc: true,
      ...config.theme,
    },
    plugins: plugins ?? resolvePlugins(config.plugins),
  }
}

/**
 * Load `novon.config.ts`, resolving `novon` imports against the installed package.
 * `packageRoot` must be passed explicitly: the config is also loaded by Vite,
 * where `import.meta.url` cannot be trusted.
 */
export async function loadConfig(root: string, packageRoot: string): Promise<ResolvedConfig> {
  const file = findConfigFile(root)
  let config: NovonConfig
  try {
    config = await importSiteModule<NovonConfig>(file, packageRoot)
  } catch (error) {
    throw new NovonError(`Failed to load ${file}:\n${(error as Error).message}`)
  }
  return resolveConfig(root, config)
}


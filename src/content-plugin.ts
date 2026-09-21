/**
 * Generates `virtual:novon/content` from the site's `content/` directory.
 *
 * The route table is built from file paths and frontmatter parsed here, so the
 * theme never needs `import.meta.glob`: globs resolve relative to the importing
 * file, and the theme lives outside the site directory (often on another drive).
 *
 * Page modules stay lazily imported, so every page is its own chunk.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { parse as parseYaml } from 'yaml'
import matter from 'gray-matter'
import type { Plugin, ViteDevServer } from 'vite'
import type { Frontmatter } from './types.ts'

const MODULE_ID = 'virtual:novon/content'
const RESOLVED_ID = `\0${MODULE_ID}`
const EXTENSIONS = /\.(md|mdx)$/

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const entry of entries) {
    // `_partials` and friends are ignored, like mkdocs.
    if (entry.startsWith('_') || entry.startsWith('.')) continue
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (EXTENSIONS.test(entry)) out.push(path)
  }
  return out
}

export interface ContentIndex {
  /** Module ids such as `/content/guide/setup.mdx`, sorted for stable output. */
  files: string[]
  meta: Record<string, Frontmatter>
}

export function scanContent(siteRoot: string): ContentIndex {
  const contentRoot = join(siteRoot, 'content')
  const files: string[] = []
  const meta: Record<string, Frontmatter> = {}

  for (const path of walk(contentRoot).sort()) {
    const url = `/${relative(siteRoot, path).split(sep).join('/')}`
    files.push(url)
    try {
      const parsed = matter(readFileSync(path, 'utf8'), {
        // Same YAML semantics as remark-mdx-frontmatter, so nav labels and the
        // page's own `frontmatter` export always agree (dates stay strings).
        engines: { yaml: (source: string) => parseYaml(source) as object },
      })
      meta[url] = (parsed.data ?? {}) as Frontmatter
    } catch (error) {
      console.warn(`[novon] could not read frontmatter from ${url}: ${(error as Error).message}`)
      meta[url] = {}
    }
  }

  return { files, meta }
}

function generate(index: ContentIndex): string {
  return [
    `export const files = ${JSON.stringify(index.files, null, 2)}`,
    `export const meta = ${JSON.stringify(index.meta, null, 2)}`,
    'export const loaders = {',
    ...index.files.map((file) => `  ${JSON.stringify(file)}: () => import(${JSON.stringify(file)}),`),
    '}',
  ].join('\n')
}

export function contentPlugin(siteRoot: string): Plugin {
  const contentRoot = join(siteRoot, 'content')
  return {
    name: 'novon:content',
    resolveId(id) {
      return id === MODULE_ID ? RESOLVED_ID : null
    },
    load(id) {
      return id === RESOLVED_ID ? generate(scanContent(siteRoot)) : null
    },
    configureServer(server: ViteDevServer) {
      server.watcher.add(contentRoot)
      const reload = (file: string) => {
        if (!EXTENSIONS.test(file) || !file.startsWith(contentRoot)) return
        const module = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (module) server.moduleGraph.invalidateModule(module)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', reload)
      server.watcher.on('unlink', reload)
      server.watcher.on('change', reload)
    },
  }
}

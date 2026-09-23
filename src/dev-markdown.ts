/**
 * Development-only serving of a route's original Markdown source.
 *
 * `novon build` writes the untouched `content/**` file next to every HTML page
 * at `<route>.md` (see `markdownPath`). The dev server has no bundle to read that
 * copy from, so it rebuilds the same route -> source mapping from the content
 * index and serves the indexed file directly.
 *
 * The mapping comes from the runtime's own `createSiteIndex`/`fileToRoute`, so
 * slugs, `index.mdx`, the synthetic docs root and `.md`/`.mdx` behave exactly
 * like the build. The request path is never joined onto the filesystem: it is
 * looked up in that index, and the matched file is verified with `realpath` to
 * still live inside `content/`, so symlinks and encoded traversal cannot expose
 * anything else.
 */
import { readFileSync, realpathSync } from 'node:fs'
import { join, sep } from 'node:path'
import type { Plugin, ViteDevServer } from 'vite'
import { normalizeBase } from './config.ts'
import { scanContent } from './content-plugin.ts'
import { markdownPath } from './paths.ts'
import { createSiteIndex } from './runtime/routes.ts'
import type { LayoutConfig, Route } from './types.ts'

const MARKDOWN_RE = /\.md$/

export interface DevMarkdownMatch {
  /** Route the source is published at, e.g. `/components/accordion`. */
  routePath: string
  /** Site-relative source, e.g. `/content/components/accordion.mdx`. */
  file: string
  /** Absolute, symlink-resolved source path. */
  sourcePath: string
}

export type DevMarkdownResolution =
  /** An indexed route with a real source file. */
  | { kind: 'match'; match: DevMarkdownMatch }
  /** A Vite module request for a content source; let Vite compile it. */
  | { kind: 'module' }
  /** The request path could not be percent-decoded. */
  | { kind: 'malformed' }
  /** No indexed route (or the source escaped `content/`). */
  | { kind: 'not-found' }

export interface DevMarkdownResolverOptions extends LayoutConfig {
  /** Absolute path of the site being built. */
  siteRoot: string
  /** Configured base, as returned by `normalizeBase`. */
  base?: string
  /** Include drafts, matching `import.meta.env.DEV` in the runtime. Defaults to true. */
  isDev?: boolean
}

export interface DevMarkdownResolver {
  /** Whether a raw request pathname is a candidate Markdown request. */
  matches(requestPath: string): boolean
  /** Map a raw request pathname (possibly base-prefixed and encoded). */
  resolve(requestPath: string): DevMarkdownResolution
  /** Read the current text of a resolved source. */
  read(match: DevMarkdownMatch): string
  /** Drop the cached route index; it is rebuilt lazily on the next resolve. */
  invalidate(): void
}

interface ResolvedIndex {
  byMarkdown: Map<string, Route>
  sources: Set<string>
}

export function createDevMarkdownResolver(options: DevMarkdownResolverOptions): DevMarkdownResolver {
  const { siteRoot } = options
  const isDev = options.isDev ?? true
  const base = normalizeBase(options.base)
  const contentRoot = join(siteRoot, 'content')
  let index: ResolvedIndex | undefined

  const build = (): ResolvedIndex => {
    const scanned = scanContent(siteRoot)
    const site = createSiteIndex(options, scanned, isDev)
    const byMarkdown = new Map<string, Route>()
    for (const route of site.routes) {
      // Synthetic blog/tag/404 routes have no source, so they get no `.md`.
      if (!route.file) continue
      const key = markdownPath(route.path)
      if (!byMarkdown.has(key)) byMarkdown.set(key, route)
    }
    return { byMarkdown, sources: new Set(scanned.files) }
  }

  const getIndex = (): ResolvedIndex => (index ??= build())

  const stripBase = (pathname: string): string => {
    if (base === '/') return pathname
    if (pathname === base) return '/'
    if (pathname.startsWith(base)) {
      const rest = pathname.slice(base.length)
      return rest.startsWith('/') ? rest : `/${rest}`
    }
    return pathname
  }

  /** Resolve the source and refuse anything outside `content/` once symlinks are followed. */
  const safeSource = (file: string): string | undefined => {
    const absolute = join(siteRoot, file)
    if (absolute !== contentRoot && !absolute.startsWith(contentRoot + sep)) return undefined
    let real: string
    let realRoot: string
    try {
      real = realpathSync(absolute)
      realRoot = realpathSync(contentRoot)
    } catch {
      return undefined
    }
    if (real !== realRoot && !real.startsWith(realRoot + sep)) return undefined
    return real
  }

  return {
    matches(requestPath) {
      return MARKDOWN_RE.test(requestPath)
    },

    resolve(requestPath) {
      let decoded: string
      try {
        decoded = decodeURIComponent(requestPath)
      } catch {
        return { kind: 'malformed' }
      }

      const pathname = stripBase(decoded)
      const { byMarkdown, sources } = getIndex()

      // A request for an actual content file is Vite compiling that module, not
      // a request for a published page's raw source.
      if (sources.has(pathname)) return { kind: 'module' }

      // `markdownPath` returns an output-relative key (`components/x.md`).
      const route = byMarkdown.get(pathname.replace(/^\/+/, ''))
      if (!route) return { kind: 'not-found' }

      const sourcePath = safeSource(route.file)
      if (!sourcePath) return { kind: 'not-found' }

      return { kind: 'match', match: { routePath: route.path, file: route.file, sourcePath } }
    },

    read(match) {
      return readFileSync(match.sourcePath, 'utf8')
    },

    invalidate() {
      index = undefined
    },
  }
}

/**
 * Serve indexed Markdown sources in dev.
 *
 * The early middleware runs before Vite's base, static and SPA-fallback
 * middlewares, so a real page wins over the HTML shell. When a `.md` request is
 * not an indexed page it is remembered and only 404s later, after Vite has had a
 * chance to serve a `public/` file or a content module.
 */
export function devMarkdownPlugin(options: DevMarkdownResolverOptions): Plugin {
  const resolver = createDevMarkdownResolver(options)
  const contentRoot = join(options.siteRoot, 'content')
  const markdownMiss = Symbol('novon:markdown-miss')

  return {
    name: 'novon:dev-markdown',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      const invalidate = (file: string) => {
        if (!file.startsWith(contentRoot) || !/\.(md|mdx)$/.test(file)) return
        resolver.invalidate()
      }
      const watch = ['add', 'unlink', 'change'] as const
      for (const event of watch) server.watcher.on(event, invalidate)
      server.watcher.add(contentRoot)
      server.httpServer?.once('close', () => {
        for (const event of watch) server.watcher.off(event, invalidate)
      })

      server.middlewares.use((request, response, next) => {
        const pathname = (request.url ?? '/').split('?')[0]
        if (!resolver.matches(pathname)) return next()
        if (request.method !== 'GET' && request.method !== 'HEAD') return next()

        const result = resolver.resolve(pathname)
        if (result.kind === 'malformed') {
          response.statusCode = 400
          response.setHeader('content-type', 'text/plain; charset=utf-8')
          response.end('Bad request\n')
          return
        }
        if (result.kind === 'module') return next()
        if (result.kind === 'not-found') {
          // Let Vite serve public/ or a module before deciding this is a 404.
          ;(request as { [markdownMiss]?: string })[markdownMiss] = pathname
          return next()
        }

        let source: string
        try {
          source = resolver.read(result.match)
        } catch {
          response.statusCode = 404
          response.setHeader('content-type', 'text/plain; charset=utf-8')
          response.end('Not found\n')
          return
        }

        response.statusCode = 200
        response.setHeader('content-type', 'text/markdown; charset=utf-8')
        response.setHeader('content-length', String(Buffer.byteLength(source)))
        response.end(request.method === 'HEAD' ? undefined : source)
      })

      return () => {
        server.middlewares.use((request, response, next) => {
          if (!(markdownMiss in request)) return next()
          delete (request as { [markdownMiss]?: string })[markdownMiss]
          if (response.writableEnded) return next()
          response.statusCode = 404
          response.setHeader('content-type', 'text/plain; charset=utf-8')
          response.end('Not found\n')
        })
      }
    },
  }
}

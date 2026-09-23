/**
 * Builds the Vite configuration for a site.
 *
 * A novon site has no `node_modules` of its own, so every dependency the theme
 * needs is resolved from the installed novon package:
 *
 * - content files that `import 'novon'` or `react` go through `resolve.alias`
 * - anything else falls back to `novon:fallback-resolve`
 * - `@mdx-js/react` is injected into every compiled page by MDX itself
 */
import { existsSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import stylex from '@stylexjs/unplugin'
import type { Plugin, UserConfig } from 'vite'
import { novonAliases } from './load.ts'
import { contentPlugin } from './content-plugin.ts'
import { devMarkdownPlugin } from './dev-markdown.ts'
import { devOgPlugin } from './og/dev.ts'
import { mdxOptions } from './mdx.ts'
import { renderDocument } from './document.ts'
import type { ResolvedConfig } from './config.ts'
import type { NavItem, RuntimeConfig } from './types.ts'

export interface CreateViteConfigOptions {
  /** Absolute path of the installed novon package. */
  packageRoot: string
  /** Absolute path of the site being built. */
  siteRoot: string
  /** Absolute path of the loaded `novon.config.ts`. */
  configFile: string
  /** Resolved `novon.config.ts`. */
  config: ResolvedConfig
}

const VIRTUAL_PREFIX = 'virtual:novon/'
const toPosix = (path: string): string => path.split(sep).join('/')

/** Build the serializable config the browser gets. */
export function runtimeConfig(config: ResolvedConfig): RuntimeConfig {
  const pluginNames = new Set(config.plugins.map((plugin) => plugin.name))
  return {
    title: config.title,
    description: config.description,
    url: config.url,
    base: config.base,
    layout: config.layout,
    layers: config.layers,
    language: config.language,
    author: config.author,
    theme: {
      accent: 'zinc',
      radius: '0.625rem',
      darkMode: true,
      toc: true,
      ...config.theme,
    },
    nav: (config.nav ?? []) as NavItem[],
    features: {
      search: pluginNames.has('search'),
      rss: pluginNames.has('rss'),
      sitemap: pluginNames.has('sitemap'),
      llms: pluginNames.has('llms'),
    },
  }
}

/** Turn a site-relative path into a URL Vite resolves from the project root. */
function toRootUrl(siteRoot: string, path: string, what: string): string {
  const absolute = isAbsolute(path) ? path : resolve(siteRoot, path)
  const rel = relative(siteRoot, absolute)
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(
      `[novon] ${what} must live inside the site directory.\n` +
        `  got: ${path}\n  resolved: ${absolute}\n  site root: ${siteRoot}`,
    )
  }
  return `/${toPosix(rel)}`
}

/** `virtual:novon/*` modules generated from the site config. */
function virtualModules({ config, siteRoot }: CreateViteConfigOptions): Plugin {
  const componentEntries = Object.entries(config.components ?? {}).map(([name, path]) => ({
    name,
    url: toRootUrl(siteRoot, path, `components.${name}`),
  }))
  const overrideEntries = Object.entries(config.theme?.override ?? {}).map(([name, path]) => ({
    name,
    url: toRootUrl(siteRoot, path, `theme.override.${name}`),
  }))
  const styleUrls = (config.theme?.css ?? []).map((path) => toRootUrl(siteRoot, path, 'theme.css'))

  const importMap = (entries: { name: string; url: string }[], prefix: string, exported: string): string =>
    [
      ...entries.map((entry, index) => `import ${prefix}${index} from ${JSON.stringify(entry.url)}`),
      `export const ${exported} = {`,
      ...entries.map((entry, index) => `  ${JSON.stringify(entry.name)}: ${prefix}${index},`),
      `}`,
    ].join('\n')

  const code = (id: string): string | undefined => {
    switch (id) {
      case `${VIRTUAL_PREFIX}config`:
        return `export default ${JSON.stringify(runtimeConfig(config), null, 2)}`
      case `${VIRTUAL_PREFIX}components`:
        return importMap(componentEntries, 'C', 'customComponents')
      case `${VIRTUAL_PREFIX}theme`:
        return importMap(overrideEntries, 'T', 'themeOverrides')
      case `${VIRTUAL_PREFIX}styles`:
        return styleUrls.map((url) => `import ${JSON.stringify(url)}`).join('\n')
      default:
        return undefined
    }
  }

  return {
    name: 'novon:virtual',
    resolveId(source) {
      return source.startsWith(VIRTUAL_PREFIX) ? `\0${source}` : null
    },
    load(id) {
      if (!id.startsWith(`\0${VIRTUAL_PREFIX}`)) return null
      const result = code(id.slice(1))
      if (result === undefined) throw new Error(`[novon] unknown virtual module: ${id}`)
      return result
    },
  }
}

/** Resolve bare imports that only exist inside the novon package. */
function fallbackResolve(packageRoot: string, siteRoot: string): Plugin {
  const resolvable = (source: string, from: string): boolean => {
    try {
      Bun.resolveSync(source, from)
      return true
    } catch {
      return false
    }
  }
  return {
    name: 'novon:fallback-resolve',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer || typeof Bun === 'undefined') return null
      // Only bare specifiers; relative, absolute and `node:`/`C:` are left alone.
      if (!/^[a-zA-Z@][^:]*$/.test(source)) return null
      const fromSite = importer.replace(/[^/\\]*$/, '') || siteRoot
      // Resolvable from the importer (or from the site) — let Vite handle it.
      if (resolvable(source, fromSite) || resolvable(source, siteRoot)) return null
      try {
        return Bun.resolveSync(source, packageRoot)
      } catch {
        return null
      }
    },
  }
}

/**
 * Resolve a request path to a real file inside the site's `public/` directory.
 *
 * Vite serves `public/` from its own middleware, which runs after this one, so
 * the SPA shell would otherwise shadow any extension-less public path. That
 * breaks a plain directory of static files — a copied example site, a generated
 * report — in dev while `novon build` copies it correctly.
 *
 * Vite's dev static handler also does not resolve a directory to its
 * `index.html`, so directory hits are reported back and rewritten before Vite
 * sees them.
 */
function publicFileLookup(publicDir: string | false) {
  if (!publicDir) return () => undefined
  const root = resolve(publicDir)
  return (pathname: string): { directory: boolean } | undefined => {
    let decoded: string
    try {
      decoded = decodeURIComponent(pathname)
    } catch {
      return undefined
    }
    const target = resolve(root, decoded.replace(/^[/\\]+/, ''))
    // Never let a request escape `public/`.
    if (target !== root && !target.startsWith(root + sep)) return undefined
    try {
      const stats = statSync(target)
      if (stats.isDirectory()) return existsSync(join(target, 'index.html')) ? { directory: true } : undefined
      return stats.isFile() ? { directory: false } : undefined
    } catch {
      return undefined
    }
  }
}

/** Serve the HTML shell for every route and restart when the config changes. */
function devServer({ config, packageRoot, configFile }: CreateViteConfigOptions): Plugin {
  const runtime = runtimeConfig(config)
  const entry = `/@fs/${toPosix(join(packageRoot, 'src', 'runtime', 'entry-client.tsx'))}`
  const lookupPublicFile = publicFileLookup(config.publicDir)

  return {
    name: 'novon:dev',
    enforce: 'pre',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const url = request.url ?? '/'
        const pathname = url.split('?')[0]
        // Our middleware runs before Vite strips base. Never return the HTML
        // shell for /docs/@vite/client or /docs/@id/virtual:stylex:css-only.
        const path = pathname.startsWith(config.base) ? '/' + pathname.slice(config.base.length) : pathname
        // StyleX's middleware also runs before Vite's base middleware and only
        // recognizes the root-relative endpoint (including HMR cache queries).
        if (path === '/virtual:stylex.css') {
          request.url = path + url.slice(pathname.length)
          return next()
        }
        if (path.startsWith('/@') || path.startsWith('/node_modules/') || /\.[a-z0-9]{1,6}$/i.test(path)) {
          return next()
        }
        // A real file in `public/` wins over the shell; a directory index has to
        // be named explicitly because Vite's dev handler will not resolve it.
        const publicFile = lookupPublicFile(path)
        if (publicFile) {
          if (publicFile.directory) {
            const query = url.length > pathname.length ? url.slice(pathname.length) : ''
            request.url = `${pathname.replace(/\/*$/, '/')}index.html${query}`
          }
          return next()
        }
        try {
          const html = renderDocument({
            config: runtime,
            title: runtime.title,
            description: runtime.description,
            body: '',
            // transformIndexHtml adds config.base to these root-relative URLs.
            styles: '<link rel="stylesheet" href="/virtual:stylex.css" />',
            devScripts: `<script type="module" src="/@vite/client"></script>\n    <script type="module" src="/@id/virtual:stylex:css-only"></script>\n    <script type="module" src="${entry}"></script>`,
          })
          response.setHeader('content-type', 'text/html')
          response.end(await server.transformIndexHtml(url, html))
        } catch (error) {
          next(error as Error)
        }
      })

      server.watcher.add(configFile)
      server.watcher.on('change', (file) => {
        if (resolve(file) === resolve(configFile)) {
          server.config.logger.info('[novon] config changed — restarting dev server')
          server.restart()
        }
      })
    },
  }
}

export function createNovonViteConfig(options: CreateViteConfigOptions): UserConfig {
  const { config, siteRoot, packageRoot } = options
  const target = process.env.NOVON_TARGET ?? 'client'
  const runtimeDir = join(packageRoot, 'src', 'runtime')
  const cacheDir = join(siteRoot, '.novon')
  // Package managers may hoist dependencies next to novon rather than nest
  // them inside it. Resolve from the installed package, not a guessed directory.
  const require = createRequire(join(packageRoot, 'package.json'))
  const dependency = (specifier: string) => toPosix(require.resolve(specifier))
  const isServer = target === 'server'

  // Bare deps from novon's own dependency tree. A site has no node_modules, and
  // the optimizer resolves `include` entries from the site root, so each entry
  // is also aliased to its real file (react is handled the same way below).
  // That makes optimization deterministic and keeps CJS transitives (e.g.
  // use-sync-external-store) bundled instead of served as raw ESM.
  const bundledDeps = [
    '@stylexjs/stylex', 'lucide-react', 'react-aria-components',
  ]
  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const mdxPlugin = mdx(mdxOptions(config.mdx, config.base)) as Plugin
  mdxPlugin.enforce = 'pre'

  return {
    root: siteRoot,
    base: config.base,
    publicDir: config.publicDir === false ? false : config.publicDir,
    cacheDir: join(cacheDir, 'vite'),
    resolve: {
      alias: [
        ...novonAliases(packageRoot).map((entry) => ({
          find: entry.find,
          replacement: toPosix(entry.replacement),
        })),
        { find: /^react$/, replacement: dependency('react') },
        { find: /^react-dom$/, replacement: dependency('react-dom') },
        { find: /^react\/jsx-runtime$/, replacement: dependency('react/jsx-runtime') },
        { find: /^react\/jsx-dev-runtime$/, replacement: dependency('react/jsx-dev-runtime') },
        { find: /^react-dom\/server$/, replacement: dependency('react-dom/server.node') },
        { find: /^react-dom\/client$/, replacement: dependency('react-dom/client') },
        { find: /^@mdx-js\/react$/, replacement: dependency('@mdx-js/react') },
        ...bundledDeps.map((specifier) => ({
          find: new RegExp(`^${escapeRegExp(specifier)}$`),
          replacement: dependency(specifier),
        })),
      ],
      dedupe: ['react', 'react-dom', '@mdx-js/react'],
    },
    optimizeDeps: {
      // The dep set is closed and known; `noDiscovery` keeps optimization a
      // single startup pass. Vite's discovery path can otherwise hold served
      // dep chunks behind a re-optimization that itself waits for request idle,
      // which deadlocks a cold dev start under load. Unlisted imports still
      // work; they load as unbundled ESM in dev.
      include: [
        'react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime',
        '@mdx-js/react', ...bundledDeps,
      ],
      noDiscovery: true,
      // novon ships StyleX calls that must pass through the compiler. Excluding
      // the package keeps `novon` and `novon/runtime/*` specifiers as source
      // modules (Vite matches this entry by prefix), so no uncompiled dep chunk
      // can execute stylex.defineConsts/create at runtime. The unplugin's own
      // discovery cannot see this from a node_modules-less site root.
      exclude: ['novon'],
    },
    server: {
      fs: { allow: [siteRoot, packageRoot] },
      port: Number(process.env.NOVON_PORT ?? 4321),
      host: process.env.NOVON_HOST || undefined,
    },
    build: isServer
      ? {
          outDir: join(cacheDir, 'server'),
          emptyOutDir: true,
          ssr: join(runtimeDir, 'entry-server.tsx'),
          minify: false,
          target: 'esnext',
          sourcemap: false,
        }
      : {
          outDir: config.outDir,
          emptyOutDir: true,
          manifest: true,
          target: 'es2022',
          assetsDir: 'assets',
          rolldownOptions: {
            input: { 'novon-client': join(runtimeDir, 'entry-client.tsx') },
          },
        },
    ssr: {
      // Bundling everything keeps the prerenderer free of CJS/ESM interop issues.
      noExternal: true,
      target: 'node',
    },
    plugins: [
      contentPlugin(siteRoot),
      devOgPlugin(siteRoot, runtimeConfig(config)),
      devMarkdownPlugin({ siteRoot, layout: config.layout, layers: config.layers, base: config.base }),
      virtualModules(options),
      devServer(options),
      fallbackResolve(packageRoot, siteRoot),
      // The same compiler/options must run for client, SSR and installed-package
      // sources. StyleX lives in its own `novon` layer: theme/base/components
      // stay overridable at the element level and unlayered site CSS wins last.
      stylex.vite({
        useCSSLayers: { prefix: 'novon', before: ['theme', 'base', 'components'] },
        unstable_moduleResolution: { type: 'commonJS', rootDir: packageRoot },
        aliases: { 'novon/runtime/*': [toPosix(join(runtimeDir, '*'))] },
        runtimeInjection: false,
        // The full dev runtime fetches a root-relative CSS URL in 0.19.1.
        // css-only refreshes our base-aware link in novon's custom HTML shell.
        devMode: 'css-only',
      }),
      react(),
      mdxPlugin,
    ],
  }
}

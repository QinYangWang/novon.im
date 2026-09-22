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
import { isAbsolute, join, relative, resolve, sep } from 'node:path'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import tailwindcss from '@tailwindcss/vite'
import type { Plugin, UserConfig } from 'vite'
import { novonAliases } from './load.ts'
import { contentPlugin } from './content-plugin.ts'
import { devMarkdownPlugin } from './dev-markdown.ts'
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
    template: config.template,
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

/** Serve the HTML shell for every route and restart when the config changes. */
function devServer({ config, packageRoot, configFile }: CreateViteConfigOptions): Plugin {
  const runtime = runtimeConfig(config)
  const entry = `/@fs/${toPosix(join(packageRoot, 'src', 'runtime', 'entry-client.tsx'))}`

  return {
    name: 'novon:dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const url = request.url ?? '/'
        const path = url.split('?')[0]
        if (path.startsWith('/@') || path.startsWith('/node_modules/') || /\.[a-z0-9]{1,6}$/i.test(path)) {
          return next()
        }
        try {
          const html = renderDocument({
            config: runtime,
            title: runtime.title,
            description: runtime.description,
            body: '',
            devScripts: `<script type="module" src="/@vite/client"></script>\n    <script type="module" src="${entry}"></script>`,
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
  const modules = join(packageRoot, 'node_modules')
  const isServer = target === 'server'

  const mdxPlugin = mdx(mdxOptions(config.mdx)) as Plugin
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
        { find: /^react$/, replacement: toPosix(join(modules, 'react')) },
        { find: /^react-dom$/, replacement: toPosix(join(modules, 'react-dom')) },
        { find: /^react\/jsx-runtime$/, replacement: toPosix(join(modules, 'react', 'jsx-runtime.js')) },
        { find: /^react\/jsx-dev-runtime$/, replacement: toPosix(join(modules, 'react', 'jsx-dev-runtime.js')) },
        { find: /^react-dom\/server$/, replacement: toPosix(join(modules, 'react-dom', 'server.node.js')) },
        { find: /^react-dom\/client$/, replacement: toPosix(join(modules, 'react-dom', 'client.js')) },
        { find: /^@mdx-js\/react$/, replacement: toPosix(join(modules, '@mdx-js', 'react')) },
      ],
      dedupe: ['react', 'react-dom', '@mdx-js/react'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime', '@mdx-js/react'],
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
      devMarkdownPlugin({ siteRoot, template: config.template, base: config.base }),
      virtualModules(options),
      devServer(options),
      fallbackResolve(packageRoot, siteRoot),
      react(),
      mdxPlugin,
      tailwindcss(),
    ],
  }
}

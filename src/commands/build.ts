/**
 * `novon build` — client bundle, server bundle, then one HTML file per route.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { normalizeBase } from '../config.ts'
import { renderDocument } from '../document.ts'
import { markdownPath, outputPath } from '../paths.ts'
import type { BuiltPage, BuildContext } from '../plugins/api.ts'
import type { Route, TocEntry } from '../types.ts'
import { runtimeConfig } from '../vite-config.ts'
import { runPluginSetup, runVite, writeFileEnsured, type Site } from './shared.ts'

export interface BuildFlags {
  outDir?: string
  base?: string
}

interface ManifestChunk {
  file: string
  isEntry?: boolean
  css?: string[]
  imports?: string[]
}

interface RenderResult {
  html: string
  title: string
  description?: string
  headings: TocEntry[]
  frontmatter: Record<string, unknown>
  excerpt: string
}

function withBase(base: string, path: string): string {
  if (!path) return base
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return path
  const prefix = base.endsWith('/') ? base.slice(0, -1) : base
  return `${prefix}${path.startsWith('/') ? path : `/${path}`}`
}
/** The script and stylesheets of the client entry, including shared chunks. */
function collectAssets(manifest: Record<string, ManifestChunk>, base: string) {
  const entry = Object.values(manifest).find((chunk) => chunk.isEntry)
  if (!entry) throw new Error('[novon] client manifest has no entry chunk')

  const css = new Set<string>()
  const seen = new Set<string>()
  const walk = (chunk: ManifestChunk | undefined) => {
    if (!chunk || seen.has(chunk.file)) return
    seen.add(chunk.file)
    for (const file of chunk.css ?? []) css.add(file)
    for (const name of chunk.imports ?? []) walk(manifest[name])
  }
  walk(entry)

  return {
    script: withBase(base, entry.file),
    css: [...css].map((file) => withBase(base, file)),
  }
}

/** `/guide/setup` -> `guide/setup/index.html` */
function outputFile(path: string): string {
  return outputPath(path)
}

export async function build(site: Site, flags: BuildFlags): Promise<void> {
  const { config, root, packageRoot } = site
  if (flags.outDir) config.outDir = join(root, flags.outDir)
  if (flags.base) config.base = normalizeBase(flags.base)
  if (!config.url && flags.base === undefined) {
    // Nothing to do — just a hint that absolute URLs stay relative.
  }

  const outDir = config.outDir
  const started = Date.now()
  console.log(`\n  novon build — ${config.title}`)
  console.log(`  template  ${config.template}`)
  console.log(`  base      ${config.base}`)
  console.log(`  output    ${outDir}\n`)

  await runPluginSetup(config.plugins, site)

  // Both overrides are passed to Vite through the environment so the config it
  // loads resolves to the same base and output directory as this process.
  const env = { NOVON_TARGET: 'client', NOVON_BASE: config.base, NOVON_OUT_DIR: outDir }
  const serverEnv = { ...env, NOVON_TARGET: 'server' }

  // 1. browser bundle (+ public/ copied by Vite)
  await runVite(site, ['build'], env)
  // 2. server bundle used for prerendering
  await runVite(site, ['build'], serverEnv)

  // 3. render every route
  const serverDir = join(root, '.novon', 'server')
  const serverEntry = ['entry-server.mjs', 'entry-server.js']
    .map((name) => join(serverDir, name))
    .find((path) => existsSync(path))
  if (!serverEntry) {
    throw new Error(`[novon] the server bundle is missing from ${serverDir}`)
  }
  const server = (await import(`${pathToFileURL(serverEntry).href}?v=${Date.now()}`)) as {
    getRoutes(): Route[]
    render(url: string): Promise<RenderResult>
  }

  const routes = server.getRoutes()
  const manifest = JSON.parse(
    readFileSync(join(outDir, '.vite', 'manifest.json'), 'utf8'),
  ) as Record<string, ManifestChunk>
  const assets = collectAssets(manifest, config.base)
  const runtime = runtimeConfig(config)

  const styles = assets.css
    .map((href) => `<link rel="stylesheet" href="${href}" />`)
    .join('\n    ')
  const scripts = `<script type="module" src="${assets.script}"></script>`

  const pages: BuiltPage[] = []

  for (const route of routes) {
    const result = await server.render(route.path)
    const page: BuiltPage = {
      route,
      title: result.title,
      description: result.description,
      excerpt: result.excerpt,
      headings: result.headings,
      frontmatter: result.frontmatter,
      html: result.html,
      outputPath: join(outDir, outputFile(route.path)),
    }

    let document = renderDocument({
      config: runtime,
      title: result.title,
      path: route.path,
      description: result.description,
      body: result.html,
      styles,
      scripts,
      ogType: result.frontmatter.date ? 'article' : 'website',
      ogImage: typeof result.frontmatter.image === 'string' ? result.frontmatter.image : undefined,
    })

    const context = { root, config, outDir, base: config.base, packageRoot }
    for (const plugin of config.plugins) {
      if (plugin.transformHtml) document = plugin.transformHtml(document, page, context)
    }

    writeFileEnsured(page.outputPath, document)

    // The Markdown source of every page, so "Copy Markdown" and LLM tooling can
    // fetch the original file rather than a scraped rendering.
    if (route.file) {
      const source = join(root, route.file)
      if (existsSync(source)) {
        writeFileEnsured(join(outDir, markdownPath(route.path)), readFileSync(source, 'utf8'))
      }
    }

    pages.push(page)
  }

  // 4. 404 page for static hosts (Vercel, Cloudflare Pages, GitHub Pages)
  const notFoundUrl = '/404'
  if (!routes.some((route) => route.path === notFoundUrl)) {
    const result = await server.render(notFoundUrl)
    writeFileEnsured(
      join(outDir, '404.html'),
      renderDocument({
        config: runtime,
        title: 'Page not found',
        body: result.html,
        styles,
        scripts,
      }),
    )
  }

  // 5. plugin output (sitemap, rss, search index, …)
  const context: BuildContext = {
    root,
    config,
    outDir,
    base: config.base,
    packageRoot,
    pages,
    write(file, contents) {
      writeFileEnsured(join(outDir, file), contents)
    },
    log(message) {
      console.log(`  ${message}`)
    },
  }
  for (const plugin of config.plugins) {
    await plugin.postBuild?.(context)
  }

  // GitHub Pages runs Jekyll unless told otherwise.
  writeFileEnsured(join(outDir, '.nojekyll'), '')

  const seconds = ((Date.now() - started) / 1000).toFixed(2)
  console.log(`\n  ✓ ${pages.length} pages built in ${seconds}s → ${outDir}\n`)
  if (!config.url) {
    console.log('  tip: set `url` in novon.config.ts for absolute sitemap and RSS links\n')
  }
}

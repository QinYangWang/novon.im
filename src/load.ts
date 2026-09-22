/**
 * Module loading for site configs and plugins.
 *
 * A novon site has no `node_modules` — content and config are the only files.
 * So when a config says `import { defineConfig } from 'novon'`, that specifier has
 * to be resolved against the installed novon package instead of the site.
 *
 * Bun's runtime plugins do not intercept bare imports inside already-loaded ESM
 * modules, so novon rewrites specifiers to absolute `file://` URLs and imports the
 * result from `<site>/.novon/`. The rewrite is transitive: a config that imports
 * `./plugins/robots.ts` gets that module rewritten too, or its own `novon/plugin`
 * import would fail.
 *
 * Relative imports, `import.meta.dirname` and `import.meta.url` keep pointing at
 * the real files, so a config behaves exactly as written.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

/** `import x from '…'`, `import('…')`, `import '…'`, `export … from '…'`. */
const SPECIFIER_RE = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])([^'"\n]+)\2/g

const NO_REWRITE = /^(file:|data:|node:|bun:|https?:|blob:)/

/** Where novon's public subpaths live inside the package. */
const SUBPATH_ENTRIES: Record<string, string> = {
  '': 'src/index.ts',
  config: 'src/config.ts',
  plugin: 'src/plugins/api.ts',
  'theme.css': 'src/runtime/theme.css',
}

/** Resolve `novon` / `novon/<sub>` to an absolute file inside the package. */
export function resolveNovonSubpath(spec: string, packageRoot: string): string | undefined {
  if (spec !== 'novon' && !spec.startsWith('novon/')) return undefined
  const sub = spec.slice('novon'.length).replace(/^\//, '')
  if (sub in SUBPATH_ENTRIES) return join(packageRoot, SUBPATH_ENTRIES[sub])
  if (sub.startsWith('runtime/')) return join(packageRoot, 'src/runtime', sub.slice('runtime/'.length))
  return undefined
}

/** Every `novon/*` public entry, used to build Vite aliases for content files. */
export function novonAliases(packageRoot: string): { find: RegExp; replacement: string }[] {
  return [
    // Content runs in the browser, so bare `novon` resolves to the runtime half
    // only. The package root re-exports config and tooling that reach for Node
    // builtins, which must never enter the client bundle.
    { find: /^novon$/, replacement: join(packageRoot, 'src/runtime/index.ts') },
    { find: /^novon\/config$/, replacement: join(packageRoot, 'src/config.ts') },
    { find: /^novon\/plugin$/, replacement: join(packageRoot, 'src/plugins/api.ts') },
    { find: /^novon\/theme\.css$/, replacement: join(packageRoot, 'src/runtime/theme.css') },
    { find: /^novon\/runtime\//, replacement: join(packageRoot, 'src/runtime') + '/' },
  ]
}

/** Resolve one import specifier to something importable from anywhere. */
function resolveSpecifier(spec: string, dir: string, packageRoot: string): string {
  if (!spec || NO_REWRITE.test(spec)) return spec

  const mapped = resolveNovonSubpath(spec, packageRoot)
  if (mapped) return pathToFileURL(mapped).href

  const relative = spec.startsWith('.') || isAbsolute(spec) || spec.startsWith('/')
  if (relative) {
    try {
      return pathToFileURL(Bun.resolveSync(spec, dir)).href
    } catch {
      return pathToFileURL(resolve(dir, spec)).href
    }
  }

  // Bare import: prefer the site's own copy, then novon's dependencies.
  for (const base of [dir, packageRoot]) {
    try {
      return pathToFileURL(Bun.resolveSync(spec, base)).href
    } catch {
      // try the next base
    }
  }
  return spec
}

export interface RewriteOptions {
  /** Called for local modules that should be rewritten first. */
  resolveLocal?: (spec: string, dir: string) => string | undefined
}

/** Rewrite a config/plugin module so it can be imported from anywhere. */
export function rewriteModuleSource(
  source: string,
  file: string,
  packageRoot: string,
  options: RewriteOptions = {},
): string {
  const dir = dirname(file)
  return source
    .replace(SPECIFIER_RE, (match, prefix: string, quote: string, spec: string) => {
      const local = options.resolveLocal?.(spec, dir)
      const next = local ? pathToFileURL(local).href : resolveSpecifier(spec, dir, packageRoot)
      return next === spec ? match : `${prefix}${quote}${next}${quote}`
    })
    .replace(/import\.meta\.dirname/g, JSON.stringify(dir))
    .replace(/import\.meta\.filename/g, JSON.stringify(file))
    .replace(/import\.meta\.url/g, JSON.stringify(pathToFileURL(file).href))
}

/** Directory holding generated build inputs. Safe to delete at any time. */
export function cacheDir(root: string): string {
  const dir = join(root, '.novon')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const ignore = join(dir, '.gitignore')
  if (!existsSync(ignore)) writeFileSync(ignore, '*\n')
  return dir
}

/**
 * Copy `entry` and every local module it imports into `<site>/.novon/`, with all
 * specifiers rewritten, and return the path of the importable copy.
 */
export function prepareModule(entry: string, packageRoot: string): string {
  const siteRoot = dirname(entry)
  const outDir = cacheDir(siteRoot)
  const outputs = new Map<string, string>()
  let counter = 0

  const prepare = (file: string): string => {
    const known = outputs.get(file)
    if (known) return known

    // Assigned before recursing so an import cycle still resolves.
    const out = join(outDir, `${(counter += 1)}-${basename(file).replace(/\.(ts|js|mjs|mts)$/, '')}.ts`)
    outputs.set(file, out)

    const source = readFileSync(file, 'utf8')
    const rewritten = rewriteModuleSource(source, file, packageRoot, {
      resolveLocal: (spec, dir) => {
        const target = localModule(spec, dir, siteRoot)
        return target ? prepare(target) : undefined
      },
    })
    writeFileSync(out, rewritten)
    return out
  }

  return prepare(entry)
}

/** A site-local module that should be rewritten too, or undefined. */
function localModule(spec: string, dir: string, siteRoot: string): string | undefined {
  if (!spec || NO_REWRITE.test(spec)) return undefined
  if (!spec.startsWith('.') && !isAbsolute(spec) && !spec.startsWith('/')) return undefined

  let resolved: string
  try {
    resolved = Bun.resolveSync(spec, dir)
  } catch {
    resolved = resolve(dir, spec)
  }
  if (!existsSync(resolved)) return undefined
  // Only the site's own files; novon's source and packages resolve normally.
  if (!resolved.startsWith(siteRoot + sep)) return undefined
  if (resolved.startsWith(join(siteRoot, '.novon') + sep)) return undefined
  return resolved
}

/** Import a TypeScript module (and its local imports) with `novon` resolved. */
export async function importSiteModule<T = any>(file: string, packageRoot: string): Promise<T> {
  const target = prepareModule(file, packageRoot)
  const mod = (await import(pathToFileURL(target).href)) as any
  return (mod && typeof mod === 'object' && 'default' in mod ? mod.default : mod) as T
}

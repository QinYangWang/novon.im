/**
 * Builds the two starter templates into the docs site as live examples.
 *
 * `novon new` scaffolds `templates/docs` and `templates/blog` with `__TITLE__`
 * substitution. This plugin performs the same substitution, builds each template
 * with `--base <parent-base>/examples/<name>-template/`, and copies the finished site into
 * `public/examples/`, which Vite serves in dev and ships in the build.
 *
 * The examples are therefore always exactly the templates this package ships,
 * with no second copy to keep in sync, and they need no extra server or port.
 *
 * Generated files live under `public/examples/` (git-ignored) and are rebuilt
 * when a template, the generator or this file changes.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { definePlugin } from 'novon/plugin'
import { absoluteUrl } from '../../src/url.ts'

/** Templates to build, and what `novon new`'s placeholders become for each. */
const TEMPLATES = {
  docs: { title: 'novon docs', name: 'novon-docs-example' },
  blog: { title: 'novon journal', name: 'novon-journal-example' },
} as const

/** Newest mtime under `dir`, so a template edit forces a rebuild. */
function newestMtime(dir: string): number {
  let newest = 0
  const walk = (current: string) => {
    for (const entry of readdirSync(current)) {
      const path = join(current, entry)
      const stats = statSync(path)
      if (stats.isDirectory()) walk(path)
      else newest = Math.max(newest, stats.mtimeMs)
    }
  }
  try {
    walk(dir)
  } catch {
    // A missing template is handled by the caller.
  }
  return newest
}

/** Copy a template with `novon new`'s placeholder substitution. */
function scaffold(source: string, target: string, values: Record<string, string>): void {
  mkdirSync(target, { recursive: true })
  for (const entry of readdirSync(source)) {
    const from = join(source, entry)
    const to = join(target, entry)
    if (statSync(from).isDirectory()) {
      scaffold(from, to, values)
      continue
    }
    if (/\.(mdx?|ts|js|json|css|html|txt|svg)$/.test(entry) || !entry.includes('.')) {
      let contents = readFileSync(from, 'utf8')
      for (const [key, value] of Object.entries(values)) contents = contents.split(key).join(value)
      writeFileSync(to, contents)
    } else {
      cpSync(from, to)
    }
  }
}

/** Copy a built site, leaving the Vite manifest behind. */
function copySite(from: string, to: string): number {
  let files = 0
  const walk = (current: string, target: string) => {
    mkdirSync(target, { recursive: true })
    for (const entry of readdirSync(current)) {
      if (entry === '.vite') continue
      const source = join(current, entry)
      const destination = join(target, entry)
      if (statSync(source).isDirectory()) walk(source, destination)
      else {
        cpSync(source, destination)
        files += 1
      }
    }
  }
  walk(from, to)
  return files
}

export default definePlugin({
  name: 'examples',
  setup(ctx) {
    // A template must never build itself as an example.
    if (process.env.NOVON_EXAMPLES_BUILD === '1') return
    if (typeof Bun === 'undefined') {
      console.warn('[examples] skipped: the nested template build needs the Bun runtime')
      return
    }

    const cli = join(ctx.packageRoot, 'bin', 'novon.js')
    if (!existsSync(cli)) {
      console.warn(`[examples] skipped: ${cli} is missing`)
      return
    }

    const templatesRoot = join(ctx.packageRoot, 'templates')
    const publicRoot = join(ctx.root, 'public', 'examples')
    const workRoot = join(ctx.root, '.novon', 'examples')
    const stampRoot = join(workRoot, 'stamps')
    const built: string[] = []

    for (const [name, values] of Object.entries(TEMPLATES)) {
      const template = join(templatesRoot, name)
      if (!existsSync(template)) {
        console.warn(`[examples] skipped: no template at ${template}`)
        continue
      }

      const output = join(publicRoot, `${name}-template`)
      const examplePath = `/examples/${name}-template/`
      const base = `${ctx.base.replace(/\/$/, '')}${examplePath}`
      const url = ctx.config.url ? absoluteUrl(ctx.config, examplePath) : undefined
      const stampFile = join(stampRoot, name)
      const stamp = `${base}:${url}:${newestMtime(template)}:${statSync(import.meta.filename).mtimeMs}:${newestMtime(join(ctx.packageRoot, 'src'))}`
      if (existsSync(join(output, 'index.html')) && existsSync(stampFile) && readFileSync(stampFile, 'utf8') === stamp) {
        built.push(base)
        continue
      }

      const work = join(workRoot, name)
      rmSync(work, { recursive: true, force: true })
      scaffold(template, work, {
        __TITLE__: values.title,
        __NAME__: values.name,
        __TEMPLATE__: name,
      })

      // Keep starter configs reusable; only the embedded examples inherit the
      // parent's public URL. This also makes canonical and OG URLs crawlable.
      const configFile = join(work, 'novon.config.ts')
      const source = readFileSync(configFile, 'utf8')
      writeFileSync(configFile, source.replace('defineConfig({',
        `defineConfig({\n  url: ${JSON.stringify(url) ?? 'undefined'},`))

      const result = Bun.spawnSync(
        [process.execPath, cli, 'build', '--base', base, '--out-dir', 'dist'],
        {
          cwd: work,
          env: { ...process.env, NOVON_EXAMPLES_BUILD: '1' },
          stdout: 'pipe',
          stderr: 'pipe',
        },
      )
      if (result.exitCode !== 0) {
        throw new Error(
          `[examples] building the ${name} template failed (exit ${result.exitCode})\n` +
            `${result.stdout.toString()}${result.stderr.toString()}`,
        )
      }

      rmSync(output, { recursive: true, force: true })
      const files = copySite(join(work, 'dist'), output)
      mkdirSync(stampRoot, { recursive: true })
      writeFileSync(stampFile, stamp)
      built.push(`${base} (${files} files)`)
    }

    if (built.length > 0) console.log(`  examples  ${built.join(', ')}`)
  },
})

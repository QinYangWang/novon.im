/**
 * `novon new` — scaffold a site.
 *
 * The result is only MDX and a config file: no package.json, no source code, no
 * theme to maintain. `novon dev` and `novon build` run against the installed
 * novon package.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { NovonError } from '../config.ts'

export interface NewFlags {
  template?: string
  force?: boolean
  title?: string
}

const TEMPLATES = ['docs', 'blog'] as const
type TemplateName = (typeof TEMPLATES)[number]

function humanize(name: string): string {
  return name
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function isEmptyDir(path: string): boolean {
  return readdirSync(path).length === 0
}

/** Copy a template, substituting `__TITLE__` and `__TEMPLATE__`. */
function copyTemplate(source: string, target: string, values: Record<string, string>): number {
  let count = 0
  mkdirSync(target, { recursive: true })

  for (const entry of readdirSync(source)) {
    const from = join(source, entry)
    const to = join(target, entry)
    if (statSync(from).isDirectory()) {
      count += copyTemplate(from, to, values)
      continue
    }
    if (/\.(mdx?|ts|js|json|css|html|txt|svg)$/.test(entry) || !entry.includes('.')) {
      let contents = readFileSync(from, 'utf8')
      for (const [key, value] of Object.entries(values)) {
        contents = contents.split(key).join(value)
      }
      writeFileSync(to, contents)
    } else {
      cpSync(from, to)
    }
    count += 1
  }
  return count
}

export function scaffold(packageRoot: string, target: string, flags: NewFlags): void {
  const template = (flags.template ?? 'docs') as TemplateName
  if (!TEMPLATES.includes(template)) {
    throw new NovonError(`Unknown template "${flags.template}". Available templates: ${TEMPLATES.join(', ')}.`)
  }

  const source = join(packageRoot, 'templates', template)
  if (!existsSync(source)) {
    throw new NovonError(`[novon] template directory is missing: ${source}`)
  }

  if (existsSync(target)) {
    if (!statSync(target).isDirectory()) {
      throw new NovonError(`${target} already exists and is not a directory.`)
    }
    if (!isEmptyDir(target) && !flags.force) {
      throw new NovonError(
        `${target} is not empty. Pass --force to scaffold into it anyway (existing files with the same names are replaced).`,
      )
    }
  }

  const name = target.replace(/[\\/]+$/, '').split(/[\\/]/).pop() ?? 'novon-site'
  const title = flags.title ?? humanize(name)

  const count = copyTemplate(source, target, {
    __TITLE__: title,
    __TEMPLATE__: template,
    __NAME__: name,
  })

  console.log(`\n  ✓ Created ${template} site in ${target} (${count} files)\n`)
  console.log('  Next steps:')
  console.log(`    cd ${target}`)
  console.log('    novon dev            # live preview on http://localhost:4321')
  console.log('    novon build          # static output in dist/\n')
  console.log('  Content lives in content/. Everything else is novon.config.ts.\n')
}

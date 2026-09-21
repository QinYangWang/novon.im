/**
 * `novon` command line interface.
 *
 *   novon new <dir> [--template docs|blog] [--force]
 *   novon dev [--port 4321] [--host]
 *   novon build [--out-dir dist] [--base /repo/]
 *   novon help | novon version
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { NovonError } from './config.ts'
import { build } from './commands/build.ts'
import { dev } from './commands/dev.ts'
import { scaffold } from './commands/new.ts'
import { loadSite } from './commands/shared.ts'

export const PACKAGE_ROOT = resolve(import.meta.dirname, '..')

const HELP = `novon — static blog and documentation generator

Usage
  novon <command> [options]

Commands
  new <dir>     Create a new site (content/ + novon.config.ts)
  dev           Start the dev server with live reload
  build         Build the static site into dist/
  help          Show this message
  version       Print the novon version

Options for new
  -t, --template <docs|blog>   Site template (default: docs)
      --title <name>           Site title (default: derived from the directory name)
  -f, --force                  Scaffold into a non-empty directory

Options for dev
  -p, --port <number>          Port (default: 4321)
      --host [address]         Expose on the network

Options for build
      --out-dir <dir>          Output directory (default: dist)
      --base <path>            Base path, e.g. --base /my-repo/ for GitHub Pages

Examples
  novon new my-docs
  novon new my-blog --template blog
  novon dev --port 3000
  novon build --base /my-repo/
`

interface Parsed {
  flags: Record<string, string | boolean>
  positional: string[]
}

function parseArgs(argv: string[]): Parsed {
  const flags: Record<string, string | boolean> = {}
  const positional: string[] = []

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg.startsWith('--')) {
      const [key, inline] = arg.slice(2).split('=')
      if (inline !== undefined) flags[key] = inline
      else if (argv[index + 1] && !argv[index + 1].startsWith('-')) flags[key] = argv[(index += 1)]
      else flags[key] = true
    } else if (arg.startsWith('-') && arg.length === 2) {
      const key = arg.slice(1)
      if (argv[index + 1] && !argv[index + 1].startsWith('-')) flags[key] = argv[(index += 1)]
      else flags[key] = true
    } else {
      positional.push(arg)
    }
  }
  return { flags, positional }
}

function version(): string {
  try {
    const pkg = JSON.parse(readFileSync(resolve(PACKAGE_ROOT, 'package.json'), 'utf8'))
    return String(pkg.version ?? '0.0.0')
  } catch {
    return '0.0.0'
  }
}

const str = (value: string | boolean | undefined): string | undefined =>
  typeof value === 'string' ? value : undefined

export async function main(argv: string[]): Promise<number> {
  const { flags, positional } = parseArgs(argv)
  const command = positional[0] ?? (flags.help || flags.h ? 'help' : flags.version || flags.v ? 'version' : 'help')

  try {
    switch (command) {
      case 'new':
      case 'create':
      case 'init': {
        const target = positional[1]
        if (!target) throw new NovonError('Usage: novon new <dir> [--template docs|blog]')
        scaffold(PACKAGE_ROOT, resolve(process.cwd(), target), {
          template: str(flags.template) ?? str(flags.t),
          force: Boolean(flags.force || flags.f),
          title: str(flags.title),
        })
        return 0
      }

      case 'dev':
      case 'serve': {
        const site = await loadSite(process.cwd(), PACKAGE_ROOT)
        const port = str(flags.port) ?? str(flags.p)
        await dev(site, {
          port: port ? Number(port) : undefined,
          host: flags.host ? (typeof flags.host === 'string' ? flags.host : true) : undefined,
        })
        return 0
      }

      case 'build': {
        const site = await loadSite(process.cwd(), PACKAGE_ROOT)
        await build(site, {
          outDir: str(flags['out-dir']) ?? str(flags.outDir),
          base: str(flags.base),
        })
        return 0
      }

      case 'help':
      case '--help':
        console.log(HELP)
        return 0

      case 'version':
        console.log(version())
        return 0

      default:
        console.error(`Unknown command "${command}".\n`)
        console.log(HELP)
        return 1
    }
  } catch (error) {
    if (error instanceof NovonError) {
      console.error(`\n  ✗ ${error.message}\n`)
      return 1
    }
    console.error(`\n  ✗ ${(error as Error).stack ?? (error as Error).message}\n`)
    return 1
  }
}

/**
 * `novon dev` — Vite dev server with live reload for content and config.
 */
import { runPluginSetup, runVite, type Site } from './shared.ts'

export interface DevFlags {
  port?: number
  host?: boolean | string
}

export async function dev(site: Site, flags: DevFlags): Promise<void> {
  await runPluginSetup(site.config.plugins, site)

  const env: Record<string, string> = { NOVON_TARGET: 'client' }
  if (flags.port) env.NOVON_PORT = String(flags.port)
  if (flags.host) env.NOVON_HOST = typeof flags.host === 'string' ? flags.host : '0.0.0.0'

  console.log(`\n  novon dev — ${site.config.title}`)
  console.log(`  content   ${site.config.contentDir}`)
  console.log(`  base      ${site.config.base}\n`)

  await runVite(site, ['dev'], env)
}

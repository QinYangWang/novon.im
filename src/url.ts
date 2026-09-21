/**
 * Absolute URL construction, shared by the document shell and the feed plugins.
 *
 * `url` is the site's public address and `base` is the path it is served from.
 * Both of these are the same site, and users write both:
 *
 *   url: 'https://user.github.io',       base: '/repo/'
 *   url: 'https://user.github.io/repo/', base: '/repo/'
 *
 * So the base is appended only when the url does not already end with it, rather
 * than producing `…/repo/repo/`.
 */

export interface SiteUrlConfig {
  url?: string
  base?: string
}

/** `/guide/setup` -> `https://example.com/guide/setup`. */
export function absoluteUrl(config: SiteUrlConfig, path: string): string {
  const configured = config.base
  const base = !configured || configured === '/' ? '' : configured.replace(/\/+$/, '')
  const clean = path === '/' ? '/' : path

  if (!config.url) return `${base}${clean}` || '/'

  const origin = config.url.replace(/\/+$/, '')
  const alreadyBased = base !== '' && origin.endsWith(base)
  return `${origin}${alreadyBased ? '' : base}${clean}`
}

/** Browser-safe social metadata shared by static HTML and client navigation. */
import type { RuntimeConfig } from './types.ts'
import { absoluteUrl } from './url.ts'

export const OG_WIDTH = 1200
export const OG_HEIGHT = 630

/** Collision-free, filesystem-safe names, including Unicode and long routes. */
export function ogImagePath(path: string): string {
  const hex = Array.from(new TextEncoder().encode(path), byte => byte.toString(16).padStart(2, '0')).join('')
  return `/_og/${hex.match(/.{1,120}/g)?.join('/') || '2f'}.png`
}

/** Explicit assets may be external, site-relative, or already base-prefixed. */
export function socialImageUrl(config: Pick<RuntimeConfig, 'url' | 'base'>, image: string): string {
  if (/^https?:\/\//i.test(image)) return image
  if (image.startsWith('//')) return `${config.url ? new URL(config.url).protocol : 'https:'}${image}`
  const path = `/${image.replace(/^\/+/, '')}`
  const base = config.base.replace(/\/$/, '')
  const unbased = base && path.startsWith(`${base}/`) ? path.slice(base.length) : path
  return absoluteUrl(config, unbased)
}

export function resolveOgImage(config: RuntimeConfig, path?: string, override?: string) {
  const explicit = override || config.theme.ogImage
  if (explicit) return { path: explicit, url: socialImageUrl(config, explicit), generated: false }
  if (path === undefined || config.theme.generateOgImages === false) return undefined
  const image = ogImagePath(path)
  return { path: image, url: socialImageUrl(config, image), generated: true }
}

export interface SocialPage {
  path?: string
  title: string
  description?: string
  ogImage?: string
  ogType?: string
}

export interface MetaTag {
  attribute: 'name' | 'property'
  key: string
  content: string
}

/** Include absent values so navigation can remove metadata from the last page. */
export function socialMeta(config: RuntimeConfig, page: SocialPage): MetaTag[] {
  const title = page.title && page.title !== config.title ? `${page.title} · ${config.title}` : config.title
  const image = resolveOgImage(config, page.path, page.ogImage)
  const description = page.description ?? ''
  const alt = page.title && page.title !== config.title ? `${page.title} — ${config.title}` : config.title
  return [
    { attribute: 'name', key: 'description', content: description },
    ...Object.entries({
      'og:title': title,
      'og:description': description,
      'og:type': page.ogType ?? 'website',
      'og:site_name': config.title,
      'og:url': config.url ? absoluteUrl(config, page.path ?? '/') : '',
      'og:image': image?.url ?? '',
      'og:image:alt': image ? alt : '',
      'og:image:width': image?.generated ? String(OG_WIDTH) : '',
      'og:image:height': image?.generated ? String(OG_HEIGHT) : '',
      'og:image:type': image?.generated ? 'image/png' : '',
    }).map(([key, content]) => ({ attribute: 'property' as const, key, content })),
    ...Object.entries({
      'twitter:card': image ? 'summary_large_image' : 'summary',
      'twitter:title': title,
      'twitter:description': description,
      'twitter:image': image?.url ?? '',
      'twitter:image:alt': image ? alt : '',
    }).map(([key, content]) => ({ attribute: 'name' as const, key, content })),
  ]
}

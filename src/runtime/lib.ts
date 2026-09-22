/**
 * Small browser-safe helpers shared by the theme.
 */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** Join a config `base` with a site-relative path. Absolute URLs pass through. */
export function withBase(base: string, path: string): string {
  if (!path) return base
  if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith('//')) return path
  const prefix = base.endsWith('/') ? base.slice(0, -1) : base
  return `${prefix}${path.startsWith('/') ? path : `/${path}`}`
}

/** `/guide/setup/` -> `/guide/setup`. Keeps `/`. */
export function normalizePathname(pathname: string, base: string): string {
  let path = pathname || '/'
  try { path = decodeURI(path) } catch { /* Leave malformed URLs to the 404 page. */ }
  const prefix = base.endsWith('/') ? base.slice(0, -1) : base
  if (prefix && prefix !== '/' && path.startsWith(prefix)) path = path.slice(prefix.length)
  path = path.replace(/index\.html$/, '').replace(/\/+$/, '')
  return path === '' ? '/' : path.startsWith('/') ? path : `/${path}`
}

export function formatDate(value: unknown, locale = 'en'): string {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(date)
}

/** `getting-started` -> `Getting started` */
export function humanize(segment: string): string {
  const words = segment.replace(/[-_]+/g, ' ').replace(/\.(md|mdx)$/, '').trim()
  if (!words) return segment
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** URL segment for a tag: `Release Notes` -> `release-notes`. */
export function tagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function isExternal(href: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')
}

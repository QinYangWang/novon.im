/** Progressive navigation over the static route table. No server/router required. */
import { normalizePathname } from './lib.ts'

export function routeForUrl(url: URL, current: URL, base: string, paths: ReadonlyMap<string, unknown>): string | undefined {
  if (url.origin !== current.origin || !['http:', 'https:'].includes(url.protocol)) return
  const prefix = base.replace(/\/$/, '')
  if (prefix && url.pathname !== prefix && !url.pathname.startsWith(`${prefix}/`)) return
  const path = normalizePathname(url.pathname, base)
  return paths.has(path) ? path : undefined
}

export function isPlainClick(event: Pick<MouseEvent, 'button' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey' | 'defaultPrevented'>): boolean {
  return !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}

/** Shared by keyboard search and ordinary links. Falls back before installation. */
export function navigate(href: string): void {
  const event = new CustomEvent('novon:navigate', { detail: href, cancelable: true })
  if (window.dispatchEvent(event)) window.location.assign(href)
}

type Position = { x: number; y: number }
interface NavigationOptions<T> {
  base: string
  paths: ReadonlyMap<string, unknown>
  load: (path: string) => Promise<T>
  /** Commit synchronously so focus and scroll see the new content. */
  commit: (path: string, page: T) => void
}

export function installNavigation<T>({ base, paths, load, commit }: NavigationOptions<T>): () => void {
  let current = new URL(window.location.href)
  let request = 0
  const previousRestoration = history.scrollRestoration
  history.scrollRestoration = 'manual'
  const cache = new Map<string, Promise<T>>()
  const get = (path: string) => {
    let pending = cache.get(path)
    if (!pending) {
      pending = load(path).catch((error) => { cache.delete(path); throw error })
      cache.set(path, pending)
    }
    return pending
  }
  const newKey = () => `${Date.now()}-${Math.random()}`
  let entryKey: string = history.state?.novonKey ?? newKey()
  const positions = new Map<string, Position>()
  // Scroll events update memory, not history: replaceState on every frame hits
  // browser rate limits on long articles (notably Safari).
  const trackScroll = () => { positions.set(entryKey, { x: window.scrollX, y: window.scrollY }) }
  const saveScroll = () => {
    trackScroll()
    history.replaceState({ ...history.state, novonKey: entryKey, novonScroll: positions.get(entryKey) }, '')
  }
  const push = (url: URL) => {
    saveScroll()
    entryKey = newKey()
    history.pushState({ novonKey: entryKey }, '', url)
  }
  saveScroll()
  window.addEventListener('scroll', trackScroll, { passive: true })

  const scroll = (url: URL, position?: Position) => {
    let target: HTMLElement | null = null
    try { target = document.getElementById(decodeURIComponent(url.hash.slice(1))) } catch { /* malformed fragment */ }
    const main = document.getElementById('novon-content')
    if (target && !target.hasAttribute('tabindex')) target.tabIndex = -1
    const focusTarget = target ?? main
    focusTarget?.focus({ preventScroll: true })
    if (position) window.scrollTo({ left: position.x, top: position.y, behavior: 'instant' })
    else if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' })
    else window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }

  const go = async (url: URL, pop = false, position?: Position) => {
    const path = routeForUrl(url, current, base, paths)
    if (path === undefined) { window.location.assign(url.href); return }
    const id = ++request
    // Keep ordinary same-page fragments native, including history entries.
    if (url.pathname === current.pathname && url.search === current.search) {
      if (!pop && url.href !== current.href) push(url)
      current = url
      scroll(url, position)
      window.dispatchEvent(new HashChangeEvent('hashchange'))
      document.documentElement.removeAttribute('data-navigating')
      return
    }
    document.documentElement.dataset.navigating = 'true'
    try {
      const page = await get(path)
      if (id !== request) return
      if (!pop) push(url)
      current = url
      commit(path, page)
      scroll(url, position)
      window.dispatchEvent(new CustomEvent('novon:navigated'))
    } catch {
      // A stale deployment chunk or failed connection must never strand a link.
      if (id === request) window.location.assign(url.href)
    } finally {
      if (id === request) document.documentElement.removeAttribute('data-navigating')
    }
  }

  const anchorOf = (event: Event) => event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null
  const eligible = (anchor: HTMLAnchorElement) => !anchor.hasAttribute('download') && (!anchor.target || anchor.target === '_self') && !anchor.closest('[data-no-router]') && !anchor.relList.contains('external')
  const onClick = (event: MouseEvent) => {
    if (!isPlainClick(event)) return
    const anchor = anchorOf(event)
    if (!anchor || !eligible(anchor)) return
    const url = new URL(anchor.href)
    if (routeForUrl(url, current, base, paths) === undefined) return
    if (url.pathname === current.pathname && url.search === current.search && url.hash) {
      // Cancel an earlier page load when the reader chooses a local heading.
      request++
      document.documentElement.removeAttribute('data-navigating')
      return
    }
    event.preventDefault()
    void go(url)
  }
  const onPrefetch = (event: Event) => {
    const anchor = anchorOf(event)
    if (!anchor || !eligible(anchor)) return
    const path = routeForUrl(new URL(anchor.href), current, base, paths)
    if (path !== undefined) void get(path).catch(() => {})
  }
  const onPop = (event: PopStateEvent) => {
    entryKey = event.state?.novonKey ?? newKey()
    const position = positions.get(entryKey) ?? event.state?.novonScroll
    history.replaceState({ ...event.state, novonKey: entryKey }, '')
    void go(new URL(window.location.href), true, position)
  }
  const onHash = () => { current = new URL(window.location.href) }
  const onNavigate = (event: Event) => {
    const url = new URL((event as CustomEvent<string>).detail, window.location.href)
    if (routeForUrl(url, current, base, paths) === undefined) return
    event.preventDefault()
    void go(url)
  }
  document.addEventListener('click', onClick)
  document.addEventListener('pointerover', onPrefetch)
  document.addEventListener('focusin', onPrefetch)
  window.addEventListener('popstate', onPop)
  window.addEventListener('hashchange', onHash)
  window.addEventListener('novon:navigate', onNavigate)
  return () => {
    request++
    history.scrollRestoration = previousRestoration
    document.removeEventListener('click', onClick)
    document.removeEventListener('pointerover', onPrefetch)
    document.removeEventListener('focusin', onPrefetch)
    window.removeEventListener('scroll', trackScroll)
    window.removeEventListener('popstate', onPop)
    window.removeEventListener('hashchange', onHash)
    window.removeEventListener('novon:navigate', onNavigate)
  }
}

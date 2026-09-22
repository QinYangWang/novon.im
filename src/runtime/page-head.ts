import type { Route, RuntimeConfig } from '../types.ts'
import { absoluteUrl } from '../url.ts'
import { titleOf } from './routes.ts'
import { withBase } from './lib.ts'

/** Update only novon's page metadata; leave plugin/style/script nodes intact. */
export function updatePageHead(config: RuntimeConfig, route: Route): void {
  const title = titleOf(route)
  const fullTitle = title === config.title ? title : `${title} · ${config.title}`
  document.title = fullTitle
  const description = route.meta.description ?? (route.isIndex ? config.description : undefined)
  const image = typeof route.meta.image === 'string' ? route.meta.image : config.theme.ogImage
  const setMeta = (attribute: 'name' | 'property', key: string, value?: string) => {
    let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
    if (!value) { element?.remove(); return }
    if (!element) {
      element = document.createElement('meta')
      element.setAttribute(attribute, key)
      document.head.append(element)
    }
    element.content = value
  }
  setMeta('name', 'description', description)
  setMeta('property', 'og:title', fullTitle)
  setMeta('property', 'og:description', description)
  setMeta('property', 'og:type', route.meta.date ? 'article' : 'website')
  setMeta('property', 'og:image', image ? withBase(config.base, image) : undefined)
  if (config.url) {
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical) }
    canonical.href = absoluteUrl(config, route.path)
  }
}

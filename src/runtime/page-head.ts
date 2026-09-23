import { layerForPath } from '../layers.ts'
import type { Route, RuntimeConfig } from '../types.ts'
import { absoluteUrl } from '../url.ts'
import { titleOf } from './routes.ts'
import { socialMeta } from '../social.ts'

/** Update only novon's page metadata; leave plugin/style/script nodes intact. */
export function updatePageHead(config: RuntimeConfig, route: Route, options: { absolute?: boolean } = {}): void {
  // Dev uses base-relative URLs so `og:image` opens against the dev server; the
  // static build and client navigation keep the configured public URL.
  const urls = options.absolute === false ? { ...config, url: undefined } : config
  const title = titleOf(route)
  const fullTitle = title === config.title ? title : `${title} · ${config.title}`
  document.title = fullTitle
  document.documentElement.dataset.layout = route.layout ?? layerForPath(config, route.path).layout
  const description = route.meta.description ?? (route.isIndex ? config.description : undefined)
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
  for (const tag of socialMeta(urls, {
    path: route.path,
    title,
    description,
    ogImage: route.meta.ogImage ?? route.meta.image,
    ogType: route.meta.date ? 'article' : 'website',
  })) setMeta(tag.attribute, tag.key, tag.content)
  if (urls.url) {
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical) }
    canonical.href = absoluteUrl(urls, route.path)
  }
}

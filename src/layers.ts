/** Browser-safe layout resolution, shared by routing, SSR and development. */
import type { LayoutConfig, LayoutKind, LayoutLayer } from './types.ts'

export function defaultLayout(config: LayoutConfig): LayoutKind {
  return config.layout ?? config.template ?? 'docs'
}

export function normalizeLayerPath(path: string): string {
  return `/${path.replace(/^\/+|\/+$/g, '')}`
}

export function layoutLayers(config: LayoutConfig): LayoutLayer[] {
  const layers = (config.layers ?? []).map((layer) => ({ ...layer, path: normalizeLayerPath(layer.path) }))
  if (!layers.some((layer) => layer.path === '/')) layers.unshift({ path: '/', layout: defaultLayout(config) })
  return layers
}

/** Prefixes match complete segments: /docs never matches /docsmith. */
export function layerForPath(config: LayoutConfig, path: string): LayoutLayer {
  return layoutLayers(config)
    .filter((layer) => layer.path === '/' || path === layer.path || path.startsWith(`${layer.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0]!
}

export function blogIndexPath(layer: string, config?: LayoutConfig): string {
  if (layer !== '/') return layer
  // An explicitly mounted layer may own the legacy /blog alias.
  return config && layerForPath(config, '/blog').path !== '/' ? '/' : '/blog'
}

export function blogTagsPath(layer: string): string {
  return layer === '/' ? '/tags' : `${layer}/tags`
}

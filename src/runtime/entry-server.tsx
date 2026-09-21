/**
 * Server entry used by `novon build`.
 *
 * The prerenderer asks this bundle for the route table and then for the HTML of
 * each route, so the content model only ever has one implementation.
 */
import { renderToString } from 'react-dom/server'
import { App } from './app.tsx'
import { createSiteIndex, loadPage, titleOf, type PageModule, type SiteIndex } from './content.ts'
import type { Route } from '../types.ts'
import config from 'virtual:novon/config'

const site: SiteIndex = createSiteIndex(config)

export function getRoutes(): Route[] {
  return site.routes
}

export interface RenderResult {
  html: string
  title: string
  description?: string
  headings: { depth: number; text: string; id: string }[]
  frontmatter: Record<string, unknown>
  excerpt: string
}

export async function render(url: string): Promise<RenderResult> {
  const route = site.byPath.get(url)
  const page: PageModule | undefined = route?.file ? await loadPage(route.file) : undefined

  const html = renderToString(<App config={config} url={url} site={site} page={page} />)
  const title = route ? titleOf(route) : 'Not found'

  return {
    html,
    title,
    description: typeof route?.meta.description === 'string' ? route.meta.description : undefined,
    headings: page?.headings ?? [],
    frontmatter: { ...route?.meta },
    excerpt: toText(html).slice(0, 240),
  }
}

function toText(html: string): string {
  return html
    .replace(/<(script|style|pre|figure)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

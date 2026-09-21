/**
 * Plugins shipped with novon. Enable them by name in `novon.config.ts`:
 *
 * ```ts
 * export default { title: 'My Site', plugins: ['sitemap', 'rss', 'search'] }
 * ```
 */
import type { BuiltPage, BuildContext, NovonPlugin } from './api.ts'
import { absoluteUrl } from '../url.ts'

/** Absolute URL for a route, or a root-relative one when `url` is not configured. */
function absolute(ctx: BuildContext, path: string): string {
  return absoluteUrl(ctx.config, path)
}

function escapeXml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Blog-like pages: anything carrying a date, or living under /blog. */
function posts(pages: BuiltPage[]): BuiltPage[] {
  return pages
    .filter((page) => page.frontmatter.sidebar !== false)
    .filter((page) => Boolean(page.frontmatter.date) || page.route.path.startsWith('/blog'))
    .sort((a, b) => String(b.frontmatter.date ?? '').localeCompare(String(a.frontmatter.date ?? '')))
}

/** Strip tags and collapse whitespace so the page can feed a search index. */
function toText(html: string): string {
  return html
    .replace(/<(script|style|pre|figure)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export const sitemap: NovonPlugin = {
  name: 'sitemap',
  postBuild(ctx) {
    const urls = ctx.pages
      .filter((page) => page.frontmatter.draft !== true)
      .map((page) => {
        const lastmod = page.frontmatter.date ? `\n    <lastmod>${escapeXml(page.frontmatter.date)}</lastmod>` : ''
        return `  <url>\n    <loc>${escapeXml(absolute(ctx, page.route.path))}</loc>${lastmod}\n  </url>`
      })
    ctx.write(
      'sitemap.xml',
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
    )
    ctx.log(`sitemap: ${urls.length} urls`)
  },
}

export const rss: NovonPlugin = {
  name: 'rss',
  postBuild(ctx) {
    const list = posts(ctx.pages).slice(0, 30)
    if (list.length === 0) {
      ctx.log('rss: skipped, no dated pages found')
      return
    }
    const items = list
      .map((page) => {
        const link = escapeXml(absolute(ctx, page.route.path))
        const date = page.frontmatter.date ? new Date(String(page.frontmatter.date)) : undefined
        const pub = date && !Number.isNaN(date.getTime()) ? `\n      <pubDate>${date.toUTCString()}</pubDate>` : ''
        return [
          '    <item>',
          `      <title>${escapeXml(page.title)}</title>`,
          `      <link>${link}</link>`,
          `      <guid isPermaLink="true">${link}</guid>`,
          page.description ? `      <description>${escapeXml(page.description)}</description>` : '',
          pub,
          '    </item>',
        ]
          .filter(Boolean)
          .join('\n')
      })
      .join('\n')

    ctx.write(
      'rss.xml',
      `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n    <title>${escapeXml(ctx.config.title)}</title>\n    <link>${escapeXml(absolute(ctx, '/'))}</link>\n    <description>${escapeXml(ctx.config.description ?? ctx.config.title)}</description>\n    <atom:link href="${escapeXml(absolute(ctx, '/rss.xml'))}" rel="self" type="application/rss+xml" />\n${items}\n  </channel>\n</rss>\n`,
    )
    ctx.log(`rss: ${list.length} items`)
  },
}

export const search: NovonPlugin = {
  name: 'search',
  postBuild(ctx) {
    const index = ctx.pages
      .filter((page) => page.frontmatter.draft !== true)
      .map((page) => ({
        title: page.title,
        path: page.route.path,
        description: page.description ?? '',
        headings: page.headings.map((h) => h.text),
        text: toText(page.html).slice(0, 2000),
      }))
    ctx.write('search-index.json', JSON.stringify(index))
    ctx.log(`search: indexed ${index.length} pages`)
  },
}

export const llms: NovonPlugin = {
  name: 'llms',
  postBuild(ctx) {
    const lines = ctx.pages
      .filter((page) => page.frontmatter.draft !== true)
      .map((page) => {
        const url = absolute(ctx, page.route.path)
        return `- [${page.title}](${url})${page.description ? `: ${page.description}` : ''}`
      })
    ctx.write(
      'llms.txt',
      `# ${ctx.config.title}\n\n> ${ctx.config.description ?? ctx.config.title}\n\n## Pages\n\n${lines.join('\n')}\n`,
    )
    ctx.log(`llms: ${lines.length} pages`)
  },
}

export const builtinPlugins: Record<string, NovonPlugin> = { sitemap, rss, search, llms }

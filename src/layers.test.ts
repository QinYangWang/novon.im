import { describe, expect, test } from 'bun:test'
import { resolveConfig } from './config.ts'
import { blogIndexPath, layerForPath } from './layers.ts'
import { runtimeConfig } from './vite-config.ts'
import { renderDocument } from './document.ts'
import { createSiteIndex, flattenNav, siteForRoute, type ContentIndex } from './runtime/routes.ts'
import type { Frontmatter, LayoutConfig, NovonConfig } from './types.ts'
import { rss } from './plugins/builtin.ts'
import type { BuildContext, BuiltPage } from './plugins/api.ts'

function content(pages: Record<string, Frontmatter>): ContentIndex {
  return { files: Object.keys(pages), meta: pages }
}

const config: LayoutConfig = {
  layout: 'docs',
  layers: [{ path: '/blog', layout: 'blog' }, { path: '/blog/reference', layout: 'docs' }, { path: '/notes', layout: 'blog' }],
}
const index = content({
  '/content/guide.mdx': { title: 'Guide', date: '2026-01-03', tags: ['docs-only'] },
  '/content/blog/older.mdx': { title: 'Older', date: '2026-01-01', tags: ['shared'] },
  '/content/blog/newer.mdx': { title: 'Newer', date: '2026-02-01', tags: ['shared'] },
  '/content/blog/draft.mdx': { title: 'Draft', draft: true, tags: ['draft'] },
  '/content/blog/about.mdx': { title: 'About', sidebar: false, tags: ['hidden'] },
  '/content/blog/reference/api.mdx': { title: 'API', date: '2026-03-01', tags: ['docs-only'] },
  '/content/notes/one.mdx': { title: 'Note', tags: ['shared'] },
  '/content/elsewhere.mdx': { title: 'Slugged post', slug: '/notes/slugged', tags: ['slug'] },
})

describe('layout configuration', () => {
  test('defaults, legacy alias and explicit layout precedence', () => {
    expect(resolveConfig('/site', { title: 'Site' }).layout).toBe('docs')
    expect(resolveConfig('/site', { title: 'Site', template: 'blog' }).layout).toBe('blog')
    expect(resolveConfig('/site', { title: 'Site', template: 'blog', layout: 'docs' }).layout).toBe('docs')
    const resolved = resolveConfig('/site', { title: 'Site', layers: [{ path: '/journal/', layout: 'blog' }] })
    expect(runtimeConfig(resolved).layers).toEqual([{ path: '/journal', layout: 'blog' }])
  })

  test('rejects invalid kinds, paths and duplicate mounts', () => {
    for (const invalid of [
      { layout: 'other' }, { layers: {} }, { layers: [null] },
      { layers: [{ path: '/x', layout: 'other' }] },
      ...['x', '/x?y', '/x#y', '/x/../y', '/x//y', '/x\\y'].map(path => ({ layers: [{ path, layout: 'blog' }] })),
      { layers: [{ path: '/x/', layout: 'blog' }, { path: '/x', layout: 'docs' }] },
    ]) {
      expect(() => resolveConfig('/site', { title: 'Site', ...invalid } as NovonConfig)).toThrow()
    }
  })

  test('longest whole-segment prefix wins, independent of array order', () => {
    expect(layerForPath(config, '/blog/a')).toEqual({ path: '/blog', layout: 'blog' })
    expect(layerForPath(config, '/blog/reference/api').layout).toBe('docs')
    expect(layerForPath(config, '/blogger').path).toBe('/')
    expect(layerForPath({ layout: 'docs', layers: [{ path: '/', layout: 'blog' }] }, '/').layout).toBe('blog')
  })
})

describe('mixed site layers', () => {
  test('scopes docs navigation, blog posts, tags and generated roots', () => {
    const site = createSiteIndex(config, index)
    expect(site.byPath.get('/')?.file).toBe('/content/guide.mdx')
    expect(site.byPath.get('/blog')?.file).toBe('')
    expect(site.byPath.get('/blog/reference')?.file).toBe('/content/blog/reference/api.mdx')
    const blog = siteForRoute(site, site.byPath.get('/blog'))
    expect(blog.posts.map(post => post.path)).toEqual(['/blog/newer', '/blog/older'])
    expect(blog.tags).toEqual([{ tag: 'shared', count: 2 }])
    expect(blog.nav).toEqual([])
    const docs = siteForRoute(site, site.byPath.get('/'))
    expect(flattenNav(docs.nav).map(page => page.path)).toEqual(['/guide'])
    expect(docs.posts).toEqual([])
    expect(site.byPath.get('/blog/tags/shared')?.layer).toBe('/blog')
    expect(site.byPath.get('/notes/tags/shared')?.layer).toBe('/notes')
    expect(site.byPath.has('/tags/shared')).toBe(false)
    expect(site.byPath.has('/blog/tags/hidden')).toBe(false)
    expect(site.byPath.has('/blog/tags/docs-only')).toBe(false)
    expect(blog.byPath).toBe(site.byPath) // global routing and search are shared
  })

  test('slugs determine ownership; drafts appear only in dev', () => {
    const site = createSiteIndex(config, index)
    expect(site.byPath.get('/notes/slugged')?.layout).toBe('blog')
    expect(site.byPath.has('/blog/draft')).toBe(false)
    expect(createSiteIndex(config, index, true).byPath.has('/blog/tags/draft')).toBe(true)
  })

  test('real indexes and tag pages win over synthetic routes', () => {
    const site = createSiteIndex(config, content({
      ...index.meta,
      '/content/blog/index.mdx': { title: 'Custom blog home' },
      '/content/blog/tags/shared.mdx': { title: 'Custom tag', sidebar: false },
    }))
    expect(site.byPath.get('/blog')?.synthetic).toBeUndefined()
    expect(site.byPath.get('/blog/tags/shared')?.tag).toBeUndefined()
    expect(new Set(site.routes.map(route => route.path)).size).toBe(site.routes.length)
  })

  test('preserves legacy root blog URLs without collecting docs', () => {
    const site = createSiteIndex({ template: 'blog', layers: [{ path: '/docs', layout: 'docs' }] }, content({
      '/content/post.mdx': { tags: ['topic'] }, '/content/docs/start.mdx': { tags: ['docs'] },
    }))
    expect(site.byPath.get('/')?.file).toBe('')
    expect(site.byPath.get('/blog')?.postList).toBe(true)
    expect(site.byPath.get('/tags/topic')?.layout).toBe('blog')
    expect(site.posts.map(post => post.path)).toEqual(['/post'])
    expect(site.byPath.has('/tags/docs')).toBe(false)
  })

  test('does not generate routes inside another layer', () => {
    const site = createSiteIndex({ layout: 'blog', layers: [{ path: '/blog', layout: 'docs' }, { path: '/tags', layout: 'docs' }] }, content({
      '/content/post.mdx': { tags: ['topic'] },
    }))
    expect(site.byPath.get('/blog')?.layout).toBe('docs')
    expect(site.byPath.has('/tags/topic')).toBe(false)
    expect(siteForRoute(site, site.byPath.get('/')).tags).toEqual([])
    expect(blogIndexPath('/', { layers: [{ path: '/blog', layout: 'docs' }] })).toBe('/')
  })

  test('SSR metadata resolves layout with a deployment base', () => {
    const runtime = runtimeConfig(resolveConfig('/site', { title: 'Mixed', base: '/repo/', ...config }))
    const html = renderDocument({ config: runtime, path: '/blog/newer', title: 'Newer', body: '' })
    expect(html).toContain('data-layout="blog"')
    expect(renderDocument({ config: runtime, path: '/guide', title: 'Guide', body: '' })).toContain('data-layout="docs"')
  })

  test('RSS includes real blog posts only, across all blog layers', async () => {
    const site = createSiteIndex(config, index)
    const output = new Map<string, string>()
    await rss.postBuild!({
      config: resolveConfig('/site', { title: 'Mixed', ...config }), base: '/',
      root: '/site', outDir: '/site/dist', packageRoot: '/novon',
      pages: site.routes.map(route => ({ route, title: route.meta.title ?? route.path, frontmatter: route.meta }) as BuiltPage),
      write: (file: string, text: string) => output.set(file, text), log: () => {},
    } as BuildContext)
    const feed = output.get('rss.xml')!
    expect(feed).toContain('/blog/newer')
    expect(feed).toContain('/notes/slugged')
    expect(feed).not.toContain('/guide')
    expect(feed).not.toContain('/blog/reference')
    expect(feed).not.toContain('/blog/tags')
    expect(feed).not.toContain('/blog/about')
  })
})

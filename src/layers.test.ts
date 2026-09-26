import { expect, test } from 'bun:test'
import { blogIndexPath, layerForPath } from './layers.ts'
import { createSiteIndex, siteForRoute, type ContentIndex } from './runtime/routes.ts'
import type { Frontmatter, LayoutConfig } from './types.ts'

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

test('longest whole-segment prefix wins, independent of array order', () => {
  expect(layerForPath(config, '/blog/a')).toEqual({ path: '/blog', layout: 'blog' })
  expect(layerForPath(config, '/blog/reference/api').layout).toBe('docs')
  expect(layerForPath(config, '/blogger').path).toBe('/')
  expect(layerForPath({ layout: 'docs', layers: [{ path: '/', layout: 'blog' }] }, '/').layout).toBe('blog')
})

test('slugs determine ownership; drafts appear only in dev', () => {
  const site = createSiteIndex(config, index)
  expect(site.byPath.get('/notes/slugged')?.layout).toBe('blog')
  expect(site.byPath.has('/blog/draft')).toBe(false)
  expect(createSiteIndex(config, index, true).byPath.has('/blog/tags/draft')).toBe(true)
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

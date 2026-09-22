import { describe, expect, test } from 'bun:test'
import { isPlainClick, routeForUrl } from './navigation.ts'
import { createSiteIndex, flattenNav } from './routes.ts'

const current = new URL('https://example.com/notes/guide')
const paths = new Map([['/', {}], ['/guide', {}], ['/blog', {}], ['/tags/react', {}]])
const route = (href: string) => routeForUrl(new URL(href, current), current, '/notes/', paths)

describe('static route navigation', () => {
  test('accepts known routes, query strings, fragments and static aliases', () => {
    expect(route('/notes/blog?view=all#posts')).toBe('/blog')
    expect(route('/notes/blog/')).toBe('/blog')
    expect(route('/notes/blog/index.html')).toBe('/blog')
    expect(route('/notes')).toBe('/')
    expect(route('/notes/tags/react')).toBe('/tags/react')
  })
  test('does not capture assets, unknown routes, external URLs or sibling deployments', () => {
    for (const href of ['/notes/guide.md', '/notes/image.svg', '/notes/unknown', '/blog', '/notes-other/blog', 'https://elsewhere.test/notes/blog', 'mailto:a@example.com']) {
      expect(route(href)).toBeUndefined()
    }
  })
  test('resolves encoded Unicode paths and tolerates malformed encoding', () => {
    const international = new Map([['/笔记', {}]])
    expect(routeForUrl(new URL('https://example.com/notes/%E7%AC%94%E8%AE%B0'), current, '/notes/', international)).toBe('/笔记')
    expect(route('/notes/%ZZ')).toBeUndefined()
  })
  test('accepts root deployments', () => {
    expect(routeForUrl(new URL('https://example.com/blog'), current, '/', paths)).toBe('/blog')
  })
  test('keeps modified and handled clicks native', () => {
    const click = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, defaultPrevented: false }
    expect(isPlainClick(click)).toBe(true)
    for (const key of ['metaKey', 'ctrlKey', 'shiftKey', 'altKey', 'defaultPrevented']) {
      expect(isPlainClick({ ...click, [key]: true })).toBe(false)
    }
    expect(isPlainClick({ ...click, button: 1 })).toBe(false)
    expect(isPlainClick({ ...click, button: 2 })).toBe(false)
  })
})

test('previous/next includes each section overview exactly once', () => {
  const site = createSiteIndex({ template: 'docs' }, {
    files: ['/content/index.mdx', '/content/guide/index.mdx', '/content/guide/setup.mdx'],
    meta: {},
  })
  expect(flattenNav(site.nav).map((link) => link.path)).toEqual(['/', '/guide', '/guide/setup'])
})

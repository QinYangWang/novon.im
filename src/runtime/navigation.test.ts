import { expect, test } from 'bun:test'
import { isPlainClick, routeForUrl } from './navigation.ts'

const current = new URL('https://example.com/notes/guide')
const paths = new Map([['/', {}], ['/guide', {}], ['/blog', {}], ['/tags/react', {}]])
const route = (href: string) => routeForUrl(new URL(href, current), current, '/notes/', paths)

test('does not capture assets, unknown routes, external URLs or sibling deployments', () => {
  for (const href of ['/notes/guide.md', '/notes/image.svg', '/notes/unknown', '/blog', '/notes-other/blog', 'https://elsewhere.test/notes/blog', 'mailto:a@example.com']) {
    expect(route(href)).toBeUndefined()
  }
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

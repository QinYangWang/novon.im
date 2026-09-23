import { expect, test } from 'bun:test'
import { renderOgImage } from './render.ts'

test('OG renderer emits deterministic 1200×630 PNGs from page content', async () => {
  const card = { site: 'Example', title: 'A guide', path: '/guide', layout: 'docs' as const }
  const a = Buffer.from(await renderOgImage(card))
  expect(a.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
  expect(a.readUInt32BE(16)).toBe(1200)
  expect(a.readUInt32BE(20)).toBe(630)
  expect(Buffer.from(await renderOgImage(card)).equals(a)).toBe(true)
  expect(Buffer.from(await renderOgImage({ ...card, title: 'Another guide' })).equals(a)).toBe(false)
})

test('long text and XML characters render safely without a remote font', async () => {
  const png = await renderOgImage({
    site: 'Example <&> "site"', title: 'A'.repeat(4000), description: 'Details '.repeat(400),
    path: '/a/very/long/path/' + 'segment/'.repeat(40), layout: 'blog', author: 'An author',
  })
  expect(png.length).toBeGreaterThan(1000)
})

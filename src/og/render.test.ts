import { expect, test } from 'bun:test'
import { renderOgImage } from './render.ts'

test('long text and XML characters render safely without a remote font', async () => {
  const png = await renderOgImage({
    site: 'Example <&> "site"', title: 'A'.repeat(4000), description: 'Details '.repeat(400),
    path: '/a/very/long/path/' + 'segment/'.repeat(40), layout: 'blog', author: 'An author',
  })
  expect(png.length).toBeGreaterThan(1000)
})

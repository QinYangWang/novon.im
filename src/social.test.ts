import { describe, expect, test } from 'bun:test'
import { resolveConfig } from './config.ts'
import { runtimeConfig } from './vite-config.ts'
import { renderDocument } from './document.ts'
import { ogImagePath, resolveOgImage, socialMeta } from './social.ts'

const config = runtimeConfig(resolveConfig('/tmp/site', {
  title: 'Example & notes', url: 'https://example.com/repo', base: '/repo/',
}))

describe('social metadata', () => {
  test('generates default PNG metadata with one base prefix and Twitter cards', () => {
    const image = resolveOgImage(config, '/guide')!
    expect(image.url).toBe(`https://example.com/repo${ogImagePath('/guide')}`)
    expect(image.generated).toBe(true)
    const tags = new Map(socialMeta(config, { path: '/guide', title: 'Guide' }).map(tag => [tag.key, tag.content]))
    expect(tags.get('og:image:width')).toBe('1200')
    expect(tags.get('og:image:height')).toBe('630')
    expect(tags.get('og:image:type')).toBe('image/png')
    expect(tags.get('twitter:card')).toBe('summary_large_image')
    expect(tags.get('twitter:image')).toBe(image.url)
    expect(tags.get('og:url')).toBe('https://example.com/repo/guide')
  })
  test('explicit images win; external URLs are never prefixed', () => {
    const custom = { ...config, theme: { ...config.theme, ogImage: '/default.png' } }
    expect(resolveOgImage(custom, '/guide')?.url).toBe('https://example.com/repo/default.png')
    expect(resolveOgImage(custom, '/guide', '/cover.png')?.url).toBe('https://example.com/repo/cover.png')
    expect(resolveOgImage(custom, '/guide', '/repo/cover.png')?.url).toBe('https://example.com/repo/cover.png')
    expect(resolveOgImage(custom, '/guide', 'https://cdn.test/cover.jpg')?.url).toBe('https://cdn.test/cover.jpg')
    expect(resolveOgImage(custom, '/guide', '//cdn.test/cover.jpg')?.url).toBe('https://cdn.test/cover.jpg')
    expect(resolveOgImage(custom, '/guide')?.generated).toBe(false)
  })
  test('opt-out omits generated images but does not suppress explicit ones', () => {
    const disabled = { ...config, theme: { ...config.theme, generateOgImages: false } }
    expect(resolveOgImage(disabled, '/guide')).toBeUndefined()
    expect(resolveOgImage(disabled, '/guide', '/cover.png')?.generated).toBe(false)
    expect(resolveOgImage(config)).toBeUndefined() // unindexed 404/dev shell
  })
  test('works without a public URL and with nested example deployments', () => {
    expect(resolveOgImage({ ...config, url: undefined }, '/')?.url).toBe(`/repo${ogImagePath('/')}`)
    const nested = { ...config, url: 'https://example.com/repo/examples/docs/', base: '/repo/examples/docs/' }
    expect(resolveOgImage(nested, '/guide')?.url).toBe(`https://example.com/repo/examples/docs${ogImagePath('/guide')}`)
  })
  test('static HTML escapes metadata and exposes the image without JavaScript', () => {
    const html = renderDocument({ config, path: '/guide', title: '<Guide>', description: '"quoted" & useful', body: '' })
    expect(html).toContain('property="og:image" content="https://example.com/repo/_og/')
    expect(html).toContain('property="og:title" content="&lt;Guide&gt; · Example &amp; notes"')
    expect(html).toContain('name="twitter:description" content="&quot;quoted&quot; &amp; useful"')
  })
  test('paths are deterministic, distinct, safe and support long Unicode slugs', () => {
    const paths = ['/', '/index', '/a/b', '/a-b', '/笔记', '/../escape', '/' + 'x'.repeat(400)]
    expect(new Set(paths.map(ogImagePath)).size).toBe(paths.length)
    for (const path of paths) {
      const image = ogImagePath(path)
      expect(image).toMatch(/^\/_og\/[0-9a-f/]+\.png$/)
      expect(image.split('/').every(segment => segment.length < 255)).toBe(true)
      expect(ogImagePath(path)).toBe(image)
    }
  })
})

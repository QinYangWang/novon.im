import { describe, expect, test } from 'bun:test'
import { withBaseSrc } from './lib.ts'

describe('withBaseSrc', () => {
  test('prefixes site-relative sources for a subdirectory deploy', () => {
    expect(withBaseSrc('/repo/', '/examples/docs-template/')).toBe('/repo/examples/docs-template/')
    expect(withBaseSrc('/', '/cover.svg')).toBe('/cover.svg')
  })

  test('leaves external, protocol-relative, data and relative sources alone', () => {
    for (const src of ['https://example.com/a.png', '//cdn.test/a.png', 'data:image/svg+xml,<svg/>', 'images/a.png', '#anchor', undefined]) {
      expect(withBaseSrc('/repo/', src)).toBe(src)
    }
  })
})

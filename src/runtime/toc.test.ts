import { describe, expect, test } from 'bun:test'
import {
  type ActiveHeadingInput,
  type HeadingOffset,
  TOC_READING_OFFSET,
  closingReadingOffset,
  hashToId,
  resolveActiveHeading,
} from './toc.ts'

const offsets = (...tops: [string, number][]): HeadingOffset[] =>
  tops.map(([id, top]) => ({ id, top }))

const view = (over: Partial<ActiveHeadingInput> = {}): ActiveHeadingInput => ({
  scrollY: 0,
  ...over,
})

describe('hashToId', () => {
  test('strips the leading # and decodes', () => {
    expect(hashToId('#usage')).toBe('usage')
    expect(hashToId('#caf%C3%A9')).toBe('café')
  })

  test('returns empty for no or malformed hash', () => {
    expect(hashToId('')).toBe('')
    expect(hashToId('#')).toBe('')
    expect(hashToId('#%E0%A4%A')).toBe('')
  })
})

describe('resolveActiveHeading', () => {
  const headings = offsets(['intro', 300], ['usage', 900], ['api', 1500])

  test('selects the latest heading at or above the reading line', () => {
    expect(resolveActiveHeading(headings, view({ scrollY: 0 }))).toBe('intro')
    expect(resolveActiveHeading(headings, view({ scrollY: 900 - TOC_READING_OFFSET }))).toBe('usage')
    expect(resolveActiveHeading(headings, view({ scrollY: 1200 }))).toBe('usage')
    expect(resolveActiveHeading(headings, view({ scrollY: 1600 }))).toBe('api')
  })

  test('is inclusive at the boundary', () => {
    const only = offsets(['a', 500])
    expect(resolveActiveHeading(only, view({ scrollY: 500 - TOC_READING_OFFSET }))).toBe('a')
    expect(resolveActiveHeading(only, view({ scrollY: 500 - TOC_READING_OFFSET - 1 }))).toBe('a')
  })

  test('honours a measured reading offset', () => {
    // A heading that an anchor jump landed on is active at its landing position.
    const landed = offsets(['a', 0], ['b', 96])
    expect(resolveActiveHeading(landed, view({ scrollY: 0, readingOffset: 96 }))).toBe('b')
    expect(resolveActiveHeading(landed, view({ scrollY: 0 }))).toBe('a')
  })

  test('tolerates sub-pixel rounding at the anchor landing position', () => {
    // Scrolling rounds to device pixels, so a heading can land just below the line.
    const landed = offsets(['a', 0], ['b', 80.4])
    expect(resolveActiveHeading(landed, view({ scrollY: 0, readingOffset: 80 }))).toBe('b')
  })

  test('falls back to the first heading for empty input', () => {
    expect(resolveActiveHeading([], view())).toBe('')
  })
})

describe('closingReadingOffset', () => {
  const page = { viewportHeight: 800, maxScroll: 2396, readingOffset: 80 }
  const headings = offsets(['a', 361], ['b', 1820], ['c', 2565], ['d', 2828])
  const activeAt = (scrollY: number) =>
    resolveActiveHeading(headings, {
      scrollY,
      readingOffset: page.readingOffset + closingReadingOffset({ ...page, lastTop: 2828, scrollY }),
    })

  test('does nothing while the last heading can reach the reading line', () => {
    expect(closingReadingOffset({ ...page, lastTop: 1000, scrollY: 500 })).toBe(0)
  })

  test('leaves the reading line alone until the final viewport of scroll', () => {
    const input = { ...page, lastTop: 2828 }
    expect(closingReadingOffset({ ...input, scrollY: page.maxScroll - page.viewportHeight })).toBe(0)
    expect(closingReadingOffset({ ...input, scrollY: page.maxScroll - 500 })).toBeGreaterThan(0)
  })

  test('keeps every heading reachable when a short section closes the page', () => {
    // The heading layout of a page whose last two sections cannot reach the line
    // on their own. The outline must still visit all four, in order.
    const seen: string[] = []
    for (let scrollY = 0; scrollY <= page.maxScroll; scrollY += 4) {
      const id = activeAt(scrollY)
      if (id !== seen[seen.length - 1]) seen.push(id)
    }
    expect(seen).toEqual(['a', 'b', 'c', 'd'])
  })

  test('holds the closing heading for a visible stretch before the bottom', () => {
    // Landing exactly at the bottom lit the last heading for only the final
    // pixel, so stopping a few pixels short showed the previous section.
    const window = page.viewportHeight * 0.4
    expect(activeAt(page.maxScroll)).toBe('d')
    expect(activeAt(page.maxScroll - 1)).toBe('d')
    expect(activeAt(page.maxScroll - window)).toBe('d')
    expect(activeAt(page.maxScroll - window - 1)).not.toBe('d')
  })
})

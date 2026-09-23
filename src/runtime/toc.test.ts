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

  test('does nothing while the last heading can reach the reading line', () => {
    expect(closingReadingOffset({ ...page, lastTop: 1000, scrollY: 500 })).toBe(0)
  })

  test('leaves the reading line alone until the final viewport of scroll', () => {
    const input = { ...page, lastTop: 2828 }
    expect(closingReadingOffset({ ...input, scrollY: page.maxScroll - 800 })).toBe(0)
    expect(closingReadingOffset({ ...input, scrollY: page.maxScroll - 400 })).toBeGreaterThan(0)
  })

  test('lifts the reading line exactly to the last heading at the bottom', () => {
    const extra = closingReadingOffset({ ...page, lastTop: 2828, scrollY: page.maxScroll })
    expect(page.maxScroll + page.readingOffset + extra).toBeCloseTo(2828, 5)
  })

  test('keeps every heading reachable when a short section closes the page', () => {
    // The heading layout of a page whose last two sections cannot reach the line
    // on their own. The outline must still visit all four, in order.
    const headings = offsets(['a', 361], ['b', 1820], ['c', 2565], ['d', 2828])
    const seen: string[] = []
    for (let scrollY = 0; scrollY <= page.maxScroll; scrollY += 4) {
      const extra = closingReadingOffset({ ...page, lastTop: 2828, scrollY })
      const id = resolveActiveHeading(headings, { scrollY, readingOffset: page.readingOffset + extra })
      if (id !== seen[seen.length - 1]) seen.push(id)
    }
    expect(seen).toEqual(['a', 'b', 'c', 'd'])
  })
})

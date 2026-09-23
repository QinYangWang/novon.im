import { describe, expect, test } from 'bun:test'
import {
  type ActiveHeadingInput,
  type HeadingOffset,
  TOC_READING_OFFSET,
  hashToId,
  resolveActiveHeading,
} from './toc.ts'

const offsets = (...tops: [string, number][]): HeadingOffset[] =>
  tops.map(([id, top]) => ({ id, top }))

const view = (over: Partial<ActiveHeadingInput> = {}): ActiveHeadingInput => ({
  scrollY: 0,
  viewportHeight: 800,
  scrollHeight: 4000,
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

  test('keeps the first heading before any heading reaches the line', () => {
    expect(resolveActiveHeading(headings, view({ scrollY: 0 }))).toBe('intro')
  })

  test('selects the last heading at the bottom of a scrollable document', () => {
    // A short final section whose top is far below the reading line.
    const short = offsets(['intro', 0], ['usage', 200], ['tiny', 3990])
    expect(resolveActiveHeading(short, view({ scrollY: 3200, scrollHeight: 4000 }))).toBe('tiny')
  })

  test('does not jump to the last heading on a non-scrollable document', () => {
    const short = offsets(['intro', 0], ['usage', 200], ['tiny', 500])
    expect(
      resolveActiveHeading(short, view({ scrollY: 0, viewportHeight: 800, scrollHeight: 780 })),
    ).toBe('intro')
  })

  test('falls back to the first heading for empty input', () => {
    expect(resolveActiveHeading([], view())).toBe('')
  })
})

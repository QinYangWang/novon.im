/**
 * Active-section logic for the "On this page" table of contents.
 *
 * Kept free of React and the DOM so the selection rules can be unit tested and
 * the component only has to sample measurements. See `toc.test.ts`.
 */

export interface HeadingOffset {
  id: string
  /** Document-space top of the heading element. */
  top: number
}

/**
 * Distance below the viewport top treated as the line being read. Matches the
 * `scroll-margin-top` of headings in the default theme, so a heading that an
 * anchor jump lands on is the one the highlight reports.
 */
export const TOC_READING_OFFSET = 80

/** Decode a `location.hash` into a heading id. Returns `''` for no/invalid hash. */
export function hashToId(hash: string): string {
  if (!hash || hash.length < 2) return ''
  try {
    return decodeURIComponent(hash.slice(1))
  } catch {
    return ''
  }
}

export interface ActiveHeadingInput {
  /** Document-space scroll position. */
  scrollY: number
  /**
   * Distance below the viewport top treated as the reading line. Defaults to
   * `TOC_READING_OFFSET`; the component passes the measured `scroll-margin-top`
   * plus any `closingReadingOffset()` catch-up.
   */
  readingOffset?: number
}

/**
 * Scroll offsets are rounded to device pixels, so a heading can land a fraction
 * of a pixel below its anchor position. Comparing with a hair of tolerance keeps
 * a heading that was just jumped to from reporting the previous section.
 */
const READING_TOLERANCE = 1

/**
 * Extra reading offset that lets the outline reach a short closing section.
 *
 * The last heading can sit below the furthest the reading line normally reaches.
 * Without a catch-up the outline jumps straight to it and skips the sections in
 * between. This returns how far to lift the line at `scrollY`: it ramps in over
 * the final viewport of scrolling and lands exactly on the last heading at the
 * bottom, so every section still gets its turn, in order.
 */
export function closingReadingOffset(input: {
  /** Document-space top of the last heading. */
  lastTop: number
  scrollY: number
  viewportHeight: number
  /** Furthest the document can scroll. */
  maxScroll: number
  /** The normal reading offset (the anchor landing position). */
  readingOffset: number
}): number {
  const { lastTop, scrollY, viewportHeight, maxScroll, readingOffset } = input
  const viewport = Math.max(1, viewportHeight)
  // How far the last heading sits beyond the furthest the line can normally
  // reach. Zero when the last section is long enough to reach it on its own.
  const deficit = lastTop - (maxScroll + readingOffset)
  if (deficit <= 0 || maxScroll <= 0) return 0
  const progress = Math.min(1, Math.max(0, (scrollY - (maxScroll - viewport)) / viewport))
  return deficit * progress
}

/**
 * Pick the active heading for the current scroll position.
 *
 * The active heading is the last one whose top is at or above the reading line,
 * so a section stays active until the next heading reaches it. A document that
 * does not scroll keeps its first heading. Reaching the closing sections on a
 * short page is the caller's job: it feeds `closingReadingOffset()` back in as
 * `readingOffset`, which keeps this rule a single, monotonic comparison.
 */
export function resolveActiveHeading(
  offsets: HeadingOffset[],
  { scrollY, readingOffset = TOC_READING_OFFSET }: ActiveHeadingInput,
): string {
  if (offsets.length === 0) return ''

  const readingLine = scrollY + readingOffset
  let active = offsets[0].id
  for (const offset of offsets) {
    if (offset.top <= readingLine + READING_TOLERANCE) active = offset.id
    else break
  }
  return active
}

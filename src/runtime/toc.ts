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
  /** Viewport height. */
  viewportHeight: number
  /** Full scrollable height of the document. */
  scrollHeight: number
  /**
   * Distance below the viewport top treated as the reading line. Defaults to
   * `TOC_READING_OFFSET`; the component passes the measured `scroll-margin-top`
   * so a themed header stays in sync.
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
 * Pick the active heading for the current scroll position.
 *
 * - The active heading is the last one whose top is at or above the reading
 *   line, so a section stays active until the next heading reaches it.
 * - At the bottom of a genuinely scrollable document the last heading wins,
 *   even when a short final section can never reach the reading line.
 * - A document that does not scroll keeps its first heading.
 */
export function resolveActiveHeading(
  offsets: HeadingOffset[],
  { scrollY, viewportHeight, scrollHeight, readingOffset = TOC_READING_OFFSET }: ActiveHeadingInput,
): string {
  if (offsets.length === 0) return ''

  const scrollable = scrollHeight - viewportHeight > 1
  if (scrollable && scrollY + viewportHeight >= scrollHeight - 1) {
    return offsets[offsets.length - 1].id
  }

  const readingLine = scrollY + readingOffset
  let active = offsets[0].id
  for (const offset of offsets) {
    if (offset.top <= readingLine + READING_TOLERANCE) active = offset.id
    else break
  }
  return active
}

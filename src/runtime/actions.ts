/**
 * Clipboard and Markdown-response helpers for the page actions.
 *
 * `isMarkdownDocument` is pure and unit tested. `copyText` talks to the DOM so
 * the same code path works on `http://` origins, where the async Clipboard API
 * is unavailable.
 */

/**
 * Reject an HTML error page that a dev server may return for a missing
 * Markdown route, or an empty body. Markdown is text, never a document.
 */
export function isMarkdownDocument(text: string, contentType?: string | null): boolean {
  if (contentType && /text\/html/i.test(contentType)) return false
  const head = text.replace(/^\uFEFF/, '').trimStart().slice(0, 200).toLowerCase()
  return head.length > 0 && !head.startsWith('<!doctype html') && !head.startsWith('<html') && !head.startsWith('<head')
}

/** Copy `text`, preferring the async Clipboard API and falling back to a textarea. */
export async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Insecure origins and denied permission fall through to the legacy path.
    }
  }
  return legacyCopy(text)
}

/** `document.execCommand('copy')` via an off-screen textarea; returns whether it worked. */
function legacyCopy(text: string): boolean {
  if (typeof document === 'undefined') return false
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.top = '0'
  area.style.left = '-9999px'
  area.setAttribute('aria-hidden', 'true')
  document.body.appendChild(area)

  const selection = document.getSelection()
  const previous = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null
  let copied = false
  try {
    area.select()
    area.setSelectionRange(0, text.length)
    copied = document.execCommand('copy')
  } catch {
    copied = false
  }
  area.remove()
  if (selection && previous) {
    selection.removeAllRanges()
    selection.addRange(previous)
  }
  return copied
}

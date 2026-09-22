import { describe, expect, test } from 'bun:test'
import { isMarkdownDocument } from './actions.ts'

describe('isMarkdownDocument', () => {
  test('accepts Markdown, including frontmatter', () => {
    expect(isMarkdownDocument('---\ntitle: Hi\n---\n\n# Hi', 'text/markdown; charset=utf-8')).toBe(true)
    expect(isMarkdownDocument('# Hi\n\nBody')).toBe(true)
  })

  test('rejects HTML error pages and empty bodies', () => {
    expect(isMarkdownDocument('<!DOCTYPE html><html>...', 'text/html')).toBe(false)
    expect(isMarkdownDocument('<html><body>404</body></html>')).toBe(false)
    expect(isMarkdownDocument('  <head><title>oops</title>')).toBe(false)
    expect(isMarkdownDocument('', 'text/markdown')).toBe(false)
  })

  test('trusts an HTML content type even for a plain-looking body', () => {
    expect(isMarkdownDocument('Not really markdown', 'text/html; charset=utf-8')).toBe(false)
  })
})

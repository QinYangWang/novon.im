import { afterEach, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import {
  createDevMarkdownResolver,
  type DevMarkdownResolver,
  type DevMarkdownResolverOptions,
} from './dev-markdown.ts'

const roots: string[] = []

function makeSite(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'novon-md-'))
  roots.push(root)
  for (const [relative, contents] of Object.entries(files)) {
    const file = join(root, relative)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, contents)
  }
  return root
}

function resolver(root: string, options: Partial<DevMarkdownResolverOptions> = {}): DevMarkdownResolver {
  return createDevMarkdownResolver({ siteRoot: root, template: 'docs', ...options })
}

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop() as string, { recursive: true, force: true })
})

test('rejects missing, traversal and symlinked sources', () => {
  const root = makeSite({
    'content/page.mdx': 'page\n',
    'outside.md': 'SECRET\n',
  })
  symlinkSync(join(root, 'outside.md'), join(root, 'content', 'leak.mdx'))
  const dev = resolver(root)

  expect(dev.resolve('/nope.md').kind).toBe('not-found')
  expect(dev.resolve('/../outside.md').kind).toBe('not-found')
  expect(dev.resolve('/%2e%2e/outside.md').kind).toBe('not-found')
  // The symlink is indexed as /leak, but resolves outside content/.
  expect(dev.resolve('/leak.md').kind).toBe('not-found')
  expect(dev.resolve('/page.md').kind).toBe('match')
})

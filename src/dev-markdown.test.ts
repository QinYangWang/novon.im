import { afterEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import {
  createDevMarkdownResolver,
  type DevMarkdownMatch,
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

/** The resolved match, failing the test if the path did not resolve. */
function match(dev: DevMarkdownResolver, path: string): DevMarkdownMatch {
  const result = dev.resolve(path)
  if (result.kind !== 'match') throw new Error(`expected a match for ${path}, got ${result.kind}`)
  return result.match
}

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop() as string, { recursive: true, force: true })
})

describe('dev markdown resolver', () => {
  test('serves the original source, frontmatter included', () => {
    const root = makeSite({
      'content/index.mdx': '---\ntitle: Home\n---\n\nHello home\n',
      'content/components/accordion.mdx': '---\ntitle: Accordion\n---\n\nAccordion body\n',
    })
    const dev = resolver(root)

    expect(dev.matches('/components/accordion.md')).toBe(true)
    expect(dev.matches('/components/accordion.mdx')).toBe(false)
    expect(dev.matches('/components/accordion')).toBe(false)

    const resolved = match(dev, '/components/accordion.md')
    expect(resolved.routePath).toBe('/components/accordion')
    expect(resolved.file).toBe('/content/components/accordion.mdx')
    const text = dev.read(resolved)
    expect(text).toContain('title: Accordion')
    expect(text).toContain('Accordion body')
  })

  test('maps index pages, nested pages and the synthetic docs root', () => {
    const root = makeSite({
      'content/getting-started.mdx': 'before index\n',
      'content/guide/index.mdx': 'guide index\n',
      'content/guide/writing.mdx': 'guide writing\n',
    })
    const dev = resolver(root)

    // No content/index.mdx: `/` mirrors the first page, exactly like buildRoutes.
    expect(match(dev, '/index.md').file).toBe('/content/getting-started.mdx')
    expect(match(dev, '/getting-started.md').file).toBe('/content/getting-started.mdx')
    expect(match(dev, '/guide.md').file).toBe('/content/guide/index.mdx')
    expect(match(dev, '/guide/writing.md').file).toBe('/content/guide/writing.mdx')
  })

  test('honours frontmatter slugs for the markdown route', () => {
    const root = makeSite({ 'content/foo.mdx': '---\nslug: custom-url\n---\nbody\n' })
    const dev = resolver(root)

    expect(match(dev, '/custom-url.md').file).toBe('/content/foo.mdx')
    expect(dev.resolve('/foo.md').kind).toBe('not-found')
  })

  test('strips the configured base but also accepts the bare path', () => {
    const root = makeSite({ 'content/components/accordion.mdx': 'body\n' })
    const dev = resolver(root, { base: '/repo/' })

    expect(match(dev, '/repo/components/accordion.md').file).toBe('/content/components/accordion.mdx')
    expect(match(dev, '/components/accordion.md').file).toBe('/content/components/accordion.mdx')
    expect(dev.resolve('/repo/missing.md').kind).toBe('not-found')
  })

  test('decodes percent-encoded non-ASCII route names', () => {
    const root = makeSite({ 'content/café.mdx': 'café body\n' })
    const dev = resolver(root)

    expect(match(dev, '/caf%C3%A9.md').file).toBe('/content/café.mdx')
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

  test('reflects content edits, additions and deletions', () => {
    const root = makeSite({ 'content/page.mdx': '---\ntitle: A\n---\nv1\n' })
    const dev = resolver(root)
    const resolved = match(dev, '/page.md')
    expect(dev.read(resolved)).toContain('v1')

    writeFileSync(join(root, 'content', 'page.mdx'), '---\ntitle: A\n---\nv2\n')
    expect(dev.read(resolved)).toContain('v2')

    writeFileSync(join(root, 'content', 'added.mdx'), '---\ntitle: Added\n---\nnew\n')
    dev.invalidate()
    expect(match(dev, '/added.md').file).toBe('/content/added.mdx')

    rmSync(join(root, 'content', 'added.mdx'))
    dev.invalidate()
    expect(dev.resolve('/added.md').kind).toBe('not-found')
  })

  test('includes drafts in dev but not in a production mapping', () => {
    const root = makeSite({
      'content/page.mdx': 'page\n',
      'content/draft.mdx': '---\ndraft: true\n---\ndraft\n',
    })

    expect(match(resolver(root), '/draft.md').file).toBe('/content/draft.mdx')
    expect(resolver(root, { isDev: false }).resolve('/draft.md').kind).toBe('not-found')
  })

  test('does not fake Markdown for source-less synthetic routes', () => {
    const root = makeSite({ 'content/post.mdx': '---\ntags: [foo]\n---\npost\n' })
    const dev = resolver(root, { template: 'blog' })

    expect(dev.resolve('/index.md').kind).toBe('not-found')
    expect(dev.resolve('/blog.md').kind).toBe('not-found')
    expect(dev.resolve('/tags/foo.md').kind).toBe('not-found')
  })

  test('reports malformed encoding and passes content modules through', () => {
    const root = makeSite({ 'content/plain.md': '# plain\n' })
    const dev = resolver(root)

    expect(dev.resolve('/%E0%A4%A.md').kind).toBe('malformed')
    // `/content/plain.md` is the source Vite compiles, not its `.md` endpoint.
    expect(dev.resolve('/content/plain.md').kind).toBe('module')
    expect(match(dev, '/plain.md').file).toBe('/content/plain.md')
  })
})

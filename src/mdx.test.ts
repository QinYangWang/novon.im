import { describe, expect, test } from 'bun:test'
import { compile } from '@mdx-js/mdx'
import { mdxOptions } from './mdx.ts'

const source = '```ts title="example.ts" showLineNumbers {2}\nconst a = 1\nconst b: string = "hello"\n```'
const render = async (code: string, options = mdxOptions()) => String(await compile(code, options))

describe('build-time syntax highlighting', () => {
  test('MDX JSX highlighting does not depend on a previous TSX fence', async () => {
    const mdx = '```mdx\n<Frame caption="Example"><img src="/image.svg" /></Frame>\n```'
    const before = await render(mdx)
    await render('```tsx\nconst element = <Frame />\n```')
    const after = await render(mdx)
    expect(before).toBe(after)
    expect(before).toContain('children: "Frame"')
  })
  test('emits both themes, filename, line numbers and highlighted lines', async () => {
    const html = await render(source)
    for (const token of ['--shiki-light', '--shiki-dark', 'example.ts', 'data-line-numbers', 'data-highlighted-line', 'github-light github-dark']) {
      expect(html).toContain(token)
    }
  })
  test('unknown and unlabeled fences remain readable; inline code stays inline', async () => {
    const html = await render('```not-a-real-language\n<literal> & text\n```\n\n```\nplain code\n```\n\n`ordinary inline code`')
    expect(html).toContain('<literal> & text')
    expect(html).toContain('plain code')
    expect(html).toContain('ordinary inline code')
  })
  test('supports configurable Shiki themes and default language', async () => {
    const html = await render('```\nconst value = true\n```', mdxOptions({ highlight: {
      theme: { light: 'min-light', dark: 'min-dark' }, defaultLanguage: 'javascript',
    } }))
    expect(html).toContain('min-light min-dark')
    expect(html).toContain('javascript')
    expect(html).toContain('--shiki-dark')
  })
  test('highlighting can be disabled without removing code', async () => {
    const html = await render(source, mdxOptions({ highlight: false }))
    expect(html).not.toContain('data-rehype-pretty-code-figure')
    expect(html).not.toContain('--shiki')
    expect(html).toContain('const a = 1')
  })
})

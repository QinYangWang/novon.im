import { expect, test } from 'bun:test'
import { compile } from '@mdx-js/mdx'
import { mdxOptions } from './mdx.ts'

const render = async (code: string, options = mdxOptions()) => String(await compile(code, options))

const page = [
  '![A diagram](/images/diagram.png)',
  '',
  '<Frame caption="Embedded">',
  '  <iframe src="/examples/docs-template/" title="Example" loading="lazy" />',
  '  <img src="/screenshot.svg" alt="A screenshot" />',
  '  <video src="/clip.mp4" poster="/clip.png" />',
  '</Frame>',
].join('\n')

test('prefixes markdown images and explicit JSX media for a subpath deploy', async () => {
  const html = await render(page, mdxOptions(undefined, '/novon.im/'))
  for (const path of ['/novon.im/images/diagram.png', '/novon.im/examples/docs-template/', '/novon.im/screenshot.svg', '/novon.im/clip.mp4', '/novon.im/clip.png']) {
    expect(html).toContain(path)
  }
  expect(html).not.toContain('src="/examples/docs-template/"')
})

test('leaves external, protocol-relative and relative sources untouched', async () => {
  const html = await render([
    '![Remote](https://cdn.test/a.png)',
    '![Protocol relative](//cdn.test/b.png)',
    '![Relative](images/c.png)',
    '<img src="data:image/svg+xml,<svg/>" alt="Inline" />',
  ].join('\n'), mdxOptions(undefined, '/repo/'))
  for (const path of ['https://cdn.test/a.png', '//cdn.test/b.png', 'images/c.png', 'data:image/svg+xml,<svg/>']) {
    expect(html).toContain(path)
  }
  expect(html).not.toContain('/repo/images/c.png')
})

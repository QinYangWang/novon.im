/**
 * The Markdown/MDX pipeline. Shared by the dev server and the build.
 */
import type { PluggableList } from 'unified'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePrettyCode from 'rehype-pretty-code'
import { getSingletonHighlighter } from 'shiki'
import GithubSlugger from 'github-slugger'
import { valueToEstree } from 'estree-util-value-to-estree'
import { define } from 'unist-util-mdx-define'
import { withBaseSrc } from './runtime/lib.ts'
import type { MdxOptions } from './types.ts'

export interface Heading {
  depth: number
  text: string
  id: string
}

/**
 * Export the page outline as `headings` so the table of contents is identical
 * on the server and in the browser.
 *
 * Slugs come from github-slugger in document order, which is exactly what
 * `rehype-slug` does to the rendered headings, so ids and TOC links always match.
 * Must run before the MDX tree is converted to hast — `mdxjsEsm` nodes cannot be
 * added at the rehype stage.
 */
export function remarkNovonHeadings() {
  return (tree: any, file: any) => {
    const slugger = new GithubSlugger()
    const headings: Heading[] = []

    for (const node of tree.children ?? []) {
      if (node.type !== 'heading') continue
      const depth = Number(node.depth)
      if (depth < 2 || depth > 4) continue
      const text = toPlainText(node)
      if (!text) continue
      headings.push({ depth, text, id: slugger.slug(text) })
    }

    define(tree, file, { headings: valueToEstree(headings) })
  }
}

function toPlainText(node: any): string {
  if (!node) return ''
  if (node.type === 'text' || node.type === 'inlineCode') return String(node.value ?? '')
  const children: any[] = node.children ?? []
  return children.map(toPlainText).join('').trim()
}

export const defaultRemarkPlugins: PluggableList = [
  remarkFrontmatter,
  [remarkMdxFrontmatter, { name: 'frontmatter' }],
  remarkGfm,
]

export const defaultRehypePlugins: PluggableList = [
  rehypeSlug,
  [rehypeAutolinkHeadings, { behavior: 'wrap', properties: { className: 'novon-heading-anchor' } }],
]

/** Elements whose `src` (and `poster`/`data`) must respect the deployment base. */
const MEDIA_TAGS = new Set(['img', 'iframe', 'video', 'audio', 'source', 'track', 'embed', 'object'])
const MEDIA_ATTRIBUTES = new Set(['src', 'poster', 'data'])

function walk(node: any, visit: (node: any) => void): void {
  if (!node || typeof node !== 'object') return
  visit(node)
  for (const child of node.children ?? []) walk(child, visit)
}

/**
 * Prefix site-relative media with the deployment base at compile time.
 *
 * Markdown images and explicit JSX (`<iframe src="/x" />`) are resolved by the
 * browser, not by the runtime `withBase`, so an unprefixed path would resolve
 * outside a subdirectory deploy and show the host's 404 page.
 */
export function remarkNovonBaseSrc(options: { base?: string } = {}) {
  const base = options.base ?? '/'
  return (tree: any) => {
    walk(tree, (node) => {
      if (node.type === 'image') {
        if (typeof node.url === 'string') node.url = withBaseSrc(base, node.url)
        return
      }
      if (node.type !== 'mdxJsxFlowElement' && node.type !== 'mdxJsxTextElement') return
      if (!MEDIA_TAGS.has(node.name)) return
      for (const attribute of node.attributes ?? []) {
        if (attribute?.type !== 'mdxJsxAttribute' || !MEDIA_ATTRIBUTES.has(attribute.name)) continue
        if (typeof attribute.value === 'string') attribute.value = withBaseSrc(base, attribute.value)
      }
    })
  }
}

/** Options passed to `@mdx-js/rollup`. Highlighting stays entirely build-time. */
export function mdxOptions(extra?: MdxOptions, base = '/') {
  const highlight = extra?.highlight
  const highlighting: PluggableList = highlight === false ? [] : [[rehypePrettyCode, {
    theme: highlight?.theme ?? { light: 'github-light', dark: 'github-dark' },
    keepBackground: false,
    // MDX lazily embeds TSX. Load it before any grammar is tokenized so the
    // client and SSR builds cannot depend on which document Vite visits first.
    getHighlighter: (options: Parameters<typeof getSingletonHighlighter>[0]) =>
      getSingletonHighlighter({ ...options, langs: ['tsx', ...(options?.langs ?? [])] }),
    // Leave ordinary inline code alone; explicit `{:ts}` annotations still work.
    defaultLang: { block: highlight?.defaultLanguage ?? 'plaintext', inline: '' },
  }]]
  const remarkPlugins: PluggableList = [
    ...defaultRemarkPlugins,
    [remarkNovonBaseSrc, { base }],
    remarkNovonHeadings,
    ...((extra?.remarkPlugins as PluggableList) ?? []),
  ]
  const rehypePlugins: PluggableList = [
    ...defaultRehypePlugins,
    ...highlighting,
    ...((extra?.rehypePlugins as PluggableList) ?? []),
  ]
  return {
    // Emit plain `_jsx()` calls instead of JSX syntax: Vite 8 transforms JSX in
    // the native bundler, which does not run for a `.mdx` module id.
    jsx: false,
    jsxImportSource: 'react',
    // Makes every component in the MDX map available without an import.
    providerImportSource: '@mdx-js/react',
    remarkPlugins,
    rehypePlugins,
  }
}

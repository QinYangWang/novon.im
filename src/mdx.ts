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
import GithubSlugger from 'github-slugger'
import { valueToEstree } from 'estree-util-value-to-estree'
import { define } from 'unist-util-mdx-define'

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
  [
    rehypePrettyCode,
    {
      theme: { light: 'github-light', dark: 'github-dark' },
      keepBackground: false,
      defaultLang: 'plaintext',
    },
  ],
]

/** Options passed to `@mdx-js/rollup`. */
export function mdxOptions(extra?: { remarkPlugins?: unknown[]; rehypePlugins?: unknown[] }) {
  return {
    // Emit plain `_jsx()` calls instead of JSX syntax: Vite 8 transforms JSX in
    // the native bundler, which does not run for a `.mdx` module id.
    jsx: false,
    jsxImportSource: 'react',
    // Makes every component in the MDX map available without an import.
    providerImportSource: '@mdx-js/react',
    remarkPlugins: [...defaultRemarkPlugins, remarkNovonHeadings, ...((extra?.remarkPlugins as PluggableList) ?? [])],
    rehypePlugins: [...defaultRehypePlugins, ...((extra?.rehypePlugins as PluggableList) ?? [])],
  }
}

/**
 * Binds the pure content model in `routes.ts` to the index the novon Vite plugin
 * generates from `content/`.
 */
import type { Frontmatter } from '../types.ts'
import { createSiteIndex as buildSiteIndex, fileToRoute, type ContentIndex, type PageModule } from './routes.ts'
import { files as contentFiles, loaders as contentLoaders, meta as contentMeta } from 'virtual:novon/content'

export * from './routes.ts'

/** The generated content index. */
export const contentIndex: ContentIndex = {
  files: contentFiles as string[],
  meta: contentMeta as Record<string, Frontmatter>,
}

/** Frontmatter of every page, keyed by module id. */
export const pageFrontmatter = contentIndex.meta as Record<string, Frontmatter | undefined>

/** URL path of a `/content/...` module id. */
export function routePathOf(file: string): string {
  return fileToRoute(file, contentIndex.meta[file] ?? {})?.path ?? '/'
}

/** `import.meta.env.DEV` decides whether drafts are included. */
export function createSiteIndex(config: { template: 'docs' | 'blog' }) {
  return buildSiteIndex(config, contentIndex, Boolean(import.meta.env.DEV))
}

/** Load the MDX module of a page. */
export async function loadPage(file: string): Promise<PageModule | undefined> {
  const loader = (contentLoaders as Record<string, () => Promise<PageModule>>)[file]
  if (!loader) return undefined
  return loader()
}

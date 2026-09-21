/**
 * Ambient types for the modules the novon Vite plugin generates.
 *
 * This file must stay a script (no top-level imports) so the `declare module`
 * blocks are real ambient declarations rather than module augmentation.
 */

declare module 'virtual:novon/config' {
  import type { RuntimeConfig } from './types.ts'
  const config: RuntimeConfig
  export default config
}

declare module 'virtual:novon/components' {
  import type { ComponentType } from 'react'
  export const customComponents: Record<string, ComponentType<any>>
}

declare module 'virtual:novon/theme' {
  import type { ThemeOverrides } from './types.ts'
  export const themeOverrides: ThemeOverrides
}

declare module 'virtual:novon/styles' {}

declare module 'virtual:novon/content' {
  import type { Frontmatter } from './types.ts'
  /** Module ids, e.g. `/content/guide/setup.mdx`. */
  export const files: string[]
  /** Frontmatter per module id, parsed at build time. */
  export const meta: Record<string, Frontmatter>
  /** One lazy import per page. */
  export const loaders: Record<string, () => Promise<any>>
}

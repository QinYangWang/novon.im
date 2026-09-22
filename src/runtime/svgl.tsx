/**
 * Curated brand marks from [SVGL](https://svgl.app), bundled as imported assets.
 *
 * Only the marks novon links to are included, nothing is fetched at runtime and
 * no third-party SVG markup is injected into the DOM. Each mark has a light and
 * a dark asset where SVGL provides one, so it stays legible in both themes.
 */
import * as React from 'react'
import { cn } from './lib.ts'
import openai from './assets/svgl/openai.svg'
import openaiDark from './assets/svgl/openai_dark.svg'
import markdown from './assets/svgl/markdown-light.svg'
import markdownDark from './assets/svgl/markdown-dark.svg'
import claude from './assets/svgl/claude-ai-icon.svg'

export type SvglIconName = 'markdown' | 'openai' | 'claude'

interface BrandAsset {
  light: string
  /** A light-on-dark variant, when SVGL publishes one. */
  dark?: string
}

const BRANDS: Record<SvglIconName, BrandAsset> = {
  markdown: { light: markdown, dark: markdownDark },
  openai: { light: openai, dark: openaiDark },
  claude: { light: claude },
}

/** The curated names accepted by `SvglIcon`. */
export const svglIcons = Object.keys(BRANDS) as SvglIconName[]

export interface SvglIconProps extends Omit<React.ComponentProps<'span'>, 'children'> {
  name: SvglIconName
  /** Accessible label. When omitted the mark is decorative. */
  label?: string
}

/** A single brand mark, sized with the surrounding text. */
export function SvglIcon({ name, label, className, ...props }: SvglIconProps) {
  const brand = BRANDS[name]
  if (!brand) return null
  const decorative = !label

  return (
    <span
      {...props}
      role={decorative ? undefined : 'img'}
      aria-label={label}
      aria-hidden={decorative ? true : undefined}
      className={cn('inline-flex size-4 shrink-0 items-center justify-center', className)}
    >
      <img
        src={brand.light}
        alt=""
        aria-hidden="true"
        width={16}
        height={16}
        className={cn('size-full object-contain', brand.dark && 'dark:hidden')}
      />
      {brand.dark ? (
        <img
          src={brand.dark}
          alt=""
          aria-hidden="true"
          width={16}
          height={16}
          className="hidden size-full object-contain dark:block"
        />
      ) : null}
    </span>
  )
}

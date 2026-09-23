/**
 * Curated brand marks from [SVGL](https://svgl.app), bundled as imported assets.
 *
 * Only the marks novon links to are included, nothing is fetched at runtime and
 * no third-party SVG markup is injected into the DOM. Each mark has a light and
 * a dark asset where SVGL provides one, so it stays legible in both themes: the
 * theme mechanism variables in theme.css pick the right one.
 */
import * as stylex from '@stylexjs/stylex'
import { space, theme } from './design-system/tokens.stylex.ts'
import type { ElementProps, StyleProps } from './design-system/props.ts'
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

const styles = stylex.create({
  slot: {
    display: 'inline-flex',
    width: space.four,
    height: space.four,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: { width: '100%', height: '100%', objectFit: 'contain' },
  lightOnly: { display: theme.lightOnly },
  darkOnly: { display: theme.darkOnly },
})

export type SvglIconProps = Omit<ElementProps<'span'>, 'children'> & StyleProps & {
  name: SvglIconName
  /** Accessible label. When omitted the mark is decorative. */
  label?: string
}

/** A single brand mark, sized with the surrounding text. */
export function SvglIcon({ name, label, xstyle, ...props }: SvglIconProps) {
  const brand = BRANDS[name]
  if (!brand) return null
  const decorative = !label

  return (
    <span
      {...props}
      role={decorative ? undefined : 'img'}
      aria-label={label}
      aria-hidden={decorative ? true : undefined}
      {...stylex.props(styles.slot, xstyle)}
    >
      <img
        src={brand.light}
        alt=""
        aria-hidden="true"
        width={16}
        height={16}
        {...stylex.props(styles.img, brand.dark ? styles.lightOnly : null)}
      />
      {brand.dark ? (
        <img
          src={brand.dark}
          alt=""
          aria-hidden="true"
          width={16}
          height={16}
          {...stylex.props(styles.img, styles.darkOnly)}
        />
      ) : null}
    </span>
  )
}

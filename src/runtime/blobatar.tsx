/**
 * Blobatar — deterministic geometric avatars from any string.
 * https://blobatar.dev
 *
 * The same name always renders the same creature, so a handle learned in a
 * thread is the one recognised in the sidebar. Nothing is stored and nothing is
 * fetched: the SVG is generated from the name.
 *
 * The default is monochrome, a black body with white eyes, inverted in dark
 * mode so the mark follows the theme the way the rest of the page does.
 */
import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import { blobatarUri } from 'blobatar/uri'
import { theme } from './design-system/tokens.stylex.ts'
import type { ElementProps, StyleProps } from './design-system/props.ts'

export type BlobatarProps = Omit<ElementProps<'img'>, 'src'> &
  StyleProps & {
    /** What the blobatar stands for: a name, handle, email or id. */
    name: string
    /** Rendered size in pixels. Omit to let CSS drive the box. */
    size?: number
    /** Fill the containing box instead of using `size`. */
    fill?: boolean
    /** Black on white, inverted in dark mode. Defaults to `true`. */
    monochrome?: boolean
    /** Per-slot overrides used when `monochrome` is off. */
    palette?: { bg?: string; head?: string; eye?: string }
  }

const MONO = { head: '#000000', eye: '#ffffff' }

const styles = stylex.create({
  base: {
    display: 'inline-block',
    flexShrink: 0,
    userSelect: 'none',
  },
  invert: { filter: theme.invert },
  sized: (size: number) => ({ width: size, height: size }),
  fill: { width: '100%', height: '100%' },
})

/**
 * A deterministic avatar. An `<img>` by default, so a list of hundreds stays a
 * list of hundreds of images rather than a few thousand DOM nodes.
 */
export const Blobatar = React.forwardRef<HTMLImageElement, BlobatarProps>(function Blobatar(
  { name, size, fill = false, monochrome = true, palette, xstyle, alt, ...props },
  ref,
) {
  const src = blobatarUri(name, {
    palette: monochrome ? MONO : palette,
    ...(size ? { size } : {}),
  })
  return (
    <img
      {...props}
      ref={ref}
      src={src}
      alt={alt ?? name}
      width={size}
      height={size}
      {...stylex.props(
        styles.base,
        monochrome && styles.invert,
        fill ? styles.fill : size != null && styles.sized(size),
        xstyle,
      )}
    />
  )
})

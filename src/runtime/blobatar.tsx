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
import { blobatarUri } from 'blobatar/uri'
import { cn } from './lib.ts'

export interface BlobatarProps extends Omit<React.ComponentProps<'img'>, 'src'> {
  /** What the blobatar stands for: a name, handle, email or id. */
  name: string
  /** Rendered size in pixels. Omit to let CSS drive the box. */
  size?: number
  /** Black on white, inverted in dark mode. Defaults to `true`. */
  monochrome?: boolean
  /** Per-slot overrides used when `monochrome` is off. */
  palette?: { bg?: string; head?: string; eye?: string }
}

const MONO = { head: '#000000', eye: '#ffffff' }

/**
 * A deterministic avatar. An `<img>` by default, so a list of hundreds stays a
 * list of hundreds of images rather than a few thousand DOM nodes.
 */
export const Blobatar = React.forwardRef<HTMLImageElement, BlobatarProps>(function Blobatar(
  { name, size, monochrome = true, palette, className, alt, style, ...props },
  ref,
) {
  const src = blobatarUri(name, {
    palette: monochrome ? MONO : palette,
    ...(size ? { size } : {}),
  })
  return (
    <img
      ref={ref}
      src={src}
      alt={alt ?? name}
      width={size}
      height={size}
      className={cn('inline-block shrink-0 select-none', monochrome && 'dark:invert', className)}
      style={size ? { width: size, height: size, ...style } : style}
      {...props}
    />
  )
})

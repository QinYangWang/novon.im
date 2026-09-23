/**
 * Blur-up image — a low-resolution placeholder resolves into the photo.
 *
 * The placeholder is drawn blurred underneath and the real image develops over
 * it once decoded, so a slow asset never shows an empty box. Loading and error
 * states are styled with CSS transitions; reduced motion swaps instantly.
 */
import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import { ImageOff } from 'lucide-react'
import { colors } from './design-system/tokens.stylex.ts'
import { surface } from './design-system/surfaces.ts'
import type { StyleXStyles } from '@stylexjs/stylex'

export type BlurUpStatus = 'loading' | 'ready' | 'error'

export type UseBlurUpImageOptions = {
  src?: string
  srcSet?: string
  onReady?: () => void
  onError?: () => void
}

/** Load state for a single image: cached hits resolve instantly. */
export function useBlurUpImage({ src, srcSet, onReady, onError }: UseBlurUpImageOptions) {
  const ref = React.useRef<HTMLImageElement>(null)
  const [state, setState] = React.useState<{ status: BlurUpStatus; instant: boolean }>({
    status: 'loading',
    instant: false,
  })

  const ready = React.useRef(onReady)
  ready.current = onReady
  const failed = React.useRef(onError)
  failed.current = onError

  const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect
  useIsoLayoutEffect(() => {
    const image = ref.current
    const set = (status: BlurUpStatus, instant: boolean) =>
      setState((previous) =>
        previous.status === status && previous.instant === instant ? previous : { status, instant },
      )

    if (!image || !src) {
      set('loading', false)
      return
    }

    let alive = true
    const cached = image.complete && image.naturalWidth > 0

    const reveal = () => {
      if (!alive) return
      set('ready', cached)
      ready.current?.()
    }
    const fail = () => {
      if (!alive) return
      set('error', cached)
      failed.current?.()
    }

    if (image.complete) {
      if (cached) reveal()
      else fail()
      return () => {
        alive = false
      }
    }

    set('loading', false)

    const onLoad = () => {
      if (!alive) return
      if (typeof image.decode === 'function') {
        image.decode().then(reveal, fail)
        return
      }
      reveal()
    }

    image.addEventListener('load', onLoad)
    image.addEventListener('error', fail)
    return () => {
      alive = false
      image.removeEventListener('load', onLoad)
      image.removeEventListener('error', fail)
    }
  }, [src, srcSet])

  return { ref, status: state.status, instant: state.instant, loaded: state.status === 'ready' }
}

export type BlurUpImageProps = Omit<
  React.ComponentPropsWithoutRef<'img'>,
  'className' | 'style' | 'src' | 'width' | 'height'
> & {
  src?: string
  /** Intrinsic size; both lock the aspect ratio while the image loads. */
  width: number
  height: number
  /** Tiny blurred stand-in: a thumbnail or a generated data URI. */
  placeholder?: string
  /** Waiting surface behind the placeholder. */
  color?: string
  /** Placeholder blur radius in pixels. */
  blur?: number
  onReady?: () => void
  onError?: () => void
  xstyle?: StyleXStyles
}

const styles = stylex.create({
  frame: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
    isolation: 'isolate',
  },
  sized: (width: number, height: number) => ({ aspectRatio: `${width} / ${height}` }),
  colored: (color: string) => ({ backgroundColor: color }),
  placeholder: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: 'scale(1.08)',
  },
  blurred: (blur: number) => ({ filter: `blur(${blur}px)` }),
  image: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: 0,
    filter: 'blur(18px) saturate(0.6)',
    scale: 1.06,
    transitionProperty: 'opacity, filter, scale',
    transitionDuration: '650ms',
    transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
  },
  shown: { opacity: 1, filter: 'blur(0px) saturate(1)', scale: 1 },
  instant: { transitionProperty: 'none' },
  error: {
    position: 'absolute',
    inset: 0,
    display: 'grid',
    placeItems: 'center',
    backgroundColor: colors.canvas,
    color: colors.mutedText,
  },
})

export function BlurUpImage({
  src,
  alt,
  width,
  height,
  placeholder,
  color,
  blur = 14,
  srcSet,
  sizes,
  loading = 'lazy',
  fetchPriority,
  onReady,
  onError,
  xstyle,
  ...props
}: BlurUpImageProps) {
  const { ref, status, instant } = useBlurUpImage({ src, srcSet, onReady, onError })
  const shown = status === 'ready'

  return (
    <div
      aria-busy={status === 'loading'}
      {...stylex.props(
        surface.raised,
        styles.frame,
        styles.sized(width, height),
        color ? styles.colored(color) : null,
        xstyle,
      )}
    >
      {placeholder ? (
        <img
          src={placeholder}
          alt=""
          aria-hidden="true"
          draggable={false}
          {...stylex.props(styles.placeholder, styles.blurred(blur))}
        />
      ) : null}

      <img
        {...props}
        ref={ref}
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        draggable={false}
        {...stylex.props(styles.image, shown && styles.shown, instant && styles.instant)}
      />

      {status === 'error' ? (
        <div aria-hidden="true" {...stylex.props(styles.error)}>
          <ImageOff size={22} />
        </div>
      ) : null}
    </div>
  )
}

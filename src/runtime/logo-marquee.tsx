/**
 * Logo marquee — a continuously scrolling row of marks that stops when the
 * reader looks at it (hover, focus or touch) and falls back to a static,
 * scrollable row under reduced motion.
 *
 * The loop is driven straight from `requestAnimationFrame` on one transform, so
 * scrolling never re-renders React and never needs an animation library.
 */
import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import { colors, radii, space } from './design-system/tokens.stylex.ts'
import { typography } from './design-system/typography.ts'
import { behavior } from './design-system/behaviors.ts'
import { surface } from './design-system/surfaces.ts'
import type { StyleXStyles } from '@stylexjs/stylex'

const RAMP = 0.19
const SETTLE = 0.16
const MAX_COPIES = 14

function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}

const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

function fold(x: number, loop: number): number {
  const remainder = x % loop
  return remainder > 0 ? remainder - loop : remainder
}

function clamp(x: number, min: number, max: number): number {
  return x < min ? min : x > max ? max : x
}

export type MarqueeDirection = 'left' | 'right'

export type UseLogoMarqueeOptions = {
  /** Pixels per second at full speed. */
  speed?: number
  direction?: MarqueeDirection
  gap?: number
  paused?: boolean
}

/** Headless marquee motion: refs, copy count and the pause/reveal bindings. */
export function useLogoMarquee({
  speed = 44,
  direction = 'left',
  gap = 40,
  paused = false,
}: UseLogoMarqueeOptions = {}) {
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const trackRef = React.useRef<HTMLDivElement>(null)
  const groupRef = React.useRef<HTMLUListElement>(null)

  const [copies, setCopies] = React.useState(4)
  const [held, setHeld] = React.useState(false)
  const [near, setNear] = React.useState(false)

  const reduced = useReducedMotion()
  const stopped = held || paused

  const reducedRef = React.useRef(reduced)
  reducedRef.current = reduced
  const movingRef = React.useRef(false)
  movingRef.current = !stopped && !reduced

  const offset = React.useRef(0)
  const nudge = React.useRef(0)
  const rate = React.useRef(0)
  const span = React.useRef(0)

  const paint = React.useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const x = reducedRef.current ? 0 : offset.current - span.current
    track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`
  }, [])

  useIsoLayoutEffect(() => {
    const viewport = viewportRef.current
    const group = groupRef.current
    if (!viewport || !group) return

    const measure = () => {
      const width = group.getBoundingClientRect().width
      const loop = width > 0 ? width + gap : 0
      const room = viewport.getBoundingClientRect().width
      span.current = loop
      offset.current = loop > 0 ? clamp(offset.current, -loop, loop) : 0
      paint()

      const next =
        reduced || loop <= 0 ? 4 : clamp(Math.ceil(room / loop) + 3, 4, MAX_COPIES)
      setCopies((previous) => (previous === next ? previous : next))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    observer.observe(group)
    return () => observer.disconnect()
  }, [gap, paint, reduced])

  // Only animate near the viewport.
  React.useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1]
        if (entry) setNear(entry.isIntersecting)
      },
      { rootMargin: '96px' },
    )
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    if (reduced || !near) return

    let frame = 0
    let last = 0
    const sign = direction === 'right' ? 1 : -1

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)

      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0
      last = now

      const loop = span.current
      if (loop <= 0) return

      // Soft ramp into and out of the pause, then fold the offset seamlessly.
      rate.current += ((movingRef.current ? 1 : 0) - rate.current) * (1 - Math.exp(-dt / RAMP))
      // Snap the settle tail to zero: "stopped" must actually stop.
      if (!movingRef.current && rate.current < 0.002) rate.current = 0
      const pull = nudge.current * (1 - Math.exp(-dt / SETTLE))
      nudge.current -= pull

      let x = offset.current + sign * speed * rate.current * dt + pull
      if (rate.current > 0.002 && Math.abs(nudge.current) < 0.25) {
        nudge.current = 0
        x = fold(x, loop)
      } else {
        x = clamp(x, -loop, loop)
      }

      offset.current = x
      paint()
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [reduced, near, speed, direction, paint])

  // The track is driven directly; keep the viewport itself from scrolling.
  React.useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const pin = () => {
      if (reducedRef.current) return
      if (viewport.scrollLeft !== 0) viewport.scrollLeft = 0
      if (viewport.scrollTop !== 0) viewport.scrollTop = 0
    }
    viewport.addEventListener('scroll', pin, { passive: true })
    return () => viewport.removeEventListener('scroll', pin)
  }, [])

  React.useEffect(() => {
    const release = () => setHeld(false)
    window.addEventListener('blur', release)
    return () => window.removeEventListener('blur', release)
  }, [])

  // A focused item that sits outside the visible edge scrolls into view.
  const reveal = React.useCallback((node: HTMLElement) => {
    const viewport = viewportRef.current
    const loop = span.current
    if (!viewport || reducedRef.current || loop <= 0 || node === viewport) return

    const view = viewport.getBoundingClientRect()
    const box = node.getBoundingClientRect()
    const pad = 12

    let delta = 0
    if (box.left < view.left + pad) delta = view.left + pad - box.left
    else if (box.right > view.right - pad) delta = view.right - pad - box.right
    if (delta === 0) return

    const target = clamp(offset.current + nudge.current + delta, -loop, loop)
    nudge.current = target - offset.current
  }, [])

  const bind = {
    onPointerEnter: (event: React.PointerEvent) => {
      if (event.pointerType !== 'touch') setHeld(true)
    },
    onPointerDown: () => setHeld(true),
    onPointerUp: (event: React.PointerEvent) => {
      if (event.pointerType === 'touch') setHeld(false)
    },
    onPointerCancel: () => setHeld(false),
    onPointerLeave: () => setHeld(false),
    onFocus: (event: React.FocusEvent) => {
      setHeld(true)
      reveal(event.target as HTMLElement)
    },
    onBlur: () => setHeld(false),
  }

  return { viewportRef, trackRef, groupRef, copies, paused: stopped, reduced, bind }
}

export type LogoMarqueeItem = {
  id: string
  label: string
  href?: string
  /** Custom mark; defaults to the label. Keep marks visually sized alike. */
  mark?: React.ReactNode
}

export type LogoMarqueeProps = {
  items: LogoMarqueeItem[]
  /** Accessible name for the row. */
  label?: string
  speed?: number
  direction?: MarqueeDirection
  gap?: number
  paused?: boolean
  onSelect?: (item: LogoMarqueeItem) => void
  xstyle?: StyleXStyles
}

const styles = stylex.create({
  section: {
    position: 'relative',
    isolation: 'isolate',
    width: '100%',
    minWidth: 0,
    maxWidth: '100%',
    overflow: 'hidden',
  },
  viewport: {
    overflowY: 'hidden',
    overflowX: { default: 'hidden', '@media (prefers-reduced-motion: reduce)': 'auto' },
    paddingBlock: space.two,
    outline: 'none',
  },
  track: (gap: number) => ({
    display: 'flex',
    width: 'max-content',
    alignItems: 'center',
    gap,
    willChange: 'transform',
  }),
  group: (gap: number) => ({
    display: 'flex',
    width: 'max-content',
    alignItems: 'center',
    gap,
    listStyle: 'none',
    margin: 0,
    padding: 0,
  }),
  item: { flexShrink: 0 },
  face: {
    display: 'inline-flex',
    minHeight: space.ten,
    alignItems: 'center',
    gap: space.two,
    whiteSpace: 'nowrap',
    borderRadius: radii.control,
    paddingInline: space.three,
    color: { default: colors.mutedText, ':hover': colors.text },
    textDecoration: 'none',
    transitionProperty: 'color, background-color',
    transitionDuration: '150ms',
  },
  interactive: {
    backgroundColor: { default: 'transparent', ':hover': colors.hoverSoft, ':focus-visible': colors.hoverSoft },
  },
})

function MarqueeFace({ item, interactive, onSelect }: { item: LogoMarqueeItem; interactive: boolean; onSelect?: (item: LogoMarqueeItem) => void }) {
  const content = item.mark ? (
    <>
      <span aria-hidden="true">{item.mark}</span>
      <span {...stylex.props(behavior.visuallyHidden)}>{item.label}</span>
    </>
  ) : (
    item.label
  )
  const face = stylex.props(typography.label, styles.face, interactive && styles.interactive)

  if (item.href) {
    return (
      <a href={item.href} {...face}>
        {content}
      </a>
    )
  }
  if (onSelect) {
    return (
      <button type="button" onClick={() => onSelect(item)} {...face}>
        {content}
      </button>
    )
  }
  return <span {...face}>{content}</span>
}

export function LogoMarquee({
  items,
  label = 'Logos',
  speed = 44,
  direction = 'left',
  gap = 40,
  paused = false,
  onSelect,
  xstyle,
}: LogoMarqueeProps) {
  const { viewportRef, trackRef, groupRef, copies, reduced, bind } = useLogoMarquee({
    speed,
    direction,
    gap,
    paused,
  })

  // Under reduced motion there is one static, scrollable group and no copies.
  const groups = reduced ? 1 : copies
  const live = reduced ? 0 : 1

  return (
    <section aria-label={label} {...bind} {...stylex.props(surface.raised, styles.section, xstyle)}>
      <div
        ref={viewportRef}
        tabIndex={reduced ? 0 : undefined}
        {...stylex.props(styles.viewport)}
      >
        <div ref={trackRef} {...stylex.props(styles.track(gap))}>
          {Array.from({ length: groups }, (_, copy) => (
            <ul
              key={copy}
              ref={copy === live ? groupRef : undefined}
              aria-hidden={copy === live ? undefined : true}
              {...stylex.props(styles.group(gap))}
            >
              {items.map((item) => (
                <li key={item.id} {...stylex.props(styles.item)}>
                  {copy !== live ? (
                    <span {...stylex.props(typography.label, styles.face)}>{item.mark ?? item.label}</span>
                  ) : (
                    <MarqueeFace item={item} interactive={Boolean(item.href || onSelect)} onSelect={onSelect} />
                  )}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  )
}

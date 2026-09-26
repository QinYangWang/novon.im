import * as stylex from '@stylexjs/stylex'
import { colors, elevation, radii } from './tokens.stylex.ts'

/**
 * Surface recipes. The gray raised block lifts off the canvas through a top
 * highlight and layered shadows, never a depth-only border; concentric radii
 * hold between a block and the controls inside it.
 */
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23g)' opacity='0.55'/%3E%3C/svg%3E")`

/**
 * Frosted material: a translucent neutral fill blurred against the page behind
 * it, with a fine noise grain blended in soft-light for the sandblasted sheen.
 * Material only — radii stay with the component (concentric-radii rule).
 */
const FROST = {
  backgroundImage: GRAIN,
  backgroundBlendMode: 'soft-light' as const,
  backdropFilter: 'blur(14px) saturate(1.15)',
}

export const surface = stylex.create({
  /** A block resting on the canvas: panels, cards, tool strips. */
  raised: {
    backgroundColor: colors.raised,
    borderRadius: radii.large,
    boxShadow: elevation.low,
  },
  /** A floating block: popovers, menus, the focus of a page. */
  raisedLift: {
    backgroundColor: colors.raised,
    borderRadius: radii.large,
    boxShadow: elevation.lift,
  },
  raisedHover: { backgroundColor: colors.raisedHover },
  raisedStrong: {
    backgroundColor: colors.raisedStrong,
    boxShadow: elevation.press,
  },
  /** Frosted blocks: cards and panels floating over content. */
  frosted: {
    backgroundColor: 'color-mix(in oklab, var(--card) 72%, transparent)',
    boxShadow: elevation.low,
    ...FROST,
  },
  /** Frosted interactive chips: buttons and other neutral controls. */
  frostedControl: {
    backgroundColor: {
      default: 'color-mix(in oklab, var(--card) 72%, transparent)',
      ':hover': 'color-mix(in oklab, var(--card) 84%, transparent)',
      ':active': 'color-mix(in oklab, var(--card) 92%, transparent)',
    },
    boxShadow: { default: elevation.low, ':active': elevation.press },
    ...FROST,
  },
  /** Frosted ghost: truly bare at rest (the host surface shows through),
      the button material on hover/press. */
  frostedGhost: {
    backgroundColor: {
      default: 'transparent',
      ':hover': 'color-mix(in oklab, var(--card) 84%, transparent)',
      ':active': 'color-mix(in oklab, var(--card) 92%, transparent)',
    },
    backgroundImage: { default: 'none', ':hover': GRAIN, ':active': GRAIN },
    backgroundBlendMode: 'soft-light',
    backdropFilter: { default: 'none', ':hover': 'blur(14px) saturate(1.15)', ':active': 'blur(14px) saturate(1.15)' },
    boxShadow: { default: 'none', ':active': elevation.press },
  },
  /** The same gray as a waiting surface inside an image or media frame. */
  raisedInset: {
    backgroundColor: colors.raised,
    boxShadow: elevation.press,
  },
})

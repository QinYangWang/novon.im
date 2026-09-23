import * as stylex from '@stylexjs/stylex'
import { colors, elevation, radii } from './tokens.stylex.ts'

/**
 * Surface recipes. The gray raised block lifts off the canvas through a top
 * highlight and layered shadows, never a depth-only border; concentric radii
 * hold between a block and the controls inside it.
 */
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
  /** The same gray as a waiting surface inside an image or media frame. */
  raisedInset: {
    backgroundColor: colors.raised,
    boxShadow: elevation.press,
  },
})

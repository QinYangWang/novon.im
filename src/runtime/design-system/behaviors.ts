import * as stylex from '@stylexjs/stylex'
import { colors, space } from './tokens.stylex.ts'

/** Shared behavior styles. Compose with `xstyle`; never restyle per call site. */
export const behavior = stylex.create({
  /** Thin themed scrollbars for content and tool surfaces. */
  scroll: {
    scrollbarWidth: 'thin',
    scrollbarColor: `${colors.border} transparent`,
    '::-webkit-scrollbar': { width: 5, height: 5 },
    '::-webkit-scrollbar-thumb': { borderRadius: 5, backgroundColor: colors.border },
    '::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
  },
  /** Available to assistive technology only. */
  visuallyHidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
    borderWidth: 0,
  },
  /** Hidden until it takes focus, then pinned to the top-leading corner. */
  skipLink: {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
    borderWidth: 0,
    ':focus-visible': {
      position: 'fixed',
      top: space.four,
      insetInlineStart: space.four,
      zIndex: 60,
      width: 'auto',
      height: 'auto',
      margin: 0,
      overflow: 'visible',
      clipPath: 'none',
      whiteSpace: 'normal',
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: colors.border,
      borderRadius: 'max(0px, calc(var(--radius) - 2px))',
      backgroundColor: colors.canvas,
      color: colors.text,
      paddingInline: space.four,
      paddingBlock: space.two,
      textDecoration: 'none',
    },
  },
})

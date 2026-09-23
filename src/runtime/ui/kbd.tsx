import * as stylex from '@stylexjs/stylex'
import { colors, radii, space } from '../design-system/tokens.stylex.ts'
import { typography } from '../design-system/typography.ts'
import type { ElementProps, StyleProps } from '../design-system/props.ts'

const styles = stylex.create({
  base: {
    display: 'inline-flex',
    minHeight: space.five,
    minWidth: space.five,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.control,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.border,
    backgroundColor: colors.subtle,
    color: colors.mutedText,
    paddingInline: space.oneHalf,
  },
})

export type KbdProps = ElementProps<'kbd'> & StyleProps

export function Kbd({ xstyle, ...props }: KbdProps) {
  return <kbd {...props} {...stylex.props(typography.code, styles.base, xstyle)} />
}

import * as stylex from '@stylexjs/stylex'
import { colors, radii, space } from '../design-system/tokens.stylex.ts'
import { typography } from '../design-system/typography.ts'
import type { ElementProps, StyleProps } from '../design-system/props.ts'

const styles = stylex.create({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: space.one,
    maxWidth: '100%',
    minWidth: 0,
    overflowWrap: 'anywhere',
    borderRadius: radii.control,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'transparent',
    paddingInline: space.two,
    paddingBlock: space.half,
  },
  default: { backgroundColor: colors.strong, color: colors.onStrong },
  secondary: { backgroundColor: colors.subtle, color: colors.subtleText },
  outline: { borderColor: colors.border, color: colors.mutedText },
  success: { backgroundColor: colors.successSurface, color: colors.successText },
  warning: { backgroundColor: colors.warningSurface, color: colors.warningText },
  danger: { backgroundColor: colors.dangerSurface, color: colors.dangerText },
})

export type BadgeVariant = 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger'
export type BadgeProps = ElementProps<'span'> & StyleProps & { variant?: BadgeVariant | null }

/** A status label, not a control. Always convey status with text as well as color. */
export function Badge({ variant = 'default', xstyle, ...props }: BadgeProps) {
  return (
    <span
      {...props}
      {...stylex.props(typography.caption, styles.base, variant != null && styles[variant], xstyle)}
    />
  )
}

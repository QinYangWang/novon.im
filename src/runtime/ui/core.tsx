/** Small content/theme primitives, not a general-purpose application UI kit. */
import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import type { StyleXStyles } from '@stylexjs/stylex'
import { behavior } from '../design-system/behaviors.ts'
import { colors, elevation, radii, space, type } from '../design-system/tokens.stylex.ts'
import { typography } from '../design-system/typography.ts'
import type { ElementProps, StyleProps } from '../design-system/props.ts'
import { surface } from '../design-system/surfaces.ts'

const styles = stylex.create({
  buttonBase: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.two,
    whiteSpace: 'nowrap',
    borderRadius: radii.control,
    fontFamily: type.sans,
    fontSize: type.label,
    fontWeight: type.medium,
    lineHeight: type.compactLeading,
    transitionProperty: 'color, background-color, border-color, opacity, scale, box-shadow',
    transitionDuration: '150ms',
    transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
    pointerEvents: { default: 'auto', ':disabled': 'none' },
    opacity: { default: 1, ':disabled': 0.5 },
    cursor: { default: 'pointer', ':disabled': 'not-allowed' },
  },
  default: {
    backgroundColor: { default: colors.strong, ':hover': colors.strongHover },
    color: colors.onStrong,
    boxShadow: { default: elevation.low, ':active': elevation.press },
  },
  secondary: {
    backgroundColor: { default: colors.raised, ':hover': colors.raisedHover, ':active': colors.raisedStrong },
    color: colors.text,
    boxShadow: { default: elevation.low, ':active': elevation.press },
  },
  outline: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.border,
    backgroundColor: { default: 'transparent', ':hover': colors.raisedHover },
    color: colors.text,
  },
  ghost: {
    backgroundColor: { default: 'transparent', ':hover': colors.raisedHover },
    color: colors.text,
  },
  destructive: {
    backgroundColor: { default: colors.danger, ':hover': colors.dangerHover },
    color: colors.onDanger,
    boxShadow: { default: elevation.low, ':active': elevation.press },
  },
  link: {
    color: colors.text,
    textDecorationLine: { default: 'none', ':hover': 'underline' },
    textUnderlineOffset: 4,
  },
  buttonSm: {
    minHeight: space.eight,
    paddingInline: space.three,
    paddingBlock: space.one,
    fontSize: type.caption,
  },
  buttonDefault: {
    minHeight: space.nine,
    paddingInline: space.four,
    paddingBlock: space.two,
  },
  buttonLg: {
    minHeight: space.ten,
    paddingInline: space.six,
    paddingBlock: space.two,
  },
  buttonIcon: { width: space.nine, height: space.nine, padding: 0 },
  buttonIconSm: { width: space.eight, height: space.eight, padding: 0 },

  card: { color: colors.surfaceText, borderRadius: radii.large },
  cardHeader: { display: 'flex', flexDirection: 'column', gap: space.oneHalf, padding: space.five },
  cardDescription: { color: colors.mutedText },
  cardContent: { padding: space.five, paddingBlockStart: 0 },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: space.two,
    padding: space.five,
    paddingBlockStart: 0,
  },
  cardAction: { marginInlineStart: 'auto', flexShrink: 0 },

  tableWrap: {
    position: 'relative',
    width: '100%',
    overflowX: 'auto',
    borderRadius: radii.large,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.border,
  },
  table: { width: '100%', captionSide: 'bottom' },
  // Rows in the head always close off; body rows divide, and the table closes
  // on its own container border instead of doubling it.
  tableRow: {
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: {
      default: 'transparent',
      ':where(thead *)': colors.border,
      ':where(tbody > :not(:last-child))': colors.border,
    },
  },
  tableHeadGroup: { backgroundColor: colors.subtleSoft },
  tableFootGroup: {
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: colors.border,
    backgroundColor: colors.subtleSoft,
    fontWeight: type.medium,
  },
  tableHead: {
    height: space.ten,
    paddingInline: space.four,
    paddingBlock: space.two,
    textAlign: 'start',
    verticalAlign: 'bottom',
    whiteSpace: 'nowrap',
    color: colors.mutedText,
  },
  tableCell: { padding: space.four, verticalAlign: 'baseline' },
  numeric: { textAlign: 'end', fontVariantNumeric: 'tabular-nums' },
  tableCaption: { paddingBlock: space.three, color: colors.mutedText },

  avatar: {
    position: 'relative',
    display: 'flex',
    width: space.nine,
    height: space.nine,
    flexShrink: 0,
    overflow: 'hidden',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.border,
  },
  avatarSized: (size: number) => ({ width: size, height: size }),
  avatarImage: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarFallback: {
    display: 'flex',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.raised,
    color: colors.mutedText,
  },
  avatarHidden: { display: 'none' },

  scrollArea: { overflow: 'auto' },
})

export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link'
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm'

export type ButtonProps = ElementProps<'button'> &
  StyleProps & {
    variant?: ButtonVariant | null
    size?: ButtonSize | null
    /** Opt out of the press scale where motion would distract. */
    static?: boolean
  }

export function Button({
  variant = 'default',
  size = 'default',
  static: noMotion = false,
  type = 'button',
  xstyle,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      data-static={noMotion || variant === 'link' ? '' : undefined}
      {...stylex.props(
        styles.buttonBase,
        variant != null && styles[variant],
        (variant === 'secondary' || variant === 'outline') && surface.frostedControl,
        size === 'sm' ? styles.buttonSm : size === 'lg' ? styles.buttonLg : size === 'icon' ? styles.buttonIcon : size === 'icon-sm' ? styles.buttonIconSm : styles.buttonDefault,
        xstyle,
      )}
    />
  )
}

export { Badge, type BadgeProps, type BadgeVariant } from './badge.tsx'
export { Kbd, type KbdProps } from './kbd.tsx'

export function Card({ xstyle, ...props }: ElementProps<'div'> & StyleProps) {
  return <div {...props} {...stylex.props(surface.frosted, styles.card, xstyle)} />
}
export function CardHeader({ xstyle, ...props }: ElementProps<'div'> & StyleProps) {
  return <div {...props} {...stylex.props(styles.cardHeader, xstyle)} />
}
export function CardTitle({ xstyle, ...props }: ElementProps<'h3'> & StyleProps) {
  return <h3 {...props} {...stylex.props(typography.bodyStrong, xstyle)} />
}
export function CardDescription({ xstyle, ...props }: ElementProps<'p'> & StyleProps) {
  return <p {...props} {...stylex.props(typography.labelRegular, styles.cardDescription, xstyle)} />
}
export function CardContent({ xstyle, ...props }: ElementProps<'div'> & StyleProps) {
  return <div {...props} {...stylex.props(styles.cardContent, xstyle)} />
}
export function CardFooter({ xstyle, ...props }: ElementProps<'div'> & StyleProps) {
  return <div {...props} {...stylex.props(styles.cardFooter, xstyle)} />
}
export function CardAction({ xstyle, ...props }: ElementProps<'div'> & StyleProps) {
  return <div {...props} {...stylex.props(styles.cardAction, xstyle)} />
}

export type TableProps = ElementProps<'table'> & StyleProps & { containerXstyle?: StyleXStyles }

export function Table({ containerXstyle, xstyle, ...props }: TableProps) {
  return (
    <div {...stylex.props(styles.tableWrap, containerXstyle)}>
      <table {...props} {...stylex.props(styles.table, typography.labelRegular, xstyle)} />
    </div>
  )
}
export function TableHeader({ xstyle, ...props }: ElementProps<'thead'> & StyleProps) {
  return <thead {...props} {...stylex.props(styles.tableHeadGroup, xstyle)} />
}
export function TableBody({ xstyle, ...props }: ElementProps<'tbody'> & StyleProps) {
  return <tbody {...props} {...stylex.props(xstyle)} />
}
export function TableFooter({ xstyle, ...props }: ElementProps<'tfoot'> & StyleProps) {
  return <tfoot {...props} {...stylex.props(styles.tableFootGroup, xstyle)} />
}
export function TableRow({ xstyle, ...props }: ElementProps<'tr'> & StyleProps) {
  return <tr {...props} {...stylex.props(styles.tableRow, xstyle)} />
}
export function TableHead({ xstyle, numeric = false, ...props }: ElementProps<'th'> & StyleProps & { numeric?: boolean }) {
  return <th {...props} {...stylex.props(styles.tableHead, typography.label, numeric && styles.numeric, xstyle)} />
}
export function TableCell({ xstyle, numeric = false, ...props }: ElementProps<'td'> & StyleProps & { numeric?: boolean }) {
  return <td {...props} {...stylex.props(styles.tableCell, numeric && styles.numeric, xstyle)} />
}
export function TableCaption({ xstyle, ...props }: ElementProps<'caption'> & StyleProps) {
  return <caption {...props} {...stylex.props(styles.tableCaption, typography.labelRegular, xstyle)} />
}

/* -------------------------------------------------------------------------- */
/* Avatar                                                                     */
/*                                                                            */
/* Load tracking is three lines of state; the ARIA for an avatar is its alt.   */
/* -------------------------------------------------------------------------- */

type AvatarState = { loaded: boolean; setLoaded: (loaded: boolean) => void }
const AvatarContext = React.createContext<AvatarState | null>(null)

export type AvatarProps = ElementProps<'span'> & StyleProps & { size?: number }

export function Avatar({ xstyle, size, children, ...props }: AvatarProps) {
  const [loaded, setLoaded] = React.useState(false)
  return (
    <AvatarContext.Provider value={React.useMemo(() => ({ loaded, setLoaded }), [loaded])}>
      <span {...props} {...stylex.props(styles.avatar, size != null && styles.avatarSized(size), xstyle)}>
        {children}
      </span>
    </AvatarContext.Provider>
  )
}

export function AvatarImage({ xstyle, onLoad, onError, ...props }: ElementProps<'img'> & StyleProps) {
  const state = React.useContext(AvatarContext)
  return (
    <img
      {...props}
      onLoad={(event) => {
        state?.setLoaded(true)
        onLoad?.(event)
      }}
      onError={(event) => {
        state?.setLoaded(false)
        onError?.(event)
      }}
      {...stylex.props(styles.avatarImage, !state?.loaded && styles.avatarHidden, xstyle)}
    />
  )
}

export function AvatarFallback({ xstyle, ...props }: ElementProps<'span'> & StyleProps) {
  const state = React.useContext(AvatarContext)
  return (
    <span
      {...props}
      {...stylex.props(styles.avatarFallback, typography.caption, state?.loaded && styles.avatarHidden, xstyle)}
    />
  )
}

export type ScrollAreaProps = ElementProps<'div'> & StyleProps & { viewportXstyle?: StyleXStyles }

/**
 * A scrolling box with the theme's thin scrollbars. The platform scrollbar is
 * the control; there is no custom thumb to maintain or hover-reveal.
 */
export function ScrollArea({ xstyle, viewportXstyle, ...props }: ScrollAreaProps) {
  return <div {...props} {...stylex.props(styles.scrollArea, behavior.scroll, xstyle, viewportXstyle)} />
}

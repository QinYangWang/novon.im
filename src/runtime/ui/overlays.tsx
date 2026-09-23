/** Overlays used by search, mobile navigation and page actions. */
import * as stylex from '@stylexjs/stylex'
import { X } from 'lucide-react'
import { Dialog as BaseDialog } from '@base-ui-components/react/dialog'
import { Menu as BaseMenu } from '@base-ui-components/react/menu'
import { colors, media, radii, space } from '../design-system/tokens.stylex.ts'
import { typography } from '../design-system/typography.ts'
import type { ElementProps, StyleProps } from '../design-system/props.ts'
import type { BaseProps } from './props.ts'

const styles = stylex.create({
  // Base UI marks mount/unmount with data attributes; the popup fades and
  // settles from 98% so a short move never becomes a flourish.
  popup: {
    opacity: { default: 1, '[data-starting-style]': 0, '[data-ending-style]': 0 },
    scale: { default: 1, '[data-starting-style]': 0.98, '[data-ending-style]': 0.98 },
    transitionProperty: 'opacity, transform, scale',
    transitionDuration: '150ms',
    transitionTimingFunction: 'ease-out',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 50,
    backgroundColor: colors.scrim,
    opacity: { default: 1, '[data-starting-style]': 0, '[data-ending-style]': 0 },
    transitionProperty: 'opacity',
    transitionDuration: '150ms',
  },
  viewport: {
    position: 'fixed',
    inset: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: { default: 'flex-start', [media.small]: 'center' },
    justifyContent: 'center',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    padding: space.four,
  },
  dialog: {
    position: 'relative',
    width: '100%',
    maxWidth: '32rem',
    borderRadius: radii.large,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.border,
    backgroundColor: colors.popover,
    color: colors.popoverText,
    padding: space.six,
    boxShadow: '0 25px 50px -12px color-mix(in oklab, #000 25%, transparent)',
  },
  close: {
    position: 'absolute',
    top: space.four,
    insetInlineEnd: space.four,
    display: 'inline-flex',
    width: space.seven,
    height: space.seven,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.control,
    color: colors.mutedText,
    backgroundColor: { default: 'transparent', ':hover': colors.hover },
    cursor: 'pointer',
    borderWidth: 0,
    borderStyle: 'none',
  },
  dialogHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.oneHalf,
    paddingInlineEnd: space.eight,
  },
  dialogFooter: {
    marginBlockStart: space.six,
    display: 'flex',
    flexDirection: { default: 'column-reverse', [media.small]: 'row' },
    justifyContent: { default: 'flex-start', [media.small]: 'flex-end' },
    gap: space.two,
  },
  dialogDescription: { color: colors.mutedText },

  menuPositioner: { zIndex: 50 },
  menu: {
    zIndex: 50,
    minWidth: '11rem',
    borderRadius: radii.large,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.border,
    backgroundColor: colors.popover,
    color: colors.popoverText,
    padding: space.one,
    outline: 'none',
    boxShadow: '0 10px 15px -3px color-mix(in oklab, #000 10%, transparent), 0 4px 6px -4px color-mix(in oklab, #000 10%, transparent)',
  },
  menuItem: {
    display: 'flex',
    cursor: 'default',
    alignItems: 'center',
    gap: space.two,
    borderRadius: radii.surface,
    paddingInline: space.twoHalf,
    paddingBlock: space.oneHalf,
    outline: 'none',
    userSelect: 'none',
    color: colors.text,
    backgroundColor: { default: 'transparent', '[data-highlighted]': colors.hover },
    pointerEvents: { default: 'auto', '[data-disabled]': 'none' },
    opacity: { default: 1, '[data-disabled]': 0.5 },
  },
  menuLabel: {
    paddingInline: space.twoHalf,
    paddingBlock: space.oneHalf,
    color: colors.mutedText,
  },
  menuSeparator: {
    marginInline: '-0.25rem',
    marginBlock: space.one,
    height: 1,
    backgroundColor: colors.border,
  },
})

export const Dialog = BaseDialog.Root
export const DialogTrigger = BaseDialog.Trigger
export const DialogPortal = BaseDialog.Portal

export function DialogClose({ xstyle, ...props }: BaseProps<typeof BaseDialog.Close>) {
  return <BaseDialog.Close {...props} {...stylex.props(xstyle)} />
}

export function DialogOverlay({ xstyle, ...props }: BaseProps<typeof BaseDialog.Backdrop>) {
  return <BaseDialog.Backdrop {...props} {...stylex.props(styles.overlay, xstyle)} />
}

export type DialogContentProps = BaseProps<typeof BaseDialog.Popup> & { showClose?: boolean }

export function DialogContent({ xstyle, children, showClose = true, ...props }: DialogContentProps) {
  return (
    <BaseDialog.Portal>
      <DialogOverlay />
      <BaseDialog.Viewport {...stylex.props(styles.viewport)}>
        <BaseDialog.Popup {...props} {...stylex.props(styles.popup, styles.dialog, xstyle)}>
          {children}
          {showClose ? (
            <BaseDialog.Close aria-label="Close" {...stylex.props(styles.close)}>
              <X aria-hidden="true" size={16} />
            </BaseDialog.Close>
          ) : null}
        </BaseDialog.Popup>
      </BaseDialog.Viewport>
    </BaseDialog.Portal>
  )
}

export function DialogHeader({ xstyle, ...props }: ElementProps<'div'> & StyleProps) {
  return <div {...props} {...stylex.props(styles.dialogHeader, xstyle)} />
}
export function DialogFooter({ xstyle, ...props }: ElementProps<'div'> & StyleProps) {
  return <div {...props} {...stylex.props(styles.dialogFooter, xstyle)} />
}
export function DialogTitle({ xstyle, ...props }: BaseProps<typeof BaseDialog.Title>) {
  return <BaseDialog.Title {...props} {...stylex.props(typography.bodyStrong, xstyle)} />
}
export function DialogDescription({ xstyle, ...props }: BaseProps<typeof BaseDialog.Description>) {
  return <BaseDialog.Description {...props} {...stylex.props(typography.labelRegular, styles.dialogDescription, xstyle)} />
}

export const DropdownMenu = BaseMenu.Root
export const DropdownMenuGroup = BaseMenu.Group

export function DropdownMenuTrigger({ xstyle, ...props }: BaseProps<typeof BaseMenu.Trigger>) {
  return <BaseMenu.Trigger {...props} {...stylex.props(xstyle)} />
}

export type DropdownMenuContentProps = BaseProps<typeof BaseMenu.Popup> &
  Pick<BaseProps<typeof BaseMenu.Positioner>, 'align' | 'side'> & { sideOffset?: number }

export function DropdownMenuContent({
  xstyle,
  children,
  align = 'start',
  side = 'bottom',
  sideOffset = 6,
  ...props
}: DropdownMenuContentProps) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner sideOffset={sideOffset} align={align} side={side} {...stylex.props(styles.menuPositioner)}>
        <BaseMenu.Popup {...props} {...stylex.props(styles.popup, styles.menu, xstyle)}>
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  )
}
export function DropdownMenuItem({ xstyle, ...props }: BaseProps<typeof BaseMenu.Item>) {
  return <BaseMenu.Item {...props} {...stylex.props(styles.menuItem, typography.labelRegular, xstyle)} />
}
export function DropdownMenuLabel({ xstyle, ...props }: ElementProps<'div'> & StyleProps) {
  return <div role="presentation" {...props} {...stylex.props(styles.menuLabel, typography.caption, xstyle)} />
}
export function DropdownMenuSeparator({ xstyle, ...props }: BaseProps<typeof BaseMenu.Separator>) {
  return <BaseMenu.Separator {...props} {...stylex.props(styles.menuSeparator, xstyle)} />
}

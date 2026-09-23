/** Overlays used by search, mobile navigation and page actions. */
import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import { X } from 'lucide-react'
import {
  Dialog as AriaDialog,
  Heading,
  Header,
  Menu as AriaMenu,
  MenuItem,
  MenuSection,
  MenuTrigger,
  Modal,
  ModalOverlay,
  Popover,
  Button as AriaButton,
  Text,
} from 'react-aria-components'
import { colors, elevation, media, radii, space } from '../design-system/tokens.stylex.ts'
import { typography } from '../design-system/typography.ts'
import type { StyleXStyles } from '@stylexjs/stylex'
import type { ElementProps, StyleProps } from '../design-system/props.ts'

const open = stylex.keyframes({
  from: { opacity: 0, transform: 'scale(0.98)' },
  to: { opacity: 1, transform: 'none' },
})

const styles = stylex.create({
  // Overlays arrive with a short settle and leave with the page underneath.
  popup: {
    animationName: open,
    animationDuration: '150ms',
    animationTimingFunction: 'ease-out',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 50,
    backgroundColor: colors.scrim,
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
    backgroundColor: colors.popover,
    color: colors.popoverText,
    padding: space.six,
    boxShadow: elevation.lift,
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
    backgroundColor: { default: 'transparent', ':hover': colors.raisedHover },
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
    maxHeight: '24rem',
    overflowY: 'auto',
    borderRadius: radii.large,
    backgroundColor: colors.popover,
    color: colors.popoverText,
    padding: space.one,
    outline: 'none',
    boxShadow: elevation.lift,
  },
  menuSection: { padding: 0 },
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
    textDecoration: 'none',
    backgroundColor: { default: 'transparent', '[data-hovered]': colors.raisedHover, '[data-pressed]': colors.raisedStrong },
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

/* -------------------------------------------------------------------------- */
/* Dialog                                                                     */
/* -------------------------------------------------------------------------- */

type DialogState = { open: boolean; onOpenChange?: (open: boolean) => void }
const DialogContext = React.createContext<DialogState>({ open: true })

export type DialogProps = {
  /** Controlled open state. novon dialogs are always controlled. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

export function Dialog({ open = true, onOpenChange, children }: DialogProps) {
  const state = React.useMemo(() => ({ open, onOpenChange }), [open, onOpenChange])
  return <DialogContext.Provider value={state}>{children}</DialogContext.Provider>
}

/** Toggles the surrounding dialog from its child element's press. */
export function DialogTrigger({ children, ...props }: { children?: React.ReactNode }) {
  const state = React.useContext(DialogContext)
  const child = React.Children.only(children) as React.ReactElement<{ onClick?: (event: React.MouseEvent) => void }>
  return React.cloneElement(child, {
    ...props,
    onClick: (event: React.MouseEvent) => {
      child.props.onClick?.(event)
      state.onOpenChange?.(!state.open)
    },
  } as Record<string, unknown>)
}

/** Closes the surrounding dialog on press. */
export function DialogClose({ xstyle, children, onClick, ...props }: ElementProps<'button'> & StyleProps) {
  const state = React.useContext(DialogContext)
  return (
    <button
      {...props}
      type="button"
      onClick={(event) => {
        onClick?.(event)
        state.onOpenChange?.(false)
      }}
      {...stylex.props(xstyle)}
    >
      {children}
    </button>
  )
}

export function DialogOverlay({ xstyle, ...props }: ElementProps<'div'> & StyleProps) {
  return <div {...props} {...stylex.props(styles.overlay, xstyle)} />
}

export type DialogContentProps = ElementProps<'section'> &
  StyleProps & {
    showClose?: boolean
    /** Focus target after close, when the trigger is gone by then. */
    finalFocus?: () => HTMLElement | false
    children?: React.ReactNode
  }

export function DialogContent({ xstyle, children, showClose = true, finalFocus, ...props }: DialogContentProps) {
  const state = React.useContext(DialogContext)
  const wasOpen = React.useRef(state.open)

  // When the trigger may have disappeared (a responsive bar), hand focus back
  // explicitly; react-aria restores to the trigger the rest of the time.
  React.useEffect(() => {
    if (wasOpen.current && !state.open) {
      const target = finalFocus?.()
      if (target) requestAnimationFrame(() => target.focus())
    }
    wasOpen.current = state.open
  }, [state.open, finalFocus])

  return (
    <ModalOverlay
      isOpen={state.open}
      onOpenChange={(next) => state.onOpenChange?.(next)}
      isDismissable
      {...stylex.props(styles.overlay)}
    >
      <Modal {...stylex.props(styles.viewport)}>
        <AriaDialog {...(props as object)} {...stylex.props(styles.popup, styles.dialog, xstyle)}>
          {children}
          {showClose ? (
            <DialogClose aria-label="Close" {...stylex.props(styles.close)}>
              <X aria-hidden="true" size={16} />
            </DialogClose>
          ) : null}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  )
}

export function DialogHeader({ xstyle, ...props }: ElementProps<'div'> & StyleProps) {
  return <div {...props} {...stylex.props(styles.dialogHeader, xstyle)} />
}
export function DialogFooter({ xstyle, ...props }: ElementProps<'div'> & StyleProps) {
  return <div {...props} {...stylex.props(styles.dialogFooter, xstyle)} />
}
export function DialogTitle({ xstyle, ...props }: ElementProps<'h2'> & StyleProps) {
  return <Heading slot="title" {...(props as object)} {...stylex.props(typography.bodyStrong, xstyle)} />
}
export function DialogDescription({ xstyle, ...props }: ElementProps<'p'> & StyleProps) {
  return <Text slot="description" {...(props as object)} {...stylex.props(typography.labelRegular, styles.dialogDescription, xstyle)} />
}

export const DialogPortal = ({ children }: { children?: React.ReactNode }) => <>{children}</>

/* -------------------------------------------------------------------------- */
/* Dropdown menu                                                              */
/* -------------------------------------------------------------------------- */

type MenuItemSpec = {
  key: string
  content: React.ReactNode
  href?: string
  onSelect?: () => void
  disabled?: boolean
  xstyle?: StyleXStyles
}
type MenuSegmentSpec = { key: string; title?: React.ReactNode; items: MenuItemSpec[] }

function isMarker(child: React.ReactNode, marker: unknown): child is React.ReactElement<Record<string, unknown>> {
  return React.isValidElement(child) && (child.type as unknown) === marker
}

/** Groups the declarative children into labeled segments. */
function collectMenu(children: React.ReactNode): MenuSegmentSpec[] {
  const segments: MenuSegmentSpec[] = []
  let current: MenuSegmentSpec = { key: 's0', items: [] }
  const push = () => {
    if (current.items.length > 0 || current.title !== undefined) segments.push(current)
  }
  const visit = (nodes: React.ReactNode) => {
    for (const child of React.Children.toArray(nodes)) {
      if (!React.isValidElement(child)) continue
      const props = child.props as Record<string, unknown>
      if (isMarker(child, DropdownMenuLabel)) {
        push()
        current = { key: `s${segments.length}`, title: props.children as React.ReactNode, items: [] }
        continue
      }
      if (isMarker(child, DropdownMenuSeparator)) {
        push()
        current = { key: `s${segments.length}`, items: [] }
        continue
      }
      if (isMarker(child, DropdownMenuItem)) {
        current.items.push({
          key: `i${current.items.length}`,
          content: props.children as React.ReactNode,
          href: props.href as string | undefined,
          onSelect: props.onSelect as (() => void) | undefined,
          disabled: props.disabled as boolean | undefined,
          xstyle: props.xstyle as StyleXStyles | undefined,
        })
        continue
      }
      visit((props as { children?: React.ReactNode }).children)
    }
  }
  visit(children)
  push()
  return segments.length > 0 ? segments : [{ key: 's0', items: [] }]
}

export type DropdownMenuProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

/**
 * A dropdown menu. Its children are `DropdownMenuTrigger` and
 * `DropdownMenuContent`; the content's children are the declarative items.
 */
export function DropdownMenu({ open, onOpenChange, children, ...props }: DropdownMenuProps) {
  const parts = React.Children.toArray(children)
  const trigger = parts.find((node) => isMarker(node, DropdownMenuTrigger)) as React.ReactElement<Record<string, unknown>> | undefined
  const content = parts.find((node) => isMarker(node, DropdownMenuContent)) as React.ReactElement<Record<string, unknown>> | undefined
  const contentProps = (content?.props ?? {}) as {
    align?: 'start' | 'center' | 'end'
    side?: 'top' | 'bottom' | 'left' | 'right'
    sideOffset?: number
    xstyle?: StyleXStyles
    children?: React.ReactNode
  }
  const segments = collectMenu(contentProps.children)
  const placement = `${contentProps.side ?? 'bottom'} ${contentProps.align === 'end' ? 'end' : contentProps.align === 'center' ? 'center' : 'start'}` as 'bottom start'

  return (
    <MenuTrigger
      {...(props as object)}
      isOpen={open}
      onOpenChange={onOpenChange}
    >
      <AriaButton {...stylex.props((trigger?.props as { xstyle?: StyleXStyles } | undefined)?.xstyle)}>
        {trigger?.props.children as React.ReactNode}
      </AriaButton>
      <Popover
        placement={placement}
        offset={contentProps.sideOffset ?? 6}
        {...stylex.props(styles.popup, styles.menuPositioner)}
      >
        <AriaMenu {...stylex.props(styles.menu, contentProps.xstyle)}>
          {segments.map((segment) => (
            <MenuSection key={segment.key} {...stylex.props(styles.menuSection)}>
              {segment.title !== undefined ? <Header {...stylex.props(styles.menuLabel, typography.caption)}>{segment.title}</Header> : null}
              {segment.items.map((item) => (
                <MenuItem
                  key={item.key}
                  href={item.href}
                  isDisabled={item.disabled}
                  onPress={item.onSelect}
                  {...stylex.props(styles.menuItem, typography.labelRegular, item.xstyle)}
                >
                  {item.content}
                </MenuItem>
              ))}
            </MenuSection>
          ))}
        </AriaMenu>
      </Popover>
    </MenuTrigger>
  )
}

export function DropdownMenuTrigger(_props: { xstyle?: StyleXStyles; children?: React.ReactNode }) {
  return null
}

export type DropdownMenuContentProps = {
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'bottom' | 'left' | 'right'
  sideOffset?: number
  xstyle?: StyleXStyles
  children?: React.ReactNode
}

/** Marker: the popup body of a `DropdownMenu`. */
export function DropdownMenuContent(_props: DropdownMenuContentProps) {
  return null
}

export type DropdownMenuItemProps = StyleProps & {
  href?: string
  onSelect?: () => void
  disabled?: boolean
  children?: React.ReactNode
}

/**
 * Marker: one menu item. With `href` the item is a link; `onSelect` runs on
 * activation and closes the menu.
 */
export function DropdownMenuItem(_props: DropdownMenuItemProps) {
  return null
}

/** Marker: a presentational group label inside a `DropdownMenu`. */
export function DropdownMenuLabel(_props: { children?: React.ReactNode }) {
  return null
}

/** Marker: a break between groups inside a `DropdownMenu`. */
export function DropdownMenuSeparator(_props: Record<string, never>) {
  return null
}

export const DropdownMenuGroup = ({ children }: { children?: React.ReactNode }) => <>{children}</>

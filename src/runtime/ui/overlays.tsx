/**
 * Overlays: dialogs, sheets, popovers, tooltips, hover cards, menus and select.
 *
 * Every portal-based component keeps its own portal, positioner and popup, so
 * an MDX page only has to place the content and its trigger.
 */
import * as React from 'react'
import { Check, ChevronDown, ChevronRight, X } from 'lucide-react'
import { AlertDialog as BaseAlertDialog } from '@base-ui-components/react/alert-dialog'
import { ContextMenu as BaseContextMenu } from '@base-ui-components/react/context-menu'
import { Dialog as BaseDialog } from '@base-ui-components/react/dialog'
import { Menu as BaseMenu } from '@base-ui-components/react/menu'
import { Popover as BasePopover } from '@base-ui-components/react/popover'
import { PreviewCard as BasePreviewCard } from '@base-ui-components/react/preview-card'
import { Select as BaseSelect } from '@base-ui-components/react/select'
import { Tooltip as BaseTooltip } from '@base-ui-components/react/tooltip'
import { cn } from '../lib.ts'
import type { BaseProps } from './props.ts'

const panel =
  'z-50 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg outline-none'
const transition =
  'transition-[opacity,transform] duration-150 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0'

/* -------------------------------------------------------------------------- */
/* Dialog                                                                     */
/* -------------------------------------------------------------------------- */

export const Dialog = BaseDialog.Root
export const DialogTrigger = BaseDialog.Trigger
export const DialogClose = BaseDialog.Close
export const DialogPortal = BaseDialog.Portal

export function DialogOverlay({ className, ...props }: BaseProps<typeof BaseDialog.Backdrop>) {
  return (
    <BaseDialog.Backdrop
      className={cn(
        'fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] transition-opacity duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
        className,
      )}
      {...props}
    />
  )
}

export function DialogContent({
  className,
  children,
  showClose = true,
  ...props
}: BaseProps<typeof BaseDialog.Popup> & { showClose?: boolean }) {
  return (
    <BaseDialog.Portal>
      <DialogOverlay />
      <BaseDialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
        <BaseDialog.Popup
          className={cn(
            'relative w-full max-w-lg rounded-xl border border-border bg-popover p-6 text-popover-foreground shadow-2xl',
            transition,
            className,
          )}
          {...props}
        >
          {children}
          {showClose ? (
            <BaseDialog.Close
              aria-label="Close"
              className="absolute right-4 top-4 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
            >
              <X className="size-4" />
            </BaseDialog.Close>
          ) : null}
        </BaseDialog.Popup>
      </BaseDialog.Viewport>
    </BaseDialog.Portal>
  )
}

export function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-1.5 pr-8', className)} {...props} />
}

export function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />
}

export function DialogTitle({ className, ...props }: BaseProps<typeof BaseDialog.Title>) {
  return <BaseDialog.Title className={cn('text-base font-semibold', className)} {...props} />
}

export function DialogDescription({ className, ...props }: BaseProps<typeof BaseDialog.Description>) {
  return <BaseDialog.Description className={cn('text-sm text-muted-foreground', className)} {...props} />
}

/* -------------------------------------------------------------------------- */
/* AlertDialog                                                                */
/* -------------------------------------------------------------------------- */

export const AlertDialog = BaseAlertDialog.Root
export const AlertDialogTrigger = BaseAlertDialog.Trigger
export const AlertDialogClose = BaseAlertDialog.Close

export function AlertDialogContent({
  className,
  children,
  ...props
}: BaseProps<typeof BaseAlertDialog.Popup>) {
  return (
    <BaseAlertDialog.Portal>
      <BaseAlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] transition-opacity duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
      <BaseAlertDialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
        <BaseAlertDialog.Popup
          className={cn(
            'relative w-full max-w-md rounded-xl border border-border bg-popover p-6 text-popover-foreground shadow-2xl',
            transition,
            className,
          )}
          {...props}
        >
          {children}
        </BaseAlertDialog.Popup>
      </BaseAlertDialog.Viewport>
    </BaseAlertDialog.Portal>
  )
}

export function AlertDialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-1.5', className)} {...props} />
}

export function AlertDialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />
}

export function AlertDialogTitle({ className, ...props }: BaseProps<typeof BaseAlertDialog.Title>) {
  return <BaseAlertDialog.Title className={cn('text-base font-semibold', className)} {...props} />
}

export function AlertDialogDescription({ className, ...props }: BaseProps<typeof BaseAlertDialog.Description>) {
  return <BaseAlertDialog.Description className={cn('text-sm text-muted-foreground', className)} {...props} />
}

/* -------------------------------------------------------------------------- */
/* Sheet                                                                      */
/* -------------------------------------------------------------------------- */

export const Sheet = BaseDialog.Root
export const SheetTrigger = BaseDialog.Trigger
export const SheetClose = BaseDialog.Close

const SHEET_SIDES = {
  right:
    'inset-y-0 right-0 h-full w-full max-w-sm border-l data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full',
  left: 'inset-y-0 left-0 h-full w-full max-w-sm border-r data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full',
  top: 'inset-x-0 top-0 w-full border-b data-[starting-style]:-translate-y-full data-[ending-style]:-translate-y-full',
  bottom:
    'inset-x-0 bottom-0 w-full border-t data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full',
} as const

export function SheetContent({
  className,
  children,
  side = 'right',
  showClose = true,
  ...props
}: BaseProps<typeof BaseDialog.Popup> & { side?: keyof typeof SHEET_SIDES; showClose?: boolean }) {
  return (
    <BaseDialog.Portal>
      <DialogOverlay />
      <BaseDialog.Popup
        className={cn(
          'fixed z-50 flex flex-col gap-4 overflow-y-auto bg-popover p-6 text-popover-foreground shadow-2xl transition-transform duration-250 ease-out',
          side === 'top' || side === 'bottom' ? '' : 'max-w-sm',
          SHEET_SIDES[side],
          className,
        )}
        {...props}
      >
        {children}
        {showClose ? (
          <BaseDialog.Close
            aria-label="Close"
            className="absolute right-4 top-4 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            <X className="size-4" />
          </BaseDialog.Close>
        ) : null}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  )
}

export function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-1.5 pr-8', className)} {...props} />
}

export function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />
}

export function SheetTitle({ className, ...props }: BaseProps<typeof BaseDialog.Title>) {
  return <BaseDialog.Title className={cn('text-base font-semibold', className)} {...props} />
}

export function SheetDescription({ className, ...props }: BaseProps<typeof BaseDialog.Description>) {
  return <BaseDialog.Description className={cn('text-sm text-muted-foreground', className)} {...props} />
}

/* -------------------------------------------------------------------------- */
/* Popover                                                                    */
/* -------------------------------------------------------------------------- */

export const Popover = BasePopover.Root
export const PopoverTrigger = BasePopover.Trigger
export const PopoverClose = BasePopover.Close

export function PopoverContent({
  className,
  children,
  align,
  side,
  sideOffset = 8,
  ...props
}: BaseProps<typeof BasePopover.Popup> &
  Pick<BaseProps<typeof BasePopover.Positioner>, 'align' | 'side'> & {
    sideOffset?: number
  }) {
  return (
    <BasePopover.Portal>
      <BasePopover.Positioner sideOffset={sideOffset} align={align} side={side} className="z-50">
        <BasePopover.Popup className={cn(panel, 'p-3', transition, className)} {...props}>
          {children}
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  )
}

/* -------------------------------------------------------------------------- */
/* Tooltip                                                                    */
/* -------------------------------------------------------------------------- */

export const TooltipProvider = BaseTooltip.Provider
export const Tooltip = BaseTooltip.Root
export const TooltipTrigger = BaseTooltip.Trigger
export const TooltipPortal = BaseTooltip.Portal
export const TooltipPositioner = BaseTooltip.Positioner

export function TooltipContent({ className, children, ...props }: BaseProps<typeof BaseTooltip.Popup>) {
  return (
    <BaseTooltip.Portal>
      <BaseTooltip.Positioner sideOffset={6} className="z-50">
        <BaseTooltip.Popup
          className={cn(
            'rounded-lg border border-border bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-md',
            transition,
            className,
          )}
          {...props}
        >
          {children}
        </BaseTooltip.Popup>
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  )
}

/* -------------------------------------------------------------------------- */
/* HoverCard                                                                  */
/* -------------------------------------------------------------------------- */

export const HoverCard = BasePreviewCard.Root
export const HoverCardTrigger = BasePreviewCard.Trigger

export function HoverCardContent({
  className,
  children,
  align = 'center',
  side = 'bottom',
  sideOffset = 8,
  ...props
}: BaseProps<typeof BasePreviewCard.Popup> &
  Pick<BaseProps<typeof BasePreviewCard.Positioner>, 'align' | 'side'> & { sideOffset?: number }) {
  return (
    <BasePreviewCard.Portal>
      <BasePreviewCard.Positioner sideOffset={sideOffset} align={align} side={side} className="z-50">
        <BasePreviewCard.Popup className={cn(panel, 'w-72 p-4', transition, className)} {...props}>
          {children}
        </BasePreviewCard.Popup>
      </BasePreviewCard.Positioner>
    </BasePreviewCard.Portal>
  )
}

/* -------------------------------------------------------------------------- */
/* DropdownMenu                                                               */
/* -------------------------------------------------------------------------- */

const menuItem =
  'flex cursor-default items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm outline-none select-none data-[highlighted]:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0'

export const DropdownMenu = BaseMenu.Root
export const DropdownMenuTrigger = BaseMenu.Trigger
export const DropdownMenuGroup = BaseMenu.Group

export function DropdownMenuContent({
  className,
  children,
  align = 'start',
  side = 'bottom',
  sideOffset = 6,
  ...props
}: BaseProps<typeof BaseMenu.Popup> &
  Pick<BaseProps<typeof BaseMenu.Positioner>, 'align' | 'side'> & { sideOffset?: number }) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner sideOffset={sideOffset} align={align} side={side} className="z-50">
        <BaseMenu.Popup className={cn(panel, 'min-w-44 p-1', transition, className)} {...props}>
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  )
}

export function DropdownMenuItem({ className, ...props }: BaseProps<typeof BaseMenu.Item>) {
  return <BaseMenu.Item className={cn(menuItem, className)} {...props} />
}

export function DropdownMenuCheckboxItem({
  className,
  children,
  ...props
}: BaseProps<typeof BaseMenu.CheckboxItem>) {
  return (
    <BaseMenu.CheckboxItem className={cn(menuItem, 'pr-8 pl-8', className)} {...props}>
      <span className="absolute left-2.5 flex size-4 items-center justify-center">
        <BaseMenu.CheckboxItemIndicator>
          <Check className="size-3.5" />
        </BaseMenu.CheckboxItemIndicator>
      </span>
      {children}
    </BaseMenu.CheckboxItem>
  )
}

export function DropdownMenuRadioGroup({ className, ...props }: BaseProps<typeof BaseMenu.RadioGroup>) {
  return <BaseMenu.RadioGroup className={cn('', className)} {...props} />
}

export function DropdownMenuRadioItem({ className, children, ...props }: BaseProps<typeof BaseMenu.RadioItem>) {
  return (
    <BaseMenu.RadioItem className={cn(menuItem, 'pr-8 pl-8', className)} {...props}>
      <span className="absolute left-2.5 flex size-4 items-center justify-center">
        <BaseMenu.RadioItemIndicator>
          <Check className="size-3.5" />
        </BaseMenu.RadioItemIndicator>
      </span>
      {children}
    </BaseMenu.RadioItem>
  )
}

export function DropdownMenuLabel({ className, ...props }: React.ComponentProps<'div'>) {
  return <div role="presentation" className={cn('px-2.5 py-1.5 text-xs font-medium text-muted-foreground', className)} {...props} />
}

export function DropdownMenuSeparator({ className, ...props }: BaseProps<typeof BaseMenu.Separator>) {
  return <BaseMenu.Separator className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />
}

export function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<'span'>) {
  return <span className={cn('ml-auto text-xs tracking-widest text-muted-foreground', className)} {...props} />
}

export function DropdownMenuSub({ ...props }: BaseProps<typeof BaseMenu.SubmenuRoot>) {
  return <BaseMenu.SubmenuRoot {...props} />
}

export function DropdownMenuSubTrigger({ className, children, ...props }: BaseProps<typeof BaseMenu.SubmenuTrigger>) {
  return (
    <BaseMenu.SubmenuTrigger className={cn(menuItem, 'data-[popup-open]:bg-accent', className)} {...props}>
      {children}
      <ChevronRight className="ml-auto size-4 text-muted-foreground" />
    </BaseMenu.SubmenuTrigger>
  )
}

export function DropdownMenuSubContent({
  className,
  children,
  align = 'start',
  side = 'right',
  sideOffset = 4,
  ...props
}: BaseProps<typeof BaseMenu.Popup> &
  Pick<BaseProps<typeof BaseMenu.Positioner>, 'align' | 'side'> & { sideOffset?: number }) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner sideOffset={sideOffset} align={align} side={side} className="z-50">
        <BaseMenu.Popup className={cn(panel, 'min-w-40 p-1', transition, className)} {...props}>
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  )
}

/* -------------------------------------------------------------------------- */
/* ContextMenu                                                                */
/* -------------------------------------------------------------------------- */

export const ContextMenu = BaseContextMenu.Root
export const ContextMenuTrigger = BaseContextMenu.Trigger
export const ContextMenuGroup = BaseContextMenu.Group

export function ContextMenuContent({
  className,
  children,
  align = 'start',
  side = 'bottom',
  sideOffset = 2,
  ...props
}: BaseProps<typeof BaseContextMenu.Popup> &
  Pick<BaseProps<typeof BaseContextMenu.Positioner>, 'align' | 'side'> & { sideOffset?: number }) {
  return (
    <BaseContextMenu.Portal>
      <BaseContextMenu.Positioner sideOffset={sideOffset} align={align} side={side} className="z-50">
        <BaseContextMenu.Popup className={cn(panel, 'min-w-44 p-1', transition, className)} {...props}>
          {children}
        </BaseContextMenu.Popup>
      </BaseContextMenu.Positioner>
    </BaseContextMenu.Portal>
  )
}

export function ContextMenuItem({ className, ...props }: BaseProps<typeof BaseContextMenu.Item>) {
  return <BaseContextMenu.Item className={cn(menuItem, className)} {...props} />
}

export function ContextMenuCheckboxItem({ className, children, ...props }: BaseProps<typeof BaseContextMenu.CheckboxItem>) {
  return (
    <BaseContextMenu.CheckboxItem className={cn(menuItem, 'pr-8 pl-8', className)} {...props}>
      <span className="absolute left-2.5 flex size-4 items-center justify-center">
        <BaseContextMenu.CheckboxItemIndicator>
          <Check className="size-3.5" />
        </BaseContextMenu.CheckboxItemIndicator>
      </span>
      {children}
    </BaseContextMenu.CheckboxItem>
  )
}

export function ContextMenuRadioGroup({ className, ...props }: BaseProps<typeof BaseContextMenu.RadioGroup>) {
  return <BaseContextMenu.RadioGroup className={cn('', className)} {...props} />
}

export function ContextMenuRadioItem({ className, children, ...props }: BaseProps<typeof BaseContextMenu.RadioItem>) {
  return (
    <BaseContextMenu.RadioItem className={cn(menuItem, 'pr-8 pl-8', className)} {...props}>
      <span className="absolute left-2.5 flex size-4 items-center justify-center">
        <BaseContextMenu.RadioItemIndicator>
          <Check className="size-3.5" />
        </BaseContextMenu.RadioItemIndicator>
      </span>
      {children}
    </BaseContextMenu.RadioItem>
  )
}

export function ContextMenuLabel({ className, ...props }: React.ComponentProps<'div'>) {
  return <div role="presentation" className={cn('px-2.5 py-1.5 text-xs font-medium text-muted-foreground', className)} {...props} />
}

export function ContextMenuSeparator({ className, ...props }: BaseProps<typeof BaseContextMenu.Separator>) {
  return <BaseContextMenu.Separator className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />
}

export function ContextMenuShortcut({ className, ...props }: React.ComponentProps<'span'>) {
  return <span className={cn('ml-auto text-xs tracking-widest text-muted-foreground', className)} {...props} />
}

export function ContextMenuSub({ ...props }: BaseProps<typeof BaseContextMenu.SubmenuRoot>) {
  return <BaseContextMenu.SubmenuRoot {...props} />
}

export function ContextMenuSubTrigger({ className, children, ...props }: BaseProps<typeof BaseContextMenu.SubmenuTrigger>) {
  return (
    <BaseContextMenu.SubmenuTrigger className={cn(menuItem, 'data-[popup-open]:bg-accent', className)} {...props}>
      {children}
      <ChevronRight className="ml-auto size-4 text-muted-foreground" />
    </BaseContextMenu.SubmenuTrigger>
  )
}

export function ContextMenuSubContent({
  className,
  children,
  align = 'start',
  side = 'right',
  sideOffset = 4,
  ...props
}: BaseProps<typeof BaseContextMenu.Popup> &
  Pick<BaseProps<typeof BaseContextMenu.Positioner>, 'align' | 'side'> & { sideOffset?: number }) {
  return (
    <BaseContextMenu.Portal>
      <BaseContextMenu.Positioner sideOffset={sideOffset} align={align} side={side} className="z-50">
        <BaseContextMenu.Popup className={cn(panel, 'min-w-40 p-1', transition, className)} {...props}>
          {children}
        </BaseContextMenu.Popup>
      </BaseContextMenu.Positioner>
    </BaseContextMenu.Portal>
  )
}

/* -------------------------------------------------------------------------- */
/* Select                                                                     */
/* -------------------------------------------------------------------------- */

export const Select = BaseSelect.Root
export const SelectGroup = BaseSelect.Group

export function SelectValue({ className, ...props }: BaseProps<typeof BaseSelect.Value>) {
  return <BaseSelect.Value className={cn('truncate text-left data-[placeholder]:text-muted-foreground', className)} {...props} />
}

export function SelectTrigger({
  className,
  children,
  ...props
}: BaseProps<typeof BaseSelect.Trigger>) {
  return (
    <BaseSelect.Trigger
      className={cn(
        'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-border bg-card/60 px-3.5 text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 data-[popup-open]:bg-accent',
        className,
      )}
      {...props}
    >
      {children}
      <BaseSelect.Icon className="shrink-0 text-muted-foreground">
        <ChevronDown className="size-4" />
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  )
}

export function SelectContent({
  className,
  children,
  align = 'start',
  sideOffset = 6,
  ...props
}: BaseProps<typeof BaseSelect.Popup> &
  Pick<BaseProps<typeof BaseSelect.Positioner>, 'align' | 'side'> & { sideOffset?: number }) {
  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner sideOffset={sideOffset} align={align} className="z-50">
        <BaseSelect.Popup
          className={cn(panel, 'max-h-[min(20rem,var(--available-height))] min-w-[var(--anchor-width,10rem)] p-1', transition, className)}
          {...props}
        >
          <BaseSelect.List>{children}</BaseSelect.List>
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  )
}

export function SelectItem({ className, children, ...props }: BaseProps<typeof BaseSelect.Item>) {
  return (
    <BaseSelect.Item
      className={cn(
        'relative flex cursor-default items-center gap-2 rounded-lg py-1.5 pr-8 pl-2.5 text-sm outline-none select-none data-[highlighted]:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <BaseSelect.ItemText className="flex-1 truncate">{children}</BaseSelect.ItemText>
      <BaseSelect.ItemIndicator className="absolute right-2.5 flex items-center">
        <Check className="size-3.5" />
      </BaseSelect.ItemIndicator>
    </BaseSelect.Item>
  )
}

export function SelectLabel({ className, ...props }: React.ComponentProps<'div'>) {
  return <div role="presentation" className={cn('px-2.5 py-1.5 text-xs font-medium text-muted-foreground', className)} {...props} />
}

export function SelectSeparator({ className, ...props }: BaseProps<typeof BaseSelect.Separator>) {
  return <BaseSelect.Separator className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />
}

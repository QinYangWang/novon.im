/** Overlays used by search, mobile navigation and page actions. */
import * as React from 'react'
import { X } from 'lucide-react'
import { Dialog as BaseDialog } from '@base-ui-components/react/dialog'
import { Menu as BaseMenu } from '@base-ui-components/react/menu'
import { cn } from '../lib.ts'
import type { BaseProps } from './props.ts'

const transition = 'transition-[opacity,transform] duration-150 ease-out data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 motion-reduce:transition-none motion-reduce:transform-none'

export const Dialog = BaseDialog.Root
export const DialogTrigger = BaseDialog.Trigger
export const DialogClose = BaseDialog.Close
export const DialogPortal = BaseDialog.Portal

export function DialogOverlay({ className, ...props }: BaseProps<typeof BaseDialog.Backdrop>) {
  return <BaseDialog.Backdrop className={cn('fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] transition-opacity duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 motion-reduce:transition-none', className)} {...props} />
}
export function DialogContent({ className, children, showClose = true, ...props }: BaseProps<typeof BaseDialog.Popup> & { showClose?: boolean }) {
  return (
    <BaseDialog.Portal>
      <DialogOverlay />
      <BaseDialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain p-4 sm:items-center">
        <BaseDialog.Popup className={cn('relative w-full max-w-lg rounded-xl border border-border bg-popover p-6 text-popover-foreground shadow-2xl', transition, className)} {...props}>
          {children}
          {showClose ? (
            <BaseDialog.Close aria-label="Close" className="absolute right-4 top-4 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
              <X aria-hidden="true" className="size-4" />
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

export const DropdownMenu = BaseMenu.Root
export const DropdownMenuTrigger = BaseMenu.Trigger
export const DropdownMenuGroup = BaseMenu.Group
export function DropdownMenuContent({ className, children, align = 'start', side = 'bottom', sideOffset = 6, ...props }: BaseProps<typeof BaseMenu.Popup> & Pick<BaseProps<typeof BaseMenu.Positioner>, 'align' | 'side'> & { sideOffset?: number }) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner sideOffset={sideOffset} align={align} side={side} className="z-50">
        <BaseMenu.Popup className={cn('z-50 min-w-44 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none', transition, className)} {...props}>
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  )
}
export function DropdownMenuItem({ className, ...props }: BaseProps<typeof BaseMenu.Item>) {
  return <BaseMenu.Item className={cn('flex cursor-default items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm outline-none select-none data-[highlighted]:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0', className)} {...props} />
}
export function DropdownMenuLabel({ className, ...props }: React.ComponentProps<'div'>) {
  return <div role="presentation" className={cn('px-2.5 py-1.5 text-xs font-medium text-muted-foreground', className)} {...props} />
}
export function DropdownMenuSeparator({ className, ...props }: BaseProps<typeof BaseMenu.Separator>) {
  return <BaseMenu.Separator className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />
}

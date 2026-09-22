/** Small content/theme primitives, not a general-purpose application UI kit. */
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Avatar as BaseAvatar } from '@base-ui-components/react/avatar'
import { ScrollArea as BaseScrollArea } from '@base-ui-components/react/scroll-area'
import { cn } from '../lib.ts'
import type { BaseProps } from './props.ts'

export const buttonVariants = cva(
  'novon-press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-accent',
        outline: 'border border-border bg-card/60 hover:bg-accent',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        destructive: 'bg-destructive text-white hover:bg-destructive/90',
        link: 'text-foreground underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-6',
        icon: 'size-9',
        'icon-sm': 'size-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export function Button({ className, variant, size, static: noMotion = false, type = 'button', ...props }: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { static?: boolean }) {
  return <button type={type} data-static={noMotion || variant === 'link' ? '' : undefined} className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border text-muted-foreground',
        success: 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
        warning: 'border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400',
        danger: 'border-transparent bg-red-500/15 text-red-700 dark:text-red-400',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)
export function Badge({ className, variant, ...props }: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('rounded-xl border border-border bg-card text-card-foreground', className)} {...props} />
}
export function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-1.5 p-5', className)} {...props} />
}
export function CardTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  return <h3 className={cn('font-semibold leading-snug tracking-tight', className)} {...props} />
}
export function CardDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />
}
export function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('p-5 pt-0', className)} {...props} />
}
export function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex items-center gap-2 p-5 pt-0', className)} {...props} />
}
export function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('ml-auto shrink-0', className)} {...props} />
}

export function Kbd({ className, ...props }: React.ComponentProps<'kbd'>) {
  return <kbd className={cn('inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-border bg-secondary px-1.5 font-mono text-[11px] font-medium text-muted-foreground', className)} {...props} />
}

export function Table({ className, containerClassName, ...props }: React.ComponentProps<'table'> & { containerClassName?: string }) {
  return <div className={cn('relative w-full overflow-x-auto rounded-xl border border-border', containerClassName)}><table className={cn('w-full caption-bottom text-sm', className)} {...props} /></div>
}
export function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return <thead className={cn('bg-secondary/60 [&_tr]:border-b [&_tr]:border-border', className)} {...props} />
}
export function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
}
export function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return <tfoot className={cn('border-t border-border bg-secondary/60 font-medium', className)} {...props} />
}
export function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return <tr className={cn('border-b border-border', className)} {...props} />
}
export function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return <th className={cn('h-10 px-4 text-left align-middle font-medium whitespace-nowrap text-muted-foreground', className)} {...props} />
}
export function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return <td className={cn('p-4 align-middle', className)} {...props} />
}
export function TableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
  return <caption className={cn('py-3 text-sm text-muted-foreground', className)} {...props} />
}

export function Avatar({ className, ...props }: BaseProps<typeof BaseAvatar.Root>) {
  return <BaseAvatar.Root className={cn('relative flex size-9 shrink-0 overflow-hidden rounded-full border border-border', className)} {...props} />
}
export function AvatarImage({ className, ...props }: BaseProps<typeof BaseAvatar.Image>) {
  return <BaseAvatar.Image className={cn('size-full object-cover', className)} {...props} />
}
export function AvatarFallback({ className, ...props }: BaseProps<typeof BaseAvatar.Fallback>) {
  return <BaseAvatar.Fallback className={cn('flex size-full items-center justify-center bg-secondary text-xs font-medium text-muted-foreground', className)} {...props} />
}

export function ScrollArea({ className, viewportClassName, children, ...props }: BaseProps<typeof BaseScrollArea.Root> & { viewportClassName?: string }) {
  return (
    <BaseScrollArea.Root className={cn('overflow-hidden', className)} {...props}>
      <BaseScrollArea.Viewport className={cn('size-full', viewportClassName)}>{children}</BaseScrollArea.Viewport>
      <BaseScrollArea.Scrollbar className="flex w-1.5 touch-none select-none opacity-0 transition-opacity data-[hovering]:opacity-100 data-[scrolling]:opacity-100">
        <BaseScrollArea.Thumb className="w-full rounded-full bg-border" />
      </BaseScrollArea.Scrollbar>
    </BaseScrollArea.Root>
  )
}

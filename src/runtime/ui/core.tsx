/**
 * Core surfaces and primitives.
 *
 * Buttons, badges, cards, form fields, tables, feedback and the small layout
 * helpers every site ends up rebuilding. Built on the same tokens as the rest of
 * the theme so a component dropped into MDX matches the surrounding chrome.
 */
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Avatar as BaseAvatar } from '@base-ui-components/react/avatar'
import { Progress as BaseProgress } from '@base-ui-components/react/progress'
import { ScrollArea as BaseScrollArea } from '@base-ui-components/react/scroll-area'
import { Toggle as BaseToggle } from '@base-ui-components/react/toggle'
import { ToggleGroup as BaseToggleGroup } from '@base-ui-components/react/toggle-group'
import { cn } from '../lib.ts'
import type { BaseProps } from './props.ts'

/* -------------------------------------------------------------------------- */
/* Button                                                                     */
/* -------------------------------------------------------------------------- */

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,background-color,border-color,transform,scale] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
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

export function Button({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      className={cn(
        buttonVariants({ variant, size }),
        variant !== 'link' && 'active:scale-[0.96] motion-reduce:active:scale-100',
        className,
      )}
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------- */
/* Badge                                                                      */
/* -------------------------------------------------------------------------- */

export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors',
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

export function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

/* -------------------------------------------------------------------------- */
/* Card                                                                       */
/* -------------------------------------------------------------------------- */

export function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('rounded-xl border border-border bg-card text-card-foreground', className)}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-1.5 p-5', className)} {...props} />
}

export function CardTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  return <h3 className={cn('font-semibold leading-none tracking-tight', className)} {...props} />
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

/* -------------------------------------------------------------------------- */
/* Fields                                                                     */
/* -------------------------------------------------------------------------- */

export function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return (
    <label
      className={cn(
        'flex items-center gap-2 text-sm font-medium leading-none text-foreground select-none',
        className,
      )}
      {...props}
    />
  )
}

export function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'flex h-9 w-full rounded-md border border-border bg-card/60 px-3.5 py-1 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-500/60 aria-invalid:ring-red-500/20',
        className,
      )}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'flex min-h-20 w-full resize-y rounded-lg border border-border bg-card/60 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-500/60 aria-invalid:ring-red-500/20',
        className,
      )}
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------- */
/* Separator and keyboard hints                                               */
/* -------------------------------------------------------------------------- */

export function Separator({
  className,
  orientation = 'horizontal',
  ...props
}: React.ComponentProps<'div'> & { orientation?: 'horizontal' | 'vertical' }) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'vertical' ? 'h-full w-px' : 'h-px w-full',
        className,
      )}
      {...props}
    />
  )
}

export function Kbd({ className, ...props }: React.ComponentProps<'kbd'>) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-border bg-secondary px-1.5 font-mono text-[11px] font-medium text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------- */
/* Loading                                                                    */
/* -------------------------------------------------------------------------- */

export function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-lg bg-muted', className)} {...props} />
}

export function Spinner({ className, label = 'Loading', ...props }: React.ComponentProps<'svg'> & { label?: string }) {
  return (
    <svg
      role="status"
      aria-label={label}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('size-4 animate-spin text-muted-foreground', className)}
      {...props}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/* Alert                                                                      */
/* -------------------------------------------------------------------------- */

export const alertVariants = cva(
  'relative flex w-full gap-3 rounded-xl border px-4 py-3 text-sm [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'border-border bg-card/40 text-foreground',
        info: 'border-sky-500/30 bg-sky-500/8 text-sky-700 dark:text-sky-300',
        success: 'border-emerald-500/30 bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
        warning: 'border-amber-500/30 bg-amber-500/8 text-amber-700 dark:text-amber-300',
        destructive: 'border-red-500/30 bg-red-500/8 text-red-700 dark:text-red-300',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
}

export function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('font-medium', className)} {...props} />
}

export function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('text-muted-foreground [&_p]:leading-relaxed', className)} {...props} />
}

/* -------------------------------------------------------------------------- */
/* Table                                                                      */
/* -------------------------------------------------------------------------- */

export function Table({ className, containerClassName, ...props }: React.ComponentProps<'table'> & { containerClassName?: string }) {
  return (
    <div className={cn('relative w-full overflow-x-auto rounded-xl border border-border', containerClassName)}>
      <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  )
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
  return <tr className={cn('border-b border-border transition-colors hover:bg-accent/40', className)} {...props} />
}

export function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      className={cn('h-10 px-4 text-left align-middle font-medium whitespace-nowrap text-muted-foreground', className)}
      {...props}
    />
  )
}

export function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return <td className={cn('p-4 align-middle', className)} {...props} />
}

export function TableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
  return <caption className={cn('py-3 text-sm text-muted-foreground', className)} {...props} />
}

/* -------------------------------------------------------------------------- */
/* Avatar                                                                     */
/* -------------------------------------------------------------------------- */

export function Avatar({ className, ...props }: BaseProps<typeof BaseAvatar.Root>) {
  return (
    <BaseAvatar.Root
      className={cn('relative flex size-9 shrink-0 overflow-hidden rounded-full border border-border', className)}
      {...props}
    />
  )
}

export function AvatarImage({ className, ...props }: BaseProps<typeof BaseAvatar.Image>) {
  return <BaseAvatar.Image className={cn('size-full object-cover', className)} {...props} />
}

export function AvatarFallback({ className, ...props }: BaseProps<typeof BaseAvatar.Fallback>) {
  return (
    <BaseAvatar.Fallback
      className={cn(
        'flex size-full items-center justify-center bg-secondary text-xs font-medium text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------- */
/* Progress                                                                   */
/* -------------------------------------------------------------------------- */

export function Progress({
  className,
  value = 0,
  max = 100,
  indeterminate = false,
  ...props
}: BaseProps<typeof BaseProgress.Root> & { indeterminate?: boolean }) {
  return (
    <BaseProgress.Root
      value={indeterminate ? null : value}
      max={max}
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-secondary', className)}
      {...props}
    >
      <BaseProgress.Track className="size-full">
        <BaseProgress.Indicator className="h-full rounded-full bg-primary transition-[width] duration-300" />
      </BaseProgress.Track>
    </BaseProgress.Root>
  )
}

/* -------------------------------------------------------------------------- */
/* Toggle and ToggleGroup                                                     */
/* -------------------------------------------------------------------------- */

export const toggleVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-[color,background-color,transform,scale] outline-none hover:bg-accent hover:text-accent-foreground active:scale-[0.96] motion-reduce:active:scale-100 focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 data-[pressed]:bg-accent data-[pressed]:text-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline: 'border border-border bg-card/60',
      },
      size: {
        default: 'h-9 px-3',
        sm: 'h-8 px-2.5 text-xs',
        lg: 'h-10 px-4',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export function Toggle({
  className,
  variant,
  size,
  ...props
}: BaseProps<typeof BaseToggle> & VariantProps<typeof toggleVariants>) {
  return <BaseToggle className={cn(toggleVariants({ variant, size }), className)} {...props} />
}

export function ToggleGroup({ className, ...props }: BaseProps<typeof BaseToggleGroup>) {
  return <BaseToggleGroup className={cn('flex items-center gap-1', className)} {...props} />
}

export function ToggleGroupItem({
  className,
  variant,
  size,
  ...props
}: BaseProps<typeof BaseToggle> & VariantProps<typeof toggleVariants>) {
  return <BaseToggle className={cn(toggleVariants({ variant, size }), className)} {...props} />
}

/* -------------------------------------------------------------------------- */
/* ScrollArea                                                                 */
/* -------------------------------------------------------------------------- */

export function ScrollArea({
  className,
  viewportClassName,
  children,
  ...props
}: BaseProps<typeof BaseScrollArea.Root> & { viewportClassName?: string }) {
  return (
    <BaseScrollArea.Root className={cn('overflow-hidden', className)} {...props}>
      <BaseScrollArea.Viewport className={cn('size-full', viewportClassName)}>{children}</BaseScrollArea.Viewport>
      <BaseScrollArea.Scrollbar className="flex w-1.5 touch-none select-none opacity-0 transition-opacity data-[hovering]:opacity-100 data-[scrolling]:opacity-100">
        <BaseScrollArea.Thumb className="w-full rounded-full bg-border" />
      </BaseScrollArea.Scrollbar>
    </BaseScrollArea.Root>
  )
}

/* -------------------------------------------------------------------------- */
/* Aspect ratio                                                               */
/* -------------------------------------------------------------------------- */

export function AspectRatio({
  ratio = 16 / 9,
  className,
  style,
  ...props
}: React.ComponentProps<'div'> & { ratio?: number }) {
  return <div className={cn('w-full', className)} style={{ aspectRatio: ratio, ...style }} {...props} />
}

/* -------------------------------------------------------------------------- */
/* Breadcrumb                                                                 */
/* -------------------------------------------------------------------------- */

export function Breadcrumb(props: React.ComponentProps<'nav'>) {
  return <nav aria-label="Breadcrumb" {...props} />
}

export function BreadcrumbList({ className, ...props }: React.ComponentProps<'ol'>) {
  return (
    <ol
      className={cn('flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

export function BreadcrumbItem({ className, ...props }: React.ComponentProps<'li'>) {
  return <li className={cn('inline-flex items-center gap-1.5', className)} {...props} />
}

export function BreadcrumbLink({ className, ...props }: React.ComponentProps<'a'>) {
  return (
    <a
      className={cn('rounded-sm no-underline transition-colors hover:text-foreground', className)}
      {...props}
    />
  )
}

export function BreadcrumbPage({ className, ...props }: React.ComponentProps<'span'>) {
  return <span aria-current="page" className={cn('font-medium text-foreground', className)} {...props} />
}

export function BreadcrumbSeparator({ className, children = '/', ...props }: React.ComponentProps<'li'>) {
  return (
    <li role="presentation" aria-hidden="true" className={cn('text-muted-foreground/60', className)} {...props}>
      {children}
    </li>
  )
}

export function BreadcrumbEllipsis({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span aria-hidden="true" className={cn('px-1 text-muted-foreground', className)} {...props}>
      …
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* Pagination                                                                 */
/* -------------------------------------------------------------------------- */

export function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
  return <nav role="navigation" aria-label="pagination" className={cn('mx-auto flex w-full justify-center', className)} {...props} />
}

export function PaginationContent({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul className={cn('flex flex-row items-center gap-1', className)} {...props} />
}

export function PaginationItem({ className, ...props }: React.ComponentProps<'li'>) {
  return <li className={cn('', className)} {...props} />
}

export function PaginationLink({
  className,
  active,
  size = 'icon',
  ...props
}: React.ComponentProps<'a'> & { active?: boolean; size?: 'default' | 'sm' | 'icon' }) {
  return (
    <a
      aria-current={active ? 'page' : undefined}
      className={cn(
        buttonVariants({ variant: active ? 'default' : 'outline', size: size === 'icon' ? 'icon-sm' : 'sm' }),
        className,
      )}
      {...props}
    />
  )
}

export function PaginationPrevious({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
  return <PaginationLink size="sm" className={cn('gap-1 px-3', className)} {...props} />
}

export function PaginationNext({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
  return <PaginationLink size="sm" className={cn('gap-1 px-3', className)} {...props} />
}

export function PaginationEllipsis({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span aria-hidden="true" className={cn('flex size-8 items-center justify-center text-muted-foreground', className)} {...props}>
      …
    </span>
  )
}

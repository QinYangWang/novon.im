/**
 * Disclosure: accordion, tabs and collapsible.
 */
import * as React from 'react'
import { Accordion as BaseAccordion } from '@base-ui-components/react/accordion'
import { Collapsible as BaseCollapsible } from '@base-ui-components/react/collapsible'
import { Tabs as BaseTabs } from '@base-ui-components/react/tabs'
import { cn } from '../lib.ts'
import type { BaseProps } from './props.ts'

/* -------------------------------------------------------------------------- */
/* Accordion                                                                  */
/* -------------------------------------------------------------------------- */

export function Accordion({ className, ...props }: BaseProps<typeof BaseAccordion.Root>) {
  return (
    <BaseAccordion.Root
      className={cn('my-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card/40', className)}
      {...props}
    />
  )
}

export function AccordionItem({ className, ...props }: BaseProps<typeof BaseAccordion.Item>) {
  return <BaseAccordion.Item className={cn('py-0', className)} {...props} />
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: BaseProps<typeof BaseAccordion.Trigger>) {
  return (
    <BaseAccordion.Header className="novon-not-prose flex">
      <BaseAccordion.Trigger
        className={cn(
          'group flex w-full flex-1 items-center gap-2 px-4 py-3 text-left text-sm font-medium transition-colors outline-none hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none',
          className,
        )}
        {...props}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[panel-open]:rotate-90 motion-reduce:transition-none"
        >
          <path
            d="M6 4l4 4-4 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="min-w-0 flex-1">{children}</span>
      </BaseAccordion.Trigger>
    </BaseAccordion.Header>
  )
}

export function AccordionPanel({ className, ...props }: BaseProps<typeof BaseAccordion.Panel>) {
  return (
    <BaseAccordion.Panel
      className={cn(
        'overflow-hidden text-sm text-muted-foreground transition-[height] data-[ending-style]:h-0 data-[starting-style]:h-0 motion-reduce:transition-none',
        className,
      )}
      {...props}
    />
  )
}

export const AccordionGroup = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div className={cn('my-6', className)} {...props} />
)

/* -------------------------------------------------------------------------- */
/* Tabs                                                                       */
/* -------------------------------------------------------------------------- */

export function Tabs({ className, ...props }: BaseProps<typeof BaseTabs.Root>) {
  return <BaseTabs.Root className={cn('my-6', className)} {...props} />
}

export function TabsList({ className, ...props }: BaseProps<typeof BaseTabs.List>) {
  return (
    <BaseTabs.List
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg border border-border bg-card/60 p-1',
        className,
      )}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }: BaseProps<typeof BaseTabs.Tab>) {
  return (
    <BaseTabs.Tab
      className={cn(
        'shrink-0 rounded-md px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 data-[active]:bg-accent data-[active]:text-foreground motion-reduce:transition-none',
        className,
      )}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }: BaseProps<typeof BaseTabs.Panel>) {
  return <BaseTabs.Panel className={cn('pt-4 outline-none', className)} {...props} />
}

/* -------------------------------------------------------------------------- */
/* Collapsible                                                                */
/* -------------------------------------------------------------------------- */

export const Collapsible = BaseCollapsible.Root
export const CollapsibleTrigger = BaseCollapsible.Trigger
export const CollapsiblePanel = BaseCollapsible.Panel

/**
 * Form controls.
 *
 * Checkbox, radio, switch, slider and the field wrapper, all on Base UI so the
 * keyboard, focus and form semantics match the platform.
 */
import { Check } from 'lucide-react'
import { Checkbox as BaseCheckbox } from '@base-ui-components/react/checkbox'
import { Field as BaseField } from '@base-ui-components/react/field'
import { Radio as BaseRadio } from '@base-ui-components/react/radio'
import { RadioGroup as BaseRadioGroup } from '@base-ui-components/react/radio-group'
import { Slider as BaseSlider } from '@base-ui-components/react/slider'
import { Switch as BaseSwitch } from '@base-ui-components/react/switch'
import { cn } from '../lib.ts'
import type { BaseProps } from './props.ts'

/* -------------------------------------------------------------------------- */
/* Checkbox                                                                   */
/* -------------------------------------------------------------------------- */

export function Checkbox({ className, children, ...props }: BaseProps<typeof BaseCheckbox.Root>) {
  return (
    <BaseCheckbox.Root
      className={cn(
        'flex size-4.5 shrink-0 items-center justify-center rounded-[6px] border border-border bg-card/60 text-primary-foreground outline-none transition-colors hover:border-ring/60 focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 data-[checked]:border-primary data-[checked]:bg-primary data-[indeterminate]:border-primary data-[indeterminate]:bg-primary',
        className,
      )}
      {...props}
    >
      {children ?? <BaseCheckbox.Indicator className="flex items-center justify-center">{props.indeterminate ? <span className="h-0.5 w-2 rounded-full bg-current" /> : <Check className="size-3" strokeWidth={3} />}</BaseCheckbox.Indicator>}
    </BaseCheckbox.Root>
  )
}

/* -------------------------------------------------------------------------- */
/* Radio                                                                      */
/* -------------------------------------------------------------------------- */

export function RadioGroup({ className, ...props }: BaseProps<typeof BaseRadioGroup>) {
  return <BaseRadioGroup className={cn('flex flex-col gap-2.5', className)} {...props} />
}

export function RadioGroupItem({ className, ...props }: BaseProps<typeof BaseRadio.Root>) {
  return (
    <BaseRadio.Root
      className={cn(
        'flex size-4.5 shrink-0 items-center justify-center rounded-full border border-border bg-card/60 text-primary outline-none transition-colors hover:border-ring/60 focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 data-[checked]:border-primary',
        className,
      )}
      {...props}
    >
      <BaseRadio.Indicator className="size-2 rounded-full bg-primary" />
    </BaseRadio.Root>
  )
}

/* -------------------------------------------------------------------------- */
/* Switch                                                                     */
/* -------------------------------------------------------------------------- */

export function Switch({ className, ...props }: BaseProps<typeof BaseSwitch.Root>) {
  return (
    <BaseSwitch.Root
      className={cn(
        'inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-border bg-secondary p-0.5 outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 data-[checked]:border-primary data-[checked]:bg-primary',
        className,
      )}
      {...props}
    >
      <BaseSwitch.Thumb className="size-3.5 rounded-full bg-background shadow-sm transition-transform data-[checked]:translate-x-4" />
    </BaseSwitch.Root>
  )
}

/* -------------------------------------------------------------------------- */
/* Slider                                                                     */
/* -------------------------------------------------------------------------- */

export function Slider({
  className,
  controlClassName,
  trackClassName,
  indicatorClassName,
  thumbClassName,
  defaultValue,
  value,
  showValue = false,
  ...props
}: BaseProps<typeof BaseSlider.Root> & {
  controlClassName?: string
  trackClassName?: string
  indicatorClassName?: string
  thumbClassName?: string
  /** Show the current value above the track. */
  showValue?: boolean
}) {
  const count = Array.isArray(value)
    ? value.length
    : Array.isArray(defaultValue)
      ? defaultValue.length
      : 1
  return (
    <BaseSlider.Root
      defaultValue={defaultValue}
      value={value}
      className={cn('relative flex w-full flex-col gap-2 touch-none select-none disabled:opacity-50', className)}
      {...props}
    >
      {showValue ? (
        <BaseSlider.Value className="text-sm text-muted-foreground tabular-nums" />
      ) : null}
      <BaseSlider.Control className={cn('flex w-full items-center py-2', controlClassName)}>
        <BaseSlider.Track className={cn('relative h-1.5 w-full grow overflow-hidden rounded-full bg-secondary', trackClassName)}>
          <BaseSlider.Indicator className={cn('absolute h-full bg-primary', indicatorClassName)} />
        </BaseSlider.Track>
        {Array.from({ length: count }, (_, index) => (
          <BaseSlider.Thumb
            key={index}
            className={cn('block size-4 rounded-full border border-border bg-background transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40', thumbClassName)}
          />
        ))}
      </BaseSlider.Control>
    </BaseSlider.Root>
  )
}

export function SliderValue({ className, ...props }: BaseProps<typeof BaseSlider.Value>) {
  return <BaseSlider.Value className={cn('text-sm text-muted-foreground tabular-nums', className)} {...props} />
}

/* -------------------------------------------------------------------------- */
/* Field                                                                      */
/* -------------------------------------------------------------------------- */

export function Field({ className, ...props }: BaseProps<typeof BaseField.Root>) {
  return <BaseField.Root className={cn('flex flex-col gap-1.5', className)} {...props} />
}

export function FieldLabel({ className, ...props }: BaseProps<typeof BaseField.Label>) {
  return (
    <BaseField.Label
      className={cn('text-sm font-medium leading-none text-foreground select-none', className)}
      {...props}
    />
  )
}

export function FieldDescription({ className, ...props }: BaseProps<typeof BaseField.Description>) {
  return <BaseField.Description className={cn('text-sm text-muted-foreground', className)} {...props} />
}

export function FieldError({ className, ...props }: BaseProps<typeof BaseField.Error>) {
  return <BaseField.Error className={cn('text-sm font-medium text-red-600 dark:text-red-400', className)} {...props} />
}

export function FieldControl({ className, ...props }: BaseProps<typeof BaseField.Control>) {
  return (
    <BaseField.Control
      className={cn(
        'flex h-9 w-full rounded-md border border-border bg-card/60 px-3.5 py-1 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:opacity-50 data-[invalid]:border-red-500/60',
        className,
      )}
      {...props}
    />
  )
}

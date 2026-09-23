import type * as React from 'react'
import type { StyleXStyles } from '@stylexjs/stylex'

/**
 * Composed after the component's own base and variant styles, per property.
 * The only styling escape hatch: no `className`, no inline `style`.
 */
export interface StyleProps {
  xstyle?: StyleXStyles
}

/**
 * Native element props without the string-based styling escape hatches. Works
 * for intrinsic elements and for react-aria-components, whose `className`/
 * `style` slots novon components never expose.
 */
export type ElementProps<T extends React.ElementType> = Omit<React.ComponentProps<T>, 'className' | 'style'>

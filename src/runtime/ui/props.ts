import type * as React from 'react'
import type { StyleProps } from '../design-system/props.ts'

/**
 * Base UI accepts `className` and `style` as functions of component state.
 * novon components always pass compiled StyleX props instead, so both are
 * dropped from the public surface; `render` and state props remain.
 */
export type BaseProps<T extends React.ElementType> = Omit<React.ComponentProps<T>, 'className' | 'style'> & StyleProps

import type * as React from 'react'

/**
 * Base UI accepts `className` and `style` as functions of component state. The
 * wrappers in this folder merge a base class with the caller's, so they narrow
 * both back to plain values.
 */
export type BaseProps<T extends React.ElementType> = Omit<React.ComponentProps<T>, 'className' | 'style'> & {
  className?: string
  style?: React.CSSProperties
}

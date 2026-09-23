import type * as React from 'react'
import type { StyleXStyles } from '@stylexjs/stylex'
import type { ElementProps, StyleProps } from '../design-system/props.ts'

/**
 * Wrapper types for the behavior layer (react-aria-components). novon passes
 * compiled StyleX props instead of `className`/`style`, so both are dropped
 * from the public surface; link and state props remain.
 */
export type BaseProps<T extends React.ElementType> = ElementProps<T> & StyleProps

/** Element props plus `xstyle`, for parts that render a specific tag. */
export type PartProps<T extends React.ElementType> = ElementProps<T> & StyleProps
export type { StyleXStyles }

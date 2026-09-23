import * as stylex from '@stylexjs/stylex'
import { type } from './tokens.stylex.ts'

/**
 * Type roles. Semantic tags stay the caller's job; these only set the visual
 * treatment. Compose at most one size role with at most one weight role.
 */
export const typography = stylex.create({
  /** The one page-defining statement. */
  pageTitle: {
    fontFamily: type.sans,
    fontSize: type.pageTitle,
    fontWeight: type.semibold,
    lineHeight: type.displayLeading,
    letterSpacing: type.tightTracking,
    textWrap: 'balance',
  },
  /** Article and generated-page titles. */
  title: {
    fontFamily: type.sans,
    fontSize: type.title,
    fontWeight: type.medium,
    lineHeight: type.titleLeading,
    letterSpacing: type.tightTracking,
    textWrap: 'balance',
  },
  /** Section turns and nested structure. */
  heading: {
    fontFamily: type.sans,
    fontSize: type.heading,
    fontWeight: type.medium,
    lineHeight: type.headingLeading,
    letterSpacing: '-0.01em',
    textWrap: 'balance',
  },
  /** One short orientation passage under a title. */
  lede: {
    fontFamily: type.sans,
    fontSize: type.heading,
    fontWeight: type.regular,
    lineHeight: type.compactLeading,
  },
  /** Strong reading text and card titles. */
  bodyStrong: {
    fontFamily: type.sans,
    fontSize: type.body,
    fontWeight: type.semibold,
    lineHeight: type.compactLeading,
    letterSpacing: '-0.01em',
  },
  body: {
    fontFamily: type.sans,
    fontSize: type.body,
    fontWeight: type.regular,
    lineHeight: type.bodyLeading,
  },
  /** Controls, navigation and dense labels. */
  label: {
    fontFamily: type.sans,
    fontSize: type.label,
    fontWeight: type.medium,
    lineHeight: type.compactLeading,
  },
  /** Compact descriptive text. */
  labelRegular: {
    fontFamily: type.sans,
    fontSize: type.label,
    fontWeight: type.regular,
    lineHeight: type.compactLeading,
  },
  /** Subordinate status text and small titles. */
  caption: {
    fontFamily: type.sans,
    fontSize: type.caption,
    fontWeight: type.medium,
    lineHeight: type.compactLeading,
  },
  captionRegular: {
    fontFamily: type.sans,
    fontSize: type.caption,
    fontWeight: type.regular,
    lineHeight: type.compactLeading,
  },
  /** Deep outline levels. */
  micro: {
    fontFamily: type.sans,
    fontSize: type.micro,
    fontWeight: type.regular,
    lineHeight: type.compactLeading,
  },
  /** Short operational identifiers: keys, commands, inline code. */
  code: {
    fontFamily: type.mono,
    fontSize: type.caption,
    fontWeight: type.medium,
    lineHeight: type.compactLeading,
  },
})

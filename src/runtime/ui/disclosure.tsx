/**
 * Disclosure for reading: accordions and tabs.
 */
import * as stylex from '@stylexjs/stylex'
import { Accordion as BaseAccordion } from '@base-ui-components/react/accordion'
import { Tabs as BaseTabs } from '@base-ui-components/react/tabs'
import { colors, radii, space, type } from '../design-system/tokens.stylex.ts'
import { typography } from '../design-system/typography.ts'
import type { ElementProps, StyleProps } from '../design-system/props.ts'
import type { BaseProps } from './props.ts'

const styles = stylex.create({
  group: {
    marginBlock: space.six,
    borderRadius: radii.large,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSoft,
  },
  item: {
    paddingBlock: 0,
    borderTopWidth: { default: 0, ':not(:first-child)': 1 },
    borderTopStyle: 'solid',
    borderTopColor: colors.border,
  },
  trigger: {
    display: 'flex',
    width: '100%',
    flex: 1,
    alignItems: 'center',
    gap: space.two,
    paddingInline: space.four,
    paddingBlock: space.three,
    textAlign: 'start',
    fontSize: type.label,
    fontWeight: type.medium,
    lineHeight: type.compactLeading,
    color: colors.text,
    outline: 'none',
    cursor: 'pointer',
    backgroundColor: { default: 'transparent', ':hover': colors.hoverSoft, ':focus-visible': colors.hoverSoft },
    transitionProperty: 'color, background-color',
    transitionDuration: '150ms',
  },
  chevron: {
    width: space.four,
    height: space.four,
    flexShrink: 0,
    color: colors.mutedText,
    transform: { default: 'none', ':where([data-panel-open] *)': 'rotate(90deg)' },
    transitionProperty: 'transform',
    transitionDuration: '200ms',
  },
  triggerLabel: { minWidth: 0, flex: 1 },
  panel: {
    overflow: 'hidden',
    color: colors.mutedText,
    height: { '[data-starting-style]': 0, '[data-ending-style]': 0 },
    transitionProperty: 'height',
    transitionDuration: '200ms',
  },
  accordionGroup: { marginBlock: space.six },

  tabs: { marginBlock: space.six },
  tabsList: {
    display: 'inline-flex',
    maxWidth: '100%',
    alignItems: 'center',
    gap: space.half,
    overflowX: 'auto',
    borderRadius: radii.surface,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    padding: space.one,
  },
  tab: {
    flexShrink: 0,
    borderRadius: radii.control,
    paddingInline: space.three,
    paddingBlock: space.oneHalf,
    fontSize: type.label,
    fontWeight: type.medium,
    lineHeight: type.compactLeading,
    outline: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    backgroundColor: { default: 'transparent', '[data-active]': colors.hover, ':hover': colors.hoverSoft },
    color: { default: colors.mutedText, '[data-active]': colors.text, ':hover': colors.text },
    transitionProperty: 'color, background-color',
    transitionDuration: '150ms',
  },
  tabPanel: { paddingBlockStart: space.four, outline: 'none' },
})

/* -------------------------------------------------------------------------- */
/* Accordion                                                                  */
/* -------------------------------------------------------------------------- */

export function Accordion({ xstyle, ...props }: BaseProps<typeof BaseAccordion.Root>) {
  return <BaseAccordion.Root {...props} {...stylex.props(styles.group, styles.accordionGroup, xstyle)} />
}

export function AccordionItem({ xstyle, ...props }: BaseProps<typeof BaseAccordion.Item>) {
  return <BaseAccordion.Item {...props} {...stylex.props(styles.item, xstyle)} />
}

export function AccordionTrigger({ xstyle, children, ...props }: BaseProps<typeof BaseAccordion.Trigger>) {
  return (
    // The marker is a zero-declaration content boundary, so it never competes
    // with the compiled styles on the trigger below it.
    <BaseAccordion.Header className="novon-not-prose">
      <BaseAccordion.Trigger {...props} {...stylex.props(styles.trigger, typography.label, xstyle)}>
        <svg aria-hidden="true" viewBox="0 0 16 16" {...stylex.props(styles.chevron)}>
          <path
            d="M6 4l4 4-4 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span {...stylex.props(styles.triggerLabel)}>{children}</span>
      </BaseAccordion.Trigger>
    </BaseAccordion.Header>
  )
}

export function AccordionPanel({ xstyle, ...props }: BaseProps<typeof BaseAccordion.Panel>) {
  return <BaseAccordion.Panel {...props} {...stylex.props(styles.panel, typography.labelRegular, xstyle)} />
}

export const AccordionGroup = ({ xstyle, ...props }: ElementProps<'div'> & StyleProps) => (
  <div {...props} {...stylex.props(styles.accordionGroup, xstyle)} />
)

/* -------------------------------------------------------------------------- */
/* Tabs                                                                       */
/* -------------------------------------------------------------------------- */

export function Tabs({ xstyle, ...props }: BaseProps<typeof BaseTabs.Root>) {
  return <BaseTabs.Root {...props} {...stylex.props(styles.tabs, xstyle)} />
}

export function TabsList({ xstyle, ...props }: BaseProps<typeof BaseTabs.List>) {
  return <BaseTabs.List {...props} {...stylex.props(styles.tabsList, xstyle)} />
}

export function TabsTrigger({ xstyle, ...props }: BaseProps<typeof BaseTabs.Tab>) {
  return <BaseTabs.Tab {...props} {...stylex.props(styles.tab, xstyle)} />
}

export function TabsContent({ xstyle, ...props }: BaseProps<typeof BaseTabs.Panel>) {
  return <BaseTabs.Panel {...props} {...stylex.props(styles.tabPanel, xstyle)} />
}


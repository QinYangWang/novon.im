/**
 * Disclosure for reading: accordions and tabs.
 *
 * Both families are conductors: the novon parts (`AccordionItem`, `TabsTrigger`,
 * …) are declarative markers, and the component re-emits real
 * react-aria-components elements so the collection, keyboard model and ARIA all
 * come from the behavior layer.
 */
import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import {
  Button as AriaButton,
  Disclosure,
  DisclosureGroup,
  DisclosurePanel,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs as AriaTabs,
} from 'react-aria-components'
import { colors, elevation, radii, space } from '../design-system/tokens.stylex.ts'
import { typography } from '../design-system/typography.ts'
import type { StyleXStyles } from '@stylexjs/stylex'
import type { ElementProps, StyleProps } from '../design-system/props.ts'
import { Icon, type IconProps } from '../icons.tsx'
import { surface } from '../design-system/surfaces.ts'

const styles = stylex.create({
  /* Accordion */
  group: {
    marginBlock: space.six,
    padding: space.half,
  },
  item: {
    borderTopWidth: { default: 0, ':not(:first-child)': 1 },
    borderTopStyle: 'solid',
    borderTopColor: colors.border,
  },
  trigger: {
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    gap: space.two,
    paddingInline: space.four,
    paddingBlock: space.three,
    textAlign: 'start',
    backgroundColor: { default: 'transparent', ':hover': colors.raisedHover, ':focus-visible': colors.raisedHover },
    color: { default: colors.mutedText, ':hover': colors.text },
    transitionProperty: 'color, background-color',
    transitionDuration: '150ms',
  },
  chevron: {
    width: space.four,
    height: space.four,
    flexShrink: 0,
    color: colors.mutedText,
    transform: 'rotate(0deg)',
    transitionProperty: 'transform',
    transitionDuration: '200ms',
    transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
  },
  chevronOpen: { transform: 'rotate(90deg)' },
  triggerLabel: { minWidth: 0, flex: 1 },
  panel: {
    color: colors.mutedText,
    paddingInline: space.four,
    paddingBlockEnd: space.three,
  },
  accordionGroup: { marginBlock: space.six },

  /* Tabs */
  tabs: { marginBlock: space.six, padding: space.two },
  tabsBox: { position: 'relative' },
  tabsList: {
    display: 'inline-flex',
    maxWidth: '100%',
    alignItems: 'center',
    gap: space.half,
    overflowX: 'auto',
    padding: space.one,
  },
  // The selected segment lifts white off the gray track.
  // insetInlineStart: 0 is load-bearing: without it the absolute pill lands on
  // its static position and translateX double-counts the row's padding.
  tabIndicator: (left: number, width: number) => ({
    position: 'absolute',
    insetInlineStart: 0,
    top: space.one,
    bottom: space.one,
    borderRadius: radii.control,
    backgroundColor: colors.popover,
    boxShadow: elevation.low,
    transform: `translateX(${left}px)`,
    width,
  }),
  tabIndicatorMotion: {
    transitionProperty: 'transform, width, opacity',
    transitionDuration: '220ms',
    transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
  },
  tab: {
    position: 'relative',
    flexShrink: 0,
    borderRadius: radii.control,
    paddingInline: space.three,
    paddingBlock: space.oneHalf,
    outline: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    backgroundColor: { default: 'transparent', ':hover': colors.raisedHover },
    color: { default: colors.mutedText, '[aria-selected="true"]': colors.text, ':hover': colors.text },
    transitionProperty: 'color, background-color',
    transitionDuration: '150ms',
  },
  tabPanel: {
    paddingBlockStart: space.three,
    paddingInline: space.three,
    outline: 'none',
  },
})

/* -------------------------------------------------------------------------- */
/* Accordion                                                                  */
/* -------------------------------------------------------------------------- */

type AccordionItemSpec = {
  key: string
  trigger: React.ReactNode
  panel: React.ReactNode
  triggerXstyle?: StyleXStyles
  panelXstyle?: StyleXStyles
}

function isMarker(child: React.ReactNode, marker: unknown): child is React.ReactElement<Record<string, unknown>> {
  return React.isValidElement(child) && (child.type as unknown) === marker
}

function collectAccordion(children: React.ReactNode, out: AccordionItemSpec[] = []): AccordionItemSpec[] {
  for (const child of React.Children.toArray(children)) {
    if (!React.isValidElement(child)) continue
    if (isMarker(child, AccordionItem)) {
      const props = child.props as {
        value?: string
        xstyle?: StyleXStyles
        children?: React.ReactNode
        title?: React.ReactNode
        icon?: IconProps['icon']
      }
      const inner = React.Children.toArray(props.children)
      const trigger = inner.find((node) => isMarker(node, AccordionTrigger)) as React.ReactElement<Record<string, unknown>> | undefined
      const panel = inner.find((node) => isMarker(node, AccordionPanel)) as React.ReactElement<Record<string, unknown>> | undefined
      // Two item shapes: low-level (trigger/panel markers) and the title/icon
      // shape MDX's Accordion alias passes straight through.
      const titled = props.title != null
        ? <>{props.icon ? <Icon icon={props.icon} /> : null}{props.title}</>
        : null
      out.push({
        key: String(props.value ?? out.length),
        trigger: (trigger?.props.children ?? titled) as React.ReactNode,
        panel: (panel?.props.children ?? (titled ? props.children : null)) as React.ReactNode,
        triggerXstyle: trigger?.props.xstyle as StyleXStyles | undefined,
        panelXstyle: panel?.props.xstyle as StyleXStyles | undefined,
      })
      continue
    }
    collectAccordion((child.props as { children?: React.ReactNode }).children, out)
  }
  return out
}

export type AccordionProps = StyleProps & {
  /** Expanded item values. Controlled; pair with `onValueChange`. */
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  children?: React.ReactNode
}

/** A group of disclosures. Its children are `AccordionItem` markers. */
export function Accordion({ value, defaultValue, onValueChange, children, xstyle, ...props }: AccordionProps & Omit<ElementProps<'div'>, 'children'>) {
  const items = collectAccordion(children)
  return (
    <DisclosureGroup
      {...(props as object)}
      expandedKeys={value}
      defaultExpandedKeys={defaultValue}
      onExpandedChange={(keys) => onValueChange?.([...keys].map(String))}
      allowsMultipleExpanded
      {...stylex.props(surface.raised, styles.group, styles.accordionGroup, xstyle)}
    >
      {items.map((item) => (
        <Disclosure key={item.key} id={item.key}>
          {({ isExpanded }) => (
            <>
              {/* The marker is a zero-declaration content boundary. */}
              <Heading className="novon-not-prose">
                <AriaButton slot="trigger" {...stylex.props(styles.trigger, typography.label, item.triggerXstyle)}>
                  <span {...stylex.props(styles.chevron, isExpanded && styles.chevronOpen)}>
                    <svg viewBox="0 0 16 16" width={16} height={16} aria-hidden="true" focusable="false">
                      <path
                        d="M6 4l4 4-4 4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span {...stylex.props(styles.triggerLabel)}>{item.trigger}</span>
                </AriaButton>
              </Heading>
              <DisclosurePanel {...stylex.props(styles.panel, typography.labelRegular, item.panelXstyle)}>
                {item.panel}
              </DisclosurePanel>
            </>
          )}
        </Disclosure>
      ))}
    </DisclosureGroup>
  )
}

/** Marker: one collapsible item inside `Accordion`. */
export function AccordionItem(
  _props: ElementProps<'div'> & StyleProps & { value?: string; title?: React.ReactNode; icon?: IconProps['icon'] },
) {
  return null
}

/** Marker: the trigger row of an `AccordionItem`. */
export function AccordionTrigger(_props: ElementProps<'button'> & StyleProps) {
  return null
}

/** Marker: the panel of an `AccordionItem`. */
export function AccordionPanel(_props: ElementProps<'div'> & StyleProps) {
  return null
}

export const AccordionGroup = ({ xstyle, ...props }: ElementProps<'div'> & StyleProps) => (
  <div {...props} {...stylex.props(styles.accordionGroup, xstyle)} />
)

/* -------------------------------------------------------------------------- */
/* Tabs                                                                       */
/* -------------------------------------------------------------------------- */

type TabSpec = {
  key: string
  title: React.ReactNode
  panel: React.ReactNode
  disabled?: boolean
  triggerXstyle?: StyleXStyles
  panelXstyle?: StyleXStyles
}

function collectTabs(children: React.ReactNode): TabSpec[] {
  const specs = new Map<string, TabSpec>()
  const order: string[] = []
  const visit = (nodes: React.ReactNode) => {
    for (const child of React.Children.toArray(nodes)) {
      if (!React.isValidElement(child)) continue
      const props = child.props as { value?: string; children?: React.ReactNode; disabled?: boolean; xstyle?: StyleXStyles }
      if (isMarker(child, TabsTrigger)) {
        const key = String(props.value ?? specs.size)
        specs.set(key, { key, title: props.children, panel: null, disabled: props.disabled, triggerXstyle: props.xstyle })
        order.push(key)
        continue
      }
      if (isMarker(child, TabsContent)) {
        const key = String(props.value ?? specs.size)
        const existing = specs.get(key) ?? { key, title: key, panel: null }
        specs.set(key, { ...existing, panel: props.children, panelXstyle: props.xstyle })
        if (!order.includes(key)) order.push(key)
        continue
      }
      visit((child.props as { children?: React.ReactNode }).children)
    }
  }
  visit(children)
  return order.map((key) => specs.get(key)!)
}

export type TabsProps = StyleProps & {
  /** Selected tab value. Controlled; pair with `onValueChange`. */
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  label?: string
  children?: React.ReactNode
}

/** Tabbed content. Its children are `TabsList` / `TabsContent` markers. */
export function Tabs({ value, defaultValue, onValueChange, label = 'Tabs', children, xstyle, ...props }: TabsProps & Omit<ElementProps<'div'>, 'children'>) {
  const specs = collectTabs(children)
  const listRef = React.useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = React.useState<{ left: number; width: number } | null>(null)

  // One indicator shared across tabs: measured like PillNav's, then kept in
  // step with selection through the attributes react-aria sets.
  React.useEffect(() => {
    const box = listRef.current
    if (!box) return
    const measure = () => {
      const active = box.querySelector<HTMLElement>('[aria-selected="true"]')
      if (!active) {
        setIndicator(null)
        return
      }
      setIndicator((previous) =>
        previous && previous.left === active.offsetLeft && previous.width === active.offsetWidth
          ? previous
          : { left: active.offsetLeft, width: active.offsetWidth },
      )
    }
    measure()
    const resize = new ResizeObserver(measure)
    resize.observe(box)
    const mutations = new MutationObserver(measure)
    mutations.observe(box, { attributes: true, subtree: true, attributeFilter: ['aria-selected'] })
    return () => {
      resize.disconnect()
      mutations.disconnect()
    }
  }, [])

  return (
    <AriaTabs
      {...(props as object)}
      selectedKey={value}
      defaultSelectedKey={defaultValue}
      onSelectionChange={(key) => onValueChange?.(String(key))}
      {...stylex.props(surface.raised, styles.tabs, xstyle)}
    >
      <div ref={listRef} {...stylex.props(styles.tabsBox)}>
        {indicator ? (
          <span aria-hidden="true" {...stylex.props(styles.tabIndicatorMotion, styles.tabIndicator(indicator.left, indicator.width))} />
        ) : null}
        <TabList aria-label={label} {...stylex.props(styles.tabsList)}>
          {specs.map((spec) => (
            <Tab key={spec.key} id={spec.key} isDisabled={spec.disabled} {...stylex.props(styles.tab, typography.label, spec.triggerXstyle)}>
              {spec.title}
            </Tab>
          ))}
        </TabList>
      </div>
      <TabPanels>
        {specs.map((spec) => (
          <TabPanel key={spec.key} id={spec.key} {...stylex.props(styles.tabPanel, spec.panelXstyle)}>
            {spec.panel}
          </TabPanel>
        ))}
      </TabPanels>
    </AriaTabs>
  )
}

/** Marker: the tab row of `Tabs`. Its children are `TabsTrigger` markers. */
export function TabsList(_props: ElementProps<'div'> & StyleProps & { children?: React.ReactNode }) {
  return null
}

/** Marker: one tab of `Tabs`. `value` matches its `TabsContent`. */
export function TabsTrigger(_props: { value?: string; disabled?: boolean; children?: React.ReactNode; xstyle?: StyleXStyles }) {
  return null
}

/** Marker: one panel of `Tabs`. */
export function TabsContent(_props: { value?: string; children?: React.ReactNode; xstyle?: StyleXStyles }) {
  return null
}

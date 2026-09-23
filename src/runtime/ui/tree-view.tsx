/**
 * Tree view — a disclosure tree the arrow keys can walk.
 *
 * Rows follow the ARIA tree pattern: a roving tab stop, arrow-key navigation,
 * expandable branches and typeahead. The state logic is exported headless as
 * `useTreeView`, so a custom theme can render its own rows.
 */
import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import { colors, elevation, radii, space } from '../design-system/tokens.stylex.ts'
import { typography } from '../design-system/typography.ts'
import { behavior } from '../design-system/behaviors.ts'
import { surface } from '../design-system/surfaces.ts'
import type { StyleXStyles } from '@stylexjs/stylex'

export type TreeNode = {
  id: string
  label: string
  /** Small mono readout shown after the label: a count, a size, a status. */
  meta?: string
  children?: TreeNode[]
}

export type TreeRow = {
  node: TreeNode
  level: number
  parentId: string | null
  posinset: number
  setsize: number
  branch: boolean
  open: boolean
}

function flatten(
  nodes: TreeNode[],
  openSet: ReadonlySet<string>,
  level = 1,
  parentId: string | null = null,
  out: TreeRow[] = [],
): TreeRow[] {
  nodes.forEach((node, index) => {
    const children = node.children ?? []
    const branch = children.length > 0
    const open = branch && openSet.has(node.id)
    out.push({ node, level, parentId, posinset: index + 1, setsize: nodes.length, branch, open })
    if (open) flatten(children, openSet, level + 1, node.id, out)
  })
  return out
}

export type UseTreeViewOptions = {
  nodes: TreeNode[]
  expanded?: string[]
  defaultExpanded?: string[]
  onExpandedChange?: (expanded: string[]) => void
  selected?: string | null
  defaultSelected?: string | null
  onSelectedChange?: (selected: string) => void
}

/** Headless tree state: selection, expansion, roving focus and keyboard rules. */
export function useTreeView({
  nodes,
  expanded,
  defaultExpanded = [],
  onExpandedChange,
  selected,
  defaultSelected = null,
  onSelectedChange,
}: UseTreeViewOptions) {
  const [internalOpen, setInternalOpen] = React.useState<string[]>(defaultExpanded)
  const openControlled = expanded !== undefined
  const openList = openControlled ? expanded : internalOpen
  const openSet = new Set(openList)

  const [internalSelected, setInternalSelected] = React.useState<string | null>(defaultSelected)
  const selectedControlled = selected !== undefined
  const selectedId = selectedControlled ? selected : internalSelected

  const emitExpanded = React.useRef(onExpandedChange)
  emitExpanded.current = onExpandedChange
  const emitSelected = React.useRef(onSelectedChange)
  emitSelected.current = onSelectedChange

  const rows = flatten(nodes, openSet)

  const [focusId, setFocusId] = React.useState<string | null>(null)
  const tabStop =
    focusId !== null && rows.some((row) => row.node.id === focusId)
      ? focusId
      : (rows.find((row) => row.node.id === selectedId)?.node.id ?? rows[0]?.node.id ?? null)

  const refs = React.useRef(new Map<string, HTMLElement>())
  const register = React.useCallback((id: string, element: HTMLElement | null) => {
    if (element) refs.current.set(id, element)
    else refs.current.delete(id)
  }, [])

  const focusRow = React.useCallback((id: string) => {
    setFocusId(id)
    refs.current.get(id)?.focus()
  }, [])

  const setOpen = React.useCallback(
    (next: string[]) => {
      if (!openControlled) setInternalOpen(next)
      emitExpanded.current?.(next)
    },
    [openControlled],
  )

  const toggle = React.useCallback(
    (id: string) => {
      const has = openList.includes(id)
      setOpen(has ? openList.filter((value) => value !== id) : [...openList, id])
    },
    [openList, setOpen],
  )

  const select = React.useCallback(
    (id: string) => {
      if (!selectedControlled) setInternalSelected(id)
      emitSelected.current?.(id)
    },
    [selectedControlled],
  )

  const handleKey = React.useCallback(
    (event: React.KeyboardEvent, row: TreeRow) => {
      const at = rows.findIndex((candidate) => candidate.node.id === row.node.id)
      const go = (index: number) => {
        const target = rows[index]
        if (target) focusRow(target.node.id)
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          go(at + 1)
          return
        case 'ArrowUp':
          event.preventDefault()
          go(at - 1)
          return
        case 'ArrowRight':
          event.preventDefault()
          if (row.branch && !row.open) toggle(row.node.id)
          else if (row.open) go(at + 1)
          return
        case 'ArrowLeft':
          event.preventDefault()
          if (row.open) toggle(row.node.id)
          else if (row.parentId) focusRow(row.parentId)
          return
        case 'Home':
          event.preventDefault()
          go(0)
          return
        case 'End':
          event.preventDefault()
          go(rows.length - 1)
          return
        case 'Enter':
        case ' ':
          event.preventDefault()
          select(row.node.id)
          if (row.branch) toggle(row.node.id)
          return
        default:
      }

      // Typeahead: jump to the next visible name starting with the letter.
      if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const letter = event.key.toLowerCase()
        if (letter === ' ') return
        for (let step = 1; step <= rows.length; step += 1) {
          const candidate = rows[(at + step) % rows.length]
          if (candidate.node.label.toLowerCase().startsWith(letter)) {
            event.preventDefault()
            focusRow(candidate.node.id)
            return
          }
        }
      }
    },
    [rows, focusRow, toggle, select],
  )

  return {
    rows,
    openSet,
    selectedId,
    tabStop,
    register,
    focusRow,
    setFocusId,
    toggle,
    select,
    handleKey,
  }
}

const open = stylex.keyframes({
  from: { opacity: 0, transform: 'translateY(-4px)' },
  to: { opacity: 1, transform: 'none' },
})

const styles = stylex.create({
  panel: {
    padding: space.one,
  },
  tree: { listStyle: 'none', margin: 0, padding: 0 },
  row: {
    display: 'flex',
    minHeight: space.seven,
    alignItems: 'center',
    gap: space.one,
    paddingInline: space.oneHalf,
    borderRadius: radii.control,
    cursor: 'default',
    userSelect: 'none',
    color: { default: colors.mutedText, ':hover': colors.text },
    backgroundColor: { default: 'transparent', ':hover': colors.raisedHover },
    transitionProperty: 'color, background-color, box-shadow',
    transitionDuration: '150ms',
  },
  rowSelected: {
    fontWeight: 500,
    color: colors.text,
    backgroundColor: colors.raisedStrong,
    boxShadow: elevation.press,
    ':hover': { backgroundColor: colors.raisedStrong },
  },
  caretSlot: {
    display: 'flex',
    width: space.four,
    height: space.four,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.mutedText,
    transform: 'rotate(0deg)',
    transitionProperty: 'transform',
    transitionDuration: '200ms',
    transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
  },
  caretOpen: { transform: 'rotate(90deg)' },
  label: {
    minWidth: 0,
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  meta: {
    flexShrink: 0,
    fontVariantNumeric: 'tabular-nums',
  },
  group: {
    listStyle: 'none',
    margin: 0,
    marginInlineStart: space.three,
    padding: 0,
    paddingInlineStart: space.two,
    borderInlineStartWidth: 1,
    borderInlineStartStyle: 'solid',
    borderInlineStartColor: colors.border,
    overflow: 'hidden',
    animationName: open,
    animationDuration: '180ms',
    animationTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
  },
})

export type TreeViewProps = UseTreeViewOptions & {
  /** Accessible name for the tree. */
  label: string
  xstyle?: StyleXStyles
}

export function TreeView({
  nodes,
  label,
  expanded,
  defaultExpanded,
  onExpandedChange,
  selected,
  defaultSelected,
  onSelectedChange,
  xstyle,
}: TreeViewProps) {
  const tree = useTreeView({
    nodes,
    expanded,
    defaultExpanded,
    onExpandedChange,
    selected,
    defaultSelected,
    onSelectedChange,
  })
  const hintId = React.useId()

  const renderNodes = (list: TreeNode[], level: number): React.ReactNode =>
    list.map((node) => {
      const row = tree.rows.find((candidate) => candidate.node.id === node.id)
      if (!row) return null
      const isSelected = tree.selectedId === node.id

      return (
        <li key={node.id} role="none">
          <div
            role="treeitem"
            ref={(element) => tree.register(node.id, element)}
            aria-level={level}
            aria-posinset={row.posinset}
            aria-setsize={row.setsize}
            aria-expanded={row.branch ? row.open : undefined}
            aria-selected={isSelected}
            aria-describedby={hintId}
            tabIndex={tree.tabStop === node.id ? 0 : -1}
            onFocus={() => tree.setFocusId(node.id)}
            onKeyDown={(event) => tree.handleKey(event, row)}
            onClick={() => {
              tree.select(node.id)
              tree.focusRow(node.id)
              if (row.branch) tree.toggle(node.id)
            }}
            {...stylex.props(
              typography.labelRegular,
              styles.row,
              isSelected && styles.rowSelected,
            )}
          >
            {row.branch ? (
              <span {...stylex.props(styles.caretSlot, row.open && styles.caretOpen)}>
                <svg viewBox="0 0 12 12" width={10} height={10} focusable="false" aria-hidden="true">
                  <path
                    d="M4.5 2.5 8 6l-3.5 3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            ) : (
              <span {...stylex.props(styles.caretSlot)} />
            )}

            <span {...stylex.props(styles.label)}>{node.label}</span>

            {node.meta ? <span {...stylex.props(styles.meta, typography.code)}>{node.meta}</span> : null}
          </div>

          {row.branch && row.open ? (
            <ul role="group" {...stylex.props(styles.group)}>
              {renderNodes(node.children ?? [], level + 1)}
            </ul>
          ) : null}
        </li>
      )
    })

  return (
    <div {...stylex.props(surface.raisedLift, styles.panel, xstyle)}>
      <ul role="tree" aria-label={label} {...stylex.props(styles.tree)}>
        {renderNodes(nodes, 1)}
      </ul>
      <span id={hintId} {...stylex.props(behavior.visuallyHidden)}>
        Use the arrow keys to move. Right expands a folder, left collapses it or
        climbs to its parent. Home and End jump to the ends, and typing a letter
        jumps to the next name starting with it.
      </span>
    </div>
  )
}

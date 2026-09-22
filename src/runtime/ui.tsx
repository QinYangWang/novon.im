/**
 * shadcn/ui-style primitives built on Base UI.
 *
 * These are the same components novon uses for its own chrome, exported so a site
 * can reuse them in MDX, custom pages or its own theme overrides:
 *
 * ```mdx
 * import { Button, Card } from 'novon'
 * ```
 *
 * The implementation is split by role:
 *
 * - `ui/core.tsx` — buttons, cards, fields, tables, feedback and layout bits
 * - `ui/forms.tsx` — checkbox, radio, switch, slider, field
 * - `ui/disclosure.tsx` — accordion, tabs, collapsible
 * - `ui/overlays.tsx` — dialog, sheet, popover, tooltip, hover card, menus, select
 * - `ui/toast.tsx` — the toast store and `<Toaster />`
 */
export * from './ui/core.tsx'
export * from './ui/forms.tsx'
export * from './ui/disclosure.tsx'
export * from './ui/overlays.tsx'
export * from './ui/toast.tsx'

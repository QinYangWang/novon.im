---
name: novon-design-system
description: Use when creating or modifying React/MDX components in novon. Covers StyleX compilation, semantic tokens, Geist type roles, the xstyle composition contract, accessibility and test gates; also for theme, variant and design-system work.
---

# novon component and StyleX workflow

Every novon component is **StyleX-only**: the single styling extension point is
the typed `xstyle` prop. There is no `className`/utility layer and no Tailwind.
Your job is to make new components belong to the same design system, not to
introduce another way of styling.

## Read first

1. The [design system guide](../../../docs/content/guide/design-system.mdx) is
   the source of truth for design roles, theme, the API contract and build
   invariants.
2. Read the component under change, its consumers and the public exports, plus:
   - `src/runtime/design-system/tokens.stylex.ts` (color/space/type/media)
   - `src/runtime/design-system/typography.ts` (type roles)
   - `src/runtime/design-system/behaviors.ts` (scrollbars, sr-only, skip link)
   - `src/runtime/design-system/props.ts` (`StyleProps`, `ElementProps`)
3. Use `src/runtime/ui/badge.tsx` (variants) and `src/runtime/ui/kbd.tsx`
   (type roles) as small references; `src/runtime/ui/disclosure.tsx` covers
   `[data-*]` state conditions and `src/runtime/ui/overlays.tsx` covers
   starting/ending transitions.
4. Before touching the compiler or a new StyleX API, re-read the
   [StyleX LLM resources](https://stylexjs.com/docs/llm-resources) and the
   installed `node_modules/@stylexjs/unplugin/README.md` with its types.
5. Design comes from [Vercel design.md](https://vercel.com/design.md):
   content-first, restrained surfaces. novon is not a Vercel-authored report: no
   Vercel marks, no `vbg-*`, no removal of the existing theme-switch API.

## Declare the scope first

Name the target component, its call sites, behavior to keep, visual changes
allowed and the pages that verify it. Audit with:

```sh
rg 'ComponentName|xstyle' src docs/content templates tests
rg 'data-|aria-|render=|ref=' src/runtime/ui src/runtime/kit.tsx src/runtime/mdx.tsx
```

Never edit `docs/dist`, `docs/.novon`, generated example output or node_modules.

## Styling rules

- Import `* as stylex from '@stylexjs/stylex'`; define styles with
  `stylex.create` at module scope, never inside render.
- Read `colors` for color, `space` for spacing and geometry, `radii` for radii,
  `typography` for type. Missing a role? Extend the tokens first (verify both
  themes and contrast), then write the component. No raw colors.
- Cross-file values come only from direct imports of `.stylex.ts` named exports
  (`defineConsts`/`defineVars`), never through a barrel. Token `var(...)`
  references resolve at the consumer; do not re-wrap them in `defineVars`.
- Pseudo-classes and media queries nest inside property values with a `default`
  key. A top-level `':hover'`/`@media` object is a compile error. Arbitrary
  selector keys (`'[data-active]'`, `':not(:last-child)'`,
  `':where([data-panel-open] *)'`) compile to `.x<selector>` and are the
  sanctioned way to express DOM state and limited descendant scope.
- Spread `stylex.props(...)` exactly once per element, after `...props`.
  Composition order is type/base → variant → `xstyle`, last writer per property;
  callers extend with arrays (`xstyle={[a, b]}`).
- Runtime values use dynamic styles:
  `stylex.create({ sized: (n: number) => ({ width: n, height: n }) })`. Keep the
  generated inline CSS variables intact.
- Theme-conditional non-color styles (image swap, inversion) consume `theme.*`
  from the tokens file. Never write `[data-theme]` selectors in components.
- Content CSS hooks (`novon-prose`, `novon-not-prose`, `novon-table`,
  `novon-code-wrap`) belong to `theme.css`'s content layer. `novon-not-prose` is
  a zero-declaration boundary marker: put it on a plain wrapper element, never
  mixed with compiled styles on the same element.
- Avoid descendant selectors. Simplify the design first (for example, show a
  hidden-on-hover control permanently); only then consider an attribute-anchored
  selector such as `':where([data-copy-host]:hover *)'`.
- Never call StyleX compile APIs from `.mdx`. Write a TSX component and register
  it through `components`. MDX examples use `Stack`/`Cluster`/`CardGroup`/
  `Columns`, semantic props (`size`/`numeric`/`fill`) and plain-element `style`.

## Creating a component

1. Check for an existing primitive first; near-duplicate components are debt.
2. Pick semantic elements and behavior primitives: native or Base UI before any
   custom focus management.
3. Props keep native attributes, ref, aria/data and events via `ElementProps<T>`
   (already minus `className`/`style`); expose `xstyle?: StyleXStyles`. Narrow
   overridable properties with `StyleXStyles<{...}>` when warranted.
4. Variants are a finite union mapped to static `stylex.create` namespaces.
   Define `null` semantics explicitly (e.g. Badge `variant={null}` = no tone).
5. Export from `ui.tsx` / `runtime/index.ts`; add writing components to
   `mdxComponents` on demand. Do not inject every primitive into MDX.
6. Document the real use case. Do not build screenshot-only kit pieces.

```tsx
import * as stylex from '@stylexjs/stylex'
import { colors, radii, space } from '../design-system/tokens.stylex.ts'
import { typography } from '../design-system/typography.ts'
import type { ElementProps, StyleProps } from '../design-system/props.ts'

const styles = stylex.create({
  base: {
    minHeight: space.eleven,
    paddingInline: space.four,
    paddingBlock: space.two,
    borderRadius: radii.control,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.border,
    color: colors.text,
    backgroundColor: { default: colors.subtle, ':hover': colors.hover },
    outlineColor: colors.focus,
    outlineStyle: 'solid',
    outlineWidth: { default: 0, ':focus-visible': 2 },
    outlineOffset: 2,
    opacity: { default: 1, ':disabled': 0.5 },
    cursor: { default: 'pointer', ':disabled': 'not-allowed' },
  },
})

export function ExampleAction({ xstyle, type = 'button', ...props }: ElementProps<'button'> & StyleProps) {
  return <button {...props} type={type} {...stylex.props(typography.label, styles.base, xstyle)} />
}
```

Action components need an accessible name, keyboard support, and tests for
disabled, forced colors and 320px.

## Modifying a component

- Decide whether the problem belongs to tokens, a type role or the component
  itself. Fix systemic issues at the source; never pile overrides at call sites.
- Token changes require checking every consumer and contrast in both themes.
  Spacing and type changes stay on the existing scales.
- A new variant updates the union, recipes, docs examples and contract tests
  together. Never interpolate color strings at runtime.
- For layout problems, fix grouping and gap ownership first; no negative margins
  or hidden overflow as repairs.
- Public API changes (props, DOM, semantics) must update
  `docs/content/components/*.mdx`, `docs/content/guide/*` and template examples,
  and be called out in the completion report.
- Base UI data states (`data-active`, `data-highlighted`, `data-starting-style`,
  …) are behavior contracts: styling may change, attribute semantics may not.

## Visual and behavior checks

- Geist for text; mono only for code, commands, paths and keys. Type builds the
  hierarchy before surfaces do.
- Monochrome by default, spacing-led grouping, restrained radii. No decorative
  gradients, glows, glass, nested cards or metadata pills.
- Status carries a redundant text or icon cue. Badges never self-announce;
  live regions are a per-flow decision.
- Interactions are keyboard operable with visible focus; icon-only controls get
  names, decorative icons get `aria-hidden`.
- Still by default. Motion respects reduced-motion (the global guard lives in
  `theme.css`).
- At 320px and 200% text zoom nothing clips, overflows or becomes unreachable.
  Cover empty/loading/error states where the component really has them.

## Verification and handoff

```sh
bun run typecheck
bun run lint
bun test
(cd docs && bun ../bin/novon.js build)
bun run test:browser
bun run test:stylex
```

- StyleX is a compile-time API: never import uncompiled components or token
  modules in plain `bun test`. Test pure functions as units and styling behavior
  through the Vite-compiled browser fixture.
- `tests/stylex.browser.mjs` covers variants, `null`, ref, dynamic styles, array
  composition, nested themes, scoped variables, contrast, narrow widths, text
  zoom, forced colors, no-JS, a non-root base and dev/HMR. Extend the fixture
  for new features; grepping for `stylex.create` is not verification.
- After changing packaging, paths or the compiler, also run the installed-CLI
  mode: `NOVON_CLI=/absolute/installed/novon/bin/novon.js bun run test:stylex`.
- Open the touched docs/blog pages in both themes and at narrow widths.
  Automated contracts do not replace font, visual or screen-reader inspection;
  mark anything you did not run as unverified.
- The completion report lists changed files, kept/changed APIs, actual results
  and unverified items. Do not overstate coverage.

## Do not

- Do not reintroduce Tailwind, CVA, clsx or tailwind-merge, and do not add
  `className`/`style` styling props back. They are removed migration-era
  artifacts; `xstyle` is the only styling extension point.
- Do not mix compiled styles with content markers like `novon-not-prose` on one
  element, and do not write `[data-theme]` descendant selectors in components.
- Do not convert global prose/Shiki content CSS into component styles, and keep
  the Preflight-equivalent reset in `theme.css`'s base layer.
- Do not style through generated class names or bypass static compilation with
  cross-file object spreads. Conditions nest inside property values.
- Do not reorder CSS layers (`theme → base → components → novon`), change
  `devMode`/`rootDir`, or remove the pre-bundling trio in `vite-config.ts`:
  `optimizeDeps.exclude: ['novon']` (keeps `novon/runtime/*` compiled),
  `noDiscovery: true` with a complete `include` (prevents dev cold-start
  deadlock), and bundled dependency aliases (sites have no node_modules of
  their own). The guide's build invariants explain each.
- Do not use the unplugin's `externalPackages` (redundant with exclude, missing
  from its types). After a StyleX upgrade, re-read its README and types before
  changing config.
- Do not move the unplugin to devDependencies: the installed novon CLI compiles
  sites too.
- Do not read third-party design specs as permission to change novon branding,
  product copy or existing config semantics.
